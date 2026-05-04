"""add_birth_timezone

Revision ID: 40d25091f3dc
Revises: bba924e9e8a4
Create Date: 2026-05-02 12:45:50.579382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '40d25091f3dc'
down_revision: Union[str, Sequence[str], None] = 'bba924e9e8a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('birth_profiles', sa.Column('birth_timezone', sa.String(100), nullable=True),)


def downgrade() -> None:
    op.drop_column('birth_profiles', 'birth_timezone')
