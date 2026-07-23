from __future__ import annotations
from datetime import datetime, timezone
from extensions import db


class ClientError(db.Model):
    __tablename__ = 'client_errors'
    __table_args__ = ({'extend_existing': True},)

    id         = db.Column(db.Integer, primary_key=True)
    message    = db.Column(db.Text, default='')
    source     = db.Column(db.String(500), default='')
    lineno     = db.Column(db.Integer, default=0)
    colno      = db.Column(db.Integer, default=0)
    error      = db.Column(db.Text, default='')
    url        = db.Column(db.String(1000), default='')
    user_agent = db.Column(db.String(500), default='')
    ip         = db.Column(db.String(50), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'source': self.source,
            'lineno': self.lineno,
            'colno': self.colno,
            'error': self.error,
            'url': self.url,
            'user_agent': self.user_agent,
            'ip': self.ip,
            'created_at': str(self.created_at) if self.created_at else None,
        }
