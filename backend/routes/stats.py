"""
routes/stats.py — Estadísticas del dashboard
"""
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from flask import Blueprint, request, jsonify
from sqlalchemy import func, cast, case, Date
from extensions import db
from models import Property, Rental, Agent, ContactMessage, PropertyView, RentalView, Lead
from auth_helper import require_role, ROLE_VIEWER

bp = Blueprint('stats', __name__)

from utils import _ok, _err, _parse_date


_stats_cache = {'data': None, 'ts': 0}


def _is_postgres():
    import os as _os
    url = _os.getenv('DATABASE_URL', '')
    return 'postgresql' in url or 'postgres://' in url


def _month_key(col):
    from sqlalchemy import func as _f
    if _is_postgres():
        return _f.to_char(col, 'YYYY-MM')
    return _f.strftime('%Y-%m', col)


def _avg_days(col, status_col, exclude_status):
    if _is_postgres():
        from sqlalchemy import func as _f, cast, Integer
        avg = db.session.query(
            _f.avg(
                cast(_f.extract('epoch', _f.now() - col) / 86400, Integer)
            )
        ).filter(col != None, status_col != exclude_status).scalar()
        return round(avg) if avg else 0
    today = datetime.now(timezone.utc).replace(tzinfo=None).date()
    records = db.session.query(col).filter(col != None, status_col != exclude_status).all()
    if not records:
        return 0
    total = sum((today - r[0].date()).days for r in records if r[0])
    return round(total / len(records)) if records else 0


