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
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  DatabaseZap,
  Filter,
  Gauge,
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
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystIntelligence,
  type AnalystInsightCategoryKey,
  type AnalystInsightSeverity,
  type AnalystIntelligenceCategory,
  type AnalystIntelligenceData,
  type AnalystIntelligenceSeverity,
  type AnalystIntelligenceSignal,
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

const SEVERITY_OPTIONS: Array<{
  value:
    AnalystIntelligenceSeverity;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All severities",
  },

  {
    value:
      "critical",

    label:
      "Critical",
  },

  {
    value:
      "high",

    label:
      "High",
  },

  {
    value:
      "medium",

    label:
      "Medium",
  },

  {
    value:
      "info",

    label:
      "Information",
  },

  {
    value:
      "positive",

    label:
      "Positive",
  },
];

const CATEGORY_OPTIONS: Array<{
  value:
    AnalystIntelligenceCategory;

  label:
    string;
}> = [
  {
    value:
      "all",

    label:
      "All categories",
  },

  {
    value:
      "payments",

    label:
      "Payments",
  },

  {
    value:
      "revenue",

    label:
      "Revenue",
  },

  {
    value:
      "refunds",

    label:
      "Refunds",
  },

  {
    value:
      "disputes",

    label:
      "Disputes",
  },

  {
    value:
      "risk",

    label:
      "Risk",
  },

  {
    value:
      "growth",

    label:
      "Growth",
  },

  {
    value:
      "data_quality",

    label:
      "Data quality",
  },
];

/* =========================================================
   HELPERS
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

function dateTimeText(
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
   SEVERITY STYLES
========================================================= */

