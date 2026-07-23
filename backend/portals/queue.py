"""
portals/queue.py — Cola de procesamiento para publicaciones en portales.
"""
from __future__ import annotations

import logging
from typing import Any
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from extensions import db
from models import PortalQueue, Portal, Property, Rental, PortalPublication

try:
    import sentry_sdk
    _has_sentry = True
except ImportError:
    _has_sentry = False

logger = logging.getLogger(__name__)


def _capture(level, msg, extra=None):
    if _has_sentry:
        with sentry_sdk.new_scope() as scope:
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            if level == 'error':
                sentry_sdk.capture_message(msg, level='error')
            elif level == 'warning':
                sentry_sdk.capture_message(msg, level='warning')


_MAX_RETRIES = 5
_RETRY_BACKOFF_MINUTES = [0, 2, 5, 15, 30, 60]


class QueueService:
    """Servicio de cola para operaciones con portales."""

    ACTIONS = ('publish', 'update', 'unpublish')

    @classmethod
    def _backend_is_postgresql(cls):
        bind = db.session.bind
        return bind is not None and bind.dialect.name == 'postgresql'

    @classmethod
    def enqueue(cls, action, property_id=None, rental_id=None,
                portal_id=None, priority=0):
        if action not in cls.ACTIONS:
            raise ValueError(f'Acción inválida: {action}. Use: {cls.ACTIONS}')

        if portal_id is not None:
            portal = db.session.get(Portal, portal_id)
            if not portal or not portal.active:
                raise ValueError(f'Portal {portal_id} no encontrado o inactivo')

        item = PortalQueue(
            portal_id=portal_id,
            property_id=property_id,
            rental_id=rental_id,
            action=action,
            priority=priority,
            status='pending',
        )
        db.session.add(item)
        db.session.commit()
        return item

    @classmethod
    def enqueue_property(cls, property_id, action='publish',
                         portal_id=None, priority=0):
        return cls.enqueue(action, property_id=property_id,
                           portal_id=portal_id, priority=priority)

    @classmethod
    def enqueue_rental(cls, rental_id, action='publish',
                       portal_id=None, priority=0):
        return cls.enqueue(action, rental_id=rental_id,
                           portal_id=portal_id, priority=priority)

    @classmethod
    def dequeue(cls, limit=1):
        """Obtiene items pendientes con protección de concurrencia.

        PostgreSQL: SELECT FOR UPDATE SKIP LOCKED para evitar que dos
        workers procesen el mismo item.

        SQLite: UPDATE status='processing' con subquery, fallback
        seguro para tests monoproceso.
        """
        if cls._backend_is_postgresql():
            items = PortalQueue.query \
                .filter(PortalQueue.status == 'pending') \
                .order_by(PortalQueue.priority.desc(),
                          PortalQueue.created_at.asc()) \
                .limit(limit) \
                .with_for_update(skip_locked=True) \
                .all()
        else:
            items = PortalQueue.query \
                .filter(PortalQueue.status == 'pending') \
                .order_by(PortalQueue.priority.desc(),
                          PortalQueue.created_at.asc()) \
                .limit(limit) \
                .all()

        if not items:
            return []

        ids = [item.id for item in items]
        PortalQueue.query \
            .filter(PortalQueue.id.in_(ids)) \
            .update(
                {PortalQueue.status: 'processing'},
                synchronize_session='fetch'
            )
        db.session.commit()

        for item in items:
            item.status = 'processing'

        return items

    @classmethod
    def dequeue_retry(cls, limit=5):
        """Obtiene items fallidos cuyo next_retry_at ya pasó."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        items = PortalQueue.query \
            .filter(
                PortalQueue.status == 'failed',
                PortalQueue.retry_count < _MAX_RETRIES,
                db.or_(
                    PortalQueue.next_retry_at.is_(None),
                    PortalQueue.next_retry_at <= now,
                ),
            ) \
            .order_by(PortalQueue.next_retry_at.asc().nullsfirst(),
                      PortalQueue.priority.desc()) \
            .limit(limit) \
            .all()

        if not items:
            return []

        for item in items:
            item.status = 'pending'
            item.next_retry_at = None
        db.session.commit()
        return items

    @classmethod
    def mark_processed(cls, item_id, error=''):
        item = db.session.get(PortalQueue, item_id)
        if not item:
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        if error:
            item.retry_count = (item.retry_count or 0) + 1
            item.last_error_at = now
            item.error = error

            if item.retry_count < _MAX_RETRIES:
                backoff = _RETRY_BACKOFF_MINUTES[
                    min(item.retry_count, len(_RETRY_BACKOFF_MINUTES) - 1)
                ]
                item.next_retry_at = now + timedelta(minutes=backoff)
                item.status = 'failed'
                logger.info(
                    'Item %d falló (intento %d/%d), próximo reintento en %d min: %s',
                    item_id, item.retry_count, _MAX_RETRIES, backoff, error
                )
            else:
                item.status = 'failed'
                item.next_retry_at = None
                logger.warning(
                    'Item %d agotó reintentos (%d), movido a DLQ: %s',
                    item_id, _MAX_RETRIES, error
                )
                _capture('error', 'Portal queue item agotó reintentos', extra={
                    'item_id': item_id, 'action': item.action,
                    'portal_id': item.portal_id,
                    'property_id': item.property_id,
                    'error': error, 'retry_count': item.retry_count,
                })
        else:
            item.processed = True
            item.status = 'completed'
            item.retry_count = 0
            item.last_error_at = None
            item.next_retry_at = None
            item.error = ''

        db.session.commit()

    @classmethod
    def pending_count(cls):
        return PortalQueue.query.filter_by(status='pending').count()

    @classmethod
    def processing_count(cls):
        return PortalQueue.query.filter_by(status='processing').count()

    @classmethod
    def failed_count(cls):
        return PortalQueue.query.filter(
            PortalQueue.status == 'failed',
            PortalQueue.retry_count >= _MAX_RETRIES,
        ).count()

    @classmethod
    def stuck_count(cls):
        """Items en 'processing' por más de 5 minutos (probablemente huérfanos)."""
        threshold = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
        return PortalQueue.query.filter(
            PortalQueue.status == 'processing',
            PortalQueue.created_at < threshold,
        ).count()

    @classmethod
    def recover_stuck(cls, limit=10):
        """Recupera items stuck en 'processing' por más de 5 minutos y los
        vuelve a 'pending' para que puedan ser reprocesados."""
        threshold = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
        items = PortalQueue.query.filter(
            PortalQueue.status == 'processing',
            PortalQueue.created_at < threshold,
        ).order_by(PortalQueue.created_at.asc()).limit(limit).all()

        if not items:
            return 0

        for item in items:
            item.status = 'pending'
            item.error = (item.error or '') + ' | Stuck recovery — reset a pending'
            logger.warning(
                'Stuck recovery: item %d (action=%s, portal=%s, created=%s)',
                item.id, item.action, item.portal_id, item.created_at,
            )
        db.session.commit()
        return len(items)

    @classmethod
    def retry(cls, item_id):
        item = db.session.get(PortalQueue, item_id)
        if not item:
            return None
        if item.status not in ('completed', 'failed'):
            return None
        item.status = 'pending'
        item.processed = False
        item.error = ''
        item.retry_count = 0
        item.last_error_at = None
        item.next_retry_at = None
        db.session.commit()
        return item

    @classmethod
    def get_available_portals(cls):
        return Portal.query.filter_by(active=True).all()

    @classmethod
    def _handle_queue_item(cls, item, portal_map):
        """Procesa un item individual de la cola. Retorna error_msg o ''."""
        if not item.portal_id:
            return ''

        portal = db.session.get(Portal, item.portal_id)
        if not portal or not portal_map or portal.slug not in portal_map:
            return 'No hay adapter disponible'

        adapter = portal_map[portal.slug]
        prop = db.session.get(Property, item.property_id) if item.property_id else None
        rental = db.session.get(Rental, item.rental_id) if item.rental_id else None

        if item.action == 'publish':
            from .export import _base_property_dict, _base_rental_dict
            data = _base_property_dict(prop) if prop else (_base_rental_dict(rental) if rental else None)
            if not data:
                return ''
            success, ext_id, err = adapter.publish(data)
            if success:
                adapter._update_publication(item.property_id, item.rental_id, 'published', external_id=ext_id)
                adapter._log(item.action, 'info', f'Publicado (id={ext_id})', property_id=item.property_id)
            else:
                adapter._update_publication(item.property_id, item.rental_id, 'error', error=err)
                adapter._log(item.action, 'error', err, property_id=item.property_id)
            return err if not success else ''

        if item.action == 'update':
            pub = PortalPublication.query.filter_by(
                portal_id=item.portal_id, property_id=item.property_id, rental_id=item.rental_id,
            ).first()
            if not pub or not pub.external_id:
                return ''
            from .export import _base_property_dict, _base_rental_dict
            data = _base_property_dict(prop) if prop else (_base_rental_dict(rental) if rental else None)
            if not data:
                return 'No hay datos para actualizar'
            success, err = adapter.update(pub.external_id, data)
            if success:
                adapter._log(item.action, 'info', 'Actualizado correctamente', property_id=item.property_id)
            else:
                adapter._log(item.action, 'error', err, property_id=item.property_id)
            return err if not success else ''

        if item.action == 'unpublish':
            pub = PortalPublication.query.filter_by(
                portal_id=item.portal_id, property_id=item.property_id, rental_id=item.rental_id,
            ).first()
            if not pub or not pub.external_id:
                return ''
            success, err = adapter.unpublish(pub.external_id)
            if success:
                adapter._update_publication(item.property_id, item.rental_id, 'unpublished')
                adapter._log(item.action, 'info', 'Despublicado correctamente', property_id=item.property_id)
            else:
                adapter._log(item.action, 'error', err, property_id=item.property_id)
            return err if not success else ''

        return f'Acción desconocida: {item.action}'

    @classmethod
    def _sync_zonaprop_after_batch(cls, portal_map):
        """Si hay adapter ZonaProp activo, sincroniza el feed."""
        from .zonaprop import ZonaPropAdapter
        for slug, adapter in (portal_map or {}).items():
            if isinstance(adapter, ZonaPropAdapter):
                try:
                    adapter.sync_if_dirty()
                except Exception as e:
                    logger.error('Error sync ZonaProp feed: %s', e)
                    _capture('error', 'ZonaProp feed sync failed', extra={
                        'error': str(e)[:500],
                    })

    @classmethod
    def process_next_batch(cls, portal_map=None, limit=5):
        """Procesa el próximo lote de items con protección de concurrencia.

        portal_map: dict {portal_slug: PortalBase subclass instance}
        Retorna (processed: int, errors: list).
        """
        cls.recover_stuck(limit=limit)
        items = cls.dequeue(limit=limit)
        processed = 0
        errors = []

        for item in items:
            try:
                error = cls._handle_queue_item(item, portal_map)
                cls.mark_processed(item.id, error=error)
                processed += 1
                if error:
                    errors.append(error)
            except Exception as e:
                cls.mark_processed(item.id, error=str(e))
                errors.append(str(e))
                processed += 1

        if processed > 0:
            cls._sync_zonaprop_after_batch(portal_map)

        return processed, errors

    @classmethod
    def retry_failed_items(cls, limit=10):
        """Reintenta items fallidos cuyo tiempo de backoff ya pasó."""
        items = cls.dequeue_retry(limit=limit)
        if not items:
            return 0
        logger.info('Reintentando %d items fallidos', len(items))
        return len(items)

    @classmethod
    def retry_all_failed(cls):
        """Reintenta todos los items fallidos (sin límite de backoff)."""
        items = PortalQueue.query.filter(
            PortalQueue.status == 'failed',
        ).all()
        count = 0
        for item in items:
            try:
                cls.retry(item.id)
                count += 1
            except Exception:
                continue
        logger.info('Reintentando todos los fallidos: %d items', count)
        return count
