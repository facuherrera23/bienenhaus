"""
routes/tasacion.py — Formulario público de tasación y gestión admin
"""
import os
import time
import logging
import threading
from datetime import datetime, timezone
from flask import Blueprint, request
import sentry_sdk

logger = logging.getLogger(__name__)
from extensions import db, limiter
from models import AppraisalRequest
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html

bp = Blueprint('tasacion', __name__)

WHATSAPP_NUMBER = os.getenv('WHATSAPP_NUMBER', '5493510000000')


@bp.route('/api/tasacion', methods=['POST'])
@limiter.limit("5 per minute")
@csrf_protect
def submit_tasacion():
    data = request.get_json(silent=True) or {}

    if data.get('_website'):
        return _err('Spam detectado.')

    ts = data.get('_ts')
    if ts:
        try:
            if time.time() - int(ts) < 3:
                return _err('Demasiado rápido.')
        except (ValueError, TypeError):
            pass

    name = _strip_html(data.get('name', ''))
    if not name:
        return _err('El nombre es obligatorio.')

    req = AppraisalRequest(
        name          = name,
        phone         = _strip_html(data.get('phone', '')),
        email         = data.get('email', ''),
        property_type = data.get('property_type', ''),
        motivo        = data.get('motivo', ''),
        city          = _strip_html(data.get('city', '')),
        address       = _strip_html(data.get('address', '')),
        comments      = _strip_html(data.get('comments', '')),
        status        = 'pendiente',
    )
    db.session.add(req)
    db.session.commit()
    req_id = req.id

    # Auto-crear lead en CRM
    try:
        from models import Lead, LeadActivity
        existing = Lead.query.filter_by(email=data.get('email', '')).first()
        if not existing:
            lead = Lead(
                name=name, email=data.get('email', ''),
                phone=_strip_html(data.get('phone', '')),
                origin='tasacion', status='nuevo',
                notes=f'Solicitó tasación: {data.get("property_type", "")} en {data.get("city", "")}',
            )
            db.session.add(lead)
            db.session.flush()
            db.session.add(LeadActivity(
                lead_id=lead.id, activity_type='system',
                title='Lead creado desde solicitud de tasación',
            ))
            db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception('Error auto-creando lead desde tasación')

    wa_link = f'https://wa.me/{WHATSAPP_NUMBER}?text=Hola%2C%20envi%C3%A9%20una%20solicitud%20de%20tasaci%C3%B3n%20desde%20Bienenhaus.'

    def _send_notifications():
        try:
            from flask import current_app
            with current_app.app_context():
                from email_service import is_configured as mail_configured, send_notification, send_tasacion_auto_reply
                from webhook_service import notify_contact_message

                if mail_configured():
                    send_notification(name, data.get('email', ''), data.get('phone', ''), 'Solicitud de tasación')
                    ok = send_tasacion_auto_reply(
                        name, data.get('email', ''),
                        property_type=data.get('property_type', ''),
                        city=data.get('city', ''),
                        phone=data.get('phone', ''),
                        motivo=data.get('motivo', ''),
                    )
                    try:
                        r = db.session.get(AppraisalRequest, req_id)
                        if r:
                            r.email_sent_at = datetime.now(timezone.utc).replace(tzinfo=None)
                            r.email_delivery_status = 'sent' if ok else 'failed'
                            db.session.commit()
                    except Exception as e2:
                        logger.error('Error al persistir email status: %s', e2)

                notify_contact_message({
                    'name': name, 'email': data.get('email', ''),
                    'phone': data.get('phone', ''), 'message': f'Tasación solicitada: {data.get("property_type", "")} en {data.get("city", "")}',
                })
                from push_service import send_to_all
                send_to_all({
                    'title': 'Nueva solicitud de tasación',
                    'body': f'{name} quiere tasar su {data.get("property_type", "propiedad")}',
                    'url': '/admin#tabTasacionRequests',
                })
        except Exception as e:
            logger.exception('Error en notificaciones de tasación: %s', e)
            sentry_sdk.capture_exception(e)
    threading.Thread(target=_send_notifications, daemon=True).start()

    return _ok({
        'message': 'Solicitud recibida. Te contactaremos pronto.',
        'whatsapp_link': wa_link,
    }, 201)


@bp.route('/api/tasacion', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_tasaciones():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 200)

    query = AppraisalRequest.query.order_by(AppraisalRequest.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return _ok({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@bp.route('/api/tasacion/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def stats():
    total = AppraisalRequest.query.count()
    pendientes = AppraisalRequest.query.filter_by(status='pendiente').count()
    return _ok({'total': total, 'pendientes': pendientes})


@bp.route('/api/tasacion/<int:rid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_tasacion(rid):
    req = AppraisalRequest.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    if 'status' in data:
        req.status = data['status']
    db.session.commit()
    return _ok(req.to_dict())


@bp.route('/api/tasacion/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_tasacion(rid):
    req = AppraisalRequest.query.get_or_404(rid)
    db.session.delete(req)
    db.session.commit()
    return _ok({'deleted': rid})


# ── POST /api/tasacion/batch — acciones masivas ───────────────────
@bp.route('/api/tasacion/batch', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def batch_tasaciones():
    data = request.get_json(silent=True) or {}
    action = data.get('action', '')
    ids = data.get('ids', [])
    if not ids:
        return _err('No se enviaron IDs.')
    if action not in ('delete', 'archive', 'unarchive'):
        return _err(f'Acción "{action}" no válida.')

    count = 0
    for rid in ids:
        req = db.session.get(AppraisalRequest, rid)
        if not req:
            continue
        if action == 'delete':
            db.session.delete(req)
        elif action == 'archive':
            req.status = 'archivada'
        elif action == 'unarchive':
            if req.status == 'archivada':
                req.status = 'pendiente'
        count += 1

    db.session.commit()
    return _ok({'action': action, 'affected': count})
