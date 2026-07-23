from datetime import datetime, timezone
from flask import request, session
from extensions import db
from models import Request, RequestComment, RequestFile, Lead, Agent
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from . import bp

REQUEST_TYPES = ['consulta', 'tasacion', 'visita', 'informacion', 'propuesta', 'reclamo', 'otro']
REQUEST_STATUSES = ['nueva', 'en_revision', 'respondida', 'cerrada']
REQUEST_PRIORITIES = ['baja', 'media', 'alta', 'urgente']


@bp.route('/api/requests', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_requests():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 200)
    status = request.args.get('status', '')
    rtype = request.args.get('type', '')
    priority = request.args.get('priority', '')
    agent_id = request.args.get('agent_id', type=int)
    search = request.args.get('search', '')

    query = Request.query.order_by(Request.updated_at.desc())
    if status in REQUEST_STATUSES:
        query = query.filter(Request.status == status)
    if rtype in REQUEST_TYPES:
        query = query.filter(Request.request_type == rtype)
    if priority in REQUEST_PRIORITIES:
        query = query.filter(Request.priority == priority)
    if agent_id:
        query = query.filter(Request.assigned_agent_id == agent_id)
    if search:
        like = f'%{search}%'
        query = query.filter(db.or_(Request.client_name.ilike(like), Request.subject.ilike(like),
                                    Request.description.ilike(like)))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return _ok({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@bp.route('/api/requests/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def request_stats():
    total = Request.query.count()
    nuevas = Request.query.filter_by(status='nueva').count()
    en_revision = Request.query.filter_by(status='en_revision').count()
    respondidas = Request.query.filter_by(status='respondida').count()
    cerradas = Request.query.filter_by(status='cerrada').count()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    closed_with_time = Request.query.filter(Request.status == 'cerrada', Request.first_response_at.isnot(None)).all()
    times = [r.response_time_hours for r in closed_with_time if r.response_time_hours is not None]
    avg_response = round(sum(times) / len(times), 1) if times else None

    return _ok({
        'total': total,
        'nuevas': nuevas,
        'en_revision': en_revision,
        'respondidas': respondidas,
        'cerradas': cerradas,
        'avg_response_hours': avg_response,
    })


@bp.route('/api/requests/<int:rid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_request(rid):
    req = Request.query.get_or_404(rid)
    data = req.to_dict()
    data['comments'] = [c.to_dict() for c in req.comments.all()]
    data['files'] = [f.to_dict() for f in req.files.all()]
    return _ok(data)


@bp.route('/api/requests', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_request():
    data = request.get_json(silent=True) or {}
    name = _strip_html(data.get('client_name', ''))
    if not name:
        return _err('El nombre del cliente es obligatorio.')
    req = Request(
        client_name=name,
        client_email=_strip_html(data.get('client_email', '')),
        client_phone=_strip_html(data.get('client_phone', '')),
        request_type=data.get('request_type', 'consulta'),
        subject=_strip_html(data.get('subject', '')),
        description=_strip_html(data.get('description', '')),
        property_id=data.get('property_id'),
        status='nueva',
        priority=data.get('priority', 'media'),
        assigned_agent_id=data.get('assigned_agent_id'),
        source=data.get('source', 'manual'),
        notes=_strip_html(data.get('notes', '')),
    )
    db.session.add(req)
    db.session.commit()
    return _ok(req.to_dict(), 201)


@bp.route('/api/requests/<int:rid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_request(rid):
    req = Request.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}

    if 'status' in data and data['status'] in REQUEST_STATUSES:
        old_status = req.status
        req.status = data['status']
        if data['status'] in ('respondida', 'cerrada') and not req.first_response_at:
            req.first_response_at = datetime.now(timezone.utc).replace(tzinfo=None)
        if data['status'] == 'cerrada':
            req.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
    if 'priority' in data and data['priority'] in REQUEST_PRIORITIES:
        req.priority = data['priority']
    if 'assigned_agent_id' in data:
        req.assigned_agent_id = data['assigned_agent_id']
    if 'notes' in data:
        req.notes = _strip_html(data['notes'])
    if 'subject' in data:
        req.subject = _strip_html(data['subject'])

    db.session.commit()
    return _ok(req.to_dict())


@bp.route('/api/requests/<int:rid>/comments', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_comments(rid):
    req = Request.query.get_or_404(rid)
    return _ok({'comments': [c.to_dict() for c in req.comments.all()]})


@bp.route('/api/requests/<int:rid>/comments', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_comment(rid):
    req = Request.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    content = _strip_html(data.get('content', ''))
    if not content:
        return _err('El comentario no puede estar vacío.')
    user = session.get('user_id')
    comment = RequestComment(
        request_id=rid,
        author='agent',
        author_name=data.get('author_name', f'Usuario #{user}'),
        content=content,
    )
    db.session.add(comment)
    db.session.commit()
    return _ok(comment.to_dict(), 201)


@bp.route('/api/requests/<int:rid>/convert-to-lead', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def convert_to_lead(rid):
    req = Request.query.get_or_404(rid)
    if req.lead_id:
        return _err('Esta solicitud ya está convertida a lead.')
    lead = Lead(
        name=req.client_name,
        email=req.client_email,
        phone=req.client_phone,
        origin='request',
        source_detail=f'Solicitud #{req.id}: {req.subject or req.request_type}',
        status='nuevo',
        notes=f'Convertido desde solicitud #{req.id}. {req.description or ""}',
        agent_id=req.assigned_agent_id,
    )
    db.session.add(lead)
    db.session.flush()
    req.lead_id = lead.id
    db.session.commit()
    return _ok({'lead': lead.to_dict(), 'request': req.to_dict()})


@bp.route('/api/requests/agents', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_agents():
    agents = Agent.query.order_by(Agent.name).all()
    return _ok({'agents': [{'id': a.id, 'name': f'{a.name} {a.last or ""}'.strip()} for a in agents]})
