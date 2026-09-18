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
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  DatabaseZap,
  Landmark,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystSettlementAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystSettlementAnalyticsData,
  type AnalystSettlementInsight,
  type AnalystSettlementStatus,
} from "@/lib/api/analystApi";

/* =========================================================
   THEME

   Ocean-glow visual system shared with the Analyst Overview
   and Transaction Analytics pages. Semantic red / amber /
   emerald are reserved for operational state.
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

const DARK_SURFACE =
  "bg-[linear-gradient(135deg,#10243A_0%,#0B4F52_48%,#10273A_100%)] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
}> = [
  {
    value: "24h",
    label: "Last 24 hours",
  },
  {
    value: "7d",
    label: "Last 7 days",
  },
  {
    value: "30d",
    label: "Last 30 days",
  },
  {
    value: "90d",
    label: "Last 90 days",
  },
];

const STATUS_OPTIONS: Array<{
  value:
    AnalystSettlementStatus;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All settlements",
  },

  {
    value:
      "pending",

    label:
      "Pending",
  },

  {
    value:
      "processing",

    label:
      "Processing",
  },

  {
    value:
      "settled",

    label:
      "Settled",
  },

  {
    value:
      "failed",

    label:
      "Failed",
  },

  {
    value:
      "cancelled",

    label:
      "Cancelled",
  },
];

/* =========================================================
   FORMATTERS
========================================================= */

function numberText(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function moneyText(
  minor: number,
  currency: string,
  compact = false
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        notation:
          compact
            ? "compact"
            : "standard",

        maximumFractionDigits:
          compact
            ? 1
            : 2,
      }
    ).format(
      minor / 100
    );
  } catch {
    return `${currency} ${(
      minor / 100
    ).toLocaleString(
      "en-BD"
    )}`;
  }
}

function durationText(
  seconds: number
): string {
  if (
    seconds < 60
  ) {
    return `${seconds.toFixed(
      1
    )}s`;
  }

  if (
    seconds < 3600
  ) {
    return `${(
      seconds / 60
    ).toFixed(
      1
    )}m`;
  }

  if (
    seconds < 86400
  ) {
    return `${(
      seconds / 3600
    ).toFixed(
      1
    )}h`;
  }

  return `${(
    seconds / 86400
  ).toFixed(
    1
  )}d`;
}

function dateText(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(date);
}

function bucketText(
  value: string,
  range: AnalystRange
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    range === "24h"
      ? {
          hour:
            "numeric",

          hour12:
            true,
        }
      : {
          month:
            "short",

          day:
            "numeric",
        }
  ).format(date);
}

function humanize(
  value: string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="min-w-[190px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    >
      {label ? (
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-teal-300">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry) => {
          const isMoney = entry.dataKey === "netMajor";
          const displayValue = isMoney
            ? moneyText(Number(entry.value ?? 0) * 100, currency, true)
            : numberText(Number(entry.value ?? 0));

          return (
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
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* =========================================================
   CUSTOM FILTER SELECT
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
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] overflow-hidden rounded-2xl border border-teal-500/15 bg-card/95 p-1.5 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
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
                {active ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </motion.div>
      ) : null}
    </div>
  );
}

/* =========================================================
   HERO SETTLEMENT ORBIT
========================================================= */

