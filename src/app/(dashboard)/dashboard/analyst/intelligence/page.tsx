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
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  CreditCard,
  ChevronDown,
  Clock3,
  DatabaseZap,
  Eye,
  Filter,
  Gauge,
  Layers3,
  Radar,
  RefreshCcw,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  WalletCards,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
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
  getAnalystIntelligence,
  type AnalystInsightCategoryKey,
  type AnalystInsightSeverity,
  type AnalystIntelligenceCategory,
  type AnalystIntelligenceData,
  type AnalystIntelligenceSeverity,
  type AnalystIntelligenceSignal,
  type AnalystMode,
  type AnalystRange,
} from "@/lib/api/analystApi";

/* =========================================================
   DESIGN TOKENS
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

const CATEGORY_COLORS: Record<
  AnalystInsightCategoryKey,
  string
> = {
  payments: OCEAN.sky,
  revenue: OCEAN.emerald,
  refunds: OCEAN.amber,
  disputes: "#F97316",
  risk: OCEAN.red,
  growth: OCEAN.cyan,
  data_quality: OCEAN.violet,
};

/* =========================================================
   OPTIONS
========================================================= */

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const RANGE_OPTIONS: Array<
  SelectOption<AnalystRange>
> = [
  {
    value: "24h",
    label: "Last 24 hours",
    description: "Hourly operating view",
  },
  {
    value: "7d",
    label: "Last 7 days",
    description: "Short-term movement",
  },
  {
    value: "30d",
    label: "Last 30 days",
    description: "Monthly intelligence",
  },
  {
    value: "90d",
    label: "Last 90 days",
    description: "Quarterly pattern",
  },
];

const MODE_OPTIONS: Array<
  SelectOption<AnalystMode>
> = [
  {
    value: "all",
    label: "All modes",
    description: "Live + test activity",
  },
  {
    value: "live",
    label: "Live only",
    description: "Production traffic",
  },
  {
    value: "test",
    label: "Test only",
    description: "Sandbox traffic",
  },
];

const SEVERITY_OPTIONS: Array<
  SelectOption<AnalystIntelligenceSeverity>
> = [
  {
    value: "all",
    label: "All severities",
    description: "Every matched signal",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Immediate review",
  },
  {
    value: "high",
    label: "High",
    description: "High priority",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs attention",
  },
  {
    value: "info",
    label: "Information",
    description: "Contextual signal",
  },
  {
    value: "positive",
    label: "Positive",
    description: "Healthy movement",
  },
];

const CATEGORY_OPTIONS: Array<
  SelectOption<AnalystIntelligenceCategory>
> = [
  {
    value: "all",
    label: "All categories",
    description: "Whole platform",
  },
  {
    value: "payments",
    label: "Payments",
    description: "Gateway reliability",
  },
  {
    value: "revenue",
    label: "Revenue",
    description: "Fee economics",
  },
  {
    value: "refunds",
    label: "Refunds",
    description: "Refund behavior",
  },
  {
    value: "disputes",
    label: "Disputes",
    description: "Exposure signals",
  },
  {
    value: "risk",
    label: "Risk",
    description: "Risk pressure",
  },
  {
    value: "growth",
    label: "Growth",
    description: "Activity movement",
  },
  {
    value: "data_quality",
    label: "Data quality",
    description: "Coverage & integrity",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(
    value
  );
}

function formatMoney(
  minor: number,
  currency: string,
  compact = false
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
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

function dateTimeText(
  value: string
): string {
  const date = new Date(
    value
  );

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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    date
  );
}

function bucketText(
  value: string,
  range: AnalystRange
): string {
  const date = new Date(
    value.length === 10
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
    range === "24h"
  ) {
    return new Intl.DateTimeFormat(
      "en-BD",
      {
        hour: "numeric",
        hour12: true,
      }
    ).format(
      date
    );
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      month: "short",
      day: "numeric",
    }
  ).format(
    date
  );
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

function categoryStyle(
  category: AnalystInsightCategoryKey
): string {
  switch (
    category
  ) {
    case "payments":
      return "bg-sky-500";

    case "revenue":
      return "bg-emerald-500";

    case "refunds":
      return "bg-amber-500";

    case "disputes":
      return "bg-orange-500";

    case "risk":
      return "bg-red-500";

    case "growth":
      return "bg-cyan-500";

    case "data_quality":
      return "bg-violet-500";

    default:
      return "bg-slate-500";
  }
}

function categoryColor(
  category: AnalystInsightCategoryKey
): string {
  return (
    CATEGORY_COLORS[
      category
    ] ?? OCEAN.tealBright
  );
}

function signalCategoryIcon(
  category: AnalystInsightCategoryKey
): LucideIcon {
  switch (
    category
  ) {
    case "payments":
      return CreditCard;

    case "revenue":
      return BadgeDollarSign;

    case "refunds":
      return RefreshCcw;

    case "disputes":
      return Scale;

    case "risk":
      return ShieldAlert;

    case "growth":
      return TrendingUp;

    case "data_quality":
      return DatabaseZap;

    default:
      return Radar;
  }
}

function optionLabel<T extends string>(
  options: Array<SelectOption<T>>,
  value: T
): string {
  return (
    options.find(
      (
        option
      ) =>
        option.value === value
    )?.label ?? value
  );
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(8px)",
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
      staggerChildren: 0.06,
    },
  },
};