def _do_get_stats():
    raw_from = request.args.get('from')
    raw_to   = request.args.get('to')

    now_utc   = datetime.now(timezone.utc).replace(tzinfo=None)
    today     = now_utc.date()

    date_from = _parse_date(raw_from)
    date_to   = _parse_date(raw_to)

    if raw_from and not date_from:
        return _err("'from' debe ser una fecha válida (YYYY-MM-DD).", 422)
    if raw_to and not date_to:
        return _err("'to' debe ser una fecha válida (YYYY-MM-DD).", 422)

    if not raw_from and not raw_to:
        elapsed = time.time() - _stats_cache['ts']
        if _stats_cache['data'] is not None and elapsed < 300:
            return jsonify({'ok': True, 'data': _stats_cache['data']})

    base_q = db.session.query(func.count(Property.id))
    if date_from:
        base_q = base_q.filter(cast(Property.created_at, Date) >= date_from)
    if date_to:
        end_dt = datetime(date_to.year, date_to.month, date_to.day, 23, 59, 59)
        base_q = base_q.filter(cast(Property.created_at, Date) <= end_dt)

    total      = base_q.scalar() or 0
    disponible = base_q.filter(Property.status == 'disponible').scalar() or 0
    vendida    = base_q.filter(Property.status == 'vendida').scalar() or 0
    oculta     = base_q.filter(Property.status == 'oculta').scalar() or 0
    featured   = base_q.filter(Property.featured == True).scalar() or 0

    agg = db.session.query(
        func.sum(Property.views),
        func.avg(Property.price),
        func.count(Property.id).filter(Property.status != 'vendida'),
    ).first()
    total_views = agg[0] or 0
    avg_price   = round(agg[1]) if agg[1] else 0
    non_sold    = agg[2] or 1

    avg_days_market = _avg_days(Property.created_at, Property.status, 'vendida') if total else 0

    price_ranges = {}
    if total:
        ranges = db.session.query(
            func.sum(case((Property.price <= 50000, 1), else_=0)).label('r1'),
            func.sum(case((Property.price.between(50001, 100000), 1), else_=0)).label('r2'),
            func.sum(case((Property.price.between(100001, 200000), 1), else_=0)).label('r3'),
            func.sum(case((Property.price.between(200001, 400000), 1), else_=0)).label('r4'),
            func.sum(case((Property.price > 400000, 1), else_=0)).label('r5'),
        ).first()
        price_ranges = {
            'Hasta 50k':   ranges.r1 or 0,
            '50k\u2013100k':    ranges.r2 or 0,
            '100k\u2013200k':   ranges.r3 or 0,
            '200k\u2013400k':   ranges.r4 or 0,
            'M\u00e1s de 400k': ranges.r5 or 0,
        }

    by_location_rows = db.session.query(
        Property.location, func.count(Property.id)
    ).filter(Property.location != None).group_by(Property.location
    ).order_by(func.count(Property.id).desc()).limit(8).all()
    by_location = dict(by_location_rows)

    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start  = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    msg_q = db.session.query(func.count(ContactMessage.id))
    total_msgs      = msg_q.scalar() or 0
    unread_msgs     = msg_q.filter(ContactMessage.read == False).scalar() or 0
    msgs_this_week  = msg_q.filter(ContactMessage.created_at >= week_start).scalar() or 0
    msgs_this_month = msg_q.filter(ContactMessage.created_at >= month_start).scalar() or 0
    conversion_rate = round(total_msgs / total_views * 100, 2) if total_views else 0

    msg_month_rows = db.session.query(
        _month_key(ContactMessage.created_at).label('m'),
        func.count(ContactMessage.id)
    ).filter(ContactMessage.created_at != None).group_by('m').all()
    msgs_by_month = dict(msg_month_rows)

    agents       = Agent.query.count()
    agent_list   = Agent.query.order_by(Agent.name).all()
    agents_detail = []
    if agent_list:
        cases = [
            func.sum(case(
                (Property.title.ilike(f'%{a.name}%') | Property.description.ilike(f'%{a.name}%'), 1),
                else_=0
            ))
            for a in agent_list
        ]
        counts_row = db.session.query(*cases).first()
        agents_detail = []
        for i, a in enumerate(agent_list):
            agents_detail.append({
                'id': a.id, 'name': f"{a.name} {a.last}",
                'avatar': a.avatar or '',
                'properties': counts_row[i] if counts_row else 0,
                'phone': a.phone,
            })
        agents_detail.sort(key=lambda x: -x['properties'])

    by_type_rows = db.session.query(
        Property.type, func.count(Property.id)
    ).group_by(Property.type).all()
    by_type = dict(by_type_rows)

    last_7_start = today - timedelta(days=6)
    prev_7_start = today - timedelta(days=13)

    top_viewed_props = Property.query.order_by(Property.views.desc()).limit(10).all()
    top_ids = [p.id for p in top_viewed_props]
    if top_ids:
        pv_last7 = db.session.query(
            PropertyView.property_id, func.sum(PropertyView.views)
        ).filter(
            PropertyView.property_id.in_(top_ids),
            PropertyView.date >= last_7_start
        ).group_by(PropertyView.property_id).all()
        pv_prev7 = db.session.query(
            PropertyView.property_id, func.sum(PropertyView.views)
        ).filter(
            PropertyView.property_id.in_(top_ids),
            PropertyView.date >= prev_7_start,
            PropertyView.date < last_7_start
        ).group_by(PropertyView.property_id).all()
        pv_last7_map = dict(pv_last7)
        pv_prev7_map = dict(pv_prev7)
    else:
        pv_last7_map, pv_prev7_map = {}, {}
    pv_lookup = {pid: (pv_last7_map.get(pid, 0), pv_prev7_map.get(pid, 0)) for pid in top_ids}

    top_viewed = [{
        'id': p.id, 'title': p.title, 'views': p.views or 0,
        'image': p.images[0] if p.images else '',
        'status': p.status, 'location': p.location,
        'price': p.price, 'type': p.type,
        'views_last_7': pv_lookup.get(p.id, (0, 0))[0],
        'views_prev_7': pv_lookup.get(p.id, (0, 0))[1],
    } for p in top_viewed_props]

    month_rows = db.session.query(
        _month_key(Property.created_at).label('m'),
        func.count(Property.id)
    ).filter(Property.created_at != None).group_by('m').all()
    by_month = dict(month_rows)

    sales_rows = db.session.query(
        _month_key(Property.created_at).label('m'),
        func.count(Property.id)
    ).filter(Property.created_at != None, Property.status == 'vendida').group_by('m').all()
    monthly_sales = dict(sales_rows)

    views_by_day = {}
    thirty_days_ago = today - timedelta(days=30)
    pv_rows = db.session.query(
        PropertyView.date, func.sum(PropertyView.views)
    ).filter(
        PropertyView.date >= thirty_days_ago
    ).group_by(PropertyView.date).all()
    for i in range(30, -1, -1):
        day = (today - timedelta(days=i)).strftime('%Y-%m-%d')
        views_by_day[day] = 0
    for d, cnt in pv_rows:
        key = d.isoformat() if hasattr(d, 'isoformat') else str(d)
        if key in views_by_day:
            views_by_day[key] = cnt

    r_base_q = db.session.query(func.count(Rental.id))
    r_total      = r_base_q.scalar() or 0
    r_disponible = r_base_q.filter(Rental.status == 'disponible').scalar() or 0
    r_alquilada  = r_base_q.filter(Rental.status == 'alquilada').scalar() or 0
    r_oculta     = r_base_q.filter(Rental.status == 'oculta').scalar() or 0
    r_featured   = r_base_q.filter(Rental.featured == True).scalar() or 0

    r_agg = db.session.query(
        func.avg(Rental.price_ars),
        func.sum(Rental.views),
        func.avg(Rental.expenses),
        func.sum(case((Rental.furnished == True, 1), else_=0)),
        func.count(Rental.id).filter(Rental.status != 'alquilada'),
    ).first()
    r_avg_price       = round(r_agg[0]) if r_agg[0] else 0
    r_total_views     = r_agg[1] or 0
    r_expenses_avg    = round(r_agg[2]) if r_agg[2] else 0
    r_furnished       = r_agg[3] or 0
    r_non_rented      = r_agg[4] or 1

    r_avg_days_market = _avg_days(Rental.created_at, Rental.status, 'alquilada') if r_total else 0

    r_by_type_rows = db.session.query(
        Rental.type, func.count(Rental.id)
    ).group_by(Rental.type).all()
    r_by_type = dict(r_by_type_rows)

    r_by_location_rows = db.session.query(
        Rental.location, func.count(Rental.id)
    ).filter(Rental.location != None).group_by(Rental.location
    ).order_by(func.count(Rental.id).desc()).limit(8).all()
    r_by_location = dict(r_by_location_rows)

    r_top_viewed_rentals = Rental.query.order_by(Rental.views.desc()).limit(10).all()
    r_top_ids = [r.id for r in r_top_viewed_rentals]
    if r_top_ids:
        rv_last7 = db.session.query(
            RentalView.rental_id, func.sum(RentalView.views)
        ).filter(
            RentalView.rental_id.in_(r_top_ids),
            RentalView.date >= last_7_start
        ).group_by(RentalView.rental_id).all()
        rv_prev7 = db.session.query(
            RentalView.rental_id, func.sum(RentalView.views)
        ).filter(
            RentalView.rental_id.in_(r_top_ids),
            RentalView.date >= prev_7_start,
            RentalView.date < last_7_start
        ).group_by(RentalView.rental_id).all()
        rv_last7_map = dict(rv_last7)
        rv_prev7_map = dict(rv_prev7)
    else:
        rv_last7_map, rv_prev7_map = {}, {}
    r_pv_lookup = {rid: (rv_last7_map.get(rid, 0), rv_prev7_map.get(rid, 0)) for rid in r_top_ids}

    r_top_viewed = [{
        'id': r.id, 'title': r.title, 'views': r.views or 0,
        'image': r.images[0] if r.images else '',
        'status': r.status, 'location': r.location,
        'price_ars': r.price_ars, 'type': r.type,
        'views_last_7': r_pv_lookup.get(r.id, (0, 0))[0],
        'views_prev_7': r_pv_lookup.get(r.id, (0, 0))[1],
    } for r in r_top_viewed_rentals]

    r_month_rows = db.session.query(
        _month_key(Rental.created_at).label('m'),
        func.count(Rental.id)
    ).filter(Rental.created_at != None).group_by('m').all()
    r_by_month = dict(r_month_rows)

    r_rented_rows = db.session.query(
        _month_key(Rental.created_at).label('m'),
        func.count(Rental.id)
    ).filter(Rental.created_at != None, Rental.status == 'alquilada').group_by('m').all()
    r_monthly_rented = dict(r_rented_rows)

    r_views_by_day = {}
    rv_rows = db.session.query(
        RentalView.date, func.sum(RentalView.views)
    ).filter(
        RentalView.date >= thirty_days_ago
    ).group_by(RentalView.date).all()
    for i in range(30, -1, -1):
        day = (today - timedelta(days=i)).strftime('%Y-%m-%d')
        r_views_by_day[day] = 0
    for d, cnt in rv_rows:
        key = d.isoformat() if hasattr(d, 'isoformat') else str(d)
        if key in r_views_by_day:
            r_views_by_day[key] = cnt

    avg_views = round(total_views / total, 1) if total else 0

    seven_days_ago = today - timedelta(days=6)
    prev_7_end = seven_days_ago
    prev_7_start_dt = today - timedelta(days=13)

    last_7   = sum(v for d, v in views_by_day.items() if d >= seven_days_ago.isoformat())
    prev_7   = sum(v for d, v in views_by_day.items() if prev_7_start_dt.isoformat() <= d < seven_days_ago.isoformat())

    r_views_vals = list(r_views_by_day.values())
    r_last_7_simple = sum(r_views_vals[-7:]) if len(r_views_vals) >= 7 else 0
    r_prev_7_simple = sum(r_views_vals[-14:-7]) if len(r_views_vals) >= 14 else 0

    trends = {
        'views_week': last_7, 'views_prev_week': prev_7,
        'msgs_week': msgs_this_week,
        'msgs_prev_week': msg_q.filter(ContactMessage.created_at >= prev_7_start_dt, ContactMessage.created_at < seven_days_ago).scalar() or 0,
        'props_total': total, 'rentals_total': r_total,
        'r_views_week': r_last_7_simple, 'r_views_prev_week': r_prev_7_simple,
    }

    result = {
        'total': total, 'disponible': disponible,
        'vendida': vendida, 'oculta': oculta,
        'featured': featured, 'agents': agents,
        'total_views': total_views, 'avg_views': avg_views,
        'avg_price': avg_price, 'avg_days_market': avg_days_market,
        'price_ranges': price_ranges,
        'by_location': by_location,
        'total_msgs': total_msgs, 'unread_msgs': unread_msgs,
        'msgs_this_week': msgs_this_week, 'msgs_this_month': msgs_this_month,
        'conversion_rate': conversion_rate,
        'msgs_by_month': dict(msgs_by_month),
        'agents_detail': agents_detail,
        'by_type': by_type,
        'top_viewed': top_viewed,
        'by_month': dict(by_month),
        'monthly_sales': dict(monthly_sales),
        'views_by_day': views_by_day,
        'rentals_total': r_total, 'rentals_disponible': r_disponible,
        'rentals_alquilada': r_alquilada, 'rentals_oculta': r_oculta,
        'rentals_featured': r_featured, 'rentals_avg_price': r_avg_price,
        'rentals_total_views': r_total_views,
        'rentals_avg_days_market': r_avg_days_market,
        'rentals_by_type': dict(r_by_type),
        'rentals_by_location': r_by_location,
        'rentals_top_viewed': r_top_viewed,
        'rentals_by_month': dict(r_by_month),
        'rentals_monthly_rented': dict(r_monthly_rented),
        'rentals_views_by_day': r_views_by_day,
        'rentals_expenses_avg': r_expenses_avg,
        'rentals_furnished': r_furnished,
        'trends': trends,
        'leads_total': Lead.query.count(),
        'leads_by_status': {s: Lead.query.filter_by(status=s).count() for s in ('nuevo', 'contactado', 'en_seguimiento', 'cerrado', 'perdido')},
        'leads_unassigned': Lead.query.filter(Lead.agent_id.is_(None)).count(),
    }

    if not date_from and not date_to:
        _stats_cache['data'] = result
        _stats_cache['ts'] = time.time()

    return jsonify({'ok': True, 'data': result})


@bp.route('/api/stats', methods=['GET'])
@require_role(ROLE_VIEWER)
def get_stats():
    try:
        return _do_get_stats()
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': str(e)}), 500
