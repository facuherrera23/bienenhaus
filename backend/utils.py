"""
utils.py — Utilidades compartidas · Bienenhaus Propiedades
"""
import os
import re
import base64
import logging
import ipaddress
from datetime import datetime, date
from typing import Any, Callable, Optional, TypeVar, Union
from urllib.parse import urlparse
from flask import Response, jsonify
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

logger = logging.getLogger(__name__)

T = TypeVar('T', float, int)


def _n(v: Any, t: type[T] | Callable[[Any], T] = float) -> T:
    if v is None or v == '':
        return t(0)
    try:
        return t(v)
    except (ValueError, TypeError):
        return t(0)


def _strip_html(value: Any) -> str:
    if not value or not isinstance(value, str):
        return value or ''
    return re.sub(r'<[^>]*>', '', value).strip()


def _parse_date(val: Any) -> date | None:
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return datetime.strptime(val.strip(), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            pass
    return None


ALLOWED_EXTRACT_DOMAINS: set[str] = {
    'mercadolibre.com.ar',
    'mercadolibre.com',
    'inmuebles.mercadolibre.com.ar',
    'zonaprop.com.ar',
    'argenprop.com',
}


def _validate_url(url: Any) -> tuple[Optional[str], Optional[str]]:
    if not url or not url.strip():
        return None, 'URL requerida.'
    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception:
        return None, 'URL inválida.'
    hostname = parsed.hostname
    if not hostname:
        return None, 'URL sin host.'
    hostname = hostname.lower()

    internal_names = {'localhost', '127.0.0.1', '::1', '0.0.0.0'}
    if hostname in internal_names:
        return None, 'URL bloqueada (host interno).'

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return None, 'URL bloqueada (dirección interna).'
    except ValueError:
        pass

    if hostname == '169.254.169.254':
        return None, 'URL bloqueada (metadata cloud).'
    if hostname.endswith('.internal'):
        return None, 'URL bloqueada (host interno).'

    if not any(hostname == d or hostname.endswith('.' + d) for d in ALLOWED_EXTRACT_DOMAINS):
        return None, 'Dominio no permitido. Usá MercadoLibre, ZonaProp o Argenprop.'

    return url, None


def _html_escape(value: Any) -> str:
    if value is None:
        return ''
    s = str(value)
    return (
        s.replace('&', '&amp;')
         .replace('<', '&lt;')
         .replace('>', '&gt;')
         .replace('"', '&quot;')
         .replace("'", '&#39;')
    )


def _ok(data: Any = None, status: int = 200) -> tuple[Response, int]:
    return jsonify({'ok': True, 'data': data}), status


def _err(msg: str, status: int = 400) -> tuple[Response, int]:
    return jsonify({'ok': False, 'error': msg}), status


_ENCRYPTION_SALT: bytes = b'bienenhaus-cfg-v1'
_FERNET_INSTANCE: Fernet | None = None


def _get_fernet() -> Fernet:
    global _FERNET_INSTANCE
    if _FERNET_INSTANCE is not None:
        return _FERNET_INSTANCE
    key = os.environ.get('SECRET_KEY', '')
    if not key:
        raise RuntimeError('SECRET_KEY no configurada — requerida para cifrado')
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_ENCRYPTION_SALT,
        info=b'portal-config-encryption',
    )
    f_key = base64.urlsafe_b64encode(hkdf.derive(key.encode()))
    _FERNET_INSTANCE = Fernet(f_key)
    return _FERNET_INSTANCE


SENSITIVE_CONFIG_KEYS: set[str] = {
    'access_token',
    'refresh_token',
    'client_secret',
    'sftp_pass',
}


def encrypt_value(plaintext: str | None) -> str | None:
    if not plaintext:
        return plaintext
    result = _get_fernet().encrypt(plaintext.encode()).decode()
    return str(result) if result is not None else None


def decrypt_value(ciphertext: str | None) -> str | None:
    if not ciphertext:
        return ciphertext
    if not ciphertext.startswith('gAAAAA'):
        return ciphertext
    try:
        result = _get_fernet().decrypt(ciphertext.encode()).decode()
        return str(result) if result is not None else None
    except Exception as e:
        logger.error('Error desencriptando valor cifrado: %s', e)
        raise ValueError(
            'Error al desencriptar config del portal. '
            '¿SECRET_KEY cambió o datos corruptos?'
        )
