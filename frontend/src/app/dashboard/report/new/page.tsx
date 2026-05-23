"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const REPORT_LABELS: Record<string, string> = {
  general: "About Me",
  life_cycle: "Life Cycles",
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

const PRICE = 0.99;

function NewReportContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "general";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 쿠폰
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (PAIR_TYPES.has(type)) {
      router.replace(`/dashboard/report/pair?type=${type}`);
    }
  }, [type]);

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/validate-coupon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode.trim() }),
        }
      );
      const data = await res.json();
      setPromoValid(data.valid);
    } catch {
      setPromoValid(false);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
        }
      );
      if (!profileRes.ok) throw new Error("Failed to load birth profiles.");
      const profiles = await profileRes.json();
      if (profiles.length === 0) {
        router.push(`/onboarding?redirect=/dashboard/report/new?type=${type}`);
        return;
      }
      const profile = profiles[0];

      // 쿠폰 유효하면 무료, 아니면 유료
      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/full`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
          body: JSON.stringify({
            birth_profile_id: profile.id,
            report_type: type,
            price: PRICE,
            promo_code: promoValid ? promoCode.trim() : null,
          }),
        }
      );

      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        if (reportRes.status === 503) throw new Error("Please try again in a minute or two.");
        if (reportRes.status === 400) throw new Error(errData.detail ?? "Invalid request.");
        throw new Error(errData.detail ?? "Failed to create report. Please try again.");
      }
      const report = await reportRes.json();

      if (promoValid) {
        // 쿠폰 적용 → 바로 리포트 페이지로
        router.push(`/dashboard/report/${report.id}`);
      } else {
        // 결제 필요 → PayPal 결제 페이지로
        const orderRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/paypal/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({
              report_id: report.id,
              currency: "USD",
            }),
          }
        );
        if (!orderRes.ok) throw new Error("Failed to create payment.");
        const order = await orderRes.json();
        router.push(`/dashboard/report/${report.id}?order_id=${order.paypal_order_id}`);
      }
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-800 text-center">
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

        {/* 쿠폰 입력 */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Have a promo code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoValid(null);
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleValidateCoupon}
              disabled={promoLoading || !promoCode.trim()}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {promoLoading ? "..." : "Apply"}
            </button>
          </div>
          {promoValid === true && (
            <p className="text-xs text-green-600">✓ Promo code applied. This reading is free!</p>
          )}
          {promoValid === false && (
            <p className="text-xs text-red-500">Invalid promo code. Please try again.</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-gray-700"
        >
          {loading
            ? "Generating..."
            : promoValid
            ? "Get Free Reading"
            : `Pay $${PRICE.toFixed(2)}`}
        </button>

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>}>
      <NewReportContent />
    </Suspense>
  );
}