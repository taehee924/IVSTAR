"use client";

import { useState } from "react";
import Image from "next/image";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs rounded-2xl border border-[#DDD8CE] bg-[#FFFBF5] p-6 text-center shadow-xl space-y-4">
        <div className="flex justify-center">
          <Image src="/icon.png" alt="IVSTAR" width={64} height={64} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 font-crimson">Welcome to IVSTAR!</h2>
        <p className="text-base text-gray-500 leading-relaxed font-crimson">
          You've received <span className="font-semibold text-gray-800">1 free reading</span> as a welcome gift.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="w-full rounded-lg bg-gray-900 py-2.5 text-base font-semibold text-white hover:bg-gray-700 transition-colors font-crimson"
        >
          Start exploring →
        </button>
      </div>
    </div>
  );
}
