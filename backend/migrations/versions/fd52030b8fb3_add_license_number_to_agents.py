"""add license_number to agents

Revision ID: fd52030b8fb3
Revises: 703085effcbe
Create Date: 2026-06-13 22:03:33.996027

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fd52030b8fb3'
down_revision = '703085effcbe'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('agents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('license_number', sa.String(length=100), nullable=True))


def downgrade():
    with op.batch_alter_table('agents', schema=None) as batch_op:
        batch_op.drop_column('license_number')
