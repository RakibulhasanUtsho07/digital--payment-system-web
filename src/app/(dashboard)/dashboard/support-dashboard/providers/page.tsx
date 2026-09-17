"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
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
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  Gauge,
  RefreshCcw,
  RotateCcw,
  Server,
  ShieldAlert,
  Timer,
  TrendingUp,
  XCircle,
  Zap,
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
  getAnalystProviderAnalytics,
  type AnalystMetric,
  type AnalystMode,
  type AnalystProviderAnalyticsData,
  type AnalystProviderInsight,
  type AnalystRange,
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
    2
  )}%`;
}

function formatSeconds(
  value:
    number
): string {
  if (
    value <
    1
  ) {
    return `${Math.round(
      value *
        1000
    )} ms`;
  }

  return `${value.toFixed(
    2
  )} s`;
}

function formatMoney(
  minor:
    number,

  currency:
    string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
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
      "en-BD",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )}`;
  }
}

function formatCompactMoney(
  minor:
    number,

  currency:
    string
): string {
  const major =
    minor /
    100;

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        notation:
          "compact",

        maximumFractionDigits:
          1,
      }
    ).format(
      major
    );
  } catch {
    return `${currency} ${major.toLocaleString(
      "en-BD",
      {
        notation:
          "compact",

        maximumFractionDigits:
          1,
      }
    )}`;
  }
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

function providerLabel(
  value:
    string
): string {
  if (
    !value
  ) {
    return "Unknown";
  }

  return value
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        char
      ) =>
        char.toUpperCase()
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
    AnalystMetric;

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
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label:
    string;

  value:
    string;

  description:
    string;

  icon:
    LucideIcon;

  iconClass:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black text-card-foreground">
            {value}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            {description}
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
        No real provider data
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {message}
      </p>
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
    AnalystProviderInsight;
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
        ? BrainCircuit
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

