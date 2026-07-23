"""
CSRF-aware test helpers for one-time CSRF tokens.

Usage:
    from _csrf_helper import _login, _post, _put, _patch, _delete, _csrf

    # Login returns the session (no need to track tokens)
    session = _login(client)

    # Use _post/_put/_patch/_delete — each auto-fetches a fresh CSRF token
    r = _post(client, '/api/properties', {'title': 'Test'})
    r = _put(client, f'/api/properties/{pid}', {'title': 'Updated'})
    r = _patch(client, f'/api/properties/{pid}/status', {'status': 'vendida'})
    r = _delete(client, f'/api/properties/{pid}')

    # For GET requests that need CSRF (admin endpoints), use _get
    r = _get(client, '/api/contact/messages')
"""
import json


def _csrf(client):
    r = client.get('/api/auth/csrf-token')
    return r.get_json()['data']['csrf_token']


def _login(client):
    r = client.post('/api/auth/login',
        data=json.dumps({'username': 'admin', 'password': 'Admin2026!'}),
        content_type='application/json')
    assert r.status_code == 200
    return r.get_json()['data']['csrf_token']


def _get(client, url, **kw):
    """GET request, adds CSRF token if needed (for admin endpoints)."""
    csrf = _csrf(client)
    headers = dict(kw.pop('headers', {}))
    headers.setdefault('X-CSRF-Token', csrf)
    return client.get(url, headers=headers, **kw)


def _post(client, url, data=None, **kw):
    """POST with auto-fetched CSRF token."""
    csrf = _csrf(client)
    headers = dict(kw.pop('headers', {}))
    headers.setdefault('X-CSRF-Token', csrf)
    content_type = kw.pop('content_type', 'application/json')
    body = json.dumps(data) if data is not None else None
    return client.post(url, data=body, content_type=content_type, headers=headers, **kw)


def _put(client, url, data=None, **kw):
    """PUT with auto-fetched CSRF token."""
    csrf = _csrf(client)
    headers = dict(kw.pop('headers', {}))
    headers.setdefault('X-CSRF-Token', csrf)
    content_type = kw.pop('content_type', 'application/json')
    body = json.dumps(data) if data is not None else None
    return client.put(url, data=body, content_type=content_type, headers=headers, **kw)


def _patch(client, url, data=None, **kw):
    """PATCH with auto-fetched CSRF token."""
    csrf = _csrf(client)
    headers = dict(kw.pop('headers', {}))
    headers.setdefault('X-CSRF-Token', csrf)
    content_type = kw.pop('content_type', 'application/json')
    body = json.dumps(data) if data is not None else None
    return client.patch(url, data=body, content_type=content_type, headers=headers, **kw)


def _delete(client, url, **kw):
    """DELETE with auto-fetched CSRF token."""
    csrf = _csrf(client)
    headers = dict(kw.pop('headers', {}))
    headers.setdefault('X-CSRF-Token', csrf)
    return client.delete(url, headers=headers, **kw)
