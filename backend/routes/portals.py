"""
routes/portals.py — API de portales inmobiliarios
"""
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload
from flask import Blueprint, request, jsonify
from extensions import db, limiter
from models import Portal, PortalPublication, PortalLog, PortalQueue, Property, Rental
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR
from portals.export import export_property_json, export_property_xml, export_rental_json
from portals.queue import QueueService
from portals import ADAPTER_REGISTRY, sync_bidirectional
from portals.mercadolibre import get_ml_redirect_uri, build_ml_auth_url
from utils import _ok, _err
import requests as _requests

bp = Blueprint('portals', __name__, url_prefix='/api/portals')


# ── CRUD de portales ────────────────────────────────────────────────
@bp.route('', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_portals():
    portals = Portal.query.order_by(Portal.id).all()
    return _ok([p.to_dict() for p in portals])


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_portal():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    slug = data.get('slug', '').strip().lower().replace(' ', '_')
    if not name or not slug:
        return _err('Nombre y slug son obligatorios.')
    if Portal.query.filter_by(slug=slug).first():
        return _err('Ya existe un portal con ese slug.')

    portal = Portal(
        name=name, slug=slug,
        active=bool(data.get('active', False)),
    )
    if data.get('config'):
        portal.config = data['config']
    db.session.add(portal)
    db.session.commit()

    AdapterClass = ADAPTER_REGISTRY.get(portal.slug, None)
    if AdapterClass:
        try:
            adapter = AdapterClass(portal)
            adapter._log('create', 'info', f'Portal {name} creado con {AdapterClass.__name__}')
        except Exception as e:
            pass

    return _ok(portal.to_dict(), 201)


@bp.route('/<int:pid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_portal(pid):
    portal = Portal.query.get_or_404(pid)
    data = request.get_json(silent=True) or {}

    if 'name' in data:
        portal.name = data['name'].strip()
    if 'slug' in data:
        new_slug = data['slug'].strip().lower().replace(' ', '_')
        existing = Portal.query.filter_by(slug=new_slug).first()
        if existing and existing.id != pid:
            return _err('Ya existe un portal con ese slug.')
        portal.slug = new_slug
    if 'active' in data:
        portal.active = bool(data['active'])
    if 'config' in data:
        portal.config = data['config']

    db.session.commit()
    return _ok(portal.to_dict())


@bp.route('/<int:pid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_portal(pid):
    portal = Portal.query.get_or_404(pid)
    PortalPublication.query.filter_by(portal_id=pid).delete()
    PortalLog.query.filter_by(portal_id=pid).delete()
    PortalQueue.query.filter_by(portal_id=pid).delete()
    db.session.delete(portal)
    db.session.commit()
    return _ok({'deleted': pid})


# ── Publicaciones ───────────────────────────────────────────────────
@bp.route('/publications', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_publications():
    portal_id = request.args.get('portal_id', type=int)
    property_id = request.args.get('property_id', type=int)
    status = request.args.get('status')
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(max(request.args.get('per_page', 50, type=int), 1), 200)

    q = PortalPublication.query.options(
        joinedload(PortalPublication.portal),
        joinedload(PortalPublication.property),
        joinedload(PortalPublication.rental),
    )
    if portal_id:
        q = q.filter_by(portal_id=portal_id)
    if property_id:
        q = q.filter_by(property_id=property_id)
    if status:
        q = q.filter_by(status=status)

    total = q.count()
    pubs = q.order_by(PortalPublication.created_at.desc())\
             .offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in pubs:
        d = p.to_dict()
        d['portal_name'] = p.portal.name if p.portal else '?'
        d['portal_slug'] = p.portal.slug if p.portal else '?'
        if p.property:
            d['property_title'] = p.property.title
        if p.rental:
            d['rental_title'] = p.rental.title
        result.append(d)
    return _ok({
        'items': result,
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
    })


# ── Export ──────────────────────────────────────────────────────────
@bp.route('/export/<int:property_id>', methods=['GET'])
@require_role(ROLE_EDITOR)
def export_property(property_id):
    fmt = request.args.get('format', 'json')
    prop = Property.query.get_or_404(property_id)
    if fmt == 'xml':
        return export_property_xml(prop), 200, {'Content-Type': 'application/xml'}
    return export_property_json(prop), 200, {'Content-Type': 'application/json'}


@bp.route('/export/rental/<int:rental_id>', methods=['GET'])
@require_role(ROLE_EDITOR)
def export_rental(rental_id):
    fmt = request.args.get('format', 'json')
    rental = Rental.query.get_or_404(rental_id)
    if fmt == 'xml':
        from portals.export import export_rental_xml
        return export_rental_xml(rental), 200, {'Content-Type': 'application/xml'}
    return export_rental_json(rental), 200, {'Content-Type': 'application/json'}


# ── Cola ────────────────────────────────────────────────────────────
@bp.route('/queue', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_queue():
    processed = request.args.get('processed', '').lower() == 'true'
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(max(request.args.get('per_page', 50, type=int), 1), 200)

    q = PortalQueue.query.filter_by(processed=processed)
    total = q.count()
    items = q.order_by(PortalQueue.priority.desc(),
                       PortalQueue.created_at.asc())\
             .offset((page - 1) * per_page).limit(per_page).all()
    return _ok({
        'items': [i.to_dict() for i in items],
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
    })


@bp.route('/queue', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def enqueue():
    data = request.get_json(silent=True) or {}
    action = data.get('action', 'publish')
    property_id = data.get('property_id')
    rental_id = data.get('rental_id')
    portal_id = data.get('portal_id')

    if not property_id and not rental_id:
        return _err('Se requiere property_id o rental_id.')
    if action not in QueueService.ACTIONS:
        return _err(f'Acción inválida. Use: {", ".join(QueueService.ACTIONS)}')

    item = QueueService.enqueue(action, property_id=property_id,
                                rental_id=rental_id, portal_id=portal_id)
    return _ok(item.to_dict(), 201)


@bp.route('/queue/count', methods=['GET'])
@require_role(ROLE_EDITOR)
def queue_count():
    return _ok({'pending': QueueService.pending_count()})

@bp.route('/queue/stats', methods=['GET'])
@require_role(ROLE_ADMIN)
def queue_stats():
    return _ok({
        'pending':   QueueService.pending_count(),
        'processing': QueueService.processing_count(),
        'failed':    QueueService.failed_count(),
        'stuck':     QueueService.stuck_count(),
        'dlq':       QueueService.failed_count(),
    })

@bp.route('/queue/retry-all', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def retry_all_dlq():
    from models import PortalQueue
    items = PortalQueue.query.filter(
        PortalQueue.status == 'failed',
        PortalQueue.retry_count >= 5,
    ).all()
    count = 0
    for item in items:
        QueueService.retry(item.id)
        count += 1
    return _ok({'retried': count})

@bp.route('/queue/<int:item_id>/retry', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def retry_queue_item(item_id):
    item = QueueService.retry(item_id)
    if not item:
        return _err('Ítem no encontrado o no se puede reintentar.', 404)
    return _ok(item.to_dict())


# ── Logs ────────────────────────────────────────────────────────────
@bp.route('/logs', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_logs():
    portal_id = request.args.get('portal_id', type=int)
    level = request.args.get('level')
    action = request.args.get('action')
    search = request.args.get('q', '').strip()
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(max(request.args.get('per_page', 100, type=int), 1), 500)

    q = PortalLog.query
    if portal_id:
        q = q.filter_by(portal_id=portal_id)
    if level:
        q = q.filter_by(level=level)
    if action:
        q = q.filter_by(action=action)
    if search:
        q = q.filter(PortalLog.message.ilike(f'%{search}%'))
    total = q.count()
    logs = q.order_by(PortalLog.created_at.desc())\
            .offset((page - 1) * per_page).limit(per_page).all()
    return _ok({
        'items': [l.to_dict() for l in logs],
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
    })


# ── Sync desde MercadoLibre ─────────────────────────────────────────
# ── Dashboard / Health ──────────────────────────────────────────────

@bp.route('/dashboard', methods=['GET'])
@require_role(ROLE_EDITOR)
def portal_dashboard():
    """Estado en tiempo real de todos los portales."""
    from sqlalchemy import func, or_
    portals = Portal.query.all()
    portal_ids = [p.id for p in portals]
    if not portal_ids:
        return _ok([])

    last_sync_q = db.session.query(
        PortalLog.portal_id,
        func.max(PortalLog.created_at).label('max_created')
    ).filter(
        PortalLog.portal_id.in_(portal_ids),
        PortalLog.action.in_(['sync', 'publish', 'update'])
    ).group_by(PortalLog.portal_id).subquery()
    last_syncs = {
        r.portal_id: r
        for r in PortalLog.query.join(last_sync_q, db.and_(
            PortalLog.portal_id == last_sync_q.c.portal_id,
            PortalLog.created_at == last_sync_q.c.max_created,
        )).all()
    }

    pub_counts = dict(db.session.query(
        PortalPublication.portal_id,
        PortalPublication.status,
        func.count(PortalPublication.id)
    ).filter(PortalPublication.portal_id.in_(portal_ids))
     .group_by(PortalPublication.portal_id, PortalPublication.status).all())

    queue_counts = dict(db.session.query(
        PortalQueue.portal_id,
        PortalQueue.status,
        func.count(PortalQueue.id)
    ).filter(PortalQueue.portal_id.in_(portal_ids))
     .group_by(PortalQueue.portal_id, PortalQueue.status).all())

    result = []
    for p in portals:
        last_sync = last_syncs.get(p.id)
        pubs_total = pub_counts.get((p.id, 'published'), 0) + pub_counts.get((p.id, 'error'), 0) + pub_counts.get((p.id, 'pending'), 0) + pub_counts.get((p.id, 'synced'), 0) + pub_counts.get((p.id, 'paused'), 0)
        pubs_published = pub_counts.get((p.id, 'published'), 0)
        pubs_errors = pub_counts.get((p.id, 'error'), 0)
        queue_pending = queue_counts.get((p.id, 'pending'), 0)
        queue_failed = sum(v for k, v in queue_counts.items() if k[0] == p.id and k[1] == 'failed')

        health = 'ok'
        if not p.active:
            health = 'inactive'
        elif queue_failed > 0 or pubs_errors > 0:
            health = 'warning'
        elif last_sync and getattr(last_sync, 'level', None) == 'error':
            health = 'error'

        result.append({
            'id': p.id,
            'name': p.name,
            'slug': p.slug,
            'active': p.active,
            'health': health,
            'publications_total': pubs_total,
            'publications_published': pubs_published,
            'publications_errors': pubs_errors,
            'queue_pending': queue_pending,
            'queue_failed': queue_failed,
            'last_sync': last_sync.to_dict() if last_sync else None,
            'last_sync_at': str(last_sync.created_at) if last_sync else None,
        })
    return _ok(result)


# ── Bulk operations ─────────────────────────────────────────────────

@bp.route('/bulk/publish', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def bulk_publish():
    """Publica múltiples propiedades en uno o varios portales."""
    data = request.get_json(silent=True) or {}
    property_ids = data.get('property_ids', [])
    rental_ids = data.get('rental_ids', [])
    portal_ids = data.get('portal_ids', [])

    if not property_ids and not rental_ids:
        return _err('Se requiere al menos un property_id o rental_id')
    if not portal_ids:
        return _err('Se requiere al menos un portal_id')

    enqueued = 0
    errors = []
    for pid in property_ids:
        for portal_id in portal_ids:
            try:
                QueueService.enqueue('publish', property_id=pid, portal_id=portal_id)
                enqueued += 1
            except Exception as e:
                errors.append(str(e))
    for rid in rental_ids:
        for portal_id in portal_ids:
            try:
                QueueService.enqueue('publish', rental_id=rid, portal_id=portal_id)
                enqueued += 1
            except Exception as e:
                errors.append(str(e))

    return _ok({'enqueued': enqueued, 'errors': errors, 'total': enqueued + len(errors)})


@bp.route('/bulk/unpublish', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def bulk_unpublish():
    """Despublica múltiples propiedades de uno o varios portales."""
    data = request.get_json(silent=True) or {}
    property_ids = data.get('property_ids', [])
    rental_ids = data.get('rental_ids', [])
    portal_ids = data.get('portal_ids', [])

    if not property_ids and not rental_ids:
        return _err('Se requiere al menos un property_id o rental_id')
    if not portal_ids:
        return _err('Se requiere al menos un portal_id')

    enqueued = 0
    errors = []
    for pid in property_ids:
        for portal_id in portal_ids:
            try:
                QueueService.enqueue('unpublish', property_id=pid, portal_id=portal_id)
                enqueued += 1
            except Exception as e:
                errors.append(str(e))
    for rid in rental_ids:
        for portal_id in portal_ids:
            try:
                QueueService.enqueue('unpublish', rental_id=rid, portal_id=portal_id)
                enqueued += 1
            except Exception as e:
                errors.append(str(e))

    return _ok({'enqueued': enqueued, 'errors': errors, 'total': enqueued + len(errors)})


@bp.route('/bulk/retry', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def bulk_retry():
    """Reintenta todos los items fallidos en cola."""
    count = QueueService.retry_all_failed()
    return _ok({'retried': count})


@bp.route('/ml/sync', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def trigger_ml_sync_bidi():
    """Dispara sincronización bidireccional con MercadoLibre."""
    result = sync_bidirectional()
    status_code = 200 if not result['errors'] else 207
    return _ok({
        'created': result['created'],
        'updated': result['updated'],
        'exported': result['exported'],
        'skipped': result['skipped'],
        'conflicts_ml_wins': result['conflicts_ml_wins'],
        'total_ml': result['total_ml'],
        'detail': result['detail'][:20],
        'errors': result['errors'][:10],
    }), status_code


@bp.route('/ml/sync/progress', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_ml_sync_progress():
    """Devuelve el progreso actual de la sincronización ML."""
    from portals.sync import get_sync_progress
    return _ok(get_sync_progress())


# ── Management Center — Dashboard KPIs ──────────────────────────────

@bp.route('/kpi', methods=['GET'])
@require_role(ROLE_EDITOR)
def portal_kpis():
    """8 KPIs para el dashboard de Portales."""
    from sqlalchemy import func
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    status_counts = dict(db.session.query(
        PortalPublication.status, func.count(PortalPublication.id)
    ).group_by(PortalPublication.status).all())
    synced = PortalPublication.query.filter(
        PortalPublication.ml_synced_at.isnot(None)
    ).count()
    updated_today = PortalPublication.query.filter(
        PortalPublication.updated_at >= today_start
    ).count()
    portals_connected = Portal.query.filter_by(active=True).count()

    return _ok({
        'published': status_counts.get('published', 0),
        'pending': status_counts.get('pending', 0),
        'errors': status_counts.get('error', 0),
        'synced': synced,
        'updated_today': updated_today,
        'portals_connected': portals_connected,
        'active': status_counts.get('published', 0) + status_counts.get('synced', 0),
        'paused': status_counts.get('paused', 0),
    })


# ── Management Center — Enhanced Publications List ──────────────────

@bp.route('/publications/enhanced', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_publications_enhanced():
    """Lista completa de publicaciones con datos de propiedad/rental y agente."""
    portal_id = request.args.get('portal_id', type=int)
    status = request.args.get('status')
    search = request.args.get('q', '').strip()
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(max(request.args.get('per_page', 50, type=int), 1), 200)

    q = PortalPublication.query.options(
        joinedload(PortalPublication.portal),
        joinedload(PortalPublication.property),
        joinedload(PortalPublication.rental),
        joinedload(PortalPublication.assigned_agent),
    )
    if portal_id:
        q = q.filter_by(portal_id=portal_id)
    if status:
        if status == 'active':
            q = q.filter(PortalPublication.status.in_(['published', 'synced']))
        elif status == 'paused':
            q = q.filter_by(status='paused')
        elif status == 'error':
            q = q.filter_by(status='error')
        elif status == 'pending':
            q = q.filter_by(status='pending')
        elif status == 'archived':
            q = q.filter(PortalPublication.archived_at.isnot(None))
    if search:
        q = q.join(Property, PortalPublication.property_id == Property.id, isouter=True)\
             .join(Rental, PortalPublication.rental_id == Rental.id, isouter=True)\
             .filter(
                 db.or_(
                     Property.title.ilike(f'%{search}%'),
                     Property.location.ilike(f'%{search}%'),
                     Rental.title.ilike(f'%{search}%'),
                 )
             )

    total = q.count()
    pubs = q.order_by(PortalPublication.updated_at.desc())\
             .offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in pubs:
        d = p.to_dict()
        d['portal_name'] = p.portal.name if p.portal else '?'
        d['portal_slug'] = p.portal.slug if p.portal else '?'
        if p.property:
            d['property_title'] = p.property.title
            d['property_address'] = p.property.location
            d['property_images'] = p.property.images
            d['property_status'] = p.property.status
            d['operation'] = 'venta'
        if p.rental:
            d['rental_title'] = p.rental.title
            d['property_address'] = p.rental.location
            d['property_images'] = p.rental.images
            d['property_status'] = p.rental.status
            d['operation'] = 'alquiler'
        if p.assigned_agent:
            d['assigned_agent_name'] = f"{p.assigned_agent.name} {p.assigned_agent.last}"
        result.append(d)

    return _ok({
        'items': result,
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
    })


# ── Management Center — Single Publication Detail ───────────────────

@bp.route('/publications/<int:pub_id>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_publication_detail(pub_id):
    """Detalle de una publicación con datos completos."""
    p = PortalPublication.query.options(
        joinedload(PortalPublication.portal),
        joinedload(PortalPublication.property),
        joinedload(PortalPublication.rental),
        joinedload(PortalPublication.assigned_agent),
    ).get_or_404(pub_id)

    d = p.to_dict()
    d['portal_name'] = p.portal.name if p.portal else '?'
    d['portal_slug'] = p.portal.slug if p.portal else '?'
    d['portal_active'] = p.portal.active if p.portal else False
    if p.property:
        d['property_title'] = p.property.title
        d['property_address'] = p.property.location
        d['property_price'] = p.property.price
        d['property_images'] = p.property.images
        d['property_status'] = p.property.status
        d['property_beds'] = p.property.beds
        d['property_baths'] = p.property.baths
        d['property_sqm'] = p.property.sqm
        d['property_type'] = p.property.type
        d['operation'] = 'venta'
    if p.rental:
        d['rental_title'] = p.rental.title
        d['property_address'] = p.rental.location
        d['property_price'] = p.rental.price_ars
        d['property_images'] = p.rental.images
        d['property_status'] = p.rental.status
        d['property_beds'] = p.rental.beds
        d['property_baths'] = p.rental.baths
        d['property_sqm'] = p.rental.sqm
        d['property_type'] = p.rental.type
        d['operation'] = 'alquiler'
    if p.assigned_agent:
        d['assigned_agent_name'] = f"{p.assigned_agent.name} {p.assigned_agent.last}"

    # Últimos logs de sincronización
    logs = PortalLog.query.filter_by(
        portal_id=p.portal_id, property_id=p.property_id
    ).order_by(PortalLog.created_at.desc()).limit(20).all()
    d['sync_history'] = [l.to_dict() for l in logs]

    return _ok(d)


# ── Management Center — Quick Actions ───────────────────────────────

@bp.route('/publications/<int:pub_id>/action', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def publication_action(pub_id):
    """Acciones rápidas: publish, pause, resume, retry, archive, unarchive, delete."""
    data = request.get_json(silent=True) or {}
    action = data.get('action', '').strip()

    p = PortalPublication.query.get_or_404(pub_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if action == 'publish':
        p.status = 'published'
        p.published_at = now
        p.last_error = ''
        p.attempts = 0
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='publish', level='info',
                                 message='Publicación activada manualmente'))
    elif action == 'pause':
        p.status = 'paused'
        p.paused_at = now
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='pause', level='info',
                                 message='Publicación pausada'))
    elif action == 'resume':
        p.status = 'published'
        p.paused_at = None
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='resume', level='info',
                                 message='Publicación reanudada'))
    elif action == 'retry':
        p.status = 'pending'
        p.last_error = ''
        p.attempts = 0
        QueueService.enqueue('publish', property_id=p.property_id,
                             rental_id=p.rental_id, portal_id=p.portal_id)
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='retry', level='info',
                                 message='Reintento de publicación encolado'))
    elif action == 'archive':
        p.archived_at = now
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='archive', level='info',
                                 message='Publicación archivada'))
    elif action == 'unarchive':
        p.archived_at = None
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='unarchive', level='info',
                                 message='Publicación restaurada'))
    elif action == 'delete':
        db.session.add(PortalLog(portal_id=p.portal_id, property_id=p.property_id,
                                 action='delete', level='info',
                                 message='Publicación eliminada'))
        db.session.delete(p)
        db.session.commit()
        return _ok({'deleted': pub_id})
    else:
        return _err(f'Acción inválida: {action}')

    db.session.commit()
    return _ok(p.to_dict())


# ── Management Center — Agents for Assignment ───────────────────────

@bp.route('/agents', methods=['GET'])
@require_role(ROLE_EDITOR)
def portal_agents():
    """Lista de agentes disponibles para asignar a publicaciones."""
    from models.agent import Agent
    agents = Agent.query.order_by(Agent.name).all()
    return _ok([{'id': a.id, 'name': f"{a.name} {a.last}"} for a in agents])


# ── Management Center — Platforms ───────────────────────────────────

@bp.route('/platforms', methods=['GET'])
@require_role(ROLE_EDITOR)
def portal_platforms():
    """Lista de plataformas soportadas con estado."""
    from sqlalchemy import func
    portals = Portal.query.order_by(Portal.name).all()
    portal_ids = [p.id for p in portals]
    pub_counts = dict(db.session.query(
        PortalPublication.portal_id, func.count(PortalPublication.id)
    ).filter(PortalPublication.portal_id.in_(portal_ids))
     .group_by(PortalPublication.portal_id).all()) if portal_ids else {}
    return _ok([{
        'id': p.id,
        'name': p.name,
        'slug': p.slug,
        'active': p.active,
        'publications_count': pub_counts.get(p.id, 0),
        'has_config': bool(p.config and p.config.get('api_key') or p.config.get('access_token')),
    } for p in portals])


# ── Feed público ───────────────────────────────────────────────────
@bp.route('/feed/zonaprop', methods=['GET'])
@limiter.limit("30 per minute")
def serve_zonaprop_feed():
    """Sirve el feed XML de ZonaProp (accesible públicamente)."""
    import os as _os
    feed_path = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                '..', 'static', 'feeds', 'zonaprop_feed.xml')
    if _os.path.exists(feed_path):
        with open(feed_path, 'r', encoding='utf-8') as f:
            return f.read(), 200, {
                'Content-Type': 'application/xml',
                'Cache-Control': 'max-age=300, public',
            }
    return '<lista></lista>', 200, {'Content-Type': 'application/xml'}


# ── MercadoLibre OAuth ─────────────────────────────────────────────
@bp.route('/ml/auth-url', methods=['GET'])
@require_role(ROLE_ADMIN)
def ml_auth_url():
    """Devuelve la URL de autorización de MercadoLibre para iniciar OAuth."""
    portal = Portal.query.filter_by(slug='mercadolibre').first()
    if not portal:
        return _err('Portal MercadoLibre no encontrado.')
    cfg = portal.config
    client_id = cfg.get('client_id', '')
    if not client_id:
        return _err('Configurá client_id en el portal primero.')
    return _ok({'auth_url': build_ml_auth_url(client_id)})


@bp.route('/ml/callback', methods=['GET'])
def ml_oauth_callback():
    """Callback OAuth de MercadoLibre — canjea authorization_code por tokens."""
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return _err(f'Error de autorización ML: {error}')
    if not code:
        return _err('Falta parámetro code')

    portal = Portal.query.filter_by(slug='mercadolibre').first()
    if not portal:
        return _err('Portal MercadoLibre no encontrado. Crealo desde /admin primero.')

    cfg = portal.config
    client_id = cfg.get('client_id', '')
    client_secret = cfg.get('client_secret', '')
    if not client_id or not client_secret:
        return _err(
            'Configurá client_id y client_secret en el portal primero. '
            'Andá a /admin → Portales → MercadoLibre.'
        )

    redirect_uri = get_ml_redirect_uri()

    try:
        resp = _requests.post('https://api.mercadolibre.com/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
        }, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        new_cfg = dict(cfg)
        new_cfg['access_token'] = data['access_token']
        new_cfg['refresh_token'] = data['refresh_token']
        if 'user_id' in data and not new_cfg.get('user_id'):
            new_cfg['user_id'] = data['user_id']
        portal.config = new_cfg
        db.session.commit()

        return _ok({
            'msg': 'MercadoLibre vinculado correctamente. Podés cerrar esta ventana.',
            'user_id': data.get('user_id', ''),
        })
    except _requests.exceptions.RequestException as e:
        return _err(f'Error de conexión con ML: {str(e)[:500]}')
    except Exception as e:
        return _err(f'Error al canjear code: {str(e)[:500]}')
