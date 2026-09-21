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
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  DatabaseZap,
  Filter,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
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
  getAnalystRevenueAnalytics,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
  type AnalystRevenueData,
  type AnalystRevenueInsight,
  type AnalystRevenueKind,
} from "@/lib/api/analystApi";


/* =========================================================
   THEME

   Ocean Glow visual system shared with the other Analyst
   workspaces. Semantic red / amber / emerald remain reserved
   for actual status and financial meaning.
========================================================= */

const THEME = {
  ink: "#10243A",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  violet: "#8B5CF6",
  slate: "#64748B",
  axis: "#94A3B8",
} as const;

const DARK_SURFACE =
  "bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

const REVENUE_PIE_COLORS = [
  THEME.tealBright,
  THEME.cyan,
  THEME.sky,
  THEME.emerald,
  THEME.violet,
  "#4FD1C5",
  "#60A5FA",
];

const LEAKAGE_PIE_COLORS = [
  THEME.red,
  "#F97316",
  THEME.amber,
  "#FB7185",
  "#E879F9",
];

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value:
    AnalystRange;

  label:
    string;
}> = [
  {
    value:
      "24h",

    label:
      "Last 24 hours",
  },

  {
    value:
      "7d",

    label:
      "Last 7 days",
  },

  {
    value:
      "30d",

    label:
      "Last 30 days",
  },

  {
    value:
      "90d",

    label:
      "Last 90 days",
  },
];

const MODE_OPTIONS: Array<{
  value:
    AnalystMode;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All modes",
  },

  {
    value:
      "live",

    label:
      "Live only",
  },

  {
    value:
      "test",

    label:
      "Test only",
  },
];

const KIND_OPTIONS: Array<{
  value:
    AnalystRevenueKind;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All revenue events",
  },

  {
    value:
      "MERCHANT_FEE",

    label:
      "Merchant fee",
  },

  {
    value:
      "TRANSFER_FEE",

    label:
      "Transfer fee",
  },

  {
    value:
      "WITHDRAWAL_FEE",

    label:
      "Withdrawal fee",
  },

  {
    value:
      "DEPOSIT_FEE",

    label:
      "Deposit fee",
  },

  {
    value:
      "SERVICE_FEE",

    label:
      "Service fee",
  },

  {
    value:
      "REFUND",

    label:
      "Refund",
  },

  {
    value:
      "FEE_WAIVER",

    label:
      "Fee waiver",
  },

  {
    value:
      "GATEWAY_REVERSAL",

    label:
      "Gateway reversal",
  },

  {
    value:
      "MICRO_FEE_ADJUSTMENT",

    label:
      "Micro-fee adjustment",
  },
];

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(
  value:
    number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function formatMoney(
  minor:
    number,
  currency:
    string,
  compact =
    false
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
      minor /
        100
    );
  } catch {
    return `${currency} ${(
      minor /
      100
    ).toLocaleString(
      "en-BD"
    )}`;
  }
}

