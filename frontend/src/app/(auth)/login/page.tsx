import { LoginButtons } from "@/components/auth/LoginButtons";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F6F1E7] p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* 로고 / 타이틀 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <img src="icon.png" alt="IVSTAR Logo" className="w-40 h-40 object-contain" />
          </div>
          <h1 className="text-3xl font-semibold text-black tracking-tight">
            IVSTAR
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            This service is available after logging in.
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-6 shadow-sm space-y-4">
          <p className="text-center text-sm text-gray-500">
            Sign in to access your personalized Saju & astrology insights
          </p>
        <LoginButtons />
        </div>

        <p className="text-center text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}