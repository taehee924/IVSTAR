from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_jwt
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post("/me")
def login_or_create_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Auth.js Google 로그인 완료 후 호출.
    - JWT 검증
    - DB에 유저 없으면 자동 생성 (최초 로그인)
    - is_new_user: True면 프론트에서 온보딩으로 redirect
    """
    token = credentials.credentials
    print(f"=== AUTH ME CALLED ===")
    print(f"Token: {token[:50]}...")
    payload = decode_jwt(token)
    print(f"Payload: {payload}")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email: str | None = payload.get("email")
    name: str | None = payload.get("name")
    picture: str | None = payload.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token missing email",
        )

    # 유저 조회
    user = db.query(User).filter(User.email == email).first()

    # 최초 로그인 시 자동 생성
    is_new_user = False
    if user is None:
        is_new_user = True
        user = User(
            email=email,
            name=name,
            profile_image=picture,
            stars=1,  # 신규 회원 웰컴 스타 (리포트 1회 무료 열람)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "profile_image": user.profile_image,
        "role": user.role.value,
        "created_at": str(user.created_at),
        "is_new_user": is_new_user,  # True면 프론트에서 온보딩으로 redirect
    }