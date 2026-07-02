"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

const PACKS = [
  { quantity: 1, label: "1 Star", price: "$0.99", symbol: "✦" },
  { quantity: 3, label: "3 Stars", price: "$2.00", symbol: "✦✦✦" },
];

function StarPackCard({
  pack,
  session,
  paypalReady,
}: {
  pack: (typeof PACKS)[number];
  session: any;
  paypalReady: boolean;
}) {
  const router = useRouter();
  const [showPaypal, setShowPaypal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const rendered = useRef(false);
  const containerId = `star-paypal-${pack.quantity}`;

  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const handleValidateCoupon = async () => {
    if (!promoCode.trim() || !session) return;
    setPromoLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/apply-promo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.id_token}`,
          },
          body: JSON.stringify({ code: promoCode.trim() }),
        }
      );
      if (res.ok) {
        setPromoValid(true);
      } else {
        setPromoValid(false);
      }
    } catch {
      setPromoValid(false);
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (!paypalReady || !session || !showPaypal || rendered.current) return;
    if (!(window as any).paypal) return;
    rendered.current = true;

    (window as any).paypal
      .Buttons({
        style: { layout: "vertical", color: "black", shape: "rect", label: "pay", height: 48 },

        createOrder: async () => {
          setError("");
          setSuccess("");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/stars/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${(session as any)?.id_token}`,
              },
              body: JSON.stringify({ quantity: pack.quantity }),
            }
          );
          if (!res.ok) throw new Error("Failed to create payment.");
          const data = await res.json();
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
          if (!res.ok) {
            setError("Payment capture failed. Please contact support.");
            setShowPaypal(false);
            rendered.current = false;
            return;
          }
          const result = await res.json();
          setSuccess(`${result.stars_added} Star${result.stars_added > 1 ? "s" : ""} added! Balance: ${result.stars}`);
          setShowPaypal(false);
          rendered.current = false;
        },

        onCancel: () => {
          setShowPaypal(false);
          rendered.current = false;
        },
        onError: () => {
          setError("Payment failed. Please try again.");
          setShowPaypal(false);
          rendered.current = false;
        },
      })
      .render(`#${containerId}`);
  }, [paypalReady, session, showPaypal]);

  return (
    <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] overflow-hidden w-full max-w-[200px]">
      <div className="p-5 space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-widest">Star Pack</p>
        <p className="text-2xl font-bold text-gray-800">{pack.symbol}</p>
        <p className="text-base font-semibold text-gray-800">{pack.label}</p>
        <p className="text-xl font-bold text-gray-900">{pack.price}</p>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600 font-medium">✓ {success}</p>}

        {!session ? (
          <p className="text-xs text-gray-400">Sign in to purchase.</p>
        ) : !showPaypal ? (
          <button
            onClick={() => { setError(""); setSuccess(""); setShowPaypal(true); }}
            disabled={!paypalReady}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:bg-gray-700"
          >
            {paypalReady ? `Pay ${pack.price}` : "Loading..."}
          </button>
        ) : (
          <div id={containerId} />
        )}

        {/* 프로모 코드 */}
        {session && !showPaypal && (
          <div className="pt-1 space-y-2">
            <button
              onClick={() => { setShowPromo((v) => !v); setPromoValid(null); setPromoCode(""); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-left"
            >
              {showPromo ? "▲ Hide promo code" : "Enter promo code"}
            </button>
            {showPromo && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoValid(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleValidateCoupon(); }}
                  className="w-full rounded-lg border border-[#DDD8CE] bg-[#FFFBF5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={promoLoading || !promoCode.trim()}
                  className="w-full rounded-lg border border-[#DDD8CE] py-2 text-sm font-medium text-gray-600 hover:bg-[#EDE8DC] disabled:opacity-50 transition-colors"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
                {promoValid === true && (
                  <p className="text-xs text-green-600">✓ 1 star added! You can now unlock 1 free reading.</p>
                )}
                {promoValid === false && (
                  <p className="text-xs text-red-500">Invalid promo code. Please try again.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorePage() {
  const { data: session } = useSession();
  const [stars, setStars] = useState<number | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
    })
      .then((r) => r.json())
      .then((u) => setStars(u.stars ?? 0))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (paypalReady || !session) return;
    if ((window as any).paypal) { setPaypalReady(true); return; }

    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then(({ clientId }) => {
        if (!clientId) return;
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&locale=en_US`;
        script.async = true;
        script.onload = () => setPaypalReady(true);
        document.head.appendChild(script);
      })
      .catch(() => {});
  }, [session]);

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
          <p className="text-xs text-gray-400 mt-0.5">
            Use stars to unlock any reading without paying each time.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          {PACKS.map((pack) => (
            <StarPackCard
              key={pack.quantity}
              pack={pack}
              session={session}
              paypalReady={paypalReady}
            />
          ))}
        </div>

        <p className="text-xs text-gray-400">Secure payment via PayPal</p>
      </div>
    </main>
  );
}
