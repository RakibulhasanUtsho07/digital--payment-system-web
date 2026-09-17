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
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportAttention,
  type SupportMetrics,
  type SupportTicketDetail,
  type SupportTicketSummary,
  type TicketCategory,
  type TicketListQuery,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   OPTIONS
========================================================= */

const STATUS_OPTIONS: Array<
  TicketStatus | "All"
> = [
  "All",
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Escalated",
  "Resolved",
];

const PRIORITY_OPTIONS: Array<
  TicketPriority | "All"
> = [
  "All",
  "Urgent",
  "High",
  "Normal",
  "Low",
];

const CATEGORY_OPTIONS: Array<
  TicketCategory | "All"
> = [
  "All",
  "Transfer",
  "Withdrawal",
  "Deposit",
  "KYC",
  "Security",
  "Account",
  "Payment",
  "Other",
];

/* =========================================================
   EMPTY STATES
========================================================= */

const EMPTY_METRICS: SupportMetrics = {
  openTickets: 0,
  pendingReplies: 0,
  slaRisk: 0,
  breached: 0,
  resolvedToday: 0,
  csat: null,
  unassigned: 0,
  escalated: 0,
};

const EMPTY_ATTENTION: SupportAttention = {
  slaDueSoon: 0,
  priorityWaiting: 0,
  escalated: 0,
  unassigned: 0,
};

/* =========================================================
   PAGE
========================================================= */

