"use client";

import {
  useEffect,
  useMemo,
  useState,
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
  CircleUserRound,
  DatabaseZap,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystUserAnalytics,
  type AnalystRange,
  type AnalystUserAnalyticsData,
  type AnalystUserInsight,
  type AnalystUserMetric,
} from "@/lib/api/analystApi";

import {
  isApiAbortError,
} from "@/lib/api/client";

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

/* =========================================================
   COLORS
========================================================= */

const KYC_COLORS:
  Record<string, string> = {
  verified:
    "#10b981",

  pending:
    "#f59e0b",

  rejected:
    "#ef4444",

  not_started:
    "#64748b",

  unknown:
    "#94a3b8",
};

const RISK_COLORS:
  Record<string, string> = {
  LOW:
    "#10b981",

  MEDIUM:
    "#f59e0b",

  HIGH:
    "#ef4444",
};

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(
  value:
    number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(
    value
  );
}

function formatPercent(
  value:
    number
): string {
  return `${value.toFixed(
    1
  )}%`;
}

function formatDateTime(
  value:
    string
): string {
  const date =
    new Date(
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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function formatBucket(
  value:
    string,

  range:
    AnalystRange
): string {
  const date =
    new Date(
      value
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
    ).format(
      date
    );
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      month:
        "short",

      day:
        "numeric",
    }
  ).format(
    date
  );
}

