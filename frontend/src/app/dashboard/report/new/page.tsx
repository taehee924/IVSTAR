"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import ConstellationLoader from "@/components/ConstellationLoader";

const REPORT_LABELS: Record<string, string> = {
  general: "About Me",
  life_cycle: "Life Cycle",
  year_ahead: "Your Year Ahead",
  daily: "2026 Horoscope",
  love: "Couple",
  crush: "Crush",
  ex: "Ex",
  situationship: "Situationship",
  career: "Career",
  wealth: "Wealth",
  health: "Health",
};

const PAIR_TYPES = new Set(["crush", "ex", "situationship", "love"]);

const WHAT_INSIDE: Record<string, string[]> = {
  daily: [
    "Your energy and mood month by month",
    "Key turning points and important timing",
    "Love, career, and money shifts throughout the year",
    "The months where opportunities grow strongest",
    "Challenges or emotional patterns to watch for",
    "A final message for your 2026 journey",
  ],
  general: [
    "Who you show up as in the world",
    "Your inner emotional world",
    "Your natural strengths",
    "The patterns holding you back",
    "Your life direction and personal growth",
    "A final message written only for you",
  ],
  ex: [
    "Why this connection felt impossible to ignore",
    "The truth about why it ended",
    "What your ex thinks about you now",
    "Do they still have feelings?",
    "The real chances of getting back together",
    "Your compatibility in real life, not just romance",
  ],
  crush: [
    "How your crush truly feels about you right now",
    "Are they emotionally available?",
    "Your attraction score & hidden chemistry level",
    "Full compatibility in love, lifestyle, and future",
    "Secret rivals and obstacles around you two",
    "Should you make a move now… or wait?",
  ],
  life_cycle: [
    "The energy shaping your current 10-year cycle",
    "Your love & relationship energy in this cycle",
    "Career & money flow, when to push, when to pause",
    "The years that may bring major shifts",
    "Mindset shifts and personal growth ahead",
    "How to work with your energy, not against it",
  ],
  situationship: [
    "How they see you right now",
    "The chemistry and mixed signals between you",
    "Is this growing or staying undefined?",
    "Red flags and emotional patterns to watch for",
    "The timing behind your next move",
    "What this could become in real life",
  ],
  love: [
    "Your relationship dynamic right now",
    "Your chemistry when you're together",
    "Who's more emotionally invested right now",
    "How compatible your love styles really are",
    "The tension and attraction between you two",
    "The real reason you keep clashing",
  ],
  career: [
    "Your natural blueprint for success",
    "The kind of work that brings your energy to life",
    "The relationships that help you grow",
    "The flow of money, luck, and opportunity around you",
    "Your recovery pattern for long-term success",
    "Where your talents are meant to expand most",
  ],
  wealth: [
    "Your natural relationship with money and abundance",
    "The income paths most aligned with your energy",
    "Your wealth strengths, blocks, and spending patterns",
    "The habits and environments that affect your money flow",
    "The people, connections, and opportunities tied to your success",
    "Your biggest wealth timing and financial turning points",
  ],
};

const PRICE_MAP: Record<string, number> = { daily: 1.99 };
const DEFAULT_PRICE = 0.99;
const STAR_COST_MAP: Record<string, number> = { daily: 2 };
const DEFAULT_STAR_COST = 1;

function NewReportContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "general";
  const PRICE = PRICE_MAP[type] ?? DEFAULT_PRICE;
  const STAR_COST = STAR_COST_MAP[type] ?? DEFAULT_STAR_COST;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [starBalance, setStarBalance] = useState<number>(0);

  // 페이지 진입 시 프로필 체크 + 스타 잔액 조회
  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`, {
      headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
    })
      .then((res) => res.json())
      .then((profiles) => {
        if (!Array.isArray(profiles) || profiles.length === 0) {
          router.replace(`/onboarding?redirect=${encodeURIComponent(`/dashboard/report/new?type=${type}`)}`);
        }
      })
      .catch(() => {});

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
    })
      .then((r) => r.json())
      .then((u) => setStarBalance(u.stars ?? 0))
      .catch(() => {});
  }, [session]);

  const handleUseStar = async () => {
    if (!session) { router.push("/login"); return; }
    if (PAIR_TYPES.has(type)) {
      sessionStorage.setItem("ivstar_use_star", "true");
      sessionStorage.setItem("ivstar_star_cost", String(STAR_COST));
      router.push(`/dashboard/report/pair?type=${type}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
        { headers: { Authorization: `Bearer ${(session as any)?.id_token}` } }
      );
      if (!profileRes.ok) throw new Error("Failed to load birth profiles.");
      const profiles = await profileRes.json();
      if (profiles.length === 0) {
        router.push(`/onboarding?redirect=/dashboard/report/new?type=${type}`);
        return;
      }
      const profile = profiles[0];
      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/full`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.id_token}` },
          body: JSON.stringify({ birth_profile_id: profile.id, report_type: type, price: PRICE, use_star: true, star_cost: STAR_COST }),
        }
      );
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        throw new Error(errData.detail ?? "Failed to create report.");
      }
      const report = await reportRes.json();
      router.push(`/dashboard/report/${report.id}`);
    } catch (e: any) {
      setError(e.message ?? "Error");
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!session) { router.push("/login"); return; }

    const savedPromo = sessionStorage.getItem("ivstar_promo_code") ?? "";

    // PAIR 타입
    if (PAIR_TYPES.has(type)) {
      if (savedPromo) {
        sessionStorage.removeItem("ivstar_promo_code");
        router.push(`/dashboard/report/pair?type=${type}&promo_code=${encodeURIComponent(savedPromo)}`);
      } else {
        router.push(`/dashboard/report/payment?type=${type}`);
      }
      return;
    }

    // 프로모 코드 없음 → 결제 페이지
    if (!savedPromo) {
      router.push(`/dashboard/report/payment?type=${type}`);
      return;
    }

    // 프로모 코드 있음 → 무료 리포트 생성
    setLoading(true);
    setError("");
    try {
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
        { headers: { Authorization: `Bearer ${(session as any)?.id_token}` } }
      );
      if (!profileRes.ok) throw new Error("Failed to load birth profiles.");
      const profiles = await profileRes.json();
      if (profiles.length === 0) {
        router.push(`/onboarding?redirect=/dashboard/report/new?type=${type}`);
        return;
      }
      const profile = profiles[0];
      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/full`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any)?.id_token}` },
          body: JSON.stringify({ birth_profile_id: profile.id, report_type: type, price: PRICE, promo_code: savedPromo }),
        }
      );
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        if (reportRes.status === 503) throw new Error("Please try again in a minute or two.");
        throw new Error(errData.detail ?? "Failed to create report. Please try again.");
      }
      sessionStorage.removeItem("ivstar_promo_code");
      const report = await reportRes.json();
      router.push(`/dashboard/report/${report.id}`);
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ConstellationLoader />;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-800">
            {REPORT_LABELS[type]} Reading
          </h1>
        </div>

        {WHAT_INSIDE[type] && (
          <ul className="space-y-1.5 w-full">
            {WHAT_INSIDE[type].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-gray-400">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="space-y-2">
          <button
            onClick={starBalance >= STAR_COST ? handleUseStar : () => router.push("/dashboard/store")}
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-gray-700"
          >
            {loading ? "Generating..." : `✦ Use ${STAR_COST} ${STAR_COST === 1 ? "Star" : "Stars"}`}
          </button>
          <p className="text-xs text-center text-gray-400">
            {starBalance >= STAR_COST
              ? `${starBalance} ${starBalance === 1 ? "star" : "stars"} remaining`
              : `${STAR_COST} ${STAR_COST === 1 ? "star" : "stars"} needed — buy more in the store`}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
      </div>
    </main>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">Loading...</div>}>
      <NewReportContent />
    </Suspense>
  );
}