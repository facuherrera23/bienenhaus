from __future__ import annotations
from typing import Any, Optional
from datetime import datetime, timezone
from extensions import db


class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    event_type       = db.Column(db.String(30), nullable=False, default='recordatorio')
    title            = db.Column(db.String(300), nullable=False)
    description      = db.Column(db.Text, default='')
    client_name      = db.Column(db.String(200), default='')
    client_phone     = db.Column(db.String(50), default='')
    client_email     = db.Column(db.String(200), default='')
    property_id      = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True)
    agent_id         = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    start_at         = db.Column(db.DateTime, nullable=False)
    end_at           = db.Column(db.DateTime, nullable=True)
    all_day          = db.Column(db.Boolean, default=False)
    status           = db.Column(db.String(20), default='pendiente')
    priority         = db.Column(db.String(20), default='media')
    location         = db.Column(db.String(300), default='')
    lead_id          = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True)
    appraisal_id     = db.Column(db.Integer, db.ForeignKey('appraisals.id', ondelete='SET NULL'), nullable=True)
    external_id      = db.Column(db.String(200), default='')
    external_source  = db.Column(db.String(50), default='')
    completed_at     = db.Column(db.DateTime, nullable=True)
    cancelled_at     = db.Column(db.DateTime, nullable=True)
    created_by_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                 onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    property   = db.relationship('Property', backref='calendar_events')
    agent      = db.relationship('Agent', backref='calendar_events')
    lead       = db.relationship('Lead', backref='calendar_events')
    appraisal  = db.relationship('Appraisal', backref='calendar_events')
    created_by = db.relationship('User', backref='created_events')

    comments   = db.relationship('EventComment', backref='event', lazy='dynamic',
                                 cascade='all, delete-orphan',
                                 order_by='EventComment.created_at.asc()')
    attachments = db.relationship('EventAttachment', backref='event', lazy='dynamic',
                                  cascade='all, delete-orphan',
                                  order_by='EventAttachment.created_at.asc()')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'event_type': self.event_type,
            'title': self.title,
            'description': self.description,
            'client_name': self.client_name,
            'client_phone': self.client_phone,
            'client_email': self.client_email,
            'property_id': self.property_id,
            'property_title': self.property.title if self.property else None,
            'agent_id': self.agent_id,
            'agent_name': self.agent.name + ' ' + self.agent.last if self.agent else None,
            'start_at': str(self.start_at) if self.start_at else None,
            'end_at': str(self.end_at) if self.end_at else None,
            'all_day': self.all_day,
            'status': self.status,
            'priority': self.priority,
            'location': self.location,
            'lead_id': self.lead_id,
            'lead_name': self.lead.name if self.lead else None,
            'appraisal_id': self.appraisal_id,
            'external_id': self.external_id,
            'external_source': self.external_source,
            'completed_at': str(self.completed_at) if self.completed_at else None,
            'cancelled_at': str(self.cancelled_at) if self.cancelled_at else None,
            'created_by_name': self.created_by.username if self.created_by else None,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'comments_count': self.comments.count() if self.comments else 0,
        }

    def to_calendar_dict(self) -> dict[str, Any]:
        d = self.to_dict()
        d['comments'] = [c.to_dict() for c in self.comments.all()]
        d['attachments'] = [a.to_dict() for a in self.attachments.all()]
        return d


class EventComment(db.Model):
    __tablename__ = 'event_comments'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    event_id         = db.Column(db.Integer, db.ForeignKey('calendar_events.id', ondelete='CASCADE'), nullable=False)
    content          = db.Column(db.Text, nullable=False)
    created_by_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    created_by = db.relationship('User', backref='event_comments')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'event_id': self.event_id,
            'content': self.content,
            'created_by_name': self.created_by.username if self.created_by else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class EventAttachment(db.Model):
    __tablename__ = 'event_attachments'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    event_id         = db.Column(db.Integer, db.ForeignKey('calendar_events.id', ondelete='CASCADE'), nullable=False)
    filename         = db.Column(db.String(300), nullable=False)
    url              = db.Column(db.String(500), nullable=False)
    file_type        = db.Column(db.String(50), default='')
    uploaded_by_id   = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    uploaded_by = db.relationship('User', backref='event_attachments')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'event_id': self.event_id,
            'filename': self.filename,
            'url': self.url,
            'file_type': self.file_type,
            'uploaded_by_name': self.uploaded_by.username if self.uploaded_by else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }
