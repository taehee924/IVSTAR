"""add_paypal_fields

Revision ID: bba924e9e8a4
Revises: 0ca4bf583073
Create Date: 2026-04-09 17:40:47.732294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'bba924e9e8a4'
down_revision: Union[str, Sequence[str], None] = '0ca4bf583073'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # reports: price 추가
    op.add_column(
        "reports",
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
    )

    # payments: transaction_id 제거
    op.drop_constraint("payments_transaction_id_key", "payments", type_="unique")
    op.drop_column("payments", "transaction_id")

    # payments: paypal 컬럼 추가
    op.add_column(
        "payments",
        sa.Column("paypal_order_id", sa.String(255), nullable=True),
    )
    op.create_unique_constraint("uq_payments_paypal_order_id", "payments", ["paypal_order_id"])
    op.add_column(
        "payments",
        sa.Column("paypal_capture_id", sa.String(255), nullable=True),
    )
    op.create_unique_constraint("uq_payments_paypal_capture_id", "payments", ["paypal_capture_id"])

    # payments: enum 교체 (kakao_pay, apple_pay 제거 → paypal 추가)
    op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50)")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('card', 'paypal')")
    op.execute("""
        ALTER TABLE payments
        ALTER COLUMN payment_method TYPE paymentmethod
        USING payment_method::paymentmethod
    """)


def downgrade() -> None:
    # paypal 컬럼 제거
    op.drop_constraint("uq_payments_paypal_capture_id", "payments", type_="unique")
    op.drop_column("payments", "paypal_capture_id")
    op.drop_constraint("uq_payments_paypal_order_id", "payments", type_="unique")
    op.drop_column("payments", "paypal_order_id")

    # transaction_id 복구
    op.add_column(
        "payments",
        sa.Column("transaction_id", sa.String(255), nullable=True),
    )
    op.create_unique_constraint("payments_transaction_id_key", "payments", ["transaction_id"])

    # reports: price 제거
    op.drop_column("reports", "price")

    # enum 롤백
    op.execute("ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50)")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('card', 'kakao_pay', 'apple_pay')")
    op.execute("""
        ALTER TABLE payments
        ALTER COLUMN payment_method TYPE paymentmethod
        USING payment_method::paymentmethod
    """)