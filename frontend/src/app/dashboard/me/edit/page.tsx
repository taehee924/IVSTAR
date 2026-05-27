"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
} from "manseryeok";

const AVATARS = [
  "/avatars/rat.png",
  "/avatars/cow.png",
  "/avatars/tiger.png",
  "/avatars/rabbit.png",
  "/avatars/dragon.png",
  "/avatars/snake.png",
  "/avatars/horse.png",
  "/avatars/sheep.png",
  "/avatars/monkey.png",
  "/avatars/chicken.png",
  "/avatars/dog.png",
  "/avatars/pig.png",
];
const AVATAR_KEY = "ivstar_avatar";
const NAME_KEY = "ivstar_display_name";

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
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0~23
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Avatar
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editHour, setEditHour] = useState("");
  const [editMinute, setEditMinute] = useState("");
  const [editTimeUnknown, setEditTimeUnknown] = useState(false);
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editGender, setEditGender] = useState("");

  const editDays =
    editYear && editMonth
      ? Array.from({ length: getDaysInMonth(Number(editYear), Number(editMonth)) }, (_, i) => i + 1)
      : Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/login");
      return;
    }
    if (!session) return;

    const saved = localStorage.getItem(AVATAR_KEY);
    if (saved) setSelectedAvatar(saved);

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
          { headers: { Authorization: `Bearer ${(session as any)?.id_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const p: BirthProfile = data[0];
            setProfile(p);

            const savedName = localStorage.getItem(NAME_KEY);
            setEditName(savedName ?? session?.user?.name ?? "");

            const [y, m, d] = (p.birth_date ?? "").split("-");
            setEditYear(y ?? "");
            setEditMonth(m ? String(parseInt(m)) : "");
            setEditDay(d ? String(parseInt(d)) : "");

            if (p.birth_time) {
              const [h, min] = p.birth_time.split(":");
              setEditHour(String(parseInt(h)));
              setEditMinute(min ?? "00");
              setEditTimeUnknown(false);
            } else {
              setEditTimeUnknown(true);
            }

            const parts = (p.birth_place ?? "").split(", ");
            setEditCity(parts[0] ?? "");
            setEditCountry(parts.slice(1).join(", ") ?? "");
            setEditGender(p.gender ?? "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPageLoading(false);
      }
    };

    fetchProfile();
  }, [session, status]);

  const handleAvatarSelect = (src: string) => {
    setSelectedAvatar(src);
    localStorage.setItem(AVATAR_KEY, src);
    setShowAvatarModal(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const birthDate =
        editYear && editMonth && editDay
          ? `${editYear}-${String(editMonth).padStart(2, "0")}-${String(editDay).padStart(2, "0")}`
          : null;

      let birthTime = null;
      if (!editTimeUnknown && editHour !== "" && editMinute) {
        birthTime = `${String(parseInt(editHour)).padStart(2, "0")}:${editMinute}`;
      }

      const birthPlace = editCity && editCountry ? `${editCity}, ${editCountry}` : null;

      let sajuPayload = {};
      if (birthDate) {
        const [y, m, d] = birthDate.split("-").map(Number);
        const h = birthTime ? parseInt(birthTime.split(":")[0]) : 12;
        const min = birthTime ? parseInt(birthTime.split(":")[1]) : 0;
        const pillars = calculateFourPillars({ year: y, month: m, day: d, hour: h, minute: min });
        sajuPayload = {
          year_pillar: `${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}`,
          month_pillar: `${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}`,
          day_pillar: `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`,
          hour_pillar: `${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}`,
          day_master: pillars.day.heavenlyStem,
          dominant_element: getDominantElement(pillars),
          chart_strength: calculateChartStrength(pillars),
        };
      }

      const requests: Promise<Response>[] = [
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/${profile.id}`, {
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
        }),
      ];

      const trimmedName = editName.trim();
      const currentName = localStorage.getItem(NAME_KEY) ?? session?.user?.name ?? "";
      if (trimmedName && trimmedName !== currentName) {
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

      if (trimmedName) localStorage.setItem(NAME_KEY, trimmedName);

      router.push("/dashboard/me");
    } catch (e) {
      console.error(e);
      alert("Error saving profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const displayName = editName || session?.user?.name || "";

  const selectClass =
    "w-full rounded-lg border border-[#DDD8CE] bg-[#FFFBF5] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400";

  if (status === "loading" || pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-14 pb-12">
      <Header />
      <div className="w-full max-w-md mx-auto px-4 pt-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>

        {/* Avatar */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#EDE8DC] flex items-center justify-center">
              <Image src={selectedAvatar ?? "/avatars/dragon.png"} alt="avatar" fill style={{ objectFit: "cover" }} />
            </div>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-600 transition-colors shadow-sm"
              aria-label="Change avatar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar Modal */}
        {showAvatarModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAvatarModal(false)}
          >
            <div
              className="bg-[#FFFBF5] rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-800 mb-4">Choose your avatar</h3>
              <div className="grid grid-cols-3 gap-4">
                {AVATARS.map((src) => (
                  <button
                    key={src}
                    onClick={() => handleAvatarSelect(src)}
                    className={`relative aspect-square rounded-full overflow-hidden border-2 transition-colors ${
                      selectedAvatar === src
                        ? "border-gray-800"
                        : "border-[#DDD8CE] hover:border-gray-400"
                    }`}
                  >
                    <Image src={src} alt="avatar option" fill style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="mt-5 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Name */}
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

        {/* Birth Info */}
        {!profile ? (
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4 text-center space-y-1">
            <p className="text-sm text-gray-400">No birth info yet.</p>
            <button
              onClick={() => router.push("/onboarding")}
              className="text-violet-600 underline text-sm"
            >
              Add now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date of Birth */}
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

            {/* Time of Birth */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Time of Birth</label>
              {!editTimeUnknown && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={editHour} onChange={(e) => setEditHour(e.target.value)} className={selectClass}>
                    <option value="">Hour</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                    ))}
                  </select>
                  <select value={editMinute} onChange={(e) => setEditMinute(e.target.value)} className={selectClass}>
                    <option value="">Min</option>
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
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

            {/* Birth Place */}
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
                  placeholder={COUNTRIES.find((c) => c.name === editCountry)?.city_placeholder ?? "City"}
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className={selectClass + " mt-2"}
                />
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Gender</label>
              <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className={selectClass}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSaveProfile}
          disabled={saveLoading || !profile}
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saveLoading ? "Saving..." : "Save"}
        </button>

        <div className="border-t border-[#DDD8CE] pt-4">
          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ↪ Logout
          </button>
        </div>

      </div>
    </main>
  );
}
