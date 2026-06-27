import asyncio
import anthropic
from app.core.config import settings
from app.core.prompts.about_me import build_about_me_prompt
from app.core.prompts.LifeCycles import build_life_cycles_prompt
from app.core.prompts.Horoscope import build_horoscope_prompt
from app.core.daewoon import calculate_current_daewoon, calculate_current_age
from app.core.prompts.Crush import build_crush_prompt
from app.core.prompts.Situationship import build_situationship_prompt
from app.core.prompts.Ex import build_ex_prompt
from app.core.prompts.Couple import build_couple_prompt

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

_RETRY_DELAYS = [3, 7, 15, 30]  # seconds between retries

_TRANSIENT_CODES = ("529", "503", "overloaded", "429", "rate_limit", "UNAVAILABLE")

_MODEL = "claude-sonnet-4-5"


async def _call_claude(system_prompt: str, user_prompt: str) -> str:
    last_error: Exception | None = None
    for attempt, delay in enumerate([0] + _RETRY_DELAYS):
        if delay:
            await asyncio.sleep(delay)
        try:
            response = await client.messages.create(
                model=_MODEL,
                max_tokens=8192,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text
        except Exception as e:
            last_error = e
            err_str = str(e)
            if any(code in err_str for code in _TRANSIENT_CODES):
                print(f"Claude transient error (attempt {attempt + 1}): {e}")
                continue
            print(f"Claude API error: {e}")
            raise RuntimeError(f"Claude API error: {e}") from e

    raise RuntimeError(
        "Claude API is temporarily unavailable (high demand). Please try again in a moment."
    ) from last_error


async def generate_report(
    report_type: str,
    birth_date: str,
    birth_time: str | None,
    birth_place: str | None,
    gender: str | None,
    sun_sign: str | None,
    moon_sign: str | None,
    rising_sign: str | None,
    mc_sign: str | None = None,
    year_pillar: str | None = None,
    month_pillar: str | None = None,
    day_pillar: str | None = None,
    hour_pillar: str | None = None,
    day_master: str | None = None,
    dominant_element: str | None = None,
    lacking_element: str | None = None,
    chart_strength: str | None = None,
) -> str:
    """Claude API 호출 → 리포트 텍스트 반환"""

    kwargs = dict(
        birth_date=birth_date,
        birth_time=birth_time,
        birth_place=birth_place,
        gender=gender,
        sun_sign=sun_sign,
        moon_sign=moon_sign,
        rising_sign=rising_sign,
        mc_sign=mc_sign,
        year_pillar=year_pillar,
        month_pillar=month_pillar,
        day_pillar=day_pillar,
        hour_pillar=hour_pillar,
        day_master=day_master,
        dominant_element=dominant_element,
        lacking_element=lacking_element,
        chart_strength=chart_strength,
    )

    # ── 타입별 프롬프트 라우팅 ─────────────────────────────────
    if report_type == "general":
        system_prompt, user_prompt = build_about_me_prompt(**kwargs)

    elif report_type == "life_cycle":
        current_age = calculate_current_age(birth_date)
        current_daewoon, daewoon_age_range = calculate_current_daewoon(
            birth_date_str=birth_date,
            gender=gender,
            year_pillar=year_pillar,
            month_pillar=month_pillar,
        )
        system_prompt, user_prompt = build_life_cycles_prompt(
            **kwargs,
            venus_sign=None,
            current_age=current_age,
            current_daewoon=current_daewoon,
            daewoon_age_range=daewoon_age_range,
        )

    elif report_type == "daily":
        current_daewoon, daewoon_age_range = calculate_current_daewoon(
            birth_date_str=birth_date,
            gender=gender,
            year_pillar=year_pillar,
            month_pillar=month_pillar,
        )
        daeun_stem   = current_daewoon[0] if current_daewoon else None
        daeun_branch = current_daewoon[1] if current_daewoon else None
        system_prompt, user_prompt = build_horoscope_prompt(
            user_name=None,
            birth_date=birth_date,
            birth_time=birth_time,
            birth_place=birth_place,
            gender=gender,
            sun_sign=sun_sign,
            moon_sign=moon_sign,
            rising_sign=rising_sign,
            mc_sign=mc_sign,
            venus_sign=None,
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            day_master=day_master,
            dominant_element=dominant_element,
            lacking_element=lacking_element,
            chart_strength=chart_strength,
            daeun_stem=daeun_stem,
            daeun_branch=daeun_branch,
            daeun_age_range=daewoon_age_range,
            saeun_stem="병(丙)",
            saeun_branch="오(午)",
        )

    elif report_type in ("crush", "ex", "situationship", "love"):
        # 두 사람 데이터가 필요한 리딩 — 전용 엔드포인트(/reports/pair) 사용
        raise ValueError(
            f"'{report_type}' reading requires partner data. "
            "Use the /api/v1/reports/pair endpoint instead."
        )

    else:
        # career / wealth / health — 프롬프트 파일 미완성
        system_prompt = "You are a professional astrologer and saju reader."
        user_prompt = (
            f"Write a {report_type} reading in Korean for someone born on "
            f"{birth_date} in {birth_place or 'unknown location'}. "
            f"Sun sign: {sun_sign or 'unknown'}. "
            f"Day Master (일간): {day_master or 'unknown'}."
        )

    return await _call_claude(system_prompt, user_prompt)


async def generate_pair_report(
    report_type: str,
    # ── User data ──────────────────────────────────────────
    user_name: str | None,
    birth_date: str,
    birth_time: str | None,
    birth_place: str | None,
    gender: str | None,
    sun_sign: str | None,
    moon_sign: str | None,
    rising_sign: str | None,
    mc_sign: str | None,
    venus_sign: str | None,
    year_pillar: str | None,
    month_pillar: str | None,
    day_pillar: str | None,
    hour_pillar: str | None,
    day_master: str | None,
    dominant_element: str | None,
    lacking_element: str | None,
    chart_strength: str | None,
    # ── Partner data (normalized as partner_*) ─────────────
    partner_name: str | None,
    partner_birth_date: str | None,
    partner_birth_time: str | None,
    partner_birth_place: str | None,
    partner_gender: str | None,
    partner_sun_sign: str | None,
    partner_moon_sign: str | None,
    partner_rising_sign: str | None,
    partner_venus_sign: str | None,
    partner_year_pillar: str | None,
    partner_month_pillar: str | None,
    partner_day_pillar: str | None,
    partner_hour_pillar: str | None,
    partner_day_master: str | None,
    partner_dominant_element: str | None,
    partner_lacking_element: str | None,
    partner_chart_strength: str | None,
) -> str:
    """2인 리딩 Claude API 호출 → 리포트 텍스트 반환"""

    user_kwargs = dict(
        user_name=user_name,
        birth_date=birth_date,
        birth_time=birth_time,
        birth_place=birth_place,
        gender=gender,
        sun_sign=sun_sign,
        moon_sign=moon_sign,
        rising_sign=rising_sign,
        mc_sign=mc_sign,
        venus_sign=venus_sign,
        year_pillar=year_pillar,
        month_pillar=month_pillar,
        day_pillar=day_pillar,
        hour_pillar=hour_pillar,
        day_master=day_master,
        dominant_element=dominant_element,
        lacking_element=lacking_element,
        chart_strength=chart_strength,
    )

    if report_type == "crush":
        system_prompt, user_prompt = build_crush_prompt(
            **user_kwargs,
            crush_name=partner_name,
            crush_birth_date=partner_birth_date,
            crush_birth_time=partner_birth_time,
            crush_birth_place=partner_birth_place,
            crush_gender=partner_gender,
            crush_sun_sign=partner_sun_sign,
            crush_moon_sign=partner_moon_sign,
            crush_rising_sign=partner_rising_sign,
            crush_venus_sign=partner_venus_sign,
            crush_year_pillar=partner_year_pillar,
            crush_month_pillar=partner_month_pillar,
            crush_day_pillar=partner_day_pillar,
            crush_hour_pillar=partner_hour_pillar,
            crush_day_master=partner_day_master,
            crush_dominant_element=partner_dominant_element,
            crush_lacking_element=partner_lacking_element,
            crush_chart_strength=partner_chart_strength,
        )
    elif report_type == "situationship":
        system_prompt, user_prompt = build_situationship_prompt(
            **user_kwargs,
            crush_name=partner_name,
            crush_birth_date=partner_birth_date,
            crush_birth_time=partner_birth_time,
            crush_birth_place=partner_birth_place,
            crush_gender=partner_gender,
            crush_sun_sign=partner_sun_sign,
            crush_moon_sign=partner_moon_sign,
            crush_rising_sign=partner_rising_sign,
            crush_venus_sign=partner_venus_sign,
            crush_year_pillar=partner_year_pillar,
            crush_month_pillar=partner_month_pillar,
            crush_day_pillar=partner_day_pillar,
            crush_hour_pillar=partner_hour_pillar,
            crush_day_master=partner_day_master,
            crush_dominant_element=partner_dominant_element,
            crush_lacking_element=partner_lacking_element,
            crush_chart_strength=partner_chart_strength,
        )
    elif report_type == "ex":
        system_prompt, user_prompt = build_ex_prompt(
            **user_kwargs,
            ex_name=partner_name,
            ex_birth_date=partner_birth_date,
            ex_birth_time=partner_birth_time,
            ex_birth_place=partner_birth_place,
            ex_gender=partner_gender,
            ex_sun_sign=partner_sun_sign,
            ex_moon_sign=partner_moon_sign,
            ex_rising_sign=partner_rising_sign,
            ex_venus_sign=partner_venus_sign,
            ex_year_pillar=partner_year_pillar,
            ex_month_pillar=partner_month_pillar,
            ex_day_pillar=partner_day_pillar,
            ex_hour_pillar=partner_hour_pillar,
            ex_day_master=partner_day_master,
            ex_dominant_element=partner_dominant_element,
            ex_lacking_element=partner_lacking_element,
            ex_chart_strength=partner_chart_strength,
        )
    elif report_type == "love":
        system_prompt, user_prompt = build_couple_prompt(
            **user_kwargs,
            partner_name=partner_name,
            partner_birth_date=partner_birth_date,
            partner_birth_time=partner_birth_time,
            partner_birth_place=partner_birth_place,
            partner_gender=partner_gender,
            partner_sun_sign=partner_sun_sign,
            partner_moon_sign=partner_moon_sign,
            partner_rising_sign=partner_rising_sign,
            partner_venus_sign=partner_venus_sign,
            partner_year_pillar=partner_year_pillar,
            partner_month_pillar=partner_month_pillar,
            partner_day_pillar=partner_day_pillar,
            partner_hour_pillar=partner_hour_pillar,
            partner_day_master=partner_day_master,
            partner_dominant_element=partner_dominant_element,
            partner_lacking_element=partner_lacking_element,
            partner_chart_strength=partner_chart_strength,
        )
    else:
        raise ValueError(f"'{report_type}' is not a valid pair reading type.")

    return await _call_claude(system_prompt, user_prompt)
