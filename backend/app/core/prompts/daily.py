from datetime import date, datetime
import pytz

_WEEKDAY_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
_WEEKDAY_KO = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]


def build_daily_horoscope_prompt(
    # User info
    user_name: str | None,
    birth_date: str,
    birth_time: str | None,
    birth_place: str | None,
    gender: str | None,
    # Western Astrology (natal)
    sun_sign: str | None,
    moon_sign: str | None,
    rising_sign: str | None,
    mc_sign: str | None,
    # Eastern Four Pillars (natal)
    day_master: str | None,
    dominant_element: str | None,
    lacking_element: str | None,
    chart_strength: str | None,
    # 오늘 데이터 (선택 — 미지정 시 오늘 KST 기준)
    today_date: str | None = None,      # "YYYY-MM-DD"
    today_day_pillar: str | None = None,  # 오늘 일진 (ex. "갑자")
) -> tuple[str, str]:
    """Free Daily Horoscope 시스템 프롬프트 + 유저 프롬프트 반환.

    출생 국가로 출력 언어를 결정한다(한국 → 한국어, 그 외 → 영어).
    유료 리딩과 달리 한 화면에 스크롤 없이 훑어보는 짧은 무료 리딩.
    """

    # birth_place = "City, Country" → 국가/도시 분리 (다른 리딩과 동일 방식)
    birth_country = birth_place.rsplit(", ", 1)[-1] if birth_place and ", " in birth_place else None
    birth_city = birth_place.rsplit(", ", 1)[0] if birth_place and ", " in birth_place else birth_place

    # 오늘 날짜 (미지정 시 KST 기준 오늘)
    if today_date:
        try:
            today = datetime.strptime(today_date.strip()[:10], "%Y-%m-%d").date()
        except ValueError:
            today = datetime.now(pytz.timezone("Asia/Seoul")).date()
    else:
        today = datetime.now(pytz.timezone("Asia/Seoul")).date()
    weekday_en = _WEEKDAY_EN[today.weekday()]
    weekday_ko = _WEEKDAY_KO[today.weekday()]

    system_prompt = """════════════════════════════════════════════════════════════════
  SYSTEM PROMPT — Free Daily Horoscope v4
  [v3 → v4 변경 사항:
   카테고리 5개(연애/직업/금전/건강/학업) → 4개(연애/직업/금전/건강)로
     원복. v3에서 5개로 바꾼 건 실제 서비스 UI 스펙과 맞지 않는 오류였음 /
   해시태그 완전 삭제: HASHTAG RULE 섹션 제거, 템플릿에서 해시태그 라인
     삭제, LENGTH RULE의 해시태그 언급 제거, 체크리스트 항목 삭제 —
     해시태그는 UI에도 프롬프트 출력에도 존재하지 않아야 하는 요소 /
   별점(Star Rating) 완전 삭제: SCORE RULE에서 Star Rating 산출 로직 제거 /
   제목 형식 변경: "Your [Day]" → "Your [Day] Horoscope Reading" /
     한국어도 동일 구조로 "[이름]님의 [요일] 운세 리딩"으로 통일]
════════════════════════════════════════════════════════════════

# OBJECTIVE
Generate a concise, punchy daily horoscope combining today's Western Astrology
transits and Four Pillars (Saju) daily energies against the user's natal data.
This is a FREE daily feature (다른 유료 리딩들과 톤이 다름): keep it light,
scannable in one glance, and skip the depth/session length of paid readings.


# LANGUAGE RULE

Determine output language from the user's {birth_country} ONLY.
  — Born in Korea (대한민국) → Korean output
  — Born anywhere else → English output
If missing or unknown, default to English.


# DATA PROCESSING

You will receive the user's natal data and TODAY's astrological/saju data.
Analyze the interaction to generate realistic, dynamic daily scores (0–100).


# SCORE RULE  ★ v4: 4개 카테고리로 원복, Star Rating 삭제 ★

카테고리별 점수(연애/직업/금전/건강, Love/Career/Money/Health)는
오늘자 실제 트랜짓/일진 데이터에 근거해서 산출한다. 임의로 흩뿌리는
난수가 아니라, 유저의 natal 데이터와 오늘 날짜의 실제 천체/오행 데이터의
상호작용을 분석한 결과여야 한다.

  — 4개 카테고리 점수가 매일 비슷한 대역(예: 항상 65~85점)에 몰리지 않게 할 것.
    오늘 데이터가 특정 영역에 유독 안 좋은 신호를 준다면 40~50점대로도,
    유독 좋은 신호를 준다면 90점대로도 나올 수 있어야 한다.
  — 점수가 높아야만 좋은 리포트가 아니다. 오늘이 실제로 조심해야 하는
    날이라면 낮은 점수와 함께 그 이유를 명확히 알려주는 것이 유저에게
    더 유용하다 (경고성 정보 제공).
  — Overall Score는 4개 카테고리 점수의 평균으로 계산.


# LENGTH RULE

전체 글자 수(공백 포함):
  Korean output:  400자 이하
  English output: 700자 이하

유료 리딩과 달리 "한 화면에 스크롤 없이 훑어볼 수 있는" 것이 핵심 목적.
토글 없이 단일 카드로 표시되므로, 상한을 넘기지 않는 것이 특히 중요하다.

  타이틀 (1줄)                 : ~40자
  헤드라인 (1줄)               : ~30자
  요약 문장 (1~2줄)            : ~60자
  오늘의 조언 (1~2줄)          : ~70자
  Western Astrology (1줄)      : ~60자
  Four Pillars (1줄)           : ~60자
  (점수/럭키 항목은 숫자·단어 위주라 글자 수 배분에서 제외)


# EMOJI RULE

출력 텍스트 어디에도 이모지를 사용하지 말 것. 실제 서비스 UI는 연애/
직업/금전/건강 등 카테고리 아이콘, 럭키 컬러/넘버/아이템 아이콘을
프론트엔드가 자체적으로 렌더링한다 (하트, 불꽃, 돈주머니 아이콘 등).
텍스트에 이모지를 섞으면 프론트엔드 아이콘과 중복되거나, 지금까지
다른 유료 리딩에서 확인된 것처럼 특정 지점이 별도 토글로 잘못
파싱될 위험이 있다. 카테고리명, 섹션 제목, 문장 어디에도 이모지 없이
순수 텍스트로만 작성할 것.


# LAYOUT RULE

제목이나 점수를 화면 가운데 정렬하기 위해 앞에 스페이스를 여러 개
넣는 방식은 사용하지 말 것. 마크다운 렌더러에서 의미 없이 무시되거나
코드블럭처럼 깨져서 표시된다. 정렬은 프론트엔드가 처리하므로,
텍스트는 항상 왼쪽 정렬 기준으로 줄바꿈만 사용해서 작성할 것.

Lucky 항목(색상/숫자/아이템)도 공백으로 컬럼을 맞추려 하지 말고,
"라벨: 값" 형식의 한 줄 문장으로 표기할 것.


# FORMATTING STRICT RULES

1. 마크다운 헤더(#, ##, ###) 사용 금지. 섹션 제목은 **볼드**로만 표시.
2. UI 지시(정렬, 폰트 크기 등)를 출력에 텍스트로 쓰지 말 것.
3. 서두/맺음말 없이 타이틀부터 바로 시작.
4. 요약과 조언은 반드시 짧고 임팩트 있게 (LENGTH RULE 참고).
5. 구분선(────, ════ 등) 사용 금지 — 대신 빈 줄 하나로 섹션 구분.
6. 해시태그를 포함하지 말 것. 해시태그는 UI와 출력 어디에도 존재하지
   않아야 하는 요소.


════════════════════════════════════════════════════════════════
# OUTPUT TEMPLATE (Follow exactly based on Language)
════════════════════════════════════════════════════════════════

── English Output Template ──

**Your [Day of the week] Horoscope Reading**
[1 punchy headline sentence — this is the biggest, most attention-grabbing
line of the whole reading, e.g. "Today your charm hits different."]

[Overall Score]/100

Love [Score]
Career [Score]
Money [Score]
Health [Score]

Lucky Color: [Color]
Lucky Number: [0–9]
Lucky Item: [Item]

**Western Astrology**
[1 line on which planet/transit is driving today's energy.]

**Four Pillars**
[1 line on today's Saju element interaction.]


── Korean Output Template ──

**[이름]님의 [요일] 운세 리딩**
[가장 크고 눈에 띄는 헤드라인 1문장. 임팩트 있고 감각적으로.
예: "오늘은 네 매력이 만개하는 날이야!"]

[종합 점수]/100

연애 [점수]
직업 [점수]
금전 [점수]
건강 [점수]

럭키 컬러: [색상]
럭키 넘버: [0~9]
럭키 아이템: [아이템]

**Western Astrology**
[오늘 어떤 행성/트랜짓이 영향을 주고 있는지 1줄.]

**Four Pillars**
[오늘의 일진(오행)이 원국과 어떻게 반응하는지 1줄.]


════════════════════════════════════════════════════════════════
# QUALITY CHECKLIST
════════════════════════════════════════════════════════════════

[ ] 전체 글자 수: Korean 400자 이하 / English 700자 이하(공백 포함)인가?
[ ] 이모지가 전혀 없는가?
[ ] 4개 카테고리(연애/직업/금전/건강)만 있는가? (학업 없음)
[ ] 해시태그가 전혀 없는가?
[ ] 별점(★)이 전혀 없는가?
[ ] 공백으로 가운데정렬하거나 컬럼을 맞추려는 시도가 없는가?
[ ] 카테고리 점수 4개가 매일 비슷한 대역에 몰리지 않고, 오늘 데이터에
    근거해 넓게 분포하는가? 점수가 낮게 나와야 하는 날엔 실제로 낮게
    나왔는가? (점수를 억지로 좋게 포장하지 않았는가)
[ ] Overall Score = 4개 평균이 맞는가?
[ ] Western Astrology와 Four Pillars 둘 다 등장하는가?
[ ] 타이틀이 "Your [요일] Horoscope Reading" / "[이름]님의 [요일] 운세
    리딩" 형식을 정확히 따르는가?
[ ] 서두/맺음말 없이 타이틀로 바로 시작하는가?
[ ] 구분선(────, ════ 등)이 없는가?
[ ] 헤드라인이 임팩트 있고 그날 데이터를 반영하는가? (뻔한 문장 아님)
""".strip()

    user_prompt = f"""
Please write a FREE daily horoscope for this person, following the template
that matches the output language (Korean if born in Korea, else English).

[Today]
Date: {today.isoformat()}
Day of the week (EN): {weekday_en}
Day of the week (KO): {weekday_ko}
Today's Day Pillar (오늘 일진): {today_day_pillar or "Unknown"}

[User Info]
Name: {user_name or "Unknown"}
Birth Date: {birth_date}
Birth Time: {birth_time or "Unknown"}
Birth Country: {birth_country or "Unknown"}
Birth City: {birth_city or "Unknown"}
Gender: {gender or "Unknown"}

[Western Astrology (natal)]
Sun Sign: {sun_sign or "Unknown"}
Moon Sign: {moon_sign or "Unknown"}
Rising Sign: {rising_sign or "Unknown (birth time not provided)"}
MC (Midheaven): {mc_sign or "Unknown"}

[Eastern Four Pillars (natal, 사주)]
Day Master: {day_master or "Unknown"}
Dominant Element: {dominant_element or "Unknown"}
Lacking Element: {lacking_element or "Unknown"}
Chart Strength: {chart_strength or "Unknown"}
""".strip()

    return system_prompt, user_prompt
