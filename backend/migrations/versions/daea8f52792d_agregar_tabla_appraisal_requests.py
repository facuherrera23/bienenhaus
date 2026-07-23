"""agregar tabla appraisal_requests

Revision ID: daea8f52792d
Revises: d5e6f7g8h9i0
Create Date: 2026-06-10 01:13:01.140052

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'daea8f52792d'
down_revision = 'd5e6f7g8h9i0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('appraisal_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('phone', sa.String(length=100), nullable=True),
    sa.Column('email', sa.String(length=200), nullable=True),
    sa.Column('property_type', sa.String(length=50), nullable=True),
    sa.Column('city', sa.String(length=200), nullable=True),
    sa.Column('address', sa.String(length=200), nullable=True),
    sa.Column('comments', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True, server_default='pendiente'),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('appraisal_requests')
