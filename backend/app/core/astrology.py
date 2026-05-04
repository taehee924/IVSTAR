import swisseph as swe
from datetime import date, time, datetime
import pytz

# 별자리 이름
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

def get_zodiac_sign(degree: float) -> str:
    """황도 각도 → 별자리 이름"""
    index = int(degree / 30) % 12
    return ZODIAC_SIGNS[index]


def calculate_chart(
    birth_date: date,
    birth_time: time | None,
    birth_timezone: str | None,
    latitude: float,
    longitude: float,
) -> dict:
    """
    생년월일시 + 위도/경도 → Sun/Moon/Rising 계산
    birth_time 없으면 Rising 계산 불가
    """
    # 시간 설정 (없으면 정오로 대체)
    bt = birth_time if birth_time else time(12, 0, 0)

    # 타임존 변환 → UTC
    tz = pytz.timezone(birth_timezone) if birth_timezone else pytz.utc
    local_dt = datetime(
        birth_date.year, birth_date.month, birth_date.day,
        bt.hour, bt.minute, bt.second
    )
    local_dt = tz.localize(local_dt)
    utc_dt = local_dt.astimezone(pytz.utc)

    # Julian Day 계산
    jd = swe.julday(
        utc_dt.year, utc_dt.month, utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    )

    # Sun 계산
    sun_pos, _ = swe.calc_ut(jd, swe.SUN)
    sun_sign = get_zodiac_sign(sun_pos[0])

    # Moon 계산
    moon_pos, _ = swe.calc_ut(jd, swe.MOON)
    moon_sign = get_zodiac_sign(moon_pos[0])

    # Rising (Ascendant) 계산 - 출생 시간 있을 때만
    rising_sign = None
    if birth_time:
        houses, ascmc = swe.houses(jd, latitude, longitude, b"P")
        rising_sign = get_zodiac_sign(ascmc[0])

    return {
        "sun_sign": sun_sign,
        "moon_sign": moon_sign,
        "rising_sign": rising_sign,
    }