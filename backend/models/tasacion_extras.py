from __future__ import annotations
from typing import Any
from datetime import datetime, timezone
from extensions import db


class TasacionComment(db.Model):
    __tablename__ = 'tasacion_comments'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    tasacion_id  = db.Column(db.Integer, db.ForeignKey('tasaciones.id'), nullable=False)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    content      = db.Column(db.Text, nullable=False)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    tasacion = db.relationship('Tasacion', backref=db.backref('tas_comments', cascade='all, delete-orphan', order_by='TasacionComment.created_at'))
    user     = db.relationship('User', backref='tasacion_comments')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'tasacion_id': self.tasacion_id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'content': self.content,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class TasacionFile(db.Model):
    __tablename__ = 'tasacion_files'
    __table_args__ = ({'extend_existing': True},)

    id            = db.Column(db.Integer, primary_key=True)
    tasacion_id   = db.Column(db.Integer, db.ForeignKey('tasaciones.id'), nullable=False)
    filename      = db.Column(db.String(500), nullable=False)
    original_name = db.Column(db.String(500), nullable=False)
    file_type     = db.Column(db.String(100), default='')
    file_size     = db.Column(db.Integer, default=0)
    uploaded_by   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    tasacion = db.relationship('Tasacion', backref=db.backref('tas_files', cascade='all, delete-orphan'))
    uploader = db.relationship('User', backref='tasacion_uploads')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'tasacion_id': self.tasacion_id,
            'filename': self.filename,
            'original_name': self.original_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_by': self.uploader.username if self.uploader else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class TasacionTimeline(db.Model):
    __tablename__ = 'tasacion_timeline'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    tasacion_id  = db.Column(db.Integer, db.ForeignKey('tasaciones.id'), nullable=False)
    event_type   = db.Column(db.String(50), nullable=False)
    description  = db.Column(db.Text, default='')
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    tasacion = db.relationship('Tasacion', backref=db.backref('tas_timeline', cascade='all, delete-orphan', order_by='TasacionTimeline.created_at.desc()'))
    user     = db.relationship('User', backref='tasacion_timeline_entries')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'tasacion_id': self.tasacion_id,
            'event_type': self.event_type,
            'description': self.description,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }
