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
  BadgeDollarSign,
  Banknote,
  BarChart3,
  CheckCircle2,
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
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
        No revenue records
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
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
}: {
  insight:
    AnalystRevenueInsight;
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
    <div
      className={`rounded-2xl border p-4 ${style}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>

            <span className="rounded-full bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
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
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystRevenuePage() {
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
    <main className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
              <BadgeDollarSign className="h-3.5 w-3.5" />

              Revenue Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Revenue Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Gross fee capture, leakage, net revenue and revenue mix from the
              actual RevenueEvent ledger.
            </p>

            {data && (
              <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                Updated{" "}
                {formatDateTime(
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

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="text-xs">
            {error}
          </p>
        </div>
      )}

      {/* FILTERS */}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Revenue Filters
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                  {
                    option.label
                  }
                </option>
              )
            )}
          </select>

          <select
            value={
              kind
            }
            onChange={(
              event
            ) =>
              setKind(
                event.target
                  .value as
                  AnalystRevenueKind
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {KIND_OPTIONS.map(
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
          {/* METRICS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
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

          {/* TREND */}

          <Panel
            title="Revenue Performance Trend"
            description="Gross revenue, leakage and net classified revenue across the selected period."
          >
            {chartData.some(
              (
                item
              ) =>
                item.gross !==
                  0 ||
                item.leakage !==
                  0
            ) ? (
              <div className="h-[350px]">
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
                        -10,

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

                    <Area
                      type="monotone"
                      dataKey="gross"
                      name="Gross revenue"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={
                        0.1
                      }
                    />

                    <Bar
                      dataKey="leakage"
                      name="Leakage"
                      fill="#ef4444"
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
                      type="monotone"
                      dataKey="net"
                      name="Net revenue"
                      stroke="#3b82f6"
                      strokeWidth={
                        3
                      }
                      dot={
                        false
                      }
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty message="No classified revenue activity exists for the selected filters." />
            )}
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
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

          {/* INSIGHTS */}

          <Panel
            title="Revenue Intelligence"
            description="Explainable growth, leakage, concentration and data-quality signals."
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

          {/* READ ONLY */}

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
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
          </section>
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