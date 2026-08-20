"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Globe2, ShieldCheck, Zap } from "lucide-react";
import type { Feature } from "./Types";

/* ---------------------------------------------------------
   FeatureHighlights — the "Designed for lightning-fast
   transactions" intro plus the interactive stepper below it:
   left is a clickable step list (auto-advances on a timer,
   with a progress bar under the active step); right is a
   horizontal sliding "filmstrip" panel — each feature sits at
   translateX = (index - active) * 100%, so the active one is
   centered, the next one waits just off the right edge, and
   the previous one slides fully out to the left.
--------------------------------------------------------- */

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
    <div ref={rootRef}>
      <div className={`text-center max-w-3xl mx-auto mb-16 space-y-4 reveal ${visible ? "in" : ""}`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          Next-Gen Payment Experience
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Designed for{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            lightning-fast
          </span>{" "}
          transactions
        </h2>

        <p className="text-muted-foreground text-base md:text-lg">
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
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center reveal ${visible ? "in" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left: step list */}
      <div className="space-y-3 order-2 md:order-1">
        {features.map((feature, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl text-left overflow-hidden transition-all duration-500 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                  : "bg-card border border-border/70 text-foreground hover:border-primary/40"
              }`}
            >
              <div>
                <div className={`text-[11px] font-semibold mb-1 ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                  Step 0{i + 1}
                </div>
                <div className="font-semibold text-sm md:text-base">{feature.title}</div>
              </div>

              {isActive ? (
                <ArrowRight className="w-4 h-4 shrink-0" />
              ) : (
                <ArrowUpRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              )}

              {isActive && !paused && (
                <span
                  key={active}
                  className="step-progress-fill absolute left-0 bottom-0 h-0.5 bg-primary-foreground/70"
                  style={{ animationDuration: `${AUTO_MS}ms` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: sliding filmstrip panel */}
      <div className="order-1 md:order-2 relative h-[320px] sm:h-[360px] rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const offset = (i - active) * 100;
          return (
            <div
              key={i}
              className="slide-panel-item absolute inset-0 p-8 md:p-10 flex flex-col justify-between"
              style={{
                transform: `translateX(${offset}%)`,
                opacity: i === active ? 1 : 0,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  key={i === active ? `active-${active}` : i}
                  className={`w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ${
                    i === active ? "icon-pop" : ""
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                  {feature.tag}
                </span>
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Dot indicators bottom-right of panel */}
        <div className="absolute bottom-5 right-6 flex items-center gap-1.5">
          {features.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                i === active ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}