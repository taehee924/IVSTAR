"""add venus_sign and mars_sign to birth_profiles

Revision ID: b5c4d3e2f1a0
Revises: 9c8d7e6f5a4b
Create Date: 2026-07-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5c4d3e2f1a0'
down_revision: Union[str, Sequence[str], None] = '9c8d7e6f5a4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("birth_profiles", sa.Column("venus_sign", sa.String(length=50), nullable=True))
    op.add_column("birth_profiles", sa.Column("mars_sign", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("birth_profiles", "mars_sign")
    op.drop_column("birth_profiles", "venus_sign")
