"""Add tipo column to appraisals and migrate tasaciones main table

Revision ID: add_tipo_migrate_main
Revises: <prev_revision>
Create Date: 2026-07-21

Scope: Solo tabla principal appraisals + tasaciones
Siguientes revisiones: comparables, versions, logs, extras
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_tipo_migrate_main'
down_revision = '<prev_revision>'
branch_labels = None
depends_on = None


def _is_pg():
    return op.get_bind().dialect.name == 'postgresql'


def upgrade():
    # 1. VERIFICAR COLISIONES ANTES DE CUALQUIER DDL
    bind = op.get_bind()
    result = bind.execute(sa.text("""
        SELECT COUNT(*) FROM (
            SELECT id FROM appraisals
            INTERSECT
            SELECT id FROM tasaciones
        ) AS collision
    """))
    collision_count = result.scalar()
    if collision_count > 0:
        raise RuntimeError(f"ID collision detected: {collision_count} overlapping IDs. Abort migration.")

    # 2. AGREGAR COLUMNA tipo a appraisals existente
    op.add_column('appraisals', sa.Column('tipo', sa.String(20), nullable=False, server_default='acm'))
    op.create_index('ix_appraisals_tipo_estado', 'appraisals', ['tipo', 'estado'])

    # 3. COPIAR DATOS tasaciones -> appraisals (preservar PK)
    if _is_pg():
        op.execute("""
            INSERT INTO appraisals (
                id, tipo, titulo, estado, fecha_tasacion, destino, solicitante, telefono,
                tipo_propiedad, direccion, barrio, localidad, provincia, anio_construccion,
                superficie_terreno, superficie_cubierta, dormitorios, banios,
                tipo_construccion, tipo_techo, orientacion, luminosidad, calidad_constructiva,
                calidad_mantenimiento, detalles_terminacion, estado_conservacion,
                estacionamiento, calefaccion, agua_caliente, aire_acondicionado,
                vida_remanente, impuesto_inmobiliario_mensual, tipo_cambio_usd, valor_uva,
                tiene_cocina, tiene_comedor, tiene_living, tiene_patio, tiene_terraza,
                tiene_balcon, tiene_lavadero, tiene_escritorio, tiene_suite, tiene_playroom,
                tiene_asador, tiene_piscina, tiene_garage,
                tiene_electricidad_publica, tiene_gas_publico, tiene_telefono_publico,
                tiene_agua_publica, tiene_cloaca_publica, tiene_desague_pluvial,
                tipo_barrio, nivel_construccion, indice_crecimiento, vigilancia_barrio,
                valores_propiedad, demanda_oferta, tiempo_comercializacion,
                uso_residencial_pct, uso_comercial_pct, uso_industrial_pct,
                cambios_uso_terreno, facilidades_estacionamiento, tipologias_predominantes,
                calidad_constructiva_barrio, construccion_altura, uso_comercial_descripcion,
                uso_industrial_descripcion, nivel_socioeconomico,
                valor_estimado_usd, valor_estimado_ars, valor_estimado_uvas,
                precio_m2_promedio, precio_m2_minimo, precio_m2_maximo,
                dispersion_pct, coeficiente_promedio, total_comparables,
                observaciones, appraisal_request_id, assigned_agent_id, priority,
                created_at, updated_at
            )
            SELECT
                id, 'tasacion', titulo, estado, fecha_tasacion, destino, solicitante, telefono,
                tipo_propiedad, direccion, barrio, localidad, provincia, anio_construccion,
                superficie_terreno, superficie_cubierta, dormitorios, banios,
                tipo_construccion, tipo_techo, orientacion, luminosidad, calidad_constructiva,
                calidad_mantenimiento, detalles_terminacion, estado_conservacion,
                estacionamiento, calefaccion, agua_caliente, aire_acondicionado,
                vida_remanente, impuesto_inmobiliario_mensual, tipo_cambio_usd, valor_uva,
                tiene_cocina, tiene_comedor, tiene_living, tiene_patio, tiene_terraza,
                tiene_balcon, tiene_lavadero, tiene_escritorio, tiene_suite, tiene_playroom,
                tiene_asador, tiene_piscina, tiene_garage,
                tiene_electricidad_publica, tiene_gas_publico, tiene_telefono_publico,
                tiene_agua_publica, tiene_cloaca_publica, tiene_desague_pluvial,
                tipo_barrio, nivel_construccion, indice_crecimiento, vigilancia_barrio,
                valores_propiedad, demanda_oferta, tiempo_comercializacion,
                uso_residencial_pct, uso_comercial_pct, uso_industrial_pct,
                cambios_uso_terreno, facilidades_estacionamiento, tipologias_predominantes,
                calidad_constructiva_barrio, construccion_altura, uso_comercial_descripcion,
                uso_industrial_descripcion, nivel_socioeconomico,
                valor_estimado_usd, valor_estimado_ars, valor_estimado_uvas,
                precio_m2_promedio, precio_m2_minimo, precio_m2_maximo,
                dispersion_pct, coeficiente_promedio, total_comparables,
                observaciones, NULL as appraisal_request_id, assigned_agent_id, priority,
                created_at, updated_at
            FROM tasaciones
            ON CONFLICT (id) DO NOTHING
        """)
    else:
        # SQLite compatible
        op.execute("""
            INSERT OR IGNORE INTO appraisals ( ... same columns ... )
            SELECT ... FROM tasaciones
        """)

    # 4. VALIDAR CONTEOS
    bind = op.get_bind()
    tas_count = bind.execute(sa.text("SELECT COUNT(*) FROM tasaciones")).scalar()
    app_tas_count = bind.execute(sa.text("SELECT COUNT(*) FROM appraisals WHERE tipo='tasacion'")).scalar()
    if tas_count != app_tas_count:
        raise RuntimeError(f"Migration validation failed: tasaciones={tas_count}, appraisals(tasacion)={app_tas_count}")

    # 5. AJUSTAR SECUENCIA / AUTOINCREMENT
    if _is_pg():
        op.execute("""
            SELECT setval(
                pg_get_serial_sequence('appraisals','id'),
                (SELECT MAX(id) FROM appraisals)
            )
        """)
    else:
        # SQLite: verificar que el próximo autoincrement es correcto
        op.execute("UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM appraisals) WHERE name = 'appraisals'")


def downgrade():
    # Rollback: elimina columna tipo, tasaciones intacta
    op.drop_index('ix_appraisals_tipo_estado', table_name='appraisals')
    op.drop_column('appraisals', 'tipo')
    # Nota: filas con tipo='tasacion' quedan huérfanas en appraisals — limpieza manual si necesario