from datetime import datetime, timezone, timedelta
import uuid
import platform
from flask import request, session, jsonify
from sqlalchemy import func
from extensions import db, bcrypt
from models import User, Role, Permission, UserSession, UserInvitation, AuditUser
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR, validate_password
from utils import _ok, _err

from . import bp

SYSTEM_ROLES = ['admin', 'gerente', 'supervisor', 'agente', 'marketing', 'recepcion', 'invitado']

# ── Helpers ──

def _log_audit(user_id, action, details='', ip=''):
    log = AuditUser(user_id=user_id, action=action, details=details, ip=ip)
    db.session.add(log)
    db.session.commit()

def _get_client_ip():
    return request.remote_addr or request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or ''

# ── Dashboard ──

@bp.route('/dashboard', methods=['GET'])
@require_role(ROLE_ADMIN)
def dashboard():
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    inactive_users = total_users - active_users
    roles_count = Role.query.count()
    permissions_count = Permission.query.count()
    active_sessions = UserSession.query.filter_by(active=True).count()
    pending_invites = UserInvitation.query.filter_by(status='pending').count()
    admins = User.query.filter_by(role='admin').count()
    recent_logins = AuditUser.query.filter_by(action='login').order_by(AuditUser.created_at.desc()).limit(8).all()
    return _ok({
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': inactive_users,
        'roles_count': roles_count,
        'permissions_count': permissions_count,
        'active_sessions': active_sessions,
        'pending_invites': pending_invites,
        'admins': admins,
        'recent_logins': [{
            'username': l.user.username if l.user else '?',
            'time': str(l.created_at) if l.created_at else '',
            'ip': l.ip,
        } for l in recent_logins],
    })

# ── Users CRUD ──

