from datetime import datetime, timezone, date, timedelta
from flask import request, session
from sqlalchemy import func, extract
from extensions import db
from models import MarketingCampaign, MarketingMetric, SocialPost, SocialAccount, Property, Lead
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err

from . import bp


# ── DASHBOARD KPIs ──────────────────────────────────────────────────

@bp.route('/dashboard', methods=['GET'])
@require_role(ROLE_EDITOR)
def dashboard():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    total_posts = SocialPost.query.count()
    draft = SocialPost.query.filter_by(status='draft').count()
    scheduled = SocialPost.query.filter_by(status='scheduled').count()
    published = SocialPost.query.filter_by(status='published').count()
    failed = SocialPost.query.filter_by(status='failed').count()
    total_reach = db.session.query(func.sum(SocialPost.engagement_likes + SocialPost.engagement_comments + SocialPost.engagement_shares)).scalar() or 0
    total_clicks = db.session.query(func.sum(SocialPost.engagement_saved)).scalar() or 0
    total_leads = Lead.query.count()
    campaigns_active = MarketingCampaign.query.filter_by(status='active').count()

    last_30 = now - timedelta(days=30)
    leads_30 = Lead.query.filter(Lead.created_at >= last_30).count()

    return _ok({
        'total_posts': total_posts,
        'drafts': draft,
        'scheduled': scheduled,
        'published': published,
        'failed': failed,
        'reach': int(total_reach),
        'clicks': int(total_clicks),
        'leads': total_leads,
        'leads_30d': leads_30,
        'campaigns_active': campaigns_active,
        'conversion_rate': round((total_leads / max(total_clicks, 1)) * 100, 2) if total_clicks else 0,
    })


# ── CAMPAIGNS CRUD ──────────────────────────────────────────────────

