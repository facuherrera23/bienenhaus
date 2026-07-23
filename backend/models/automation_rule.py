from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class AutomationRule(db.Model):
    __tablename__ = 'automation_rules'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    name             = db.Column(db.String(200), nullable=False)
    description      = db.Column(db.Text, default='')
    enabled          = db.Column(db.Boolean, default=False)
    trigger_type     = db.Column(db.String(30), nullable=False)
    trigger_config   = db.Column(db.Text, default='{}')
    action_type      = db.Column(db.String(30), nullable=False)
    action_config    = db.Column(db.Text, default='{}')
    priority         = db.Column(db.Integer, default=0)
    max_actions      = db.Column(db.Integer, default=0)
    cooldown_minutes = db.Column(db.Integer, default=0)
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                  onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'enabled': self.enabled,
            'trigger_type': self.trigger_type,
            'trigger_config': self.trigger_config,
            'action_type': self.action_type,
            'action_config': self.action_config,
            'priority': self.priority,
            'max_actions': self.max_actions,
            'cooldown_minutes': self.cooldown_minutes,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }
