import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="bg-[#FFFBF5]">
      <Header />

      {/* ── Section 1: Dragon ── */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <Image
          src="/home1.png"
          alt="IVSTAR Dragon"
          fill
          style={{ objectFit: "cover", objectPosition: "center top" }}
          priority
        />
      </section>

      {/* ── Section 2: Celestial Map ── */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <Image
          src="/home2.png"
          alt="Celestial Map"
          fill
          style={{ objectFit: "cover", objectPosition: "center center" }}
        />
        {/* IVSTAR 텍스트 좌하단 */}
        <div className="absolute bottom-10 left-6 z-10">
          <p className="text-[52px] font-bold text-gray-900 leading-none font-inknut">IVSTAR</p>
        </div>
      </section>
    </main>
  );
}
