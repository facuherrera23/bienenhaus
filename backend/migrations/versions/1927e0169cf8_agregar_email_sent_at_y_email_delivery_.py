"""agregar email_sent_at y email_delivery_status a appraisal_requests

Revision ID: 1927e0169cf8
Revises: daea8f52792d
Create Date: 2026-06-10 01:42:14.355601

"""
from alembic import op
import sqlalchemy as sa

revision = '1927e0169cf8'
down_revision = 'daea8f52792d'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('appraisal_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email_sent_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('email_delivery_status', sa.String(length=20), nullable=True,
                                       server_default='pending'))


def downgrade():
    with op.batch_alter_table('appraisal_requests', schema=None) as batch_op:
        batch_op.drop_column('email_delivery_status')
        batch_op.drop_column('email_sent_at')
