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
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DatabaseZap,
  Gauge,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  ShieldAlert,
  TimerReset,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
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
  getAnalystLivePulse,
  type AnalystLivePulseData,
  type AnalystMode,
  type AnalystPulseAlert,
  type AnalystPulseScore,
  type AnalystPulseStatus,
} from "@/lib/api/analystApi";

/* =========================================================
   OPTIONS
========================================================= */

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

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function formatMoney(
  minor: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      minor / 100
    );
  } catch {
    return `${currency} ${(
      minor / 100
    ).toLocaleString(
      "en-BD",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }
}

function formatCompactMoney(
  minor: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }
    ).format(
      minor / 100
    );
  } catch {
    return formatMoney(
      minor,
      currency
    );
  }
}

function formatDateTime(
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
      dateStyle: "medium",
      timeStyle: "medium",
    }
  ).format(date);
}

function formatBucket(
  value: string
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
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
      (letter) =>
        letter.toUpperCase()
    );
}

/* =========================================================
   PRESENTATION HELPERS
========================================================= */

const STATUS_STYLES: Record<
  AnalystPulseStatus,
  string
> = {
  healthy:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  attention:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical:
    "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
};

const SCORE_BAR_STYLES: Record<
  AnalystPulseStatus,
  string
> = {
  healthy:
    "bg-emerald-500",
  attention:
    "bg-amber-500",
  critical:
    "bg-red-500",
};

function StatusBadge({
  status,
}: {
  status: AnalystPulseStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${STATUS_STYLES[status]}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>

      {status}
    </span>
  );
}

function ChangeLabel({
  value,
  suffix = "%",
}: {
  value: number | null;
  suffix?: string;
}) {
  if (value === null) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  const positive =
    value > 0;

  const neutral =
    value === 0;

  const Icon =
    positive
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

      {Math.abs(value).toFixed(2)}
      {suffix}

      <span className="font-medium text-muted-foreground">
        vs prior hour
      </span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  children,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  children?: React.ReactNode;
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

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-card-foreground">
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

      {children && (
        <div className="mt-4 border-t border-border/70 pt-3">
          {children}
        </div>
      )}
    </motion.div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />

      <p className="mt-3 text-sm font-bold text-foreground">
        No real activity recorded
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function ScoreCard({
  score,
}: {
  score: AnalystPulseScore;
}) {
  const TrendIcon =
    score.trend === "up"
      ? ArrowUpRight
      : score.trend === "down"
        ? ArrowDownRight
        : Activity;

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold text-foreground">
            {score.label}
          </p>

          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {score.status}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TrendIcon className="h-4 w-4 text-muted-foreground" />

          <span className="text-2xl font-black text-foreground">
            {score.score}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${SCORE_BAR_STYLES[score.status]}`}
          style={{
            width:
              `${score.score}%`,
          }}
        />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        {score.basis}
      </p>
    </div>
  );
}

