"""
routes/social.py — API de redes sociales
"""
import json
import logging
import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from extensions import db
from models import Property, PortalLog
from social.models import SocialAccount, SocialPost, SocialTemplate
from social.services import FacebookService, InstagramService
from social.auto_describer import generate_description
from social.worker import publish_social_post
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR
from log_activity import log_activity
from utils import _ok, _err

logger = logging.getLogger(__name__)

bp = Blueprint('social', __name__, url_prefix='/api/social')


# ── Cuentas ──────────────────────────────────────────────────────────

@bp.route('/accounts', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_accounts():
    accounts = SocialAccount.query.order_by(SocialAccount.platform, SocialAccount.id).all()
    return _ok([a.to_dict() for a in accounts])


@bp.route('/accounts', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def create_account():
    data = request.get_json(silent=True) or {}
    platform = data.get('platform', '').strip().lower()
    if platform not in ('facebook', 'instagram'):
        return _err('platform debe ser "facebook" o "instagram"')
    label = data.get('label', '').strip() or platform
    account = SocialAccount(
        platform=platform,
        label=label,
        active=bool(data.get('active', True)),
        page_id=data.get('page_id', ''),
        ig_user_id=data.get('ig_user_id', ''),
    )
    if data.get('config'):
        account.config = data['config']
    db.session.add(account)
    db.session.commit()
    log_activity('social_account_create', 'social_account', account.id, label,
                 f'Cuenta de {platform} creada')
    return _ok(account.to_dict(), 201)


@bp.route('/accounts/<int:aid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_account(aid):
    account = SocialAccount.query.get_or_404(aid)
    data = request.get_json(silent=True) or {}
    if 'label' in data:
        account.label = data['label'].strip()
    if 'active' in data:
        account.active = bool(data['active'])
    if 'page_id' in data:
        account.page_id = data['page_id']
    if 'ig_user_id' in data:
        account.ig_user_id = data['ig_user_id']
    if 'config' in data:
        cfg = account.config
        cfg.update(data['config'])
        account.config = cfg
    db.session.commit()
    log_activity('social_account_update', 'social_account', account.id, account.label,
                 f'Cuenta actualizada')
    return _ok(account.to_dict())


@bp.route('/accounts/<int:aid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_ADMIN)
def delete_account(aid):
    account = SocialAccount.query.get_or_404(aid)
    SocialPost.query.filter_by(account_id=aid).update({'account_id': None})
    db.session.delete(account)
    db.session.commit()
    log_activity('social_account_delete', 'social_account', aid, account.label, 'Cuenta eliminada')
    return _ok({'deleted': True})


# ── Plantillas ─────────────────────────────────────────────────────────

@bp.route('/templates', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_templates():
    templates = SocialTemplate.query.order_by(SocialTemplate.name).all()
    return _ok([t.to_dict() for t in templates])


@bp.route('/templates', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_template():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    content = data.get('content', '').strip()
    if not name or not content:
        return _err('name y content son obligatorios')
    tmpl = SocialTemplate(
        name=name,
        content=content,
        media_urls=json.dumps(data.get('media_urls', [])),
        platform=data.get('platform', ''),
    )
    db.session.add(tmpl)
    db.session.commit()
    return _ok(tmpl.to_dict(), 201)


@bp.route('/templates/<int:tid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_template(tid):
    tmpl = db.session.get(SocialTemplate, tid)
    if not tmpl:
        return _err('Plantilla no encontrada', 404)
    data = request.get_json(silent=True) or {}
    if 'name' in data:
        tmpl.name = data['name'].strip()
    if 'content' in data:
        tmpl.content = data['content'].strip()
    if 'media_urls' in data:
        tmpl.media_urls = json.dumps(data['media_urls'])
    if 'platform' in data:
        tmpl.platform = data['platform']
    db.session.commit()
    return _ok(tmpl.to_dict())


@bp.route('/templates/<int:tid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_template(tid):
    tmpl = db.session.get(SocialTemplate, tid)
    if not tmpl:
        return _err('Plantilla no encontrada', 404)
    db.session.delete(tmpl)
    db.session.commit()
    return _ok({'deleted': True})


# ── Calendar ─────────────────────────────────────────────────────────

@bp.route('/calendar', methods=['GET'])
@require_role(ROLE_EDITOR)
def calendar_posts():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    if year and month:
        from calendar import monthrange
        start = datetime(year, month, 1)
        _, last_day = monthrange(year, month)
        end = datetime(year, month, last_day, 23, 59, 59)
    else:
        from datetime import timedelta
        end = datetime.now(timezone.utc).replace(tzinfo=None)
        start = end - timedelta(days=90)
        end = end + timedelta(days=90)

    posts = SocialPost.query.filter(
        SocialPost.scheduled_at.between(start, end) | SocialPost.published_at.between(start, end)
    ).order_by(SocialPost.scheduled_at.asc().nullslast()).all()
    return _ok([p.to_dict(include_account=True) for p in posts])


@bp.route('/calendar', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def calendar_bulk():
    """Crea múltiples posts desde el calendario (drag & drop o bulk).
    Espera: { posts: [{ account_id, content, scheduled_at, media_urls?, property_id? }] }
    """
    data = request.get_json(silent=True) or {}
    items = data.get('posts', [])
    if not items:
        return _err('Se requiere lista de posts')

    created = []
    for item in items:
        account_id = item.get('account_id')
        if not account_id:
            continue
        content = item.get('content', '').strip()
        if not content:
            continue
        scheduled_at = None
        if item.get('scheduled_at'):
            try:
                scheduled_at = datetime.fromisoformat(item['scheduled_at'])
            except Exception:
                continue
        post = SocialPost(
            account_id=account_id,
            property_id=int(item['property_id']) if item.get('property_id') else None,
            content=content,
            media_urls=json.dumps(item.get('media_urls', [])),
            scheduled_at=scheduled_at,
            status=SocialPost.STATUS_SCHEDULED if scheduled_at else SocialPost.STATUS_DRAFT,
            recurring_interval=item.get('recurring_interval'),
            template_id=int(item['template_id']) if item.get('template_id') else None,
        )
        db.session.add(post)
        created.append(post)
    db.session.commit()
    return _ok([p.to_dict() for p in created], 201)


# ── Analytics ────────────────────────────────────────────────────────

@bp.route('/analytics', methods=['GET'])
@require_role(ROLE_EDITOR)
def social_analytics():
    from sqlalchemy import func, extract
    from datetime import timedelta

    account_id = request.args.get('account_id', type=int)
    days = min(request.args.get('days', 30, type=int), 365)

    q = SocialPost.query
    if account_id:
        q = q.filter_by(account_id=account_id)
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    q = q.filter(SocialPost.created_at >= cutoff)

    total_posts = q.count()
    published = q.filter_by(status=SocialPost.STATUS_PUBLISHED).count()
    failed = q.filter_by(status=SocialPost.STATUS_FAILED).count()
    scheduled = q.filter_by(status=SocialPost.STATUS_SCHEDULED).count()
    drafts = q.filter_by(status=SocialPost.STATUS_DRAFT).count()

    # Engagement
    engagement = q.with_entities(
        func.coalesce(func.sum(SocialPost.engagement_likes), 0),
        func.coalesce(func.sum(SocialPost.engagement_comments), 0),
        func.coalesce(func.sum(SocialPost.engagement_shares), 0),
        func.coalesce(func.sum(SocialPost.engagement_saved), 0),
    ).filter(SocialPost.status == SocialPost.STATUS_PUBLISHED).first()
    total_engagement = sum(engagement) if engagement else 0

    # Posts per day (last 30 days)
    daily_q = db.session.query(
        func.date(SocialPost.published_at).label('date'),
        func.count(SocialPost.id).label('count'),
    ).filter(
        SocialPost.status == SocialPost.STATUS_PUBLISHED,
        SocialPost.published_at >= cutoff,
    )
    if account_id:
        daily_q = daily_q.filter_by(account_id=account_id)
    daily = daily_q.group_by(func.date(SocialPost.published_at)).order_by('date').all()

    # By account breakdown (single aggregate query)
    account_stats = []
    acct_pub_counts = dict(db.session.query(
        SocialPost.account_id, func.count(SocialPost.id)
    ).filter(
        SocialPost.status == SocialPost.STATUS_PUBLISHED,
        SocialPost.published_at >= cutoff,
    ).group_by(SocialPost.account_id).all())
    acct_engagement = dict()
    for row in db.session.query(
        SocialPost.account_id,
        func.coalesce(func.sum(SocialPost.engagement_likes), 0).label('likes'),
        func.coalesce(func.sum(SocialPost.engagement_comments), 0).label('comments'),
    ).filter(
        SocialPost.status == SocialPost.STATUS_PUBLISHED,
        SocialPost.published_at >= cutoff,
    ).group_by(SocialPost.account_id).all():
        acct_engagement[row[0]] = (int(row[1]), int(row[2]))

    accts = SocialAccount.query.all()
    for acct in accts:
        if account_id and acct.id != account_id:
            continue
        cnt = acct_pub_counts.get(acct.id, 0)
        if cnt:
            likes, comments = acct_engagement.get(acct.id, (0, 0))
            account_stats.append({
                'account_id': acct.id,
                'account_label': acct.label,
                'platform': acct.platform,
                'posts': cnt,
                'engagement_likes': likes,
                'engagement_comments': comments,
            })

    return _ok({
        'period_days': days,
        'total_posts': total_posts,
        'published': published,
        'failed': failed,
        'scheduled': scheduled,
        'drafts': drafts,
        'total_engagement': int(total_engagement),
        'engagement_likes': int(engagement[0]) if engagement else 0,
        'engagement_comments': int(engagement[1]) if engagement else 0,
        'engagement_shares': int(engagement[2]) if engagement else 0,
        'engagement_saved': int(engagement[3]) if engagement else 0,
        'daily_posts': [{'date': str(r.date), 'count': r.count} for r in daily],
        'by_account': account_stats,
    })


# ── Engagement fetch ─────────────────────────────────────────────────

@bp.route('/posts/<int:pid>/engagement', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def fetch_post_engagement(pid):
    """Obtiene métricas de engagement desde la API de Meta."""
    post = SocialPost.query.get_or_404(pid)
    if not post.external_id:
        return _err('Este post no tiene external_id (no fue publicado por API)')

    account = db.session.get(SocialAccount, post.account_id)
    if not account:
        return _err('Cuenta no encontrada')

    try:
        from social.services import _get_page_token
        import requests
        token = _get_page_token(account)

        if account.platform == 'facebook':
            url = f'https://graph.facebook.com/v21.0/{post.external_id}'
            params = {
                'fields': 'likes.summary(true),comments.summary(true),shares',
                'access_token': token,
            }
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code != 200:
                return _err(f'Error Meta API: {resp.text[:300]}')
            data = resp.json()
            post.engagement_likes = data.get('likes', {}).get('summary', {}).get('total_count', 0)
            post.engagement_comments = data.get('comments', {}).get('summary', {}).get('total_count', 0)
            post.engagement_shares = data.get('shares', {}).get('count', 0)

        elif account.platform == 'instagram':
            url = f'https://graph.facebook.com/v21.0/{post.external_id}'
            params = {
                'fields': 'like_count,comments_count,saved_count',
                'access_token': token,
            }
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code != 200:
                return _err(f'Error IG API: {resp.text[:300]}')
            data = resp.json()
            post.engagement_likes = data.get('like_count', 0)
            post.engagement_comments = data.get('comments_count', 0)
            post.engagement_saved = data.get('saved_count', 0)

        db.session.commit()
        return _ok({
            'likes': post.engagement_likes,
            'comments': post.engagement_comments,
            'shares': post.engagement_shares,
            'saved': post.engagement_saved,
        })

    except Exception as e:
        return _err(f'Error obteniendo engagement: {str(e)[:500]}')


# ── Posts ────────────────────────────────────────────────────────────

@bp.route('/posts', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_posts():
    account_id = request.args.get('account_id', type=int)
    status = request.args.get('status')
    template_id = request.args.get('template_id', type=int)
    period = request.args.get('period')  # 'upcoming' | 'past'
    q = SocialPost.query
    if account_id:
        q = q.filter_by(account_id=account_id)
    if status:
        q = q.filter_by(status=status)
    if template_id:
        q = q.filter_by(template_id=template_id)
    if period == 'upcoming':
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        q = q.filter(SocialPost.scheduled_at >= now)
    elif period == 'past':
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        q = q.filter(SocialPost.scheduled_at < now)
    q = q.order_by(SocialPost.scheduled_at.asc().nullslast(), SocialPost.created_at.desc()).limit(200)
    return _ok([p.to_dict(include_account=True) for p in q.all()])


@bp.route('/posts', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_post():
    data = request.get_json(silent=True) or {}
    account_id = data.get('account_id')
    if not account_id:
        return _err('account_id es obligatorio')
    account = db.session.get(SocialAccount, account_id)
    if not account:
        return _err('Cuenta no encontrada')

    content = data.get('content', '').strip()
    if not content:
        return _err('content es obligatorio')

    property_id = int(data['property_id']) if data.get('property_id') else None
    media_urls = json.dumps(data.get('media_urls', []))
    scheduled_at = None
    if data.get('scheduled_at'):
        try:
            scheduled_at = datetime.fromisoformat(data['scheduled_at'])
        except Exception:
            return _err('scheduled_at inválido. Usar ISO 8601')

    template_id = int(data['template_id']) if data.get('template_id') else None
    recurring_interval = int(data['recurring_interval']) if data.get('recurring_interval') else None

    post = SocialPost(
        account_id=account_id,
        property_id=property_id,
        content=content,
        media_urls=media_urls,
        scheduled_at=scheduled_at,
        status=SocialPost.STATUS_DRAFT if scheduled_at else SocialPost.STATUS_SCHEDULED,
        template_id=template_id,
        recurring_interval=recurring_interval,
    )
    db.session.add(post)
    db.session.commit()

    # Si es recurrente y se publicó, crear siguiente post automáticamente
    if post.recurring_interval and post.status == SocialPost.STATUS_PUBLISHED:
        next_at = None
        if post.published_at:
            from datetime import timedelta
            next_at = post.published_at + timedelta(days=post.recurring_interval)
        if next_at:
            next_post = SocialPost(
                account_id=account_id,
                property_id=property_id,
                content=content,
                media_urls=media_urls,
                scheduled_at=next_at,
                status=SocialPost.STATUS_SCHEDULED,
                template_id=template_id,
                recurring_interval=recurring_interval,
            )
            db.session.add(next_post)
            db.session.commit()

    # Publicar inmediatamente si no está programado
    if not scheduled_at:
        try:
            publish_social_post(post.id)
            db.session.refresh(post)
        except Exception as e:
            post.status = SocialPost.STATUS_FAILED
            post.error = str(e)[:500]
            db.session.commit()
            log_activity('social_post_fail', 'social_post', post.id, '', str(e)[:200])
            return _ok(post.to_dict(), 202)

    log_activity('social_post_create', 'social_post', post.id, '', f'Post creado para {account.label}')
    return _ok(post.to_dict(), 201)


@bp.route('/posts/<int:pid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_post(pid):
    post = SocialPost.query.get_or_404(pid)
    if post.status not in (SocialPost.STATUS_DRAFT, SocialPost.STATUS_SCHEDULED):
        return _err('Solo se pueden editar posts en draft o scheduled')
    data = request.get_json(silent=True) or {}
    if 'content' in data:
        post.content = data['content'].strip()
    if 'media_urls' in data:
        post.media_urls = json.dumps(data['media_urls'])
    if 'scheduled_at' in data:
        try:
            post.scheduled_at = datetime.fromisoformat(data['scheduled_at']) if data['scheduled_at'] else None
        except Exception:
            return _err('scheduled_at inválido')
    if 'status' in data:
        post.status = data['status']
        if data['status'] == SocialPost.STATUS_PUBLISHING:
            try:
                publish_social_post(post.id)
            except Exception as e:
                post.status = SocialPost.STATUS_FAILED
                post.error = str(e)[:500]
                db.session.commit()
                return _ok(post.to_dict(), 202)
    db.session.commit()
    return _ok(post.to_dict())


@bp.route('/posts/<int:pid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_post(pid):
    post = SocialPost.query.get_or_404(pid)
    if post.status == SocialPost.STATUS_PUBLISHED:
        return _err('No se puede eliminar un post ya publicado')
    db.session.delete(post)
    db.session.commit()
    return _ok({'deleted': True})


# ── Generar descripción ──────────────────────────────────────────────

@bp.route('/generate-description', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def generate_description_endpoint():
    data = request.get_json(silent=True) or {}
    prop_id = int(data['property_id']) if data.get('property_id') else None
    if not prop_id:
        return _err('property_id es obligatorio')
    prop = db.session.get(Property, prop_id)
    if not prop:
        return _err('Propiedad no encontrada')
    desc = generate_description(prop)
    return _ok({'description': desc})


# ── Probar conexión ──────────────────────────────────────────────────

@bp.route('/accounts/<int:aid>/test', methods=['POST'])
@csrf_protect
@require_role(ROLE_ADMIN)
def test_account_connection(aid):
    """Prueba la conexión con la red social obteniendo datos básicos."""
    from social.services import _get_page_token
    account = SocialAccount.query.get_or_404(aid)
    try:
        from social.services import _get_page_token
        import requests
        # Intentar obtener page token; si falla, usar el raw access_token como fallback
        try:
            token = _get_page_token(account)
        except Exception:
            config = account.config
            token = (config or {}).get('access_token', '')
            if not token:
                return _err('No hay access_token configurado. Ingresá el token en la cuenta.')

        if account.platform == 'facebook':
            if not account.page_id:
                return _err('Falta el Page ID de Facebook.')
            url = f'https://graph.facebook.com/v21.0/{account.page_id}'
            params = {'fields': 'name,fan_count,about', 'access_token': token}
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code != 200:
                err_data = resp.json()
                msg = err_data.get('error', {}).get('message', resp.text[:300])
                return _err(f'Error de Facebook: {msg}')
            data = resp.json()
            return _ok({
                'connected': True,
                'name': data.get('name', ''),
                'followers': data.get('fan_count', 0),
                'platform': 'facebook',
            })
        elif account.platform == 'instagram':
            if not account.ig_user_id:
                return _err('Falta el Instagram Business Account ID.')
            url = f'https://graph.facebook.com/v21.0/{account.ig_user_id}'
            params = {'fields': 'name,username,followers_count,media_count', 'access_token': token}
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code != 200:
                err_data = resp.json()
                msg = err_data.get('error', {}).get('message', resp.text[:300])
                return _err(f'Error de Instagram: {msg}')
            data = resp.json()
            return _ok({
                'connected': True,
                'name': data.get('name', '') or data.get('username', ''),
                'followers': data.get('followers_count', 0),
                'platform': 'instagram',
            })
        return _err('Plataforma no soportada')
    except ValueError as e:
        return _err(str(e))
    except Exception as e:
        return _err(f'Error de conexión: {str(e)[:500]}')


# ── Stats para health / dashboard ────────────────────────────────────

@bp.route('/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def social_stats():
    accounts_count = SocialAccount.query.count()
    posts_count = SocialPost.query.count()
    pending = SocialPost.query.filter(
        SocialPost.status.in_([SocialPost.STATUS_SCHEDULED, SocialPost.STATUS_DRAFT])
    ).count()
    published = SocialPost.query.filter_by(status=SocialPost.STATUS_PUBLISHED).count()
    failed = SocialPost.query.filter_by(status=SocialPost.STATUS_FAILED).count()
    return _ok({
        'accounts': accounts_count,
        'posts': posts_count,
        'pending': pending,
        'published': published,
        'failed': failed,
    })


# ── Webhook Meta ─────────────────────────────────────────────────────

@bp.route('/webhook', methods=['GET', 'POST'])
def meta_webhook():
    """Webhook de Meta Platform.
    GET → verificación (hub.mode, hub.verify_token, hub.challenge)
    POST → notificaciones de cambios (comentarios, leads, etc.)
    """
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        verify_token = os.getenv('META_WEBHOOK_SECRET', 'bienenhaus_verify_2024')
        if mode == 'subscribe' and token == verify_token and challenge:
            return challenge, 200, {'Content-Type': 'text/plain'}
        return 'Verification failed', 403

    body = request.get_data(as_text=True)
    try:
        data = request.get_json(force=True, silent=True) or {}
    except Exception:
        data = {}

    logger.info('Webhook Meta: entry_count=%s', len(data.get('entry', [])))

    try:
        log = PortalLog(
            portal='meta_webhook',
            action='incoming',
            status='ok',
            details=json.dumps(data, default=str)[:2000],
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return '', 200
