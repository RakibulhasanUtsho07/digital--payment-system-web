"use client";

export function SectionStyles() {
  return (
    <style>{`
      /* ---------------------------------------------------------
         Keyframe Animations
      --------------------------------------------------------- */
      @keyframes floatGlow {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
        50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
      }

      @keyframes pulseRing {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); }
        70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      @keyframes shimmerBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(220%); }
      }

      @keyframes stepProgress {
        from { width: 0%; }
        to { width: 100%; }
      }

      @keyframes iconPop {
        0% { transform: scale(0.7) rotate(-8deg); opacity: 0; }
        60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      @keyframes txSlideIn {
        from { opacity: 0; transform: translateY(-10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes txSlideOut {
        from { opacity: 1; max-height: 64px; margin-bottom: 0.75rem; transform: translateY(0) scale(1); }
        to { opacity: 0; max-height: 0; margin-bottom: 0; transform: translateY(6px) scale(0.97); }
      }

      @keyframes txFreshFlash {
        0% { background-color: rgba(16, 185, 129, 0.14); }
        100% { background-color: rgba(16, 185, 129, 0); }
      }

      @keyframes dotBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }

      /* ---------------------------------------------------------
         Utility Classes & Base Motion
      --------------------------------------------------------- */
      .status-dot { 
        animation: pulseRing 2s infinite; 
      }

      /* Responsive reveal distance (smaller on mobile to prevent overflow/scrollbars) */
      .reveal {
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.5s ease, transform 0.5s ease;
        will-change: opacity, transform;
      }

      @media (min-width: 640px) {
        .reveal {
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
      }

      .reveal.in { 
        opacity: 1; 
        transform: translateY(0); 
      }

      .step-progress-fill {
        animation: stepProgress linear forwards;
        will-change: width;
      }

      .slide-panel-item {
        transition: transform 0.5s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease;
        will-change: transform, opacity;
      }

      @media (min-width: 768px) {
        .slide-panel-item {
          transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.5s ease;
        }
      }

      .icon-pop {
        animation: iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .tx-row {
        animation: txSlideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), txFreshFlash 1.8s ease-out;
        border-radius: 0.75rem;
        will-change: transform, opacity;
      }

      .tx-row.tx-leaving {
        animation: txSlideOut 0.35s ease forwards;
        overflow: hidden;
        will-change: max-height, opacity, margin-bottom;
      }

      .live-dot {
        animation: dotBlink 1.6s ease-in-out infinite;
      }

      /* ---------------------------------------------------------
         Stat Cards & Mobile-Aware Hover State
      --------------------------------------------------------- */
      .stat-card {
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease;
      }

      .stat-icon {
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* Restrict hover elevation to fine pointing devices (prevents sticky hover states on mobile touch) */
      @media (hover: hover) and (pointer: fine) {
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: hsl(var(--primary) / 0.35);
          box-shadow: 0 12px 28px -14px rgba(0,0,0,0.25);
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(-6deg);
        }
      }

      /* Active tap feedback for mobile devices */
      @media (hover: none) {
        .stat-card:active {
          transform: scale(0.98);
        }
      }

      /* ---------------------------------------------------------
         Accessibility & Reduced Motion
      --------------------------------------------------------- */
      @media (prefers-reduced-motion: reduce) {
        .reveal, 
        .tx-row, 
        .tx-row.tx-leaving, 
        .icon-pop, 
        .status-dot, 
        .live-dot, 
        .stat-card, 
        .stat-icon, 
        .slide-panel-item,
        .step-progress-fill {
          animation: none !important;
          transition: none !important;
        }

        .reveal {
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}