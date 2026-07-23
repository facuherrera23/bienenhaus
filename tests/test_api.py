"""
test_api.py — Tests de integración de la API REST
"""
import json
import pytest
from _csrf_helper import _csrf, _login, _post, _put, _patch, _delete, _get


class TestPropertiesAPI:
    def test_list_properties_empty(self, client):
        r = client.get('/api/properties')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True

    def test_create_property_requires_auth(self, client):
        r = client.post('/api/properties',
            data=json.dumps({'title': 'Test'}),
            content_type='application/json')
        assert r.status_code in (401, 403)

    def test_login_and_create(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Casa Test', 'type': 'casa', 'location': 'CBA', 'price': 80000})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['title'] == 'Casa Test'
        pid = data['id']

        r = client.get(f'/api/properties/{pid}')
        assert r.status_code == 200
        assert r.get_json()['data']['price'] == 80000

    def test_property_filters(self, client):
        r = client.get('/api/properties?type=casa&beds=3&status=disponible')
        assert r.status_code == 200

    def test_update_property(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Para Editar', 'type': 'casa', 'location': 'CBA', 'price': 50000})
        pid = r.get_json()['data']['id']

        r = _put(client, f'/api/properties/{pid}', {'title': 'Editado', 'price': 60000})
        assert r.status_code == 200
        assert r.get_json()['data']['title'] == 'Editado'

    def test_patch_property_status(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Vender', 'type': 'casa', 'location': 'CBA', 'price': 50000})
        pid = r.get_json()['data']['id']

        r = _patch(client, f'/api/properties/{pid}/status', {'status': 'vendida'})
        assert r.status_code == 200
        assert r.get_json()['data']['status'] == 'vendida'

    def test_delete_property(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Borrar', 'type': 'casa', 'location': 'CBA', 'price': 50000})
        pid = r.get_json()['data']['id']

        r = _delete(client, f'/api/properties/{pid}')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True


class TestRentalsAPI:
    def test_list_rentals_empty(self, client):
        r = client.get('/api/rentals')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True

    def test_create_rental_requires_auth(self, client):
        r = client.post('/api/rentals',
            data=json.dumps({'title': 'Alq Test'}),
            content_type='application/json')
        assert r.status_code in (401, 403)

    def test_login_and_crud_rental(self, client):
        _login(client)
        r = _post(client, '/api/rentals', {'title': 'Alquiler Centro', 'type': 'depto', 'location': 'CBA', 'price_ars': 150000, 'furnished': True})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['price_ars'] == 150000
        assert data['furnished'] is True
        rid = data['id']

        r = client.get(f'/api/rentals/{rid}')
        assert r.status_code == 200

        r = _patch(client, f'/api/rentals/{rid}/status', {'status': 'alquilada'})
        assert r.status_code == 200
        assert r.get_json()['data']['status'] == 'alquilada'

    def test_rental_filters(self, client):
        r = client.get('/api/rentals?type=depto&furnished=true&beds=2')
        assert r.status_code == 200

    def test_update_rental(self, client):
        _login(client)
        r = _post(client, '/api/rentals', {'title': 'Alq Editar', 'type': 'depto', 'location': 'CBA', 'price_ars': 100000})
        rid = r.get_json()['data']['id']

        r = _put(client, f'/api/rentals/{rid}', {'title': 'Editado', 'price_ars': 120000, 'expenses': 5000})
        assert r.status_code == 200
        assert r.get_json()['data']['expenses'] == 5000

    def test_delete_rental(self, client):
        _login(client)
        r = _post(client, '/api/rentals', {'title': 'Alq Borrar', 'type': 'depto', 'location': 'CBA', 'price_ars': 100000})
        rid = r.get_json()['data']['id']

        r = _delete(client, f'/api/rentals/{rid}')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True


class TestAgentsAPI:
    def test_create_agent(self, client):
        _login(client)
        r = _post(client, '/api/agents', {'name': 'María', 'last': 'González', 'years': 8})
        assert r.status_code == 201

    def test_update_agent(self, client):
        _login(client)
        r = _post(client, '/api/agents', {'name': 'Carlos', 'last': 'Pérez', 'years': 5})
        aid = r.get_json()['data']['id']

        r = _put(client, f'/api/agents/{aid}', {'name': 'Carlos Updated', 'years': 6})
        assert r.status_code == 200
        assert r.get_json()['data']['name'] == 'Carlos Updated'

    def test_delete_agent(self, client):
        _login(client)
        r = _post(client, '/api/agents', {'name': 'Temp', 'last': 'Agent', 'years': 1})
        aid = r.get_json()['data']['id']

        r = _delete(client, f'/api/agents/{aid}')
        assert r.status_code == 200


class TestContactAPI:
    def test_send_message(self, client):
        import time
        ts = int(time.time()) - 10
        r = _post(client, '/api/contact', {'name': 'Test', 'email': 'test@test.com', 'message': 'Hola', '_ts': str(ts)})
        assert r.status_code == 201

    def test_list_messages_admin(self, client):
        _login(client)
        r = _get(client, '/api/contact/messages')
        assert r.status_code == 200
        data = r.get_json()
        assert 'messages' in data or 'data' in data

    def test_mark_message_read(self, client):
        import time
        _login(client)
        ts = int(time.time()) - 10
        _post(client, '/api/contact', {'name': 'Read Test', 'email': 'r@t.com', 'message': 'Test read', '_ts': str(ts)})
        r = _get(client, '/api/contact/messages')
        msgs = r.get_json().get('data', {}).get('messages', [])
        if msgs:
            mid = msgs[0]['id']
            r = _patch(client, f'/api/contact/messages/{mid}/read')
            assert r.status_code == 200


class TestSettingsAPI:
    def test_get_settings_public(self, client):
        r = client.get('/api/settings?public=true')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True
        assert 'phone' in data['data']
        assert 'smtp_host' not in data['data']

    def test_get_settings_requires_auth(self, client):
        r = client.get('/api/settings')
        assert r.status_code == 401

    def test_update_settings(self, client):
        _login(client)
        r = _put(client, '/api/settings', {'phone': '+54 351 555-5555'})
        assert r.status_code == 200

        r = client.get('/api/settings')
        assert r.get_json()['data']['phone'] == '+54 351 555-5555'


class TestStatsAPI:
    def test_stats_requires_auth(self, client):
        r = client.get('/api/stats')
        assert r.status_code == 401

    def test_stats_authenticated(self, client):
        _login(client)
        r = client.get('/api/stats')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True
        assert 'total' in data['data']
        assert 'rentals_total' in data['data']

    def test_stats_with_valid_dates(self, client):
        _login(client)
        r = client.get('/api/stats?from=2020-01-01&to=2030-12-31')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True

    def test_stats_with_from_only(self, client):
        _login(client)
        r = client.get('/api/stats?from=2024-01-01')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True

    def test_stats_with_to_only(self, client):
        _login(client)
        r = client.get('/api/stats?to=2024-12-31')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True

    def test_stats_rejects_malformed_from(self, client):
        _login(client)
        r = client.get('/api/stats?from=not-a-date')
        assert r.status_code == 422
        assert r.get_json()['ok'] is False

    def test_stats_rejects_malformed_to(self, client):
        _login(client)
        r = client.get('/api/stats?to=abc-def-gh')
        assert r.status_code == 422
        assert r.get_json()['ok'] is False

    def test_stats_rejects_invalid_month(self, client):
        _login(client)
        r = client.get('/api/stats?from=2024-13-01')
        assert r.status_code == 422
        assert r.get_json()['ok'] is False

    def test_stats_rejects_invalid_day(self, client):
        _login(client)
        r = client.get('/api/stats?from=2024-01-32')
        assert r.status_code == 422
        assert r.get_json()['ok'] is False

    def test_stats_with_empty_date_params(self, client):
        _login(client)
        r = client.get('/api/stats?from=&to=')
        assert r.status_code == 200
        assert r.get_json()['ok'] is True


class TestAuthAPI:
    def test_login_wrong_password(self, client):
        r = client.post('/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'wrong'}),
            content_type='application/json')
        assert r.status_code == 401

    def test_login_wrong_username(self, client):
        r = client.post('/api/auth/login',
            data=json.dumps({'username': 'nobody', 'password': 'Admin2026!'}),
            content_type='application/json')
        assert r.status_code == 401

    def test_check_auth_unauthenticated(self, client):
        r = client.get('/api/auth/check')
        assert r.status_code == 200
        assert r.get_json()['data']['admin'] is False

    def test_csrf_token_endpoint(self, client):
        _login(client)
        r = client.get('/api/auth/csrf-token')
        assert r.status_code == 200
        assert 'csrf_token' in r.get_json()['data']

    def test_logout(self, client):
        _login(client)
        r = _post(client, '/api/auth/logout')
        assert r.status_code == 200
        r = client.get('/api/auth/check')
        assert r.get_json()['data']['admin'] is False

    def test_change_password(self, client):
        _login(client)
        r = _post(client, '/api/auth/change-password', {'current': 'Admin2026!', 'new': 'Nueva2026!'})
        assert r.status_code == 200
        assert r.get_json().get('data', {}).get('session_expired') is True

        # Session should be invalidated — old session cookie no longer works
        r = client.get('/api/auth/check')
        assert r.get_json()['data']['admin'] is False

        # Login with old password should fail
        r = client.post('/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'Admin2026!'}),
            content_type='application/json')
        assert r.status_code == 401

        # Login with new password
        r = client.post('/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'Nueva2026!'}),
            content_type='application/json')
        assert r.status_code == 200

        # Restore old password
        r2 = _post(client, '/api/auth/change-password', {'current': 'Nueva2026!', 'new': 'Admin2026!'})
        assert r2.status_code == 200


class TestPortalsAPI:
    @pytest.fixture(autouse=True)
    def _cleanup_portals(self, app):
        with app.app_context():
            from extensions import db
            from models import Portal, PortalLog, PortalQueue
            Portal.query.delete()
            PortalLog.query.delete()
            PortalQueue.query.delete()
            db.session.commit()
        yield

    def _login_admin(self, client):
        return _login(client)

    def _create_portal(self, client, name='Test', slug='test'):
        r = _post(client, '/api/portals', {'name': name, 'slug': slug})
        assert r.status_code == 201, f'Create portal failed: {r.status_code} {r.get_json()}'
        return r.get_json()['data']

    def test_list_portals_empty(self, client):
        _login(client)
        r = client.get('/api/portals')
        assert r.status_code == 200
        assert r.get_json()['data'] == []

    def test_create_and_list_portals(self, client):
        _login(client)
        data = self._create_portal(client, 'ZonaProp', 'zonaprop')
        assert data['name'] == 'ZonaProp'
        assert data['slug'] == 'zonaprop'
        assert data['active'] is False

        r = client.get('/api/portals')
        assert len(r.get_json()['data']) == 1

    def test_update_portal(self, client):
        _login(client)
        portal = self._create_portal(client, 'ML', 'mercadolibre')
        pid = portal['id']
        r = _put(client, f'/api/portals/{pid}', {'active': True, 'name': 'MercadoLibre'})
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['name'] == 'MercadoLibre'
        assert data['active'] is True

    def test_delete_portal(self, client):
        _login(client)
        portal = self._create_portal(client, 'ToDelete', 'todelete')
        pid = portal['id']
        r = _delete(client, f'/api/portals/{pid}')
        assert r.status_code == 200
        r = client.get('/api/portals')
        assert all(p['id'] != pid for p in r.get_json()['data'])

    def test_portal_requires_admin(self, client):
        r = client.get('/api/portals')
        assert r.status_code == 401

    def test_portal_logs(self, client):
        _login(client)
        portal = self._create_portal(client, 'Logger', 'logger')
        r = client.get('/api/portals/logs')
        assert r.status_code == 200
        data = r.get_json()['data']
        logs = data['items']
        # Logs may be empty if no adapter is registered for 'logger' slug
        assert isinstance(logs, list)

    def test_queue_enqueue_and_list(self, client):
        _login(client)
        r = _post(client, '/api/portals/queue', {'action': 'publish', 'property_id': 1})
        assert r.status_code == 201
        qid = r.get_json()['data']['id']

        r = client.get('/api/portals/queue')
        data = r.get_json()['data']
        items = data['items']
        assert any(i['id'] == qid for i in items)

    def test_queue_count(self, client):
        _login(client)
        r = client.get('/api/portals/queue/count')
        assert r.status_code == 200
        assert 'pending' in r.get_json()['data']


class TestVideoURL:
    """video_url se guarda y se devuelve correctamente."""

    def test_create_property_with_video(self, client):
        _login(client)
        r = _post(client, '/api/properties', {
            'title': 'Casa con video', 'type': 'casa', 'location': 'CBA',
            'price': 100000, 'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        })
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['video_url'] == 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

        pid = data['id']
        r = client.get(f'/api/properties/{pid}')
        assert r.status_code == 200
        assert r.get_json()['data']['video_url'] == 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

    def test_create_rental_with_video(self, client):
        _login(client)
        r = _post(client, '/api/rentals', {
            'title': 'Alquiler con video', 'type': 'depto', 'location': 'CBA',
            'price_ars': 80000, 'video_url': 'https://vimeo.com/123456789',
        })
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['video_url'] == 'https://vimeo.com/123456789'

    def test_update_video_url(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Sin video', 'type': 'casa', 'location': 'CBA', 'price': 50000})
        pid = r.get_json()['data']['id']
        assert r.get_json()['data']['video_url'] is None

        r = _put(client, f'/api/properties/{pid}', {'video_url': 'https://youtu.be/abc123'})
        assert r.status_code == 200
        assert r.get_json()['data']['video_url'] == 'https://youtu.be/abc123'


class TestSocialAPI:
    """Tests para el endpoint de posts sociales."""

    def _create_account(self, client, platform='facebook'):
        from social.models import SocialAccount
        from extensions import db
        from utils import encrypt_value
        acc = SocialAccount(
            platform=platform, label='Test',
            config_json=json.dumps({'access_token': 'mock-token'}),
            active=True,
        )
        db.session.add(acc)
        db.session.commit()
        return acc.id

    def test_create_social_post(self, client):
        _login(client)
        r = _post(client, '/api/properties', {'title': 'Social post test', 'type': 'casa', 'location': 'CBA', 'price': 75000})
        pid = r.get_json()['data']['id']

        acc_id = self._create_account(client)

        r = _post(client, '/api/social/posts', {
            'account_id': acc_id,
            'property_id': pid,
            'content': 'Test content',
        })
        assert r.status_code == 201

    def test_social_post_with_video_reference(self, client):
        _login(client)
        r = _post(client, '/api/properties', {
            'title': 'Prop con video', 'type': 'casa', 'location': 'CBA',
            'price': 90000, 'video_url': 'https://youtu.be/abc123',
        })
        pid = r.get_json()['data']['id']

        acc_id = self._create_account(client)
        r = _post(client, '/api/social/posts', {
            'account_id': acc_id,
            'property_id': pid,
            'content': 'Mirá este video!',
        })
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['property_id'] == pid

