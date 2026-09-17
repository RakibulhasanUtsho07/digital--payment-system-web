"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  CircleAlert,
  CircleCheckBig,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Database,
  Gauge,
  Minus,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystLivePulse,
  getAnalystOverview,
  type AnalystBreakdownItem,
  type AnalystInsight,
  type AnalystLivePulseData,
  type AnalystMetric,
  type AnalystMode,
  type AnalystOverviewData,
  type AnalystPulseAlert,
  type AnalystPulseStatus,
  type AnalystRange,
  type AnalystTrendPoint,
} from "@/lib/api/analystApi";

/* =========================================================
   BRAND / DATA-VISUALIZATION TOKENS
========================================================= */

const COLORS = {
  navy: "#14213D",
  indigo: "#3159C9",
  cyan: "#0891B2",
  violet: "#7C5CE6",
  canvas: "#F4F7FB",
  emerald: "#059669",
  amber: "#D97706",
  red: "#DC2626",
  inkMuted: "#64748B",
  grid: "#E2E8F0",
  white: "#FFFFFF",
};

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
}> = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
}> = [
  { value: "all", label: "All traffic" },
  { value: "test", label: "Test" },
  { value: "live", label: "Live" },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatMinor(value: number, currency: string): string {
  const major = value / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatBucket(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBucketShort(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
  });
}

/* =========================================================
   STATUS / SEMANTIC HELPERS
========================================================= */

function statusConfig(status: AnalystPulseStatus): {
  className: string;
  dotClassName: string;
  label: string;
} {
  switch (status) {
    case "critical":
      return {
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300",
        dotClassName: "bg-red-500",
        label: "Critical",
      };
    case "attention":
      return {
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300",
        dotClassName: "bg-amber-500",
        label: "Attention",
      };
    case "healthy":
      return {
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300",
        dotClassName: "bg-emerald-500",
        label: "Healthy",
      };
  }
}

function insightClasses(severity: AnalystInsight["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25";
    case "high":
      return "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25";
    case "medium":
      return "border-amber-200/80 bg-amber-50/55 dark:border-amber-900/50 dark:bg-amber-950/15";
    case "positive":
      return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25";
    case "info":
      return "border-violet-200 bg-violet-50/80 dark:border-violet-900/60 dark:bg-violet-950/25";
  }
}

function alertClasses(severity: AnalystPulseAlert["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "info":
      return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200";
  }
}

function metricChange(metric: AnalystMetric): string {
  if (metric.changePercent === null) {
    return metric.value === 0 ? "No change" : "New activity";
  }

  if (metric.changePercent === 0) {
    return "No change";
  }

  const prefix = metric.changePercent > 0 ? "+" : "";
  return `${prefix}${metric.changePercent.toFixed(2)}% vs previous`;
}

function getMetricTrend(
  metric: AnalystMetric,
  intent: "higher-better" | "lower-better" | "neutral"
): {
  className: string;
  Icon: LucideIcon;
} {
  const change = metric.changePercent;

  if (change === null || change === 0 || intent === "neutral") {
    return {
      className: "text-slate-500 dark:text-slate-400",
      Icon: Minus,
    };
  }

  const isPositive =
    intent === "higher-better"
      ? change > 0
      : change < 0;

  return isPositive
    ? {
        className: "text-emerald-600 dark:text-emerald-400",
        Icon: change > 0 ? ArrowUpRight : ArrowDownRight,
      }
    : {
        className: "text-red-600 dark:text-red-400",
        Icon: change > 0 ? ArrowUpRight : ArrowDownRight,
      };
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={itemVariants}
      className={`rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(20,33,61,0.06)] dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = "indigo",
  trailing,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: "indigo" | "cyan" | "violet" | "navy";
  trailing?: ReactNode;
}) {
  const accents = {
    indigo: {
      icon: "bg-[#3159C9]/10 text-[#3159C9]",
      eyebrow: "text-[#3159C9]",
    },
    cyan: {
      icon: "bg-[#0891B2]/10 text-[#0891B2]",
      eyebrow: "text-[#0891B2]",
    },
    violet: {
      icon: "bg-[#7C5CE6]/10 text-[#7C5CE6]",
      eyebrow: "text-[#7C5CE6]",
    },
    navy: {
      icon: "bg-[#14213D]/10 text-[#14213D] dark:bg-white/10 dark:text-white",
      eyebrow: "text-[#14213D] dark:text-slate-200",
    },
  } as const;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accents[accent].icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}

        <div className="min-w-0">
          {eyebrow ? (
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.16em] ${accents[accent].eyebrow}`}
            >
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-[#14213D] dark:text-white sm:text-xl">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

function StatusPill({
  status,
  label,
  live = false,
}: {
  status: AnalystPulseStatus;
  label: string;
  live?: boolean;
}) {
  const config = statusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.className}`}
    >
      <span className="relative flex h-2 w-2">
        {live ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${config.dotClassName}`}
          />
        ) : null}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClassName}`}
        />
      </span>
      {label}: {config.label}
    </span>
  );
}

function MetricCard({
  label,
  metric,
  value,
  icon: Icon,
  accent,
  intent = "higher-better",
  helper,
}: {
  label: string;
  metric: AnalystMetric;
  value: string;
  icon: LucideIcon;
  accent: "indigo" | "cyan" | "violet" | "navy";
  intent?: "higher-better" | "lower-better" | "neutral";
  helper?: string;
}) {
  const accentConfig = {
    indigo: {
      icon: "bg-[#3159C9]/10 text-[#3159C9]",
      line: "bg-[#3159C9]",
    },
    cyan: {
      icon: "bg-[#0891B2]/10 text-[#0891B2]",
      line: "bg-[#0891B2]",
    },
    violet: {
      icon: "bg-[#7C5CE6]/10 text-[#7C5CE6]",
      line: "bg-[#7C5CE6]",
    },
    navy: {
      icon: "bg-[#14213D]/10 text-[#14213D] dark:bg-white/10 dark:text-white",
      line: "bg-[#14213D] dark:bg-slate-200",
    },
  } as const;

  const trend = getMetricTrend(metric, intent);
  const TrendIcon = trend.Icon;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_rgba(20,33,61,0.055)] dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentConfig[accent].line}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-[#14213D] dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${accentConfig[accent].icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${trend.className}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {metricChange(metric)}
        </span>

        {helper ? (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {helper}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function RatioRow({
  label,
  value,
  tone = "indigo",
}: {
  label: string;
  value: number;
  tone?: "indigo" | "cyan" | "violet" | "navy";
}) {
  const width = Math.max(0, Math.min(100, value));

  const barClass = {
    indigo: "bg-[#3159C9]",
    cyan: "bg-[#0891B2]",
    violet: "bg-[#7C5CE6]",
    navy: "bg-[#14213D] dark:bg-slate-200",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="font-extrabold text-[#14213D] dark:text-white">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = "navy",
  helper,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "navy" | "indigo" | "cyan" | "violet";
  helper?: string;
}) {
  const accents = {
    navy: "bg-[#14213D]/8 text-[#14213D] dark:bg-white/10 dark:text-white",
    indigo: "bg-[#3159C9]/10 text-[#3159C9]",
    cyan: "bg-[#0891B2]/10 text-[#0891B2]",
    violet: "bg-[#7C5CE6]/10 text-[#7C5CE6]",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-[#14213D] dark:text-white">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function BreakdownList({
  items,
  emptyLabel,
  tone,
}: {
  items: AnalystBreakdownItem[];
  emptyLabel: string;
  tone: "indigo" | "cyan" | "violet";
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  const barClass = {
    indigo: "bg-[#3159C9]",
    cyan: "bg-[#0891B2]",
    violet: "bg-[#7C5CE6]",
  }[tone];

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.035 }}
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#14213D] dark:text-slate-100">
                {item.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatNumber(item.count)} records
              </p>
            </div>
            <span className="text-sm font-extrabold text-[#14213D] dark:text-white">
              {formatPercent(item.percentage)}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(0, Math.min(100, item.percentage))}%`,
              }}
              transition={{ duration: 0.7, delay: index * 0.035 }}
              className={`h-full rounded-full ${barClass}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   CHARTS
========================================================= */

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}

function PaymentChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
      <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        {label ? formatBucket(label) : ""}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-extrabold text-[#14213D] dark:text-white">
              {formatNumber(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentActivityChart({
  points,
}: {
  points: AnalystTrendPoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        No trend data available.
      </div>
    );
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 12, right: 8, bottom: 4, left: -10 }}
        >
          <defs>
            <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0.015} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="4 6"
            vertical={false}
          />

          <XAxis
            dataKey="bucket"
            tickFormatter={formatBucketShort}
            tick={{ fill: COLORS.inkMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />

          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: COLORS.inkMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />

          <Tooltip
            cursor={{ stroke: COLORS.grid, strokeWidth: 1 }}
            content={<PaymentChartTooltip />}
          />

          <Area
            type="monotone"
            dataKey="completedCount"
            name="Completed"
            stroke={COLORS.indigo}
            fill="url(#completedFill)"
            strokeWidth={2.25}
            activeDot={{ r: 5, fill: COLORS.indigo, strokeWidth: 0 }}
          />

          <Line
            type="monotone"
            dataKey="paymentCount"
            name="Attempts"
            stroke={COLORS.navy}
            strokeWidth={2.6}
            dot={false}
            activeDot={{ r: 5, fill: COLORS.navy, strokeWidth: 0 }}
          />

          <Line
            type="monotone"
            dataKey="failedCount"
            name="Failed"
            stroke={COLORS.red}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLORS.red, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PulseTimelinePoint {
  bucket: string;
  attemptCount: number;
  completedCount: number;
  failedCount: number;
  volumeMinor: number;
}

function PulseChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-cyan-100 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-cyan-900/60 dark:bg-slate-950/95">
      <p className="mb-2 text-xs font-bold text-[#0891B2]">
        {label ? formatBucket(label) : ""}
      </p>
      {payload.map((entry) => (
        <div
          key={String(entry.dataKey)}
          className="flex items-center justify-between gap-6 text-xs"
        >
          <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
          <span className="font-extrabold text-[#14213D] dark:text-white">
            {formatNumber(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

function LivePulseChart({
  points,
}: {
  points: PulseTimelinePoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-cyan-100 text-sm text-slate-500 dark:border-cyan-900/50 dark:text-slate-400">
        No live timeline available.
      </div>
    );
  }

  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 12, right: 8, bottom: 2, left: -12 }}
        >
          <defs>
            <linearGradient id="liveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="4 6"
            vertical={false}
          />

          <XAxis
            dataKey="bucket"
            tickFormatter={formatBucketShort}
            tick={{ fill: COLORS.inkMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={26}
          />

          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: COLORS.inkMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />

          <Tooltip content={<PulseChartTooltip />} />

          <Area
            type="monotone"
            dataKey="attemptCount"
            name="Attempts"
            stroke={COLORS.cyan}
            fill="url(#liveFill)"
            strokeWidth={2.4}
            activeDot={{ r: 4, fill: COLORS.cyan, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="failedCount"
            name="Failed"
            stroke={COLORS.red}
            fill="transparent"
            strokeWidth={1.8}
            activeDot={{ r: 4, fill: COLORS.red, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="h-36 animate-pulse rounded-[28px] bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[22px] bg-slate-200/80 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="h-[420px] animate-pulse rounded-[24px] bg-slate-200/80 dark:bg-slate-800" />
          <div className="h-[420px] animate-pulse rounded-[24px] bg-slate-200/80 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystDashboardPage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [mode, setMode] = useState<AnalystMode>("all");
  const [currencyInput, setCurrencyInput] = useState("BDT");
  const [currency, setCurrency] = useState("BDT");

  const [overview, setOverview] = useState<AnalystOverviewData | null>(null);
  const [pulse, setPulse] = useState<AnalystLivePulseData | null>(null);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [pulseError, setPulseError] = useState<string | null>(null);

  const [manualRefresh, setManualRefresh] = useState(0);
  const [pulseRefresh, setPulseRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setOverviewLoading(true);
    setOverviewError(null);

    void getAnalystOverview(
      {
        range,
        mode,
        currency,
      },
      controller.signal
    )
      .then((data) => {
        setOverview(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setOverviewError(
          error instanceof Error
            ? error.message
            : "Unable to load analyst overview."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOverviewLoading(false);
        }
      });

    return () => controller.abort();
  }, [range, mode, currency, manualRefresh]);

  useEffect(() => {
    const controller = new AbortController();

    setPulseLoading(true);
    setPulseError(null);

    void getAnalystLivePulse(
      {
        mode,
        currency,
      },
      controller.signal
    )
      .then((data) => {
        setPulse(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setPulseError(
          error instanceof Error
            ? error.message
            : "Unable to load live pulse."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPulseLoading(false);
        }
      });

    return () => controller.abort();
  }, [mode, currency, manualRefresh, pulseRefresh]);

  useEffect(() => {
    const seconds = Math.max(10, pulse?.refreshAfterSeconds ?? 20);

    const timer = window.setInterval(() => {
      setPulseRefresh((current) => current + 1);
    }, seconds * 1000);

    return () => window.clearInterval(timer);
  }, [pulse?.refreshAfterSeconds]);

  const applyCurrency = () => {
    const next = currencyInput.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(next)) {
      setOverviewError("Currency must be a three-letter ISO code.");
      return;
    }

    setCurrencyInput(next);
    setCurrency(next);
  };

  const refreshAll = () => {
    setManualRefresh((current) => current + 1);
  };

  const overviewStatus: AnalystPulseStatus = overview?.status ?? "healthy";

  const topInsightCount = useMemo(() => {
    return overview?.insights.filter(
      (item) => item.severity === "critical" || item.severity === "high"
    ).length ?? 0;
  }, [overview?.insights]);

  if (overviewLoading && !overview) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#14213D] dark:bg-slate-950 dark:text-slate-100">
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8"
      >
        {/* ===================================================
            HERO
        ==================================================== */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-[30px] bg-[#14213D] p-6 text-white shadow-[0_24px_70px_rgba(20,33,61,0.2)] sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#3159C9]/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-[-110px] left-[30%] h-64 w-64 rounded-full bg-[#0891B2]/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-[22%] top-[30%] h-44 w-44 rounded-full bg-[#7C5CE6]/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                <BrainCircuit className="h-3.5 w-3.5 text-[#A99AF2]" />
                Coffer intelligence workspace
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Analyst Overview
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                One read-only view for gateway performance, merchant health,
                wallet activity, live operations, risk, revenue quality and
                deterministic intelligence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {overview ? (
                <StatusPill status={overviewStatus} label="Overview" />
              ) : null}

              {pulse ? (
                <StatusPill status={pulse.status} label="Live" live />
              ) : null}

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={refreshAll}
                disabled={overviewLoading || pulseLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    overviewLoading || pulseLoading ? "animate-spin" : ""
                  }`}
                />
                {overviewLoading || pulseLoading ? "Refreshing" : "Refresh"}
              </motion.button>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                Scope
              </p>
              <p className="mt-1.5 text-sm font-bold text-white">
                {RANGE_OPTIONS.find((item) => item.value === range)?.label} · {mode}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                Currency
              </p>
              <p className="mt-1.5 text-sm font-bold text-white">{currency}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                Priority signals
              </p>
              <p className="mt-1.5 text-sm font-bold text-white">
                {formatNumber(topInsightCount)} high / critical
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                Engine
              </p>
              <p className="mt-1.5 text-sm font-bold text-white">
                Deterministic rules
              </p>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            FILTERS
        ==================================================== */}
        <Surface className="p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                Range
              </span>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as AnalystRange)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#14213D] outline-none transition focus:border-[#3159C9] focus:ring-4 focus:ring-[#3159C9]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                Environment
              </span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AnalystMode)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#14213D] outline-none transition focus:border-[#3159C9] focus:ring-4 focus:ring-[#3159C9]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                Currency
              </span>
              <input
                value={currencyInput}
                maxLength={3}
                onChange={(event) =>
                  setCurrencyInput(event.target.value.toUpperCase())
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyCurrency();
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold uppercase text-[#14213D] outline-none transition focus:border-[#3159C9] focus:ring-4 focus:ring-[#3159C9]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="BDT"
              />
            </label>

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={applyCurrency}
              className="rounded-xl bg-[#3159C9] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(49,89,201,0.24)] transition hover:bg-[#294DB0]"
            >
              Apply filters
            </motion.button>
          </div>
        </Surface>

        {/* ===================================================
            ERRORS
        ==================================================== */}
        {overviewError ? (
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Overview error</p>
              <p className="mt-1 opacity-90">{overviewError}</p>
            </div>
          </motion.div>
        ) : null}

        {pulseError ? (
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Live pulse unavailable</p>
              <p className="mt-1 opacity-90">{pulseError}</p>
            </div>
          </motion.div>
        ) : null}

        {overview ? (
          <>
            {/* ===================================================
                KPI GRID
            ==================================================== */}
            <motion.div
              variants={containerVariants}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Completed payment volume"
                metric={overview.metrics.paymentVolumeMinor}
                value={formatMinor(overview.metrics.paymentVolumeMinor.value, currency)}
                icon={CircleDollarSign}
                accent="indigo"
                intent="higher-better"
              />
              <MetricCard
                label="Payment attempts"
                metric={overview.metrics.paymentCount}
                value={formatNumber(overview.metrics.paymentCount.value)}
                icon={CreditCard}
                accent="navy"
                intent="neutral"
              />
              <MetricCard
                label="Payment success rate"
                metric={overview.metrics.successRate}
                value={formatPercent(overview.metrics.successRate.value)}
                icon={CircleCheckBig}
                accent="cyan"
                intent="higher-better"
              />
              <MetricCard
                label="Payment fee revenue"
                metric={overview.metrics.paymentFeeRevenueMinor}
                value={formatMinor(
                  overview.metrics.paymentFeeRevenueMinor.value,
                  currency
                )}
                icon={TrendingUp}
                accent="violet"
                intent="higher-better"
              />
              <MetricCard
                label="Refund value"
                metric={overview.metrics.refundAmountMinor}
                value={formatMinor(overview.metrics.refundAmountMinor.value, currency)}
                icon={RefreshCcw}
                accent="navy"
                intent="lower-better"
              />
              <MetricCard
                label="Open dispute exposure"
                metric={overview.metrics.openDisputeExposureMinor}
                value={formatMinor(
                  overview.metrics.openDisputeExposureMinor.value,
                  currency
                )}
                icon={ShieldAlert}
                accent="violet"
                intent="lower-better"
              />
              <MetricCard
                label="Wallet transactions"
                metric={overview.metrics.walletTransactionCount}
                value={formatNumber(overview.metrics.walletTransactionCount.value)}
                icon={WalletCards}
                accent="cyan"
                intent="neutral"
              />
              <MetricCard
                label="Net payment volume"
                metric={overview.metrics.netPaymentVolumeMinor}
                value={formatMinor(
                  overview.metrics.netPaymentVolumeMinor.value,
                  currency
                )}
                icon={Gauge}
                accent="indigo"
                intent="higher-better"
              />
            </motion.div>

            {/* ===================================================
                MAIN PERFORMANCE CHART + EXECUTIVE RATIOS
            ==================================================== */}
            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Gateway performance"
                  title="Payment activity trend"
                  description="Attempts, completed payments and failures across the selected period."
                  icon={Activity}
                  accent="indigo"
                  trailing={
                    <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#14213D]" />
                        Attempts
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#3159C9]" />
                        Completed
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                        Failed
                      </span>
                    </div>
                  }
                />

                <div className="mt-5">
                  <PaymentActivityChart points={overview.trend} />
                </div>
              </Surface>

              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Operational ratios"
                  title="Executive health"
                  description="Deterministic ratios calculated from current-period records."
                  icon={Gauge}
                  accent="navy"
                />

                <div className="mt-6 space-y-5">
                  <RatioRow
                    label="Payment failure rate"
                    value={overview.executive.paymentFailureRate}
                    tone="indigo"
                  />
                  <RatioRow
                    label="Refund rate"
                    value={overview.executive.refundRate}
                    tone="navy"
                  />
                  <RatioRow
                    label="Dispute exposure rate"
                    value={overview.executive.disputeExposureRate}
                    tone="violet"
                  />
                  <RatioRow
                    label="High-risk transaction rate"
                    value={overview.executive.highRiskTransactionRate}
                    tone="violet"
                  />
                  <RatioRow
                    label="Wallet failure rate"
                    value={overview.executive.walletTransactionFailureRate}
                    tone="cyan"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-[#3159C9]/10 bg-[#3159C9]/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3159C9]">
                        In-progress gateway payments
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Current unresolved payment attempts
                      </p>
                    </div>
                    <span className="text-2xl font-black text-[#14213D] dark:text-white">
                      {formatNumber(overview.executive.pendingPaymentCount)}
                    </span>
                  </div>
                </div>
              </Surface>
            </div>

            {/* ===================================================
                USERS / WALLET + MERCHANT
            ==================================================== */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Coffer ecosystem"
                  title="Personal users & wallet activity"
                  description="Core account growth and wallet usage signals from Coffer's own user base."
                  icon={Users}
                  accent="cyan"
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat
                    label="Active users"
                    value={formatNumber(overview.accounts.activeUsers)}
                    icon={Users}
                    accent="cyan"
                  />
                  <MiniStat
                    label="New users"
                    value={formatNumber(overview.accounts.newUsers)}
                    icon={UserRound}
                    accent="indigo"
                  />
                  <MiniStat
                    label="KYC verified"
                    value={formatNumber(overview.accounts.kycVerifiedUsers)}
                    icon={BadgeCheck}
                    accent="violet"
                  />
                  <MiniStat
                    label="Wallet transactions"
                    value={formatNumber(overview.metrics.walletTransactionCount.value)}
                    icon={WalletCards}
                    accent="navy"
                    helper={`${formatNumber(overview.operations.failedTransactionCount)} failed · ${formatNumber(overview.operations.highRiskTransactionCount)} high risk`}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/15">
                    <div className="flex items-center gap-2 text-[#0891B2]">
                      <Activity className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        Wallet activity
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-[#14213D] dark:text-white">
                      {formatNumber(overview.metrics.walletTransactionCount.value)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatPercent(overview.executive.walletTransactionFailureRate)} failure rate
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/15">
                    <div className="flex items-center gap-2 text-[#7C5CE6]">
                      <ShieldAlert className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        Wallet risk
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-[#14213D] dark:text-white">
                      {formatNumber(overview.operations.highRiskTransactionCount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatPercent(overview.executive.highRiskTransactionRate)} high-risk share
                    </p>
                  </div>
                </div>
              </Surface>

              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Gateway business"
                  title="Merchant health"
                  description="Activation, verification and production readiness across merchants using Coffer."
                  icon={Building2}
                  accent="indigo"
                />

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat
                    label="Total"
                    value={formatNumber(overview.merchantHealth.totalMerchants)}
                    icon={Building2}
                    accent="navy"
                  />
                  <MiniStat
                    label="Active"
                    value={formatNumber(overview.merchantHealth.activeMerchants)}
                    icon={Store}
                    accent="indigo"
                  />
                  <MiniStat
                    label="Verified"
                    value={formatNumber(overview.merchantHealth.verifiedMerchants)}
                    icon={BadgeCheck}
                    accent="violet"
                  />
                  <MiniStat
                    label="Live enabled"
                    value={formatNumber(overview.merchantHealth.liveEnabledMerchants)}
                    icon={Zap}
                    accent="cyan"
                  />
                </div>

                <div className="mt-6 space-y-5">
                  <RatioRow
                    label="Activation rate"
                    value={overview.merchantHealth.activationRate}
                    tone="indigo"
                  />
                  <RatioRow
                    label="Verification rate"
                    value={overview.merchantHealth.verificationRate}
                    tone="violet"
                  />
                  <RatioRow
                    label="Live readiness rate"
                    value={overview.merchantHealth.liveReadinessRate}
                    tone="cyan"
                  />
                </div>
              </Surface>
            </div>

            {/* ===================================================
                LIVE PLATFORM PULSE
            ==================================================== */}
            <Surface className="overflow-hidden">
              <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50/80 via-white to-white p-5 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:via-slate-950 dark:to-slate-950 sm:p-6">
                <SectionHeading
                  eyebrow="Signal cyan · live data"
                  title="Live platform pulse"
                  description="Auto-refreshing payment, payout and wallet signals for the latest 60 minutes."
                  icon={Wifi}
                  accent="cyan"
                  trailing={
                    pulse ? (
                      <div className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <p>Updated {formatDateTime(pulse.generatedAt)}</p>
                        <p className="mt-1">Refresh every {pulse.refreshAfterSeconds}s</p>
                      </div>
                    ) : null
                  }
                />
              </div>

              <div className="p-5 sm:p-6">
                {pulseLoading && !pulse ? (
                  <div className="grid gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"
                      />
                    ))}
                  </div>
                ) : pulse ? (
                  <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniStat
                        label="Attempts / 60 min"
                        value={formatNumber(pulse.windows.last60Minutes.attemptCount)}
                        icon={CreditCard}
                        accent="cyan"
                        helper={
                          pulse.comparison.attemptChangePercent === null
                            ? "No previous baseline"
                            : `${pulse.comparison.attemptChangePercent >= 0 ? "+" : ""}${pulse.comparison.attemptChangePercent.toFixed(2)}% vs previous 60m`
                        }
                      />
                      <MiniStat
                        label="Success / 60 min"
                        value={formatPercent(pulse.windows.last60Minutes.successRate)}
                        icon={CircleCheckBig}
                        accent="indigo"
                        helper={`${pulse.comparison.successRateChangePoints >= 0 ? "+" : ""}${pulse.comparison.successRateChangePoints.toFixed(2)} pts vs previous 60m`}
                      />
                      <MiniStat
                        label="Volume / 60 min"
                        value={formatMinor(pulse.windows.last60Minutes.volumeMinor, currency)}
                        icon={CircleDollarSign}
                        accent="navy"
                        helper={
                          pulse.comparison.volumeChangePercent === null
                            ? "No previous baseline"
                            : `${pulse.comparison.volumeChangePercent >= 0 ? "+" : ""}${pulse.comparison.volumeChangePercent.toFixed(2)}% vs previous 60m`
                        }
                      />
                      <MiniStat
                        label="Stale payments"
                        value={formatNumber(pulse.queues.stalePaymentCount)}
                        icon={Clock3}
                        accent="violet"
                        helper="Current stale gateway queue"
                      />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/25 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/10">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-[#14213D] dark:text-white">
                              Live attempt flow
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Attempt and failure activity from the latest live timeline.
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0891B2]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0891B2]">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0891B2] opacity-60" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0891B2]" />
                            </span>
                            Live
                          </span>
                        </div>

                        <LivePulseChart points={pulse.timeline} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {pulse.scores.map((score) => {
                          const config = statusConfig(score.status);

                          return (
                            <motion.div
                              key={score.key}
                              whileHover={{ x: 3 }}
                              className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-[#14213D] dark:text-white">
                                  {score.label}
                                </p>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${config.className}`}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <div className="mt-2 flex items-end justify-between gap-3">
                                <p className="text-2xl font-black text-[#14213D] dark:text-white">
                                  {score.score}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {score.trend}
                                </p>
                              </div>
                              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                {score.basis}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {pulse.alerts.length > 0 ? (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {pulse.alerts.map((alert) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -2 }}
                            className={`rounded-2xl border p-4 ${alertClasses(alert.severity)}`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-bold">{alert.title}</p>
                                <p className="mt-1 text-sm leading-6 opacity-90">
                                  {alert.description}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-bold dark:bg-black/20">
                                {alert.metric}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                        <CircleCheckBig className="h-5 w-5" />
                        No live alerts are currently active.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Live pulse is unavailable.
                  </p>
                )}
              </div>
            </Surface>

            {/* ===================================================
                RISK & EXCEPTIONS
            ==================================================== */}
            <Surface className="p-5 sm:p-6">
              <SectionHeading
                eyebrow="Risk & exceptions"
                title="Operational pressure"
                description="Payment, refund, dispute and wallet-risk exposure for the selected period."
                icon={ShieldAlert}
                accent="violet"
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MiniStat
                  label="High-risk transactions"
                  value={formatNumber(overview.riskSummary.highRiskTransactionCount)}
                  icon={ShieldAlert}
                  accent="violet"
                  helper={formatPercent(overview.riskSummary.highRiskTransactionRate)}
                />
                <MiniStat
                  label="Failed payments"
                  value={formatNumber(overview.riskSummary.failedPaymentCount)}
                  icon={AlertTriangle}
                  accent="navy"
                  helper={formatPercent(overview.riskSummary.paymentFailureRate)}
                />
                <MiniStat
                  label="Refund exposure"
                  value={formatMinor(overview.riskSummary.refundAmountMinor, currency)}
                  icon={RefreshCcw}
                  accent="indigo"
                  helper={`${formatPercent(overview.riskSummary.refundRate)} of completed volume`}
                />
                <MiniStat
                  label="Open disputes"
                  value={formatNumber(overview.riskSummary.openDisputeCount)}
                  icon={CircleAlert}
                  accent="violet"
                  helper={formatPercent(overview.riskSummary.disputeExposureRate)}
                />
                <MiniStat
                  label="Dispute exposure"
                  value={formatMinor(
                    overview.riskSummary.openDisputeExposureMinor,
                    currency
                  )}
                  icon={Gauge}
                  accent="navy"
                />
                <MiniStat
                  label="Failed wallet tx"
                  value={formatNumber(overview.operations.failedTransactionCount)}
                  icon={WalletCards}
                  accent="cyan"
                  helper={formatPercent(overview.executive.walletTransactionFailureRate)}
                />
              </div>
            </Surface>

            {/* ===================================================
                BREAKDOWNS
            ==================================================== */}
            <div className="grid gap-6 xl:grid-cols-3">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  title="Payment status"
                  description="Gateway lifecycle distribution."
                  icon={CreditCard}
                  accent="indigo"
                />
                <div className="mt-6">
                  <BreakdownList
                    items={overview.paymentStatus}
                    emptyLabel="No payment status data."
                    tone="indigo"
                  />
                </div>
              </Surface>

              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  title="Provider mix"
                  description="Payment attempt share by provider."
                  icon={Zap}
                  accent="cyan"
                />
                <div className="mt-6">
                  <BreakdownList
                    items={overview.providers}
                    emptyLabel="No provider data."
                    tone="cyan"
                  />
                </div>
              </Surface>

              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  title="Transaction risk"
                  description="Wallet transaction risk distribution."
                  icon={ShieldAlert}
                  accent="violet"
                />
                <div className="mt-6">
                  <BreakdownList
                    items={overview.transactionRisk}
                    emptyLabel="No wallet-risk data."
                    tone="violet"
                  />
                </div>
              </Surface>
            </div>

            {/* ===================================================
                REVENUE + DATA QUALITY
            ==================================================== */}
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Revenue quality"
                  title="Revenue ledger"
                  description={overview.revenueLedger.note}
                  icon={CircleDollarSign}
                  accent="indigo"
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Classified net revenue"
                    value={formatMinor(
                      overview.revenueLedger.classifiedNetRevenueMinor,
                      currency
                    )}
                    icon={TrendingUp}
                    accent="indigo"
                  />
                  <MiniStat
                    label="Classified events"
                    value={formatNumber(overview.revenueLedger.classifiedEventCount)}
                    icon={Database}
                    accent="navy"
                  />
                  <MiniStat
                    label="Unclassified events"
                    value={formatNumber(overview.revenueLedger.unclassifiedEventCount)}
                    icon={AlertTriangle}
                    accent="violet"
                  />
                </div>
              </Surface>

              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Freshness"
                  title="Data confidence"
                  description="Source read timing and daily fact coverage."
                  icon={Database}
                  accent="navy"
                />

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Overview generated</p>
                      <p className="mt-1 text-sm font-bold text-[#14213D] dark:text-white">
                        {formatDateTime(overview.generatedAt)}
                      </p>
                    </div>
                    <Clock3 className="h-5 w-5 text-[#3159C9]" />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Latest daily fact</p>
                      <p className="mt-1 text-sm font-bold text-[#14213D] dark:text-white">
                        {formatDateTime(overview.freshness.latestDailyFactGeneratedAt)}
                      </p>
                    </div>
                    <Database className="h-5 w-5 text-[#0891B2]" />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Daily fact coverage</p>
                      <p className="mt-1 text-sm font-bold text-[#14213D] dark:text-white">
                        {formatNumber(overview.freshness.dailyFactDaysCovered)} days
                      </p>
                    </div>
                    <BadgeCheck className="h-5 w-5 text-[#7C5CE6]" />
                  </div>
                </div>
              </Surface>
            </div>

            {/* ===================================================
                INTELLIGENCE
            ==================================================== */}
            <Surface className="overflow-hidden">
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-white p-5 dark:border-violet-900/40 dark:from-violet-950/20 dark:via-slate-950 dark:to-slate-950 sm:p-6">
                <SectionHeading
                  eyebrow="Insight violet · intelligence"
                  title="Deterministic analyst insights"
                  description="Explainable threshold-based observations for human review; no automated financial decisions."
                  icon={BrainCircuit}
                  accent="violet"
                  trailing={
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[#7C5CE6] dark:border-violet-900/50 dark:bg-slate-950">
                      <Sparkles className="h-3.5 w-3.5" />
                      {overview.insights.length} signals
                    </span>
                  }
                />
              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                {overview.insights.length > 0 ? (
                  overview.insights.map((insight, index) => (
                    <motion.article
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
                      whileHover={{ y: -3 }}
                      className={`rounded-2xl border p-5 ${insightClasses(
                        insight.severity
                      )}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#7C5CE6] shadow-sm dark:bg-slate-950/60">
                            <BrainCircuit className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#14213D] dark:text-white">
                              {insight.title}
                            </p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">
                              {insight.category}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                          {insight.severity}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {insight.description}
                      </p>

                      <div className="mt-4 rounded-xl bg-white/60 p-3 text-xs leading-5 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                        <strong>Evidence:</strong> {insight.evidence}
                      </div>

                      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        <strong>Review:</strong> {insight.recommendedAction}
                      </p>
                    </motion.article>
                  ))
                ) : (
                  <div className="col-span-full flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                    <CircleCheckBig className="h-5 w-5" />
                    No deterministic insight signals were generated for this scope.
                  </div>
                )}
              </div>
            </Surface>

            {/* ===================================================
                READ-ONLY FOOTER
            ==================================================== */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CE6]/10 text-[#7C5CE6]">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#14213D] dark:text-white">
                    Read-only analyst workspace
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Insights support review only and cannot execute payment, refund, payout, KYC or configuration actions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Database className="h-3.5 w-3.5" />
                Last generated {formatDateTime(overview.generatedAt)}
              </div>
            </motion.div>
          </>
        ) : (
          <Surface className="p-8 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No overview data is available.
            </p>
          </Surface>
        )}
      </motion.main>
    </div>
  );
}