/* =========================================================
   OCEAN PANEL
========================================================= */

function Panel({
  title,
  description,
  action,
  icon:
    Icon,
  children,
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={
        reveal
      }
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      transition={{
        duration: 0.45,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
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

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

type SummaryTone =
  | "ocean"
  | "critical"
  | "attention"
  | "violet";

function summaryTone(
  tone: SummaryTone
): {
  icon: string;
  glow: string;
  line: string;
} {
  switch (
    tone
  ) {
    case "critical":
      return {
        icon:
          "border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400",
        glow:
          "bg-red-500/10",
        line:
          "from-red-400/0 via-red-400/60 to-red-400/0",
      };

    case "attention":
      return {
        icon:
          "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        glow:
          "bg-amber-500/10",
        line:
          "from-amber-400/0 via-amber-400/60 to-amber-400/0",
      };

    case "violet":
      return {
        icon:
          "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400",
        glow:
          "bg-violet-500/10",
        line:
          "from-violet-400/0 via-violet-400/60 to-violet-400/0",
      };

    case "ocean":
    default:
      return {
        icon:
          "border-teal-500/15 bg-teal-500/10 text-teal-700 dark:text-teal-300",
        glow:
          "bg-cyan-500/10",
        line:
          "from-cyan-400/0 via-cyan-400/60 to-cyan-400/0",
      };
  }
}

function SummaryCard({
  label,
  value,
  description,
  icon:
    Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: SummaryTone;
}) {
  const styles =
    summaryTone(
      tone
    );

  return (
    <motion.div
      variants={
        reveal
      }
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
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {description}
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
    </motion.div>
  );
}

/* =========================================================
   CUSTOM DROPDOWN
========================================================= */

function OceanSelect<
  T extends string,
>({
  label,
  value,
  options,
  onChange,
  icon:
    Icon,
}: {
  label: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (
    value: T
  ) => void;
  icon?: LucideIcon;
}) {
  const [
    open,
    setOpen,
  ] = useState(
    false
  );

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const selected =
    options.find(
      (
        option
      ) =>
        option.value === value
    ) ?? options[0];

  useEffect(
    () => {
      function onPointerDown(
        event: PointerEvent
      ) {
        if (
          rootRef.current &&
          !rootRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );
        }
      }

      function onKeyDown(
        event: KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setOpen(
            false
          );
        }
      }

      document.addEventListener(
        "pointerdown",
        onPointerDown
      );

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          onPointerDown
        );

        document.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    []
  );

  return (
    <div
      ref={
        rootRef
      }
      className="relative"
    >
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white/90 px-3.5 text-left shadow-sm outline-none transition duration-200 dark:bg-slate-950/70 ${
          open
            ? "border-teal-500/60 ring-4 ring-teal-500/10"
            : "border-slate-200 hover:border-teal-500/35 dark:border-white/10 dark:hover:border-teal-400/30"
        }`}
      >
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
            <Icon className="h-4 w-4" />
          </span>
        )}

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
            rotate:
              open
                ? 180
                : 0,
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
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#091820]/95"
            role="listbox"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      active
                    }
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
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
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
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
        <DatabaseZap className="h-5 w-5" />
      </div>

      <p className="relative mt-3 text-sm font-black text-slate-900 dark:text-white">
        {title}
      </p>

      <p className="relative mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </motion.div>
  );
}

/* =========================================================
   SIGNAL CARD
========================================================= */

const SEVERITY_STYLE:
  Record<
    AnalystInsightSeverity,
    {
      shell: string;
      icon: string;
      badge: string;
    }
  > = {
    critical: {
      shell:
        "border-red-500/20 bg-gradient-to-br from-red-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
      icon:
        "bg-red-500/10 text-red-600 dark:text-red-400",
      badge:
        "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    },

    high: {
      shell:
        "border-orange-500/20 bg-gradient-to-br from-orange-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
      icon:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      badge:
        "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },

    medium: {
      shell:
        "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
      icon:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      badge:
        "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },

    info: {
      shell:
        "border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
      icon:
        "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      badge:
        "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    },

    positive: {
      shell:
        "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-white to-white dark:via-slate-950 dark:to-slate-950",
      icon:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badge:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  };

function SignalCard({
  signal,
  index,
}: {
  signal: AnalystIntelligenceSignal;
  index: number;
}) {
  const Icon =
    signalCategoryIcon(
      signal.category
    );

  const styles =
    SEVERITY_STYLE[
      signal.severity
    ];

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
        filter: "blur(6px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
        amount: 0.08,
      }}
      transition={{
        duration: 0.38,
        delay:
          Math.min(
            index * 0.035,
            0.25
          ),
      }}
      whileHover={{
        y: -3,
      }}
      className={`group relative w-full overflow-hidden rounded-[22px] border p-4 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.55)] transition ${styles.shell}`}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/35 to-transparent" />

      <div className="relative flex items-start gap-3">
        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          transition={{
            type: "spring",
            stiffness: 340,
            damping: 18,
          }}
          className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />

          <span
            aria-hidden="true"
            className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
              signal.severity === "critical"
                ? "bg-red-500"
                : signal.severity === "high"
                  ? "bg-orange-500"
                  : signal.severity === "medium"
                    ? "bg-amber-500"
                    : signal.severity === "positive"
                      ? "bg-emerald-500"
                      : "bg-cyan-500"
            }`}
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              {signal.title}
            </h3>

            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${styles.badge}`}
            >
              {signal.severity}
            </span>

            <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {humanize(
                signal.category
              )}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {signal.description}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />

                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                  Evidence
                </p>
              </div>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {signal.evidence}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />

                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                  Recommended review
                </p>
              </div>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {signal.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   BASELINE ITEM
========================================================= */

function BaselineItem({
  label,
  value,
  icon:
    Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-teal-500/[0.025] p-4 dark:border-white/10 dark:from-slate-950 dark:to-teal-500/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-base font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition group-hover:scale-105 dark:text-teal-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
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
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="min-w-[170px] rounded-2xl border border-white/10 bg-[#071923]/95 p-3 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300">
        {label}
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map(
          (
            entry,
            index
          ) => (
            <div
              key={`${entry.name ?? "series"}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2 text-[10px] text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      entry.color ??
                      OCEAN.tealBright,
                  }}
                />

                {entry.name}
              </span>

              <span className="text-[10px] font-black text-white">
                {typeof entry.value ===
                "number"
                  ? entry.value.toLocaleString(
                      "en-BD",
                      {
                        maximumFractionDigits: 2,
                      }
                    )
                  : entry.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function IntelligenceLoading() {
  return (
    <div className="flex min-h-[68vh] items-center justify-center">
      <div className="relative text-center">
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
              scale: [
                1,
                1.08,
                1,
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-lg shadow-teal-500/20"
          >
            <BrainCircuit className="h-6 w-6" />
          </motion.div>
        </div>

        <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
          Building intelligence
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Evaluating real platform signals...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystIntelligencePage() {
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

     Only role=analyst can stay in Analyst Intelligence.
     All other roles are redirected to their own dashboard.
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
    severity,
    setSeverity,
  ] =
    useState<AnalystIntelligenceSeverity>(
      "all"
    );

  const [
    category,
    setCategory,
  ] =
    useState<AnalystIntelligenceCategory>(
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
    useState<AnalystIntelligenceData | null>(
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
    useRef(
      false
    );

  /* =======================================================
     LOAD INTELLIGENCE
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

          const response =
            await getAnalystIntelligence(
              {
                range,
                mode,
                currency,
                severity,
                category,
              },
              controller.signal
            );

          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          hasLoadedRef.current =
            true;

          setData(
            response
          );
        } catch (
          loadError:
            unknown
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load analyst intelligence."
          );
        } finally {
          if (
            !controller.signal
              .aborted
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
        controller.abort();
      };
    },
    [
      isAnalystRole,
      range,
      mode,
      currency,
      severity,
      category,
      refreshKey,
    ]
  );

  /* =======================================================
     DERIVED DATA
  ====================================================== */

  const timeline =
    useMemo(
      () =>
        (
          data
            ?.timeline ??
          []
        ).map(
          (
            point
          ) => ({
            ...point,

            label:
              bucketText(
                point.bucket,
                range
              ),
          })
        ),
      [
        data,
        range,
      ]
    );

  const categoryPie =
    useMemo(
      () =>
        (
          data
            ?.categories ??
          []
        ).filter(
          (
            item
          ) =>
            item.count >
            0
        ),
      [
        data,
      ]
    );

  const activeFilterCount =
    useMemo(
      () =>
        [
          range !== "30d",
          mode !== "all",
          severity !== "all",
          category !== "all",
          currency !== "BDT",
        ].filter(
          Boolean
        ).length,
      [
        range,
        mode,
        severity,
        category,
        currency,
      ]
    );

  /* =======================================================
     ACTIONS
  ====================================================== */

  function applyCurrency(
    event: FormEvent
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

    setError(
      ""
    );

    setCurrency(
      next
    );

    setCurrencyDraft(
      next
    );
  }

  function resetFilters() {
    if (!isAnalystRole) {
      return;
    }

    setRange(
      "30d"
    );

    setMode(
      "all"
    );

    setSeverity(
      "all"
    );

    setCategory(
      "all"
    );

    setCurrency(
      "BDT"
    );

    setCurrencyDraft(
      "BDT"
    );

    setError(
      ""
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
            Analyst Intelligence is available only to analyst accounts.
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
      <IntelligenceLoading />
    );
  }

  return (
    <main className="relative space-y-6 pb-8">
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
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-6 text-white shadow-[0_30px_90px_-45px_rgba(13,148,136,0.65)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [
              0,
              34,
              -12,
              0,
            ],
            y: [
              0,
              -16,
              12,
              0,
            ],
            scale: [
              1,
              1.12,
              0.96,
              1,
            ],
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
            x: [
              0,
              -24,
              18,
              0,
            ],
            y: [
              0,
              18,
              -10,
              0,
            ],
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
            x: [
              "-30%",
              "130%",
            ],
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
                <BrainCircuit className="h-3.5 w-3.5" />

                Intelligence Center
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" />

                Read-only analyst
              </div>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Analyst Intelligence
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
              Explainable operational intelligence built only from real payment,
              wallet, risk, refund, dispute and revenue analytics. No synthetic
              signals or paid AI inference are introduced by this page.
            </p>

            {data && (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <BrainCircuit className="h-3.5 w-3.5 text-cyan-300" />

                  Engine:{" "}
                  {
                    data.engine
                      .version
                  }
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5 text-teal-300" />

                  Generated:{" "}
                  {dateTimeText(
                    data.generatedAt
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />

                  No paid AI provider
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
              disabled={
                refreshing
              }
              onClick={() => {
                if (!isAnalystRole) {
                  return;
                }

                setRefreshKey(
                  (
                    current
                  ) =>
                    current +
                    1
                );
              }}
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing"
                : "Refresh intelligence"}
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
                Intelligence request failed
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          FILTERS
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
                Intelligence Filters
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
            onClick={
              resetFilters
            }
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <OceanSelect
            label="Range"
            value={
              range
            }
            options={
              RANGE_OPTIONS
            }
            onChange={(
              nextRange
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setRange(
                nextRange
              );
            }}
            icon={
              Clock3
            }
          />

          <OceanSelect
            label="Mode"
            value={
              mode
            }
            options={
              MODE_OPTIONS
            }
            onChange={(
              nextMode
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setMode(
                nextMode
              );
            }}
            icon={
              Layers3
            }
          />

          <OceanSelect
            label="Severity"
            value={
              severity
            }
            options={
              SEVERITY_OPTIONS
            }
            onChange={(
              nextSeverity
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setSeverity(
                nextSeverity
              );
            }}
            icon={
              Gauge
            }
          />

          <OceanSelect
            label="Category"
            value={
              category
            }
            options={
              CATEGORY_OPTIONS
            }
            onChange={(
              nextCategory
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setCategory(
                nextCategory
              );
            }}
            icon={
              BarChart3
            }
          />

          <form
            onSubmit={
              applyCurrency
            }
          >
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Currency
            </p>

            <div className="flex h-12 gap-2">
              <input
                value={
                  currencyDraft
                }
                onChange={(
                  event
                ) =>
                  setCurrencyDraft(
                    event.target
                      .value
                      .toUpperCase()
                  )
                }
                maxLength={
                  3
                }
                aria-label="Currency code"
                placeholder="BDT"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-3 text-xs font-black uppercase text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
              />

              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 px-3 text-[9px] font-black uppercase tracking-wide text-white shadow-md shadow-teal-500/15 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-teal-700 dark:text-teal-300">
            {optionLabel(
              RANGE_OPTIONS,
              range
            )}
          </span>

          <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-2.5 py-1 text-[9px] font-bold text-cyan-700 dark:text-cyan-300">
            {optionLabel(
              MODE_OPTIONS,
              mode
            )}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {optionLabel(
              SEVERITY_OPTIONS,
              severity
            )}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {optionLabel(
              CATEGORY_OPTIONS,
              category
            )}
          </span>

          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
            {currency}
          </span>
        </div>
      </motion.section>

      {data && (
        <>
          {/* =================================================
              SUMMARY
          ================================================= */}

          <motion.section
            variants={
              stagger
            }
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Signals"
              value={formatNumber(
                data.summary
                  .matchedSignals
              )}
              description={`${formatNumber(
                data.summary
                  .totalSignals
              )} total platform signals`}
              icon={
                BrainCircuit
              }
              tone="ocean"
            />

            <SummaryCard
              label="Critical"
              value={formatNumber(
                data.summary
                  .criticalSignals
              )}
              description="Signals requiring immediate analyst review"
              icon={
                ShieldAlert
              }
              tone="critical"
            />

            <SummaryCard
              label="Attention"
              value={formatNumber(
                data.summary
                  .attentionSignals
              )}
              description="High and medium priority signals"
              icon={
                Gauge
              }
              tone="attention"
            />

            <SummaryCard
              label="Facts Evaluated"
              value={formatNumber(
                data.summary
                  .factsEvaluated
              )}
              description="Payments and wallet transactions considered"
              icon={
                DatabaseZap
              }
              tone="violet"
            />
          </motion.section>

          {/* =================================================
              ENGINE + BASELINE
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
            <Panel
              title="Intelligence Engine"
              description="Transparent engine metadata for the current evaluation."
              icon={
                BrainCircuit
              }
            >
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-[20px] border border-teal-500/15 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-4 text-white">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/15 blur-3xl" />

                  <div className="relative flex items-center gap-3">
                    <motion.div
                      animate={{
                        rotate: [
                          0,
                          5,
                          -5,
                          0,
                        ],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-cyan-200"
                    >
                      <BrainCircuit className="h-5 w-5" />
                    </motion.div>

                    <div>
                      <p className="text-sm font-black">
                        Deterministic Rules
                      </p>

                      <p className="mt-1 text-[10px] text-slate-300">
                        Version{" "}
                        {
                          data.engine
                            .version
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <BadgeCheck className="h-4 w-4" />

                    <p className="text-xs font-black">
                      Explainable intelligence
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {
                      data.engine
                        .explanation
                    }
                  </p>
                </div>

                <div className="rounded-[20px] border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <Eye className="h-4 w-4" />

                    <p className="text-xs font-black">
                      Analyst scope
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    Observational intelligence only. Every signal is tied to
                    platform facts and remains read-only from this workspace.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel
              title="Current Analytical Baseline"
              description="Real platform metrics used by the intelligence evaluation."
              icon={
                Activity
              }
            >
              <motion.div
                variants={
                  stagger
                }
                initial="hidden"
                whileInView="show"
                viewport={{
                  once: true,
                }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <BaselineItem
                  label="Payments"
                  value={formatNumber(
                    data.baseline
                      .paymentCount
                  )}
                  icon={
                    Activity
                  }
                />

                <BaselineItem
                  label="Success rate"
                  value={`${data.baseline.successRate.toFixed(
                    2
                  )}%`}
                  icon={
                    CheckCircle2
                  }
                />

                <BaselineItem
                  label="Payment volume"
                  value={formatMoney(
                    data.baseline
                      .paymentVolumeMinor,
                    data.filters
                      .currency,
                    true
                  )}
                  icon={
                    WalletCards
                  }
                />

                <BaselineItem
                  label="Fee revenue"
                  value={formatMoney(
                    data.baseline
                      .feeRevenueMinor,
                    data.filters
                      .currency,
                    true
                  )}
                  icon={
                    BadgeCheck
                  }
                />

                <BaselineItem
                  label="Failed payments"
                  value={formatNumber(
                    data.baseline
                      .failedPaymentCount
                  )}
                  icon={
                    XCircle
                  }
                />

                <BaselineItem
                  label="High-risk transactions"
                  value={formatNumber(
                    data.baseline
                      .highRiskTransactionCount
                  )}
                  icon={
                    ShieldAlert
                  }
                />

                <BaselineItem
                  label="Refund value"
                  value={formatMoney(
                    data.baseline
                      .refundAmountMinor,
                    data.filters
                      .currency,
                    true
                  )}
                  icon={
                    RotateCcw
                  }
                />

                <BaselineItem
                  label="Dispute exposure"
                  value={formatMoney(
                    data.baseline
                      .openDisputeExposureMinor,
                    data.filters
                      .currency,
                    true
                  )}
                  icon={
                    AlertTriangle
                  }
                />
              </motion.div>
            </Panel>
          </div>

          {/* =================================================
              TIMELINE
          ================================================= */}

          <Panel
            title="Signal Pressure Timeline"
            description="Deterministic pressure combines payment reliability, failures and unusual volume movement."
            icon={
              Activity
            }
            action={
              <span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                Real API timeline
              </span>
            }
          >
            {timeline.length ===
            0 ? (
              <EmptyState
                title="No timeline available"
                message="There is not enough real payment activity to build a pressure timeline."
              />
            ) : (
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                <div className="relative h-[340px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <ComposedChart
                      data={
                        timeline
                      }
                      margin={{
                        top: 18,
                        right: 18,
                        bottom: 0,
                        left: -12,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="intelligence-pressure-ocean"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={
                              OCEAN.cyan
                            }
                            stopOpacity={
                              0.42
                            }
                          />

                          <stop
                            offset="95%"
                            stopColor={
                              OCEAN.cyan
                            }
                            stopOpacity={
                              0
                            }
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="rgba(148,163,184,0.14)"
                        strokeDasharray="4 6"
                        vertical={
                          false
                        }
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 10,
                          fill: "#94A3B8",
                        }}
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                      />

                      <YAxis
                        domain={[
                          0,
                          100,
                        ]}
                        tick={{
                          fontSize: 10,
                          fill: "#94A3B8",
                        }}
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                      />

                      <Tooltip
                        cursor={{
                          stroke:
                            "rgba(34,199,214,0.18)",
                          strokeWidth: 1,
                        }}
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

                      <Area
                        type="monotone"
                        dataKey="pressureScore"
                        name="Pressure score"
                        stroke={
                          OCEAN.cyan
                        }
                        strokeWidth={
                          2.6
                        }
                        fill="url(#intelligence-pressure-ocean)"
                        activeDot={{
                          r: 5,
                          fill:
                            OCEAN.cyan,
                          stroke:
                            "#ffffff",
                          strokeWidth: 2,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="successRate"
                        name="Success rate"
                        stroke={
                          OCEAN.emerald
                        }
                        strokeWidth={
                          2.4
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 4,
                          fill:
                            OCEAN.emerald,
                          stroke:
                            "#ffffff",
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Panel>

          {/* =================================================
              CATEGORY DISTRIBUTION + ANOMALIES
          ================================================= */}

          <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.65fr]">
            <Panel
              title="Signal Categories"
              description="Distribution of currently detected intelligence signals."
              icon={
                BarChart3
              }
            >
              {data.categories.length ===
              0 ? (
                <EmptyState
                  title="No category distribution"
                  message="No real intelligence category data is available for the selected filters."
                />
              ) : (
                <div className="space-y-5">
                  <div className="relative mx-auto h-[220px] max-w-[300px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Tooltip
                          content={
                            <OceanTooltip />
                          }
                        />

                        <Pie
                          data={
                            categoryPie
                          }
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={
                            58
                          }
                          outerRadius={
                            86
                          }
                          paddingAngle={
                            3
                          }
                          stroke="transparent"
                          isAnimationActive
                          animationDuration={
                            900
                          }
                        >
                          {categoryPie.map(
                            (
                              item
                            ) => (
                              <Cell
                                key={
                                  item.category
                                }
                                fill={categoryColor(
                                  item.category
                                )}
                              />
                            )
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-black text-slate-950 dark:text-white">
                          {formatNumber(
                            data.summary
                              .matchedSignals
                          )}
                        </p>

                        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                          Matched
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {data.categories.map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.category
                          }
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${categoryStyle(
                                  item.category
                                )}`}
                              />

                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                {humanize(
                                  item.category
                                )}
                              </span>
                            </div>

                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {
                                item.count
                              }{" "}
                              ·{" "}
                              {item.percentage.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                            <motion.div
                              initial={{
                                width: 0,
                              }}
                              whileInView={{
                                width:
                                  `${Math.min(
                                    100,
                                    item.percentage
                                  )}%`,
                              }}
                              viewport={{
                                once: true,
                              }}
                              transition={{
                                duration: 0.8,
                                ease: "easeOut",
                              }}
                              className={`h-full rounded-full ${categoryStyle(
                                item.category
                              )}`}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </Panel>

            <Panel
              title="Active Anomalies"
              description="Critical, high and medium severity signals matching the selected filters."
              icon={
                ShieldAlert
              }
              action={
                <span className="rounded-full border border-amber-500/15 bg-amber-500/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                  {
                    data.anomalies
                      .length
                  }{" "}
                  active
                </span>
              }
            >
              {data.anomalies.length ===
              0 ? (
                <EmptyState
                  title="No matching anomaly"
                  message="The current deterministic rules did not detect a critical, high, or medium signal for these filters."
                />
              ) : (
                <div
                  className={`grid gap-4 ${
                    data.anomalies.length > 1
                      ? "2xl:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {data.anomalies.map(
                    (
                      signal,
                      index
                    ) => (
                      <SignalCard
                        key={
                          signal.id
                        }
                        signal={
                          signal
                        }
                        index={
                          index
                        }
                      />
                    )
                  )}
                </div>
              )}
            </Panel>
          </div>

          {/* =================================================
              ALL SIGNALS
          ================================================= */}

          <Panel
            title="Intelligence Signals"
            description="Evidence-backed signals matching the current severity and category filters."
            icon={
              Radar
            }
            action={
              <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                {
                  data.insights
                    .length
                }{" "}
                visible
              </span>
            }
          >
            {data.insights.length ===
            0 ? (
              <EmptyState
                title="No matching signal"
                message="Try changing the severity, category, time range, or mode filters."
              />
            ) : (
              <div
                className={`grid gap-4 ${
                  data.insights.length > 1
                    ? "xl:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {data.insights.map(
                  (
                    signal,
                    index
                  ) => (
                    <SignalCard
                      key={
                        signal.id
                      }
                      signal={
                        signal
                      }
                      index={
                        index
                      }
                    />
                  )
                )}
              </div>
            )}
          </Panel>

          {/* =================================================
              READ ONLY NOTICE
          ================================================= */}

          <motion.div
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
            className="relative overflow-hidden rounded-[22px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.06] via-teal-500/[0.04] to-emerald-500/[0.05] p-4"
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Read-only analyst workspace
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Intelligence recommendations are observational. Analysts cannot
                  approve payments, block transactions, issue refunds, change
                  balances, or mutate platform financial records from this page.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </main>
  );
}
