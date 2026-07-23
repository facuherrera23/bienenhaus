"""
routes/push.py — Web Push subscription API
"""
import json
import os
from flask import Blueprint, request, jsonify
from extensions import db
from models import PushSubscription
from auth_helper import require_role, ROLE_ADMIN
from csrf import csrf_protect
from utils import _ok, _err

bp = Blueprint('push', __name__)


@bp.route('/api/push/subscribe', methods=['POST'])
@csrf_protect
def subscribe():
    data = request.get_json(silent=True) or {}
    endpoint = data.get('endpoint', '').strip()
    keys = data.get('keys', {})
    if not isinstance(keys, dict):
        return _err('keys debe ser un objeto.')
    auth = keys.get('auth', '')
    p256dh = keys.get('p256dh', '')

    if not endpoint or not auth or not p256dh:
        return _err('endpoint, keys.auth y keys.p256dh son obligatorios.')

    existing = PushSubscription.query.filter_by(endpoint=endpoint).first()
    if existing:
        existing.auth = auth
        existing.p256dh = p256dh
        existing.user_agent = request.headers.get('User-Agent', '')
    else:
        sub = PushSubscription(
            endpoint=endpoint, auth=auth, p256dh=p256dh,
            user_agent=request.headers.get('User-Agent', ''),
        )
        db.session.add(sub)

    db.session.commit()
    return _ok({'message': 'Suscripción registrada.'})


@bp.route('/api/push/unsubscribe', methods=['POST'])
@csrf_protect
def unsubscribe():
    data = request.get_json(silent=True) or {}
    endpoint = data.get('endpoint', '').strip()
    if endpoint:
        PushSubscription.query.filter_by(endpoint=endpoint).delete()
        db.session.commit()
    return _ok({'message': 'Suscripción eliminada.'})


@bp.route('/api/push/subscriptions', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_subscriptions():
    subs = PushSubscription.query.order_by(PushSubscription.created_at.desc()).all()
    return _ok({'subscriptions': [s.to_dict() for s in subs]})
