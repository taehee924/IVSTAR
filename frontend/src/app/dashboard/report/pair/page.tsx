"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import ConstellationLoader from "@/components/ConstellationLoader";
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
} from "manseryeok";

// ── 상수 ──────────────────────────────────────────────────────────
const REPORT_LABELS: Record<string, string> = {
  crush: "Crush",
  ex: "Ex",
  situationship: "Situationship",
  love: "Couple",
};

const PARTNER_LABELS: Record<string, string> = {
  crush: "Their",
  ex: "Their",
  situationship: "Their",
  love: "Partner",
};

const COUNTRIES = [
  { name: "South Korea", city_placeholder: "e.g. Seoul" },
  { name: "United States", city_placeholder: "e.g. New York" },
  { name: "Japan", city_placeholder: "e.g. Tokyo" },
  { name: "China", city_placeholder: "e.g. Beijing" },
  { name: "United Kingdom", city_placeholder: "e.g. London" },
  { name: "Canada", city_placeholder: "e.g. Toronto" },
  { name: "Australia", city_placeholder: "e.g. Sydney" },
  { name: "Germany", city_placeholder: "e.g. Berlin" },
  { name: "France", city_placeholder: "e.g. Paris" },
  { name: "Singapore", city_placeholder: "e.g. Singapore" },
  { name: "Hong Kong", city_placeholder: "e.g. Hong Kong" },
  { name: "Taiwan", city_placeholder: "e.g. Taipei" },
  { name: "Vietnam", city_placeholder: "e.g. Ho Chi Minh City" },
  { name: "Thailand", city_placeholder: "e.g. Bangkok" },
  { name: "Brazil", city_placeholder: "e.g. São Paulo" },
  { name: "Mexico", city_placeholder: "e.g. Mexico City" },
  { name: "India", city_placeholder: "e.g. Mumbai" },
  { name: "Other", city_placeholder: "e.g. Your city" },
];

const YEARS = Array.from({ length: 107 }, (_, i) => 2026 - i);
const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0~23
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getDominantElement(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const se = getHeavenlyStemElement(p.heavenlyStem);
    const be = getEarthlyBranchElement(p.earthlyBranch);
    if (se && elements[se] !== undefined) elements[se]++;
    if (be && elements[be] !== undefined) elements[be]++;
  }
  return Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
}

function calculateChartStrength(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const se = getHeavenlyStemElement(p.heavenlyStem);
    const be = getEarthlyBranchElement(p.earthlyBranch);
    if (se && elements[se] !== undefined) elements[se]++;
    if (be && elements[be] !== undefined) elements[be]++;
  }
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(elements));
  if (max >= total * 0.4) return "Strong";
  if (max <= total * 0.2) return "Scattered";
  return "Balanced";
}

