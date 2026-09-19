"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
  BadgeCheck,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  Gauge,
  Landmark,
  Layers3,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TrendingUp,
  WalletCards,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystPayoutAnalytics,
  type AnalystPayoutAnalyticsData,
  type AnalystPayoutStatus,
  type AnalystRange,
} from "@/lib/api/analystApi";

/* =========================================================
   OCEAN GLOW TOKENS
========================================================= */

const OCEAN = {
  ink: "#10243A",
  heroVia: "#0B4F52",
  heroTo: "#10273A",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  red: "#EF4444",
  slate: "#94A3B8",
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const RANGE_OPTIONS: Array<SelectOption<AnalystRange>> = [
  {
    value: "24h",
    label: "Last 24 hours",
    description: "Hourly payout pulse",
  },
  {
    value: "7d",
    label: "Last 7 days",
    description: "Short-term movement",
  },
  {
    value: "30d",
    label: "Last 30 days",
    description: "Monthly performance",
  },
  {
    value: "90d",
    label: "Last 90 days",
    description: "Quarterly pattern",
  },
];

const STATUS_OPTIONS: Array<SelectOption<AnalystPayoutStatus>> = [
  {
    value: "all",
    label: "All statuses",
    description: "Entire payout lifecycle",
  },
  {
    value: "pending",
    label: "Pending",
    description: "Waiting to process",
  },
  {
    value: "processing",
    label: "Processing",
    description: "Currently in progress",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Successfully completed",
  },
  {
    value: "failed",
    label: "Failed",
    description: "Failed payout attempts",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Cancelled payouts",
  },
];

const STATUS_COLORS: Record<string, string> = {
  completed: OCEAN.emerald,
  pending: OCEAN.amber,
  processing: OCEAN.cyan,
  failed: OCEAN.red,
  cancelled: OCEAN.slate,
};

/* =========================================================
   HELPERS
========================================================= */

function money(
  minor: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString("en-BD")}`;
  }
}

function pct(value: number): string {
  return `${value.toFixed(2)}%`;
}

function duration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)}m`;
  }

  return `${(seconds / 3600).toFixed(1)}h`;
}

function labelBucket(
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

function numberText(value: number): string {
  return new Intl.NumberFormat("en-BD").format(value);
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function selectedLabel<T extends string>(
  options: Array<SelectOption<T>>,
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

/* =========================================================
   CUSTOM SELECT
========================================================= */

function OceanSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  icon: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected =
    options.find((item) => item.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
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

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white/90 px-3.5 text-left shadow-sm outline-none transition duration-200 dark:bg-slate-950/70 ${
          open
            ? "border-teal-500/60 ring-4 ring-teal-500/10"
            : "border-slate-200 hover:border-teal-500/35 dark:border-white/10 dark:hover:border-teal-400/30"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
            {selected?.label}
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
              {selected.description}
            </span>
          )}
        </span>

        <motion.span
          animate={{
            rotate: open ? 180 : 0,
          }}
          transition={{
            duration: 0.2,
          }}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
            }}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#091820]/95"
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
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-teal-500/10"
                      : "hover:bg-slate-100/80 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-white/5"
                    }`}
                  >
                    {active ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                      {option.label}
                    </span>

                    {option.description && (
                      <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

type MetricTone =
  | "ocean"
  | "emerald"
  | "violet"
  | "cyan"
  | "red"
  | "amber";

function metricTone(tone: MetricTone): {
  icon: string;
  glow: string;
  line: string;
} {
  switch (tone) {
    case "emerald":
      return {
        icon:
          "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        glow:
          "bg-emerald-500/10",
        line:
          "from-transparent via-emerald-400/60 to-transparent",
      };

    case "violet":
      return {
        icon:
          "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400",
        glow:
          "bg-violet-500/10",
        line:
          "from-transparent via-violet-400/60 to-transparent",
      };

    case "cyan":
      return {
        icon:
          "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        glow:
          "bg-cyan-500/10",
        line:
          "from-transparent via-cyan-400/60 to-transparent",
      };

    case "red":
      return {
        icon:
          "border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400",
        glow:
          "bg-red-500/10",
        line:
          "from-transparent via-red-400/60 to-transparent",
      };

    case "amber":
      return {
        icon:
          "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        glow:
          "bg-amber-500/10",
        line:
          "from-transparent via-amber-400/60 to-transparent",
      };

    case "ocean":
    default:
      return {
        icon:
          "border-teal-500/15 bg-teal-500/10 text-teal-700 dark:text-teal-300",
        glow:
          "bg-teal-500/10",
        line:
          "from-transparent via-teal-400/60 to-transparent",
      };
  }
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  const styles = metricTone(tone);

  return (
    <motion.article
      variants={reveal}
      whileHover={{
        y: -4,
        scale: 1.008,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.48)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
      />

      <div
        className={`pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r ${styles.line}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 10,
            scale: 1.1,
          }}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 16,
          }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
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
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_65px_-35px_rgba(15,118,110,0.50)] dark:border-white/10 dark:bg-slate-950/70 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent opacity-70" />

      <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          {Icon && (
            <motion.div
              whileHover={{
                rotate: 8,
                scale: 1.06,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 18,
              }}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 shadow-sm dark:text-teal-300"
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          )}

          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  description,
  icon: Icon = DatabaseZap,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-teal-500/20 bg-gradient-to-br from-teal-500/[0.04] via-white to-cyan-500/[0.04] px-6 text-center dark:via-slate-950"
    >
      <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-600 dark:text-teal-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="relative mt-3 text-sm font-black text-slate-900 dark:text-white">
        {title}
      </p>

      <p className="relative mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </motion.div>
  );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function OceanTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[180px] rounded-2xl border border-white/10 bg-[#071923]/95 p-3 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300">
        {label}
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={`${entry.name ?? "series"}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-[10px] text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    entry.color ?? OCEAN.tealBright,
                }}
              />

              {entry.name}
            </span>

            <span className="text-[10px] font-black text-white">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("en-BD")
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   LEDGER CARD
========================================================= */

function LedgerStat({
  title,
  value,
  icon: Icon,
  tone,
  index,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: "emerald" | "cyan" | "amber" | "red";
  index: number;
}) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "cyan"
        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
        : tone === "red"
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        delay: Math.min(index * 0.04, 0.16),
      }}
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 transition dark:border-white/10 dark:bg-black/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
            {numberText(value)}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function InsightCard({
  insight,
  index,
}: {
  insight: AnalystPayoutAnalyticsData["insights"][number];
  index: number;
}) {
  const severity = String(insight.severity).toLowerCase();

  const positive = severity === "positive";
  const critical =
    severity === "critical" ||
    severity === "high";
  const informational =
    severity === "info" ||
    severity === "informational";

  const Icon = positive
    ? CheckCircle2
    : critical
      ? XCircle
      : informational
        ? Sparkles
        : AlertTriangle;

  const shell = positive
    ? "border-emerald-500/20 from-emerald-500/[0.06]"
    : critical
      ? "border-red-500/20 from-red-500/[0.06]"
      : informational
        ? "border-cyan-500/20 from-cyan-500/[0.06]"
        : "border-amber-500/20 from-amber-500/[0.06]";

  const icon = positive
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : critical
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : informational
        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
        filter: "blur(5px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
      }}
      transition={{
        delay: Math.min(index * 0.04, 0.2),
      }}
      whileHover={{
        y: -3,
      }}
      className={`rounded-[22px] border bg-gradient-to-br ${shell} via-white to-white p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] dark:via-slate-950 dark:to-slate-950`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${icon}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              {insight.title}
            </h3>

            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${icon}`}
            >
              {String(insight.severity)}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {insight.description}
          </p>

          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
              Evidence
            </p>

            <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {insight.evidence}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   LOADING
========================================================= */

function PayoutLoading() {
  return (
    <div className="grid min-h-[470px] place-items-center rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-center">
        <div className="relative mx-auto h-20 w-20">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full border border-dashed border-teal-500/35"
          />

          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-2 rounded-full border border-cyan-500/30"
          />

          <motion.div
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-lg shadow-teal-500/20"
          >
            <WalletCards className="h-6 w-6" />
          </motion.div>
        </div>

        <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
          Aggregating payout intelligence
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Reading real payout lifecycle and ledger records...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystPayoutsPage() {
  const [range, setRange] =
    useState<AnalystRange>("30d");

  const [status, setStatus] =
    useState<AnalystPayoutStatus>("all");

  const [currency, setCurrency] =
    useState("BDT");

  const [data, setData] =
    useState<AnalystPayoutAnalyticsData | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    let active =
      true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAnalystPayoutAnalytics(
            {
              range,
              status,
              currency,
            },
            controller.signal
          );

        if (active) {
          setData(result);
        }
      } catch (cause: unknown) {
        if (
          active &&
          !controller.signal.aborted
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load payout analytics."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    range,
    status,
    currency,
    refreshKey,
  ]);

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (point) => ({
            ...point,
            label:
              labelBucket(
                point.bucket,
                range
              ),
          })
        ) ?? [],
      [
        data,
        range,
      ]
    );

  const activeFilterCount =
    useMemo(
      () =>
        [
          range !== "30d",
          status !== "all",
          currency !== "BDT",
        ].filter(Boolean)
          .length,
      [
        range,
        status,
        currency,
      ]
    );

  const ledgerPie =
    useMemo(
      () => {
        if (!data) {
          return [];
        }

        return [
          {
            name:
              "Balanced",
            value:
              data.ledger
                .balancedLedgerGroupCount,
            color:
              OCEAN.emerald,
          },
          {
            name:
              "Unbalanced",
            value:
              data.ledger
                .unbalancedLedgerGroupCount,
            color:
              OCEAN.red,
          },
        ].filter(
          (item) =>
            item.value >
            0
        );
      },
      [data]
    );

  function resetFilters() {
    setRange("30d");
    setStatus("all");
    setCurrency("BDT");
    setError("");
  }

  if (
    loading &&
    !data
  ) {
    return (
      <PayoutLoading />
    );
  }

  return (
    <main className="space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-6 text-white shadow-[0_30px_90px_-45px_rgba(13,148,136,0.65)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [0, 34, -12, 0],
            y: [0, -16, 12, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [0, -24, 18, 0],
            y: [0, 18, -10, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-teal-300/15 blur-[100px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

        <motion.div
          animate={{
            x: ["-30%", "130%"],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100 backdrop-blur-md">
                <WalletCards className="h-3.5 w-3.5" />

                Payout Intelligence
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" />

                Read-only analyst
              </div>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Merchant Payout Analytics
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
              Monitor payout lifecycle, requested value, completion health,
              merchant concentration, processing latency and ledger
              reconciliation from real payout records.
            </p>

            {data && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold text-slate-200/75 backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />

                  {selectedLabel(
                    RANGE_OPTIONS,
                    range
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold text-slate-200/75 backdrop-blur">
                  <Gauge className="h-3.5 w-3.5 text-teal-300" />

                  {selectedLabel(
                    STATUS_OPTIONS,
                    status
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-semibold text-emerald-100">
                  <CircleDollarSign className="h-3.5 w-3.5" />

                  {data.filters.currency}
                </span>
              </div>
            )}

            {data?.scopeNote && (
              <p className="mt-3 max-w-3xl text-[10px] leading-5 text-slate-300/65">
                {data.scopeNote}
              </p>
            )}
          </div>

          <div className="relative flex shrink-0 items-center">
            <div className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-300/10 blur-3xl" />

            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-cyan-200/20 lg:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            </motion.div>

            <button
              type="button"
              onClick={() =>
                setRefreshKey(
                  (value) =>
                    value + 1
                )
              }
              disabled={loading}
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              {loading
                ? "Refreshing"
                : "Refresh"}
            </button>
          </div>
        </div>

        {loading && data && (
          <motion.div
            initial={{
              scaleX: 0,
            }}
            animate={{
              scaleX: 1,
            }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
            }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          />
        )}
      </motion.section>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
          duration: 0.45,
        }}
        className="relative z-30 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <Layers3 className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                Payout Filters
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                API-backed scope controls
                {activeFilterCount > 0
                  ? ` · ${activeFilterCount} customized`
                  : " · default scope"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={
              activeFilterCount ===
              0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-teal-500/30 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-teal-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />

            Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <OceanSelect
            label="Range"
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
            icon={Clock3}
          />

          <OceanSelect
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
            icon={Gauge}
          />

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Currency
            </p>

            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600 dark:text-teal-300" />

              <input
                value={currency}
                onChange={(event) =>
                  setCurrency(
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
                maxLength={3}
                aria-label="Currency"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-10 pr-4 text-center text-xs font-black uppercase text-slate-900 shadow-sm outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-teal-700 dark:text-teal-300">
            {selectedLabel(
              RANGE_OPTIONS,
              range
            )}
          </span>

          <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-cyan-700 dark:text-cyan-300">
            {selectedLabel(
              STATUS_OPTIONS,
              status
            )}
          </span>

          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
            {currency || "Currency"}
          </span>
        </div>
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      <AnimatePresence>
        {error && (
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
            className="flex items-start gap-3 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] p-4 text-red-600 shadow-sm dark:text-red-400"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black">
                Payout analytics request failed
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data && (
        <>
          {/* =================================================
              METRICS
          ================================================= */}

          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              title="Payouts"
              value={numberText(
                data.metrics
                  .payoutCount
                  .value
              )}
              subtitle="Matching payout records"
              icon={WalletCards}
              tone="ocean"
            />

            <MetricCard
              title="Requested value"
              value={money(
                data.metrics
                  .totalAmountMinor
                  .value,
                data.filters
                  .currency
              )}
              subtitle="Gross payout requests"
              icon={CircleDollarSign}
              tone="violet"
            />

            <MetricCard
              title="Completed net"
              value={money(
                data.metrics
                  .completedNetAmountMinor
                  .value,
                data.filters
                  .currency
              )}
              subtitle="Successfully completed net value"
              icon={Banknote}
              tone="emerald"
            />

            <MetricCard
              title="Pending value"
              value={money(
                data.metrics
                  .pendingAmountMinor
                  .value,
                data.filters
                  .currency
              )}
              subtitle="Value still awaiting completion"
              icon={Clock3}
              tone="amber"
            />

            <MetricCard
              title="Completion rate"
              value={pct(
                data.metrics
                  .completionRate
                  .value
              )}
              subtitle="Completed payouts over attempts"
              icon={CheckCircle2}
              tone="emerald"
            />

            <MetricCard
              title="Failure rate"
              value={pct(
                data.metrics
                  .failureRate
                  .value
              )}
              subtitle="Failed payout pressure"
              icon={XCircle}
              tone="red"
            />

            <MetricCard
              title="Average completion"
              value={duration(
                data.metrics
                  .averageCompletionSeconds
                  .value
              )}
              subtitle="Average end-to-end payout latency"
              icon={TimerReset}
              tone="cyan"
            />

            <MetricCard
              title="Ledger coverage"
              value={pct(
                data.metrics
                  .ledgerCoverageRate
                  .value
              )}
              subtitle="Completed payouts linked to ledger groups"
              icon={Landmark}
              tone="ocean"
            />
          </motion.section>

          {/* =================================================
              TREND
          ================================================= */}

          <Panel
            title="Payout Lifecycle Trend"
            description="Completed, pending and failed payout counts across the selected period."
            icon={TrendingUp}
            action={
              <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                Real API trend
              </span>
            }
          >
            {chartData.length > 0 ? (
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                <div className="relative h-[370px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <ComposedChart
                      data={chartData}
                      margin={{
                        top: 18,
                        right: 18,
                        left: -12,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        stroke="rgba(148,163,184,0.14)"
                        strokeDasharray="4 6"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 10,
                          fill: "#94A3B8",
                        }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={22}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fontSize: 10,
                          fill: "#94A3B8",
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        content={
                          <OceanTooltip />
                        }
                      />

                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: 10,
                          color: "#CBD5E1",
                          paddingTop: 10,
                        }}
                      />

                      <Bar
                        dataKey="failedCount"
                        name="Failed"
                        fill={OCEAN.red}
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                        maxBarSize={18}
                      />

                      <Line
                        type="monotone"
                        dataKey="completedCount"
                        name="Completed"
                        stroke={OCEAN.emerald}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill:
                            OCEAN.emerald,
                          stroke:
                            "#ffffff",
                          strokeWidth:
                            2,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="pendingCount"
                        name="Pending"
                        stroke={OCEAN.amber}
                        strokeWidth={2.3}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill:
                            OCEAN.amber,
                          stroke:
                            "#ffffff",
                          strokeWidth:
                            2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No payout trend"
                description="No payout trend records match the selected filters."
                icon={BarChart3}
              />
            )}
          </Panel>

          {/* =================================================
              LEDGER + METHODS
          ================================================= */}

          <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_1fr]">
            <Panel
              title="Ledger Reconciliation"
              description="Coverage and balance status for payout ledger groups."
              icon={Landmark}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LedgerStat
                    title="Completed"
                    value={
                      data.ledger
                        .completedPayoutCount
                    }
                    icon={
                      CheckCircle2
                    }
                    tone="emerald"
                    index={0}
                  />

                  <LedgerStat
                    title="With ledger group"
                    value={
                      data.ledger
                        .withLedgerGroupCount
                    }
                    icon={
                      DatabaseZap
                    }
                    tone="cyan"
                    index={1}
                  />

                  <LedgerStat
                    title="Balanced"
                    value={
                      data.ledger
                        .balancedLedgerGroupCount
                    }
                    icon={
                      BadgeCheck
                    }
                    tone="emerald"
                    index={2}
                  />

                  <LedgerStat
                    title="Unbalanced"
                    value={
                      data.ledger
                        .unbalancedLedgerGroupCount
                    }
                    icon={
                      ShieldAlert
                    }
                    tone="red"
                    index={3}
                  />
                </div>

                <div className="relative min-h-[220px] rounded-2xl border border-slate-200/80 bg-slate-50/65 dark:border-white/10 dark:bg-white/[0.025]">
                  {ledgerPie.length > 0 ? (
                    <>
                      <ResponsiveContainer
                        width="100%"
                        height={220}
                      >
                        <PieChart>
                          <Tooltip
                            content={
                              <OceanTooltip />
                            }
                          />

                          <Pie
                            data={
                              ledgerPie
                            }
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={76}
                            paddingAngle={4}
                            stroke="transparent"
                            isAnimationActive
                            animationDuration={900}
                          >
                            {ledgerPie.map(
                              (item) => (
                                <Cell
                                  key={
                                    item.name
                                  }
                                  fill={
                                    item.color
                                  }
                                />
                              )
                            )}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-black text-slate-950 dark:text-white">
                            {numberText(
                              data.ledger
                                .balancedLedgerGroupCount +
                                data.ledger
                                  .unbalancedLedgerGroupCount
                            )}
                          </p>

                          <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                            Ledger groups
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="grid h-full min-h-[220px] place-items-center px-6 text-center">
                      <div>
                        <DatabaseZap className="mx-auto h-7 w-7 text-slate-300" />

                        <p className="mt-2 text-[11px] font-bold text-slate-500">
                          No ledger balance distribution
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <Panel
              title="Payout Methods"
              description="Method-level count, completion health, and completed net value."
              icon={Layers3}
              action={
                <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                  {data.methods.length} methods
                </span>
              }
            >
              {data.methods.length > 0 ? (
                <div className="space-y-3">
                  {data.methods.map(
                    (
                      method,
                      index
                    ) => (
                      <motion.div
                        key={
                          method.method
                        }
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index *
                                0.035,
                              0.2
                            ),
                        }}
                        whileHover={{
                          y: -2,
                        }}
                        className="rounded-[20px] border border-slate-200/80 bg-white/75 p-4 shadow-sm transition dark:border-white/10 dark:bg-black/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                              {humanize(
                                method.method
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                              {numberText(
                                method.count
                              )}{" "}
                              payouts ·{" "}
                              {money(
                                method.netAmountMinor,
                                data.filters
                                  .currency
                              )}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                            {pct(
                              method.completionRate
                            )}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                          <motion.div
                            initial={{
                              width:
                                0,
                            }}
                            whileInView={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    method.completionRate
                                  )
                                )}%`,
                            }}
                            viewport={{
                              once: true,
                            }}
                            transition={{
                              duration:
                                0.75,
                              ease:
                                "easeOut",
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"
                          />
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No payout methods"
                  description="No payout method records match the current filters."
                  icon={Layers3}
                />
              )}
            </Panel>
          </div>

          {/* =================================================
              MERCHANT CONCENTRATION
          ================================================= */}

          <Panel
            title="Merchant Payout Concentration"
            description="Merchant-level payout count, completion, failures, net value, and payout-share concentration."
            icon={WalletCards}
            action={
              <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">
                {data.merchants.length} merchants
              </span>
            }
          >
            {data.merchants.length > 0 ? (
              <div className="overflow-hidden rounded-[20px] border border-slate-200/80 dark:border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-xs">
                    <thead className="bg-slate-50/90 dark:bg-white/[0.035]">
                      <tr className="text-left text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                        <th className="border-b border-slate-200 px-4 py-3.5 dark:border-white/10">
                          Merchant
                        </th>

                        <th className="border-b border-slate-200 px-3 py-3.5 text-right dark:border-white/10">
                          Payouts
                        </th>

                        <th className="border-b border-slate-200 px-3 py-3.5 text-right dark:border-white/10">
                          Completed
                        </th>

                        <th className="border-b border-slate-200 px-3 py-3.5 text-right dark:border-white/10">
                          Failed
                        </th>

                        <th className="border-b border-slate-200 px-3 py-3.5 text-right dark:border-white/10">
                          Net
                        </th>

                        <th className="border-b border-slate-200 px-4 py-3.5 text-right dark:border-white/10">
                          Share
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.merchants.map(
                        (
                          merchant,
                          index
                        ) => (
                          <motion.tr
                            key={
                              merchant.merchantId
                            }
                            initial={{
                              opacity:
                                0,
                              y:
                                5,
                            }}
                            whileInView={{
                              opacity:
                                1,
                              y:
                                0,
                            }}
                            viewport={{
                              once:
                                true,
                            }}
                            transition={{
                              delay:
                                Math.min(
                                  index *
                                    0.025,
                                  0.2
                                ),
                            }}
                            className="group transition hover:bg-teal-500/[0.035]"
                          >
                            <td className="border-b border-slate-200/70 px-4 py-3.5 dark:border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                  <Landmark className="h-4 w-4" />
                                </div>

                                <span className="font-black text-slate-900 dark:text-white">
                                  {merchant.businessName}
                                </span>
                              </div>
                            </td>

                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold text-slate-700 dark:border-white/5 dark:text-slate-200">
                              {numberText(
                                merchant.payoutCount
                              )}
                            </td>

                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-black text-emerald-600 dark:border-white/5 dark:text-emerald-400">
                              {numberText(
                                merchant.completedCount
                              )}
                            </td>

                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-black text-red-600 dark:border-white/5 dark:text-red-400">
                              {numberText(
                                merchant.failedCount
                              )}
                            </td>

                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-black text-slate-900 dark:border-white/5 dark:text-white">
                              {money(
                                merchant.netAmountMinor,
                                data.filters
                                  .currency
                              )}
                            </td>

                            <td className="border-b border-slate-200/70 px-4 py-3.5 text-right dark:border-white/5">
                              <div className="ml-auto flex max-w-[130px] items-center justify-end gap-2">
                                <div className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                  <motion.div
                                    initial={{
                                      width:
                                        0,
                                    }}
                                    whileInView={{
                                      width:
                                        `${Math.min(
                                          100,
                                          Math.max(
                                            0,
                                            merchant.netShare
                                          )
                                        )}%`,
                                    }}
                                    viewport={{
                                      once:
                                        true,
                                    }}
                                    transition={{
                                      duration:
                                        0.65,
                                    }}
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                                  />
                                </div>

                                <span className="w-14 text-right font-black text-violet-700 dark:text-violet-300">
                                  {pct(
                                    merchant.netShare
                                  )}
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No merchant concentration"
                description="No merchant payout records match the selected filters."
                icon={WalletCards}
              />
            )}
          </Panel>

          {/* =================================================
              INSIGHTS
          ================================================= */}

          <Panel
            title="Payout Intelligence Signals"
            description="Deterministic evidence-backed findings from the current payout analytics response."
            icon={Zap}
            action={
              <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                {data.insights.length} signals
              </span>
            }
          >
            {data.insights.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  data.insights.length >
                  1
                    ? "xl:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {data.insights.map(
                  (
                    insight,
                    index
                  ) => (
                    <InsightCard
                      key={
                        insight.id
                      }
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
              <EmptyState
                title="No payout signals"
                description="No deterministic payout insight is available for the current filters."
                icon={Sparkles}
              />
            )}
          </Panel>

          {/* =================================================
              READ-ONLY BOUNDARY
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_55px_-40px_rgba(15,118,110,0.45)] dark:border-white/10 dark:bg-slate-950/70"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-[70px]" />

            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                <ShieldAlert className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                  Read-only analyst boundary
                </p>

                <p className="mt-1 max-w-4xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  This page presents aggregated payout intelligence only. It does
                  not create, approve, cancel, retry, or otherwise mutate a
                  merchant payout.
                </p>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}
