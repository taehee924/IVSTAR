"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";

export default function StorePage() {
  const { data: session } = useSession();
  const [stars, setStars] = useState<number | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [showPaypal, setShowPaypal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const rendered = useRef(false);

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

  // PayPal 버튼 렌더링 (showPaypal이 true가 된 이후)
  useEffect(() => {
    if (!paypalReady || !session || !showPaypal || rendered.current) return;
    if (!(window as any).paypal) return;
    rendered.current = true;

    (window as any).paypal.Buttons({
      style: { layout: "vertical", color: "black", shape: "rect", label: "pay", height: 48 },

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
        setSuccess("3 Stars have been added to your account!");
        setShowPaypal(false);
        rendered.current = false;
      },

      onCancel: () => { setShowPaypal(false); rendered.current = false; },
      onError: () => { setError("Payment failed. Please try again."); setShowPaypal(false); rendered.current = false; },
    }).render("#star-paypal-button");
  }, [paypalReady, session, showPaypal]);

  const handlePayBoxClick = () => {
    if (!session) return;
    setError("");
    setSuccess("");
    setShowPaypal(true);
  };

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
              Balance:{" "}
              <span className="font-semibold text-gray-800">
                ✦ {stars} {stars === 1 ? "Star" : "Stars"}
              </span>
            </p>
          )}
        </div>

        {/* 상품 카드 */}
        <div className="max-w-xs space-y-3">
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] overflow-hidden">
            {/* 상품 정보 */}
            <div className="p-5 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Star Pack</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">✦✦✦</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">3 Stars</p>
              <p className="text-sm text-gray-500">
                Use stars to unlock any reading — no separate payment needed each time.
              </p>
              <p className="text-2xl font-bold text-gray-900">$2.00</p>
            </div>

            {/* Pay 박스 */}
            {!session ? (
              <div className="px-5 pb-5">
                <p className="text-sm text-gray-400">Sign in to purchase.</p>
              </div>
            ) : (
              <div className="px-5 pb-5 space-y-3">
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && (
                  <p className="text-sm text-green-600 font-medium">✓ {success}</p>
                )}

                {!showPaypal ? (
                  <button
                    onClick={handlePayBoxClick}
                    disabled={!paypalReady}
                    className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:bg-gray-700"
                  >
                    {paypalReady ? "Pay $2.00" : "Loading..."}
                  </button>
                ) : (
                  <div id="star-paypal-button" />
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">Secure payment via PayPal</p>
        </div>
      </div>
    </main>
  );
}
