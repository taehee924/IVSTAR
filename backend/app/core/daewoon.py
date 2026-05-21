"""
대운(大運) 계산 모듈
pyswisseph로 절기(節氣) 날짜를 계산해 대운 시작 나이·현재 대운을 반환.
"""
from datetime import date
import sys, os
# pyswisseph is installed as 'swisseph' inside the venv
_venv_site = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'venv',
                          'lib', 'python3.12', 'site-packages')
if _venv_site not in sys.path:
    sys.path.insert(0, _venv_site)
import swisseph as swe

HEAVENLY_STEMS  = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

# 60갑자 순서
SIXTY_CYCLE = [
    f"{HEAVENLY_STEMS[i % 10]}{EARTHLY_BRANCHES[i % 12]}"
    for i in range(60)
]

YANG_STEMS = {'갑', '병', '무', '경', '임'}


def _jd(year: int, month: int, day: int, hour: float = 12.0) -> float:
    return swe.julday(year, month, day, hour)


def _nearest_jieun_jd(birth_jd: float, forward: bool) -> float:
    """
    순행(forward=True)이면 출생 직후 절기, 역행이면 출생 직전 절기의 JD 반환.
    절기는 태양 황경이 30° 배수(0,30,60,...,330)인 시점 — 사주 월지 변환점.
    """
    sun_lon = swe.calc_ut(birth_jd, swe.SUN)[0][0]

    if forward:
        # 다음 30° 배수 찾기
        target = (int(sun_lon / 30) + 1) * 30 % 360
        result = swe.solcross_ut(target, birth_jd, swe.FLG_SWIEPH)
    else:
        # 직전 30° 배수 찾기
        target = int(sun_lon / 30) * 30 % 360
        # 직전이므로 최대 35일 앞에서 탐색
        result = swe.solcross_ut(target, birth_jd - 35, swe.FLG_SWIEPH)

    # solcross_ut 반환값: float (JD) 또는 (JD, flag) 형태 모두 처리
    return result if isinstance(result, float) else result[0]


def _sixty_index(pillar: str) -> int:
    """'갑자' 같은 두 글자 간지 → 60갑자 인덱스 반환."""
    if not pillar or len(pillar) < 2:
        return 0
    stem, branch = pillar[0], pillar[1]
    if stem not in HEAVENLY_STEMS or branch not in EARTHLY_BRANCHES:
        return 0
    si = HEAVENLY_STEMS.index(stem)
    bi = EARTHLY_BRANCHES.index(branch)
    for i in range(60):
        if i % 10 == si and i % 12 == bi:
            return i
    return 0


def calculate_current_daewoon(
    birth_date_str: str,
    gender: str | None,
    year_pillar: str | None,
    month_pillar: str | None,
) -> tuple[str | None, str | None]:
    """
    현재 대운 천간지지와 나이 범위를 반환.
    Returns: (daewoon_pillar e.g. '신묘', age_range e.g. '24~33')
    실패 시 (None, None).
    """
    try:
        y, m, d = map(int, birth_date_str.split('-'))
        birth_jd = _jd(y, m, d)

        # 순행/역행 결정
        year_stem = (year_pillar or '')[:1]
        is_yang = year_stem in YANG_STEMS
        gender_lower = (gender or '').lower()
        is_male = gender_lower in ('male', '남', '남자', 'm')
        forward = (is_yang and is_male) or (not is_yang and not is_male)

        # 절기까지 일수 → 대운 시작 나이 (3일 = 1년)
        jieun_jd = _nearest_jieun_jd(birth_jd, forward)
        days = abs(jieun_jd - birth_jd)
        start_age = round(days / 3)

        # 현재 나이
        today = date.today()
        current_age = today.year - y - (
            1 if (today.month, today.day) < (m, d) else 0
        )

        # 60갑자 인덱스에서 대운 순서 계산
        month_idx = _sixty_index(month_pillar or '')

        for i in range(1, 20):
            dw_start = start_age + (i - 1) * 10
            dw_end = dw_start + 9
            if current_age <= dw_end:
                idx = (month_idx + i) % 60 if forward else (month_idx - i) % 60
                return SIXTY_CYCLE[idx], f"{dw_start}~{dw_end}"

        return None, None

    except Exception as e:
        print(f"[daewoon] calculation error: {e}")
        return None, None


def calculate_current_age(birth_date_str: str) -> int | None:
    """birth_date_str ('YYYY-MM-DD') → 현재 만 나이."""
    try:
        y, m, d = map(int, birth_date_str.split('-'))
        today = date.today()
        return today.year - y - (1 if (today.month, today.day) < (m, d) else 0)
    except Exception:
        return None
