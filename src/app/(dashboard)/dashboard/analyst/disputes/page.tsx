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
  getAnalystDisputeAnalytics,
  type AnalystDisputeAnalyticsData,
  type AnalystDisputeInsight,
  type AnalystDisputeStatus,
  type AnalystMetric,
  type AnalystMode,
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

          <p className="mt-3 truncate text-2xl font-black">
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
        <h2 className="text-base font-extrabold">
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

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
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
    <article
      className={`rounded-2xl border p-4 ${style}`}
    >
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
    </article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystDisputesPage() {
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
          <Scale className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading dispute intelligence
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-rose-600">
              <Gavel className="h-3.5 w-3.5" />

              Dispute Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Dispute Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Monitor open exposure, dispute aging, outcomes,
              merchant concentration and provider performance.
            </p>

            {data && (
              <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                Updated{" "}
                {formatDate(
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

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />

          <p className="text-xs">
            {error}
          </p>
        </div>
      )}

      {/* FILTERS */}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={range}
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
            ) =>
              setStatus(
                event.target
                  .value as
                  AnalystDisputeStatus
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
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
          </section>

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
              <div className="h-[360px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={chartData}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 4"
                      opacity={0.15}
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
                      stroke="#e11d48"
                      fill="#e11d48"
                      fillOpacity={0.08}
                    />

                    <Bar
                      yAxisId="count"
                      dataKey="lostCount"
                      name="Lost"
                      fill="#f97316"
                      maxBarSize={16}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="openCount"
                      name="Open"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={false}
                    />

                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="wonCount"
                      name="Won"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
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
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {humanize(
                              provider.provider
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              provider.disputeCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-amber-600">
                            {formatNumber(
                              provider.openCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-red-600">
                            {formatNumber(
                              provider.lostCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatMoney(
                              provider.exposureMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
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
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {merchant.businessName}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              merchant.disputeCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatNumber(
                              merchant.openCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-red-600">
                            {formatNumber(
                              merchant.lostCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {formatMoney(
                              merchant.exposureMinor,
                              data.filters
                                .currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
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

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Read-only dispute intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts cannot change dispute status, submit evidence,
                  mark a case won or lost, refund a payment, or modify merchant
                  balances from this workspace.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}