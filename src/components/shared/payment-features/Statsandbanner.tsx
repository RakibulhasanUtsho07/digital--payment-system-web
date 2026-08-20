"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  Smartphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCountUp, formatStat, parseStatTarget } from "./Hooks";
import type { Stat, Tx, TxTemplate } from "./Types";

/* ---------------------------------------------------------
   Live transaction data pool — realistic name/bank/currency
   combinations so generated rows never look random-garbled.
--------------------------------------------------------- */

const TX_TEMPLATES: TxTemplate[] = [
  { name: "Rafiq H.", to: "Dhaka Bank", currency: "$", min: 40, max: 900, decimals: 2 },
  { name: "Nadia S.", to: "Deutsche Bank", currency: "€", min: 60, max: 2200, decimals: 2 },
  { name: "James K.", to: "Chase", currency: "$", min: 20, max: 500, decimals: 2 },
  { name: "Aiko T.", to: "MUFG", currency: "¥", min: 3000, max: 150000, decimals: 0 },
  { name: "Fatima Z.", to: "Barclays", currency: "£", min: 30, max: 700, decimals: 2 },
  { name: "Lucas M.", to: "Nubank", currency: "$", min: 100, max: 3000, decimals: 2 },
  { name: "Priya R.", to: "HDFC", currency: "₹", min: 500, max: 40000, decimals: 0 },
  { name: "Omar A.", to: "Emirates NBD", currency: "$", min: 80, max: 1800, decimals: 2 },
  { name: "Tanvir I.", to: "BRAC Bank", currency: "৳", min: 1000, max: 60000, decimals: 0 },
  { name: "Sofia R.", to: "BBVA", currency: "€", min: 25, max: 950, decimals: 2 },
  { name: "Wei C.", to: "ICBC", currency: "¥", min: 200, max: 12000, decimals: 0 },
  { name: "Grace O.", to: "Standard Bank", currency: "$", min: 15, max: 400, decimals: 2 },
];

function randomAmount(t: TxTemplate): string {
  const value = t.min + Math.random() * (t.max - t.min);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: t.decimals,
    maximumFractionDigits: t.decimals,
  });
  return `${t.currency}${formatted}`;
}

function makeTx(id: number): Tx {
  const t = TX_TEMPLATES[Math.floor(Math.random() * TX_TEMPLATES.length)];
  return { id, name: t.name, amount: randomAmount(t), to: t.to, time: Date.now() };
}

function timeAgoLabel(time: number, nowTick: number): string {
  const elapsed = Math.max(0, Math.round((nowTick - time) / 1000));
  if (elapsed < 2) return "Just now";
  if (elapsed < 60) return `${elapsed}s ago`;
  return `${Math.floor(elapsed / 60)}m ago`;
}

const STATS: Stat[] = [
  { icon: Users, value: "2M+", label: "Active Users" },
  { icon: CreditCard, value: "$5B+", label: "Processed Annually" },
  { icon: Globe2, value: "120+", label: "Countries Supported" },
  { icon: Building2, value: "10K+", label: "Partner Merchants" },
];

const HIGHLIGHTS: string[] = [
  "Zero hidden maintenance fees",
  "Instant SMS & Email payout notifications",
  "24/7 Priority customer support",
  "Seamless API integration for web & mobile",
];

