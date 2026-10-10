"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
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
  ChevronDown,
  Check,
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
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

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
  // Screenshot-inspired Ocean Glow palette.
  // The legacy key names are kept so the page API stays untouched.
  navy: "#17324D",
  indigo: "#0F9D91",
  cyan: "#22C7B8",
  violet: "#38BDF8",
  canvas: "#F4F8F7",
  emerald: "#059669",
  amber: "#D97706",
  red: "#DC2626",
  inkMuted: "#64778A",
  grid: "#DCE7E5",
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
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.988,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.52,
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
      return "border-amber-200/80 bg-amber-50/[0.55] dark:border-amber-900/50 dark:bg-amber-950/15";
    case "positive":
      return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25";
    case "info":
      return "border-[#BFE4E1] bg-[#F3FAF9] dark:border-cyan-900/50 dark:bg-cyan-950/15";
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
      className={`min-w-0 rounded-[22px] border border-[#DCE7E5] bg-white/95 shadow-[0_12px_34px_rgba(23,50,77,0.055)] ring-1 ring-white/70 backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:border-[#C2DDD9] hover:shadow-[0_16px_42px_rgba(11,79,82,0.08)] dark:border-slate-800 dark:bg-slate-950/95 dark:ring-white/5 sm:rounded-[26px] ${className}`}
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
      icon: "bg-[#0F9D91]/10 text-[#0F9D91]",
      eyebrow: "text-[#0F9D91]",
    },
    cyan: {
      icon: "bg-[#22C7B8]/10 text-[#22C7B8]",
      eyebrow: "text-[#22C7B8]",
    },
    violet: {
      icon: "bg-[#38BDF8]/10 text-[#38BDF8]",
      eyebrow: "text-[#38BDF8]",
    },
    navy: {
      icon: "bg-[#17324D]/10 text-[#17324D] dark:bg-white/10 dark:text-white",
      eyebrow: "text-[#17324D] dark:text-slate-200",
    },
  } as const;

  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 flex-1 gap-3">
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

          <h2 className="mt-0.5 break-words text-lg font-black leading-tight tracking-[-0.02em] text-[#17324D] [overflow-wrap:anywhere] dark:text-white sm:text-xl">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {trailing ? <div className="min-w-0 w-full md:w-auto md:max-w-[48%]">{trailing}</div> : null}
    </div>
  );
}


interface AnalystSelectOption {
  value: string;
  label: string;
}

function AnalystSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly AnalystSelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    options.find(
      (option) =>
        option.value === value
    ) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutside = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        rootRef.current &&
        !rootRef.current.contains(
          target
        )
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`
        relative
        min-w-0

        ${
          open
            ? "z-[120]"
            : "z-20"
        }
      `}
    >
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className={`
          group
          flex
          h-12
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-[15px]
          border
          bg-white
          px-3.5
          text-left
          text-sm
          font-bold
          text-[#17324D]
          shadow-[0_5px_18px_rgba(23,50,77,0.035)]
          outline-none
          transition-all
          duration-200

          hover:bg-[#FBFDFC]

          focus-visible:ring-4
          focus-visible:ring-[#0B4F52]/10

          dark:bg-slate-900
          dark:text-white
          dark:focus-visible:ring-cyan-500/10

          ${
            open
              ? "border-[#0B4F52] ring-4 ring-[#0B4F52]/10 dark:border-cyan-700 dark:ring-cyan-500/10"
              : "border-[#D4E4E1] hover:border-[#AFCFC9] dark:border-slate-700 dark:hover:border-slate-600"
          }
        `}
      >
        <span className="min-w-0 flex-1 truncate">
          {
            selected?.label ??
            `Select ${label}`
          }
        </span>

        <span
          className={`
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-[#0B4F52]/[0.07]
            text-[#0B4F52]
            transition-all
            duration-200

            dark:bg-cyan-400/[0.08]
            dark:text-cyan-200

            ${
              open
                ? "rotate-180 bg-[#0B4F52]/[0.12] dark:bg-cyan-400/[0.12]"
                : "rotate-0"
            }
          `}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.985,
            }}
            transition={{
              duration: 0.16,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            role="listbox"
            aria-label={label}
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+8px)]
              z-[100]
              max-h-64
              overflow-y-auto
              rounded-[16px]
              border
              border-[#D4E4E1]
              bg-white
              p-1.5
              shadow-[0_18px_50px_rgba(23,50,77,0.16)]
              ring-1
              ring-white/80
              backdrop-blur-xl

              dark:border-slate-700
              dark:bg-slate-900
              dark:ring-white/5
            "
          >
            {options.map(
              (
                option,
                index
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <motion.button
                    key={
                      option.value
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      active
                    }
                    initial={{
                      opacity: 0,
                      y: 3,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.018,
                      duration:
                        0.14,
                    }}
                    onClick={() => {
                      onChange(
                        option.value
                      );
                      setOpen(
                        false
                      );
                    }}
                    className={`
                      flex
                      w-full
                      min-w-0
                      items-center
                      justify-between
                      gap-3
                      rounded-[11px]
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      font-bold
                      transition-all
                      duration-150

                      ${
                        active
                          ? "bg-[#0B4F52]/[0.09] text-[#0B4F52] dark:bg-cyan-400/[0.10] dark:text-cyan-100"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-[#0B4F52] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-cyan-100"
                      }
                    `}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {
                        option.label
                      }
                    </span>

                    {active && (
                      <span
                        className="
                          flex
                          h-6
                          w-6
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-[#0B4F52]
                          text-white
                          shadow-[0_5px_14px_rgba(11,79,82,.20)]

                          dark:bg-cyan-700
                        "
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </motion.button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
      className={`inline-flex max-w-full items-center gap-2 whitespace-normal rounded-full border px-3 py-1.5 text-xs font-bold ${config.className}`}
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
      icon: "bg-[#0F9D91]/10 text-[#0F9D91]",
      line: "bg-[#0F9D91]",
    },
    cyan: {
      icon: "bg-[#22C7B8]/10 text-[#22C7B8]",
      line: "bg-[#22C7B8]",
    },
    violet: {
      icon: "bg-[#38BDF8]/10 text-[#38BDF8]",
      line: "bg-[#38BDF8]",
    },
    navy: {
      icon: "bg-[#17324D]/10 text-[#17324D] dark:bg-white/10 dark:text-white",
      line: "bg-[#17324D] dark:bg-slate-200",
    },
  } as const;

  const trend = getMetricTrend(metric, intent);
  const TrendIcon = trend.Icon;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative min-w-0 overflow-hidden rounded-[22px] border border-[#DCE7E5] bg-white/95 p-4 shadow-[0_8px_26px_rgba(23,50,77,0.05)] ring-1 ring-white/80 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[#BEDBD7] hover:shadow-[0_14px_38px_rgba(11,79,82,0.09)] dark:border-slate-800 dark:bg-slate-950/95 dark:ring-white/5 sm:rounded-[24px] sm:p-5"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentConfig[accent].line}`}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#5EEAD4]/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-w-0 items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 break-words text-xl font-black leading-tight tracking-tight text-[#17324D] [overflow-wrap:anywhere] dark:text-white sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${accentConfig[accent].icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative z-10 mt-4 flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className={`inline-flex min-w-0 flex-wrap items-center gap-1 text-xs font-bold ${trend.className}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {metricChange(metric)}
        </span>

        {helper ? (
          <span className="break-words text-[11px] font-medium text-slate-400 [overflow-wrap:anywhere] dark:text-slate-500 sm:text-right">
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
    indigo: "bg-[#0F9D91]",
    cyan: "bg-[#22C7B8]",
    violet: "bg-[#38BDF8]",
    navy: "bg-[#17324D] dark:bg-slate-200",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3 text-sm">
        <span className="min-w-0 break-words font-medium text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">
          {label}
        </span>
        <span className="shrink-0 font-extrabold text-[#17324D] dark:text-white">
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
    navy: "bg-[#17324D]/[0.08] text-[#17324D] dark:bg-white/10 dark:text-white",
    indigo: "bg-[#0F9D91]/10 text-[#0F9D91]",
    cyan: "bg-[#22C7B8]/10 text-[#22C7B8]",
    violet: "bg-[#38BDF8]/10 text-[#38BDF8]",
  } as const;

  return (
    <div className="min-w-0 rounded-2xl border border-[#DCE7E5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFA_100%)] p-3.5 shadow-[0_7px_20px_rgba(23,50,77,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C2DDD9] dark:border-slate-800 dark:bg-slate-900/70 sm:p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 break-words text-xs font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 break-words text-lg font-black leading-tight tracking-tight text-[#17324D] [overflow-wrap:anywhere] dark:text-white sm:text-xl">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 break-words text-[11px] leading-5 text-slate-400 [overflow-wrap:anywhere] dark:text-slate-500">
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
      <div className="rounded-2xl border border-dashed border-[#D4E5E2] p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  const barClass = {
    indigo: "bg-[#0F9D91]",
    cyan: "bg-[#22C7B8]",
    violet: "bg-[#38BDF8]",
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
              <p className="truncate text-sm font-bold text-[#17324D] dark:text-slate-100">
                {item.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatNumber(item.count)} records
              </p>
            </div>
            <span className="shrink-0 text-sm font-extrabold text-[#17324D] dark:text-white">
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
    <div className="max-w-[280px] rounded-2xl border border-[#CDEAE5] bg-white/95 p-3 shadow-[0_16px_42px_rgba(23,50,77,0.14)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95 sm:max-w-[320px]">
      <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        {label ? formatBucket(label) : ""}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex min-w-0 items-center justify-between gap-3 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="shrink-0 font-extrabold text-[#17324D] dark:text-white">
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
      <div className="flex h-[250px] items-center justify-center rounded-2xl border border-dashed border-[#D4E5E2] px-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:h-[300px] lg:h-[320px]">
        No trend data available.
      </div>
    );
  }

  return (
    <div className="h-[260px] min-w-0 w-full overflow-hidden sm:h-[300px] lg:h-[340px]">
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
    <div className="max-w-[280px] rounded-2xl border border-[#CDEAE5] bg-white/95 p-3 shadow-[0_16px_42px_rgba(11,79,82,0.12)] backdrop-blur-xl dark:border-cyan-900/50 dark:bg-slate-950/95 sm:max-w-[320px]">
      <p className="mb-2 text-xs font-bold text-[#22C7B8]">
        {label ? formatBucket(label) : ""}
      </p>
      {payload.map((entry) => (
        <div
          key={String(entry.dataKey)}
          className="flex min-w-0 items-center justify-between gap-3 text-xs"
        >
          <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{entry.name}</span>
          <span className="shrink-0 font-extrabold text-[#17324D] dark:text-white">
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
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#D4E5E2] px-4 text-center text-sm text-slate-500 dark:border-cyan-900/40 dark:text-slate-400 sm:h-[220px]">
        No live timeline available.
      </div>
    );
  }

  return (
    <div className="h-[210px] min-w-0 w-full overflow-hidden sm:h-[230px]">
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
    <div className="min-h-screen bg-[#F4F8F7] p-3 dark:bg-slate-950 sm:p-5 lg:p-7 xl:p-8">
      <div className="mx-auto max-w-[1500px] space-y-4 sm:space-y-5 lg:space-y-6">
        <div className="h-36 animate-pulse rounded-[28px] bg-[#DDEAE7]/[0.85] dark:bg-slate-800" />
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[22px] bg-[#DDEAE7]/[0.85] dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="h-[420px] animate-pulse rounded-[24px] bg-[#DDEAE7]/[0.85] dark:bg-slate-800" />
          <div className="h-[420px] animate-pulse rounded-[24px] bg-[#DDEAE7]/[0.85] dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystDashboardPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

  useEffect(() => {
    if (isAnalystRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isAnalystRole,
    router,
    user.role,
  ]);

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
    if (!isAnalystRole) {
      setOverviewLoading(false);
      setOverview(null);
      setOverviewError(null);
      return;
    }

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
  }, [isAnalystRole, range, mode, currency, manualRefresh]);

  useEffect(() => {
    if (!isAnalystRole) {
      setPulseLoading(false);
      setPulse(null);
      setPulseError(null);
      return;
    }

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
  }, [isAnalystRole, mode, currency, manualRefresh, pulseRefresh]);

  useEffect(() => {
    if (!isAnalystRole) {
      return;
    }

    const seconds = Math.max(10, pulse?.refreshAfterSeconds ?? 20);

    const timer = window.setInterval(() => {
      setPulseRefresh((current) => current + 1);
    }, seconds * 1000);

    return () => window.clearInterval(timer);
  }, [isAnalystRole, pulse?.refreshAfterSeconds]);

  const applyCurrency = () => {
    if (!isAnalystRole) {
      return;
    }

    const next = currencyInput.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(next)) {
      setOverviewError("Currency must be a three-letter ISO code.");
      return;
    }

    setCurrencyInput(next);
    setCurrency(next);
  };

  const refreshAll = () => {
    if (!isAnalystRole) {
      return;
    }

    setManualRefresh((current) => current + 1);
  };

  const overviewStatus: AnalystPulseStatus = overview?.status ?? "healthy";

  const topInsightCount = useMemo(() => {
    return overview?.insights.filter(
      (item) => item.severity === "critical" || item.severity === "high"
    ).length ?? 0;
  }, [overview?.insights]);

  if (!isAnalystRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening analyst workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Analyst Overview is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  if (overviewLoading && !overview) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F8F7] text-[#17324D] dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none fixed left-[18%] top-20 h-80 w-80 rounded-full bg-[#5EEAD4]/10 blur-3xl dark:opacity-30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-[-80px] right-[8%] h-96 w-96 rounded-full bg-[#7DD3FC]/10 blur-3xl dark:opacity-20"
        aria-hidden="true"
      />
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1500px] space-y-4 p-3 sm:space-y-5 sm:p-5 lg:space-y-6 lg:p-7 xl:p-8"
      >
        {/* ===================================================
            HERO
        ==================================================== */}
        <motion.section
          variants={itemVariants}
          className="relative min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,#10283F_0%,#0B4F52_47%,#10273A_100%)] p-4 text-white shadow-[0_24px_70px_rgba(9,78,80,0.22)] sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "linear-gradient(to bottom, black, transparent 82%)",
            }}
            aria-hidden="true"
          />
          <motion.div
            animate={{ x: [0, 18, 0], y: [0, -14, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#5EEAD4]/[0.22] blur-3xl"
            aria-hidden="true"
          />
          <motion.div
            animate={{ x: [0, -14, 0], y: [0, 12, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="pointer-events-none absolute bottom-[-120px] left-[26%] h-72 w-72 rounded-full bg-[#22C7B8]/[0.22] blur-3xl"
            aria-hidden="true"
          />
          <motion.div
            animate={{ x: [0, 10, 0], y: [0, -8, 0], opacity: [0.35, 0.62, 0.35] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            className="pointer-events-none absolute right-[18%] top-[26%] h-52 w-52 rounded-full bg-[#7DD3FC]/[0.24] blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.09] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                <BrainCircuit className="h-3.5 w-3.5 text-[#7CEFE0]" />
                Coffer intelligence workspace
              </div>

              <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
                Analyst Overview
              </h1>

              <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-white/[0.72] [overflow-wrap:anywhere] sm:text-[15px] sm:leading-7">
                One read-only view for gateway performance, merchant health,
                wallet activity, live operations, risk, revenue quality and
                deterministic intelligence.
              </p>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
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
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.10] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7CEFE0]/[0.35] hover:bg-white/[0.16] hover:shadow-[0_12px_30px_rgba(34,199,184,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="relative z-10 mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:mt-7 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.085] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7CEFE0]/[0.35] hover:bg-white/[0.115] hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/[0.55]">
                Scope
              </p>
              <p className="mt-1.5 break-words text-sm font-bold leading-5 text-white [overflow-wrap:anywhere]">
                {RANGE_OPTIONS.find((item) => item.value === range)?.label} · {mode}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.085] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7CEFE0]/[0.35] hover:bg-white/[0.115] hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/[0.55]">
                Currency
              </p>
              <p className="mt-1.5 break-words text-sm font-bold leading-5 text-white [overflow-wrap:anywhere]">{currency}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.085] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7CEFE0]/[0.35] hover:bg-white/[0.115] hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/[0.55]">
                Priority signals
              </p>
              <p className="mt-1.5 break-words text-sm font-bold leading-5 text-white [overflow-wrap:anywhere]">
                {formatNumber(topInsightCount)} high / critical
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.085] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7CEFE0]/[0.35] hover:bg-white/[0.115] hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/[0.55]">
                Engine
              </p>
              <p className="mt-1.5 break-words text-sm font-bold leading-5 text-white [overflow-wrap:anywhere]">
                Deterministic rules
              </p>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            FILTERS
        ==================================================== */}
        <Surface className="relative z-40 overflow-visible bg-[linear-gradient(180deg,rgba(255,255,255,0.985)_0%,rgba(248,251,250,0.985)_100%)] p-4 sm:p-5">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.78fr)_auto] xl:items-end">
            <AnalystSelect
              label="Range"
              value={range}
              options={RANGE_OPTIONS}
              onChange={(nextValue) => {
                if (!isAnalystRole) {
                  return;
                }

                setRange(
                  nextValue as AnalystRange
                );
              }}
            />

            <AnalystSelect
              label="Environment"
              value={mode}
              options={MODE_OPTIONS}
              onChange={(nextValue) => {
                if (!isAnalystRole) {
                  return;
                }

                setMode(
                  nextValue as AnalystMode
                );
              }}
            />

            <label className="min-w-0">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                Currency
              </span>

              <input
                value={currencyInput}
                maxLength={3}
                onChange={(event) => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setCurrencyInput(
                    event.target.value
                      .replace(/[^a-z]/gi, "")
                      .slice(0, 3)
                      .toUpperCase()
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    applyCurrency();
                  }
                }}
                className="
                  h-12
                  w-full
                  min-w-0
                  rounded-[15px]
                  border
                  border-[#D4E4E1]
                  bg-white
                  px-3.5
                  text-sm
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#17324D]
                  shadow-[0_5px_18px_rgba(23,50,77,0.035)]
                  outline-none
                  transition-all
                  duration-200

                  placeholder:font-semibold
                  placeholder:tracking-normal
                  placeholder:text-slate-400

                  hover:border-[#AFCFC9]
                  hover:bg-[#FBFDFC]

                  focus:border-[#0B4F52]
                  focus:ring-4
                  focus:ring-[#0B4F52]/10

                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-white
                  dark:hover:border-slate-600
                  dark:focus:border-cyan-700
                  dark:focus:ring-cyan-500/10
                "
                placeholder="BDT"
              />
            </label>

            <motion.button
              type="button"
              whileHover={{
                y: -1,
              }}
              whileTap={{
                scale: 0.985,
              }}
              onClick={
                applyCurrency
              }
              className="
                h-12
                w-full
                rounded-[15px]
                border
                border-[#0B4F52]/10
                bg-[linear-gradient(135deg,#10283F_0%,#0B4F52_58%,#0F766E_100%)]
                px-5
                text-sm
                font-extrabold
                text-white
                shadow-[0_10px_26px_rgba(11,79,82,0.22)]
                transition-all
                duration-300

                hover:brightness-105
                hover:shadow-[0_14px_34px_rgba(11,79,82,0.28)]

                sm:col-span-2
                xl:col-span-1
                xl:w-auto
                xl:min-w-[142px]
              "
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
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold">Overview error</p>
              <p className="mt-1 break-words opacity-90 [overflow-wrap:anywhere]">{overviewError}</p>
            </div>
          </motion.div>
        ) : null}

        {pulseError ? (
          <motion.div
            variants={itemVariants}
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold">Live pulse unavailable</p>
              <p className="mt-1 break-words opacity-90 [overflow-wrap:anywhere]">{pulseError}</p>
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
            <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)] xl:gap-6">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Gateway performance"
                  title="Payment activity trend"
                  description="Attempts, completed payments and failures across the selected period."
                  icon={Activity}
                  accent="indigo"
                  trailing={
                    <div className="flex max-w-full flex-wrap gap-x-3 gap-y-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#17324D]" />
                        Attempts
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#0F9D91]" />
                        Completed
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                        Failed
                      </span>
                    </div>
                  }
                />

                <div className="mt-4 min-w-0 overflow-hidden sm:mt-5">
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

                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
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

                <div className="mt-5 rounded-2xl border border-[#0B4F52]/10 bg-[#0B4F52]/[0.045] p-4 sm:mt-6">
                  <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0F9D91]">
                        In-progress gateway payments
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        Current unresolved payment attempts
                      </p>
                    </div>
                    <span className="shrink-0 text-2xl font-black text-[#17324D] dark:text-white">
                      {formatNumber(overview.executive.pendingPaymentCount)}
                    </span>
                  </div>
                </div>
              </Surface>
            </div>

            {/* ===================================================
                USERS / WALLET + MERCHANT
            ==================================================== */}
            <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-2 xl:gap-6">
              <Surface className="p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Coffer ecosystem"
                  title="Personal users & wallet activity"
                  description="Core account growth and wallet usage signals from Coffer's own user base."
                  icon={Users}
                  accent="cyan"
                />

                <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
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

                <div className="mt-4 grid min-w-0 gap-3 sm:mt-5 sm:grid-cols-2">
                  <div className="min-w-0 rounded-2xl border border-[#D5E8E5] bg-[#F6FAF9] p-4 dark:border-cyan-900/35 dark:bg-cyan-950/10">
                    <div className="flex items-center gap-2 text-[#22C7B8]">
                      <Activity className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        Wallet activity
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-[#17324D] dark:text-white">
                      {formatNumber(overview.metrics.walletTransactionCount.value)}
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                      {formatPercent(overview.executive.walletTransactionFailureRate)} failure rate
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-[#D7E5EA] bg-[#F6F9FA] p-4 dark:border-sky-900/35 dark:bg-sky-950/10">
                    <div className="flex items-center gap-2 text-[#38BDF8]">
                      <ShieldAlert className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        Wallet risk
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-[#17324D] dark:text-white">
                      {formatNumber(overview.operations.highRiskTransactionCount)}
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
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

                <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
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

                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
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
              <div className="border-b border-[#DCE7E5] bg-[linear-gradient(90deg,rgba(15,157,145,.065),rgba(255,255,255,.96)_48%,rgba(56,189,248,.04))] p-4 dark:border-cyan-900/35 dark:bg-[linear-gradient(90deg,rgba(15,157,145,.08),rgba(2,6,23,.96)_55%,rgba(56,189,248,.04))] sm:p-6">
                <SectionHeading
                  eyebrow="Signal cyan · live data"
                  title="Live platform pulse"
                  description="Auto-refreshing payment, payout and wallet signals for the latest 60 minutes."
                  icon={Wifi}
                  accent="cyan"
                  trailing={
                    pulse ? (
                      <div className="max-w-full break-words text-left text-[11px] font-medium text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400 md:text-right">
                        <p>Updated {formatDateTime(pulse.generatedAt)}</p>
                        <p className="mt-1">Refresh every {pulse.refreshAfterSeconds}s</p>
                      </div>
                    ) : null
                  }
                />
              </div>

              <div className="p-4 sm:p-6">
                {pulseLoading && !pulse ? (
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"
                      />
                    ))}
                  </div>
                ) : pulse ? (
                  <div className="space-y-6">
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

                    <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] xl:gap-6">
                      <div className="min-w-0 rounded-2xl border border-[#DCE7E5] bg-[#F8FBFA] p-3.5 dark:border-cyan-900/35 dark:bg-cyan-950/10 sm:p-4">
                        <div className="mb-2 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <div>
                            <p className="break-words text-sm font-extrabold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                              Live attempt flow
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                              Attempt and failure activity from the latest live timeline.
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C7B8]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#22C7B8]">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C7B8] opacity-60" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C7B8]" />
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
                              className="min-w-0 rounded-2xl border border-[#DCE7E5] bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                            >
                              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                                <p className="min-w-0 break-words text-sm font-bold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                                  {score.label}
                                </p>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${config.className}`}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <div className="mt-2 flex min-w-0 flex-wrap items-end justify-between gap-2">
                                <p className="text-2xl font-black text-[#17324D] dark:text-white">
                                  {score.score}
                                </p>
                                <p className="break-words text-right text-[11px] text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                                  {score.trend}
                                </p>
                              </div>
                              <p className="mt-2 break-words text-[11px] leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
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
                              <div className="min-w-0 flex-1">
                                <p className="break-words font-bold [overflow-wrap:anywhere]">{alert.title}</p>
                                <p className="mt-1 break-words text-sm leading-6 opacity-90 [overflow-wrap:anywhere]">
                                  {alert.description}
                                </p>
                              </div>
                              <span className="max-w-full break-all rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-bold dark:bg-black/20 sm:break-normal">
                                {alert.metric}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
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

              <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
            <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-3 xl:items-stretch xl:gap-6">
              <Surface className="h-full p-5 sm:p-6">
                <SectionHeading
                  title="Payment status"
                  description="Gateway lifecycle distribution."
                  icon={CreditCard}
                  accent="indigo"
                />
                <div className="mt-5">
                  <BreakdownList
                    items={overview.paymentStatus}
                    emptyLabel="No payment status data."
                    tone="indigo"
                  />
                </div>
              </Surface>

              <Surface className="h-full p-5 sm:p-6">
                <SectionHeading
                  title="Provider mix"
                  description="Payment attempt share by provider."
                  icon={Zap}
                  accent="cyan"
                />
                <div className="mt-5">
                  <BreakdownList
                    items={overview.providers}
                    emptyLabel="No provider data."
                    tone="cyan"
                  />
                </div>
              </Surface>

              <Surface className="h-full p-5 sm:p-6">
                <SectionHeading
                  title="Transaction risk"
                  description="Wallet transaction risk distribution."
                  icon={ShieldAlert}
                  accent="violet"
                />
                <div className="mt-5">
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
            <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch xl:gap-6">
              <Surface className="h-full p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Revenue quality"
                  title="Revenue ledger"
                  description={overview.revenueLedger.note}
                  icon={CircleDollarSign}
                  accent="indigo"
                />

                <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
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

              <Surface className="h-full p-5 sm:p-6">
                <SectionHeading
                  eyebrow="Freshness"
                  title="Data confidence"
                  description="Source read timing and daily fact coverage."
                  icon={Database}
                  accent="navy"
                />

                <div className="mt-5 space-y-3">
                  <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-[#E6EFED] bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Overview generated</p>
                      <p className="mt-1 break-words text-sm font-bold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                        {formatDateTime(overview.generatedAt)}
                      </p>
                    </div>
                    <Clock3 className="h-5 w-5 text-[#0F9D91]" />
                  </div>

                  <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-[#E6EFED] bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Latest daily fact</p>
                      <p className="mt-1 break-words text-sm font-bold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                        {formatDateTime(overview.freshness.latestDailyFactGeneratedAt)}
                      </p>
                    </div>
                    <Database className="h-5 w-5 text-[#22C7B8]" />
                  </div>

                  <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-[#E6EFED] bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Daily fact coverage</p>
                      <p className="mt-1 break-words text-sm font-bold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                        {formatNumber(overview.freshness.dailyFactDaysCovered)} days
                      </p>
                    </div>
                    <BadgeCheck className="h-5 w-5 text-[#38BDF8]" />
                  </div>
                </div>
              </Surface>
            </div>

            {/* ===================================================
                INTELLIGENCE
            ==================================================== */}
            <Surface className="overflow-hidden">
              <div className="border-b border-[#DCE7E5] bg-[linear-gradient(90deg,rgba(11,79,82,.06),rgba(255,255,255,.97)_52%,rgba(56,189,248,.04))] p-4 dark:border-cyan-900/35 dark:bg-[linear-gradient(90deg,rgba(11,79,82,.08),rgba(2,6,23,.96)_58%,rgba(56,189,248,.04))] sm:p-6">
                <SectionHeading
                  eyebrow="Insight violet · intelligence"
                  title="Deterministic analyst insights"
                  description="Explainable threshold-based observations for human review; no automated financial decisions."
                  icon={BrainCircuit}
                  accent="violet"
                  trailing={
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#CFE4E1] bg-white px-3 py-1.5 text-[11px] font-bold text-[#0B4F52] dark:border-cyan-900/45 dark:bg-slate-950 dark:text-cyan-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      {overview.insights.length} signals
                    </span>
                  }
                />
              </div>

              <div className="grid min-w-0 items-start gap-3 p-4 sm:gap-4 sm:p-6 xl:grid-cols-2">
                {overview.insights.length > 0 ? (
                  overview.insights.map((insight, index) => (
                    <motion.article
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
                      whileHover={{ y: -3 }}
                      className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${insightClasses(
                        insight.severity
                      )}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#0F9D91] shadow-sm dark:bg-slate-950/60">
                            <BrainCircuit className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="break-words font-extrabold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                              {insight.title}
                            </p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">
                              {insight.category}
                            </p>
                          </div>
                        </div>

                        <span className="max-w-full shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                          {insight.severity}
                        </span>
                      </div>

                      <p className="mt-4 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">
                        {insight.description}
                      </p>

                      <div className="mt-4 break-words rounded-xl bg-white/60 p-3 text-xs leading-5 text-slate-700 [overflow-wrap:anywhere] dark:bg-slate-950/40 dark:text-slate-300">
                        <strong>Evidence:</strong> {insight.evidence}
                      </div>

                      <p className="mt-3 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        <strong>Review:</strong> {insight.recommendedAction}
                      </p>
                    </motion.article>
                  ))
                ) : (
                  <div className="col-span-full flex min-w-0 items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200 sm:p-5">
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
              className="flex min-w-0 flex-col gap-3 rounded-[22px] border border-[#DCE7E5] bg-white/95 px-4 py-4 shadow-[0_10px_30px_rgba(23,50,77,0.05)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B4F52]/[0.08] text-[#0B4F52] dark:text-cyan-300">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-[#17324D] [overflow-wrap:anywhere] dark:text-white">
                    Read-only analyst workspace
                  </p>
                  <p className="mt-0.5 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                    Insights support review only and cannot execute payment, refund, payout, KYC or configuration actions.
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2 break-words text-[11px] font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400 lg:shrink-0 lg:items-center lg:text-right">
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
