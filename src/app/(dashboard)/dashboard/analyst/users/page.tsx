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
  Check,
  ChevronDown,
  CircleCheckBig,
  CircleUserRound,
  Gauge,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserRoundX,
  Users,
  WalletCards,
  WalletMinimal,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
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
  getAnalystUserAnalytics,
  type AnalystInsightSeverity,
  type AnalystPulseStatus,
  type AnalystRange,
  type AnalystUserAnalyticsData,
  type AnalystUserInsight,
  type AnalystUserMetric,
  type AnalystUserTrendPoint,
} from "@/lib/api/analystApi";

/* =========================================================
   TOKENS
========================================================= */

const COLORS = {
  navy: "#10283F",
  deep: "#10273A",
  teal: "#0B4F52",
  tealSoft: "#0F766E",
  cyan: "#22C7B8",
  sky: "#38BDF8",
  canvas: "#F4F8F7",
  grid: "#DCE7E5",
  muted: "#64778A",
  red: "#DC2626",
  amber: "#D97706",
  emerald: "#059669",
  white: "#FFFFFF",
};

const RANGE_OPTIONS: ReadonlyArray<{
  value: AnalystRange;
  label: string;
}> = [
  {
    value: "24h",
    label: "24 hours",
  },
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "90d",
    label: "90 days",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.99,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.46,
      ease: [
        0.22,
        1,
        0.36,
        1,
      ] as const,
    },
  },
};

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-US"
  ).format(value);
}

function formatCompact(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(value);
}

function formatPercent(
  value: number
): string {
  return `${value.toFixed(2)}%`;
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function formatBucketShort(
  value: string
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

  return date.toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    }
  );
}

function readableLabel(
  value: string
): string {
  return value
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

/* =========================================================
   STATUS / SEMANTIC HELPERS
========================================================= */

function statusConfig(
  status: AnalystPulseStatus
): {
  className: string;
  dotClassName: string;
  label: string;
} {
  switch (status) {
    case "critical":
      return {
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300",
        dotClassName:
          "bg-red-500",
        label:
          "Critical",
      };

    case "attention":
      return {
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300",
        dotClassName:
          "bg-amber-500",
        label:
          "Attention",
      };

    case "healthy":
      return {
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300",
        dotClassName:
          "bg-emerald-500",
        label:
          "Healthy",
      };
  }
}

function severityClasses(
  severity: AnalystInsightSeverity
): string {
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
      return "border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/25";
  }
}

function metricChange(
  metric: AnalystUserMetric
): string {
  if (
    metric.changePercent ===
    null
  ) {
    return metric.value === 0
      ? "No change"
      : "New activity";
  }

  if (
    metric.changePercent ===
    0
  ) {
    return "No change";
  }

  const prefix =
    metric.changePercent > 0
      ? "+"
      : "";

  return `${prefix}${metric.changePercent.toFixed(
    2
  )}% vs previous`;
}

function metricTrend(
  metric: AnalystUserMetric,
  intent:
    | "higher-better"
    | "lower-better"
    | "neutral" =
    "higher-better"
): {
  className: string;
  Icon: LucideIcon;
} {
  const change =
    metric.changePercent;

  if (
    change === null ||
    change === 0 ||
    intent === "neutral"
  ) {
    return {
      className:
        "text-slate-500 dark:text-slate-400",
      Icon:
        TrendingUp,
    };
  }

  const good =
    intent === "higher-better"
      ? change > 0
      : change < 0;

  return good
    ? {
        className:
          "text-emerald-600 dark:text-emerald-400",
        Icon:
          change > 0
            ? ArrowUpRight
            : ArrowDownRight,
      }
    : {
        className:
          "text-red-600 dark:text-red-400",
        Icon:
          change > 0
            ? ArrowUpRight
            : ArrowDownRight,
      };
}

