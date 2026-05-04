from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Compatibility(Base):
    __tablename__ = "compatibilities"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    profile_1_id = Column(Integer, ForeignKey("birth_profiles.id"), nullable=False)
    profile_2_id = Column(Integer, ForeignKey("birth_profiles.id"), nullable=False)

    result = Column(Text, nullable=False)  # AI 생성 궁합 결과

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    user = relationship("User", back_populates="compatibilities")
    profile_1 = relationship("BirthProfile", foreign_keys=[profile_1_id], back_populates="compatibilities_as_first")
    profile_2 = relationship("BirthProfile", foreign_keys=[profile_2_id], back_populates="compatibilities_as_second")