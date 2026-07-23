"""
portals/sync.py — Sincronización bidireccional con MercadoLibre.
"""
from __future__ import annotations

import json
import hashlib
import logging
import threading
from typing import Any
import requests
from datetime import datetime, timezone

from extensions import db
from models import Property, Portal, PortalPublication
from portals.mercadolibre import MercadoLibreAdapter, _capture

logger = logging.getLogger(__name__)

API_BASE = 'https://api.mercadolibre.com'

# ── Sync progress (thread-safe dict for polling) ────────────────────
_sync_lock = threading.Lock()
_sync_progress = {
    'running': False, 'phase': '', 'current': 0, 'total': 0,
    'created': 0, 'updated': 0, 'exported': 0, 'errors': [],
}


def _sp(key: str | None = None, value: Any = None, **kwargs: Any) -> None:
    """Actualiza _sync_progress bajo lock."""
    with _sync_lock:
        if key is not None:
            _sync_progress[key] = value
        for k, v in kwargs.items():
            _sync_progress[k] = v


def get_sync_progress() -> dict[str, Any]:
    with _sync_lock:
        return dict(_sync_progress)


def reset_sync_progress() -> None:
    with _sync_lock:
        _sync_progress.update(
            running=False, phase='', current=0, total=0,
            created=0, updated=0, exported=0, errors=[],
        )

CATEGORY_TO_TYPE = {
    'MLA1466': 'casa', 'MLA1472': 'departamento',
    'MLA50547': 'finca', 'MLA1493': 'terreno',
    'MLA79242': 'local', 'MLA50541': 'cochera',
    'MLA50538': 'oficina', 'MLA105179': 'ph',
}


# ── helpers ────────────────────────────────────────────────────────

ML_STATUSES = ['active', 'paused', 'under_review', 'closed']

ML_STATUS_TO_LOCAL = {
    'active':       'disponible',
    'paused':       'oculta',
    'under_review': 'oculta',
    'closed':       'vendida',
}


def _fetch_user_items(adapter, user_id, site_id='MLA'):
    seen = set()
    items = []
    for ml_status in ML_STATUSES:
        offset = 0
        limit = 50
        while True:
            url = f'{API_BASE}/users/{user_id}/items/search'
            params = {'status': ml_status, 'limit': limit, 'offset': offset}
            try:
                resp = adapter._request('GET', url, params=params)
                resp.raise_for_status()
                data = resp.json()
            except requests.exceptions.RequestException as e:
                logger.error('Error fetching ML items (status=%s) at offset %d: %s',
                             ml_status, offset, e)
                break
            batch = data.get('results', [])
            for item_id in batch:
                if item_id not in seen:
                    seen.add(item_id)
                    items.append(item_id)
            total = data.get('paging', {}).get('total', 0)
            offset += limit
            if offset >= total or not batch:
                break
    return items


def _fetch_item_detail(adapter, item_id):
    url = f'{API_BASE}/items/{item_id}'
    try:
        resp = adapter._request('GET', url)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        logger.error('Error fetching ML item %s: %s', item_id, e)
        return None


def _get_attr_value(attributes, attr_id):
    for attr in (attributes or []):
        if attr.get('id') == attr_id:
            return attr.get('value_name')
    return None


def _parse_num(val):
    if val is None:
        return 0
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return 0


def _extract_images(item):
    pictures = item.get('pictures') or item.get('images') or []
    urls = []
    for pic in pictures[:10]:
        url = pic.get('secure_url') or pic.get('url') or ''
        if url:
            urls.append(url)
    return urls


def _ml_item_hash(item):
    """Hash del contenido relevante de un item ML para detectar cambios."""
    raw = {
        'title': item.get('title'),
        'price': item.get('price'),
        'currency_id': item.get('currency_id'),
        'category_id': item.get('category_id'),
        'status': item.get('status'),
        'listing_type_id': item.get('listing_type_id'),
        'description': item.get('description', {}).get('plain_text', ''),
        'pictures': [p.get('id', p.get('url', '')) for p in (item.get('pictures') or [])],
        'attributes': sorted(
            [{'id': a['id'], 'value': a.get('value_name')}
             for a in (item.get('attributes') or [])
             if a.get('id') in ('ROOMS', 'BATHROOMS', 'SQUARE_METER',
                                'SQUARE_TOTAL', 'PARKINGS', 'AGE', 'FLOOR')],
            key=lambda x: x['id']
        ),
    }
    return hashlib.sha256(json.dumps(raw, sort_keys=True).encode()).hexdigest()


