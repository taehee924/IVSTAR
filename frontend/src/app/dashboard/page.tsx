import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="bg-[#F5F0E8]">
      <Header />

      <div className="w-full flex justify-center bg-[#F5F0E8]">
        <div className="w-full max-w-lg">

          {/* Section 1: Dragon */}
          <Image
            src="/home1.png"
            alt="IVSTAR Dragon"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />

          {/* Section 2: Celestial Map */}
          <Image
            src="/home2.png"
            alt="Celestial Map"
            width={800}
            height={1400}
            style={{ width: "100%", height: "auto", display: "block" }}
          />

        </div>
      </div>
    </main>
  );
}
