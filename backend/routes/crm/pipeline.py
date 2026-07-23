from datetime import timedelta
from flask import request
from extensions import db
from models import Lead, LeadPropertyInterest, LeadActivity, Property, Task, Visit, Reminder
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok
from .helpers import _parse_dt, _now, LEAD_STATUSES, LEAD_ORIGINS
from . import bp


@bp.route('/api/crm/pipeline', methods=['GET'])
@require_role(ROLE_EDITOR)
def pipeline():
    from sqlalchemy import func
    agent_id = request.args.get('agent_id', type=int)
    query = Lead.query
    if agent_id:
        query = query.filter(Lead.agent_id == agent_id)
    all_leads = list(query.order_by(Lead.pipeline_order.asc(), Lead.updated_at.desc()).all())

    lead_ids = [l.id for l in all_leads]
    props_batch = []
    prop_titles = {}
    if lead_ids:
        props_batch = db.session.query(LeadPropertyInterest).filter(
            LeadPropertyInterest.lead_id.in_(lead_ids)
        ).all()
        prop_ids = [p.property_id for p in props_batch if p.property_id]
        if prop_ids:
            for p in db.session.query(Property).filter(Property.id.in_(prop_ids)).all():
                prop_titles[p.id] = p.title
    props_by_lead = {}
    for p in props_batch:
        props_by_lead.setdefault(p.lead_id, []).append({
            'id': p.id, 'lead_id': p.lead_id, 'property_id': p.property_id,
            'property_title': prop_titles.get(p.property_id),
            'interest_type': p.interest_type, 'notes': p.notes,
            'created_at': str(p.created_at) if p.created_at else None,
        })

    grouped = {}
    for l in all_leads:
        grouped.setdefault(l.status, []).append(l)
    columns = []
    for status in LEAD_STATUSES:
        leads = grouped.get(status, [])
        total_value = sum(l.estimated_value or 0 for l in leads)
        columns.append({
            'status': status,
            'count': len(leads),
            'total_value': total_value,
            'leads': [{
                'id': l.id, 'name': l.name, 'email': l.email, 'phone': l.phone,
                'whatsapp': l.whatsapp, 'preferred_contact_method': l.preferred_contact_method,
                'origin': l.origin, 'source_detail': l.source_detail,
                'status': l.status, 'pipeline_order': l.pipeline_order,
                'agent_id': l.agent_id,
                'agent_name': l.agent.name + ' ' + l.agent.last if l.agent else None,
                'notes': l.notes, 'interactions': l.interactions_list,
                'estimated_value': l.estimated_value,
                'conversion_probability': l.conversion_probability,
                'auto_conversion_probability': l.auto_conversion_probability,
                'lead_score': l.lead_score, 'loss_reason': l.loss_reason,
                'budget_min': l.budget_min, 'budget_max': l.budget_max,
                'utm_source': l.utm_source, 'utm_medium': l.utm_medium,
                'utm_campaign': l.utm_campaign,
                'last_contacted_at': str(l.last_contacted_at) if l.last_contacted_at else None,
                'next_followup_at': str(l.next_followup_at) if l.next_followup_at else None,
                'source_url': l.source_url,
                'properties': props_by_lead.get(l.id, []),
                'created_at': str(l.created_at) if l.created_at else None,
                'updated_at': str(l.updated_at) if l.updated_at else None,
            } for l in leads],
        })
    return _ok({'columns': columns})


@bp.route('/api/crm/funnel', methods=['GET'])
@require_role(ROLE_EDITOR)
def funnel():
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    base_query = LeadActivity.query.filter(
        LeadActivity.activity_type == 'status_change',
        LeadActivity.from_status.isnot(None),
        LeadActivity.to_status.isnot(None),
    )
    if date_from:
        base_query = base_query.filter(LeadActivity.created_at >= _parse_dt(date_from))
    if date_to:
        base_query = base_query.filter(LeadActivity.created_at <= _parse_dt(date_to))

    stages = []
    for i, status in enumerate(LEAD_STATUSES):
        if i == 0:
            count = Lead.query.filter_by(status=status).count()
            stages.append({'status': status, 'count': count, 'conversion_rate': None})
            continue
        entered = base_query.filter(LeadActivity.to_status == status).count()
        prev = base_query.filter(
            LeadActivity.to_status == LEAD_STATUSES[i - 1]
        ).count()
        rate = round((entered / prev * 100) if prev > 0 else 0, 1)
        stages.append({'status': status, 'count': entered, 'conversion_rate': rate})
    return _ok({'stages': stages})


@bp.route('/api/crm/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def stats():
    total = Lead.query.count()
    status_counts = dict(db.session.query(Lead.status, db.func.count(Lead.id)).group_by(Lead.status).all())
    by_status = {s: status_counts.get(s, 0) for s in LEAD_STATUSES}
    origin_counts = dict(db.session.query(Lead.origin, db.func.count(Lead.id)).group_by(Lead.origin).all())
    by_origin = {o: origin_counts.get(o, 0) for o in LEAD_ORIGINS}
    unassigned = Lead.query.filter(Lead.agent_id.is_(None)).count()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)
    week_ago = now - timedelta(days=7)

    return _ok({
        'total': total,
        'by_status': by_status,
        'by_origin': by_origin,
        'unassigned': unassigned,
        'pipeline_value': db.session.query(db.func.sum(Lead.estimated_value))
                           .filter(Lead.status.notin_(['cerrado_ganado', 'cerrado_perdido']))
                           .scalar() or 0,
        'new_this_week': Lead.query.filter(Lead.created_at >= week_ago).count(),
        'visits_today': Visit.query.filter(
            Visit.scheduled_at.between(today_start, tomorrow_start),
            Visit.status.in_(['pendiente', 'confirmada']),
        ).count(),
        'overdue_tasks': Task.query.filter(
            Task.status.in_(['pendiente', 'en_progreso']),
            Task.due_at < now,
        ).count(),
        'pending_reminders': Reminder.query.filter(
            Reminder.notified == False,  # noqa: E712
            Reminder.reminder_at <= now,
        ).count(),
    })
