"""seed_demo_acm.py — Carga una tasación demo para presentación al cliente."""

from datetime import date


def run(app):
    with app.app_context():
        from extensions import db
        from models import Appraisal, Comparable, Empresa

        # ── Empresa demo ──
        emp = Empresa.query.first()
        if not emp:
            emp = Empresa(
                nombre='Bienenhaus Propiedades',
                subtitulo='Asesoramiento · Tasaciones · Inversiones',
                tasador_nombre='Arq. Juan Martín Tasador',
                tasador_matricula='MAT. 12345 · CPCEC',
                telefono='+54 351 555-1234',
                email='tasaciones@bienenhaus.com',
                direccion='Av. Colón 1234, Córdoba',
                color_principal='#20b8ab',
            )
            db.session.add(emp)

        # ── Tasación demo ──
        existing = Appraisal.query.filter_by(titulo='DEMO - Nueva Cordoba').first()
        if existing:
            print('Ya existe la tasación demo. Eliminala primero si querés recargarla.')
            return

        appraisal = Appraisal(
            titulo='DEMO - Nueva Cordoba',
            estado='completada',
            fecha_tasacion=date.today(),
            destino='venta',
            solicitante='Cliente Demo S.A.',
            telefono='+54 351 555-0000',
            tipo_propiedad='departamento',
            direccion='Av. Hipólito Yrigoyen 456',
            barrio='Nueva Córdoba',
            localidad='Córdoba',
            provincia='Córdoba',
            anio_construccion=2018,
            superficie_terreno=0,
            superficie_cubierta=72,
            dormitorios=2,
            banios=2,
            tipo_construccion='hormigón armado',
            tipo_techo='losa',
            orientacion='norte',
            luminosidad='alta',
            calidad_constructiva='alta',
            calidad_mantenimiento='alta',
            detalles_terminacion='alto',
            estado_conservacion='excelente',
            estacionamiento='cochera cubierta',
            calefaccion='individual',
            agua_caliente='individual',
            aire_acondicionado='individual',
            vida_remanente=50,
            impuesto_inmobiliario_mensual=8500,
            tipo_cambio_usd=1200,
            valor_uva=35000,
            tiene_cocina=True,
            tiene_comedor=True,
            tiene_living=True,
            tiene_patio=False,
            tiene_terraza=True,
            tiene_balcon=True,
            tiene_lavadero=True,
            tiene_escritorio=False,
            tiene_suite=False,
            tiene_playroom=False,
            tiene_asador=True,
            tiene_piscina=False,
            tiene_garage=True,
            tiene_electricidad_publica=True,
            tiene_gas_publico=True,
            tiene_telefono_publico=True,
            tiene_agua_publica=True,
            tiene_cloaca_publica=True,
            tiene_desague_pluvial=True,
            tipo_barrio='urbano',
            nivel_construccion='mas_75',
            indice_crecimiento='en_crecimiento',
            vigilancia_barrio=True,
            valores_propiedad='creciente',
            demanda_oferta='exceso_demanda',
            tiempo_comercializacion='menos_3',
            uso_residencial_pct=80,
            uso_comercial_pct=18,
            uso_industrial_pct=2,
            cambios_uso_terreno='improbable',
            facilidades_estacionamiento='cochera y playa de estacionamiento',
            tipologias_predominantes='departamentos y PH',
            calidad_constructiva_barrio='alta',
            construccion_altura='edificios de 8 a 15 pisos',
            uso_comercial_descripcion='comercios gastronómicos y locales en planta baja',
            uso_industrial_descripcion='',
            nivel_socioeconomico='medio_alto',
            observaciones='Propiedad en excelente estado, lista para escriturar.',
        )
        db.session.add(appraisal)
        db.session.flush()

        # ── Comparables demo ──
        comparables_data = [
            dict(calle='Av. Vélez Sarsfield', numero_calle='780', barrio='Nueva Córdoba',
                 localidad='Córdoba', tipo_propiedad='departamento', tipo_operacion='venta',
                 precio_usd=82000, superficie_cubierta=70, dormitorios=2, banios=2,
                 tiene_garage=True, anio_construccion=2020, dias_en_mercado=45,
                 link_fuente='https://www.mercadolibre.com.ar/...',
                 comp_antiguedad='equivalente', comp_estacionamiento='equivalente',
                 comp_habitaciones='equivalente', comp_ubicacion='equivalente',
                 comp_estado_mantenimiento='equivalente', comp_comodidades='equivalente'),
            dict(calle='Bv. Chacabuco', numero_calle='1050', barrio='Nueva Córdoba',
                 localidad='Córdoba', tipo_propiedad='departamento', tipo_operacion='venta',
                 precio_usd=95000, superficie_cubierta=78, dormitorios=2, banios=2,
                 tiene_garage=True, anio_construccion=2019, dias_en_mercado=30,
                 link_fuente='https://www.zonaprop.com.ar/...',
                 comp_antiguedad='equivalente', comp_estacionamiento='equivalente',
                 comp_habitaciones='equivalente', comp_ubicacion='superior',
                 comp_estado_mantenimiento='equivalente', comp_comodidades='equivalente'),
            dict(calle='Caseros', numero_calle='350', barrio='Nueva Córdoba',
                 localidad='Córdoba', tipo_propiedad='departamento', tipo_operacion='cotizacion',
                 precio_usd=78000, superficie_cubierta=65, dormitorios=2, banios=1,
                 tiene_garage=False, anio_construccion=2015, dias_en_mercado=90,
                 link_fuente='https://www.argenprop.com/...',
                 comp_antiguedad='inferior', comp_estacionamiento='inferior',
                 comp_habitaciones='equivalente', comp_ubicacion='equivalente',
                 comp_estado_mantenimiento='inferior', comp_comodidades='equivalente'),
            dict(calle='Ituzaingó', numero_calle='520', barrio='Nueva Córdoba',
                 localidad='Córdoba', tipo_propiedad='departamento', tipo_operacion='venta',
                 precio_usd=110000, superficie_cubierta=85, dormitorios=3, banios=2,
                 tiene_garage=True, anio_construccion=2022, dias_en_mercado=15,
                 link_fuente='https://www.mercadolibre.com.ar/...',
                 comp_antiguedad='superior', comp_estacionamiento='equivalente',
                 comp_habitaciones='superior', comp_ubicacion='superior',
                 comp_estado_mantenimiento='superior', comp_comodidades='superior'),
        ]

        for i, cd in enumerate(comparables_data, 1):
            c = Comparable(appraisal_id=appraisal.id, numero=i, **cd)
            db.session.add(c)

        from routes.appraisals import _recalcular
        _recalcular(appraisal)
        db.session.commit()
        print('[OK] Tasacion demo creada: "DEMO - Nueva Cordoba" con 4 comparables.')
        if appraisal.valor_estimado_usd:
            print(f'     Precio estimado: ~USD {appraisal.valor_estimado_usd:,.2f}')
        else:
            print('     (calculando...)')