/* =========================================================
   SHARED UI
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
      variants={
        itemVariants
      }
      className={`
        min-w-0
        rounded-[26px]
        border
        border-[#DCE7E5]
        bg-white/95
        shadow-[0_14px_42px_rgba(23,50,77,0.055)]
        ring-1
        ring-white/70
        backdrop-blur-xl
        transition-[border-color,box-shadow,transform]
        duration-300

        hover:border-[#B9E8E1]
        hover:shadow-[0_18px_48px_rgba(11,79,82,0.075)]

        dark:border-slate-800
        dark:bg-slate-950/95
        dark:ring-white/5

        ${className}
      `}
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
  trailing,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B4F52]/[0.08] text-[#0B4F52] dark:bg-cyan-400/[0.08] dark:text-cyan-200">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}

        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0B4F52] dark:text-cyan-300">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-0.5 break-words text-lg font-black tracking-[-0.025em] text-[#17324D] dark:text-white sm:text-xl">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {trailing ? (
        <div className="min-w-0 shrink-0">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: AnalystPulseStatus;
}) {
  const config =
    statusConfig(status);

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-bold

        ${config.className}
      `}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`
            absolute
            inline-flex
            h-full
            w-full
            animate-ping
            rounded-full
            opacity-50

            ${config.dotClassName}
          `}
        />

        <span
          className={`
            relative
            inline-flex
            h-2
            w-2
            rounded-full

            ${config.dotClassName}
          `}
        />
      </span>

      {config.label}
    </span>
  );
}

interface AnalystSelectOption {
  value: AnalystRange;
  label: string;
}

function AnalystSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: AnalystRange;
  options:
    ReadonlyArray<AnalystSelectOption>;
  onChange:
    (
      value: AnalystRange
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    options.find(
      (option) =>
        option.value ===
        value
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
        event.key ===
        "Escape"
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
            "30 days"
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
                ? "rotate-180 bg-[#0B4F52]/[0.12]"
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
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B4F52] text-white shadow-[0_5px_14px_rgba(11,79,82,.20)] dark:bg-cyan-700">
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

function MetricCard({
  label,
  value,
  metric,
  icon: Icon,
  intent =
    "higher-better",
}: {
  label: string;
  value: string;
  metric: AnalystUserMetric;
  icon: LucideIcon;
  intent?:
    | "higher-better"
    | "lower-better"
    | "neutral";
}) {
  const trend =
    metricTrend(
      metric,
      intent
    );

  const TrendIcon =
    trend.Icon;

  return (
    <motion.div
      variants={
        itemVariants
      }
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.18,
      }}
      className="
        group
        relative
        min-w-0
        overflow-hidden
        rounded-[24px]
        border
        border-[#DCE7E5]
        bg-white/95
        p-5
        shadow-[0_10px_30px_rgba(23,50,77,0.05)]
        ring-1
        ring-white/80
        backdrop-blur-xl
        transition-[border-color,box-shadow]
        duration-300

        hover:border-[#B9E8E1]
        hover:shadow-[0_18px_46px_rgba(11,79,82,0.09)]

        dark:border-slate-800
        dark:bg-slate-950/95
        dark:ring-white/5
      "
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10283F_0%,#0B4F52_50%,#22C7B8_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#22C7B8]/10 blur-3xl"
      />

      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-all text-2xl font-black tracking-tight text-[#17324D] dark:text-white sm:break-words">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B4F52]/[0.08] text-[#0B4F52] transition-transform duration-300 group-hover:scale-105 dark:bg-cyan-400/[0.08] dark:text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`
            inline-flex
            min-w-0
            items-center
            gap-1
            break-words
            text-xs
            font-bold

            ${trend.className}
          `}
        >
          <TrendIcon className="h-3.5 w-3.5 shrink-0" />
          {metricChange(
            metric
          )}
        </span>
      </div>
    </motion.div>
  );
}

function ProgressRow({
  label,
  value,
  helper,
  tone =
    "teal",
}: {
  label: string;
  value: number;
  helper?: string;
  tone?:
    | "teal"
    | "cyan"
    | "navy"
    | "red";
}) {
  const width =
    Math.max(
      0,
      Math.min(
        100,
        value
      )
    );

  const fillClass = {
    teal:
      "bg-[#0B4F52]",
    cyan:
      "bg-[#22C7B8]",
    navy:
      "bg-[#10283F]",
    red:
      "bg-red-500",
  }[tone];

  return (
    <div className="min-w-0">
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-600 dark:text-slate-300">
            {label}
          </p>

          {helper ? (
            <p className="mt-0.5 break-words text-[11px] text-slate-400 dark:text-slate-500">
              {helper}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 font-black tabular-nums text-[#17324D] dark:text-white">
          {formatPercent(
            value
          )}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width:
              `${width}%`,
          }}
          transition={{
            duration: 0.7,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className={`
            h-full
            rounded-full

            ${fillClass}
          `}
        />
      </div>
    </div>
  );
}

type BreakdownListItem = {
  count: number;
  percentage: number;
  status?: string;
  risk?: string;
};

function BreakdownList({
  items,
  labelKey,
  emptyLabel,
  tone =
    "teal",
}: {
  items: ReadonlyArray<BreakdownListItem>;
  labelKey:
    | "status"
    | "risk";
  emptyLabel: string;
  tone?:
    | "teal"
    | "cyan"
    | "navy"
    | "red";
}) {
  if (
    items.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D4E5E2] p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  const fillClass = {
    teal:
      "bg-[#0B4F52]",
    cyan:
      "bg-[#22C7B8]",
    navy:
      "bg-[#10283F]",
    red:
      "bg-red-500",
  }[tone];

  return (
    <div className="space-y-4">
      {items.map(
        (
          item,
          index
        ) => {
          const label =
            String(
              item[
                labelKey
              ] ?? ""
            );

          return (
            <motion.div
              key={`${label}-${index}`}
              initial={{
                opacity: 0,
                x: -7,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay:
                  index *
                  0.03,
              }}
              className="min-w-0"
            >
              <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-[#17324D] dark:text-slate-100">
                    {readableLabel(
                      label
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(
                      item.count
                    )}{" "}
                    records
                  </p>
                </div>

                <span className="shrink-0 text-sm font-black tabular-nums text-[#17324D] dark:text-white">
                  {formatPercent(
                    item.percentage
                  )}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      `${Math.max(
                        0,
                        Math.min(
                          100,
                          item.percentage
                        )
                      )}%`,
                  }}
                  transition={{
                    duration:
                      0.65,
                    delay:
                      index *
                      0.03,
                  }}
                  className={`
                    h-full
                    rounded-full

                    ${fillClass}
                  `}
                />
              </div>
            </motion.div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   CHART
========================================================= */

