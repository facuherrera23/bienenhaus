"""agregar columnas de homologación a comparables

Revision ID: c4d5e6f7g8h9
Revises: b3c4d5e6f7g8
Create Date: 2026-06-08 12:00:00.000000
"""
import sqlalchemy as sa
from alembic import op


revision = 'c4d5e6f7g8h9'
down_revision = 'b3c4d5e6f7g8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('comparables', sa.Column('coeficiente_ajuste', sa.Float(), nullable=True))
    op.add_column('comparables', sa.Column('valor_m2_ajustado', sa.Float(), nullable=True))
    op.add_column('comparables', sa.Column('valor_ajustado', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('comparables', 'valor_ajustado')
    op.drop_column('comparables', 'valor_m2_ajustado')
    op.drop_column('comparables', 'coeficiente_ajuste')
