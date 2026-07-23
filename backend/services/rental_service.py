from __future__ import annotations

from typing import Any
from sqlalchemy.orm import load_only
from extensions import db
from models import Rental
from log_activity import log_activity
from utils import _n
from .listing_service import enqueue_to_active_portals, apply_filters, apply_sort, get_similar


FULL_LOAD = (
    Rental.id, Rental.title, Rental.type, Rental.location,
    Rental.price_ars, Rental.expenses,
    Rental.beds, Rental.baths, Rental.sqm,
    Rental.status, Rental.featured,
    Rental.images_json, Rental.min_months, Rental.furnished, Rental.video_url,
    Rental.created_at,
)


class RentalService:

    @classmethod
    def list_dict(cls, r: Rental) -> dict[str, Any]:
        return {
            'id': r.id, 'title': r.title, 'type': r.type,
            'location': r.location, 'price_ars': r.price_ars,
            'expenses': r.expenses,
            'beds': r.beds, 'baths': r.baths, 'sqm': r.sqm,
            'status': r.status, 'featured': r.featured,
            'images': r.images,
            'min_months': r.min_months, 'furnished': r.furnished,
            'created_at': str(r.created_at) if r.created_at else None,
            'video_url': r.video_url,
        }

    @classmethod
    def build_list_query(cls):
        return Rental.query.options(load_only(*FULL_LOAD))

    @classmethod
    def list_rentals(cls, args: dict[str, Any]) -> dict[str, Any]:
        q = cls.build_list_query()

        extra_filters = {}
        furnished = args.get('furnished', '')
        if furnished == 'true':
            extra_filters[Rental.furnished] = True
        elif furnished == 'false':
            extra_filters[Rental.furnished] = False

        q = apply_filters(
            q,
            searchable_fields=(Rental.title, Rental.location),
            type_field=Rental.type,
            price_field=Rental.price_ars,
            status_field=Rental.status,
            beds_field=Rental.beds,
            featured_field=Rental.featured,
            id_field=Rental.id,
            extra_filters=extra_filters or None,
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
            featured_field=Rental.featured,
            id_field=Rental.id,
            price_field=Rental.price_ars,
        )

        page = args.get('page', 1)
        per_page = min(args.get('per_page', 12), 100)
        pag = q.paginate(page=page, per_page=per_page, error_out=False)

        return {
            'rentals': [cls.list_dict(r) for r in pag.items],
            'page':       pag.page,
            'per_page':   pag.per_page,
            'total':      pag.total,
            'pages':      pag.pages,
            'has_prev':   pag.has_prev,
            'has_next':   pag.has_next,
        }

    @classmethod
    def get_by_id(cls, rid: int) -> Rental | None:
        return db.session.get(Rental, rid)

    @classmethod
    def get_by_id_or_404(cls, rid: int) -> Rental:
        rental = cls.get_by_id(rid)
        if not rental:
            from flask import abort
            abort(404)
        return rental

    @classmethod
    def create(cls, data: dict[str, Any]) -> Rental:
        if not data.get('title'):
            raise ValueError('El título es obligatorio.')
        rental = Rental.from_dict(data)
        db.session.add(rental)
        db.session.commit()
        log_activity('created', 'rental', rental.id, rental.title)
        return rental

    @classmethod
    def update(cls, rid: int, data: dict[str, Any]) -> Rental:
        rental = cls.get_by_id_or_404(rid)
        rental.update_from_dict(data)
        db.session.commit()
        log_activity('updated', 'rental', rental.id, rental.title)
        enqueue_to_active_portals(rid, entity_type='rental', action='update')
        return rental

    @classmethod
    def change_status(cls, rid: int, status: str) -> Rental:
        if status not in ('disponible', 'alquilada', 'oculta', 'listo_para_publicar'):
            raise ValueError('Estado inválido. Use: disponible, alquilada, oculta, listo_para_publicar.')
        rental = cls.get_by_id_or_404(rid)
        rental.status = status
        db.session.commit()
        log_activity('updated', 'rental', rental.id, f'status → {status}')
        if status == 'disponible':
            action = 'publish'
        elif status == 'listo_para_publicar':
            action = None
        else:
            action = 'unpublish'
        if action:
            enqueue_to_active_portals(rid, entity_type='rental', action=action)
        return rental

    @classmethod
    def delete(cls, rid: int) -> None:
        rental = cls.get_by_id_or_404(rid)
        log_activity('deleted', 'rental', rental.id, rental.title)
        enqueue_to_active_portals(rid, entity_type='rental', action='unpublish')
        db.session.delete(rental)
        db.session.commit()

    @classmethod
    def get_similar(cls, rid: int, limit: int = 6) -> list[Rental]:
        cls.get_by_id_or_404(rid)
        return get_similar(
            Rental, rid,
            location_field=Rental.location,
            status_field=Rental.status,
            id_field=Rental.id,
            featured_field=Rental.featured,
            status_visible=('disponible', 'alquilada'),
            limit=limit,
        )