def _local_property_hash(prop):
    """Hash del contenido relevante de una Property local para detectar cambios."""
    raw = {
        'title': prop.title,
        'price': prop.price,
        'type': prop.type,
        'location': prop.location,
        'beds': prop.beds,
        'baths': prop.baths,
        'sqm': prop.sqm,
        'sqm_total': prop.sqm_total,
        'parkings': prop.parkings,
        'antiquity': prop.antiquity,
        'floor': prop.floor,
        'orientation': getattr(prop, 'orientation', ''),
        'views': getattr(prop, 'views', 0),
        'floor_level': getattr(prop, 'floor_level', ''),
        'description': prop.description,
        'images': prop.images,
        'status': prop.status,
    }
    return hashlib.sha256(json.dumps(raw, sort_keys=True).encode()).hexdigest()


def _ml_updated_at(item):
    """Extrae el timestamp de última modificación del item ML."""
    raw = item.get('last_updated') or item.get('date_created') or ''
    if raw:
        try:
            if raw.endswith('Z'):
                raw = raw[:-1] + '+00:00'
            return datetime.fromisoformat(raw)
        except (ValueError, TypeError):
            pass
    return None


def _parse_ml_item(item, adapter):
    """Extrae campos tipados de un item de ML."""
    item_id = item.get('id', '')
    attrs = item.get('attributes', [])
    category_id = item.get('category_id', '')
    description = ''
    try:
        desc_resp = adapter._request(
            'GET', f'{API_BASE}/items/{item_id}/description', timeout=10
        )
        if desc_resp.status_code == 200:
            description = (desc_resp.json().get('plain_text') or '')[:5000]
    except Exception:
        pass
    loc = item.get('location', {}) or {}
    place = item.get('place', {}) or {}
    return {
        'item_id': item_id,
        'title': (item.get('title') or 'Sin título')[:200],
        'prop_type': CATEGORY_TO_TYPE.get(category_id, 'otro'),
        'price': float(item.get('price', 0) or 0),
        'location': place.get('name', '') or loc.get('city_id', ''),
        'beds': _parse_num(_get_attr_value(attrs, 'ROOMS')),
        'baths': _parse_num(_get_attr_value(attrs, 'BATHROOMS')),
        'sqm': _parse_num(_get_attr_value(attrs, 'SQUARE_METER')),
        'sqm_total': _parse_num(_get_attr_value(attrs, 'SQUARE_TOTAL')),
        'parkings': _parse_num(_get_attr_value(attrs, 'PARKINGS')),
        'antiquity': _get_attr_value(attrs, 'AGE') or '',
        'floor': _get_attr_value(attrs, 'FLOOR') or '',
        'images': _extract_images(item),
        'description': description,
        'ml_hash': _ml_item_hash(item),
        'ml_ts': _ml_updated_at(item) or datetime.now(timezone.utc).replace(tzinfo=None),
        'ml_status': item.get('status', ''),
        'local_status': ML_STATUS_TO_LOCAL.get(item.get('status', ''), 'disponible'),
        'listing_type': item.get('listing_type_id', ''),
    }


def _make_property_from_ml(fields):
    """Crea un objeto Property con campos parseados de ML."""
    return Property(
        title=fields['title'], type=fields['prop_type'],
        location=fields['location'] or 'Sin ubicación',
        price=fields['price'], beds=fields['beds'], baths=fields['baths'],
        sqm=fields['sqm'], sqm_total=fields['sqm_total'],
        parkings=fields['parkings'], antiquity=fields['antiquity'],
        floor=fields['floor'], description=fields['description'],
        status=fields['local_status'],
    )


def _update_property_from_ml(prop, fields):
    """Actualiza una Property existente con campos parseados de ML."""
    prop.title = fields['title']
    prop.type = fields['prop_type']
    prop.location = fields['location']
    prop.price = fields['price']
    prop.beds = fields['beds']
    prop.baths = fields['baths']
    prop.sqm = fields['sqm']
    prop.sqm_total = fields['sqm_total']
    prop.parkings = fields['parkings']
    prop.antiquity = fields['antiquity']
    prop.floor = fields['floor']
    prop.description = fields['description']
    prop.images = fields['images']
    prop.status = fields['local_status']


