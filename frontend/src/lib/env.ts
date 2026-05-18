// 환경변수 누락 시 빌드 타임에 에러 발생
export const env = {
    // FastAPI 백엔드 URL
    API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  
    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  
    // Auth.js
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  } as const;