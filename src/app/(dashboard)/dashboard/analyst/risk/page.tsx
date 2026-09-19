"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  DatabaseZap,
  Filter,
  Gauge,
  Radar,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystRiskAnalytics,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
  type AnalystRiskAnalyticsData,
  type AnalystRiskInsight,
  type AnalystRiskSource,
} from "@/lib/api/analystApi";

/* =========================================================
   THEME
========================================================= */

const THEME = {
  ink: "#10243A",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  amber: "#F59E0B",
  orange: "#F97316",
  red: "#EF4444",
  violet: "#8B5CF6",
  slate: "#64748B",
  axis: "#94A3B8",
} as const;

const DARK_SURFACE =
  "bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

const RISK_COLORS: Record<string, string> = {
  LOW: THEME.emerald,
  MEDIUM: THEME.amber,
  HIGH: THEME.red,
  CRITICAL: "#DC2626",
};

const SOURCE_COLORS = [
  THEME.tealBright,
  THEME.cyan,
  THEME.sky,
  THEME.violet,
  THEME.emerald,
];

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
}> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
}> = [
  { value: "all", label: "All payment modes" },
  { value: "live", label: "Live payments" },
  { value: "test", label: "Test payments" },
];

const SOURCE_OPTIONS: Array<{
  value: AnalystRiskSource;
  label: string;
}> = [
  { value: "all", label: "All payment sources" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "local_psp", label: "Local PSP" },
  { value: "wallet", label: "Wallet" },
];

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-BD").format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function bucketLabel(
  value: string,
  range: AnalystRange
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    range === "24h"
      ? {
          hour: "numeric",
          hour12: true,
        }
      : {
          month: "short",
          day: "numeric",
        }
  ).format(date);
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/* =========================================================
   CHANGE
========================================================= */

function Change({
  metric,
  inverse = true,
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
  const positive = inverse ? !rising : rising;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {Math.abs(change).toFixed(2)}%
      <span className="font-medium text-muted-foreground">
        vs previous
      </span>
    </span>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  helper,
  metric,
  icon: Icon,
  iconClass,
  accentClass,
  inverse = true,
  index = 0,
}: {
  label: string;
  value: string;
  helper: string;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
  inverse?: boolean;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.42,
        delay: index * 0.06,
        ease: easeOut,
      }}
      className="group relative flex min-h-[172px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
            {helper}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 18,
          }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="mt-auto border-t border-border/70 pt-3">
        <Change
          metric={metric}
          inverse={inverse}
        />
      </div>
    </motion.article>
  );
}

