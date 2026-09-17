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
  BadgeCheck,
  Banknote,
  BrainCircuit,
  CreditCard,
  DatabaseZap,
  LockKeyhole,
  RefreshCcw,
  Repeat2,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
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
  getAnalystWalletAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystWalletAnalyticsData,
  type AnalystWalletInsight,
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
   FORMAT
========================================================= */

function formatNumber(
  value:
    number
) {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(
    value
  );
}

function formatPercent(
  value:
    number
) {
  return `${value.toFixed(
    1
  )}%`;
}

function formatMoney(
  minor:
    number,
  currency:
    string
) {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

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
      "en-BD"
    )}`;
  }
}

function formatDate(
  value:
    string
) {
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
) {
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
    ReactNode;

  action?:
    ReactNode;
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
   CHANGE
========================================================= */

function ChangeBadge({
  metric,
}: {
  metric:
    AnalystMetric;
}) {
  if (
    metric.changePercent ===
    null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        New vs previous period
      </span>
    );
  }

  const positive =
    metric.changePercent >=
    0;

  const Icon =
    positive
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
        metric.changePercent
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
  metric,
  icon: Icon,
  iconClass,
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

          <p className="mt-3 truncate text-2xl font-black text-card-foreground">
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
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title:
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
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </p>

          <p className="mt-3 text-2xl font-black text-card-foreground">
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
   EMPTY
========================================================= */

function EmptyData({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />

      <p className="mt-3 text-sm font-bold text-foreground">
        No wallet activity
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {text}
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
    AnalystWalletInsight;
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4 w-4" />
        </div>

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

          <div className="mt-3 rounded-xl bg-background/70 p-3">
            <p className="text-[11px] font-bold text-foreground">
              Evidence
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-foreground/80">
            <strong>
              Recommended review:
            </strong>{" "}
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

export default function AnalystWalletsPage() {
  const [
    range,
    setRange,
  ] =
    useState<AnalystRange>(
      "30d"
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
    useState<
      AnalystWalletAnalyticsData |
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
     FETCH
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
              await getAnalystWalletAnalytics(
                {
                  range,

                  currency,
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
                : "Unable to load wallet analytics."
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
      currency,
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
          "Currency must be a valid three-letter code."
        );

        return;
      }

      setCurrency(
        normalized
      );
    };

  /* =======================================================
     CHART
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

            engaged:
              item.engagedWallets,

            newWallets:
              item.newWallets,

            p2p:
              item.p2pTransferCount,

            merchant:
              item.merchantPaymentCount,

            funding:
              item.fundingCount,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  const usageData =
    useMemo(
      () =>
        data?.usageMix ??
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
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    !data &&
    error
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-red-500/20 bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-black">
            Wallet analytics unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (
                  value
                ) =>
                  value +
                  1
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
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

  const statusClass =
    data.status ===
    "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
      : data.status ===
          "attention"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${statusClass}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />

                Network {data.status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <WalletCards className="h-3.5 w-3.5" />

                Coffer Wallet Network
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Wallet Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Analyze wallet adoption, engagement, P2P usage,
              funding activity and Coffer Wallet merchant-payment
              behavior without duplicating Transaction Analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase text-muted-foreground">
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
            </label>

            <form
              onSubmit={
                applyCurrency
              }
            >
              <span className="mb-1.5 block text-[10px] font-black uppercase text-muted-foreground">
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
                  className="h-11 w-20 rounded-l-xl border border-border bg-background px-3 text-center text-xs font-black"
                />

                <button
                  type="submit"
                  className="h-11 rounded-r-xl border border-l-0 border-border bg-muted px-3 text-[10px] font-black uppercase"
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
                    value
                  ) =>
                    value +
                    1
                )
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50"
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

        <div className="relative mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>
            Updated{" "}
            {formatDate(
              data.generatedAt
            )}
          </span>

          <span>
            {data.filters.currency}
          </span>

          <span>
            Personal wallets only
          </span>

          <span>
            Live merchant payments
          </span>
        </div>
      </section>

      {/* POPULATION */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total wallets"
          value={formatNumber(
            data.population
              .totalWallets
          )}
          description="Personal Coffer wallets"
          icon={
            WalletCards
          }
          iconClass="bg-blue-500/10 text-blue-600"
        />

        <SummaryCard
          title="Active status"
          value={formatNumber(
            data.population
              .activeStatusWallets
          )}
          description={`${formatPercent(
            data.population
              .activeStatusRate
          )} of wallets`}
          icon={
            BadgeCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <SummaryCard
          title="Dormant this period"
          value={formatNumber(
            data.population
              .dormantWallets
          )}
          description={`${formatPercent(
            data.population
              .dormantWalletRate
          )} had no activity`}
          icon={
            Activity
          }
          iconClass="bg-amber-500/10 text-amber-600"
        />

        <SummaryCard
          title="Locked wallets"
          value={formatNumber(
            data.population
              .lockedWallets
          )}
          description={`${data.population.frozenWallets} frozen · ${data.population.blockedWallets} blocked`}
          icon={
            LockKeyhole
          }
          iconClass="bg-red-500/10 text-red-600"
        />
      </section>

      {/* METRICS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Engaged wallets"
          value={formatNumber(
            data.metrics
              .engagedWallets
              .value
          )}
          metric={
            data.metrics
              .engagedWallets
          }
          icon={
            UserRoundCheck
          }
          iconClass="bg-blue-500/10 text-blue-600"
        />

        <MetricCard
          label="New wallets"
          value={formatNumber(
            data.metrics
              .newWallets
              .value
          )}
          metric={
            data.metrics
              .newWallets
          }
          icon={
            WalletCards
          }
          iconClass="bg-cyan-500/10 text-cyan-600"
        />

        <MetricCard
          label="Merchant-paying"
          value={formatNumber(
            data.metrics
              .merchantPayingWallets
              .value
          )}
          metric={
            data.metrics
              .merchantPayingWallets
          }
          icon={
            CreditCard
          }
          iconClass="bg-violet-500/10 text-violet-600"
        />

        <MetricCard
          label="P2P wallets"
          value={formatNumber(
            data.metrics
              .p2pWallets
              .value
          )}
          metric={
            data.metrics
              .p2pWallets
          }
          icon={
            UsersRound
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <MetricCard
          label="Repeat engaged"
          value={formatNumber(
            data.metrics
              .repeatEngagedWallets
              .value
          )}
          metric={
            data.metrics
              .repeatEngagedWallets
          }
          icon={
            Repeat2
          }
          iconClass="bg-indigo-500/10 text-indigo-600"
        />

        <MetricCard
          label="Wallet events"
          value={formatNumber(
            data.metrics
              .walletActivityEvents
              .value
          )}
          metric={
            data.metrics
              .walletActivityEvents
          }
          icon={
            TrendingUp
          }
          iconClass="bg-cyan-500/10 text-cyan-600"
        />

        <MetricCard
          label="Merchant payments"
          value={formatNumber(
            data.metrics
              .merchantPaymentCount
              .value
          )}
          metric={
            data.metrics
              .merchantPaymentCount
          }
          icon={
            CreditCard
          }
          iconClass="bg-fuchsia-500/10 text-fuchsia-600"
        />

        <MetricCard
          label="P2P transfers"
          value={formatNumber(
            data.metrics
              .p2pTransferCount
              .value
          )}
          metric={
            data.metrics
              .p2pTransferCount
          }
          icon={
            Activity
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
      </section>

      {/* TREND */}

      <Panel
        title="Wallet network activity"
        description="Engaged wallets, P2P transfers, merchant payments and new wallet creation."
      >
        {trendData.length >
        0 ? (
          <div className="h-[360px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={
                  trendData
                }
              >
                <defs>
                  <linearGradient
                    id="walletEngagementGradient"
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
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="engaged"
                  name="Engaged wallets"
                  stroke="#2563eb"
                  strokeWidth={
                    2.5
                  }
                  fill="url(#walletEngagementGradient)"
                />

                <Line
                  type="monotone"
                  dataKey="merchant"
                  name="Merchant payments"
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
                  dataKey="p2p"
                  name="P2P transfers"
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
                  dataKey="newWallets"
                  name="New wallets"
                  stroke="#06b6d4"
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
            text="Wallet activity will appear after real platform activity exists."
          />
        )}
      </Panel>

      {/* FUNNEL + USAGE */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Wallet engagement funnel"
          description="From provisioned wallets to wallets actively paying Coffer merchants."
        >
          <div className="space-y-5">
            {data.funnel.map(
              (
                item
              ) => (
                <div
                  key={
                    item.key
                  }
                >
                  <div className="mb-2 flex justify-between gap-4">
                    <span className="text-xs font-bold">
                      {item.label}
                    </span>

                    <span className="text-xs font-black text-muted-foreground">
                      {formatNumber(
                        item.value
                      )}{" "}
                      ·{" "}
                      {formatPercent(
                        item.percentage
                      )}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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
        </Panel>

        <Panel
          title="Wallet usage mix"
          description="Completed wallet activity by use case. This is count-based, not transaction-volume based."
        >
          {usageData.some(
            (
              item
            ) =>
              item.count >
              0
          ) ? (
            <div className="h-[280px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    usageData
                  }
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={
                      false
                    }
                    opacity={
                      0.08
                    }
                  />

                  <XAxis
                    type="number"
                    allowDecimals={
                      false
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={
                      120
                    }
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                  >
                    {usageData.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={
                            item.key
                          }
                          fill={
                            [
                              "#8b5cf6",
                              "#10b981",
                              "#2563eb",
                              "#f59e0b",
                            ][
                              index %
                                4
                            ]
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
              text="No completed wallet usage event exists for this period."
            />
          )}
        </Panel>
      </div>

      {/* ENGAGEMENT */}

      <Panel
        title="Wallet engagement"
        description="Adoption and repeat-usage indicators for the Coffer wallet ecosystem."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label:
                "Wallet engagement",

              value:
                data.engagement
                  .walletEngagementRate,
            },

            {
              label:
                "Merchant adoption",

              value:
                data.engagement
                  .merchantPaymentAdoptionRate,
            },

            {
              label:
                "P2P adoption",

              value:
                data.engagement
                  .p2pAdoptionRate,
            },

            {
              label:
                "Repeat activity",

              value:
                data.engagement
                  .repeatActivityRate,
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
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-3 text-2xl font-black">
                  {formatPercent(
                    item.value
                  )}
                </p>
              </div>
            )
          )}

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              Events / engaged
            </p>

            <p className="mt-3 text-2xl font-black">
              {
                data.engagement
                  .transactionsPerEngagedWallet
              }
            </p>
          </div>
        </div>
      </Panel>

      {/* LIQUIDITY */}

      <Panel
        title="Wallet balance snapshot"
        description="Current wallet balances aggregated directly from the wallet collection for the selected currency."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total balance"
            value={formatMoney(
              data.liquidity
                .totalBalanceMinor,
              data.filters
                .currency
            )}
            description="Current aggregate wallet balance"
            icon={
              Banknote
            }
            iconClass="bg-emerald-500/10 text-emerald-600"
          />

          <SummaryCard
            title="Pending balance"
            value={formatMoney(
              data.liquidity
                .totalPendingBalanceMinor,
              data.filters
                .currency
            )}
            description="Aggregate pending wallet balance"
            icon={
              Activity
            }
            iconClass="bg-amber-500/10 text-amber-600"
          />

          <SummaryCard
            title="Average wallet balance"
            value={formatMoney(
              data.liquidity
                .averageBalanceMinor,
              data.filters
                .currency
            )}
            description="Average across matching wallets"
            icon={
              WalletCards
            }
            iconClass="bg-blue-500/10 text-blue-600"
          />
        </div>
      </Panel>

      {/* STATUS */}

      <Panel
        title="Wallet status distribution"
        description="Current operational wallet state."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {data.walletStatuses.map(
            (
              item
            ) => {
              const className =
                item.status ===
                "ACTIVE"
                  ? "text-emerald-600 bg-emerald-500/10"
                  : item.status ===
                      "FROZEN"
                    ? "text-amber-600 bg-amber-500/10"
                    : "text-red-600 bg-red-500/10";

              return (
                <div
                  key={
                    item.status
                  }
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${className}`}
                  >
                    {item.status}
                  </span>

                  <p className="mt-4 text-2xl font-black">
                    {formatNumber(
                      item.count
                    )}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPercent(
                      item.percentage
                    )}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </Panel>

      {/* INSIGHTS */}

      <Panel
        title="Wallet intelligence"
        description="Deterministic signals derived from real Coffer wallet activity."
        action={
          <span className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold text-blue-600">
            <BrainCircuit className="h-3.5 w-3.5" />

            Rules-based
          </span>
        }
      >
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
      </Panel>

      {/* PRIVACY */}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

          <div>
            <p className="text-xs font-extrabold">
              Privacy-safe wallet analytics
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {data.privacy.note}
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