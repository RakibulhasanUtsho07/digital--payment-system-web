// src/app/(dashboard)/dashboard/analytics/page.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudLightning,
  Download,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  MapPinned,
  Presentation,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import {
  analyticsApi,
  type AnalyticsAlert,
  type AnalyticsBreakdownItem,
  type AnalyticsDashboardData,
  type AnalyticsInsight,
  type AnalyticsOverview,
  type AnalyticsPulseMetric,
  type AnalyticsRange,
  type AnalyticsRiskCell,
  type AnalyticsSeriesPoint,
  type AnalyticsTone,
} from "@/lib/api/analyticsApi";

/* =========================================================
   VISUAL TOKENS
========================================================= */

const TONE = {
  blue: {
    soft:
      "bg-blue-50",
    border:
      "border-blue-100",
    text:
      "text-blue-700",
    dot:
      "#2563eb",
  },
  cyan: {
    soft:
      "bg-cyan-50",
    border:
      "border-cyan-100",
    text:
      "text-cyan-700",
    dot:
      "#06b6d4",
  },
  emerald: {
    soft:
      "bg-emerald-50",
    border:
      "border-emerald-100",
    text:
      "text-emerald-700",
    dot:
      "#10b981",
  },
  amber: {
    soft:
      "bg-amber-50",
    border:
      "border-amber-100",
    text:
      "text-amber-700",
    dot:
      "#f59e0b",
  },
  rose: {
    soft:
      "bg-rose-50",
    border:
      "border-rose-100",
    text:
      "text-rose-700",
    dot:
      "#f43f5e",
  },
  violet: {
    soft:
      "bg-violet-50",
    border:
      "border-violet-100",
    text:
      "text-violet-700",
    dot:
      "#8b5cf6",
  },
  slate: {
    soft:
      "bg-slate-50",
    border:
      "border-slate-200",
    text:
      "text-slate-700",
    dot:
      "#94a3b8",
  },
} satisfies Record<
  AnalyticsTone,
  {
    soft: string;
    border: string;
    text: string;
    dot: string;
  }
>;

const CHART_COLORS = {
  volume:
    "#2563eb",
  revenue:
    "#0f9f6e",
  failures:
    "#e11d48",
};

const sectionMotion = {
  initial: {
    opacity: 0,
    y: 18,
  },
  whileInView: {
    opacity: 1,
    y: 0,
  },
  viewport: {
    once: true,
    amount: 0.18,
  },
  transition: {
    duration: 0.55,
    ease: [
      0.22,
      1,
      0.36,
      1,
    ] as const,
  },
};

/* =========================================================
   FORMATTERS
========================================================= */