function SettlementOrbit() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-10 top-1/2 hidden h-52 w-80 -translate-y-1/2 xl:block"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        className="absolute right-4 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-teal-200/15"
      >
        <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.95)]" />
        <span className="absolute bottom-5 right-2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute right-12 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-cyan-200/15"
      >
        <span className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,199,214,0.85)]" />
      </motion.div>

      <div className="absolute left-0 top-[47%] h-px w-36 overflow-hidden bg-white/10">
        <motion.span
          animate={{ x: ["-100%", "280%"] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
          className="block h-px w-16 bg-gradient-to-r from-transparent via-teal-200 to-transparent"
        />
      </div>

      <motion.div
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[78px] top-[78px] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-teal-200 shadow-[0_0_34px_rgba(20,184,166,0.12)] backdrop-blur"
      >
        <Landmark className="h-5 w-5" />
      </motion.div>
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
  metric:
    AnalystMetric;

  inverse?:
    boolean;
}) {
  const change =
    metric.changePercent;

  if (
    change === null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  if (
    change === 0
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No change vs previous
      </span>
    );
  }

  const rising =
    change > 0;

  const positive =
    inverse
      ? !rising
      : rising;

  const Icon =
    rising
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {Math.abs(
        change
      ).toFixed(
        2
      )}
      %

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
  inverse,
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, delay: index * 0.055, ease: easeOut }}
      className="group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
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
            {helper}
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
          <h2 className={`text-base font-extrabold ${dark ? "text-white" : "text-foreground"}`}>
            {title}
          </h2>

          <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-muted-foreground"}`}>
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
  rows: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
  color?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <DatabaseZap className="h-8 w-8 text-muted-foreground/45" />
        <p className="mt-3 text-sm font-extrabold text-foreground">No records</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          No matching settlement records exist for this breakdown.
        </p>
      </div>
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
          transition={{ delay: index * 0.05 }}
        >
          <div className="mb-2 flex items-center justify-between gap-4 text-xs">
            <span className="min-w-0 truncate font-bold text-foreground">
              {humanize(row.key)}
            </span>

            <span className="shrink-0 font-bold tabular-nums text-muted-foreground">
              {numberText(row.count)} · {row.percentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, row.percentage)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: index * 0.05, ease: easeOut }}
              className="h-full rounded-full shadow-[0_0_16px_rgba(20,184,166,0.16)]"
              style={{ backgroundColor: color }}
            />
          </div>
        </motion.div>
      ))}
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
  insight: AnalystSettlementInsight;
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
          ? Sparkles
          : TriangleAlert;

  return (
    <motion.article
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
            <h3 className="text-sm font-extrabold text-white">{insight.title}</h3>
            <span className="rounded-full border border-current/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-300">
            {insight.description}
          </p>

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
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystSettlementPage() {
  const [
    range,
    setRange,
  ] =
    useState<AnalystRange>(
      "30d"
    );

  const [
    status,
    setStatus,
  ] =
    useState<AnalystSettlementStatus>(
      "all"
    );

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "BDT"
    );

  const [
    currencyDraft,
    setCurrencyDraft,
  ] =
    useState(
      "BDT"
    );

  const [
    data,
    setData,
  ] =
    useState<AnalystSettlementAnalyticsData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  const hasLoadedRef =
    useRef(false);

  useEffect(
    () => {
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
            await getAnalystSettlementAnalytics(
              {
                range,
                currency,
                status,
              },
              controller.signal
            );

          if (active) {
            hasLoadedRef.current = true;
            setData(response);
          }
        } catch (loadError) {
          if (
            active &&
            !controller.signal.aborted
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load settlement analytics."
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
    },
    [
      range,
      currency,
      status,
      refreshKey,
    ]
  );

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (point) => ({
            ...point,

            label:
              bucketText(
                point.bucket,
                range
              ),

            netMajor:
              point.netAmountMinor /
              100,
          })
        ) ?? [],
      [
        data,
        range,
      ]
    );

  function applyCurrency(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const next =
      currencyDraft
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(
        next
      )
    ) {
      setError(
        "Currency must be a three-letter ISO code."
      );

      return;
    }

    setCurrency(next);
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Landmark className="mx-auto h-9 w-9 text-teal-600" />
          </motion.div>
          <p className="mt-3 text-sm font-extrabold">Loading settlement intelligence</p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6 pb-8">
      {/* HERO */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`relative overflow-hidden rounded-[30px] border border-white/10 p-6 shadow-[0_28px_80px_-38px_rgba(13,148,136,0.62)] sm:p-7 ${DARK_SURFACE}`}
      >
        <motion.div
          aria-hidden
          animate={{ x: ["-30%", "145%"] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute left-0 top-0 h-px w-48 bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"
        />

        <SettlementOrbit />

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
          className="pointer-events-none absolute right-[28%] top-[28%] h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between xl:pr-[310px]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 backdrop-blur">
              <Landmark className="h-3.5 w-3.5" />
              Settlement Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Settlement Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Monitor settlement value, fees, refunds, merchant concentration, aging and payout reconciliation.
            </p>

            {data ? (
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  Updated {dateText(data.generatedAt)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  {data.filters.currency}
                </span>
                <span className="max-w-[520px] truncate rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  {data.scopeNote}
                </span>
              </div>
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
        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect
            label="Period"
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
          />

          <FilterSelect
            label="Settlement status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />

          <form onSubmit={applyCurrency}>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Currency
            </span>

            <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-background transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
              <input
                value={currencyDraft}
                maxLength={3}
                aria-label="Currency code"
                onChange={(event) =>
                  setCurrencyDraft(
                    event.target.value.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase()
                  )
                }
                className="min-w-0 flex-1 bg-transparent px-3 text-center text-xs font-black uppercase outline-none"
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="border-l border-teal-500/15 bg-teal-600 px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-teal-700"
              >
                Apply
              </motion.button>
            </div>
          </form>
        </div>
      </motion.section>

      {data && (
        <>
          {/* METRICS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Settlements"
              value={numberText(
                data.metrics
                  .settlementCount
                  .value
              )}
              helper="Settlement records"
              metric={
                data.metrics
                  .settlementCount
              }
              icon={Landmark}
              iconClass="bg-blue-500/10 text-blue-600"
              index={0}
              accentClass="bg-teal-500"
            />

            <MetricCard
              label="Gross Value"
              value={moneyText(
                data.metrics
                  .grossAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Gross settlement value"
              metric={
                data.metrics
                  .grossAmountMinor
              }
              icon={Banknote}
              iconClass="bg-violet-500/10 text-violet-600"
              index={1}
              accentClass="bg-violet-500"
            />

            <MetricCard
              label="Net Payable"
              value={moneyText(
                data.metrics
                  .netAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Merchant net settlement value"
              metric={
                data.metrics
                  .netAmountMinor
              }
              icon={WalletCards}
              iconClass="bg-emerald-500/10 text-emerald-600"
              index={2}
              accentClass="bg-emerald-500"
            />

            <MetricCard
              label="Settlement Rate"
              value={`${data.metrics.settlementRate.value.toFixed(
                2
              )}%`}
              helper={`${numberText(
                data.metrics
                  .settledCount
                  .value
              )} settled`}
              metric={
                data.metrics
                  .settlementRate
              }
              icon={CheckCircle2}
              iconClass="bg-cyan-500/10 text-cyan-600"
              index={3}
              accentClass="bg-cyan-500"
            />

            <MetricCard
              label="Platform Fees"
              value={moneyText(
                data.metrics
                  .feeAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Fees included in settlements"
              metric={
                data.metrics
                  .feeAmountMinor
              }
              icon={Scale}
              iconClass="bg-indigo-500/10 text-indigo-600"
              index={4}
              accentClass="bg-indigo-500"
            />

            <MetricCard
              label="Refund Adjustments"
              value={moneyText(
                data.metrics
                  .refundAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Refund value reconciled"
              metric={
                data.metrics
                  .refundAmountMinor
              }
              icon={ArrowDownRight}
              iconClass="bg-orange-500/10 text-orange-600"
              inverse
              index={5}
              accentClass="bg-orange-500"
            />

            <MetricCard
              label="Completion Time"
              value={durationText(
                data.metrics
                  .averageSettlementSeconds
                  .value
              )}
              helper="Average creation → settled"
              metric={
                data.metrics
                  .averageSettlementSeconds
              }
              icon={TimerReset}
              iconClass="bg-amber-500/10 text-amber-600"
              inverse
              index={6}
              accentClass="bg-amber-500"
            />

            <MetricCard
              label="Failed Settlements"
              value={numberText(
                data.operations
                  .failedCount
              )}
              helper={`${numberText(
                data.operations
                  .pendingCount
              )} pending`}
              metric={
                data.metrics
                  .settlementCount
              }
              icon={XCircle}
              iconClass="bg-red-500/10 text-red-600"
              inverse
              index={7}
              accentClass="bg-red-500"
            />
          </section>

          {/* OPERATIONS */}

          <Panel
            title="Settlement Operations"
            description="Settlement lifecycle, item release and payout linkage."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <OperationCard
                label="Pending"
                value={
                  data.operations
                    .pendingCount
                }
              />

              <OperationCard
                label="Processing"
                value={
                  data.operations
                    .processingCount
                }
              />

              <OperationCard
                label="Payments"
                value={
                  data.operations
                    .paymentCount
                }
              />

              <OperationCard
                label="Settlement Items"
                value={
                  data.operations
                    .settlementItemCount
                }
              />

              <OperationCard
                label="Released Items"
                value={
                  data.operations
                    .releasedItemCount
                }
              />

              <OperationCard
                label="Payout Linked"
                value={
                  data.operations
                    .payoutLinkedCount
                }
                helper={`${data.operations.payoutLinkRate.toFixed(
                  1
                )}% linkage`}
              />

              <OperationCard
                label="Failed"
                value={
                  data.operations
                    .failedCount
                }
              />

              <OperationCard
                label="Cancelled"
                value={
                  data.operations
                    .cancelledCount
                }
              />
            </div>
          </Panel>

          {/* TREND */}

          <Panel
            tone="dark"
            title="Settlement Trend"
            description="Settlement lifecycle and net merchant payable value across the selected period."
            action={
              <div className="flex flex-wrap gap-3">
                {[
                  ["Net payable", THEME.emerald],
                  ["Settled", THEME.cyan],
                  ["Pending", THEME.amber],
                  ["Failed", THEME.red],
                ].map(([label, color]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-slate-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            }
          >
            {chartData.length > 0 ? (
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="settlementNetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME.emerald} stopOpacity={0.48} />
                        <stop offset="95%" stopColor={THEME.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
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
                      yAxisId="count"
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: THEME.axis }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="value"
                      orientation="right"
                      tick={{ fontSize: 10, fill: THEME.axis }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<ChartTooltip currency={data.filters.currency} />}
                      cursor={{ stroke: "rgba(20,184,166,0.35)", strokeWidth: 2 }}
                    />

                    <Area
                      yAxisId="value"
                      type="monotone"
                      dataKey="netMajor"
                      name="Net payable"
                      stroke={THEME.emerald}
                      strokeWidth={2.5}
                      fill="url(#settlementNetGradient)"
                      isAnimationActive
                      animationDuration={1250}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="failedCount"
                      name="Failed"
                      fill={THEME.red}
                      maxBarSize={14}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={180}
                      animationDuration={1050}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="settledCount"
                      name="Settled"
                      stroke={THEME.cyan}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: THEME.cyan }}
                      isAnimationActive
                      animationBegin={260}
                      animationDuration={1200}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="pendingCount"
                      name="Pending"
                      stroke={THEME.amber}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: THEME.amber }}
                      isAnimationActive
                      animationBegin={360}
                      animationDuration={1200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
                <DatabaseZap className="h-8 w-8 text-teal-300/60" />
                <p className="mt-3 text-sm font-extrabold text-white">No settlement trend</p>
                <p className="mt-1 text-xs text-slate-400">
                  Settlement activity will appear when matching records exist.
                </p>
              </div>
            )}
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Status Distribution"
              description="Settlement lifecycle states."
              className="min-h-[360px]"
            >
              <Breakdown
                color={THEME.teal}
                rows={
                  data.statuses.map(
                    (item) => ({
                      key:
                        item.status,

                      count:
                        item.count,

                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>

            <Panel
              title="Open Settlement Aging"
              description="Current pending and processing settlement age."
              className="min-h-[360px]"
            >
              <Breakdown
                color={THEME.amber}
                rows={
                  data.aging.map(
                    (item) => ({
                      key:
                        item.label,

                      count:
                        item.count,

                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>

            <Panel
              title="Payout Methods"
              description="Methods used by linked merchant payouts."
              className="min-h-[360px]"
            >
              <Breakdown
                color={THEME.cyan}
                rows={
                  data.payoutMethods.map(
                    (item) => ({
                      key:
                        item.method,

                      count:
                        item.count,

                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>
          </div>

          {/* RECONCILIATION */}

          <Panel
            title="Settlement → Payout Reconciliation"
            description="Relationship between settlement net value and linked payout records."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReconciliationCard
                label="Linked Settlements"
                value={numberText(
                  data
                    .payoutReconciliation
                    .linkedSettlementCount
                )}
              />

              <ReconciliationCard
                label="Completed Payouts"
                value={numberText(
                  data
                    .payoutReconciliation
                    .completedPayoutCount
                )}
              />

              <ReconciliationCard
                label="Settlement Net"
                value={moneyText(
                  data
                    .payoutReconciliation
                    .linkedSettlementNetMinor,
                  data.filters.currency,
                  true
                )}
              />

              <ReconciliationCard
                label="Payout Net"
                value={moneyText(
                  data
                    .payoutReconciliation
                    .payoutNetMinor,
                  data.filters.currency,
                  true
                )}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Linked Value Difference
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {moneyText(
                      data
                        .payoutReconciliation
                        .differenceMinor,
                      data.filters.currency
                    )}
                  </p>
                </div>

                <div className="text-right text-[11px] text-muted-foreground">
                  <p>
                    Pending payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .pendingPayoutCount
                    }
                  </p>

                  <p>
                    Processing payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .processingPayoutCount
                    }
                  </p>

                  <p>
                    Failed payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .failedPayoutCount
                    }
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* MERCHANT TABLE */}

          <Panel
            title="Merchant Settlement Performance"
            description="Highest settlement net-value merchants in the selected period."
          >
            {data.merchants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Merchant
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Settlements
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Settled
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Pending
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Gross
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Fees
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Refunds
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Net
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Share
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.merchants.map(
                      (merchant) => (
                        <tr
                          key={merchant.merchantId}
                          className="transition-colors hover:bg-teal-500/[0.035]"
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {merchant.businessName}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {numberText(
                              merchant.settlementCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-emerald-600">
                            {numberText(
                              merchant.settledCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-amber-600">
                            {numberText(
                              merchant.pendingCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.grossAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.feeAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.refundAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {moneyText(
                              merchant.netAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {merchant.netShare.toFixed(
                              2
                            )}
                            %
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-40 items-center justify-center">
                <DatabaseZap className="h-7 w-7 text-muted-foreground/40" />
              </div>
            )}
          </Panel>

          {/* INSIGHTS */}

          <Panel
            tone="dark"
            title="Settlement Intelligence"
            description="Explainable settlement reliability, aging, concentration and payout reconciliation signals."
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                {data.insights.length} signals
              </span>
            }
          >
            {data.insights.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.insights.map((insight, index) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
                <Sparkles className="h-8 w-8 text-teal-300/60" />
                <p className="mt-3 text-sm font-extrabold text-white">No settlement signals</p>
                <p className="mt-1 text-xs text-slate-400">No deterministic settlement signal was generated for this filter set.</p>
              </div>
            )}
          </Panel>

          {/* READ ONLY */}

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Read-only settlement intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts cannot create settlements, release settlement
                  items, request payouts, process payouts, alter ledger
                  balances, or modify settlement status.
                </p>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}

/* =========================================================
   SMALL CARDS
========================================================= */

function OperationCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black tabular-nums text-foreground">
        {numberText(value)}
      </p>

      {helper ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{helper}</p>
      ) : null}
    </motion.div>
  );
}

function ReconciliationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-teal-500/5 blur-2xl transition group-hover:bg-teal-500/10" />

      <p className="relative text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="relative mt-2 text-xl font-black tabular-nums text-foreground">
        {value}
      </p>
    </motion.div>
  );
}
