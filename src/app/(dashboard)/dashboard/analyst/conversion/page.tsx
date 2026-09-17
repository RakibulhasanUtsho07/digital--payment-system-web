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
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  CircleDotDashed,
  DatabaseZap,
  Filter,
  RefreshCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
  getAnalystConversionAnalytics,
  type AnalystConversionData,
  type AnalystConversionInsight,
  type AnalystMetric,
  type AnalystMode,
  type AnalystPaymentSource,
  type AnalystRange,
} from "@/lib/api/analystApi";

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

const SOURCE_OPTIONS: Array<{
  value:
    AnalystPaymentSource;

  label:
    string;
}> = [
  {
    value: "all",
    label: "All sources",
  },
  {
    value: "wallet",
    label: "Wallet",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "paypal",
    label: "PayPal",
  },
  {
    value: "local_psp",
    label: "Local PSP",
  },
];

/* =========================================================
   FORMATTERS
========================================================= */

function numberText(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function dateText(
  value: string
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

function bucketText(
  value: string,
  range: AnalystRange
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
    range === "24h"
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

/* =========================================================
   CHANGE LABEL
========================================================= */

function Change({
  metric,
  inverse = false,
}: {
  metric:
    AnalystMetric;

  inverse?:
    boolean;
}) {
  const value =
    metric.changePercent;

  if (
    value ===
    null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  if (
    value ===
    0
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No change vs previous
      </span>
    );
  }

  const rising =
    value >
    0;

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
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {Math.abs(
        value
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
  description,
  metric,
  icon: Icon,
  iconClass,
  inverse,
}: {
  label: string;
  value: string;
  description: string;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
  inverse?: boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
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
            {description}
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
  message: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold">
        No conversion data
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
    AnalystConversionInsight;
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
      ? BadgeCheck
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

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase">
              {insight.severity}
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

export default function AnalystConversionPage() {
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
    useState<AnalystPaymentSource>(
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
    useState<AnalystConversionData | null>(
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

          const result =
            await getAnalystConversionAnalytics(
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
                : "Unable to load conversion analytics."
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
              bucketText(
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

  /* =======================================================
     FILTER APPLY
  ====================================================== */

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
          <TrendingUp className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Building conversion funnel
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Reading real payment lifecycle records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[90px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-3.5 w-3.5" />

              Lifecycle Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Payment Conversion
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Follow real payments from creation through authorization,
              capture and successful completion.
            </p>

            {data && (
              <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                Updated{" "}
                {dateText(
                  data.generatedAt
                )}{" "}
                · Engine{" "}
                {
                  data
                    .calculationEngine
                    .version
                }
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
                  value
                ) =>
                  value +
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
            Conversion Filters
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
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
              source
            }
            onChange={(
              event
            ) =>
              setSource(
                event.target
                  .value as
                  AnalystPaymentSource
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
                  {
                    option.label
                  }
                </option>
              )
            )}
          </select>
        </div>

        <form
          onSubmit={
            applyTextFilters
          }
          className="mt-3 grid gap-3 sm:grid-cols-[150px_1fr_auto]"
        >
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
            placeholder="BDT"
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-black uppercase"
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
            placeholder="Provider filter, e.g. paypal"
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-primary px-5 text-xs font-extrabold text-primary-foreground"
          >
            Apply
          </button>
        </form>
      </section>

      {data && (
        <>
          {/* METRICS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Created"
              value={numberText(
                data.metrics
                  .createdCount
                  .value
              )}
              description="Payments entering the funnel"
              metric={
                data.metrics
                  .createdCount
              }
              icon={
                CircleDotDashed
              }
              iconClass="bg-blue-500/10 text-blue-600"
            />

            <MetricCard
              label="Authorization Rate"
              value={`${data.metrics.authorizationRate.value.toFixed(
                2
              )}%`}
              description={`${numberText(
                data.metrics
                  .authorizedCount
                  .value
              )} reached authorization`}
              metric={
                data.metrics
                  .authorizationRate
              }
              icon={
                Activity
              }
              iconClass="bg-cyan-500/10 text-cyan-600"
            />

            <MetricCard
              label="Completion Rate"
              value={`${data.metrics.completionRate.value.toFixed(
                2
              )}%`}
              description={`${numberText(
                data.metrics
                  .completedCount
                  .value
              )} completed payments`}
              metric={
                data.metrics
                  .completionRate
              }
              icon={
                CheckCircle2
              }
              iconClass="bg-emerald-500/10 text-emerald-600"
            />

            <MetricCard
              label="Terminal Drop-off"
              value={`${data.metrics.terminalDropoffRate.value.toFixed(
                2
              )}%`}
              description="Failed, cancelled or expired"
              metric={
                data.metrics
                  .terminalDropoffRate
              }
              icon={
                TrendingDown
              }
              iconClass="bg-red-500/10 text-red-600"
              inverse
            />
          </section>

          {/* FUNNEL */}

          <Panel
            title="Payment Lifecycle Funnel"
            description="Stage reach is calculated from lifecycle timestamps and current payment status."
          >
            {data.metrics
              .createdCount
              .value >
            0 ? (
              <div className="space-y-4">
                {data.funnel.map(
                  (
                    stage,
                    index
                  ) => (
                    <div
                      key={
                        stage.stage
                      }
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold">
                            {humanize(
                              stage.stage
                            )}
                          </p>

                          {index >
                            0 && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {stage.percentageFromPrevious.toFixed(
                                2
                              )}
                              % from previous stage
                              {" · "}
                              {numberText(
                                stage.notReachedFromPrevious
                              )}{" "}
                              have not reached this stage
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-black">
                            {numberText(
                              stage.count
                            )}
                          </p>

                          <p className="text-[10px] font-bold text-muted-foreground">
                            {stage.percentageFromStart.toFixed(
                              2
                            )}
                            % of created
                          </p>
                        </div>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{
                            width:
                              0,
                          }}
                          animate={{
                            width:
                              `${Math.min(
                                100,
                                stage.percentageFromStart
                              )}%`,
                          }}
                          transition={{
                            duration:
                              0.7,

                            delay:
                              index *
                              0.08,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <Empty message="No payments entered the funnel for these filters." />
            )}
          </Panel>

          {/* TREND */}

          <Panel
            title="Conversion Trend"
            description="Created, completed and failed payments with overall completion rate."
          >
            {chartData.some(
              (
                point
              ) =>
                point.createdCount >
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
                      top: 10,
                      right: 15,
                      left: -15,
                      bottom: 0,
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
                        fontSize: 10,
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
                        fontSize: 10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <YAxis
                      yAxisId="rate"
                      orientation="right"
                      domain={[
                        0,
                        100,
                      ]}
                      tick={{
                        fontSize: 10,
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
                      dataKey="createdCount"
                      name="Created"
                      fill="#6366f1"
                      maxBarSize={
                        20
                      }
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="failedCount"
                      name="Failed"
                      fill="#ef4444"
                      maxBarSize={
                        16
                      }
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="completedCount"
                      name="Completed"
                      stroke="#10b981"
                      strokeWidth={
                        2.5
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="completionRate"
                      name="Completion %"
                      stroke="#8b5cf6"
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
              <Empty message="No conversion trend is available for the selected period." />
            )}
          </Panel>

          {/* PROVIDERS + DROPOFF */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              title="Provider Conversion"
              description="Compare payment completion performance across providers."
            >
              {data.providers.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3">
                          Provider
                        </th>

                        <th className="pb-3 text-right">
                          Created
                        </th>

                        <th className="pb-3 text-right">
                          Completed
                        </th>

                        <th className="pb-3 text-right">
                          Failed
                        </th>

                        <th className="pb-3 text-right">
                          Conversion
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.providers.map(
                        (
                          item
                        ) => (
                          <tr
                            key={
                              item.provider
                            }
                            className="border-t border-border/60"
                          >
                            <td className="py-3 font-extrabold">
                              {humanize(
                                item.provider
                              )}
                            </td>

                            <td className="py-3 text-right font-bold">
                              {numberText(
                                item.createdCount
                              )}
                            </td>

                            <td className="py-3 text-right font-bold text-emerald-600">
                              {numberText(
                                item.completedCount
                              )}
                            </td>

                            <td className="py-3 text-right font-bold text-red-600">
                              {numberText(
                                item.failedCount
                              )}
                            </td>

                            <td className="py-3 text-right font-black">
                              {item.completionRate.toFixed(
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
                <Empty message="No provider conversion data matches the filters." />
              )}
            </Panel>

            <Panel
              title="Terminal Outcomes"
              description="Why payments did not currently complete."
            >
              <div className="space-y-4">
                {data.dropoffs.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.reason
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className="text-xs font-extrabold">
                          {humanize(
                            item.reason
                          )}
                        </p>

                        <p className="text-xs font-bold text-muted-foreground">
                          {numberText(
                            item.count
                          )}{" "}
                          ·{" "}
                          {item.percentage.toFixed(
                            2
                          )}
                          %
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
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
            </Panel>
          </div>

          {/* SOURCE */}

          <Panel
            title="Source Conversion"
            description="Completion performance across wallet, card, PayPal and local PSP traffic."
          >
            {data.sources.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.sources.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.source
                      }
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="text-xs font-extrabold">
                        {humanize(
                          item.source
                        )}
                      </p>

                      <p className="mt-3 text-2xl font-black">
                        {item.completionRate.toFixed(
                          2
                        )}
                        %
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {numberText(
                          item.completedCount
                        )}{" "}
                        completed /{" "}
                        {numberText(
                          item.createdCount
                        )}{" "}
                        created
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <Empty message="No payment source data is available." />
            )}
          </Panel>

          {/* INSIGHTS */}

          <Panel
            title="Conversion Intelligence"
            description="Explainable lifecycle findings calculated from real payment records."
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

          {/* OPERATIONS */}

          <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
            <Operation
              label="In progress"
              value={
                data.operations
                  .pendingCount
              }
            />

            <Operation
              label="Failed"
              value={
                data.operations
                  .failedCount
              }
            />

            <Operation
              label="Cancelled"
              value={
                data.operations
                  .cancelledCount
              }
            />

            <Operation
              label="Expired"
              value={
                data.operations
                  .expiredCount
              }
            />
          </section>
        </>
      )}
    </main>
  );
}

/* =========================================================
   OPERATION
========================================================= */

function Operation({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {numberText(
          value
        )}
      </p>
    </div>
  );
}
