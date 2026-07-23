from __future__ import annotations
from typing import Any
from extensions import db


class BajaRequest(db.Model):
    __tablename__ = 'baja_requests'
    __table_args__ = ({'extend_existing': True},)

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200))
    email      = db.Column(db.String(200))
    phone      = db.Column(db.String(100), default='')
    motivo     = db.Column(db.String(100), default='')
    message    = db.Column(db.Text, default='')
    status     = db.Column(db.String(20), default='pendiente')
    read       = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'name': self.name, 'email': self.email,
            'phone': self.phone, 'motivo': self.motivo,
            'message': self.message, 'status': self.status,
            'read': self.read, 'created_at': str(self.created_at),
        }
