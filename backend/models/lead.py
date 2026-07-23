from __future__ import annotations
import json
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class Lead(db.Model):
    __tablename__ = 'leads'
    __table_args__ = ({'extend_existing': True},)

    id                        = db.Column(db.Integer, primary_key=True)
    name                      = db.Column(db.String(200), nullable=False)
    email                     = db.Column(db.String(200), default='')
    phone                     = db.Column(db.String(100), default='')
    whatsapp                  = db.Column(db.String(100), default='')
    preferred_contact_method  = db.Column(db.String(20), default='llamada')
    origin                    = db.Column(db.String(30), default='manual')
    source_detail             = db.Column(db.String(100), default='')
    status                    = db.Column(db.String(30), default='nuevo')
    pipeline_order            = db.Column(db.Integer, default=0)
    agent_id                  = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    notes                     = db.Column(db.Text, default='')
    interactions              = db.Column(db.Text, default='[]')
    estimated_value           = db.Column(db.Float, nullable=True)
    conversion_probability    = db.Column(db.Integer, default=50)
    lead_score                = db.Column(db.Integer, default=0)
    loss_reason               = db.Column(db.String(200), default='')
    budget_min                = db.Column(db.Float, nullable=True)
    budget_max                = db.Column(db.Float, nullable=True)
    utm_source                = db.Column(db.String(200), default='')
    utm_medium                = db.Column(db.String(200), default='')
    utm_campaign              = db.Column(db.String(200), default='')
    last_contacted_at         = db.Column(db.DateTime, nullable=True)
    next_followup_at          = db.Column(db.DateTime, nullable=True)
    tipo_cliente              = db.Column(db.String(20), default='', server_default='')
    source_url                = db.Column(db.String(500), default='')
    created_at                = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at                = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                          onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    agent    = db.relationship('Agent', backref='leads', lazy='selectin')
    activities = db.relationship('LeadActivity', backref='lead', lazy='dynamic',
                                 order_by='LeadActivity.created_at.desc()',
                                 passive_deletes=True)
    properties = db.relationship('LeadPropertyInterest', backref='lead', lazy='dynamic',
                                 cascade='all, delete-orphan', passive_deletes=True)

    _STAGE_WEIGHTS = {
        'nuevo': 10, 'contactado': 20, 'calificado': 40,
        'visita_agendada': 55, 'visita_realizada': 65, 'negociacion': 75,
        'cerrado_ganado': 100, 'cerrado_perdido': 0,
    }

    @property
    def auto_conversion_probability(self) -> int:
        return self._STAGE_WEIGHTS.get(self.status, 0)

    @property
    def interactions_list(self) -> list[dict[str, str]]:
        try:
            return json.loads(self.interactions) if self.interactions else []
        except (json.JSONDecodeError, TypeError):
            return []

    @interactions_list.setter
    def interactions_list(self, value: list[dict[str, str]]) -> None:
        self.interactions = json.dumps(value if isinstance(value, list) else [])

    def to_dict(self) -> dict[str, Any]:
        props = [p.to_dict() for p in self.properties.all()] if self.properties else []
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'whatsapp': self.whatsapp,
            'preferred_contact_method': self.preferred_contact_method,
            'origin': self.origin,
            'tipo_cliente': self.tipo_cliente or None,
            'source_detail': self.source_detail,
            'status': self.status,
            'pipeline_order': self.pipeline_order,
            'agent_id': self.agent_id,
            'agent_name': self.agent.name + ' ' + self.agent.last if self.agent else None,
            'notes': self.notes,
            'interactions': self.interactions_list,
            'estimated_value': self.estimated_value,
            'conversion_probability': self.conversion_probability,
            'auto_conversion_probability': self.auto_conversion_probability,
            'lead_score': self.lead_score,
            'loss_reason': self.loss_reason,
            'budget_min': self.budget_min,
            'budget_max': self.budget_max,
            'utm_source': self.utm_source,
            'utm_medium': self.utm_medium,
            'utm_campaign': self.utm_campaign,
            'last_contacted_at': str(self.last_contacted_at) if self.last_contacted_at else None,
            'next_followup_at': str(self.next_followup_at) if self.next_followup_at else None,
            'source_url': self.source_url,
            'properties': props,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }


class LeadPropertyInterest(db.Model):
    __tablename__ = 'lead_property_interests'
    __table_args__ = ({'extend_existing': True},)

    id            = db.Column(db.Integer, primary_key=True)
    lead_id       = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    property_id   = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=True)
    interest_type = db.Column(db.String(20), default='venta')
    notes         = db.Column(db.Text, default='')
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    property = db.relationship('Property', backref='lead_interests')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'property_id': self.property_id,
            'property_title': self.property.title if self.property else None,
            'interest_type': self.interest_type,
            'notes': self.notes,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class LeadActivity(db.Model):
    __tablename__ = 'lead_activities'
    __table_args__ = ({'extend_existing': True},)

    id               = db.Column(db.Integer, primary_key=True)
    lead_id          = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    activity_type    = db.Column(db.String(30), nullable=False)
    title            = db.Column(db.String(300), default='')
    description      = db.Column(db.Text, default='')
    from_status      = db.Column(db.String(30), nullable=True)
    to_status        = db.Column(db.String(30), nullable=True)
    email_subject    = db.Column(db.String(300), nullable=True)
    email_to         = db.Column(db.String(200), nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    visit_id         = db.Column(db.Integer, db.ForeignKey('visits.id', ondelete='SET NULL'), nullable=True)
    task_id          = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    reminder_id      = db.Column(db.Integer, db.ForeignKey('reminders.id', ondelete='SET NULL'), nullable=True)
    created_by_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    metadata_json    = db.Column(db.Text, default='{}')
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    created_by = db.relationship('User', backref='activities')

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
            'lead_id': self.lead_id,
            'activity_type': self.activity_type,
            'title': self.title,
            'description': self.description,
            'from_status': self.from_status,
            'to_status': self.to_status,
            'email_subject': self.email_subject,
            'email_to': self.email_to,
            'duration_minutes': self.duration_minutes,
            'visit_id': self.visit_id,
            'task_id': self.task_id,
            'reminder_id': self.reminder_id,
            'created_by_name': self.created_by.username if self.created_by else None,
            'extra_data': self.extra_data,
            'created_at': str(self.created_at) if self.created_at else None,
        }
