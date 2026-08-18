import HeroBanner from "@/components/shared/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <HeroBanner />
      </div>
    </main>
  );
}