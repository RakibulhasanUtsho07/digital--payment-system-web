"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getAnalystLivePulse,
  getAnalystOverview,
  type AnalystBreakdownItem,
  type AnalystInsight,
  type AnalystLivePulseData,
  type AnalystMetric,
  type AnalystMode,
  type AnalystOverviewData,
  type AnalystPulseAlert,
  type AnalystPulseStatus,
  type AnalystRange,
  type AnalystTrendPoint,
} from "@/lib/api/analystApi";

/* =========================================================
   CONSTANTS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
}> = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
}> = [
  { value: "all", label: "All traffic" },
  { value: "test", label: "Test" },
  { value: "live", label: "Live" },
];

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatMinor(value: number, currency: string): string {
  const major = value / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatBucket(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metricChange(metric: AnalystMetric): string {
  if (metric.changePercent === null) {
    return metric.value === 0 ? "No change" : "New activity";
  }

  if (metric.changePercent === 0) {
    return "No change";
  }

  const prefix = metric.changePercent > 0 ? "+" : "";
  return `${prefix}${metric.changePercent.toFixed(2)}% vs previous period`;
}

function metricChangeClass(metric: AnalystMetric): string {
  if (metric.changePercent === null || metric.changePercent === 0) {
    return "text-slate-500 dark:text-slate-400";
  }

  return metric.changePercent > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
}

function statusClasses(status: AnalystPulseStatus): string {
  switch (status) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
    case "attention":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
    case "healthy":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
}

function insightClasses(severity: AnalystInsight["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/25";
    case "high":
      return "border-orange-200 bg-orange-50/70 dark:border-orange-900/60 dark:bg-orange-950/25";
    case "medium":
      return "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25";
    case "positive":
      return "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/25";
    case "info":
      return "border-sky-200 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/25";
  }
}

function alertClasses(severity: AnalystPulseAlert["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
  }
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  metric,
  value,
}: {
  label: string;
  metric: AnalystMetric;
  value: string;
}) {
  return (
    <Card className="min-h-36">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      <p className={`mt-3 text-xs font-medium ${metricChangeClass(metric)}`}>
        {metricChange(metric)}
      </p>
    </Card>
  );
}

function RatioRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-950 dark:text-white">
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function BreakdownList({
  items,
  emptyLabel,
}: {
  items: AnalystBreakdownItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {item.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatNumber(item.count)} records
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-950 dark:text-white">
              {formatPercent(item.percentage)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
              style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleTrendChart({
  points,
}: {
  points: AnalystTrendPoint[];
}) {
  const width = 900;
  const height = 260;
  const padding = 28;

  const path = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    const values = points.map((point) => point.paymentCount);
    const max = Math.max(1, ...values);
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    return points
      .map((point, index) => {
        const x =
          points.length === 1
            ? width / 2
            : padding + (index / (points.length - 1)) * availableWidth;
        const y = height - padding - (point.paymentCount / max) * availableHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  const failedPath = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    const max = Math.max(1, ...points.map((point) => point.paymentCount));
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    return points
      .map((point, index) => {
        const x =
          points.length === 1
            ? width / 2
            : padding + (index / (points.length - 1)) * availableWidth;
        const y = height - padding - (point.failedCount / max) * availableHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        No trend data available.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-slate-100" />
          Payment attempts
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Failed payments
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 min-w-[720px] w-full"
          role="img"
          aria-label="Payment attempt and failure trend"
        >
          <line
            x1={padding}
            x2={width - padding}
            y1={height - padding}
            y2={height - padding}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="1"
          />
          <path
            d={path}
            fill="none"
            className="stroke-slate-900 dark:stroke-slate-100"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={failedPath}
            fill="none"
            className="stroke-rose-500"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
        {points
          .filter((_, index) => {
            const step = Math.max(1, Math.floor(points.length / 4));
            return index % step === 0;
          })
          .slice(0, 4)
          .map((point) => (
            <span key={point.bucket}>{formatBucket(point.bucket)}</span>
          ))}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystDashboardPage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [mode, setMode] = useState<AnalystMode>("all");
  const [currencyInput, setCurrencyInput] = useState("BDT");
  const [currency, setCurrency] = useState("BDT");

  const [overview, setOverview] = useState<AnalystOverviewData | null>(null);
  const [pulse, setPulse] = useState<AnalystLivePulseData | null>(null);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [pulseError, setPulseError] = useState<string | null>(null);

  const [manualRefresh, setManualRefresh] = useState(0);
  const [pulseRefresh, setPulseRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setOverviewLoading(true);
    setOverviewError(null);

    getAnalystOverview(
      {
        range,
        mode,
        currency,
      },
      controller.signal
    )
      .then((data) => {
        setOverview(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setOverviewError(
          error instanceof Error ? error.message : "Unable to load analyst overview."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOverviewLoading(false);
        }
      });

    return () => controller.abort();
  }, [range, mode, currency, manualRefresh]);

  useEffect(() => {
    const controller = new AbortController();

    setPulseLoading(true);
    setPulseError(null);

    getAnalystLivePulse(
      {
        mode,
        currency,
      },
      controller.signal
    )
      .then((data) => {
        setPulse(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setPulseError(
          error instanceof Error ? error.message : "Unable to load live pulse."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPulseLoading(false);
        }
      });

    return () => controller.abort();
  }, [mode, currency, manualRefresh, pulseRefresh]);

  useEffect(() => {
    const seconds = Math.max(10, pulse?.refreshAfterSeconds ?? 20);
    const timer = window.setInterval(() => {
      setPulseRefresh((current) => current + 1);
    }, seconds * 1000);

    return () => window.clearInterval(timer);
  }, [pulse?.refreshAfterSeconds]);

  const applyCurrency = () => {
    const next = currencyInput.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(next)) {
      setOverviewError("Currency must be a three-letter ISO code.");
      return;
    }

    setCurrencyInput(next);
    setCurrency(next);
  };

  const refreshAll = () => {
    setManualRefresh((current) => current + 1);
  };

  const isInitialLoading = overviewLoading && !overview;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Read-only platform analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Analyst Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Executive payment, merchant, risk, revenue and live operational signals generated from deterministic rules over recorded platform data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {overview ? (
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(
                  overview.status
                )}`}
              >
                Overview: {overview.status}
              </span>
            ) : null}

            {pulse ? (
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(
                  pulse.status
                )}`}
              >
                Live: {pulse.status}
              </span>
            ) : null}

            <button
              type="button"
              onClick={refreshAll}
              disabled={overviewLoading || pulseLoading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {overviewLoading || pulseLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Range
              </span>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as AnalystRange)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Environment
              </span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AnalystMode)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Currency
              </span>
              <input
                value={currencyInput}
                maxLength={3}
                onChange={(event) => setCurrencyInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyCurrency();
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
                placeholder="BDT"
              />
            </label>

            <button
              type="button"
              onClick={applyCurrency}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Apply
            </button>
          </div>
        </Card>

        {/* Errors */}
        {overviewError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {overviewError}
          </div>
        ) : null}

        {pulseError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Live pulse: {pulseError}
          </div>
        ) : null}

        {overview ? (
          <>
            {/* Core metrics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Completed payment volume"
                metric={overview.metrics.paymentVolumeMinor}
                value={formatMinor(overview.metrics.paymentVolumeMinor.value, currency)}
              />
              <MetricCard
                label="Payment attempts"
                metric={overview.metrics.paymentCount}
                value={formatNumber(overview.metrics.paymentCount.value)}
              />
              <MetricCard
                label="Payment success rate"
                metric={overview.metrics.successRate}
                value={formatPercent(overview.metrics.successRate.value)}
              />
              <MetricCard
                label="Payment fee revenue"
                metric={overview.metrics.paymentFeeRevenueMinor}
                value={formatMinor(overview.metrics.paymentFeeRevenueMinor.value, currency)}
              />
              <MetricCard
                label="Refund value"
                metric={overview.metrics.refundAmountMinor}
                value={formatMinor(overview.metrics.refundAmountMinor.value, currency)}
              />
              <MetricCard
                label="Open dispute exposure"
                metric={overview.metrics.openDisputeExposureMinor}
                value={formatMinor(overview.metrics.openDisputeExposureMinor.value, currency)}
              />
              <MetricCard
                label="Wallet transactions"
                metric={overview.metrics.walletTransactionCount}
                value={formatNumber(overview.metrics.walletTransactionCount.value)}
              />
              <MetricCard
                label="Net payment volume"
                metric={overview.metrics.netPaymentVolumeMinor}
                value={formatMinor(overview.metrics.netPaymentVolumeMinor.value, currency)}
              />
            </div>

            {/* Executive and merchant health */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <SectionTitle
                  title="Executive operating ratios"
                  description="Current-period deterministic ratios derived from the overview data."
                />
                <div className="space-y-5">
                  <RatioRow label="Payment failure rate" value={overview.executive.paymentFailureRate} />
                  <RatioRow label="Refund rate" value={overview.executive.refundRate} />
                  <RatioRow label="Dispute exposure rate" value={overview.executive.disputeExposureRate} />
                  <RatioRow label="High-risk transaction rate" value={overview.executive.highRiskTransactionRate} />
                  <RatioRow label="Wallet transaction failure rate" value={overview.executive.walletTransactionFailureRate} />
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      In-progress gateway payments
                    </span>
                    <span className="text-lg font-bold text-slate-950 dark:text-white">
                      {formatNumber(overview.executive.pendingPaymentCount)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle
                  title="Merchant health"
                  description="Population readiness and activation across registered merchants."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Total", overview.merchantHealth.totalMerchants],
                    ["Active", overview.merchantHealth.activeMerchants],
                    ["Verified", overview.merchantHealth.verifiedMerchants],
                    ["Live enabled", overview.merchantHealth.liveEnabledMerchants],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                        {formatNumber(Number(value))}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-5">
                  <RatioRow label="Activation rate" value={overview.merchantHealth.activationRate} />
                  <RatioRow label="Verification rate" value={overview.merchantHealth.verificationRate} />
                  <RatioRow label="Live readiness rate" value={overview.merchantHealth.liveReadinessRate} />
                </div>
              </Card>
            </div>

            {/* Risk summary */}
            <Card>
              <SectionTitle
                title="Risk and exception summary"
                description="Read-only operational exposure across payments, refunds, disputes and wallet risk signals."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">High-risk transactions</p>
                  <p className="mt-2 text-xl font-bold">{formatNumber(overview.riskSummary.highRiskTransactionCount)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatPercent(overview.riskSummary.highRiskTransactionRate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Failed payments</p>
                  <p className="mt-2 text-xl font-bold">{formatNumber(overview.riskSummary.failedPaymentCount)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatPercent(overview.riskSummary.paymentFailureRate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 sm:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Refund exposure</p>
                  <p className="mt-2 text-xl font-bold">{formatMinor(overview.riskSummary.refundAmountMinor, currency)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatPercent(overview.riskSummary.refundRate)} of completed payment volume</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 sm:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Open dispute exposure</p>
                  <p className="mt-2 text-xl font-bold">{formatMinor(overview.riskSummary.openDisputeExposureMinor, currency)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNumber(overview.riskSummary.openDisputeCount)} open · {formatPercent(overview.riskSummary.disputeExposureRate)} of completed volume
                  </p>
                </div>
              </div>
            </Card>

            {/* Trend */}
            <Card>
              <SectionTitle
                title="Payment activity trend"
                description="Payment attempts and failures for the selected range."
              />
              <SimpleTrendChart points={overview.trend} />
            </Card>

            {/* Live pulse */}
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionTitle
                  title="Live platform pulse"
                  description="Auto-refreshing gateway, payout and wallet signals for the latest 60 minutes."
                />
                {pulse ? (
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <p>Updated {formatDateTime(pulse.generatedAt)}</p>
                    <p>Refresh every {pulse.refreshAfterSeconds}s</p>
                  </div>
                ) : null}
              </div>

              {pulseLoading && !pulse ? (
                <p className="text-sm text-slate-500">Loading live pulse...</p>
              ) : pulse ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p className="text-xs text-slate-500">Attempts / 60 min</p>
                      <p className="mt-2 text-2xl font-bold">{formatNumber(pulse.windows.last60Minutes.attemptCount)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p className="text-xs text-slate-500">Success / 60 min</p>
                      <p className="mt-2 text-2xl font-bold">{formatPercent(pulse.windows.last60Minutes.successRate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p className="text-xs text-slate-500">Volume / 60 min</p>
                      <p className="mt-2 text-2xl font-bold">{formatMinor(pulse.windows.last60Minutes.volumeMinor, currency)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p className="text-xs text-slate-500">Stale payments</p>
                      <p className="mt-2 text-2xl font-bold">{formatNumber(pulse.queues.stalePaymentCount)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {pulse.scores.map((score) => (
                      <div
                        key={score.key}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{score.label}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClasses(score.status)}`}>
                            {score.status}
                          </span>
                        </div>
                        <p className="mt-3 text-3xl font-bold">{score.score}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {score.basis}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {pulse.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-xl border p-4 ${alertClasses(alert.severity)}`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{alert.title}</p>
                            <p className="mt-1 text-sm opacity-90">{alert.description}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold">{alert.metric}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Live pulse is unavailable.
                </p>
              )}
            </Card>

            {/* Breakdowns */}
            <div className="grid gap-6 xl:grid-cols-3">
              <Card>
                <SectionTitle title="Payment status" />
                <BreakdownList items={overview.paymentStatus} emptyLabel="No payment status data." />
              </Card>

              <Card>
                <SectionTitle title="Provider mix" />
                <BreakdownList items={overview.providers} emptyLabel="No provider data." />
              </Card>

              <Card>
                <SectionTitle title="Transaction risk" />
                <BreakdownList items={overview.transactionRisk} emptyLabel="No wallet-risk data." />
              </Card>
            </div>

            {/* Accounts + revenue */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <SectionTitle title="Platform accounts" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Active users", overview.accounts.activeUsers],
                    ["New users", overview.accounts.newUsers],
                    ["KYC verified", overview.accounts.kycVerifiedUsers],
                    ["Merchants", overview.accounts.totalMerchants],
                    ["Active merchants", overview.accounts.activeMerchants],
                    ["Verified merchants", overview.accounts.verifiedMerchants],
                    ["Live enabled", overview.accounts.liveEnabledMerchants],
                    ["Open disputes", overview.operations.openDisputeCount],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="mt-2 text-xl font-bold">{formatNumber(Number(value))}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle
                  title="Revenue ledger quality"
                  description={overview.revenueLedger.note}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Classified net revenue</p>
                    <p className="mt-2 text-xl font-bold">{formatMinor(overview.revenueLedger.classifiedNetRevenueMinor, currency)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Classified events</p>
                    <p className="mt-2 text-xl font-bold">{formatNumber(overview.revenueLedger.classifiedEventCount)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Unclassified events</p>
                    <p className="mt-2 text-xl font-bold">{formatNumber(overview.revenueLedger.unclassifiedEventCount)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Insights */}
            <Card>
              <SectionTitle
                title="Deterministic analyst insights"
                description="These signals are explainable threshold-based observations, not automated decisions."
              />

              <div className="grid gap-4 lg:grid-cols-2">
                {overview.insights.map((insight) => (
                  <article
                    key={insight.id}
                    className={`rounded-xl border p-4 ${insightClasses(insight.severity)}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {insight.title}
                      </p>
                      <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                        {insight.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {insight.description}
                    </p>
                    <div className="mt-3 rounded-lg bg-white/60 p-3 text-xs text-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                      <strong>Evidence:</strong> {insight.evidence}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      <strong>Review:</strong> {insight.recommendedAction}
                    </p>
                  </article>
                ))}
              </div>
            </Card>

            {/* Freshness */}
            <Card>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Overview generated</p>
                  <p className="mt-1 font-medium">{formatDateTime(overview.generatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Latest daily fact</p>
                  <p className="mt-1 font-medium">{formatDateTime(overview.freshness.latestDailyFactGeneratedAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Daily fact coverage</p>
                  <p className="mt-1 font-medium">{formatNumber(overview.freshness.dailyFactDaysCovered)} days</p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No overview data is available.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
