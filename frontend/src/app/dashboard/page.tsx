import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main style={{ background: "#F6F3ED" }}>
      <Header />

      {/* 데스크톱: background.png / 모바일: 단색 */}
      {/* 모바일 (lg 미만) */}
      <div className="lg:hidden w-full pt-14" style={{ lineHeight: 0 }}>
        <Image
          src="/home1.png"
          alt="IVSTAR"
          width={1564}
          height={2596}
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
          unoptimized
        />
      </div>

      {/* 데스크톱 (lg 이상) */}
      <div
        className="hidden lg:block w-full"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{ lineHeight: 0 }}>
          <Image
            src="/desktop3.png"
            alt="IVSTAR Desktop 1"
            width={6048}
            height={3928}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
            unoptimized
          />
          <Image
            src="/desktop2.png"
            alt="IVSTAR Desktop 2"
            width={6048}
            height={3928}
            style={{ width: "100%", height: "auto", display: "block" }}
            unoptimized
          />
        </div>
      </div>

      {/* 소셜 미디어 링크 (우측 하단 고정) */}
      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-3">
        {/* Instagram */}
        <a
          href="https://www.instagram.com/ivstarcosmic/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        </a>
        {/* TikTok */}
        <a
          href="https://www.tiktok.com/@ivstarcosmic"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
          </svg>
        </a>
      </div>
    </main>
  );
}