export default function AnalystProvidersPage() {
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
    provider,
    setProvider,
  ] =
    useState(
      ""
    );

  const [
    data,
    setData,
  ] =
    useState<
      AnalystProviderAnalyticsData |
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
     LOAD DATA
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
              await getAnalystProviderAnalytics(
                {
                  range,

                  mode,

                  currency,

                  provider,
                },

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
                : "Unable to load provider analytics."
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
      mode,
      currency,
      provider,
      refreshKey,
    ]
  );

  /* =======================================================
     CURRENCY
  ======================================================= */

  const applyCurrency =
    (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      const normalized =
        currencyDraft
          .trim()
          .toUpperCase();

      if (
        !/^[A-Z]{3}$/.test(
          normalized
        )
      ) {
        setError(
          "Currency must be a valid three-letter code, for example BDT."
        );

        return;
      }

      setError(
        ""
      );

      setCurrency(
        normalized
      );
    };

  /* =======================================================
     TREND
  ======================================================= */

  const trendData =
    useMemo(
      () =>
        data?.trend.map(
          (
            item
          ) => ({
            name:
              formatBucket(
                item.bucket,
                data.filters.range
              ),

            attempts:
              item.attemptCount,

            completed:
              item.completedCount,

            failed:
              item.failedCount,

            pending:
              item.pendingCount,

            volume:
              item.volumeMinor,

            successRate:
              item.successRate,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  /* =======================================================
     PROVIDER COMPARISON
  ======================================================= */

  const providerChart =
    useMemo(
      () =>
        data?.providers.map(
          (
            item
          ) => ({
            provider:
              providerLabel(
                item.provider
              ),

            successRate:
              item.successRate,

            attempts:
              item.attemptCount,

            fill:
              item.health ===
              "critical"
                ? "#ef4444"
                : item.health ===
                    "attention"
                  ? "#f59e0b"
                  : "#10b981",
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
            Provider analytics unavailable
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
      {/* ===================================================
          HEADER
      ==================================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusStyle}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />

                Provider health{" "}
                {data.status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                <Server className="h-3.5 w-3.5" />

                Gateway providers
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-card-foreground sm:text-3xl">
              Provider Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Compare payment provider reliability,
              success rate, failures, payment volume and
              completion latency across Coffer gateway traffic.
            </p>
          </div>

          {/* FILTERS */}

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

            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Environment
              </span>

              <select
                value={
                  mode
                }
                onChange={(
                  event
                ) =>
                  setMode(
                    event.target
                      .value as AnalystMode
                  )
                }
                className="h-11 min-w-36 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
              >
                {MODE_OPTIONS.map(
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

            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Provider
              </span>

              <select
                value={
                  provider
                }
                onChange={(
                  event
                ) =>
                  setProvider(
                    event.target
                      .value
                  )
                }
                className="h-11 min-w-44 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
              >
                <option value="">
                  All providers
                </option>

                {data.providerOptions.map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {providerLabel(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <form
              onSubmit={
                applyCurrency
              }
            >
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Currency
              </span>

              <div className="flex">
                <input
                  value={
                    currencyDraft
                  }
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
                  maxLength={
                    3
                  }
                  aria-label="Currency code"
                  className="h-11 w-20 rounded-l-xl border border-r-0 border-border bg-background px-3 text-center text-xs font-black uppercase text-foreground outline-none focus:border-primary"
                />

                <button
                  type="submit"
                  className="h-11 rounded-r-xl border border-border bg-muted px-3 text-[10px] font-black uppercase tracking-wider text-foreground transition hover:bg-muted/70"
                >
                  Apply
                </button>
              </div>
            </form>

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
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />

            Updated{" "}
            {formatDateTime(
              data.generatedAt
            )}
          </span>

          <span>
            {data.filters.currency} ·{" "}
            {data.filters.mode.toUpperCase()}
          </span>

          <span>
            {data.filters.provider
              ? providerLabel(
                  data.filters.provider
                )
              : "All providers"}
          </span>

          <span>
            Aggregate · read-only
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

      {/* ===================================================
          PLATFORM SUMMARY
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Providers"
          value={formatNumber(
            data.summary
              .totalProviders
          )}
          description={`${data.summary.healthyProviders} healthy · ${data.summary.attentionProviders} attention · ${data.summary.criticalProviders} critical`}
          icon={
            Server
          }
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <SummaryCard
          label="Total attempts"
          value={formatNumber(
            data.summary
              .totalAttempts
          )}
          description={`${formatNumber(
            data.summary
              .completedPayments
          )} completed payments`}
          icon={
            Activity
          }
          iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />

        <SummaryCard
          label="Overall success"
          value={formatPercent(
            data.summary
              .overallSuccessRate
          )}
          description={`${formatNumber(
            data.summary
              .failedPayments
          )} failed payments`}
          icon={
            TrendingUp
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <SummaryCard
          label="Avg completion"
          value={formatSeconds(
            data.summary
              .averageCompletionSeconds
          )}
          description="Successful payment completion latency"
          icon={
            Timer
          }
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </section>

      {/* ===================================================
          SELECTED METRICS
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Payment attempts"
          value={formatNumber(
            data.selected
              .metrics
              .attemptCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .attemptCount
          }
          icon={
            Zap
          }
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <MetricCard
          label="Completed"
          value={formatNumber(
            data.selected
              .metrics
              .completedCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .completedCount
          }
          icon={
            BadgeCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <MetricCard
          label="Failed"
          value={formatNumber(
            data.selected
              .metrics
              .failedCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .failedCount
          }
          icon={
            XCircle
          }
          iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
          inverse
        />

        <MetricCard
          label="Success rate"
          value={formatPercent(
            data.selected
              .metrics
              .successRate
              .value
          )}
          metric={
            data.selected
              .metrics
              .successRate
          }
          icon={
            Gauge
          }
          iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />

        <MetricCard
          label="Completed volume"
          value={formatMoney(
            data.selected
              .metrics
              .paymentVolumeMinor
              .value,

            data.filters
              .currency
          )}
          metric={
            data.selected
              .metrics
              .paymentVolumeMinor
          }
          icon={
            CircleDollarSign
          }
          iconClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />

        <MetricCard
          label="Fee revenue"
          value={formatMoney(
            data.selected
              .metrics
              .feeRevenueMinor
              .value,

            data.filters
              .currency
          )}
          metric={
            data.selected
              .metrics
              .feeRevenueMinor
          }
          icon={
            CircleDollarSign
          }
          iconClass="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
        />

        <MetricCard
          label="Failure rate"
          value={formatPercent(
            data.selected
              .metrics
              .failureRate
              .value
          )}
          metric={
            data.selected
              .metrics
              .failureRate
          }
          icon={
            ShieldAlert
          }
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          inverse
        />

        <MetricCard
          label="Completion latency"
          value={formatSeconds(
            data.selected
              .metrics
              .averageCompletionSeconds
              .value
          )}
          metric={
            data.selected
              .metrics
              .averageCompletionSeconds
          }
          icon={
            Timer
          }
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          inverse
        />
      </section>

      {/* ===================================================
          TREND + PROVIDER COMPARISON
      ==================================================== */}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Provider traffic trend"
            description="Attempts, successful payments and failures for the selected provider scope."
            action={
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                UTC buckets
              </span>
            }
          >
            {trendData.some(
              (
                item
              ) =>
                item.attempts >
                0
            ) ? (
              <div className="h-[350px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={
                      trendData
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
                        id="providerAttemptGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={
                            0.3
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
                        40
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
                      dataKey="attempts"
                      name="Attempts"
                      stroke="#2563eb"
                      strokeWidth={
                        2.5
                      }
                      fill="url(#providerAttemptGradient)"
                    />

                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10b981"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#ef4444"
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
                message="Provider traffic will appear after gateway payment attempts are recorded."
              />
            )}
          </Panel>
        </div>

        <Panel
          title="Provider comparison"
          description="Success rate comparison between payment providers."
        >
          {providerChart.length >
          0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    providerChart
                  }
                  layout="vertical"
                  margin={{
                    top:
                      5,

                    right:
                      10,

                    left:
                      15,

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
                    domain={[
                      0,
                      100,
                    ]}
                    tickFormatter={(
                      value
                    ) =>
                      `${value}%`
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
                    dataKey="provider"
                    width={
                      90
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
                    formatter={(
                      value
                    ) => [
                      `${Number(
                        value
                      ).toFixed(
                        2
                      )}%`,

                      "Success rate",
                    ]}
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
                    dataKey="successRate"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  >
                    {providerChart.map(
                      (
                        item
                      ) => (
                        <Cell
                          key={
                            item.provider
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
              message="No provider comparison is available for the current filters."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          PROVIDER TABLE
      ==================================================== */}

      <Panel
        title="Provider performance"
        description="Operational performance for every provider with traffic in the selected period."
        action={
          <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {data.providers.length} providers
          </span>
        }
      >
        {data.providers.length >
        0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Provider
                  </th>

                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Health
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Attempts
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Completed
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Failed
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Success
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Volume
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Latency
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.providers.map(
                  (
                    item
                  ) => {
                    const healthClass =
                      item.health ===
                      "critical"
                        ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                        : item.health ===
                            "attention"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

                    return (
                      <tr
                        key={
                          item.provider
                        }
                        className="border-b border-border/60 transition hover:bg-muted/30"
                      >
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setProvider(
                                item.provider
                              )
                            }
                            className="text-xs font-extrabold text-foreground transition hover:text-primary"
                          >
                            {providerLabel(
                              item.provider
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${healthClass}`}
                          >
                            {item.health}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {formatNumber(
                            item.attemptCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(
                            item.completedCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-red-600 dark:text-red-400">
                          {formatNumber(
                            item.failedCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-black text-foreground">
                          {formatPercent(
                            item.successRate
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {formatCompactMoney(
                            item.volumeMinor,
                            data.filters
                              .currency
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground">
                          {formatSeconds(
                            item.averageCompletionSeconds
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData
            message="No provider payment activity exists for this filter."
          />
        )}
      </Panel>

      {/* ===================================================
          TOP / WEAKEST
      ==================================================== */}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Top provider"
          description="Highest success rate in the current provider sample."
        >
          {data.summary
            .topProvider ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-sm font-extrabold text-foreground">
                {providerLabel(
                  data.summary
                    .topProvider
                    .provider
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatPercent(
                  data.summary
                    .topProvider
                    .successRate
                )}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatNumber(
                  data.summary
                    .topProvider
                    .attemptCount
                )}{" "}
                payment attempts
              </p>
            </div>
          ) : (
            <EmptyData
              message="No provider traffic is available."
            />
          )}
        </Panel>

        <Panel
          title="Weakest provider"
          description="Lowest success rate among providers with recorded traffic."
        >
          {data.summary
            .weakestProvider ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-sm font-extrabold text-foreground">
                {providerLabel(
                  data.summary
                    .weakestProvider
                    .provider
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">
                {formatPercent(
                  data.summary
                    .weakestProvider
                    .successRate
                )}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatNumber(
                  data.summary
                    .weakestProvider
                    .attemptCount
                )}{" "}
                payment attempts
              </p>
            </div>
          ) : (
            <EmptyData
              message="No provider traffic is available."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          FAILURE + LATENCY
      ==================================================== */}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Failure reasons"
          description="Recorded provider/payment failure codes for the selected scope."
        >
          {data.failureReasons.length >
          0 ? (
            <div className="space-y-4">
              {data.failureReasons.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.code
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="truncate text-xs font-bold text-foreground">
                        {providerLabel(
                          item.code
                        )}
                      </span>

                      <span className="text-xs font-bold text-muted-foreground">
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
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{
                          width:
                            `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptyData
              message="No failure reason was recorded for the selected provider scope."
            />
          )}
        </Panel>

        <Panel
          title="Completion latency"
          description="Distribution of successful provider payment completion time."
        >
          {data.latency.length >
          0 ? (
            <div className="space-y-4">
              {data.latency.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.key
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-foreground">
                        {item.label}
                      </span>

                      <span className="text-xs font-bold text-muted-foreground">
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
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{
                          width:
                            `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptyData
              message="No successful payment latency data exists for the selected scope."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          INTELLIGENCE
      ==================================================== */}

      <Panel
        title="Provider intelligence"
        description="Deterministic reliability and latency signals generated from real payment-provider activity."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <BrainCircuit className="h-3.5 w-3.5" />

            {
              data.intelligenceEngine
                .version
            }
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
            message="No provider intelligence signal was generated."
          />
        )}
      </Panel>

      {/* ===================================================
          READ ONLY
      ==================================================== */}

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

          <div>
            <p className="text-xs font-extrabold text-foreground">
              Read-only provider intelligence
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