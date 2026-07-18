from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db, SessionLocal
from app.core.astrology import calculate_chart
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report, ReportType
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.birth_profile import BirthProfile
from app.core.claude import generate_report, generate_pair_report
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


REPORT_STAR_COST = {"daily": 2}
DEFAULT_REPORT_STAR_COST = 1


class ReportCreateRequest(BaseModel):
    birth_profile_id: int
    report_type: ReportType
    price: float = 0.99
    promo_code: str | None = None
    use_star: bool = False
    star_cost: int | None = None  # 프론트가 명시하지 않으면 서버에서 타입으로 계산


class CouponValidateRequest(BaseModel):
    code: str
    quantity: int = 1


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
        "status": report.status or "ready",
        "created_at": str(report.created_at),
    }


def is_valid_promo(code: str | None) -> bool:
    """프로모 코드 유효성 검사"""
    if not code:
        return False
    return code.strip() == settings.PROMO_CODE


def _profile_kwargs(profile: BirthProfile) -> dict:
    """generate_report / generate_pair_report에 공통으로 넘기는 프로필 필드"""
    return dict(
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


def _partner_chart(
    birth_date_str: str | None,
    birth_time_str: str | None,
    birth_place: str | None,
    sun_sign: str | None,
    moon_sign: str | None,
    rising_sign: str | None,
    venus_sign: str | None,
    mars_sign: str | None,
) -> dict:
    """파트너 서양 차트 계산.

    프론트가 보낸 값이 있으면 그대로 쓰고, 없으면 생년월일로 swisseph 계산해 채운다.
    (pair 페이지는 사주만 계산해서 보내므로 서양 별자리는 여기서 채워진다)
    """
    out = {
        "sun_sign": sun_sign,
        "moon_sign": moon_sign,
        "rising_sign": rising_sign,
        "venus_sign": venus_sign,
        "mars_sign": mars_sign,
    }
    if sun_sign or not birth_date_str:
        return out

    try:
        pdate = datetime.strptime(birth_date_str.strip()[:10], "%Y-%m-%d").date()
    except ValueError:
        return out

    ptime = None
    if birth_time_str:
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                ptime = datetime.strptime(birth_time_str.strip(), fmt).time()
                break
            except ValueError:
                continue

    lat = lng = tz = None
    if birth_place:
        from app.api.v1.birth_profiles import get_location_info
        loc = get_location_info(birth_place)
        lat, lng, tz = loc["latitude"], loc["longitude"], loc["timezone"]

    try:
        chart = calculate_chart(
            birth_date=pdate,
            birth_time=ptime,
            birth_timezone=tz,
            latitude=lat if lat is not None else 0.0,
            longitude=lng if lng is not None else 0.0,
        )
    except Exception as e:
        print(f"Partner chart calculation failed: {e}")
        return out

    out["sun_sign"] = chart["sun_sign"]
    out["moon_sign"] = moon_sign or chart["moon_sign"]
    # 좌표가 없으면 하우스 계산이 부정확하므로 rising은 채우지 않음
    out["rising_sign"] = rising_sign or (chart["rising_sign"] if lat is not None else None)
    out["venus_sign"] = venus_sign or chart["venus_sign"]
    out["mars_sign"] = mars_sign or chart["mars_sign"]
    return out


async def _run_generation(
    report_id: int,
    is_pair: bool,
    gen_kwargs: dict,
    star_refund: int = 0,
) -> None:
    """백그라운드 리포트 생성.

    요청 세션과 분리된 자체 DB 세션을 사용한다.
    성공 → content 저장 + status=ready
    실패 → status=failed, 별 환불 + 결제 refunded 처리
    """
    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if report is None:
            return
        try:
            if is_pair:
                content = await generate_pair_report(**gen_kwargs)
            else:
                content = await generate_report(**gen_kwargs)
            report.content = content
            report.status = "ready"
        except Exception as e:
            print(f"Report {report_id} generation failed: {e}")
            report.status = "failed"
            if star_refund:
                user = db.query(User).filter(User.id == report.user_id).first()
                if user:
                    user.stars = (user.stars or 0) + star_refund
            if report.payment_id:
                payment = db.query(Payment).filter(Payment.id == report.payment_id).first()
                if payment and payment.payment_method == PaymentMethod.star:
                    payment.status = PaymentStatus.refunded
        db.commit()
    finally:
        db.close()


STALE_GENERATING_MINUTES = 5


def _fail_stale_generating(report: Report, db: Session) -> bool:
    """서버 재시작 등으로 고아가 된 generating 리포트를 실패 처리.

    생성은 정상적으로 오래 걸려도 2~3분이므로, 5분 넘게 generating이면
    백그라운드 작업이 죽은 것으로 판단 → failed + 별 환불.
    호출자가 True를 받으면 db.commit() 해야 한다.
    """
    if report.status != "generating":
        return False
    created = report.created_at
    if created is None:
        return False
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - created < timedelta(minutes=STALE_GENERATING_MINUTES):
        return False

    report.status = "failed"
    if report.payment_id:
        payment = db.query(Payment).filter(Payment.id == report.payment_id).first()
        if (
            payment
            and payment.payment_method == PaymentMethod.star
            and payment.status == PaymentStatus.paid
        ):
            payment.status = PaymentStatus.refunded
            user = db.query(User).filter(User.id == report.user_id).first()
            if user:
                user.stars = (user.stars or 0) + max(1, (payment.amount or 99) // 99)
    print(f"Report {report.id}: stale generating -> failed (star refunded if applicable)")
    return True


# ── 라우트 ────────────────────────────────────────────────

@router.get("/")
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.created_at.desc()).all()
    if sum(_fail_stale_generating(r, db) for r in reports):
        db.commit()
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


# 프로모 코드로 star 지급
@router.post("/apply-promo")
def apply_promo(
    body: CouponValidateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """프로모 코드 적용 → quantity만큼 star 지급"""
    if not is_valid_promo(body.code):
        raise HTTPException(status_code=400, detail="Invalid promo code")
    stars_to_add = max(1, body.quantity)
    current_user.stars = (current_user.stars or 0) + stars_to_add
    db.commit()
    db.refresh(current_user)
    return {"stars": current_user.stars, "stars_added": stars_to_add}


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
            user_name=current_user.name,
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
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """유료 전체 리포트 생성 (프로모 코드 적용 시 무료).

    즉시 status=generating 리포트를 반환하고, AI 생성은 백그라운드에서 진행한다.
    프론트는 GET /reports/{id}를 폴링해 status=ready가 되면 내용을 표시한다.
    """
    if body.report_type.value in PAIR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{body.report_type.value}' reading requires partner data. Use /reports/pair/preview.",
        )

    profile = db.query(BirthProfile).filter(
        BirthProfile.id == body.birth_profile_id,
        BirthProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    # 스타 잔액 확인 후 선차감 (실패 시 백그라운드에서 환불)
    star_cost: int | None = None
    payment_id: int | None = None
    if body.use_star:
        star_cost = body.star_cost if body.star_cost is not None else REPORT_STAR_COST.get(body.report_type.value, DEFAULT_REPORT_STAR_COST)
        if (current_user.stars or 0) < star_cost:
            raise HTTPException(status_code=400, detail="Not enough stars")
        star_payment = Payment(
            user_id=current_user.id,
            amount=int(star_cost * 99),
            currency="USD",
            payment_method=PaymentMethod.star,
            status=PaymentStatus.paid,
        )
        db.add(star_payment)
        db.flush()
        current_user.stars = (current_user.stars or 0) - star_cost
        payment_id = star_payment.id
        final_price = body.price
    else:
        # 프로모 코드 유효하면 무료
        final_price = 0.00 if is_valid_promo(body.promo_code) else body.price

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content="",
        price=final_price,
        payment_id=payment_id,
        status="generating",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    gen_kwargs = dict(
        report_type=body.report_type.value,
        user_name=current_user.name,
        **_profile_kwargs(profile),
    )
    background_tasks.add_task(
        _run_generation,
        report.id,
        False,
        gen_kwargs,
        star_cost or 0,
    )
    return format_report(report, db)


PAIR_TYPES = {"crush", "ex", "situationship", "love"}


class PairReportCreateRequest(BaseModel):
    birth_profile_id: int
    report_type: ReportType
    price: float = 0.99
    promo_code: str | None = None
    use_star: bool = False
    star_cost: int | None = None
    partner_name: str | None = None
    partner_birth_date: str | None = None
    partner_birth_time: str | None = None
    partner_birth_place: str | None = None
    partner_gender: str | None = None
    partner_sun_sign: str | None = None
    partner_moon_sign: str | None = None
    partner_rising_sign: str | None = None
    partner_venus_sign: str | None = None
    partner_mars_sign: str | None = None
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
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """2인 리딩 (crush / situationship / ex / love).

    즉시 status=generating 리포트를 반환하고, AI 생성은 백그라운드에서 진행한다.
    """
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

    # 스타 잔액 확인 후 선차감 (실패 시 백그라운드에서 환불)
    star_cost: int | None = None
    payment_id: int | None = None
    if body.use_star:
        star_cost = body.star_cost if body.star_cost is not None else REPORT_STAR_COST.get(body.report_type.value, DEFAULT_REPORT_STAR_COST)
        if (current_user.stars or 0) < star_cost:
            raise HTTPException(status_code=400, detail="Not enough stars")
        star_payment = Payment(
            user_id=current_user.id,
            amount=int(star_cost * 99),
            currency="USD",
            payment_method=PaymentMethod.star,
            status=PaymentStatus.paid,
        )
        db.add(star_payment)
        db.flush()
        current_user.stars = (current_user.stars or 0) - star_cost
        payment_id = star_payment.id
        final_price = body.price
    else:
        # 프로모 코드 유효하면 무료
        final_price = 0.00 if is_valid_promo(body.promo_code) else body.price

    report = Report(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=body.report_type,
        content="",
        price=final_price,
        payment_id=payment_id,
        status="generating",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    partner_astro = _partner_chart(
        birth_date_str=body.partner_birth_date,
        birth_time_str=body.partner_birth_time,
        birth_place=body.partner_birth_place,
        sun_sign=body.partner_sun_sign,
        moon_sign=body.partner_moon_sign,
        rising_sign=body.partner_rising_sign,
        venus_sign=body.partner_venus_sign,
        mars_sign=body.partner_mars_sign,
    )

    gen_kwargs = dict(
        report_type=body.report_type.value,
        user_name=current_user.name,
        venus_sign=profile.venus_sign,
        mars_sign=profile.mars_sign,
        **_profile_kwargs(profile),
        partner_name=body.partner_name,
        partner_birth_date=body.partner_birth_date,
        partner_birth_time=body.partner_birth_time,
        partner_birth_place=body.partner_birth_place,
        partner_gender=body.partner_gender,
        partner_sun_sign=partner_astro["sun_sign"],
        partner_moon_sign=partner_astro["moon_sign"],
        partner_rising_sign=partner_astro["rising_sign"],
        partner_venus_sign=partner_astro["venus_sign"],
        partner_mars_sign=partner_astro["mars_sign"],
        partner_year_pillar=body.partner_year_pillar,
        partner_month_pillar=body.partner_month_pillar,
        partner_day_pillar=body.partner_day_pillar,
        partner_hour_pillar=body.partner_hour_pillar,
        partner_day_master=body.partner_day_master,
        partner_dominant_element=body.partner_dominant_element,
        partner_lacking_element=body.partner_lacking_element,
        partner_chart_strength=body.partner_chart_strength,
    )
    background_tasks.add_task(
        _run_generation,
        report.id,
        True,
        gen_kwargs,
        star_cost or 0,
    )
    return format_report(report, db)


@router.get("/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_report_or_404(report_id, current_user.id, db)
    if _fail_stale_generating(report, db):
        db.commit()
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