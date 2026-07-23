"""
seed_demo_rbac.py — Carga roles, permisos, sesiones demo e invitaciones.
"""
from datetime import datetime, timezone, timedelta
import uuid
import random


def run(app):
    from extensions import db
    from models import Role, Permission, UserSession, UserInvitation, AuditUser, User

    if Role.query.count() > 0:
        print('[seed] RBAC data already exists, skipping.')
        return

    # ── Roles ──
    role_defs = [
        ('Administrador', 'admin', 'Acceso completo al sistema', '#20b8ab', True, 0),
        ('Gerente', 'gerente', 'Gestión de propiedades, agentes y CRM', '#4f8cf7', True, 1),
        ('Supervisor', 'supervisor', 'Supervisión de operaciones diarias', '#e8a87c', True, 2),
        ('Agente', 'agente', 'Gestión de propiedades y leads', '#9b59b6', True, 3),
        ('Marketing', 'marketing', 'Campañas y redes sociales', '#e74c3c', True, 4),
        ('Recepción', 'recepcion', 'Atención al cliente y mensajes', '#2ecc71', True, 5),
        ('Invitado', 'invitado', 'Solo lectura', '#95a5a6', True, 6),
    ]
    roles = {}
    for name, slug, desc, color, system, sort in role_defs:
        r = Role(name=name, slug=slug, description=desc, color=color, is_system=system, sort_order=sort)
        db.session.add(r)
        db.session.flush()
        roles[slug] = r

    # ── Permissions ──
    perm_defs = [
        ('dashboard', 'Ver Dashboard', 'Ver dashboard'),
        ('dashboard_export', 'Exportar Dashboard', 'Exportar datos'),
        ('properties_view', 'Ver Propiedades', 'Ver listado'),
        ('properties_create', 'Crear Propiedades', 'Crear nuevas'),
        ('properties_edit', 'Editar Propiedades', 'Editar existentes'),
        ('properties_delete', 'Eliminar Propiedades', 'Eliminar'),
        ('properties_publish', 'Publicar Propiedades', 'Publicar en portales'),
        ('crm_view', 'Ver CRM', 'Ver leads y pipeline'),
        ('crm_create', 'Crear Leads', 'Crear nuevos leads'),
        ('crm_edit', 'Editar Leads', 'Editar leads existentes'),
        ('crm_convert', 'Convertir Leads', 'Convertir a propiedades'),
        ('messages_read', 'Leer Mensajes', 'Ver mensajes'),
        ('messages_reply', 'Responder Mensajes', 'Responder'),
        ('messages_delete', 'Eliminar Mensajes', 'Eliminar'),
        ('agents_view', 'Ver Agentes', 'Ver listado'),
        ('agents_create', 'Crear Agentes', 'Crear nuevos'),
        ('agents_edit', 'Editar Agentes', 'Editar existentes'),
        ('agents_delete', 'Eliminar Agentes', 'Eliminar'),
        ('appraisals_view', 'Ver Tasaciones', 'Ver listado'),
        ('appraisals_create', 'Crear Tasaciones', 'Crear nuevas'),
        ('appraisals_edit', 'Editar Tasaciones', 'Editar'),
        ('appraisals_delete', 'Eliminar Tasaciones', 'Eliminar'),
        ('portals_view', 'Ver Portales', 'Ver portales'),
        ('portals_manage', 'Gestionar Portales', 'Administrar'),
        ('marketing_view', 'Ver Marketing', 'Ver campañas'),
        ('marketing_manage', 'Gestionar Marketing', 'Administrar'),
        ('settings_view', 'Ver Configuración', 'Ver ajustes'),
        ('settings_manage', 'Gestionar Configuración', 'Administrar'),
        ('users_view', 'Ver Usuarios', 'Ver listado'),
        ('users_manage', 'Gestionar Usuarios', 'Crear/editar/eliminar'),
        ('roles_manage', 'Gestionar Roles', 'Administrar roles y permisos'),
        ('reports_view', 'Ver Reportes', 'Ver reportes'),
    ]
    perms = {}
    for slug, name, desc in perm_defs:
        module = slug.split('_')[0]
        p = Permission(name=name, slug=slug, module=module, description=desc)
        db.session.add(p)
        db.session.flush()
        perms[slug] = p

    # Assign permissions to roles
    admin_role = roles['admin']
    admin_role.permissions = list(perms.values())

    gerente_role = roles['gerente']
    gerente_role.permissions = [v for k, v in perms.items() if not k.startswith('users_') and not k.startswith('roles_') and not k.startswith('settings_manage')]

    supervisor_role = roles['supervisor']
    supervisor_role.permissions = [v for k, v in perms.items() if k in [
        'dashboard', 'properties_view', 'properties_edit', 'crm_view', 'crm_edit',
        'messages_read', 'messages_reply', 'agents_view', 'appraisals_view',
        'portals_view', 'reports_view',
    ]]

    agente_role = roles['agente']
    agente_role.permissions = [v for k, v in perms.items() if k in [
        'dashboard', 'properties_view', 'properties_create', 'properties_edit',
        'crm_view', 'crm_create', 'crm_edit', 'messages_read', 'messages_reply',
        'appraisals_view', 'appraisals_create',
    ]]

    marketing_role = roles['marketing']
    marketing_role.permissions = [v for k, v in perms.items() if k in [
        'dashboard', 'marketing_view', 'marketing_manage', 'portals_view',
        'messages_read', 'properties_view',
    ]]

    recepcion_role = roles['recepcion']
    recepcion_role.permissions = [v for k, v in perms.items() if k in [
        'messages_read', 'messages_reply', 'crm_view', 'crm_create',
    ]]

    invitado_role = roles['invitado']
    invitado_role.permissions = [v for k, v in perms.items() if k in [
        'dashboard', 'properties_view', 'crm_view', 'messages_read', 'agents_view',
        'appraisals_view', 'portals_view',
    ]]

    # ── Update existing admin user ──
    admin_user = User.query.filter_by(username='admin').first()
    if admin_user:
        admin_user.role_id = roles['admin'].id
        admin_user.display_name = 'Administrador'

    # ── Demo sessions ──
    demo_users = User.query.all()
    browsers = ['Chrome 120', 'Firefox 121', 'Edge 120', 'Safari 17', 'Chrome 119']
    devices = ['Windows 11', 'macOS 14', 'Linux', 'Windows 10', 'iOS 17']
    ips = ['192.168.1.' + str(random.randint(100, 200)) for _ in range(5)]
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if demo_users:
        for _ in range(8):
            u = random.choice(demo_users)
            started = now - timedelta(hours=random.randint(1, 72))
            us = UserSession(
                user_id=u.id,
                device=random.choice(devices),
                os=random.choice(devices),
                browser=random.choice(browsers),
                ip=random.choice(ips),
                city=random.choice(['Córdoba', 'Buenos Aires', 'Rosario', 'Mendoza', '']),
                started_at=started,
                last_activity=now - timedelta(minutes=random.randint(0, 120)),
                active=random.choice([True, False]),
            )
            db.session.add(us)

    # ── Demo invitations ──
    for email in ['maria@bienenhaus.com.ar', 'carlos@bienenhaus.com.ar']:
        invite = UserInvitation(
            email=email,
            token=str(uuid.uuid4()),
            role_id=random.choice(list(roles.values())).id,
            invited_by=admin_user.id if admin_user else None,
            status='pending',
            expires_at=now + timedelta(days=7),
        )
        db.session.add(invite)

    # ── Demo audit logs ──
    actions = ['login', 'logout', 'login', 'login', 'password_change', 'role_change', 'user_created', 'login']
    for _ in range(15):
        u = random.choice(demo_users) if demo_users else None
        audit = AuditUser(
            user_id=u.id if u else None,
            action=random.choice(actions),
            details='',
            ip=random.choice(ips),
            created_at=now - timedelta(hours=random.randint(1, 168)),
        )
        db.session.add(audit)

    db.session.commit()
    print(f'[seed] Created {len(role_defs)} roles, {len(perm_defs)} permissions, demo sessions/invitations/audit.')
