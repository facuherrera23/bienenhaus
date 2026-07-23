"""
routes/views.py — Tracking de visitas a propiedades y alquileres
"""
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from extensions import db
from models import Property, PropertyView, Rental, RentalView

bp = Blueprint('views', __name__)


@bp.route('/api/properties/<int:pid>/view', methods=['POST'])
def track_view(pid):
    prop = db.session.get(Property, pid)
    if prop:
        prop.views = (prop.views or 0) + 1
        today = datetime.now(timezone.utc).replace(tzinfo=None)
        today_date = today.date()
        pv = PropertyView.query.filter_by(
            property_id=pid, date=today_date
        ).first()
        if pv:
            pv.views += 1
        else:
            pv = PropertyView(property_id=pid, date=today_date, views=1)
            db.session.add(pv)
        today_key = today_date.isoformat()
        dv = prop.daily_views
        dv[today_key] = dv.get(today_key, 0) + 1
        prop.daily_views = dv
        db.session.commit()
    return jsonify({'ok': True})


@bp.route('/api/rentals/<int:rid>/view', methods=['POST'])
def track_rental_view(rid):
    rental = db.session.get(Rental, rid)
    if rental:
        rental.views = (rental.views or 0) + 1
        today = datetime.now(timezone.utc).replace(tzinfo=None)
        today_date = today.date()
        rv = RentalView.query.filter_by(
            rental_id=rid, date=today_date
        ).first()
        if rv:
            rv.views += 1
        else:
            rv = RentalView(rental_id=rid, date=today_date, views=1)
            db.session.add(rv)
        today_key = today_date.isoformat()
        dv = rental.daily_views
        dv[today_key] = dv.get(today_key, 0) + 1
        rental.daily_views = dv
        db.session.commit()
    return jsonify({'ok': True})
