"""
test_models.py — Tests unitarios de modelos
"""
import json
import pytest
from unittest.mock import patch, Mock, MagicMock
from models import Property, Rental, Agent, ContactMessage, Portal, PortalPublication, PortalLog, PortalQueue, PropertyView, RentalView
from extensions import db
from datetime import date


class TestProperty:
    def test_create_property(self, app):
        with app.app_context():
            from extensions import db
            p = Property(title='Casa test', type='casa', location='Córdoba', price=100000)
            db.session.add(p)
            db.session.commit()
            assert p.id is not None
            assert p.title == 'Casa test'
            assert p.to_dict()['price'] == 100000

    def test_property_images_json(self, app):
        with app.app_context():
            from extensions import db
            p = Property(title='Test img', type='casa', location='CBA', price=50000)
            p.images = ['img1.jpg', 'img2.jpg']
            db.session.add(p)
            db.session.commit()
            assert p.images == ['img1.jpg', 'img2.jpg']

    def test_property_daily_views(self, app):
        with app.app_context():
            from extensions import db
            p = Property(title='Test views', type='casa', location='CBA', price=50000)
            p.daily_views = {'2026-01-01': 5}
            db.session.add(p)
            db.session.commit()
            assert p.daily_views == {'2026-01-01': 5}

    def test_property_from_dict(self, app):
        data = {
            'title': 'Desde dict', 'type': 'depto', 'location': 'Nva Cba',
            'price': '75000', 'beds': '2', 'baths': '1', 'sqm': '60',
            'status': 'disponible', 'featured': True, 'desc': 'Lindo depto',
            'images': ['foto.jpg'],
        }
        p = Property.from_dict(data)
        assert p.title == 'Desde dict'
        assert p.price == 75000
        assert p.beds == 2
        assert p.featured is True


class TestPropertyView:
    def test_create_property_view(self, app):
        with app.app_context():
            from extensions import db
            p = Property(title='Test pv', type='casa', location='CBA', price=50000)
            db.session.add(p)
            db.session.commit()
            pv = PropertyView(property_id=p.id, date=date(2026, 5, 1), views=5)
            db.session.add(pv)
            db.session.commit()
            assert pv.id is not None
            assert pv.views == 5
            d = pv.to_dict()
            assert d['date'] == '2026-05-01'

    def test_property_view_unique_constraint(self, app):
        with app.app_context():
            from extensions import db
            from sqlalchemy.exc import IntegrityError
            p = Property(title='Test unique', type='casa', location='CBA', price=50000)
            db.session.add(p)
            db.session.commit()
            pv1 = PropertyView(property_id=p.id, date=date(2026, 5, 1), views=3)
            db.session.add(pv1)
            db.session.commit()
            pv2 = PropertyView(property_id=p.id, date=date(2026, 5, 1), views=2)
            db.session.add(pv2)
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
            else:
                assert False, "Unique constraint should have raised IntegrityError"

    def test_property_view_relation(self, app):
        with app.app_context():
            from extensions import db
            p = Property(title='Test rel', type='casa', location='CBA', price=50000)
            db.session.add(p)
            db.session.commit()
            pv = PropertyView(property_id=p.id, date=date(2026, 5, 1), views=5)
            db.session.add(pv)
            db.session.commit()
            assert len(p.view_records) == 1
            assert p.view_records[0].views == 5


