"""merge video_url and social_accounts heads

Revision ID: a9b8c7d6e5f4
Revises: fd645c159dc5, 1629a0c320e3
Create Date: 2026-06-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9b8c7d6e5f4'
down_revision = ('fd645c159dc5', '1629a0c320e3')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
