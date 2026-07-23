from __future__ import annotations
import json
from typing import Any, Self
from datetime import datetime, timezone, date
from extensions import db
from utils import _n


class Property(db.Model):
    __tablename__ = 'properties'
    __table_args__ = (
        db.Index('idx_property_type', 'type'),
        db.Index('idx_property_status', 'status'),
        db.Index('idx_property_created_at', 'created_at'),
        {'extend_existing': True},
    )

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    type        = db.Column(db.String(50),  nullable=False, default='casa')
    location    = db.Column(db.String(200), nullable=False)
    price       = db.Column(db.Float, nullable=False)
    beds        = db.Column(db.Integer, default=0)
    baths       = db.Column(db.Integer, default=0)
    sqm         = db.Column(db.Float,   default=0)
    sqm_total   = db.Column(db.Float,   default=0)
    parkings    = db.Column(db.Integer, default=0)
    antiquity   = db.Column(db.String(30), default='')
    floor       = db.Column(db.String(20), default='')
    status      = db.Column(db.String(20),  default='disponible')
    featured    = db.Column(db.Boolean,     default=False)
    description = db.Column(db.Text,        default='')
    views       = db.Column(db.Integer,     default=0)
    images_json = db.Column(db.Text,        default='[]')
    latitude    = db.Column(db.Float, nullable=True)
    longitude   = db.Column(db.Float, nullable=True)
    created_at  = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    daily_views_json = db.Column(db.Text,   default='{}')
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

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'title': self.title, 'type': self.type,
            'location': self.location, 'price': self.price,
            'beds': self.beds, 'baths': self.baths, 'sqm': self.sqm,
            'sqm_total': self.sqm_total, 'parkings': self.parkings,
            'antiquity': self.antiquity, 'floor': self.floor,
            'status': self.status, 'featured': self.featured,
            'desc': self.description, 'images': self.images,
            'views': getattr(self, 'views', 0) or 0,
            'latitude': self.latitude, 'longitude': self.longitude,
            'created_at': str(self.created_at) if self.created_at else None,
            'video_url': self.video_url,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        p = cls(
            title=data.get('title',''), type=data.get('type','casa'),
            location=data.get('location',''), price=_n(data.get('price')),
            beds=_n(data.get('beds'), int), baths=_n(data.get('baths'), int),
            sqm=_n(data.get('sqm')), sqm_total=_n(data.get('sqm_total')),
            parkings=_n(data.get('parkings'), int),
            antiquity=data.get('antiquity',''), floor=data.get('floor',''),
            status=data.get('status','disponible'),
            featured=bool(data.get('featured',False)), description=data.get('desc',''),
            video_url=data.get('video_url'),
        )
        p.images = data.get('images', [])
        return p

    def update_from_dict(self, data: dict[str, Any]) -> None:
        self.title       = data.get('title',    self.title)
        self.type        = data.get('type',     self.type)
        self.location    = data.get('location', self.location)
        self.price       = _n(data.get('price', self.price))
        self.beds        = _n(data.get('beds',  self.beds), int)
        self.baths       = _n(data.get('baths', self.baths), int)
        self.sqm         = _n(data.get('sqm', self.sqm))
        self.sqm_total   = _n(data.get('sqm_total', self.sqm_total))
        self.parkings    = _n(data.get('parkings', self.parkings), int)
        self.antiquity   = data.get('antiquity', self.antiquity)
        self.floor       = data.get('floor', self.floor)
        self.status      = data.get('status',   self.status)
        self.featured    = bool(data.get('featured', self.featured))
        self.description = data.get('desc',     self.description)
        self.video_url   = data.get('video_url', self.video_url)
        if 'latitude' in data:
            self.latitude = data['latitude']
        if 'longitude' in data:
            self.longitude = data['longitude']
        if 'images' in data:
            self.images  = data['images']


class PropertyView(db.Model):
    __tablename__ = 'property_views'
    __table_args__ = ({'extend_existing': True},)

    id          = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False, index=True)
    date        = db.Column(db.Date, nullable=False)
    views       = db.Column(db.Integer, default=1)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    property = db.relationship('Property', backref='view_records')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'property_id': self.property_id,
            'date': str(self.date) if self.date else None,
            'views': self.views,
        }
