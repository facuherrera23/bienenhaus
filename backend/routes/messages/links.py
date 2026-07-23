from flask import request, session
from extensions import db
from models import Conversation, Property, Appraisal
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err
from . import bp


@bp.route('/api/messages/conversations/<int:cid>/links', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_links(cid):
    conv = Conversation.query.get_or_404(cid)
    extra = conv.extra_data
    prop_ids = extra.get('linked_property_ids', [])
    appr_ids = extra.get('linked_appraisal_ids', [])

    properties = []
    if prop_ids:
        for p in Property.query.filter(Property.id.in_(prop_ids)).all():
            properties.append({'id': p.id, 'title': p.title, 'type': 'property'})

    appraisals = []
    if appr_ids:
        for a in Appraisal.query.filter(Appraisal.id.in_(appr_ids)).all():
            appraisals.append({'id': a.id, 'title': a.titulo, 'type': 'appraisal'})

    return _ok({
        'properties': properties,
        'appraisals': appraisals,
    })


@bp.route('/api/messages/conversations/<int:cid>/links', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_link(cid):
    conv = Conversation.query.get_or_404(cid)
    data = request.get_json(silent=True) or {}
    link_type = data.get('type', '')
    link_id = data.get('id')

    if not link_type or not link_id:
        return _err('type e id son obligatorios')
    if link_type not in ('property', 'appraisal'):
        return _err('type debe ser "property" o "appraisal"')

    extra = conv.extra_data
    key = f'linked_{link_type}_ids'
    ids = extra.get(key, [])

    if link_id in ids:
        return _ok({'message': 'Ya está vinculado'})

    ids.append(link_id)
    extra[key] = ids
    conv.extra_data = extra
    db.session.commit()

    resolved = None
    if link_type == 'property':
        p = db.session.get(Property, link_id)
        if p:
            resolved = {'id': p.id, 'title': p.title, 'type': 'property'}
    elif link_type == 'appraisal':
        a = db.session.get(Appraisal, link_id)
        if a:
            resolved = {'id': a.id, 'title': a.titulo, 'type': 'appraisal'}

    return _ok(resolved or {'id': link_id, 'type': link_type})


@bp.route('/api/messages/conversations/<int:cid>/links/<link_type>/<int:linked_id>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def remove_link(cid, link_type, linked_id):
    conv = Conversation.query.get_or_404(cid)

    if link_type not in ('property', 'appraisal'):
        return _err('link_type debe ser "property" o "appraisal"')

    extra = conv.extra_data
    key = f'linked_{link_type}_ids'
    ids = extra.get(key, [])

    if linked_id in ids:
        ids.remove(linked_id)
        extra[key] = ids
        conv.extra_data = extra
        db.session.commit()

    return _ok({'removed': True})
