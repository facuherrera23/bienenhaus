from __future__ import annotations
import json
from typing import Any, Optional
from datetime import datetime, timezone
from extensions import db


class Request(db.Model):
    __tablename__ = 'requests'
    __table_args__ = ({'extend_existing': True},)

    id                  = db.Column(db.Integer, primary_key=True)
    client_name         = db.Column(db.String(200), nullable=False)
    client_email        = db.Column(db.String(200), default='')
    client_phone        = db.Column(db.String(100), default='')
    request_type        = db.Column(db.String(50), default='consulta')
    subject             = db.Column(db.String(300), default='')
    description         = db.Column(db.Text, default='')
    property_id         = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True)
    status              = db.Column(db.String(30), default='nueva')
    priority            = db.Column(db.String(20), default='media')
    assigned_agent_id   = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    lead_id             = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True)
    source              = db.Column(db.String(30), default='web')
    notes               = db.Column(db.Text, default='')
    metadata_json       = db.Column(db.Text, default='{}')
    first_response_at   = db.Column(db.DateTime, nullable=True)
    resolved_at         = db.Column(db.DateTime, nullable=True)
    created_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                    onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    related_property = db.relationship('Property', backref='requests', lazy='selectin')
    assigned_to      = db.relationship('Agent', backref='assigned_requests', lazy='selectin')
    lead             = db.relationship('Lead', backref='requests_from_lead', lazy='selectin')
    comments    = db.relationship('RequestComment', backref='request', lazy='dynamic',
                                  order_by='RequestComment.created_at.asc()',
                                  cascade='all, delete-orphan', passive_deletes=True)
    files       = db.relationship('RequestFile', backref='request', lazy='dynamic',
                                  cascade='all, delete-orphan', passive_deletes=True)

    @property
    def response_time_hours(self) -> float | None:
        if self.first_response_at and self.created_at:
            delta = self.first_response_at - self.created_at
            return round(delta.total_seconds() / 3600, 1)
        return None

    @property
    def extra_data(self) -> dict[str, Any]:
        try: return json.loads(self.metadata_json) if self.metadata_json else {}
        except: return {}

    @extra_data.setter
    def extra_data(self, value: dict[str, Any]) -> None:
        self.metadata_json = json.dumps(value or {})

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'client_name': self.client_name,
            'client_email': self.client_email,
            'client_phone': self.client_phone,
            'request_type': self.request_type,
            'subject': self.subject,
            'description': self.description,
            'property_id': self.property_id,
            'property_title': self.related_property.title if self.related_property else None,
            'property_image': (self.related_property.images[0] if self.related_property and self.related_property.images else None),
            'status': self.status,
            'priority': self.priority,
            'assigned_agent_id': self.assigned_agent_id,
            'assigned_agent_name': self.assigned_to.name + ' ' + self.assigned_to.last if self.assigned_to else None,
            'lead_id': self.lead_id,
            'source': self.source,
            'notes': self.notes,
            'response_time_hours': self.response_time_hours,
            'comment_count': self.comments.count(),
            'file_count': self.files.count(),
            'first_response_at': str(self.first_response_at) if self.first_response_at else None,
            'resolved_at': str(self.resolved_at) if self.resolved_at else None,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }


class RequestComment(db.Model):
    __tablename__ = 'request_comments'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)

    id          = db.Column(db.Integer, primary_key=True)
    request_id  = db.Column(db.Integer, db.ForeignKey('requests.id', ondelete='CASCADE'), nullable=False)
    author      = db.Column(db.String(30), default='agent')
    author_name = db.Column(db.String(100), default='')
    content     = db.Column(db.Text, nullable=False)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'request_id': self.request_id,
            'author': self.author,
            'author_name': self.author_name,
            'content': self.content,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class RequestFile(db.Model):
    __tablename__ = 'request_files'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    request_id  = db.Column(db.Integer, db.ForeignKey('requests.id', ondelete='CASCADE'), nullable=False)
    filename    = db.Column(db.String(300), nullable=False)
    url         = db.Column(db.String(500), nullable=False)
    file_type   = db.Column(db.String(30), default='document')
    file_size   = db.Column(db.Integer, default=0)
    uploaded_by = db.Column(db.String(100), default='')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'request_id': self.request_id,
            'filename': self.filename,
            'url': self.url,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_by': self.uploaded_by,
            'created_at': str(self.created_at) if self.created_at else None,
        }
