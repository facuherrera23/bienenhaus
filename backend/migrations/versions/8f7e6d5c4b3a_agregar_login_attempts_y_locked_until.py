"""agregar login_attempts y locked_until a users

Revision ID: 8f7e6d5c4b3a
Revises: 2c8018d80912
Create Date: 2026-06-01 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '8f7e6d5c4b3a'
down_revision = '2c8018d80912'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'login_attempts' not in columns:
        op.add_column('users', sa.Column('login_attempts', sa.Integer(), default=0))
    if 'locked_until' not in columns:
        op.add_column('users', sa.Column('locked_until', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'login_attempts')
