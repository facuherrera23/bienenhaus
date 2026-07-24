"""
test_csrf_flow.py — Full CSRF circuit integration tests (bypass DISABLED).

Verifies:
  1. Login returns csrf_token
  2. GET /api/auth/csrf-token returns a fresh token
  3. POST without CSRF token → 403
  4. POST with valid token → success
  5. Reused token → 403
  6. GET works without CSRF token
"""
import json
import pytest

from auth_helper import seed_admin_user


# ── Fixtures ────────────────────────────────────────────────────────────
@pytest.fixture
def csrf_enabled(monkeypatch):
    """Override conftest's CSRF_BYPASS='1' so CSRF protection is active."""
    monkeypatch.setenv('CSRF_BYPASS', '')


@pytest.fixture
def seed_admin(app, monkeypatch):
    """Seed the default admin user into the test DB with a known password."""
    monkeypatch.setenv('ADMIN_PASSWORD', 'Admin123!')
    with app.app_context():
        from models import User, ActivityLog
        from extensions import db
        # Delete existing admin first (and its activity_logs due to FK)
        admin = User.query.filter_by(username='admin').first()
        if admin:
            ActivityLog.query.filter_by(user_id=admin.id).delete()
            User.query.filter_by(username='admin').delete()
            db.session.commit()
        seed_admin_user()


# ── 1. Login returns csrf_token ────────────────────────────────────────
class TestLoginReturnsCsrfToken:
    def test_login_returns_csrf_token(self, app, client, seed_admin, csrf_enabled):
        r = client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'Admin123!'}),
            content_type='application/json',
        )
        body = r.get_json()

        assert r.status_code == 200
        assert body['ok'] is True
        token = body['data']['csrf_token']
        assert isinstance(token, str) and len(token) == 64  # secrets.token_hex(32)


# ── 2. GET /api/auth/csrf-token returns a fresh token ──────────────────
class TestCsrfTokenEndpoint:
    def test_csrf_token_returns_fresh_token(self, client, csrf_enabled):
        r = client.get('/api/auth/csrf-token')
        body = r.get_json()

        assert r.status_code == 200
        assert body['ok'] is True
        token = body['data']['csrf_token']
        assert isinstance(token, str) and len(token) == 64

        r2 = client.get('/api/auth/csrf-token')
        body2 = r2.get_json()
        assert body2['data']['csrf_token'] != token  # each call is unique


# ── 3. POST without CSRF token → 403 ──────────────────────────────────
class TestPostWithoutCsrfReturns403:
    def test_post_agents_without_token_is_forbidden(self, admin_session, csrf_enabled):
        r = admin_session.post(
            '/api/agents',
            data=json.dumps({'name': 'Agent Sin Token'}),
            content_type='application/json',
        )
        assert r.status_code == 403
        body = r.get_json()
        assert body['ok'] is False
        assert 'CSRF' in body['error'] or 'csrf' in body['error'].lower()


# ── 4. POST with valid X-CSRF-Token → success ──────────────────────────
class TestPostWithValidCsrfSucceeds:
    def test_post_agents_with_valid_token(self, admin_session, csrf_enabled):
        token_resp = admin_session.get('/api/auth/csrf-token')
        token = token_resp.get_json()['data']['csrf_token']

        r = admin_session.post(
            '/api/agents',
            data=json.dumps({'name': 'Agent Con Token'}),
            content_type='application/json',
            headers={'X-CSRF-Token': token},
        )
        body = r.get_json()

        assert r.status_code == 201
        assert body['ok'] is True
        assert body['data']['name'] == 'Agent Con Token'


# ── 5. Reused (already-consumed) token → 403 ───────────────────────────
class TestReusedTokenReturns403:
    def test_reused_token_is_rejected(self, admin_session, csrf_enabled):
        token_resp = admin_session.get('/api/auth/csrf-token')
        token = token_resp.get_json()['data']['csrf_token']

        # First use — should succeed
        r1 = admin_session.post(
            '/api/agents',
            data=json.dumps({'name': 'Agent Primero'}),
            content_type='application/json',
            headers={'X-CSRF-Token': token},
        )
        assert r1.status_code == 201

        # Second use with same token — must be rejected
        r2 = admin_session.post(
            '/api/agents',
            data=json.dumps({'name': 'Agent Segundo'}),
            content_type='application/json',
            headers={'X-CSRF-Token': token},
        )
        assert r2.status_code == 403
        body2 = r2.get_json()
        assert body2['ok'] is False


# ── 6. GET requests work without CSRF token ─────────────────────────────
class TestGetWorksWithoutCsrf:
    def test_get_agents_without_token(self, admin_session, csrf_enabled):
        r = admin_session.get('/api/agents')
        assert r.status_code == 200
        body = r.get_json()
        assert body['ok'] is True
        assert isinstance(body['data'], list)
