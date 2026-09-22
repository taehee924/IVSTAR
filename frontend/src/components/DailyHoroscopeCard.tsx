"use client";

// ── i18n: 카드 내 정적 라벨 (운세 문구 자체는 리포트 content에서 파싱) ──
const STRINGS: Record<string, {
  adviceLabel: string;
  outOf: string;
  luckyColor: string;
  luckyNumber: string;
  luckyItem: string;
  astrologyLabel: string;
  sajuLabel: string;
}> = {
  ko: {
    outOf: "/ 100",
    adviceLabel: "오늘의 조언",
    luckyColor: "색상",
    luckyNumber: "숫자",
    luckyItem: "아이템",
    astrologyLabel: "Western Astrology",
    sajuLabel: "Four Pillars",
  },
  en: {
    outOf: "/ 100",
    adviceLabel: "Today's Advice",
    luckyColor: "Color",
    luckyNumber: "Number",
    luckyItem: "Item",
    astrologyLabel: "Western Astrology",
    sajuLabel: "Four Pillars",
  },
};

export interface DailyHoroscopeData {
  title: string;
  summary: string;
  overall: number;
  categories: { label: string; score: number }[];
  advice?: string;
  lucky: { color?: string; number?: string; item?: string };
  astrology?: string;
  saju?: string;
}

/**
 * daily_free 리포트의 마크다운 출력을 DailyHoroscopeData로 파싱.
 * 파싱 실패(형식 불일치) 시 null 반환 → 호출부에서 원문 마크다운으로 폴백.
 */
