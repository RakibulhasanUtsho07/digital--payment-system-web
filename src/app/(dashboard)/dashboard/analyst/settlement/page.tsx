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
  Banknote,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Landmark,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  TimerReset,
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
  getAnalystSettlementAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystSettlementAnalyticsData,
  type AnalystSettlementInsight,
  type AnalystSettlementStatus,
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

const STATUS_OPTIONS: Array<{
  value:
    AnalystSettlementStatus;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All settlements",
  },

  {
    value:
      "pending",

    label:
      "Pending",
  },

  {
    value:
      "processing",

    label:
      "Processing",
  },

  {
    value:
      "settled",

    label:
      "Settled",
  },

  {
    value:
      "failed",

    label:
      "Failed",
  },

  {
    value:
      "cancelled",

    label:
      "Cancelled",
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

function moneyText(
  minor: number,
  currency: string,
  compact = false
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

function durationText(
  seconds: number
): string {
  if (
    seconds < 60
  ) {
    return `${seconds.toFixed(
      1
    )}s`;
  }

  if (
    seconds < 3600
  ) {
    return `${(
      seconds / 60
    ).toFixed(
      1
    )}m`;
  }

  if (
    seconds < 86400
  ) {
    return `${(
      seconds / 3600
    ).toFixed(
      1
    )}h`;
  }

  return `${(
    seconds / 86400
  ).toFixed(
    1
  )}d`;
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
   CHANGE
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
  const change =
    metric.changePercent;

  if (
    change === null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  if (
    change === 0
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No change vs previous
      </span>
    );
  }

  const rising =
    change > 0;

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
   BREAKDOWN
========================================================= */

function Breakdown({
  rows,
}: {
  rows:
    Array<{
      key: string;
      count: number;
      percentage: number;
    }>;
}) {
  return (
    <div className="space-y-4">
      {rows.map(
        (row) => (
          <div key={row.key}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold">
                {humanize(
                  row.key
                )}
              </span>

              <span className="text-[11px] font-bold text-muted-foreground">
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
    AnalystSettlementInsight;
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
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {insight.description}
          </p>

          <p className="mt-3 text-[10px] font-black uppercase text-foreground">
            Evidence
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {insight.evidence}
          </p>

          <p className="mt-3 text-[11px] text-muted-foreground">
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

export default function AnalystSettlementPage() {
  const [
    range,
    setRange,
  ] =
    useState<AnalystRange>(
      "30d"
    );

  const [
    status,
    setStatus,
  ] =
    useState<AnalystSettlementStatus>(
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
    useState<AnalystSettlementAnalyticsData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  useEffect(
    () => {
      const controller =
        new AbortController();

      let active =
        true;

      async function load() {
        try {
          if (data) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await getAnalystSettlementAnalytics(
              {
                range,
                currency,
                status,
              },
              controller.signal
            );

          if (active) {
            setData(response);
          }
        } catch (loadError) {
          if (
            active &&
            !controller.signal.aborted
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load settlement analytics."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      }

      void load();

      return () => {
        active = false;
        controller.abort();
      };
    },
    [
      range,
      currency,
      status,
      refreshKey,
    ]
  );

  const chartData =
    useMemo(
      () =>
        data?.trend.map(
          (point) => ({
            ...point,

            label:
              bucketText(
                point.bucket,
                range
              ),

            netMajor:
              point.netAmountMinor /
              100,
          })
        ) ?? [],
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

    setCurrency(next);
  }

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Landmark className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading settlement intelligence
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
              <Landmark className="h-3.5 w-3.5" />

              Settlement Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Settlement Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Monitor settlement value, fees, refunds, merchant concentration,
              aging and payout reconciliation.
            </p>

            {data && (
              <>
                <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                  Updated{" "}
                  {dateText(
                    data.generatedAt
                  )}
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {data.scopeNote}
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              setRefreshKey(
                (current) =>
                  current + 1
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-extrabold"
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
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={range}
            onChange={(event) =>
              setRange(
                event.target
                  .value as
                  AnalystRange
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {RANGE_OPTIONS.map(
              (option) => (
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
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  AnalystSettlementStatus
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {STATUS_OPTIONS.map(
              (option) => (
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
            onSubmit={applyCurrency}
            className="flex"
          >
            <input
              value={currencyDraft}
              maxLength={3}
              onChange={(event) =>
                setCurrencyDraft(
                  event.target.value
                    .replace(
                      /[^a-z]/gi,
                      ""
                    )
                    .slice(0, 3)
                    .toUpperCase()
                )
              }
              className="h-11 min-w-0 flex-1 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black"
            />

            <button
              type="submit"
              className="rounded-r-xl bg-primary px-4 text-xs font-black text-primary-foreground"
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
              label="Settlements"
              value={numberText(
                data.metrics
                  .settlementCount
                  .value
              )}
              helper="Settlement records"
              metric={
                data.metrics
                  .settlementCount
              }
              icon={Landmark}
              iconClass="bg-blue-500/10 text-blue-600"
            />

            <MetricCard
              label="Gross Value"
              value={moneyText(
                data.metrics
                  .grossAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Gross settlement value"
              metric={
                data.metrics
                  .grossAmountMinor
              }
              icon={Banknote}
              iconClass="bg-violet-500/10 text-violet-600"
            />

            <MetricCard
              label="Net Payable"
              value={moneyText(
                data.metrics
                  .netAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Merchant net settlement value"
              metric={
                data.metrics
                  .netAmountMinor
              }
              icon={WalletCards}
              iconClass="bg-emerald-500/10 text-emerald-600"
            />

            <MetricCard
              label="Settlement Rate"
              value={`${data.metrics.settlementRate.value.toFixed(
                2
              )}%`}
              helper={`${numberText(
                data.metrics
                  .settledCount
                  .value
              )} settled`}
              metric={
                data.metrics
                  .settlementRate
              }
              icon={CheckCircle2}
              iconClass="bg-cyan-500/10 text-cyan-600"
            />

            <MetricCard
              label="Platform Fees"
              value={moneyText(
                data.metrics
                  .feeAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Fees included in settlements"
              metric={
                data.metrics
                  .feeAmountMinor
              }
              icon={Scale}
              iconClass="bg-indigo-500/10 text-indigo-600"
            />

            <MetricCard
              label="Refund Adjustments"
              value={moneyText(
                data.metrics
                  .refundAmountMinor
                  .value,
                data.filters.currency,
                true
              )}
              helper="Refund value reconciled"
              metric={
                data.metrics
                  .refundAmountMinor
              }
              icon={ArrowDownRight}
              iconClass="bg-orange-500/10 text-orange-600"
              inverse
            />

            <MetricCard
              label="Completion Time"
              value={durationText(
                data.metrics
                  .averageSettlementSeconds
                  .value
              )}
              helper="Average creation → settled"
              metric={
                data.metrics
                  .averageSettlementSeconds
              }
              icon={TimerReset}
              iconClass="bg-amber-500/10 text-amber-600"
              inverse
            />

            <MetricCard
              label="Failed Settlements"
              value={numberText(
                data.operations
                  .failedCount
              )}
              helper={`${numberText(
                data.operations
                  .pendingCount
              )} pending`}
              metric={
                data.metrics
                  .settlementCount
              }
              icon={XCircle}
              iconClass="bg-red-500/10 text-red-600"
              inverse
            />
          </section>

          {/* OPERATIONS */}

          <Panel
            title="Settlement Operations"
            description="Settlement lifecycle, item release and payout linkage."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <OperationCard
                label="Pending"
                value={
                  data.operations
                    .pendingCount
                }
              />

              <OperationCard
                label="Processing"
                value={
                  data.operations
                    .processingCount
                }
              />

              <OperationCard
                label="Payments"
                value={
                  data.operations
                    .paymentCount
                }
              />

              <OperationCard
                label="Settlement Items"
                value={
                  data.operations
                    .settlementItemCount
                }
              />

              <OperationCard
                label="Released Items"
                value={
                  data.operations
                    .releasedItemCount
                }
              />

              <OperationCard
                label="Payout Linked"
                value={
                  data.operations
                    .payoutLinkedCount
                }
                helper={`${data.operations.payoutLinkRate.toFixed(
                  1
                )}% linkage`}
              />

              <OperationCard
                label="Failed"
                value={
                  data.operations
                    .failedCount
                }
              />

              <OperationCard
                label="Cancelled"
                value={
                  data.operations
                    .cancelledCount
                }
              />
            </div>
          </Panel>

          {/* TREND */}

          <Panel
            title="Settlement Trend"
            description="Settlement lifecycle and net merchant payable value."
          >
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
                    dataKey="netMajor"
                    name="Net settlement value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.08}
                  />

                  <Bar
                    yAxisId="count"
                    dataKey="failedCount"
                    name="Failed"
                    fill="#ef4444"
                    maxBarSize={15}
                  />

                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="settledCount"
                    name="Settled"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="pendingCount"
                    name="Pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Status Distribution"
              description="Settlement lifecycle states."
            >
              <Breakdown
                rows={
                  data.statuses.map(
                    (item) => ({
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
              title="Open Settlement Aging"
              description="Current pending and processing settlement age."
            >
              <Breakdown
                rows={
                  data.aging.map(
                    (item) => ({
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
              title="Payout Methods"
              description="Methods used by linked merchant payouts."
            >
              <Breakdown
                rows={
                  data.payoutMethods.map(
                    (item) => ({
                      key:
                        item.method,

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

          {/* RECONCILIATION */}

          <Panel
            title="Settlement → Payout Reconciliation"
            description="Relationship between settlement net value and linked payout records."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReconciliationCard
                label="Linked Settlements"
                value={numberText(
                  data
                    .payoutReconciliation
                    .linkedSettlementCount
                )}
              />

              <ReconciliationCard
                label="Completed Payouts"
                value={numberText(
                  data
                    .payoutReconciliation
                    .completedPayoutCount
                )}
              />

              <ReconciliationCard
                label="Settlement Net"
                value={moneyText(
                  data
                    .payoutReconciliation
                    .linkedSettlementNetMinor,
                  data.filters.currency,
                  true
                )}
              />

              <ReconciliationCard
                label="Payout Net"
                value={moneyText(
                  data
                    .payoutReconciliation
                    .payoutNetMinor,
                  data.filters.currency,
                  true
                )}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Linked Value Difference
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {moneyText(
                      data
                        .payoutReconciliation
                        .differenceMinor,
                      data.filters.currency
                    )}
                  </p>
                </div>

                <div className="text-right text-[11px] text-muted-foreground">
                  <p>
                    Pending payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .pendingPayoutCount
                    }
                  </p>

                  <p>
                    Processing payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .processingPayoutCount
                    }
                  </p>

                  <p>
                    Failed payout:{" "}
                    {
                      data
                        .payoutReconciliation
                        .failedPayoutCount
                    }
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* MERCHANT TABLE */}

          <Panel
            title="Merchant Settlement Performance"
            description="Highest settlement net-value merchants in the selected period."
          >
            {data.merchants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase text-muted-foreground">
                      <th className="border-b border-border px-3 py-3">
                        Merchant
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Settlements
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Settled
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Pending
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Gross
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Fees
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Refunds
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Net
                      </th>

                      <th className="border-b border-border px-3 py-3 text-right">
                        Share
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.merchants.map(
                      (merchant) => (
                        <tr
                          key={
                            merchant.merchantId
                          }
                        >
                          <td className="border-b border-border/60 px-3 py-3.5 font-extrabold">
                            {merchant.businessName}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">
                            {numberText(
                              merchant.settlementCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-emerald-600">
                            {numberText(
                              merchant.settledCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-amber-600">
                            {numberText(
                              merchant.pendingCount
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.grossAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.feeAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right">
                            {moneyText(
                              merchant.refundAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {moneyText(
                              merchant.netAmountMinor,
                              data.filters.currency,
                              true
                            )}
                          </td>

                          <td className="border-b border-border/60 px-3 py-3.5 text-right font-black">
                            {merchant.netShare.toFixed(
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
              <div className="flex min-h-40 items-center justify-center">
                <DatabaseZap className="h-7 w-7 text-muted-foreground/40" />
              </div>
            )}
          </Panel>

          {/* INSIGHTS */}

          <Panel
            title="Settlement Intelligence"
            description="Explainable settlement reliability, aging, concentration and payout reconciliation signals."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {data.insights.map(
                (insight) => (
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
              <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Read-only settlement intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Analysts cannot create settlements, release settlement
                  items, request payouts, process payouts, alter ledger
                  balances, or modify settlement status.
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
   SMALL CARDS
========================================================= */

function OperationCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {numberText(value)}
      </p>

      {helper && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

function ReconciliationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>
    </div>
  );
}