import { env } from "@/lib/env";

export interface AuthMeResponse {
  id: number;
  email: string;
  name: string | null;
  profile_image: string | null;
  role: string;
  created_at: string;
  is_new_user: boolean;
}

/**
 * Google ID Token으로 FastAPI에 유저 생성/조회 요청.
 * is_new_user: true면 온보딩 필요.
 */
export async function authMe(idToken: string): Promise<AuthMeResponse> {
  const res = await fetch(`${env.API_URL}/api/v1/auth/me`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Auth failed");
  }

  return res.json();
}