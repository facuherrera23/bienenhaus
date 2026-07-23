from datetime import timedelta
from flask import request, session
from extensions import db
from models import Task, Lead, LeadActivity
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from .helpers import _create_activity, _parse_dt, _now, TASK_STATUSES, TASK_PRIORITIES
from . import bp


@bp.route('/api/crm/tasks', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_tasks():
    lead_id = request.args.get('lead_id', type=int)
    assigned_to = request.args.get('assigned_to_id', type=int)
    status_filter = request.args.get('status', '')
    priority_filter = request.args.get('priority', '')
    due_before = request.args.get('due_before', '')
    due_after = request.args.get('due_after', '')

    query = Task.query.order_by(Task.due_at.asc().nullslast(), Task.created_at.desc())
    if lead_id:
        query = query.filter(Task.lead_id == lead_id)
    if assigned_to:
        query = query.filter(Task.assigned_to_id == assigned_to)
    if status_filter in TASK_STATUSES:
        query = query.filter(Task.status == status_filter)
    if priority_filter in TASK_PRIORITIES:
        query = query.filter(Task.priority == priority_filter)
    if due_before:
        query = query.filter(Task.due_at <= _parse_dt(due_before))
    if due_after:
        query = query.filter(Task.due_at >= _parse_dt(due_after))

    tasks = query.all()
    return _ok({'tasks': [t.to_dict() for t in tasks]})


@bp.route('/api/crm/tasks', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_task():
    data = request.get_json(silent=True) or {}
    title = _strip_html(data.get('title', ''))
    if not title:
        return _err('El t\u00edtulo es obligatorio.')
    lid = data.get('lead_id')
    if not lid or not db.session.get(Lead, lid):
        return _err('lead_id inv\u00e1lido.')
    task = Task(
        lead_id=lid,
        property_id=data.get('property_id'),
        title=title,
        description=_strip_html(data.get('description', '')),
        priority=data.get('priority', 'media'),
        due_at=_parse_dt(data.get('due_at', '')),
        assigned_to_id=data.get('assigned_to_id'),
        created_by_id=session.get('user_id'),
    )
    db.session.add(task)
    db.session.flush()
    _create_activity(lid, 'task_created', title=f'Tarea: {title}',
                     task_id=task.id)
    db.session.commit()
    return _ok(task.to_dict(), 201)


@bp.route('/api/crm/tasks/<int:tid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_task(tid):
    task = Task.query.get_or_404(tid)
    data = request.get_json(silent=True) or {}
    if 'title' in data:
        task.title = _strip_html(data['title'])
    if 'description' in data:
        task.description = _strip_html(data['description'])
    if 'status' in data and data['status'] in TASK_STATUSES:
        old_status = task.status
        task.status = data['status']
        if data['status'] == 'completada' and not task.completed_at:
            task.completed_at = _now()
            _create_activity(task.lead_id, 'task_completed',
                             title=f'Tarea completada: {task.title}',
                             task_id=task.id)
        elif old_status != data['status']:
            _create_activity(task.lead_id, 'system',
                             title=f'Tarea {old_status} \u2192 {data["status"]}: {task.title}',
                             task_id=task.id)
    if 'priority' in data and data['priority'] in TASK_PRIORITIES:
        task.priority = data['priority']
    if 'due_at' in data:
        task.due_at = _parse_dt(data['due_at'])
    if 'assigned_to_id' in data:
        task.assigned_to_id = data['assigned_to_id']
    db.session.commit()
    return _ok(task.to_dict())


@bp.route('/api/crm/tasks/<int:tid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_task(tid):
    task = Task.query.get_or_404(tid)
    act = LeadActivity.query.filter_by(task_id=tid).first()
    if act:
        db.session.delete(act)
    db.session.delete(task)
    db.session.commit()
    return _ok({'deleted': tid})


@bp.route('/api/crm/tasks/<int:tid>/complete', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def complete_task(tid):
    task = Task.query.get_or_404(tid)
    task.status = 'completada'
    task.completed_at = _now()
    _create_activity(task.lead_id, 'task_completed',
                     title=f'Tarea completada: {task.title}',
                     task_id=task.id)
    db.session.commit()
    return _ok(task.to_dict())


@bp.route('/api/crm/tasks/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def task_stats():
    now = _now()
    tomorrow = now + timedelta(days=1)
    return _ok({
        'pendientes': Task.query.filter_by(status='pendiente').count(),
        'en_progreso': Task.query.filter_by(status='en_progreso').count(),
        'vencidas': Task.query.filter(Task.status.in_(['pendiente', 'en_progreso']),
                                       Task.due_at < now).count(),
        'proximas_48h': Task.query.filter(Task.status.in_(['pendiente', 'en_progreso']),
                                           Task.due_at.between(now, tomorrow + timedelta(days=1))).count(),
    })
