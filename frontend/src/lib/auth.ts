import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

// 세션 타입 확장 (next-auth 기본 타입에 추가)
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

/**
 * 서버 컴포넌트에서 현재 세션 반환.
 * 로그인 안 돼있으면 /login으로 redirect.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * 서버 컴포넌트에서 현재 세션 반환 (미로그인 허용).
 */
export async function getSession() {
  return await auth();
}

/**
 * 현재 유저의 Google ID Token 반환.
 * FastAPI 호출 시 Authorization 헤더에 사용.
 */
export async function getIdToken(): Promise<string | null> {
  const session = await auth();
  if (!session) return null;
  // id_token은 JWT callback에서 token에 저장됨
  return (session as any).id_token ?? null;
}