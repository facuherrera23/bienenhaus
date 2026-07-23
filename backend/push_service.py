"""
push_service.py — Envío de notificaciones push Web Push (VAPID)
"""
import os
import json
import logging
from models import PushSubscription
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY  = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_CLAIM_EMAIL = os.getenv('VAPID_CLAIM_EMAIL', 'admin@bienenhaus.com.ar')


def send_to_all(payload: dict) -> int:
    """Envía una notificación push a todas las suscripciones activas.
    Devuelve la cantidad de envíos exitosos.
    """
    if not VAPID_PRIVATE_KEY:
        logger.warning('[push] VAPID_PRIVATE_KEY no configurada')
        return 0

    subs = PushSubscription.query.all()
    if not subs:
        return 0

    data = json.dumps(payload)
    ok = 0

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {
                        'auth':   sub.auth,
                        'p256dh': sub.p256dh,
                    },
                },
                data=data,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={
                    'sub': f'mailto:{VAPID_CLAIM_EMAIL}',
                },
            )
            ok += 1
        except WebPushException as ex:
            if ex.response and ex.response.status_code == 410:
                logger.info('[push] Suscripción expirada, eliminando: %s', sub.endpoint[:50])
                from extensions import db
                db.session.delete(sub)
                db.session.commit()
            else:
                logger.warning('[push] Error enviando a %s: %s', sub.endpoint[:50], ex)
        except Exception as ex:
            logger.warning('[push] Error inesperado: %s', ex)

    return ok
