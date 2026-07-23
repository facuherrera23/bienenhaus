"""agregar dormitorios garage a comparable, crear empresa

Revision ID: 1c9e5ff9380b
Revises: 8f7e6d5c4b3a
Create Date: 2026-06-02 23:36:00.543879

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c9e5ff9380b'
down_revision = '8f7e6d5c4b3a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('comparables', schema=None) as batch_op:
        batch_op.add_column(sa.Column('dormitorios', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('banios', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('tiene_garage', sa.Boolean(), nullable=True))
        batch_op.drop_column('comp_comercializacion')
        batch_op.drop_column('comp_estado_construccion')


def downgrade():
    with op.batch_alter_table('comparables', schema=None) as batch_op:
        batch_op.add_column(sa.Column('comp_estado_construccion', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('comp_comercializacion', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
        batch_op.drop_column('tiene_garage')
        batch_op.drop_column('banios')
        batch_op.drop_column('dormitorios')
