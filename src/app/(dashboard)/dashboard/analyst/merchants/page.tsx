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
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  DatabaseZap,
  Globe2,
  RefreshCcw,
  ShieldAlert,
  Store,
  TrendingUp,
  Users,
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
  getAnalystMerchantAnalytics,
  type AnalystMerchantAnalyticsData,
  type AnalystMerchantInsight,
  type AnalystMetric,
  type AnalystMode,
  type AnalystRange,
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

function numberText(
  value:
    number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(
    value
  );
}

function moneyText(
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

function dateText(
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

function bucketText(
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
  ).format(
    date
  );
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
  helper,
  metric,
  icon: Icon,
  iconClass,
  inverse,
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
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold">
        No merchant activity
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
      <Empty message="No merchant population records are available." />
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
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-bold text-foreground">
                {humanize(
                  row.key
                )}
              </span>

              <span className="shrink-0 font-bold text-muted-foreground">
                {numberText(
                  row.count
                )}{" "}
                ·{" "}
                {row.percentage.toFixed(
                  1
                )}
                %
              </span>
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
    AnalystMerchantInsight;
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
        : AlertTriangle;

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

          <p className="mt-3 text-[11px] font-extrabold text-foreground">
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

export default function AnalystMerchantsPage() {
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
    data,
    setData,
  ] =
    useState<AnalystMerchantAnalyticsData | null>(
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

          setError(
            ""
          );

          const response =
            await getAnalystMerchantAnalytics(
              {
                range,
                mode,
                currency,
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
                : "Unable to load merchant analytics."
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
      refreshKey,
    ]
  );

  /* =======================================================
     CHART
  ====================================================== */

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (
            point
          ) => ({
            ...point,

            label:
              bucketText(
                point.bucket,
                range
              ),

            volumeMajor:
              point.paymentVolumeMinor /
              100,
          })
        ) ??
        [],
      [
        data,
        range,
      ]
    );

  /* =======================================================
     CURRENCY
  ====================================================== */

  function applyCurrency(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

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

  /* =======================================================
     INITIAL LOADING
  ====================================================== */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading merchant intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Aggregating merchant and payment activity...
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
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute bottom-[-100px] left-[30%] h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">
              <Store className="h-3.5 w-3.5" />

              Merchant Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Merchant Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Monitor merchant growth, verification, activation, live readiness,
              payment performance and platform concentration.
            </p>

            {data && (
              <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                Updated{" "}
                {dateText(
                  data.generatedAt
                )}
              </p>
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

      {/* ===================================================
          ERROR
      ==================================================== */}

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
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
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
                  {
                    option.label
                  }
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
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
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
                  {
                    option.label
                  }
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
              className="h-11 min-w-0 flex-1 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black uppercase"
            />

            <button
              type="submit"
              className="rounded-r-xl bg-primary px-4 text-[10px] font-black uppercase text-primary-foreground"
            >
              Apply
            </button>
          </form>
        </div>
      </section>

      {data && (
        <>
          {/* =================================================
              WINDOW METRICS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="New Merchants"
              value={numberText(
                data.metrics
                  .newMerchants
                  .value
              )}
              helper="Created during selected period"
              metric={
                data.metrics
                  .newMerchants
              }
              icon={
                Building2
              }
              iconClass="bg-blue-500/10 text-blue-600"
            />

            <MetricCard
              label="Transacting Merchants"
              value={numberText(
                data.metrics
                  .transactingMerchants
                  .value
              )}
              helper={`${data.metrics.merchantEngagementRate.value.toFixed(
                2
              )}% population engagement`}
              metric={
                data.metrics
                  .transactingMerchants
              }
              icon={
                Store
              }
              iconClass="bg-cyan-500/10 text-cyan-600"
            />

            <MetricCard
              label="Payment Volume"
              value={moneyText(
                data.metrics
                  .paymentVolumeMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper="Completed merchant payments"
              metric={
                data.metrics
                  .paymentVolumeMinor
              }
              icon={
                CircleDollarSign
              }
              iconClass="bg-violet-500/10 text-violet-600"
            />

            <MetricCard
              label="Payment Success"
              value={`${data.metrics.successRate.value.toFixed(
                2
              )}%`}
              helper={`${numberText(
                data.metrics
                  .completedPayments
                  .value
              )} completed payments`}
              metric={
                data.metrics
                  .successRate
              }
              icon={
                BadgeCheck
              }
              iconClass="bg-emerald-500/10 text-emerald-600"
            />

            <MetricCard
              label="Payment Attempts"
              value={numberText(
                data.metrics
                  .paymentAttempts
                  .value
              )}
              helper="All matching merchant payment attempts"
              metric={
                data.metrics
                  .paymentAttempts
              }
              icon={
                TrendingUp
              }
              iconClass="bg-indigo-500/10 text-indigo-600"
            />

            <MetricCard
              label="Fee Revenue"
              value={moneyText(
                data.metrics
                  .feeRevenueMinor
                  .value,
                data.filters
                  .currency,
                true
              )}
              helper="Fees from completed merchant payments"
              metric={
                data.metrics
                  .feeRevenueMinor
              }
              icon={
                Banknote
              }
              iconClass="bg-fuchsia-500/10 text-fuchsia-600"
            />

            <MetricCard
              label="Engagement Rate"
              value={`${data.metrics.merchantEngagementRate.value.toFixed(
                2
              )}%`}
              helper="Transacting merchants / total merchants"
              metric={
                data.metrics
                  .merchantEngagementRate
              }
              icon={
                Users
              }
              iconClass="bg-amber-500/10 text-amber-600"
            />

            <MetricCard
              label="Completed Payments"
              value={numberText(
                data.metrics
                  .completedPayments
                  .value
              )}
              helper="Successfully completed merchant payments"
              metric={
                data.metrics
                  .completedPayments
              }
              icon={
                CheckCircle2
              }
              iconClass="bg-emerald-500/10 text-emerald-600"
            />
          </section>

          {/* =================================================
              POPULATION
          ================================================= */}

          <Panel
            title="Merchant Population Health"
            description="Current merchant account state, verification coverage and live readiness."
          >
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <PopulationCard
                label="Total"
                value={
                  data.population
                    .totalMerchants
                }
              />

              <PopulationCard
                label="Active"
                value={
                  data.population
                    .activeMerchants
                }
              />

              <PopulationCard
                label="Verified"
                value={
                  data.population
                    .verifiedMerchants
                }
                helper={`${data.population.verificationCoverage.toFixed(
                  1
                )}% coverage`}
              />

              <PopulationCard
                label="Live Enabled"
                value={
                  data.population
                    .liveEnabledMerchants
                }
                helper={`${data.population.liveReadinessRate.toFixed(
                  1
                )}% readiness`}
              />

              <PopulationCard
                label="Test Enabled"
                value={
                  data.population
                    .testEnabledMerchants
                }
              />

              <PopulationCard
                label="Pending"
                value={
                  data.population
                    .pendingMerchants
                }
              />

              <PopulationCard
                label="Suspended"
                value={
                  data.population
                    .suspendedMerchants
                }
              />

              <PopulationCard
                label="Disabled"
                value={
                  data.population
                    .disabledMerchants
                }
              />
            </div>
          </Panel>

          {/* =================================================
              TREND
          ================================================= */}

          <Panel
            title="Merchant Growth & Activity"
            description="New merchant registrations, transacting merchants and merchant payment performance."
          >
            {chartData.some(
              (
                point
              ) =>
                point.newMerchantCount >
                  0 ||
                point.paymentAttemptCount >
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
                      yAxisId="count"
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

                    <YAxis
                      yAxisId="volume"
                      orientation="right"
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
                      yAxisId="count"
                      dataKey="newMerchantCount"
                      name="New merchants"
                      fill="#8b5cf6"
                      maxBarSize={
                        18
                      }
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="transactingMerchantCount"
                      name="Transacting merchants"
                      stroke="#06b6d4"
                      strokeWidth={
                        3
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="completedPaymentCount"
                      name="Completed payments"
                      stroke="#10b981"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />

                    <Area
                      yAxisId="volume"
                      type="monotone"
                      dataKey="volumeMajor"
                      name="Completed volume"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={
                        0.08
                      }
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty message="No merchant signup or payment activity exists in this period." />
            )}
          </Panel>

          {/* =================================================
              BREAKDOWNS
          ================================================= */}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Panel
              title="Account Status"
              description="Merchant account lifecycle."
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
              title="Verification"
              description="Current KYB verification state."
            >
              <Breakdown
                rows={
                  data.verification.map(
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
              title="Business Type"
              description="Merchant population by business structure."
            >
              <Breakdown
                rows={
                  data.businessTypes.map(
                    (
                      item
                    ) => ({
                      key:
                        item.type,

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
              title="Geography"
              description="Top merchant countries."
            >
              <Breakdown
                rows={
                  data.countries.map(
                    (
                      item
                    ) => ({
                      key:
                        item.country,

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
              TOP MERCHANTS
          ================================================= */}

          <Panel
            title="Top Merchant Performance"
            description="Highest completed payment volume merchants for the selected analytics window."
          >
            {data.topMerchants.length >
            0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Merchant
                      </th>

                      <th className="border-b border-border px-3 py-3">
                        Status
                      </th>

                      <th className="border-b border-border px-3 py-3">
                        Verification
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Attempts
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Success
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Volume
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Volume Share
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Fees
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.topMerchants.map(
                      (
                        merchant
                      ) => (
                        <tr
                          key={
                            merchant.merchantId
                          }
                        >
                          <td className="border-b border-border/60 px-3 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Building2 className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="font-extrabold text-foreground">
                                  {merchant.businessDisplayName ||
                                    merchant.businessName}
                                </p>

                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                  {humanize(
                                    merchant.businessType
                                  )}{" "}
                                  ·{" "}
                                  {merchant.country}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 font-bold">
                            {humanize(
                              merchant.status
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5">
                            <div className="flex items-center gap-2">
                              {merchant.verificationStatus ===
                              "verified" ? (
                                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                              )}

                              <span className="font-bold">
                                {humanize(
                                  merchant.verificationStatus
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {numberText(
                              merchant.paymentAttempts
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {merchant.successRate.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {moneyText(
                              merchant.paymentVolumeMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {merchant.volumeShare.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {moneyText(
                              merchant.feeRevenueMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty message="No merchant payment performance exists for these filters." />
            )}
          </Panel>

          {/* =================================================
              INSIGHTS
          ================================================= */}

          <Panel
            title="Merchant Intelligence"
            description="Explainable growth, verification, activation, payment and concentration signals."
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
              READ ONLY
          ================================================= */}

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Aggregated read-only merchant intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  This Analyst page does not expose merchant API secrets,
                  owner credentials, private contact data, or verification
                  documents. It cannot verify, suspend, disable, or enable a
                  merchant.
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
   POPULATION CARD
========================================================= */

function PopulationCard({
  label,
  value,
  helper,
}: {
  label:
    string;

  value:
    number;

  helper?:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {numberText(
          value
        )}
      </p>

      {helper && (
        <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}