interface UserChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}

function UserChartTooltip({
  active,
  payload,
  label,
}: UserChartTooltipProps) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="max-w-[260px] rounded-2xl border border-[#CDEAE5] bg-white/95 p-3 shadow-[0_16px_42px_rgba(23,50,77,0.14)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95">
      <p className="mb-2 break-words text-xs font-bold text-slate-500 dark:text-slate-400">
        {
          label
            ? formatBucketShort(
                label
              )
            : ""
        }
      </p>

      <div className="space-y-1.5">
        {payload.map(
          (
            entry
          ) => (
            <div
              key={
                String(
                  entry.dataKey
                )
              }
              className="flex min-w-0 items-center justify-between gap-5 text-xs"
            >
              <span className="inline-flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      entry.color,
                  }}
                />

                <span className="truncate">
                  {entry.name}
                </span>
              </span>

              <span className="shrink-0 font-black text-[#17324D] dark:text-white">
                {formatNumber(
                  Number(
                    entry.value ??
                      0
                  )
                )}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function UserActivityChart({
  points,
}: {
  points:
    AnalystUserTrendPoint[];
}) {
  if (
    points.length === 0
  ) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#D4E5E2] px-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:h-[320px]">
        No user trend data is available for this period.
      </div>
    );
  }

  return (
    <div className="h-[270px] w-full sm:h-[320px] lg:h-[350px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={
            points
          }
          margin={{
            top: 12,
            right: 8,
            bottom: 4,
            left: -12,
          }}
        >
          <defs>
            <linearGradient
              id="userActiveFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={
                  COLORS.teal
                }
                stopOpacity={
                  0.24
                }
              />

              <stop
                offset="100%"
                stopColor={
                  COLORS.teal
                }
                stopOpacity={
                  0.015
                }
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={
              COLORS.grid
            }
            strokeDasharray="4 6"
            vertical={
              false
            }
          />

          <XAxis
            dataKey="bucket"
            tickFormatter={
              formatBucketShort
            }
            tick={{
              fill:
                COLORS.muted,
              fontSize: 10,
            }}
            axisLine={
              false
            }
            tickLine={
              false
            }
            minTickGap={
              24
            }
          />

          <YAxis
            tickFormatter={
              formatCompact
            }
            tick={{
              fill:
                COLORS.muted,
              fontSize: 10,
            }}
            axisLine={
              false
            }
            tickLine={
              false
            }
            width={
              42
            }
          />

          <Tooltip
            cursor={{
              stroke:
                COLORS.grid,
              strokeWidth:
                1,
            }}
            content={
              <UserChartTooltip />
            }
          />

          <Area
            type="monotone"
            dataKey="activeUsers"
            name="Active users"
            stroke={
              COLORS.teal
            }
            fill="url(#userActiveFill)"
            strokeWidth={
              2.5
            }
            activeDot={{
              r: 4,
              fill:
                COLORS.teal,
              strokeWidth:
                0,
            }}
          />

          <Line
            type="monotone"
            dataKey="newUsers"
            name="New users"
            stroke={
              COLORS.sky
            }
            strokeWidth={
              2.1
            }
            dot={
              false
            }
            activeDot={{
              r: 4,
              fill:
                COLORS.sky,
              strokeWidth:
                0,
            }}
          />

          <Line
            type="monotone"
            dataKey="highRiskTransactionCount"
            name="High-risk transactions"
            stroke={
              COLORS.red
            }
            strokeWidth={
              1.8
            }
            dot={
              false
            }
            activeDot={{
              r: 4,
              fill:
                COLORS.red,
              strokeWidth:
                0,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function InsightCard({
  insight,
}: {
  insight:
    AnalystUserInsight;
}) {
  return (
    <motion.div
      variants={
        itemVariants
      }
      className={`
        min-w-0
        rounded-[22px]
        border
        p-4
        sm:p-5

        ${severityClasses(
          insight.severity
        )}
      `}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.04] bg-white/70 text-[#0B4F52] shadow-sm dark:border-white/[0.06] dark:bg-white/[0.06] dark:text-cyan-200">
          {insight.severity ===
          "critical" ? (
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-300" />
          ) : insight.severity ===
            "positive" ? (
            <CircleCheckBig className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="break-words text-sm font-black text-[#17324D] dark:text-white">
              {
                insight.title
              }
            </p>

            <span className="rounded-full border border-black/[0.06] bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300">
              {
                insight.severity
              }
            </span>
          </div>

          <p className="mt-2 break-words text-xs leading-5 text-slate-600 dark:text-slate-300">
            {
              insight.description
            }
          </p>

          <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-black/[0.05] bg-white/55 p-3 dark:border-white/[0.06] dark:bg-white/[0.035]">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Evidence
              </p>

              <p className="mt-1 break-words text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                {
                  insight.evidence
                }
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-black/[0.05] bg-white/55 p-3 dark:border-white/[0.06] dark:bg-white/[0.035]">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Recommended review
              </p>

              <p className="mt-1 break-words text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                {
                  insight.recommendedReview
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F8F7] p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
        <div className="h-56 animate-pulse rounded-[30px] bg-[#DDEAE7]/85 dark:bg-slate-800" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length:
              8,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-36 animate-pulse rounded-[22px] bg-[#DDEAE7]/85 dark:bg-slate-800"
              />
            )
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <div className="h-[390px] animate-pulse rounded-[24px] bg-[#DDEAE7]/85 dark:bg-slate-800" />
          <div className="h-[390px] animate-pulse rounded-[24px] bg-[#DDEAE7]/85 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystUsersPage() {
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
    data,
    setData,
  ] =
    useState<AnalystUserAnalyticsData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const controller =
      new AbortController();

    setLoading(true);
    setError(null);

    void getAnalystUserAnalytics(
      range,
      controller.signal
    )
      .then(
        (
          response
        ) => {
          setData(
            response
          );
        }
      )
      .catch(
        (
          requestError:
            unknown
        ) => {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load user analytics."
          );
        }
      )
      .finally(
        () => {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      controller.abort();
  }, [
    isAnalystRole,
    range,
    refreshKey,
  ]);

  const highPriorityInsights =
    useMemo(
      () =>
        data?.insights.filter(
          (
            insight
          ) =>
            insight.severity ===
              "critical" ||
            insight.severity ===
              "high"
        ).length ??
        0,
      [
        data?.insights,
      ]
    );

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
            Users Analytics is available only to analyst accounts.
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
      <DashboardSkeleton />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F8F7] text-[#17324D] dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[17%] top-20 h-80 w-80 rounded-full bg-[#5EEAD4]/10 blur-3xl dark:opacity-30"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-90px] right-[7%] h-96 w-96 rounded-full bg-[#7DD3FC]/10 blur-3xl dark:opacity-20"
      />

      <motion.main
        variants={
          containerVariants
        }
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1500px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8"
      >
        {/* ===================================================
            HERO
        ==================================================== */}

        <motion.section
          variants={
            itemVariants
          }
          className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,#10283F_0%,#0B4F52_48%,#10273A_100%)] p-5 text-white shadow-[0_28px_80px_rgba(9,78,80,0.22)] sm:p-7 lg:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize:
                "44px 44px",
              maskImage:
                "linear-gradient(to bottom, black, transparent 82%)",
            }}
          />

          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                0,
                18,
                0,
              ],
              y: [
                0,
                -14,
                0,
              ],
              scale: [
                1,
                1.08,
                1,
              ],
            }}
            transition={{
              duration:
                10,
              repeat:
                Infinity,
              ease:
                "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#5EEAD4]/[0.22] blur-3xl"
          />

          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                0,
                -14,
                0,
              ],
              y: [
                0,
                12,
                0,
              ],
            }}
            transition={{
              duration:
                12,
              repeat:
                Infinity,
              ease:
                "easeInOut",
            }}
            className="pointer-events-none absolute bottom-[-120px] left-[25%] h-72 w-72 rounded-full bg-[#38BDF8]/[0.18] blur-3xl"
          />

          <div className="relative z-10 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0 max-w-3xl">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.09] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur">
                <Users className="h-3.5 w-3.5 shrink-0 text-[#7CEFE0]" />

                <span className="truncate">
                  User intelligence
                </span>
              </div>

              <h1 className="mt-4 break-words text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Users Analytics
              </h1>

              <p className="mt-3 max-w-2xl break-words text-sm leading-7 text-white/[0.72] sm:text-[15px]">
                Read-only analytics for Coffer account growth, activity,
                KYC coverage, wallet adoption, transaction participation
                and aggregate user risk.
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
              {data ? (
                <StatusPill
                  status={
                    data.status
                  }
                />
              ) : null}

              <motion.button
                type="button"
                onClick={() => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setRefreshKey(
                    (current) =>
                      current + 1
                  );
                }}
                disabled={
                  loading
                }
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale:
                    0.985,
                }}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.10] px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  className={`
                    h-4
                    w-4

                    ${
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  `}
                />

                {
                  loading
                    ? "Refreshing"
                    : "Refresh"
                }
              </motion.button>
            </div>
          </div>

          {data ? (
            <div className="relative z-10 mt-6 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label:
                    "Total users",
                  value:
                    formatNumber(
                      data.population
                        .totalUsers
                    ),
                },
                {
                  label:
                    "Wallet coverage",
                  value:
                    formatPercent(
                      data.population
                        .walletCoverage
                    ),
                },
                {
                  label:
                    "KYC verified",
                  value:
                    formatPercent(
                      data.population
                        .kycVerificationCoverage
                    ),
                },
                {
                  label:
                    "Priority insights",
                  value:
                    formatNumber(
                      highPriorityInsights
                    ),
                },
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.label
                    }
                    className="min-w-0 rounded-2xl border border-white/[0.12] bg-white/[0.085] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
                  >
                    <p className="break-words text-[10px] font-black uppercase tracking-[0.14em] text-white/[0.55]">
                      {
                        item.label
                      }
                    </p>

                    <p className="mt-1.5 break-words text-base font-black text-white">
                      {
                        item.value
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          ) : null}
        </motion.section>

        {/* ===================================================
            FILTER
        ==================================================== */}

        <Surface className="relative z-30 overflow-visible p-4 sm:p-5">
          <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
            <AnalystSelect
              label="Analysis period"
              value={
                range
              }
              options={
                RANGE_OPTIONS
              }
              onChange={(nextRange) => {
                if (!isAnalystRole) {
                  return;
                }

                setRange(nextRange);
              }}
            />

            <div className="min-w-0 rounded-[15px] border border-[#DCE7E5] bg-[#F8FBFA] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0B4F52] dark:text-cyan-300">
                Analyst scope
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                This page is aggregate and read-only. It does not expose
                personal user records or mutation controls.
              </p>
            </div>
          </div>
        </Surface>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error ? (
          <motion.div
            variants={
              itemVariants
            }
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-black">
                User analytics unavailable
              </p>

              <p className="mt-1 break-words opacity-90">
                {error}
              </p>
            </div>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() =>
                setError(
                  null
                )
              }
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}

        {data ? (
          <>
            {/* ===================================================
                KPI GRID
            ==================================================== */}

            <motion.div
              variants={
                containerVariants
              }
              className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="New users"
                value={
                  formatNumber(
                    data.metrics
                      .newUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .newUsers
                }
                icon={
                  CircleUserRound
                }
              />

              <MetricCard
                label="Active users"
                value={
                  formatNumber(
                    data.metrics
                      .activeUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .activeUsers
                }
                icon={
                  UserCheck
                }
              />

              <MetricCard
                label="Transaction users"
                value={
                  formatNumber(
                    data.metrics
                      .transactionUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .transactionUsers
                }
                icon={
                  Activity
                }
              />

              <MetricCard
                label="High-risk users"
                value={
                  formatNumber(
                    data.metrics
                      .highRiskUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .highRiskUsers
                }
                icon={
                  ShieldAlert
                }
                intent="lower-better"
              />

              <MetricCard
                label="Transactions"
                value={
                  formatNumber(
                    data.metrics
                      .transactionCount
                      .value
                  )
                }
                metric={
                  data.metrics
                    .transactionCount
                }
                icon={
                  TrendingUp
                }
                intent="neutral"
              />

              <MetricCard
                label="Failed transactions"
                value={
                  formatNumber(
                    data.metrics
                      .failedTransactionCount
                      .value
                  )
                }
                metric={
                  data.metrics
                    .failedTransactionCount
                }
                icon={
                  UserRoundX
                }
                intent="lower-better"
              />

              <MetricCard
                label="Budget users"
                value={
                  formatNumber(
                    data.metrics
                      .budgetUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .budgetUsers
                }
                icon={
                  WalletMinimal
                }
              />

              <MetricCard
                label="Cash-flow users"
                value={
                  formatNumber(
                    data.metrics
                      .cashFlowUsers
                      .value
                  )
                }
                metric={
                  data.metrics
                    .cashFlowUsers
                }
                icon={
                  Gauge
                }
              />
            </motion.div>

            {/* ===================================================
                TREND + ENGAGEMENT
            ==================================================== */}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)] xl:items-stretch">
              <Surface className="h-full p-4 sm:p-5 lg:p-6">
                <SectionHeading
                  eyebrow="Activity trend"
                  title="User growth & participation"
                  description="New users, active users and aggregate high-risk transaction activity across the selected period."
                  icon={
                    Activity
                  }
                  trailing={
                    <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#0B4F52]" />
                        Active
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />
                        New
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        High risk
                      </span>
                    </div>
                  }
                />

                <div className="mt-5 min-w-0">
                  <UserActivityChart
                    points={
                      data.trend
                    }
                  />
                </div>
              </Surface>

              <Surface className="h-full p-4 sm:p-5 lg:p-6">
                <SectionHeading
                  eyebrow="Engagement"
                  title="User participation"
                  description="Coverage and adoption ratios for core Coffer user activity."
                  icon={
                    Gauge
                  }
                />

                <div className="mt-5 space-y-5">
                  <ProgressRow
                    label="Active rate"
                    value={
                      data.engagement
                        .activeRate
                    }
                    tone="teal"
                  />

                  <ProgressRow
                    label="Transaction participation"
                    value={
                      data.engagement
                        .transactionParticipationRate
                    }
                    tone="cyan"
                  />

                  <ProgressRow
                    label="Budget adoption"
                    value={
                      data.engagement
                        .budgetAdoptionRate
                    }
                    tone="navy"
                  />

                  <ProgressRow
                    label="Cash-flow adoption"
                    value={
                      data.engagement
                        .cashFlowAdoptionRate
                    }
                    tone="teal"
                  />

                  <ProgressRow
                    label="Failed transaction rate"
                    value={
                      data.engagement
                        .failedTransactionRate
                    }
                    tone="red"
                  />
                </div>
              </Surface>
            </div>

            {/* ===================================================
                POPULATION
            ==================================================== */}

            <Surface className="p-4 sm:p-5 lg:p-6">
              <SectionHeading
                eyebrow="Population"
                title="Account & wallet coverage"
                description="Read-only platform population totals and aggregate verification coverage."
                icon={
                  Users
                }
              />

              <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  {
                    label:
                      "Total users",
                    value:
                      formatNumber(
                        data.population
                          .totalUsers
                      ),
                    icon:
                      Users,
                  },
                  {
                    label:
                      "Total wallets",
                    value:
                      formatNumber(
                        data.population
                          .totalWallets
                      ),
                    icon:
                      WalletCards,
                  },
                  {
                    label:
                      "Active wallets",
                    value:
                      formatNumber(
                        data.population
                          .activeWallets
                      ),
                    icon:
                      WalletMinimal,
                  },
                  {
                    label:
                      "Verified users",
                    value:
                      formatNumber(
                        data.population
                          .verifiedUsers
                      ),
                    icon:
                      BadgeCheck,
                  },
                  {
                    label:
                      "Pending KYC",
                    value:
                      formatNumber(
                        data.population
                          .pendingKycUsers
                      ),
                    icon:
                      ShieldCheck,
                  },
                  {
                    label:
                      "Rejected KYC",
                    value:
                      formatNumber(
                        data.population
                          .rejectedKycUsers
                      ),
                    icon:
                      ShieldAlert,
                  },
                ].map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <motion.div
                        key={
                          item.label
                        }
                        whileHover={{
                          y: -2,
                        }}
                        className="min-w-0 rounded-2xl border border-[#DCE7E5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFA_100%)] p-4 dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {
                                item.label
                              }
                            </p>

                            <p className="mt-2 break-words text-xl font-black text-[#17324D] dark:text-white">
                              {
                                item.value
                              }
                            </p>
                          </div>

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B4F52]/[0.08] text-[#0B4F52] dark:bg-cyan-400/[0.08] dark:text-cyan-200">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>

              <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-3">
                <ProgressRow
                  label="Wallet coverage"
                  value={
                    data.population
                      .walletCoverage
                  }
                  helper="Users with an associated Coffer wallet"
                  tone="teal"
                />

                <ProgressRow
                  label="Active wallet coverage"
                  value={
                    data.population
                      .activeWalletCoverage
                  }
                  helper="Population covered by active wallets"
                  tone="cyan"
                />

                <ProgressRow
                  label="KYC verification coverage"
                  value={
                    data.population
                      .kycVerificationCoverage
                  }
                  helper="Population with verified KYC state"
                  tone="navy"
                />
              </div>
            </Surface>

            {/* ===================================================
                BREAKDOWNS
            ==================================================== */}

            <div className="grid min-w-0 gap-5 xl:grid-cols-3 xl:items-stretch">
              <Surface className="h-full p-4 sm:p-5">
                <SectionHeading
                  eyebrow="KYC"
                  title="Verification status"
                  description="Aggregate KYC state across Coffer users."
                  icon={
                    BadgeCheck
                  }
                />

                <div className="mt-5">
                  <BreakdownList
                    items={
                      data.kycBreakdown
                    }
                    labelKey="status"
                    emptyLabel="No KYC breakdown is available."
                    tone="teal"
                  />
                </div>
              </Surface>

              <Surface className="h-full p-4 sm:p-5">
                <SectionHeading
                  eyebrow="Wallets"
                  title="Wallet status"
                  description="Aggregate wallet state connected to the user population."
                  icon={
                    WalletCards
                  }
                />

                <div className="mt-5">
                  <BreakdownList
                    items={
                      data.walletBreakdown
                    }
                    labelKey="status"
                    emptyLabel="No wallet breakdown is available."
                    tone="cyan"
                  />
                </div>
              </Surface>

              <Surface className="h-full p-4 sm:p-5">
                <SectionHeading
                  eyebrow="Risk"
                  title="User risk signals"
                  description="Aggregate user risk classification from current analytics."
                  icon={
                    ShieldAlert
                  }
                />

                <div className="mt-5">
                  <BreakdownList
                    items={
                      data.riskBreakdown
                    }
                    labelKey="risk"
                    emptyLabel="No risk breakdown is available."
                    tone="red"
                  />
                </div>
              </Surface>
            </div>

            {/* ===================================================
                NOTES
            ==================================================== */}

            <div className="grid min-w-0 gap-5 lg:grid-cols-2">
              <Surface className="h-full p-4 sm:p-5">
                <SectionHeading
                  eyebrow="Scope"
                  title="Analytics coverage"
                  icon={
                    BrainCircuit
                  }
                />

                <p className="mt-4 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {
                    data.scopeNote
                  }
                </p>
              </Surface>

              <Surface className="h-full p-4 sm:p-5">
                <SectionHeading
                  eyebrow="Privacy"
                  title="Read-only privacy boundary"
                  icon={
                    ShieldCheck
                  }
                />

                <p className="mt-4 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {
                    data.privacyNote
                  }
                </p>
              </Surface>
            </div>

            {/* ===================================================
                INSIGHTS
            ==================================================== */}

            <Surface className="p-4 sm:p-5 lg:p-6">
              <SectionHeading
                eyebrow="Deterministic intelligence"
                title="User insights"
                description="Review-only signals generated from the current user analytics scope."
                icon={
                  Sparkles
                }
                trailing={
                  <span className="inline-flex rounded-full border border-[#0B4F52]/15 bg-[#0B4F52]/[0.06] px-3 py-1.5 text-[10px] font-black text-[#0B4F52] dark:border-cyan-500/20 dark:bg-cyan-500/[0.07] dark:text-cyan-200">
                    {formatNumber(
                      data.insights
                        .length
                    )}{" "}
                    signals
                  </span>
                }
              />

              {data.insights.length >
              0 ? (
                <motion.div
                  variants={
                    containerVariants
                  }
                  className="mt-5 grid min-w-0 gap-3 xl:grid-cols-2"
                >
                  {data.insights.map(
                    (
                      insight
                    ) => (
                      <InsightCard
                        key={
                          insight.id
                        }
                        insight={
                          insight
                        }
                      />
                    )
                  )}
                </motion.div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[#D4E5E2] p-8 text-center dark:border-slate-800">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B4F52]/[0.08] text-[#0B4F52] dark:bg-cyan-400/[0.08] dark:text-cyan-200">
                    <CircleCheckBig className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-black text-[#17324D] dark:text-white">
                    No user insights for this period
                  </p>

                  <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">
                    No deterministic review signal was returned by the current analytics scope.
                  </p>
                </div>
              )}
            </Surface>

            {/* ===================================================
                FOOTER META
            ==================================================== */}

            <motion.div
              variants={
                itemVariants
              }
              className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#DCE7E5] bg-white/65 px-4 py-3 text-[11px] text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 break-words">
                Generated:{" "}
                <strong className="font-bold text-slate-700 dark:text-slate-200">
                  {formatDateTime(
                    data.generatedAt
                  )}
                </strong>
              </span>

              <span className="min-w-0 break-words sm:text-right">
                Range:{" "}
                <strong className="font-bold text-slate-700 dark:text-slate-200">
                  {
                    RANGE_OPTIONS.find(
                      (
                        item
                      ) =>
                        item.value ===
                        range
                    )?.label
                  }
                </strong>
              </span>
            </motion.div>
          </>
        ) : (
          <Surface className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B4F52]/[0.08] text-[#0B4F52] dark:bg-cyan-400/[0.08] dark:text-cyan-200">
              <Users className="h-6 w-6" />
            </div>

            <p className="mt-4 text-base font-black text-[#17324D] dark:text-white">
              No user analytics loaded
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Refresh the page or verify that the analyst user analytics endpoint is available.
            </p>
          </Surface>
        )}
      </motion.main>
    </div>
  );
}
