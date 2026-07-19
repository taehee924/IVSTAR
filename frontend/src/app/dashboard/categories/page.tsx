"use client";
// v2
import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

const REPORT_TYPES = [
  { type: "daily", label: "2026 Horoscope", description: "", price: "2 Stars", category: "about" },
  { type: "general", label: "About Me", description: "", price: "1 Star", category: "about" },
  { type: "life_cycle", label: "Life Cycle", description: "", price: "1 Star", category: "about" },
  { type: "love", label: "Couple", description: "", price: "1 Star", category: "love" },
  { type: "crush", label: "Crush", description: "", price: "1 Star", category: "love" },
  { type: "ex", label: "Ex", description: "", price: "1 Star", category: "love" },
  { type: "situationship", label: "Situationship", description: "", price: "1 Star", category: "love" },
  { type: "career", label: "Career", description: "", price: "Coming Soon", category: "money" },
  { type: "wealth", label: "Wealth", description: "", price: "Coming Soon", category: "money" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "about", label: "Discovery" },
  { key: "money", label: "Money" },
  { key: "love", label: "Love" },
  { key: "other", label: "Other" },
];

// 카드 좌측 상단 스타버스트(도장) 배지
function StarburstBadge({ text }: { text: string }) {
  return (
    <div className="absolute left-1.5 top-1.5 z-10 h-12 w-12 drop-shadow-md">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <polygon
          points="59.6,1.9 65.3,13.0 77.2,9.3 78.3,21.7 90.7,22.8 87.0,34.7 98.1,40.4 90.0,50.0 98.1,59.6 87.0,65.3 90.7,77.2 78.3,78.3 77.2,90.7 65.3,87.0 59.6,98.1 50.0,90.0 40.4,98.1 34.7,87.0 22.8,90.7 21.7,78.3 9.3,77.2 13.0,65.3 1.9,59.6 10.0,50.0 1.9,40.4 13.0,34.7 9.3,22.8 21.7,21.7 22.8,9.3 34.7,13.0 40.4,1.9 50.0,10.0"
          fill="#992222"
        />
        <polygon
          points="50.0,1.0 57.8,10.8 68.8,4.7 72.2,16.7 84.6,15.4 83.3,27.8 95.3,31.2 89.2,42.2 99.0,50.0 89.2,57.8 95.3,68.8 83.3,72.2 84.6,84.6 72.2,83.3 68.8,95.3 57.8,89.2 50.0,99.0 42.2,89.2 31.2,95.3 27.8,83.3 15.4,84.6 16.7,72.2 4.7,68.8 10.8,57.8 1.0,50.0 10.8,42.2 4.7,31.2 16.7,27.8 15.4,15.4 27.8,16.7 31.2,4.7 42.2,10.8"
          fill="#C62F2F"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold uppercase tracking-tight text-white">
        {text}
      </span>
    </div>
  );
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = REPORT_TYPES.filter((r) => {
    const matchTab = activeTab === "all" || r.category === activeTab;
    const matchSearch = search === "" || r.label.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const PAIR_TYPES = new Set(["crush", "ex", "situationship", "love"]);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const handleCardClick = async (type: string) => {
    const targetUrl = `/dashboard/report/new?type=${type}`;

    // 비로그인 → 로그인 후 온보딩 → 리포트
    if (!session) {
      const onboardingUrl = `/onboarding?redirect=${encodeURIComponent(targetUrl)}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(onboardingUrl)}`);
      return;
    }

    // 로그인 상태 → 프로필 있는지 체크
    setCheckingProfile(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`, {
        headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
      });
      const profiles = await res.json();
      if (!Array.isArray(profiles) || profiles.length === 0) {
        // 프로필 없음 → 온보딩 먼저
        router.push(`/onboarding?redirect=${encodeURIComponent(targetUrl)}`);
      } else {
        router.push(targetUrl);
      }
    } catch {
      router.push(targetUrl);
    } finally {
      setCheckingProfile(false);
    }
  };

  return (
    <main className="min-h-screen pt-14 pb-8">
      <Header />
      <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-4">
        <h1 className="text-[21px] font-semibold text-gray-800">Theme</h1>
        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search readings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-[#DDD8CE] bg-[#EDE8DC] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-[#EDE8DC]"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((r) => (
            <div key={r.type + r.label} onClick={() => !checkingProfile && handleCardClick(r.type)} className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${checkingProfile ? "opacity-60 pointer-events-none" : ""}`}>
              {["daily", "general", "love", "life_cycle", "ex", "crush", "career", "wealth", "situationship"].includes(r.type) ? (
                <div className="relative aspect-[3/4] w-full">
                  {r.type === "daily" && <StarburstBadge text="Best" />}
                  {r.type === "ex" && <StarburstBadge text="Hot" />}
                  {(r.type === "career" || r.type === "wealth") && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <span className="border-2 border-[#992222] bg-[#C62F2F] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-tight text-white drop-shadow-md">
                        Coming Soon
                      </span>
                    </div>
                  )}
                  <Image
                    src={
                      r.type === "daily" ? "/horoscope.png" :
                      r.type === "general" ? "/aboutme.png" :
                      r.type === "love" ? "/couple.png" :
                      r.type === "life_cycle" ? "/lifecycle.png" :
                      r.type === "ex" ? "/ex.png" :
                      r.type === "crush" ? "/crush.png" :
                      r.type === "career" ? "/career.png" :
                      r.type === "wealth" ? "/wealth.png" :
                      "/situationship.png"
                    }
                    alt={r.label}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div className="bg-[#EAE2D0] h-32 lg:h-40 flex items-center justify-center">
                  <span className="text-[#A89880] text-3xl">✦</span>
                </div>
              )}
              <div className="bg-[#EDE8DC] p-3 flex items-center justify-between">
                <p className="font-medium text-sm text-gray-800 truncate">{r.label}</p>
                <p className="shrink-0 text-xs font-semibold text-gray-700">{r.price}</p>
              </div>
            </div>
          ))}
        </div>
        {!session && (
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4 text-center space-y-2">
            <p className="text-sm text-gray-600">Sign in to unlock your personalized readings</p>
            <Link href="/login?callbackUrl=%2Fdashboard%2Fcategories" className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">Sign In</Link>
          </div>
        )}
      </div>
    </main>
  );
}
