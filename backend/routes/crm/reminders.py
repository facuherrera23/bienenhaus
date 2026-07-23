from datetime import timedelta
from flask import request, session
from models import Reminder, LeadActivity
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from .helpers import _create_activity, _parse_dt, _now, REMINDER_TYPES
from . import bp


@bp.route('/api/crm/reminders', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_reminders():
    lead_id = request.args.get('lead_id', type=int)
    upcoming = request.args.get('upcoming', type=int)
    query = Reminder.query.order_by(Reminder.reminder_at.asc())
    if lead_id:
        query = query.filter(Reminder.lead_id == lead_id)
    if upcoming:
        now = _now()
        later = now + timedelta(hours=upcoming)
        query = query.filter(Reminder.notified == False,  # noqa: E712
                             Reminder.reminder_at.between(now, later))
    reminders = query.all()
    return _ok({'reminders': [r.to_dict() for r in reminders]})


@bp.route('/api/crm/reminders', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_reminder():
    data = request.get_json(silent=True) or {}
    title = _strip_html(data.get('title', ''))
    if not title:
        return _err('El t\u00edtulo es obligatorio.')
    reminder_at = _parse_dt(data.get('reminder_at', ''))
    if not reminder_at:
        return _err('reminder_at es obligatorio.')
    reminder = Reminder(
        lead_id=data.get('lead_id'),
        task_id=data.get('task_id'),
        title=title,
        reminder_at=reminder_at,
        reminder_type=data.get('reminder_type', 'custom'),
        created_by_id=session.get('user_id'),
    )
    from extensions import db
    db.session.add(reminder)
    db.session.flush()
    if reminder.lead_id:
        _create_activity(reminder.lead_id, 'system',
                         title=f'Recordatorio: {title}',
                         description=f'Para {reminder_at.strftime("%d/%m %H:%M")}',
                         reminder_id=reminder.id)
    db.session.commit()
    return _ok(reminder.to_dict(), 201)


@bp.route('/api/crm/reminders/<int:rid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_reminder(rid):
    reminder = Reminder.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    if 'title' in data:
        reminder.title = _strip_html(data['title'])
    if 'reminder_at' in data:
        reminder.reminder_at = _parse_dt(data['reminder_at'])
    if 'reminder_type' in data:
        reminder.reminder_type = data['reminder_type']
    from extensions import db
    db.session.commit()
    return _ok(reminder.to_dict())


@bp.route('/api/crm/reminders/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_reminder(rid):
    reminder = Reminder.query.get_or_404(rid)
    acts = LeadActivity.query.filter_by(reminder_id=rid).all()
    from extensions import db
    for a in acts:
        db.session.delete(a)
    db.session.delete(reminder)
    db.session.commit()
    return _ok({'deleted': rid})


@bp.route('/api/crm/reminders/<int:rid>/dismiss', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def dismiss_reminder(rid):
    reminder = Reminder.query.get_or_404(rid)
    reminder.notified = True
    reminder.notified_at = _now()
    from extensions import db
    db.session.commit()
    return _ok(reminder.to_dict())


@bp.route('/api/crm/reminders/pending', methods=['GET'])
@require_role(ROLE_EDITOR)
def pending_reminders():
    now = _now()
    reminders = Reminder.query.filter(
        Reminder.notified == False,  # noqa: E712
        Reminder.reminder_at <= now,
    ).order_by(Reminder.reminder_at.asc()).limit(50).all()
    return _ok({'reminders': [r.to_dict() for r in reminders]})
