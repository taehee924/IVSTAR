"""add daily_free to reporttype enum

Revision ID: c3a1d0e9f2b4
Revises: b5c4d3e2f1a0
Create Date: 2026-09-15

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c3a1d0e9f2b4"
down_revision: Union[str, Sequence[str], None] = "b5c4d3e2f1a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE reporttype ADD VALUE IF NOT EXISTS 'daily_free'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly. No-op for safety.
    pass