function prettify(
  value:
    string
): string {
  return value
    .replace(
      /_/g,
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
   CHANGE BADGE
========================================================= */

function ChangeBadge({
  metric,
  inverse = false,
}: {
  metric:
    AnalystUserMetric;

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
        New vs previous period
      </span>
    );
  }

  const rising =
    change >
    0;

  const neutral =
    change ===
    0;

  const positive =
    neutral ||
    (
      inverse
        ? !rising
        : rising
    );

  const Icon =
    rising
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        neutral
          ? "text-muted-foreground"
          : positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
      }`}
    >
      {!neutral && (
        <Icon className="h-3.5 w-3.5" />
      )}

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
  metric,
  icon: Icon,
  iconClass,
  inverse,
}: {
  label:
    string;

  value:
    string;

  metric:
    AnalystUserMetric;

  icon:
    LucideIcon;

  iconClass:
    string;

  inverse?:
    boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity:
          0,

        y:
          12,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-card-foreground">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 border-t border-border/70 pt-3">
        <ChangeBadge
          metric={
            metric
          }
          inverse={
            inverse
          }
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   POPULATION CARD
========================================================= */

function PopulationCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;

  icon:
    LucideIcon;

  iconClass:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-card-foreground">
            {value}
          </p>

          <p className="mt-2 text-[11px] font-medium text-muted-foreground">
            {detail}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
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
}: {
  title:
    string;

  description:
    string;

  children:
    React.ReactNode;

  action?:
    React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-card-foreground">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyData({
  message,
}: {
  message:
    string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />

      <p className="mt-3 text-sm font-bold text-foreground">
        No real data recorded
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

function BreakdownList({
  items,
}: {
  items:
    Array<{
      key:
        string;

      label:
        string;

      count:
        number;

      percentage:
        number;

      color:
        string;
    }>;
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <EmptyData
        message="No records are available for this breakdown."
      />
    );
  }

  return (
    <div className="space-y-5">
      {items.map(
        (
          item
        ) => (
          <div
            key={
              item.key
            }
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      item.color,
                  }}
                />

                <span className="truncate text-xs font-bold text-foreground">
                  {item.label}
                </span>
              </div>

              <span className="shrink-0 text-xs font-bold text-muted-foreground">
                {formatNumber(
                  item.count
                )}{" "}
                ·{" "}
                {formatPercent(
                  item.percentage
                )}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:
                    `${Math.min(
                      item.percentage,
                      100
                    )}%`,

                  backgroundColor:
                    item.color,
                }}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  insight,
}: {
  insight:
    AnalystUserInsight;
}) {
  const style =
    {
      critical:
        "border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400",

      high:
        "border-orange-500/25 bg-orange-500/5 text-orange-600 dark:text-orange-400",

      medium:
        "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400",

      info:
        "border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400",

      positive:
        "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    }[
      insight.severity
    ];

  const Icon =
    insight.severity ===
    "positive"
      ? BadgeCheck
      : insight.severity ===
          "info"
        ? Sparkles
        : AlertTriangle;

  return (
    <div
      className={`rounded-2xl border p-4 ${style}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {insight.description}
          </p>

          <div className="mt-3 rounded-xl bg-background/70 p-3">
            <p className="text-[11px] font-bold text-foreground">
              Evidence
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-foreground/80">
            <span className="font-extrabold">
              Recommended review:
            </span>{" "}
            {insight.recommendedReview}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystUsersPage() {
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
    useState<
      AnalystUserAnalyticsData |
      null
    >(
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

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      let active =
        true;

      const load =
        async () => {
          setRefreshing(
            true
          );

          setError(
            ""
          );

          try {
            const result =
              await getAnalystUserAnalytics(
                range,
                controller.signal
              );

            if (
              !active ||
              controller.signal.aborted
            ) {
              return;
            }

            setData(
              result
            );
          } catch (
            loadError:
              unknown
          ) {
            if (
              !active ||
              controller.signal.aborted ||
              isApiAbortError(
                loadError
              )
            ) {
              return;
            }

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load user analytics."
            );
          } finally {
            if (
              active &&
              !controller.signal.aborted
            ) {
              setLoading(
                false
              );

              setRefreshing(
                false
              );
            }
          }
        };

      void load();

      return () => {
        active =
          false;

        if (
          !controller.signal.aborted
        ) {
          controller.abort();
        }
      };
    },
    [
      range,
      refreshKey,
    ]
  );

  /* =======================================================
     CHART
  ======================================================= */

  const trend =
    useMemo(
      () =>
        data?.trend.map(
          (
            point
          ) => ({
            name:
              formatBucket(
                point.bucket,
                data.filters.range
              ),

            activeUsers:
              point.activeUsers,

            newUsers:
              point.newUsers,

            transactions:
              point.transactionCount,

            failed:
              point.failedTransactionCount,

            highRisk:
              point.highRiskTransactionCount,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  const kycItems =
    useMemo(
      () =>
        data?.kycBreakdown.map(
          (
            item
          ) => ({
            key:
              item.status,

            label:
              prettify(
                item.status
              ),

            count:
              item.count,

            percentage:
              item.percentage,

            color:
              KYC_COLORS[
                item.status
              ] ??
              KYC_COLORS.unknown,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  const walletItems =
    useMemo(
      () =>
        data?.walletBreakdown.map(
          (
            item,
            index
          ) => ({
            key:
              item.status,

            label:
              prettify(
                item.status
              ),

            count:
              item.count,

            percentage:
              item.percentage,

            color:
              [
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#64748b",
                "#3b82f6",
              ][
                index %
                  5
              ],
          })
        ) ??
        [],
      [
        data,
      ]
    );

  const riskChart =
    useMemo(
      () =>
        data?.riskBreakdown.map(
          (
            item
          ) => ({
            name:
              prettify(
                item.risk
              ),

            count:
              item.count,

            fill:
              RISK_COLORS[
                item.risk
              ] ??
              "#64748b",
          })
        ) ??
        [],
      [
        data,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="space-y-5">
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />

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
                className="h-40 animate-pulse rounded-2xl bg-muted"
              />
            )
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="h-[420px] animate-pulse rounded-2xl bg-muted xl:col-span-2" />

          <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  /* =======================================================
     INITIAL ERROR
  ======================================================= */

  if (
    !data &&
    error
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-black text-card-foreground">
            User analytics unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (
                  current
                ) =>
                  current +
                  1
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />

            Try again
          </button>
        </div>
      </div>
    );
  }

  if (
    !data
  ) {
    return null;
  }

  const statusStyle =
    {
      healthy:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

      attention:
        "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",

      critical:
        "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    }[
      data.status
    ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusStyle}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />

                User health{" "}
                {data.status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                <Users className="h-3.5 w-3.5" />

                Platform wallet users
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-card-foreground sm:text-3xl">
              User Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Analyze Coffer personal wallet users, activation,
              transactions, KYC, wallet coverage, financial
              planning adoption and risk signals.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Period
              </span>

              <select
                value={
                  range
                }
                onChange={(
                  event
                ) =>
                  setRange(
                    event.target
                      .value as AnalystRange
                  )
                }
                className="h-11 min-w-40 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
              >
                {RANGE_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                setRefreshKey(
                  (
                    current
                  ) =>
                    current +
                    1
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
          <span>
            Updated{" "}
            {formatDateTime(
              data.generatedAt
            )}
          </span>

          <span>
            role=user only
          </span>

          <span>
            Aggregate / read-only
          </span>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />

          <p>
            {error}
          </p>
        </div>
      )}

      {/* POPULATION */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PopulationCard
          label="Total users"
          value={formatNumber(
            data.population
              .totalUsers
          )}
          detail="Current Coffer wallet users"
          icon={
            Users
          }
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <PopulationCard
          label="KYC verified"
          value={formatNumber(
            data.population
              .verifiedUsers
          )}
          detail={`${formatPercent(
            data.population
              .kycVerificationCoverage
          )} verification coverage`}
          icon={
            BadgeCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <PopulationCard
          label="Active wallets"
          value={formatNumber(
            data.population
              .activeWallets
          )}
          detail={`${formatPercent(
            data.population
              .activeWalletCoverage
          )} of users`}
          icon={
            WalletCards
          }
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />

        <PopulationCard
          label="Total wallets"
          value={formatNumber(
            data.population
              .totalWallets
          )}
          detail={`${formatPercent(
            data.population
              .walletCoverage
          )} wallet coverage`}
          icon={
            CircleUserRound
          }
          iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />
      </section>

      {/* PERIOD METRICS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active users"
          value={formatNumber(
            data.metrics
              .activeUsers
              .value
          )}
          metric={
            data.metrics
              .activeUsers
          }
          icon={
            UserCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <MetricCard
          label="New users"
          value={formatNumber(
            data.metrics
              .newUsers
              .value
          )}
          metric={
            data.metrics
              .newUsers
          }
          icon={
            UserPlus
          }
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <MetricCard
          label="Transaction users"
          value={formatNumber(
            data.metrics
              .transactionUsers
              .value
          )}
          metric={
            data.metrics
              .transactionUsers
          }
          icon={
            Activity
          }
          iconClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />

        <MetricCard
          label="High-risk users"
          value={formatNumber(
            data.metrics
              .highRiskUsers
              .value
          )}
          metric={
            data.metrics
              .highRiskUsers
          }
          icon={
            ShieldAlert
          }
          iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
          inverse
        />

        <MetricCard
          label="Transactions"
          value={formatNumber(
            data.metrics
              .transactionCount
              .value
          )}
          metric={
            data.metrics
              .transactionCount
          }
          icon={
            TrendingUp
          }
          iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />

        <MetricCard
          label="Failed transactions"
          value={formatNumber(
            data.metrics
              .failedTransactionCount
              .value
          )}
          metric={
            data.metrics
              .failedTransactionCount
          }
          icon={
            AlertTriangle
          }
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          inverse
        />

        <MetricCard
          label="Budget users"
          value={formatNumber(
            data.metrics
              .budgetUsers
              .value
          )}
          metric={
            data.metrics
              .budgetUsers
          }
          icon={
            Sparkles
          }
          iconClass="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
        />

        <MetricCard
          label="Cash-flow users"
          value={formatNumber(
            data.metrics
              .cashFlowUsers
              .value
          )}
          metric={
            data.metrics
              .cashFlowUsers
          }
          icon={
            BrainCircuit
          }
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </section>

      {/* TREND */}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="User activity trend"
            description="New users, active users and wallet transaction activity across the selected period."
            action={
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                UTC buckets
              </span>
            }
          >
            {trend.length >
            0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={
                      trend
                    }
                    margin={{
                      top:
                        10,

                      right:
                        10,

                      left:
                        0,

                      bottom:
                        0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="analystUsersActiveGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={
                            0.32
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={
                            0.02
                          }
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={
                        false
                      }
                      stroke="currentColor"
                      opacity={
                        0.08
                      }
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      minTickGap={
                        24
                      }
                      tick={{
                        fontSize:
                          10,

                        fill:
                          "currentColor",

                        opacity:
                          0.55,
                      }}
                    />

                    <YAxis
                      allowDecimals={
                        false
                      }
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      width={
                        42
                      }
                      tick={{
                        fontSize:
                          10,

                        fill:
                          "currentColor",

                        opacity:
                          0.55,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius:
                          14,

                        border:
                          "1px solid var(--border)",

                        background:
                          "var(--card)",

                        color:
                          "var(--card-foreground)",

                        fontSize:
                          12,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active users"
                      stroke="#2563eb"
                      strokeWidth={
                        2.5
                      }
                      fill="url(#analystUsersActiveGradient)"
                    />

                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      name="New users"
                      stroke="#8b5cf6"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="transactions"
                      name="Transactions"
                      stroke="#10b981"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyData
                message="User activity will appear after real account and wallet activity exists."
              />
            )}
          </Panel>
        </div>

        {/* ENGAGEMENT */}

        <Panel
          title="Engagement health"
          description="How deeply Coffer wallet users engage with platform capabilities."
        >
          <div className="space-y-4">
            {[
              {
                label:
                  "Active user rate",

                value:
                  data.engagement
                    .activeRate,

                className:
                  "bg-blue-500",
              },

              {
                label:
                  "Transaction participation",

                value:
                  data.engagement
                    .transactionParticipationRate,

                className:
                  "bg-emerald-500",
              },

              {
                label:
                  "Budget adoption",

                value:
                  data.engagement
                    .budgetAdoptionRate,

                className:
                  "bg-violet-500",
              },

              {
                label:
                  "Cash-flow adoption",

                value:
                  data.engagement
                    .cashFlowAdoptionRate,

                className:
                  "bg-cyan-500",
              },
            ].map(
              (
                item
              ) => (
                <div
                  key={
                    item.label
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-foreground">
                      {item.label}
                    </span>

                    <span className="text-xs font-black text-muted-foreground">
                      {formatPercent(
                        item.value
                      )}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.className}`}
                      style={{
                        width:
                          `${Math.min(
                            item.value,
                            100
                          )}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}

            <div className="mt-5 rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Failed transaction rate
              </p>

              <p
                className={`mt-2 text-2xl font-black ${
                  data.engagement
                    .failedTransactionRate >=
                  10
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
                }`}
              >
                {formatPercent(
                  data.engagement
                    .failedTransactionRate
                )}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* BREAKDOWNS */}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="KYC distribution"
          description="Identity verification state across Coffer wallet users."
        >
          <BreakdownList
            items={
              kycItems
            }
          />
        </Panel>

        <Panel
          title="Wallet status"
          description="Wallet provisioning and current wallet status distribution."
        >
          <BreakdownList
            items={
              walletItems
            }
          />
        </Panel>

        <Panel
          title="Transaction risk"
          description="Risk classifications connected to wallet users during the selected period."
        >
          {riskChart.length >
          0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    riskChart
                  }
                  layout="vertical"
                  margin={{
                    top:
                      5,

                    right:
                      10,

                    left:
                      5,

                    bottom:
                      5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={
                      false
                    }
                    stroke="currentColor"
                    opacity={
                      0.08
                    }
                  />

                  <XAxis
                    type="number"
                    allowDecimals={
                      false
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={
                      70
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10,

                      fill:
                        "currentColor",

                      opacity:
                        0.7,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius:
                        14,

                      border:
                        "1px solid var(--border)",

                      background:
                        "var(--card)",

                      color:
                        "var(--card-foreground)",

                      fontSize:
                        12,
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  >
                    {riskChart.map(
                      (
                        item
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            item.fill
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyData
              message="No wallet transaction risk records exist for this period."
            />
          )}
        </Panel>
      </div>

      {/* KYC DETAIL */}

      <Panel
        title="Verification population"
        description="Current identity-verification population, separate from period activity metrics."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "Verified",

              value:
                data.population
                  .verifiedUsers,

              className:
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            },

            {
              label:
                "Pending",

              value:
                data.population
                  .pendingKycUsers,

              className:
                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            },

            {
              label:
                "Rejected",

              value:
                data.population
                  .rejectedKycUsers,

              className:
                "bg-red-500/10 text-red-600 dark:text-red-400",
            },

            {
              label:
                "Not started",

              value:
                data.population
                  .notStartedKycUsers,

              className:
                "bg-slate-500/10 text-slate-600 dark:text-slate-400",
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div
                  className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.className}`}
                >
                  {item.label}
                </div>

                <p className="mt-4 text-2xl font-black text-foreground">
                  {formatNumber(
                    item.value
                  )}
                </p>
              </div>
            )
          )}
        </div>
      </Panel>

      {/* INSIGHTS */}

      <Panel
        title="User intelligence"
        description="Deterministic aggregate insights generated from real platform user activity."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <BrainCircuit className="h-3.5 w-3.5" />

            Rules-based
          </span>
        }
      >
        {data.insights.length >
        0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
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
          </div>
        ) : (
          <EmptyData
            message="No user intelligence signal was generated for this period."
          />
        )}
      </Panel>

      {/* PRIVACY */}

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

          <div>
            <p className="text-xs font-extrabold text-foreground">
              Privacy-safe analyst scope
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {data.privacyNote}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {data.scopeNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}