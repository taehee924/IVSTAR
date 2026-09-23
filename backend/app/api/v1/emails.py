"""이메일 관련 공개/운영 엔드포인트.

- GET  /emails/unsubscribe?token=...  : 원클릭 구독취소 (공개, 인증 없음)
- POST /emails/cron/daily             : 데일리 이메일 일괄 발송 (CRON_SECRET 보호)
"""
from fastapi import APIRouter, Header, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.daily_email import run_daily_emails
from app.models.user import User

router = APIRouter(prefix="/emails", tags=["emails"])


_UNSUB_PAGE = """\
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed · IVSTAR</title></head>
<body style="margin:0;background:#F3EEE2;font-family:Georgia,serif;">
  <div style="max-width:440px;margin:80px auto;background:#FBF8F0;border:1px solid #E8DFC8;
              border-radius:20px;padding:40px 32px;text-align:center;">
    <div style="font-size:12px;letter-spacing:2px;color:#A08F6A;text-transform:uppercase;">IVSTAR</div>
    <h1 style="font-size:22px;color:#3D3833;margin:18px 0 10px;">{heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#5C5346;margin:0 0 24px;">{message}</p>
    <a href="{front}/dashboard" style="display:inline-block;background:#0B1B33;color:#FBF8F0;
       text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
       Back to IVSTAR</a>
  </div>
</body></html>"""


def _page(heading: str, message: str) -> HTMLResponse:
    return HTMLResponse(
        _UNSUB_PAGE.format(heading=heading, message=message, front=settings.FRONTEND_URL)
    )


@router.get("/unsubscribe", response_class=HTMLResponse)
def unsubscribe(token: str = Query(...)):
    """이메일 구독취소. 토큰으로 유저를 찾아 opt-in을 끈다."""
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.unsubscribe_token == token).first()
        if not user:
            return _page("Link expired", "This unsubscribe link is no longer valid.")
        user.daily_email_opt_in = False
        db.commit()
        return _page(
            "You're unsubscribed",
            "You won't receive daily reading emails anymore. "
            "You can re-enable them anytime from your dashboard.",
        )
    finally:
        db.close()


@router.post("/cron/daily")
async def cron_daily(x_cron_secret: str | None = Header(default=None)):
    """데일리 이메일 일괄 발송. Railway cron이 매일 지정 시각에 호출.

    보안: X-Cron-Secret 헤더가 설정된 CRON_SECRET과 일치해야 함.
    """
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    result = await run_daily_emails()
    return {"ok": True, **result}
