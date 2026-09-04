"use client";

export function SectionStyles() {
  return (
    <style>{`
      @keyframes cofferMarquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes featureProgress {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }
      @keyframes securitySpin {
        to { transform: rotate(360deg); }
      }
      @keyframes transactionFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      .marquee-mask {
        mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
      }
      .coffer-marquee {
        animation: cofferMarquee 24s linear infinite;
      }
      .feature-progress {
        transform-origin: left;
        animation: featureProgress 4.2s linear forwards;
      }
      .security-spin {
        animation: securitySpin 16s linear infinite;
      }
      .transaction-row {
        animation: transactionFloat 3.4s ease-in-out infinite;
      }
      .coffer-reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1);
      }
      .coffer-reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .coffer-marquee, .feature-progress, .security-spin, .transaction-row {
          animation: none !important;
        }
        .coffer-reveal {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
