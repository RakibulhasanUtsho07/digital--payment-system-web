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
    <section className="py-24 bg-background relative overflow-hidden space-y-24">
      <SectionStyles />

      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
        style={{ animation: "floatGlow 8s ease-in-out infinite" }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-24">
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