export default function SupportDashboardPage() {
  const [
    metrics,
    setMetrics,
  ] = useState<SupportMetrics>(
    EMPTY_METRICS
  );

  const [
    attention,
    setAttention,
  ] = useState<SupportAttention>(
    EMPTY_ATTENTION
  );

  const [
    tickets,
    setTickets,
  ] = useState<
    SupportTicketSummary[]
  >([]);

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState<string | null>(
    null
  );

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState<SupportTicketDetail | null>(
    null
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    TicketStatus | "All"
  >("All");

  const [
    priority,
    setPriority,
  ] = useState<
    TicketPriority | "All"
  >("All");

  const [
    category,
    setCategory,
  ] = useState<
    TicketCategory | "All"
  >("All");

  const [
    sla,
    setSla,
  ] = useState<
    "All" | "Due Soon" | "Breached"
  >("All");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pages,
    setPages,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

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
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState("");

  /* =======================================================
     QUERY
  ======================================================= */

  const query: TicketListQuery =
    useMemo(
      () => ({
        search:
          search.trim() ||
          undefined,

        status,

        priority,

        category,

        sla,

        page,

        limit: 20,
      }),
      [
        search,
        status,
        priority,
        category,
        sla,
        page,
      ]
    );

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        mode:
          | "load"
          | "refresh" = "load"
      ) => {
        if (
          mode ===
          "load"
        ) {
          setLoading(
            true
          );
        } else {
          setRefreshing(
            true
          );
        }

        setError("");

        try {
          const [
            overview,
            queue,
          ] =
            await Promise.all([
              supportDashboardApi.getOverview(),

              supportDashboardApi.getTickets(
                query
              ),
            ]);

          setMetrics(
            overview.metrics
          );

          setAttention(
            overview.attention
          );

          setTickets(
            queue.tickets
          );

          setPages(
            queue.pagination.pages
          );

          setTotal(
            queue.pagination.total
          );
        } catch (
          dashboardError: unknown
        ) {
          setError(
            dashboardError instanceof
              Error
              ? dashboardError.message
              : "Unable to load Support Dashboard."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [query]
    );

  /* =======================================================
     INITIAL LOAD / FILTER LOAD
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadDashboard(
            "load"
          );
        },
        180
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loadDashboard,
  ]);

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
    priority,
    category,
    sla,
  ]);

  /* =======================================================
     TOAST
  ======================================================= */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast("");
        },
        2600
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  /* =======================================================
     LOAD SELECTED TICKET
  ======================================================= */

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(
        null
      );

      return;
    }

    let active = true;

    void supportDashboardApi
      .getTicket(
        selectedTicketId
      )
      .then(
        (
          response
        ) => {
          if (!active) {
            return;
          }

          setSelectedTicket(
            response.ticket
          );
        }
      )
      .catch(
        (
          ticketError: unknown
        ) => {
          if (!active) {
            return;
          }

          setToast(
            ticketError instanceof
              Error
              ? ticketError.message
              : "Unable to load ticket."
          );
        }
      );

    return () => {
      active = false;
    };
  }, [
    selectedTicketId,
  ]);

  /* =======================================================
     FILTER HELPERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");
      setStatus("All");
      setPriority(
        "All"
      );
      setCategory(
        "All"
      );
      setSla("All");
      setPage(1);
    };

  const activeFilterCount =
    [
      status !== "All",
      priority !== "All",
      category !== "All",
      sla !== "All",
    ].filter(
      Boolean
    ).length;

  const applyAttentionFilter =
    (
      type:
        | "sla"
        | "priority"
        | "escalated"
        | "unassigned"
    ) => {
      setSearch("");

      if (
        type ===
        "sla"
      ) {
        setSla(
          "Due Soon"
        );

        setStatus(
          "All"
        );

        setPriority(
          "All"
        );
      }

      if (
        type ===
        "priority"
      ) {
        setPriority(
          "Urgent"
        );

        setStatus(
          "All"
        );

        setSla(
          "All"
        );
      }

      if (
        type ===
        "escalated"
      ) {
        setStatus(
          "Escalated"
        );

        setPriority(
          "All"
        );

        setSla(
          "All"
        );
      }

      if (
        type ===
        "unassigned"
      ) {
        setStatus(
          "All"
        );

        setPriority(
          "All"
        );

        setSla(
          "All"
        );

        setToast(
          "Open an unassigned ticket to assign an owner."
        );
      }

      window.setTimeout(
        () => {
          document
            .getElementById(
              "support-agent-queue"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });
        },
        50
      );
    };

  /* =======================================================
     REFRESH SELECTED TICKET
  ======================================================= */

  const refreshSelectedTicket =
    async (
      ticketId: string
    ) => {
      const response =
        await supportDashboardApi.getTicket(
          ticketId
        );

      setSelectedTicket(
        response.ticket
      );

      await loadDashboard(
        "refresh"
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-card-foreground sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <SupportAgentHeader
          refreshing={
            refreshing
          }
          onRefresh={() =>
            void loadDashboard(
              "refresh"
            )
          }
        />

        {/* =================================================
            OPERATIONS SNAPSHOT
        ================================================= */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Open Tickets"
            value={
              metrics.openTickets
            }
            icon={Inbox}
            accent="blue"
            loading={
              loading
            }
          />

          <MetricCard
            title="Pending Replies"
            value={
              metrics.pendingReplies
            }
            icon={
              MessageCircle
            }
            accent="cyan"
            loading={
              loading
            }
          />

          <MetricCard
            title="SLA At Risk"
            value={
              metrics.slaRisk
            }
            icon={Clock3}
            accent="amber"
            loading={
              loading
            }
          />

          <MetricCard
            title="Resolved Today"
            value={
              metrics.resolvedToday
            }
            icon={
              CheckCircle2
            }
            accent="green"
            loading={
              loading
            }
          />
        </section>

        {/* =================================================
            SUPPORT STATUS
        ================================================= */}

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallMetric
            label="SLA Breached"
            value={
              metrics.breached
            }
            icon={
              ShieldAlert
            }
            tone={
              metrics.breached >
              0
                ? "danger"
                : "success"
            }
          />

          <SmallMetric
            label="Unassigned"
            value={
              metrics.unassigned
            }
            icon={
              UsersRound
            }
            tone={
              metrics.unassigned >
              0
                ? "warning"
                : "success"
            }
          />

          <SmallMetric
            label="Escalated"
            value={
              metrics.escalated
            }
            icon={
              AlertCircle
            }
            tone={
              metrics.escalated >
              0
                ? "warning"
                : "success"
            }
          />

          <SmallMetric
            label="CSAT"
            value={
              metrics.csat ===
              null
                ? "—"
                : `${metrics.csat.toFixed(
                    1
                  )}%`
            }
            icon={
              Sparkles
            }
            tone="ai"
          />
        </section>

        {/* =================================================
            ATTENTION
        ================================================= */}

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />

            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Attention Required
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AttentionCard
              title="SLA Due Soon"
              value={
                attention.slaDueSoon
              }
              description="Tickets may breach within the next 15 minutes."
              action="Review Queue"
              icon={Clock3}
              accent="rose"
              onClick={() =>
                applyAttentionFilter(
                  "sla"
                )
              }
            />

            <AttentionCard
              title="Priority Waiting"
              value={
                attention.priorityWaiting
              }
              description="Urgent and high-priority customers need attention."
              action="Open Priority"
              icon={Zap}
              accent="amber"
              onClick={() =>
                applyAttentionFilter(
                  "priority"
                )
              }
            />

            <AttentionCard
              title="Escalated Cases"
              value={
                attention.escalated
              }
              description="Cases that need higher-level support review."
              action="Review Escalations"
              icon={
                ShieldAlert
              }
              accent="violet"
              onClick={() =>
                applyAttentionFilter(
                  "escalated"
                )
              }
            />

            <AttentionCard
              title="Unassigned Queue"
              value={
                attention.unassigned
              }
              description="Tickets that still need a clear owner."
              action="Find Tickets"
              icon={
                UsersRound
              }
              accent="green"
              onClick={() =>
                applyAttentionFilter(
                  "unassigned"
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            QUEUE
        ================================================= */}

        <section
          id="support-agent-queue"
          className="mt-6 overflow-hidden rounded-[26px] border border-border bg-card shadow-[0_12px_42px_rgba(15,39,69,0.06)]"
        >
          <div className="border-b border-border bg-muted p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-emerald-600" />

                  <h2 className="text-sm font-black">
                    Support Queue
                  </h2>
                </div>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {total.toLocaleString()}{" "}
                  tickets available for support operations
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search ticket, customer or subject..."
                    className="
                      h-11
                      w-full
                      rounded-2xl
                      border
                      border-border
                      bg-card
                      pl-9
                      pr-3
                      text-xs
                      outline-none
                      placeholder:text-muted-foreground
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    px-4
                    text-xs
                    font-black
                    text-card-foreground
                    transition
                    hover:border-emerald-300
                    hover:bg-emerald-50/60
                  "
                >
                  <Filter className="h-4 w-4" />

                  Filters

                  {activeFilterCount >
                  0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] text-white">
                      {
                        activeFilterCount
                      }
                    </span>
                  ) : null}
                </button>

                {(
                  activeFilterCount >
                    0 ||
                  Boolean(
                    search
                  )
                ) ? (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="h-11 rounded-2xl px-3 text-[10px] font-black text-muted-foreground hover:bg-muted"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <AnimatePresence initial={false}>
            {filtersOpen ? (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className="overflow-hidden border-b border-border bg-card"
              >
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">

                  <FilterSelect
                    label="Status"
                    value={
                      status
                    }
                    options={
                      STATUS_OPTIONS
                    }
                    onChange={(
                      value
                    ) =>
                      setStatus(
                        value as
                          | TicketStatus
                          | "All"
                      )
                    }
                  />

                  <FilterSelect
                    label="Priority"
                    value={
                      priority
                    }
                    options={
                      PRIORITY_OPTIONS
                    }
                    onChange={(
                      value
                    ) =>
                      setPriority(
                        value as
                          | TicketPriority
                          | "All"
                      )
                    }
                  />

                  <FilterSelect
                    label="Category"
                    value={
                      category
                    }
                    options={
                      CATEGORY_OPTIONS
                    }
                    onChange={(
                      value
                    ) =>
                      setCategory(
                        value as
                          | TicketCategory
                          | "All"
                      )
                    }
                  />

                  <FilterSelect
                    label="SLA"
                    value={
                      sla
                    }
                    options={[
                      "All",
                      "Due Soon",
                      "Breached",
                    ]}
                    onChange={(
                      value
                    ) =>
                      setSla(
                        value as
                          | "All"
                          | "Due Soon"
                          | "Breached"
                      )
                    }
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <div
              className="
                border-b
                border-rose-200
                bg-rose-50
                px-5
                py-3
                text-xs
                font-semibold
                text-rose-700
              "
            >
              {error}
            </div>
          ) : null}

          {/* =================================================
              TICKETS
          ================================================= */}

          <SupportQueue
            loading={
              loading
            }
            tickets={
              tickets
            }
            onOpen={
              setSelectedTicketId
            }
          />

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col gap-3 border-t border-border bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground">
              {total.toLocaleString()}{" "}
              total tickets
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  page <=
                  1
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      current -
                      1
                  )
                }
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-border
                  bg-card
                  text-muted-foreground
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                {page} /{" "}
                {Math.max(
                  1,
                  pages
                )}
              </span>

              <button
                type="button"
                disabled={
                  page >=
                  pages
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-border
                  bg-card
                  text-muted-foreground
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* =================================================
          TICKET DRAWER
      ================================================= */}

      <AnimatePresence>
        {selectedTicketId ? (
          <>
            <motion.button
              type="button"
              aria-label="Close ticket"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setSelectedTicketId(
                  null
                )
              }
              className="
                fixed
                inset-0
                z-40
                bg-slate-950/40
                backdrop-blur-[2px]
              "
            />

            <SupportTicketDrawer
              ticket={
                selectedTicket
              }
              onClose={() =>
                setSelectedTicketId(
                  null
                )
              }
              onUpdated={async (
                ticketId,
                message
              ) => {
                setToast(
                  message
                );

                await refreshSelectedTicket(
                  ticketId
                );
              }}
            />
          </>
        ) : null}
      </AnimatePresence>

      {/* =================================================
          TOAST
      ================================================= */}

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              x: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="
              fixed
              right-4
              top-4
              z-[120]
              w-[calc(100%-2rem)]
              max-w-sm
              rounded-2xl
              border
              border-emerald-200
              bg-card
              p-4
              shadow-2xl
            "
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

              <div>
                <p className="text-xs font-black">
                  Support Workspace
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {toast}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   HEADER
========================================================= */

function SupportAgentHeader({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-[#D8E9E2]
        bg-gradient-to-br
        from-[#0B2A27]
        via-[#0F493D]
        to-[#147A5A]
        p-5
        text-white
        shadow-[0_18px_55px_rgba(15,70,55,0.18)]
        md:p-6
      "
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-200/20
                bg-emerald-300/10
                px-2.5
                py-1
                text-[9px]
                font-black
                uppercase
                tracking-[0.14em]
                text-emerald-100
              "
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />

              Support Workspace
            </span>

            <span
              className="
                rounded-full
                border
                border-white/10
                bg-white/10
                px-2.5
                py-1
                text-[9px]
                font-black
                text-white/80
              "
            >
              Support Agent
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-[30px]">
            Support Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50/70">
            Investigate customer issues,
            manage conversations, monitor SLA
            risk, and resolve cases from one
            focused support workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={
            onRefresh
          }
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-2xl
            border
            border-white/15
            bg-white/10
            px-4
            text-xs
            font-black
            text-white
            transition
            hover:bg-white/15
          "
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent:
    | "blue"
    | "green"
    | "amber"
    | "cyan";
  loading: boolean;
}) {
  const tone = {
    blue: {
      wrap:
        "bg-blue-50 text-blue-600",
      line:
        "bg-blue-500",
    },

    green: {
      wrap:
        "bg-emerald-50 text-emerald-600",
      line:
        "bg-emerald-500",
    },

    amber: {
      wrap:
        "bg-amber-50 text-amber-600",
      line:
        "bg-amber-500",
    },

    cyan: {
      wrap:
        "bg-cyan-50 text-cyan-700",
      line:
        "bg-cyan-500",
    },
  }[accent];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-border
        bg-card
        p-4
        shadow-[0_8px_28px_rgba(15,39,69,0.04)]
      "
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${tone.line}`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.wrap}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {loading ? (
          <span className="h-7 w-12 animate-pulse rounded-lg bg-muted" />
        ) : (
          <span className="text-2xl font-black">
            {value}
          </span>
        )}
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
    </motion.div>
  );
}

/* =========================================================
   SMALL METRIC
========================================================= */

function SmallMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone:
    | "danger"
    | "warning"
    | "success"
    | "ai";
}) {
  const styles = {
    danger:
      "bg-rose-50 text-rose-600 border-rose-100",

    warning:
      "bg-amber-50 text-amber-600 border-amber-100",

    success:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    ai:
      "bg-violet-50 text-violet-600 border-violet-100",
  }[tone];

  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-[20px]
        border
        border-border
        bg-card
        p-4
      "
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${styles}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>

      <p className="text-lg font-black">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ATTENTION CARD
========================================================= */

function AttentionCard({
  title,
  value,
  description,
  action,
  icon: Icon,
  accent,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  action: string;
  icon: React.ElementType;
  accent:
    | "rose"
    | "amber"
    | "violet"
    | "green";
  onClick: () => void;
}) {
  const tone = {
    rose: {
      icon:
        "bg-rose-50 text-rose-600",
      action:
        "text-rose-600",
      line:
        "bg-rose-500",
    },

    amber: {
      icon:
        "bg-amber-50 text-amber-600",
      action:
        "text-amber-700",
      line:
        "bg-amber-500",
    },

    violet: {
      icon:
        "bg-violet-50 text-violet-600",
      action:
        "text-violet-600",
      line:
        "bg-violet-500",
    },

    green: {
      icon:
        "bg-emerald-50 text-emerald-600",
      action:
        "text-emerald-700",
      line:
        "bg-emerald-500",
    },
  }[accent];

  return (
    <motion.button
      type="button"
      onClick={
        onClick
      }
      whileHover={{
        y: -2,
      }}
      className="
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-border
        bg-card
        p-4
        text-left
        shadow-[0_8px_28px_rgba(15,39,69,0.04)]
      "
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${tone.line}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-2xl font-black">
          {value}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-black">
        {title}
      </h3>

      <p className="mt-1 min-h-10 text-[10px] leading-5 text-muted-foreground">
        {description}
      </p>

      <span
        className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black ${tone.action}`}
      >
        {action}

        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </motion.button>
  );
}

/* =========================================================
   FILTER
========================================================= */

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>

      <div className="relative">
        <select
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="
            h-11
            w-full
            appearance-none
            rounded-2xl
            border
            border-border
            bg-card
            px-3
            pr-9
            text-xs
            font-bold
            outline-none
            focus:border-emerald-400
            focus:ring-4
            focus:ring-emerald-500/10
          "
        >
          {options.map(
            (
              option
            ) => (
              <option
                key={
                  option
                }
                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  );
}

/* =========================================================
   SUPPORT QUEUE
========================================================= */

function SupportQueue({
  loading,
  tickets,
  onOpen,
}: {
  loading: boolean;
  tickets: SupportTicketSummary[];
  onOpen: (
    id: string
  ) => void;
}) {
  if (
    loading
  ) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({
          length: 6,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="h-16 animate-pulse rounded-2xl bg-muted"
            />
          )
        )}
      </div>
    );
  }

  if (
    tickets.length ===
    0
  ) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
        <Inbox className="h-7 w-7 text-muted-foreground/40" />

        <h3 className="mt-3 text-sm font-black">
          No tickets found
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Try changing the search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left">
        <thead>
          <tr className="border-b border-border bg-muted">
            {[
              "Ticket",
              "Customer",
              "Issue",
              "Priority",
              "Status",
              "Owner",
              "SLA",
            ].map(
              (
                label
              ) => (
                <th
                  key={
                    label
                  }
                  className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-muted-foreground"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {tickets.map(
            (
              ticket,
              index
            ) => (
              <motion.tr
                key={
                  ticket.id
                }
                initial={{
                  opacity: 0,
                  y: 4,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.025,
                }}
                onClick={() =>
                  onOpen(
                    ticket.id
                  )
                }
                className="
                  group
                  cursor-pointer
                  bg-card
                  transition
                  hover:bg-emerald-50/30
                "
              >
                <td className="px-5 py-4">
                  <p className="text-xs font-black text-emerald-700">
                    {
                      ticket.ticketNumber
                    }
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {formatRelativeTime(
                      ticket.lastActivityAt
                    )}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[9px] font-black text-emerald-700">
                      {getInitials(
                        ticket.customerName
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate text-xs font-black">
                        {
                          ticket.customerName
                        }
                      </p>

                      <p className="mt-0.5 max-w-[190px] truncate text-[9px] text-muted-foreground">
                        {
                          ticket.customerEmail
                        }
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="max-w-[300px] truncate text-xs font-bold">
                    {
                      ticket.subject
                    }
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {
                      ticket.category
                    }
                  </p>
                </td>

                <td className="px-5 py-4">
                  <PriorityBadge
                    priority={
                      ticket.priority
                    }
                  />
                </td>

                <td className="px-5 py-4">
                  <StatusBadge
                    status={
                      ticket.status
                    }
                  />
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`text-[10px] font-black ${
                      ticket.assignee.id
                        ? "text-card-foreground"
                        : "text-amber-700"
                    }`}
                  >
                    {
                      ticket
                        .assignee
                        .name
                    }
                  </span>
                </td>

                <td className="px-5 py-4">
                  <SlaBadge
                    minutes={
                      ticket.slaMinutes
                    }
                    breached={
                      ticket.slaBreached
                    }
                  />
                </td>
              </motion.tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function SupportTicketDrawer({
  ticket,
  onClose,
  onUpdated,
}: {
  ticket:
    | SupportTicketDetail
    | null;

  onClose: () => void;

  onUpdated: (
    ticketId: string,
    message: string
  ) => Promise<void>;
}) {
  const [
    reply,
    setReply,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState<
    string | null
  >(null);

  const [
    tab,
    setTab,
  ] = useState<
    "conversation" | "activity"
  >(
    "conversation"
  );

  const run =
    async (
      action: string,
      work: () =>
        Promise<unknown>,
      successMessage: string
    ) => {
      if (!ticket) {
        return;
      }

      setBusy(
        action
      );

      try {
        await work();

        await onUpdated(
          ticket.id,
          successMessage
        );
      } catch (
        actionError: unknown
      ) {
        window.alert(
          actionError instanceof
            Error
            ? actionError.message
            : "Support action failed."
        );
      } finally {
        setBusy(
          null
        );
      }
    };

  const submitReply =
    () => {
      const body =
        reply.trim();

      if (!body) {
        return;
      }

      void run(
        "reply",

        () =>
          supportDashboardApi.addReply(
            ticket!.id,
            body
          ),

        "Reply sent successfully."
      ).then(
        () =>
          setReply("")
      );
    };

  const submitNote =
    () => {
      const body =
        note.trim();

      if (!body) {
        return;
      }

      void run(
        "note",

        () =>
          supportDashboardApi.addInternalNote(
            ticket!.id,
            body
          ),

        "Internal note added."
      ).then(
        () =>
          setNote("")
      );
    };

  if (!ticket) {
    return (
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
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl items-center justify-center bg-card shadow-2xl"
      >
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </motion.aside>
    );
  }

  return (
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
        type: "spring",
        stiffness: 240,
        damping: 28,
      }}
      className="
        fixed
        inset-y-0
        right-0
        z-50
        flex
        w-full
        max-w-3xl
        flex-col
        bg-card
        shadow-[-20px_0_60px_rgba(15,39,69,0.16)]
      "
    >
      {/* HEADER */}

      <div className="border-b border-border bg-muted p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-emerald-700">
                {
                  ticket.ticketNumber
                }
              </span>

              <PriorityBadge
                priority={
                  ticket.priority
                }
              />

              <StatusBadge
                status={
                  ticket.status
                }
              />
            </div>

            <h2 className="mt-3 text-xl font-black">
              {
                ticket.subject
              }
            </h2>

            <p className="mt-1 text-[10px] text-muted-foreground">
              {
                ticket.category
              }
              {" • "}
              opened{" "}
              {formatRelativeTime(
                ticket.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CONTEXT */}

      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-3">
        <ContextCard
          label="Customer"
          value={
            ticket.customer
              .name
          }
          subvalue={
            ticket.customer
              .email
          }
          icon={
            UserRound
          }
        />

        <ContextCard
          label="KYC"
          value={toTitleCase(
            ticket.customer
              .kycStatus
          )}
          subvalue={
            ticket.customer
              .walletLinked
              ? "Wallet linked"
              : "No wallet link"
          }
          icon={
            ShieldAlert
          }
        />

        <ContextCard
          label="SLA"
          value={
            ticket.slaBreached
              ? "Breached"
              : formatSla(
                  ticket.slaMinutes
                )
          }
          subvalue={
            ticket.assignee
              .name
          }
          icon={
            Clock3
          }
        />
      </div>

      {/* TABS */}

      <div className="flex border-b border-border px-4">
        <button
          type="button"
          onClick={() =>
            setTab(
              "conversation"
            )
          }
          className={`border-b-2 px-4 py-3 text-[10px] font-black ${
            tab ===
            "conversation"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Conversation
        </button>

        <button
          type="button"
          onClick={() =>
            setTab(
              "activity"
            )
          }
          className={`border-b-2 px-4 py-3 text-[10px] font-black ${
            tab ===
            "activity"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Activity
        </button>
      </div>

      {/* CONTENT */}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab ===
        "conversation" ? (
          <div className="space-y-3">

            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Customer issue
              </p>

              <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
                {
                  ticket.description
                }
              </p>
            </div>

            <div className="space-y-3">
              {ticket.messages.map(
                (
                  message
                ) => {
                  const internal =
                    message.visibility ===
                    "internal";

                  const agent =
                    message.authorType ===
                    "admin";

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`rounded-2xl border p-3 ${
                        internal
                          ? "border-amber-200 bg-amber-50"
                          : agent
                            ? "border-emerald-100 bg-emerald-50/60"
                            : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-black">
                          {
                            message.authorName
                          }
                        </p>

                        <span className="text-[8px] text-muted-foreground">
                          {
                            message.createdAt
                          }
                        </span>
                      </div>

                      {internal ? (
                        <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-700">
                          INTERNAL NOTE
                        </span>
                      ) : null}

                      <p className="mt-2 whitespace-pre-wrap text-[10px] leading-5 text-muted-foreground">
                        {
                          message.body
                        }
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            {/* REPLY */}

            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                Public Reply
              </p>

              <textarea
                value={
                  reply
                }
                onChange={(
                  event
                ) =>
                  setReply(
                    event.target
                      .value
                  )
                }
                rows={4}
                maxLength={4000}
                placeholder="Write a response..."
                className="
                  mt-3
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-border
                  bg-card
                  p-3
                  text-xs
                  leading-5
                  outline-none
                  focus:border-emerald-400
                "
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={
                    busy !==
                      null ||
                    !reply.trim()
                  }
                  onClick={
                    submitReply
                  }
                  className="
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-xl
                    bg-[#16A66A]
                    px-3
                    text-[10px]
                    font-black
                    text-white
                    hover:bg-[#128D59]
                    disabled:opacity-50
                  "
                >
                  {busy ===
                  "reply" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5" />
                  )}

                  Send Reply
                </button>
              </div>
            </div>

            {/* NOTE */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
                Internal Note
              </p>

              <textarea
                value={
                  note
                }
                onChange={(
                  event
                ) =>
                  setNote(
                    event.target
                      .value
                  )
                }
                rows={3}
                maxLength={4000}
                placeholder="Add an internal note..."
                className="
                  mt-3
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-amber-200
                  bg-white
                  p-3
                  text-xs
                  leading-5
                  outline-none
                  focus:border-amber-400
                "
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={
                    busy !==
                      null ||
                    !note.trim()
                  }
                  onClick={
                    submitNote
                  }
                  className="
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-xl
                    bg-amber-600
                    px-3
                    text-[10px]
                    font-black
                    text-white
                    hover:bg-amber-700
                    disabled:opacity-50
                  "
                >
                  {busy ===
                  "note" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}

                  Add Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {ticket.activity.map(
              (
                item
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="rounded-2xl border border-border bg-card p-3"
                >
                  <p className="text-[10px] font-black">
                    {
                      item.summary
                    }
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {
                      item.actorName
                    }
                    {" • "}
                    {
                      item.createdAt
                    }
                  </p>
                </div>
              )
            )}

            {ticket.activity.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-xs font-black">
                  No activity yet
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Ticket activity will appear here.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

/* =========================================================
   CONTEXT CARD
========================================================= */

function ContextCard({
  label,
  value,
  subvalue,
  icon: Icon,
}: {
  label: string;
  value: string;
  subvalue: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-black">
            {value}
          </p>

          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
            {subvalue}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PRIORITY BADGE
========================================================= */

function PriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  const config: Record<
    TicketPriority,
    string
  > = {
    Urgent:
      "bg-rose-50 text-rose-700",

    High:
      "bg-amber-50 text-amber-700",

    Normal:
      "bg-blue-50 text-blue-700",

    Low:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[8px] font-black ${config[priority]}`}
    >
      {priority}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: TicketStatus;
}) {
  const config: Record<
    TicketStatus,
    string
  > = {
    Open:
      "bg-blue-50 text-blue-700",

    "In Progress":
      "bg-indigo-50 text-indigo-700",

    "Waiting for Customer":
      "bg-amber-50 text-amber-700",

    Escalated:
      "bg-violet-50 text-violet-700",

    Resolved:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[8px] font-black ${config[status]}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   SLA BADGE
========================================================= */

function SlaBadge({
  minutes,
  breached,
}: {
  minutes: number;
  breached: boolean;
}) {
  if (
    breached
  ) {
    return (
      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[8px] font-black text-rose-700">
        Breached
      </span>
    );
  }

  if (
    minutes <=
    15
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[8px] font-black text-amber-700">
        {formatSla(
          minutes
        )}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
      {formatSla(
        minutes
      )}
    </span>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string
) {
  return (
    name
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (
          part
        ) =>
          part[0] ??
          ""
      )
      .join("")
      .toUpperCase() ||
    "U"
  );
}

function formatSla(
  minutes: number
) {
  if (
    !Number.isFinite(
      minutes
    )
  ) {
    return "—";
  }

  if (
    minutes < 60
  ) {
    return `${Math.max(
      0,
      Math.round(
        minutes
      )
    )}m`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  const remaining =
    Math.round(
      minutes %
        60
    );

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}

function formatRelativeTime(
  value: string
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
    return "Unknown";
  }

  const diff =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      diff /
        60000
    );

  if (
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  return `${days}d ago`;
}

function toTitleCase(
  value: string
) {
  return value
    .replace(
      /_/g,
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