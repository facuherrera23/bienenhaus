from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import Property
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR, ROLE_ADMIN
from services import PropertyService
from utils import _ok, _err

bp = Blueprint('properties', __name__, url_prefix='/api/properties')


@bp.route('', methods=['GET'])
def list_properties():
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
    }
    return _ok(PropertyService.list_properties(args))


@bp.route('/public', methods=['GET'])
def list_public_properties():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    return _ok(PropertyService.list_public(page, per_page))


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_property():
    data = request.get_json(silent=True) or {}
    try:
        prop = PropertyService.create(data)
        return _ok(prop.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:pid>', methods=['GET'])
def get_property(pid):
    prop = PropertyService.get_by_id_or_404(pid)
    return _ok(prop.to_dict())


@bp.route('/<int:pid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_property(pid):
    data = request.get_json(silent=True) or {}
    prop = PropertyService.update(pid, data)
    return _ok(prop.to_dict())


@bp.route('/<int:pid>/status', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def change_status(pid):
    body = request.get_json(silent=True) or {}
    status = body.get('status')
    try:
        prop = PropertyService.change_status(pid, status)
        return _ok(prop.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:pid>/print', methods=['GET'])
def print_property(pid):
    from flask import render_template
    from models import Settings
    prop = PropertyService.get_by_id_or_404(pid)
    s = Settings.all_dict()
    status_map = {'disponible': 'Disponible', 'vendida': 'Vendida', 'oculta': 'Oculta'}
    return render_template('property_print.html',
        title=prop.title, site_name=s.get('seo_site_name', 'Bienenhaus'),
        status=prop.status, status_label=status_map.get(prop.status, prop.status),
        location=prop.location,
        price_html=f"USD {int(prop.price):,}".replace(',','.'),
        price_label='Precio de lista' if prop.status == 'disponible' else 'Precio de venta',
        images=prop.images or [],
        beds=prop.beds or 0, baths=prop.baths or 0, sqm=prop.sqm or 0,
        type_label=prop.type.capitalize() if prop.type else '',
        description=prop.description or '',
        phone=s.get('phone', ''), email=s.get('email', ''),
        address=s.get('address', ''), year=2026,
        is_rental=False, expenses='', min_months=0, furnished=False,
    )


@bp.route('/<int:pid>/similares', methods=['GET'])
def get_similar(pid):
    limit = request.args.get('limit', 6, type=int)
    similar = PropertyService.get_similar(pid, limit)
    return _ok([p.to_dict() for p in similar])


@bp.route('/<int:pid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_property(pid):
    PropertyService.delete(pid)
    return _ok({'deleted': pid})



