"""agregar estado_conservacion a appraisals

Revision ID: a2b3c4d5e6f7
Revises: 1c9e5ff9380b
Create Date: 2026-06-03 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a2b3c4d5e6f7'
down_revision = '1c9e5ff9380b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('appraisals', schema=None) as batch_op:
        batch_op.add_column(sa.Column('estado_conservacion', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('appraisals', schema=None) as batch_op:
        batch_op.drop_column('estado_conservacion')
