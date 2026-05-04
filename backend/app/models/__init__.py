# 모든 모델을 한 번에 import
# SQLAlchemy가 테이블을 인식하게 함
# import 순서 중요: 참조 순서대로 (User → BirthProfile → Payment → Report → Compatibility)

from app.core.database import Base  

from .user import User
from .birth_profile import BirthProfile
from .payment import Payment
from .report import Report
from .compatibility import Compatibility