class TestRentalView:
    def test_create_rental_view(self, app):
        with app.app_context():
            from extensions import db
            r = Rental(title='Test rv', type='depto', location='CBA', price_ars=100000)
            db.session.add(r)
            db.session.commit()
            rv = RentalView(rental_id=r.id, date=date(2026, 5, 1), views=3)
            db.session.add(rv)
            db.session.commit()
            assert rv.id is not None
            assert rv.views == 3
            d = rv.to_dict()
            assert d['date'] == '2026-05-01'

    def test_rental_view_unique_constraint(self, app):
        with app.app_context():
            from extensions import db
            from sqlalchemy.exc import IntegrityError
            r = Rental(title='Test rv unique', type='depto', location='CBA', price_ars=100000)
            db.session.add(r)
            db.session.commit()
            rv1 = RentalView(rental_id=r.id, date=date(2026, 5, 1), views=2)
            db.session.add(rv1)
            db.session.commit()
            rv2 = RentalView(rental_id=r.id, date=date(2026, 5, 1), views=4)
            db.session.add(rv2)
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
            else:
                assert False, "Unique constraint should have raised IntegrityError"

    def test_rental_view_relation(self, app):
        with app.app_context():
            from extensions import db
            r = Rental(title='Test rv rel', type='depto', location='CBA', price_ars=100000)
            db.session.add(r)
            db.session.commit()
            rv = RentalView(rental_id=r.id, date=date(2026, 5, 1), views=7)
            db.session.add(rv)
            db.session.commit()
            assert len(r.view_records) == 1
            assert r.view_records[0].views == 7


class TestRental:
    def test_create_rental(self, app):
        with app.app_context():
            from extensions import db
            r = Rental(title='Alquiler test', type='depto', location='CBA', price_ars=150000)
            db.session.add(r)
            db.session.commit()
            assert r.id is not None
            assert r.price_ars == 150000

    def test_rental_furnished(self, app):
        with app.app_context():
            from extensions import db
            r = Rental(title='Alq amoblado', type='casa', location='CBA', price_ars=200000,
                      furnished=True, min_months=6)
            db.session.add(r)
            db.session.commit()
            assert r.furnished is True
            assert r.min_months == 6
            d = r.to_dict()
            assert d['furnished'] is True
            assert d['min_months'] == 6

    def test_rental_from_dict(self, app):
        data = {
            'title': 'Alq dict', 'type': 'depto', 'location': 'Centro',
            'price_ars': '180000', 'expenses': '15000',
            'beds': '2', 'baths': '1', 'sqm': '55',
            'furnished': True, 'min_months': '3',
            'status': 'disponible', 'featured': False,
        }
        r = Rental.from_dict(data)
        assert r.price_ars == 180000
        assert r.expenses == 15000
        assert r.furnished is True
        assert r.min_months == 3


class TestAgent:
    def test_create_agent(self, app):
        with app.app_context():
            from extensions import db
            a = Agent(name='Juan', last='Pérez', years=5, specialty='Casas')
            db.session.add(a)
            db.session.commit()
            assert a.id is not None
            assert a.to_dict()['name'] == 'Juan'


class TestPortal:
    def test_create_portal(self, app):
        with app.app_context():
            from extensions import db
            p = Portal(name='TestPortal', slug='test-portal-1', active=True)
            p.config = {'api_key': 'test123'}
            db.session.add(p)
            db.session.commit()
            assert p.id is not None
            assert p.slug == 'test-portal-1'
            assert p.config == {'api_key': 'test123'}
            d = p.to_dict()
            assert d['name'] == 'TestPortal'
            assert d['active'] is True

    def test_portal_publication(self, app):
        with app.app_context():
            from extensions import db
            portal = Portal(name='ML', slug='test-portal-2')
            db.session.add(portal)
            db.session.commit()
            prop = Property(title='Test portal', type='casa', location='CBA', price=80000)
            db.session.add(prop)
            db.session.commit()
            pub = PortalPublication(portal_id=portal.id, property_id=prop.id,
                                    status='published', external_id='ML-123')
            db.session.add(pub)
            db.session.commit()
            assert pub.id is not None
            assert pub.status == 'published'
            assert pub.external_id == 'ML-123'

    def test_portal_log(self, app):
        with app.app_context():
            from extensions import db
            portal = Portal(name='Test', slug='test-portal-3')
            db.session.add(portal)
            db.session.commit()
            log = PortalLog(portal_id=portal.id, action='publish',
                            level='info', message='Publicado correctamente')
            db.session.add(log)
            db.session.commit()
            assert log.id is not None
            d = log.to_dict()
            assert d['action'] == 'publish'
            assert d['level'] == 'info'

    def test_portal_queue(self, app):
        with app.app_context():
            from extensions import db
            from models import PortalQueue
            from portals.queue import QueueService
            item = QueueService.enqueue('publish', property_id=999, priority=5)
            assert item.id is not None
            assert item.action == 'publish'
            assert item.processed is False
            assert QueueService.pending_count() >= 1
            items = QueueService.dequeue(limit=5)
            assert len(items) >= 1
            QueueService.mark_processed(item.id)
            db.session.expire(item)
            assert item.processed is True
            reloaded = db.session.get(PortalQueue, item.id)
            assert reloaded.processed is True


