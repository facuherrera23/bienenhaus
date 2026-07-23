from __future__ import annotations
import json
from typing import Any, Self
from datetime import datetime, timezone, date
from extensions import db
from utils import _n


class Rental(db.Model):
    __tablename__ = 'rentals'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    type        = db.Column(db.String(50),  nullable=False, default='casa')
    location    = db.Column(db.String(200), nullable=False)
    price_ars   = db.Column(db.Float, nullable=False)
    expenses    = db.Column(db.Float, default=0)
    beds        = db.Column(db.Integer, default=0)
    baths       = db.Column(db.Integer, default=0)
    sqm         = db.Column(db.Float,   default=0)
    status      = db.Column(db.String(20),  default='disponible')
    featured    = db.Column(db.Boolean,     default=False)
    description = db.Column(db.Text,        default='')
    views       = db.Column(db.Integer,     default=0)
    images_json = db.Column(db.Text,        default='[]')
    latitude    = db.Column(db.Float, nullable=True)
    longitude   = db.Column(db.Float, nullable=True)
    created_at  = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    daily_views_json = db.Column(db.Text,   default='{}')
    min_months  = db.Column(db.Integer, default=0)
    furnished   = db.Column(db.Boolean, default=False)
    video_url   = db.Column(db.String(500), nullable=True)

    @property
    def images(self) -> list[str]:
        try:    return json.loads(self.images_json)
        except Exception: return []

    @images.setter
    def images(self, value: list[str]) -> None:
        self.images_json = json.dumps(value if isinstance(value, list) else [])

    @property
    def daily_views(self) -> dict[str, int]:
        try:    return json.loads(self.daily_views_json) if self.daily_views_json else {}
        except Exception: return {}

    @daily_views.setter
    def daily_views(self, value: dict[str, int]) -> None:
        self.daily_views_json = json.dumps(value if isinstance(value, dict) else {})

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        r = cls(
            title=data.get('title',''), type=data.get('type','casa'),
            location=data.get('location',''), price_ars=_n(data.get('price_ars')),
            expenses=_n(data.get('expenses')),
            beds=_n(data.get('beds'), int), baths=_n(data.get('baths'), int),
            sqm=_n(data.get('sqm')), status=data.get('status','disponible'),
            featured=bool(data.get('featured',False)), description=data.get('desc',''),
            min_months=_n(data.get('min_months'), int),
            furnished=bool(data.get('furnished',False)),
            video_url=data.get('video_url'),
        )
        r.images = data.get('images', [])
        return r

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'title': self.title, 'type': self.type,
            'location': self.location, 'price_ars': self.price_ars,
            'expenses': self.expenses,
            'beds': self.beds, 'baths': self.baths, 'sqm': self.sqm,
            'status': self.status, 'featured': self.featured,
            'desc': self.description, 'images': self.images,
            'views': getattr(self, 'views', 0) or 0,
            'latitude': self.latitude, 'longitude': self.longitude,
            'created_at': str(self.created_at) if self.created_at else None,
            'min_months': self.min_months, 'furnished': self.furnished,
            'video_url': self.video_url,
        }

    def update_from_dict(self, data: dict[str, Any]) -> None:
        self.title       = data.get('title',    self.title)
        self.type        = data.get('type',     self.type)
        self.location    = data.get('location', self.location)
        self.price_ars   = _n(data.get('price_ars', self.price_ars))
        self.expenses    = _n(data.get('expenses', self.expenses))
        self.beds        = _n(data.get('beds',  self.beds), int)
        self.baths       = _n(data.get('baths', self.baths), int)
        self.sqm         = _n(data.get('sqm', self.sqm))
        self.status      = data.get('status',   self.status)
        self.featured    = bool(data.get('featured', self.featured))
        self.description = data.get('desc',     self.description)
        self.min_months  = _n(data.get('min_months', self.min_months), int)
        self.furnished   = bool(data.get('furnished', self.furnished))
        self.video_url   = data.get('video_url', self.video_url)
        if 'latitude' in data:
            self.latitude = data['latitude']
        if 'longitude' in data:
            self.longitude = data['longitude']
        if 'images' in data:
            self.images  = data['images']


class RentalView(db.Model):
    __tablename__ = 'rental_views'
    __table_args__ = ({'extend_existing': True},)

    id        = db.Column(db.Integer, primary_key=True)
    rental_id = db.Column(db.Integer, db.ForeignKey('rentals.id'), nullable=False, index=True)
    date      = db.Column(db.Date, nullable=False)
    views     = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    rental = db.relationship('Rental', backref='view_records')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'rental_id': self.rental_id,
            'date': str(self.date) if self.date else None,
            'views': self.views,
        }
