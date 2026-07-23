"""agregar tablas usuarios, portales, colas
Revision ID: a1b2c3d4e5f6
Revises: 5c0a0d50a788
Create Date: 2026-05-26 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '5c0a0d50a788'
branch_labels = None
depends_on = None


def upgrade():
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)

    tables = {
        'users': lambda: op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(length=80), nullable=False),
            sa.Column('email', sa.String(length=200), nullable=True),
            sa.Column('password_hash', sa.String(length=200), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('username')
        ),
        'portals': lambda: op.create_table('portals',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('slug', sa.String(length=100), nullable=False),
            sa.Column('active', sa.Boolean(), nullable=True),
            sa.Column('config_json', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('slug')
        ),
        'portal_publications': lambda: op.create_table('portal_publications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('portal_id', sa.Integer(), nullable=False),
            sa.Column('property_id', sa.Integer(), nullable=True),
            sa.Column('rental_id', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('external_id', sa.String(length=200), nullable=True),
            sa.Column('attempts', sa.Integer(), nullable=True),
            sa.Column('last_error', sa.Text(), nullable=True),
            sa.Column('published_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['portal_id'], ['portals.id'], ),
            sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
            sa.ForeignKeyConstraint(['rental_id'], ['rentals.id'], ),
            sa.PrimaryKeyConstraint('id')
        ),
        'portal_logs': lambda: op.create_table('portal_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('portal_id', sa.Integer(), nullable=False),
            sa.Column('property_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('level', sa.String(length=20), nullable=True),
            sa.Column('message', sa.Text(), nullable=True),
            sa.Column('raw_response', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['portal_id'], ['portals.id'], ),
            sa.PrimaryKeyConstraint('id')
        ),
        'portal_queue': lambda: op.create_table('portal_queue',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('portal_id', sa.Integer(), nullable=True),
            sa.Column('property_id', sa.Integer(), nullable=True),
            sa.Column('rental_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('priority', sa.Integer(), nullable=True),
            sa.Column('processed', sa.Boolean(), nullable=True),
            sa.Column('error', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['portal_id'], ['portals.id'], ),
            sa.PrimaryKeyConstraint('id')
        ),
    }

    for table_name, create_fn in tables.items():
        if not inspector.has_table(table_name):
            create_fn()


def downgrade():
    op.drop_table('portal_queue')
    op.drop_table('portal_logs')
    op.drop_table('portal_publications')
    op.drop_table('portals')
    op.drop_table('users')