class TestPortalExport:
    def test_export_property_json(self, app):
        with app.app_context():
            from extensions import db
            from portals.export import export_property_json
            prop = Property(title='Casa export', type='casa', location='CBA', price=100000,
                           beds=3, baths=2, sqm=120)
            prop.images = ['img1.jpg']
            db.session.add(prop)
            db.session.commit()
            exported = export_property_json(prop)
            assert '"title": "Casa export"' in exported
            assert '"price": 100000' in exported
            assert '"currency": "USD"' in exported

    def test_export_property_xml(self, app):
        with app.app_context():
            from extensions import db
            from portals.export import export_property_xml
            prop = Property(title='Casa xml', type='casa', location='CBA', price=90000)
            db.session.add(prop)
            db.session.commit()
            exported = export_property_xml(prop)
            assert '<property>' in exported
            assert '<title>Casa xml</title>' in exported.replace(' ', '').replace('\n', '') or \
                   '<title>Casa xml</title>' in exported

    def test_export_batch_json(self, app):
        with app.app_context():
            from extensions import db
            from portals.export import export_properties_batch
            p1 = Property(title='P1', type='casa', location='A', price=1)
            p2 = Property(title='P2', type='depto', location='B', price=2)
            db.session.add_all([p1, p2])
            db.session.commit()
            result = export_properties_batch([p1, p2], fmt='json')
            assert '"properties"' in result
            assert '"P1"' in result
            assert '"P2"' in result


_zp_counter = 0

def _zp_slug():
    global _zp_counter
    _zp_counter += 1
    return f'zonaprop-{_zp_counter}'


