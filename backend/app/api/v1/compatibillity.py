from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.compatibility import Compatibility
from app.models.birth_profile import BirthProfile

router = APIRouter(prefix="/compatibility", tags=["compatibility"])


# 응답 스키마
class CompatibilityResponse(BaseModel):
    id: int
    user_id: int
    profile_1_id: int
    profile_2_id: int
    result: str
    created_at: str

    class Config:
        from_attributes = True


# 생성 요청 스키마
class CompatibilityCreateRequest(BaseModel):
    profile_1_id: int
    profile_2_id: int


def format_compatibility(c: Compatibility) -> dict:
    return {
        "id": c.id,
        "user_id": c.user_id,
        "profile_1_id": c.profile_1_id,
        "profile_2_id": c.profile_2_id,
        "result": c.result,
        "created_at": str(c.created_at),
    }


def validate_profile(profile_id: int, user_id: int, db: Session) -> BirthProfile:
    """출생 정보 조회 + 본인 소유 확인"""
    profile = db.query(BirthProfile).filter(
        BirthProfile.id == profile_id,
        BirthProfile.user_id == user_id,
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Birth profile {profile_id} not found",
        )
    return profile


@router.get("/", response_model=list[CompatibilityResponse])
def get_my_compatibilities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """내 궁합 결과 목록 조회"""
    results = db.query(Compatibility).filter(
        Compatibility.user_id == current_user.id
    ).order_by(Compatibility.created_at.desc()).all()
    return [format_compatibility(c) for c in results]


@router.get("/{compatibility_id}", response_model=CompatibilityResponse)
def get_compatibility(
    compatibility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """궁합 결과 단건 조회"""
    result = db.query(Compatibility).filter(
        Compatibility.id == compatibility_id,
        Compatibility.user_id == current_user.id,
    ).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compatibility result not found",
        )
    return format_compatibility(result)


@router.post("/", response_model=CompatibilityResponse, status_code=status.HTTP_201_CREATED)
def create_compatibility(
    body: CompatibilityCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    궁합 분석 생성.
    - 두 출생 정보 모두 본인 소유 확인
    - 같은 프로필 두 개 선택 방지
    - TODO: Claude API 연동 후 실제 AI 결과로 교체
    """
    if body.profile_1_id == body.profile_2_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two different birth profiles are required",
        )

    profile_1 = validate_profile(body.profile_1_id, current_user.id, db)
    profile_2 = validate_profile(body.profile_2_id, current_user.id, db)

    # TODO: Claude API 연동 후 실제 AI 결과로 교체
    result_text = (
        f"[Compatibility] {profile_1.birth_date} x {profile_2.birth_date}"
    )

    compatibility = Compatibility(
        user_id=current_user.id,
        profile_1_id=profile_1.id,
        profile_2_id=profile_2.id,
        result=result_text,
    )
    db.add(compatibility)
    db.commit()
    db.refresh(compatibility)
    return format_compatibility(compatibility)


@router.delete("/{compatibility_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compatibility(
    compatibility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """궁합 결과 삭제"""
    result = db.query(Compatibility).filter(
        Compatibility.id == compatibility_id,
        Compatibility.user_id == current_user.id,
    ).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compatibility result not found",
        )
    db.delete(result)
    db.commit()