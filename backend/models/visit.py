from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class Visit(db.Model):
    __tablename__ = 'visits'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    lead_id          = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    property_id      = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True)
    agent_id         = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    scheduled_at     = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=30)
    status           = db.Column(db.String(20), default='pendiente')
    notes            = db.Column(db.Text, default='')
    feedback         = db.Column(db.Text, default='')
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                  onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    lead     = db.relationship('Lead', backref=db.backref('visits', passive_deletes=True))
    property = db.relationship('Property', backref='visits')
    agent    = db.relationship('Agent', backref='visits')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'lead_name': self.lead.name if self.lead else None,
            'property_id': self.property_id,
            'property_title': self.property.title if self.property else None,
            'agent_id': self.agent_id,
            'agent_name': self.agent.name + ' ' + self.agent.last if self.agent else None,
            'scheduled_at': str(self.scheduled_at) if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'notes': self.notes,
            'feedback': self.feedback,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }
