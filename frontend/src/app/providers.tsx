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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <TokenErrorWatcher />
      {children}
    </SessionProvider>
  );
}