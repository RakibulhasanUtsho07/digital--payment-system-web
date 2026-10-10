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
  motion,
} from "framer-motion";

import {
  useRouter,
} from "next/navigation";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Gavel,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
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
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getAnalystDisputeAnalytics,
  type AnalystDisputeAnalyticsData,
  type AnalystDisputeInsight,
  type AnalystDisputeStatus,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
} from "@/lib/api/analystApi";

const ANALYST = {
  navy: "#10243A",
  tealDeep: "#0B4F52",
  navySoft: "#10273A",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  violet: "#8B5CF6",
};

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

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
}> = [
  {
    value: "all",
    label: "All modes",
  },
  {
    value: "live",
    label: "Live only",
  },
  {
    value: "test",
    label: "Test only",
  },
];

const STATUS_OPTIONS: Array<{
  value: AnalystDisputeStatus;
  label: string;
}> = [
  {
    value: "all",
    label: "All disputes",
  },
  {
    value: "disputed",
    label: "Disputed",
  },
  {
    value: "under_review",
    label: "Under review",
  },
  {
    value: "won",
    label: "Won",
  },
  {
    value: "lost",
    label: "Lost",
  },
];

/* =========================================================
   FORMAT
========================================================= */

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function formatMoney(
  minor: number,
  currency: string,
  compact = false
) {
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

function formatDate(
  value: string
) {
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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function bucketLabel(
  value: string,
  range: AnalystRange
) {
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
          hour: "numeric",
          hour12: true,
        }
      : {
          month: "short",
          day: "numeric",
        }
  ).format(date);
}

