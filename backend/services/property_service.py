from __future__ import annotations

from typing import Any
from sqlalchemy.orm import load_only
from extensions import db
from models import Property
from log_activity import log_activity
from utils import _n
from .listing_service import enqueue_to_active_portals, apply_filters, apply_sort, get_similar


FULL_LOAD = (
    Property.id, Property.title, Property.type,
    Property.location, Property.price,
    Property.beds, Property.baths, Property.sqm,
    Property.status, Property.featured,
    Property.images_json, Property.video_url, Property.created_at,
)


class PropertyService:

    @classmethod
    def list_dict(cls, p: Property) -> dict[str, Any]:
        return {
            'id': p.id, 'title': p.title, 'type': p.type,
            'location': p.location, 'price': p.price,
            'beds': p.beds, 'baths': p.baths, 'sqm': p.sqm,
            'status': p.status, 'featured': p.featured,
            'images': p.images, 'created_at': str(p.created_at) if p.created_at else None,
            'video_url': p.video_url,
        }

    @classmethod
    def build_list_query(cls):
        return Property.query.options(load_only(*FULL_LOAD))

    @classmethod
    def list_properties(cls, args: dict[str, Any]) -> dict[str, Any]:
        q = cls.build_list_query()

        q = apply_filters(
            q,
            searchable_fields=(Property.title, Property.location),
            type_field=Property.type,
            price_field=Property.price,
            status_field=Property.status,
            beds_field=Property.beds,
            featured_field=Property.featured,
            id_field=Property.id,
            search=args.get('search', ''),
            ptype=args.get('ptype', 'all'),
            price_min=args.get('price_min'),
            price_max=args.get('price_max'),
            beds=args.get('beds', 'all'),
            status=args.get('status', 'all'),
            admin=args.get('admin', False),
        )
        q = apply_sort(
            q, args.get('sort_by', 'default'),
            featured_field=Property.featured,
            id_field=Property.id,
            price_field=Property.price,
        )

        page = args.get('page', 1)
        per_page = min(args.get('per_page', 12), 100)
        pag = q.paginate(page=page, per_page=per_page, error_out=False)
        disp_q = Property.query.filter(Property.status == 'disponible')

        return {
            'properties': [cls.list_dict(p) for p in pag.items],
            'page':       pag.page,
            'per_page':   pag.per_page,
            'total':      pag.total,
            'pages':      pag.pages,
            'has_prev':   pag.has_prev,
            'has_next':   pag.has_next,
            'available_total': disp_q.count(),
        }

    @classmethod
    def list_public(cls, page: int = 1, per_page: int = 50) -> dict[str, Any]:
        per_page = min(per_page, 200)
        q = Property.query.options(load_only(*FULL_LOAD)).filter(
            ~Property.status.in_(('oculta', 'listo_para_publicar'))
        ).order_by(Property.featured.desc(), Property.id.desc())

        pag = q.paginate(page=page, per_page=per_page, error_out=False)

        def _dict(p: Property) -> dict[str, Any]:
            return {
                'id': p.id, 'title': p.title, 'type': p.type,
                'location': p.location, 'price': p.price,
                'beds': p.beds, 'baths': p.baths, 'sqm': p.sqm,
                'status': p.status, 'featured': p.featured,
                'images': p.images, 'created_at': str(p.created_at) if p.created_at else None,
            }

        return {
            'properties': [_dict(p) for p in pag.items],
            'page':       pag.page,
            'per_page':   pag.per_page,
            'total':      pag.total,
            'pages':      pag.pages,
            'has_prev':   pag.has_prev,
            'has_next':   pag.has_next,
        }

    @classmethod
    def get_by_id(cls, pid: int) -> Property | None:
        return db.session.get(Property, pid)

    @classmethod
    def get_by_id_or_404(cls, pid: int) -> Property:
        prop = cls.get_by_id(pid)
        if not prop:
            from flask import abort
            abort(404)
        return prop

    @classmethod
    def create(cls, data: dict[str, Any]) -> Property:
        if not data.get('title'):
            raise ValueError('El título es obligatorio.')
        prop = Property.from_dict(data)
        db.session.add(prop)
        db.session.commit()
        log_activity('created', 'property', prop.id, prop.title)
        return prop

    @classmethod
    def update(cls, pid: int, data: dict[str, Any]) -> Property:
        prop = cls.get_by_id_or_404(pid)
        prop.update_from_dict(data)
        db.session.commit()
        log_activity('updated', 'property', prop.id, prop.title)
        enqueue_to_active_portals(pid, entity_type='property', action='update')
        return prop

    @classmethod
    def change_status(cls, pid: int, status: str) -> Property:
        if status not in ('disponible', 'vendida', 'oculta', 'listo_para_publicar'):
            raise ValueError('Estado inválido. Use: disponible, vendida, oculta, listo_para_publicar.')
        prop = cls.get_by_id_or_404(pid)
        prop.status = status
        db.session.commit()
        log_activity('updated', 'property', prop.id, f'status → {status}')
        if status == 'disponible':
            action = 'publish'
        elif status == 'listo_para_publicar':
            action = None
        else:
            action = 'unpublish'
        if action:
            enqueue_to_active_portals(pid, entity_type='property', action=action)
        return prop

    @classmethod
    def delete(cls, pid: int) -> None:
        prop = cls.get_by_id_or_404(pid)
        log_activity('deleted', 'property', prop.id, prop.title)
        enqueue_to_active_portals(pid, entity_type='property', action='unpublish')
        db.session.delete(prop)
        db.session.commit()

    @classmethod
    def get_similar(cls, pid: int, limit: int = 6) -> list[Property]:
        prop = cls.get_by_id_or_404(pid)
        return get_similar(
            Property, pid,
            location_field=Property.location,
            status_field=Property.status,
            id_field=Property.id,
            featured_field=Property.featured,
            type_field=Property.type,
            type_value=prop.type,
            status_visible=('disponible', 'vendida'),
            limit=limit,
        )
