from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import Rental
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from services import RentalService
from utils import _ok, _err

bp = Blueprint('rentals', __name__, url_prefix='/api/rentals')


@bp.route('', methods=['GET'])
def list_rentals():
    args = {
        'search': request.args.get('search', '').strip(),
        'ptype': request.args.get('type', 'all'),
        'price_min': request.args.get('priceMin', type=float),
        'price_max': request.args.get('priceMax', type=float),
        'beds': request.args.get('beds', 'all'),
        'status': request.args.get('status', 'all'),
        'admin': request.args.get('admin', 'false').lower() == 'true',
        'sort_by': request.args.get('sort', 'default'),
        'page': request.args.get('page', 1, type=int),
        'per_page': request.args.get('per_page', 12, type=int),
        'furnished': request.args.get('furnished', ''),
    }
    return _ok(RentalService.list_rentals(args))


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_rental():
    data = request.get_json(silent=True) or {}
    try:
        rental = RentalService.create(data)
        return _ok(rental.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:rid>', methods=['GET'])
def get_rental(rid):
    rental = RentalService.get_by_id_or_404(rid)
    return _ok(rental.to_dict())


@bp.route('/<int:rid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_rental(rid):
    data = request.get_json(silent=True) or {}
    rental = RentalService.update(rid, data)
    return _ok(rental.to_dict())


@bp.route('/<int:rid>/status', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def change_status(rid):
    body = request.get_json(silent=True) or {}
    status = body.get('status')
    try:
        rental = RentalService.change_status(rid, status)
        return _ok(rental.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:rid>/print', methods=['GET'])
def print_rental(rid):
    from flask import render_template
    from models import Settings
    rental = RentalService.get_by_id_or_404(rid)
    s = Settings.all_dict()
    status_map = {'disponible': 'Disponible', 'alquilada': 'Alquilada', 'oculta': 'Oculta'}
    return render_template('property_print.html',
        title=rental.title, site_name=s.get('seo_site_name', 'Bienenhaus'),
        status=rental.status, status_label=status_map.get(rental.status, rental.status),
        location=rental.location,
        price_html=f"ARS {int(rental.price_ars):,}".replace(',','.'),
        price_label='Por mes',
        images=rental.images or [],
        beds=rental.beds or 0, baths=rental.baths or 0, sqm=rental.sqm or 0,
        type_label=rental.type.capitalize() if rental.type else '',
        description=rental.description or '',
        phone=s.get('phone', ''), email=s.get('email', ''),
        address=s.get('address', ''), year=2026,
        is_rental=True,
        expenses=f"ARS {int(rental.expenses):,}".replace(',','.') if rental.expenses else '',
        min_months=rental.min_months or 0, furnished=rental.furnished or False,
    )


@bp.route('/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_rental(rid):
    RentalService.delete(rid)
    return _ok({'deleted': rid})


@bp.route('/<int:rid>/similares', methods=['GET'])
def get_similar_rentals(rid):
    limit = request.args.get('limit', 6, type=int)
    similar = RentalService.get_similar(rid, limit)
    return _ok([r.to_dict() for r in similar])