/* =========================================================
   PANEL
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
          ? `${DARK_SURFACE} border border-white/10 shadow-[0_24px_70px_-40px_rgba(13,148,136,0.55)]`
          : "border border-border bg-card"
      } ${className}`}
    >
      {dark ? (
        <>
          <motion.div
            aria-hidden
            animate={{
              opacity: [0.3, 0.68, 0.3],
              scale: [1, 1.14, 1],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
          />

          <motion.div
            aria-hidden
            animate={{
              opacity: [0.15, 0.42, 0.15],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 17,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-28 left-[22%] h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
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

      <div className="relative flex-1 p-5">
        {children}
      </div>
    </motion.section>
  );
}

/* =========================================================
   CUSTOM FILTER SELECT
========================================================= */

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{
    value: T;
    label: string;
  }>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected =
    options.find((option) => option.value === value) ??
    options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left outline-none transition hover:border-teal-500/45 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-xs font-extrabold text-foreground">
          {selected?.label}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
            role="listbox"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                    active
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                  role="option"
                  aria-selected={active}
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
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function Empty({
  message,
  dark = false,
}: {
  message: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center ${
        dark
          ? "border-white/15 bg-white/[0.03]"
          : "border-border bg-muted/20"
      }`}
    >
      <motion.div
        animate={{
          opacity: [0.55, 1, 0.55],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          dark
            ? "bg-teal-500/15 text-teal-300"
            : "bg-teal-500/10 text-teal-600"
        }`}
      >
        <DatabaseZap className="h-6 w-6" />
      </motion.div>

      <p
        className={`mt-3 text-sm font-extrabold ${
          dark ? "text-white" : "text-foreground"
        }`}
      >
        No matching risk data
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
   DISTRIBUTION
========================================================= */

function Distribution({
  rows,
  color = THEME.teal,
}: {
  rows: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
  color?: string;
}) {
  if (rows.length === 0) {
    return (
      <Empty message="No distribution data exists for these filters." />
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row, index) => (
        <motion.div
          key={row.key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: index * 0.05,
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="truncate text-xs font-bold text-foreground">
              {humanize(row.key)}
            </p>

            <p className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
              {formatNumber(row.count)} · {row.percentage.toFixed(2)}%
            </p>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{
                width: `${Math.min(100, row.percentage)}%`,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.9,
                delay: index * 0.05,
                ease: easeOut,
              }}
              className="h-full rounded-full"
              style={{
                backgroundColor: color,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function RiskChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    color?: string;
    fill?: string;
  }>;
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
      className="min-w-[180px] rounded-2xl border border-white/10 bg-[#0D1D29]/95 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    >
      {label ? (
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-teal-300">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={`${String(entry.dataKey)}-${index}`}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-slate-300">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    entry.color ??
                    entry.fill ??
                    THEME.tealBright,
                }}
              />

              <span className="truncate">
                {entry.name}
              </span>
            </span>

            <span className="shrink-0 font-black tabular-nums text-white">
              {formatNumber(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* =========================================================
   TWO LEVEL PIE
========================================================= */

function TwoLevelRiskPie({
  transactionRisk,
  sources,
}: {
  transactionRisk: Array<{
    risk: string;
    count: number;
    percentage: number;
  }>;
  sources: Array<{
    source: string;
    riskBlockedCount: number;
    riskBlockedRate: number;
  }>;
}) {
  const innerData = transactionRisk
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: humanize(item.risk),
      value: item.count,
      color:
        RISK_COLORS[item.risk] ??
        THEME.slate,
    }));

  const outerData = sources
    .filter((item) => item.riskBlockedCount > 0)
    .map((item, index) => ({
      name: humanize(item.source),
      value: item.riskBlockedCount,
      color:
        SOURCE_COLORS[index % SOURCE_COLORS.length],
    }));

  if (
    innerData.length === 0 &&
    outerData.length === 0
  ) {
    return (
      <Empty message="No risk composition exists for the current filters." />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] lg:items-center">
      <div className="relative h-[350px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={innerData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={86}
              stroke="rgba(255,255,255,0.88)"
              strokeWidth={1.25}
              isAnimationActive
              animationBegin={100}
              animationDuration={1100}
            >
              {innerData.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.color}
                />
              ))}
            </Pie>

            <Pie
              data={outerData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={110}
              outerRadius={148}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={1.1}
              label
              labelLine
              isAnimationActive
              animationBegin={350}
              animationDuration={1300}
            >
              {outerData.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.color}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.20)",
                background: "#0D1D29",
                color: "#FFFFFF",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <motion.div
          aria-hidden
          animate={{
            opacity: [0.18, 0.38, 0.18],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl"
        />
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Inner pie · transaction risk
          </p>

          <div className="mt-3 space-y-2.5">
            {innerData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="truncate">
                    {item.name}
                  </span>
                </span>

                <span className="text-xs font-black tabular-nums">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Outer ring · gateway blocks by source
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {outerData.map((item) => (
              <span
                key={item.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
                {item.name} · {formatNumber(item.value)}
              </span>
            ))}
          </div>
        </div>
      </div>
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
  insight: AnalystRiskInsight;
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
    <motion.article
      initial={{
        opacity: 0,
        y: 10,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      whileHover={{
        y: -3,
      }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: easeOut,
      }}
      className={`rounded-2xl border p-4 backdrop-blur ${style}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-white">
              {insight.title}
            </h3>

            <span className="rounded-full border border-current/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300">
              {humanize(insight.category)}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-300">
            {insight.description}
          </p>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-white">
              Evidence
            </p>

            <p className="mt-1 break-words text-[11px] leading-5 text-slate-300">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-300">
            <span className="font-extrabold text-white">
              Recommended review:
            </span>{" "}
            {insight.recommendedReview}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystRiskPage() {
  const [range, setRange] =
    useState<AnalystRange>("30d");

  const [mode, setMode] =
    useState<AnalystMode>("all");

  const [source, setSource] =
    useState<AnalystRiskSource>("all");

  const [currency, setCurrency] =
    useState("BDT");

  const [currencyDraft, setCurrencyDraft] =
    useState("BDT");

  const [provider, setProvider] =
    useState("");

  const [providerDraft, setProviderDraft] =
    useState("");

  const [data, setData] =
    useState<AnalystRiskAnalyticsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const hasLoadedRef =
    useRef(false);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    let active =
      true;

    async function load() {
      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getAnalystRiskAnalytics(
            {
              range,
              mode,
              currency,
              provider,
              source,
            },
            controller.signal
          );

        if (active) {
          hasLoadedRef.current =
            true;

          setData(response);
        }
      } catch (loadError) {
        if (
          active &&
          !controller.signal.aborted
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load risk analytics."
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
  }, [
    range,
    mode,
    currency,
    provider,
    source,
    refreshKey,
  ]);

  const chartData =
    useMemo(
      () =>
        data?.trend.map((point) => ({
          ...point,
          label: bucketLabel(
            point.bucket,
            range
          ),
        })) ?? [],
      [
        data,
        range,
      ]
    );

  function applyTextFilters(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nextCurrency =
      currencyDraft
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(
        nextCurrency
      )
    ) {
      setError(
        "Currency must be a three-letter ISO code."
      );

      return;
    }

    setCurrency(nextCurrency);

    setProvider(
      providerDraft
        .trim()
        .toLowerCase()
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{
              rotate: [0, 8, -8, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600"
          >
            <ShieldAlert className="h-7 w-7" />
          </motion.div>

          <p className="mt-4 text-sm font-extrabold">
            Loading risk intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Evaluating gateway and transaction risk signals...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="space-y-6 pb-8">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: easeOut,
        }}
        className={`relative overflow-hidden rounded-[28px] border border-white/10 p-6 shadow-[0_28px_80px_-42px_rgba(13,148,136,0.62)] sm:p-7 ${DARK_SURFACE}`}
      >
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.32, 0.76, 0.32],
            scale: [1, 1.16, 1],
            x: [0, 28, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{
            opacity: [0.18, 0.48, 0.18],
            y: [0, -24, 0],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[24%] h-64 w-64 rounded-full bg-cyan-400/18 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute right-[18%] top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-teal-200/10 xl:block"
        >
          <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(94,234,212,0.8)]" />
        </motion.div>

        <motion.div
          aria-hidden
          animate={{
            x: ["-20%", "120%"],
            opacity: [0, 0.34, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.2,
          }}
          className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 backdrop-blur">
              <Radar className="h-3.5 w-3.5" />
              Risk Intelligence Workspace
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Risk & Fraud Signals
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Read-only gateway risk blocks, platform transaction risk,
              provider concentration, failure telemetry and deterministic
              anomaly signals.
            </p>

            {data ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${
                    data.status === "critical"
                      ? "border-red-400/30 bg-red-500/15 text-red-200"
                      : data.status === "attention"
                        ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
                        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {data.status}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  Updated {formatDate(data.generatedAt)}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  Engine {data.intelligenceEngine.version}
                </span>
              </div>
            ) : null}
          </div>

          <motion.button
            type="button"
            disabled={refreshing}
            whileHover={{
              y: -2,
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={() =>
              setRefreshKey(
                (current) =>
                  current + 1
              )
            }
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </motion.button>
        </div>
      </motion.section>

      {/* ERROR */}

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="min-w-0 break-words text-xs leading-5">
              {error}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.42,
          delay: 0.05,
          ease: easeOut,
        }}
        className="relative z-20 rounded-[22px] border border-border bg-card p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <Filter className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-extrabold text-foreground">
              Risk filters
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Refine gateway and wallet risk scope.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FilterSelect
            label="Period"
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
          />

          <FilterSelect
            label="Payment mode"
            value={mode}
            options={MODE_OPTIONS}
            onChange={setMode}
          />

          <FilterSelect
            label="Payment source"
            value={source}
            options={SOURCE_OPTIONS}
            onChange={setSource}
          />
        </div>

        <form
          onSubmit={applyTextFilters}
          className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end"
        >
          <label>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Currency
            </span>

            <input
              value={currencyDraft}
              maxLength={3}
              onChange={(event) =>
                setCurrencyDraft(
                  event.target.value
                    .replace(
                      /[^a-z]/gi,
                      ""
                    )
                    .slice(
                      0,
                      3
                    )
                    .toUpperCase()
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-center text-xs font-black uppercase outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Provider
            </span>

            <input
              value={providerDraft}
              onChange={(event) =>
                setProviderDraft(
                  event.target.value
                )
              }
              placeholder="Optional provider filter"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none transition placeholder:text-muted-foreground/70 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </label>

          <motion.button
            type="submit"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(13,148,136,0.22)] transition hover:shadow-[0_16px_34px_rgba(13,148,136,0.32)]"
          >
            Apply filters
          </motion.button>
        </form>

        {data ? (
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            {data.scopeNote}
          </p>
        ) : null}
      </motion.section>

      {data ? (
        <>
          {/* =================================================
              METRICS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              index={0}
              label="Risk Signals"
              value={formatNumber(
                data.metrics
                  .riskSignalCount
                  .value
              )}
              helper="Risk-blocked payments + HIGH-risk transactions"
              metric={
                data.metrics
                  .riskSignalCount
              }
              icon={ShieldAlert}
              iconClass="bg-red-500/10 text-red-600"
              accentClass="bg-red-500"
            />

            <MetricCard
              index={1}
              label="Risk-blocked Payments"
              value={formatNumber(
                data.metrics
                  .riskBlockedPayments
                  .value
              )}
              helper={`${data.metrics.riskBlockedRate.value.toFixed(
                2
              )}% of gateway attempts`}
              metric={
                data.metrics
                  .riskBlockedPayments
              }
              icon={Ban}
              iconClass="bg-orange-500/10 text-orange-600"
              accentClass="bg-orange-500"
            />

            <MetricCard
              index={2}
              label="HIGH-risk Transactions"
              value={formatNumber(
                data.metrics
                  .highRiskTransactions
                  .value
              )}
              helper={`${data.metrics.highRiskTransactionRate.value.toFixed(
                2
              )}% of transactions`}
              metric={
                data.metrics
                  .highRiskTransactions
              }
              icon={Radar}
              iconClass="bg-violet-500/10 text-violet-600"
              accentClass="bg-violet-500"
            />

            <MetricCard
              index={3}
              label="Failed Payments"
              value={formatNumber(
                data.metrics
                  .failedPayments
                  .value
              )}
              helper="Gateway payment failures"
              metric={
                data.metrics
                  .failedPayments
              }
              icon={XCircle}
              iconClass="bg-rose-500/10 text-rose-600"
              accentClass="bg-rose-500"
            />
          </section>

          {/* =================================================
              TWO LEVEL PIE + RISK MATRIX
          ================================================= */}

          <Panel
            title="Risk Composition"
            description="Two-level pie: inner segments show platform transaction risk; outer ring shows gateway risk blocks by payment source."
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
                <Gauge className="h-3.5 w-3.5" />
                Live composition
              </span>
            }
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
              <TwoLevelRiskPie
                transactionRisk={
                  data.transactionRisk
                }
                sources={
                  data.sources
                }
              />

              <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <RiskBox
                  label="LOW"
                  value={
                    data.operations
                      .lowRiskTransactions
                  }
                  helper="transaction classifications"
                  tone="emerald"
                />

                <RiskBox
                  label="MEDIUM"
                  value={
                    data.operations
                      .mediumRiskTransactions
                  }
                  helper="monitored transactions"
                  tone="amber"
                />

                <RiskBox
                  label="HIGH"
                  value={
                    data.operations
                      .highRiskTransactions
                  }
                  helper="high-risk transactions"
                  tone="red"
                />

                <RiskBox
                  label="Gateway Blocks"
                  value={
                    data.metrics
                      .riskBlockedPayments
                      .value
                  }
                  helper="risk_blocked failures"
                  tone="violet"
                />
              </div>
            </div>
          </Panel>

          {/* =================================================
              GRAPH CHART
          ================================================= */}

          <Panel
            tone="dark"
            title="Risk Signal Graph"
            description="Gateway risk blocks, HIGH-risk transactions and failure telemetry across the selected window."
            action={
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    label: "Risk signals",
                    color: THEME.tealBright,
                  },
                  {
                    label: "Risk blocks",
                    color: THEME.orange,
                  },
                  {
                    label: "HIGH risk",
                    color: THEME.violet,
                  },
                  {
                    label: "Failures",
                    color: THEME.red,
                  },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-slate-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            }
          >
            {chartData.some(
              (point) =>
                point.totalRiskSignals > 0 ||
                point.failedPayments > 0 ||
                point.failedTransactions > 0
            ) ? (
              <div className="h-[380px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={chartData}
                    margin={{
                      top: 14,
                      right: 12,
                      left: -18,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="riskSignalGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={
                            THEME.tealBright
                          }
                          stopOpacity={0.45}
                        />

                        <stop
                          offset="95%"
                          stopColor={
                            THEME.tealBright
                          }
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
                      stroke="rgba(255,255,255,0.09)"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 10,
                        fill: THEME.axis,
                      }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={22}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 10,
                        fill: THEME.axis,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={
                        <RiskChartTooltip />
                      }
                      cursor={{
                        stroke:
                          "rgba(20,184,166,0.35)",
                        strokeWidth: 2,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="totalRiskSignals"
                      name="Total risk signals"
                      stroke={
                        THEME.tealBright
                      }
                      strokeWidth={3}
                      fill="url(#riskSignalGradient)"
                      isAnimationActive
                      animationDuration={1300}
                    />

                    <Bar
                      dataKey="riskBlockedPayments"
                      name="Risk-blocked payments"
                      fill={THEME.orange}
                      maxBarSize={16}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={180}
                      animationDuration={1050}
                    />

                    <Bar
                      dataKey="highRiskTransactions"
                      name="HIGH-risk transactions"
                      fill={THEME.violet}
                      maxBarSize={16}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={280}
                      animationDuration={1050}
                    />

                    <Line
                      type="monotone"
                      dataKey="failedPayments"
                      name="Failed payments"
                      stroke={THEME.red}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                      }}
                      isAnimationActive
                      animationBegin={360}
                      animationDuration={1150}
                    />

                    <Line
                      type="monotone"
                      dataKey="failedTransactions"
                      name="Failed transactions"
                      stroke={THEME.slate}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                      }}
                      isAnimationActive
                      animationBegin={460}
                      animationDuration={1150}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                dark
                message="No risk or failure signal was recorded for the current filters."
              />
            )}
          </Panel>

          {/* =================================================
              PROVIDERS
          ================================================= */}

          <Panel
            title="Provider Risk Performance"
            description="Gateway provider traffic, failures and recorded risk-block rate."
          >
            {data.providers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Provider
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Attempts
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Failed
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Risk Blocks
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Block Rate
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Failure Rate
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Health
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.providers.map(
                      (providerItem) => (
                        <motion.tr
                          initial={{
                            opacity: 0,
                          }}
                          whileInView={{
                            opacity: 1,
                          }}
                          viewport={{
                            once: true,
                          }}
                          key={
                            providerItem.provider
                          }
                          className="transition-colors hover:bg-teal-500/[0.035]"
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {humanize(
                              providerItem.provider
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              providerItem.attemptCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              providerItem.failedCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-orange-600">
                            {formatNumber(
                              providerItem.riskBlockedCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {providerItem.riskBlockedRate.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {providerItem.failureRate.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            <StatusBadge
                              status={
                                providerItem.status
                              }
                            />
                          </td>
                        </motion.tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty message="No gateway provider activity matches these filters." />
            )}
          </Panel>

          {/* =================================================
              DISTRIBUTIONS
          ================================================= */}

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            <Panel
              className="min-h-[380px]"
              title="Transaction Risk"
              description="Current LOW, MEDIUM and HIGH distribution."
            >
              <Distribution
                color={THEME.teal}
                rows={
                  data.transactionRisk.map(
                    (item) => ({
                      key: item.risk,
                      count: item.count,
                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Payment Sources"
              description="Gateway risk blocks by payment source."
            >
              <Distribution
                color={THEME.cyan}
                rows={
                  data.sources.map(
                    (item) => ({
                      key: item.source,
                      count:
                        item.riskBlockedCount,
                      percentage:
                        item.riskBlockedRate,
                    })
                  )
                }
              />
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Gateway Failures"
              description="Payment failure codes for the current gateway scope."
            >
              <Distribution
                color={THEME.red}
                rows={
                  data.paymentFailureReasons.map(
                    (item) => ({
                      key: item.code,
                      count: item.count,
                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>
          </div>

          {/* =================================================
              TRANSACTION TYPES
          ================================================= */}

          <Panel
            title="Transaction-type Risk"
            description="Risk and failure rates across transfer, deposit and withdrawal activity."
          >
            {data.transactionTypes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {data.transactionTypes.map(
                  (item, index) => (
                    <motion.div
                      key={item.type}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      whileHover={{
                        y: -4,
                      }}
                      transition={{
                        delay:
                          index * 0.06,
                        ease: easeOut,
                      }}
                      className="relative overflow-hidden rounded-2xl border border-border bg-background p-5"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500" />

                      <p className="text-xs font-extrabold">
                        {humanize(
                          item.type
                        )}
                      </p>

                      <p className="mt-3 text-2xl font-black tabular-nums">
                        {formatNumber(
                          item.count
                        )}
                      </p>

                      <div className="mt-5 space-y-3 text-[11px]">
                        <div>
                          <div className="mb-1.5 flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              HIGH risk
                            </span>

                            <span className="font-bold text-red-600">
                              {item.highRiskRate.toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <motion.div
                              initial={{
                                width: 0,
                              }}
                              whileInView={{
                                width: `${Math.min(
                                  100,
                                  item.highRiskRate
                                )}%`,
                              }}
                              viewport={{
                                once: true,
                              }}
                              transition={{
                                duration: 0.8,
                                delay:
                                  index * 0.06,
                              }}
                              className="h-full rounded-full bg-red-500"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1.5 flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Failure
                            </span>

                            <span className="font-bold text-amber-600">
                              {item.failureRate.toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <motion.div
                              initial={{
                                width: 0,
                              }}
                              whileInView={{
                                width: `${Math.min(
                                  100,
                                  item.failureRate
                                )}%`,
                              }}
                              viewport={{
                                once: true,
                              }}
                              transition={{
                                duration: 0.8,
                                delay:
                                  index * 0.06 +
                                  0.08,
                              }}
                              className="h-full rounded-full bg-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            ) : (
              <Empty message="No platform transaction activity exists in this period." />
            )}
          </Panel>

          {/* =================================================
              INTELLIGENCE
          ================================================= */}

          <Panel
            tone="dark"
            title="Risk Intelligence"
            description="Explainable deterministic findings from existing gateway and platform risk telemetry."
            action={
              <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                {data.insights.length} signals
              </span>
            }
          >
            {data.insights.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.insights.map(
                  (
                    insight,
                    index
                  ) => (
                    <InsightCard
                      key={insight.id}
                      insight={
                        insight
                      }
                      index={
                        index
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <Empty
                dark
                message="No deterministic risk insight was generated for the current filters."
              />
            )}
          </Panel>

          {/* =================================================
              FRAUD NOTE
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Risk signals, not invented fraud cases
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  This page reports persisted risk classifications,
                  payment risk blocks and failure telemetry. A separate
                  FraudCase workflow should only be presented when the
                  backend contains persisted fraud-case or risk-assessment
                  case-management records.
                </p>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              READ ONLY
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Analyst access is read-only
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts cannot block payments, approve transfers,
                  change velocity limits, change KYC rules, modify provider
                  settings, or alter merchant/account state from this
                  workspace.
                </p>
              </div>
            </div>
          </motion.section>
        </>
      ) : null}
    </main>
  );
}

/* =========================================================
   RISK BOX
========================================================= */

function RiskBox({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone:
    | "emerald"
    | "amber"
    | "red"
    | "violet";
}) {
  const classes = {
    emerald:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-600",
    amber:
      "border-amber-500/20 bg-amber-500/5 text-amber-600",
    red:
      "border-red-500/20 bg-red-500/5 text-red-600",
    violet:
      "border-violet-500/20 bg-violet-500/5 text-violet-600",
  }[tone];

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={`rounded-2xl border p-4 ${classes}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black tabular-nums">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {helper}
      </p>
    </motion.div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    | "healthy"
    | "attention"
    | "critical";
}) {
  const classes =
    status === "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-600"
      : status === "attention"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
