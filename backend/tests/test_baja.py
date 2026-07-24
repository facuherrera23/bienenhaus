"""
Tests de integración para el endpoint de baja de datos personales.
"""
import pytest
import time
from extensions import db
from models import BajaRequest


# Fixture to enable rate limiting for specific tests
@pytest.fixture
def rate_limit_enabled(app):
    """Temporarily enable rate limiting for this test."""
    app.config['RATELIMIT_ENABLED'] = True
    yield
    app.config['RATELIMIT_ENABLED'] = False


class TestBajaPublicPost:

    def _valid_payload(self, **overrides):
        payload = {
            'name': 'Juan P\u00e9rez',
            'email': 'juan@test.com',
            'phone': '3511234567',
            'motivo': 'supresion',
            'message': 'Eliminar todos mis datos',
            '_ts': '0',
            '_website': '',
        }
        payload.update(overrides)
        return payload

    def test_submit_baja_ok(self, app, client):
        """POST con datos v\u00e1lidos -> 201 y registro persistido."""
        resp = client.post('/api/baja', json=self._valid_payload(),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['ok'] is True
        assert 'Solicitud recibida' in data['data']['message']

        with app.app_context():
            req = BajaRequest.query.first()
            assert req is not None
            assert req.name == 'Juan P\u00e9rez'
            assert req.email == 'juan@test.com'
            assert req.phone == '3511234567'
            assert req.motivo == 'supresion'
            assert req.message == 'Eliminar todos mis datos'
            assert req.status == 'pendiente'
            assert req.read is False

    def test_submit_baja_sin_csrf(self, client, monkeypatch):
        """Sin token CSRF -> 403 (solo cuando CSRF no est\u00e1 bypassed)."""
        monkeypatch.delenv('CSRF_BYPASS', raising=False)
        resp = client.post('/api/baja', json=self._valid_payload(),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 403
        data = resp.get_json()
        assert 'CSRF' in data.get('error', '')

    def test_submit_baja_honeypot(self, client):
        """Honeypot _website lleno -> 400 spam."""
        resp = client.post('/api/baja', json=self._valid_payload(_website='spam'),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400
        assert 'Spam' in resp.get_json().get('error', '')

    def test_submit_baja_too_fast(self, client):
        """Timestamp < 3s -> 400 demasiado r\u00e1pido."""
        resp = client.post('/api/baja', json=self._valid_payload(
            _ts=str(int(time.time()))),
            headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400
        assert 'r\u00e1pido' in resp.get_json().get('error', '')

    def test_submit_baja_sin_nombre(self, client):
        """Nombre vac\u00edo -> 400."""
        resp = client.post('/api/baja', json=self._valid_payload(name=''),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400
        assert 'nombre' in resp.get_json().get('error', '').lower()

    def test_submit_baja_sin_email(self, client):
        """Email vac\u00edo -> 400."""
        resp = client.post('/api/baja', json=self._valid_payload(email=''),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400
        assert 'email' in resp.get_json().get('error', '').lower()

    @pytest.mark.skip(reason="Rate limit testing flaky with memory:// backend in tests")
    def test_submit_baja_rate_limit_propio(self, client, rate_limit_enabled):
        """Baja tiene su propio rate limit (no comparte con contact)."""
        # Exhaust rate limit de /api/contact (5/min)
        for i in range(5):
            r = client.post('/api/contact', json={
                'name': f'C{i}', 'email': f'c{i}@t.com',
                'message': 'test', '_ts': '0',
            }, headers={'Content-Type': 'application/json'})
        # 6to contacto debe fallar por rate limit
        r6 = client.post('/api/contact', json={
            'name': 'Cx', 'email': 'cx@t.com',
            'message': 'test', '_ts': '0',
        }, headers={'Content-Type': 'application/json'})
        assert r6.status_code == 429

        # Baja debe seguir funcionando (rate limit independiente)
        resp = client.post('/api/baja', json=self._valid_payload(),
                           headers={'Content-Type': 'application/json'})
        assert resp.status_code == 201

    @pytest.mark.skip(reason="Rate limit testing flaky with memory:// backend in tests")
    def test_submit_baja_rate_limit_excede(self, client, rate_limit_enabled):
        """6\u00aa request a /api/baja en <1min -> 429."""
        for i in range(5):
            r = client.post('/api/baja', json=self._valid_payload(
                name=f'Test{i}', email=f't{i}@t.com'),
                headers={'Content-Type': 'application/json'})
            assert r.status_code in (201, 429)
            if r.status_code == 429:
                return  # rate limit ya se dispar\u00f3 antes
        resp = client.post('/api/baja', json=self._valid_payload(
            name='Extra', email='extra@t.com'),
            headers={'Content-Type': 'application/json'})
        assert resp.status_code == 429


class TestBajaAdmin:

    def _seed(self, app):
        with app.app_context():
            r = BajaRequest(
                name='Admin Test', email='admin@test.com',
                motivo='supresion', status='pendiente',
            )
            db.session.add(r)
            db.session.commit()
            return r.id

    def test_list_baja_requires_auth(self, client):
        """GET /api/baja sin sesi\u00f3n -> 401."""
        resp = client.get('/api/baja')
        assert resp.status_code == 401

    def test_list_baja_stats_requires_auth(self, client):
        """GET /api/baja/stats sin sesi\u00f3n -> 401."""
        resp = client.get('/api/baja/stats')
        assert resp.status_code == 401

    def test_list_baja(self, app, admin_session):
        """GET /api/baja con admin -> listado paginado."""
        self._seed(app)
        resp = admin_session.get('/api/baja')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        items = data['data']['requests']
        assert len(items) >= 1
        assert data['data']['total'] >= 1

    def test_baja_stats(self, app, admin_session):
        """GET /api/baja/stats con admin -> total/pendientes."""
        self._seed(app)
        resp = admin_session.get('/api/baja/stats')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert data['data']['total'] >= 1
        assert data['data']['pendientes'] >= 1

    def test_patch_baja_status(self, app, admin_session):
        """PATCH /api/baja/<id> actualiza status y read."""
        rid = self._seed(app)
        resp = admin_session.patch(f'/api/baja/{rid}',
            json={'status': 'completada', 'read': True},
            headers={'Content-Type': 'application/json'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert data['data']['status'] == 'completada'
        assert data['data']['read'] is True

    def test_patch_baja_404(self, admin_session):
        """PATCH a id inexistente -> 404."""
        resp = admin_session.patch('/api/baja/99999',
            json={'status': 'ok'},
            headers={'Content-Type': 'application/json'})
        assert resp.status_code == 404

    def test_delete_baja(self, app, admin_session):
        """DELETE /api/baja/<id> elimina el registro."""
        rid = self._seed(app)
        resp = admin_session.delete(f'/api/baja/{rid}')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert data['data']['deleted'] == rid

        with app.app_context():
            assert BajaRequest.query.get(rid) is None

    def test_delete_baja_404(self, admin_session):
        """DELETE a id inexistente -> 404."""
        resp = admin_session.delete('/api/baja/99999')
        assert resp.status_code == 404
