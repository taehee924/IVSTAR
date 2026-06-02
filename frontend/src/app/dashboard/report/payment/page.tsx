"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import ConstellationLoader from "@/components/ConstellationLoader";
import {
  calculateFourPillars,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
} from "manseryeok";

const PRICE = 0.99;

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

function getDominantElement(pillars: any) {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const stems = [pillars.year.heavenlyStem, pillars.month.heavenlyStem, pillars.day.heavenlyStem, pillars.hour.heavenlyStem];
  const branches = [pillars.year.earthlyBranch, pillars.month.earthlyBranch, pillars.day.earthlyBranch, pillars.hour.earthlyBranch];
  stems.forEach((s) => { const e = getHeavenlyStemElement(s); if (e && elements[e] !== undefined) elements[e]++; });
  branches.forEach((b) => { const e = getEarthlyBranchElement(b); if (e && elements[e] !== undefined) elements[e]++; });
  return Object.entries(elements).sort(([, a], [, b]) => b - a)[0][0];
}

function calculateChartStrength(pillars: any) {
  const elements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const total = 8;
  const stems = [pillars.year.heavenlyStem, pillars.month.heavenlyStem, pillars.day.heavenlyStem, pillars.hour.heavenlyStem];
  const branches = [pillars.year.earthlyBranch, pillars.month.earthlyBranch, pillars.day.earthlyBranch, pillars.hour.earthlyBranch];
  stems.forEach((s) => { const e = getHeavenlyStemElement(s); if (e && elements[e] !== undefined) elements[e]++; });
  branches.forEach((b) => { const e = getEarthlyBranchElement(b); if (e && elements[e] !== undefined) elements[e]++; });
  const max = Math.max(...Object.values(elements));
  if (max >= total * 0.4) return "Strong";
  if (max <= total * 0.2) return "Scattered";
  return "Balanced";
}

function PaymentContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "general";
  const isPair = ["crush", "ex", "situationship", "love"].includes(type);

  const [loading, setLoading] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [error, setError] = useState("");
  const rendered = useRef(false);

  // PayPal SDK 로드
  useEffect(() => {
    if (paypalReady) return;
    if ((window as any).paypal) { setPaypalReady(true); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setError("Failed to load PayPal. Please refresh and try again.");
    document.head.appendChild(script);
  }, []);

  // PayPal 버튼 렌더링
  useEffect(() => {
    if (!paypalReady || !session || rendered.current) return;
    if (!(window as any).paypal) return;
    rendered.current = true;

    (window as any).paypal.Buttons({
      style: { layout: "vertical", color: "black", shape: "rect", label: "pay", height: 48 },

      createOrder: async () => {
        setError("");
        try {
          // 유저 프로필 조회
          const profileRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
            { headers: { Authorization: `Bearer ${(session as any)?.id_token}` } }
          );
          if (!profileRes.ok) throw new Error("Failed to load birth profile.");
          const profiles = await profileRes.json();
          if (!profiles.length) {
            router.replace(`/onboarding?redirect=/dashboard/report/payment?type=${type}`);
            throw new Error("No birth profile.");
          }
          const profile = profiles[0];

          let reportRes: Response;

          if (isPair) {
            // 파트너 데이터 sessionStorage에서 로드
            const raw = sessionStorage.getItem("ivstar_partner_data");
            if (!raw) throw new Error("Partner data missing. Please go back and fill in the form.");
            const p = JSON.parse(raw);

            const pillars = calculateFourPillars({
              year: p.year, month: p.month, day: p.day,
              hour: p.hour ?? 12, minute: p.minute ?? 0,
            });

            reportRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/pair/preview`,
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
                  promo_code: null,
                  partner_name: p.name || null,
                  partner_birth_date: p.birthDate,
                  partner_birth_time: p.birthTime,
                  partner_birth_place: p.birthPlace,
                  partner_gender: p.gender || null,
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
          } else {
            reportRes = await fetch(
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
                  promo_code: null,
                }),
              }
            );
          }

          if (!reportRes.ok) {
            const errData = await reportRes.json().catch(() => ({}));
            if (reportRes.status === 503) throw new Error("Our AI is busy. Please try again in a moment.");
            throw new Error(errData.detail ?? "Failed to create report.");
          }
          const report = await reportRes.json();

          // PayPal 주문 생성
          const orderRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/paypal/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${(session as any)?.id_token}`,
              },
              body: JSON.stringify({ report_id: report.id, currency: "USD" }),
            }
          );
          if (!orderRes.ok) throw new Error("Failed to create payment.");
          const order = await orderRes.json();

          sessionStorage.setItem("ivstar_pending_report_id", String(report.id));
          return order.paypal_order_id;
        } catch (e: any) {
          setError(e.message ?? "Something went wrong.");
          throw e;
        }
      },

      onApprove: async (data: any) => {
        setLoading(true);
        const reportId = sessionStorage.getItem("ivstar_pending_report_id");
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/paypal/capture`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${(session as any)?.id_token}`,
              },
              body: JSON.stringify({
                paypal_order_id: data.orderID,
                report_id: Number(reportId),
              }),
            }
          );
          if (!res.ok) throw new Error("Payment capture failed.");
          sessionStorage.removeItem("ivstar_partner_data");
          sessionStorage.removeItem("ivstar_pending_report_id");
          router.push(`/dashboard/report/${reportId}`);
        } catch (e: any) {
          setError(e.message);
          setLoading(false);
        }
      },

      onCancel: () => router.back(),
      onError: () => setError("Payment failed. Please try again."),
    }).render("#paypal-button-container");
  }, [paypalReady, session]);

  if (loading) return <ConstellationLoader />;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Complete Payment</p>
          <h1 className="text-2xl font-semibold text-gray-800">
            {REPORT_LABELS[type] ?? type}
          </h1>
          <p className="text-sm text-gray-500">${PRICE.toFixed(2)}</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-4">
          {!paypalReady ? (
            <p className="text-center text-sm text-gray-400 py-3">Loading payment...</p>
          ) : (
            <div id="paypal-button-container" />
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
        >
          ← Go back
        </button>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
