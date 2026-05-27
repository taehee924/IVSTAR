import Header from "@/components/layout/Header";

export default function StorePage() {
  return (
    <main
      className="min-h-screen pt-14"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />
      <div className="w-full max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 pt-8">
        <h1 className="text-[21px] font-bold text-gray-800">Store</h1>
        <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
      </div>
    </main>
  );
}