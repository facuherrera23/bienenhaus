from datetime import datetime, timezone
from flask import request, session
from extensions import db
from models import (
    Lead, LeadPropertyInterest, LeadActivity, Property,
    ContactMessage, AppraisalRequest, Agent,
)
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from .helpers import (
    _create_activity, _parse_dt, _asignar_propiedades, _now,
    LEAD_STATUSES, LEAD_ORIGINS,
)
from . import bp


@bp.route('/api/crm/leads', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_leads():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 200)
    status_filter = request.args.get('status', '')
    origin_filter = request.args.get('origin', '')
    tipo_cliente_filter = request.args.get('tipo_cliente', '')
    agent_filter = request.args.get('agent_id', type=int)
    search = request.args.get('search', '')
    has_followup = request.args.get('has_followup', type=int)

    query = Lead.query
    query = query.order_by(Lead.updated_at.desc())
    if status_filter in LEAD_STATUSES:
        query = query.filter(Lead.status == status_filter)
    if origin_filter in LEAD_ORIGINS:
        query = query.filter(Lead.origin == origin_filter)
    if tipo_cliente_filter:
        query = query.filter(Lead.tipo_cliente == tipo_cliente_filter)
    if agent_filter:
        query = query.filter(Lead.agent_id == agent_filter)
    if has_followup == 1:
        query = query.filter(Lead.next_followup_at.isnot(None))
    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(Lead.name.ilike(like), Lead.email.ilike(like),
                   Lead.phone.ilike(like), Lead.whatsapp.ilike(like),
                   Lead.notes.ilike(like))
        )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    leads = pagination.items
    lead_ids = [l.id for l in leads]
    if lead_ids:
        props_batch = db.session.query(LeadPropertyInterest).filter(
            LeadPropertyInterest.lead_id.in_(lead_ids)
        ).all()
        prop_ids = [p.property_id for p in props_batch if p.property_id]
        prop_titles = {}
        if prop_ids:
            for p in db.session.query(Property).filter(Property.id.in_(prop_ids)).all():
                prop_titles[p.id] = p.title
        props_by_lead = {}
        for p in props_batch:
            props_by_lead.setdefault(p.lead_id, []).append({
                'id': p.id,
                'lead_id': p.lead_id,
                'property_id': p.property_id,
                'property_title': prop_titles.get(p.property_id),
                'interest_type': p.interest_type,
                'notes': p.notes,
                'created_at': str(p.created_at) if p.created_at else None,
            })
    else:
        props_by_lead = {}

    return _ok({
        'leads': [{
            'id': l.id, 'name': l.name, 'email': l.email, 'phone': l.phone,
            'whatsapp': l.whatsapp, 'preferred_contact_method': l.preferred_contact_method,
            'origin': l.origin, 'tipo_cliente': l.tipo_cliente or None,
            'source_detail': l.source_detail,
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
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@bp.route('/api/crm/leads/<int:lid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_lead(lid):
    lead = Lead.query.get_or_404(lid)
    data = lead.to_dict()
    data['activity_count'] = LeadActivity.query.filter_by(lead_id=lid).count()
    return _ok(data)


@bp.route('/api/crm/leads', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_lead():
    data = request.get_json(silent=True) or {}
    name = _strip_html(data.get('name', ''))
    if not name:
        return _err('El nombre es obligatorio.')
    lead = Lead(
        name=name,
        email=data.get('email', ''),
        phone=_strip_html(data.get('phone', '')),
        whatsapp=_strip_html(data.get('whatsapp', '')),
        preferred_contact_method=data.get('preferred_contact_method', 'llamada'),
        origin=data.get('origin', 'manual'),
        tipo_cliente=data.get('tipo_cliente', ''),
        source_detail=_strip_html(data.get('source_detail', '')),
        status=data.get('status', 'nuevo'),
        agent_id=data.get('agent_id'),
        notes=_strip_html(data.get('notes', '')),
        estimated_value=data.get('estimated_value'),
        conversion_probability=data.get('conversion_probability', 50),
        lead_score=data.get('lead_score', 0),
        budget_min=data.get('budget_min'),
        budget_max=data.get('budget_max'),
        utm_source=_strip_html(data.get('utm_source', '')),
        utm_medium=_strip_html(data.get('utm_medium', '')),
        utm_campaign=_strip_html(data.get('utm_campaign', '')),
        source_url=_strip_html(data.get('source_url', '')),
    )
    db.session.add(lead)
    db.session.flush()

    _create_activity(lead.id, 'system', title='Lead creado',
                     description=f'Creado desde origen: {lead.origin}')
    _asignar_propiedades(lead, data.get('property_ids', []))
    db.session.commit()
    return _ok(lead.to_dict(), 201)


@bp.route('/api/crm/leads/<int:lid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_lead(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}

    STR_FIELDS = ['name', 'email', 'notes', 'source_url', 'source_detail',
                  'loss_reason', 'whatsapp', 'utm_source', 'utm_medium', 'utm_campaign']
    for f in STR_FIELDS:
        if f in data:
            setattr(lead, f, _strip_html(data[f]))

    if 'phone' in data:
        lead.phone = _strip_html(data['phone'])
    if 'preferred_contact_method' in data:
        lead.preferred_contact_method = data['preferred_contact_method']
    if 'origin' in data:
        lead.origin = data['origin']
    if 'tipo_cliente' in data:
        lead.tipo_cliente = data['tipo_cliente'] or ''
    if 'status' in data and data['status'] in LEAD_STATUSES and data['status'] != lead.status:
        old_status = lead.status
        lead.status = data['status']
        _create_activity(lead.id, 'status_change',
                         title=f'Cambio de estado: {old_status} \u2192 {data["status"]}',
                         from_status=old_status, to_status=data['status'])
    if 'agent_id' in data:
        lead.agent_id = data['agent_id']
    if 'estimated_value' in data:
        lead.estimated_value = data['estimated_value']
    if 'conversion_probability' in data:
        lead.conversion_probability = data['conversion_probability']
    if 'lead_score' in data:
        lead.lead_score = data['lead_score']
    if 'budget_min' in data:
        lead.budget_min = data['budget_min']
    if 'budget_max' in data:
        lead.budget_max = data['budget_max']
    if 'last_contacted_at' in data:
        lead.last_contacted_at = _parse_dt(data['last_contacted_at'])
    if 'next_followup_at' in data:
        lead.next_followup_at = _parse_dt(data['next_followup_at'])
    if 'property_ids' in data:
        _asignar_propiedades(lead, data['property_ids'])
    if 'interactions' in data:
        lead.interactions_list = data['interactions']

    db.session.commit()
    return _ok(lead.to_dict())


@bp.route('/api/crm/leads/<int:lid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_lead(lid):
    lead = Lead.query.get_or_404(lid)
    db.session.delete(lead)
    db.session.commit()
    return _ok({'deleted': lid})


@bp.route('/api/crm/leads/<int:lid>/status', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def change_lead_status(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    new_status = data.get('status', '')
    if new_status not in LEAD_STATUSES:
        return _err(f'Estado inv\u00e1lido: {new_status}')
    old_status = lead.status
    if old_status == new_status:
        return _ok(lead.to_dict())
    lead.status = new_status
    _create_activity(lead.id, 'status_change',
                     title=f'{old_status} \u2192 {new_status}',
                     from_status=old_status, to_status=new_status,
                     description=_strip_html(data.get('note', '')))
    if new_status == 'cerrado_perdido' and data.get('loss_reason'):
        lead.loss_reason = data['loss_reason']
    db.session.commit()
    return _ok(lead.to_dict())


@bp.route('/api/crm/leads/<int:lid>/pipeline-order', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_pipeline_order(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    lead.pipeline_order = data.get('pipeline_order', 0)
    db.session.commit()
    return _ok({'pipeline_order': lead.pipeline_order})


@bp.route('/api/crm/leads/<int:lid>/followup', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def schedule_followup(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    followup_at = _parse_dt(data.get('next_followup_at', ''))
    if not followup_at:
        return _err('next_followup_at es obligatorio.')
    lead.next_followup_at = followup_at
    note = _strip_html(data.get('note', ''))
    _create_activity(lead.id, 'followup_scheduled',
                     title=f'Followup programado: {followup_at.strftime("%d/%m %H:%M")}',
                     description=note)
    db.session.commit()
    return _ok(lead.to_dict())


# ── Propiedades de inter\u00e9s ─────────────────────────────────────────────


@bp.route('/api/crm/leads/<int:lid>/properties', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_lead_properties(lid):
    items = LeadPropertyInterest.query.filter_by(lead_id=lid).all()
    return _ok({'properties': [p.to_dict() for p in items]})


@bp.route('/api/crm/leads/<int:lid>/properties', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_lead_property(lid):
    _ = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    pid = data.get('property_id')
    if not pid or not db.session.get(Property, pid):
        return _err('property_id inv\u00e1lido.')
    existing = LeadPropertyInterest.query.filter_by(lead_id=lid, property_id=pid).first()
    if existing:
        return _ok(existing.to_dict())
    lp = LeadPropertyInterest(
        lead_id=lid, property_id=pid,
        interest_type=data.get('interest_type', 'venta'),
        notes=_strip_html(data.get('notes', '')),
    )
    db.session.add(lp)
    db.session.commit()
    return _ok(lp.to_dict(), 201)


@bp.route('/api/crm/leads/<int:lid>/properties/<int:lpid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_lead_property(lid, lpid):
    lp = LeadPropertyInterest.query.filter_by(id=lpid, lead_id=lid).first_or_404()
    data = request.get_json(silent=True) or {}
    if 'interest_type' in data:
        lp.interest_type = data['interest_type']
    if 'notes' in data:
        lp.notes = _strip_html(data['notes'])
    db.session.commit()
    return _ok(lp.to_dict())


@bp.route('/api/crm/leads/<int:lid>/properties/<int:lpid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def remove_lead_property(lid, lpid):
    lp = LeadPropertyInterest.query.filter_by(id=lpid, lead_id=lid).first_or_404()
    db.session.delete(lp)
    db.session.commit()
    return _ok({'deleted': lpid})


# ── Notas ──────────────────────────────────────────────────────────────────


@bp.route('/api/crm/leads/<int:lid>/notes', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_note(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    note = _strip_html(data.get('note', ''))
    if not note:
        return _err('La nota no puede estar vac\u00eda.')
    interactions = lead.interactions_list
    interactions.append({
        'type': 'note',
        'text': note,
        'created_at': _now().isoformat(),
    })
    lead.interactions_list = interactions
    _create_activity(lid, 'note', title='Nota', description=note)
    db.session.commit()
    return _ok(lead.to_dict())


# ── Conversiones ────────────────────────────────────────────────────────────


@bp.route('/api/crm/from-contact/<int:mid>', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def from_contact(mid):
    msg = ContactMessage.query.get_or_404(mid)
    existing = Lead.query.filter_by(email=msg.email).first()
    if existing:
        return _err(f'Ese contacto ya existe como lead #{existing.id} ({existing.name})')
    lead = Lead(
        name=msg.name, email=msg.email, phone=msg.phone,
        origin='contacto', status='nuevo',
        notes=f'Convertido desde mensaje de contacto #{mid}: {msg.message[:500]}',
    )
    db.session.add(lead)
    db.session.flush()
    _create_activity(lead.id, 'system', title='Lead creado desde formulario de contacto',
                     description=f'Mensaje #{mid}')
    db.session.commit()
    return _ok(lead.to_dict(), 201)


@bp.route('/api/crm/from-request/<int:rid>', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def from_request(rid):
    req = AppraisalRequest.query.get_or_404(rid)
    existing = Lead.query.filter_by(email=req.email).first()
    if existing:
        return _err(f'Esa solicitud ya existe como lead #{existing.id} ({existing.name})')
    lead = Lead(
        name=req.name, email=req.email, phone=req.phone,
        origin='tasacion', status='nuevo',
        notes=f'Convertido desde solicitud de tasaci\u00f3n #{rid}: {req.property_type} en {req.city} - {req.comments[:500] if req.comments else ""}',
        source_url='/admin#tabTasacionRequests',
    )
    db.session.add(lead)
    db.session.flush()
    _create_activity(lead.id, 'system', title='Lead creado desde solicitud de tasaci\u00f3n',
                     description=f'Solicitud #{rid}')
    db.session.commit()
    return _ok(lead.to_dict(), 201)


# ── Agentes ─────────────────────────────────────────────────────────────────


@bp.route('/api/crm/agents', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_agents():
    agents = Agent.query.order_by(Agent.name).all()
    return _ok({'agents': [{'id': a.id, 'name': f'{a.name} {a.last}'} for a in agents]})


# ── Enviar email ────────────────────────────────────────────────────────────


@bp.route('/api/crm/leads/<int:lid>/send-email', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def send_email(lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json(silent=True) or {}
    subject = _strip_html(data.get('subject', ''))
    body = data.get('body', '')
    if not subject or not body:
        return _err('Asunto y cuerpo son obligatorios.')
    if not lead.email:
        return _err('El lead no tiene email.')
    try:
        from email_service import is_configured, _send as send_email_fn
        if not is_configured():
            return _err('Email no configurado. Revis\u00e1 Configuraci\u00f3n \u2192 SMTP.')
        cfg = __import__('email_service', fromlist=['_get_config'])._get_config()
        ok = send_email_fn(cfg, lead.email, subject, body)
        if not ok:
            return _err('Error al enviar el email.')
        interactions = lead.interactions_list
        interactions.append({
            'type': 'email',
            'subject': subject,
            'body': body[:200],
            'created_at': _now().isoformat(),
        })
        lead.interactions_list = interactions
        _create_activity(lid, 'email', title=f'Email: {subject}',
                         description=body[:500], email_subject=subject, email_to=lead.email)
        lead.last_contacted_at = _now()
        db.session.commit()
        return _ok({'message': 'Email enviado.'})
    except Exception as e:
        from .helpers import logger
        logger.exception('Error enviando email CRM')
        return _err(f'Error: {str(e)[:200]}')
