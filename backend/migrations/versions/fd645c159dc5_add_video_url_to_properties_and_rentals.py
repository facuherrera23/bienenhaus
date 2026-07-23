"""add video_url to properties and rentals

Revision ID: fd645c159dc5
Revises: fd52030b8fb3
Create Date: 2026-06-19 18:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'fd645c159dc5'
down_revision = 'fd52030b8fb3'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('properties', schema=None) as batch_op:
        batch_op.add_column(sa.Column('video_url', sa.String(length=500), nullable=True))
    with op.batch_alter_table('rentals', schema=None) as batch_op:
        batch_op.add_column(sa.Column('video_url', sa.String(length=500), nullable=True))


def downgrade():
    with op.batch_alter_table('properties', schema=None) as batch_op:
        batch_op.drop_column('video_url')
    with op.batch_alter_table('rentals', schema=None) as batch_op:
        batch_op.drop_column('video_url')