// ── useSearchParams를 사용하는 컴포넌트 분리 ──
function PairReportContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "crush";
  const promoCode = searchParams.get("promo_code") ?? null;

  const partnerLabel = PARTNER_LABELS[type] ?? "Their";
  const readingLabel = REPORT_LABELS[type] ?? type;

  // 파트너 기본 정보
  const [partnerName, setPartnerName] = useState("");
  const [partnerGender, setPartnerGender] = useState("");

  // 생년월일 드롭다운
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  // 시간 드롭다운
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);

  // 태어난 장소
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 페이지 진입 시 프로필 체크 → 없으면 온보딩으로
  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`, {
      headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
    })
      .then((res) => res.json())
      .then((profiles) => {
        if (!Array.isArray(profiles) || profiles.length === 0) {
          const currentUrl = `/dashboard/report/pair?type=${type}${promoCode ? `&promo_code=${promoCode}` : ""}`;
          router.replace(`/onboarding?redirect=${encodeURIComponent(currentUrl)}`);
        }
      })
      .catch(() => {});
  }, [session]);

  const days = year && month
    ? Array.from({ length: getDaysInMonth(Number(year), Number(month)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  const isValid = year !== "" && month !== "" && day !== "";

  const selectClass =
    "w-full rounded-lg border border-[#DDD8CE] bg-[#EDE8DC] px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400";

  const handleCreate = async () => {
    if (!session) { router.push("/login"); return; }
    if (!isValid) { setError("Please enter their date of birth."); return; }

    setLoading(true);
    setError("");

    const partnerBirthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let partnerBirthTime: string | null = null;
    if (!timeUnknown && hour !== "" && minute) {
      partnerBirthTime = `${String(parseInt(hour)).padStart(2, "0")}:${minute}`;
    }
    const partnerBirthPlace = country && city ? `${city}, ${country}` : (city || country || null);
    const [py, pm, pd] = partnerBirthDate.split("-").map(Number);
    const ph = partnerBirthTime ? parseInt(partnerBirthTime.split(":")[0]) : 12;
    const pmin = partnerBirthTime ? parseInt(partnerBirthTime.split(":")[1]) : 0;
    const pendingOrderId = sessionStorage.getItem("ivstar_pending_order_id");
    const useStar = sessionStorage.getItem("ivstar_use_star") === "true";
    const starCost = parseInt(sessionStorage.getItem("ivstar_star_cost") ?? "1", 10);

    try {
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
        { headers: { Authorization: `Bearer ${(session as any)?.id_token}` } }
      );
      if (!profileRes.ok) throw new Error("Failed to load birth profile.");
      const profiles = await profileRes.json();
      if (profiles.length === 0) {
        router.push(`/onboarding?redirect=/dashboard/report/pair?type=${type}`);
        return;
      }
      const profile = profiles[0];

      const pillars = calculateFourPillars({ year: py, month: pm, day: pd, hour: ph, minute: pmin });

      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/pair/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.id_token}` },
          body: JSON.stringify({
            birth_profile_id: profile.id,
            report_type: type,
            price: 0.99,
            promo_code: promoCode,
            use_star: useStar,
            star_cost: starCost,
            partner_name: partnerName || null,
            partner_birth_date: partnerBirthDate,
            partner_birth_time: partnerBirthTime,
            partner_birth_place: partnerBirthPlace,
            partner_gender: partnerGender || null,
            partner_year_pillar: `${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}`,
            partner_month_pillar: `${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}`,
            partner_day_pillar: `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`,
            partner_hour_pillar: `${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}`,
            partner_day_master: pillars.day.heavenlyStem,
            partner_dominant_element: getDominantElement(pillars),
            partner_chart_strength: calculateChartStrength(pillars),
          }),
        }
      );
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        if (reportRes.status === 503) throw new Error("Our AI is busy right now. Please try again in a moment.");
        throw new Error(errData.detail ?? "Failed to generate report.");
      }
      const report = await reportRes.json();

      if (useStar) {
        sessionStorage.removeItem("ivstar_use_star");
        sessionStorage.removeItem("ivstar_star_cost");
      }

      // PayPal 결제 완료된 경우 → 캡처
      if (pendingOrderId) {
        const captureRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/paypal/capture`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.id_token}` },
            body: JSON.stringify({ paypal_order_id: pendingOrderId, report_id: report.id }),
          }
        );
        sessionStorage.removeItem("ivstar_pending_order_id");
        if (!captureRes.ok) throw new Error("Payment capture failed. Please contact support.");
      }

      router.push(`/dashboard/report/${report.id}`);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (loading) return <ConstellationLoader />;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black tracking-tight">
            {readingLabel} Reading
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter their information below.
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-6 shadow-sm space-y-5">

          {/* 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {partnerLabel} Name <span className="text-gray-400 text-xs"></span>
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. Alex"
              className={selectClass}
            />
          </div>

          {/* 생년월일 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
                <option value="">Month</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className={selectClass}>
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 태어난 시간 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Time of Birth{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            {!timeUnknown && (
              <div className="grid grid-cols-2 gap-2">
                <select value={hour} onChange={(e) => setHour(e.target.value)} className={selectClass}>
                  <option value="">Hour</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                  ))}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className={selectClass}>
                  <option value="">Min</option>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={timeUnknown}
                onChange={(e) => setTimeUnknown(e.target.checked)}
                className="rounded"
              />
              I don't know their birth time
            </label>
          </div>

          {/* 태어난 장소 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Birth Place <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            {country && (
              <input
                type="text"
                placeholder={COUNTRIES.find((c) => c.name === country)?.city_placeholder ?? "City"}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={selectClass}
              />
            )}
          </div>

          {/* 성별 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Gender <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <select
              value={partnerGender}
              onChange={(e) => setPartnerGender(e.target.value)}
              className={selectClass}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-gray-700"
          >
            {loading ? "Generating reading..." : "Get Reading"}
          </button>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
      </div>
    </main>
  );
}

// ── 메인 export: Suspense로 감싸기 ──
export default function PairReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">Loading...</div>}>
      <PairReportContent />
    </Suspense>
  );
}