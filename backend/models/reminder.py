from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class Reminder(db.Model):
    __tablename__ = 'reminders'
    __table_args__ = ({'extend_existing': True},)

    id             = db.Column(db.Integer, primary_key=True)
    lead_id        = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=True)
    task_id        = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=True)
    title          = db.Column(db.String(300), nullable=False)
    reminder_at    = db.Column(db.DateTime, nullable=False)
    notified       = db.Column(db.Boolean, default=False)
    notified_at    = db.Column(db.DateTime, nullable=True)
    reminder_type  = db.Column(db.String(20), default='custom')
    created_by_id  = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    created_by = db.relationship('User', backref='created_reminders')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'task_id': self.task_id,
            'title': self.title,
            'reminder_at': str(self.reminder_at) if self.reminder_at else None,
            'notified': self.notified,
            'notified_at': str(self.notified_at) if self.notified_at else None,
            'reminder_type': self.reminder_type,
            'created_by_name': self.created_by.username if self.created_by else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }
