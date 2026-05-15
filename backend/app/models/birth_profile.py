import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Time, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class BirthProfile(Base):
    __tablename__ = "birth_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    birth_date = Column(Date, nullable=False)
    birth_time = Column(Time, nullable=True)
    birth_place = Column(String(255), nullable=True)
    birth_timezone = Column(String(100), nullable=True)

    # 위도/경도 (천체 계산용)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # 서양 점성술
    sun_sign = Column(String(50), nullable=True)
    moon_sign = Column(String(50), nullable=True)
    rising_sign = Column(String(50), nullable=True)
    mc_sign = Column(String(50), nullable=True)

    # 사주 (프론트에서 계산 후 전송)
    year_pillar = Column(String(10), nullable=True)   # 년주 (ex. 임신)
    month_pillar = Column(String(10), nullable=True)  # 월주
    day_pillar = Column(String(10), nullable=True)    # 일주
    hour_pillar = Column(String(10), nullable=True)   # 시주
    day_master = Column(String(10), nullable=True)    # 일간 (ex. 갑, 을)
    dominant_element = Column(String(20), nullable=True)  # 강한 오행
    lacking_element = Column(String(20), nullable=True)   # 약한 오행
    chart_strength = Column(String(20), nullable=True)    # Strong/Balanced/Scattered

    gender = Column(Enum(Gender), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    user = relationship("User", back_populates="birth_profiles")
    reports = relationship("Report", back_populates="birth_profile", cascade="all, delete-orphan")
    compatibilities_as_first = relationship(
        "Compatibility", foreign_keys="Compatibility.profile_1_id", back_populates="profile_1"
    )
    compatibilities_as_second = relationship(
        "Compatibility", foreign_keys="Compatibility.profile_2_id", back_populates="profile_2"
    )