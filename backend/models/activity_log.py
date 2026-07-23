from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_name    = db.Column(db.String(100), default='')
    action       = db.Column(db.String(50), nullable=False)
    entity_type  = db.Column(db.String(50), nullable=False)
    entity_id    = db.Column(db.Integer, nullable=True)
    entity_title = db.Column(db.String(200), default='')
    details      = db.Column(db.Text, default='')
    ip_address   = db.Column(db.String(50), default='')
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    user = db.relationship('User', backref='activity_logs', lazy='selectin')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'entity_title': self.entity_title,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': str(self.created_at) if self.created_at else None,
        }
