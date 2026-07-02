"use client";

import { useState } from "react";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs rounded-2xl border border-[#DDD8CE] bg-[#FFFBF5] p-6 text-center shadow-xl space-y-4">
        <div className="text-4xl">⭐</div>
        <h2 className="text-lg font-semibold text-gray-800">Welcome to IVSTAR!</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          You've received <span className="font-semibold text-gray-800">1 free star</span> as a welcome gift.
          <br />Explore your first cosmic insight.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Start exploring →
        </button>
      </div>
    </div>
  );
}
