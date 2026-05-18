import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Google token endpoint로 refresh_token을 사용해 새 토큰 세트 획득 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  id_token: string;
  expires_at: number;
} | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[NextAuth] Token refresh failed:", data);
      return null;
    }

    return {
      access_token: data.access_token,
      id_token: data.id_token,
      // expires_in은 초 단위 → Unix timestamp로 변환
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  } catch (e) {
    console.error("[NextAuth] Token refresh error:", e);
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // refresh_token을 받기 위해 offline access 요청
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // ── 최초 로그인: 모든 토큰 저장 ──────────────────────────
      if (account && profile) {
        token.picture = profile.picture as string;
        token.name = profile.name as string;
        token.id_token = account.id_token;
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        // expires_at: account.expires_at는 초 단위 Unix timestamp
        token.expires_at = account.expires_at;
        return token;
      }

      // ── 토큰 유효 (만료까지 5분 이상 남음) ───────────────────
      const expiresAt = token.expires_at as number | undefined;
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt && nowSec < expiresAt - 300) {
        return token;
      }

      // ── 토큰 만료 임박/만료: refresh_token으로 재발급 ─────────
      const refreshToken = token.refresh_token as string | undefined;
      if (!refreshToken) {
        // refresh_token 없으면 세션 무효화 (재로그인 유도)
        console.warn("[NextAuth] No refresh_token — invalidating session");
        return { ...token, error: "RefreshTokenMissing" };
      }

      const refreshed = await refreshGoogleToken(refreshToken);
      if (!refreshed) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      return {
        ...token,
        id_token: refreshed.id_token,
        access_token: refreshed.access_token,
        expires_at: refreshed.expires_at,
        error: undefined,
      };
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture as string;
        session.user.name = token.name as string;
        (session as any).id_token = token.id_token;
        (session as any).error = token.error;
      }
      return session;
    },

    async signIn({ account }) {
      if (account?.id_token) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${account.id_token}` },
            }
          );
          if (!res.ok) return false;
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
  },
});

export const { GET, POST } = handlers;