class TestZonaPropAdapter:
    def _create_portal(self, config='{}'):
        from extensions import db
        from models import Portal
        p = Portal(name='ZonaProp', slug=_zp_slug(), active=True,
                   config_json=config)
        db.session.add(p)
        db.session.commit()
        return p

    def test_generate_feed_with_property(self, app):
        with app.app_context():
            from extensions import db
            from models import Property
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal()
            prop = Property(title='Casa Test', type='casa', location='Córdoba',
                            price=85000, beds=3, baths=2, sqm=120,
                            status='disponible', description='Casa en Córdoba')
            prop.images = ['https://example.com/img.jpg']
            db.session.add(prop)
            db.session.commit()
            adapter = ZonaPropAdapter(portal)
            from portals.export import _base_property_dict
            data = _base_property_dict(prop)
            success, ext_id, error = adapter.publish(data)
            assert success is True
            assert ext_id != ''
            assert error == ''

    def test_generate_feed_with_rental(self, app):
        with app.app_context():
            from extensions import db
            from models import Rental
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal()
            rental = Rental(title='Alquiler Test', type='departamento',
                            location='CBA', price_ars=45000, beds=2, baths=1,
                            sqm=65, status='disponible', description='Depto',
                            furnished=True, expenses=5000, min_months=6)
            rental.images = ['https://example.com/img2.jpg']
            db.session.add(rental)
            db.session.commit()
            adapter = ZonaPropAdapter(portal)
            from portals.export import _base_rental_dict
            data = _base_rental_dict(rental)
            success, ext_id, error = adapter.publish(data)
            assert success is True
            assert ext_id != ''

    def test_feed_xml_contains_properties(self, app):
        with app.app_context():
            from extensions import db
            from models import Property
            from portals.zonaprop import ZonaPropAdapter, FEED_DIR, FEED_FILENAME
            import os as _os
            portal = self._create_portal()
            prop = Property(title='Casa XML Test', type='casa',
                            location='Córdoba', price=100000,
                            description='Descripción test XML',
                            beds=2, baths=1, sqm=80, status='disponible')
            prop.images = ['https://example.com/img.jpg']
            db.session.add(prop)
            db.session.commit()
            adapter = ZonaPropAdapter(portal)
            from portals.export import _base_property_dict
            adapter.publish(_base_property_dict(prop))
            feed_path = _os.path.join(FEED_DIR, FEED_FILENAME)
            assert _os.path.exists(feed_path), 'Feed file not created'
            with open(feed_path, 'r', encoding='utf-8') as f:
                content = f.read()
            assert '<inmueble>' in content
            assert 'Casa XML Test' in content
            assert 'Descripción test XML' in content
            assert '100000' in content
            assert 'Córdoba' in content

    def test_update_returns_correctly(self, app):
        with app.app_context():
            from extensions import db
            from models import Property
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal()
            prop = Property(title='Casa Update', type='casa',
                            location='CBA', price=50000, status='disponible')
            db.session.add(prop)
            db.session.commit()
            adapter = ZonaPropAdapter(portal)
            from portals.export import _base_property_dict
            data = _base_property_dict(prop)
            success, error = adapter.update('v1', data)
            assert success is True
            assert error == ''

    def test_unpublish_returns_correctly(self, app):
        with app.app_context():
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal()
            adapter = ZonaPropAdapter(portal)
            success, error = adapter.unpublish('v1')
            assert success is True
            assert error == ''

    def test_upload_sftp_skipped_when_not_configured(self, app):
        with app.app_context():
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal()
            adapter = ZonaPropAdapter(portal)
            result = adapter._upload_sftp('<test/>')
            assert result is False

    def test_publish_with_bad_sftp_fails_gracefully(self, app):
        with app.app_context():
            from portals.zonaprop import ZonaPropAdapter
            portal = self._create_portal(json.dumps({
                'sftp_host': 'localhost',
                'sftp_port': 22,
                'sftp_user': 'bad',
                'sftp_pass': 'bad',
            }))
            adapter = ZonaPropAdapter(portal)
            from portals.export import _base_property_dict
            data = {'title': 'Test', 'type': 'casa', 'location': 'CBA',
                    'price': 100000, 'id': 1, 'images': ['x.jpg']}
            success, ext_id, error = adapter.publish(data)
            assert success is True
            assert ext_id != ''


_ml_counter = 0


def _ml_slug():
    global _ml_counter
    _ml_counter += 1
    return f'mercadolibre-{_ml_counter}'


