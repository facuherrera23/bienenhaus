from __future__ import annotations
from typing import Any
from extensions import db


class PushSubscription(db.Model):
    __tablename__ = 'push_subscriptions'
    __table_args__ = ({'extend_existing': True},)

    id        = db.Column(db.Integer, primary_key=True)
    endpoint  = db.Column(db.Text, nullable=False, unique=True)
    auth      = db.Column(db.String(500), nullable=False)
    p256dh    = db.Column(db.String(500), nullable=False)
    user_agent = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'endpoint': self.endpoint,
            'created_at': str(self.created_at),
        }
