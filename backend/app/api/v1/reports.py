from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report, ReportType
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.birth_profile import BirthProfile
from app.core.gemini import generate_report, generate_pair_report
from app.core.config import settings

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
    promo_code: str | None = None
    use_star: bool = False


class CouponValidateRequest(BaseModel):
    code: str


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


def is_valid_promo(code: str | None) -> bool:
    """프로모 코드 유효성 검사"""
    if not code:
        return False
    return code.strip() == settings.PROMO_CODE


# ── 라우트 ────────────────────────────────────────────────

@router.get("/")
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.created_at.desc()).all()
    return [format_report(r, db) for r in reports]


# 테스트용 - 로그인 없이 리포트 조회
@router.get("/test-list")
def test_list_reports(db: Session = Depends(get_db)):
    """테스트용 - 로그인 없이 리포트 목록 조회"""
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(10).all()
    return [{"id": r.id, "report_type": r.report_type.value, "content": r.content, "created_at": str(r.created_at)} for r in reports]


# 쿠폰 코드 검증
@router.post("/validate-coupon")
def validate_coupon(body: CouponValidateRequest):
    """프로모 코드 유효성 검사"""
    if is_valid_promo(body.code):
        return {"valid": True}
    return {"valid": False}


@router.post("/preview")
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

    try:
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
            lacking_element=profile.lacking_element,
            chart_strength=profile.chart_strength,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

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


@router.post("/full")
async def create_full_report(
    body: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """유료 전체 리포트 생성 (프로모 코드 적용 시 무료)"""
    profile = db.query(BirthProfile).filter(
        BirthProfile.id == body.birth_profile_id,
        BirthProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    try:
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
            lacking_element=profile.lacking_element,
            chart_strength=profile.chart_strength,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    # 스타 사용
    if body.use_star:
        if (current_user.stars or 0) < 1:
            raise HTTPException(status_code=400, detail="Not enough stars")
        star_payment = Payment(
            user_id=current_user.id,
            amount=99,
            currency="USD",
            payment_method=PaymentMethod.star,
            status=PaymentStatus.paid,
        )
        db.add(star_payment)
        db.flush()
        current_user.stars -= 1
        report = Report(
            user_id=current_user.id,
            birth_profile_id=profile.id,
            report_type=body.report_type,
            content=content,
            price=body.price,
            payment_id=star_payment.id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return format_report(report, db)

    # 프로모 코드 유효하면 무료
    final_price = 0.00 if is_valid_promo(body.promo_code) else body.price

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content=content,
        price=final_price,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return format_report(report, db)


PAIR_TYPES = {"crush", "ex", "situationship", "love"}


class PairReportCreateRequest(BaseModel):
    birth_profile_id: int
    report_type: ReportType
    price: float = 0.99
    promo_code: str | None = None
    use_star: bool = False
    partner_name: str | None = None
    partner_birth_date: str | None = None
    partner_birth_time: str | None = None
    partner_birth_place: str | None = None
    partner_gender: str | None = None
    partner_sun_sign: str | None = None
    partner_moon_sign: str | None = None
    partner_rising_sign: str | None = None
    partner_venus_sign: str | None = None
    partner_year_pillar: str | None = None
    partner_month_pillar: str | None = None
    partner_day_pillar: str | None = None
    partner_hour_pillar: str | None = None
    partner_day_master: str | None = None
    partner_dominant_element: str | None = None
    partner_lacking_element: str | None = None
    partner_chart_strength: str | None = None


@router.post("/pair/preview")
async def create_pair_preview(
    body: PairReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """2인 리딩 무료 미리보기 (crush / situationship / ex / love)"""
    if body.report_type.value not in PAIR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{body.report_type.value}' is not a pair reading type.",
        )

    profile = db.query(BirthProfile).filter(
        BirthProfile.id == body.birth_profile_id,
        BirthProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    try:
        content = await generate_pair_report(
            report_type=body.report_type.value,
            user_name=current_user.name,
            birth_date=str(profile.birth_date),
            birth_time=str(profile.birth_time) if profile.birth_time else None,
            birth_place=profile.birth_place,
            gender=profile.gender.value if profile.gender else None,
            sun_sign=profile.sun_sign,
            moon_sign=profile.moon_sign,
            rising_sign=profile.rising_sign,
            mc_sign=profile.mc_sign,
            venus_sign=None,
            year_pillar=profile.year_pillar,
            month_pillar=profile.month_pillar,
            day_pillar=profile.day_pillar,
            hour_pillar=profile.hour_pillar,
            day_master=profile.day_master,
            dominant_element=profile.dominant_element,
            lacking_element=profile.lacking_element,
            chart_strength=profile.chart_strength,
            partner_name=body.partner_name,
            partner_birth_date=body.partner_birth_date,
            partner_birth_time=body.partner_birth_time,
            partner_birth_place=body.partner_birth_place,
            partner_gender=body.partner_gender,
            partner_sun_sign=body.partner_sun_sign,
            partner_moon_sign=body.partner_moon_sign,
            partner_rising_sign=body.partner_rising_sign,
            partner_venus_sign=body.partner_venus_sign,
            partner_year_pillar=body.partner_year_pillar,
            partner_month_pillar=body.partner_month_pillar,
            partner_day_pillar=body.partner_day_pillar,
            partner_hour_pillar=body.partner_hour_pillar,
            partner_day_master=body.partner_day_master,
            partner_dominant_element=body.partner_dominant_element,
            partner_lacking_element=body.partner_lacking_element,
            partner_chart_strength=body.partner_chart_strength,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    # 스타 사용
    if body.use_star:
        if (current_user.stars or 0) < 1:
            raise HTTPException(status_code=400, detail="Not enough stars")
        star_payment = Payment(
            user_id=current_user.id,
            amount=99,
            currency="USD",
            payment_method=PaymentMethod.star,
            status=PaymentStatus.paid,
        )
        db.add(star_payment)
        db.flush()
        current_user.stars -= 1
        report = Report(
            user_id=current_user.id,
            birth_profile_id=profile.id,
            report_type=body.report_type,
            content=content,
            price=body.price,
            payment_id=star_payment.id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return format_report(report, db)

    # 프로모 코드 유효하면 무료
    final_price = 0.00 if is_valid_promo(body.promo_code) else body.price

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content=content,
        price=final_price,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return format_report(report, db)


@router.get("/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_report_or_404(report_id, current_user.id, db)
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