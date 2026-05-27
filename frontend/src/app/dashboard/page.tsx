import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="bg-[#F5F0E8]">
      <Header />

      {/* ── Section 1: Dragon ── */}
      <section className="w-full flex justify-center bg-[#F5F0E8]">
        <div className="relative w-full max-w-lg">
          <Image
            src="/home1.png"
            alt="IVSTAR Dragon"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>
      </section>

      {/* ── Section 2: Celestial Map ── */}
      <section className="w-full flex justify-center bg-[#F5F0E8] relative">
        <div className="relative w-full max-w-lg">
          <Image
            src="/home2.png"
            alt="Celestial Map"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto" }}
          />
          {/* IVSTAR 텍스트 좌하단 */}
          <div className="absolute bottom-8 left-5">
            <p className="text-[48px] font-bold text-gray-900 leading-none font-inknut">IVSTAR</p>
          </div>
        </div>
      </section>
    </main>
  );
}
