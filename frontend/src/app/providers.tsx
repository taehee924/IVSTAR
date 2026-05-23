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

/** 파비콘 동적 설정 */
function FaviconSetter() {
  useEffect(() => {
    // 파비콘 캐시 방지를 위해 타임스탐프 추가
    const timestamp = new Date().getTime();
    
    // 기존 icon 링크 업데이트
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (link) {
      link.href = `/favicon-32x32.png?v=${timestamp}`;
    }
    
    // Apple 파비콘도 설정
    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleLink) {
      appleLink.href = `/apple-touch-icon.png?v=${timestamp}`;
    }
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