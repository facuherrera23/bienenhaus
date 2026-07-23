from flask import request
from extensions import db
from models import Lead, LeadActivity
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from .helpers import _create_activity, _now, ACTIVITY_TYPES
from . import bp


@bp.route('/api/crm/leads/<int:lid>/timeline', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_timeline(lid):
    _ = Lead.query.get_or_404(lid)
    limit = request.args.get('limit', 50, type=int)
    type_filter = request.args.get('type', '')
    query = LeadActivity.query.filter_by(lead_id=lid)
    if type_filter in ACTIVITY_TYPES:
        query = query.filter(LeadActivity.activity_type == type_filter)
    activities = query.order_by(LeadActivity.created_at.desc()).limit(limit).all()
    return _ok({'timeline': [a.to_dict() for a in activities]})


@bp.route('/api/crm/leads/<int:lid>/activities', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_activity(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    atype = data.get('activity_type', '')
    if atype not in ACTIVITY_TYPES:
        return _err(f'Tipo de actividad inv\u00e1lido: {atype}')
    if atype in ('call', 'whatsapp'):
        activity = _create_activity(lid, atype,
                                     title=_strip_html(data.get('title', atype.capitalize())),
                                     description=_strip_html(data.get('description', '')),
                                     duration_minutes=data.get('duration_minutes'))
        lead.last_contacted_at = _now()
    elif atype == 'note':
        activity = _create_activity(lid, 'note',
                                     title='Nota',
                                     description=_strip_html(data.get('description', '')))
    elif atype == 'email':
        activity = _create_activity(lid, 'email',
                                     title=_strip_html(data.get('title', 'Email')),
                                     description=_strip_html(data.get('description', '')),
                                     email_subject=data.get('email_subject', ''),
                                     email_to=lead.email)
        lead.last_contacted_at = _now()
    else:
        activity = _create_activity(lid, atype,
                                     title=_strip_html(data.get('title', '')),
                                     description=_strip_html(data.get('description', '')))
    db.session.commit()
    return _ok(activity.to_dict(), 201)


@bp.route('/api/crm/leads/<int:lid>/activities/<int:aid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_activity(lid, aid):
    act = LeadActivity.query.filter_by(id=aid, lead_id=lid).first_or_404()
    if act.activity_type not in ('call', 'note', 'whatsapp'):
        return _err('Solo se pueden eliminar actividades editables.')
    from extensions import db
    db.session.delete(act)
    db.session.commit()
    return _ok({'deleted': aid})
