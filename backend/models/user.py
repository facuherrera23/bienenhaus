from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = ({'extend_existing': True},)

    id             = db.Column(db.Integer, primary_key=True)
    username       = db.Column(db.String(80), unique=True, nullable=False)
    email          = db.Column(db.String(200), default='')
    password_hash  = db.Column(db.String(200), nullable=False)
    role           = db.Column(db.String(20), nullable=False, default='editor')
    role_id        = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=True)
    display_name   = db.Column(db.String(200), default='')
    avatar_url     = db.Column(db.String(500), default='')
    is_active      = db.Column(db.Boolean, default=True)
    last_login     = db.Column(db.DateTime, nullable=True)
    last_ip        = db.Column(db.String(50), default='')
    login_attempts = db.Column(db.Integer, default=0)
    locked_until   = db.Column(db.DateTime, nullable=True)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    role_obj       = db.relationship('Role', foreign_keys=[role_id], overlaps="rbac_role,users")

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'username': self.username,
            'display_name': self.display_name or self.username,
            'email': self.email, 'role': self.role,
            'role_id': self.role_id,
            'role_name': self.rbac_role.name if self.rbac_role else self.role,
            'role_color': self.rbac_role.color if self.rbac_role else '#20b8ab',
            'avatar_url': self.avatar_url,
            'is_active': self.is_active,
            'last_login': str(self.last_login) if self.last_login else None,
            'last_ip': self.last_ip,
            'login_attempts': self.login_attempts,
            'locked_until': str(self.locked_until) if self.locked_until else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }

    def to_full_dict(self) -> dict[str, Any]:
        from .rbac import UserSession, AuditUser, Role
        d = self.to_dict()
        try:
            d['sessions'] = [s.to_dict() for s in self.user_sessions.order_by(UserSession.last_activity.desc()).limit(10).all()] if hasattr(self, 'user_sessions') else []
        except Exception:
            d['sessions'] = []
        try:
            d['audit'] = [a.to_dict() for a in self.audit_logs.order_by(AuditUser.created_at.desc()).limit(20).all()] if hasattr(self, 'audit_logs') else []
        except Exception:
            d['audit'] = []
        try:
            from extensions import db
            role = db.session.get(Role, self.role_id) if self.role_id else None
            d['permissions'] = [p.to_dict() for p in role.permissions] if role else []
        except Exception:
            d['permissions'] = []
        return d
