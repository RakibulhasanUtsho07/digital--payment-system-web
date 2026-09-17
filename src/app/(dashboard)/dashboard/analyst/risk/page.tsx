"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  DatabaseZap,
  Filter,
  Radar,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
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
  getAnalystRiskAnalytics,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
  type AnalystRiskAnalyticsData,
  type AnalystRiskInsight,
  type AnalystRiskSource,
} from "@/lib/api/analystApi";

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
      "All payment modes",
  },

  {
    value:
      "live",

    label:
      "Live payments",
  },

  {
    value:
      "test",

    label:
      "Test payments",
  },
];

const SOURCE_OPTIONS: Array<{
  value:
    AnalystRiskSource;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All payment sources",
  },

  {
    value:
      "card",

    label:
      "Card",
  },

  {
    value:
      "paypal",

    label:
      "PayPal",
  },

  {
    value:
      "local_psp",

    label:
      "Local PSP",
  },

  {
    value:
      "wallet",

    label:
      "Wallet",
  },
];

/* =========================================================
   HELPERS
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

function formatDate(
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

function bucketLabel(
  value:
    string,
  range:
    AnalystRange
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

  return new Intl.DateTimeFormat(
    "en-BD",
    range ===
      "24h"
      ? {
          hour:
            "numeric",

          hour12:
            true,
        }
      : {
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
      ).toFixed(2)}
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
  helper,
  metric,
  icon:
    Icon,
  iconClass,
  inverse =
    true,
}: {
  label:
    string;

  value:
    string;

  helper:
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
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 border-t border-border/70 pt-3">
        <Change
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
   PANEL
========================================================= */

