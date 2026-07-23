"""add unique constraint on appraisal_request_id

Revision ID: b8c9d0e1f2a3
Revises: 70061a7ae357
Create Date: 2026-06-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b8c9d0e1f2a3'
down_revision = '70061a7ae357'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('appraisals', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_appraisal_request', ['appraisal_request_id'])


def downgrade():
    with op.batch_alter_table('appraisals', schema=None) as batch_op:
        batch_op.drop_constraint('uq_appraisal_request', type_='unique')
