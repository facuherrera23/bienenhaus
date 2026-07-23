from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class Task(db.Model):
    __tablename__ = 'tasks'
    __table_args__ = ({'extend_existing': True},)

    id             = db.Column(db.Integer, primary_key=True)
    lead_id        = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    property_id    = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True)
    title          = db.Column(db.String(300), nullable=False)
    description    = db.Column(db.Text, default='')
    status         = db.Column(db.String(20), default='pendiente')
    priority       = db.Column(db.String(20), default='media')
    due_at         = db.Column(db.DateTime, nullable=True)
    completed_at   = db.Column(db.DateTime, nullable=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    created_by_id  = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    lead       = db.relationship('Lead', backref=db.backref('tasks', passive_deletes=True))
    assigned_to = db.relationship('Agent', backref='tasks', foreign_keys=[assigned_to_id])
    created_by  = db.relationship('User', backref='created_tasks', foreign_keys=[created_by_id])

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'property_id': self.property_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'due_at': str(self.due_at) if self.due_at else None,
            'completed_at': str(self.completed_at) if self.completed_at else None,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': self.assigned_to.name + ' ' + self.assigned_to.last if self.assigned_to else None,
            'created_by_name': self.created_by.username if self.created_by else None,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }
