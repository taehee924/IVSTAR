"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * 현재 로그인 유저 세션 반환.
 */
export function useUser() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isLoggedIn: status === "authenticated",
  };
}

/**
 * Google 로그인.
 * 로그인 후 FastAPI /auth/me 호출 → is_new_user에 따라 분기.
 */
export function useGoogleSignIn() {
  const router = useRouter();

  const login = async () => {
    await signIn("google", { redirect: false });
  };

  return { login };
}

/**
 * 로그아웃.
 */
export function useSignOut() {
  const router = useRouter();

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return { logout };
}

/**
 * 로그인 필요한 페이지에서 사용.
 * 미로그인 시 /login으로 redirect.
 */
export function useRequireAuth() {
  const { user, isLoading, isLoggedIn } = useUser();
  const router = useRouter();

  if (!isLoading && !isLoggedIn) {
    router.push("/login");
  }

  return { user, isLoading };
}