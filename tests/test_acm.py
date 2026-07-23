"""
test_acm.py — Tests del sistema ACM (Análisis Comparativo de Mercado)
"""
import json
from _csrf_helper import _login, _post, _put, _delete


class TestAppraisalModels:
    """Tests unitarios del motor de cálculo y modelos ACM."""

    def test_create_appraisal_model(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal
            a = Appraisal(solicitante='Juan Pérez', titulo='Tasación Test',
                         tipo_propiedad='casa', superficie_cubierta=100,
                         tipo_cambio_usd=1200, valor_uva=35000)
            db.session.add(a)
            db.session.commit()
            assert a.id is not None
            assert a.estado == 'borrador'
            d = a.to_dict()
            assert d['solicitante'] == 'Juan Pérez'
            assert 'comparables' in d
            assert d['comparables'] == []

    def test_recalcular_no_comparables(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            _recalcular(a)
            assert a.total_comparables == 0
            assert a.precio_m2_promedio is None
            assert a.valor_estimado_usd is None

    def test_recalcular_un_comparable(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100,
                         tipo_cambio_usd=1200, valor_uva=35000)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.total_comparables == 1
            # precio_por_m2 del comparable = 80000/80 = 1000
            # coef = 1.0 (todos equivalentes)
            # ajustado = 1000 * 1.0 = 1000
            assert a.precio_m2_promedio is not None
            assert a.precio_m2_promedio > 0
            assert a.precio_m2_minimo == a.precio_m2_maximo  # single comparable
            assert a.dispersion_pct == 0.0
            assert a.coeficiente_promedio > 0
            assert a.valor_estimado_usd is not None
            assert a.valor_estimado_usd > 0

    def test_recalcular_multiple_comparables(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100,
                         tipo_cambio_usd=1200, valor_uva=35000)
            db.session.add(a)
            db.session.commit()
            for i in range(3):
                c = Comparable(appraisal_id=a.id, numero=i+1,
                              precio_usd=80000 + i*10000, superficie_cubierta=80)
                db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.total_comparables == 3
            assert a.precio_m2_minimo < a.precio_m2_maximo
            assert a.dispersion_pct > 0
            assert a.valor_estimado_usd is not None

    def test_recalcular_con_atributos_superior(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            c.comp_antiguedad = 'superior'
            c.comp_estado_mantenimiento = 'superior'
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.coeficiente_promedio is not None
            # coef = 1 + (-0.05)*2 = 0.90
            all_equivalente = 1.0
            assert a.coeficiente_promedio < all_equivalente
            assert a.coeficiente_promedio == 0.92

    def test_recalcular_con_atributos_inferior(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            c.comp_ubicacion = 'inferior'
            c.comp_comodidades = 'inferior'
            c.comp_habitaciones = 'inferior'
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            # coef = 1 + 0.07 + 0.03 + 0.03 = 1.13
            assert a.coeficiente_promedio is not None
            all_equivalente = 1.0
            assert a.coeficiente_promedio > all_equivalente
            assert a.coeficiente_promedio == 1.13

    def test_recalcular_sin_superficie(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=0)
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.precio_m2_promedio is None

    def test_recalcular_sin_precio(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=0,
                          superficie_cubierta=80)
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.precio_m2_promedio is None

    def test_recalcular_alta_dispersion(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            values = [(50000, 80), (200000, 90), (100000, 85)]
            for i, (precio, sup) in enumerate(values, 1):
                c = Comparable(appraisal_id=a.id, numero=i,
                              precio_usd=precio, superficie_cubierta=sup)
                db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert a.dispersion_pct is not None
            assert a.dispersion_pct > 20  # should be high with varied prices

    def test_recalcular_sin_superficie_cubierta_en_appraisal(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=0)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            # precio_m2 calculado pero valor_estimado no (sin superficie)
            assert a.precio_m2_promedio is not None
            assert a.valor_estimado_usd is None

    def test_to_dict_includes_comparables(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=50000,
                          superficie_cubierta=50, calle='Av. Siempre Viva')
            db.session.add(c)
            db.session.commit()
            d = a.to_dict()
            assert 'comparables' in d
            assert len(d['comparables']) == 1
            assert d['comparables'][0]['calle'] == 'Av. Siempre Viva'

    def test_from_dict_ignores_id_and_timestamps(self, app):
        with app.app_context():
            from models import Appraisal
            data = {
                'solicitante': 'María', 'titulo': 'Test from_dict',
                'tipo_propiedad': 'depto', 'superficie_cubierta': 70,
                'id': 999,
            }
            a = Appraisal.from_dict(data)
            assert a.solicitante == 'María'
            assert a.titulo == 'Test from_dict'
            assert a.id is None

    def test_update_from_dict_appraisal(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal
            a = Appraisal(solicitante='Original', estado='borrador')
            db.session.add(a)
            db.session.commit()
            a.update_from_dict({'solicitante': 'Actualizado', 'barrio': 'Nva Cba'})
            assert a.solicitante == 'Actualizado'
            assert a.barrio == 'Nva Cba'

    def test_comparable_update_from_dict(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            a = Appraisal(solicitante='Test')
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=50000,
                          calle='Vieja')
            c.update_from_dict({'precio_usd': 60000, 'calle': 'Nueva'})
            assert c.precio_usd == 60000
            assert c.calle == 'Nueva'

    def test_appraisal_log_model(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, AppraisalLog
            a = Appraisal(solicitante='Test')
            db.session.add(a)
            db.session.commit()
            log = AppraisalLog(appraisal_id=a.id, accion='creada',
                              descripcion='Tasación creada')
            db.session.add(log)
            db.session.commit()
            assert log.id is not None
            d = log.to_dict()
            assert d['accion'] == 'creada'
            assert d['descripcion'] == 'Tasación creada'

    def test_comparable_to_dict_with_rangos(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            d = c.to_dict()
            assert 'rango_min' in d
            assert 'rango_prom' in d
            assert 'rango_max' in d
            assert d['rango_min'] < d['rango_prom'] < d['rango_max']

    def test_comparable_to_dict_without_recalcular(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            a = Appraisal(solicitante='Test')
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80)
            db.session.add(c)
            db.session.commit()
            d = c.to_dict()
            # sin recalcular, rango no se calcula (falta _coef)
            assert 'rango_min' not in d


class TestHomologacion:
    """Tests del motor de homologación (calcular_homologacion + persistencia)."""

    def test_calcular_homologacion_all_equivalente(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            c = Comparable(precio_usd=80000, superficie_cubierta=80)
            result = calcular_homologacion(c)
            assert result is not None
            assert result['coeficiente_ajuste'] == 1.0
            assert result['valor_m2_ajustado'] == 1000.0  # 80000/80
            assert result['valor_ajustado'] == 80000.0    # 1000 * 80
            assert c.coeficiente_ajuste == 1.0
            assert c.valor_m2_ajustado == 1000.0
            assert c.valor_ajustado == 80000.0

    def test_calcular_homologacion_superior(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            # comp_ubicacion superior (-0.07) + comp_antiguedad superior (-0.04)
            c = Comparable(precio_usd=80000, superficie_cubierta=80,
                          comp_ubicacion='superior', comp_antiguedad='superior')
            result = calcular_homologacion(c)
            # total = -0.07 + -0.04 = -0.11
            # coef = 1 + (-0.11) = 0.89
            assert result['coeficiente_ajuste'] == 0.89
            # valor_m2_ajustado = 1000 * 0.89 = 890.0
            assert result['valor_m2_ajustado'] == 890.0
            # valor_ajustado = 890 * 80 = 71200.0
            assert result['valor_ajustado'] == 71200.0

    def test_calcular_homologacion_inferior(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            # comp_ubicacion inferior (+0.07) + comp_comodidades inferior (+0.03)
            # comp_habitaciones inferior (+0.03) + comp_estacionamiento inferior (+0.02)
            c = Comparable(precio_usd=80000, superficie_cubierta=80,
                          comp_ubicacion='inferior', comp_comodidades='inferior',
                          comp_habitaciones='inferior', comp_estacionamiento='inferior')
            result = calcular_homologacion(c)
            # total = 0.07 + 0.03 + 0.03 + 0.02 = 0.15
            # coef = 1 + 0.15 = 1.15
            assert result['coeficiente_ajuste'] == 1.15
            assert result['valor_m2_ajustado'] == 1150.0

    def test_calcular_homologacion_mixed(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            c = Comparable(precio_usd=100000, superficie_cubierta=100,
                          comp_ubicacion='superior',      # -0.07
                          comp_estado_mantenimiento='inferior',  # +0.04
                          comp_antiguedad='equivalente',  # 0
                          comp_habitaciones='superior',   # -0.03
                          comp_estacionamiento='inferior', # +0.02
                          comp_comodidades='equivalente') # 0
            result = calcular_homologacion(c)
            # total = -0.07 + 0.04 + 0 + (-0.03) + 0.02 + 0 = -0.04
            # coef = 1 + (-0.04) = 0.96
            assert result['coeficiente_ajuste'] == 0.96
            assert result['valor_m2_ajustado'] == 960.0  # 1000 * 0.96

    def test_calcular_homologacion_clamps_low(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            # All superior → coef should be clamped to 0.70 min
            c = Comparable(precio_usd=80000, superficie_cubierta=80,
                          comp_ubicacion='superior',
                          comp_estado_mantenimiento='superior',
                          comp_antiguedad='superior',
                          comp_habitaciones='superior',
                          comp_estacionamiento='superior',
                          comp_comodidades='superior',
                          comp_orientacion='superior',
                          comp_vistas='superior',
                          comp_nivel_piso='superior')
            result = calcular_homologacion(c)
            # total = -(0.07+0.04+0.04+0.03+0.02+0.03+0.02+0.02+0.03) = -0.30
            # coef = max(0.70, 0.70) = 0.70
            assert result['coeficiente_ajuste'] == 0.70

    def test_calcular_homologacion_clamps_high(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            # All inferior → coef should be clamped to 1.30 max
            c = Comparable(precio_usd=80000, superficie_cubierta=80,
                          comp_ubicacion='inferior',
                          comp_estado_mantenimiento='inferior',
                          comp_antiguedad='inferior',
                          comp_habitaciones='inferior',
                          comp_estacionamiento='inferior',
                          comp_comodidades='inferior',
                          comp_orientacion='inferior',
                          comp_vistas='inferior',
                          comp_nivel_piso='inferior')
            result = calcular_homologacion(c)
            # total = 0.07+0.04+0.04+0.03+0.02+0.03+0.02+0.02+0.03 = 0.30
            # coef = min(1.30, 1.30) = 1.30
            assert result['coeficiente_ajuste'] == 1.30

    def test_calcular_homologacion_no_precio(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            c = Comparable(precio_usd=0, superficie_cubierta=80)
            result = calcular_homologacion(c)
            assert result is None
            assert c.precio_por_m2 is None
            assert c.coeficiente_ajuste is None
            assert c.valor_m2_ajustado is None
            assert c.valor_ajustado is None

    def test_calcular_homologacion_no_superficie(self, app):
        with app.app_context():
            from models import Comparable
            from services.appraisal_service import AppraisalService; calcular_homologacion = AppraisalService.calcular_homologacion
            c = Comparable(precio_usd=80000, superficie_cubierta=0)
            result = calcular_homologacion(c)
            assert result is None
            assert c.precio_por_m2 is None

    def test_persist_coefficient_after_recalcular(self, app):
        with app.app_context():
            from extensions import db
            from models import Appraisal, Comparable
            from services.appraisal_service import AppraisalService; _recalcular = AppraisalService.recalcular
            a = Appraisal(solicitante='Homolog Test', superficie_cubierta=100)
            db.session.add(a)
            db.session.commit()
            c = Comparable(appraisal_id=a.id, numero=1, precio_usd=80000,
                          superficie_cubierta=80,
                          comp_ubicacion='inferior')
            db.session.add(c)
            db.session.commit()
            _recalcular(a)
            assert c.coeficiente_ajuste is not None
            assert c.coeficiente_ajuste > 1.0
            assert c.valor_m2_ajustado is not None
            assert c.valor_ajustado is not None
            # Verify DB persistence
            db.session.expire_all()
            c2 = db.session.get(Comparable, c.id)
            assert c2.coeficiente_ajuste == c.coeficiente_ajuste
            assert c2.valor_m2_ajustado == c.valor_m2_ajustado
            assert c2.valor_ajustado == c.valor_ajustado

    def test_to_dict_includes_homologation_fields(self, app):
        with app.app_context():
            from models import Comparable
            c = Comparable(coeficiente_ajuste=0.95, valor_m2_ajustado=950.0,
                          valor_ajustado=76000.0)
            d = c.to_dict()
            assert d['coeficiente_ajuste'] == 0.95
            assert d['valor_m2_ajustado'] == 950.0
            assert d['valor_ajustado'] == 76000.0


class TestAppraisalsAPI:
    """Tests de integración de la API ACM."""

    def test_list_ok(self, client):
        _login(client)
        r = client.get('/api/appraisals')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True
        assert isinstance(data['data'], dict)
        assert 'data' in data['data']
        assert 'page' in data['data']
        assert 'total' in data['data']
        assert 'pages' in data['data']

    def test_requires_auth(self, client):
        r = client.get('/api/appraisals')
        assert r.status_code == 401

    def test_create_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Juan Pérez', 'titulo': 'Tasación Test'})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['solicitante'] == 'Juan Pérez'
        assert data['estado'] == 'borrador'
        assert 'comparables' in data

    def test_create_appraisal_requires_solicitante_or_titulo(self, client):
        _login(client)
        r = _post(client, '/api/appraisals', {})
        assert r.status_code == 400

    def test_get_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'María', 'titulo': 'Test get'})
        aid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}')
        assert r.status_code == 200
        assert r.get_json()['data']['solicitante'] == 'María'

    def test_get_appraisal_404(self, client):
        _login(client)
        r = client.get('/api/appraisals/99999')
        assert r.status_code == 404

    def test_update_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Original'})
        aid = r.get_json()['data']['id']
        r = _put(client, f'/api/appraisals/{aid}',
            {'solicitante': 'Actualizado', 'barrio': 'Nva Cba'})
        assert r.status_code == 200
        assert r.get_json()['data']['solicitante'] == 'Actualizado'
        assert r.get_json()['data']['barrio'] == 'Nva Cba'

    def test_update_recalculates(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Test', 'superficie_cubierta': 100,
             'tipo_cambio_usd': 1200, 'valor_uva': 35000})
        aid = r.get_json()['data']['id']
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80})
        assert r.status_code == 201
        r = _put(client, f'/api/appraisals/{aid}',
            {'solicitante': 'Test Updated'})
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['total_comparables'] == 1
        assert data['precio_m2_promedio'] is not None

    def test_list_filters_by_estado(self, client):
        _login(client)
        _post(client, '/api/appraisals',
            {'solicitante': 'A', 'estado': 'completada'})
        _post(client, '/api/appraisals',
            {'solicitante': 'B', 'estado': 'borrador'})
        r = client.get('/api/appraisals?estado=completada')
        assert r.status_code == 200
        items = r.get_json()['data']['data']
        assert all(a['estado'] == 'completada' for a in items)

    def test_archive_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Para Archivar'})
        aid = r.get_json()['data']['id']
        r = _post(client, f'/api/appraisals/{aid}/archive')
        assert r.status_code == 200
        r = client.get(f'/api/appraisals/{aid}')
        assert r.get_json()['data']['estado'] == 'archivada'

    def test_archived_not_in_list(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Oculta'})
        aid = r.get_json()['data']['id']
        _post(client, f'/api/appraisals/{aid}/archive')
        r = client.get('/api/appraisals')
        items = r.get_json()['data']['data']
        assert all(a['id'] != aid for a in items)

    def test_archived_in_list_with_param(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Ver Archive'})
        aid = r.get_json()['data']['id']
        _post(client, f'/api/appraisals/{aid}/archive')
        r = client.get('/api/appraisals?archivadas=1')
        items = r.get_json()['data']['data']
        assert any(a['id'] == aid for a in items)

    def test_restore_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Restaurar'})
        aid = r.get_json()['data']['id']
        _post(client, f'/api/appraisals/{aid}/archive')
        r = _post(client, f'/api/appraisals/{aid}/restore')
        assert r.status_code == 200
        assert r.get_json()['data']['estado'] == 'borrador'

    def test_restore_non_archived_returns_error(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'No Arc'})
        aid = r.get_json()['data']['id']
        r = _post(client, f'/api/appraisals/{aid}/restore')
        assert r.status_code == 400

    def test_hard_delete_appraisal(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'A Eliminar'})
        aid = r.get_json()['data']['id']
        r = _delete(client, f'/api/appraisals/{aid}')
        assert r.status_code == 200
        r = client.get(f'/api/appraisals/{aid}')
        assert r.status_code == 404

    def test_logs(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Log Test'})
        aid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}/logs')
        assert r.status_code == 200
        logs = r.get_json()['data']
        assert len(logs) >= 1
        assert logs[0]['accion'] in ('creada', 'actualizada')

    def test_logs_404(self, client):
        _login(client)
        r = client.get('/api/appraisals/99999/logs')
        assert r.status_code == 404

    def test_stats(self, client):
        _login(client)
        r = client.get('/api/appraisals/stats')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert 'total' in data
        assert 'borradores' in data
        assert 'completadas' in data
        assert 'archivadas' in data

    def test_stats_counts_correctly(self, client):
        _login(client)
        _post(client, '/api/appraisals', {'solicitante': 'B1'})
        _post(client, '/api/appraisals', {'solicitante': 'B2'})
        _post(client, '/api/appraisals', {'solicitante': 'C1', 'estado': 'completada'})
        r = client.get('/api/appraisals/stats')
        data = r.get_json()['data']
        assert data['borradores'] >= 2
        assert data['completadas'] >= 1

    def test_calculate_endpoint(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Calc Test', 'superficie_cubierta': 100})
        aid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}/calculate')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['total_comparables'] == 0
        assert data['precio_m2_promedio'] is None

    def test_report_endpoint(self, client):
        _login(client)
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Report Test', 'superficie_cubierta': 100})
        aid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}/report')
        assert r.status_code == 200
        assert 'text/html' in r.content_type
        assert 'Análisis Comparativo de Mercado' in r.get_data(as_text=True)


class TestComparablesAPI:
    """Tests de la API de comparables anidados."""

    def _create_appraisal(self, client):
        r = _post(client, '/api/appraisals',
            {'solicitante': 'Comp Test', 'superficie_cubierta': 100,
             'tipo_cambio_usd': 1200, 'valor_uva': 35000})
        return r.get_json()['data']['id']

    def test_list_comparables_empty(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = client.get(f'/api/appraisals/{aid}/comparables')
        assert r.status_code == 200
        assert r.get_json()['data'] == []

    def test_create_comparable(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'calle': 'Av. Colón', 'numero_calle': '1234',
             'barrio': 'Centro', 'tipo_propiedad': 'depto'})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['precio_usd'] == 80000
        assert data['calle'] == 'Av. Colón'
        assert data['numero'] == 1
        assert 'rango_min' in data
        assert 'rango_prom' in data
        assert 'rango_max' in data

    def test_create_multiple_comparables_auto_number(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        for i in range(3):
            r = _post(client, f'/api/appraisals/{aid}/comparables',
                {'precio_usd': 50000 + i*10000,
                 'superficie_cubierta': 50 + i*10})
            assert r.status_code == 201
            assert r.get_json()['data']['numero'] == i + 1

    def test_create_comparable_updates_appraisal(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = client.get(f'/api/appraisals/{aid}')
        assert r.get_json()['data']['total_comparables'] == 0
        _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80})
        r = client.get(f'/api/appraisals/{aid}')
        assert r.get_json()['data']['total_comparables'] == 1

    def test_update_comparable(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 50000, 'superficie_cubierta': 50})
        cid = r.get_json()['data']['id']
        r = _put(client, f'/api/appraisals/{aid}/comparables/{cid}',
            {'precio_usd': 60000, 'calle': 'Actualizada'})
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['precio_usd'] == 60000
        assert data['calle'] == 'Actualizada'

    def test_delete_comparable_renumbers(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        ids = []
        for i in range(3):
            r = _post(client, f'/api/appraisals/{aid}/comparables',
                {'precio_usd': 50000, 'superficie_cubierta': 50})
            ids.append(r.get_json()['data']['id'])
        r = _delete(client, f'/api/appraisals/{aid}/comparables/{ids[1]}')
        assert r.status_code == 200
        r = client.get(f'/api/appraisals/{aid}/comparables')
        comps = r.get_json()['data']
        assert len(comps) == 2
        assert [c['numero'] for c in comps] == [1, 2]

    def test_delete_updates_appraisal_calculation(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 50000, 'superficie_cubierta': 50})
        cid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}')
        assert r.get_json()['data']['total_comparables'] == 1
        _delete(client, f'/api/appraisals/{aid}/comparables/{cid}')
        r = client.get(f'/api/appraisals/{aid}')
        assert r.get_json()['data']['total_comparables'] == 0

    def test_comparable_with_attributes(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'comp_antiguedad': 'superior',
             'comp_ubicacion': 'inferior',
             'comp_estado_mantenimiento': 'superior'})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert data['comp_antiguedad'] == 'superior'
        assert data['comp_ubicacion'] == 'inferior'
        assert data['comp_estado_mantenimiento'] == 'superior'

    def test_comparable_404(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = client.get(f'/api/appraisals/{aid}/comparables/99999')
        assert r.status_code == 404

    def test_comparable_requires_auth(self, client):
        r = client.get('/api/appraisals/1/comparables')
        assert r.status_code == 401

    def test_create_comparable_returns_homologation(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'comp_ubicacion': 'superior', 'comp_antiguedad': 'superior'})
        assert r.status_code == 201
        data = r.get_json()['data']
        assert 'coeficiente_ajuste' in data
        assert data['coeficiente_ajuste'] == 0.89
        assert data['valor_m2_ajustado'] == 890.0
        assert data['valor_ajustado'] == 71200.0

    def test_update_comparable_updates_homologation(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80})
        cid = r.get_json()['data']['id']
        r = _put(client, f'/api/appraisals/{aid}/comparables/{cid}',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'comp_ubicacion': 'inferior'})
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['coeficiente_ajuste'] == 1.07
        assert data['valor_m2_ajustado'] == 1070.0

    def test_preview_endpoint(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables/preview',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'comp_ubicacion': 'superior'})
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['coeficiente_ajuste'] == 0.93  # 1 - 0.07
        assert data['valor_m2_ajustado'] == 930.0
        assert data['valor_ajustado'] == 74400.0

    def test_homologation_persists_after_create(self, client):
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables',
            {'precio_usd': 80000, 'superficie_cubierta': 80,
             'comp_habitaciones': 'inferior'})
        cid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}')
        assert r.status_code == 200
        data = r.get_json()['data']
        comp = next(c for c in data['comparables'] if c['id'] == cid)
        assert comp['coeficiente_ajuste'] == 1.03

    def test_create_comparable_requires_csrf(self, client):
        _login(client)
        r = client.post('/api/appraisals/1/comparables',
            data=json.dumps({'precio_usd': 50000, 'superficie_cubierta': 50}),
            content_type='application/json')
        assert r.status_code in (401, 403)


class TestAppraisalVersions:
    """Tests del sistema de versionado de tasaciones."""

    def _create_appraisal(self, client, estado='borrador'):
        r = _post(client, '/api/appraisals', {
            'solicitante': 'Test Versiones',
            'titulo': 'Tasación Versiones',
            'tipo_propiedad': 'casa',
            'superficie_cubierta': 100,
            'tipo_cambio_usd': 1200,
            'valor_uva': 35000,
        })
        assert r.status_code == 201
        return r.get_json()['data']['id']

    def _add_comparable(self, client, aid):
        r = _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 100000,
            'superficie_cubierta': 80,
            'calle': 'Av. Test',
            'numero_calle': '123',
            'comp_ubicacion': 'equivalente',
            'comp_estado_mantenimiento': 'equivalente',
            'comp_comodidades': 'equivalente',
        })
        assert r.status_code == 201
        return r.get_json()['data']['id']

    def test_snapshot_created_on_completar(self, client):
        """Al completar una tasación se debe crear un snapshot."""
        _login(client)
        aid = self._create_appraisal(client)
        self._add_comparable(client, aid)
        r = _post(client, f'/api/appraisals/{aid}/completar')
        assert r.status_code == 200
        # Verificar que se creó una versión
        r = client.get(f'/api/appraisals/{aid}/versions')
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True
        versions = data['data']
        assert len(versions) == 1
        assert versions[0]['version'] == 1
        assert versions[0]['has_snapshot'] is True

    def test_version_blocks_mutations(self, client):
        """Una tasación completada/archivada debe rechazar mutaciones."""
        _login(client)
        aid = self._create_appraisal(client)
        self._add_comparable(client, aid)
        _post(client, f'/api/appraisals/{aid}/completar')

        # Intentar editar
        r = _put(client, f'/api/appraisals/{aid}', {'titulo': 'Nuevo título'})
        assert r.status_code == 400
        assert 'completada' in r.get_json()['error'].lower()

        # Intentar agregar comparable
        r = _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 50000, 'superficie_cubierta': 50,
        })
        assert r.status_code == 400
        assert 'completada' in r.get_json()['error'].lower()

    def test_new_version_unlocks_and_creates_snapshot(self, client):
        """'Crear nueva versión' debe crear snapshot y pasar a en_proceso."""
        _login(client)
        aid = self._create_appraisal(client)
        self._add_comparable(client, aid)
        _post(client, f'/api/appraisals/{aid}/completar')

        # Crear nueva versión
        r = _post(client, f'/api/appraisals/{aid}/new-version')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['estado'] == 'en_proceso'

        # Verificar que ahora se puede editar
        r = _put(client, f'/api/appraisals/{aid}', {'titulo': 'Editado después de versión'})
        assert r.status_code == 200

        # Verificar que hay 2 versiones
        r = client.get(f'/api/appraisals/{aid}/versions')
        assert r.status_code == 200
        versions = r.get_json()['data']
        assert len(versions) == 2
        assert versions[0]['version'] == 2
        assert versions[1]['version'] == 1

    def test_version_snapshot_content(self, client):
        """El snapshot debe contener los datos correctos de la tasación."""
        _login(client)
        aid = self._create_appraisal(client)
        cid = self._add_comparable(client, aid)
        _post(client, f'/api/appraisals/{aid}/completar')

        r = client.get(f'/api/appraisals/{aid}/versions/1')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert data['version']['version'] == 1
        snapshot = data['snapshot']
        assert snapshot is not None
        assert snapshot['appraisal']['id'] == aid
        assert snapshot['appraisal']['solicitante'] == 'Test Versiones'
        assert len(snapshot['comparables']) == 1
        assert snapshot['comparables'][0]['id'] == cid

    def test_archived_is_read_only(self, client):
        """Tasaciones archivadas también deben ser de solo lectura."""
        _login(client)
        aid = self._create_appraisal(client)
        r = _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 50000, 'superficie_cubierta': 50,
        })
        cid = r.get_json()['data']['id']
        _post(client, f'/api/appraisals/{aid}/completar')
        # Archivar
        r = _post(client, f'/api/appraisals/{aid}/archive')
        assert r.status_code == 200

        # Intentar editar
        r = _put(client, f'/api/appraisals/{aid}', {'titulo': 'Editado'})
        assert r.status_code == 400
        assert 'archivada' in r.get_json()['error'].lower()

        # Eliminar comparable
        r = _delete(client, f'/api/appraisals/{aid}/comparables/{cid}')
        assert r.status_code == 400
        assert 'archivada' in r.get_json()['error'].lower()

    def test_multiple_new_versions(self, client):
        """Crear varias versiones debe incrementar el número correctamente."""
        _login(client)
        aid = self._create_appraisal(client)
        self._add_comparable(client, aid)
        # Completar y crear nueva versión (3 ciclos)
        for i in range(3):
            _post(client, f'/api/appraisals/{aid}/completar')
            r = _post(client, f'/api/appraisals/{aid}/new-version')
            assert r.status_code == 200
            assert r.get_json()['data']['estado'] == 'en_proceso'

        # Cada ciclo genera 2 versiones: una al completar y otra al new-version
        r = client.get(f'/api/appraisals/{aid}/versions')
        versions = r.get_json()['data']
        assert len(versions) == 6
        assert [v['version'] for v in versions] == [6, 5, 4, 3, 2, 1]

    def test_versions_list_includes_metadata(self, client):
        """El listado de versiones debe incluir metadatos."""
        _login(client)
        aid = self._create_appraisal(client)
        self._add_comparable(client, aid)
        _post(client, f'/api/appraisals/{aid}/completar')

        r = client.get(f'/api/appraisals/{aid}/versions')
        versions = r.get_json()['data']
        v = versions[0]
        assert 'id' in v
        assert 'version' in v
        assert 'created_at' in v
        assert 'created_by' in v
        assert 'has_snapshot' in v