function AlertCard({
  alert,
}: {
  alert: AnalystPulseAlert;
}) {
  const styles = {
    critical:
      "border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400",
    warning:
      "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    info:
      "border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    positive:
      "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  }[alert.severity];

  const Icon =
    alert.severity === "positive"
      ? CheckCircle2
      : alert.severity === "critical"
        ? XCircle
        : alert.severity === "warning"
          ? AlertTriangle
          : Activity;

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {alert.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              {alert.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {alert.description}
          </p>

          <p className="mt-3 text-[11px] font-extrabold text-foreground/80">
            {alert.metric}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystLivePulsePage() {
  const [mode, setMode] =
    useState<AnalystMode>(
      "all"
    );

  const [currency, setCurrency] =
    useState("BDT");

  const [currencyDraft, setCurrencyDraft] =
    useState("BDT");

  const [data, setData] =
    useState<AnalystLivePulseData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setRefreshKey(
            (current) =>
              current + 1
          );
        },
        20_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [autoRefresh]);

  useEffect(() => {
    const controller =
      new AbortController();

    let active = true;

    const load = async () => {
      setRefreshing(true);
      setError("");

      try {
        const result =
          await getAnalystLivePulse(
            {
              mode,
              currency,
            },
            controller.signal
          );

        if (active) {
          setData(result);
        }
      } catch (
        loadError: unknown
      ) {
        if (
          active &&
          !controller.signal.aborted
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the live platform pulse."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    mode,
    currency,
    refreshKey,
  ]);

  const chartData =
    useMemo(
      () =>
        data?.timeline.map(
          (point) => ({
            ...point,
            label:
              formatBucket(
                point.bucket
              ),
            volumeMajor:
              point.volumeMinor /
              100,
          })
        ) ?? [],
      [data]
    );

  const hasTimelineActivity =
    chartData.some(
      (point) =>
        point.attemptCount > 0
    );

  const applyCurrency = (
    event: FormEvent<HTMLFormElement>
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
        "Currency must be a three-letter ISO code."
      );

      return;
    }

    setCurrency(
      normalized
    );
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative px-5 py-6 sm:px-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_32%)]" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20">
                    <Activity className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Analyst Command Center
                    </p>

                    <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      Live Platform Pulse
                    </h1>
                  </div>

                  {data && (
                    <StatusBadge
                      status={data.status}
                    />
                  )}
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                  A read-only operational snapshot generated from current MongoDB payment, wallet transaction, and payout records. No mock data or paid intelligence provider is used.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAutoRefresh(
                      (current) =>
                        !current
                    )
                  }
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
                    autoRefresh
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {autoRefresh
                    ? (
                      <PauseCircle className="h-4 w-4" />
                    )
                    : (
                      <PlayCircle className="h-4 w-4" />
                    )}

                  {autoRefresh
                    ? "Auto-refresh on"
                    : "Auto-refresh off"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRefreshKey(
                      (current) =>
                        current + 1
                    )
                  }
                  disabled={refreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh now
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mode}
                onChange={(event) =>
                  setMode(
                    event.target.value as AnalystMode
                  )
                }
                aria-label="Payment mode"
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none ring-primary/20 focus:ring-4"
              >
                {MODE_OPTIONS.map(
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
                className="flex items-center gap-2"
              >
                <input
                  value={currencyDraft}
                  onChange={(event) =>
                    setCurrencyDraft(
                      event.target.value
                        .replace(
                          /[^a-zA-Z]/g,
                          ""
                        )
                        .slice(
                          0,
                          3
                        )
                        .toUpperCase()
                    )
                  }
                  aria-label="Currency"
                  maxLength={3}
                  className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-center text-xs font-black uppercase text-foreground outline-none ring-primary/20 focus:ring-4"
                />

                <button
                  type="submit"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition hover:bg-muted"
                >
                  Apply
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {data
                  ? `Updated ${formatDateTime(data.generatedAt)}`
                  : "Waiting for first snapshot"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <TimerReset className="h-3.5 w-3.5" />
                {autoRefresh
                  ? `Refreshes every ${data?.refreshAfterSeconds ?? 20}s`
                  : "Automatic refresh paused"}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-red-600 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                Live pulse request failed
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        )}

        {loading && !data ? (
          <div className="grid min-h-[420px] place-items-center rounded-3xl border border-border bg-card">
            <div className="text-center">
              <RefreshCcw className="mx-auto h-8 w-8 animate-spin text-primary" />

              <p className="mt-4 text-sm font-bold text-foreground">
                Reading live platform activity
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Aggregating current MongoDB records…
              </p>
            </div>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Attempts · 5 min"
                value={formatNumber(
                  data.windows.last5Minutes.attemptCount
                )}
                description={`${formatNumber(data.windows.last5Minutes.completedCount)} completed · ${formatNumber(data.windows.last5Minutes.failedCount)} failed`}
                icon={Activity}
                iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              />

              <MetricCard
                label="Success · 15 min"
                value={`${data.windows.last15Minutes.successRate.toFixed(2)}%`}
                description={`${formatNumber(data.windows.last15Minutes.pendingCount)} payments currently in progress`}
                icon={CheckCircle2}
                iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />

              <MetricCard
                label="Completed volume · 60 min"
                value={formatCompactMoney(
                  data.windows.last60Minutes.volumeMinor,
                  data.filters.currency
                )}
                description={`${formatNumber(data.windows.last60Minutes.completedCount)} completed gateway payments`}
                icon={CircleDollarSign}
                iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                <ChangeLabel
                  value={data.comparison.volumeChangePercent}
                />
              </MetricCard>

              <MetricCard
                label="Wallet transactions · 60 min"
                value={formatNumber(
                  data.transactions.last60Minutes.count
                )}
                description={`${formatNumber(data.transactions.last60Minutes.failedCount)} failed · encrypted amounts remain private`}
                icon={WalletCards}
                iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              />

              <MetricCard
                label="Payment failure rate"
                value={`${data.windows.last60Minutes.failureRate.toFixed(2)}%`}
                description={`${formatNumber(data.windows.last60Minutes.failedCount)} failed during the current hour`}
                icon={XCircle}
                iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
              />

              <MetricCard
                label="High-risk wallet activity"
                value={formatNumber(
                  data.transactions.last60Minutes.highRiskCount
                )}
                description={`${data.transactions.last60Minutes.highRiskRate.toFixed(2)}% of wallet transactions in the last hour`}
                icon={ShieldAlert}
                iconClass="bg-orange-500/10 text-orange-600 dark:text-orange-400"
              />

              <MetricCard
                label="Stale payment queue"
                value={formatNumber(
                  data.queues.stalePaymentCount
                )}
                description="Pending, authorized, or captured for more than 15 minutes"
                icon={TimerReset}
                iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />

              <MetricCard
                label="Payout queue"
                value={
                  data.payouts.included
                    ? formatNumber(
                        data.payouts.pendingCount +
                          data.payouts.processingCount
                      )
                    : "Excluded"
                }
                description={
                  data.payouts.included
                    ? `${formatMoney(data.payouts.pendingAmountMinor + data.payouts.processingAmountMinor, data.filters.currency)} waiting or processing`
                    : "Payouts are not included in test-only mode"
                }
                icon={Banknote}
                iconClass="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
              />
            </div>

            <div className="grid gap-6 2xl:grid-cols-[1.55fr_1fr]">
              <Panel
                title="Gateway traffic · last 60 minutes"
                description="Five-minute buckets from real payment records; completed volume excludes failed payments."
                action={
                  <ChangeLabel
                    value={data.comparison.attemptChangePercent}
                  />
                }
              >
                {hasTimelineActivity ? (
                  <div className="h-[330px] w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <ComposedChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 8,
                          bottom: 0,
                          left: -18,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="currentColor"
                          className="text-border"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={22}
                        />

                        <YAxis
                          yAxisId="count"
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          yAxisId="volume"
                          orientation="right"
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            new Intl.NumberFormat(
                              "en-BD",
                              {
                                notation: "compact",
                              }
                            ).format(value)
                          }
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid hsl(var(--border))",
                            background:
                              "hsl(var(--card))",
                            fontSize: 12,
                          }}
                          formatter={(
                            value: unknown,
                            name: unknown
                          ) => {
                            const numeric =
                              Number(value) || 0;

                            return name ===
                              "Completed volume"
                              ? [
                                  formatMoney(
                                    numeric * 100,
                                    data.filters.currency
                                  ),
                                  String(name),
                                ]
                              : [
                                  formatNumber(
                                    numeric
                                  ),
                                  String(name),
                                ];
                          }}
                        />

                        <Bar
                          yAxisId="count"
                          dataKey="failedCount"
                          name="Failed"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={18}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="attemptCount"
                          name="Attempts"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 5,
                          }}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="completedCount"
                          name="Completed"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />

                        <Area
                          yAxisId="volume"
                          type="monotone"
                          dataKey="volumeMajor"
                          name="Completed volume"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No gateway payment attempt exists in the selected currency and mode during the last 60 minutes." />
                )}
              </Panel>

              <Panel
                title="Deterministic platform scores"
                description="Transparent operational scores from stored facts; these values are not AI predictions."
                action={
                  <StatusBadge
                    status={data.status}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  {data.scores.map(
                    (score) => (
                      <ScoreCard
                        key={score.key}
                        score={score}
                      />
                    )
                  )}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel
                title="Payment provider health"
                description="Attempt, completion, failure, and completed volume by provider for the last hour."
              >
                {data.providers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
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
                            Success
                          </th>
                          <th className="border-b border-border px-3 py-3 text-right">
                            Volume
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.providers.map(
                          (provider) => (
                            <tr
                              key={provider.provider}
                              className="text-xs"
                            >
                              <td className="border-b border-border/60 px-3 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${SCORE_BAR_STYLES[provider.status]}`}
                                  />

                                  <span className="font-extrabold text-foreground">
                                    {humanize(
                                      provider.provider
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-foreground">
                                {formatNumber(
                                  provider.attemptCount
                                )}
                              </td>

                              <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-red-600 dark:text-red-400">
                                {formatNumber(
                                  provider.failedCount
                                )}
                              </td>

                              <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-foreground">
                                {provider.successRate.toFixed(2)}%
                              </td>

                              <td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-foreground">
                                {formatCompactMoney(
                                  provider.volumeMinor,
                                  data.filters.currency
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No provider activity was recorded for this filter during the last 60 minutes." />
                )}
              </Panel>

              <Panel
                title="Failure reason distribution"
                description="Only failed gateway payments from the current 60-minute window are included."
              >
                {data.failureReasons.length > 0 ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                    <div className="h-[260px]">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={data.failureReasons}
                          margin={{
                            top: 12,
                            right: 8,
                            left: -22,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="failureArea"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="currentColor"
                            className="text-border"
                          />

                          <XAxis
                            dataKey="code"
                            tickFormatter={(value: unknown) =>
                              humanize(
                                String(value)
                              )
                            }
                            tick={{
                              fontSize: 9,
                            }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={16}
                          />

                          <YAxis
                            allowDecimals={false}
                            tick={{
                              fontSize: 10,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip
                            labelFormatter={(label: unknown) =>
                              humanize(
                                String(label)
                              )
                            }
                            formatter={(value: unknown) => [
                              formatNumber(
                                Number(value) || 0
                              ),
                              "Failures",
                            ]}
                            contentStyle={{
                              borderRadius: 14,
                              border:
                                "1px solid hsl(var(--border))",
                              background:
                                "hsl(var(--card))",
                              fontSize: 12,
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#ef4444"
                            strokeWidth={3}
                            fill="url(#failureArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {data.failureReasons.map(
                        (reason) => (
                          <div
                            key={reason.code}
                            className="rounded-xl border border-border bg-background/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="truncate font-bold text-foreground">
                                {humanize(
                                  reason.code
                                )}
                              </span>

                              <span className="shrink-0 font-black text-red-600 dark:text-red-400">
                                {formatNumber(
                                  reason.count
                                )}
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{
                                  width:
                                    `${Math.min(100, reason.percentage)}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
                              {reason.percentage.toFixed(2)}% of failures
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No failed gateway payments were recorded during the current hour." />
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
              <Panel
                title="Environment traffic"
                description="Gateway request distribution for the selected currency during the last 60 minutes."
              >
                {data.modeTraffic.length > 0 ? (
                  <div className="space-y-5">
                    {data.modeTraffic.map(
                      (item) => (
                        <div key={item.mode}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  item.mode === "live"
                                    ? "bg-emerald-500"
                                    : "bg-blue-500"
                                }`}
                              />

                              <span className="font-extrabold text-foreground">
                                {humanize(
                                  item.mode
                                )}
                              </span>
                            </div>

                            <span className="font-bold text-muted-foreground">
                              {formatNumber(
                                item.count
                              )} · {item.percentage.toFixed(2)}%
                            </span>
                          </div>

                          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                item.mode === "live"
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width:
                                  `${Math.min(100, item.percentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}

                    <div className="rounded-xl border border-border bg-muted/20 p-3 text-[11px] leading-5 text-muted-foreground">
                      {data.scopeNote}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No test or live gateway request was recorded during this pulse window." />
                )}
              </Panel>

              <Panel
                title="Operational alerts"
                description="Rule-based thresholds highlight conditions for analyst review without changing platform data."
                action={
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" />
                    {data.calculationEngine.version}
                  </span>
                }
              >
                <div className="space-y-3">
                  {data.alerts.map(
                    (alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                      />
                    )
                  )}
                </div>
              </Panel>
            </div>

            <section className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm font-extrabold text-foreground">
                      Read-only operational intelligence
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      This page reads aggregated operational facts only. It cannot create payments, change wallets, process payouts, approve verification, or reveal merchant secrets.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Source: MongoDB live collections
                </span>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
