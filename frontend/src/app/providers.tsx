"use client";

import { SessionProvider, useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

/** refresh 실패 시 자동으로 Google 재로그인 유도 */
function TokenErrorWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    const error = (session as any)?.error;
    if (error === "RefreshTokenExpired" || error === "RefreshTokenMissing") {
      console.warn("[Auth] Token error detected, re-authenticating...");
      signIn("google");
    }
  }, [session]);

  return null;
}

/** 파비콘 동적 설정 - Hash 기반 캐시 버스팅 */
function FaviconSetter() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        // 파비콘 파일의 last-modified 헤더로 해시 생성
        const res = await fetch("/favicon-32x32.png", { method: "HEAD" });
        const lastModified = res.headers.get("last-modified") || new Date().toISOString();
        const hash = new Date(lastModified).getTime();

        // 기존 icon 제거
        document.querySelectorAll("link[rel='icon']").forEach((el) => el.remove());

        // 새로운 icon 추가
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = `/favicon-32x32.png?v=${hash}`;
        link.type = "image/png";
        document.head.appendChild(link);

        // Apple icon도 동일하게
        const appleRes = await fetch("/apple-touch-icon.png", { method: "HEAD" });
        const appleLastModified = appleRes.headers.get("last-modified") || new Date().toISOString();
        const appleHash = new Date(appleLastModified).getTime();

        const appleLink = document.createElement("link");
        appleLink.rel = "apple-touch-icon";
        appleLink.href = `/apple-touch-icon.png?v=${appleHash}`;
        document.head.appendChild(appleLink);

        console.log("[Favicon] Updated with hash:", { favicon: hash, apple: appleHash });
      } catch (error) {
        console.error("[Favicon] Update failed:", error);
      }
    };

    updateFavicon();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <TokenErrorWatcher />
      <FaviconSetter />
      {children}
    </SessionProvider>
  );
}