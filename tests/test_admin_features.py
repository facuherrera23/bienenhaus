"""
test_admin_features.py — Tests para filtro combinado y push notifications
"""
import json
import time
from _csrf_helper import _login, _csrf, _post


class TestCombinedFilters:
    """Tests para el filtro combinado de propiedades en admin"""

    def _create_props(self, client):
        props = [
            {'title': 'Casa Centro', 'type': 'casa', 'location': 'Córdoba Centro', 'price': 80000, 'beds': 3, 'status': 'disponible'},
            {'title': 'Depto Norte', 'type': 'departamento', 'location': 'Córdoba Norte', 'price': 55000, 'beds': 2, 'status': 'disponible'},
            {'title': 'Local Sur', 'type': 'local', 'location': 'Córdoba Sur', 'price': 120000, 'beds': 1, 'status': 'vendida'},
            {'title': 'Casa Grande', 'type': 'casa', 'location': 'Córdoba Centro', 'price': 150000, 'beds': 4, 'status': 'disponible'},
            {'title': 'Terreno Norte', 'type': 'terreno', 'location': 'Córdoba Norte', 'price': 30000, 'beds': 0, 'status': 'oculta'},
        ]
        ids = []
        for p in props:
            r = _post(client, '/api/properties', p)
            assert r.status_code == 201
            ids.append(r.get_json()['data']['id'])
        return ids

    def test_filter_by_type(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?type=casa&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        assert all(p['type'] == 'casa' for p in props)

    def test_filter_by_status(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?status=vendida&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        assert all(p['status'] == 'vendida' for p in props)

    def test_filter_by_beds(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?beds=3&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        assert all(p['beds'] == 3 for p in props)

    def test_filter_by_price_range(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?priceMin=50000&priceMax=100000&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        for p in props:
            assert 50000 <= (p['price'] or 0) <= 100000

    def test_combined_filters(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?type=casa&status=disponible&beds=3&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        for p in props:
            assert p['type'] == 'casa'
            assert p['status'] == 'disponible'

    def test_filter_by_search(self, client):
        _login(client)
        self._create_props(client)
        r = client.get('/api/properties?search=centro&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        props = data if isinstance(data, list) else data.get('properties', [])
        for p in props:
            assert 'centro' in (p['title'] or '').lower() or 'centro' in (p['location'] or '').lower()


class TestRentalFilters:
    """Tests para filtros combinados en alquileres"""

    def _create_rentals(self, client):
        rentals = [
            {'title': 'Depto Centro', 'type': 'departamento', 'location': 'Centro', 'price_ars': 150000, 'beds': 2, 'furnished': True, 'status': 'disponible'},
            {'title': 'Casa Norte', 'type': 'casa', 'location': 'Norte', 'price_ars': 200000, 'beds': 3, 'furnished': False, 'status': 'disponible'},
            {'title': 'Depto Sur', 'type': 'departamento', 'location': 'Sur', 'price_ars': 100000, 'beds': 1, 'furnished': True, 'status': 'alquilada'},
        ]
        ids = []
        for r_ in rentals:
            r = _post(client, '/api/rentals', r_)
            assert r.status_code == 201
            ids.append(r.get_json()['data']['id'])
        return ids

    def test_rental_filter_type(self, client):
        _login(client)
        self._create_rentals(client)
        r = client.get('/api/rentals?type=casa&admin=true')
        assert r.status_code == 200
        data = r.get_json()['data'] if 'data' in r.get_json() else r.get_json()
        rentals = data if isinstance(data, list) else data.get('rentals', [])
        assert all(r_['type'] == 'casa' for r_ in rentals)

    def test_rental_filter_furnished(self, client):
        _login(client)
        self._create_rentals(client)
        r = client.get('/api/rentals?furnished=true&admin=true')
        assert r.status_code == 200
        j = r.get_json()
        rentals = j.get('data', j)
        if isinstance(rentals, dict) and 'rentals' in rentals:
            rentals = rentals['rentals']
        assert all(r_['furnished'] is True for r_ in rentals)

    def test_rental_filter_price_range(self, client):
        _login(client)
        self._create_rentals(client)
        r = client.get('/api/rentals?priceMin=120000&priceMax=180000&admin=true')
        assert r.status_code == 200
        j = r.get_json()
        rentals = j.get('data', j)
        if isinstance(rentals, dict) and 'rentals' in rentals:
            rentals = rentals['rentals']
        for r_ in rentals:
            assert 120000 <= (r_['price_ars'] or 0) <= 180000


class TestPushNotifications:
    """Tests para suscripción y envío de push notifications"""

    def test_subscribe_invalid(self, client):
        r = _post(client, '/api/push/subscribe', {})
        assert r.status_code == 400

    def test_subscribe_valid(self, client):
        r = _post(client, '/api/push/subscribe', {
            'endpoint': 'https://example.com/push/test',
            'keys': {'auth': 'dGVzdGF1dGg=', 'p256dh': 'dGVzdHAyNTZkaA=='},
        })
        assert r.status_code == 200
        assert r.get_json()['ok'] is True

    def test_subscribe_duplicate(self, client):
        payload = {
            'endpoint': 'https://example.com/push/dup',
            'keys': {'auth': 'ZHVwYXV0aA==', 'p256dh': 'ZHVwcDI1NmRo'},
        }
        r = _post(client, '/api/push/subscribe', payload)
        assert r.status_code == 200

        r = _post(client, '/api/push/subscribe', payload)
        assert r.status_code == 200

    def test_unsubscribe(self, client):
        r = _post(client, '/api/push/subscribe', {
            'endpoint': 'https://example.com/push/unsub',
            'keys': {'auth': 'dW5zdWJhdXRo', 'p256dh': 'dW5zdWJwMjU2'},
        })
        assert r.status_code == 200

        r = _post(client, '/api/push/unsubscribe', {'endpoint': 'https://example.com/push/unsub'})
        assert r.status_code == 200

    def test_list_subscriptions(self, client):
        _login(client)
        _post(client, '/api/push/subscribe', {
            'endpoint': 'https://example.com/push/list1',
            'keys': {'auth': 'bGlzdGF1dGg=', 'p256dh': 'bGlzdHAyNTY='},
        })
        r = client.get('/api/push/subscriptions')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert 'subscriptions' in data
        assert len(data['subscriptions']) >= 1

    def test_contact_triggers_push(self, client):
        ts = int(time.time()) - 10
        r = _post(client, '/api/contact', {'name': 'Push Test', 'email': 'push@test.com',
                                           'message': 'Probando push', '_ts': str(ts)})
        assert r.status_code == 201

    def test_push_service_no_vapid(self, client):
        from push_service import send_to_all
        result = send_to_all({'title': 'Test', 'body': 'body'})
        assert result == 0 or isinstance(result, int)
