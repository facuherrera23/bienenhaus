from __future__ import annotations
from typing import Any
from datetime import datetime, timezone
from extensions import db


class AppraisalComment(db.Model):
    __tablename__ = 'appraisal_comments'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    appraisal_id = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    content      = db.Column(db.Text, nullable=False)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    appraisal = db.relationship('Appraisal', backref=db.backref('appr_comments', cascade='all, delete-orphan', order_by='AppraisalComment.created_at'))
    user      = db.relationship('User', backref='appraisal_comments')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'appraisal_id': self.appraisal_id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'content': self.content,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class AppraisalFile(db.Model):
    __tablename__ = 'appraisal_files'
    __table_args__ = ({'extend_existing': True},)

    id            = db.Column(db.Integer, primary_key=True)
    appraisal_id  = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    filename      = db.Column(db.String(500), nullable=False)
    original_name = db.Column(db.String(500), nullable=False)
    file_type     = db.Column(db.String(100), default='')
    file_size     = db.Column(db.Integer, default=0)
    uploaded_by   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    appraisal = db.relationship('Appraisal', backref=db.backref('appr_files', cascade='all, delete-orphan'))
    uploader  = db.relationship('User', backref='appraisal_uploads')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'appraisal_id': self.appraisal_id,
            'filename': self.filename,
            'original_name': self.original_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_by': self.uploader.username if self.uploader else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class AppraisalTimeline(db.Model):
    __tablename__ = 'appraisal_timeline'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    appraisal_id = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    event_type   = db.Column(db.String(50), nullable=False)
    description  = db.Column(db.Text, default='')
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    appraisal = db.relationship('Appraisal', backref=db.backref('appr_timeline', cascade='all, delete-orphan', order_by='AppraisalTimeline.created_at.desc()'))
    user      = db.relationship('User', backref='appraisal_timeline_entries')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'appraisal_id': self.appraisal_id,
            'event_type': self.event_type,
            'description': self.description,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'created_at': str(self.created_at) if self.created_at else None,
        }
