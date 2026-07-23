from __future__ import annotations
from typing import Any
from datetime import datetime, timezone
from extensions import db


class Office(db.Model):
    __tablename__ = 'offices'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(200), nullable=False)
    address     = db.Column(db.String(300), default='')
    city        = db.Column(db.String(100), default='')
    province    = db.Column(db.String(100), default='')
    country     = db.Column(db.String(100), default='Argentina')
    phone       = db.Column(db.String(50), default='')
    manager     = db.Column(db.String(200), default='')
    schedule    = db.Column(db.String(300), default='')
    latitude    = db.Column(db.Float, nullable=True)
    longitude   = db.Column(db.Float, nullable=True)
    active      = db.Column(db.Boolean, default=True)
    sort_order  = db.Column(db.Integer, default=0)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                            onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'province': self.province,
            'country': self.country,
            'phone': self.phone,
            'manager': self.manager,
            'schedule': self.schedule,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'active': self.active,
            'sort_order': self.sort_order,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }
