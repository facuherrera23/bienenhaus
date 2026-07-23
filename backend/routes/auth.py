import time
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, session, make_response
from extensions import db, bcrypt, limiter
from models import User
from csrf import generate_token, csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR, ROLE_VIEWER, validate_password, MIN_PASSWORD_LENGTH
from utils import _ok, _err

LOCKOUT_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

bp = Blueprint('auth', __name__)


@bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("30 per minute")
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if not user:
        return _err('Usuario o contraseña incorrectos.', 401)

    # Account lockout check
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() // 60)
        return _err(f'Cuenta bloqueada. Intentá de nuevo en {remaining} minuto(s).', 429)

    if not bcrypt.check_password_hash(user.password_hash, password):
        user.login_attempts = (user.login_attempts or 0) + 1
        if user.login_attempts >= LOCKOUT_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
        db.session.commit()
        return _err('Usuario o contraseña incorrectos.', 401)

    # Successful login — reset attempts
    user.login_attempts = 0
    user.locked_until = None
    db.session.commit()

    session.clear()
    session.permanent = True
    session['admin']  = True
    session['user_id'] = user.id
    session['role']   = user.role
    session['username'] = user.username
    session['last_activity'] = time.time()
    token = generate_token()
    session.modified  = True
    return make_response(jsonify({'ok': True, 'data': {
        'message': 'Login exitoso.', 'csrf_token': token,
        'user': user.to_dict(),
    }}), 200)


@bp.route('/api/auth/logout', methods=['POST'])
@csrf_protect
def logout():
    session.clear()
    return _ok({'message': 'Sesión cerrada.'})


@bp.route('/api/auth/check', methods=['GET'])
def check_auth():
    admin = bool(session.get('admin', False))
    data = {'admin': admin}
    if admin:
        if not session.get('role'):
            session['role'] = 'admin'
            session['user_id'] = session.get('user_id', 0)
            session['username'] = session.get('username', 'admin')
            session.modified = True
        data['user'] = {
            'username': session.get('username'),
            'role': session.get('role'),
        }
    if admin and not session.get('csrf_tokens'):
        data['csrf_token'] = generate_token()
    return _ok(data)


@bp.route('/api/auth/csrf-token', methods=['GET'])
def get_csrf_token():
    token = generate_token()
    return _ok({'csrf_token': token})


@bp.route('/api/auth/change-password', methods=['POST'])
@limiter.limit("5 per minute")
@csrf_protect
@require_role(ROLE_EDITOR)
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get('current', '').strip()
    new_pass = data.get('new', '').strip()
    user_id = session.get('user_id')
    user = db.session.get(User, user_id)
    if not user or not bcrypt.check_password_hash(user.password_hash, current):
        return _err('La contraseña actual es incorrecta.', 401)
    errors = validate_password(new_pass)
    if errors:
        return _err(' | '.join(errors), 422)
    user.password_hash = bcrypt.generate_password_hash(new_pass).decode('utf-8')
    user.login_attempts = 0
    user.locked_until = None
    db.session.commit()
    session.clear()
    return _ok({'message': 'Contraseña actualizada correctamente.', 'session_expired': True})