function Panel({
  title,
  description,
  children,
}: {
  title:
    string;

  description:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-extrabold text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
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

function Empty({
  message,
}: {
  message:
    string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold">
        No matching risk data
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

/* =========================================================
   DISTRIBUTION
========================================================= */

function Distribution({
  rows,
}: {
  rows:
    Array<{
      key:
        string;

      count:
        number;

      percentage:
        number;
    }>;
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <Empty message="No distribution data exists for these filters." />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(
        (
          row
        ) => (
          <div
            key={
              row.key
            }
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-foreground">
                {humanize(
                  row.key
                )}
              </p>

              <p className="text-[11px] font-bold text-muted-foreground">
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

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width:
                    `${Math.min(
                      100,
                      row.percentage
                    )}%`,
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
   INSIGHT
========================================================= */

function InsightCard({
  insight,
}: {
  insight:
    AnalystRiskInsight;
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
          ? Activity
          : TriangleAlert;

  return (
    <article
      className={`rounded-2xl border p-4 ${style}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0">
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

          <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-foreground">
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
    </article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystRiskPage() {
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
    source,
    setSource,
  ] =
    useState<AnalystRiskSource>(
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
    providerDraft,
    setProviderDraft,
  ] =
    useState(
      ""
    );

  const [
    data,
    setData,
  ] =
    useState<AnalystRiskAnalyticsData | null>(
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
  ====================================================== */

  useEffect(
    () => {
      const controller =
        new AbortController();

      let active =
        true;

      async function load() {
        try {
          if (
            data
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
            await getAnalystRiskAnalytics(
              {
                range,
                mode,
                currency,
                provider,
                source,
              },
              controller.signal
            );

          if (
            active
          ) {
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
                : "Unable to load risk analytics."
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
      range,
      mode,
      currency,
      provider,
      source,
      refreshKey,
    ]
  );

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (
            point
          ) => ({
            ...point,

            label:
              bucketLabel(
                point.bucket,
                range
              ),
          })
        ) ??
        [],
      [
        data,
        range,
      ]
    );

  function applyTextFilters(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nextCurrency =
      currencyDraft
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(
        nextCurrency
      )
    ) {
      setError(
        "Currency must be a three-letter ISO code."
      );

      return;
    }

    setCurrency(
      nextCurrency
    );

    setProvider(
      providerDraft
        .trim()
        .toLowerCase()
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading risk intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Evaluating gateway and transaction risk signals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* ===================================================
          HEADER
      ==================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute -bottom-24 left-[30%] h-64 w-64 rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-red-600 dark:text-red-400">
              <Radar className="h-3.5 w-3.5" />

              Risk Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Risk & Fraud Signals
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Read-only gateway risk blocks, platform transaction risk,
              provider concentration and deterministic anomaly signals.
            </p>

            {data && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${
                    data.status ===
                    "critical"
                      ? "border-red-500/20 bg-red-500/10 text-red-600"
                      : data.status ===
                          "attention"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {data.status}
                </span>

                <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
                  Updated{" "}
                  {formatDate(
                    data.generatedAt
                  )}
                </span>

                <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
                  Engine{" "}
                  {
                    data
                      .intelligenceEngine
                      .version
                  }
                </span>
              </div>
            )}
          </div>

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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-extrabold transition hover:bg-muted disabled:opacity-50"
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
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="text-xs">
            {error}
          </p>
        </div>
      )}

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Risk Filters
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <select
            value={
              range
            }
            onChange={(
              event
            ) =>
              setRange(
                event.target
                  .value as
                  AnalystRange
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
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

          <select
            value={
              mode
            }
            onChange={(
              event
            ) =>
              setMode(
                event.target
                  .value as
                  AnalystMode
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
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

          <select
            value={
              source
            }
            onChange={(
              event
            ) =>
              setSource(
                event.target
                  .value as
                  AnalystRiskSource
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {SOURCE_OPTIONS.map(
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
        </div>

        <form
          onSubmit={
            applyTextFilters
          }
          className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]"
        >
          <input
            value={
              currencyDraft
            }
            maxLength={
              3
            }
            onChange={(
              event
            ) =>
              setCurrencyDraft(
                event.target
                  .value
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
            className="h-11 rounded-xl border border-border bg-background px-3 text-center text-xs font-black uppercase"
          />

          <input
            value={
              providerDraft
            }
            onChange={(
              event
            ) =>
              setProviderDraft(
                event.target
                  .value
              )
            }
            placeholder="Optional provider filter"
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-primary px-5 text-xs font-extrabold text-primary-foreground"
          >
            Apply
          </button>
        </form>

        {data && (
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            {data.scopeNote}
          </p>
        )}
      </section>

      {data && (
        <>
          {/* =================================================
              METRICS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Risk Signals"
              value={formatNumber(
                data.metrics
                  .riskSignalCount
                  .value
              )}
              helper="Risk-blocked payments + HIGH-risk transactions"
              metric={
                data.metrics
                  .riskSignalCount
              }
              icon={
                ShieldAlert
              }
              iconClass="bg-red-500/10 text-red-600"
            />

            <MetricCard
              label="Risk-blocked Payments"
              value={formatNumber(
                data.metrics
                  .riskBlockedPayments
                  .value
              )}
              helper={`${data.metrics.riskBlockedRate.value.toFixed(
                2
              )}% of gateway attempts`}
              metric={
                data.metrics
                  .riskBlockedPayments
              }
              icon={
                Ban
              }
              iconClass="bg-orange-500/10 text-orange-600"
            />

            <MetricCard
              label="HIGH-risk Transactions"
              value={formatNumber(
                data.metrics
                  .highRiskTransactions
                  .value
              )}
              helper={`${data.metrics.highRiskTransactionRate.value.toFixed(
                2
              )}% of transactions`}
              metric={
                data.metrics
                  .highRiskTransactions
              }
              icon={
                Radar
              }
              iconClass="bg-violet-500/10 text-violet-600"
            />

            <MetricCard
              label="Failed Payments"
              value={formatNumber(
                data.metrics
                  .failedPayments
                  .value
              )}
              helper="Gateway payment failures"
              metric={
                data.metrics
                  .failedPayments
              }
              icon={
                XCircle
              }
              iconClass="bg-rose-500/10 text-rose-600"
            />
          </section>

          {/* =================================================
              OPERATIONAL RISK MATRIX
          ================================================= */}

          <Panel
            title="Operational Risk Matrix"
            description="Current aggregate risk population from gateway payment and transaction telemetry."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <RiskBox
                label="LOW"
                value={
                  data.operations
                    .lowRiskTransactions
                }
                helper="transaction classifications"
                tone="emerald"
              />

              <RiskBox
                label="MEDIUM"
                value={
                  data.operations
                    .mediumRiskTransactions
                }
                helper="monitored transactions"
                tone="amber"
              />

              <RiskBox
                label="HIGH"
                value={
                  data.operations
                    .highRiskTransactions
                }
                helper="high-risk transactions"
                tone="red"
              />

              <RiskBox
                label="Gateway Blocks"
                value={
                  data.metrics
                    .riskBlockedPayments
                    .value
                }
                helper="risk_blocked failures"
                tone="violet"
              />
            </div>
          </Panel>

          {/* =================================================
              TREND
          ================================================= */}

          <Panel
            title="Risk Signal Trend"
            description="Gateway risk blocks and HIGH-risk platform transactions across the selected window."
          >
            {chartData.some(
              (
                point
              ) =>
                point.totalRiskSignals >
                  0 ||
                point.failedPayments >
                  0 ||
                point.failedTransactions >
                  0
            ) ? (
              <div className="h-[360px]">
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
                        10,

                      right:
                        15,

                      left:
                        -15,

                      bottom:
                        0,
                    }}
                  >
                    <CartesianGrid
                      vertical={
                        false
                      }
                      strokeDasharray="4 4"
                      opacity={
                        0.15
                      }
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <YAxis
                      allowDecimals={
                        false
                      }
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <Tooltip />

                    <Bar
                      dataKey="riskBlockedPayments"
                      name="Risk-blocked payments"
                      fill="#f97316"
                      maxBarSize={
                        18
                      }
                    />

                    <Bar
                      dataKey="highRiskTransactions"
                      name="HIGH-risk transactions"
                      fill="#8b5cf6"
                      maxBarSize={
                        18
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="failedPayments"
                      name="Failed payments"
                      stroke="#ef4444"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="failedTransactions"
                      name="Failed transactions"
                      stroke="#64748b"
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
              <Empty message="No risk or failure signal was recorded for the current filters." />
            )}
          </Panel>

          {/* =================================================
              PROVIDERS
          ================================================= */}

          <Panel
            title="Provider Risk Performance"
            description="Gateway provider traffic, failures and recorded risk-block rate."
          >
            {data.providers.length >
            0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Provider
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Attempts
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Failed
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Risk Blocks
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Block Rate
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Failure Rate
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Health
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
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {humanize(
                              provider.provider
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              provider.attemptCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              provider.failedCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-orange-600">
                            {formatNumber(
                              provider.riskBlockedCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {provider.riskBlockedRate.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {provider.failureRate.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            <StatusBadge
                              status={
                                provider.status
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty message="No gateway provider activity matches these filters." />
            )}
          </Panel>

          {/* =================================================
              DISTRIBUTIONS
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Transaction Risk"
              description="Current LOW, MEDIUM and HIGH distribution."
            >
              <Distribution
                rows={
                  data.transactionRisk.map(
                    (
                      item
                    ) => ({
                      key:
                        item.risk,

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
              description="Gateway risk blocks by payment source."
            >
              <Distribution
                rows={
                  data.sources.map(
                    (
                      item
                    ) => ({
                      key:
                        item.source,

                      count:
                        item.riskBlockedCount,

                      percentage:
                        item.riskBlockedRate,
                    })
                  )
                }
              />
            </Panel>

            <Panel
              title="Gateway Failures"
              description="Payment failure codes for the current gateway scope."
            >
              <Distribution
                rows={
                  data.paymentFailureReasons.map(
                    (
                      item
                    ) => ({
                      key:
                        item.code,

                      count:
                        item.count,

                      percentage:
                        item.percentage,
                    })
                  )
                }
              />
            </Panel>
          </div>

          {/* =================================================
              TRANSACTION TYPES
          ================================================= */}

          <Panel
            title="Transaction-type Risk"
            description="Risk and failure rates across transfer, deposit and withdrawal activity."
          >
            {data.transactionTypes.length >
            0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {data.transactionTypes.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.type
                      }
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="text-xs font-extrabold">
                        {humanize(
                          item.type
                        )}
                      </p>

                      <p className="mt-3 text-xl font-black">
                        {formatNumber(
                          item.count
                        )}
                      </p>

                      <div className="mt-4 space-y-2 text-[11px]">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            HIGH risk
                          </span>

                          <span className="font-bold text-red-600">
                            {item.highRiskRate.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            Failure
                          </span>

                          <span className="font-bold text-amber-600">
                            {item.failureRate.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <Empty message="No platform transaction activity exists in this period." />
            )}
          </Panel>

          {/* =================================================
              INTELLIGENCE
          ================================================= */}

          <Panel
            title="Risk Intelligence"
            description="Explainable deterministic findings from existing gateway and platform risk telemetry."
          >
            <div className="grid gap-4 lg:grid-cols-2">
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
          </Panel>

          {/* =================================================
              FRAUD CASE NOTE
          ================================================= */}

          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Risk signals, not invented fraud cases
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  This page currently reports real risk classifications,
                  payment risk blocks and failure telemetry. A separate
                  FraudCase workflow will be added only when the backend has
                  persisted RiskAssessment/FraudCase models and case-management
                  operations.
                </p>
              </div>
            </div>
          </section>

          {/* READ ONLY */}

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Analyst access is read-only
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts cannot block payments, approve transfers, change
                  velocity limits, change KYC rules, modify provider settings,
                  or alter merchant/account state from this workspace.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

/* =========================================================
   RISK BOX
========================================================= */

function RiskBox({
  label,
  value,
  helper,
  tone,
}: {
  label:
    string;

  value:
    number;

  helper:
    string;

  tone:
    "emerald"
    | "amber"
    | "red"
    | "violet";
}) {
  const classes = {
    emerald:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-600",

    amber:
      "border-amber-500/20 bg-amber-500/5 text-amber-600",

    red:
      "border-red-500/20 bg-red-500/5 text-red-600",

    violet:
      "border-violet-500/20 bg-violet-500/5 text-violet-600",
  }[tone];

  return (
    <div
      className={`rounded-2xl border p-4 ${classes}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {formatNumber(
          value
        )}
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    "healthy"
    | "attention"
    | "critical";
}) {
  const classes =
    status ===
    "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-600"
      : status ===
          "attention"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${classes}`}
    >
      {status}
    </span>
  );
}