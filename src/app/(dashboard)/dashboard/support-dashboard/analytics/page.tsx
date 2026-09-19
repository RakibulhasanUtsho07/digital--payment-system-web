"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Star,
  Ticket,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  supportDashboardApi,
  type SupportAnalytics,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   CONSTANTS
========================================================= */

const RANGE_OPTIONS = [
  7,
  30,
  90,
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatPercent(
  value: number
) {
  return `${value.toFixed(
    1
  )}%`;
}

function formatDateLabel(
  value: string
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
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportAnalyticsPage() {
  const [
    days,
    setDays,
  ] =
    useState<
      (typeof RANGE_OPTIONS)[number]
    >(30);

  const [
    analytics,
    setAnalytics,
  ] =
    useState<
      SupportAnalytics | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  const loadAnalytics =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getAnalytics(
              days
            );

          if (
            !response.success ||
            !response.analytics
          ) {
            throw new Error(
              "Failed to load support analytics."
            );
          }

          setAnalytics(
            response.analytics
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load support analytics."
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [days]
    );

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  /* =======================================================
     DAILY CHART DATA
  ======================================================= */

  const dailyData =
    useMemo(() => {
      if (!analytics) {
        return [];
      }

      const map =
        new Map<
          string,
          {
            date: string;
            tickets: number;
            resolved: number;
          }
        >();

      for (
        const item of
        analytics.dailyTickets
      ) {
        map.set(
          item.date,
          {
            date:
              item.date,

            tickets:
              item.count,

            resolved: 0,
          }
        );
      }

      for (
        const item of
        analytics.dailyResolved
      ) {
        const current =
          map.get(
            item.date
          ) ?? {
            date:
              item.date,

            tickets: 0,

            resolved: 0,
          };

        current.resolved =
          item.count;

        map.set(
          item.date,
          current
        );
      }

      return Array.from(
        map.values()
      )
        .sort(
          (
            a,
            b
          ) =>
            a.date.localeCompare(
              b.date
            )
        )
        .map(
          (item) => ({
            ...item,

            label:
              formatDateLabel(
                item.date
              ),
          })
        );
    }, [analytics]);

  const statusColors = [
    "#10b981",
    "#0ea5e9",
    "#f59e0b",
    "#f43f5e",
    "#64748b",
  ];

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6FBF8]">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />

          <p className="mt-3 text-[11px] font-black text-slate-700">
            Loading support
            analytics…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_14px_45px_rgba(16,185,129,0.06)] md:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  Support
                  Intelligence
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                  Analytics
                </h1>

                <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">
                  Operational
                  ticket trends,
                  SLA pressure,
                  escalation rate
                  and customer
                  support
                  performance.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {RANGE_OPTIONS.map(
                (
                  value
                ) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setDays(
                        value
                      )
                    }
                    className={`h-10 rounded-xl px-3 text-[9px] font-black transition ${
                      days ===
                      value
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    {value}{" "}
                    days
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  void loadAnalytics(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* =================================================
            ANALYTICS CONTENT
        ================================================= */}

        {analytics && (
          <>
            {/* =============================================
                METRICS
            ============================================== */}

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <MetricCard
                icon={Ticket}
                label="Total tickets"
                value={analytics.summary.totalTickets.toLocaleString()}
              />

              <MetricCard
                icon={
                  CheckCircle2
                }
                label="Resolved"
                value={analytics.summary.resolvedTickets.toLocaleString()}
                tone="emerald"
              />

              <MetricCard
                icon={Clock3}
                label="Open"
                value={analytics.summary.openTickets.toLocaleString()}
                tone="sky"
              />

              <MetricCard
                icon={
                  ShieldAlert
                }
                label="Escalated"
                value={analytics.summary.escalatedTickets.toLocaleString()}
                tone="rose"
              />

              <MetricCard
                icon={
                  AlertTriangle
                }
                label="Breached"
                value={analytics.summary.breachedTickets.toLocaleString()}
                tone="amber"
              />

              <MetricCard
                icon={Gauge}
                label="Resolution rate"
                value={formatPercent(
                  analytics.summary.resolutionRate
                )}
                tone="violet"
              />

              <MetricCard
                icon={Star}
                label="CSAT"
                value={
                  analytics.summary.csat ===
                  null
                    ? "—"
                    : analytics.summary.csat.toFixed(
                        1
                      )
                }
                helper={`${analytics.summary.csatResponses} responses`}
                tone="emerald"
              />
            </section>

            {/* =============================================
                TOP CHARTS
            ============================================== */}

            <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
              {/* DAILY MOVEMENT */}

              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <ChartHeader
                  icon={
                    Activity
                  }
                  eyebrow="Daily movement"
                  title="Ticket volume & resolutions"
                  description="New support tickets compared with resolved tickets over the selected period."
                />

                <div className="h-[340px] p-4 pt-2">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        dailyData
                      }
                      margin={{
                        top: 16,
                        right: 10,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#e2e8f0"
                        strokeDasharray="4 6"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                        }}
                        minTickGap={
                          20
                        }
                      />

                      <YAxis
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        allowDecimals={
                          false
                        }
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius:
                            14,

                          border:
                            "1px solid #d1fae5",

                          fontSize:
                            10,

                          boxShadow:
                            "0 16px 36px rgba(15,23,42,.10)",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="tickets"
                        name="New tickets"
                        stroke="#10b981"
                        strokeWidth={
                          3
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 5,
                        }}
                        animationDuration={
                          1100
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="#0ea5e9"
                        strokeWidth={
                          2.5
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 5,
                        }}
                        animationDuration={
                          1300
                        }
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              {/* STATUS DISTRIBUTION */}

              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <ChartHeader
                  icon={Gauge}
                  eyebrow="Status mix"
                  title="Current distribution"
                  description="Ticket status distribution for the selected reporting period."
                />

                <div className="relative h-[340px] p-4">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          borderRadius:
                            14,

                          border:
                            "1px solid #d1fae5",

                          fontSize:
                            10,
                        }}
                      />

                      <Pie
                        data={
                          analytics.statusBreakdown
                        }
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius="48%"
                        outerRadius="78%"
                        paddingAngle={
                          3
                        }
                        stroke="#fff"
                        strokeWidth={
                          3
                        }
                        animationDuration={
                          1100
                        }
                      >
                        {analytics.statusBreakdown.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={
                                entry.status
                              }
                              fill={
                                statusColors[
                                  index %
                                    statusColors.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-900">
                        {
                          analytics.summary.totalTickets
                        }
                      </p>

                      <p className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Tickets
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            {/* =============================================
                SECONDARY ANALYTICS
            ============================================== */}

            <section className="grid gap-4 xl:grid-cols-2">
              {/* CATEGORY BREAKDOWN */}

              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <ChartHeader
                  icon={
                    BarChart3
                  }
                  eyebrow="Demand drivers"
                  title="Category breakdown"
                  description="Which support areas generated the most tickets."
                />

                <div className="h-[320px] p-4 pt-2">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        analytics.categoryBreakdown
                      }
                      margin={{
                        top: 16,
                        right: 8,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#e2e8f0"
                        strokeDasharray="4 6"
                      />

                      <XAxis
                        dataKey="category"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                        }}
                      />

                      <YAxis
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        allowDecimals={
                          false
                        }
                        tick={{
                          fontSize: 9,
                          fill: "#64748b",
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius:
                            14,

                          border:
                            "1px solid #d1fae5",

                          fontSize:
                            10,
                        }}
                      />

                      <Bar
                        dataKey="count"
                        name="Tickets"
                        fill="#10b981"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                        animationDuration={
                          1100
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              {/* ACTIVITY BREAKDOWN */}

              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <ChartHeader
                  icon={
                    Activity
                  }
                  eyebrow="Operational actions"
                  title="Activity breakdown"
                  description="Ticket activity generated by support operations during the period."
                />

                <div className="grid gap-2 p-5">
                  {analytics
                    .activityBreakdown
                    .length ===
                  0 ? (
                    <p className="py-12 text-center text-[10px] text-slate-400">
                      No activity
                      recorded for
                      this period.
                    </p>
                  ) : (
                    analytics.activityBreakdown
                      .slice(
                        0,
                        10
                      )
                      .map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.eventType
                            }
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                          >
                            <span className="text-[9px] font-black text-slate-600">
                              {item.eventType.replaceAll(
                                "_",
                                " "
                              )}
                            </span>

                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                              {
                                item.count
                              }
                            </span>
                          </div>
                        )
                      )
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "slate",
}: {
  icon: ElementType;
  label: string;
  value: string;
  helper?: string;

  tone?:
    | "slate"
    | "emerald"
    | "sky"
    | "rose"
    | "amber"
    | "violet";
}) {
  const tones = {
    slate:
      "bg-slate-50 text-slate-600 border-slate-100",

    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    sky:
      "bg-sky-50 text-sky-600 border-sky-100",

    rose:
      "bg-rose-50 text-rose-600 border-rose-100",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100",

    violet:
      "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <motion.article
      whileHover={{
        y: -3,
      }}
      className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-[7px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-[8px] font-semibold text-slate-400">
          {helper}
        </p>
      )}
    </motion.article>
  );
}

/* =========================================================
   CHART HEADER
========================================================= */

function ChartHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-emerald-100 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Icon className="h-4 w-4" />
      </span>

      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-500">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-sm font-black text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-[9px] leading-4 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}