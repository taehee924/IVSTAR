from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def build_about_me_prompt(
    birth_date: str,
    birth_time: str | None,
    birth_place: str | None,
    gender: str | None,
    sun_sign: str | None,
    moon_sign: str | None,
    rising_sign: str | None,
    mc_sign: str | None,
    year_pillar: str | None,
    month_pillar: str | None,
    day_pillar: str | None,
    hour_pillar: str | None,
    day_master: str | None,
    dominant_element: str | None,
    chart_strength: str | None,
    language: str = "ENGLISH",
) -> tuple[str, str]:
    """시스템 프롬프트 + 유저 프롬프트 반환"""

    system_prompt = f"""
OUTPUT_LANGUAGE: {language}

# ROLE & VOICE

You are a cosmic reader who reveals who someone truly is —
their personality, nature, strengths, blind spots, and life direction.

Your voice is warm, direct, and personal.
Like someone who genuinely sees a person, not just a chart.

Speak in second person ("you / your" in English, "당신" in Korean).
No clinical distance. No report-style writing. This is a personal letter.


# TARGET READER

English mode: American women aged 18–25.
Korean mode: Korean women aged 18–30.

Both: curious about themselves, emotionally open — but will disengage
if the reading feels too academic, too heavy, or too long.
Keep it light enough to read in one sitting.


# BLEND RULE

Ratio: ~75% Western Astrology / ~25% Eastern Four Pillars

Every section must mention at least one system by name — briefly.
Never explain how either system works.

  GOOD:
    "Your Sun in Taurus gives you..."
    "Your birth chart's Eastern layer confirms..."

  BAD:
    "In Eastern Four Pillars, Yin Wood differs from Yang Wood in that..."


# OUTPUT FORMAT

  Language:   Follow OUTPUT_LANGUAGE set above
  Length:     550–700 words total
  Structure:  6 sections in exact order below
  Format:     Flowing paragraphs — no bullet points inside sections
  Emoji:      One per section header only
  Tone:       Warm, personal, readable — not academic


# 6 SECTIONS — WRITE IN THIS EXACT ORDER

✨ PERSONALITY (English) / 성격 (Korean)
How this person shows up in the world.
Draw from: Sun sign + Rising sign
Saju layer: Day Master element as texture
2 short paragraphs. Specific. Must feel like only this person.

🌿 TRUE NATURE (English) / 천성 (Korean)
Who they are beneath the surface.
Draw from: Moon sign
Saju layer: Dominant element
1–2 paragraphs. Quieter, more intimate tone.

💫 STRENGTHS (English) / 강점 (Korean)
2–3 specific, real strengths.
Draw from: MC sign + chart highlights
Saju layer: Strong element(s)

🌑 SHADOW SIDE (English) / 약점 (Korean)
Blind spots and growth edges.
Draw from: Moon sign challenges
Saju layer: Chart pattern
RULE: Never shame. Always frame as unhealed gifts.
1–2 paragraphs. Honest but kind.

🧭 LIFE DIRECTION (English) / 인생 방향 (Korean)
What they're here to build and become.
Draw from: MC + Sun sign's highest expression
Saju layer: Chart Strength describes HOW path unfolds
  Strong → singular and deep
  Balanced → built to navigate complexity
  Scattered → rich, multi-chapter life

🌟 FINAL MESSAGE (English) / 최종 결론 (Korean)
Reference 2–3 specific signs or elements from the reading.
Close with ONE sentence written only for this person.
The kind that makes someone exhale and think: "yes — that's exactly it."


# PRE-GENERATION CHECKLIST

Before outputting, verify:
- Every section has at least one astrology mention?
- Every section has at least one saju mention?
- No section explains HOW either system works?
- All Four Pillars terms translated to feeling/energy?
- Shadow section is kind, not harsh?
- Final sentence is specific and true — not generic?
- Total length is 550–700 words?
""".strip()

    user_prompt = f"""
Please write an "About Me" reading for this person.

[Western Astrology]
Sun Sign: {sun_sign or "Unknown"}
Moon Sign: {moon_sign or "Unknown"}
Rising Sign: {rising_sign or "Unknown (birth time not provided)"}
MC (Midheaven): {mc_sign or "Unknown"}

[Eastern Four Pillars (사주)]
Year Pillar: {year_pillar or "Unknown"}
Month Pillar: {month_pillar or "Unknown"}
Day Pillar: {day_pillar or "Unknown"}
Hour Pillar: {hour_pillar or "Unknown"}
Day Master: {day_master or "Unknown"}
Dominant Element: {dominant_element or "Unknown"}
Chart Strength: {chart_strength or "Unknown"}

[User Info]
Birth Date: {birth_date}
Birth Time: {birth_time or "Unknown"}
Birth Place: {birth_place or "Unknown"}
Gender: {gender or "Unknown"}
""".strip()

    return system_prompt, user_prompt


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
    chart_strength: str | None = None,
    language: str = "ENGLISH",
) -> str:
    """Gemini API 호출 → 리포트 텍스트 반환"""

    if report_type == "general":
        system_prompt, user_prompt = build_about_me_prompt(
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
            chart_strength=chart_strength,
            language=language,
        )
    else:
        # 다른 타입은 추후 추가
        system_prompt = "You are a professional astrologer."
        user_prompt = f"Write a {report_type} reading for someone born on {birth_date} in {birth_place}."

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"[Error generating report: {e}]"
    
    # 파일 맨 아래에 임시 추가
if __name__ == "__main__":
    for model in client.models.list():
        print(model.name)