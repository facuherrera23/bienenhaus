"""add tipo_cliente to Lead

Revision ID: a3b4c5d6e7f8
Revises: dee2f730f05b
Create Date: 2026-07-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b4c5d6e7f8'
down_revision = 'dee2f730f05b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('leads', sa.Column('tipo_cliente', sa.String(length=20), server_default='', nullable=True))


def downgrade():
    op.drop_column('leads', 'tipo_cliente')
