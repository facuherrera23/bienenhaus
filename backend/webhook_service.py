"""
webhook_service.py — Notificaciones vía webhook (Slack, Telegram, etc.)
"""
import json
import urllib.request
from models import Settings


def notify_contact_message(message_data):
    """Envía notificación de nuevo mensaje de contacto al webhook configurado."""
    url = Settings.get('webhook_url', '')
    if not url:
        return

    text = (
        f"📩 *Nuevo mensaje de contacto*\n"
        f"*Nombre:* {message_data.get('name', '')}\n"
        f"*Email:* {message_data.get('email', '')}\n"
        f"*Teléfono:* {message_data.get('phone', '')}\n"
        f"*Mensaje:* {message_data.get('message', '')[:500]}"
    )

    payload = _build_payload(url, text)
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, data=data,
            headers={'Content-Type': 'application/json'},
            method='POST')
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def notify_publish_error(entity_type, entity_id, title, action, portal_name, error_msg):
    """Notifica error al publicar en un portal o red social."""
    url = Settings.get('webhook_url', '')
    if not url:
        return
    emoji = '🏠' if entity_type == 'property' else '🔑'
    text = (
        f"{emoji} *Error de publicación*\n"
        f"*Tipo:* {entity_type}\n"
        f"*ID:* {entity_id}\n"
        f"*Título:* {title[:80]}\n"
        f"*Acción:* {action}\n"
        f"*Portal/Red:* {portal_name}\n"
        f"*Error:* {error_msg[:200]}"
    )
    payload = _build_payload(url, text)
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, data=data,
            headers={'Content-Type': 'application/json'},
            method='POST')
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def _build_payload(url, text):
    """Detecta el tipo de webhook y construye el payload adecuado."""
    if 'hooks.slack.com' in url:
        return {'text': text}
    if 'api.telegram.org' in url:
        return {'text': text, 'parse_mode': 'Markdown'}
    if 'discord.com' in url:
        return {'content': text}
    return {'text': text}
