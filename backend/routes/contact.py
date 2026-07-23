"""
routes/contact.py — Formulario de contacto y gestión de mensajes
"""
import os
import time
import logging
import threading
from flask import Blueprint, request, jsonify
import sentry_sdk

logger = logging.getLogger(__name__)
from extensions import db, limiter
from models import ContactMessage
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR
from utils import _ok, _err, _strip_html

bp = Blueprint('contact', __name__)


# ── POST /api/contact ─────────────────────────────────────────────────
@bp.route('/api/contact', methods=['POST'])
@limiter.limit("5 per minute")
@csrf_protect
def contact():
    data = request.get_json(silent=True) or {}

    # Anti-spam: honeypot
    if data.get('_website'):
        return _err('Spam detectado.')

    # Anti-spam: timestamp (≤ 3s desde carga → bot)
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
    msg = ContactMessage(
        name    = name,
        email   = data.get('email', ''),
        phone   = _strip_html(data.get('phone', '')),
        message = _strip_html(data.get('message', '')),
        motivo  = _strip_html(data.get('motivo', '')),
        read    = False,
    )
    db.session.add(msg)
    db.session.commit()

    # Auto-crear lead en CRM
    try:
        from models import Lead, LeadActivity
        existing = Lead.query.filter_by(email=data.get('email', '')).first()
        if not existing:
            lead = Lead(
                name=name, email=data.get('email', ''),
                phone=_strip_html(data.get('phone', '')),
                origin='contacto', status='nuevo',
                notes=f'Mensaje: {_strip_html(data.get("message", ""))[:300]}',
            )
            db.session.add(lead)
            db.session.flush()
            db.session.add(LeadActivity(
                lead_id=lead.id, activity_type='system',
                title='Lead creado desde formulario de contacto',
            ))
            db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception('Error auto-creando lead desde contacto')

    # Enviar notificación por email (no bloqueante)
    def _send_notifications():
        try:
            from flask import current_app
            with current_app.app_context():
                from email_service import is_configured as mail_configured, send_notification, send_auto_reply
                if mail_configured():
                    send_notification(name, data.get('email', ''), data.get('phone', ''), data.get('message', ''))
                    send_auto_reply(name, data.get('email', ''))
                from webhook_service import notify_contact_message
                notify_contact_message({
                    'name': name, 'email': data.get('email', ''),
                    'phone': data.get('phone', ''), 'message': data.get('message', ''),
                })
                from push_service import send_to_all
                send_to_all({
                    'title': 'Nuevo mensaje de contacto',
                    'body': f'{name}: {data.get("message", "")[:120]}',
                    'url': '/admin#tabMessages',
                })
        except Exception as e:
            logger.exception('Error en notificaciones de contacto: %s', e)
            sentry_sdk.capture_exception(e)
    threading.Thread(target=_send_notifications, daemon=True).start()

    return _ok({'message': 'Mensaje recibido. Te contactaremos pronto.'}, 201)


# ── GET /api/contact/messages ─────────────────────────────────────────
@bp.route('/api/contact/messages', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_messages():
    msgs = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    unread = sum(1 for m in msgs if not m.read)
    return _ok({'messages': [m.to_dict() for m in msgs], 'unread': unread})


@bp.route('/api/contact/test-email', methods=['POST'])
@limiter.limit("3 per minute")
@csrf_protect
@require_role(ROLE_ADMIN)
def test_email():
    data = request.get_json(silent=True) or {}
    from email_service import _get_config, _send
    cfg = _get_config()
    if data.get('smtp_host'):
        cfg['host'] = data['smtp_host']
    if data.get('smtp_port'):
        try:
            cfg['port'] = int(data['smtp_port'])
        except (ValueError, TypeError):
            pass
    if data.get('smtp_user'):
        cfg['user'] = data['smtp_user']
    if data.get('smtp_pass'):
        cfg['password'] = data['smtp_pass']
    if data.get('email_from'):
        cfg['from'] = data['email_from']
    to = data.get('email_to', '') or cfg['to']
    if not cfg['host'] or not to:
        return _err('Completá servidor SMTP y email destino.')
    ok = _send(cfg, to, '🔧 Prueba Bienenhaus', 'Este es un email de prueba desde el panel de Bienenhaus. Si recibís esto, la configuración SMTP funciona correctamente.')
    if ok:
        return _ok({'message': 'Email de prueba enviado.'})
    return _err('No se pudo enviar el email de prueba. Revisá la configuración SMTP.')


# ── PATCH /api/contact/messages/<id>/read — marcar leído/no leído ─────
@bp.route('/api/contact/messages/<int:mid>/read', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def toggle_read(mid):
    msg = ContactMessage.query.get_or_404(mid)
    body = request.get_json(silent=True) or {}
    msg.read = body.get('read', not msg.read)
    db.session.commit()
    return _ok(msg.to_dict())


# ── DELETE /api/contact/messages/<id> ────────────────────────────────
@bp.route('/api/contact/messages/<int:mid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_message(mid):
    msg = ContactMessage.query.get_or_404(mid)
    db.session.delete(msg)
    db.session.commit()
    return _ok({'deleted': mid})


# ── DELETE /api/contact/messages — eliminar todos ─────────────────────
@bp.route('/api/contact/messages', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_all_messages():
    n = ContactMessage.query.delete()
    db.session.commit()
    return _ok({'deleted': n})
