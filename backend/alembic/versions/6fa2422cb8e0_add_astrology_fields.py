"""add_astrology_fields

Revision ID: 6fa2422cb8e0
Revises: 40d25091f3dc
Create Date: 2026-05-02
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "6fa2422cb8e0"
down_revision: Union[str, Sequence[str], None] = "40d25091f3dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("birth_profiles", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("birth_profiles", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("birth_profiles", sa.Column("sun_sign", sa.String(50), nullable=True))
    op.add_column("birth_profiles", sa.Column("moon_sign", sa.String(50), nullable=True))
    op.add_column("birth_profiles", sa.Column("rising_sign", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("birth_profiles", "rising_sign")
    op.drop_column("birth_profiles", "moon_sign")
    op.drop_column("birth_profiles", "sun_sign")
    op.drop_column("birth_profiles", "longitude")
    op.drop_column("birth_profiles", "latitude")