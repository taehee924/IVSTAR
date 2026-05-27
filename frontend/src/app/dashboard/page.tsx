import Header from "@/components/layout/Header";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main style={{ background: "#F6F3ED" }}>
      <Header />

      {/* 데스크톱: background.png / 모바일: 단색 */}
      <div
        className="w-full flex justify-center"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-full max-w-lg" style={{ lineHeight: 0 }}>

          {/* Section 1: Dragon */}
          <Image
            src="/home1.png"
            alt="IVSTAR Dragon"
            width={1564}
            height={2596}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />

          {/* Section 2: Celestial Map */}
          <Image
            src="/home2.png"
            alt="Celestial Map"
            width={1564}
            height={2596}
            style={{ width: "100%", height: "auto", display: "block" }}
          />

        </div>
      </div>
    </main>
  );
}