export function parseDailyHoroscope(content: string): DailyHoroscopeData | null {
  if (!content) return null;
  const strip = (s: string) => s.replace(/\*\*/g, "").trim();
  const rawLines = content.split("\n");
  const lines = rawLines.map((l) => l.trim());

  // 타이틀: "... 운세 리딩" 또는 "... Horoscope Reading"
  const titleIdx = lines.findIndex((l) => /운세\s*리딩|Horoscope Reading/i.test(l));
  if (titleIdx === -1) return null;
  const title = strip(lines[titleIdx]);

  // 종합 점수: "64/100"
  const overallIdx = lines.findIndex((l) => /\d{1,3}\s*\/\s*100/.test(l));
  const overall = overallIdx !== -1
    ? parseInt(lines[overallIdx].match(/(\d{1,3})\s*\/\s*100/)![1], 10)
    : 0;

  // 헤드라인(요약): 타이틀 다음 ~ 종합 점수 이전의 텍스트
  const summaryEnd = overallIdx !== -1 ? overallIdx : lines.length;
  const summary = lines
    .slice(titleIdx + 1, summaryEnd)
    .map(strip)
    .filter(Boolean)
    .join(" ");

  // 카테고리: "라벨 점수" 형태 4줄 (종합 점수 이후, 럭키 이전)
  const luckyStartIdx = lines.findIndex((l) => /럭키|Lucky/i.test(l));
  const catEnd = luckyStartIdx !== -1 ? luckyStartIdx : lines.length;
  const categories: { label: string; score: number }[] = [];
  for (const l of lines.slice(overallIdx + 1, catEnd)) {
    const m = strip(l).match(/^(.+?)\s+(\d{1,3})$/);
    if (m && Number(m[2]) <= 100) categories.push({ label: m[1].trim(), score: Number(m[2]) });
  }

  // 럭키: "럭키 컬러: X" / "Lucky Color: X"
  const luckyVal = (re: RegExp) => {
    const line = lines.find((l) => re.test(l));
    return line ? strip(line).split(":").slice(1).join(":").trim() : undefined;
  };
  const lucky = {
    color: luckyVal(/(럭키\s*컬러|Lucky Color)/i),
    number: luckyVal(/(럭키\s*넘버|Lucky Number)/i),
    item: luckyVal(/(럭키\s*아이템|Lucky Item)/i),
  };

  // 섹션 헤더 다음 줄 = 본문
  const afterHeader = (re: RegExp) => {
    const i = lines.findIndex((l) => re.test(strip(l)) && strip(l).length < 40);
    if (i === -1) return undefined;
    for (let j = i + 1; j < lines.length; j++) {
      if (strip(lines[j])) return strip(lines[j]);
    }
    return undefined;
  };
  const astrology = afterHeader(/^Western Astrology$/i);
  const saju = afterHeader(/^Four Pillars$/i);

  // advice: 프롬프트 v4 템플릿엔 별도 블록이 없어 대개 없음(있으면 표기)
  const advice = luckyVal(/(오늘의\s*조언|Today's Advice)/i);

  return { title, summary, overall, categories, advice, lucky, astrology, saju };
}

function ScoreRing({ score, outOfLabel }: { score: number; outOfLabel: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const dash = circumference * pct;
  return (
    <div style={{ position: "relative", width: 116, height: 116, flexShrink: 0 }}>
      <svg width="116" height="116" viewBox="0 0 116 116">
        <circle cx="58" cy="58" r={radius} fill="none" stroke="#E8DFC8" strokeWidth="6" />
        <circle
          cx="58" cy="58" r={radius} fill="none" stroke="#8B1E3F" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 58 58)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-crimson), 'Noto Serif KR', serif", fontSize: 30, fontWeight: 600, color: "#3D3833", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10.5, color: "#8A7F6B", marginTop: 3 }}>{outOfLabel}</span>
      </div>
    </div>
  );
}

function CategoryStat({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: "var(--font-crimson), 'Noto Serif KR', serif", fontSize: 20, fontWeight: 600, color: "#3D3833", lineHeight: 1.1 }}>{score}</div>
      <div style={{ fontSize: 11.5, color: "#9A8F7A", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/**
 * 리포트 페이지 안에 들어가는 데일리 운세 카드 (전체화면 래퍼 없음).
 * @param locale  "ko" | "en" — 정적 라벨 언어. 기본 "en".
 * @param data    파싱된 운세 데이터.
 */
export default function DailyHoroscopeCard({ locale = "en", data }: { locale?: "ko" | "en"; data: DailyHoroscopeData }) {
  const t = STRINGS[locale] ?? STRINGS.en;
  return (
    <div style={{ width: "100%", background: "#FBF8F0", borderRadius: 20, border: "1px solid #E8DFC8", padding: "26px 26px 24px", boxShadow: "0 1px 2px rgba(61,56,51,0.04)" }}>
      {/* Title */}
      <div style={{ fontFamily: "var(--font-crimson), 'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: "#3D3833", marginBottom: 6 }}>
        {data.title}
      </div>

      {/* Summary (headline) */}
      {data.summary && (
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5C5346", margin: "0 0 22px" }}>{data.summary}</p>
      )}

      {/* Score ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <ScoreRing score={data.overall} outOfLabel={t.outOf} />
      </div>

      <div style={{ height: 1, background: "#EDE3CC", margin: "0 0 16px" }} />

      {/* Categories */}
      {data.categories.length > 0 && (
        <div style={{ display: "flex", marginBottom: 22 }}>
          {data.categories.map((c) => (
            <CategoryStat key={c.label} label={c.label} score={c.score} />
          ))}
        </div>
      )}

      {/* Today's advice (프롬프트에 있을 때만) */}
      {data.advice && (
        <div style={{ background: "#F6EFDD", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8B1E3F", marginBottom: 6 }}>{t.adviceLabel}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3D3833", margin: 0 }}>{data.advice}</p>
        </div>
      )}

      {/* Lucky points */}
      {(data.lucky.color || data.lucky.number || data.lucky.item) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5C5346", padding: "12px 2px", marginBottom: 16 }}>
          {data.lucky.color && (<span><span style={{ color: "#9A8F7A" }}>{t.luckyColor} </span>{data.lucky.color}</span>)}
          {data.lucky.number && (<span><span style={{ color: "#9A8F7A" }}>{t.luckyNumber} </span>{data.lucky.number}</span>)}
          {data.lucky.item && (<span><span style={{ color: "#9A8F7A" }}>{t.luckyItem} </span>{data.lucky.item}</span>)}
        </div>
      )}

      {/* Astrology + Saju */}
      {(data.astrology || data.saju) && (
        <div style={{ borderTop: "1px dashed #E3D9C2", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {data.astrology && (
            <div>
              <div style={{ fontSize: 11, color: "#A08F6A", marginBottom: 4 }}>{t.astrologyLabel}</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5C5346", margin: 0 }}>{data.astrology}</p>
            </div>
          )}
          {data.saju && (
            <div>
              <div style={{ fontSize: 11, color: "#A08F6A", marginBottom: 4 }}>{t.sajuLabel}</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5C5346", margin: 0 }}>{data.saju}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
