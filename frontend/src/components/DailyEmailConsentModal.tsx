"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const SNOOZE_KEY = "dailyEmailPromptSnooze";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // "maybe later" 후 3일 뒤 다시 노출

/**
 * 로그인 후 데일리 리딩 이메일 수신 동의 팝업.
 * - 서버의 daily_email_opt_in === null(아직 결정 안 함)일 때만 노출
 * - "maybe later"는 3일 스누즈(localStorage), 동의하면 이후 다시 뜨지 않음
 */
export default function DailyEmailConsentModal() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = (session as any)?.id_token as string | undefined;

  useEffect(() => {
    if (status !== "authenticated" || !token) return;

    // 스누즈 중이면 노출 안 함
    try {
      const snooze = Number(localStorage.getItem(SNOOZE_KEY) || 0);
      if (snooze && Date.now() < snooze) return;
    } catch {
      /* localStorage 불가 환경 무시 */
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const user = await res.json();
        // null(미결정)일 때만 노출. true/false면 이미 선택함.
        if (!cancelled && user?.daily_email_opt_in === null) setOpen(true);
      } catch {
        /* 조회 실패 시 조용히 무시 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  const optIn = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/daily-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opt_in: true }),
      });
      try {
        localStorage.removeItem(SNOOZE_KEY);
      } catch {
        /* ignore */
      }
      setOpen(false);
    } catch {
      setSubmitting(false);
    }
  };

  const maybeLater = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={maybeLater}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(24,20,14,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#FBF8F0",
          border: "1px solid #E8DFC8",
          borderRadius: 20,
          padding: "34px 28px 26px",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(24,20,14,0.25)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-crimson), 'Noto Serif KR', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#3D3833",
            marginBottom: 10,
          }}
        >
          Get your daily reading ✨
        </div>
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: "#5C5346",
            margin: "0 0 24px",
          }}
        >
          Receive your personalized daily reading by email.
        </p>

        <button
          onClick={optIn}
          disabled={submitting}
          style={{
            width: "100%",
            background: "#0B1B33",
            color: "#FBF8F0",
            border: "none",
            borderRadius: 12,
            padding: "14px 20px",
            fontFamily: "var(--font-crimson), 'Noto Serif KR', serif",
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "…" : "✦ Send me my daily reading"}
        </button>

        <button
          onClick={maybeLater}
          style={{
            marginTop: 14,
            background: "none",
            border: "none",
            color: "#9A8F7A",
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          maybe later
        </button>
      </div>
    </div>
  );
}
