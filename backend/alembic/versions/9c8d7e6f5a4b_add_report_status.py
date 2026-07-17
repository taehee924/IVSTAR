"""add status column to reports

Revision ID: 9c8d7e6f5a4b
Revises: f1a2b3c4d5e6
Create Date: 2026-07-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c8d7e6f5a4b'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reports",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="ready"),
    )


def downgrade() -> None:
    op.drop_column("reports", "status")
