"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
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

const RANGE_OPTIONS = [7, 30, 90] as const;

type AnalyticsRange = (typeof RANGE_OPTIONS)[number];

const STATUS_CHART_COLORS = [
  "#D1FAE5",
  "#67E8F9",
  "#FDE68A",
  "#FDA4AF",
  "#A7F3D0",
  "#C4B5FD",
];

const HERO_PARTICLES = [
  { left: "7%", top: "20%", size: 4, delay: 0.2, duration: 7.8 },
  { left: "18%", top: "72%", size: 3, delay: 1.1, duration: 8.7 },
  { left: "31%", top: "17%", size: 5, delay: 0.7, duration: 9.7 },
  { left: "44%", top: "76%", size: 4, delay: 2.1, duration: 8.1 },
  { left: "58%", top: "28%", size: 3, delay: 1.5, duration: 7.6 },
  { left: "72%", top: "66%", size: 5, delay: 0.5, duration: 10.2 },
  { left: "84%", top: "23%", size: 3, delay: 2.4, duration: 8.6 },
  { left: "93%", top: "72%", size: 4, delay: 1.7, duration: 9.2 },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatNumber(value: number) {
  return value.toLocaleString("en-BD");
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportAnalyticsPage() {
  const [days, setDays] = useState<AnalyticsRange>(30);
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await supportDashboardApi.getAnalytics(days);

        if (
          !response.success ||
          !response.analytics
        ) {
          throw new Error(
            "Failed to load support analytics."
          );
        }

        setAnalytics(response.analytics);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load support analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
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

  const dailyData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    const map = new Map<
      string,
      {
        date: string;
        tickets: number;
        resolved: number;
      }
    >();

    for (const item of analytics.dailyTickets) {
      map.set(item.date, {
        date: item.date,
        tickets: item.count,
        resolved: 0,
      });
    }

    for (const item of analytics.dailyResolved) {
      const current =
        map.get(item.date) ?? {
          date: item.date,
          tickets: 0,
          resolved: 0,
        };

      current.resolved = item.count;

      map.set(item.date, current);
    }

    return Array.from(map.values())
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      .map((item) => ({
        ...item,
        label: formatDateLabel(item.date),
      }));
  }, [analytics]);

  const statusData =
    useMemo(
      () =>
        analytics?.statusBreakdown.filter(
          (item) => item.count > 0
        ) ?? [],
      [analytics]
    );

  const priorityData =
    useMemo(
      () =>
        analytics?.priorityBreakdown.map(
          (item) => ({
            name: item.priority,
            count: item.count,
          })
        ) ?? [],
      [analytics]
    );

  const categoryData =
    useMemo(
      () =>
        analytics?.categoryBreakdown
          .map((item) => ({
            name: item.category,
            count: item.count,
          }))
          .sort(
            (a, b) =>
              b.count - a.count
          ) ?? [],
      [analytics]
    );

  const activityData =
    useMemo(
      () =>
        analytics?.activityBreakdown
          .map((item) => ({
            name: item.eventType.replaceAll(
              "_",
              " "
            ),
            count: item.count,
          }))
          .sort(
            (a, b) =>
              b.count - a.count
          ) ?? [],
      [analytics]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading && !analytics) {
    return (
      <main className="support-analytics-page flex min-h-[70vh] items-center justify-center bg-transparent">
        <style>{`
          .support-analytics-page,
          .support-analytics-page * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .support-analytics-page::-webkit-scrollbar,
          .support-analytics-page *::-webkit-scrollbar {
            width: 0 !important;
            height: 0 !important;
            display: none !important;
          }
        `}</style>

        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
            />

            <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
          </div>

          <p className="mt-4 text-sm font-black text-foreground">
            Loading support analytics
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Reading operational support intelligence…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="support-analytics-page bg-transparent pb-8 text-foreground">
      <style>{`
        .support-analytics-page,
        .support-analytics-page * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .support-analytics-page::-webkit-scrollbar,
        .support-analytics-page *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/25 bg-[linear-gradient(135deg,#10B981_0%,#059669_48%,#047857_100%)] p-5 text-white shadow-[0_28px_80px_-38px_rgba(5,150,105,.70)] sm:p-6 md:p-7 lg:p-8"
        >
          <motion.div
            aria-hidden
            animate={{
              x: [0, 36, -14, 0],
              y: [0, -18, 12, 0],
              scale: [1, 1.14, 0.96, 1],
              opacity: [0.42, 0.72, 0.48, 0.42],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-emerald-200/30 blur-[95px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, -26, 18, 0],
              y: [0, 20, -10, 0],
              scale: [1, 1.1, 0.97, 1],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-36 left-[18%] h-80 w-80 rounded-full bg-cyan-200/20 blur-[105px]"
          />

          <motion.div
            aria-hidden
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute right-[16%] top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-dashed border-white/20 xl:block"
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.85)]" />
          </motion.div>

          <motion.div
            aria-hidden
            animate={{
              x: ["-25%", "125%"],
              opacity: [0, 0.35, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatDelay: 1.4,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />

          {HERO_PARTICLES.map(
            (particle, index) => (
              <motion.span
                key={`${particle.left}-${particle.top}-${index}`}
                aria-hidden
                className="pointer-events-none absolute rounded-full bg-emerald-50 shadow-[0_0_14px_rgba(236,253,245,.85)]"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  y: [0, -14, 6, 0],
                  x: [0, 7, -4, 0],
                  opacity: [0.2, 0.9, 0.4, 0.2],
                  scale: [0.8, 1.25, 0.95, 0.8],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )
          )}

          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-50 backdrop-blur">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Support Analytics
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Operational intelligence
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.035em] sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                See support performance, pressure and demand in one place
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
                Follow ticket volume, resolution performance, SLA pressure,
                escalation patterns, customer satisfaction and operational
                activity using the existing analytics backend.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill
                  icon={Ticket}
                  label={`${formatNumber(
                    analytics?.summary.totalTickets ?? 0
                  )} tickets`}
                />

                <HeroPill
                  icon={Gauge}
                  label={`${
                    analytics
                      ? formatPercent(
                          analytics.summary.resolutionRate
                        )
                      : "0.0%"
                  } resolution`}
                />

                <HeroPill
                  icon={Star}
                  label={`${
                    analytics?.summary.csat === null ||
                    analytics?.summary.csat === undefined
                      ? "—"
                      : analytics.summary.csat.toFixed(1)
                  } CSAT`}
                />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center xl:flex-col xl:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {RANGE_OPTIONS.map(
                  (value) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{
                        y: -1,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                      onClick={() =>
                        setDays(value)
                      }
                      className={`h-10 rounded-xl px-3 text-[9px] font-black transition ${
                        days === value
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "border border-white/15 bg-white/10 text-emerald-50 hover:bg-white/15"
                      }`}
                    >
                      {value} days
                    </motion.button>
                  )
                )}
              </div>

              <motion.button
                type="button"
                whileHover={{
                  y: -2,
                  scale: 1.01,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                onClick={() =>
                  void loadAnalytics(true)
                }
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-emerald-800 shadow-[0_12px_32px_rgba(0,0,0,.16)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </motion.button>
            </div>
          </div>

          {(refreshing || loading) && (
            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
              }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-white to-transparent"
            />
          )}
        </motion.section>

        {/* =================================================
            ERROR
        ================================================= */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[10px] font-bold text-rose-700 dark:text-rose-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {analytics && (
          <>
            {/* =============================================
                METRICS
            ============================================== */}

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
              <MetricCard
                icon={Ticket}
                label="Total tickets"
                value={formatNumber(
                  analytics.summary.totalTickets
                )}
                tone="slate"
              />

              <MetricCard
                icon={CheckCircle2}
                label="Resolved"
                value={formatNumber(
                  analytics.summary.resolvedTickets
                )}
                tone="emerald"
              />

              <MetricCard
                icon={Clock3}
                label="Open"
                value={formatNumber(
                  analytics.summary.openTickets
                )}
                tone="sky"
              />

              <MetricCard
                icon={ShieldAlert}
                label="Escalated"
                value={formatNumber(
                  analytics.summary.escalatedTickets
                )}
                tone="rose"
              />

              <MetricCard
                icon={AlertTriangle}
                label="Breached"
                value={formatNumber(
                  analytics.summary.breachedTickets
                )}
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
                  analytics.summary.csat === null
                    ? "—"
                    : analytics.summary.csat.toFixed(1)
                }
                helper={`${analytics.summary.csatResponses} responses`}
                tone="emerald"
              />
            </section>

            {/* =============================================
                DAILY + STATUS
            ============================================== */}

            <section className="grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
              >
                <ChartHeader
                  icon={Activity}
                  eyebrow="Daily movement"
                  title="Ticket volume & resolutions"
                  description="New support tickets compared with resolved tickets over the selected reporting period."
                />

                <div className="h-[310px] p-3 pt-2 sm:h-[350px] sm:p-4">
                  {dailyData.length === 0 ? (
                    <EmptyChart
                      title="No daily trend data"
                      description="Daily ticket movement will appear when analytics data is available."
                    />
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={dailyData}
                        margin={{
                          top: 16,
                          right: 10,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--border)"
                          strokeDasharray="4 6"
                          opacity={0.75}
                        />

                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          minTickGap={20}
                          tick={{
                            fontSize: 9,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tick={{
                            fontSize: 9,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid var(--border)",
                            background:
                              "var(--card)",
                            color:
                              "var(--card-foreground)",
                            fontSize: 10,
                            boxShadow:
                              "0 16px 36px rgba(15,23,42,.10)",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="tickets"
                          name="New tickets"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 5,
                          }}
                          animationDuration={1100}
                        />

                        <Line
                          type="monotone"
                          dataKey="resolved"
                          name="Resolved"
                          stroke="#06B6D4"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{
                            r: 5,
                          }}
                          animationDuration={1300}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>

              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.05,
                }}
                className="relative isolate overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(145deg,#10B981_0%,#059669_58%,#047857_100%)] text-white shadow-[0_22px_65px_-38px_rgba(5,150,105,.65)]"
              >
                <motion.div
                  aria-hidden
                  animate={{
                    scale: [1, 1.12, 1],
                    opacity: [0.22, 0.48, 0.22],
                    x: [0, 18, 0],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl"
                />

                <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

                <div className="relative border-b border-white/15 px-5 py-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-50/75">
                    Status mix
                  </p>

                  <h2 className="mt-0.5 text-sm font-black text-white">
                    Current distribution
                  </h2>

                  <p className="mt-1 text-[9px] leading-4 text-emerald-50/75">
                    Ticket status distribution for the selected period.
                  </p>
                </div>

                <div className="relative h-[310px] sm:h-[350px]">
                  {statusData.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-6 text-center text-xs font-bold text-emerald-50/70">
                      No status distribution data yet.
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 14,
                              border:
                                "1px solid rgba(255,255,255,.16)",
                              background:
                                "#047857",
                              color: "#FFFFFF",
                              fontSize: 10,
                            }}
                          />

                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            innerRadius="48%"
                            outerRadius="78%"
                            paddingAngle={3}
                            stroke="rgba(255,255,255,.86)"
                            strokeWidth={2}
                            animationDuration={1100}
                          >
                            {statusData.map(
                              (entry, index) => (
                                <Cell
                                  key={entry.status}
                                  fill={
                                    STATUS_CHART_COLORS[
                                      index %
                                        STATUS_CHART_COLORS.length
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
                          <p className="text-3xl font-black text-white">
                            {formatNumber(
                              analytics.summary.totalTickets
                            )}
                          </p>

                          <p className="text-[7px] font-black uppercase tracking-[0.15em] text-emerald-50/70">
                            Tickets
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.article>
            </section>

            {/* =============================================
                CATEGORY + PRIORITY
            ============================================== */}

            <section className="grid gap-4 xl:grid-cols-2">
              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
              >
                <ChartHeader
                  icon={BarChart3}
                  eyebrow="Demand drivers"
                  title="Category breakdown"
                  description="Which support areas generated the most tickets."
                />

                <div className="h-[300px] p-3 pt-2 sm:h-[330px] sm:p-4">
                  {categoryData.length === 0 ? (
                    <EmptyChart
                      title="No category data"
                      description="Category distribution will appear when analytics data is available."
                    />
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={categoryData}
                        margin={{
                          top: 16,
                          right: 8,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--border)"
                          strokeDasharray="4 6"
                          opacity={0.75}
                        />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          tick={{
                            fontSize: 8,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tick={{
                            fontSize: 9,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <Tooltip
                          cursor={{
                            fill:
                              "rgba(16,185,129,.06)",
                          }}
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid var(--border)",
                            background:
                              "var(--card)",
                            color:
                              "var(--card-foreground)",
                            fontSize: 10,
                          }}
                        />

                        <Bar
                          dataKey="count"
                          name="Tickets"
                          fill="#10B981"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          animationDuration={1100}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>

              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.05,
                }}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
              >
                <ChartHeader
                  icon={Layers3}
                  eyebrow="Priority pressure"
                  title="Priority breakdown"
                  description="Visible support load across low, normal, high and urgent priority levels."
                />

                <div className="h-[300px] p-3 pt-2 sm:h-[330px] sm:p-4">
                  {priorityData.length === 0 ? (
                    <EmptyChart
                      title="No priority data"
                      description="Priority distribution will appear when analytics data is available."
                    />
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={priorityData}
                        margin={{
                          top: 16,
                          right: 8,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--border)"
                          strokeDasharray="4 6"
                          opacity={0.75}
                        />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 9,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tick={{
                            fontSize: 9,
                            fill:
                              "var(--muted-foreground)",
                          }}
                        />

                        <Tooltip
                          cursor={{
                            fill:
                              "rgba(16,185,129,.06)",
                          }}
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid var(--border)",
                            background:
                              "var(--card)",
                            color:
                              "var(--card-foreground)",
                            fontSize: 10,
                          }}
                        />

                        <Bar
                          dataKey="count"
                          name="Tickets"
                          fill="#06B6D4"
                          radius={[
                            8,
                            8,
                            0,
                            0,
                          ]}
                          animationDuration={1200}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>
            </section>

            {/* =============================================
                ACTIVITY + HEALTH PANEL
            ============================================== */}

            <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
              >
                <ChartHeader
                  icon={Activity}
                  eyebrow="Operational actions"
                  title="Activity breakdown"
                  description="Ticket activity generated by support operations during the selected period."
                />

                <div className="grid gap-2 p-4 sm:p-5">
                  {activityData.length === 0 ? (
                    <p className="py-12 text-center text-[10px] text-muted-foreground">
                      No activity recorded for this period.
                    </p>
                  ) : (
                    activityData
                      .slice(0, 10)
                      .map(
                        (item, index) => (
                          <motion.div
                            key={item.name}
                            initial={{
                              opacity: 0,
                              x: -8,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay:
                                Math.min(
                                  index * 0.03,
                                  0.2
                                ),
                            }}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/35 px-3 py-3 sm:px-4"
                          >
                            <span className="min-w-0 truncate text-[9px] font-black text-foreground">
                              {item.name}
                            </span>

                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                              {item.count}
                            </span>
                          </motion.div>
                        )
                      )
                  )}
                </div>
              </motion.article>

              <motion.article
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.06,
                }}
                className="relative isolate overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(145deg,#10B981_0%,#059669_58%,#047857_100%)] p-5 text-white shadow-[0_22px_65px_-38px_rgba(5,150,105,.65)]"
              >
                <motion.div
                  aria-hidden
                  animate={{
                    scale: [1, 1.12, 1],
                    x: [0, 18, 0],
                    opacity: [0.26, 0.5, 0.26],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl"
                />

                <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

                <div className="relative">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
                    <TrendingUp className="h-5 w-5" />
                  </span>

                  <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100">
                    Support health
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                    {formatPercent(
                      analytics.summary.resolutionRate
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-50/75">
                    Resolution rate for the selected reporting window.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <EmeraldMetric
                      label="Escalation"
                      value={formatPercent(
                        analytics.summary.escalationRate
                      )}
                    />

                    <EmeraldMetric
                      label="Breach"
                      value={formatPercent(
                        analytics.summary.breachRate
                      )}
                    />

                    <EmeraldMetric
                      label="Waiting"
                      value={formatNumber(
                        analytics.summary
                          .waitingCustomerTickets
                      )}
                    />

                    <EmeraldMetric
                      label="Urgent"
                      value={formatNumber(
                        analytics.summary.urgentTickets
                      )}
                    />
                  </div>
                </div>
              </motion.article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   HERO PILL
========================================================= */

function HeroPill({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}) {
  return (
    <motion.span
      whileHover={{
        y: -2,
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[9px] font-black text-emerald-50 backdrop-blur"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.span>
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
    slate: {
      icon:
        "bg-muted text-muted-foreground border-border",
      glow: "bg-slate-500/10",
      accent: "bg-slate-500",
    },

    emerald: {
      icon:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/15",
      glow: "bg-emerald-500/10",
      accent: "bg-emerald-500",
    },

    sky: {
      icon:
        "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/15",
      glow: "bg-sky-500/10",
      accent: "bg-sky-500",
    },

    rose: {
      icon:
        "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/15",
      glow: "bg-rose-500/10",
      accent: "bg-rose-500",
    },

    amber: {
      icon:
        "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/15",
      glow: "bg-amber-500/10",
      accent: "bg-amber-500",
    },

    violet: {
      icon:
        "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/15",
      glow: "bg-violet-500/10",
      accent: "bg-violet-500",
    },
  }[tone];

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -4,
      }}
      className="group relative overflow-hidden rounded-[22px] border border-border bg-card p-4 shadow-sm transition hover:shadow-lg"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${tones.accent}`}
      />

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${tones.glow}`}
      />

      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border ${tones.icon}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="relative mt-4 text-[7px] font-black uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </p>

      <p className="relative mt-1 text-xl font-black tracking-tight text-foreground">
        {value}
      </p>

      {helper && (
        <p className="relative mt-1 text-[8px] font-semibold text-muted-foreground">
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
    <div className="flex items-start gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        <Icon className="h-4 w-4" />
      </span>

      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-sm font-black text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <div>
        <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50" />

        <p className="mt-3 text-xs font-black text-foreground">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMERALD METRIC
========================================================= */

function EmeraldMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-white/12 bg-white/[0.08] p-3 backdrop-blur"
    >
      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-emerald-100/70">
        {label}
      </p>

      <p className="mt-1 text-base font-black text-white">
        {value}
      </p>
    </motion.div>
  );
}
