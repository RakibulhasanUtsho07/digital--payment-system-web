import HeroBanner from "@/components/shared/HeroSection";
import PaymentFeatures from "@/components/shared/PaymentFeatures";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <HeroBanner />
        <PaymentFeatures />
      </div>
    </main>
  );
}