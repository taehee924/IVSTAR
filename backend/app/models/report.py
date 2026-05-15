import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ReportType(str, enum.Enum):
    general = "general"
    life_cycle = "life_cycle"
    year_ahead = "year_ahead"
    daily = "daily"
    love = "love"
    crush = "crush"
    ex = "ex"
    situationship = "situationship"
    career = "career"
    wealth = "wealth"
    health = "health"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    birth_profile_id = Column(Integer, ForeignKey("birth_profiles.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)  # 결제 연결 (무료 리포트는 null)

    report_type = Column(Enum(ReportType), nullable=False)
    content = Column(Text, nullable=False)  # AI 생성 결과 텍스트

    # 리포트 가격 (무료 미리보기는 0.00, 유료는 실제 금액)
    price = Column(Numeric(10, 2), nullable=False, default=0.00)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    user = relationship("User", back_populates="reports")
    birth_profile = relationship("BirthProfile", back_populates="reports")
    payment = relationship("Payment", back_populates="report")