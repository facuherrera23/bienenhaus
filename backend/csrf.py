"""
csrf.py — Protección CSRF manual (sin dependencias externas)
Soporta múltiples tokens por sesión (multi-tab).
"""
import secrets
from functools import wraps
from flask import session, request, jsonify

MAX_TOKENS = 20


def generate_token():
    """Genera un token y lo agrega al pool de la sesión."""
    token = secrets.token_hex(32)
    tokens = session.get('csrf_tokens', [])
    tokens.append(token)
    if len(tokens) > MAX_TOKENS:
        tokens = tokens[-MAX_TOKENS:]
    session['csrf_tokens'] = tokens
    session.modified = True
    return token


def validate_token(token):
    """Valida que el token esté en el pool de la sesión y lo consume (single-use)."""
    stored = session.get('csrf_tokens', [])
    if not stored or not token:
        return False
    for i, t in enumerate(stored):
        if secrets.compare_digest(t, token):
            stored.pop(i)
            session['csrf_tokens'] = stored
            session.modified = True
            return True
    return False


def _in_test() -> bool:
    """Detecta si el conftest de backend pidió bypass CSRF."""
    import os
    return os.environ.get('CSRF_BYPASS') == '1'


def csrf_protect(f):
    """
    Decorador: rechaza requests mutantes sin token CSRF válido.
    El token se lee del header X-CSRF-Token.
    Se omite automáticamente durante tests (PYTEST_CURRENT_TEST).
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return f(*args, **kwargs)

        if _in_test():
            return f(*args, **kwargs)

        token = request.headers.get('X-CSRF-Token', '')
        if not validate_token(token):
            return jsonify({'ok': False, 'error': 'Token CSRF inválido. Recargá la página e intentá de nuevo.'}), 403

        return f(*args, **kwargs)
    return wrapper
