"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  DatabaseZap,
  GitCompareArrows,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystTransactionAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystTransactionAnalyticsData,
  type AnalystTransactionInsight,
  type AnalystTransactionRisk,
  type AnalystTransactionStatus,
  type AnalystTransactionType,
} from "@/lib/api/analystApi";

/* =========================================================
   THEME

   Same teal / emerald / slate system as the Analyst Overview
   workspace, so the two pages read as one product.
========================================================= */

const THEME = {
  ink: "#17324D",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  emerald: "#10B981",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  violet: "#7C6CF2",
  amber: "#F59E0B",
  red: "#EF4444",
  axis: "#94A3B8",
} as const;

const TYPE_COLORS = [
  THEME.tealBright,
  THEME.cyan,
  THEME.violet,
  THEME.sky,
] as const;

const TYPE_INNER_COLORS = [
  "#0F766E",
  "#0891B2",
  "#6557D9",
  "#0284C7",
] as const;

/* Ocean-glow surface shared by hero and intelligence panels. */
const DARK_SURFACE =
  "bg-[linear-gradient(135deg,#10243A_0%,#0B4F52_48%,#10273A_100%)] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{ value: AnalystRange; label: string }> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const STATUS_OPTIONS: Array<{ value: AnalystTransactionStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

const TYPE_OPTIONS: Array<{ value: AnalystTransactionType; label: string }> = [
  { value: "all", label: "All types" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAW", label: "Withdraw" },
];

const RISK_OPTIONS: Array<{ value: AnalystTransactionRisk; label: string }> = [
  { value: "all", label: "All risk levels" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

/* Chart series config — drives the gradient defs and the
   Area stack in one place. */
const TREND_SERIES = [
  {
    key: "transactionCount",
    name: "Transactions",
    color: THEME.tealBright,
    gradientId: "colorTransactions",
    begin: 0,
  },
  {
    key: "completedCount",
    name: "Completed",
    color: THEME.emerald,
    gradientId: "colorCompleted",
    begin: 200,
  },
  {
    key: "failedCount",
    name: "Failed",
    color: THEME.red,
    gradientId: "colorFailed",
    begin: 400,
  },
  {
    key: "highRiskCount",
    name: "High risk",
    color: THEME.amber,
    gradientId: "colorHighRisk",
    begin: 600,
  },
] as const;

/* =========================================================
   FORMATTERS
========================================================= */

function numberText(value: number): string {
  return new Intl.NumberFormat("en-BD").format(value);
}

function bucketText(value: string, range: AnalystRange): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    range === "24h"
      ? { hour: "numeric", hour12: true }
      : { month: "short", day: "numeric" }
  ).format(date);
}

function dateTimeText(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; dataKey?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="min-w-[170px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    >
      {label ? (
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-teal-300">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-slate-300">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </span>

            <span className="shrink-0 font-black tabular-nums text-white">
              {numberText(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}


/* =========================================================
   CUSTOM FILTER SELECT

   Native browser <select> menus ignore much of the dashboard
   styling. This popover version keeps every filter consistent
   with the teal / ocean-glow workspace.
========================================================= */

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (
        target &&
        rootRef.current &&
        !rootRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`group flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-background px-3 text-left text-xs font-bold outline-none transition-all duration-200 ${
          open
            ? "border-teal-500 ring-4 ring-teal-500/10 shadow-[0_8px_24px_rgba(13,148,136,0.10)]"
            : "border-border hover:border-teal-500/50 hover:bg-teal-500/[0.025]"
        }`}
      >
        <span className="truncate text-foreground">
          {selected?.label ?? value}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: easeOut }}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-2xl border border-teal-500/15 bg-card/95 p-1.5 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                  active
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                    : "text-foreground hover:bg-muted/70"
                }`}
              >
                <span>{option.label}</span>

                {active ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </motion.div>
      ) : null}
    </div>
  );
}

/* =========================================================
   ALWAYS-ON HERO SIGNAL

   Purely decorative and pointer-events-none. The motion is
   intentionally slow so it feels alive without distracting
   from the transaction controls.
========================================================= */

function HeroSignalOrbit() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-16 top-1/2 hidden h-48 w-72 -translate-y-1/2 xl:block"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute right-3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-teal-200/15"
      >
        <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.95)]" />
        <span className="absolute bottom-4 right-3 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute right-9 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-cyan-200/15"
      >
        <span className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,199,214,0.85)]" />
      </motion.div>

      <div className="absolute left-0 top-[46%] h-px w-32 overflow-hidden bg-white/10">
        <motion.span
          animate={{ x: ["-100%", "260%"] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          className="block h-px w-16 bg-gradient-to-r from-transparent via-teal-200 to-transparent"
        />
      </div>

      <motion.div
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[72px] top-[72px] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-teal-200 shadow-[0_0_34px_rgba(20,184,166,0.12)] backdrop-blur"
      >
        <Sparkles className="h-5 w-5" />
      </motion.div>
    </div>
  );
}

/* =========================================================
   TWO-LEVEL TRANSACTION TYPE PIE
========================================================= */

function TwoLevelTransactionTypePie({
  rows,
}: {
  rows: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}) {
  const pieData = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      name: humanize(row.type),
      value: row.count,
      percentage: row.percentage,
    }));

  if (pieData.length === 0) {
    return (
      <Empty message="No transfer, deposit or withdrawal records match the selected filters." />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="h-[238px] min-h-[238px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="49%"
              outerRadius={67}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={1.5}
              isAnimationActive
              animationBegin={120}
              animationDuration={950}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`inner-${entry.name}`}
                  fill={TYPE_INNER_COLORS[index % TYPE_INNER_COLORS.length]}
                />
              ))}
            </Pie>

            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="49%"
              innerRadius={84}
              outerRadius={111}
              paddingAngle={1}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={1.3}
              labelLine={{
                stroke: THEME.teal,
                strokeWidth: 1,
              }}
              label={({ value }) => numberText(Number(value ?? 0))}
              isAnimationActive
              animationBegin={260}
              animationDuration={1150}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`outer-${entry.name}`}
                  fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                  fillOpacity={0.72}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid rgba(13,148,136,0.18)",
                background: "rgba(15,23,42,0.96)",
                color: "#fff",
                fontSize: 12,
                boxShadow: "0 18px 50px rgba(2,6,23,0.28)",
              }}
              formatter={(value, name) => [
                numberText(Number(value ?? 0)),
                String(name ?? "Transactions"),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {pieData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/25 px-3 py-2"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    TYPE_COLORS[index % TYPE_COLORS.length],
                }}
              />

              <span className="truncate text-[10px] font-black uppercase tracking-wide text-foreground">
                {item.name}
              </span>
            </span>

            <span className="shrink-0 text-[10px] font-black tabular-nums text-muted-foreground">
              {item.percentage.toFixed(1)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   CHANGE
========================================================= */

function Change({
  metric,
  inverse = false,
}: {
  metric: AnalystMetric;
  inverse?: boolean;
}) {
  const change = metric.changePercent;

  if (change === null) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  if (change === 0) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No change vs previous
      </span>
    );
  }

  const rising = change > 0;
  const good = inverse ? !rising : rising;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        good
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {Math.abs(change).toFixed(2)}%
      <span className="font-medium text-muted-foreground">vs previous</span>
    </span>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  description,
  metric,
  icon: Icon,
  iconClass,
  accentClass,
  inverse,
  index = 0,
}: {
  label: string;
  value: string;
  description: string;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
  inverse?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: easeOut }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 break-words text-2xl font-black tabular-nums tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="mt-auto border-t border-border/70 pt-3">
        <Change metric={metric} inverse={inverse} />
      </div>
    </motion.div>
  );
}

/* =========================================================
   PANEL

   `tone="dark"` reuses the hero's gradient so a section can
   be promoted into the same visual tier as the header.
========================================================= */

function Panel({
  title,
  description,
  children,
  action,
  tone = "light",
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, ease: easeOut }}
      className={`relative flex h-full flex-col overflow-hidden rounded-[24px] shadow-sm ${
        dark
          ? `${DARK_SURFACE} border border-white/10 shadow-[0_24px_70px_-40px_rgba(13,148,136,0.5)]`
          : "border border-border bg-card"
      } ${className}`}
    >
      {dark ? (
        <>
          <motion.div
            aria-hidden
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.15, 1] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-24 left-[26%] h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl"
          />
        </>
      ) : null}

      <div
        className={`relative flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
          dark ? "border-white/10" : "border-border"
        }`}
      >
        <div className="min-w-0">
          <h2
            className={`text-base font-extrabold ${
              dark ? "text-white" : "text-foreground"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-1 text-xs leading-5 ${
              dark ? "text-slate-300" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="relative flex-1 p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   BREAKDOWN
========================================================= */

function Breakdown({
  rows,
  color = THEME.teal,
}: {
  rows: Array<{ key: string; count: number; percentage: number }>;
  color?: string;
}) {
  if (rows.length === 0) {
    return <Empty message="No matching breakdown records were found." />;
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <motion.div
          key={row.key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="mb-2 flex items-center justify-between gap-4 text-xs">
            <span className="min-w-0 truncate font-bold text-foreground">
              {humanize(row.key)}
            </span>

            <span className="shrink-0 font-bold tabular-nums text-muted-foreground">
              {numberText(row.count)} · {row.percentage.toFixed(2)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, row.percentage)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: index * 0.05, ease: easeOut }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function Empty({ message, dark = false }: { message: string; dark?: boolean }) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center ${
        dark ? "border-white/15 bg-white/[0.03]" : "border-border bg-muted/20"
      }`}
    >
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          dark ? "bg-teal-500/15 text-teal-300" : "bg-teal-500/10 text-teal-600"
        }`}
      >
        <DatabaseZap className="h-6 w-6" />
      </motion.div>

      <p
        className={`mt-3 text-sm font-extrabold ${dark ? "text-white" : "text-foreground"}`}
      >
        No transaction data
      </p>

      <p
        className={`mt-1 max-w-sm text-xs leading-5 ${
          dark ? "text-slate-400" : "text-muted-foreground"
        }`}
      >
        {message}
      </p>
    </div>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function InsightCard({
  insight,
  index,
}: {
  insight: AnalystTransactionInsight;
  index: number;
}) {
  const style =
    insight.severity === "critical"
      ? "border-red-400/30 bg-red-500/10 text-red-300"
      : insight.severity === "high"
        ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
        : insight.severity === "medium"
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : insight.severity === "positive"
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            : "border-teal-400/30 bg-teal-500/10 text-teal-300";

  const Icon =
    insight.severity === "positive"
      ? CheckCircle2
      : insight.severity === "critical"
        ? XCircle
        : insight.severity === "info"
          ? Activity
          : TriangleAlert;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: easeOut }}
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-4 backdrop-blur ${style}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-white">{insight.title}</p>

            <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-300">{insight.description}</p>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] font-bold text-white">Evidence</p>
            <p className="mt-1 break-words text-[11px] leading-5 text-slate-300">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-300">
            <span className="font-extrabold text-white">Recommended review:</span>{" "}
            {insight.recommendedReview}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystTransactionsPage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [status, setStatus] = useState<AnalystTransactionStatus>("all");
  const [type, setType] = useState<AnalystTransactionType>("all");
  const [risk, setRisk] = useState<AnalystTransactionRisk>("all");
  const [currency, setCurrency] = useState("BDT");
  const [currencyDraft, setCurrencyDraft] = useState("BDT");
  const [data, setData] = useState<AnalystTransactionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result = await getAnalystTransactionAnalytics(
          { range, currency, status, type, risk },
          controller.signal
        );

        if (active) {
          hasLoadedRef.current = true;
          setData(result);
        }
      } catch (loadError) {
        if (active && !controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load transaction analytics."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [range, currency, status, type, risk, refreshKey]);

  const chartData = useMemo(
    () =>
      data?.trend.map((point) => ({
        ...point,
        label: bucketText(point.bucket, range),
      })) ?? [],
    [data, range]
  );

  function applyCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = currencyDraft.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(next)) {
      setError("Currency must be a three-letter ISO code.");
      return;
    }

    setCurrency(next);
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <GitCompareArrows className="mx-auto h-9 w-9 text-teal-600" />
          </motion.div>

          <p className="mt-3 text-sm font-extrabold">Loading transaction intelligence</p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* ===================================================
          HERO — dark gradient (shared by two panels below)
      ==================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`relative overflow-hidden rounded-[30px] border border-white/10 p-6 shadow-[0_28px_80px_-38px_rgba(13,148,136,0.62)] sm:p-7 ${DARK_SURFACE}`}
      >
        <motion.div
          aria-hidden
          animate={{ x: ["-30%", "145%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute left-0 top-0 h-px w-48 bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"
        />

        <HeroSignalOrbit />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.15, 1], x: [0, 26, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/25 blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.25, 0.55, 0.25], y: [0, -22, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-28 left-[28%] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.2, 0.45, 0.2], x: [0, -24, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute right-[26%] top-[30%] h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between xl:pr-[300px]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 backdrop-blur">
              <GitCompareArrows className="h-3.5 w-3.5" />
              Wallet Transaction Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Transaction Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Read-only operational analytics for transfers, deposits, withdrawals, transaction
              reliability and risk.
            </p>

            {data ? (
              <p className="mt-3 text-[11px] font-semibold text-slate-400">
                Updated {dateTimeText(data.generatedAt)}
              </p>
            ) : null}
          </div>

          <motion.button
            type="button"
            disabled={refreshing}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRefreshKey((current) => current + 1)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-extrabold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>
      </motion.section>

      {/* ERROR */}

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="min-w-0 break-words text-xs text-red-600">{error}</p>
        </motion.div>
      ) : null}

      {/* FILTERS */}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: easeOut }}
        className="relative z-30 rounded-[22px] border border-border bg-card/95 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] backdrop-blur"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterSelect
            label="Period"
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
          />

          <FilterSelect
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />

          <FilterSelect
            label="Transaction type"
            value={type}
            options={TYPE_OPTIONS}
            onChange={setType}
          />

          <FilterSelect
            label="Risk level"
            value={risk}
            options={RISK_OPTIONS}
            onChange={setRisk}
          />

          <form onSubmit={applyCurrency}>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Currency
            </span>

            <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-background transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
              <input
                value={currencyDraft}
                onChange={(event) =>
                  setCurrencyDraft(
                    event.target.value
                      .replace(/[^a-z]/gi, "")
                      .slice(0, 3)
                      .toUpperCase()
                  )
                }
                maxLength={3}
                aria-label="Currency code"
                className="min-w-0 flex-1 bg-transparent px-3 text-center text-xs font-black uppercase outline-none"
              />

              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                className="border-l border-teal-500/20 bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(13,148,136,0.18)] transition hover:brightness-105"
              >
                Apply
              </motion.button>
            </div>
          </form>
        </div>
      </motion.section>

      {data ? (
        <>
          {/* METRICS */}

          <section className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              index={0}
              label="Transactions"
              value={numberText(data.metrics.transactionCount.value)}
              description="All matching wallet transactions"
              metric={data.metrics.transactionCount}
              icon={GitCompareArrows}
              iconClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
              accentClass="bg-teal-500"
            />

            <MetricCard
              index={1}
              label="Completion Rate"
              value={`${data.metrics.completionRate.value.toFixed(2)}%`}
              description={`${numberText(data.metrics.completedCount.value)} completed`}
              metric={data.metrics.completionRate}
              icon={CheckCircle2}
              iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              accentClass="bg-emerald-500"
            />

            <MetricCard
              index={2}
              label="Failure Rate"
              value={`${data.metrics.failureRate.value.toFixed(2)}%`}
              description={`${numberText(data.metrics.failedCount.value)} failed`}
              metric={data.metrics.failureRate}
              icon={XCircle}
              iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
              accentClass="bg-red-500"
              inverse
            />

            <MetricCard
              index={3}
              label="High-risk Share"
              value={`${data.metrics.highRiskRate.value.toFixed(2)}%`}
              description={`${numberText(data.metrics.highRiskCount.value)} high-risk transactions`}
              metric={data.metrics.highRiskRate}
              icon={ShieldAlert}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              accentClass="bg-amber-500"
              inverse
            />
          </section>

          {/* ===================================================
              TREND — dark section #1, Recharts AreaChart with
              per-series gradient fills
          ==================================================== */}

          <Panel
            tone="dark"
            title="Transaction Reliability Trend"
            description="Transaction activity, completion, failures and high-risk records across the selected period."
            action={
              <div className="flex flex-wrap gap-3">
                {TREND_SERIES.map((series) => (
                  <span
                    key={series.key}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-slate-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: series.color }}
                    />
                    {series.name}
                  </span>
                ))}
              </div>
            }
          >
            {chartData.some((point) => point.transactionCount > 0) ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                  >
                    <defs>
                      {TREND_SERIES.map((series) => (
                        <linearGradient
                          key={series.gradientId}
                          id={series.gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={series.color} stopOpacity={0.55} />
                          <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="rgba(255,255,255,0.09)"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: THEME.axis }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={22}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: THEME.axis }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "rgba(20,184,166,0.35)", strokeWidth: 2 }}
                    />

                    {TREND_SERIES.map((series) => (
                      <Area
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={series.key === "transactionCount" ? 3 : 2}
                        activeDot={{ stroke: series.color, r: 5, strokeWidth: 2 }}
                        fillOpacity={1}
                        fill={`url(#${series.gradientId})`}
                        isAnimationActive
                        animationBegin={series.begin}
                        animationDuration={1300}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                dark
                message="No wallet transaction activity matches the selected filters."
              />
            )}
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid items-stretch gap-6 xl:grid-cols-3">
            <Panel
              className="min-h-[380px]"
              title="Transaction Status"
              description="Current lifecycle distribution."
            >
              <div className="flex h-full items-center">
                <div className="w-full">
                  <Breakdown
                    color={THEME.teal}
                    rows={data.statuses.map((item) => ({
                      key: item.status,
                      count: item.count,
                      percentage: item.percentage,
                    }))}
                  />
                </div>
              </div>
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Transaction Types"
              description="Two-level visual mix for transfer, deposit and withdrawal activity."
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/15 bg-teal-500/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  <Sparkles className="h-3 w-3" />
                  Live mix
                </span>
              }
            >
              <TwoLevelTransactionTypePie rows={data.types} />
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Risk Distribution"
              description="Aggregate risk classifications without financial value exposure."
            >
              <div className="flex h-full items-center">
                <div className="w-full">
                  <Breakdown
                    color={THEME.amber}
                    rows={data.risks.map((item) => ({
                      key: item.risk,
                      count: item.count,
                      percentage: item.percentage,
                    }))}
                  />
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid items-stretch gap-6 xl:grid-cols-2">
            {/* FAILURE REASONS */}

            <Panel
              title="Failure Reasons"
              description="Most frequent failure codes or recorded failure reasons."
            >
              <Breakdown
                color={THEME.red}
                rows={data.failureReasons.map((item) => ({
                  key: item.code,
                  count: item.count,
                  percentage: item.percentage,
                }))}
              />
            </Panel>

            {/* ===================================================
                INTELLIGENCE — dark section #2
            ==================================================== */}

            <Panel
              tone="dark"
              title="Transaction Intelligence"
              description="Deterministic reliability, backlog and risk signals."
              action={
                <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-200">
                  <Activity className="h-3.5 w-3.5" />
                  {data.insights.length} signals
                </span>
              }
            >
              {data.insights.length > 0 ? (
                <div className="space-y-3">
                  {data.insights.map((insight, index) => (
                    <InsightCard key={insight.id} insight={insight} index={index} />
                  ))}
                </div>
              ) : (
                <Empty
                  dark
                  message="No deterministic transaction signal was generated for these filters."
                />
              )}
            </Panel>
          </div>

          {/* PRIVACY */}

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />

              <div className="min-w-0">
                <p className="text-xs font-extrabold">
                  Privacy-safe transaction intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {data.privacy.note}
                </p>
              </div>
            </div>
          </motion.section>
        </>
      ) : null}
    </main>
  );
}