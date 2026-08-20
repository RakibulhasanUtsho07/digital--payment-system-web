"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Globe2, ShieldCheck, Zap } from "lucide-react";
import type { Feature } from "./Types";

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Instant Money Settlement",
    description:
      "Transfer money globally with zero latency. Direct settlement into local bank accounts within seconds.",
    tag: "Real-time",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Encryption",
    description:
      "256-bit SSL encryption and AI fraud detection keep every single micro-transaction 100% secure.",
    tag: "PCI-DSS Level 1",
  },
  {
    icon: Globe2,
    title: "Multi-Currency Gateway",
    description:
      "Accept 130+ currencies with real-time exchange rates and transparent low transaction fees.",
    tag: "Global Access",
  },
  {
    icon: BarChart3,
    title: "Smart Business Analytics",
    description:
      "Comprehensive financial insights, dynamic graphs, and downloadable monthly revenue reports.",
    tag: "AI Powered",
  },
];

export function FeatureHighlights({
  rootRef,
  visible,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  return (
    /* Top padding pt-0 এ সেট করা হয়েছে extra gap সরানোর জন্য */
    <div ref={rootRef} className="w-full px-2 sm:px-6 lg:px-8 pt-0 pb-6 sm:pb-10">
      {/* Header mb-6 sm:mb-10 করা হয়েছে */}
      <div className={`text-center max-w-3xl mx-auto mb-6 sm:mb-10 lg:mb-12 space-y-3 sm:space-y-4 reveal ${visible ? "in" : ""}`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          Next-Gen Payment Experience
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Designed for{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            lightning-fast
          </span>{" "}
          transactions
        </h2>

        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Empower your digital finance with cutting-edge tools built for seamless payments, robust
          security, and global scalability.
        </p>
      </div>

      <FeatureStepper features={FEATURES} visible={visible} />
    </div>
  );
}

function FeatureStepper({ features, visible }: { features: Feature[]; visible: boolean }): ReactNode {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const AUTO_MS = 4200;

  useEffect(() => {
    if (paused || !visible) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, visible, features.length]);

  const handleSelect = (i: number) => {
    setActive(i);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 8000);
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto reveal ${visible ? "in" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left: Interactive Step Navigation List */}
      <div className="space-y-2.5 sm:space-y-3.5 order-2 lg:order-1 flex flex-col justify-center">
        {features.map((feature, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative w-full flex items-center justify-between gap-3 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl text-left overflow-hidden transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg scale-[1.01] sm:scale-[1.02]"
                  : "bg-card border border-border/70 text-foreground hover:border-primary/40 active:scale-[0.99]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] sm:text-[11px] font-semibold mb-0.5 sm:mb-1 ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                  Step 0{i + 1}
                </div>
                <div className="font-semibold text-xs sm:text-sm md:text-base truncate">{feature.title}</div>
              </div>

              {isActive ? (
                <ArrowRight className="w-4 h-4 shrink-0 ml-2" />
              ) : (
                <ArrowUpRight className="w-4 h-4 shrink-0 ml-2 text-muted-foreground" />
              )}

              {isActive && !paused && (
                <span
                  key={active}
                  className="step-progress-fill absolute left-0 bottom-0 h-0.5 sm:h-1 bg-primary-foreground/80"
                  style={{ animationDuration: `${AUTO_MS}ms` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Responsive Filmstrip Visual Panel */}
      <div className="order-1 lg:order-2 relative min-h-[300px] h-[320px] sm:h-[350px] lg:h-auto lg:min-h-[380px] rounded-2xl sm:rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const offset = (i - active) * 100;
          return (
            <div
              key={i}
              className="slide-panel-item absolute inset-0 p-5 sm:p-8 lg:p-10 flex flex-col justify-between transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${offset}%)`,
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  key={i === active ? `active-${active}` : i}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ${
                    i === active ? "icon-pop" : ""
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md sm:rounded-lg bg-muted text-muted-foreground border border-border shrink-0">
                  {feature.tag}
                </span>
              </div>

              <div className="my-auto py-4">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed max-w-md">
                  {feature.description}
                </p>
              </div>

              <div className="h-4" />
            </div>
          );
        })}

        {/* Bottom Indicator Dots */}
        <div className="absolute bottom-4 right-5 sm:bottom-5 sm:right-6 flex items-center gap-1.5 z-10">
          {features.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 sm:w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}