class TestMercadoLibreAdapter:

    def _make_portal(self, config='{}'):
        from extensions import db
        from models import Portal
        p = Portal(name='ML', slug=_ml_slug(), active=True,
                   config_json=config)
        db.session.add(p)
        db.session.commit()
        return p

    def test_build_item_data_property(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'user_id': 12345, 'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Casa en Venta', 'type': 'casa',
                'location': 'Córdoba', 'price': 85000,
                'description': 'Hermosa casa',
                'images': ['https://ejemplo.com/img.jpg'],
                'beds': 3, 'baths': 2, 'sqm': 120,
            }
            item = adapter._build_item_data(data)
            assert item['title'] == 'Casa en Venta'
            assert item['category_id'] == 'MLA1466'
            assert item['price'] == 85000
            assert item['currency_id'] == 'USD'
            assert item['listing_type_id'] == 'gold'
            assert item['buying_mode'] == 'classified'
            assert item['location']['state_id'] == 'AR-X'
            assert item['location']['city_id'] == 'TUxBQ0NBUGNiZGQx'
            ids = [a['id'] for a in item['attributes']]
            assert 'ROOMS' in ids
            assert 'BATHROOMS' in ids
            assert 'SQUARE_METER' in ids
            assert 'ADDRESS' in ids

    def test_build_item_data_rental(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'user_id': 12345, 'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Depto en Alquiler', 'type': 'departamento',
                'location': 'CBA', 'price_ars': 45000,
                'description': 'Lindo depto',
                'images': ['https://ejemplo.com/img.jpg'],
                'beds': 2, 'baths': 1, 'sqm': 65,
            }
            item = adapter._build_item_data(data)
            assert item['title'] == 'Depto en Alquiler'
            assert item['category_id'] == 'MLA1472'
            assert item['price'] == 45000
            assert item['currency_id'] == 'ARS'
            assert item['listing_type_id'] == 'gold'

    def test_build_item_data_custom_listing_type(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'user_id': 12345, 'access_token': 'tok',
                'listing_type': 'silver',
            }))
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Casa Silver', 'type': 'casa',
                'location': 'CBA', 'price': 50000,
                'description': 'Casa',
                'images': ['https://ejemplo.com/img.jpg'],
            }
            item = adapter._build_item_data(data)
            assert item['listing_type_id'] == 'silver'

    def test_build_item_data_invalid_listing_type_falls_back(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'user_id': 12345, 'access_token': 'tok',
                'listing_type': 'ultra_premium',
            }))
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Casa', 'type': 'casa',
                'location': 'CBA', 'price': 50000,
                'description': 'Casa',
                'images': ['https://ejemplo.com/img.jpg'],
            }
            item = adapter._build_item_data(data)
            assert item['listing_type_id'] == 'gold'

    def test_build_item_data_custom_location(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'user_id': 12345, 'access_token': 'tok',
                'state_id': 'AR-B',
                'city_id': 'TUxBQ0JBTDdlZg',
            }))
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Casa Buenos Aires', 'type': 'casa',
                'location': 'Capital Federal', 'price': 100000,
                'description': 'Casa en CABA',
                'images': ['https://ejemplo.com/img.jpg'],
            }
            item = adapter._build_item_data(data)
            assert item['location']['state_id'] == 'AR-B'
            assert item['location']['city_id'] == 'TUxBQ0JBTDdlZg'

    def test_get_access_token_from_stored(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'access_token': 'token-directo',
            }))
            adapter = MercadoLibreAdapter(portal)
            token = adapter._get_access_token()
            assert token == 'token-directo'

    def test_get_access_token_from_refresh(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'client_id': 'cid', 'client_secret': 'csec',
                'refresh_token': 'r_token',
            }))
            adapter = MercadoLibreAdapter(portal)
            with patch('portals.mercadolibre.requests.post') as mock_post:
                mock_post.return_value.status_code = 200
                mock_post.return_value.json.return_value = {
                    'access_token': 'nuevo-token',
                    'expires_in': 21600,
                }
                token = adapter._get_access_token()
                assert token == 'nuevo-token'
                mock_post.assert_called_once()

    def test_get_access_token_no_credentials_raises(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal('{}')
            adapter = MercadoLibreAdapter(portal)
            with pytest.raises(ValueError, match='refresh_token'):
                adapter._get_access_token()

    def _make_mock_request(self, status_code, json_data=None, text=''):
        mock_req = MagicMock()
        mock_req.status_code = status_code
        mock_req.json.return_value = json_data or {}
        mock_req.text = text
        return mock_req

    def test_publish_success(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            with patch('portals.mercadolibre.requests.request') as mock_req:
                mock_req.return_value = self._make_mock_request(201, {
                    'id': 'MLA123',
                    'permalink': 'https://ml.com/MLA123',
                })
                data = {
                    'title': 'Casa Test', 'type': 'casa',
                    'location': 'CBA', 'price': 100000,
                    'description': 'Test',
                    'images': ['https://ejemplo.com/img.jpg'],
                    'id': 1,
                }
                success, ext_id, error = adapter.publish(data)
            assert success is True
            assert ext_id == 'MLA123'
            assert error == ''

    def test_publish_failure(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            with patch('portals.mercadolibre.requests.request') as mock_req:
                mock_req.return_value = self._make_mock_request(400, {
                    'message': 'category_id invalid',
                    'cause': [{'code': 'category_id.invalid'}],
                }, 'error text')
                data = {
                    'title': 'Casa Test', 'type': 'casa',
                    'location': 'CBA', 'price': 100000,
                    'description': 'Test',
                    'images': ['https://ejemplo.com/img.jpg'],
                    'id': 1,
                }
                success, ext_id, error = adapter.publish(data)
            assert success is False
            assert ext_id == ''
            assert 'no está habilitada' in error

    def test_update_success(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            with patch('portals.mercadolibre.requests.request') as mock_req:
                mock_req.return_value = self._make_mock_request(200)
                data = {
                    'title': 'Casa Updated', 'type': 'casa',
                    'location': 'CBA', 'price': 100000,
                    'description': 'Test',
                    'images': ['https://ejemplo.com/img.jpg'],
                    'id': 1,
                }
                success, error = adapter.update('MLA999', data)
            assert success is True
            assert error == ''

    def test_unpublish_success(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal(json.dumps({
                'access_token': 'tok',
            }))
            adapter = MercadoLibreAdapter(portal)
            with patch('portals.mercadolibre.requests.request') as mock_req:
                mock_req.return_value = self._make_mock_request(200)
                success, error = adapter.unpublish('MLA999')
            assert success is True
            assert error == ''

    def test_validate_missing_fields(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal('{}')
            adapter = MercadoLibreAdapter(portal)
            valid, errors = adapter.validate({})
            assert valid is False
            assert 'Falta título' in errors
            assert 'Falta precio' in errors
            assert 'Falta tipo de propiedad' in errors
            assert 'MercadoLibre requiere al menos 1 imagen' in errors

    def test_validate_ok(self, app):
        with app.app_context():
            from portals.mercadolibre import MercadoLibreAdapter
            portal = self._make_portal('{}')
            adapter = MercadoLibreAdapter(portal)
            data = {
                'title': 'Casa',
                'price': 50000,
                'type': 'casa',
                'images': ['img.jpg'],
            }
            valid, errors = adapter.validate(data)
            assert valid is True
            assert errors == []


# ═══════════════════════════════════════════════════════════════════════
#  Database Indexes
# ═══════════════════════════════════════════════════════════════════════

class TestDatabaseIndexes:

    def _get_index_names(self, app, table_name):
        from sqlalchemy import inspect
        with app.app_context():
            inspector = inspect(db.engine)
            idxs = inspector.get_indexes(table_name)
            return {i['name'] for i in idxs}

    def test_portal_queue_dequeue_index(self, app):
        names = self._get_index_names(app, 'portal_queue')
        assert 'ix_portal_queue_dequeue' in names, (
            'Falta índice compuesto (status, priority, created_at) en portal_queue'
        )

    def test_portal_queue_dlq_index(self, app):
        names = self._get_index_names(app, 'portal_queue')
        assert 'ix_portal_queue_dlq' in names, (
            'Falta índice compuesto (status, retry_count, next_retry_at) en portal_queue'
        )

    def test_appraisals_estado_updated_index(self, app):
        names = self._get_index_names(app, 'appraisals')
        assert 'ix_appraisals_estado_updated' in names, (
            'Falta índice (estado, updated_at) en appraisals'
        )

    def test_comparables_appraisal_numero_index(self, app):
        names = self._get_index_names(app, 'comparables')
        assert 'ix_comparables_appraisal_numero' in names, (
            'Falta índice (appraisal_id, numero) en comparables'
        )

    def test_portal_queue_dequeue_index_columns(self, app):
        from sqlalchemy import inspect
        with app.app_context():
            inspector = inspect(db.engine)
            for idx in inspector.get_indexes('portal_queue'):
                if idx['name'] == 'ix_portal_queue_dequeue':
                    cols = [c.lower() for c in idx['column_names']]
                    assert cols == ['status', 'priority', 'created_at']
                    return
            pytest.fail('ix_portal_queue_dequeue no encontrado')

    def test_comparables_appraisal_numero_columns(self, app):
        from sqlalchemy import inspect
        with app.app_context():
            inspector = inspect(db.engine)
            for idx in inspector.get_indexes('comparables'):
                if idx['name'] == 'ix_comparables_appraisal_numero':
                    cols = [c.lower() for c in idx['column_names']]
                    assert cols == ['appraisal_id', 'numero']
                    return
            pytest.fail('ix_comparables_appraisal_numero no encontrado')
