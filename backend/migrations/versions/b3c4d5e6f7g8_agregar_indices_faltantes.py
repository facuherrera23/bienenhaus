"""agregar índices compuestos faltantes

Revision ID: b3c4d5e6f7g8
Revises: a2b3c4d5e6f7
Create Date: 2026-06-05 16:00:00.000000
"""
from alembic import op


revision = 'b3c4d5e6f7g8'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    # portal_queue: búsqueda por portal + pendientes + orden
    op.create_index('ix_portal_queue_portal_processed_created',
                    'portal_queue', ['portal_id', 'processed', 'created_at'])

    # portal_publications: lookup por portal + property/rental
    op.create_index('ix_portal_publications_portal_property',
                    'portal_publications', ['portal_id', 'property_id'])
    op.create_index('ix_portal_publications_portal_rental',
                    'portal_publications', ['portal_id', 'rental_id'])

    # portal_logs: listado por portal + fecha
    op.create_index('ix_portal_logs_portal_created',
                    'portal_logs', ['portal_id', 'created_at'])

    # comparables: lookup por appraisal (FK sin índice)
    op.create_index('ix_comparables_appraisal',
                    'comparables', ['appraisal_id'])


def downgrade():
    op.drop_index('ix_portal_queue_portal_processed_created')
    op.drop_index('ix_portal_publications_portal_property')
    op.drop_index('ix_portal_publications_portal_rental')
    op.drop_index('ix_portal_logs_portal_created')
    op.drop_index('ix_comparables_appraisal')
