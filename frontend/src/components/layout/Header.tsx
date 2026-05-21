"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function IvstarLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="47" fill="currentColor" />
      <clipPath id="ivstar-clip">
        <circle cx="50" cy="50" r="47" />
      </clipPath>
      <g clipPath="url(#ivstar-clip)" stroke="white" strokeWidth="3.2" strokeLinecap="butt">
        {/* 세로선 */}
        <line x1="37" y1="3" x2="37" y2="97" />
        {/* 가로선 */}
        <line x1="3" y1="44" x2="97" y2="44" />
        {/* 대각선: 교차점 → 우하단 */}
        <line x1="37" y1="44" x2="88" y2="91" />
      </g>
    </svg>
  );
}

const MENU_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/categories", label: "Theme" },
  { href: "/dashboard/store", label: "Store" },
  { href: "/dashboard/me", label: "My Page" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F0E6] border-b border-[#DDD8CE]">
        <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-900 hover:opacity-70 transition-opacity">
            <IvstarLogo size={30} />
          </Link>

          {/* 데스크톱 인라인 네비게이션 (lg+) */}
          <nav className="hidden lg:flex items-center gap-8">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 모바일 햄버거 버튼 (lg 미만) */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* 모바일 전체화면 오버레이 (lg 미만) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[#F5F0E6]"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-md mx-auto px-6 pt-6" onClick={(e) => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 메뉴 항목 */}
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block py-4 text-3xl font-light tracking-tight transition-colors ${
                    pathname === item.href
                      ? "text-gray-900 font-medium"
                      : "text-gray-400 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}