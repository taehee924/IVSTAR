"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import Header from "@/components/layout/Header";

interface Report {
  id: number;
  report_type: string;
  content: string;
  is_unlocked: boolean;
  price: number;
  created_at: string;
}

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

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

// ── 리포트 타입별 섹션 이모지 설정 ──────────────────────────────
const REPORT_SECTION_EMOJIS: Record<string, string[]> = {
  general:       ["✨", "🌿", "💫", "🌑", "🧭", "🌟"],
  life_cycle:    ["📖", "🧠", "💞", "💰", "🧭"],
  crush:         ["👀", "💭", "🫧", "📊", "💕", "💌", "🔮"],
  ex:            ["✨", "⚡", "💫", "🏠", "💞", "🧭", "🔮"],
  situationship: ["👀", "🫧", "💞", "💌", "🚩", "💕", "🔮"],
  love:          ["🌌", "✨", "💞", "🏠", "🔥", "⚡", "🔮"],
};

interface ParsedSection {
  emoji: string;
  title: string;
  content: string;
}

function parseReportSections(
  content: string,
  sectionEmojis: string[]
): { opening: string; sections: ParsedSection[] } {
  const lines = content.split("\n");
  const sections: ParsedSection[] = [];
  let currentEmoji = "";
  let currentTitle = "";
  let currentLines: string[] = [];
  let openingLines: string[] = [];
  let inSection = false;

  for (const line of lines) {
    // # ** — 등 마크다운·구분선 기호 제거 후 이모지 감지
    const stripped = line.replace(/^[#*\s─]+/, "").trim();
    const matchedEmoji = sectionEmojis.find((e) => stripped.startsWith(e));

    if (matchedEmoji) {
      if (inSection) {
        sections.push({
          emoji: currentEmoji,
          title: currentTitle,
          content: currentLines.join("\n").trim(),
        });
        currentLines = [];
      }
      currentEmoji = matchedEmoji;
      currentTitle = stripped
        .slice(matchedEmoji.length)
        .replace(/\*+/g, "")
        .trim();
      inSection = true;
    } else if (inSection) {
      currentLines.push(line);
    } else {
      openingLines.push(line);
    }
  }

  if (inSection) {
    sections.push({
      emoji: currentEmoji,
      title: currentTitle,
      content: currentLines.join("\n").trim(),
    });
  }

  return {
    opening: openingLines.join("\n").trim(),
    sections,
  };
}

// ── 마크다운 semi-bold 오버라이드 ────────────────────────────
const mdComponents: Components = {
  strong: ({ children }) => (
    <span style={{ fontWeight: 600 }}>{children}</span>
  ),
};

// ── 범용 아코디언 컴포넌트 ────────────────────────────────────
function ReportAccordion({
  content,
  reportType,
}: {
  content: string;
  reportType: string;
}) {
  const sectionEmojis = REPORT_SECTION_EMOJIS[reportType] ?? [];
  const { opening, sections } = parseReportSections(content, sectionEmojis);
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {/* Opening Card / Snapshot — 항상 노출 */}
      {opening && (
        <div className="rounded-xl border border-[#DDD8CE]/60 bg-[#EDE8DC] px-4 py-3 prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown components={mdComponents}>{opening}</ReactMarkdown>
        </div>
      )}

      {/* 섹션 아코디언 */}
      {sections.map((sec, i) => {
        const isOpen = openSet.has(i);
        return (
          <div
            key={i}
            className="rounded-xl border border-[#DDD8CE]/60 overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                isOpen ? "bg-[#E8E2D4]" : "bg-[#EDE8DC] hover:bg-[#E8E2D4]"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <span className="text-sm">{sec.emoji}</span>
                <span>{sec.title}</span>
              </span>
              <span
                className={`text-gray-400 text-xs transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="px-4 py-3 bg-white border-t border-[#DDD8CE]/60 prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown components={mdComponents}>{sec.content}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [paypalReady, setPaypalReady] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/${id}`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
        }
      );
      if (!res.ok) throw new Error("리포트 조회 실패");
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchReport();
  }, [session]);

  useEffect(() => {
    if (!orderId || paypalReady) return;
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    document.head.appendChild(script);
  }, [orderId]);

  useEffect(() => {
    if (!paypalReady || !orderId || !report) return;
    if (!(window as any).paypal) return;

    (window as any).paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48 },
      createOrder: () => orderId,
      onApprove: async () => {
        setPaymentLoading(true);
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
                paypal_order_id: orderId,
                report_id: report.id,
              }),
            }
          );
          if (!res.ok) throw new Error("결제 캡처 실패");
          await fetchReport();
          router.replace(`/dashboard/report/${id}`);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setPaymentLoading(false);
        }
      },
      onCancel: () => router.replace(`/dashboard/report/${id}`),
      onError: () => setError("결제 중 오류가 발생했어요."),
    }).render("#paypal-button-container");
  }, [paypalReady, orderId, report]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Header />
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Header />
        <p className="text-sm text-red-500">{error || "리포트를 찾을 수 없어요."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] pt-14 pb-10">
      <Header />
      <div className="max-w-md mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {REPORT_LABELS[report.report_type] ?? report.report_type} Reading
          </h1>
        </div>

        {!report.is_unlocked && orderId && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center space-y-1">
              <p className="text-sm font-medium text-gray-700">Complete your payment</p>
              <p className="text-xs text-gray-400">Pay ${report.price.toFixed(2)} to unlock this reading</p>
            </div>
            {paymentLoading ? (
              <p className="text-center text-sm text-gray-400">Processing...</p>
            ) : (
              <div id="paypal-button-container" />
            )}
          </div>
        )}

        {!report.is_unlocked && !orderId && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
            <p className="text-sm font-medium text-gray-700">This reading is locked</p>
            <p className="text-xs text-gray-400">Unlock for ${report.price.toFixed(2)}</p>
            <button
              onClick={() => router.push(`/dashboard/report/new?type=${report.report_type}`)}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Unlock Reading · ${report.price.toFixed(2)}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* ── 언락된 리포트 콘텐츠 ── */}
        {report.is_unlocked && (
          REPORT_SECTION_EMOJIS[report.report_type] ? (
            // 섹션 이모지가 정의된 타입: 아코디언 토글
            <ReportAccordion
              content={report.content}
              reportType={report.report_type}
            />
          ) : (
            // 그 외(career, wealth 등 미완성): 마크다운 전체 렌더링
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown components={mdComponents}>{report.content}</ReactMarkdown>
            </div>
          )
        )}

      </div>
    </main>
  );
}