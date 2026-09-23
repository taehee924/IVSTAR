import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    profile_image = Column(String(500), nullable=True)  # Google 프로필 이미지 URL

    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    stars = Column(Integer, default=0, nullable=False, server_default="0")

    # 데일리 리딩 이메일 수신 동의.
    # NULL = 아직 안 물어봄(팝업 대상), True = 동의, False = 거절/구독취소
    daily_email_opt_in = Column(Boolean, nullable=True)
    daily_email_opt_in_at = Column(DateTime(timezone=True), nullable=True)
    # 원클릭 구독취소 링크용 토큰 (동의 시 발급)
    unsubscribe_token = Column(String(64), nullable=True, unique=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # relationships
    birth_profiles = relationship("BirthProfile", back_populates="user")
    reports = relationship("Report", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    compatibilities = relationship("Compatibility", back_populates="user")