const formatMoney = (
  value:
    number,
  compact =
    true
) => {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "৳0";
  }

  if (
    !compact
  ) {
    return `৳${Math.round(
      value
    ).toLocaleString()}`;
  }

  const absolute =
    Math.abs(
      value
    );

  if (
    absolute >=
    1_000_000_000
  ) {
    return `৳${(
      value /
      1_000_000_000
    ).toFixed(
      2
    )}B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `৳${(
      value /
      1_000_000
    ).toFixed(
      2
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `৳${(
      value /
      1_000
    ).toFixed(
      1
    )}K`;
  }

  return `৳${Math.round(
    value
  ).toLocaleString()}`;
};

const formatNumber = (
  value:
    number
) => {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  const absolute =
    Math.abs(
      value
    );

  if (
    absolute >=
    1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(
      2
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(
      1
    )}K`;
  }

  return Math.round(
    value
  ).toLocaleString();
};

const safePercent = (
  value:
    number
) =>
  Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(
        value
      )
        ? value
        : 0
    )
  );

const getTimeLabel = (
  value?:
    string
) => {
  if (
    !value
  ) {
    return "Waiting for data";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently updated";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AnalyticsDashboard() {
  const [
    range,
    setRange,
  ] =
    useState<AnalyticsRange>(
      "7D"
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<AnalyticsDashboardData | null>(
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
    storyOpen,
    setStoryOpen,
  ] =
    useState(
      false
    );

  const [
    reportOpen,
    setReportOpen,
  ] =
    useState(
      false
    );

  const [
    metricDetail,
    setMetricDetail,
  ] =
    useState<{
      label:
        string;
      value:
        string;
      helper:
        string;
      icon:
        React.ElementType;
      tone:
        AnalyticsTone;
    } | null>(
      null
    );

  const loadAnalytics =
    useCallback(
      async (
        selectedRange:
          AnalyticsRange,
        refresh =
          false
      ) => {
        if (
          refresh
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

        try {
          const response =
            await analyticsApi.getDashboard(
              selectedRange,
              {
                refresh,
              }
            );

          if (
            !response?.success ||
            !response.dashboard
          ) {
            throw new Error(
              "Analytics API returned an invalid response."
            );
          }

          setDashboard(
            response.dashboard
          );
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
            Error
              ? loadError.message
              : "Unable to load analytics.";

          setError(
            message
          );

          if (
            !refresh
          ) {
            setDashboard(
              null
            );
          }
        } finally {
          setLoading(
            false
          );
          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void loadAnalytics(
        range,
        false
      );
    },
    [
      loadAnalytics,
      range,
    ]
  );

  const overview =
    dashboard
      ?.overview ??
    null;

  const kpis =
    useMemo(
      () => {
        if (
          !overview
        ) {
          return [];
        }

        return [
          {
            label:
              "Transaction Volume",
            value:
              formatMoney(
                overview.transactionVolume
              ),
            helper:
              `${formatNumber(
                overview.transactionCount
              )} completed transactions`,
            icon:
              CircleDollarSign,
            tone:
              "blue" as const,
          },
          {
            label:
              "Platform Revenue",
            value:
              formatMoney(
                overview.platformRevenue
              ),
            helper:
              "Captured fee revenue",
            icon:
              Banknote,
            tone:
              "emerald" as const,
          },
          {
            label:
              "Active Users",
            value:
              formatNumber(
                overview.activeUsers
              ),
            helper:
              `${overview.retentionRate.toFixed(
                1
              )}% retained`,
            icon:
              Users,
            tone:
              "violet" as const,
          },
          {
            label:
              "Wallet Balance",
            value:
              formatMoney(
                overview.walletBalance
              ),
            helper:
              "Current stored liquidity",
            icon:
              WalletCards,
            tone:
              "cyan" as const,
          },
          {
            label:
              "KYC Completion",
            value:
              `${overview.kycCompletion.toFixed(
                1
              )}%`,
            helper:
              "Verified eligible users",
            icon:
              BadgeCheck,
            tone:
              "blue" as const,
          },
          {
            label:
              "Avg. Transaction",
            value:
              formatMoney(
                overview.avgTransactionValue,
                false
              ),
            helper:
              "Per completed transaction",
            icon:
              Gauge,
            tone:
              "amber" as const,
          },
          {
            label:
              "Failure Rate",
            value:
              `${overview.failedRate.toFixed(
                2
              )}%`,
            helper:
              "Failed attempts / all attempts",
            icon:
              AlertTriangle,
            tone:
              "rose" as const,
          },
          {
            label:
              "Risk Exposure",
            value:
              formatMoney(
                overview.highRiskExposure
              ),
            helper:
              "High-risk financial exposure",
            icon:
              ShieldAlert,
            tone:
              "rose" as const,
          },
        ];
      },
      [
        overview,
      ]
    );

  const handleExport =
    async () => {
      try {
        setError(
          ""
        );

        await analyticsApi.downloadExport(
          range
        );
      } catch (
        exportError
      ) {
        setError(
          exportError instanceof
            Error
            ? exportError.message
            : "Unable to export analytics."
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#F3F7FB] px-4 py-5 text-[#102A43] sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1560px]">
        <CommandHeader
          range={
            range
          }
          generatedAt={
            dashboard
              ?.generatedAt
          }
          connected={
            Boolean(
              dashboard
            )
          }
          refreshing={
            refreshing
          }
          onRefresh={() =>
            void loadAnalytics(
              range,
              true
            )
          }
          onExport={() =>
            void handleExport()
          }
          onReport={() =>
            setReportOpen(
              true
            )
          }
          onStory={() =>
            setStoryOpen(
              true
            )
          }
        />

        <AnimatePresence>
          {error && (
            <ErrorBanner
              message={
                error
              }
              hasData={
                Boolean(
                  dashboard
                )
              }
              onRetry={() =>
                void loadAnalytics(
                  range,
                  true
                )
              }
              onClose={() =>
                setError(
                  ""
                )
              }
            />
          )}
        </AnimatePresence>

        <section className="mt-6">
          <div className="flex flex-col gap-4 rounded-[28px] border border-[#DCE7F0] bg-white p-4 shadow-[0_12px_38px_rgba(15,39,69,0.05)] md:flex-row md:items-center md:justify-between md:p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5B8BB7]">
                Analytics Window
              </p>

              <h2 className="mt-1 text-lg font-black text-[#102A43]">
                Live operating intelligence
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Every widget below reads from the selected backend analytics window.
              </p>
            </div>

            <TimeRangeControl
              value={
                range
              }
              onChange={
                setRange
              }
            />
          </div>
        </section>

        {loading &&
        !dashboard ? (
          <AnalyticsSkeleton />
        ) : !dashboard ||
          !overview ? (
          <EmptyAnalyticsState
            onRetry={() =>
              void loadAnalytics(
                range,
                true
              )
            }
          />
        ) : (
          <>
            <motion.section
              {...sectionMotion}
              className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]"
            >
              <PlatformPulse
                metrics={
                  dashboard.pulse
                }
              />

              <FinancialWeather
                overview={
                  overview
                }
              />
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-7"
            >
              <SectionHeading
                eyebrow="Executive Intelligence"
                title="Executive Snapshot"
                description="The highest-value operating, financial, customer and risk metrics for the selected period."
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map(
                  (
                    item,
                    index
                  ) => (
                    <KpiCard
                      key={
                        item.label
                      }
                      item={
                        item
                      }
                      index={
                        index
                      }
                      onOpen={() =>
                        setMetricDetail(
                          item
                        )
                      }
                    />
                  )
                )}
              </div>
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]"
            >
              <TrendIntelligence
                series={
                  dashboard.series
                }
                range={
                  range
                }
              />

              <ChannelEconomics
                items={
                  dashboard.channels
                }
                totalCount={
                  overview.transactionCount
                }
              />
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-6 grid gap-5 xl:grid-cols-2"
            >
              <MoneyFlowNetwork
                overview={
                  overview
                }
                channels={
                  dashboard.channels
                }
              />

              <TransactionRiskMatrix
                items={
                  dashboard.riskMatrix
                }
                overview={
                  overview
                }
              />
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-6 grid items-stretch gap-5 xl:grid-cols-2"
            >
              <FailureAnalytics
                items={
                  dashboard.failureReasons
                }
                failedRate={
                  overview.failedRate
                }
              />

              <KycCoverage
                overview={
                  overview
                }
              />
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-6 grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]"
            >
              <GeographicPerformance
                items={
                  dashboard.geography
                }
              />

              <RevenueQuality
                overview={
                  overview
                }
              />
            </motion.section>

            <motion.section
              {...sectionMotion}
              className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            >
              <OperationalAlerts
                alerts={
                  dashboard.alerts
                }
              />

              <InsightCenter
                insights={
                  dashboard.insights
                }
              />
            </motion.section>
          </>
        )}

        <div className="h-10" />
      </div>

      <AnimatePresence>
        {storyOpen &&
        dashboard && (
          <StoryMode
            dashboard={
              dashboard
            }
            onClose={() =>
              setStoryOpen(
                false
              )
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen &&
        dashboard && (
          <ReportModal
            dashboard={
              dashboard
            }
            range={
              range
            }
            onClose={() =>
              setReportOpen(
                false
              )
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {metricDetail && (
          <MetricDetailsModal
            item={
              metricDetail
            }
            range={
              range
            }
            onClose={() =>
              setMetricDetail(
                null
              )
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   HEADER
========================================================= */

function CommandHeader({
  range,
  generatedAt,
  connected,
  refreshing,
  onRefresh,
  onExport,
  onReport,
  onStory,
}: {
  range:
    AnalyticsRange;
  generatedAt?:
    string;
  connected:
    boolean;
  refreshing:
    boolean;
  onRefresh:
    () => void;
  onExport:
    () => void;
  onReport:
    () => void;
  onStory:
    () => void;
}) {
  return (
    <header className="relative overflow-hidden rounded-[30px] border border-[#D8E5EF] bg-white shadow-[0_16px_46px_rgba(15,39,69,0.06)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-blue-100/60 blur-3xl" />

      <div className="relative z-10 grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#102A43] md:text-[30px]">
              Reports & Analytics
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${
                connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected
                    ? "animate-pulse bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              {connected
                ? "Live API"
                : "Connecting"}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Operational, financial, customer, liquidity, compliance and risk intelligence in one admin command center.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="h-3 w-3" />
              Updated{" "}
              {getTimeLabel(
                generatedAt
              )}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3 w-3" />
              Window:{" "}
              {range}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <HeaderAction
            icon={
              RefreshCcw
            }
            label="Refresh"
            onClick={
              onRefresh
            }
            spinning={
              refreshing
            }
          />

          <HeaderAction
            icon={
              Download
            }
            label="Export"
            onClick={
              onExport
            }
          />

          <HeaderAction
            icon={
              FileText
            }
            label="Report"
            onClick={
              onReport
            }
          />

          <button
            type="button"
            onClick={
              onStory
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#174A7A] to-[#1F5EA8] px-4 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(31,94,168,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,94,168,0.28)]"
          >
            <Presentation className="h-4 w-4" />
            Story Mode
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderAction({
  icon:
    Icon,
  label,
  onClick,
  spinning =
    false,
}: {
  icon:
    React.ElementType;
  label:
    string;
  onClick:
    () => void;
  spinning?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#D8E5EF] bg-white px-4 text-[11px] font-black text-[#174A7A] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60"
    >
      <Icon
        className={`h-4 w-4 ${
          spinning
            ? "animate-spin"
            : ""
        }`}
      />
      {label}
    </button>
  );
}

function ErrorBanner({
  message,
  hasData,
  onRetry,
  onClose,
}: {
  message:
    string;
  hasData:
    boolean;
  onRetry:
    () => void;
  onClose:
    () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity:
          0,
        y:
          -8,
      }}
      animate={{
        opacity:
          1,
        y:
          0,
      }}
      exit={{
        opacity:
          0,
        y:
          -8,
      }}
      className="mt-4 flex flex-col gap-3 rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div>
          <p className="text-[11px] font-black text-rose-800">
            {hasData
              ? "Refresh failed"
              : "Live analytics unavailable"}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-rose-700/75">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={
            onRetry
          }
          className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-rose-700 shadow-sm"
        >
          Retry
        </button>

        <button
          type="button"
          onClick={
            onClose
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* =========================================================
   RANGE + SECTION HEADER
========================================================= */

function TimeRangeControl({
  value,
  onChange,
}: {
  value:
    AnalyticsRange;
  onChange:
    (
      value:
        AnalyticsRange
    ) => void;
}) {
  const ranges:
    AnalyticsRange[] = [
    "Today",
    "7D",
    "30D",
    "90D",
    "1Y",
  ];

  return (
    <div className="flex w-full items-center overflow-x-auto rounded-2xl border border-[#DCE7F0] bg-[#F8FBFE] p-1 sm:w-fit">
      {ranges.map(
        (
          item
        ) => (
          <button
            key={
              item
            }
            type="button"
            onClick={() =>
              onChange(
                item
              )
            }
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black transition duration-200 ${
              value ===
              item
                ? "bg-[#174A7A] text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-[#174A7A]"
            }`}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow:
    string;
  title:
    string;
  description:
    string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#5B8BB7]">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-black text-[#102A43]">
        {title}
      </h2>

      <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   PLATFORM HEALTH
========================================================= */

function PlatformPulse({
  metrics,
}: {
  metrics:
    AnalyticsPulseMetric[];
}) {
  const average =
    metrics.length >
    0
      ? Math.round(
          metrics.reduce(
            (
              total,
              item
            ) =>
              total +
              item.score,
            0
          ) /
            metrics.length
        )
      : 0;

  const healthLabel =
    average >=
    90
      ? "Excellent"
      : average >=
        80
        ? "Healthy"
        : average >=
          70
          ? "Watch"
          : "Attention";

  return (
    <div className="relative h-full overflow-hidden rounded-[30px] border border-[#173D61] bg-[linear-gradient(135deg,#0B2A48_0%,#103B61_52%,#175378_100%)] p-5 text-white shadow-[0_22px_58px_rgba(15,39,69,0.18)] md:p-6">
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/65">
                Platform Pulse
              </p>
            </div>

            <h2 className="mt-2 text-xl font-black">
              Live system health
            </h2>

            <p className="mt-1 max-w-xl text-[11px] leading-5 text-blue-100/55">
              Backend-calculated growth, liquidity, transaction quality, security and risk scores.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-blue-100/45">
                Composite
              </p>

              <p className="mt-0.5 text-2xl font-black">
                {average}
              </p>
            </div>

            <div className="h-9 w-px bg-white/10" />

            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
              {healthLabel}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map(
            (
              metric,
              index
            ) => (
              <motion.div
                key={
                  metric.id
                }
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
                transition={{
                  duration:
                    0.4,
                  delay:
                    index *
                    0.05,
                }}
                className="rounded-[18px] border border-white/10 bg-white/[0.055] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-blue-100/55">
                    {metric.label}
                  </span>

                  {metric.trend ===
                  "up" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                  ) : metric.trend ===
                    "down" ? (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 text-blue-100/45" />
                  )}
                </div>

                <div className="mt-3 flex items-end gap-3">
                  <span className="text-2xl font-black">
                    {metric.score}
                  </span>

                  <div className="mb-1 h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{
                        width:
                          0,
                      }}
                      animate={{
                        width:
                          `${safePercent(
                            metric.score
                          )}%`,
                      }}
                      transition={{
                        duration:
                          0.8,
                        delay:
                          0.12 +
                          index *
                            0.04,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-300"
                    />
                  </div>
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function FinancialWeather({
  overview,
}: {
  overview:
    AnalyticsOverview;
}) {
  const clear =
    overview.failedRate <
      2 &&
    overview.highRiskExposure <=
      Math.max(
        overview.transactionVolume *
          0.08,
        1
      );

  const watch =
    !clear &&
    overview.failedRate <
      3.5;

  const state =
    clear
      ? {
          title:
            "Clear conditions",
          subtitle:
            "Transaction quality and current risk exposure are controlled.",
          icon:
            Sun,
          tone:
            "emerald" as const,
        }
      : watch
        ? {
            title:
              "Watch conditions",
            subtitle:
              "Some operating signals are elevated and should be monitored.",
            icon:
              CloudLightning,
            tone:
              "amber" as const,
          }
        : {
            title:
              "High pressure",
            subtitle:
              "Failure or risk conditions require closer operational attention.",
            icon:
              ShieldAlert,
            tone:
              "rose" as const,
          };

  const tone =
    TONE[
      state.tone
    ];

  const Icon =
    state.icon;

  return (
    <div className="flex h-full flex-col justify-between rounded-[30px] border border-[#DCE7F0] bg-white p-5 shadow-[0_14px_42px_rgba(15,39,69,0.06)] md:p-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tone.border} ${tone.soft} ${tone.text}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
            Live signal
          </span>
        </div>

        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-[#5B8BB7]">
          Financial Weather
        </p>

        <h3 className="mt-1 text-xl font-black text-[#102A43]">
          {state.title}
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {state.subtitle}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniMetric
          label="Failures"
          value={`${overview.failedRate.toFixed(
            2
          )}%`}
        />

        <MiniMetric
          label="Risk"
          value={
            formatMoney(
              overview.highRiskExposure
            )
          }
        />

        <MiniMetric
          label="Retention"
          value={`${overview.retentionRate.toFixed(
            1
          )}%`}
        />
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="rounded-2xl border border-[#E5EDF4] bg-[#F8FBFD] p-3">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-[12px] font-black text-[#174A7A]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   KPI CARDS
========================================================= */

function KpiCard({
  item,
  index,
  onOpen,
}: {
  item: {
    label:
      string;
    value:
      string;
    helper:
      string;
    icon:
      React.ElementType;
    tone:
      AnalyticsTone;
  };
  index:
    number;
  onOpen:
    () => void;
}) {
  const tone =
    TONE[
      item.tone
    ];

  const Icon =
    item.icon;

  return (
    <motion.button
      type="button"
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
      transition={{
        duration:
          0.42,
        delay:
          index *
          0.035,
      }}
      whileHover={{
        y:
          -3,
      }}
      onClick={
        onOpen
      }
      className="group rounded-[24px] border border-[#DCE7F0] bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,39,69,0.045)] transition hover:border-blue-100 hover:shadow-[0_16px_38px_rgba(15,39,69,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${tone.border} ${tone.soft} ${tone.text}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-black text-slate-400">
          LIVE
        </span>
      </div>

      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
        {item.label}
      </p>

      <motion.p
        key={
          item.value
        }
        initial={{
          opacity:
            0,
          y:
            4,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        className="mt-1 text-2xl font-black tracking-tight text-[#102A43]"
      >
        {item.value}
      </motion.p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="truncate text-[9px] font-semibold text-slate-400">
          {item.helper}
        </p>

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>
    </motion.button>
  );
}

/* =========================================================
   TREND INTELLIGENCE
========================================================= */

type TrendMetric =
  | "volume"
  | "revenue"
  | "failures";

function TrendIntelligence({
  series,
  range,
}: {
  series:
    AnalyticsSeriesPoint[];
  range:
    AnalyticsRange;
}) {
  const [
    metric,
    setMetric,
  ] =
    useState<TrendMetric>(
      "volume"
    );

  return (
    <CardShell
      eyebrow="Performance Trend"
      title="Trend Intelligence"
      description={`A smooth ${range} view generated entirely from the live analytics series.`}
      action={
        <MetricTabs
          value={
            metric
          }
          onChange={
            setMetric
          }
        />
      }
    >
      <div className="mt-5">
        <LiveAreaChart
          series={
            series
          }
          metric={
            metric
          }
        />
      </div>
    </CardShell>
  );
}

function MetricTabs({
  value,
  onChange,
}: {
  value:
    TrendMetric;
  onChange:
    (
      value:
        TrendMetric
    ) => void;
}) {
  const labels:
    Array<{
      id:
        TrendMetric;
      label:
        string;
    }> = [
    {
      id:
        "volume",
      label:
        "Volume",
    },
    {
      id:
        "revenue",
      label:
        "Revenue",
    },
    {
      id:
        "failures",
      label:
        "Failures",
    },
  ];

  return (
    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {labels.map(
        (
          item
        ) => (
          <button
            type="button"
            key={
              item.id
            }
            onClick={() =>
              onChange(
                item.id
              )
            }
            className={`rounded-lg px-2.5 py-1.5 text-[8px] font-black transition ${
              value ===
              item.id
                ? "bg-white text-[#174A7A] shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

function LiveAreaChart({
  series,
  metric,
}: {
  series:
    AnalyticsSeriesPoint[];
  metric:
    TrendMetric;
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      Math.max(
        0,
        series.length -
          1
      )
    );

  useEffect(
    () => {
      setActiveIndex(
        Math.max(
          0,
          series.length -
            1
        )
      );
    },
    [
      series,
      metric,
    ]
  );

  if (
    series.length ===
    0
  ) {
    return (
      <ChartEmptyState />
    );
  }

  const width =
    760;

  const height =
    280;

  const padding = {
    top:
      24,
    right:
      28,
    bottom:
      44,
    left:
      36,
  };

  const values =
    series.map(
      (
        point
      ) =>
        Number(
          point[
            metric
          ] ??
            0
        )
    );

  const max =
    Math.max(
      ...values,
      1
    );

  const min =
    Math.min(
      ...values,
      0
    );

  const spread =
    Math.max(
      max -
        min,
      max *
        0.1,
      0.1
    );

  const chartMin =
    Math.max(
      0,
      min -
        spread *
          0.18
    );

  const chartMax =
    max +
    spread *
      0.18;

  const plotWidth =
    width -
    padding.left -
    padding.right;

  const plotHeight =
    height -
    padding.top -
    padding.bottom;

  const points =
    series.map(
      (
        point,
        index
      ) => {
        const x =
          series.length ===
          1
            ? padding.left +
              plotWidth /
                2
            : padding.left +
              (
                index /
                (
                  series.length -
                  1
                )
              ) *
                plotWidth;

        const value =
          Number(
            point[
              metric
            ] ??
              0
          );

        const ratio =
          chartMax ===
          chartMin
            ? 0.5
            : (
                value -
                chartMin
              ) /
              (
                chartMax -
                chartMin
              );

        const y =
          padding.top +
          (
            1 -
            ratio
          ) *
            plotHeight;

        return {
          x,
          y,
          value,
          label:
            point.label,
        };
      }
    );

  const linePath =
    buildSmoothPath(
      points
    );

  const baseline =
    padding.top +
    plotHeight;

  const areaPath =
    points.length >
    0
      ? `${linePath} L ${points[
          points.length -
            1
        ].x} ${baseline} L ${points[
          0
        ].x} ${baseline} Z`
      : "";

  const active =
    points[
      activeIndex
    ] ??
    points[
      0
    ];

  const activeValue =
    metric ===
    "failures"
      ? `${active.value.toFixed(
          2
        )}%`
      : `৳${active.value.toFixed(
          2
        )}M`;

  const color =
    CHART_COLORS[
      metric
    ];

  const gradientId =
    `analytics-${metric}-gradient`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
      <div className="relative overflow-hidden rounded-[24px] border border-[#DCE7F0] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[290px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${metric} trend`}
        >
          <defs>
            <linearGradient
              id={
                gradientId
              }
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={
                  color
                }
                stopOpacity="0.24"
              />
              <stop
                offset="100%"
                stopColor={
                  color
                }
                stopOpacity="0.015"
              />
            </linearGradient>
          </defs>

          {[
            0,
            1,
            2,
            3,
            4,
          ].map(
            (
              line
            ) => {
              const y =
                padding.top +
                (
                  line /
                  4
                ) *
                  plotHeight;

              return (
                <line
                  key={
                    line
                  }
                  x1={
                    padding.left
                  }
                  x2={
                    width -
                    padding.right
                  }
                  y1={
                    y
                  }
                  y2={
                    y
                  }
                  stroke="#DCE7F0"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />
              );
            }
          )}

          <motion.path
            key={`area-${metric}-${series
              .map(
                (
                  item
                ) =>
                  item[
                    metric
                  ]
              )
              .join(
                "-"
              )}`}
            d={
              areaPath
            }
            fill={`url(#${gradientId})`}
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            transition={{
              duration:
                0.45,
            }}
          />

          <motion.path
            key={`line-${metric}-${series
              .map(
                (
                  item
                ) =>
                  item[
                    metric
                  ]
              )
              .join(
                "-"
              )}`}
            d={
              linePath
            }
            fill="none"
            stroke={
              color
            }
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{
              pathLength:
                0,
              opacity:
                0.3,
            }}
            animate={{
              pathLength:
                1,
              opacity:
                1,
            }}
            transition={{
              duration:
                0.8,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          />

          {points.map(
            (
              point,
              index
            ) => (
              <g
                key={`${point.label}-${index}`}
                onMouseEnter={() =>
                  setActiveIndex(
                    index
                  )
                }
                onClick={() =>
                  setActiveIndex(
                    index
                  )
                }
                className="cursor-pointer"
              >
                <circle
                  cx={
                    point.x
                  }
                  cy={
                    point.y
                  }
                  r={
                    activeIndex ===
                    index
                      ? 9
                      : 7
                  }
                  fill="#ffffff"
                  stroke={
                    color
                  }
                  strokeWidth={
                    activeIndex ===
                    index
                      ? 4
                      : 3
                  }
                />

                <circle
                  cx={
                    point.x
                  }
                  cy={
                    point.y
                  }
                  r="18"
                  fill="transparent"
                />

                <text
                  x={
                    point.x
                  }
                  y={
                    height -
                    13
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={
                    activeIndex ===
                    index
                      ? "#174A7A"
                      : "#94A3B8"
                  }
                >
                  {point.label}
                </text>
              </g>
            )
          )}
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-blue-500">
            Selected point
          </p>

          <motion.p
            key={`${metric}-${activeIndex}-${activeValue}`}
            initial={{
              opacity:
                0,
              y:
                4,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            className="mt-2 text-xl font-black text-[#102A43]"
          >
            {activeValue}
          </motion.p>

          <p className="mt-1 text-[9px] text-slate-500">
            {active.label}
          </p>
        </div>

        <ChartSideMetric
          icon={
            TrendingUp
          }
          label="Highest"
          value={
            metric ===
            "failures"
              ? `${Math.max(
                  ...values
                ).toFixed(
                  2
                )}%`
              : `৳${Math.max(
                  ...values
                ).toFixed(
                  2
                )}M`
          }
          tone="emerald"
        />

        <ChartSideMetric
          icon={
            Activity
          }
          label="Lowest"
          value={
            metric ===
            "failures"
              ? `${Math.min(
                  ...values
                ).toFixed(
                  2
                )}%`
              : `৳${Math.min(
                  ...values
                ).toFixed(
                  2
                )}M`
          }
          tone="blue"
        />

        <ChartSideMetric
          icon={
            Layers3
          }
          label="Points"
          value={`${series.length}`}
          tone="violet"
        />
      </div>
    </div>
  );
}

function buildSmoothPath(
  points:
    Array<{
      x:
        number;
      y:
        number;
    }>
) {
  if (
    points.length ===
    0
  ) {
    return "";
  }

  if (
    points.length ===
    1
  ) {
    return `M ${points[
      0
    ].x} ${points[
      0
    ].y}`;
  }

  let path =
    `M ${points[
      0
    ].x} ${points[
      0
    ].y}`;

  for (
    let index =
      0;
    index <
    points.length -
      1;
    index +=
      1
  ) {
    const current =
      points[
        index
      ];

    const next =
      points[
        index +
          1
      ];

    const controlX =
      (
        current.x +
        next.x
      ) /
      2;

    path +=
      ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function ChartSideMetric({
  icon:
    Icon,
  label,
  value,
  tone,
}: {
  icon:
    React.ElementType;
  label:
    string;
  value:
    string;
  tone:
    AnalyticsTone;
}) {
  const style =
    TONE[
      tone
    ];

  return (
    <div className="flex items-center justify-between rounded-[18px] border border-[#E3ECF3] bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${style.soft} ${style.text}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="text-[9px] font-bold text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-[10px] font-black text-[#174A7A]">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CHANNEL ECONOMICS
========================================================= */

function ChannelEconomics({
  items,
  totalCount,
}: {
  items:
    AnalyticsBreakdownItem[];
  totalCount:
    number;
}) {
  const normalized =
    items
      .filter(
        (
          item
        ) =>
          Number.isFinite(
            item.value
          ) &&
          item.value >
            0
      )
      .slice(
        0,
        6
      );

  return (
    <CardShell
      eyebrow="Transaction Mix"
      title="Channel Economics"
      description="Live channel contribution without hardcoded shares."
    >
      {normalized.length ===
      0 ? (
        <CompactEmpty
          message="No channel activity is available for this period."
        />
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
          <DonutChart
            items={
              normalized
            }
            centerTop={
              formatNumber(
                totalCount
              )
            }
            centerBottom="transactions"
          />

          <div className="space-y-2.5">
            {normalized.map(
              (
                item
              ) => {
                const tone =
                  TONE[
                    item.tone
                  ];

                return (
                  <div
                    key={
                      item.label
                    }
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-[#E5EDF4] bg-[#FAFCFE] px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            tone.dot,
                        }}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black text-[#174A7A]">
                          {item.label}
                        </p>

                        {item.helper && (
                          <p className="mt-0.5 truncate text-[8px] text-slate-400">
                            {item.helper}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-black ${tone.soft} ${tone.text}`}
                    >
                      {item.value.toFixed(
                        1
                      )}%
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function DonutChart({
  items,
  centerTop,
  centerBottom,
}: {
  items:
    AnalyticsBreakdownItem[];
  centerTop:
    string;
  centerBottom:
    string;
}) {
  const total =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Math.max(
          0,
          item.value
        ),
      0
    );

  let cumulative =
    0;

  return (
    <div className="relative mx-auto h-[150px] w-[150px]">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#E8EFF5"
          strokeWidth="13"
        />

        {items.map(
          (
            item,
            index
          ) => {
            const share =
              total >
              0
                ? (
                    item.value /
                    total
                  ) *
                  100
                : 0;

            const offset =
              -cumulative;

            cumulative +=
              share;

            return (
              <motion.circle
                key={
                  item.label
                }
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={
                  TONE[
                    item.tone
                  ].dot
                }
                strokeWidth="13"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${Math.max(
                  0,
                  share -
                    1.2
                )} ${100 -
                  Math.max(
                    0,
                    share -
                      1.2
                  )}`}
                strokeDashoffset={
                  offset
                }
                initial={{
                  opacity:
                    0,
                }}
                animate={{
                  opacity:
                    1,
                }}
                transition={{
                  duration:
                    0.35,
                  delay:
                    index *
                    0.08,
                }}
              />
            );
          }
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-black text-[#102A43]">
          {centerTop}
        </p>

        <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
          {centerBottom}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MONEY FLOW
========================================================= */

function MoneyFlowNetwork({
  overview,
  channels,
}: {
  overview:
    AnalyticsOverview;
  channels:
    AnalyticsBreakdownItem[];
}) {
  const positions = [
    {
      left:
        "12%",
      top:
        "28%",
    },
    {
      left:
        "73%",
      top:
        "22%",
    },
    {
      left:
        "76%",
      top:
        "68%",
    },
    {
      left:
        "14%",
      top:
        "72%",
    },
  ];

  const nodes =
    channels.slice(
      0,
      4
    );

  return (
    <CardShell
      eyebrow="Liquidity Movement"
      title="Money Flow Network"
      description="Channel shares around the current live transaction volume."
    >
      {nodes.length ===
      0 ? (
        <CompactEmpty
          message="No channel flow is available for this period."
        />
      ) : (
        <div className="relative mt-5 h-[340px] overflow-hidden rounded-[26px] border border-[#173D61] bg-[radial-gradient(circle_at_50%_45%,#184E78_0%,#103B61_36%,#0B2A48_100%)]">
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/10" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100/10" />

          <motion.div
            initial={{
              scale:
                0.92,
              opacity:
                0,
            }}
            whileInView={{
              scale:
                1,
              opacity:
                1,
            }}
            viewport={{
              once:
                true,
            }}
            transition={{
              duration:
                0.55,
            }}
            className="absolute left-1/2 top-1/2 z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-100/15 bg-white/[0.07] text-center shadow-2xl backdrop-blur"
          >
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100/55">
              Live Volume
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {formatMoney(
                overview.transactionVolume
              )}
            </p>

            <p className="mt-1 text-[8px] text-blue-100/45">
              selected window
            </p>
          </motion.div>

          {nodes.map(
            (
              node,
              index
            ) => {
              const position =
                positions[
                  index
                ];

              const tone =
                TONE[
                  node.tone
                ];

              return (
                <motion.div
                  key={
                    node.label
                  }
                  initial={{
                    opacity:
                      0,
                    scale:
                      0.9,
                  }}
                  whileInView={{
                    opacity:
                      1,
                    scale:
                      1,
                  }}
                  viewport={{
                    once:
                      true,
                  }}
                  transition={{
                    duration:
                      0.4,
                    delay:
                      index *
                      0.07,
                  }}
                  style={{
                    left:
                      position.left,
                    top:
                      position.top,
                  }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="min-w-[106px] rounded-[18px] border border-white/15 bg-white/95 px-3 py-3 text-center shadow-xl">
                    <span
                      className="mx-auto block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          tone.dot,
                      }}
                    />

                    <p className="mt-1.5 text-[8px] font-black text-slate-500">
                      {node.label}
                    </p>

                    <p
                      className={`mt-1 text-sm font-black ${tone.text}`}
                    >
                      {node.value.toFixed(
                        1
                      )}%
                    </p>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      )}
    </CardShell>
  );
}

/* =========================================================
   RISK
========================================================= */

function TransactionRiskMatrix({
  items,
  overview,
}: {
  items:
    AnalyticsRiskCell[];
  overview:
    AnalyticsOverview;
}) {
  const style:
    Record<
      AnalyticsRiskCell["severity"],
      string
    > = {
    Low:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    Moderate:
      "border-amber-200 bg-amber-50 text-amber-700",
    High:
      "border-rose-200 bg-rose-50 text-rose-700",
    Critical:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <CardShell
      eyebrow="Risk Intelligence"
      title="Transaction Risk Matrix"
      description="Live transaction counts and monetary exposure grouped by backend risk classification."
      dark
    >
      {items.length ===
      0 ? (
        <CompactEmpty
          dark
          message="No risk classifications are available for this period."
        />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {items.map(
              (
                item,
                index
              ) => (
                <motion.div
                  key={
                    item.label
                  }
                  initial={{
                    opacity:
                      0,
                    scale:
                      0.96,
                  }}
                  whileInView={{
                    opacity:
                      1,
                    scale:
                      1,
                  }}
                  viewport={{
                    once:
                      true,
                  }}
                  transition={{
                    duration:
                      0.35,
                    delay:
                      index *
                      0.05,
                  }}
                  className={`rounded-[20px] border p-4 ${style[item.severity]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em]">
                      {item.label}
                    </p>

                    <ShieldAlert className="h-4 w-4 opacity-45" />
                  </div>

                  <p className="mt-4 text-xl font-black">
                    {formatNumber(
                      item.count
                    )}
                  </p>

                  <p className="mt-1 text-[8px] font-semibold opacity-65">
                    {formatMoney(
                      item.amount
                    )} exposure
                  </p>
                </motion.div>
              )
            )}
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.055] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-blue-100/45">
                  High-risk exposure
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {formatMoney(
                    overview.highRiskExposure
                  )}
                </p>
              </div>

              <span className="rounded-full border border-rose-300/15 bg-rose-300/10 px-2.5 py-1 text-[8px] font-black text-rose-200">
                Live risk signal
              </span>
            </div>
          </div>
        </>
      )}
    </CardShell>
  );
}

/* =========================================================
   FAILURE INTELLIGENCE
========================================================= */

function FailureAnalytics({
  items,
  failedRate,
}: {
  items:
    AnalyticsBreakdownItem[];
  failedRate:
    number;
}) {
  const rows =
    items.filter(
      (
        item
      ) =>
        Number.isFinite(
          item.value
        )
    );

  const max =
    Math.max(
      ...rows.map(
        (
          item
        ) =>
          item.value
      ),
      1
    );

  return (
    <CardShell
      eyebrow="Operational Quality"
      title="Failure Intelligence"
      description="The live distribution of recorded failure reasons for the selected period."
      action={
        <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[8px] font-black text-rose-700">
          {failedRate.toFixed(
            2
          )}% failed
        </span>
      }
    >
      {rows.length ===
      0 ? (
        <CompactEmpty
          message="No failed transactions are available for this period."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map(
            (
              item,
              index
            ) => {
              const tone =
                TONE[
                  item.tone
                ];

              return (
                <motion.div
                  key={
                    item.label
                  }
                  initial={{
                    opacity:
                      0,
                    x:
                      -8,
                  }}
                  whileInView={{
                    opacity:
                      1,
                    x:
                      0,
                  }}
                  viewport={{
                    once:
                      true,
                  }}
                  transition={{
                    duration:
                      0.35,
                    delay:
                      index *
                      0.04,
                  }}
                  className="rounded-[18px] border border-[#E5EDF4] bg-[#FAFCFE] p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black text-[#174A7A]">
                        {item.label}
                      </p>

                      {item.helper && (
                        <p className="mt-0.5 text-[8px] text-slate-400">
                          {item.helper}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-black ${tone.soft} ${tone.text}`}
                    >
                      {item.value.toFixed(
                        1
                      )}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{
                        width:
                          0,
                      }}
                      whileInView={{
                        width:
                          `${safePercent(
                            (
                              item.value /
                              max
                            ) *
                              100
                          )}%`,
                      }}
                      viewport={{
                        once:
                          true,
                      }}
                      transition={{
                        duration:
                          0.65,
                        delay:
                          index *
                          0.04,
                      }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          tone.dot,
                      }}
                    />
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      )}
    </CardShell>
  );
}

/* =========================================================
   KYC COVERAGE
========================================================= */

function KycCoverage({
  overview,
}: {
  overview:
    AnalyticsOverview;
}) {
  const verified =
    safePercent(
      overview.kycCompletion
    );

  const remaining =
    Math.max(
      0,
      100 -
        verified
    );

  return (
    <CardShell
      eyebrow="Customer Verification"
      title="KYC Coverage"
      description="A live verification coverage view using the backend KYC completion metric—no hardcoded funnel stages."
    >
      <div className="mt-5 grid gap-5 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
        <RadialProgress
          value={
            verified
          }
          label="Verified"
          sublabel="eligible users"
        />

        <div className="space-y-3">
          <KycMetricRow
            icon={
              BadgeCheck
            }
            label="Verified coverage"
            value={`${verified.toFixed(
              1
            )}%`}
            tone="emerald"
          />

          <KycMetricRow
            icon={
              Users
            }
            label="Active users"
            value={
              formatNumber(
                overview.activeUsers
              )
            }
            tone="blue"
          />

          <KycMetricRow
            icon={
              AlertTriangle
            }
            label="Remaining unverified"
            value={`${remaining.toFixed(
              1
            )}%`}
            tone="amber"
          />

          <div className="rounded-[18px] border border-blue-100 bg-blue-50/65 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-500">
              Coverage signal
            </p>

            <p className="mt-1 text-[10px] font-black text-[#174A7A]">
              {verified >=
              90
                ? "Verification coverage is strong."
                : verified >=
                  75
                  ? "Coverage is healthy with room to improve."
                  : "KYC completion needs additional attention."}
            </p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function RadialProgress({
  value,
  label,
  sublabel,
}: {
  value:
    number;
  label:
    string;
  sublabel:
    string;
}) {
  const safe =
    safePercent(
      value
    );

  const radius =
    48;

  const circumference =
    2 *
    Math.PI *
    radius;

  const dash =
    circumference *
    (
      safe /
      100
    );

  return (
    <div className="relative mx-auto h-[180px] w-[180px]">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={
            radius
          }
          fill="none"
          stroke="#E8EFF5"
          strokeWidth="10"
        />

        <motion.circle
          cx="60"
          cy="60"
          r={
            radius
          }
          fill="none"
          stroke="#1F5EA8"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          initial={{
            strokeDashoffset:
              circumference,
          }}
          whileInView={{
            strokeDashoffset:
              0,
          }}
          viewport={{
            once:
              true,
          }}
          transition={{
            duration:
              0.9,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-black text-[#102A43]">
          {safe.toFixed(
            1
          )}%
        </p>

        <p className="mt-1 text-[9px] font-black text-[#174A7A]">
          {label}
        </p>

        <p className="text-[8px] text-slate-400">
          {sublabel}
        </p>
      </div>
    </div>
  );
}

function KycMetricRow({
  icon:
    Icon,
  label,
  value,
  tone,
}: {
  icon:
    React.ElementType;
  label:
    string;
  value:
    string;
  tone:
    AnalyticsTone;
}) {
  const style =
    TONE[
      tone
    ];

  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#E5EDF4] bg-[#FAFCFE] p-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.soft} ${style.text}`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="text-[9px] font-bold text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-[11px] font-black text-[#174A7A]">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   GEOGRAPHY
========================================================= */

function GeographicPerformance({
  items,
}: {
  items:
    AnalyticsBreakdownItem[];
}) {
  const rows =
    items
      .filter(
        (
          item
        ) =>
          Number.isFinite(
            item.value
          )
      )
      .slice(
        0,
        8
      );

  const max =
    Math.max(
      ...rows.map(
        (
          item
        ) =>
          item.value
      ),
      1
    );

  return (
    <CardShell
      eyebrow="Regional Intelligence"
      title="Geographic Performance"
      description="A compact ranking view that uses available live region data without leaving unused blank space."
      action={
        <MapPinned className="h-5 w-5 text-[#1F5EA8]" />
      }
    >
      {rows.length ===
      0 ? (
        <CompactEmpty
          message="No geographic analytics are available for this period."
        />
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {rows.map(
            (
              item,
              index
            ) => {
              const tone =
                TONE[
                  item.tone
                ];

              return (
                <motion.div
                  key={`${item.label}-${index}`}
                  initial={{
                    opacity:
                      0,
                    y:
                      8,
                  }}
                  whileInView={{
                    opacity:
                      1,
                    y:
                      0,
                  }}
                  viewport={{
                    once:
                      true,
                  }}
                  transition={{
                    duration:
                      0.35,
                    delay:
                      index *
                      0.035,
                  }}
                  className="rounded-[20px] border border-[#E3ECF3] bg-[#FAFCFE] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black text-[#174A7A]">
                        {item.label}
                      </p>

                      {item.helper && (
                        <p className="mt-0.5 truncate text-[8px] text-slate-400">
                          {item.helper}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-black ${tone.soft} ${tone.text}`}
                    >
                      {item.value.toFixed(
                        1
                      )}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{
                        width:
                          0,
                      }}
                      whileInView={{
                        width:
                          `${safePercent(
                            (
                              item.value /
                              max
                            ) *
                              100
                          )}%`,
                      }}
                      viewport={{
                        once:
                          true,
                      }}
                      transition={{
                        duration:
                          0.65,
                        delay:
                          index *
                          0.035,
                      }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          tone.dot,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-slate-400">
                      Rank #{index +
                      1}
                    </span>

                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          tone.dot,
                      }}
                    />
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      )}
    </CardShell>
  );
}

/* =========================================================
   REVENUE QUALITY
========================================================= */

function RevenueQuality({
  overview,
}: {
  overview:
    AnalyticsOverview;
}) {
  const revenuePerTxn =
    overview.transactionCount >
    0
      ? overview.platformRevenue /
        overview.transactionCount
      : 0;

  const metrics = [
    {
      label:
        "Revenue / Txn",
      value:
        formatMoney(
          revenuePerTxn,
          false
        ),
      tone:
        "emerald" as const,
      icon:
        CircleDollarSign,
    },
    {
      label:
        "Merchant Share",
      value:
        `${overview.merchantShare.toFixed(
          1
        )}%`,
      tone:
        "violet" as const,
      icon:
        Layers3,
    },
    {
      label:
        "Dispute Rate",
      value:
        `${overview.disputeRate.toFixed(
          2
        )}%`,
      tone:
        "rose" as const,
      icon:
        ShieldAlert,
    },
    {
      label:
        "Retention",
      value:
        `${overview.retentionRate.toFixed(
          1
        )}%`,
      tone:
        "blue" as const,
      icon:
        Users,
    },
  ];

  return (
    <CardShell
      eyebrow="Unit Economics"
      title="Revenue Quality"
      description="Live unit-economics indicators derived from the selected analytics window."
    >
      <div className="mt-5 grid grid-cols-2 gap-3">
        {metrics.map(
          (
            item,
            index
          ) => {
            const style =
              TONE[
                item.tone
              ];

            const Icon =
              item.icon;

            return (
              <motion.div
                key={
                  item.label
                }
                initial={{
                  opacity:
                    0,
                  scale:
                    0.97,
                }}
                whileInView={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                viewport={{
                  once:
                    true,
                }}
                transition={{
                  duration:
                    0.35,
                  delay:
                    index *
                    0.05,
                }}
                className={`rounded-[20px] border p-4 ${style.border} ${style.soft}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                    {item.label}
                  </p>

                  <Icon
                    className={`h-4 w-4 ${style.text}`}
                  />
                </div>

                <p
                  className={`mt-3 text-xl font-black ${style.text}`}
                >
                  {item.value}
                </p>
              </motion.div>
            );
          }
        )}
      </div>

      <div className="mt-4 rounded-[20px] border border-[#DCE7F0] bg-[#F8FBFD] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1F5EA8]" />

          <div>
            <p className="text-[9px] font-black text-[#174A7A]">
              Live economics snapshot
            </p>

            <p className="mt-1 text-[9px] leading-4 text-slate-500">
              These values are read from the current analytics response rather than local demo calculations.
            </p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/* =========================================================
   ALERTS + INSIGHTS
========================================================= */

function OperationalAlerts({
  alerts,
}: {
  alerts:
    AnalyticsAlert[];
}) {
  const [
    hidden,
    setHidden,
  ] =
    useState<
      string[]
    >(
      []
    );

  const visible =
    alerts.filter(
      (
        item
      ) =>
        !hidden.includes(
          item.id
        )
    );

  return (
    <CardShell
      eyebrow="Attention Required"
      title="Operational Alerts"
      description="Backend-generated exception signals for the current window."
      action={
        <BellRing className="h-5 w-5 text-rose-500" />
      }
    >
      <div className="mt-5 space-y-3">
        {visible.length ===
        0 ? (
          <CompactEmpty
            message="No active analytics alerts are visible."
          />
        ) : (
          visible.map(
            (
              alert,
              index
            ) => (
              <AlertCard
                key={
                  alert.id
                }
                alert={
                  alert
                }
                index={
                  index
                }
                onDismiss={() =>
                  setHidden(
                    (
                      current
                    ) => [
                      ...current,
                      alert.id,
                    ]
                  )
                }
              />
            )
          )
        )}
      </div>
    </CardShell>
  );
}

function AlertCard({
  alert,
  index,
  onDismiss,
}: {
  alert:
    AnalyticsAlert;
  index:
    number;
  onDismiss:
    () => void;
}) {
  const className =
    alert.level ===
    "critical"
      ? "border-rose-100 bg-rose-50/75 text-rose-700"
      : alert.level ===
        "warning"
        ? "border-amber-100 bg-amber-50/75 text-amber-700"
        : "border-blue-100 bg-blue-50/75 text-blue-700";

  return (
    <motion.div
      initial={{
        opacity:
          0,
        x:
          -8,
      }}
      whileInView={{
        opacity:
          1,
        x:
          0,
      }}
      viewport={{
        once:
          true,
      }}
      transition={{
        duration:
          0.35,
        delay:
          index *
          0.04,
      }}
      className={`rounded-[20px] border p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black">
            {alert.title}
          </p>

          <p className="mt-1 text-[9px] leading-4 opacity-75">
            {alert.description}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-current/10 bg-white/55 px-2 py-1 text-[8px] font-black">
          {alert.metric}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-[8px] font-black">
          {alert.action}
          <ArrowRight className="h-3 w-3" />
        </span>

        <button
          type="button"
          onClick={
            onDismiss
          }
          className="text-[8px] font-black opacity-50 transition hover:opacity-100"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

function InsightCenter({
  insights,
}: {
  insights:
    AnalyticsInsight[];
}) {
  return (
    <CardShell
      eyebrow="Decision Support"
      title="Analytics Insight Center"
      description="Explainable backend insights based on the selected operating window."
      action={
        <Sparkles className="h-5 w-5 text-violet-500" />
      }
    >
      {insights.length ===
      0 ? (
        <CompactEmpty
          message="No analytics insights are available for this period."
        />
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {insights.map(
            (
              insight,
              index
            ) => {
              const style =
                TONE[
                  insight.tone
                ];

              return (
                <motion.div
                  key={`${insight.title}-${index}`}
                  initial={{
                    opacity:
                      0,
                    y:
                      8,
                  }}
                  whileInView={{
                    opacity:
                      1,
                    y:
                      0,
                  }}
                  viewport={{
                    once:
                      true,
                  }}
                  transition={{
                    duration:
                      0.35,
                    delay:
                      index *
                      0.04,
                  }}
                  className="rounded-[20px] border border-[#E3ECF3] bg-[#FAFCFE] p-4"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.soft} ${style.text}`}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <h4 className="mt-3 text-[10px] font-black text-[#102A43]">
                    {insight.title}
                  </h4>

                  <p className="mt-1 text-[9px] leading-4 text-slate-500">
                    {insight.body}
                  </p>

                  <p
                    className={`mt-3 text-[8px] font-black ${style.text}`}
                  >
                    {insight.impact}
                  </p>
                </motion.div>
              );
            }
          )}
        </div>
      )}
    </CardShell>
  );
}

/* =========================================================
   CARD SHELL
========================================================= */

function CardShell({
  eyebrow,
  title,
  description,
  action,
  dark =
    false,
  children,
}: {
  eyebrow:
    string;
  title:
    string;
  description:
    string;
  action?:
    React.ReactNode;
  dark?:
    boolean;
  children:
    React.ReactNode;
}) {
  return (
    <section
      className={`h-full rounded-[28px] border p-5 shadow-[0_12px_40px_rgba(15,39,69,0.05)] md:p-6 ${
        dark
          ? "border-[#173D61] bg-[linear-gradient(135deg,#0B2A48_0%,#103B61_50%,#175378_100%)] text-white"
          : "border-[#DCE7F0] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-[8px] font-black uppercase tracking-[0.16em] ${
              dark
                ? "text-cyan-100/50"
                : "text-[#5B8BB7]"
            }`}
          >
            {eyebrow}
          </p>

          <h3
            className={`mt-1 text-lg font-black ${
              dark
                ? "text-white"
                : "text-[#102A43]"
            }`}
          >
            {title}
          </h3>

          <p
            className={`mt-1 max-w-2xl text-[10px] leading-5 ${
              dark
                ? "text-blue-100/45"
                : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   LOADING / EMPTY
========================================================= */

function AnalyticsSkeleton() {
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
        <SkeletonBlock className="h-[260px]" />
        <SkeletonBlock className="h-[260px]" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length:
            8,
        }).map(
          (
            _,
            index
          ) => (
            <SkeletonBlock
              key={
                index
              }
              className="h-[150px]"
            />
          )
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-[410px]" />
        <SkeletonBlock className="h-[410px]" />
      </div>
    </div>
  );
}

function SkeletonBlock({
  className,
}: {
  className:
    string;
}) {
  return (
    <div
      className={`animate-pulse rounded-[28px] border border-[#E2EAF1] bg-white ${className}`}
    >
      <div className="h-full w-full rounded-[28px] bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50" />
    </div>
  );
}

function EmptyAnalyticsState({
  onRetry,
}: {
  onRetry:
    () => void;
}) {
  return (
    <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-[30px] border border-dashed border-[#C9D9E6] bg-white p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1F5EA8]">
          <Activity className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-lg font-black text-[#102A43]">
          No live analytics loaded
        </h2>

        <p className="mt-2 text-xs leading-6 text-slate-500">
          The page no longer falls back to static demo data. Restore the authenticated analytics API connection and retry.
        </p>

        <button
          type="button"
          onClick={
            onRetry
          }
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1F5EA8] px-4 py-2.5 text-[10px] font-black text-white"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry live API
        </button>
      </div>
    </div>
  );
}

function CompactEmpty({
  message,
  dark =
    false,
}: {
  message:
    string;
  dark?:
    boolean;
}) {
  return (
    <div
      className={`mt-5 rounded-[20px] border border-dashed p-5 text-center text-[10px] ${
        dark
          ? "border-white/10 bg-white/[0.04] text-blue-100/45"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {message}
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
      No trend points are available for this period.
    </div>
  );
}

/* =========================================================
   STORY MODE
========================================================= */

function StoryMode({
  dashboard,
  onClose,
}: {
  dashboard:
    AnalyticsDashboardData;
  onClose:
    () => void;
}) {
  const [
    slide,
    setSlide,
  ] =
    useState(
      0
    );

  const slides = [
    {
      eyebrow:
        "Executive Story",
      title:
        `${formatMoney(
          dashboard.overview.transactionVolume
        )} moved through the platform`,
      body:
        `${formatNumber(
          dashboard.overview.transactionCount
        )} completed transactions generated ${formatMoney(
          dashboard.overview.platformRevenue
        )} in platform revenue during the selected period.`,
      stat:
        `${dashboard.overview.failedRate.toFixed(
          2
        )}% failure rate`,
      icon:
        CircleDollarSign,
    },
    {
      eyebrow:
        "Customer Story",
      title:
        `${dashboard.overview.kycCompletion.toFixed(
          1
        )}% KYC completion`,
      body:
        `${formatNumber(
          dashboard.overview.activeUsers
        )} active users are visible in the selected window with ${dashboard.overview.retentionRate.toFixed(
          1
        )}% retention.`,
      stat:
        `${dashboard.overview.retentionRate.toFixed(
          1
        )}% retained`,
      icon:
        Users,
    },
    {
      eyebrow:
        "Risk Story",
      title:
        `${formatMoney(
          dashboard.overview.highRiskExposure
        )} under high-risk monitoring`,
      body:
        `The current risk matrix and dispute signals are generated from the live backend analytics response.`,
      stat:
        `${dashboard.overview.disputeRate.toFixed(
          2
        )}% dispute rate`,
      icon:
        ShieldAlert,
    },
  ];

  const current =
    slides[
      slide
    ];

  const Icon =
    current.icon;

  return (
    <ModalBackdrop
      onClose={
        onClose
      }
    >
      <motion.div
        initial={{
          opacity:
            0,
          scale:
            0.96,
          y:
            16,
        }}
        animate={{
          opacity:
            1,
          scale:
            1,
          y:
            0,
        }}
        exit={{
          opacity:
            0,
          scale:
            0.97,
          y:
            12,
        }}
        transition={{
          type:
            "spring",
          stiffness:
            260,
          damping:
            26,
        }}
        className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#173D61] bg-[linear-gradient(135deg,#0B2A48_0%,#103B61_52%,#175378_100%)] p-6 text-white shadow-2xl md:p-8"
      >
        <button
          type="button"
          onClick={
            onClose
          }
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex min-h-[420px] flex-col justify-between">
          <AnimatePresence
            mode="wait"
          >
            <motion.div
              key={
                slide
              }
              initial={{
                opacity:
                  0,
                x:
                  24,
              }}
              animate={{
                opacity:
                  1,
                x:
                  0,
              }}
              exit={{
                opacity:
                  0,
                x:
                  -24,
              }}
              transition={{
                duration:
                  0.35,
              }}
              className="max-w-2xl pt-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/10 bg-white/[0.07] text-cyan-200">
                <Icon className="h-6 w-6" />
              </div>

              <p className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/50">
                {current.eyebrow}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                {current.title}
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100/65">
                {current.body}
              </p>

              <span className="mt-6 inline-flex rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-black text-emerald-200">
                {current.stat}
              </span>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {slides.map(
                (
                  _,
                  index
                ) => (
                  <button
                    type="button"
                    key={
                      index
                    }
                    onClick={() =>
                      setSlide(
                        index
                      )
                    }
                    className={`h-2 rounded-full transition ${
                      slide ===
                      index
                        ? "w-8 bg-cyan-300"
                        : "w-2 bg-white/20"
                    }`}
                  />
                )
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  slide ===
                  0
                }
                onClick={() =>
                  setSlide(
                    (
                      value
                    ) =>
                      Math.max(
                        0,
                        value -
                          1
                      )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={
                  slide ===
                  slides.length -
                    1
                }
                onClick={() =>
                  setSlide(
                    (
                      value
                    ) =>
                      Math.min(
                        slides.length -
                          1,
                        value +
                          1
                      )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-[#0B2A48] disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}

/* =========================================================
   REPORT MODAL
========================================================= */

function ReportModal({
  dashboard,
  range,
  onClose,
}: {
  dashboard:
    AnalyticsDashboardData;
  range:
    AnalyticsRange;
  onClose:
    () => void;
}) {
  const [
    format,
    setFormat,
  ] =
    useState<
      | "summary"
      | "executive"
      | "risk"
    >(
      "executive"
    );

  const [
    generating,
    setGenerating,
  ] =
    useState(
      false
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );

  const generate =
    async () => {
      setGenerating(
        true
      );

      setMessage(
        ""
      );

      try {
        const response =
          await analyticsApi.generateReport({
            range,
            format,
          });

        setMessage(
          `Report ${response.report.status}. ID: ${response.report.id}`
        );
      } catch (
        error
      ) {
        setMessage(
          error instanceof
            Error
            ? error.message
            : "Unable to generate the report."
        );
      } finally {
        setGenerating(
          false
        );
      }
    };

  return (
    <ModalBackdrop
      onClose={
        onClose
      }
    >
      <motion.div
        initial={{
          opacity:
            0,
          scale:
            0.96,
          y:
            14,
        }}
        animate={{
          opacity:
            1,
          scale:
            1,
          y:
            0,
        }}
        exit={{
          opacity:
            0,
          scale:
            0.97,
          y:
            10,
        }}
        transition={{
          type:
            "spring",
          stiffness:
            280,
          damping:
            28,
        }}
        className="w-full max-w-xl rounded-[30px] border border-[#DCE7F0] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#5B8BB7]">
              Analytics Reporting
            </p>

            <h2 className="mt-1 text-xl font-black text-[#102A43]">
              Generate Admin Report
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Generate a backend report snapshot for the current {range} window.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {(
            [
              "summary",
              "executive",
              "risk",
            ] as const
          ).map(
            (
              item
            ) => (
              <button
                type="button"
                key={
                  item
                }
                onClick={() =>
                  setFormat(
                    item
                  )
                }
                className={`rounded-2xl border p-3 text-[9px] font-black capitalize transition ${
                  format ===
                  item
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric
            label="Volume"
            value={
              formatMoney(
                dashboard.overview.transactionVolume
              )
            }
          />

          <MiniMetric
            label="Revenue"
            value={
              formatMoney(
                dashboard.overview.platformRevenue
              )
            }
          />

          <MiniMetric
            label="Risk"
            value={
              formatMoney(
                dashboard.overview.highRiskExposure
              )
            }
          />
        </div>

        {message && (
          <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-3 text-[9px] leading-5 text-blue-700">
            {message}
          </div>
        )}

        <button
          type="button"
          disabled={
            generating
          }
          onClick={() =>
            void generate()
          }
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1F5EA8] text-[10px] font-black text-white transition hover:bg-[#174A7A] disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}

          Generate Report
        </button>
      </motion.div>
    </ModalBackdrop>
  );
}

/* =========================================================
   METRIC MODAL
========================================================= */

function MetricDetailsModal({
  item,
  range,
  onClose,
}: {
  item: {
    label:
      string;
    value:
      string;
    helper:
      string;
    icon:
      React.ElementType;
    tone:
      AnalyticsTone;
  };
  range:
    AnalyticsRange;
  onClose:
    () => void;
}) {
  const Icon =
    item.icon;

  const style =
    TONE[
      item.tone
    ];

  return (
    <ModalBackdrop
      onClose={
        onClose
      }
    >
      <motion.div
        initial={{
          opacity:
            0,
          scale:
            0.95,
          y:
            14,
        }}
        animate={{
          opacity:
            1,
          scale:
            1,
          y:
            0,
        }}
        exit={{
          opacity:
            0,
          scale:
            0.97,
          y:
            10,
        }}
        transition={{
          type:
            "spring",
          stiffness:
            300,
          damping:
            28,
        }}
        className="w-full max-w-md rounded-[30px] border border-[#DCE7F0] bg-white p-6 shadow-[0_26px_80px_rgba(7,27,48,0.24)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${style.border} ${style.soft} ${style.text}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#5B8BB7]">
                {range} Metric
              </p>

              <h2 className="mt-1 text-lg font-black text-[#102A43]">
                {item.label}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-[22px] border border-blue-100 bg-[linear-gradient(135deg,#EFF7FF_0%,#FFFFFF_100%)] p-5">
          <motion.p
            key={
              item.value
            }
            initial={{
              opacity:
                0,
              y:
                5,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            className="text-3xl font-black text-[#102A43]"
          >
            {item.value}
          </motion.p>

          <p className="mt-2 text-[10px] leading-5 text-slate-500">
            {item.helper}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

          <p className="text-[9px] leading-5 text-emerald-800/75">
            This value is coming from the live analytics response. No local demo value is used in this modal.
          </p>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}

/* =========================================================
   MODAL BACKDROP
========================================================= */

function ModalBackdrop({
  children,
  onClose,
}: {
  children:
    React.ReactNode;
  onClose:
    () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity:
          0,
      }}
      animate={{
        opacity:
          1,
      }}
      exit={{
        opacity:
          0,
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#071B30]/58 p-4 backdrop-blur-[5px]"
      onMouseDown={
        onClose
      }
    >
      <div
        className="flex min-h-full w-full items-center justify-center py-4"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </motion.div>
  );
}
