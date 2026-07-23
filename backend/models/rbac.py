from __future__ import annotations
from typing import Any, Optional
from datetime import datetime, timezone
from extensions import db

role_permissions = db.Table(
    'role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True),
    extend_existing=True,
)

class Role(db.Model):
    __tablename__ = 'roles'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    slug        = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(300), default='')
    color       = db.Column(db.String(20), default='#20b8ab')
    is_system   = db.Column(db.Boolean, default=False)
    sort_order  = db.Column(db.Integer, default=0)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    users       = db.relationship('User', backref='rbac_role', lazy='dynamic')
    permissions = db.relationship('Permission', secondary=role_permissions, lazy='subquery',
                                  backref=db.backref('roles', lazy='dynamic'))

    def to_dict(self) -> dict:
        return {
            'id': self.id, 'name': self.name, 'slug': self.slug,
            'description': self.description, 'color': self.color,
            'is_system': self.is_system, 'sort_order': self.sort_order,
            'user_count': self.users.count() if self.id else 0,
            'permissions': [p.to_dict() for p in self.permissions] if self.id else [],
            'created_at': str(self.created_at) if self.created_at else None,
        }

class Permission(db.Model):
    __tablename__ = 'permissions'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    slug        = db.Column(db.String(80), unique=True, nullable=False)
    module      = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(300), default='')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict:
        return {
            'id': self.id, 'name': self.name, 'slug': self.slug,
            'module': self.module, 'description': self.description,
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    __table_args__ = ({'extend_existing': True},)
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device        = db.Column(db.String(100), default='')
    os            = db.Column(db.String(100), default='')
    browser       = db.Column(db.String(100), default='')
    ip            = db.Column(db.String(50), default='')
    city          = db.Column(db.String(100), default='')
    started_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    last_activity = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    active        = db.Column(db.Boolean, default=True)
    user          = db.relationship('User', backref=db.backref('user_sessions', lazy='dynamic'))

    def to_dict(self) -> dict:
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else '',
            'device': self.device, 'os': self.os, 'browser': self.browser,
            'ip': self.ip, 'city': self.city,
            'started_at': str(self.started_at) if self.started_at else None,
            'last_activity': str(self.last_activity) if self.last_activity else None,
            'active': self.active,
        }

class UserInvitation(db.Model):
    __tablename__ = 'user_invitations'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    email       = db.Column(db.String(200), nullable=False)
    token       = db.Column(db.String(100), unique=True, nullable=False)
    role_id     = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=True)
    invited_by  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status      = db.Column(db.String(20), default='pending')
    expires_at  = db.Column(db.DateTime, nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    role        = db.relationship('Role', backref='invitations')
    inviter     = db.relationship('User', backref='invitations_sent', foreign_keys=[invited_by])

    def to_dict(self) -> dict:
        return {
            'id': self.id, 'email': self.email, 'token': self.token,
            'role_id': self.role_id,
            'role_name': self.role.name if self.role else '',
            'invited_by': self.invited_by,
            'inviter_name': self.inviter.username if self.inviter else '',
            'status': self.status,
            'expires_at': str(self.expires_at) if self.expires_at else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }

class AuditUser(db.Model):
    __tablename__ = 'audit_users'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action      = db.Column(db.String(50), nullable=False)
    details     = db.Column(db.String(500), default='')
    ip          = db.Column(db.String(50), default='')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user        = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))

    def to_dict(self) -> dict:
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else 'Sistema',
            'action': self.action, 'details': self.details,
            'ip': self.ip,
            'created_at': str(self.created_at) if self.created_at else None,
        }
