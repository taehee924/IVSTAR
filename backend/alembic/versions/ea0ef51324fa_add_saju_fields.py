"""add_saju_fields

Revision ID: ea0ef51324fa
Revises: 6fa2422cb8e0
Create Date: 2026-05-03 14:22:54.305370
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "ea0ef51324fa"
down_revision: Union[str, Sequence[str], None] = "6fa2422cb8e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 서양 점성술 MC 추가
    op.add_column("birth_profiles", sa.Column("mc_sign", sa.String(50), nullable=True))

    # 사주 컬럼 추가
    op.add_column("birth_profiles", sa.Column("year_pillar", sa.String(10), nullable=True))
    op.add_column("birth_profiles", sa.Column("month_pillar", sa.String(10), nullable=True))
    op.add_column("birth_profiles", sa.Column("day_pillar", sa.String(10), nullable=True))
    op.add_column("birth_profiles", sa.Column("hour_pillar", sa.String(10), nullable=True))
    op.add_column("birth_profiles", sa.Column("day_master", sa.String(10), nullable=True))
    op.add_column("birth_profiles", sa.Column("dominant_element", sa.String(20), nullable=True))
    op.add_column("birth_profiles", sa.Column("chart_strength", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("birth_profiles", "chart_strength")
    op.drop_column("birth_profiles", "dominant_element")
    op.drop_column("birth_profiles", "day_master")
    op.drop_column("birth_profiles", "hour_pillar")
    op.drop_column("birth_profiles", "day_pillar")
    op.drop_column("birth_profiles", "month_pillar")
    op.drop_column("birth_profiles", "year_pillar")
    op.drop_column("birth_profiles", "mc_sign")