def _import_ml_item(item, portal_id, adapter):
    """Importa (crea o actualiza) un item de ML a Bienenhaus."""
    fields = _parse_ml_item(item, adapter)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    existing_pub = PortalPublication.query.filter_by(
        portal_id=portal_id, external_id=fields['item_id'],
    ).first()

    if existing_pub:
        prop = db.session.get(Property, existing_pub.property_id)
        if not prop:
            logger.warning('Publication #%d refiere a property inexistente, creando nueva',
                           existing_pub.id)
            prop = _make_property_from_ml(fields)
            prop.images = fields['images']
            db.session.add(prop)
            db.session.flush()
            existing_pub.property_id = prop.id

        _update_property_from_ml(prop, fields)
        prop.images = fields['images']
        existing_pub.status = 'synced'
        existing_pub.published_at = now
        existing_pub.ml_synced_at = now
        existing_pub.ml_data_hash = fields['ml_hash']
        existing_pub.local_hash = _local_property_hash(prop)
        if fields['listing_type']:
            existing_pub.ml_listing_type = fields['listing_type']
        db.session.commit()
        return 'updated', prop.id

    prop = _make_property_from_ml(fields)
    prop.images = fields['images']
    db.session.add(prop)
    db.session.flush()
    pub = PortalPublication(
        portal_id=portal_id, property_id=prop.id,
        status='synced', external_id=fields['item_id'],
        published_at=now, ml_synced_at=now,
        ml_data_hash=fields['ml_hash'],
        local_hash=_local_property_hash(prop),
        ml_listing_type=fields['listing_type'],
    )
    db.session.add(pub)
    db.session.commit()
    return 'created', prop.id


def _export_to_ml(pub, prop, adapter):
    """Exporta cambios locales a ML (update o cierre)."""
    from .export import _base_property_dict
    data = _base_property_dict(prop)
    data['id'] = prop.id
    if pub.ml_listing_type:
        data['listing_type_id'] = pub.ml_listing_type
    success, err = adapter.update(pub.external_id, data)
    if success:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        pub.ml_synced_at = now
        pub.local_hash = _local_property_hash(prop)
        pub.ml_data_hash = pub.ml_data_hash
        if prop.status == 'vendida':
            pub.status = 'unpublished'
        db.session.commit()
        logger.info('ML sync bidi → exportada property %d a ML (%s)', prop.id, pub.external_id)
        return True, None
    else:
        logger.warning('ML sync bidi → fallo exportando property %d a ML: %s', prop.id, err)
        return False, err


def _resolve_conflict(item, existing_pub, portal, adapter, result, item_id):
    """Resuelve conflicto entre ML y local. Retorna True si ML ganó."""
    ml_hash = _ml_item_hash(item)
    ml_ts = _ml_updated_at(item)
    local_hash = _local_property_hash(
        db.session.get(Property, existing_pub.property_id)
    ) if existing_pub.property_id else ''

    ml_changed = ml_hash != existing_pub.ml_data_hash
    local_changed = local_hash != existing_pub.local_hash

    if ml_changed and not local_changed:
        action, pid = _import_ml_item(item, portal.id, adapter)
        if action == 'updated':
            result['updated'] += 1
        result['detail'].append(f'import #{item_id}: ML cambió → actualizada')
        return False
    if local_changed and not ml_changed:
        result['detail'].append(f'#{item_id}: local cambió → pendiente export')
        return False
    if ml_changed and local_changed:
        if ml_ts and existing_pub.ml_synced_at and ml_ts > existing_pub.ml_synced_at:
            _import_ml_item(item, portal.id, adapter)
            result['conflicts_ml_wins'] += 1
            result['detail'].append(f'import #{item_id}: conflicto, ML más reciente → ML gana')
            return True
        result['detail'].append(f'#{item_id}: conflicto, local más reciente → pendiente export')
        return False
    result['skipped'] += 1
    return False


