from __future__ import annotations
from typing import Any
from datetime import datetime, timezone
from extensions import db


class SecurityEvent(db.Model):
    __tablename__ = 'security_events'
    __table_args__ = ({'extend_existing': True},)
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    event_type   = db.Column(db.String(50), nullable=False)
    severity     = db.Column(db.String(20), default='low')
    title        = db.Column(db.String(200), nullable=False)
    details      = db.Column(db.Text, default='')
    ip           = db.Column(db.String(50), default='')
    user_agent   = db.Column(db.String(300), default='')
    geo_city     = db.Column(db.String(100), default='')
    geo_country  = db.Column(db.String(100), default='')
    event_meta  = db.Column(db.Text, default='{}')
    resolved     = db.Column(db.Boolean, default=False)
    resolved_by  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at  = db.Column(db.DateTime, nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user         = db.relationship('User', foreign_keys=[user_id], backref='security_events', lazy='selectin')
    resolver     = db.relationship('User', foreign_keys=[resolved_by], lazy='selectin')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else 'Sistema',
            'event_type': self.event_type, 'severity': self.severity,
            'title': self.title, 'details': self.details,
            'ip': self.ip, 'user_agent': self.user_agent,
            'geo_city': self.geo_city, 'geo_country': self.geo_country,
            'resolved': self.resolved,
            'resolved_by_username': self.resolver.username if self.resolver else None,
            'resolved_at': str(self.resolved_at) if self.resolved_at else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class ApiKey(db.Model):
    __tablename__ = 'api_keys'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name        = db.Column(db.String(100), nullable=False)
    key_prefix  = db.Column(db.String(10), nullable=False)
    key_hash    = db.Column(db.String(128), nullable=False)
    scopes      = db.Column(db.Text, default='[]')
    last_used   = db.Column(db.DateTime, nullable=True)
    expires_at  = db.Column(db.DateTime, nullable=True)
    active      = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user        = db.relationship('User', backref='api_keys', lazy='selectin')

    def to_dict(self) -> dict[str, Any]:
        import json
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else '',
            'name': self.name, 'key_prefix': self.key_prefix,
            'scopes': json.loads(self.scopes) if self.scopes else [],
            'last_used': str(self.last_used) if self.last_used else None,
            'expires_at': str(self.expires_at) if self.expires_at else None,
            'active': self.active,
            'created_at': str(self.created_at) if self.created_at else None,
        }

    def to_verbose_dict(self) -> dict[str, Any]:
        d = self.to_dict()
        d['key_hash'] = self.key_hash
        return d


class Webhook(db.Model):
    __tablename__ = 'webhooks'
    __table_args__ = ({'extend_existing': True},)
    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name            = db.Column(db.String(100), nullable=False)
    url             = db.Column(db.String(500), nullable=False)
    events          = db.Column(db.Text, default='[]')
    secret          = db.Column(db.String(128), default='')
    active          = db.Column(db.Boolean, default=True)
    last_status     = db.Column(db.String(20), default='pending')
    last_response   = db.Column(db.Text, default='')
    last_called_at  = db.Column(db.DateTime, nullable=True)
    failure_count   = db.Column(db.Integer, default=0)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user            = db.relationship('User', backref='webhooks', lazy='selectin')

    def to_dict(self) -> dict[str, Any]:
        import json
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else '',
            'name': self.name, 'url': self.url,
            'events': json.loads(self.events) if self.events else [],
            'active': self.active, 'last_status': self.last_status,
            'last_response': (self.last_response[:200] + '...') if self.last_response and len(self.last_response) > 200 else self.last_response,
            'last_called_at': str(self.last_called_at) if self.last_called_at else None,
            'failure_count': self.failure_count,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class Device(db.Model):
    __tablename__ = 'devices'
    __table_args__ = ({'extend_existing': True},)
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name         = db.Column(db.String(200), default='')
    device_type  = db.Column(db.String(50), default='')
    os           = db.Column(db.String(100), default='')
    browser      = db.Column(db.String(100), default='')
    ip           = db.Column(db.String(50), default='')
    fingerprint  = db.Column(db.String(200), default='')
    trusted      = db.Column(db.Boolean, default=False)
    last_seen    = db.Column(db.DateTime, nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user         = db.relationship('User', backref='known_devices', lazy='selectin')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'user_id': self.user_id,
            'username': self.user.username if self.user else '',
            'name': self.name, 'device_type': self.device_type,
            'os': self.os, 'browser': self.browser,
            'ip': self.ip, 'fingerprint': self.fingerprint,
            'trusted': self.trusted,
            'last_seen': str(self.last_seen) if self.last_seen else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class SystemEvent(db.Model):
    __tablename__ = 'system_events'
    __table_args__ = ({'extend_existing': True},)
    id          = db.Column(db.Integer, primary_key=True)
    event_type  = db.Column(db.String(50), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    details     = db.Column(db.Text, default='')
    severity    = db.Column(db.String(20), default='info')
    source      = db.Column(db.String(100), default='')
    resolved    = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'event_type': self.event_type,
            'title': self.title, 'details': self.details,
            'severity': self.severity, 'source': self.source,
            'resolved': self.resolved,
            'created_at': str(self.created_at) if self.created_at else None,
        }
