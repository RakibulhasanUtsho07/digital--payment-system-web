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
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DatabaseZap,
  Filter,
  Gauge,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
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
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystRefundAnalytics,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
  type AnalystRefundAnalyticsData,
  type AnalystRefundInsight,
  type AnalystRefundStatus,
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

const STATUS_COLORS: Record<string, string> = {
  completed: THEME.emerald,
  pending: THEME.amber,
  failed: THEME.red,
  cancelled: THEME.slate,
};

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
  helper: string;
}> = [
  {
    value: "24h",
    label: "Last 24 hours",
    helper: "Hourly refund activity",
  },
  {
    value: "7d",
    label: "Last 7 days",
    helper: "Weekly refund window",
  },
  {
    value: "30d",
    label: "Last 30 days",
    helper: "Monthly refund window",
  },
  {
    value: "90d",
    label: "Last 90 days",
    helper: "Quarter-scale refund view",
  },
];

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
  helper: string;
}> = [
  {
    value: "all",
    label: "All modes",
    helper: "Live + test payments",
  },
  {
    value: "live",
    label: "Live only",
    helper: "Production payment refunds",
  },
  {
    value: "test",
    label: "Test only",
    helper: "Sandbox payment refunds",
  },
];

const STATUS_OPTIONS: Array<{
  value: AnalystRefundStatus;
  label: string;
  helper: string;
}> = [
  {
    value: "all",
    label: "All statuses",
    helper: "Every refund lifecycle state",
  },
  {
    value: "completed",
    label: "Completed",
    helper: "Successfully completed refunds",
  },
  {
    value: "pending",
    label: "Pending",
    helper: "Refunds awaiting completion",
  },
  {
    value: "failed",
    label: "Failed",
    helper: "Refund operations that failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    helper: "Cancelled refund records",
  },
];

/* =========================================================
   FORMATTERS
========================================================= */

function numberText(value: number): string {
  return new Intl.NumberFormat("en-BD").format(value);
}

function moneyText(
  minor: number,
  currency: string,
  compact = false
): string {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString("en-BD")}`;
  }
}

function durationText(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)}m`;
  }

  return `${(seconds / 3600).toFixed(1)}h`;
}

