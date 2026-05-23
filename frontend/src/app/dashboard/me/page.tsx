"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { LoginButtons } from "@/components/auth/LoginButtons";
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
} from "manseryeok";

function getDominantElement(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const s = getHeavenlyStemElement(p.heavenlyStem);
    const b = getEarthlyBranchElement(p.earthlyBranch);
    if (s && elements[s] !== undefined) elements[s]++;
    if (b && elements[b] !== undefined) elements[b]++;
  }
  return Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
}

function calculateChartStrength(pillars: any): string {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const s = getHeavenlyStemElement(p.heavenlyStem);
    const b = getEarthlyBranchElement(p.earthlyBranch);
    if (s && elements[s] !== undefined) elements[s]++;
    if (b && elements[b] !== undefined) elements[b]++;
  }
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(elements));
  if (max >= total * 0.4) return "Strong";
  if (max <= total * 0.2) return "Scattered";
  return "Balanced";
}

interface Report {
  id: number;
  report_type: string;
  created_at: string;
  is_unlocked: boolean;
}

interface BirthProfile {
  id: number;
  birth_date: string;
  birth_time: string | null;
  birth_place: string | null;
  gender: string | null;
}

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
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

const REPORT_LABELS: Record<string, string> = {
  general: "About Me",
  life_cycle: "Life Cycles",
  year_ahead: "Your Year Ahead",
  daily: "2026 Horoscope",
  love: "Couple Reading",
  crush: "Crush Reading",
  ex: "Ex Reading",
  situationship: "Situationship Reading",
  career: "Career Reading",
  wealth: "Wealth Reading",
  health: "Health Reading",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);

  // Birth Profile
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Edit 폼 state
  const [editName, setEditName] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [editYear, setEditYear] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editHour, setEditHour] = useState("");
  const [editMinute, setEditMinute] = useState("");
  const [editAmpm, setEditAmpm] = useState("AM");
  const [editTimeUnknown, setEditTimeUnknown] = useState(false);
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editGender, setEditGender] = useState("");

  const editDays = editYear && editMonth
    ? Array.from({ length: getDaysInMonth(Number(editYear), Number(editMonth)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, profileRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/`, {
            headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`, {
            headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
          }),
        ]);

        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.length > 0) setProfile(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchData();
    else setLoading(false);
  }, [session]);

  const handleStartEdit = () => {
    if (!profile) return;

    setEditName(displayName ?? session?.user?.name ?? "");

    const [y, m, d] = (profile.birth_date ?? "").split("-");
    setEditYear(y ?? "");
    setEditMonth(m ? String(parseInt(m)) : "");
    setEditDay(d ? String(parseInt(d)) : "");

    if (profile.birth_time) {
      const [h, min] = profile.birth_time.split(":");
      const hNum = parseInt(h);
      setEditAmpm(hNum >= 12 ? "PM" : "AM");
      setEditHour(String(hNum > 12 ? hNum - 12 : hNum === 0 ? 12 : hNum));
      setEditMinute(min ?? "00");
      setEditTimeUnknown(false);
    } else {
      setEditHour("");
      setEditMinute("");
      setEditTimeUnknown(true);
    }

    const parts = (profile.birth_place ?? "").split(", ");
    setEditCity(parts[0] ?? "");
    setEditCountry(parts.slice(1).join(", ") ?? "");
    setEditGender(profile.gender ?? "");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const birthDate = editYear && editMonth && editDay
        ? `${editYear}-${String(editMonth).padStart(2, "0")}-${String(editDay).padStart(2, "0")}`
        : null;

      let birthTime = null;
      if (!editTimeUnknown && editHour && editMinute) {
        let h = parseInt(editHour);
        if (editAmpm === "PM" && h !== 12) h += 12;
        if (editAmpm === "AM" && h === 12) h = 0;
        birthTime = `${String(h).padStart(2, "0")}:${editMinute}`;
      }

      const birthPlace = editCity && editCountry ? `${editCity}, ${editCountry}` : null;

      // 사주 재계산
      let sajuPayload = {};
      if (birthDate) {
        const [y, m, d] = birthDate.split("-").map(Number);
        const h = birthTime ? parseInt(birthTime.split(":")[0]) : 12;
        const min = birthTime ? parseInt(birthTime.split(":")[1]) : 0;
        const pillars = calculateFourPillars({ year: y, month: m, day: d, hour: h, minute: min });
        sajuPayload = {
          year_pillar:  `${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}`,
          month_pillar: `${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}`,
          day_pillar:   `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`,
          hour_pillar:  `${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}`,
          day_master:   pillars.day.heavenlyStem,
          dominant_element: getDominantElement(pillars),
          chart_strength:   calculateChartStrength(pillars),
        };
      }

      // 이름 수정 + 출생정보 수정 동시 요청
      const requests: Promise<Response>[] = [
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/${profile.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({
              birth_date: birthDate,
              birth_time: birthTime,
              birth_place: birthPlace,
              gender: editGender || null,
              ...sajuPayload,
            }),
          }
        ),
      ];

      const trimmedName = editName.trim();
      if (trimmedName && trimmedName !== (displayName ?? session?.user?.name)) {
        requests.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({ name: trimmedName }),
          })
        );
      }

      const [profileRes, userRes] = await Promise.all(requests);

      if (!profileRes.ok) throw new Error("Error saving birth profile");
      if (userRes && !userRes.ok) throw new Error("Error saving user info");

      const updated = await profileRes.json();
      setProfile(updated);

      if (trimmedName) setDisplayName(trimmedName);

      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Error saving profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this reading?")) return;
    setDeletingReportId(reportId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/${reportId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete report");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error(e);
      alert("Error deleting report. Please try again.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to leave? All data will be deleted.")) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      console.error(e);
      alert("Error deleting account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const name = displayName ?? session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image;

  const selectClass = "w-full rounded-lg border border-[#DDD8CE] bg-[#F6F1E7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400";

  if (status !== "loading" && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F6F1E7] p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-0">
              <Image src="/icon.png" alt="IVSTAR Logo" width={160} height={160} priority />
            </div>
            <h1 className="text-3xl font-semibold text-black tracking-tight">IVSTAR</h1>
            <p className="mt-2 text-sm text-gray-500">This service is available after logging in.</p>
          </div>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-6 shadow-sm space-y-4">
            <p className="text-center text-sm text-gray-500">Sign in to access your personalized Saju & astrology insights</p>
            <LoginButtons />
          </div>
          <p className="text-center text-xs text-gray-400">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F1E7] pt-14 pb-8">
      <Header />
      <div className="w-full max-w-2xl lg:max-w-3xl mx-auto px-4 lg:px-8 pt-8 space-y-6">

        {/* 프로필 카드 */}
        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-gray-600">{name[0]}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-base text-gray-800">{name}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        {/* My Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700"> My Info</h2>
            {profile && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-xs text-gray-500 hover:text-gray-700 border border-[#DDD8CE] rounded-lg px-3 py-1.5 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4 space-y-3">
            {!profile ? (
              <div className="text-sm text-gray-400 text-center py-2">
                No birth info yet.{" "}
                <button onClick={() => router.push("/onboarding")} className="text-violet-600 underline">
                  Add now
                </button>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">

                {/* 이름 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={selectClass}
                  />
                </div>

                {/* 생년월일 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Date of Birth</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={editMonth} onChange={(e) => setEditMonth(e.target.value)} className={selectClass}>
                      <option value="">Month</option>
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select value={editDay} onChange={(e) => setEditDay(e.target.value)} className={selectClass}>
                      <option value="">Day</option>
                      {editDays.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select value={editYear} onChange={(e) => setEditYear(e.target.value)} className={selectClass}>
                      <option value="">Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 태어난 시간 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Time of Birth</label>
                  {!editTimeUnknown && (
                    <div className="grid grid-cols-3 gap-2">
                      <select value={editHour} onChange={(e) => setEditHour(e.target.value)} className={selectClass}>
                        <option value="">Hour</option>
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select value={editMinute} onChange={(e) => setEditMinute(e.target.value)} className={selectClass}>
                        <option value="">Min</option>
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select value={editAmpm} onChange={(e) => setEditAmpm(e.target.value)} className={selectClass}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={editTimeUnknown}
                      onChange={(e) => setEditTimeUnknown(e.target.checked)}
                      className="rounded"
                    />
                    I don't know my birth time
                  </label>
                </div>

                {/* 태어난 장소 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Birth Place</label>
                  <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className={selectClass}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {editCountry && (
                    <input
                      type="text"
                      placeholder={COUNTRIES.find(c => c.name === editCountry)?.city_placeholder ?? "City"}
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className={selectClass + " mt-2"}
                    />
                  )}
                </div>

                {/* 성별 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {saveLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-lg border border-[#DDD8CE] py-2 text-sm text-gray-600 hover:bg-[#F6F1E7] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "Name", value: displayName ?? session?.user?.name ?? "Unknown" },
                  { label: "Date of Birth", value: profile.birth_date },
                  { label: "Time of Birth", value: profile.birth_time ? profile.birth_time.slice(0, 5) : "Unknown" },
                  { label: "Birth Place", value: profile.birth_place ?? "Unknown" },
                  { label: "Gender", value: profile.gender ?? "Unknown" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Readings */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700"> My Readings ({reports.length})</h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-sm text-gray-400">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No readings yet.</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#EDE8DC] transition-colors">
                  <Link href={`/dashboard/report/${r.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      {REPORT_LABELS[r.report_type] ?? r.report_type}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteReport(r.id, e)}
                    disabled={deletingReportId === r.id}
                    className="ml-3 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-30"
                    aria-label="Delete reading"
                  >
                    {deletingReportId === r.id ? "..." : "×"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Credits */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700"> My Credits</h2>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">0 readings remaining</p>
            <Link
              href="/dashboard/categories"
              className="text-xs font-medium border border-[#DDD8CE] rounded-lg px-3 py-1.5 hover:bg-[#EDE8DC] transition-colors text-gray-600"
            >
              Get more →
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700"> Support</h2>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">Questions or issues?</p>
            <a
              href="mailto:sajuju0401@gmail.com"
              className="text-xs font-medium border border-[#DDD8CE] rounded-lg px-3 py-1.5 hover:bg-[#F6F1E7] transition-colors text-gray-600"
            >
              Contact us →
            </a>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ↪ Logout
        </button>

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
           {deleteLoading ? "Processing..." : "↪ Delete Account"}
        </button>

      </div>
    </main>
  );
}