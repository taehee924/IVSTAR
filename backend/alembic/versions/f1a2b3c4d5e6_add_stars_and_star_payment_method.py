"""add_stars_and_star_payment_method

Revision ID: f1a2b3c4d5e6
Revises: bba924e9e8a4
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '415d18b0220f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users: stars 컬럼 추가
    op.add_column(
        "users",
        sa.Column("stars", sa.Integer(), nullable=False, server_default="0"),
    )

    # payments: paymentmethod enum에 'star' 추가
    op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50)")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('card', 'paypal', 'star')")
    op.execute("""
        ALTER TABLE payments
        ALTER COLUMN payment_method TYPE paymentmethod
        USING payment_method::paymentmethod
    """)


def downgrade() -> None:
    op.drop_column("users", "stars")

    op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50)")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('card', 'paypal')")
    op.execute("""
        ALTER TABLE payments
        ALTER COLUMN payment_method TYPE paymentmethod
        USING payment_method::paymentmethod
    """)
