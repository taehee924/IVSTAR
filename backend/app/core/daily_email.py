"""데일리 리딩 이메일 일괄 발송 (cron에서 호출).

동의(daily_email_opt_in=True)한 유저마다:
  1) 오늘(KST) daily_free 리포트가 이미 ready면 재사용, 없으면 생성(동기 await)
  2) 요약 파싱 → 이메일 HTML 렌더 → Resend 발송
비용: 유저당 하루 1회 생성(기존 daily_free와 동일 리포트 재사용).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.claude import generate_report
from app.core.email import build_daily_email_html, parse_daily_summary, send_email
from app.models.user import User
from app.models.report import Report, ReportType
from app.models.birth_profile import BirthProfile

KST = timezone(timedelta(hours=9))
_WEEKDAY_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _profile_kwargs(profile: BirthProfile) -> dict:
    """generate_report에 넘기는 프로필 필드 (reports.py와 동일 구성)."""
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


async def _todays_report(db, user: User, profile: BirthProfile) -> Report | None:
    """오늘(KST) ready 상태 daily_free를 반환하거나, 없으면 새로 생성해 반환."""
    today_start = datetime.now(KST).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = (
        db.query(Report)
        .filter(
            Report.user_id == user.id,
            Report.report_type == ReportType.daily_free,
            Report.created_at >= today_start.astimezone(timezone.utc),
            Report.status == "ready",
        )
        .order_by(Report.created_at.desc())
        .first()
    )
    if existing:
        return existing

    report = Report(
        user_id=user.id,
        birth_profile_id=profile.id,
        report_type=ReportType.daily_free,
        content="",
        price=0.00,
        status="generating",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        content = await generate_report(
            report_type="daily_free",
            user_name=user.name,
            **_profile_kwargs(profile),
        )
        report.content = content
        report.status = "ready"
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:  # noqa: BLE001
        print(f"[daily_email] generation failed for user {user.id}: {e}")
        report.status = "failed"
        db.commit()
        return None


async def run_daily_emails() -> dict:
    """전체 동의 유저에게 데일리 이메일 발송. 결과 통계 반환."""
    db = SessionLocal()
    sent = skipped = failed = 0
    try:
        users = (
            db.query(User)
            .filter(User.daily_email_opt_in.is_(True), User.email.isnot(None))
            .all()
        )
        weekday = _WEEKDAY_EN[datetime.now(KST).weekday()]
        for user in users:
            profile = (
                db.query(BirthProfile)
                .filter(BirthProfile.user_id == user.id)
                .order_by(BirthProfile.created_at.asc())
                .first()
            )
            if not profile:
                skipped += 1
                continue

            report = await _todays_report(db, user, profile)
            if not report or not report.content:
                failed += 1
                continue

            summary = parse_daily_summary(report.content)
            if not summary:
                failed += 1
                continue

            html = build_daily_email_html(
                summary=summary,
                weekday=weekday,
                report_url=f"{settings.FRONTEND_URL}/dashboard/report/{report.id}",
                unsubscribe_url=f"{settings.BACKEND_URL.rstrip('/')}"
                f"/api/v1/emails/unsubscribe?token={user.unsubscribe_token}",
            )
            ok = await send_email(
                to=user.email,
                subject=f"✨ Your {weekday} reading is ready — IVSTAR",
                html=html,
            )
            if ok:
                sent += 1
            else:
                failed += 1

        result = {"total": len(users), "sent": sent, "skipped": skipped, "failed": failed}
        print(f"[daily_email] {result}")
        return result
    finally:
        db.close()
