#GET /api/v1/users/me - 내 프로필 조회
#PATCH /api/v1/users/me - 내 프로필 수정
#DELETE /api/v1/users/me - 회원 탈퇴

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

    class Config:
        from_attributes = True


# 수정 요청 스키마
class UserUpdateRequest(BaseModel):
    name: str | None = None
    profile_image: str | None = None


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """내 프로필 조회"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "profile_image": current_user.profile_image,
        "role": current_user.role.value,
        "stars": current_user.stars,
        "created_at": str(current_user.created_at),
    }


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

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "profile_image": current_user.profile_image,
        "role": current_user.role.value,
        "stars": current_user.stars,
        "created_at": str(current_user.created_at),
    }


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