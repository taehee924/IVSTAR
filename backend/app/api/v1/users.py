#GET /api/v1/users/me - 내 프로필 조회
#PATCH /api/v1/users/me - 내 프로필 수정
#DELETE /api/v1/users/me - 회원 탈퇴

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.compatibility import Compatibility
from app.models.report import Report
from app.models.payment import Payment
from app.models.birth_profile import BirthProfile

router = APIRouter(prefix="/users", tags=["users"])


# 응답 스키마
class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None
    profile_image: str | None
    role: str
    stars: int
    created_at: str
    daily_email_opt_in: bool | None = None

    class Config:
        from_attributes = True


# 수정 요청 스키마
class UserUpdateRequest(BaseModel):
    name: str | None = None
    profile_image: str | None = None


class DailyEmailPrefRequest(BaseModel):
    opt_in: bool


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "profile_image": user.profile_image,
        "role": user.role.value,
        "stars": user.stars,
        "created_at": str(user.created_at),
        "daily_email_opt_in": user.daily_email_opt_in,
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """내 프로필 조회"""
    return _user_dict(current_user)


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """내 프로필 수정 (이름, 프로필 이미지)"""
    if body.name is not None:
        current_user.name = body.name
    if body.profile_image is not None:
        current_user.profile_image = body.profile_image

    db.commit()
    db.refresh(current_user)

    return _user_dict(current_user)


@router.post("/me/daily-email", response_model=UserResponse)
def set_daily_email_pref(
    body: DailyEmailPrefRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """데일리 리딩 이메일 수신 동의/해제 (회원가입 팝업 및 대시보드 설정에서 호출)."""
    from datetime import datetime, timezone

    current_user.daily_email_opt_in = body.opt_in
    if body.opt_in:
        current_user.daily_email_opt_in_at = datetime.now(timezone.utc)
        if not current_user.unsubscribe_token:
            current_user.unsubscribe_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(current_user)
    return _user_dict(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """회원 탈퇴 — FK 순서에 맞춰 연관 데이터 전체 삭제"""
    uid = current_user.id
    # Compatibility → Report → Payment → BirthProfile → User 순으로 삭제
    db.query(Compatibility).filter(Compatibility.user_id == uid).delete()
    db.query(Report).filter(Report.user_id == uid).delete()
    db.query(Payment).filter(Payment.user_id == uid).delete()
    db.query(BirthProfile).filter(BirthProfile.user_id == uid).delete()
    db.delete(current_user)
    db.commit()