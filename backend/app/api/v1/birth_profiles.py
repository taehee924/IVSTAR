from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, time
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.birth_profile import BirthProfile, Gender
from app.core.astrology import calculate_chart

router = APIRouter(prefix="/birth-profiles", tags=["birth-profiles"])

tf = TimezoneFinder()
geolocator = Nominatim(user_agent="sajuju-app")


def get_location_info(place: str) -> dict:
    """도시명 → 위도/경도/타임존 반환"""
    try:
        location = geolocator.geocode(place)
        if location:
            tz = tf.timezone_at(lat=location.latitude, lng=location.longitude)
            return {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "timezone": tz,
            }
    except Exception:
        pass
    return {"latitude": None, "longitude": None, "timezone": None}


# ── 스키마 ────────────────────────────────────────────────

class BirthProfileResponse(BaseModel):
    id: int
    user_id: int
    birth_date: date
    birth_time: time | None
    birth_place: str | None
    birth_timezone: str | None
    latitude: float | None
    longitude: float | None
    sun_sign: str | None
    moon_sign: str | None
    rising_sign: str | None
    mc_sign: str | None
    year_pillar: str | None
    month_pillar: str | None
    day_pillar: str | None
    hour_pillar: str | None
    day_master: str | None
    dominant_element: str | None
    chart_strength: str | None
    gender: str | None
    created_at: str

    class Config:
        from_attributes = True


class BirthProfileCreateRequest(BaseModel):
    birth_date: date
    birth_time: time | None = None
    birth_place: str | None = None
    gender: Gender | None = None
    # 사주 (프론트에서 계산 후 전송)
    year_pillar: str | None = None
    month_pillar: str | None = None
    day_pillar: str | None = None
    hour_pillar: str | None = None
    day_master: str | None = None
    dominant_element: str | None = None
    chart_strength: str | None = None


class BirthProfileUpdateRequest(BaseModel):
    birth_date: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    gender: Gender | None = None
    year_pillar: str | None = None
    month_pillar: str | None = None
    day_pillar: str | None = None
    hour_pillar: str | None = None
    day_master: str | None = None
    dominant_element: str | None = None
    chart_strength: str | None = None


# ── 헬퍼 ──────────────────────────────────────────────────

def get_profile_or_404(profile_id: int, user_id: int, db: Session) -> BirthProfile:
    profile = db.query(BirthProfile).filter(
        BirthProfile.id == profile_id,
        BirthProfile.user_id == user_id,
    ).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found")
    return profile


def format_profile(p: BirthProfile) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "birth_date": p.birth_date,
        "birth_time": p.birth_time,
        "birth_place": p.birth_place,
        "birth_timezone": p.birth_timezone,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "sun_sign": p.sun_sign,
        "moon_sign": p.moon_sign,
        "rising_sign": p.rising_sign,
        "mc_sign": p.mc_sign,
        "year_pillar": p.year_pillar,
        "month_pillar": p.month_pillar,
        "day_pillar": p.day_pillar,
        "hour_pillar": p.hour_pillar,
        "day_master": p.day_master,
        "dominant_element": p.dominant_element,
        "chart_strength": p.chart_strength,
        "gender": p.gender.value if p.gender else None,
        "created_at": str(p.created_at),
    }


def compute_astrology(profile: BirthProfile) -> None:
    """천체 계산 후 프로필에 저장"""
    if not profile.latitude or not profile.longitude:
        return
    try:
        chart = calculate_chart(
            birth_date=profile.birth_date,
            birth_time=profile.birth_time,
            birth_timezone=profile.birth_timezone,
            latitude=profile.latitude,
            longitude=profile.longitude,
        )
        profile.sun_sign = chart["sun_sign"]
        profile.moon_sign = chart["moon_sign"]
        profile.rising_sign = chart["rising_sign"]
        profile.mc_sign = chart.get("mc_sign")
    except Exception as e:
        print(f"Astrology calculation error: {e}")


# ── 라우트 ────────────────────────────────────────────────

@router.get("/", response_model=list[BirthProfileResponse])
def get_my_birth_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profiles = db.query(BirthProfile).filter(
        BirthProfile.user_id == current_user.id
    ).all()
    return [format_profile(p) for p in profiles]


@router.post("/", response_model=BirthProfileResponse, status_code=status.HTTP_201_CREATED)
def create_birth_profile(
    body: BirthProfileCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """출생 정보 생성 - 위도/경도/타임존/천체 자동 계산 + 사주 저장"""
    location_info = {"latitude": None, "longitude": None, "timezone": None}
    if body.birth_place:
        location_info = get_location_info(body.birth_place)

    profile = BirthProfile(
        user_id=current_user.id,
        birth_date=body.birth_date,
        birth_time=body.birth_time,
        birth_place=body.birth_place,
        birth_timezone=location_info["timezone"],
        latitude=location_info["latitude"],
        longitude=location_info["longitude"],
        gender=body.gender,
        year_pillar=body.year_pillar,
        month_pillar=body.month_pillar,
        day_pillar=body.day_pillar,
        hour_pillar=body.hour_pillar,
        day_master=body.day_master,
        dominant_element=body.dominant_element,
        chart_strength=body.chart_strength,
    )

    # 점성술 계산
    compute_astrology(profile)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return format_profile(profile)


@router.get("/{profile_id}", response_model=BirthProfileResponse)
def get_birth_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_or_404(profile_id, current_user.id, db)
    return format_profile(profile)


@router.patch("/{profile_id}", response_model=BirthProfileResponse)
def update_birth_profile(
    profile_id: int,
    body: BirthProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_or_404(profile_id, current_user.id, db)

    if body.birth_date is not None:
        profile.birth_date = body.birth_date
    if body.birth_time is not None:
        profile.birth_time = body.birth_time
    if body.birth_place is not None:
        profile.birth_place = body.birth_place
        location_info = get_location_info(body.birth_place)
        profile.birth_timezone = location_info["timezone"]
        profile.latitude = location_info["latitude"]
        profile.longitude = location_info["longitude"]
    if body.gender is not None:
        profile.gender = body.gender
    if body.year_pillar is not None:
        profile.year_pillar = body.year_pillar
    if body.month_pillar is not None:
        profile.month_pillar = body.month_pillar
    if body.day_pillar is not None:
        profile.day_pillar = body.day_pillar
    if body.hour_pillar is not None:
        profile.hour_pillar = body.hour_pillar
    if body.day_master is not None:
        profile.day_master = body.day_master
    if body.dominant_element is not None:
        profile.dominant_element = body.dominant_element
    if body.chart_strength is not None:
        profile.chart_strength = body.chart_strength

    # 점성술 재계산
    compute_astrology(profile)

    db.commit()
    db.refresh(profile)
    return format_profile(profile)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_birth_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_or_404(profile_id, current_user.id, db)
    db.delete(profile)
    db.commit()