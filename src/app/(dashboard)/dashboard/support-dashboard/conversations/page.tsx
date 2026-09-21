"use client";

import React, {
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
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportConversationDetail,
  type SupportConversationSummary,
  type TicketStatus,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<
  TicketStatus | "All"
> = [
  "All",
  "Open",
  "Waiting for Customer",
  "In Progress",
  "Escalated",
  "Resolved",
];

type StatusFilter =
  (typeof STATUS_OPTIONS)[number];

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

const priorityClasses: Record<
  string,
  string
> = {
  Urgent:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  High:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Normal:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Low:
    "border-border bg-muted text-muted-foreground",
};

const statusClasses: Record<
  string,
  string
> = {
  Open:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Waiting for Customer":
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "In Progress":
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Escalated:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Resolved:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function formatDateTime(
  value?: string | null
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  );
}

function statusLabel(
  value: StatusFilter
) {
  return value === "All"
    ? "All statuses"
    : value;
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportConversationsPage() {
  const [
    conversations,
    setConversations,
  ] = useState<
    SupportConversationSummary[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
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

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] =
    useState<string | null>(
      null
    );

  const [
    detail,
    setDetail,
  ] =
    useState<SupportConversationDetail | null>(
      null
    );

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState("");

  /* =======================================================
     LOAD CONVERSATIONS
  ======================================================= */

  const loadConversations =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getConversations(
              {
                search:
                  search.trim() ||
                  undefined,

                status,

                page,

                limit:
                  PAGE_SIZE,
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load conversations."
            );
          }

          setConversations(
            response.conversations ??
              []
          );

          setTotal(
            response.total ?? 0
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
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load conversations."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        page,
        search,
        status,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadConversations();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadConversations]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
  ]);

  /* =======================================================
     OPEN CONVERSATION
  ======================================================= */

  const openConversation =
    useCallback(
      async (
        conversationId: string
      ) => {
        setSelectedConversationId(
          conversationId
        );

        setDetail(null);
        setDetailError("");
        setDetailLoading(true);

        try {
          const response =
            await supportDashboardApi.getConversation(
              conversationId
            );

          if (
            !response.success ||
            !response.conversation
          ) {
            throw new Error(
              "Failed to load conversation."
            );
          }

          setDetail(
            response.conversation
          );
        } catch (
          requestError
        ) {
          setDetailError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load conversation."
          );
        } finally {
          setDetailLoading(
            false
          );
        }
      },
      []
    );

  const closeConversation =
    () => {
      setSelectedConversationId(
        null
      );

      setDetail(null);
      setDetailError("");
    };

  /* =======================================================
     REAL CURRENT-PAGE ANALYTICS
  ======================================================= */

  const statusData =
    useMemo(
      () =>
        STATUS_OPTIONS
          .filter(
            (
              item
            ) =>
              item !==
              "All"
          )
          .map(
            (
              item
            ) => ({
              name: item,
              count:
                conversations.filter(
                  (
                    conversation
                  ) =>
                    conversation.status ===
                    item
                ).length,
            })
          )
          .filter(
            (
              item
            ) =>
              item.count >
              0
          ),
      [conversations]
    );

  const priorityData =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >();

      for (
        const item of
        conversations
      ) {
        map.set(
          item.priority,
          (map.get(
            item.priority
          ) ?? 0) + 1
        );
      }

      return Array.from(
        map.entries()
      )
        .map(
          ([
            name,
            count,
          ]) => ({
            name,
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
    }, [conversations]);

  const assignedCount =
    useMemo(
      () =>
        conversations.filter(
          (
            item
          ) =>
            Boolean(
              item.assignee
            )
        ).length,
      [conversations]
    );

  const waitingCount =
    useMemo(
      () =>
        conversations.filter(
          (
            item
          ) =>
            item.status ===
            "Waiting for Customer"
        ).length,
      [conversations]
    );

  const escalatedCount =
    useMemo(
      () =>
        conversations.filter(
          (
            item
          ) =>
            item.status ===
            "Escalated"
        ).length,
      [conversations]
    );

  const activeFilterCount =
    [
      Boolean(
        search.trim()
      ),
      status !== "All",
    ].filter(
      Boolean
    ).length;

  /* =======================================================
     PAGINATION
  ======================================================= */

  const paginationText =
    useMemo(() => {
      if (total === 0) {
        return "0 conversations";
      }

      const start =
        (page - 1) *
          PAGE_SIZE +
        1;

      const end =
        Math.min(
          page * PAGE_SIZE,
          total
        );

      return `${start}-${end} of ${total} conversations`;
    }, [
      page,
      total,
    ]);

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setPage(1);
  }

  return (
    <main className="support-conversations-page bg-transparent pb-8 text-foreground">
      <style>{`
        .support-conversations-page,
        .support-conversations-page * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .support-conversations-page::-webkit-scrollbar,
        .support-conversations-page *::-webkit-scrollbar {
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
                  <MessageSquare className="h-3.5 w-3.5" />
                  Conversations
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Support operations
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.035em] sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                Review every support conversation from one live workspace
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
                Search cases, inspect real customer and merchant conversations,
                follow assignment and status changes, and review complete
                message history from the existing support backend.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill
                  icon={MessageSquare}
                  label={`${total.toLocaleString(
                    "en-BD"
                  )} total conversations`}
                />

                <HeroPill
                  icon={Filter}
                  label={`${activeFilterCount} active filters`}
                />

                <HeroPill
                  icon={ShieldCheck}
                  label="Real backend data"
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
                  void loadConversations(
                    true
                  )
                }
                disabled={
                  refreshing ||
                  loading
                }
                className="relative inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-800 shadow-[0_12px_32px_rgba(0,0,0,.16)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ||
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh conversations
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Inbox}
            label="Visible Conversations"
            value={
              loading
                ? "…"
                : conversations.length.toLocaleString(
                    "en-BD"
                  )
            }
            description="Real conversations visible on the current API page"
            tone="emerald"
          />

          <MetricCard
            icon={UserCheck}
            label="Assigned"
            value={
              loading
                ? "…"
                : assignedCount.toLocaleString(
                    "en-BD"
                  )
            }
            description="Visible conversations currently assigned to support"
            tone="cyan"
          />

          <MetricCard
            icon={Clock3}
            label="Waiting Customer"
            value={
              loading
                ? "…"
                : waitingCount.toLocaleString(
                    "en-BD"
                  )
            }
            description="Visible conversations waiting for customer response"
            tone="amber"
          />

          <MetricCard
            icon={AlertCircle}
            label="Escalated"
            value={
              loading
                ? "…"
                : escalatedCount.toLocaleString(
                    "en-BD"
                  )
            }
            description="Visible escalated support conversations"
            tone="rose"
          />
        </section>

        {/* =================================================
            CHARTS
        ================================================= */}

        <section className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
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
                    Conversation status distribution
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Status mix calculated only from the current backend response.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                {conversations.length} visible
              </span>
            </div>

            <div className="h-[300px] p-4 sm:h-[330px] sm:p-5">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : statusData.length ===
                0 ? (
                <EmptyChart
                  title="No status data"
                  description="Status distribution will appear when real conversations are returned."
                />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={statusData}
                    margin={{
                      top: 12,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="4 6"
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
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
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
                      name="Conversations"
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
                <Users className="h-5 w-5" />
              </span>

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100">
                Conversation pulse
              </p>

              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {total.toLocaleString(
                  "en-BD"
                )}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-50/75">
                Server-side conversations currently match your active search and status filters.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <PulseMetric
                  label="Visible"
                  value={conversations.length.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Assigned"
                  value={assignedCount.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Escalated"
                  value={escalatedCount.toLocaleString(
                    "en-BD"
                  )}
                />

                <PulseMetric
                  label="Page"
                  value={`${page}/${totalPages}`}
                />
              </div>

              {priorityData.length >
                0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-100/75">
                    Visible priority mix
                  </p>

                  {priorityData
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.name
                          }
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2"
                        >
                          <span className="text-[8px] font-bold text-emerald-50/80">
                            {
                              item.name
                            }
                          </span>

                          <span className="text-[9px] font-black text-white">
                            {
                              item.count
                            }
                          </span>
                        </div>
                      )
                    )}
                </div>
              )}
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
                Conversation filters
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Search real cases and narrow the current server scope by status.
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

          <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
            <label>
              <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Search
              </span>

              <div className="group relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-emerald-600" />

                <input
                  type="text"
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
                  placeholder="Search ticket, subject, customer, reference…"
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

            <StatusSelect
              value={
                status
              }
              options={
                STATUS_OPTIONS
              }
              onChange={
                setStatus
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
              className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <MessageSquare className="h-5 w-5" />
              </span>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                  Support conversation queue
                </p>

                <h2 className="mt-0.5 text-sm font-black text-foreground">
                  Live conversations
                </h2>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Real records returned from the current backend query.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
              {total.toLocaleString(
                "en-BD"
              )}{" "}
              conversations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[
                    "Conversation",
                    "Customer",
                    "Status",
                    "Assignee",
                    "Last Message",
                    "Activity",
                    "Action",
                  ].map(
                    (
                      label,
                      index
                    ) => (
                      <th
                        key={
                          label
                        }
                        className={`px-5 py-4 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground ${
                          index ===
                          6
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {
                          label
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <TableSkeleton />
                ) : conversations.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        7
                      }
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <MessageSquare className="h-6 w-6" />
                      </div>

                      <p className="mt-4 text-sm font-black text-foreground">
                        No conversations found
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Try changing the search or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  conversations.map(
                    (
                      item
                    ) => (
                      <ConversationRow
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                        onOpen={() =>
                          void openConversation(
                            item.id
                          )
                        }
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col gap-3 border-t border-border bg-emerald-500/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <p className="text-[10px] font-bold text-muted-foreground">
              {
                paginationText
              }
            </p>

            <div className="flex items-center gap-2">
              <PageButton
                label="Previous conversation page"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
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
                className="min-w-[78px] rounded-xl bg-emerald-600 px-3 py-2 text-center text-[9px] font-black text-white shadow-sm"
              >
                {page} /{" "}
                {totalPages}
              </motion.span>

              <PageButton
                label="Next conversation page"
                disabled={
                  page >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      Math.min(
                        totalPages,
                        current +
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

      {/* =====================================================
          DETAIL DRAWER
      ====================================================== */}

      <AnimatePresence>
        {selectedConversationId ? (
          <ConversationDrawer
            loading={
              detailLoading
            }
            error={
              detailError
            }
            detail={
              detail
            }
            onClose={
              closeConversation
            }
          />
        ) : null}
      </AnimatePresence>
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
    | "amber"
    | "rose";
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

    amber: {
      icon:
        "bg-amber-500/10 text-amber-600",
      glow:
        "bg-amber-500/10",
      accent:
        "bg-amber-500",
    },

    rose: {
      icon:
        "bg-rose-500/10 text-rose-600",
      glow:
        "bg-rose-500/10",
      accent:
        "bg-rose-500",
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
   STATUS SELECT
========================================================= */

function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: StatusFilter;
  options: readonly StatusFilter[];
  onChange: (
    value: StatusFilter
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
      ref={
        rootRef
      }
      className={`relative ${
        open
          ? "z-[90]"
          : "z-10"
      }`}
    >
      <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        Status
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
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
            {statusLabel(
              value
            )}
          </span>

          <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
            Filter the live conversation queue
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
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
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
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-72 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.30)]"
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
                        {statusLabel(
                          option
                        )}
                      </span>

                      <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
                        {option ===
                        "All"
                          ? "Show every status"
                          : "Show only this conversation status"}
                      </span>
                    </span>
                  </button>
                );
              }
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   CONVERSATION ROW
========================================================= */

function ConversationRow({
  item,
  onOpen,
}: {
  item: SupportConversationSummary;
  onOpen: () => void;
}) {
  return (
    <motion.tr
      initial={{
        opacity: 0,
        y: 4,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="bg-card transition hover:bg-emerald-500/[0.045]"
    >
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <MessageSquare className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-violet-600 dark:text-violet-300">
              {
                item.ticketNumber
              }
            </p>

            <p className="mt-1 max-w-[280px] truncate text-xs font-black text-foreground">
              {
                item.subject
              }
            </p>

            <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
              {
                item.category
              }{" "}
              ·{" "}
              {
                item.priority
              }
            </p>

            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black ${
                priorityClasses[
                  item.priority
                ] ??
                priorityClasses.Normal
              }`}
            >
              {
                item.priority
              }
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">
              {
                item.customer
                  .name
              }
            </p>

            <p className="mt-1 max-w-[220px] truncate text-[9px] text-muted-foreground">
              {
                item.customer
                  .email
              }
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${
            statusClasses[
              item.status
            ] ??
            "border-border bg-muted text-muted-foreground"
          }`}
        >
          {
            item.status
          }
        </span>

        <p className="mt-2 text-[9px] font-semibold text-muted-foreground">
          Waiting:{" "}
          {
            item.waitingOn
          }
        </p>
      </td>

      <td className="px-5 py-4">
        {item.assignee ? (
          <div>
            <p className="text-xs font-bold text-foreground">
              {
                item.assignee
                  .name
              }
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-muted-foreground">
              {
                item.assignee
                  .role
              }
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            Unassigned
          </span>
        )}
      </td>

      <td className="max-w-[280px] px-5 py-4">
        {item.lastMessage ? (
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[8px] font-black ${
                  item.lastMessage
                    .authorType ===
                  "customer"
                    ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                }`}
              >
                {
                  item.lastMessage
                    .authorType
                }
              </span>

              <span className="text-[8px] font-semibold text-muted-foreground">
                {item.lastMessage
                  .visibility ===
                "internal"
                  ? "Internal"
                  : "Public"}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-foreground/80">
              {
                item.lastMessage
                  .body
              }
            </p>

            <p className="mt-1 text-[8px] font-semibold text-muted-foreground">
              {formatDateTime(
                item.lastMessage
                  .createdAt
              )}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            No messages
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />

          {formatDateTime(
            item.lastActivityAt
          )}
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <motion.button
          type="button"
          whileHover={{
            y: -1,
          }}
          whileTap={{
            scale: 0.97,
          }}
          onClick={
            onOpen
          }
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
        >
          View Conversation
        </motion.button>
      </td>
    </motion.tr>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function ConversationDrawer({
  loading,
  error,
  detail,
  onClose,
}: {
  loading: boolean;
  error: string;
  detail:
    | SupportConversationDetail
    | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[120]"
    >
      <motion.button
        type="button"
        aria-label="Close conversation drawer"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={
          onClose
        }
        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[5px]"
      />

      <motion.aside
        initial={{
          x: "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "100%",
        }}
        transition={{
          type:
            "spring",
          stiffness:
            300,
          damping: 30,
        }}
        className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col border-l border-border bg-background shadow-2xl"
      >
        {/* HEADER */}

        <div className="relative overflow-hidden border-b border-emerald-400/20 bg-[linear-gradient(135deg,#10B981_0%,#059669_55%,#047857_100%)] px-5 py-5 text-white sm:px-6">
          <motion.div
            aria-hidden
            animate={{
              scale: [
                1,
                1.15,
                1,
              ],
              x: [
                0,
                18,
                0,
              ],
            }}
            transition={{
              duration: 9,
              repeat:
                Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/15 blur-3xl"
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  Conversation History
                </p>

                <h2 className="mt-1 truncate text-sm font-black text-white">
                  Support Conversation
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-muted" />
              <div className="h-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                  {
                    error
                  }
                </p>
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* CASE HEADER */}

              <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">
                    {
                      detail.ticketNumber
                    }
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                      priorityClasses[
                        detail.priority
                      ] ??
                      priorityClasses.Normal
                    }`}
                  >
                    {
                      detail.priority
                    }
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                      statusClasses[
                        detail.status
                      ] ??
                      "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {
                      detail.status
                    }
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-black leading-7 text-foreground">
                  {
                    detail.subject
                  }
                </h3>

                <p className="mt-2 text-xs text-muted-foreground">
                  {
                    detail.category
                  }
                </p>
              </section>

              {/* CUSTOMER / ASSIGNEE */}

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-emerald-600" />

                    <h3 className="text-xs font-black text-foreground">
                      Customer
                    </h3>
                  </div>

                  <p className="mt-3 text-sm font-black text-foreground">
                    {
                      detail.customer
                        .name
                    }
                  </p>

                  <p className="mt-1 break-all text-[10px] text-muted-foreground">
                    {
                      detail.customer
                        .email
                    }
                  </p>
                </div>

                <div className="rounded-[22px] border border-border bg-card p-4">
                  <h3 className="text-xs font-black text-foreground">
                    Assignee
                  </h3>

                  {detail.assignee ? (
                    <>
                      <p className="mt-3 text-sm font-black text-foreground">
                        {
                          detail.assignee
                            .name
                        }
                      </p>

                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-muted-foreground">
                        {
                          detail.assignee
                            .role
                        }
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-xs font-bold text-muted-foreground">
                      Unassigned
                    </p>
                  )}
                </div>
              </section>

              {/* META */}

              <section className="rounded-[22px] border border-emerald-500/15 bg-emerald-500/[0.045] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="Waiting On"
                    value={
                      detail.waitingOn
                    }
                  />

                  <InfoBlock
                    label="Created"
                    value={formatDateTime(
                      detail.createdAt
                    )}
                  />

                  <InfoBlock
                    label="Last Activity"
                    value={formatDateTime(
                      detail.lastActivityAt
                    )}
                  />

                  <InfoBlock
                    label="Messages"
                    value={String(
                      detail.messages.length
                    )}
                  />
                </div>
              </section>

              {/* MESSAGES */}

              <section className="rounded-[24px] border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      Message History
                    </h3>

                    <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
                      Full ticket conversation
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                    {
                      detail.messages.length
                    }
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {detail.messages.length ===
                  0 ? (
                    <div className="rounded-2xl bg-muted/40 p-8 text-center">
                      <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/50" />

                      <p className="mt-3 text-xs font-black text-muted-foreground">
                        No messages found
                      </p>
                    </div>
                  ) : (
                    detail.messages.map(
                      (
                        message
                      ) => {
                        const isCustomer =
                          message.authorType ===
                          "customer";

                        const isInternal =
                          message.visibility ===
                          "internal";

                        return (
                          <div
                            key={
                              message.id
                            }
                            className={`rounded-2xl border p-4 ${
                              isInternal
                                ? "border-amber-500/20 bg-amber-500/[0.07]"
                                : isCustomer
                                  ? "border-sky-500/15 bg-sky-500/[0.05]"
                                  : "border-violet-500/15 bg-violet-500/[0.05]"
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-black text-foreground">
                                    {
                                      message.authorName
                                    }
                                  </p>

                                  {message.authorRole ? (
                                    <span className="rounded-full bg-background/80 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-muted-foreground">
                                      {
                                        message.authorRole
                                      }
                                    </span>
                                  ) : null}

                                  <span
                                    className={`rounded-full px-2 py-1 text-[8px] font-black ${
                                      isInternal
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                        : "bg-background text-muted-foreground"
                                    }`}
                                  >
                                    {isInternal
                                      ? "Internal"
                                      : "Public"}
                                  </span>
                                </div>
                              </div>

                              <span className="shrink-0 text-[8px] font-semibold text-muted-foreground">
                                {formatDateTime(
                                  message.createdAt
                                )}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-foreground/85">
                              {
                                message.body
                              }
                            </p>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </motion.aside>
    </motion.div>
  );
}

/* =========================================================
   INFO BLOCK
========================================================= */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-foreground">
        {
          value ||
          "—"
        }
      </p>
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
      {
        children
      }
    </motion.button>
  );
}

/* =========================================================
   TABLE SKELETON
========================================================= */

function TableSkeleton() {
  return (
    <>
      {Array.from({
        length: 7,
      }).map(
        (
          _,
          index
        ) => (
          <tr
            key={
              index
            }
            className="border-b border-border"
          >
            {Array.from({
              length: 7,
            }).map(
              (
                __,
                cellIndex
              ) => (
                <td
                  key={
                    cellIndex
                  }
                  className="px-5 py-5"
                >
                  <div className="h-9 animate-pulse rounded-xl bg-muted" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}
