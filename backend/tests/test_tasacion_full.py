"""
Tests para tasacion routes, extract-url, from-request, CSV, search.
"""
import json
from unittest.mock import patch, MagicMock
from datetime import date
from models import Appraisal, AppraisalRequest, Comparable


class TestTasacionRoutes:

    def test_submit_tasacion_ok(self, client):
        resp = client.post('/api/tasacion', json={
            'name': 'Juan Pérez',
            'phone': '3511234567',
            'email': 'juan@test.com',
            'property_type': 'departamento',
            'motivo': 'vender',
            'city': 'Córdoba',
            'address': 'Av Siempre Viva 123',
            'comments': 'Test',
            '_ts': '0',
        }, headers={'Content-Type': 'application/json'})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['ok'] is True
        assert 'whatsapp_link' in data['data']

    def test_submit_tasacion_honeypot(self, client):
        resp = client.post('/api/tasacion', json={
            'name': 'Spam', '_website': 'spam', '_ts': '0',
        }, headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400

    def test_submit_tasacion_too_fast(self, client):
        resp = client.post('/api/tasacion', json={
            'name': 'Fast', '_ts': str(int(__import__('time').time())),
        }, headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400

    def test_submit_tasacion_sin_nombre(self, client):
        resp = client.post('/api/tasacion', json={
            'name': '', '_ts': '0',
        }, headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400

    def test_list_tasaciones_requires_auth(self, client):
        resp = client.get('/api/tasacion')
        assert resp.status_code == 401

    def test_list_tasaciones(self, admin_session):
        # Create a request first
        from models import AppraisalRequest
        from extensions import db
        req = AppraisalRequest(name='Test', phone='123', status='pendiente')
        db.session.add(req)
        db.session.commit()

        resp = admin_session.get('/api/tasacion')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert len(data['data']['requests']) >= 1

    def test_tasacion_stats(self, admin_session, app):
        with app.app_context():
            from extensions import db
            from models import AppraisalRequest
            db.session.add(AppraisalRequest(name='S1', status='pendiente'))
            db.session.add(AppraisalRequest(name='S2', status='pendiente'))
            db.session.add(AppraisalRequest(name='S3', status='completado'))
            db.session.commit()

        resp = admin_session.get('/api/tasacion/stats')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['data']['total'] >= 3
        assert data['data']['pendientes'] >= 2

    def test_update_tasacion_status(self, admin_session, app):
        with app.app_context():
            from extensions import db
            from models import AppraisalRequest
            req = AppraisalRequest(name='Test', status='pendiente')
            db.session.add(req)
            db.session.commit()
            rid = req.id

        resp = admin_session.patch(f'/api/tasacion/{rid}', json={'status': 'contactado'},
                                   headers={'Content-Type': 'application/json'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['data']['status'] == 'contactado'

    def test_delete_tasacion(self, admin_session, app):
        with app.app_context():
            from extensions import db
            from models import AppraisalRequest
            req = AppraisalRequest(name='ToDelete', status='pendiente')
            db.session.add(req)
            db.session.commit()
            rid = req.id

        resp = admin_session.delete(f'/api/tasacion/{rid}')
        assert resp.status_code == 200
        # Verify deleted
        with app.app_context():
            assert db.session.get(AppraisalRequest, rid) is None


class TestExtractUrlEndpoint:

    def test_extract_url_requires_auth(self, client):
        resp = client.post('/api/appraisals/extract-url', json={'url': 'https://www.zonaprop.com.ar/test'},
                           headers={'Content-Type': 'application/json'})
        # Sin sesion: 403 por CSRF o 401 por auth depende del orden de los decoradores
        assert resp.status_code in (401, 403)

    def test_extract_url_empty(self, admin_session):
        resp = admin_session.post('/api/appraisals/extract-url', json={'url': ''},
                                  headers={'Content-Type': 'application/json'})
        assert resp.status_code == 400

    @patch('services.appraisal_service.extract_property')
    def test_extract_url_ok(self, mock_extract, admin_session):
        mock_extract.return_value = ({'calle': 'Test', 'precio_usd': 50000}, None)
        resp = admin_session.post('/api/appraisals/extract-url', json={'url': 'https://www.mercadolibre.com.ar/test'},
                                  headers={'Content-Type': 'application/json'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['data']['precio_usd'] == 50000

    @patch('services.appraisal_service.extract_property')
    def test_extract_url_fail(self, mock_extract, admin_session):
        mock_extract.return_value = (None, 'Error de prueba')
        resp = admin_session.post('/api/appraisals/extract-url', json={'url': 'https://www.mercadolibre.com.ar/test'},
                                   headers={'Content-Type': 'application/json'})
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['ok'] is True
        assert body['data'].get('link_fuente') == 'https://www.mercadolibre.com.ar/test'
        assert body['data'].get('_error') is not None


class TestCreateFromRequest:

    def test_from_request_requires_auth(self, client):
        resp = client.post('/api/appraisals/from-request/1', headers={'Content-Type': 'application/json'})
        assert resp.status_code == 401

    def test_from_request_creates_appraisal(self, admin_session, app):
        with app.app_context():
            from extensions import db
            req = AppraisalRequest(name='Juan Pérez', phone='351123', property_type='casa',
                                   motivo='vender', city='Córdoba', address='Av Colón 500',
                                   comments='Urgente')
            db.session.add(req)
            db.session.commit()
            rid = req.id

        resp = admin_session.post(f'/api/appraisals/from-request/{rid}',
                                  headers={'Content-Type': 'application/json'})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['ok'] is True
        assert data['data']['existing'] is False
        assert data['data']['appraisal']['solicitante'] == 'Juan Pérez'

        # Verify request status changed
        with app.app_context():
            req2 = db.session.get(AppraisalRequest, rid)
            assert req2.status == 'completado'

    def test_from_request_idempotent(self, admin_session, app):
        with app.app_context():
            from extensions import db
            req = AppraisalRequest(name='Test', property_type='depto', motivo='particular')
            db.session.add(req)
            db.session.commit()
            rid = req.id

        # First call creates
        resp1 = admin_session.post(f'/api/appraisals/from-request/{rid}',
                                   headers={'Content-Type': 'application/json'})
        assert resp1.status_code == 201
        assert resp1.get_json()['data']['existing'] is False

        # Second call returns existing
        resp2 = admin_session.post(f'/api/appraisals/from-request/{rid}',
                                   headers={'Content-Type': 'application/json'})
        assert resp2.status_code == 200
        data2 = resp2.get_json()
        assert data2['data']['existing'] is True
        assert data2['data']['appraisal']['solicitante'] == 'Test'

    def test_from_request_404(self, admin_session):
        resp = admin_session.post('/api/appraisals/from-request/99999',
                                  headers={'Content-Type': 'application/json'})
        assert resp.status_code == 404


class TestCsvExport:

    def test_csv_requires_auth(self, client, app):
        with app.app_context():
            from extensions import db
            a = Appraisal(titulo='Test CSV')
            db.session.add(a)
            db.session.commit()
            aid = a.id

        resp = client.get(f'/api/appraisals/{aid}/csv')
        assert resp.status_code == 401

    def test_csv_export_content(self, admin_session, app):
        with app.app_context():
            from extensions import db
            a = Appraisal(titulo='CSV Test', solicitante='Juan', estado='borrador',
                         dormitorios=2, anio_construccion=2000)
            db.session.add(a)
            db.session.flush()
            # comp_antiguedad='inferior' → weight 0.04 → coef = 1.04
            c = Comparable(appraisal_id=a.id, numero=1, calle='Av Test',
                          precio_usd=50000, superficie_cubierta=100,
                          comp_antiguedad='inferior')
            db.session.add(c)
            db.session.commit()
            aid = a.id

        resp = admin_session.get(f'/api/appraisals/{aid}/csv')
        assert resp.status_code == 200
        assert resp.headers['Content-Type'] == 'text/csv; charset=utf-8'
        text = resp.get_data(as_text=True)
        assert 'Av Test' in text
        assert '50000' in text
        assert '1.04' in text
        assert '520.0' in text

    def test_csv_coeficiente_and_ajustado_present(self, admin_session, app):
        """Verifica que coeficiente_ajuste y valor_m2_ajustado se exporten correctamente."""
        with app.app_context():
            from extensions import db
            a = Appraisal(titulo='CSV Coef Test', dormitorios=2, anio_construccion=2000)
            db.session.add(a)
            db.session.flush()
            # comp_antiguedad='superior' → weight 0.04 → total -0.04 → coef = 0.96
            c = Comparable(appraisal_id=a.id, numero=1, calle='Av Siempre Viva',
                          precio_usd=100000, superficie_cubierta=50,
                          comp_antiguedad='superior')
            db.session.add(c)
            db.session.commit()
            aid = a.id

        resp = admin_session.get(f'/api/appraisals/{aid}/csv')
        text = resp.get_data(as_text=True)
        assert '0.96' in text, f'coeficiente_ajuste no está en CSV: {text}'
        assert '1920.0' in text, f'valor_m2_ajustado no está en CSV: {text}'


class TestAppraisalSearch:

    def test_search_by_titulo(self, admin_session, app):
        with app.app_context():
            from extensions import db
            db.session.add(Appraisal(titulo='Casa en Palermo', solicitante='Ana'))
            db.session.add(Appraisal(titulo='Depto en Centro', solicitante='Luis'))
            db.session.commit()

        resp = admin_session.get('/api/appraisals?search=Palermo')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['data']['data']) >= 1
        assert any('Palermo' in a['titulo'] for a in data['data']['data'])

    def test_search_by_solicitante(self, admin_session, app):
        with app.app_context():
            from extensions import db
            db.session.add(Appraisal(titulo='T1', solicitante='María García'))
            db.session.commit()

        resp = admin_session.get('/api/appraisals?search=María')
        assert resp.status_code == 200
        data = resp.get_json()
        assert any('María' in a['solicitante'] for a in data['data']['data'])

    def test_search_no_results(self, admin_session, app):
        resp = admin_session.get('/api/appraisals?search=xxxxxnonexistentxxxxx')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['data']['data']) == 0
