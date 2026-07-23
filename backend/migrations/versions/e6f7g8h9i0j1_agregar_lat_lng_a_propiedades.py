"""agregar lat/lng a properties y rentals

Revision ID: e6f7g8h9i0j1
Revises: a1b2c3d4e5f6
Create Date: 2026-05-26 11:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e6f7g8h9i0j1'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('properties', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('properties', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('rentals', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('rentals', sa.Column('longitude', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('properties', 'latitude')
    op.drop_column('properties', 'longitude')
    op.drop_column('rentals', 'latitude')
    op.drop_column('rentals', 'longitude')
