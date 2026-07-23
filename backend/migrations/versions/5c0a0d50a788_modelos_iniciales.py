"""modelos iniciales
Revision ID: 5c0a0d50a788
Revises: 
Create Date: 2026-05-22 14:26:26.663042
"""
from alembic import op
import sqlalchemy as sa


revision = '5c0a0d50a788'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('beds', sa.Integer(), nullable=True),
        sa.Column('baths', sa.Integer(), nullable=True),
        sa.Column('sqm', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('featured', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('views', sa.Integer(), nullable=True),
        sa.Column('images_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('daily_views_json', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('last', sa.String(length=100), nullable=False),
        sa.Column('years', sa.Integer(), nullable=True),
        sa.Column('specialty', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('whatsapp', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('avatar', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings',
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    op.create_table('contact_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=True),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=100), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('rentals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('price_ars', sa.Float(), nullable=False),
        sa.Column('expenses', sa.Float(), nullable=True),
        sa.Column('beds', sa.Integer(), nullable=True),
        sa.Column('baths', sa.Integer(), nullable=True),
        sa.Column('sqm', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('featured', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('views', sa.Integer(), nullable=True),
        sa.Column('images_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('daily_views_json', sa.Text(), nullable=True),
        sa.Column('min_months', sa.Integer(), nullable=True),
        sa.Column('furnished', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('rentals')
    op.drop_table('contact_messages')
    op.drop_table('settings')
    op.drop_table('agents')
    op.drop_table('properties')
