"use client";

import {
  useCallback,
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
  BadgeCheck,
  BrainCircuit,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  Gauge,
  RefreshCcw,
  RotateCcw,
  Server,
  ShieldAlert,
  Timer,
  TrendingUp,
  XCircle,
  Zap,
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
  type AnalystMetric,
  type AnalystMode,
  type AnalystProviderAnalyticsData,
  type AnalystProviderAnalyticsFilters,
  type AnalystProviderInsight,
  type AnalystRange,
} from "@/lib/api/analystApi";

import {
  apiClient,
  isApiAbortError,
} from "@/lib/api/client";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

/* =========================================================
   SUPPORT PROVIDER API

   This support-dashboard page must not call /analyst/providers,
   because the Analyst router intentionally excludes Support.

   Backend route expected:
   GET /api/admin/support/providers
   protected with requireSupport.
========================================================= */

interface SupportProviderAnalyticsResponse {
  success: boolean;
  data: AnalystProviderAnalyticsData;
  message?: string;
}

async function getSupportProviderAnalytics(
  filters: AnalystProviderAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystProviderAnalyticsData> {
  const params =
    new URLSearchParams({
      range: filters.range,
      mode: filters.mode,
      currency:
        filters.currency
          .trim()
          .toUpperCase(),
    });

  const provider =
    filters.provider
      ?.trim()
      .toLowerCase();

  if (provider) {
    params.set(
      "provider",
      provider
    );
  }

  const response =
    await apiClient<SupportProviderAnalyticsResponse>(
      `/admin/support/providers?${params.toString()}`,
      {
        method: "GET",
        signal,
      }
    );

  if (
    !response.success ||
    !response.data
  ) {
    throw new Error(
      response.message ||
        "Unable to load provider analytics."
    );
  }

  return response.data;
}

function isAuthorizationError(
  error: unknown
): boolean {
  const record =
    error &&
    typeof error === "object"
      ? (
          error as
            Record<
              string,
              unknown
            >
        )
      : null;

  const response =
    record?.response &&
    typeof record.response ===
      "object"
      ? (
          record.response as
            Record<
              string,
              unknown
            >
        )
      : null;

  const status =
    Number(
      record?.status ??
        record?.statusCode ??
        response?.status
    );

  if (
    status === 401 ||
    status === 403
  ) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
          .toLowerCase()
      : String(
          error ?? ""
        ).toLowerCase();

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "forbidden"
    ) ||
    message.includes(
      "access denied"
    ) ||
    message.includes(
      "not authorized"
    )
  );
}

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

function formatPercent(
  value:
    number
): string {
  return `${value.toFixed(
    2
  )}%`;
}

function formatSeconds(
  value:
    number
): string {
  if (
    value <
    1
  ) {
    return `${Math.round(
      value *
        1000
    )} ms`;
  }

  return `${value.toFixed(
    2
  )} s`;
}

