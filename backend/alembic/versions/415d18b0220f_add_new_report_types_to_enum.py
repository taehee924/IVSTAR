"""add_new_report_types_to_enum

Revision ID: 415d18b0220f
Revises: c7fddaaf4915
Create Date: 2026-05-13 19:48:52.152140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '415d18b0220f'
down_revision: Union[str, Sequence[str], None] = 'c7fddaaf4915'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new report type enum values to PostgreSQL enum."""
    # PostgreSQL requires ALTER TYPE ... ADD VALUE for each new enum value
    new_values = ["life_cycle", "year_ahead", "daily", "crush", "ex", "situationship"]
    for value in new_values:
        op.execute(f"ALTER TYPE reporttype ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    """PostgreSQL does not support removing enum values directly.
    To downgrade, the enum must be recreated without the added values.
    This migration is intentionally left as a no-op for safety.
    """
    pass
