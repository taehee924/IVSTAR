"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";

export default function StorePage() {
  const { data: session } = useSession();
  const [stars, setStars] = useState<number | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const rendered = useRef(false);

  // 유저 스타 잔액 조회
  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
    })
      .then((r) => r.json())
      .then((u) => setStars(u.stars ?? 0))
      .catch(() => {});
  }, [session]);

  // PayPal SDK 로드
  useEffect(() => {
    if (paypalReady || !session) return;
    if ((window as any).paypal) { setPaypalReady(true); return; }

    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then(({ clientId }) => {
        if (!clientId) { setError("PayPal is not configured."); return; }
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&locale=en_US`;
        script.async = true;
        script.onload = () => setPaypalReady(true);
        script.onerror = () => setError("Failed to load PayPal.");
        document.head.appendChild(script);
      })
      .catch(() => setError("Failed to load PayPal."));
  }, [session]);

  // PayPal 버튼 렌더링
  useEffect(() => {
    if (!paypalReady || !session || rendered.current) return;
    if (!(window as any).paypal) return;
    rendered.current = true;

    (window as any).paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 44 },

      createOrder: async () => {
        setError("");
        setSuccess("");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/stars/create`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to create payment.");
        const data = await res.json();
        sessionStorage.setItem("ivstar_pending_star_order_id", data.paypal_order_id);
        return data.paypal_order_id;
      },

      onApprove: async (data: any) => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/stars/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session as any)?.id_token}`,
            },
            body: JSON.stringify({ paypal_order_id: data.orderID }),
          }
        );
        sessionStorage.removeItem("ivstar_pending_star_order_id");
        if (!res.ok) { setError("Payment capture failed. Please contact support."); return; }
        const result = await res.json();
        setStars(result.stars);
        setSuccess("⭐ 1 Star added to your account!");
      },

      onCancel: () => {},
      onError: () => setError("Payment failed. Please try again."),
    }).render("#star-paypal-button");
  }, [paypalReady, session]);

  return (
    <main
      className="min-h-screen pt-14"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />
      <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
        <div>
          <h1 className="text-[21px] font-bold text-gray-800">Store</h1>
          {stars !== null && (
            <p className="text-sm text-gray-500 mt-1">
              Your balance: <span className="font-semibold text-gray-800">⭐ {stars} {stars === 1 ? "Star" : "Stars"}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-6 max-w-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <h2 className="text-lg font-semibold text-gray-800">1 Star</h2>
            </div>
            <p className="text-sm text-gray-500">Use 1 Star to unlock any reading — no separate payment needed.</p>
            <p className="text-xl font-bold text-gray-800">$0.99</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

          {!session ? (
            <p className="text-sm text-gray-400">Sign in to purchase stars.</p>
          ) : !paypalReady ? (
            <p className="text-sm text-gray-400 py-2">Loading payment...</p>
          ) : (
            <div id="star-paypal-button" />
          )}
        </div>
      </div>
    </main>
  );
}