function dateText(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function bucketText(
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
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
        filter: "blur(4px)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.42,
        delay: index * 0.055,
        ease: easeOut,
      }}
      className="group relative flex min-h-[174px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
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
          whileHover={{
            rotate: 6,
            scale: 1.08,
          }}
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
              opacity: [0.28, 0.66, 0.28],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
          />

          <motion.div
            aria-hidden
            animate={{
              opacity: [0.16, 0.42, 0.16],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 17,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-24 left-[24%] h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl"
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
    helper: string;
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
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left outline-none transition hover:border-teal-500/45 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-foreground">
            {selected?.label}
          </p>

          <p className="truncate text-[10px] text-muted-foreground">
            {selected?.helper}
          </p>
        </div>

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
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "hover:bg-muted/60"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold">
                      {option.label}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {option.helper}
                    </p>
                  </div>

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
          opacity: [0.5, 1, 0.5],
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
        No refund activity
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
      <Empty message="No matching breakdown data exists." />
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="truncate text-xs font-bold text-foreground">
              {humanize(row.key)}
            </span>

            <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
              {numberText(row.count)} · {row.percentage.toFixed(2)}%
            </span>
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
              style={{ backgroundColor: color }}
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

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  moneyKeys = [],
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
  currency: string;
  moneyKeys?: string[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="min-w-[190px] rounded-2xl border border-white/10 bg-[#0D1D29]/95 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    >
      {label ? (
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-teal-300">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? "");
          const value = Number(entry.value ?? 0);
          const money = moneyKeys.includes(key);

          return (
            <div
              key={`${key}-${index}`}
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

                <span className="truncate">{entry.name}</span>
              </span>

              <span className="shrink-0 font-black tabular-nums text-white">
                {money
                  ? moneyText(value * 100, currency, true)
                  : numberText(value)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* =========================================================
   PIE CHART WITH NEEDLE — REAL BACKEND DATA ONLY
========================================================= */

function RefundCompletionGauge({
  statuses,
  completionRate,
}: {
  statuses: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  completionRate: number;
}) {
  const chartData = statuses
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: humanize(item.status),
      value: item.count,
      percentage: item.percentage,
      color:
        STATUS_COLORS[item.status.toLowerCase()] ??
        THEME.slate,
    }));

  if (chartData.length === 0) {
    return (
      <Empty message="No refund status population exists for this gauge." />
    );
  }

  const clamped = Math.max(0, Math.min(100, completionRate));
  const cx = 170;
  const cy = 166;
  const needleLength = 105;
  const angle = Math.PI * (1 - clamped / 100);
  const needleX = cx + needleLength * Math.cos(angle);
  const needleY = cy - needleLength * Math.sin(angle);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
      <div className="relative mx-auto h-[205px] w-full max-w-[360px]">
        <PieChart
          width={340}
          height={200}
          style={{
            margin: "0 auto",
            maxWidth: "100%",
          }}
        >
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            startAngle={180}
            endAngle={0}
            cx={cx}
            cy={cy}
            innerRadius={82}
            outerRadius={140}
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={1.2}
            isAnimationActive
            animationDuration={1200}
          >
            {chartData.map((item) => (
              <Cell
                key={item.name}
                fill={item.color}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, name) => [
              numberText(Number(value ?? 0)),
              String(name ?? ""),
            ]}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "#0D1D29",
              color: "#FFFFFF",
              fontSize: 12,
            }}
          />
        </PieChart>

        <svg
          aria-hidden
          viewBox="0 0 340 200"
          className="pointer-events-none absolute inset-0 mx-auto h-[200px] w-[340px] max-w-full"
        >
          <motion.line
            x1={cx}
            y1={cy}
            initial={{
              x2: cx,
              y2: cy,
            }}
            animate={{
              x2: needleX,
              y2: needleY,
            }}
            transition={{
              duration: 1.25,
              delay: 0.25,
              ease: easeOut,
            }}
            stroke="#D7E84D"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <circle
            cx={cx}
            cy={cy}
            r="7"
            fill="#D7E84D"
          />

          <circle
            cx={cx}
            cy={cy}
            r="3"
            fill="#10243A"
          />
        </svg>

        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
          <p className="text-2xl font-black tabular-nums text-foreground">
            {completionRate.toFixed(2)}%
          </p>

          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Completion rate
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />

              <span className="truncate">{item.name}</span>
            </span>

            <span className="shrink-0 text-[11px] font-black tabular-nums text-muted-foreground">
              {numberText(item.value)} · {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   LINE GRAPH — REAL BACKEND TREND ONLY
========================================================= */

function RefundLifecycleLineChart({
  data,
  currency,
}: {
  data: Array<{
    label: string;
    refundCount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
  }>;
  currency: string;
}) {
  if (!data.some((point) => point.refundCount > 0)) {
    return (
      <Empty
        dark
        message="No refund lifecycle trend exists for the selected filters."
      />
    );
  }

  return (
    <div className="h-[360px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{
            top: 8,
            right: 12,
            left: -14,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="5 5"
            stroke="rgba(255,255,255,0.09)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={22}
            tick={{
              fontSize: 10,
              fill: THEME.axis,
            }}
          />

          <YAxis
            allowDecimals={false}
            width={42}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: THEME.axis,
            }}
          />

          <Tooltip
            content={
              <ChartTooltip
                currency={currency}
              />
            }
            cursor={{
              stroke: "rgba(20,184,166,0.35)",
              strokeWidth: 2,
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            height={34}
            wrapperStyle={{
              fontSize: 10,
              color: "#CBD5E1",
            }}
          />

          <Line
            type="monotone"
            dataKey="refundCount"
            name="Refund requests"
            stroke={THEME.sky}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={1250}
          />

          <Line
            type="monotone"
            dataKey="completedCount"
            name="Completed"
            stroke={THEME.emerald}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationBegin={150}
            animationDuration={1250}
          />

          <Line
            type="monotone"
            dataKey="pendingCount"
            name="Pending"
            stroke={THEME.amber}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationBegin={300}
            animationDuration={1250}
          />

          <Line
            type="monotone"
            dataKey="failedCount"
            name="Failed"
            stroke={THEME.red}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationBegin={450}
            animationDuration={1250}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  insight,
  index,
}: {
  insight: AnalystRefundInsight;
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
      whileHover={{ y: -3 }}
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

export default function AnalystRefundsPage() {
  const [range, setRange] =
    useState<AnalystRange>("30d");

  const [mode, setMode] =
    useState<AnalystMode>("all");

  const [status, setStatus] =
    useState<AnalystRefundStatus>("all");

  const [currency, setCurrency] =
    useState("BDT");

  const [currencyDraft, setCurrencyDraft] =
    useState("BDT");

  const [data, setData] =
    useState<AnalystRefundAnalyticsData | null>(null);

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

    let active = true;

    async function load() {
      try {
        if (hasLoadedRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getAnalystRefundAnalytics(
            {
              range,
              mode,
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
            loadError instanceof Error
              ? loadError.message
              : "Unable to load refund analytics."
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
    status,
    refreshKey,
  ]);

  /* =======================================================
     CHART DATA — BACKEND ONLY
  ======================================================= */

  const chartData =
    useMemo(
      () =>
        data?.trend.map((point) => ({
          ...point,
          label: bucketText(
            point.bucket,
            range
          ),
          refundAmountMajor:
            point.refundAmountMinor / 100,
        })) ?? [],
      [
        data,
        range,
      ]
    );

  /* =======================================================
     APPLY CURRENCY
  ======================================================= */

  function applyCurrency(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const next =
      currencyDraft
        .trim()
        .toUpperCase();

    if (!/^[A-Z]{3}$/.test(next)) {
      setError(
        "Currency must be a three-letter ISO code."
      );
      return;
    }

    setCurrency(next);
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
              rotate: [0, 12, -12, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600"
          >
            <RotateCcw className="h-7 w-7" />
          </motion.div>

          <p className="mt-4 text-sm font-extrabold">
            Loading refund intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Aggregating real refund records...
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
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
          animate={{ rotate: 360 }}
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
              <RotateCcw className="h-3.5 w-3.5" />
              Refund Intelligence Workspace
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Refund Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Monitor real refund value, lifecycle reliability, processing
              latency, reasons, merchant concentration and provider performance.
            </p>

            {data ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Updated {dateText(data.generatedAt)}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  {data.filters.currency} · {data.filters.range}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  {data.filters.mode} traffic
                </span>
              </div>
            ) : null}
          </div>

          <motion.button
            type="button"
            disabled={refreshing}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              setRefreshKey((current) => current + 1)
            }
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
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
              Refund filters
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Refine the real refund population returned by the backend.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Refund status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />

          <form
            onSubmit={applyCurrency}
            className="flex flex-col"
          >
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Currency
            </span>

            <div className="flex">
              <input
                value={currencyDraft}
                maxLength={3}
                onChange={(event) =>
                  setCurrencyDraft(
                    event.target.value
                      .replace(/[^a-z]/gi, "")
                      .slice(0, 3)
                      .toUpperCase()
                  )
                }
                className="h-12 min-w-0 flex-1 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black uppercase outline-none transition focus:z-10 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />

              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-r-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-[10px] font-black uppercase text-white"
              >
                Apply
              </motion.button>
            </div>
          </form>
        </div>
      </motion.section>

      {data ? (
        <>
          {/* =================================================
              METRICS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              index={0}
              label="Refund Requests"
              value={numberText(
                data.metrics.refundCount.value
              )}
              helper="All matching refund records"
              metric={data.metrics.refundCount}
              icon={RotateCcw}
              iconClass="bg-sky-500/10 text-sky-600"
              accentClass="bg-sky-500"
              inverse
            />

            <MetricCard
              index={1}
              label="Refund Value"
              value={moneyText(
                data.metrics.completedRefundAmountMinor.value,
                data.filters.currency,
                true
              )}
              helper="Completed refund value"
              metric={data.metrics.completedRefundAmountMinor}
              icon={WalletCards}
              iconClass="bg-violet-500/10 text-violet-600"
              accentClass="bg-violet-500"
              inverse
            />

            <MetricCard
              index={2}
              label="Refund Rate"
              value={`${data.metrics.refundRate.value.toFixed(2)}%`}
              helper="Refund value / completed payment volume"
              metric={data.metrics.refundRate}
              icon={ShieldAlert}
              iconClass="bg-amber-500/10 text-amber-600"
              accentClass="bg-amber-500"
              inverse
            />

            <MetricCard
              index={3}
              label="Completion Rate"
              value={`${data.metrics.completionRate.value.toFixed(2)}%`}
              helper={`${numberText(
                data.metrics.completedRefundCount.value
              )} completed`}
              metric={data.metrics.completionRate}
              icon={CheckCircle2}
              iconClass="bg-emerald-500/10 text-emerald-600"
              accentClass="bg-emerald-500"
            />

            <MetricCard
              index={4}
              label="Failure Rate"
              value={`${data.metrics.failureRate.value.toFixed(2)}%`}
              helper={`${numberText(
                data.operations.failedCount
              )} failed refunds`}
              metric={data.metrics.failureRate}
              icon={XCircle}
              iconClass="bg-red-500/10 text-red-600"
              accentClass="bg-red-500"
              inverse
            />

            <MetricCard
              index={5}
              label="Average Refund"
              value={moneyText(
                data.metrics.averageRefundMinor.value,
                data.filters.currency
              )}
              helper="Completed refunds only"
              metric={data.metrics.averageRefundMinor}
              icon={RotateCcw}
              iconClass="bg-indigo-500/10 text-indigo-600"
              accentClass="bg-indigo-500"
              inverse
            />

            <MetricCard
              index={6}
              label="Completion Latency"
              value={durationText(
                data.metrics.averageCompletionSeconds.value
              )}
              helper="Created → completed average"
              metric={data.metrics.averageCompletionSeconds}
              icon={TimerReset}
              iconClass="bg-cyan-500/10 text-cyan-600"
              accentClass="bg-cyan-500"
              inverse
            />

            <MetricCard
              index={7}
              label="Pending"
              value={numberText(
                data.operations.pendingCount
              )}
              helper={`${numberText(
                data.operations.settledCount
              )} refunds linked to settlement`}
              metric={data.metrics.refundCount}
              icon={Clock3}
              iconClass="bg-orange-500/10 text-orange-600"
              accentClass="bg-orange-500"
              inverse
            />
          </section>

          {/* =================================================
              GAUGE + USER REQUESTED LINE GRAPH
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
            <Panel
              title="Refund Completion Gauge"
              description="Needle uses the real backend completion rate; gauge segments use the current real refund-status population."
              action={
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  <Gauge className="h-3.5 w-3.5" />
                  Live scope
                </span>
              }
            >
              <RefundCompletionGauge
                statuses={data.statuses}
                completionRate={
                  data.metrics.completionRate.value
                }
              />
            </Panel>

            <Panel
              tone="dark"
              title="Refund Lifecycle Graph"
              description="Real refund requests, completed, pending and failed records across the selected period."
            >
              <RefundLifecycleLineChart
                data={chartData}
                currency={data.filters.currency}
              />
            </Panel>
          </div>

          {/* =================================================
              VALUE + RELIABILITY TREND
          ================================================= */}

          <Panel
            tone="dark"
            title="Refund Value & Reliability Trend"
            description="Completed refund value, failures, pending records and completed refunds from the same backend trend series."
            action={
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    label: "Refund value",
                    color: THEME.violet,
                  },
                  {
                    label: "Completed",
                    color: THEME.emerald,
                  },
                  {
                    label: "Pending",
                    color: THEME.amber,
                  },
                  {
                    label: "Failed",
                    color: THEME.red,
                  },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-slate-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            }
          >
            {chartData.some((point) => point.refundCount > 0) ? (
              <div className="h-[380px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={chartData}
                    margin={{
                      top: 14,
                      right: 15,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="refundValueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={THEME.violet}
                          stopOpacity={0.42}
                        />

                        <stop
                          offset="95%"
                          stopColor={THEME.violet}
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
                      yAxisId="count"
                      allowDecimals={false}
                      tick={{
                        fontSize: 10,
                        fill: THEME.axis,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="value"
                      orientation="right"
                      tick={{
                        fontSize: 10,
                        fill: THEME.axis,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={
                        <ChartTooltip
                          currency={data.filters.currency}
                          moneyKeys={["refundAmountMajor"]}
                        />
                      }
                      cursor={{
                        stroke: "rgba(20,184,166,0.35)",
                        strokeWidth: 2,
                      }}
                    />

                    <Area
                      yAxisId="value"
                      type="monotone"
                      dataKey="refundAmountMajor"
                      name="Refund value"
                      stroke={THEME.violet}
                      strokeWidth={2.5}
                      fill="url(#refundValueGradient)"
                      isAnimationActive
                      animationDuration={1300}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="failedCount"
                      name="Failed"
                      fill={THEME.red}
                      maxBarSize={15}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={200}
                      animationDuration={1050}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="pendingCount"
                      name="Pending"
                      fill={THEME.amber}
                      maxBarSize={15}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={320}
                      animationDuration={1050}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="completedCount"
                      name="Completed"
                      stroke={THEME.emerald}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive
                      animationBegin={420}
                      animationDuration={1200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                dark
                message="No refund records exist for the selected filters."
              />
            )}
          </Panel>

          {/* =================================================
              BREAKDOWNS
          ================================================= */}

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            <Panel
              className="min-h-[380px]"
              title="Refund Status"
              description="Current refund lifecycle distribution."
            >
              <Breakdown
                color={THEME.teal}
                rows={
                  data.statuses.map((item) => ({
                    key: item.status,
                    count: item.count,
                    percentage: item.percentage,
                  }))
                }
              />
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Payment Sources"
              description="Original payment source associated with refunded payments."
            >
              <Breakdown
                color={THEME.cyan}
                rows={
                  data.sources.map((item) => ({
                    key: item.source,
                    count: item.count,
                    percentage: item.percentage,
                  }))
                }
              />
            </Panel>

            <Panel
              className="min-h-[380px]"
              title="Failure Reasons"
              description="Recorded failure codes for failed refund operations."
            >
              <Breakdown
                color={THEME.red}
                rows={
                  data.failureReasons.map((item) => ({
                    key: item.code,
                    count: item.count,
                    percentage: item.percentage,
                  }))
                }
              />
            </Panel>
          </div>

          {/* =================================================
              REFUND REASONS
          ================================================= */}

          <Panel
            title="Refund Reasons"
            description="Most common recorded merchant refund reasons."
          >
            {data.reasons.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.reasons.map((reason, index) => (
                  <motion.div
                    key={reason.reason}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4 }}
                    transition={{
                      delay: index * 0.05,
                      ease: easeOut,
                    }}
                    className="relative overflow-hidden rounded-2xl border border-border bg-background p-5"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-400" />

                    <p className="truncate text-xs font-extrabold">
                      {humanize(reason.reason)}
                    </p>

                    <p className="mt-3 text-2xl font-black tabular-nums">
                      {numberText(reason.count)}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {reason.percentage.toFixed(2)}% of refunds
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        Recorded value
                      </span>

                      <span className="text-xs font-black text-amber-600">
                        {moneyText(
                          reason.amountMinor,
                          data.filters.currency,
                          true
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Empty message="No refund reason metadata exists for these records." />
            )}
          </Panel>

          {/* =================================================
              PROVIDERS
          ================================================= */}

          <Panel
            title="Provider Refund Performance"
            description="Refund completion behaviour grouped by the provider of the original payment."
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
                        Refunds
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Completed
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Failed
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Value
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Completion
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.providers.map((provider, index) => (
                      <motion.tr
                        key={provider.provider}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.025 }}
                        className="transition-colors hover:bg-teal-500/[0.035]"
                      >
                        <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                          {humanize(provider.provider)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                          {numberText(provider.count)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-emerald-600">
                          {numberText(provider.completedCount)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-red-600">
                          {numberText(provider.failedCount)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                          {moneyText(
                            provider.amountMinor,
                            data.filters.currency,
                            true
                          )}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-600">
                            {provider.completionRate.toFixed(2)}%
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty message="No provider-linked refund activity is available." />
            )}
          </Panel>

          {/* =================================================
              MERCHANTS
          ================================================= */}

          <Panel
            title="Merchant Refund Concentration"
            description="Merchants contributing the largest completed refund value."
          >
            {data.merchants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Merchant
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Refunds
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Completed
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Refund Value
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Share
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.merchants.map((merchant, index) => (
                      <motion.tr
                        key={merchant.merchantId}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.025 }}
                        className="transition-colors hover:bg-teal-500/[0.035]"
                      >
                        <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                          {merchant.businessName}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                          {numberText(merchant.refundCount)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-emerald-600">
                          {numberText(merchant.completedRefundCount)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                          {moneyText(
                            merchant.refundAmountMinor,
                            data.filters.currency,
                            true
                          )}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                          {merchant.refundAmountShare.toFixed(2)}%
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty message="No merchant refund concentration exists for this period." />
            )}
          </Panel>

          {/* =================================================
              INTELLIGENCE
          ================================================= */}

          <Panel
            tone="dark"
            title="Refund Intelligence"
            description="Explainable refund-volume, reliability, latency, merchant and provider signals generated from real analytics."
            action={
              <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-200">
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
              <Empty
                dark
                message="No deterministic refund insight was generated for the current filters."
              />
            )}
          </Panel>

          {/* =================================================
              READ ONLY
          ================================================= */}

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Read-only refund intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts can inspect refund patterns but cannot create,
                  cancel, retry, approve, settle, or modify refunds from this
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
