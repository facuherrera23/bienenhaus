from datetime import timedelta
from flask import request
from extensions import db
from models import Visit, Lead, LeadActivity
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from .helpers import _create_activity, _parse_dt, _now, VISIT_STATUSES
from . import bp


@bp.route('/api/crm/visits', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_visits():
    lead_id = request.args.get('lead_id', type=int)
    agent_id = request.args.get('agent_id', type=int)
    status_filter = request.args.get('status', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = Visit.query.order_by(Visit.scheduled_at.asc())
    if lead_id:
        query = query.filter(Visit.lead_id == lead_id)
    if agent_id:
        query = query.filter(Visit.agent_id == agent_id)
    if status_filter in VISIT_STATUSES:
        query = query.filter(Visit.status == status_filter)
    if date_from:
        query = query.filter(Visit.scheduled_at >= _parse_dt(date_from))
    if date_to:
        query = query.filter(Visit.scheduled_at <= _parse_dt(date_to))

    visits = query.all()
    return _ok({'visits': [v.to_dict() for v in visits]})


@bp.route('/api/crm/visits', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_visit():
    data = request.get_json(silent=True) or {}
    lid = data.get('lead_id')
    if not lid or not db.session.get(Lead, lid):
        return _err('lead_id inv\u00e1lido.')
    scheduled = _parse_dt(data.get('scheduled_at', ''))
    if not scheduled:
        return _err('scheduled_at es obligatorio.')
    visit = Visit(
        lead_id=lid,
        property_id=data.get('property_id'),
        agent_id=data.get('agent_id'),
        scheduled_at=scheduled,
        duration_minutes=data.get('duration_minutes', 30),
        notes=_strip_html(data.get('notes', '')),
    )
    db.session.add(visit)
    db.session.flush()
    _create_activity(lid, 'visit_scheduled',
                     title=f'Visita agendada: {scheduled.strftime("%d/%m %H:%M")}',
                     description=_strip_html(data.get('notes', '')),
                     visit_id=visit.id)
    db.session.commit()
    return _ok(visit.to_dict(), 201)


@bp.route('/api/crm/visits/<int:vid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_visit(vid):
    visit = Visit.query.get_or_404(vid)
    data = request.get_json(silent=True) or {}
    if 'scheduled_at' in data:
        visit.scheduled_at = _parse_dt(data['scheduled_at'])
    if 'duration_minutes' in data:
        visit.duration_minutes = data['duration_minutes']
    if 'property_id' in data:
        visit.property_id = data['property_id']
    if 'agent_id' in data:
        visit.agent_id = data['agent_id']
    if 'notes' in data:
        visit.notes = _strip_html(data['notes'])
    if 'status' in data and data['status'] in VISIT_STATUSES and data['status'] != visit.status:
        old = visit.status
        visit.status = data['status']
        act_type = {'realizada': 'visit_completed', 'cancelada': 'visit_cancelled'}.get(data['status'], 'system')
        _create_activity(visit.lead_id, act_type,
                         title=f'Visita {data["status"]}',
                         from_status=old, to_status=data['status'],
                         description=_strip_html(data.get('feedback' if data['status'] == 'realizada' else 'notes', '')),
                         visit_id=visit.id)
        if data['status'] == 'realizada' and data.get('feedback'):
            visit.feedback = _strip_html(data['feedback'])
    if 'feedback' in data and not data.get('status'):
        visit.feedback = _strip_html(data['feedback'])
    db.session.commit()
    return _ok(visit.to_dict())


@bp.route('/api/crm/visits/<int:vid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_visit(vid):
    visit = Visit.query.get_or_404(vid)
    acts = LeadActivity.query.filter_by(visit_id=vid).all()
    for a in acts:
        db.session.delete(a)
    db.session.delete(visit)
    db.session.commit()
    return _ok({'deleted': vid})


@bp.route('/api/crm/visits/calendar', methods=['GET'])
@require_role(ROLE_EDITOR)
def visit_calendar():
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    query = Visit.query
    if date_from:
        query = query.filter(Visit.scheduled_at >= _parse_dt(date_from))
    if date_to:
        query = query.filter(Visit.scheduled_at <= _parse_dt(date_to))
    visits = query.order_by(Visit.scheduled_at.asc()).all()
    events = []
    for v in visits:
        end = v.scheduled_at + timedelta(minutes=v.duration_minutes or 30)
        events.append({
            'id': v.id,
            'title': f'{v.lead.name if v.lead else "?"} - {v.property.title[:30] if v.property else "Sin propiedad"}',
            'start': v.scheduled_at.isoformat() if v.scheduled_at else None,
            'end': end.isoformat(),
            'status': v.status,
            'lead_id': v.lead_id,
            'property_id': v.property_id,
            'agent_name': v.agent.name + ' ' + v.agent.last if v.agent else None,
        })
    return _ok({'events': events})


@bp.route('/api/crm/visits/upcoming', methods=['GET'])
@require_role(ROLE_EDITOR)
def upcoming_visits():
    now = _now()
    tomorrow = now + timedelta(days=2)
    visits = Visit.query.filter(
        Visit.scheduled_at.between(now, tomorrow),
        Visit.status.in_(['pendiente', 'confirmada']),
    ).order_by(Visit.scheduled_at.asc()).all()
    return _ok({'visits': [v.to_dict() for v in visits]})
