from __future__ import annotations

from typing import Any, Callable, TypeVar
from flask import current_app
from extensions import db
from models import Portal
from portals.queue import QueueService

T = TypeVar('T')


def enqueue_to_active_portals(
    entity_id: int,
    *,
    entity_type: str,
    action: str = 'publish',
) -> None:
    portals = Portal.query.filter_by(active=True).all()
    for portal in portals:
        try:
            kwargs = {f'{entity_type}_id': entity_id}
            QueueService.enqueue(action, portal_id=portal.id, **kwargs)
        except Exception as e:
            current_app.logger.error(
                'enqueue failed: portal=%s (%d) action=%s %s=%d: %s',
                portal.name, portal.id, action, entity_type, entity_id, e,
            )
            try:
                from webhook_service import notify_publish_error
                entity = db.session.get(
                    __import__('models', fromlist=[entity_type.capitalize()]).__dict__[entity_type.capitalize()],
                    entity_id,
                )
                title = getattr(entity, 'title', None) or f'ID {entity_id}'
                notify_publish_error(
                    entity_type, entity_id, title,
                    action, portal.name, str(e),
                )
            except Exception:
                pass


def apply_filters(
    query: Any,
    *,
    searchable_fields: tuple[Any, ...],
    type_field: Any,
    price_field: Any,
    status_field: Any,
    beds_field: Any,
    featured_field: Any,
    id_field: Any,
    search: str = '',
    ptype: str = 'all',
    price_min: float | None = None,
    price_max: float | None = None,
    beds: str = 'all',
    status: str = 'all',
    admin: bool = False,
    extra_filters: dict[str, Any] | None = None,
) -> Any:
    from sqlalchemy import or_

    if not admin:
        query = query.filter(~status_field.in_(('oculta', 'listo_para_publicar')))

    if search:
        like = f'%{search}%'
        query = query.filter(
            or_(
                field.ilike(like) for field in searchable_fields
            )
        )
    if ptype != 'all':
        query = query.filter(type_field == ptype)
    if price_min is not None:
        query = query.filter(price_field >= price_min)
    if price_max is not None:
        query = query.filter(price_field <= price_max)
    if beds != 'all':
        beds_int = int(beds)
        if beds_int >= 4:
            query = query.filter(beds_field >= 4)
        else:
            query = query.filter(beds_field == beds_int)
    if status != 'all':
        query = query.filter(status_field == status)
    if extra_filters:
        for field, value in extra_filters.items():
            query = query.filter(field == value)

    return query


def apply_sort(
    query: Any,
    sort_by: str,
    *,
    featured_field: Any,
    id_field: Any,
    price_field: Any,
    sort_map_extra: dict[str, list[Any]] | None = None,
) -> Any:
    sort_map: dict[str, list[Any]] = {
        'default':    [featured_field.desc(), id_field.desc()],
        'price_asc':  [price_field.asc()],
        'price_desc': [price_field.desc()],
        'newest':     [id_field.desc()],
        'oldest':     [id_field.asc()],
    }
    if sort_map_extra:
        sort_map.update(sort_map_extra)

    for expr in sort_map.get(sort_by, sort_map['default']):
        query = query.order_by(expr)
    return query


def get_similar(
    model_class: type[T],
    entity_id: int,
    *,
    location_field: Any,
    status_field: Any,
    id_field: Any,
    featured_field: Any,
    type_field: Any | None = None,
    type_value: str | None = None,
    status_visible: tuple[str, ...],
    limit: int = 6,
) -> list[T]:
    from sqlalchemy import or_

    entity = db.session.get(model_class, entity_id)
    if not entity:
        return []

    location = (getattr(entity, location_field.key) or '').strip()

    similar = model_class.query.filter(
        id_field != entity_id,
        status_field.in_(status_visible),
    )
    if location:
        similar = similar.filter(
            or_(
                location_field.ilike(f'%{location}%'),
                model_class.title.ilike(f'%{location}%'),
            )
        )
    similar = similar.order_by(
        featured_field.desc(),
        id_field.desc()
    ).limit(limit).all()

    if len(similar) < 4 and location:
        already = {getattr(s, id_field.key) for s in similar}
        already.add(entity_id)
        extras = model_class.query.filter(
            id_field.notin_(already),
            status_field == status_visible[0],
        )
        if type_field is not None and type_value is not None:
            extras = extras.filter(type_field == type_value)
        extras = extras.order_by(
            featured_field.desc(),
            id_field.desc()
        ).limit(limit - len(similar)).all()
        similar.extend(extras)

    return similar
