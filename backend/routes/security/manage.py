from datetime import datetime, timezone, timedelta
import json
import secrets
import hashlib
from flask import request, session, jsonify
from sqlalchemy import func
from extensions import db
from models import User, SecurityEvent, ApiKey, Webhook, Device, SystemEvent
from models.rbac import AuditUser, UserSession
from models import ActivityLog
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_EDITOR
from utils import _ok, _err

from . import bp


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── Dashboard (KPIs) ──────────────────────────────────────────────

@bp.route('/dashboard', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_dashboard():
    active_keys  = ApiKey.query.filter_by(active=True).count()
    active_wh    = Webhook.query.filter_by(active=True).count()
    events_today = SecurityEvent.query.filter(
        func.date(SecurityEvent.created_at) == func.current_date()
    ).count()
    unresolved   = SecurityEvent.query.filter_by(resolved=False).count()
    system_today = SystemEvent.query.filter(
        func.date(SystemEvent.created_at) == func.current_date()
    ).count()
    total_devices = Device.query.count()
    recent_events = SecurityEvent.query.order_by(SecurityEvent.id.desc()).limit(5).all()
    recent_system = SystemEvent.query.order_by(SystemEvent.id.desc()).limit(5).all()
    return _ok({
        'active_keys': active_keys,
        'active_webhooks': active_wh,
        'events_today': events_today,
        'unresolved_events': unresolved,
        'system_events_today': system_today,
        'total_devices': total_devices,
        'recent_events': [e.to_dict() for e in recent_events],
        'recent_system_events': [e.to_dict() for e in recent_system],
    })


# ── API Keys ──────────────────────────────────────────────────────

@bp.route('/api-keys', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_api_keys():
    keys = ApiKey.query.order_by(ApiKey.created_at.desc()).all()
    return _ok([k.to_dict() for k in keys])


@bp.route('/api-keys', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def create_api_key():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return _err('Nombre requerido', 400)
    user_id = data.get('user_id') or session.get('user_id')
    scopes  = data.get('scopes', [])
    raw_key = f'bienenhaus_{secrets.token_hex(24)}'
    prefix  = raw_key[:14]
    key_hash = _hash_key(raw_key)
    expires_at = None
    if data.get('expires_in_days'):
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=int(data['expires_in_days']))
    key = ApiKey(
        user_id=user_id, name=name,
        key_prefix=prefix, key_hash=key_hash,
        scopes=json.dumps(scopes),
        expires_at=expires_at,
    )
    db.session.add(key)
    db.session.commit()
    result = key.to_dict()
    result['raw_key'] = raw_key
    return _ok(result, 201)


@bp.route('/api-keys/<int:kid>', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_api_key(kid):
    key = db.session.get(ApiKey, kid)
    if not key:
        return _err('No encontrada', 404)
    data = request.get_json(silent=True) or {}
    if 'name' in data:
        key.name = data['name'].strip()
    if 'scopes' in data:
        key.scopes = json.dumps(data['scopes'])
    if 'active' in data:
        key.active = bool(data['active'])
    if 'expires_in_days' in data:
        key.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=int(data['expires_in_days']))
    db.session.commit()
    return _ok(key.to_dict())


@bp.route('/api-keys/<int:kid>', methods=['DELETE'])
@require_role(ROLE_ADMIN)
@csrf_protect
def delete_api_key(kid):
    key = db.session.get(ApiKey, kid)
    if not key:
        return _err('No encontrada', 404)
    db.session.delete(key)
    db.session.commit()
    return _ok({'deleted': True})


# ── Webhooks ──────────────────────────────────────────────────────

@bp.route('/webhooks', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_webhooks():
    whs = Webhook.query.order_by(Webhook.created_at.desc()).all()
    return _ok([w.to_dict() for w in whs])


@bp.route('/webhooks', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def create_webhook():
    data = request.get_json(silent=True) or {}
    name   = (data.get('name') or '').strip()
    url    = (data.get('url') or '').strip()
    events = data.get('events', [])
    if not name or not url:
        return _err('Nombre y URL requeridos', 400)
    wh = Webhook(
        user_id=data.get('user_id') or session.get('user_id'),
        name=name, url=url,
        events=json.dumps(events),
        secret=secrets.token_hex(32),
    )
    db.session.add(wh)
    db.session.commit()
    result = wh.to_dict()
    result['secret'] = wh.secret
    return _ok(result, 201)


@bp.route('/webhooks/<int:wid>', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_webhook(wid):
    wh = db.session.get(Webhook, wid)
    if not wh:
        return _err('No encontrado', 404)
    data = request.get_json(silent=True) or {}
    for field in ('name', 'url'):
        if field in data:
            setattr(wh, field, data[field].strip())
    if 'events' in data:
        wh.events = json.dumps(data['events'])
    if 'active' in data:
        wh.active = bool(data['active'])
    db.session.commit()
    return _ok(wh.to_dict())


@bp.route('/webhooks/<int:wid>', methods=['DELETE'])
@require_role(ROLE_ADMIN)
@csrf_protect
def delete_webhook(wid):
    wh = db.session.get(Webhook, wid)
    if not wh:
        return _err('No encontrado', 404)
    db.session.delete(wh)
    db.session.commit()
    return _ok({'deleted': True})


@bp.route('/webhooks/<int:wid>/test', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def test_webhook(wid):
    wh = db.session.get(Webhook, wid)
    if not wh:
        return _err('No encontrado', 404)
    import requests as _req
    try:
        resp = _req.post(wh.url, json={'test': True, 'timestamp': str(datetime.now(timezone.utc))}, timeout=10)
        wh.last_status = 'ok' if resp.ok else 'error'
        wh.last_response = f'HTTP {resp.status_code}: {resp.text[:500]}'
        wh.failure_count = 0 if resp.ok else (wh.failure_count or 0) + 1
    except Exception as e:
        wh.last_status = 'error'
        wh.last_response = str(e)[:500]
        wh.failure_count = (wh.failure_count or 0) + 1
    wh.last_called_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.commit()
    return _ok(wh.to_dict())


# ── Devices ───────────────────────────────────────────────────────

@bp.route('/devices', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_devices():
    user_id = request.args.get('user_id', type=int)
    q = Device.query
    if user_id:
        q = q.filter_by(user_id=user_id)
    devices = q.order_by(Device.last_seen.desc()).all()
    return _ok([d.to_dict() for d in devices])


@bp.route('/devices/<int:did>', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_device(did):
    dev = db.session.get(Device, did)
    if not dev:
        return _err('No encontrado', 404)
    data = request.get_json(silent=True) or {}
    if 'trusted' in data:
        dev.trusted = bool(data['trusted'])
    if 'name' in data:
        dev.name = data['name'].strip()
    db.session.commit()
    return _ok(dev.to_dict())


@bp.route('/devices/<int:did>', methods=['DELETE'])
@require_role(ROLE_ADMIN)
@csrf_protect
def delete_device(did):
    dev = db.session.get(Device, did)
    if not dev:
        return _err('No encontrado', 404)
    db.session.delete(dev)
    db.session.commit()
    return _ok({'deleted': True})


# ── Security Events ───────────────────────────────────────────────

@bp.route('/events', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_security_events():
    page   = request.args.get('page', 1, type=int)
    per    = request.args.get('per_page', 20, type=int)
    sev    = request.args.get('severity', '')
    evtype = request.args.get('event_type', '')
    q = SecurityEvent.query
    if sev:
        q = q.filter_by(severity=sev)
    if evtype:
        q = q.filter_by(event_type=evtype)
    total = q.count()
    items = q.order_by(SecurityEvent.id.desc()).offset((page - 1) * per).limit(per).all()
    return _ok({
        'items': [e.to_dict() for e in items],
        'total': total, 'page': page, 'per_page': per,
    })


@bp.route('/events/<int:eid>/resolve', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def resolve_event(eid):
    ev = db.session.get(SecurityEvent, eid)
    if not ev:
        return _err('No encontrado', 404)
    ev.resolved = True
    ev.resolved_by = session.get('user_id')
    ev.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.commit()
    return _ok(ev.to_dict())


@bp.route('/events/types', methods=['GET'])
@require_role(ROLE_ADMIN)
def event_types():
    rows = db.session.query(SecurityEvent.event_type, func.count(SecurityEvent.id)).group_by(SecurityEvent.event_type).all()
    return _ok([{'type': r[0], 'count': r[1]} for r in rows])


# ── Login Attempts ────────────────────────────────────────────────

@bp.route('/login-attempts', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_login_attempts():
    page = request.args.get('page', 1, type=int)
    per  = request.args.get('per_page', 20, type=int)
    user_filter = request.args.get('user_id', type=int)
    q = User.query
    if user_filter:
        q = q.filter(User.id == user_filter)
    total = q.count()
    users = q.order_by(User.last_login.desc().nullslast()).offset((page - 1) * per).limit(per).all()
    items = []
    for u in users:
        items.append({
            'user_id': u.id, 'username': u.username,
            'display_name': u.display_name or u.username,
            'login_attempts': u.login_attempts,
            'locked_until': str(u.locked_until) if u.locked_until else None,
            'last_login': str(u.last_login) if u.last_login else None,
            'last_ip': u.last_ip,
            'is_active': u.is_active,
        })
    return _ok({'items': items, 'total': total, 'page': page, 'per_page': per})


@bp.route('/login-attempts/<int:uid>/unlock', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def unlock_user(uid):
    user = db.session.get(User, uid)
    if not user:
        return _err('No encontrado', 404)
    user.login_attempts = 0
    user.locked_until = None
    db.session.commit()
    return _ok({'unlocked': True, 'username': user.username})


# ── System Events ─────────────────────────────────────────────────

@bp.route('/system-events', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_system_events():
    page   = request.args.get('page', 1, type=int)
    per    = request.args.get('per_page', 20, type=int)
    sev    = request.args.get('severity', '')
    evtype = request.args.get('event_type', '')
    q = SystemEvent.query
    if sev:
        q = q.filter_by(severity=sev)
    if evtype:
        q = q.filter_by(event_type=evtype)
    total = q.count()
    items = q.order_by(SystemEvent.id.desc()).offset((page - 1) * per).limit(per).all()
    return _ok({
        'items': [e.to_dict() for e in items],
        'total': total, 'page': page, 'per_page': per,
    })


@bp.route('/system-events/<int:eid>/resolve', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def resolve_system_event(eid):
    ev = db.session.get(SystemEvent, eid)
    if not ev:
        return _err('No encontrado', 404)
    ev.resolved = True
    db.session.commit()
    return _ok(ev.to_dict())


# ── Audit Logs ────────────────────────────────────────────────────

@bp.route('/audit-logs', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_audit_logs():
    page = request.args.get('page', 1, type=int)
    per  = request.args.get('per_page', 20, type=int)
    q = AuditUser.query
    total = q.count()
    items = q.order_by(AuditUser.id.desc()).offset((page - 1) * per).limit(per).all()
    return _ok({
        'items': [a.to_dict() for a in items],
        'total': total, 'page': page, 'per_page': per,
    })


@bp.route('/activity-logs', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_activity_logs():
    page = request.args.get('page', 1, type=int)
    per  = request.args.get('per_page', 20, type=int)
    q = ActivityLog.query
    total = q.count()
    items = q.order_by(ActivityLog.id.desc()).offset((page - 1) * per).limit(per).all()
    return _ok({
        'items': [a.to_dict() for a in items],
        'total': total, 'page': page, 'per_page': per,
    })


# ── Users (simple list for dropdowns) ─────────────────────────────

@bp.route('/users', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_users_simple():
    users = User.query.order_by(User.username).all()
    return _ok([{'id': u.id, 'username': u.username, 'display_name': u.display_name or u.username} for u in users])