function formatMoney(
  minor:
    number,

  currency:
    string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        minimumFractionDigits:
          2,

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
      "en-BD",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )}`;
  }
}

function formatCompactMoney(
  minor:
    number,

  currency:
    string
): string {
  const major =
    minor /
    100;

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        notation:
          "compact",

        maximumFractionDigits:
          1,
      }
    ).format(
      major
    );
  } catch {
    return `${currency} ${major.toLocaleString(
      "en-BD",
      {
        notation:
          "compact",

        maximumFractionDigits:
          1,
      }
    )}`;
  }
}

function formatDateTime(
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

function formatBucket(
  value:
    string,

  range:
    AnalystRange
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

function providerLabel(
  value:
    string
): string {
  if (
    !value
  ) {
    return "Unknown";
  }

  return value
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        char
      ) =>
        char.toUpperCase()
    );
}

/* =========================================================
   CHANGE BADGE
========================================================= */

function ChangeBadge({
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
    change ===
    null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        New vs previous period
      </span>
    );
  }

  const rising =
    change >
    0;

  const neutral =
    change ===
    0;

  const positive =
    neutral ||
    (
      inverse
        ? !rising
        : rising
    );

  const Icon =
    rising
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
  metric,
  icon: Icon,
  iconClass,
  inverse,
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
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 break-words text-xl font-black leading-7 tracking-tight text-card-foreground sm:text-2xl">
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
          inverse={
            inverse
          }
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label:
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 break-words text-xl font-black leading-7 text-card-foreground sm:text-2xl">
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
    React.ReactNode;

  action?:
    React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
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

      <div className="min-w-0 p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyData({
  message,
}: {
  message:
    string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />

      <p className="mt-3 text-sm font-bold text-foreground">
        No real provider data
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  insight,
}: {
  insight:
    AnalystProviderInsight;
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
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 break-words [overflow-wrap:anywhere] text-xs leading-5 text-muted-foreground">
            {insight.description}
          </p>

          <div className="mt-3 rounded-xl bg-background/70 p-3">
            <p className="text-[11px] font-bold text-foreground">
              Evidence
            </p>

            <p className="mt-1 break-words [overflow-wrap:anywhere] text-[11px] leading-5 text-muted-foreground">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 break-words [overflow-wrap:anywhere] text-[11px] leading-5 text-foreground/80">
            <span className="font-extrabold">
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
   SUPPORT-ONLY ACCESS
========================================================= */

function SupportNotFoundState() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />

      <motion.section
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.45,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
            <Server className="h-6 w-6" />
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">
            Error 404
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The page you are looking for does not exist or is not available.
          </p>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportProvidersPage() {
  const {
    user,
  } =
    useDashboardSession();

  const [
    accessDenied,
    setAccessDenied,
  ] =
    useState(false);

  const denyAccess =
    useCallback(() => {
      setAccessDenied(true);
    }, []);

  if (
    accessDenied ||
    user.role !==
      "support"
  ) {
    return (
      <SupportNotFoundState />
    );
  }

  return (
    <SupportProvidersContent
      onUnauthorized={
        denyAccess
      }
    />
  );
}

function SupportProvidersContent({
  onUnauthorized,
}: {
  onUnauthorized: () =>
    void;
}) {
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
    provider,
    setProvider,
  ] =
    useState(
      ""
    );

  const [
    data,
    setData,
  ] =
    useState<
      AnalystProviderAnalyticsData |
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
     LOAD DATA
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
              await getSupportProviderAnalytics(
                {
                  range,

                  mode,

                  currency,

                  provider,
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

            if (
              isAuthorizationError(
                loadError
              )
            ) {
              onUnauthorized();
              return;
            }

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load provider analytics."
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
      mode,
      currency,
      provider,
      refreshKey,
      onUnauthorized,
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
          "Currency must be a valid three-letter code, for example BDT."
        );

        return;
      }

      setError(
        ""
      );

      setCurrency(
        normalized
      );
    };

  /* =======================================================
     TREND
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

            attempts:
              item.attemptCount,

            completed:
              item.completedCount,

            failed:
              item.failedCount,

            pending:
              item.pendingCount,

            volume:
              item.volumeMinor,

            successRate:
              item.successRate,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  /* =======================================================
     PROVIDER COMPARISON
  ======================================================= */

  const providerChart =
    useMemo(
      () =>
        data?.providers.map(
          (
            item
          ) => ({
            provider:
              providerLabel(
                item.provider
              ),

            successRate:
              item.successRate,

            attempts:
              item.attemptCount,

            fill:
              item.health ===
              "critical"
                ? "#ef4444"
                : item.health ===
                    "attention"
                  ? "#f59e0b"
                  : "#10b981",
          })
        ) ??
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

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
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

        <div className="grid gap-5 2xl:grid-cols-3">
          <div className="h-[420px] animate-pulse rounded-2xl bg-muted 2xl:col-span-2" />

          <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  /* =======================================================
     INITIAL ERROR
  ======================================================= */

  if (
    !data &&
    error
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-black text-card-foreground">
            Provider analytics unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (
                  current
                ) =>
                  current +
                  1
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
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

  const statusStyle =
    {
      healthy:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

      attention:
        "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",

      critical:
        "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    }[
      data.status
    ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-clip pb-8 sm:space-y-6">
      {/* ===================================================
          PREMIUM SUPPORT-DASHBOARD HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: -14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.58,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="provider-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.22)]"
      >
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="provider-hero-grid absolute inset-0 opacity-40" />
          <div className="provider-hero-stars absolute inset-0 opacity-50" />

          <div className="provider-hero-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="provider-hero-orb-delayed absolute -bottom-32 left-[30%] h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />

          <div className="provider-hero-beam absolute -left-48 top-1/2 h-28 w-[520px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

          <div className="provider-hero-ring provider-hero-ring-one absolute -right-20 top-1/2 hidden h-[390px] w-[390px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          <div className="provider-hero-ring provider-hero-ring-two absolute right-1 top-1/2 hidden h-[255px] w-[255px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
        </div>

        <div className="relative z-10 grid min-h-[315px] gap-8 p-5 sm:p-6 lg:p-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center xl:p-8 2xl:grid-cols-[minmax(0,1fr)_440px]">
          {/* Copy + live metrics */}
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-md ${
                  data.status === "healthy"
                    ? "border-emerald-200/25 bg-emerald-950/15 text-emerald-50"
                    : data.status === "attention"
                      ? "border-amber-200/25 bg-amber-950/15 text-amber-50"
                      : "border-rose-200/25 bg-rose-950/15 text-rose-50"
                }`}
              >
                <span className="provider-live-dot h-2 w-2 rounded-full bg-current" />
                Provider health {data.status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-md">
                <Server className="h-3.5 w-3.5" />
                Gateway Providers
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start">
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 1.5, 0, -1.5, 0],
                }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-[0_14px_34px_rgba(6,78,59,0.22)] backdrop-blur-md sm:h-16 sm:w-16"
              >
                <Server className="h-6 w-6 sm:h-7 sm:w-7" />
                <span className="provider-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
              </motion.div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100">
                  Support Operations
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                  Provider Health & Analytics
                </h1>

                <p className="mt-3 max-w-3xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                  Inspect payment-provider reliability, success rate, failures,
                  payment volume and completion latency to support customer
                  investigations without changing financial state.
                </p>
              </div>
            </div>

            {/* Real API-backed hero metrics */}
            <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Providers",
                  value: formatNumber(
                    data.summary.totalProviders
                  ),
                  icon: Server,
                },
                {
                  label: "Attempts",
                  value: formatNumber(
                    data.summary.totalAttempts
                  ),
                  icon: Activity,
                },
                {
                  label: "Success",
                  value: formatPercent(
                    data.summary.overallSuccessRate
                  ),
                  icon: TrendingUp,
                },
                {
                  label: "Avg completion",
                  value: formatSeconds(
                    data.summary.averageCompletionSeconds
                  ),
                  icon: Timer,
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.14 + index * 0.055,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md"
                  >
                    <div className="provider-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="relative flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.14em] text-white/55">
                          {item.label}
                        </p>

                        <p className="mt-0.5 break-words text-sm font-black leading-5 text-white">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.button
                type="button"
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                disabled={refreshing}
                onClick={() =>
                  setRefreshKey(
                    (current) =>
                      current + 1
                  )
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-black text-emerald-700 shadow-[0_12px_28px_rgba(6,78,59,0.20)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing analytics…"
                  : "Refresh analytics"}
              </motion.button>

              <span className="inline-flex items-center justify-center gap-2 text-[9px] font-bold text-white/65 sm:justify-start">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                Support-only · read-only · live API data
              </span>
            </div>
          </div>

          {/* Animated provider network visual */}
          <div className="relative mx-auto hidden h-[270px] w-full max-w-[440px] xl:block">
            <div className="absolute left-1/2 top-1/2 h-[245px] w-[245px] -translate-x-1/2 -translate-y-1/2">
              <div className="provider-core absolute left-1/2 top-1/2 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[34px] border border-white/20 bg-white/10 shadow-[0_28px_65px_rgba(6,78,59,0.30)] backdrop-blur-xl">
                <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[25px] border border-white/15 bg-white/10 text-white">
                  <DatabaseZap className="h-8 w-8" />
                </div>

                <span className="provider-core-ring absolute -inset-3 rounded-[40px] border border-white/15" />
                <span className="provider-core-ring provider-core-ring-delay absolute -inset-7 rounded-[50px] border border-white/10" />
              </div>

              <div className="provider-orbit provider-orbit-one absolute left-1/2 top-1/2 h-[194px] w-[194px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                <div className="provider-orbit-item provider-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                  <Activity className="h-4 w-4" />
                </div>
              </div>

              <div className="provider-orbit provider-orbit-two absolute left-1/2 top-1/2 h-[252px] w-[252px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                <div className="provider-orbit-item provider-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                  <Gauge className="h-4 w-4" />
                </div>
              </div>

              <div className="provider-float-card provider-float-card-one absolute -left-16 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </span>

                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                      Success
                    </p>
                    <p className="mt-0.5 text-[9px] font-black text-white">
                      {formatPercent(
                        data.summary.overallSuccessRate
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="provider-float-card provider-float-card-two absolute -right-16 bottom-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Timer className="h-3.5 w-3.5" />
                  </span>

                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                      Latency
                    </p>
                    <p className="mt-0.5 text-[9px] font-black text-white">
                      {formatSeconds(
                        data.summary.averageCompletionSeconds
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="provider-scan absolute left-1/2 top-1/2 h-[1px] w-[320px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />
          </div>
        </div>

        {/* Hero metadata */}
        <div className="relative z-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 bg-black/[0.04] px-5 py-3 text-[9px] font-semibold text-white/60 backdrop-blur-sm sm:px-6 lg:px-7 xl:px-8">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            Updated{" "}
            {formatDateTime(
              data.generatedAt
            )}
          </span>

          <span>
            {data.filters.currency} ·{" "}
            {data.filters.mode.toUpperCase()}
          </span>

          <span>
            {data.filters.provider
              ? providerLabel(
                  data.filters.provider
                )
              : "All providers"}
          </span>

          <span>
            Read-only analytics
          </span>
        </div>
      </motion.section>

      {/* ===================================================
          FILTER BAR
      ==================================================== */}

      <section className="rounded-[26px] border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(200px,1fr)_auto_auto] 2xl:items-end">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Period
            </span>

            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target
                    .value as AnalystRange
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-muted/55 px-3 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
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
          </label>

          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Environment
            </span>

            <select
              value={mode}
              onChange={(event) =>
                setMode(
                  event.target
                    .value as AnalystMode
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-muted/55 px-3 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
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
          </label>

          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Provider
            </span>

            <select
              value={provider}
              onChange={(event) =>
                setProvider(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-muted/55 px-3 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">
                All providers
              </option>

              {data.providerOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {providerLabel(
                      item
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <form
            onSubmit={applyCurrency}
            className="min-w-0"
          >
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Currency
            </span>

            <div className="flex w-full sm:w-auto">
              <input
                value={currencyDraft}
                onChange={(event) =>
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
                maxLength={3}
                aria-label="Currency code"
                className="h-11 min-w-0 flex-1 rounded-l-xl border border-r-0 border-border bg-muted/55 px-3 text-center text-xs font-black uppercase text-foreground outline-none transition focus:border-emerald-400 focus:bg-background sm:w-20 sm:flex-none"
              />

              <button
                type="submit"
                className="h-11 rounded-r-xl border border-border bg-muted px-3 text-[10px] font-black uppercase tracking-wider text-foreground transition hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                Apply
              </button>
            </div>
          </form>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              setRefreshKey(
                (current) =>
                  current + 1
              )
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />

          <p className="min-w-0 break-words [overflow-wrap:anywhere]">
            {error}
          </p>
        </div>
      )}

      {/* ===================================================
          PLATFORM SUMMARY
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label="Providers"
          value={formatNumber(
            data.summary
              .totalProviders
          )}
          description={`${data.summary.healthyProviders} healthy · ${data.summary.attentionProviders} attention · ${data.summary.criticalProviders} critical`}
          icon={
            Server
          }
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />

        <SummaryCard
          label="Total attempts"
          value={formatNumber(
            data.summary
              .totalAttempts
          )}
          description={`${formatNumber(
            data.summary
              .completedPayments
          )} completed payments`}
          icon={
            Activity
          }
          iconClass="bg-teal-500/10 text-teal-700 dark:text-teal-400"
        />

        <SummaryCard
          label="Overall success"
          value={formatPercent(
            data.summary
              .overallSuccessRate
          )}
          description={`${formatNumber(
            data.summary
              .failedPayments
          )} failed payments`}
          icon={
            TrendingUp
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <SummaryCard
          label="Avg completion"
          value={formatSeconds(
            data.summary
              .averageCompletionSeconds
          )}
          description="Successful payment completion latency"
          icon={
            Timer
          }
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />
      </section>

      {/* ===================================================
          SELECTED METRICS
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="Payment attempts"
          value={formatNumber(
            data.selected
              .metrics
              .attemptCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .attemptCount
          }
          icon={
            Zap
          }
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />

        <MetricCard
          label="Completed"
          value={formatNumber(
            data.selected
              .metrics
              .completedCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .completedCount
          }
          icon={
            BadgeCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <MetricCard
          label="Failed"
          value={formatNumber(
            data.selected
              .metrics
              .failedCount
              .value
          )}
          metric={
            data.selected
              .metrics
              .failedCount
          }
          icon={
            XCircle
          }
          iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
          inverse
        />

        <MetricCard
          label="Success rate"
          value={formatPercent(
            data.selected
              .metrics
              .successRate
              .value
          )}
          metric={
            data.selected
              .metrics
              .successRate
          }
          icon={
            Gauge
          }
          iconClass="bg-teal-500/10 text-teal-700 dark:text-teal-400"
        />

        <MetricCard
          label="Completed volume"
          value={formatMoney(
            data.selected
              .metrics
              .paymentVolumeMinor
              .value,

            data.filters
              .currency
          )}
          metric={
            data.selected
              .metrics
              .paymentVolumeMinor
          }
          icon={
            CircleDollarSign
          }
          iconClass="bg-teal-500/10 text-teal-700 dark:text-teal-400"
        />

        <MetricCard
          label="Fee revenue"
          value={formatMoney(
            data.selected
              .metrics
              .feeRevenueMinor
              .value,

            data.filters
              .currency
          )}
          metric={
            data.selected
              .metrics
              .feeRevenueMinor
          }
          icon={
            CircleDollarSign
          }
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />

        <MetricCard
          label="Failure rate"
          value={formatPercent(
            data.selected
              .metrics
              .failureRate
              .value
          )}
          metric={
            data.selected
              .metrics
              .failureRate
          }
          icon={
            ShieldAlert
          }
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          inverse
        />

        <MetricCard
          label="Completion latency"
          value={formatSeconds(
            data.selected
              .metrics
              .averageCompletionSeconds
              .value
          )}
          metric={
            data.selected
              .metrics
              .averageCompletionSeconds
          }
          icon={
            Timer
          }
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          inverse
        />
      </section>

      {/* ===================================================
          TREND + PROVIDER COMPARISON
      ==================================================== */}

      <div className="grid gap-5 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          <Panel
            title="Provider traffic trend"
            description="Attempts, successful payments and failures for the selected provider scope."
            action={
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                UTC buckets
              </span>
            }
          >
            {trendData.some(
              (
                item
              ) =>
                item.attempts >
                0
            ) ? (
              <div className="h-[320px] min-w-0 sm:h-[350px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <ComposedChart
                    data={
                      trendData
                    }
                    margin={{
                      top:
                        10,

                      right:
                        10,

                      left:
                        0,

                      bottom:
                        0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="providerAttemptGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={
                            0.3
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#10b981"
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
                      stroke="currentColor"
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
                      interval="preserveStartEnd"
                      minTickGap={
                        18
                      }
                      tickMargin={
                        8
                      }
                      tick={{
                        fontSize:
                          10,

                        fill:
                          "currentColor",

                        opacity:
                          0.55,
                      }}
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
                      width={
                        40
                      }
                      tick={{
                        fontSize:
                          10,

                        fill:
                          "currentColor",

                        opacity:
                          0.55,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius:
                          14,

                        border:
                          "1px solid var(--border)",

                        background:
                          "var(--card)",

                        color:
                          "var(--card-foreground)",

                        fontSize:
                          12,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="attempts"
                      name="Attempts"
                      stroke="#10b981"
                      strokeWidth={
                        2.5
                      }
                      fill="url(#providerAttemptGradient)"
                    />

                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#14b8a6"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#ef4444"
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
                message="Provider traffic will appear after gateway payment attempts are recorded."
              />
            )}
          </Panel>
        </div>

        <Panel
          title="Provider comparison"
          description="Success rate comparison between payment providers."
        >
          {providerChart.length >
          0 ? (
            <div className="h-[320px] min-w-0 sm:h-[350px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    providerChart
                  }
                  layout="vertical"
                  margin={{
                    top:
                      5,

                    right:
                      10,

                    left:
                      15,

                    bottom:
                      5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={
                      false
                    }
                    stroke="currentColor"
                    opacity={
                      0.08
                    }
                  />

                  <XAxis
                    type="number"
                    domain={[
                      0,
                      100,
                    ]}
                    tickFormatter={(
                      value
                    ) =>
                      `${value}%`
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="provider"
                    width={
                      90
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10,

                      fill:
                        "currentColor",

                      opacity:
                        0.7,
                    }}
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      `${Number(
                        value
                      ).toFixed(
                        2
                      )}%`,

                      "Success rate",
                    ]}
                    contentStyle={{
                      borderRadius:
                        14,

                      border:
                        "1px solid var(--border)",

                      background:
                        "var(--card)",

                      color:
                        "var(--card-foreground)",

                      fontSize:
                        12,
                    }}
                  />

                  <Bar
                    dataKey="successRate"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  >
                    {providerChart.map(
                      (
                        item
                      ) => (
                        <Cell
                          key={
                            item.provider
                          }
                          fill={
                            item.fill
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
              message="No provider comparison is available for the current filters."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          PROVIDER TABLE
      ==================================================== */}

      <Panel
        title="Provider performance"
        description="Operational performance for every provider with traffic in the selected period."
        action={
          <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {data.providers.length} providers
          </span>
        }
      >
        {data.providers.length >
        0 ? (
          <div className="support-provider-scroll overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Provider
                  </th>

                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Health
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Attempts
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Completed
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Failed
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Success
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Volume
                  </th>

                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Latency
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.providers.map(
                  (
                    item
                  ) => {
                    const healthClass =
                      item.health ===
                      "critical"
                        ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                        : item.health ===
                            "attention"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

                    return (
                      <tr
                        key={
                          item.provider
                        }
                        className="border-b border-border/60 transition hover:bg-muted/30"
                      >
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setProvider(
                                item.provider
                              )
                            }
                            className="max-w-[180px] break-words text-left text-xs font-extrabold leading-5 text-foreground transition hover:text-primary"
                          >
                            {providerLabel(
                              item.provider
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${healthClass}`}
                          >
                            {item.health}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {formatNumber(
                            item.attemptCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(
                            item.completedCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-red-600 dark:text-red-400">
                          {formatNumber(
                            item.failedCount
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-black text-foreground">
                          {formatPercent(
                            item.successRate
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-foreground">
                          {formatCompactMoney(
                            item.volumeMinor,
                            data.filters
                              .currency
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-xs font-bold text-muted-foreground">
                          {formatSeconds(
                            item.averageCompletionSeconds
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData
            message="No provider payment activity exists for this filter."
          />
        )}
      </Panel>

      {/* ===================================================
          TOP / WEAKEST
      ==================================================== */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Top provider"
          description="Highest success rate in the current provider sample."
        >
          {data.summary
            .topProvider ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-sm font-extrabold text-foreground">
                {providerLabel(
                  data.summary
                    .topProvider
                    .provider
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatPercent(
                  data.summary
                    .topProvider
                    .successRate
                )}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatNumber(
                  data.summary
                    .topProvider
                    .attemptCount
                )}{" "}
                payment attempts
              </p>
            </div>
          ) : (
            <EmptyData
              message="No provider traffic is available."
            />
          )}
        </Panel>

        <Panel
          title="Weakest provider"
          description="Lowest success rate among providers with recorded traffic."
        >
          {data.summary
            .weakestProvider ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-sm font-extrabold text-foreground">
                {providerLabel(
                  data.summary
                    .weakestProvider
                    .provider
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">
                {formatPercent(
                  data.summary
                    .weakestProvider
                    .successRate
                )}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatNumber(
                  data.summary
                    .weakestProvider
                    .attemptCount
                )}{" "}
                payment attempts
              </p>
            </div>
          ) : (
            <EmptyData
              message="No provider traffic is available."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          FAILURE + LATENCY
      ==================================================== */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Failure reasons"
          description="Recorded provider/payment failure codes for the selected scope."
        >
          {data.failureReasons.length >
          0 ? (
            <div className="space-y-4">
              {data.failureReasons.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.code
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="min-w-0 break-words [overflow-wrap:anywhere] text-xs font-bold leading-5 text-foreground">
                        {providerLabel(
                          item.code
                        )}
                      </span>

                      <span className="text-xs font-bold text-muted-foreground">
                        {formatNumber(
                          item.count
                        )}{" "}
                        ·{" "}
                        {formatPercent(
                          item.percentage
                        )}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
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
          ) : (
            <EmptyData
              message="No failure reason was recorded for the selected provider scope."
            />
          )}
        </Panel>

        <Panel
          title="Completion latency"
          description="Distribution of successful provider payment completion time."
        >
          {data.latency.length >
          0 ? (
            <div className="space-y-4">
              {data.latency.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.key
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-foreground">
                        {item.label}
                      </span>

                      <span className="text-xs font-bold text-muted-foreground">
                        {formatNumber(
                          item.count
                        )}{" "}
                        ·{" "}
                        {formatPercent(
                          item.percentage
                        )}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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
          ) : (
            <EmptyData
              message="No successful payment latency data exists for the selected scope."
            />
          )}
        </Panel>
      </div>

      {/* ===================================================
          INTELLIGENCE
      ==================================================== */}

      <Panel
        title="Provider intelligence"
        description="Deterministic reliability and latency signals generated from real payment-provider activity."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            <BrainCircuit className="h-3.5 w-3.5" />

            {
              data.intelligenceEngine
                .version
            }
          </span>
        }
      >
        {data.insights.length >
        0 ? (
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
        ) : (
          <EmptyData
            message="No provider intelligence signal was generated."
          />
        )}
      </Panel>

      {/* ===================================================
          READ ONLY
      ==================================================== */}

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

          <div>
            <p className="text-xs font-extrabold text-foreground">
              Read-only provider intelligence
            </p>

            <p className="mt-1 break-words [overflow-wrap:anywhere] text-[11px] leading-5 text-muted-foreground">
              {data.scopeNote}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .provider-hero {
          isolation: isolate;
        }

        .support-provider-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(16, 185, 129, 0.42)
            transparent;
        }

        .support-provider-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-provider-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-provider-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            rgba(16, 185, 129, 0.36);
          background-clip:
            padding-box;
        }

        .support-provider-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(5, 150, 105, 0.54);
          background-clip:
            padding-box;
        }

        .provider-hero-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            );
          background-size: 28px 28px;
          mask-image: radial-gradient(
            circle at 56% 45%,
            rgba(0, 0, 0, 0.98),
            rgba(0, 0, 0, 0.3) 65%,
            transparent 100%
          );
          animation: providerGridMove 20s linear infinite;
        }

        .provider-hero-stars {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.20) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 28%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 36% 82%, rgba(255,255,255,0.14) 0 1px, transparent 1px);
          background-size: 82px 82px, 104px 104px, 126px 126px;
          animation: providerStars 28s linear infinite;
        }

        .provider-hero-orb {
          animation: providerOrb 7.5s ease-in-out infinite;
        }

        .provider-hero-orb-delayed {
          animation: providerOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .provider-hero-beam {
          animation: providerBeam 8s ease-in-out infinite;
        }

        .provider-hero-ring-one {
          animation: providerRing 12s linear infinite;
        }

        .provider-hero-ring-two {
          animation: providerRing 8.5s linear infinite reverse;
        }

        .provider-live-dot {
          box-shadow: 0 0 0 0 rgba(209, 250, 229, 0.65);
          animation: providerLiveDot 2s ease-out infinite;
        }

        .provider-icon-pulse {
          animation: providerIconPulse 3.2s ease-out infinite;
        }

        .provider-card-shine {
          animation: providerCardShine 6.5s ease-in-out infinite;
        }

        .provider-core {
          animation: providerCoreFloat 5.3s ease-in-out infinite;
        }

        .provider-core-ring {
          animation: providerCoreRing 3.5s ease-out infinite;
        }

        .provider-core-ring-delay {
          animation-delay: 1.75s;
        }

        .provider-orbit-one {
          animation: providerOrbit 13s linear infinite;
        }

        .provider-orbit-two {
          animation: providerOrbit 18s linear infinite reverse;
        }

        .provider-orbit-item-one {
          animation: providerCounterOrbit 13s linear infinite reverse;
        }

        .provider-orbit-item-two {
          animation: providerCounterOrbit 18s linear infinite;
        }

        .provider-float-card-one {
          animation: providerFloatCard 5.4s ease-in-out infinite;
        }

        .provider-float-card-two {
          animation: providerFloatCard 6.3s ease-in-out 0.8s infinite reverse;
        }

        .provider-scan {
          animation: providerScan 4.4s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209, 250, 229, 0.6));
        }

        @keyframes providerGridMove {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(28px, 28px, 0);
          }
        }

        @keyframes providerStars {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-46px, 30px, 0);
          }
        }

        @keyframes providerOrb {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.72;
          }
          50% {
            transform: translate3d(0, -15px, 0) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes providerBeam {
          0%,
          100% {
            transform: translate3d(0, -50%, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate3d(105px, -50%, 0);
            opacity: 0.5;
          }
        }

        @keyframes providerRing {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        @keyframes providerLiveDot {
          0% {
            box-shadow: 0 0 0 0 rgba(209, 250, 229, 0.58);
          }
          75%,
          100% {
            box-shadow: 0 0 0 8px rgba(209, 250, 229, 0);
          }
        }

        @keyframes providerIconPulse {
          0% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          70%,
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }

        @keyframes providerCardShine {
          0%,
          25% {
            transform: translateX(-180%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          70%,
          100% {
            transform: translateX(460%);
            opacity: 0;
          }
        }

        @keyframes providerCoreFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-7px) rotate(1.6deg);
          }
        }

        @keyframes providerCoreRing {
          0% {
            transform: scale(0.88);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes providerOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes providerCounterOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes providerFloatCard {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -9px, 0);
          }
        }

        @keyframes providerScan {
          0%,
          100% {
            transform: translate(-50%, -100px) scaleX(0.75);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          50% {
            transform: translate(-50%, 0) scaleX(1);
            opacity: 0.98;
          }
          85% {
            opacity: 0.72;
          }
          100% {
            transform: translate(-50%, 100px) scaleX(0.75);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .provider-hero-grid {
            background-size: 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .provider-hero-grid,
          .provider-hero-stars,
          .provider-hero-orb,
          .provider-hero-orb-delayed,
          .provider-hero-beam,
          .provider-hero-ring-one,
          .provider-hero-ring-two,
          .provider-live-dot,
          .provider-icon-pulse,
          .provider-card-shine,
          .provider-core,
          .provider-core-ring,
          .provider-orbit-one,
          .provider-orbit-two,
          .provider-orbit-item-one,
          .provider-orbit-item-two,
          .provider-float-card-one,
          .provider-float-card-two,
          .provider-scan {
            animation: none !important;
          }
        }
      `}</style>

    </div>
  );
}