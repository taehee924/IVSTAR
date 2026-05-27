import Header from "@/components/layout/Header";

export default function StorePage() {
  return (
    <main
      className="min-h-screen"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />
      <div className="max-w-lg mx-auto px-4 pt-12">
        <h1 className="text-[21px] font-bold text-gray-800">Store</h1>
        <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
      </div>
    </main>
  );
}