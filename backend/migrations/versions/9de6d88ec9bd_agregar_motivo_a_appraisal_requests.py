"""agregar motivo a appraisal_requests

Revision ID: 9de6d88ec9bd
Revises: 1927e0169cf8
Create Date: 2026-06-10 21:32:03.732412

"""
from alembic import op
import sqlalchemy as sa

revision = '9de6d88ec9bd'
down_revision = '1927e0169cf8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('appraisal_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('motivo', sa.String(length=100), nullable=True))


def downgrade():
    with op.batch_alter_table('appraisal_requests', schema=None) as batch_op:
        batch_op.drop_column('motivo')
