"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
} from "manseryeok";

type Gender = "male" | "female";

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

const YEARS = Array.from({ length: 100 }, (_, i) => 2006 - i);
const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function calculateChartStrength(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  for (const p of pillarList) {
    const stemEl = getHeavenlyStemElement(p.heavenlyStem);
    const branchEl = getEarthlyBranchElement(p.earthlyBranch);
    if (stemEl && elements[stemEl] !== undefined) elements[stemEl]++;
    if (branchEl && elements[branchEl] !== undefined) elements[branchEl]++;
  }
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(elements));
  if (max >= total * 0.4) return "Strong";
  if (max <= total * 0.2) return "Scattered";
  return "Balanced";
}

function getDominantElement(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  for (const p of pillarList) {
    const stemEl = getHeavenlyStemElement(p.heavenlyStem);
    const branchEl = getEarthlyBranchElement(p.earthlyBranch);
    if (stemEl && elements[stemEl] !== undefined) elements[stemEl]++;
    if (branchEl && elements[branchEl] !== undefined) elements[branchEl]++;
  }
  return Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
}

// ── useSearchParams를 사용하는 컴포넌트 분리 ──
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmpm] = useState("AM");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = year && month
    ? Array.from({ length: getDaysInMonth(Number(year), Number(month)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  const isValid =
    name.trim() !== "" &&
    year !== "" && month !== "" && day !== "" &&
    country !== "" && city !== "" &&
    gender !== "";

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      let birthTime = null;
      if (!timeUnknown && hour && minute) {
        let h = parseInt(hour);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        birthTime = `${String(h).padStart(2, "0")}:${minute}`;
      }

      const birthPlace = `${city}, ${country}`;
      const [y, m, d] = birthDate.split("-").map(Number);
      const h = birthTime ? parseInt(birthTime.split(":")[0]) : 12;
      const min = birthTime ? parseInt(birthTime.split(":")[1]) : 0;

      const pillars = calculateFourPillars({ year: y, month: m, day: d, hour: h, minute: min });
      const dayMaster = pillars.day.heavenlyStem;
      const dominantElement = getDominantElement(pillars);
      const chartStrength = calculateChartStrength(pillars);

      const [profileRes, nameRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({
              birth_date: birthDate,
              birth_time: birthTime,
              birth_place: birthPlace,
              gender,
              year_pillar: `${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}`,
              month_pillar: `${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}`,
              day_pillar: `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`,
              hour_pillar: `${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}`,
              day_master: dayMaster,
              dominant_element: dominantElement,
              chart_strength: chartStrength,
            }),
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({ name: name.trim() }),
          }
        ),
      ]);

      if (!profileRes.ok) throw new Error("Failed to save birth profile");
      if (!nameRes.ok) throw new Error("Failed to save name");
      router.push(redirect);
    } catch (e: any) {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full rounded-lg border border-[#DDD8CE] bg-[#EDE8DC] px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F0E6] p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black tracking-tight">
            Tell us about yourself
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We need your birth details to generate your personalized readings.
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-6 shadow-sm space-y-5">

          {/* 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <div className="grid grid-cols-3 gap-2">
                <select value={hour} onChange={(e) => setHour(e.target.value)} className={selectClass}>
                  <option value="">Hour</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className={selectClass}>
                  <option value="">Min</option>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select value={ampm} onChange={(e) => setAmpm(e.target.value)} className={selectClass}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
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
              I don't know my birth time
            </label>
          </div>

          {/* 태어난 장소 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Birth Place <span className="text-red-400">*</span>
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
                placeholder={COUNTRIES.find(c => c.name === country)?.city_placeholder ?? "City"}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={selectClass}
              />
            )}
          </div>

          {/* 성별 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-lg border py-2.5 text-sm font-medium capitalize transition-colors ${
                    gender === g
                      ? "border-violet-500 bg-violet-500/10 text-violet-700"
                      : "border-[#DDD8CE] bg-[#EDE8DC] text-gray-600 hover:bg-[#E4DFCF]"
                  }`}
                >
                  {g === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-gray-700"
          >
            {loading ? "Saving..." : "Continue →"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ── 메인 export: Suspense로 감싸기 ──
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F0E6]">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}