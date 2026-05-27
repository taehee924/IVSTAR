import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="bg-[#F5F0E8]">
      <Header />

      {/* ── Section 1: Dragon ── */}
      <section className="w-full flex justify-center bg-[#F5F0E8]">
        <div className="w-full max-w-lg">
          <Image
            src="/home1.png"
            alt="IVSTAR Dragon"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>
      </section>

      {/* ── Section 2: Celestial Map ── */}
      <section className="w-full flex justify-center items-center bg-[#F5F0E8]">
        <div className="w-full max-w-lg flex justify-center">
          <Image
            src="/home2.png"
            alt="Celestial Map"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>
      </section>
    </main>
  );
}
