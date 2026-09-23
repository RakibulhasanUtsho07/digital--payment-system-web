"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from "lucide-react";

export function formatSupportAiDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function humanizeSupportAi(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function toneForSeverity(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "critical" || normalized === "urgent" || normalized === "breached") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  if (normalized === "high") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }
  if (normalized === "medium" || normalized === "attention" || normalized === "at_risk") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (normalized === "healthy" || normalized === "verified" || normalized === "resolved" || normalized === "responded") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}

export function SupportAiPill({ children, tone = "default" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${toneForSeverity(tone)}`}>
      {children}
    </span>
  );
}

export function SupportAiMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: string;
}) {
  const Icon = tone === "critical" ? ShieldAlert : tone === "attention" ? AlertTriangle : tone === "healthy" ? CheckCircle2 : Clock3;
  return (
    <div className="rounded-[24px] border border-border bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</div>
          {hint ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${toneForSeverity(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function SupportAiEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-black text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
