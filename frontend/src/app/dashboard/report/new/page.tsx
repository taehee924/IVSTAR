"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const REPORT_LABELS: Record<string, string> = {
  general: "About Me",
  life_cycle: "Life Cycles",
  year_ahead: "Your Year Ahead",
  daily: "Daily Horoscope",
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
};

// ── useSearchParams를 사용하는 컴포넌트 분리 ──
function NewReportContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") ?? "general";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 2인 리딩은 pair 페이지로 즉시 리다이렉트
  useEffect(() => {
    if (PAIR_TYPES.has(type)) {
      router.replace(`/dashboard/report/pair?type=${type}`);
    }
  }, [type]);

  const handleCreate = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 출생 정보 조회
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
        }
      );
      if (!profileRes.ok) throw new Error("출생 정보 조회 실패");
      const profiles = await profileRes.json();
      if (profiles.length === 0) {
        // 온보딩 완료 후 다시 이 페이지로 돌아오도록 redirect 파라미터 추가
        router.push(`/onboarding?redirect=/dashboard/report/new?type=${type}`);
        return;
      }
      const profile = profiles[0];

      // 무료 리포트 생성
      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
          body: JSON.stringify({
            birth_profile_id: profile.id,
            report_type: type,
            price: 0,
          }),
        }
      );
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        if (reportRes.status === 503) {
          throw new Error("AI가 잠시 바쁜 상태예요. 잠시 후 다시 시도해주세요.");
        }
        if (reportRes.status === 400) {
          throw new Error(errData.detail ?? "잘못된 요청이에요.");
        }
        throw new Error(errData.detail ?? "리포트 생성 실패");
      }
      const report = await reportRes.json();

      // 결제 없이 바로 리포트 상세로 이동
      router.push(`/dashboard/report/${report.id}`);
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-800">
            {REPORT_LABELS[type]} Reading
          </h1>
          <p className="text-sm text-gray-500">
            Get your personalized {REPORT_LABELS[type]?.toLowerCase()} reading powered by AI.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{REPORT_LABELS[type]} Reading</p>
            <p className="text-lg font-bold text-green-600">Free</p>
          </div>
          <p className="text-xs text-gray-400">AI-powered · Instant access</p>
        </div>

        {WHAT_INSIDE[type] && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What's inside</p>
            <ul className="space-y-1.5">
              {WHAT_INSIDE[type].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-gray-400">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-gray-700"
        >
          {loading ? "Generating..." : "Get Free Reading"}
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

// ── 메인 export: Suspense로 감싸기 ──
export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>}>
      <NewReportContent />
    </Suspense>
  );
}