function humanize(
  value: string
) {
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
   CHANGE
========================================================= */

function Change({
  metric,
  inverse = false,
}: {
  metric: AnalystMetric;
  inverse?: boolean;
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
    change > 0;

  const good =
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
        good
          ? "text-emerald-600"
          : "text-red-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {Math.abs(
        change
      ).toFixed(2)}
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
}: {
  label: string;
  value: string;
  helper: string;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
  inverse?: boolean;
}) {
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
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 9,
            scale: 1.08,
          }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/50 shadow-sm ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
        <Change
          metric={metric}
          inverse={inverse}
        />
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
}: {
  title: string;
  description: string;
  children: ReactNode;
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
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />

      <div className="border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{
              rotate: 8,
              scale: 1.06,
            }}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 dark:text-teal-300"
          >
            <Scale className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
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
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold">
        No dispute activity
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
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
}: {
  rows: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <Empty message="No matching dispute breakdown is available." />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(
        (
          row
        ) => (
          <div
            key={row.key}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-xs font-bold">
                {humanize(
                  row.key
                )}
              </p>

              <p className="shrink-0 text-[11px] font-bold text-muted-foreground">
                {formatNumber(
                  row.count
                )}{" "}
                ·{" "}
                {row.percentage.toFixed(
                  2
                )}
                %
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
              <motion.div
                initial={{
                  width: 0,
                }}
                whileInView={{
                  width:
                    `${Math.min(
                      100,
                      Math.max(
                        0,
                        row.percentage
                      )
                    )}%`,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.75,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 shadow-[0_0_12px_rgba(20,184,166,0.28)]"
              />
            </div>
          </div>
        )
      )}
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
    AnalystDisputeInsight;
}) {
  const style =
    insight.severity ===
    "critical"
      ? "border-red-500/25 bg-red-500/5 text-red-600"
      : insight.severity ===
          "high"
        ? "border-orange-500/25 bg-orange-500/5 text-orange-600"
        : insight.severity ===
            "medium"
          ? "border-amber-500/25 bg-amber-500/5 text-amber-600"
          : insight.severity ===
              "positive"
            ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600"
            : "border-blue-500/25 bg-blue-500/5 text-blue-600";

  const Icon =
    insight.severity ===
    "positive"
      ? CheckCircle2
      : insight.severity ===
          "critical"
        ? XCircle
        : insight.severity ===
            "info"
          ? Sparkles
          : TriangleAlert;

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
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-[22px] border bg-gradient-to-br from-white/90 via-white to-white p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 ${style}`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-foreground">
              {insight.title}
            </h3>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase">
              {insight.severity}
            </span>

            <span className="rounded-full bg-background px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
              {humanize(
                insight.category
              )}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {insight.description}
          </p>

          <p className="mt-3 text-[10px] font-black uppercase text-foreground">
            Evidence
          </p>

          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {insight.evidence}
          </p>

          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            <span className="font-extrabold text-foreground">
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

export default function AnalystDisputesPage() {
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
    status,
    setStatus,
  ] =
    useState<AnalystDisputeStatus>(
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
    useState<AnalystDisputeAnalyticsData | null>(
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

          setError("");

          const response =
            await getAnalystDisputeAnalytics(
              {
                range,
                mode,
                currency,
                status,
              },
              controller.signal
            );

          if (
            active
          ) {
            hasLoadedRef.current =
              true;

            setData(
              response
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
                : "Unable to load dispute analytics."
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
      status,
      refreshKey,
    ]
  );

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (
            item
          ) => ({
            ...item,

            label:
              bucketLabel(
                item.bucket,
                range
              ),

            exposureMajor:
              item.exposureMinor /
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
            Dispute Analytics is available only to analyst accounts.
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
      <div className="grid min-h-[65vh] place-items-center rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
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
              <Scale className="h-6 w-6" />
            </motion.div>
          </div>

          <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
            Loading dispute intelligence
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Reading real exposure, aging, provider and outcome signals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}

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
                <Gavel className="h-3.5 w-3.5" />
                Dispute Intelligence
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Analyst only
              </div>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Dispute Analytics
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
              Monitor open exposure, dispute aging, outcomes, merchant concentration
              and provider performance through analyst-grade intelligence.
            </p>

            {data && (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                  Updated {formatDate(data.generatedAt)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Scale className="h-3.5 w-3.5 text-teal-300" />
                  {humanize(status)} scope
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-emerald-100">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Read-only intelligence
                </span>
              </div>
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
              disabled={refreshing}
              onClick={() => {
                if (!isAnalystRole) {
                  return;
                }

                setRefreshKey(
                  (current) =>
                    current + 1
                );
              }}
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:opacity-60"
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
                : "Refresh"}
            </button>
          </div>
        </div>

        {refreshing && data && (
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
          className="flex gap-3 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] p-4 text-red-600 shadow-sm dark:text-red-400"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />

          <p className="text-xs">
            {error}
          </p>
        </motion.div>
      )}

      {/* FILTERS */}

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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={range}
            onChange={(
              event
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setRange(
                event.target
                  .value as
                  AnalystRange
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {RANGE_OPTIONS.map(
              (
                option
              ) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <select
            value={mode}
            onChange={(
              event
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setMode(
                event.target
                  .value as
                  AnalystMode
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {MODE_OPTIONS.map(
              (
                option
              ) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <select
            value={status}
            onChange={(
              event
            ) => {
              if (!isAnalystRole) {
                return;
              }

              setStatus(
                event.target
                  .value as
                  AnalystDisputeStatus
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {STATUS_OPTIONS.map(
              (
                option
              ) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <form
            onSubmit={
              applyCurrency
            }
            className="flex"
          >
            <input
              value={
                currencyDraft
              }
              maxLength={3}
              onChange={(
                event
              ) =>
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
              className="h-11 min-w-0 flex-1 rounded-l-xl border border-slate-200 bg-white px-3 text-center text-xs font-black uppercase text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            />

            <button
              type="submit"
              className="rounded-r-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-[10px] font-black uppercase text-white shadow-lg shadow-teal-500/15 transition hover:from-teal-500 hover:to-cyan-500"
            >
              Apply
            </button>
          </form>
        </div>
      </motion.section>

      {data && (
        <>
          {/* METRICS */}

          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Disputes"
              value={formatNumber(
                data.metrics
                  .disputeCount
                  .value
              )}
              helper="All matching dispute records"
              metric={
                data.metrics
                  .disputeCount
              }
              icon={Scale}
              iconClass="bg-blue-500/10 text-blue-600"
              inverse
            />

            <MetricCard
              label="Open Disputes"
              value={formatNumber(
                data.metrics
                  .openDisputeCount
                  .value
              )}
              helper="Disputed + under review"
              metric={
                data.metrics
                  .openDisputeCount
              }
              icon={Clock3}
              iconClass="bg-amber-500/10 text-amber-600"
              inverse
            />

            <MetricCard
              label="Open Exposure"
              value={formatMoney(
                data.metrics
                  .openExposureMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper={`${data.metrics.disputeExposureRate.value.toFixed(
                2
              )}% of completed payment volume`}
              metric={
                data.metrics
                  .openExposureMinor
              }
              icon={ShieldAlert}
              iconClass="bg-red-500/10 text-red-600"
              inverse
            />

            <MetricCard
              label="Loss Rate"
              value={`${data.metrics.lossRate.value.toFixed(
                2
              )}%`}
              helper={`${formatNumber(
                data.metrics
                  .lostCount
                  .value
              )} lost cases`}
              metric={
                data.metrics
                  .lossRate
              }
              icon={XCircle}
              iconClass="bg-rose-500/10 text-rose-600"
              inverse
            />

            <MetricCard
              label="Won"
              value={formatNumber(
                data.metrics
                  .wonCount
                  .value
              )}
              helper="Favorable resolved outcomes"
              metric={
                data.metrics
                  .wonCount
              }
              icon={CheckCircle2}
              iconClass="bg-emerald-500/10 text-emerald-600"
            />

            <MetricCard
              label="Lost"
              value={formatNumber(
                data.metrics
                  .lostCount
                  .value
              )}
              helper="Unfavorable resolved outcomes"
              metric={
                data.metrics
                  .lostCount
              }
              icon={Gavel}
              iconClass="bg-orange-500/10 text-orange-600"
              inverse
            />

            <MetricCard
              label="Average Open Age"
              value={`${data.metrics.averageOpenAgeDays.value.toFixed(
                1
              )}d`}
              helper="Average unresolved case age"
              metric={
                data.metrics
                  .averageOpenAgeDays
              }
              icon={Clock3}
              iconClass="bg-violet-500/10 text-violet-600"
              inverse
            />

            <MetricCard
              label="Exposure Rate"
              value={`${data.metrics.disputeExposureRate.value.toFixed(
                2
              )}%`}
              helper="Open exposure / payment volume"
              metric={
                data.metrics
                  .disputeExposureRate
              }
              icon={ShieldAlert}
              iconClass="bg-fuchsia-500/10 text-fuchsia-600"
              inverse
            />
          </motion.section>

          {/* TREND */}

          <Panel
            title="Dispute Exposure Trend"
            description="New disputes, unresolved cases, outcomes and open financial exposure."
          >
            {chartData.some(
              (
                item
              ) =>
                item.disputeCount >
                0
            ) ? (
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                <div className="relative h-[360px]">
                  <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={chartData}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(148,163,184,0.14)"
                      strokeDasharray="4 6"
                      opacity={1}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="count"
                      allowDecimals={false}
                      tick={{
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="value"
                      orientation="right"
                      tick={{
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Area
                      yAxisId="value"
                      type="monotone"
                      dataKey="exposureMajor"
                      name="Open exposure"
                      stroke="#22C7D6"
                      fill="#22C7D6"
                      fillOpacity={0.08}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="lostCount"
                      name="Lost"
                      fill="#EF4444"
                      maxBarSize={16}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="openCount"
                      name="Open"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={false}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="wonCount"
                      name="Won"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <Empty message="No dispute activity exists for the selected filters." />
            )}
          </Panel>

          {/* STATUS + AGING + SOURCE */}

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Dispute Status"
              description="Current lifecycle distribution."
            >
              <Breakdown
                rows={
                  data.statuses.map(
                    (
                      item
                    ) => ({
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
              title="Open Case Aging"
              description="How long unresolved cases have remained open."
            >
              <Breakdown
                rows={
                  data.aging.map(
                    (
                      item
                    ) => ({
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
              title="Payment Sources"
              description="Disputes grouped by original payment source."
            >
              <Breakdown
                rows={
                  data.sources.map(
                    (
                      item
                    ) => ({
                      key:
                        item.source,

                      count:
                        item.disputeCount,

                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>
          </div>

          {/* PROVIDERS */}

          <Panel
            title="Provider Dispute Performance"
            description="Dispute exposure and outcome performance across payment providers."
          >
            {data.providers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Provider
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Disputes
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Open
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Lost
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Exposure
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Loss Rate
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.providers.map(
                      (
                        provider
                      ) => (
                        <tr
                          key={
                            provider.provider
                          }
                          className="transition hover:bg-teal-500/[0.04]"
                        >
                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 font-extrabold">
                            {humanize(
                              provider.provider
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              provider.disputeCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-amber-600">
                            {formatNumber(
                              provider.openCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-red-600">
                            {formatNumber(
                              provider.lostCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold">
                            {formatMoney(
                              provider.exposureMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-black">
                            {provider.lossRate.toFixed(
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
              <Empty message="No provider-linked dispute data exists." />
            )}
          </Panel>

          {/* MERCHANT CONCENTRATION */}

          <Panel
            title="Merchant Dispute Concentration"
            description="Merchants contributing the largest unresolved dispute exposure."
          >
            {data.merchants.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Merchant
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Disputes
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Open
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Lost
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Exposure
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Share
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.merchants.map(
                      (
                        merchant
                      ) => (
                        <tr
                          key={
                            merchant.merchantId
                          }
                          className="transition hover:bg-teal-500/[0.04]"
                        >
                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 font-extrabold">
                            {merchant.businessName}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              merchant.disputeCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              merchant.openCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-red-600">
                            {formatNumber(
                              merchant.lostCount
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold">
                            {formatMoney(
                              merchant.exposureMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-black">
                            {merchant.exposureShare.toFixed(
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
              <Empty message="No merchant dispute concentration exists." />
            )}
          </Panel>

          {/* INSIGHTS */}

          <Panel
            title="Dispute Intelligence"
            description="Explainable dispute exposure, aging, outcome, merchant and provider signals."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {data.insights.map(
                (
                  insight
                ) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                  />
                )
              )}
            </div>
          </Panel>

          {/* READ ONLY */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[24px] border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.07] via-cyan-500/[0.04] to-transparent p-5 shadow-[0_18px_55px_-42px_rgba(15,118,110,0.50)]"
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
                  Analysts cannot change dispute status, submit evidence,
                  mark a case won or lost, refund a payment, or modify merchant
                  balances from this workspace.
                </p>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}