@bp.route('/campaigns', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_campaigns():
    campaigns = MarketingCampaign.query.order_by(MarketingCampaign.created_at.desc()).all()
    return _ok([c.to_dict() for c in campaigns])


@bp.route('/campaigns/<int:cid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_campaign(cid):
    c = db.session.get(MarketingCampaign, cid)
    if not c:
        return _err('Campaña no encontrada')
    return _ok(c.to_dict())


@bp.route('/campaigns', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_campaign():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return _err('El nombre es obligatorio.')
    c = MarketingCampaign(
        name=name,
        description=data.get('description', ''),
        budget=float(data.get('budget', 0)),
        start_date=_parse_date(data.get('start_date')),
        end_date=_parse_date(data.get('end_date')),
        status=data.get('status', 'draft'),
        platform=data.get('platform', ''),
    )
    db.session.add(c)
    db.session.commit()
    return _ok(c.to_dict(), 201)


@bp.route('/campaigns/<int:cid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_campaign(cid):
    c = db.session.get(MarketingCampaign, cid)
    if not c:
        return _err('Campaña no encontrada')
    data = request.get_json(silent=True) or {}
    for field in ('name', 'description', 'status', 'platform', 'results'):
        if field in data:
            setattr(c, field, data[field])
    if 'budget' in data:
        c.budget = float(data['budget'])
    if 'roi' in data:
        c.roi = float(data['roi'])
    if 'leads_generated' in data:
        c.leads_generated = int(data['leads_generated'])
    if 'start_date' in data:
        c.start_date = _parse_date(data['start_date'])
    if 'end_date' in data:
        c.end_date = _parse_date(data['end_date'])
    db.session.commit()
    return _ok(c.to_dict())


@bp.route('/campaigns/<int:cid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_campaign(cid):
    c = db.session.get(MarketingCampaign, cid)
    if not c:
        return _err('Campaña no encontrada')
    db.session.delete(c)
    db.session.commit()
    return _ok({'deleted': cid})


# ── CALENDAR ────────────────────────────────────────────────────────

@bp.route('/calendar', methods=['GET'])
@require_role(ROLE_EDITOR)
def calendar_data():
    year = request.args.get('year', type=int) or datetime.now(timezone.utc).year
    month = request.args.get('month', type=int) or datetime.now(timezone.utc).month

    posts = SocialPost.query.filter(
        extract('year', SocialPost.scheduled_at) == year,
        extract('month', SocialPost.scheduled_at) == month,
    ).all()

    campaigns = MarketingCampaign.query.filter(
        db.or_(
            db.and_(
                extract('year', MarketingCampaign.start_date) == year,
                extract('month', MarketingCampaign.start_date) == month,
            ),
            db.and_(
                extract('year', MarketingCampaign.end_date) == year,
                extract('month', MarketingCampaign.end_date) == month,
            ),
        )
    ).all()

    items = []
    for p in posts:
        if p.scheduled_at:
            items.append({
                'type': 'post', 'id': p.id, 'title': p.content[:80],
                'date': str(p.scheduled_at.date()),
                'status': p.status, 'platform': p.account.platform if p.account else '',
            })
    for c in campaigns:
        if c.start_date:
            items.append({
                'type': 'campaign_start', 'id': c.id, 'title': f'Inicio: {c.name}',
                'date': str(c.start_date), 'status': c.status, 'platform': c.platform,
            })
        if c.end_date:
            items.append({
                'type': 'campaign_end', 'id': c.id, 'title': f'Fin: {c.name}',
                'date': str(c.end_date), 'status': c.status, 'platform': c.platform,
            })

    return _ok({'year': year, 'month': month, 'items': items})


# ── POSTS (enhanced list with platform info) ────────────────────────

@bp.route('/posts', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_posts():
    status = request.args.get('status', '')
    account_id = request.args.get('account_id', type=int)
    search = request.args.get('search', '').strip()

    q = SocialPost.query
    if status:
        q = q.filter(SocialPost.status == status)
    if account_id:
        q = q.filter(SocialPost.account_id == account_id)
    if search:
        like = f'%{search}%'
        q = q.filter(SocialPost.content.ilike(like))

    posts = q.order_by(SocialPost.created_at.desc()).all()
    result = []
    for p in posts:
        d = p.to_dict(include_account=True)
        if p.property:
            d['property_title'] = p.property.title
        else:
            d['property_title'] = None
        result.append(d)
    return _ok(result)


# ── METRICS / STATS ─────────────────────────────────────────────────

@bp.route('/metrics', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_metrics():
    period = request.args.get('period', '30')
    days = int(period)
    since = datetime.now(timezone.utc).replace(tzinfo=None).date() - timedelta(days=days)

    metrics = MarketingMetric.query.filter(
        MarketingMetric.date >= since
    ).order_by(MarketingMetric.date.asc()).all()

    posts_q = SocialPost.query.filter(
        SocialPost.created_at >= datetime.combine(since, datetime.min.time())
    ).all()

    posts_by_date = {}
    for p in posts_q:
        d = str(p.created_at.date()) if p.created_at else None
        if d:
            posts_by_date.setdefault(d, 0)
            posts_by_date[d] += 1

    leads_q = Lead.query.filter(Lead.created_at >= datetime.combine(since, datetime.min.time())).all()
    leads_by_date = {}
    for l in leads_q:
        d = str(l.created_at.date()) if l.created_at else None
        if d:
            leads_by_date.setdefault(d, 0)
            leads_by_date[d] += 1

    dates = []
    for i in range(days, -1, -1):
        d = str((datetime.now(timezone.utc).replace(tzinfo=None).date() - timedelta(days=i)))
        dates.append(d)

    return _ok({
        'metrics': [m.to_dict() for m in metrics],
        'posts_by_date': posts_by_date,
        'leads_by_date': leads_by_date,
        'dates': dates,
    })


# ── PLATFORMS (future integration placeholder) ──────────────────────

@bp.route('/platforms', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_platforms():
    platforms = [
        {'id': 'facebook', 'name': 'Facebook', 'connected': True, 'icon': 'facebook'},
        {'id': 'instagram', 'name': 'Instagram', 'connected': True, 'icon': 'instagram'},
        {'id': 'linkedin', 'name': 'LinkedIn', 'connected': False, 'icon': 'linkedin'},
        {'id': 'google_business', 'name': 'Google Business Profile', 'connected': False, 'icon': 'google'},
        {'id': 'whatsapp', 'name': 'WhatsApp Business', 'connected': False, 'icon': 'whatsapp'},
        {'id': 'email', 'name': 'Email Marketing', 'connected': False, 'icon': 'email'},
    ]
    return _ok(platforms)


# ── HELPERS ─────────────────────────────────────────────────────────

def _parse_date(val):
    if not val:
        return None
    if isinstance(val, str):
        try:
            return datetime.strptime(val, '%Y-%m-%d').date()
        except ValueError:
            pass
    return val
