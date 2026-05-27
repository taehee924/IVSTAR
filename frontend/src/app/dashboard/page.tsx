import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main style={{ background: "#F6F3ED" }}>
      <Header />

      <div className="w-full flex justify-center" style={{ background: "#F6F3ED" }}>
        <div className="w-full max-w-lg" style={{ lineHeight: 0 }}>

          {/* Section 1: Dragon */}
          <Image
            src="/home1.png"
            alt="IVSTAR Dragon"
            width={418}
            height={707}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />

          {/* Section 2: Celestial Map */}
          <Image
            src="/home2.png"
            alt="Celestial Map"
            width={467}
            height={708}
            style={{ width: "100%", height: "auto", display: "block" }}
          />

        </div>
      </div>
    </main>
  );
}
