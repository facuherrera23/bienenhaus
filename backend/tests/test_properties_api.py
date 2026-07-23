"""
Tests para /api/properties — verifica que el endpoint retorna
propiedades cuando existen filas activas en la base.
"""
from extensions import db
from models import Property


class TestPropertiesApi:

    def _seed(self, app):
        with app.app_context():
            p = Property(
                title='Casa Test',
                type='casa',
                location='C\u00f3rdoba',
                price=150000,
                beds=3,
                baths=2,
                sqm=120,
                status='disponible',
                images_json='[]',
            )
            db.session.add(p)
            db.session.commit()
            return p.id

    def test_list_properties_returns_seeded(self, app, client):
        self._seed(app)
        resp = client.get('/api/properties')
        assert resp.status_code == 200
        data = resp.get_json()
        props = data['data']['properties']
        assert len(props) >= 1
        assert any(p['title'] == 'Casa Test' for p in props)

    def test_list_properties_empty_without_data(self, app, client):
        """Cuando no hay properties disponibles, debe devolver lista vac\u00eda."""
        resp = client.get('/api/properties')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['data']['total'] == 0

    def test_list_properties_paginates(self, app, client):
        with app.app_context():
            for i in range(15):
                db.session.add(Property(
                    title=f'Casa {i}', type='casa',
                    location='Cba', price=100000 + i,
                    beds=2, baths=1, sqm=80,
                    status='disponible', images_json='[]',
                ))
            db.session.commit()
        resp = client.get('/api/properties?per_page=5&page=1')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['data']['properties']) == 5
        assert data['data']['total'] == 15
        assert data['data']['pages'] == 3

    def test_list_properties_filters_by_status(self, app, client):
        self._seed(app)
        with app.app_context():
            db.session.add(Property(
                title='Casa Oculta', type='casa',
                location='Cba', price=100000,
                beds=2, baths=1, sqm=80,
                status='oculta', images_json='[]',
            ))
            db.session.commit()
        resp = client.get('/api/properties')
        assert resp.status_code == 200
        data = resp.get_json()
        titles = [p['title'] for p in data['data']['properties']]
        assert 'Casa Test' in titles
        assert 'Casa Oculta' not in titles
