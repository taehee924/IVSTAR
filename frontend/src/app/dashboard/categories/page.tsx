"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

const REPORT_TYPES = [
  { type: "daily", label: "2026 Horoscope", description: "#MonthlyFlow #TurningPoints #WhatsAhead", price: "$1.99", category: "about" },
  { type: "general", label: "About Me", description: "#Personality #Strengths #LifePath", price: "$0.99", category: "about" },
  { type: "life_cycle", label: "Life Cycle", description: "#BigPicture #LifeSeasons #TurningPoint", price: "$0.99", category: "about" },
  { type: "love", label: "Couple", description: "#Chemistry #Tension #Compatibility", price: "$0.99", category: "love" },
  { type: "crush", label: "Crush", description: "#CrushEnergy #SecretFeelings #NextMove", price: "$0.99", category: "love" },
  { type: "ex", label: "Ex", description: "#YourEx #LingeringFeelings #SecondChance", price: "$0.99", category: "love" },
  { type: "situationship", label: "Situationship", description: "#MixedSignals #RedFlags #NextStep", price: "$0.99", category: "love" },
  { type: "career", label: "Career", description: "#CareerPath #SuccessFlow #Potential", price: "$0.99", category: "money" },
  { type: "wealth", label: "Wealth", description: "#WealthFlow #MoneyMindset #Abundance", price: "$0.99", category: "money" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "about", label: "Discovery" },
  { key: "money", label: "Money" },
  { key: "love", label: "Love" },
  { key: "other", label: "Other" },
];

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

  const handleCardClick = (type: string) => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (PAIR_TYPES.has(type)) {
      router.push(`/dashboard/report/pair?type=${type}`);
    } else {
      router.push(`/dashboard/report/new?type=${type}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] pt-14 pb-8">
      <Header />
      <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-4">
        <h1 className="text-lg font-semibold text-gray-800">Theme</h1>
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
            <div key={r.type + r.label} onClick={() => handleCardClick(r.type)} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-[#EAE2D0] h-32 lg:h-40 flex items-center justify-center">
                <span className="text-[#A89880] text-3xl">✦</span>
              </div>
              <div className="bg-[#EDE8DC] p-3 flex flex-col">
                <p className="font-medium text-sm text-gray-800">{r.label}</p>
                <p className="text-xs text-gray-500 min-h-[2.5rem]">{r.description}</p>
                <p className="text-xs font-semibold text-gray-700 mt-1">{r.price}</p>
              </div>
            </div>
          ))}
        </div>
        {!session && (
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4 text-center space-y-2">
            <p className="text-sm text-gray-600">Sign in to unlock your personalized readings</p>
            <button onClick={() => router.push("/login")} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">Sign In</button>
          </div>
        )}
      </div>
    </main>
  );
}
