"""
social/models.py — Modelos para gestión de redes sociales
"""
import json
from datetime import datetime, timezone
from extensions import db
from utils import encrypt_value, decrypt_value, SENSITIVE_CONFIG_KEYS


class SocialAccount(db.Model):
    """Conexión a redes sociales (Facebook Page / Instagram Business)."""
    __tablename__ = 'social_accounts'

    id              = db.Column(db.Integer, primary_key=True)
    platform        = db.Column(db.String(50), nullable=False)  # 'facebook', 'instagram'
    label           = db.Column(db.String(100), default='')
    active          = db.Column(db.Boolean, default=False)
    page_id         = db.Column(db.String(100), nullable=True)   # Facebook Page ID
    ig_user_id      = db.Column(db.String(100), nullable=True)   # Instagram Business Account ID
    config_json     = db.Column(db.Text, default='{}')
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    posts = db.relationship('SocialPost', backref='account', lazy='dynamic',
                            order_by='SocialPost.created_at.desc()')

    @property
    def config(self):
        try:
            raw = json.loads(self.config_json)
        except Exception:
            return {}
        if isinstance(raw, dict):
            for k in SENSITIVE_CONFIG_KEYS:
                if k in raw:
                    raw[k] = decrypt_value(raw[k])
        return raw

    @config.setter
    def config(self, value):
        if isinstance(value, dict):
            value = dict(value)
            for k in SENSITIVE_CONFIG_KEYS:
                if k in value:
                    value[k] = encrypt_value(value[k])
        self.config_json = json.dumps(value if isinstance(value, dict) else {})

    def to_dict(self):
        c = self.config
        c_safe = {k: ('***' if k in ('access_token', 'refresh_token', 'client_secret') else v)
                  for k, v in c.items()}
        return {
            'id': self.id, 'platform': self.platform, 'label': self.label,
            'active': self.active, 'page_id': self.page_id, 'ig_user_id': self.ig_user_id,
            'config': c_safe,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }


class SocialTemplate(db.Model):
    """Plantillas de publicación reutilizables."""
    __tablename__ = 'social_templates'

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    media_urls  = db.Column(db.Text, default='[]')
    platform    = db.Column(db.String(20), default='')  # '' = cualquier plataforma
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self):
        import json as _j
        try:
            media = _j.loads(self.media_urls) if isinstance(self.media_urls, str) else (self.media_urls or [])
        except Exception:
            media = []
        return {
            'id': self.id, 'name': self.name, 'content': self.content,
            'media_urls': media, 'platform': self.platform,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class SocialPost(db.Model):
    """Publicación programada o enviada a redes sociales."""
    __tablename__ = 'social_posts'
    __table_args__ = (
        db.Index('ix_social_posts_status', 'status', 'scheduled_at'),
    )

    STATUS_DRAFT = 'draft'
    STATUS_SCHEDULED = 'scheduled'
    STATUS_PUBLISHING = 'publishing'
    STATUS_PUBLISHED = 'published'
    STATUS_FAILED = 'failed'

    id              = db.Column(db.Integer, primary_key=True)
    account_id      = db.Column(db.Integer, db.ForeignKey('social_accounts.id'), nullable=False)
    property_id     = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    content         = db.Column(db.Text, nullable=False)
    media_urls      = db.Column(db.Text, default='[]')
    scheduled_at    = db.Column(db.DateTime, nullable=True)
    published_at    = db.Column(db.DateTime, nullable=True)
    status          = db.Column(db.String(20), default=STATUS_DRAFT)
    external_id     = db.Column(db.String(200), nullable=True)
    error           = db.Column(db.Text, default='')
    retry_count     = db.Column(db.Integer, default=0)
    template_id     = db.Column(db.Integer, db.ForeignKey('social_templates.id'), nullable=True)
    recurring_interval = db.Column(db.Integer, nullable=True)  # en días, 0 = no recurrente
    engagement_likes   = db.Column(db.Integer, default=0)
    engagement_comments = db.Column(db.Integer, default=0)
    engagement_shares  = db.Column(db.Integer, default=0)
    engagement_saved   = db.Column(db.Integer, default=0)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                                onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    property = db.relationship('Property', backref='social_posts')

    def to_dict(self, include_account=False):
        import json as _j
        try:
            media = _j.loads(self.media_urls) if isinstance(self.media_urls, str) else (self.media_urls or [])
        except Exception:
            media = []
        d = {
            'id': self.id, 'account_id': self.account_id, 'property_id': self.property_id,
            'content': self.content, 'media_urls': media,
            'scheduled_at': str(self.scheduled_at) if self.scheduled_at else None,
            'published_at': str(self.published_at) if self.published_at else None,
            'status': self.status, 'external_id': self.external_id,
            'error': self.error, 'retry_count': self.retry_count,
            'template_id': self.template_id,
            'recurring_interval': self.recurring_interval,
            'engagement': {
                'likes': self.engagement_likes,
                'comments': self.engagement_comments,
                'shares': self.engagement_shares,
                'saved': self.engagement_saved,
            },
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
        }
        if include_account:
            account = db.session.get(SocialAccount, self.account_id) if self.account_id else None
            if account:
                d['account_label'] = account.label
                d['account_platform'] = account.platform
        return d
