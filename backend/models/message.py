from __future__ import annotations
import json
from typing import Any
from datetime import datetime, timezone
from extensions import db


class Conversation(db.Model):
    __tablename__ = 'conversations'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    lead_id     = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True)
    agent_id    = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    channel     = db.Column(db.String(30), default='whatsapp')
    subject     = db.Column(db.String(300), default='')
    status      = db.Column(db.String(30), default='activa')
    unread      = db.Column(db.Integer, default=0)
    last_message_at = db.Column(db.DateTime, nullable=True)
    metadata_json = db.Column(db.Text, default='{}')
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                            onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    lead    = db.relationship('Lead', backref='conversations', lazy='selectin')
    agent   = db.relationship('Agent', backref='conversations', lazy='selectin')
    messages = db.relationship('Message', backref='conversation', lazy='dynamic',
                               order_by='Message.created_at.asc()',
                               cascade='all, delete-orphan', passive_deletes=True)

    @property
    def extra_data(self) -> dict[str, Any]:
        try: return json.loads(self.metadata_json) if self.metadata_json else {}
        except: return {}

    @extra_data.setter
    def extra_data(self, value: dict[str, Any]) -> None:
        self.metadata_json = json.dumps(value or {})

    def to_dict(self) -> dict[str, Any]:
        last_msg = self.messages.order_by(Message.created_at.desc()).first()
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'lead_name': self.lead.name if self.lead else None,
            'lead_email': self.lead.email if self.lead else None,
            'lead_phone': self.lead.phone if self.lead else None,
            'lead_status': self.lead.status if self.lead else None,
            'agent_id': self.agent_id,
            'agent_name': self.agent.name + ' ' + self.agent.last if self.agent else None,
            'channel': self.channel,
            'subject': self.subject,
            'status': self.status,
            'unread': self.unread,
            'last_message_preview': last_msg.content[:120] if last_msg else '',
            'last_message_at': str(self.last_message_at) if self.last_message_at else None,
            'last_sender': last_msg.sender if last_msg else None,
            'message_count': self.messages.count(),
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }


class Message(db.Model):
    __tablename__ = 'messages'
    __table_args__ = ({'extend_existing': True},)

    id              = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    sender          = db.Column(db.String(30), default='client')
    content         = db.Column(db.Text, default='')
    content_type    = db.Column(db.String(30), default='text')
    attachment_url  = db.Column(db.String(500), nullable=True)
    attachment_name = db.Column(db.String(200), nullable=True)
    metadata_json   = db.Column(db.Text, default='{}')
    read            = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

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
            'conversation_id': self.conversation_id,
            'sender': self.sender,
            'content': self.content,
            'content_type': self.content_type,
            'attachment_url': self.attachment_url,
            'attachment_name': self.attachment_name,
            'read': self.read,
            'created_at': str(self.created_at) if self.created_at else None,
        }
