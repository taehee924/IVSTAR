import Header from "@/components/layout/Header";
import Image from "next/image";

export default function StorePage() {
  return (
    <main style={{ background: "#F6F3ED" }}>
      <Header />

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
          <Image
            src="/home2.png"
            alt="Store"
            width={1564}
            height={2596}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>
      </div>
    </main>
  );
}