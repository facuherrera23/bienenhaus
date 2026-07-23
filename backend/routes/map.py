"""
routes/map.py — Endpoint de datos para mapa interactivo con geocoding
"""
import json
import time
import urllib.request
import urllib.parse
from typing import Any
from flask import Blueprint, jsonify
from extensions import db
from models import Property, Rental

bp = Blueprint('map', __name__)

_geo_cache: dict[str, dict[str, Any]] = {}
_GEO_TTL = 86400  # 24h


def _geocode(location):
    """Geocodifica usando Nominatim con cache en memoria."""
    if not location or not location.strip():
        return None, None
    key = location.strip().lower()
    cached = _geo_cache.get(key)
    if cached and (time.time() - cached['ts']) < _GEO_TTL:
        return cached['lat'], cached['lng']

    try:
        q = urllib.parse.quote(f"{location}, Córdoba, Argentina")
        url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Bienenhaus/1.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode())
        if data:
            lat = float(data[0]['lat'])
            lng = float(data[0]['lon'])
            _geo_cache[key] = {'lat': lat, 'lng': lng, 'ts': time.time()}
            return lat, lng
    except Exception:
        pass
    return None, None


@bp.route('/api/map/data', methods=['GET'])
def map_data():
    visible_statuses = ('disponible', 'vendida', 'alquilada')
    props = Property.query.filter(
        Property.status.in_(visible_statuses),
        Property.latitude.isnot(None),
        Property.longitude.isnot(None),
    ).all()

    rentals = Rental.query.filter(
        Rental.status.in_(visible_statuses),
        Rental.latitude.isnot(None),
        Rental.longitude.isnot(None),
    ).all()

    # Geocode missing coords
    for p in Property.query.filter(
        Property.status.in_(visible_statuses),
        Property.latitude.is_(None),
    ).all():
        lat, lng = _geocode(p.location)
        if lat and lng:
            p.latitude = lat
            p.longitude = lng
            props.append(p)
    for r in Rental.query.filter(
        Rental.status.in_(visible_statuses),
        Rental.latitude.is_(None),
    ).all():
        lat, lng = _geocode(r.location)
        if lat and lng:
            r.latitude = lat
            r.longitude = lng
            rentals.append(r)

    db.session.commit()

    def _item(obj, kind, price_key):
        img = obj.images[0] if obj.images else ''
        return {
            'id': obj.id, 'title': obj.title, 'type': obj.type,
            'location': obj.location, 'price': getattr(obj, price_key, 0),
            'image': img, 'status': obj.status, 'kind': kind,
            'beds': obj.beds, 'baths': obj.baths, 'sqm': obj.sqm,
            'lat': obj.latitude, 'lng': obj.longitude,
        }

    return jsonify({'ok': True, 'data': {
        'properties': [_item(p, 'venta', 'price') for p in props],
        'rentals': [_item(r, 'alquiler', 'price_ars') for r in rentals],
    }})
