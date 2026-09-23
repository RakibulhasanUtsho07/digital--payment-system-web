"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportActivityLog,
} from "@/lib/api/supportDashboardApi";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 20;

const EVENT_TYPES = [
  "All",
  "TICKET_CREATED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "CATEGORY_CHANGED",
  "ASSIGNEE_CHANGED",
  "CUSTOMER_REPLY",
  "ADMIN_REPLY",
  "INTERNAL_NOTE",
  "ESCALATED",
  "RESOLVED",
  "REOPENED",
] as const;

type EventTypeFilter =
  (typeof EVENT_TYPES)[number];

const HERO_PARTICLES = [
  {
    left: "7%",
    top: "20%",
    size: 4,
    delay: 0.2,
    duration: 7.8,
  },
  {
    left: "18%",
    top: "72%",
    size: 3,
    delay: 1.1,
    duration: 8.7,
  },
  {
    left: "31%",
    top: "17%",
    size: 5,
    delay: 0.7,
    duration: 9.7,
  },
  {
    left: "44%",
    top: "76%",
    size: 4,
    delay: 2.1,
    duration: 8.1,
  },
  {
    left: "58%",
    top: "28%",
    size: 3,
    delay: 1.5,
    duration: 7.6,
  },
  {
    left: "72%",
    top: "66%",
    size: 5,
    delay: 0.5,
    duration: 10.2,
  },
  {
    left: "84%",
    top: "23%",
    size: 3,
    delay: 2.4,
    duration: 8.6,
  },
  {
    left: "93%",
    top: "72%",
    size: 4,
    delay: 1.7,
    duration: 9.2,
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function eventLabel(
  value: string
) {
  return value === "All"
    ? "All activity types"
    : value.replaceAll(
        "_",
        " "
      );
}

function eventClass(
  eventType: string
) {
  if (
    eventType ===
    "ESCALATED"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    eventType ===
    "RESOLVED"
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    eventType.includes(
      "REPLY"
    )
  ) {
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }

  if (
    eventType ===
    "INTERNAL_NOTE"
  ) {
    return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }

  if (
    eventType ===
      "PRIORITY_CHANGED" ||
    eventType ===
      "STATUS_CHANGED"
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-border bg-muted text-muted-foreground";
}

/* =========================================================
   SUPPORT-ONLY ACCESS
========================================================= */

function isAuthorizationError(
  error: unknown
): boolean {
  const maybeRecord =
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
    maybeRecord?.response &&
    typeof maybeRecord.response ===
      "object"
      ? (
          maybeRecord.response as
            Record<
              string,
              unknown
            >
        )
      : null;

  const status =
    Number(
      maybeRecord?.status ??
        maybeRecord?.statusCode ??
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
            <Search className="h-6 w-6" />
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

export default function SupportActivityPage() {
  const {
    user,
  } = useDashboardSession();

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const denyAccess =
    useCallback(() => {
      setAccessDenied(true);
    }, []);

  if (
    accessDenied ||
    user?.role !== "support"
  ) {
    return (
      <SupportNotFoundState />
    );
  }

  return (
    <SupportActivityContent
      onUnauthorized={denyAccess}
    />
  );
}

function SupportActivityContent({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [
    activities,
    setActivities,
  ] =
    useState<
      SupportActivityLog[]
    >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    eventType,
    setEventType,
  ] =
    useState<EventTypeFilter>(
      "All"
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

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
     LOAD ACTIVITY
  ======================================================= */

  const loadActivity =
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
            await supportDashboardApi.getActivity(
              {
                search:
                  search.trim() ||
                  undefined,

                eventType:
                  eventType ===
                  "All"
                    ? undefined
                    : eventType,

                page,

                limit:
                  PAGE_SIZE,
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load support activity."
            );
          }

          setActivities(
            response.activities ??
              []
          );

          setTotal(
            response.total ??
              0
          );

          setTotalPages(
            Math.max(
              1,
              response.totalPages ??
                1
            )
          );
        } catch (
          requestError
        ) {
          if (
            isAuthorizationError(
              requestError
            )
          ) {
            onUnauthorized();
            return;
          }

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load support activity."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [
        eventType,
        page,
        search,
        onUnauthorized,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () =>
          void loadActivity(),
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadActivity]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    eventType,
  ]);

  /* =======================================================
     PAGE ANALYTICS
  ======================================================= */

  const paginationText =
    useMemo(() => {
      if (!total) {
        return "0 activities";
      }

      const start =
        (page - 1) *
          PAGE_SIZE +
        1;

      const end =
        Math.min(
          page *
            PAGE_SIZE,
          total
        );

      return `${start}-${end} of ${total} activities`;
    }, [
      page,
      total,
    ]);

  const uniqueActors =
    useMemo(
      () =>
        new Set(
          activities
            .map(
              (item) =>
                item.actor.id ||
                item.actor.name
            )
            .filter(Boolean)
        ).size,
      [activities]
    );

  const relatedTickets =
    useMemo(
      () =>
        new Set(
          activities
            .map(
              (item) =>
                item.ticket.id
            )
            .filter(Boolean)
        ).size,
      [activities]
    );

  const escalatedVisible =
    useMemo(
      () =>
        activities.filter(
          (item) =>
            item.eventType ===
            "ESCALATED"
        ).length,
      [activities]
    );

  const eventChartData =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      for (
        const item of
        activities
      ) {
        counts.set(
          item.eventType,
          (counts.get(
            item.eventType
          ) ?? 0) + 1
        );
      }

      return Array.from(
        counts.entries()
      )
        .map(
          ([
            name,
            count,
          ]) => ({
            name:
              name.replaceAll(
                "_",
                " "
              ),
            count,
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            second.count -
            first.count
        );
    }, [activities]);

  const activeFilterCount =
    [
      Boolean(
        search.trim()
      ),
      eventType !== "All",
    ].filter(
      Boolean
    ).length;

  function clearFilters() {
    setSearch("");
    setEventType("All");
    setPage(1);
  }

  return (
    <main className="support-activity-page w-full min-w-0 overflow-x-clip bg-transparent pb-8 text-foreground">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-1 sm:space-y-6 sm:px-0">
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
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/25 bg-[linear-gradient(135deg,#10B981_0%,#059669_48%,#047857_100%)] p-5 text-white shadow-[0_28px_80px_-38px_rgba(5,150,105,.70)] sm:p-6 md:p-7 lg:p-8"
        >
          <motion.div
            aria-hidden
            animate={{
              x: [
                0,
                36,
                -14,
                0,
              ],
              y: [
                0,
                -18,
                12,
                0,
              ],
              scale: [
                1,
                1.14,
                0.96,
                1,
              ],
              opacity: [
                0.42,
                0.72,
                0.48,
                0.42,
              ],
            }}
            transition={{
              duration: 13,
              repeat:
                Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-emerald-200/30 blur-[95px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [
                0,
                -26,
                18,
                0,
              ],
              y: [
                0,
                20,
                -10,
                0,
              ],
              scale: [
                1,
                1.1,
                0.97,
                1,
              ],
            }}
            transition={{
              duration: 16,
              repeat:
                Infinity,
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
              repeat:
                Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute right-[16%] top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-dashed border-white/20 xl:block"
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.85)]" />
          </motion.div>

          <motion.div
            aria-hidden
            animate={{
              x: [
                "-25%",
                "125%",
              ],
              opacity: [
                0,
                0.35,
                0,
              ],
            }}
            transition={{
              duration: 7,
              repeat:
                Infinity,
              repeatDelay: 1.4,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />

          {HERO_PARTICLES.map(
            (
              particle,
              index
            ) => (
              <motion.span
                key={`${particle.left}-${particle.top}-${index}`}
                aria-hidden
                className="pointer-events-none absolute rounded-full bg-emerald-50 shadow-[0_0_14px_rgba(236,253,245,.85)]"
                style={{
                  left:
                    particle.left,
                  top:
                    particle.top,
                  width:
                    particle.size,
                  height:
                    particle.size,
                }}
                animate={{
                  y: [
                    0,
                    -14,
                    6,
                    0,
                  ],
                  x: [
                    0,
                    7,
                    -4,
                    0,
                  ],
                  opacity: [
                    0.2,
                    0.9,
                    0.4,
                    0.2,
                  ],
                  scale: [
                    0.8,
                    1.25,
                    0.95,
                    0.8,
                  ],
                }}
                transition={{
                  duration:
                    particle.duration,
                  delay:
                    particle.delay,
                  repeat:
                    Infinity,
                  ease:
                    "easeInOut",
                }}
              />
            )
          )}

          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-50 backdrop-blur">
                  <Activity className="h-3.5 w-3.5" />
                  Support Activity
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Audit trail
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.035em] sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                Follow every support action from one operational timeline
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
                Track ticket creation,
                status changes,
                replies, escalations,
                notes and resolutions
                with the same backend
                activity data already
                powering this route.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill
                  icon={Activity}
                  label={`${total.toLocaleString(
                    "en-BD"
                  )} total events`}
                />

                <HeroPill
                  icon={Filter}
                  label={`${activeFilterCount} active filters`}
                />

                <HeroPill
                  icon={ShieldCheck}
                  label="Operational audit trail"
                />
              </div>
            </div>

            <div className="relative shrink-0">
              <motion.div
                aria-hidden
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 18,
                  repeat:
                    Infinity,
                  ease: "linear",
                }}
                className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-white/20 xl:block"
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.95)]" />
              </motion.div>

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
                  void loadActivity(
                    true
                  )
                }
                disabled={
                  refreshing ||
                  loading
                }
                className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-800 shadow-[0_12px_32px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ||
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh activity
              </motion.button>
            </div>
          </div>

          {(
            refreshing ||
            loading
          ) && (
            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 1.1,
                repeat:
                  Infinity,
              }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-white to-transparent"
            />
          )}
        </motion.section>

        {/* =================================================
            METRICS
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            icon={Activity}
            label="Visible Events"
            value={
              loading
                ? "…"
                : activities.length.toLocaleString(
                    "en-BD"
                  )
            }
            description="Activity records visible on the current page"
            tone="emerald"
          />

          <MetricCard
            icon={Users}
            label="Unique Actors"
            value={
              loading
                ? "…"
                : uniqueActors.toLocaleString(
                    "en-BD"
                  )
            }
            description="Support actors represented in current results"
            tone="cyan"
          />

          <MetricCard
            icon={Ticket}
            label="Related Tickets"
            value={
              loading
                ? "…"
                : relatedTickets.toLocaleString(
                    "en-BD"
                  )
            }
            description="Distinct tickets referenced by visible activity"
            tone="violet"
          />

          <MetricCard
            icon={ShieldCheck}
            label="Escalated"
            value={
              loading
                ? "…"
                : escalatedVisible.toLocaleString(
                    "en-BD"
                  )
            }
            description="Escalation events visible on this page"
            tone="amber"
          />
        </section>

        {/* =================================================
            CHART + PULSE
        ================================================= */}

        <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
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
            <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <BarChart3 className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                    Real visible data
                  </p>

                  <h2 className="mt-0.5 text-sm font-black text-foreground">
                    Event distribution
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Event mix from the
                    current backend
                    activity response.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                {
                  activities.length
                }{" "}
                visible events
              </span>
            </div>

            <div className="h-[320px] min-w-0 p-3 sm:h-[350px] sm:p-5">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : eventChartData.length ===
                0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 text-center">
                  <div>
                    <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50" />

                    <p className="mt-3 text-xs font-black text-foreground">
                      No chart data yet
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Activity
                      distribution will
                      appear after data
                      loads.
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      eventChartData
                    }
                    margin={{
                      top: 12,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      vertical={
                        false
                      }
                      stroke="var(--border)"
                      strokeDasharray="4 6"
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
                      minTickGap={18}
                      angle={
                        eventChartData.length >
                        5
                          ? -18
                          : 0
                      }
                      textAnchor={
                        eventChartData.length >
                        5
                          ? "end"
                          : "middle"
                      }
                      height={
                        eventChartData.length >
                        5
                          ? 64
                          : 40
                      }
                      tick={{
                        fontSize: 8,
                        fill:
                          "var(--muted-foreground)",
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
                        borderRadius:
                          14,
                        border:
                          "1px solid var(--border)",
                        background:
                          "var(--card)",
                        color:
                          "var(--card-foreground)",
                        fontSize: 11,
                        fontWeight:
                          700,
                        boxShadow:
                          "0 18px 45px rgba(15,23,42,.12)",
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Events"
                      fill="#10B981"
                      radius={[
                        9,
                        9,
                        3,
                        3,
                      ]}
                      animationDuration={
                        1200
                      }
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
              delay: 0.07,
            }}
            className="relative isolate overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(145deg,#10B981_0%,#059669_58%,#047857_100%)] p-5 text-white shadow-[0_22px_65px_-38px_rgba(5,150,105,.65)]"
          >
            <motion.div
              aria-hidden
              animate={{
                scale: [
                  1,
                  1.12,
                  1,
                ],
                x: [
                  0,
                  18,
                  0,
                ],
                opacity: [
                  0.26,
                  0.5,
                  0.26,
                ],
              }}
              transition={{
                duration: 9,
                repeat:
                  Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl"
            />

            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <Sparkles className="h-5 w-5" />
              </span>

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100">
                Activity pulse
              </p>

              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {total.toLocaleString(
                  "en-BD"
                )}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-50/75">
                Server-side events
                currently match your
                search and event-type
                filters.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <PulseMetric
                  label="Visible"
                  value={activities.length.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Actors"
                  value={uniqueActors.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Tickets"
                  value={relatedTickets.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Page"
                  value={`${page}/${totalPages}`}
                />
              </div>
            </div>
          </motion.article>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="relative z-30 overflow-visible rounded-[26px] border border-emerald-500/15 bg-emerald-500/[0.055] p-4 shadow-sm"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Activity filters
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Search real activity
                summaries and narrow by
                event type.
              </p>
            </div>

            {activeFilterCount >
              0 && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="w-fit rounded-xl border border-emerald-500/15 bg-card px-3 py-2 text-[9px] font-black text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
            <label>
              <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Search
              </span>

              <div className="group relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-emerald-600" />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search summary or actor name…"
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-xs font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearch(
                        ""
                      )
                    }
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </label>

            <EventTypeSelect
              value={
                eventType
              }
              options={
                EVENT_TYPES
              }
              onChange={
                setEventType
              }
            />
          </div>
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

        {/* =================================================
            ACTIVITY LIST
        ================================================= */}

        <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <FileText className="h-5 w-5" />
              </span>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                  Operational history
                </p>

                <h2 className="mt-0.5 text-sm font-black text-foreground">
                  Support activity log
                </h2>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Real audit events from
                  the support backend.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
              {total.toLocaleString(
                "en-BD"
              )}{" "}
              events
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />

                <p className="mt-3 text-xs font-black text-foreground">
                  Loading activity…
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Reading the latest
                  support audit trail.
                </p>
              </div>
            </div>
          ) : activities.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-black text-foreground">
                No activity found
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Try changing your
                search or event type.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map(
                (
                  item,
                  index
                ) => (
                  <motion.article
                    key={
                      item.id
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        Math.min(
                          index *
                            0.02,
                          0.22
                        ),
                    }}
                    className="grid min-w-0 gap-4 px-4 py-4 transition hover:bg-emerald-500/[0.04] sm:px-5 xl:grid-cols-[170px_minmax(0,1fr)_220px] xl:items-center 2xl:grid-cols-[180px_minmax(0,1fr)_240px]"
                  >
                    {/* EVENT */}
                    <div>
                      <span
                        className={`inline-flex max-w-full whitespace-normal break-words rounded-full border px-2.5 py-1 text-left text-[7px] font-black leading-4 ${eventClass(
                          item.eventType
                        )}`}
                      >
                        {item.eventType.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                      <div className="mt-2 flex items-center gap-1.5 text-[8px] font-semibold text-muted-foreground">
                        <Clock3 className="h-3 w-3" />

                        {formatDateTime(
                          item.createdAt
                        )}
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0">
                      <p className="text-[11px] font-black leading-5 text-foreground">
                        {
                          item.summary
                        }
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[8px] text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <UserRound className="h-3 w-3 shrink-0 text-emerald-600" />

                          <span className="truncate">
                            {
                              item.actor
                                .name
                            }
                          </span>
                        </span>

                        {item.actor
                          .role && (
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-muted-foreground" />

                            {
                              item.actor
                                .role
                            }
                          </span>
                        )}

                        {item.actor
                          .accountStatus && (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-black uppercase tracking-wide">
                            {
                              item.actor
                                .accountStatus
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* TICKET */}
                    <div className="min-w-0 rounded-2xl border border-border bg-muted/40 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Related ticket
                        </p>

                        <Hash className="h-3 w-3 text-emerald-600" />
                      </div>

                      <p className="mt-1 truncate text-[9px] font-black text-foreground">
                        {item.ticket
                          .ticketNumber ||
                          item.ticket
                            .id}
                      </p>

                      <p className="mt-0.5 truncate text-[8px] text-muted-foreground">
                        {item.ticket
                          .subject ||
                          "Ticket details unavailable"}
                      </p>
                    </div>
                  </motion.article>
                )
              )}
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col gap-3 border-t border-border bg-emerald-500/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <p className="text-[9px] font-semibold text-muted-foreground">
              {
                paginationText
              }
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <PageButton
                label="Previous activity page"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    (
                      value
                    ) =>
                      Math.max(
                        1,
                        value -
                          1
                      )
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </PageButton>

              <motion.span
                key={`${page}-${totalPages}`}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="min-w-20 rounded-xl bg-emerald-600 px-3 py-2 text-center text-[9px] font-black text-white shadow-sm"
              >
                {page} /{" "}
                {totalPages}
              </motion.span>

              <PageButton
                label="Next activity page"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (
                      value
                    ) =>
                      Math.min(
                        totalPages,
                        value +
                          1
                      )
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </PageButton>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .support-activity-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(16, 185, 129, 0.4)
            transparent;
        }

        .support-activity-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-activity-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-activity-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            rgba(16, 185, 129, 0.36);
          background-clip:
            padding-box;
        }

        .support-activity-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(5, 150, 105, 0.54);
          background-clip:
            padding-box;
        }
      `}</style>
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
  icon: React.ElementType;
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
  description,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  tone:
    | "emerald"
    | "cyan"
    | "violet"
    | "amber";
}) {
  const styles = {
    emerald: {
      icon:
        "bg-emerald-500/10 text-emerald-600",
      glow:
        "bg-emerald-500/10",
      accent:
        "bg-emerald-500",
    },

    cyan: {
      icon:
        "bg-cyan-500/10 text-cyan-600",
      glow:
        "bg-cyan-500/10",
      accent:
        "bg-cyan-500",
    },

    violet: {
      icon:
        "bg-violet-500/10 text-violet-600",
      glow:
        "bg-violet-500/10",
      accent:
        "bg-violet-500",
    },

    amber: {
      icon:
        "bg-amber-500/10 text-amber-600",
      glow:
        "bg-amber-500/10",
      accent:
        "bg-amber-500",
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
      className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-sm transition hover:shadow-lg"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>

        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PULSE METRIC
========================================================= */

function PulseMetric({
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

/* =========================================================
   EVENT TYPE SELECT
========================================================= */

function EventTypeSelect({
  value,
  options,
  onChange,
}: {
  value: EventTypeFilter;
  options: readonly EventTypeFilter[];
  onChange: (
    value: EventTypeFilter
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const rootRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function handleOutside(
      event: PointerEvent
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutside
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative ${
        open
          ? "z-[90]"
          : "z-10"
      }`}
    >
      <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        Event Type
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-background px-3.5 text-left shadow-sm outline-none transition ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-border hover:border-emerald-500/35"
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Filter className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-foreground">
            {eventLabel(
              value
            )}
          </span>

          <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
            Filter the support audit trail
          </span>
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          transition={{
            duration: 0.18,
          }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
            }}
            role="listbox"
            className="support-activity-scroll absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.30)]"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  value ===
                  option;

                return (
                  <button
                    key={
                      option
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      active
                    }
                    onClick={() => {
                      onChange(
                        option
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-emerald-500/10"
                        : "hover:bg-emerald-500/[0.06]"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {active ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-foreground">
                        {eventLabel(
                          option
                        )}
                      </span>

                      <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
                        {option ===
                        "All"
                          ? "Show every event type"
                          : "Show only this activity type"}
                      </span>
                    </span>
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   PAGE BUTTON
========================================================= */

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={
        label
      }
      disabled={
        disabled
      }
      whileHover={
        !disabled
          ? {
              y: -1,
              scale: 1.03,
            }
          : undefined
      }
      whileTap={
        !disabled
          ? {
              scale: 0.95,
            }
          : undefined
      }
      onClick={
        onClick
      }
      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}
