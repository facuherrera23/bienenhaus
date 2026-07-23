"""
routes/users.py — CRUD de usuarios del panel de administración
"""
from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from models import User
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN
from utils import _ok, _err

bp = Blueprint('users', __name__, url_prefix='/api/admin/users')


@bp.route('', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_users():
    users = User.query.order_by(User.id).all()
    return _ok([u.to_dict() for u in users])


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_user():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip().lower()
    password = data.get('password', '').strip()
    role     = data.get('role', 'editor')
    email    = data.get('email', '').strip()

    if not username or len(username) < 3:
        return _err('El usuario debe tener al menos 3 caracteres.')
    if len(password) < 6:
        return _err('La contraseña debe tener al menos 6 caracteres.')
    if role not in ('admin', 'editor', 'viewer'):
        return _err('Rol inválido. Use: admin, editor o viewer.')
    if User.query.filter_by(username=username).first():
        return _err('El nombre de usuario ya existe.')

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, email=email, password_hash=hashed, role=role)
    db.session.add(user)
    db.session.commit()
    return _ok(user.to_dict(), 201)


@bp.route('/<int:uid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_user(uid):
    user = User.query.get_or_404(uid)
    data = request.get_json(silent=True) or {}

    if 'username' in data:
        new_username = data['username'].strip().lower()
        if new_username != user.username and User.query.filter_by(username=new_username).first():
            return _err('El nombre de usuario ya existe.')
        user.username = new_username
    if 'email' in data:
        user.email = data['email'].strip()
    if 'role' in data:
        if data['role'] not in ('admin', 'editor', 'viewer'):
            return _err('Rol inválido.')
        user.role = data['role']
    if 'password' in data and data['password'].strip():
        if len(data['password'].strip()) < 6:
            return _err('La contraseña debe tener al menos 6 caracteres.')
        user.password_hash = bcrypt.generate_password_hash(data['password'].strip()).decode('utf-8')

    db.session.commit()
    return _ok(user.to_dict())


@bp.route('/<int:uid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_user(uid):
    from flask import session as sess
    if uid == sess.get('user_id'):
        return _err('No podés eliminar tu propio usuario.', 403)
    user = User.query.get_or_404(uid)
    if user.role == 'admin' and User.query.filter_by(role='admin').count() <= 1:
        return _err('Debe haber al menos un administrador.', 403)
    db.session.delete(user)
    db.session.commit()
    return _ok({'deleted': uid})
