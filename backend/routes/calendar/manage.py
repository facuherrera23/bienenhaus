from datetime import datetime, timezone, timedelta
from flask import request, session
from sqlalchemy import func, extract, and_, or_
from extensions import db
from models import CalendarEvent, EventComment, EventAttachment, Agent, Property, Lead, User
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR, ROLE_VIEWER
from utils import _ok, _err

from . import bp

EVENT_TYPES = ['visita', 'reunion', 'llamada', 'tasacion', 'recordatorio', 'tarea', 'evento']
STATUSES = ['pendiente', 'confirmado', 'completado', 'cancelado', 'reprogramado']
PRIORITIES = ['baja', 'media', 'alta', 'urgente']


@bp.route('/kpi', methods=['GET'])
@require_role(ROLE_VIEWER)
def kpi():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    today_events = CalendarEvent.query.filter(
        CalendarEvent.start_at >= today_start,
        CalendarEvent.start_at < today_end,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()

    week_events = CalendarEvent.query.filter(
        CalendarEvent.start_at >= today_start,
        CalendarEvent.start_at < week_end,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()

    visits = CalendarEvent.query.filter(
        CalendarEvent.event_type == 'visita',
        CalendarEvent.start_at >= today_start,
        CalendarEvent.start_at < week_end,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()

    appraisals_events = CalendarEvent.query.filter(
        CalendarEvent.event_type == 'tasacion',
        CalendarEvent.start_at >= today_start,
        CalendarEvent.start_at < week_end,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()

    calls = CalendarEvent.query.filter(
        CalendarEvent.event_type == 'llamada',
        CalendarEvent.start_at >= today_start,
        CalendarEvent.start_at < week_end,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()

    overdue = CalendarEvent.query.filter(
        CalendarEvent.status == 'pendiente',
        CalendarEvent.start_at < now
    ).count()

    upcoming_reminders = CalendarEvent.query.filter(
        CalendarEvent.event_type == 'recordatorio',
        CalendarEvent.start_at >= now,
        CalendarEvent.status.notin_(['completado', 'cancelado'])
    ).order_by(CalendarEvent.start_at.asc()).limit(5).all()

    total = CalendarEvent.query.filter(
        CalendarEvent.start_at >= today_start,
        CalendarEvent.status.notin_(['cancelado'])
    ).count()
    completed_today = CalendarEvent.query.filter(
        CalendarEvent.status == 'completado',
        CalendarEvent.completed_at >= today_start,
        CalendarEvent.completed_at < today_end
    ).count()
    completion_rate = round((completed_today / max(total, 1)) * 100, 1)

    return _ok({
        'today_events': today_events,
        'week_events': week_events,
        'visits': visits,
        'appraisals': appraisals_events,
        'calls': calls,
        'overdue': overdue,
        'upcoming_reminders': [e.to_dict() for e in upcoming_reminders],
        'completion_rate': completion_rate,
        'completed_today': completed_today,
    })


@bp.route('/events', methods=['GET'])
@require_role(ROLE_VIEWER)
def list_events():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    view = request.args.get('view', 'month')
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    day = request.args.get('day', type=int)
    event_type = request.args.get('event_type', '')
    status_filter = request.args.get('status', '')
    priority = request.args.get('priority', '')
    agent_id = request.args.get('agent_id', type=int)
    search = request.args.get('search', '').strip().lower()

    q = CalendarEvent.query

    if view == 'day' and year and month and day:
        d_start = datetime(year, month, day)
        d_end = d_start + timedelta(days=1)
        q = q.filter(CalendarEvent.start_at >= d_start, CalendarEvent.start_at < d_end)
    elif view == 'week' and year and month and day:
        from datetime import date as dt_date
        ref = dt_date(year, month, day)
        w_start = ref - timedelta(days=ref.weekday())
        w_end = w_start + timedelta(days=7)
        q = q.filter(CalendarEvent.start_at >= datetime.combine(w_start, datetime.min.time()),
                     CalendarEvent.start_at < datetime.combine(w_end, datetime.min.time()))
    elif view == 'month' and year and month:
        q = q.filter(
            extract('year', CalendarEvent.start_at) == year,
            extract('month', CalendarEvent.start_at) == month
        )
    elif view == 'upcoming':
        q = q.filter(CalendarEvent.start_at >= now,
                     CalendarEvent.status.notin_(['completado', 'cancelado'])
                     ).order_by(CalendarEvent.start_at.asc()).limit(50)
    elif view == 'overdue':
        q = q.filter(CalendarEvent.status == 'pendiente',
                     CalendarEvent.start_at < now
                     ).order_by(CalendarEvent.start_at.asc())
    elif view == 'completed':
        q = q.filter(CalendarEvent.status == 'completado'
                     ).order_by(CalendarEvent.completed_at.desc()).limit(50)
    else:
        q = q.order_by(CalendarEvent.start_at.desc()).limit(100)

    if event_type:
        q = q.filter(CalendarEvent.event_type == event_type)
    if status_filter:
        q = q.filter(CalendarEvent.status == status_filter)
    if priority:
        q = q.filter(CalendarEvent.priority == priority)
    if agent_id:
        q = q.filter(CalendarEvent.agent_id == agent_id)
    if search:
        q = q.filter(
            or_(
                CalendarEvent.title.ilike(f'%{search}%'),
                CalendarEvent.client_name.ilike(f'%{search}%'),
                CalendarEvent.description.ilike(f'%{search}%'),
            )
        )

    events = q.all()
    return _ok([e.to_dict() for e in events])


@bp.route('/events', methods=['POST'])
@require_role(ROLE_EDITOR)
@csrf_protect
def create_event():
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    if not title:
        return _err('El título es requerido', 400)
    event_type = data.get('event_type', 'recordatorio')
    if event_type not in EVENT_TYPES:
        return _err(f'Tipo de evento inválido: {event_type}', 400)

    start_at_str = data.get('start_at')
    if not start_at_str:
        return _err('La fecha de inicio es requerida', 400)
    try:
        start_at = datetime.fromisoformat(start_at_str)
    except ValueError:
        return _err('Formato de fecha inválido', 400)

    end_at_str = data.get('end_at')
    end_at = None
    if end_at_str:
        try:
            end_at = datetime.fromisoformat(end_at_str)
        except ValueError:
            pass

    event = CalendarEvent(
        event_type=event_type,
        title=title,
        description=data.get('description', ''),
        client_name=data.get('client_name', ''),
        client_phone=data.get('client_phone', ''),
        client_email=data.get('client_email', ''),
        property_id=data.get('property_id'),
        agent_id=data.get('agent_id'),
        start_at=start_at,
        end_at=end_at,
        all_day=data.get('all_day', False),
        status=data.get('status', 'pendiente'),
        priority=data.get('priority', 'media'),
        location=data.get('location', ''),
        lead_id=data.get('lead_id'),
        appraisal_id=data.get('appraisal_id'),
        created_by_id=session.get('user_id'),
    )
    db.session.add(event)
    db.session.commit()
    return _ok(event.to_dict())


@bp.route('/events/<int:eid>', methods=['GET'])
@require_role(ROLE_VIEWER)
def get_event(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    return _ok(event.to_calendar_dict())


@bp.route('/events/<int:eid>', methods=['PUT'])
@require_role(ROLE_EDITOR)
@csrf_protect
def update_event(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    data = request.get_json(silent=True) or {}
    for field in ('title', 'description', 'event_type', 'client_name', 'client_phone',
                  'client_email', 'status', 'priority', 'location', 'all_day'):
        if field in data:
            setattr(event, field, data[field])
    for fk in ('property_id', 'agent_id', 'lead_id', 'appraisal_id'):
        if fk in data:
            setattr(event, fk, data[fk])
    for date_field, key in [('start_at', 'start_at'), ('end_at', 'end_at')]:
        val = data.get(key)
        if val:
            try:
                setattr(event, date_field, datetime.fromisoformat(val))
            except ValueError:
                pass
    event.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.commit()
    return _ok(event.to_dict())


@bp.route('/events/<int:eid>', methods=['DELETE'])
@require_role(ROLE_EDITOR)
@csrf_protect
def delete_event(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    db.session.delete(event)
    db.session.commit()
    return _ok({'deleted': True})


@bp.route('/events/<int:eid>/action', methods=['POST'])
@require_role(ROLE_EDITOR)
@csrf_protect
def event_action(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    data = request.get_json(silent=True) or {}
    action = data.get('action', '')
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if action == 'complete':
        event.status = 'completado'
        event.completed_at = now
    elif action == 'cancel':
        event.status = 'cancelado'
        event.cancelled_at = now
    elif action == 'reschedule':
        new_start = data.get('start_at')
        if new_start:
            try:
                event.start_at = datetime.fromisoformat(new_start)
                event.status = 'reprogramado'
            except ValueError:
                return _err('Formato de fecha inválido', 400)
    elif action == 'assign':
        agent_id = data.get('agent_id')
        if agent_id:
            event.agent_id = agent_id
    else:
        return _err(f'Acción inválida: {action}', 400)

    event.updated_at = now
    db.session.commit()
    return _ok(event.to_dict())


@bp.route('/events/<int:eid>/comments', methods=['GET'])
@require_role(ROLE_VIEWER)
def list_comments(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    return _ok([c.to_dict() for c in event.comments.all()])


@bp.route('/events/<int:eid>/comments', methods=['POST'])
@require_role(ROLE_EDITOR)
@csrf_protect
def add_comment(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    data = request.get_json(silent=True) or {}
    content = (data.get('content') or '').strip()
    if not content:
        return _err('El contenido es requerido', 400)
    comment = EventComment(
        event_id=eid,
        content=content,
        created_by_id=session.get('user_id'),
    )
    db.session.add(comment)
    db.session.commit()
    return _ok(comment.to_dict())


@bp.route('/events/<int:eid>/attachments', methods=['POST'])
@require_role(ROLE_EDITOR)
@csrf_protect
def add_attachment(eid):
    event = db.session.get(CalendarEvent, eid)
    if not event:
        return _err('Evento no encontrado', 404)
    data = request.get_json(silent=True) or {}
    filename = (data.get('filename') or '').strip()
    url = (data.get('url') or '').strip()
    if not filename or not url:
        return _err('Nombre y URL requeridos', 400)
    att = EventAttachment(
        event_id=eid,
        filename=filename,
        url=url,
        file_type=data.get('file_type', ''),
        uploaded_by_id=session.get('user_id'),
    )
    db.session.add(att)
    db.session.commit()
    return _ok(att.to_dict())


@bp.route('/events/<int:eid>/attachments/<int:aid>', methods=['DELETE'])
@require_role(ROLE_EDITOR)
@csrf_protect
def delete_attachment(eid, aid):
    att = EventAttachment.query.filter_by(id=aid, event_id=eid).first()
    if not att:
        return _err('Archivo no encontrado', 404)
    db.session.delete(att)
    db.session.commit()
    return _ok({'deleted': True})


@bp.route('/agents', methods=['GET'])
@require_role(ROLE_VIEWER)
def list_agents():
    agents = Agent.query.order_by(Agent.name).all()
    return _ok([{'id': a.id, 'name': f'{a.name} {a.last}'} for a in agents])


@bp.route('/properties', methods=['GET'])
@require_role(ROLE_VIEWER)
def list_properties():
    props = Property.query.filter(Property.status != 'oculta').order_by(Property.title).all()
    return _ok([{'id': p.id, 'title': p.title or 'Sin título'} for p in props])


@bp.route('/leads', methods=['GET'])
@require_role(ROLE_VIEWER)
def list_leads():
    leads = Lead.query.order_by(Lead.name).all()
    return _ok([{'id': l.id, 'name': l.name} for l in leads])
