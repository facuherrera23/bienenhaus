from __future__ import annotations
from typing import Any
from datetime import datetime, timezone, date
from extensions import db


class MarketingCampaign(db.Model):
    __tablename__ = 'marketing_campaigns'
    __table_args__ = ({'extend_existing': True},)

    id              = db.Column(db.Integer, primary_key=True)
    name            = db.Column(db.String(200), nullable=False)
    description     = db.Column(db.Text, default='')
    budget          = db.Column(db.Float, default=0)
    start_date      = db.Column(db.Date, nullable=True)
    end_date        = db.Column(db.Date, nullable=True)
    status          = db.Column(db.String(20), default='draft')
    platform        = db.Column(db.String(50), default='')
    roi             = db.Column(db.Float, default=0)
    leads_generated = db.Column(db.Integer, default=0)
    results         = db.Column(db.Text, default='')
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'name': self.name, 'description': self.description,
            'budget': self.budget,
            'start_date': str(self.start_date) if self.start_date else None,
            'end_date': str(self.end_date) if self.end_date else None,
            'status': self.status, 'platform': self.platform,
            'roi': self.roi, 'leads_generated': self.leads_generated,
            'results': self.results,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }


class MarketingMetric(db.Model):
    __tablename__ = 'marketing_metrics'
    __table_args__ = ({'extend_existing': True},)

    id        = db.Column(db.Integer, primary_key=True)
    date      = db.Column(db.Date, nullable=False)
    platform  = db.Column(db.String(50), default='')
    metric    = db.Column(db.String(50), nullable=False)
    value     = db.Column(db.Float, default=0)
    source    = db.Column(db.String(50), default='social')

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id, 'date': str(self.date) if self.date else None,
            'platform': self.platform, 'metric': self.metric,
            'value': self.value, 'source': self.source,
        }
