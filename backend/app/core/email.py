"""이메일 발송 (Resend REST API) + 데일리 리딩 이메일 템플릿.

Resend를 쓰는 이유: 설정이 간단하고, from 도메인(4fourstar.com) DNS 인증만 하면
바로 발송 가능. RESEND_API_KEY / EMAIL_FROM 은 환경변수로 주입한다.
"""
from __future__ import annotations

import re
from html import escape

import httpx

from app.core.config import settings

RESEND_ENDPOINT = "https://api.resend.com/emails"


async def send_email(to: str, subject: str, html: str) -> bool:
    """Resend로 이메일 1건 발송. 성공 True / 실패 False (예외를 삼켜 cron 루프가 멈추지 않게)."""
    if not settings.RESEND_API_KEY:
        print("[email] RESEND_API_KEY not set — skip send")
        return False
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                RESEND_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
        if resp.status_code >= 300:
            print(f"[email] send failed {resp.status_code}: {resp.text[:300]}")
            return False
        return True
    except Exception as e:  # noqa: BLE001
        print(f"[email] send error: {e}")
        return False


# ── 데일리 리딩 요약 파서 (프론트 parseDailyHoroscope의 백엔드 버전) ──

_CATEGORY_EMOJI = [
    (re.compile(r"love|사랑|연애", re.I), "💗"),
    (re.compile(r"career|work|직업|커리어|일", re.I), "💼"),
    (re.compile(r"wealth|money|재물|금전|돈", re.I), "💸"),
    (re.compile(r"health|건강", re.I), "💪"),
]


def _emoji_for(label: str) -> str:
    for pattern, emoji in _CATEGORY_EMOJI:
        if pattern.search(label):
            return emoji
    return "✨"


def parse_daily_summary(content: str) -> dict | None:
    """데일리 리딩 마크다운에서 이메일용 요약을 추출.

    반환: {title, headline, overall, categories:[{label,score,emoji}]}
    파싱 실패 시 None.
    """
    if not content:
        return None

    def strip(s: str) -> str:
        return s.replace("**", "").strip()

    lines = [l.strip() for l in content.split("\n")]

    title_idx = next(
        (i for i, l in enumerate(lines) if re.search(r"운세\s*리딩|Horoscope Reading", l, re.I)),
        -1,
    )
    if title_idx == -1:
        return None
    title = strip(lines[title_idx])

    overall_idx = next((i for i, l in enumerate(lines) if re.search(r"\d{1,3}\s*/\s*100", l)), -1)
    overall = 0
    if overall_idx != -1:
        m = re.search(r"(\d{1,3})\s*/\s*100", lines[overall_idx])
        if m:
            overall = int(m.group(1))

    # 헤드라인: 타이틀 다음 ~ 종합 점수 이전의 첫 문장
    summary_end = overall_idx if overall_idx != -1 else len(lines)
    headline = " ".join(
        strip(l) for l in lines[title_idx + 1 : summary_end] if strip(l)
    ).strip()

    # 카테고리: "라벨 점수" 4줄 (종합 점수 이후 ~ 럭키 이전)
    lucky_idx = next((i for i, l in enumerate(lines) if re.search(r"럭키|Lucky", l, re.I)), -1)
    cat_end = lucky_idx if lucky_idx != -1 else len(lines)
    categories: list[dict] = []
    for l in lines[overall_idx + 1 : cat_end]:
        m = re.match(r"^(.+?)\s+(\d{1,3})$", strip(l))
        if m and int(m.group(2)) <= 100:
            label = m.group(1).strip()
            categories.append(
                {"label": label, "score": int(m.group(2)), "emoji": _emoji_for(label)}
            )

    return {"title": title, "headline": headline, "overall": overall, "categories": categories}


def _stars(score: int) -> str:
    """0~100 → ★☆ 5칸 (반올림)."""
    filled = max(0, min(5, round(score / 20)))
    return "★" * filled + "☆" * (5 - filled)


def build_daily_email_html(
    *,
    summary: dict,
    weekday: str,
    report_url: str,
    unsubscribe_url: str,
) -> str:
    """데일리 리딩 이메일 HTML (이메일 클라이언트 호환: 인라인 스타일 + 테이블)."""
    overall = summary.get("overall", 0)
    headline = escape(summary.get("headline") or "Your day at a glance.")
    stars = _stars(overall)

    cat_rows = ""
    for c in summary.get("categories", [])[:4]:
        cat_rows += (
            f'<tr><td style="padding:6px 0;font-size:16px;color:#3D3833;">'
            f'{c["emoji"]} <span style="color:#5C5346;">{escape(c["label"])}</span>'
            f' — <strong style="color:#3D3833;">{c["score"]}</strong></td></tr>'
        )

    return f"""\
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F3EEE2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEE2;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
             style="max-width:480px;width:100%;background:#FBF8F0;border:1px solid #E8DFC8;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:30px 30px 8px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:2px;color:#A08F6A;text-transform:uppercase;">IVSTAR</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#3D3833;margin-top:10px;">
            ✨ Your {escape(weekday)} reading is ready
          </div>
        </td></tr>

        <tr><td style="padding:18px 30px 4px;">
          <div style="font-size:12px;letter-spacing:1px;color:#9A8F7A;text-transform:uppercase;">Your day</div>
          <div style="font-size:26px;color:#8B1E3F;margin-top:6px;letter-spacing:2px;">
            {stars} <span style="font-family:Georgia,serif;color:#3D3833;">{overall}/100</span>
          </div>
        </td></tr>

        <tr><td style="padding:14px 30px 6px;">
          <p style="font-size:15px;line-height:1.6;color:#5C5346;margin:0;">{headline}</p>
        </td></tr>

        <tr><td style="padding:10px 30px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{cat_rows}</table>
        </td></tr>

        <tr><td align="center" style="padding:22px 30px 26px;">
          <a href="{report_url}"
             style="display:inline-block;background:#0B1B33;color:#FBF8F0;text-decoration:none;
                    font-family:Georgia,serif;font-size:15px;font-weight:600;padding:14px 34px;border-radius:10px;">
            ✦ See Your Full Reading →
          </a>
        </td></tr>

        <tr><td style="padding:0 30px;"><div style="height:1px;background:#EDE3CC;"></div></td></tr>

        <tr><td align="center" style="padding:22px 30px 8px;">
          <div style="font-family:Georgia,serif;font-size:14px;color:#5C5346;">Two ancient systems. One complete picture.</div>
          <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#3D3833;margin-top:8px;letter-spacing:1px;">IVSTAR</div>
          <div style="font-size:12px;color:#A08F6A;margin-top:4px;">Western Astrology × Eastern Four Pillars</div>
        </td></tr>

        <tr><td align="center" style="padding:16px 30px 28px;">
          <a href="{unsubscribe_url}" style="font-size:11px;color:#9A8F7A;text-decoration:underline;">Unsubscribe</a>
          <div style="font-size:11px;color:#B3A88F;margin-top:8px;">© 2026 IVSTAR · <a href="{settings.FRONTEND_URL}/dashboard" style="color:#B3A88F;text-decoration:none;">4fourstar.com</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
