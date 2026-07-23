"""agregar DLQ y locking a portal_queue: status, retry_count, last_error_at, next_retry_at

Revision ID: 3f4a5b6c7d8e
Revises: 1927e0169cf8
Create Date: 2026-06-11 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '3f4a5b6c7d8e'
down_revision = '1927e0169cf8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('portal_queue', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=20),
                                      nullable=False, server_default='pending'))
        batch_op.add_column(sa.Column('retry_count', sa.Integer(),
                                      nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('last_error_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('next_retry_at', sa.DateTime(), nullable=True))
        batch_op.create_index('ix_portal_queue_status', ['status'], unique=False)
        batch_op.create_index('ix_portal_queue_retry', ['status', 'next_retry_at'], unique=False)

    # Sincronizar status desde processed para datos existentes
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE portal_queue SET status = 'completed' WHERE processed = TRUE AND error = ''"
        )
    )
    conn.execute(
        sa.text(
            "UPDATE portal_queue SET status = 'failed' WHERE processed = TRUE AND error != ''"
        )
    )
    conn.execute(
        sa.text(
            "UPDATE portal_queue SET status = 'pending' WHERE processed = FALSE"
        )
    )


def downgrade():
    with op.batch_alter_table('portal_queue', schema=None) as batch_op:
        batch_op.drop_index('ix_portal_queue_retry')
        batch_op.drop_index('ix_portal_queue_status')
        batch_op.drop_column('next_retry_at')
        batch_op.drop_column('last_error_at')
        batch_op.drop_column('retry_count')
        batch_op.drop_column('status')
