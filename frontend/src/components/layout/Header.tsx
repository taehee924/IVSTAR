"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/categories", label: "Theme" },
  { href: "/dashboard/store", label: "Store" },
  { href: "/dashboard/me", label: "My Page" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pathname = usePathname();

  // 로그인 여부와 무관하게 7초간 표시
  useEffect(() => {
    setShowTooltip(true);
    const timer = setTimeout(() => setShowTooltip(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleMenuOpen = () => {
    setOpen(true);
    setShowTooltip(false);
  };

  return (
    <>
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF5] border-b border-[#DDD8CE]">
        <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between relative">

          {/* 모바일: 왼쪽 빈 공간 (햄버거 버튼과 균형) / 데스크톱: 로고 */}
          <div className="lg:hidden w-[38px]" />
          <Link href="/dashboard" className="hidden lg:block">
            <Image src="/logo5.png" alt="IVSTAR" height={19} width={80} style={{ objectFit: "fill" }} priority />
          </Link>

          {/* 모바일 중앙 로고 */}
          <Link href="/dashboard" className="lg:hidden absolute left-1/2 -translate-x-1/2">
            <Image src="/logo5.png" alt="IVSTAR" height={19} width={80} style={{ objectFit: "fill" }} priority />
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
          <div className="lg:hidden relative">
            {showTooltip && (
              <div
                className="absolute right-0 top-full mt-2 whitespace-nowrap pointer-events-none"
                style={{ animation: "fadeInTooltip 0.3s ease" }}
              >
                <div
                  className="absolute right-4"
                  style={{
                    top: -5,
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderBottom: "5px solid #111827",
                  }}
                />
                <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                  Tap to explore ✦
                </div>
              </div>
            )}
            <button
              onClick={handleMenuOpen}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 전체화면 오버레이 (lg 미만) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[#FFFBF5]"
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