const SEVERITY_STYLE:
  Record<
    AnalystInsightSeverity,
    string
  > = {
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
  };

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  action,
  children,
}: {
  title:
    string;

  description:
    string;

  action?:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon:
    Icon,
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
    </motion.div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  title,
  message,
}: {
  title:
    string;

  message:
    string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <DatabaseZap className="h-9 w-9 text-muted-foreground/50" />

      <p className="mt-3 text-sm font-extrabold text-foreground">
        {title}
      </p>

      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

/* =========================================================
   SIGNAL CARD
========================================================= */

function SignalCard({
  signal,
}: {
  signal:
    AnalystIntelligenceSignal;
}) {
  const Icon =
    signal.severity ===
    "positive"
      ? CheckCircle2
      : signal.severity ===
          "critical"
        ? XCircle
        : signal.severity ===
            "info"
          ? Sparkles
          : TriangleAlert;

  return (
    <motion.article
      initial={{
        opacity:
          0,

        y:
          10,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      className={`rounded-2xl border p-4 ${SEVERITY_STYLE[signal.severity]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-foreground">
              {signal.title}
            </h3>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              {signal.severity}
            </span>

            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              {humanize(
                signal.category
              )}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {
              signal.description
            }
          </p>

          <div className="mt-3 rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
              Evidence
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {
                signal.evidence
              }
            </p>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
              Recommended review
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {
                signal.recommendedAction
              }
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   CATEGORY STYLE
========================================================= */

function categoryStyle(
  category:
    AnalystInsightCategoryKey
): string {
  switch (
    category
  ) {
    case "payments":
      return "bg-blue-500";

    case "revenue":
      return "bg-emerald-500";

    case "refunds":
      return "bg-amber-500";

    case "disputes":
      return "bg-orange-500";

    case "risk":
      return "bg-red-500";

    case "growth":
      return "bg-cyan-500";

    case "data_quality":
      return "bg-violet-500";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystIntelligencePage() {
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
    severity,
    setSeverity,
  ] =
    useState<AnalystIntelligenceSeverity>(
      "all"
    );

  const [
    category,
    setCategory,
  ] =
    useState<AnalystIntelligenceCategory>(
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
    useState<AnalystIntelligenceData | null>(
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
     LOAD INTELLIGENCE
  ====================================================== */

  useEffect(
    () => {
      const controller =
        new AbortController();

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

          const response =
            await getAnalystIntelligence(
              {
                range,
                mode,
                currency,
                severity,
                category,
              },
              controller.signal
            );

          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          hasLoadedRef.current =
            true;

          setData(
            response
          );
        } catch (
          loadError:
            unknown
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load analyst intelligence."
          );
        } finally {
          if (
            !controller.signal
              .aborted
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
        controller.abort();
      };
    },
    [
      range,
      mode,
      currency,
      severity,
      category,
      refreshKey,
    ]
  );

  /* =======================================================
     CHART DATA
  ====================================================== */

  const timeline =
    useMemo(
      () =>
        (
          data
            ?.timeline ??
          []
        ).map(
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
        ),
      [
        data,
        range,
      ]
    );

  /* =======================================================
     APPLY CURRENCY
  ====================================================== */

  function applyCurrency(
    event:
      FormEvent
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
     LOADING
  ====================================================== */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20">
            <BrainCircuit className="h-6 w-6 animate-pulse" />
          </div>

          <p className="mt-4 text-sm font-extrabold text-foreground">
            Building intelligence
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Evaluating real platform signals...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ====================================================== */

  return (
    <main className="space-y-6">
      {/* ===================================================
          HEADER
      ==================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />

        <div className="pointer-events-none absolute bottom-[-100px] left-[30%] h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
              <BrainCircuit className="h-3.5 w-3.5" />

              Intelligence Center
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              Analyst Intelligence
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Explainable operational signals generated from real payment,
              wallet, risk, refund, dispute and revenue analytics.
            </p>

            {data && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1.5">
                  Engine:{" "}
                  {
                    data.engine
                      .version
                  }
                </span>

                <span className="rounded-full border border-border bg-background px-3 py-1.5">
                  Generated:{" "}
                  {dateTimeText(
                    data.generatedAt
                  )}
                </span>

                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
                  No paid AI provider
                </span>
              </div>
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-extrabold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing"
              : "Refresh intelligence"}
          </button>
        </div>
      </section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="text-sm font-extrabold">
              Intelligence request failed
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Intelligence Filters
          </p>
        </div>

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
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
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
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
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
              severity
            }
            onChange={(
              event
            ) =>
              setSeverity(
                event.target
                  .value as
                  AnalystIntelligenceSeverity
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
          >
            {SEVERITY_OPTIONS.map(
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
              category
            }
            onChange={(
              event
            ) =>
              setCategory(
                event.target
                  .value as
                  AnalystIntelligenceCategory
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-primary"
          >
            {CATEGORY_OPTIONS.map(
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
            className="flex gap-2"
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
                )
              }
              maxLength={
                3
              }
              aria-label="Currency code"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold uppercase text-foreground outline-none transition focus:border-primary"
            />

            <button
              type="submit"
              className="rounded-xl bg-primary px-3 text-[10px] font-black uppercase tracking-wide text-primary-foreground transition hover:opacity-90"
            >
              Apply
            </button>
          </form>
        </div>
      </section>

      {data && (
        <>
          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Signals"
              value={formatNumber(
                data.summary
                  .matchedSignals
              )}
              description={`${formatNumber(
                data.summary
                  .totalSignals
              )} total platform signals`}
              icon={
                BrainCircuit
              }
              iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />

            <SummaryCard
              label="Critical"
              value={formatNumber(
                data.summary
                  .criticalSignals
              )}
              description="Signals requiring immediate analyst review"
              icon={
                ShieldAlert
              }
              iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
            />

            <SummaryCard
              label="Attention"
              value={formatNumber(
                data.summary
                  .attentionSignals
              )}
              description="High and medium priority signals"
              icon={
                Gauge
              }
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />

            <SummaryCard
              label="Facts Evaluated"
              value={formatNumber(
                data.summary
                  .factsEvaluated
              )}
              description="Payments and wallet transactions considered"
              icon={
                DatabaseZap
              }
              iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
          </section>

          {/* =================================================
              ENGINE + BASELINE
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
            <Panel
              title="Intelligence Engine"
              description="Transparent engine metadata for the current evaluation."
            >
              <div className="space-y-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                      <BrainCircuit className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-foreground">
                        Deterministic Rules
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Version{" "}
                        {
                          data.engine
                            .version
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-4 w-4" />

                    <p className="text-xs font-extrabold">
                      Explainable intelligence
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    {
                      data.engine
                        .explanation
                    }
                  </p>
                </div>
              </div>
            </Panel>

            <Panel
              title="Current Analytical Baseline"
              description="Real platform metrics used by the intelligence evaluation."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <BaselineItem
                  label="Payments"
                  value={formatNumber(
                    data.baseline
                      .paymentCount
                  )}
                />

                <BaselineItem
                  label="Success rate"
                  value={`${data.baseline.successRate.toFixed(
                    2
                  )}%`}
                />

                <BaselineItem
                  label="Payment volume"
                  value={formatMoney(
                    data.baseline
                      .paymentVolumeMinor,
                    data.filters
                      .currency,
                    true
                  )}
                />

                <BaselineItem
                  label="Fee revenue"
                  value={formatMoney(
                    data.baseline
                      .feeRevenueMinor,
                    data.filters
                      .currency,
                    true
                  )}
                />

                <BaselineItem
                  label="Failed payments"
                  value={formatNumber(
                    data.baseline
                      .failedPaymentCount
                  )}
                />

                <BaselineItem
                  label="High-risk transactions"
                  value={formatNumber(
                    data.baseline
                      .highRiskTransactionCount
                  )}
                />

                <BaselineItem
                  label="Refund value"
                  value={formatMoney(
                    data.baseline
                      .refundAmountMinor,
                    data.filters
                      .currency,
                    true
                  )}
                />

                <BaselineItem
                  label="Dispute exposure"
                  value={formatMoney(
                    data.baseline
                      .openDisputeExposureMinor,
                    data.filters
                      .currency,
                    true
                  )}
                />
              </div>
            </Panel>
          </div>

          {/* =================================================
              TIMELINE
          ================================================= */}

          <Panel
            title="Signal Pressure Timeline"
            description="Deterministic pressure combines payment reliability, failures and unusual volume movement."
            action={
              <Activity className="h-5 w-5 text-primary" />
            }
          >
            {timeline.length ===
            0 ? (
              <EmptyState
                title="No timeline available"
                message="There is not enough real payment activity to build a pressure timeline."
              />
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart
                    data={
                      timeline
                    }
                    margin={{
                      top:
                        10,

                      right:
                        10,

                      bottom:
                        0,

                      left:
                        -15,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="intelligence-pressure"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={
                            0.32
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={
                            0
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
                        0.18
                      }
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize:
                          10,
                      }}
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                    />

                    <YAxis
                      domain={[
                        0,
                        100,
                      ]}
                      tick={{
                        fontSize:
                          10,
                      }}
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius:
                          14,

                        border:
                          "1px solid var(--border)",

                        background:
                          "var(--card)",

                        fontSize:
                          11,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="pressureScore"
                      name="Pressure score"
                      stroke="#6366f1"
                      strokeWidth={
                        2
                      }
                      fill="url(#intelligence-pressure)"
                    />

                    <Line
                      type="monotone"
                      dataKey="successRate"
                      name="Success rate"
                      stroke="#10b981"
                      strokeWidth={
                        2
                      }
                      dot={
                        false
                      }
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          {/* =================================================
              CATEGORY DISTRIBUTION
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
            <Panel
              title="Signal Categories"
              description="Distribution of all currently detected intelligence signals."
            >
              <div className="space-y-4">
                {data.categories.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.category
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${categoryStyle(
                              item.category
                            )}`}
                          />

                          <span className="text-xs font-bold text-foreground">
                            {humanize(
                              item.category
                            )}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-muted-foreground">
                          {
                            item.count
                          }{" "}
                          ·{" "}
                          {item.percentage.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${categoryStyle(
                            item.category
                          )}`}
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

            <Panel
              title="Active Anomalies"
              description="Critical, high and medium severity signals matching the selected filters."
              action={
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              }
            >
              {data.anomalies.length ===
              0 ? (
                <EmptyState
                  title="No matching anomaly"
                  message="The current deterministic rules did not detect a critical, high, or medium signal for these filters."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.anomalies.map(
                    (
                      signal
                    ) => (
                      <SignalCard
                        key={
                          signal.id
                        }
                        signal={
                          signal
                        }
                      />
                    )
                  )}
                </div>
              )}
            </Panel>
          </div>

          {/* =================================================
              ALL SIGNALS
          ================================================= */}

          <Panel
            title="Intelligence Signals"
            description="Evidence-backed signals matching the current severity and category filters."
            action={
              <Sparkles className="h-5 w-5 text-violet-500" />
            }
          >
            {data.insights.length ===
            0 ? (
              <EmptyState
                title="No matching signal"
                message="Try changing the severity, category, time range, or mode filters."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.insights.map(
                  (
                    signal
                  ) => (
                    <SignalCard
                      key={
                        signal.id
                      }
                      signal={
                        signal
                      }
                    />
                  )
                )}
              </div>
            )}
          </Panel>

          {/* =================================================
              READ ONLY NOTICE
          ================================================= */}

          <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />

            <div>
              <p className="text-xs font-extrabold text-foreground">
                Read-only analyst workspace
              </p>

              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                Intelligence recommendations are observational. Analysts cannot
                approve payments, block transactions, issue refunds, change
                balances, or mutate platform financial records from this page.
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/* =========================================================
   BASELINE ITEM
========================================================= */

function BaselineItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 truncate text-base font-black text-foreground">
        {value}
      </p>
    </div>
  );
}
