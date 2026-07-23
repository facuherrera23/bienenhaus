"""agregar índices compuestos prioritarios: portal_queue, appraisals, comparables

Revision ID: 4f5a6b7c8d9e
Revises: 3f4a5b6c7d8e
Create Date: 2026-06-11 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '4f5a6b7c8d9e'
down_revision = '3f4a5b6c7d8e'
branch_labels = None
depends_on = None


def upgrade():
    # portal_queue: composite para dequeue (status + priority + created_at)
    op.create_index(
        'ix_portal_queue_dequeue',
        'portal_queue',
        ['status', 'priority', 'created_at'],
        unique=False,
        postgresql_where=sa.text("status = 'pending'"),
        sqlite_where=sa.text("status = 'pending'"),
    )

    # portal_queue: composite para dequeue_retry / DLQ
    op.create_index(
        'ix_portal_queue_dlq',
        'portal_queue',
        ['status', 'retry_count', 'next_retry_at'],
        unique=False,
        postgresql_where=sa.text("status = 'failed'"),
        sqlite_where=sa.text("status = 'failed'"),
    )

    # appraisals: listado por estado + orden por updated_at
    op.create_index(
        'ix_appraisals_estado_updated',
        'appraisals',
        ['estado', 'updated_at'],
        unique=False,
    )

    # comparables: orden dentro de una tasación
    op.create_index(
        'ix_comparables_appraisal_numero',
        'comparables',
        ['appraisal_id', 'numero'],
        unique=False,
    )


def downgrade():
    op.drop_index('ix_comparables_appraisal_numero', table_name='comparables')
    op.drop_index('ix_appraisals_estado_updated', table_name='appraisals')
    op.drop_index('ix_portal_queue_dlq', table_name='portal_queue')
    op.drop_index('ix_portal_queue_dequeue', table_name='portal_queue')