export function StatsAndBanner({
  statsRef,
  bannerRef,
  statsVisible,
  bannerVisible,
}: {
  statsRef: React.RefObject<HTMLDivElement | null>;
  bannerRef: React.RefObject<HTMLDivElement | null>;
  statsVisible: boolean;
  bannerVisible: boolean;
}) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Live Stats */}
      <div
        ref={statsRef}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-5 sm:p-8 rounded-3xl bg-card/50 border border-border/80 backdrop-blur-sm reveal ${statsVisible ? "in" : ""}`}
      >
        {STATS.map((stat, idx) => (
          <StatItem key={idx} stat={stat} start={statsVisible} delay={idx * 120} />
        ))}
      </div>

      {/* Integration Banner */}
      <div
        ref={bannerRef}
        className={`rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-lg reveal ${bannerVisible ? "in" : ""}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 text-sm font-semibold text-primary">
              <Smartphone className="w-4 h-4" />
              Modern Mobile & Web SDK
            </div>

            {/* Typography scaling for mobile to desktop */}
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Start accepting digital payments in under 5 minutes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {HIGHLIGHTS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Buttons stack on mobile, row on larger screens */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                Create Merchant Account
                <ArrowUpRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl font-semibold hover:-translate-y-0.5 transition-all duration-300"
              >
                View API Docs
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end w-full">
            <LiveTransactionFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Live transaction feed
--------------------------------------------------------- */

function LiveTransactionFeed() {
  const MAX_VISIBLE = 5;
  const idRef = useRef(1);

  const [txs, setTxs] = useState<Tx[]>([]);
  const [nowTick, setNowTick] = useState(0);
  const [volume, setVolume] = useState(482_310);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = Array.from({ length: MAX_VISIBLE }, (_, i) => {
      const tx = makeTx(idRef.current++);
      return { ...tx, time: Date.now() - i * 6000 };
    });
    setTxs(initial);
    setNowTick(Date.now());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let timeout: number;
    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 2000;
      timeout = window.setTimeout(() => {
        setTxs((prev) => {
          const next = makeTx(idRef.current++);
          const withNew = [next, ...prev];
          if (withNew.length > MAX_VISIBLE) {
            const overflowIndex = MAX_VISIBLE;
            return withNew.map((tx, i) => (i === overflowIndex ? { ...tx, leaving: true } : tx));
          }
          return withNew;
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => window.clearTimeout(timeout);
  }, [mounted]);

  useEffect(() => {
    const leaver = txs.find((tx) => tx.leaving);
    if (!leaver) return;
    const t = window.setTimeout(() => {
      setTxs((prev) => prev.filter((tx) => tx.id !== leaver.id));
    }, 360);
    return () => window.clearTimeout(t);
  }, [txs]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVolume((v) => v + Math.round(80 + Math.random() * 420));
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  return (
    // width responsive fix
    <div className="w-full max-w-[100%] sm:max-w-md lg:max-w-sm xl:max-w-md p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted-foreground">Live Transactions</span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <span className="live-dot status-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col">
        {!mounted
          ? Array.from({ length: MAX_VISIBLE }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center justify-between gap-4 sm:gap-6 text-sm border-b border-border/40 px-1 sm:px-2 py-2.5 mb-1 last:border-none animate-pulse"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-muted" />
                  <div className="h-2.5 w-24 rounded bg-muted" />
                </div>
                <div className="text-right shrink-0 space-y-1.5">
                  <div className="h-3.5 w-16 rounded bg-muted ml-auto" />
                  <div className="h-2.5 w-12 rounded bg-muted ml-auto" />
                </div>
              </div>
            ))
          : txs.map((tx) => (
              <div
                key={tx.id}
                className={`tx-row ${tx.leaving ? "tx-leaving" : ""} flex items-center justify-between gap-4 sm:gap-6 text-sm border-b border-border/40 px-1 sm:px-2 py-2.5 mb-1 last:border-none`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{tx.name}</div>
                  <div className="text-xs text-muted-foreground truncate">→ {tx.to}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-foreground tabular-nums">{tx.amount}</div>
                  <div className="text-[10px] font-semibold text-emerald-500">
                    {timeAgoLabel(tx.time, nowTick)}
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="pt-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Processed today</span>
        <span className="font-bold text-foreground tabular-nums">
          ${volume.toLocaleString("en-US")}
        </span>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
        <div className="h-full bg-primary w-3/4 rounded-full relative overflow-hidden">
          <span
            className="absolute inset-y-0 left-0 w-1/3 bg-white/40"
            style={{ animation: "shimmerBar 2.2s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Stat item component
--------------------------------------------------------- */

function StatItem({ stat, start, delay }: { stat: Stat; start: boolean; delay: number }): ReactNode {
  const Icon = stat.icon;
  const target = parseStatTarget(stat.value);
  const animated = useCountUp(target, start, 1300);

  return (
    <div
      className={`stat-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-transparent reveal ${start ? "in" : ""}`}
      style={{ transitionDelay: start ? `${delay}ms` : "0ms" }}
    >
      <div className="stat-icon w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div>
        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tabular-nums">
          {formatStat(stat.value, animated)}
        </div>
        <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</div>
      </div>
    </div>
  );
}