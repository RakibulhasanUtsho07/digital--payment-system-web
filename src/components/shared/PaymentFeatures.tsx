"use client";

import { CompanyMarquee } from "./payment-features/CompanyMarquee";
import { FaqSection } from "./payment-features/Faqsection";
import { FeatureHighlights } from "./payment-features/Featurehighlights";
import { useInView } from "./payment-features/Hooks";
import { SectionStyles } from "./payment-features/Sectionstyles";
import { SecuritySection } from "./payment-features/SecuritySection";
import { StatsAndBanner } from "./payment-features/Statsandbanner";

export default function PaymentFeatures() {
  const [featuresRef, featuresVisible] =
    useInView<HTMLDivElement>({
      threshold: 0.12,
    });

  const [securityRef, securityVisible] =
    useInView<HTMLDivElement>({
      threshold: 0.12,
    });

  const [statsRef, statsVisible] =
    useInView<HTMLDivElement>({
      threshold: 0.16,
    });

  const [bannerRef, bannerVisible] =
    useInView<HTMLDivElement>({
      threshold: 0.12,
    });

  const [faqRef, faqVisible] =
    useInView<HTMLDivElement>({
      threshold: 0.12,
    });

  return (
    <div className="relative bg-white text-[#120d25]">
      <SectionStyles />

      <FeatureHighlights
        rootRef={featuresRef}
        visible={featuresVisible}
      />

      <CompanyMarquee />

      <SecuritySection
        rootRef={securityRef}
        visible={securityVisible}
      />

      <StatsAndBanner
        statsRef={statsRef}
        bannerRef={bannerRef}
        statsVisible={statsVisible}
        bannerVisible={bannerVisible}
      />

      <FaqSection
        rootRef={faqRef}
        visible={faqVisible}
      />
    </div>
  );
}