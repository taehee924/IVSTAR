"""add daily email opt-in fields to users

Revision ID: d4b2e1f8a6c7
Revises: c3a1d0e9f2b4
Create Date: 2026-09-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "d4b2e1f8a6c7"
down_revision: Union[str, Sequence[str], None] = "c3a1d0e9f2b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("daily_email_opt_in", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("daily_email_opt_in_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("unsubscribe_token", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_users_unsubscribe_token"), "users", ["unsubscribe_token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_unsubscribe_token"), table_name="users")
    op.drop_column("users", "unsubscribe_token")
    op.drop_column("users", "daily_email_opt_in_at")
    op.drop_column("users", "daily_email_opt_in")
