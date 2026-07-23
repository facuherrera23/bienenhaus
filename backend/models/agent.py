from __future__ import annotations
from typing import Any, Self
from extensions import db


class Agent(db.Model):
    __tablename__ = 'agents'
    __table_args__ = ({'extend_existing': True},)

    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(100), nullable=False)
    last           = db.Column(db.String(100), nullable=False)
    years          = db.Column(db.Integer, default=0)
    license_number = db.Column(db.String(100), default='')
    specialty      = db.Column(db.String(200), default='')
    phone          = db.Column(db.String(50),  default='')
    whatsapp       = db.Column(db.String(50),  default='')
    email          = db.Column(db.String(200), default='')
    avatar         = db.Column(db.String(500), default='')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'name': self.name, 'last': self.last,
            'years': self.years, 'license_number': self.license_number,
            'specialty': self.specialty,
            'phone': self.phone, 'whatsapp': self.whatsapp,
            'email': self.email, 'avatar': self.avatar or '',
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        return cls(
            name=data.get('name',''), last=data.get('last',''),
            years=int(data.get('years',0)),
            license_number=data.get('license_number',''),
            specialty=data.get('specialty',''),
            phone=data.get('phone',''), whatsapp=data.get('whatsapp',''),
            email=data.get('email',''), avatar=data.get('avatar',''),
        )

    def update_from_dict(self, data: dict[str, Any]) -> None:
        self.name           = data.get('name',           self.name)
        self.last           = data.get('last',           self.last)
        self.years          = int(data.get('years',      self.years))
        self.license_number = data.get('license_number', self.license_number)
        self.specialty      = data.get('specialty',      self.specialty)
        self.phone          = data.get('phone',          self.phone)
        self.whatsapp       = data.get('whatsapp',       self.whatsapp)
        self.email          = data.get('email',          self.email)
        self.avatar         = data.get('avatar',         self.avatar)