class TestMapDataAPI:
    """Tests del endpoint GET /api/appraisals/<aid>/map-data."""

    def test_map_data_requires_auth(self, client):
        r = client.get('/api/appraisals/1/map-data')
        assert r.status_code == 401

    def test_map_data_404(self, client):
        _login(client)
        r = client.get('/api/appraisals/99999/map-data')
        assert r.status_code == 404

    def test_map_data_empty(self, client):
        _login(client)
        r = _post(client, '/api/appraisals', {'solicitante': 'Test', 'titulo': 'Mapeo'})
        aid = r.get_json()['data']['id']
        r = client.get(f'/api/appraisals/{aid}/map-data')
        assert r.status_code == 200
        data = r.get_json()['data']
        assert 'appraisal' in data
        assert 'comparables' in data
        assert data['comparables'] == []
        appr = data['appraisal']
        assert appr['id'] == aid
        assert appr['titulo'] == 'Mapeo'
        assert appr['lat'] is None
        assert appr['lng'] is None

    def test_map_data_with_comparables(self, client):
        _login(client)
        r = _post(client, '/api/appraisals', {
            'solicitante': 'Test', 'titulo': 'C/Comparables',
            'superficie_cubierta': 100, 'tipo_propiedad': 'casa',
        })
        aid = r.get_json()['data']['id']
        _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 80000, 'superficie_cubierta': 80,
            'comp_ubicacion': 'superior', 'tipo_propiedad': 'casa',
        })
        _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 100000, 'superficie_cubierta': 90,
            'comp_antiguedad': 'inferior', 'tipo_propiedad': 'casa',
        })

        r = client.get(f'/api/appraisals/{aid}/map-data')
        assert r.status_code == 200
        data = r.get_json()['data']
        appr = data['appraisal']
        assert appr['superficie_cubierta'] == 100
        assert appr['tipo_propiedad'] == 'casa'
        assert appr['valor_estimado_usd'] is not None
        assert appr['precio_m2_promedio'] is not None
        assert appr['coeficiente_promedio'] is not None

        comps = data['comparables']
        assert len(comps) == 2
        for c in comps:
            assert 'id' in c
            assert 'numero' in c
            assert 'precio_usd' in c
            assert 'sup_cubierta' in c
            assert 'tipo_propiedad' in c
            assert 'coeficiente_ajuste' in c
            assert 'valor_m2_ajustado' in c
            assert 'valor_ajustado' in c
            assert 'precio_por_m2' in c
            assert 'lat' in c
            assert 'lng' in c

    def test_map_data_homologation_fields_populated(self, client):
        _login(client)
        r = _post(client, '/api/appraisals', {
            'solicitante': 'Homolog Map', 'superficie_cubierta': 100,
        })
        aid = r.get_json()['data']['id']
        # Comparable with inferior attributes → coef > 1.0
        _post(client, f'/api/appraisals/{aid}/comparables', {
            'precio_usd': 80000, 'superficie_cubierta': 80,
            'comp_ubicacion': 'inferior', 'comp_antiguedad': 'inferior',
        })
        r = client.get(f'/api/appraisals/{aid}/map-data')
        data = r.get_json()['data']
        c = data['comparables'][0]
        assert c['coeficiente_ajuste'] is not None
        assert c['coeficiente_ajuste'] > 1.0
        assert c['valor_m2_ajustado'] is not None
        assert c['valor_ajustado'] is not None
        assert c['precio_por_m2'] is not None
