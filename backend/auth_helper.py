"""
auth_helper.py — Roles de usuario, seed y protección de rutas
"""
import os
from functools import wraps
from flask import session, jsonify
from extensions import db, bcrypt
from models import User

ROLE_ADMIN  = 'admin'
ROLE_EDITOR = 'editor'
ROLE_VIEWER = 'viewer'

ROLE_HIERARCHY = {ROLE_VIEWER: 0, ROLE_EDITOR: 1, ROLE_ADMIN: 2}


import re

MIN_PASSWORD_LENGTH = 8

def validate_password(password):
    """Valida que la contraseña cumpla con la política de seguridad."""
    errors = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f'Debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.')
    if not re.search(r'[A-Z]', password):
        errors.append('Debe contener al menos una mayúscula.')
    if not re.search(r'[0-9]', password):
        errors.append('Debe contener al menos un número.')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]', password):
        errors.append('Debe contener al menos un caracter especial (!@#$% etc.).')
    return errors


def seed_admin_user():
    """Crea el admin si no existe. Si ya existe, NO toca nada (no actualiza password)."""
    from sqlalchemy.exc import OperationalError, ProgrammingError
    import logging
    _log = logging.getLogger(__name__)
    password = os.environ.get('ADMIN_PASSWORD', 'Admin123!')

    pw_errors = validate_password(password)
    if pw_errors:
        _log.warning('ADMIN_PASSWORD no cumple la política de seguridad: %s', '; '.join(pw_errors))

    try:
        user = User.query.filter_by(username='admin').first()
        if user:
            return  # admin ya existe — NO tocar password, NO tocar nada
        
        # Crear admin nuevo solo si no existía
        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(
            username='admin',
            email='admin@bienenhaus.com.ar',
            password_hash=hashed,
            role=ROLE_ADMIN,
        )
        db.session.add(user)
        db.session.commit()
    except (OperationalError, ProgrammingError) as e:
        _log.warning('seed_admin_user: tabla User no disponible (migración pendiente): %s', e)
        return


def require_role(min_role=ROLE_ADMIN):
    """Decorador: requiere sesión admin con rol >= min_role."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not session.get('admin'):
                return jsonify({'ok': False, 'error': 'No autorizado.'}), 401
            user_role = session.get('role', ROLE_VIEWER)
            if ROLE_HIERARCHY.get(user_role, 0) < ROLE_HIERARCHY.get(min_role, 0):
                return jsonify({'ok': False, 'error': 'Permisos insuficientes.'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