@bp.route('/users', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_users():
    users = User.query.order_by(User.is_active.desc(), User.username.asc()).all()
    result = []
    for u in users:
        d = u.to_dict()
        last_session = UserSession.query.filter_by(user_id=u.id).order_by(UserSession.last_activity.desc()).first()
        d['last_login'] = str(u.last_login) if u.last_login else None
        d['last_ip'] = u.last_ip or (last_session.ip if last_session else '')
        d['active_sessions'] = UserSession.query.filter_by(user_id=u.id, active=True).count()
        d['role_name'] = u.role_obj.name if u.role_obj else u.role
        d['role_color'] = u.role_obj.color if u.role_obj else '#20b8ab'
        result.append(d)
    return _ok(result)

@bp.route('/users/<int:uid>', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_user_detail(uid):
    user = db.session.get(User, uid)
    if not user:
        return _err('Usuario no encontrado', 404)
    return _ok(user.to_full_dict())

@bp.route('/users', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_user():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip().lower()
    password = data.get('password', '').strip()
    role_id = data.get('role_id')
    email = data.get('email', '').strip()
    display_name = data.get('display_name', '').strip() or username
    if not username or len(username) < 3:
        return _err('El usuario debe tener al menos 3 caracteres.')
    if len(password) < 6:
        return _err('La contraseña debe tener al menos 6 caracteres.')
    if User.query.filter_by(username=username).first():
        return _err('El nombre de usuario ya existe.')
    role_obj = None
    role_slug = 'editor'
    if role_id:
        role_obj = db.session.get(Role, role_id)
        if role_obj:
            role_slug = role_obj.slug
    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        username=username, email=email, display_name=display_name,
        password_hash=hashed, role=role_slug, role_id=role_id,
    )
    db.session.add(user)
    db.session.commit()
    _log_audit(session.get('user_id'), 'user_created', f'Usuario {username} creado', _get_client_ip())
    return _ok(user.to_dict(), 201)

@bp.route('/users/<int:uid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_user(uid):
    user = db.session.get(User, uid)
    if not user:
        return _err('Usuario no encontrado', 404)
    data = request.get_json(silent=True) or {}
    if 'username' in data:
        new_username = data['username'].strip().lower()
        if new_username != user.username and User.query.filter_by(username=new_username).first():
            return _err('El nombre de usuario ya existe.')
        user.username = new_username
    if 'email' in data:
        user.email = data['email'].strip()
    if 'display_name' in data:
        user.display_name = data['display_name'].strip()
    if 'role_id' in data:
        role_id = data['role_id']
        if role_id:
            role_obj = db.session.get(Role, role_id)
            if role_obj:
                user.role_id = role_id
                user.role = role_obj.slug
        else:
            user.role_id = None
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    if 'password' in data and data['password'].strip():
        pw = data['password'].strip()
        if len(pw) < 6:
            return _err('La contraseña debe tener al menos 6 caracteres.')
        user.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')
    db.session.commit()
    _log_audit(session.get('user_id'), 'user_updated', f'Usuario {user.username} actualizado', _get_client_ip())
    return _ok(user.to_dict())

@bp.route('/users/<int:uid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_user(uid):
    if uid == session.get('user_id'):
        return _err('No podés eliminar tu propio usuario.', 403)
    user = db.session.get(User, uid)
    if not user:
        return _err('Usuario no encontrado', 404)
    if user.role == 'admin' and User.query.filter_by(role='admin').count() <= 1:
        return _err('Debe haber al menos un administrador.', 403)
    username = user.username
    db.session.delete(user)
    db.session.commit()
    _log_audit(session.get('user_id'), 'user_deleted', f'Usuario {username} eliminado', _get_client_ip())
    return _ok({'deleted': uid})

# ── Roles CRUD ──

@bp.route('/roles', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_roles():
    roles = Role.query.order_by(Role.sort_order.asc(), Role.id.asc()).all()
    return _ok([r.to_dict() for r in roles])

@bp.route('/roles/<int:rid>', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_role(rid):
    role = db.session.get(Role, rid)
    if not role:
        return _err('Rol no encontrado', 404)
    return _ok(role.to_dict())

@bp.route('/roles', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_role():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    slug = data.get('slug', '').strip().lower().replace(' ', '_')
    if not name or not slug:
        return _err('Nombre y slug son requeridos.', 400)
    if Role.query.filter_by(slug=slug).first():
        return _err('El slug ya existe.', 400)
    role = Role(
        name=name, slug=slug,
        description=data.get('description', ''),
        color=data.get('color', '#20b8ab'),
        sort_order=data.get('sort_order', 0),
    )
    db.session.add(role)
    db.session.commit()
    permission_ids = data.get('permission_ids', [])
    if permission_ids:
        perms = Permission.query.filter(Permission.id.in_(permission_ids)).all()
        role.permissions = perms
        db.session.commit()
    _log_audit(session.get('user_id'), 'role_created', f'Rol {name} creado', _get_client_ip())
    return _ok(role.to_dict(), 201)

@bp.route('/roles/<int:rid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_role(rid):
    role = db.session.get(Role, rid)
    if not role:
        return _err('Rol no encontrado', 404)
    data = request.get_json(silent=True) or {}
    if 'name' in data:
        role.name = data['name'].strip()
    if 'description' in data:
        role.description = data['description'].strip()
    if 'color' in data:
        role.color = data['color'].strip()
    if 'sort_order' in data:
        role.sort_order = data['sort_order']
    if 'permission_ids' in data:
        perms = Permission.query.filter(Permission.id.in_(data['permission_ids'])).all()
        role.permissions = perms
    db.session.commit()
    _log_audit(session.get('user_id'), 'role_updated', f'Rol {role.name} actualizado', _get_client_ip())
    return _ok(role.to_dict())

@bp.route('/roles/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_role(rid):
    role = db.session.get(Role, rid)
    if not role:
        return _err('Rol no encontrado', 404)
    if role.is_system:
        return _err('No se puede eliminar un rol del sistema.', 403)
    if role.users.count() > 0:
        return _err('No se puede eliminar un rol con usuarios asignados.', 400)
    db.session.delete(role)
    db.session.commit()
    _log_audit(session.get('user_id'), 'role_deleted', f'Rol {role.name} eliminado', _get_client_ip())
    return _ok({'deleted': rid})

# ── Permissions ──

@bp.route('/permissions', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_permissions():
    perms = Permission.query.order_by(Permission.module, Permission.id).all()
    modules = {}
    for p in perms:
        modules.setdefault(p.module, []).append(p.to_dict())
    return _ok({
        'permissions': [p.to_dict() for p in perms],
        'grouped': modules,
    })

@bp.route('/permissions', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_permission():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    slug = data.get('slug', '').strip().lower().replace(' ', '_')
    module = data.get('module', '').strip()
    if not name or not slug or not module:
        return _err('Nombre, slug y módulo son requeridos.', 400)
    if Permission.query.filter_by(slug=slug).first():
        return _err('El slug ya existe.', 400)
    perm = Permission(name=name, slug=slug, module=module, description=data.get('description', ''))
    db.session.add(perm)
    db.session.commit()
    return _ok(perm.to_dict(), 201)

# ── Invitations ──

@bp.route('/invitations', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_invitations():
    invites = UserInvitation.query.order_by(UserInvitation.created_at.desc()).all()
    return _ok([i.to_dict() for i in invites])

@bp.route('/invitations', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_invitation():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    role_id = data.get('role_id')
    if not email or '@' not in email:
        return _err('Email inválido.', 400)
    if UserInvitation.query.filter_by(email=email, status='pending').first():
        return _err('Ya hay una invitación pendiente para este email.', 400)
    invite = UserInvitation(
        email=email,
        token=str(uuid.uuid4()),
        role_id=role_id,
        invited_by=session.get('user_id'),
        status='pending',
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db.session.add(invite)
    db.session.commit()
    _log_audit(session.get('user_id'), 'invitation_sent', f'Invitación enviada a {email}', _get_client_ip())
    return _ok(invite.to_dict(), 201)

@bp.route('/invitations/<int:iid>/resend', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def resend_invitation(iid):
    invite = db.session.get(UserInvitation, iid)
    if not invite:
        return _err('Invitación no encontrada', 404)
    invite.token = str(uuid.uuid4())
    invite.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7)
    db.session.commit()
    return _ok({'resent': True, 'token': invite.token})

@bp.route('/invitations/<int:iid>/cancel', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def cancel_invitation(iid):
    invite = db.session.get(UserInvitation, iid)
    if not invite:
        return _err('Invitación no encontrada', 404)
    invite.status = 'cancelled'
    db.session.commit()
    return _ok({'cancelled': True})

@bp.route('/invitations/<int:iid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_invitation(iid):
    invite = db.session.get(UserInvitation, iid)
    if not invite:
        return _err('Invitación no encontrada', 404)
    db.session.delete(invite)
    db.session.commit()
    return _ok({'deleted': iid})

# ── Sessions ──

@bp.route('/sessions', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_sessions():
    sessions_q = UserSession.query.order_by(UserSession.last_activity.desc()).limit(50).all()
    return _ok([s.to_dict() for s in sessions_q])

@bp.route('/sessions/<int:sid>/terminate', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def terminate_session(sid):
    sess = db.session.get(UserSession, sid)
    if not sess:
        return _err('Sesión no encontrada', 404)
    sess.active = False
    db.session.commit()
    return _ok({'terminated': sid})

# ── Audit ──

@bp.route('/audit', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_audit():
    audit = AuditUser.query.order_by(AuditUser.created_at.desc()).limit(100).all()
    return _ok([a.to_dict() for a in audit])

@bp.route('/audit/user/<int:uid>', methods=['GET'])
@require_role(ROLE_ADMIN)
def user_audit(uid):
    audit = AuditUser.query.filter_by(user_id=uid).order_by(AuditUser.created_at.desc()).limit(50).all()
    return _ok([a.to_dict() for a in audit])

# ── User quick actions ──

@bp.route('/users/<int:uid>/toggle-active', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def toggle_user_active(uid):
    user = db.session.get(User, uid)
    if not user:
        return _err('Usuario no encontrado', 404)
    if user.id == session.get('user_id'):
        return _err('No podés desactivar tu propio usuario.', 403)
    user.is_active = not user.is_active
    db.session.commit()
    return _ok({'is_active': user.is_active})

@bp.route('/users/<int:uid>/sessions', methods=['GET'])
@require_role(ROLE_ADMIN)
def user_sessions(uid):
    user = db.session.get(User, uid)
    if not user:
        return _err('Usuario no encontrado', 404)
    sess = UserSession.query.filter_by(user_id=uid).order_by(UserSession.last_activity.desc()).limit(20).all()
    return _ok([s.to_dict() for s in sess])
