import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <span className="text-3xl text-white">☽</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">IVSTAR</h1>
          <p className="text-sm text-gray-500">
            Your personalized Saju & astrology readings
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Get Started
        </Link>
        <p className="text-xs text-gray-400">
          Discover your cosmic path for just $0.99
        </p>
      </div>
    </main>
  );
}