function formatDateTime(
  value:
    string
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

function formatBucket(
  value:
    string,
  range:
    AnalystRange
): string {
  const date =
    new Date(
      value.length ===
        10
        ? `${value}T00:00:00Z`
        : value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  if (
    range ===
    "24h"
  ) {
    return new Intl.DateTimeFormat(
      "en-BD",
      {
        hour:
          "numeric",

        hour12:
          true,
      }
    ).format(date);
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      month:
        "short",

      day:
        "numeric",
    }
  ).format(date);
}

function humanize(
  value:
    string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}

/* =========================================================
   CHANGE
========================================================= */

function Change({
  metric,
  inverse =
    false,
}: {
  metric:
    AnalystMetric;

  inverse?:
    boolean;
}) {
  const change =
    metric.changePercent;

  if (
    change ===
    null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  if (
    change ===
    0
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No change vs previous
      </span>
    );
  }

  const rising =
    change >
    0;

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
   METRIC
========================================================= */

function MetricCard({
  label,
  value,
  helper,
  metric,
  icon: Icon,
  iconClass,
  inverse,
  index = 0,
}: {
  label: string;
  value: string;
  helper: string;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
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
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.42,
        delay: index * 0.06,
        ease: easeOut,
      }}
      className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 opacity-80" />

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
  const dark =
    tone === "dark";

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 14,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.12,
      }}
      transition={{
        duration: 0.42,
        ease: easeOut,
      }}
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
              scale: [1, 1.15, 1],
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
          dark
            ? "border-white/10"
            : "border-border"
        }`}
      >
        <div className="min-w-0">
          <h2
            className={`text-base font-extrabold ${
              dark
                ? "text-white"
                : "text-foreground"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-1 text-xs leading-5 ${
              dark
                ? "text-slate-300"
                : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        </div>

        {action ? (
          <div className="shrink-0">
            {action}
          </div>
        ) : null}
      </div>

      <div className="relative flex-1 p-5">
        {children}
      </div>
    </motion.section>
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
      className={`flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center ${
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
          dark
            ? "text-white"
            : "text-foreground"
        }`}
      >
        No revenue records
      </p>

      <p
        className={`mt-1 max-w-sm text-xs leading-5 ${
          dark
            ? "text-slate-400"
            : "text-muted-foreground"
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
  index = 0,
}: {
  insight: AnalystRevenueInsight;
  index?: number;
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
            <p className="text-sm font-extrabold text-white">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">
              {humanize(
                insight.category
              )}
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
   FILTER SELECT
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
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    options.find(
      (option) =>
        option.value ===
        value
    ) ??
    options[0];

  useEffect(
    () => {
      function handlePointerDown(
        event:
          MouseEvent
      ) {
        if (
          rootRef.current &&
          !rootRef.current.contains(
            event.target as
              Node
          )
        ) {
          setOpen(false);
        }
      }

      function handleKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setOpen(false);
        }
      }

      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handlePointerDown
        );

        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    []
  );

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
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left outline-none transition hover:border-teal-500/45 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-xs font-extrabold text-foreground">
          {selected?.label}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition duration-200 ${
            open
              ? "rotate-180"
              : ""
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
            transition={{
              duration: 0.16,
            }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-auto rounded-2xl border border-border bg-card p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
            role="listbox"
          >
            {options.map(
              (option) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                      active
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                        : "text-foreground hover:bg-muted/60"
                    }`}
                    role="option"
                    aria-selected={
                      active
                    }
                  >
                    <span>
                      {
                        option.label
                      }
                    </span>

                    {active ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : null}
                  </button>
                );
              }
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function RevenueChartTooltip({
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
    fill?: string;
  }>;
  label?: string;
  currency: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.15,
      }}
      className="min-w-[190px] rounded-2xl border border-white/10 bg-[#0D1D29]/95 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-xl"
    >
      {label ? (
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-teal-300">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map(
          (
            entry,
            index
          ) => (
            <div
              key={`${String(
                entry.dataKey
              )}-${index}`}
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
                {formatMoney(
                  Number(
                    entry.value ??
                      0
                  ) *
                    100,
                  currency,
                  true
                )}
              </span>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================
   TWO-LEVEL REVENUE PIE

   No sample values are used here. The inner pie uses positive
   net RevenueEvent-kind values returned by the API. The outer
   ring uses the real leakage amounts returned by the API.
   Each ring has its own total, so they are intentionally
   described as separate compositions rather than one shared
   100% total.
========================================================= */

function RevenueCompositionChart({
  kinds,
  leakage,
  currency,
}: {
  kinds: Array<{
    kind: string;
    eventCount: number;
    netMinor: number;
    percentageOfNetRevenue: number;
  }>;
  leakage: Array<{
    kind: string;
    count: number;
    amountMinor: number;
    percentage: number;
  }>;
  currency: string;
}) {
  const positiveRevenue =
    kinds
      .filter(
        (item) =>
          item.netMinor >
          0
      )
      .map(
        (
          item,
          index
        ) => ({
          name:
            humanize(
              item.kind
            ),

          value:
            item.netMinor,

          eventCount:
            item.eventCount,

          color:
            REVENUE_PIE_COLORS[
              index %
                REVENUE_PIE_COLORS.length
            ],
        })
      );

  const leakageData =
    leakage
      .filter(
        (item) =>
          item.amountMinor >
          0
      )
      .map(
        (
          item,
          index
        ) => ({
          name:
            humanize(
              item.kind
            ),

          value:
            item.amountMinor,

          count:
            item.count,

          color:
            LEAKAGE_PIE_COLORS[
              index %
                LEAKAGE_PIE_COLORS.length
            ],
        })
      );

  if (
    positiveRevenue.length ===
      0 &&
    leakageData.length ===
      0
  ) {
    return (
      <Empty message="No classified revenue or leakage composition is available for these filters." />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:items-center">
      <div className="relative h-[370px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={
                positiveRevenue
              }
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={88}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={1.2}
              isAnimationActive
              animationBegin={
                120
              }
              animationDuration={
                1150
              }
            >
              {positiveRevenue.map(
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

            <Pie
              data={
                leakageData
              }
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={112}
              outerRadius={150}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={1.1}
              isAnimationActive
              animationBegin={
                360
              }
              animationDuration={
                1300
              }
            >
              {leakageData.map(
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

            <Tooltip
              formatter={(
                value
              ) =>
                formatMoney(
                  Number(
                    value
                  ),
                  currency,
                  true
                )
              }
              contentStyle={{
                borderRadius:
                  16,

                border:
                  "1px solid rgba(148,163,184,0.20)",

                background:
                  "#0D1D29",

                color:
                  "#FFFFFF",

                fontSize:
                  12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <motion.div
          aria-hidden
          animate={{
            opacity: [
              0.16,
              0.35,
              0.16,
            ],

            scale: [
              1,
              1.05,
              1,
            ],
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
            Inner pie · positive revenue
          </p>

          <div className="mt-3 space-y-2.5">
            {positiveRevenue.map(
              (item) => (
                <div
                  key={
                    item.name
                  }
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3 py-2.5"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <span className="truncate">
                      {
                        item.name
                      }
                    </span>
                  </span>

                  <span className="shrink-0 text-xs font-black tabular-nums">
                    {formatMoney(
                      item.value,
                      currency,
                      true
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Outer ring · classified leakage
          </p>

          {leakageData.length >
          0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {leakageData.map(
                (item) => (
                  <span
                    key={
                      item.name
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    {
                      item.name
                    }{" "}
                    ·{" "}
                    {formatMoney(
                      item.value,
                      currency,
                      true
                    )}
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              No classified leakage exists for the current filters.
            </p>
          )}
        </div>

        <p className="rounded-xl border border-border bg-muted/30 p-3 text-[10px] leading-5 text-muted-foreground">
          The two rings use separate real totals: the inner ring is positive
          classified revenue by event kind; the outer ring is classified
          leakage by kind. They are not presented as parts of one shared total.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystRevenuePage() {
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

  const [
    range,
    setRange,
  ] =
    useState<AnalystRange>(
      "30d"
    );

  const [
    mode,
    setMode,
  ] =
    useState<AnalystMode>(
      "all"
    );

  const [
    kind,
    setKind,
  ] =
    useState<AnalystRevenueKind>(
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
    useState<AnalystRevenueData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(
      0
    );

  const hasLoadedRef =
    useRef(false);

  /* =======================================================
     LOAD
  ====================================================== */

  useEffect(
    () => {
      if (!isAnalystRole) {
        setLoading(false);
        setRefreshing(false);
        setData(null);
        setError("");

        return;
      }

      const controller =
        new AbortController();

      let active =
        true;

      async function load() {
        try {
          if (
            hasLoadedRef.current
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            ""
          );

          const result =
            await getAnalystRevenueAnalytics(
              {
                range,
                mode,
                currency,
                kind,
              },
              controller.signal
            );

          if (
            active
          ) {
            hasLoadedRef.current =
              true;

            setData(
              result
            );
          }
        } catch (
          loadError
        ) {
          if (
            active &&
            !controller.signal
              .aborted
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load revenue intelligence."
            );
          }
        } finally {
          if (
            active
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      }

      void load();

      return () => {
        active =
          false;

        controller.abort();
      };
    },
    [
      isAnalystRole,
      range,
      mode,
      currency,
      kind,
      refreshKey,
    ]
  );

  const chartData =
    useMemo(
      () =>
        data
          ?.trend
          .map(
            (
              point
            ) => ({
              ...point,

              label:
                formatBucket(
                  point.bucket,
                  range
                ),

              gross:
                point.grossRevenueMinor /
                100,

              leakage:
                point.leakageMinor /
                100,

              net:
                point.netRevenueMinor /
                100,
            })
          ) ??
        [],
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

    if (!isAnalystRole) {
      return;
    }

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

    setCurrency(
      next
    );
  }

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
            Revenue Analytics is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading revenue intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Reading the platform revenue ledger...
          </p>
        </div>
      </div>
    );
  }

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
          className="pointer-events-none absolute -bottom-28 left-[24%] h-64 w-64 rounded-full bg-emerald-400/18 blur-3xl"
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
          className="pointer-events-none absolute right-[18%] top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-cyan-200/10 xl:block"
        >
          <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.8)]" />
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
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Revenue Intelligence Workspace
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Revenue Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Gross fee capture, classified leakage, net revenue, event mix
              and source attribution from the actual RevenueEvent ledger.
            </p>

            {data ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/12 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-current" />
                  Ledger analytics
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  Updated {formatDateTime(data.generatedAt)}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                  {data.filters.currency}
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
            onClick={() => {
              if (!isAnalystRole) {
                return;
              }

              setRefreshKey(
                (current) =>
                  current + 1
              );
            }}
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
              Revenue filters
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Refine the real ledger scope without changing financial data.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Period"
            value={range}
            options={RANGE_OPTIONS}
            onChange={(nextRange) => {
              if (!isAnalystRole) {
                return;
              }

              setRange(nextRange);
            }}
          />

          <FilterSelect
            label="Payment mode"
            value={mode}
            options={MODE_OPTIONS}
            onChange={(nextMode) => {
              if (!isAnalystRole) {
                return;
              }

              setMode(nextMode);
            }}
          />

          <FilterSelect
            label="Revenue event"
            value={kind}
            options={KIND_OPTIONS}
            onChange={(nextKind) => {
              if (!isAnalystRole) {
                return;
              }

              setKind(nextKind);
            }}
          />

          <form
            onSubmit={applyCurrency}
            className="flex items-end"
          >
            <label className="w-full">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Currency
              </span>

              <div className="flex">
                <input
                  value={currencyDraft}
                  maxLength={3}
                  onChange={(event) => {
                    if (!isAnalystRole) {
                      return;
                    }

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
                    );
                  }}
                  className="h-11 min-w-0 flex-1 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black uppercase outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />

                <motion.button
                  type="submit"
                  whileTap={{
                    scale: 0.97,
                  }}
                  className="rounded-r-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-[10px] font-black uppercase text-white shadow-[0_10px_24px_rgba(13,148,136,0.2)]"
                >
                  Apply
                </motion.button>
              </div>
            </label>
          </form>
        </div>
      </motion.section>

      {data && (
        <>
          {/* METRICS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              index={0}
              label="Gross Revenue"
              value={formatMoney(
                data.metrics
                  .grossRevenueMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper="Captured positive fee events"
              metric={
                data.metrics
                  .grossRevenueMinor
              }
              icon={
                Banknote
              }
              iconClass="bg-emerald-500/10 text-emerald-600"
            />

            <MetricCard
              index={1}
              label="Revenue Leakage"
              value={formatMoney(
                data.metrics
                  .leakageMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper="Refunds, waivers, reversals and adjustments"
              metric={
                data.metrics
                  .leakageMinor
              }
              icon={
                ShieldAlert
              }
              iconClass="bg-red-500/10 text-red-600"
              inverse
            />

            <MetricCard
              index={2}
              label="Net Revenue"
              value={formatMoney(
                data.metrics
                  .netRevenueMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper="Gross revenue minus classified leakage"
              metric={
                data.metrics
                  .netRevenueMinor
              }
              icon={
                WalletCards
              }
              iconClass="bg-blue-500/10 text-blue-600"
            />

            <MetricCard
              index={3}
              label="Leakage Rate"
              value={`${data.metrics.leakageRate.value.toFixed(
                2
              )}%`}
              helper={`${formatNumber(
                data.metrics
                  .leakageEventCount
                  .value
              )} leakage events`}
              metric={
                data.metrics
                  .leakageRate
              }
              icon={
                ReceiptText
              }
              iconClass="bg-amber-500/10 text-amber-600"
              inverse
            />
          </section>

          {/* DATA QUALITY */}

          <section className="grid gap-4 sm:grid-cols-3">
            <QualityCard
              label="Classified events"
              value={formatNumber(
                data.quality
                  .classifiedEventCount
              )}
            />

            <QualityCard
              label="Unclassified events"
              value={formatNumber(
                data.quality
                  .unclassifiedEventCount
              )}
            />

            <QualityCard
              label="Metadata coverage"
              value={`${data.quality.metadataCoverage.toFixed(
                2
              )}%`}
            />
          </section>


          {/* =================================================
              REVENUE COMPOSITION — REAL LEDGER DATA ONLY
          ================================================= */}

          <Panel
            title="Revenue Composition"
            description="Inner pie shows positive classified revenue by RevenueEvent kind. Outer ring shows classified leakage by kind."
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
                <BarChart3 className="h-3.5 w-3.5" />
                Real ledger mix
              </span>
            }
          >
            <RevenueCompositionChart
              kinds={
                data.kinds
              }
              leakage={
                data.leakage
              }
              currency={
                data.filters
                  .currency
              }
            />
          </Panel>

          {/* =================================================
              REVENUE GRAPH — REAL API TREND DATA ONLY
          ================================================= */}

          <Panel
            tone="dark"
            title="Revenue Performance Graph"
            description="Gross revenue, classified leakage and net revenue across the selected period."
            action={
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    label:
                      "Gross revenue",

                    color:
                      THEME.emerald,
                  },

                  {
                    label:
                      "Leakage",

                    color:
                      THEME.red,
                  },

                  {
                    label:
                      "Net revenue",

                    color:
                      THEME.cyan,
                  },
                ].map(
                  (
                    item
                  ) => (
                    <span
                      key={
                        item.label
                      }
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-slate-300"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      {
                        item.label
                      }
                    </span>
                  )
                )}
              </div>
            }
          >
            {chartData.some(
              (
                item
              ) =>
                item.gross !==
                  0 ||
                item.leakage !==
                  0 ||
                item.net !==
                  0
            ) ? (
              <div className="h-[390px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={
                      chartData
                    }
                    margin={{
                      top:
                        14,

                      right:
                        12,

                      left:
                        -18,

                      bottom:
                        0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="grossRevenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={
                            THEME.emerald
                          }
                          stopOpacity={
                            0.45
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor={
                            THEME.emerald
                          }
                          stopOpacity={
                            0
                          }
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={
                        false
                      }
                      strokeDasharray="4 4"
                      stroke="rgba(255,255,255,0.09)"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize:
                          10,

                        fill:
                          THEME.axis,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      minTickGap={
                        22
                      }
                    />

                    <YAxis
                      tick={{
                        fontSize:
                          10,

                        fill:
                          THEME.axis,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <Tooltip
                      content={
                        <RevenueChartTooltip
                          currency={
                            data.filters
                              .currency
                          }
                        />
                      }
                      cursor={{
                        stroke:
                          "rgba(20,184,166,0.35)",

                        strokeWidth:
                          2,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="gross"
                      name="Gross revenue"
                      stroke={
                        THEME.emerald
                      }
                      strokeWidth={
                        3
                      }
                      fill="url(#grossRevenueGradient)"
                      isAnimationActive
                      animationDuration={
                        1300
                      }
                    />

                    <Bar
                      dataKey="leakage"
                      name="Leakage"
                      fill={
                        THEME.red
                      }
                      maxBarSize={
                        16
                      }
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      isAnimationActive
                      animationBegin={
                        180
                      }
                      animationDuration={
                        1050
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net revenue"
                      stroke={
                        THEME.cyan
                      }
                      strokeWidth={
                        3
                      }
                      dot={
                        false
                      }
                      activeDot={{
                        r:
                          5,

                        strokeWidth:
                          2,
                      }}
                      isAnimationActive
                      animationBegin={
                        320
                      }
                      animationDuration={
                        1200
                      }
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                dark
                message="No classified revenue activity exists for the selected filters."
              />
            )}
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              className="min-h-[420px]"
              title="Revenue Mix"
              description="Revenue and leakage contribution by RevenueEvent kind."
            >
              {data.kinds.length ? (
                <div className="space-y-3">
                  {data.kinds.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.kind
                        }
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-extrabold">
                              {humanize(
                                item.kind
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {formatNumber(
                                item.eventCount
                              )}{" "}
                              events
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-sm font-black ${
                                item.netMinor <
                                0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatMoney(
                                item.netMinor,
                                data.filters
                                  .currency,
                                true
                              )}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-muted-foreground">
                              {item.percentageOfNetRevenue.toFixed(
                                1
                              )}
                              % share
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <Empty message="No revenue-event mix is available." />
              )}
            </Panel>

            <Panel
              className="min-h-[420px]"
              title="Revenue Leakage"
              description="Value lost through refunds, fee waivers, gateway reversals and micro-fee adjustments."
            >
              {data.leakage.length ? (
                <div className="space-y-4">
                  {data.leakage.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.kind
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-extrabold">
                              {humanize(
                                item.kind
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {formatNumber(
                                item.count
                              )}{" "}
                              events
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-red-600">
                              {formatMoney(
                                item.amountMinor,
                                data.filters
                                  .currency,
                                true
                              )}
                            </p>

                            <p className="text-[9px] font-bold text-muted-foreground">
                              {item.percentage.toFixed(
                                2
                              )}
                              %
                            </p>
                          </div>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  item.percentage
                                )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />

                  <p className="mt-3 text-sm font-extrabold">
                    No classified leakage
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    No refund, waiver, reversal or micro-fee adjustment events match the current filters.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          {/* SOURCES */}

          <Panel
            title="Operational Revenue Sources"
            description="Non-PII revenue attribution using RevenueEvent metadata.source."
          >
            {data.sources.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.sources.map(
                  (
                    source
                  ) => (
                    <div
                      key={
                        source.source
                      }
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="text-xs font-extrabold">
                        {humanize(
                          source.source
                        )}
                      </p>

                      <p
                        className={`mt-3 text-xl font-black ${
                          source.netRevenueMinor <
                          0
                            ? "text-red-600"
                            : "text-foreground"
                        }`}
                      >
                        {formatMoney(
                          source.netRevenueMinor,
                          data.filters
                            .currency,
                          true
                        )}
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatNumber(
                          source.eventCount
                        )}{" "}
                        events ·{" "}
                        {source.percentage.toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <Empty message="No operational source metadata is available." />
            )}
          </Panel>

          {/* =================================================
              REVENUE INTELLIGENCE
          ================================================= */}

          <Panel
            tone="dark"
            title="Revenue Intelligence"
            description="Explainable growth, leakage, concentration and data-quality signals from recorded ledger activity."
            action={
              <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                {data.insights.length} signals
              </span>
            }
          >
            {data.insights.length >
            0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
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
              <Empty
                dark
                message="No deterministic revenue insight was generated for the selected filters."
              />
            )}
          </Panel>

          {/* READ ONLY */}

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
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Read-only revenue intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts can inspect aggregated revenue performance and leakage,
                  but cannot change fee policies, waive fees, modify transactions,
                  or open financial mutations from this workspace.
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
   QUALITY CARD
========================================================= */

function QualityCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>
    </div>
  );
}
