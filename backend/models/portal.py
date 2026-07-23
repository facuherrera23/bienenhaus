from __future__ import annotations
import json
from typing import Any
from datetime import datetime, timezone, date
from extensions import db
from utils import encrypt_value, decrypt_value, SENSITIVE_CONFIG_KEYS


class Portal(db.Model):
    __tablename__ = 'portals'
    __table_args__ = ({'extend_existing': True},)

    id              = db.Column(db.Integer, primary_key=True)
    name            = db.Column(db.String(100), nullable=False)
    slug            = db.Column(db.String(100), unique=True, nullable=False)
    active          = db.Column(db.Boolean, default=False)
    config_json     = db.Column(db.Text, default='{}')
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    @property
    def config(self) -> dict[str, Any]:
        try:
            raw = json.loads(self.config_json)
        except Exception:
            return {}
        if isinstance(raw, dict):
            for k in SENSITIVE_CONFIG_KEYS:
                if k in raw:
                    raw[k] = decrypt_value(raw[k])
        return raw

    @config.setter
    def config(self, value: dict[str, Any]) -> None:
        if isinstance(value, dict):
            value = dict(value)
            for k in SENSITIVE_CONFIG_KEYS:
                if k in value:
                    value[k] = encrypt_value(value[k])
        self.config_json = json.dumps(value if isinstance(value, dict) else {})

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'name': self.name, 'slug': self.slug,
            'active': self.active, 'config': self.config,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class PortalPublication(db.Model):
    __tablename__ = 'portal_publications'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    portal_id   = db.Column(db.Integer, db.ForeignKey('portals.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    rental_id   = db.Column(db.Integer, db.ForeignKey('rentals.id'), nullable=True)
    status      = db.Column(db.String(20), default='pending')
    external_id = db.Column(db.String(200), default='')
    attempts    = db.Column(db.Integer, default=0)
    last_error  = db.Column(db.Text, default='')
    published_at = db.Column(db.DateTime, nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                            onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    ml_synced_at = db.Column(db.DateTime, nullable=True, index=True)
    ml_data_hash = db.Column(db.String(64), default='')
    local_hash   = db.Column(db.String(64), default='')
    ml_listing_type = db.Column(db.String(30), default='')
    assigned_agent_id = db.Column(db.Integer, db.ForeignKey('agents.id'), nullable=True)
    last_synced_at  = db.Column(db.DateTime, nullable=True)
    paused_at       = db.Column(db.DateTime, nullable=True)
    archived_at     = db.Column(db.DateTime, nullable=True)

    portal   = db.relationship('Portal', backref='publications')
    property = db.relationship('Property', backref='portal_publications')
    rental   = db.relationship('Rental', backref='portal_publications')
    assigned_agent = db.relationship('Agent', backref='portal_publications', foreign_keys=[assigned_agent_id])

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'portal_id': self.portal_id,
            'property_id': self.property_id, 'rental_id': self.rental_id,
            'status': self.status, 'external_id': self.external_id,
            'attempts': self.attempts, 'last_error': self.last_error,
            'published_at': str(self.published_at) if self.published_at else None,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'ml_synced_at': str(self.ml_synced_at) if self.ml_synced_at else None,
            'ml_listing_type': self.ml_listing_type,
            'assigned_agent_id': self.assigned_agent_id,
            'last_synced_at': str(self.last_synced_at) if self.last_synced_at else None,
            'paused_at': str(self.paused_at) if self.paused_at else None,
            'archived_at': str(self.archived_at) if self.archived_at else None,
        }


class PortalLog(db.Model):
    __tablename__ = 'portal_logs'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    portal_id   = db.Column(db.Integer, db.ForeignKey('portals.id'), nullable=False)
    property_id = db.Column(db.Integer, nullable=True)
    action      = db.Column(db.String(50), nullable=False)
    level       = db.Column(db.String(20), default='info')
    message     = db.Column(db.Text, default='')
    raw_response = db.Column(db.Text, default='')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    portal = db.relationship('Portal', backref='logs')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'portal_id': self.portal_id,
            'property_id': self.property_id,
            'action': self.action, 'level': self.level,
            'message': self.message,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class PortalQueue(db.Model):
    __tablename__ = 'portal_queue'
    __table_args__ = (
        db.Index('ix_portal_queue_dequeue', 'status', 'priority', 'created_at'),
        db.Index('ix_portal_queue_dlq', 'status', 'retry_count', 'next_retry_at'),
        {'extend_existing': True},
    )

    QUEUE_STATUSES = ('pending', 'processing', 'completed', 'failed')
    MAX_RETRIES = 5

    id          = db.Column(db.Integer, primary_key=True)
    portal_id   = db.Column(db.Integer, db.ForeignKey('portals.id'), nullable=True)
    property_id = db.Column(db.Integer, nullable=True)
    rental_id   = db.Column(db.Integer, nullable=True)
    action      = db.Column(db.String(50), nullable=False)
    priority    = db.Column(db.Integer, default=0)
    processed   = db.Column(db.Boolean, default=False)
    error       = db.Column(db.Text, default='')

    status      = db.Column(db.String(20), default='pending')
    retry_count = db.Column(db.Integer, default=0)
    last_error_at = db.Column(db.DateTime, nullable=True)
    next_retry_at = db.Column(db.DateTime, nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    portal = db.relationship('Portal', backref='queue_items')

    @property
    def is_dead(self) -> bool:
        return (self.status == 'failed' and
                self.retry_count >= self.MAX_RETRIES)

    @property
    def should_retry(self) -> bool:
        if self.status != 'failed':
            return False
        if self.retry_count >= self.MAX_RETRIES:
            return False
        if self.next_retry_at:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            return now >= self.next_retry_at
        return True

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'portal_id': self.portal_id,
            'property_id': self.property_id, 'rental_id': self.rental_id,
            'action': self.action, 'priority': self.priority,
            'processed': self.processed, 'error': self.error,
            'status': self.status, 'retry_count': self.retry_count,
            'last_error_at': str(self.last_error_at) if self.last_error_at else None,
            'next_retry_at': str(self.next_retry_at) if self.next_retry_at else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }
