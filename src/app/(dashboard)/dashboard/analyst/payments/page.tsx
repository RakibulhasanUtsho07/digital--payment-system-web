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
  useRouter,
} from "next/navigation";

import {
  Activity,
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
  CreditCard,
  DatabaseZap,
  Filter,
  Gauge,
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
  Area,
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
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getAnalystPaymentAnalytics,
  type AnalystMode,
  type AnalystPaymentAnalyticsData,
  type AnalystPaymentInsight,
  type AnalystPaymentMetric,
  type AnalystPaymentSource,
  type AnalystPaymentStatus,
  type AnalystPulseStatus,
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
    description: "Hourly gateway pulse",
  },
  {
    value: "7d",
    label: "Last 7 days",
    description: "Short-term trend",
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

const MODE_OPTIONS: Array<SelectOption<AnalystMode>> = [
  {
    value: "all",
    label: "All modes",
    description: "Live + test traffic",
  },
  {
    value: "live",
    label: "Live only",
    description: "Production payments",
  },
  {
    value: "test",
    label: "Test only",
    description: "Sandbox payments",
  },
];

const STATUS_OPTIONS: Array<SelectOption<AnalystPaymentStatus>> = [
  {
    value: "all",
    label: "All statuses",
    description: "Entire lifecycle",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Successfully completed",
  },
  {
    value: "pending",
    label: "Pending",
    description: "Still in progress",
  },
  {
    value: "authorized",
    label: "Authorized",
    description: "Authorized only",
  },
  {
    value: "captured",
    label: "Captured",
    description: "Captured, not final",
  },
  {
    value: "failed",
    label: "Failed",
    description: "Failed payments",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Cancelled attempts",
  },
  {
    value: "expired",
    label: "Expired",
    description: "Expired attempts",
  },
];

const SOURCE_OPTIONS: Array<SelectOption<AnalystPaymentSource>> = [
  {
    value: "all",
    label: "All sources",
    description: "Every payment source",
  },
  {
    value: "wallet",
    label: "Wallet",
    description: "Coffer wallet payments",
  },
  {
    value: "card",
    label: "Card",
    description: "Card gateway traffic",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "PayPal payments",
  },
  {
    value: "local_psp",
    label: "Local PSP",
    description: "Local payment provider",
  },
];

const COLORS: Record<string, string> = {
  completed: OCEAN.emerald,
  captured: OCEAN.tealBright,
  authorized: OCEAN.sky,
  pending: OCEAN.amber,
  failed: OCEAN.red,
  cancelled: "#94A3B8",
  expired: OCEAN.violet,
  live: OCEAN.emerald,
  test: OCEAN.sky,
  wallet: OCEAN.cyan,
  card: OCEAN.violet,
  paypal: "#2563EB",
  local_psp: OCEAN.amber,
};

/* =========================================================
   HELPERS
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

function dateText(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function bucketText(value: string, range: AnalystRange): string {
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
   CUSTOM DROPDOWN
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
        className={`group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-2xl border bg-white/95 px-3.5 text-left shadow-[0_12px_32px_-26px_rgba(15,118,110,0.55)] outline-none transition duration-200 dark:bg-slate-950/80 ${
          open
            ? "border-teal-500/60 ring-4 ring-teal-500/10"
            : "border-slate-200 hover:-translate-y-0.5 hover:border-teal-500/35 hover:shadow-[0_16px_36px_-24px_rgba(15,118,110,0.42)] dark:border-white/10 dark:hover:border-teal-400/30"
        }`}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 shadow-sm dark:text-teal-300">
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
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-teal-500/15 bg-white/98 p-1.5 shadow-[0_28px_80px_-24px_rgba(15,118,110,0.32)] backdrop-blur-2xl dark:border-teal-400/15 dark:bg-[#091820]/98"
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
   CHANGE INDICATOR
========================================================= */

function Change({
  metric,
  inverse = false,
}: {
  metric: AnalystPaymentMetric;
  inverse?: boolean;
}) {
  const change = metric.changePercent;

  if (change === null) {
    return (
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        No previous baseline
      </span>
    );
  }

  const rising = change > 0;
  const neutral = change === 0;
  const good = neutral || (inverse ? !rising : rising);
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-black ${
        neutral
          ? "text-slate-500"
          : good
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
      }`}
    >
      {!neutral && <Icon className="h-3.5 w-3.5" />}

      {Math.abs(change).toFixed(2)}%

      <span className="font-medium text-slate-500 dark:text-slate-400">
        vs previous
      </span>
    </span>
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
        glow: "bg-emerald-500/10",
        line: "from-transparent via-emerald-400/60 to-transparent",
      };

    case "violet":
      return {
        icon:
          "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400",
        glow: "bg-violet-500/10",
        line: "from-transparent via-violet-400/60 to-transparent",
      };

    case "cyan":
      return {
        icon:
          "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        glow: "bg-cyan-500/10",
        line: "from-transparent via-cyan-400/60 to-transparent",
      };

    case "red":
      return {
        icon:
          "border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400",
        glow: "bg-red-500/10",
        line: "from-transparent via-red-400/60 to-transparent",
      };

    case "amber":
      return {
        icon:
          "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        glow: "bg-amber-500/10",
        line: "from-transparent via-amber-400/60 to-transparent",
      };

    case "ocean":
    default:
      return {
        icon:
          "border-teal-500/15 bg-teal-500/10 text-teal-700 dark:text-teal-300",
        glow: "bg-teal-500/10",
        line: "from-transparent via-teal-400/60 to-transparent",
      };
  }
}

function MetricCard({
  title,
  value,
  subtitle,
  metric,
  icon: Icon,
  tone,
  inverse,
}: {
  title: string;
  value: string;
  subtitle: string;
  metric: AnalystPaymentMetric;
  icon: LucideIcon;
  tone: MetricTone;
  inverse?: boolean;
}) {
  const styles = metricTone(tone);

  return (
    <motion.div
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

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
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

      <div className="relative mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
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
      className={`group relative h-fit overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_65px_-35px_rgba(15,118,110,0.50)] dark:border-white/10 dark:bg-slate-950/70 ${className}`}
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
   EMPTY
========================================================= */

function Empty({ message }: { message: string }) {
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
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-teal-500/20 bg-gradient-to-br from-teal-500/[0.04] via-white to-cyan-500/[0.04] px-6 py-8 text-center dark:via-slate-950"
    >
      <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-600 dark:text-teal-300">
        <DatabaseZap className="h-5 w-5" />
      </div>

      <p className="relative mt-3 text-sm font-black text-slate-900 dark:text-white">
        No real payment data
      </p>

      <p className="relative mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </motion.div>
  );
}

/* =========================================================
   BREAKDOWN
========================================================= */

function Breakdown({
  rows,
}: {
  rows: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <Empty message="No breakdown records match the selected filters." />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <motion.div
          key={row.key}
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
            delay: Math.min(index * 0.035, 0.2),
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 font-black text-slate-800 dark:text-slate-100">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                style={{
                  backgroundColor: COLORS[row.key] ?? OCEAN.sky,
                }}
              />

              <span className="truncate">{humanize(row.key)}</span>
            </span>

            <span className="shrink-0 font-black text-slate-500 dark:text-slate-400">
              {numberText(row.count)} · {row.percentage.toFixed(2)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
            <motion.div
              initial={{
                width: 0,
              }}
              whileInView={{
                width: `${Math.min(100, row.percentage)}%`,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.75,
                ease: "easeOut",
              }}
              className="h-full rounded-full"
              style={{
                backgroundColor: COLORS[row.key] ?? OCEAN.sky,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   HEALTH
========================================================= */

function Health({ health }: { health: AnalystPulseStatus }) {
  const style =
    health === "healthy"
      ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : health === "attention"
        ? "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400";

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${style}`}
    >
      {health}
    </span>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function Insight({
  insight,
  index,
}: {
  insight: AnalystPaymentInsight;
  index: number;
}) {
  const style =
    insight.severity === "positive"
      ? {
          shell:
            "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
          icon:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          badge:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        }
      : insight.severity === "info"
        ? {
            shell:
              "border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
            icon:
              "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
            badge:
              "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
          }
        : insight.severity === "critical"
          ? {
              shell:
                "border-red-500/20 bg-gradient-to-br from-red-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
              icon:
                "bg-red-500/10 text-red-600 dark:text-red-400",
              badge:
                "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
            }
          : {
              shell:
                "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
              icon:
                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              badge:
                "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            };

  const Icon =
    insight.severity === "positive"
      ? CheckCircle2
      : insight.severity === "critical"
        ? XCircle
        : insight.severity === "info"
          ? Sparkles
          : AlertTriangle;

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
      className={`rounded-[22px] border p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] ${style.shell}`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-slate-950 dark:text-white">
              {insight.title}
            </p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${style.badge}`}
            >
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {insight.description}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                Evidence
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {insight.evidence}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                Recommended review
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {insight.recommendedReview}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
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
    <div className="min-w-[185px] rounded-2xl border border-white/10 bg-[#071923]/95 p-3 text-white shadow-2xl backdrop-blur-xl">
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
                  background: entry.color ?? OCEAN.tealBright,
                }}
              />

              {entry.name}
            </span>

            <span className="text-[10px] font-black text-white">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("en-BD", {
                    maximumFractionDigits: 2,
                  })
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function PaymentsLoading() {
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
            <CreditCard className="h-6 w-6" />
          </motion.div>
        </div>

        <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
          Aggregating payment records
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Building the read-only gateway performance view...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystPaymentsPage() {
  const router =
    useRouter();

  /*
   * DashboardSessionContext is populated from the
   * authenticated backend profile by the dashboard layout.
   * The backend-confirmed role is the source of truth.
   */
  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

  /* =======================================================
     ANALYST-ONLY PAGE GUARD
  ======================================================= */

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
  const [status, setStatus] = useState<AnalystPaymentStatus>("all");
  const [source, setSource] = useState<AnalystPaymentSource>("all");
  const [currency, setCurrency] = useState("BDT");
  const [currencyDraft, setCurrencyDraft] = useState("BDT");
  const [provider, setProvider] = useState("");
  const [providerDraft, setProviderDraft] = useState("");
  const [data, setData] =
    useState<AnalystPaymentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      setRefreshing(false);
      setData(null);
      setError("");

      return;
    }

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      if (hasLoadedRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await getAnalystPaymentAnalytics(
          {
            range,
            mode,
            currency,
            provider,
            status,
            source,
          },
          controller.signal
        );

        if (active && !controller.signal.aborted) {
          setData(result);
          hasLoadedRef.current = true;
        }
      } catch (loadError: unknown) {
        if (active && !controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load payment analytics."
          );
        }
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    isAnalystRole,
    range,
    mode,
    currency,
    provider,
    status,
    source,
    refreshKey,
  ]);

  const chartData = useMemo(
    () =>
      data?.trend.map((point) => ({
        ...point,
        label: bucketText(point.bucket, range),
        volumeMajor: point.volumeMinor / 100,
      })) ?? [],
    [data, range]
  );

  const statusPie = useMemo(
    () =>
      data?.statuses.filter((item) => item.count > 0) ?? [],
    [data]
  );

  const activeFilterCount = useMemo(
    () =>
      [
        range !== "30d",
        mode !== "all",
        status !== "all",
        source !== "all",
        currency !== "BDT",
        provider.trim().length > 0,
      ].filter(Boolean).length,
    [range, mode, status, source, currency, provider]
  );

  const applyTextFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAnalystRole) {
      return;
    }

    const nextCurrency = currencyDraft.trim().toUpperCase();
    const nextProvider = providerDraft.trim().toLowerCase();

    if (!/^[A-Z]{3}$/.test(nextCurrency)) {
      setError("Currency must be a three-letter ISO code.");
      return;
    }

    if (
      nextProvider &&
      !/^[a-z0-9][a-z0-9_-]*$/.test(nextProvider)
    ) {
      setError("Provider contains invalid characters.");
      return;
    }

    setError("");
    setCurrency(nextCurrency);
    setProvider(nextProvider);
    setCurrencyDraft(nextCurrency);
    setProviderDraft(nextProvider);
  };

  const resetFilters = () => {
    if (!isAnalystRole) {
      return;
    }

    setRange("30d");
    setMode("all");
    setStatus("all");
    setSource("all");
    setCurrency("BDT");
    setCurrencyDraft("BDT");
    setProvider("");
    setProviderDraft("");
    setError("");
  };

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
            Payment Analytics is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
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
                  <CreditCard className="h-3.5 w-3.5" />

                  Gateway Performance
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  <BadgeCheck className="h-3.5 w-3.5" />

                  Read-only analyst
                </div>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
                Payment Analytics
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                Gateway attempts, completed volume, fees, provider health,
                failure pressure and latency from real Payment collection
                records—without any synthetic analytics data.
              </p>

              {data && (
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                    <Clock3 className="h-3.5 w-3.5 text-cyan-300" />

                    Updated {dateText(data.generatedAt)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                    <Layers3 className="h-3.5 w-3.5 text-teal-300" />

                    {selectedLabel(MODE_OPTIONS, mode)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-emerald-100">
                    <WalletCards className="h-3.5 w-3.5" />

                    {data.filters.currency}
                  </span>
                </div>
              )}
            </div>

            <div className="relative flex shrink-0 items-center gap-3">
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
                onClick={() => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setRefreshKey(
                    (value) =>
                      value + 1
                  );
                }}
                disabled={refreshing}
                className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>

          {refreshing && (
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
                <Filter className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                  Payment Filters
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
              disabled={activeFilterCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-teal-500/30 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-teal-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />

              Reset
            </button>
          </div>

          <form
            onSubmit={applyTextFilters}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
          >
            <OceanSelect
              label="Range"
              value={range}
              options={RANGE_OPTIONS}
              onChange={(nextRange) => {
                if (!isAnalystRole) {
                  return;
                }

                setRange(nextRange);
              }}
              icon={Clock3}
            />

            <OceanSelect
              label="Mode"
              value={mode}
              options={MODE_OPTIONS}
              onChange={(nextMode) => {
                if (!isAnalystRole) {
                  return;
                }

                setMode(nextMode);
              }}
              icon={Layers3}
            />

            <OceanSelect
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(nextStatus) => {
                if (!isAnalystRole) {
                  return;
                }

                setStatus(nextStatus);
              }}
              icon={Gauge}
            />

            <OceanSelect
              label="Source"
              value={source}
              options={SOURCE_OPTIONS}
              onChange={(nextSource) => {
                if (!isAnalystRole) {
                  return;
                }

                setSource(nextSource);
              }}
              icon={CreditCard}
            />

            <div>
              <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Currency
              </p>

              <input
                value={currencyDraft}
                onChange={(event) =>
                  setCurrencyDraft(
                    event.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .slice(0, 3)
                      .toUpperCase()
                  )
                }
                aria-label="Currency"
                maxLength={3}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-center text-xs font-black uppercase text-slate-900 shadow-sm outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
              />
            </div>

            <div>
              <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Provider
              </p>

              <div className="flex h-12 gap-2">
                <input
                  value={providerDraft}
                  onChange={(event) =>
                    setProviderDraft(event.target.value)
                  }
                  placeholder="Optional"
                  aria-label="Provider"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-3 text-xs font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 px-3 text-[9px] font-black uppercase tracking-wide text-white shadow-md shadow-teal-500/15 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-teal-700 dark:text-teal-300">
              {selectedLabel(RANGE_OPTIONS, range)}
            </span>

            <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-cyan-700 dark:text-cyan-300">
              {selectedLabel(MODE_OPTIONS, mode)}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {selectedLabel(STATUS_OPTIONS, status)}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {selectedLabel(SOURCE_OPTIONS, source)}
            </span>

            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
              {currency}
            </span>

            {provider && (
              <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-2.5 py-1 text-[9px] font-black text-violet-700 dark:text-violet-300">
                Provider: {provider}
              </span>
            )}
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
                  Payment analytics request failed
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && !data ? (
          <PaymentsLoading />
        ) : data ? (
          <>
            {/* =================================================
                METRICS
            ================================================= */}

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                title="Payment attempts"
                value={numberText(data.metrics.attemptCount.value)}
                subtitle="All matching gateway attempts"
                metric={data.metrics.attemptCount}
                icon={Activity}
                tone="ocean"
              />

              <MetricCard
                title="Completed payments"
                value={numberText(data.metrics.completedCount.value)}
                subtitle={`${data.metrics.successRate.value.toFixed(
                  2
                )}% success rate`}
                metric={data.metrics.completedCount}
                icon={CheckCircle2}
                tone="emerald"
              />

              <MetricCard
                title="Completed volume"
                value={moneyText(
                  data.metrics.paymentVolumeMinor.value,
                  data.filters.currency,
                  true
                )}
                subtitle="Failed payments excluded"
                metric={data.metrics.paymentVolumeMinor}
                icon={CircleDollarSign}
                tone="violet"
              />

              <MetricCard
                title="Fee revenue"
                value={moneyText(
                  data.metrics.feeRevenueMinor.value,
                  data.filters.currency,
                  true
                )}
                subtitle="Captured payment fees"
                metric={data.metrics.feeRevenueMinor}
                icon={Banknote}
                tone="cyan"
              />

              <MetricCard
                title="Net merchant volume"
                value={moneyText(
                  data.metrics.netVolumeMinor.value,
                  data.filters.currency,
                  true
                )}
                subtitle="Net credited payment value"
                metric={data.metrics.netVolumeMinor}
                icon={WalletCards}
                tone="ocean"
              />

              <MetricCard
                title="Average payment"
                value={moneyText(
                  data.metrics.averagePaymentMinor.value,
                  data.filters.currency
                )}
                subtitle="Completed payments only"
                metric={data.metrics.averagePaymentMinor}
                icon={Layers3}
                tone="violet"
              />

              <MetricCard
                title="Failure rate"
                value={`${data.metrics.failureRate.value.toFixed(2)}%`}
                subtitle={`${numberText(
                  data.metrics.failedCount.value
                )} failed payments`}
                metric={data.metrics.failureRate}
                icon={XCircle}
                tone="red"
                inverse
              />

              <MetricCard
                title="Completion latency"
                value={`${data.metrics.averageCompletionSeconds.value.toFixed(
                  2
                )}s`}
                subtitle="Created-to-completed average"
                metric={data.metrics.averageCompletionSeconds}
                icon={TimerReset}
                tone="amber"
                inverse
              />
            </motion.div>

            {/* =================================================
                TREND
            ================================================= */}

            <Panel
              title="Payment Performance Trend"
              description="Attempts, completed payments, failures, and completed volume across the selected period."
              icon={TrendingUp}
              action={
                <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                  Real API trend
                </span>
              }
            >
              {data.metrics.attemptCount.value > 0 ? (
                <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                  <div className="relative h-[370px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{
                          top: 18,
                          right: 18,
                          left: -12,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="payment-volume-ocean"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={OCEAN.violet}
                              stopOpacity={0.36}
                            />

                            <stop
                              offset="95%"
                              stopColor={OCEAN.violet}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

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
                          yAxisId="count"
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                            fill: "#94A3B8",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          yAxisId="volume"
                          orientation="right"
                          tick={{
                            fontSize: 10,
                            fill: "#94A3B8",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip content={<OceanTooltip />} />

                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: 10,
                            color: "#CBD5E1",
                            paddingTop: 10,
                          }}
                        />

                        <Area
                          yAxisId="volume"
                          type="monotone"
                          dataKey="volumeMajor"
                          name="Completed volume"
                          stroke={OCEAN.violet}
                          fill="url(#payment-volume-ocean)"
                          strokeWidth={2.3}
                          activeDot={{
                            r: 4,
                            fill: OCEAN.violet,
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                        />

                        <Bar
                          yAxisId="count"
                          dataKey="failedCount"
                          name="Failed"
                          fill={OCEAN.red}
                          radius={[5, 5, 0, 0]}
                          maxBarSize={18}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="attemptCount"
                          name="Attempts"
                          stroke={OCEAN.sky}
                          strokeWidth={2.7}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: OCEAN.sky,
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="completedCount"
                          name="Completed"
                          stroke={OCEAN.emerald}
                          strokeWidth={2.4}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: OCEAN.emerald,
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <Empty message="No payment attempt matches the current filters." />
              )}
            </Panel>

            {/* =================================================
                DYNAMIC CONTENT FLOW
                Independent columns prevent tall neighboring cards
                from creating large blank gaps under shorter cards.
            ================================================= */}

            <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
              <div className="min-w-0 space-y-6">
                <Panel
                                title="Provider Performance"
                                description="Read-only provider success, volume, fees, and completion latency."
                                icon={Gauge}
                              >
                                {data.providers.length ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-xs">
                                      <thead>
                                        <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                          <th className="border-b border-slate-200 px-3 py-3 dark:border-white/10">
                                            Provider
                                          </th>

                                          <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-white/10">
                                            Attempts
                                          </th>

                                          <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-white/10">
                                            Success
                                          </th>

                                          <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-white/10">
                                            Failed
                                          </th>

                                          <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-white/10">
                                            Volume
                                          </th>

                                          <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-white/10">
                                            Latency
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {data.providers.map((item, index) => (
                                          <motion.tr
                                            key={item.provider}
                                            initial={{
                                              opacity: 0,
                                              y: 5,
                                            }}
                                            whileInView={{
                                              opacity: 1,
                                              y: 0,
                                            }}
                                            viewport={{
                                              once: true,
                                            }}
                                            transition={{
                                              delay: Math.min(index * 0.025, 0.18),
                                            }}
                                            className="transition hover:bg-teal-500/[0.035]"
                                          >
                                            <td className="border-b border-slate-200/70 px-3 py-3.5 dark:border-white/5">
                                              <div className="flex items-center gap-2">
                                                <Health health={item.health} />

                                                <span className="font-black text-slate-900 dark:text-white">
                                                  {humanize(item.provider)}
                                                </span>
                                              </div>
                                            </td>

                                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold dark:border-white/5">
                                              {numberText(item.attemptCount)}
                                            </td>

                                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold text-emerald-600 dark:border-white/5 dark:text-emerald-400">
                                              {item.successRate.toFixed(2)}%
                                            </td>

                                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold text-red-600 dark:border-white/5 dark:text-red-400">
                                              {numberText(item.failedCount)}
                                            </td>

                                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold dark:border-white/5">
                                              {moneyText(
                                                item.volumeMinor,
                                                data.filters.currency,
                                                true
                                              )}
                                            </td>

                                            <td className="border-b border-slate-200/70 px-3 py-3.5 text-right font-bold dark:border-white/5">
                                              {item.averageCompletionSeconds.toFixed(2)}s
                                            </td>
                                          </motion.tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <Empty message="No provider performance record matches the filters." />
                                )}
                              </Panel>

                <div className="grid items-start gap-6 md:grid-cols-2">
                  <Panel
                                  title="Payment Sources"
                                  description="Wallet, card, PayPal, and local provider usage."
                                  icon={CreditCard}
                                >
                                  <Breakdown
                                    rows={data.sources.map((item) => ({
                                      key: item.source,
                                      count: item.count,
                                      percentage: item.percentage,
                                    }))}
                                  />
                                </Panel>

                  <Panel
                                  title="Environment Mix"
                                  description="Test and live request distribution."
                                  icon={Layers3}
                                >
                                  <Breakdown
                                    rows={data.modes.map((item) => ({
                                      key: item.mode,
                                      count: item.count,
                                      percentage: item.percentage,
                                    }))}
                                  />
                                </Panel>
                </div>

                <Panel
                                title="Failure Reasons"
                                description="Recorded failure codes; sensitive failure messages are not exposed."
                                icon={ShieldAlert}
                              >
                                {data.failureReasons.length ? (
                                  <Breakdown
                                    rows={data.failureReasons.map((item) => ({
                                      key: item.code,
                                      count: item.count,
                                      percentage: item.percentage,
                                    }))}
                                  />
                                ) : (
                                  <Empty message="No failed payment exists in the selected period." />
                                )}
                              </Panel>
              </div>

              <div className="min-w-0 space-y-6">
                <Panel
                                title="Payment Status"
                                description="Lifecycle distribution across all matching attempts."
                                icon={BarChart3}
                              >
                                {statusPie.length ? (
                                  <div className="space-y-5">
                                    <div className="relative mx-auto h-[230px] max-w-[310px]">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Tooltip content={<OceanTooltip />} />

                                          <Pie
                                            data={statusPie}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={88}
                                            paddingAngle={3}
                                            stroke="transparent"
                                            isAnimationActive
                                            animationDuration={900}
                                          >
                                            {statusPie.map((item) => (
                                              <Cell
                                                key={item.status}
                                                fill={COLORS[item.status] ?? OCEAN.sky}
                                              />
                                            ))}
                                          </Pie>
                                        </PieChart>
                                      </ResponsiveContainer>

                                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                          <p className="text-2xl font-black text-slate-950 dark:text-white">
                                            {numberText(data.metrics.attemptCount.value)}
                                          </p>

                                          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                                            Attempts
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <Breakdown
                                      rows={data.statuses.map((item) => ({
                                        key: item.status,
                                        count: item.count,
                                        percentage: item.percentage,
                                      }))}
                                    />
                                  </div>
                                ) : (
                                  <Empty message="No status distribution matches the selected filters." />
                                )}
                              </Panel>

                <Panel
                                title="Completion Latency"
                                description="Completed payments grouped by processing duration."
                                icon={TimerReset}
                              >
                                <Breakdown
                                  rows={data.latency.map((item) => ({
                                    key: item.label,
                                    count: item.count,
                                    percentage: item.percentage,
                                  }))}
                                />
                              </Panel>

                <Panel
                                title="Deterministic Insights"
                                description="Transparent threshold-based findings; no paid AI provider is used."
                                icon={Sparkles}
                                action={
                                  <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                                    {data.insights.length} signals
                                  </span>
                                }
                              >
                                {data.insights.length ? (
                                  <div className="space-y-3">
                                    {data.insights.map((item, index) => (
                                      <Insight
                                        key={item.id}
                                        insight={item}
                                        index={index}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Empty message="No deterministic payment insight is available for the current filters." />
                                )}
                              </Panel>
              </div>
            </div>

            {/* =================================================
                OPERATIONS / READ ONLY
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

              <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "In progress",
                    value: data.operations.pendingCount,
                    icon: Clock3,
                    className:
                      "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
                  },
                  {
                    label: "Cancelled",
                    value: data.operations.cancelledCount,
                    icon: XCircle,
                    className:
                      "bg-slate-500/10 text-slate-600 dark:text-slate-300",
                  },
                  {
                    label: "Expired",
                    value: data.operations.expiredCount,
                    icon: TimerReset,
                    className:
                      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                  },
                  {
                    label: "Risk blocked",
                    value: data.operations.riskBlockedCount,
                    icon: ShieldAlert,
                    className:
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.label}
                      whileHover={{
                        y: -2,
                      }}
                      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition hover:border-teal-500/20 dark:border-white/10 dark:bg-black/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {item.label}
                          </p>

                          <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                            {numberText(item.value)}
                          </p>
                        </div>

                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.className}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="relative mt-4 flex items-start gap-3 border-t border-slate-200/70 pt-4 dark:border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  <ShieldAlert className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                    Read-only analyst boundary
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    This analyst page can only read aggregated payment facts.
                    It cannot create, capture, cancel, or refund a payment.
                  </p>
                </div>
              </div>
            </motion.section>
          </>
        ) : null}
      </div>
    </div>
  );
}
