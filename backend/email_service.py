"""
email_service.py — Envío de emails vía SMTP o SendGrid
Configuración vía Settings de la DB o variables de entorno.
"""
from __future__ import annotations
import os
import smtplib
import ssl
import logging
from typing import Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def _get_config() -> dict[str, Any]:
    return {
        'host':     Settings.get('smtp_host', '')  or os.getenv('SMTP_HOST', ''),
        'port':     int(Settings.get('smtp_port', '587') or os.getenv('SMTP_PORT', '587')),
        'user':     Settings.get('smtp_user', '')  or os.getenv('SMTP_USER', ''),
        'password': Settings.get('smtp_pass', '')  or os.getenv('SMTP_PASS', ''),
        'from':     Settings.get('email_from', '') or os.getenv('EMAIL_FROM', ''),
        'to':       Settings.get('email_to', '')   or os.getenv('EMAIL_TO', ''),
        'use_tls':  True,
    }


def is_configured() -> bool:
    cfg = _get_config()
    return bool(cfg['host'] and cfg['user'] and cfg['to'])


def send_notification(name: str, email: str, phone: str, message: str) -> bool:
    """Envía notificación al admin cuando alguien completa el formulario."""
    cfg = _get_config()
    if not cfg['to']:
        return False

    subject = f'✉️ Nuevo contacto: {name}'
    body = f"""
Nuevo mensaje desde el formulario de contacto de Bienenhaus.

─ Datos del contacto ─
Nombre:  {name}
Email:   {email or '—'}
Teléfono:{phone or '—'}

─ Mensaje ─
{message}

─ Fin del mensaje ─
    """.strip()

    success = _send(cfg, cfg['to'], subject, body)
    return success


def send_auto_reply(name: str, email: str) -> bool:
    """Envía auto-respuesta al usuario que completó el formulario."""
    if not email:
        return False
    cfg = _get_config()
    if not cfg['from']:
        return False

    subject = 'Recibimos tu consulta — Bienenhaus Propiedades'
    body = f"""
Hola {name},

Gracias por contactarte con Bienenhaus Propiedades.

Recibimos tu mensaje y nos pondremos en contacto a la brevedad.
Si tu consulta es urgente, no dudes en escribirnos al WhatsApp.

Saludos cordiales,
Equipo Bienenhaus
    """.strip()

    success = _send(cfg, email, subject, body)
    return success


def send_tasacion_auto_reply(name: str, email: str, property_type: str = '', city: str = '', phone: str = '', motivo: str = '') -> bool:
    """Envía auto-respuesta al usuario que solicitó una tasación."""
    if not email:
        return False
    cfg = _get_config()
    if not cfg['from']:
        return False

    subject = 'Recibimos tu solicitud de tasación — Bienenhaus Propiedades'
    prop_label = property_type or 'tu propiedad'
    wa_number = os.getenv('WHATSAPP_NUMBER', '5493510000000')
    body = f"""
Hola {name},

Gracias por confiar en Bienenhaus Propiedades para tasar {prop_label}.

Recibimos tu solicitud con los siguientes datos:

  Motivo:            {motivo or '—'}
  Tipo de propiedad: {property_type or '—'}
  Ciudad:            {city or '—'}
  Teléfono:          {phone or '—'}
  Email:             {email or '—'}

Nuestro equipo se pondrá en contacto a la brevedad.
El tiempo estimado de respuesta es de menos de 24 horas hábiles.

Si tu consulta es urgente, podés escribirnos directamente a nuestro WhatsApp:
  https://wa.me/{wa_number}?text=Hola%2C%20envi%C3%A9%20una%20solicitud%20de%20tasaci%C3%B3n%20desde%20Bienenhaus.

Saludos cordiales,
Equipo Bienenhaus Propiedades
    """.strip()

    success = _send(cfg, email, subject, body)
    return success


def send_tasacion_completada(name: str, email: str, titulo: str, valor_estimado_usd: float, property_type: str = '', appraisal_id: int = 0) -> bool:
    """Notifica al cliente que su tasación está completa."""
    if not email:
        return False
    cfg = _get_config()
    if not cfg['from']:
        return False

    subject = 'Tu tasación está lista — Bienenhaus Propiedades'
    wa_number = os.getenv('WHATSAPP_NUMBER', '5493510000000')
    body = f"""
Hola {name},

¡Tu tasación está completa!

  Propiedad:       {titulo or property_type or '—'}
  Valor estimado:  USD {valor_estimado_usd:,.2f}

Podés consultar los detalles completos ingresando al panel de Bienenhaus.

Si tenés alguna pregunta, respondé a este correo o escribinos a nuestro WhatsApp:
  https://wa.me/{wa_number}

Saludos cordiales,
Equipo Bienenhaus Propiedades
    """.strip()

    success = _send(cfg, email, subject, body)
    return success


def _send(cfg: dict[str, Any], to: str, subject: str, body: str) -> bool:
    try:
        msg = MIMEMultipart('alternative')
        msg['From']    = cfg['from']
        msg['To']      = to
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        if cfg.get('use_tls', True):
            context = ssl.create_default_context()
            with smtplib.SMTP(cfg['host'], cfg['port']) as server:
                server.starttls(context=context)
                server.login(cfg['user'], cfg['password'])
                server.sendmail(cfg['from'], [to], msg.as_string())
        else:
            with smtplib.SMTP(cfg['host'], cfg['port']) as server:
                server.login(cfg['user'], cfg['password'])
                server.sendmail(cfg['from'], [to], msg.as_string())

        logger.info('Notificación enviada a %s', to)
        return True
    except Exception as e:
        logger.error('Error al enviar email: %s', e)
        return False


# Import diferido para evitar circular imports
from models import Settings
