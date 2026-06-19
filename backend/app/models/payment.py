import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    card = "card"
    paypal = "paypal"
    star = "star"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    currency = Column(String(10), nullable=False, default="USD")
    amount = Column(Integer, nullable=False)          # cents 단위 (ex. $0.99 → 99)
    refunded_amount = Column(Integer, nullable=True)  # 환불 금액 (cents)

    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    payment_method = Column(Enum(PaymentMethod), nullable=True)

    paypal_order_id = Column(String(255), unique=True, nullable=True)   # 결제 생성 시
    paypal_capture_id = Column(String(255), unique=True, nullable=True) # 결제 완료 시

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    user = relationship("User", back_populates="payments")
    report = relationship("Report", back_populates="payment", uselist=False)  # 1:1