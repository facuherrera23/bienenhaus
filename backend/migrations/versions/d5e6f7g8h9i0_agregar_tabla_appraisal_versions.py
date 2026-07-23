"""agregar tabla appraisal_versions para snapshots históricos

Revision ID: d5e6f7g8h9i0
Revises: c4d5e6f7g8h9
Create Date: 2026-06-09 10:00:00.000000
"""
import sqlalchemy as sa
from alembic import op


revision = 'd5e6f7g8h9i0'
down_revision = 'c4d5e6f7g8h9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('appraisal_versions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('appraisal_id', sa.Integer(), sa.ForeignKey('appraisals.id'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('snapshot_json', sa.Text(), nullable=False),
        sa.Column('pdf_path', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
    )
    op.create_index('ix_appraisal_versions_appraisal', 'appraisal_versions', ['appraisal_id'])


def downgrade():
    op.drop_index('ix_appraisal_versions_appraisal', 'appraisal_versions')
    op.drop_table('appraisal_versions')
