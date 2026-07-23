"""
social/worker.py — Worker de publicación programada para redes sociales.
Daemon loop con señal SIGTERM/SIGINT, polling eficiente con threading.Event.
"""
import json
import logging
import os
import signal
import sys
import threading
import time
from datetime import datetime, timezone

try:
    import sentry_sdk
    _has_sentry = True
except ImportError:
    _has_sentry = False

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_POLL_INTERVAL = int(os.getenv('SOCIAL_WORKER_INTERVAL', '60'))
_stop_event = threading.Event()


def _capture(msg, extra=None):
    if _has_sentry:
        with sentry_sdk.new_scope() as scope:
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            sentry_sdk.capture_message(msg, level='error')


def _signal_handler(signum, frame):
    logger.info('Recibida señal %s, cerrando worker...', signum)
    _stop_event.set()


def _parse_media(post):
    if isinstance(post.media_urls, str):
        try:
            return json.loads(post.media_urls)
        except Exception:
            return []
    if isinstance(post.media_urls, list):
        return post.media_urls
    return []


def _get_platform_service(account):
    from social.services import FacebookService, InstagramService
    if account.platform == 'facebook':
        return FacebookService(account)
    if account.platform == 'instagram':
        return InstagramService(account)
    raise ValueError(f'Plataforma desconocida: {account.platform}')


def _handle_publish_error(post, account, post_id, e):
    from social.models import SocialPost
    post.retry_count = (post.retry_count or 0) + 1
    post.error = str(e)[:500]
    if post.retry_count >= _MAX_RETRIES:
        post.status = SocialPost.STATUS_FAILED
        logger.error('SocialPost %s agotó reintentos: %s', post_id, e)
        _capture('SocialPost agotó reintentos', extra={'post_id': post_id, 'error': str(e)[:500]})
        try:
            from webhook_service import notify_publish_error
            notify_publish_error(
                'social_post', post_id,
                post.content[:60] if post.content else f'Post #{post_id}',
                'publish', account.platform, str(e)[:200],
            )
        except Exception:
            pass
    else:
        post.status = SocialPost.STATUS_SCHEDULED
        logger.warning('SocialPost %s error (intento %s/%s): %s',
                       post_id, post.retry_count, _MAX_RETRIES, e)


def publish_social_post(post_id):
    """Publica un SocialPost. Se llama sincrónicamente o desde el worker."""
    from extensions import db
    from social.models import SocialPost, SocialAccount
    from log_activity import log_activity

    post = db.session.get(SocialPost, post_id)
    if not post:
        logger.warning('SocialPost %s no encontrado', post_id)
        return False

    if post.status == SocialPost.STATUS_PUBLISHED:
        return True

    account = db.session.get(SocialAccount, post.account_id)
    if not account:
        post.status = SocialPost.STATUS_FAILED
        post.error = 'Cuenta asociada no encontrada'
        db.session.commit()
        return False

    if not account.active:
        post.status = SocialPost.STATUS_FAILED
        post.error = 'Cuenta inactiva'
        db.session.commit()
        return False

    try:
        media = _parse_media(post)
        svc = _get_platform_service(account)
        external_id = svc.publish(post.content, media)

        post.status = SocialPost.STATUS_PUBLISHED
        post.external_id = external_id
        post.published_at = datetime.now(timezone.utc).replace(tzinfo=None)
        post.error = ''
        post.retry_count = 0
        db.session.commit()
        log_activity('social_post_published', 'social_post', post.id,
                     f'{account.platform}/{account.label}', 'Post publicado exitosamente')
        logger.info('SocialPost %s publicado en %s (ext_id=%s)', post_id, account.platform, external_id)
        return True

    except Exception as e:
        _handle_publish_error(post, account, post_id, e)
        db.session.commit()
        return False


def process_scheduled_posts(limit=10):
    """Procesa posts programados cuyo scheduled_at ya pasó."""
    from extensions import db
    from social.models import SocialPost

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    pending = SocialPost.query.filter(
        SocialPost.status == SocialPost.STATUS_SCHEDULED,
        SocialPost.scheduled_at <= now,
        SocialPost.retry_count < _MAX_RETRIES,
    ).order_by(SocialPost.scheduled_at.asc()).limit(limit).all()

    processed = 0
    errors = 0
    for post in pending:
        try:
            ok = publish_social_post(post.id)
            if ok:
                processed += 1
            else:
                errors += 1
        except Exception as e:
            logger.exception('Error inesperado procesando SocialPost %s: %s', post.id, e)
            errors += 1
            _capture('Error inesperado en social worker', extra={'post_id': post.id, 'error': str(e)[:500]})

    return processed, errors


def run_once():
    """Ejecuta un ciclo único (usado desde CLI `flask social-worker`)."""
    from app import create_app
    app = create_app()
    with app.app_context():
        processed, errors = process_scheduled_posts()
        logger.info('Social worker: %s publicados, %s errores', processed, errors)
        return errors == 0


def run_forever(stop_check=None):
    """Loop principal del worker daemon.
    
    Corre continuamente, polling cada _POLL_INTERVAL segundos.
    Maneja SIGTERM/SIGINT para cierre graceful.
    Usa threading.Event para evitar busy-waiting.
    
    Args:
        stop_check: callable opcional que retorna True para detener el loop (tests).
    """
    try:
        signal.signal(signal.SIGTERM, _signal_handler)
        signal.signal(signal.SIGINT, _signal_handler)
    except (ValueError, AttributeError):
        pass

    if stop_check is None:
        stop_check = lambda: _stop_event.is_set()

    from app import create_app
    app = create_app()

    logger.info('Social worker daemon iniciado (polling cada %ss)', _POLL_INTERVAL)
    with app.app_context():
        while not stop_check():
            try:
                processed, errors = process_scheduled_posts()
                if processed or errors:
                    logger.info('Ciclo: %s publicados, %s errores', processed, errors)
            except Exception as e:
                logger.exception('Error en ciclo del worker: %s', e)
            finally:
                from extensions import db as _db
                _db.session.remove()

            _POLL_TICK = min(1.0, _POLL_INTERVAL)
            remaining = _POLL_INTERVAL
            while remaining > 0 and not stop_check():
                slept = min(_POLL_TICK, remaining)
                _stop_event.wait(timeout=slept)
                remaining -= slept

    logger.info('Worker daemon terminado.')


if __name__ == '__main__':
    run_forever()
