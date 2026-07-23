from __future__ import annotations
from typing import Any
from extensions import db


class Settings(db.Model):
    __tablename__ = 'settings'
    __table_args__ = ({'extend_existing': True},)

    key   = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, default='')

    @classmethod
    def get(cls, key: str, default: str = '') -> str:
        row = db.session.get(cls, key)
        return row.value if row else default

    @classmethod
    def set(cls, key: str, value: str) -> None:
        row = db.session.get(cls, key)
        if row:
            row.value = value
        else:
            db.session.add(cls(key=key, value=value))

    @classmethod
    def all_dict(cls) -> dict[str, str]:
        return {r.key: r.value for r in cls.query.all()}
