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
  CheckCircle2,
  DatabaseZap,
  GitCompareArrows,
  RefreshCcw,
  ShieldAlert,
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
  getAnalystTransactionAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystTransactionAnalyticsData,
  type AnalystTransactionInsight,
  type AnalystTransactionRisk,
  type AnalystTransactionStatus,
  type AnalystTransactionType,
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
  value: AnalystTransactionStatus;
  label: string;
}> = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "FAILED",
    label: "Failed",
  },
];

const TYPE_OPTIONS: Array<{
  value: AnalystTransactionType;
  label: string;
}> = [
  {
    value: "all",
    label: "All types",
  },
  {
    value: "TRANSFER",
    label: "Transfer",
  },
  {
    value: "DEPOSIT",
    label: "Deposit",
  },
  {
    value: "WITHDRAW",
    label: "Withdraw",
  },
];

const RISK_OPTIONS: Array<{
  value: AnalystTransactionRisk;
  label: string;
}> = [
  {
    value: "all",
    label: "All risk levels",
  },
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "CRITICAL",
    label: "Critical",
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
  ).format(
    value
  );
}

function bucketText(
  value: string,
  range: AnalystRange
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
  ).format(
    date
  );
}

function dateTimeText(
  value: string
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
      dateStyle: "medium",
      timeStyle: "short",
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
    change >
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
      <Empty message="No matching breakdown records were found." />
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
            <div className="mb-2 flex items-center justify-between gap-4 text-xs">
              <span className="font-bold text-foreground">
                {humanize(
                  row.key
                )}
              </span>

              <span className="font-bold text-muted-foreground">
                {numberText(
                  row.count
                )}{" "}
                ·{" "}
                {row.percentage.toFixed(
                  2
                )}
                %
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
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
   EMPTY
========================================================= */

function Empty({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold text-foreground">
        No transaction data
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
  insight: AnalystTransactionInsight;
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
    <div
      className={`rounded-2xl border p-4 ${style}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {insight.description}
          </p>

          <p className="mt-3 text-[11px] font-bold text-foreground">
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

export default function AnalystTransactionsPage() {
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
    useState<AnalystTransactionStatus>(
      "all"
    );

  const [
    type,
    setType,
  ] =
    useState<AnalystTransactionType>(
      "all"
    );

  const [
    risk,
    setRisk,
  ] =
    useState<AnalystTransactionRisk>(
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
    useState<AnalystTransactionAnalyticsData | null>(
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

          setError(
            ""
          );

          const result =
            await getAnalystTransactionAnalytics(
              {
                range,
                currency,
                status,
                type,
                risk,
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
                : "Unable to load transaction analytics."
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
      currency,
      status,
      type,
      risk,
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
          <GitCompareArrows className="mx-auto h-9 w-9 animate-pulse text-primary" />

          <p className="mt-3 text-sm font-extrabold">
            Loading transaction intelligence
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
              <GitCompareArrows className="h-3.5 w-3.5" />

              Wallet Transaction Intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Transaction Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Read-only operational analytics for transfers, deposits,
              withdrawals, transaction reliability and risk.
            </p>

            {data && (
              <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                Updated{" "}
                {dateTimeText(
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
        <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />

          <p className="text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* FILTERS */}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
              status
            }
            onChange={(
              event
            ) =>
              setStatus(
                event.target
                  .value as
                  AnalystTransactionStatus
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {STATUS_OPTIONS.map(
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
              type
            }
            onChange={(
              event
            ) =>
              setType(
                event.target
                  .value as
                  AnalystTransactionType
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {TYPE_OPTIONS.map(
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
              risk
            }
            onChange={(
              event
            ) =>
              setRisk(
                event.target
                  .value as
                  AnalystTransactionRisk
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
          >
            {RISK_OPTIONS.map(
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
              maxLength={
                3
              }
              className="h-11 min-w-0 flex-1 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black uppercase outline-none"
            />

            <button
              type="submit"
              className="rounded-r-xl bg-primary px-3 text-[10px] font-black uppercase text-primary-foreground"
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
              label="Transactions"
              value={numberText(
                data.metrics
                  .transactionCount
                  .value
              )}
              description="All matching wallet transactions"
              metric={
                data.metrics
                  .transactionCount
              }
              icon={
                GitCompareArrows
              }
              iconClass="bg-blue-500/10 text-blue-600"
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
              )} completed`}
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
              label="Failure Rate"
              value={`${data.metrics.failureRate.value.toFixed(
                2
              )}%`}
              description={`${numberText(
                data.metrics
                  .failedCount
                  .value
              )} failed`}
              metric={
                data.metrics
                  .failureRate
              }
              icon={
                XCircle
              }
              iconClass="bg-red-500/10 text-red-600"
              inverse
            />

            <MetricCard
              label="High-risk Share"
              value={`${data.metrics.highRiskRate.value.toFixed(
                2
              )}%`}
              description={`${numberText(
                data.metrics
                  .highRiskCount
                  .value
              )} high-risk transactions`}
              metric={
                data.metrics
                  .highRiskRate
              }
              icon={
                ShieldAlert
              }
              iconClass="bg-orange-500/10 text-orange-600"
              inverse
            />
          </section>

          {/* TREND */}

          <Panel
            title="Transaction Reliability Trend"
            description="Transaction activity, completion, failures and high-risk records across the selected period."
          >
            {chartData.some(
              (
                point
              ) =>
                point.transactionCount >
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
                      right: 10,
                      left: -18,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={
                        false
                      }
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

                    <Tooltip />

                    <Bar
                      dataKey="failedCount"
                      name="Failed"
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

                    <Bar
                      dataKey="highRiskCount"
                      name="High risk"
                      fill="#f59e0b"
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
                      dataKey="transactionCount"
                      name="Transactions"
                      stroke="#3b82f6"
                      strokeWidth={
                        3
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="completedCount"
                      name="Completed"
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
              <Empty message="No wallet transaction activity matches the selected filters." />
            )}
          </Panel>

          {/* BREAKDOWNS */}

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel
              title="Transaction Status"
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
              title="Transaction Types"
              description="Transfer, deposit and withdrawal activity."
            >
              <Breakdown
                rows={
                  data.types.map(
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
              title="Risk Distribution"
              description="Aggregate risk classifications without financial value exposure."
            >
              <Breakdown
                rows={
                  data.risks.map(
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
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* FAILURE REASONS */}

            <Panel
              title="Failure Reasons"
              description="Most frequent failure codes or recorded failure reasons."
            >
              <Breakdown
                rows={
                  data.failureReasons.map(
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

            {/* INSIGHTS */}

            <Panel
              title="Transaction Intelligence"
              description="Deterministic reliability, backlog and risk signals."
            >
              <div className="space-y-3">
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
          </div>

          {/* PRIVACY */}

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

              <div>
                <p className="text-xs font-extrabold">
                  Privacy-safe transaction intelligence
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {data.privacy.note}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
