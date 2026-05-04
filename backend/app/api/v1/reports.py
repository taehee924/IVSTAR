from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report, ReportType
from app.models.payment import Payment, PaymentStatus
from app.models.birth_profile import BirthProfile
from app.core.gemini import generate_report

router = APIRouter(prefix="/reports", tags=["reports"])


# ── 스키마 ────────────────────────────────────────────────

class ReportResponse(BaseModel):
    id: int
    user_id: int
    birth_profile_id: int
    payment_id: int | None
    report_type: str
    content: str
    is_unlocked: bool
    price: float
    created_at: str

    class Config:
        from_attributes = True


class ReportCreateRequest(BaseModel):
    birth_profile_id: int
    report_type: ReportType
    price: float = 0.99


# ── 헬퍼 ──────────────────────────────────────────────────

def get_report_or_404(report_id: int, user_id: int, db: Session) -> Report:
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == user_id,
    ).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


def is_report_unlocked(report: Report, db: Session) -> bool:
    if report.payment_id is None:
        return False
    payment = db.query(Payment).filter(
        Payment.id == report.payment_id,
        Payment.status == PaymentStatus.paid,
    ).first()
    return payment is not None


def format_report(report: Report, db: Session) -> dict:
    unlocked = is_report_unlocked(report, db)
    is_free = report.price == 0
    content = report.content if (is_free or unlocked) else ""

    return {
        "id": report.id,
        "user_id": report.user_id,
        "birth_profile_id": report.birth_profile_id,
        "payment_id": report.payment_id,
        "report_type": report.report_type.value,
        "content": content,
        "is_unlocked": unlocked or is_free,
        "price": float(report.price),
        "created_at": str(report.created_at),
    }


# ── 라우트 ────────────────────────────────────────────────

@router.get("/", response_model=list[ReportResponse])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.created_at.desc()).all()
    return [format_report(r, db) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_report_or_404(report_id, current_user.id, db)
    return format_report(report, db)


@router.post("/preview", response_model=ReportResponse)
async def create_free_preview(
    body: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """무료 미리보기 리포트 생성 (price=0)"""
    profile = db.query(BirthProfile).filter(
        BirthProfile.id == body.birth_profile_id,
        BirthProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    # Gemini API 호출
    content = await generate_report(
        report_type=body.report_type.value,
        birth_date=str(profile.birth_date),
        birth_time=str(profile.birth_time) if profile.birth_time else None,
        birth_place=profile.birth_place,
        gender=profile.gender.value if profile.gender else None,
        sun_sign=profile.sun_sign,
        moon_sign=profile.moon_sign,
        rising_sign=profile.rising_sign,
        mc_sign=profile.mc_sign,
        year_pillar=profile.year_pillar,
        month_pillar=profile.month_pillar,
        day_pillar=profile.day_pillar,
        hour_pillar=profile.hour_pillar,
        day_master=profile.day_master,
        dominant_element=profile.dominant_element,
        chart_strength=profile.chart_strength,
)

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content=content,
        price=0.00,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return format_report(report, db)


@router.post("/full", response_model=ReportResponse)
async def create_full_report(
    body: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """유료 전체 리포트 생성"""
    profile = db.query(BirthProfile).filter(
        BirthProfile.id == body.birth_profile_id,
        BirthProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    # Gemini API 호출
    content = await generate_report(
        report_type=body.report_type.value,
        birth_date=str(profile.birth_date),
        birth_time=str(profile.birth_time) if profile.birth_time else None,
        birth_place=profile.birth_place,
        gender=profile.gender.value if profile.gender else None,
        sun_sign=profile.sun_sign,
        moon_sign=profile.moon_sign,
        rising_sign=profile.rising_sign,
        mc_sign=profile.mc_sign,
        year_pillar=profile.year_pillar,
        month_pillar=profile.month_pillar,
        day_pillar=profile.day_pillar,
        hour_pillar=profile.hour_pillar,
        day_master=profile.day_master,
        dominant_element=profile.dominant_element,
        chart_strength=profile.chart_strength,
    )

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content=content,
        price=body.price,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return format_report(report, db)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_report_or_404(report_id, current_user.id, db)
    db.delete(report)
    db.commit()