"use client";

import { FaqSection } from "./payment-features/Faqsection";
import { FeatureHighlights } from "./payment-features/Featurehighlights";
import { useInView } from "./payment-features/Hooks";
import { SectionStyles } from "./payment-features/Sectionstyles";
import { StatsAndBanner } from "./payment-features/Statsandbanner";

export default function PaymentFeatures() {
  const [featuresRef, featuresInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [bannerRef, bannerInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [faqRef, faqInView] = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    /* py-24 কমিয়ে pt-4 sm:pt-8 pb-16 sm:pb-24 করা হয়েছে */
    <section className="pt-4 sm:pt-8 pb-16 sm:pb-24 bg-background relative overflow-hidden space-y-6">
      <SectionStyles />

      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
        style={{ animation: "floatGlow 8s ease-in-out infinite" }}
      />

      <div className="w-[95%] mx-auto px-4 sm:px-6 space-y-8">
        <FeatureHighlights rootRef={featuresRef} visible={featuresInView} />

        <StatsAndBanner
          statsRef={statsRef}
          bannerRef={bannerRef}
          statsVisible={statsInView}
          bannerVisible={bannerInView}
        />

        <FaqSection rootRef={faqRef} visible={faqInView} />
      </div>
    </section>
  );
}