def _phase_import(adapter, portal, user_id, result):
    """Fase 1: importar items de ML a Bienenhaus. Retorna dict {ml_id: item_data}."""
    _sp(phase='Obteniendo listado de items de ML...')
    item_ids = _fetch_user_items(adapter, user_id)
    result['total_ml'] = len(item_ids)
    _sp(total=len(item_ids), phase='Importando items de ML...')
    logger.info('ML sync bidi: %d items activos encontrados', len(item_ids))

    ml_items = {}
    for idx, item_id in enumerate(item_ids):
        _sp(current=idx + 1)
        try:
            item = _fetch_item_detail(adapter, item_id)
            if not item:
                result['errors'].append(f'No se pudo obtener detalle de {item_id}')
                continue
            ml_items[item_id] = item

            existing_pub = PortalPublication.query.filter_by(
                portal_id=portal.id, external_id=item_id,
            ).first()

            if existing_pub:
                _resolve_conflict(item, existing_pub, portal, adapter, result, item_id)
            else:
                action, pid = _import_ml_item(item, portal.id, adapter)
                result['created'] += 1
                result['detail'].append(f'import #{item_id}: creada nueva property {pid}')

        except Exception as e:
            db.session.rollback()
            err_msg = f'Error procesando {item_id}: {str(e)[:300]}'
            logger.error('%s | portal=%d adapter=%s', err_msg, portal.id, type(adapter).__name__)
            _capture('ML sync import error', extra={
                'item_id': item_id, 'portal_id': portal.id, 'error': str(e)[:500],
            })
            result['errors'].append(err_msg)

    _sp(created=result['created'], updated=result['updated'], errors=result['errors'])
    return ml_items


def _phase_export(adapter, portal, ml_items, result):
    """Fase 2: exportar cambios locales a ML."""
    _sp(phase='Exportando cambios locales a ML...')
    publications = PortalPublication.query.filter_by(
        portal_id=portal.id, status='synced'
    ).all()
    _sp(total=len(publications), current=0)

    for pub_idx, pub in enumerate(publications):
        _sp(current=pub_idx + 1)
        try:
            if not pub.external_id:
                continue
            if pub.external_id not in ml_items:
                pub.status = 'unpublished'
                db.session.commit()
                result['detail'].append(f'#{pub.external_id}: ya no existe en ML → marcado')
                continue

            prop = db.session.get(Property, pub.property_id)
            if not prop:
                continue

            if _local_property_hash(prop) == pub.local_hash:
                continue

            ok, err = _export_to_ml(pub, prop, adapter)
            if ok:
                result['exported'] += 1
            else:
                result['errors'].append(err or f'Error exportando #{pub.external_id}')

        except Exception as e:
            db.session.rollback()
            err_msg = f'Error exportando publication #{pub.id}: {str(e)[:300]}'
            logger.error(err_msg)
            result['errors'].append(err_msg)

    _sp(exported=result['exported'])


def sync_bidirectional(app: Any = None) -> dict[str, Any]:
    """Sincronización bidireccional completa con MercadoLibre.

    Fase 1 — Import: Recorre items activos de ML y los importa a Bienenhaus
    (importación de ML a Bienenhaus con manejo de conflictos).

    Fase 2 — Export: Para propiedades locales publicadas en ML, si el hash
    local cambió y ML no fue modificado más recientemente, exporta cambios a ML.

    Returns:
        dict con created, updated, exported, skipped, errors, detalles
    """
    result: dict[str, Any] = {
        'created': 0, 'updated': 0, 'exported': 0,
        'skipped': 0, 'conflicts_ml_wins': 0,
        'errors': [], 'total_ml': 0, 'portal_id': None, 'detail': [],
    }

    reset_sync_progress()
    _sp('running', True)

    portal = Portal.query.filter_by(slug='mercadolibre', active=True).first()
    if not portal:
        result['errors'].append('Portal MercadoLibre no encontrado o inactivo')
        _sp('running', False, errors=result['errors'])
        return result

    result['portal_id'] = portal.id

    try:
        adapter = MercadoLibreAdapter(portal)
        adapter._api_headers()
    except Exception as e:
        result['errors'].append(
            f'Error al autenticar con ML: {str(e)[:200]}. '
            'Podés reconectar desde Admin → Portales → MercadoLibre.'
        )
        _sp('running', False, errors=result['errors'])
        return result

    user_id = adapter.config.get('user_id', '')
    if not user_id:
        result['errors'].append('user_id no configurado en portal MercadoLibre')
        _sp('running', False, errors=result['errors'])
        return result

    ml_items = _phase_import(adapter, portal, user_id, result)
    _phase_export(adapter, portal, ml_items, result)

    _sp(running=False, phase='Completado')
    return result



