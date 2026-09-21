"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportTicketDetail,
  type SupportTicketSummary,
  type TicketCategory,
  type TicketListQuery,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportDashboardApi";

import SupportAiCopilot from "@/components/dashboard/support/SupportAiCopilot";

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

const SLA_OPTIONS = [
  "All",
  "Due Soon",
  "Breached",
] as const;

type SlaFilter =
  (typeof SLA_OPTIONS)[number];

/* =========================================================
   PAGE
========================================================= */

export default function SupportTicketsPage() {
  /* =======================================================
     TICKETS
  ======================================================= */

  const [
    tickets,
    setTickets,
  ] = useState<
    SupportTicketSummary[]
  >([]);

  /* =======================================================
     SELECTED TICKET
  ======================================================= */

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState<string | null>(
    null
  );

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState<
    SupportTicketDetail | null
  >(null);

  /* =======================================================
     FILTERS
  ======================================================= */

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
  ] = useState<SlaFilter>(
    "All"
  );

  /* =======================================================
     PAGINATION
  ======================================================= */

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

  /* =======================================================
     UI
  ======================================================= */

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    toast,
    setToast,
  ] = useState<
    string | null
  >(null);

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
     ACTIVE FILTER COUNT
  ======================================================= */

  const activeFilterCount =
    [
      status !== "All",
      priority !== "All",
      category !== "All",
      sla !== "All",
    ].filter(
      Boolean
    ).length;

  /* =======================================================
     LOAD TICKETS
  ======================================================= */

  const loadTickets =
    useCallback(
      async (
        mode:
          | "load"
          | "refresh" = "load"
      ) => {
        if (
          mode === "load"
        ) {
          setIsLoading(true);
        } else {
          setIsRefreshing(
            true
          );
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getTickets(
              query
            );

          setTickets(
            Array.isArray(
              response.tickets
            )
              ? response.tickets
              : []
          );

          setPages(
            Math.max(
              1,
              response.pagination
                ?.pages ?? 1
            )
          );

          setTotal(
            response.pagination
              ?.total ?? 0
          );
        } catch (
          loadError: unknown
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load support tickets."
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(
            false
          );
        }
      },
      [query]
    );

  /* =======================================================
     LOAD ON QUERY CHANGE
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadTickets(
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
    loadTickets,
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
          setToast(null);
        },
        2800
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
    if (
      !selectedTicketId
    ) {
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
          detailError: unknown
        ) => {
          if (!active) {
            return;
          }

          setToast(
            detailError instanceof
              Error
              ? detailError.message
              : "Unable to load ticket details."
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
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");
      setStatus("All");
      setPriority("All");
      setCategory("All");
      setSla("All");
      setPage(1);
    };

  /* =======================================================
     REFRESH
  ======================================================= */

  const refresh =
    async () => {
      await loadTickets(
        "refresh"
      );

      setToast(
        "Ticket queue refreshed."
      );
    };

  /* =======================================================
     REFRESH SELECTED TICKET
  ======================================================= */

  const refreshSelectedTicket =
    async () => {
      if (
        !selectedTicketId
      ) {
        return;
      }

      try {
        const response =
          await supportDashboardApi.getTicket(
            selectedTicketId
          );

        setSelectedTicket(
          response.ticket
        );

        await loadTickets(
          "refresh"
        );
      } catch (
        detailError: unknown
      ) {
        setToast(
          detailError instanceof
            Error
            ? detailError.message
            : "Unable to refresh ticket."
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="support-ticket-page min-h-screen bg-transparent text-foreground">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <motion.header
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/25 bg-[linear-gradient(135deg,#10B981_0%,#059669_50%,#047857_100%)] text-white shadow-[0_28px_80px_-38px_rgba(5,150,105,.72)]"
        >
          <motion.div
            aria-hidden
            animate={{
              x: [0, 36, -18, 0],
              y: [0, -22, 14, 0],
              scale: [1, 1.18, 0.96, 1],
              opacity: [0.36, 0.68, 0.42, 0.36],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-white/20 blur-[90px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, -28, 18, 0],
              y: [0, 18, -12, 0],
              scale: [1, 1.12, 1, 1],
              opacity: [0.22, 0.48, 0.24, 0.22],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-28 left-[18%] h-72 w-72 rounded-full bg-cyan-200/25 blur-[95px]"
          />

          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute right-[18%] top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-white/15 xl:block"
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,.85)]" />
          </motion.div>

          <motion.div
            aria-hidden
            animate={{
              x: ["-25%", "125%"],
              opacity: [0, 0.34, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1.4,
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]"
          />

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/20 via-white/90 to-cyan-100/50" />

          <div className="relative flex flex-col gap-5 p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.12] text-white backdrop-blur">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">

                    <h1 className="text-2xl font-black tracking-tight text-white">
                      Ticket Queue
                    </h1>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black text-emerald-50 backdrop-blur">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>

                      LIVE
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-emerald-50/80">
                    Investigate customer cases,
                    prioritize SLA risk, and keep
                    every support conversation moving.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-50/65">
                  Queue Size
                </p>

                <p className="mt-0.5 text-sm font-black text-white">
                  {total.toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void refresh()
                }
                disabled={
                  isRefreshing
                }
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 text-xs font-black text-emerald-700 shadow-[0_12px_30px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>
        </motion.header>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <QueueStat
            label="Visible Tickets"
            value={
              isLoading
                ? "..."
                : tickets.length
            }
            icon={Inbox}
            tone="emerald"
          />

          <QueueStat
            label="Urgent"
            value={
              isLoading
                ? "..."
                : tickets.filter(
                    (
                      ticket
                    ) =>
                      ticket.priority ===
                      "Urgent"
                  ).length
            }
            icon={
              AlertCircle
            }
            tone="rose"
          />

          <QueueStat
            label="SLA Risk"
            value={
              isLoading
                ? "..."
                : tickets.filter(
                    (
                      ticket
                    ) =>
                      ticket.slaBreached ||
                      ticket.slaMinutes <=
                        15
                  ).length
            }
            icon={Clock3}
            tone="amber"
          />

          <QueueStat
            label="Unassigned"
            value={
              isLoading
                ? "..."
                : tickets.filter(
                    (
                      ticket
                    ) =>
                      !ticket.assignee.id
                  ).length
            }
            icon={Users}
            tone="violet"
          />
        </section>

        <QueueAnalytics
          tickets={tickets}
          loading={isLoading}
        />

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="mt-5 overflow-visible rounded-[28px] border border-border bg-card shadow-sm">

          <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.055] p-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 flex-1 items-center gap-2">

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="search"
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
                  placeholder="Search ticket, customer, email, reference..."
                  className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-xs font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowFilters(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-xs font-black transition ${
                  showFilters
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-emerald-700"
                }`}
              >
                <Filter className="h-4 w-4" />

                <span className="hidden sm:inline">
                  Filters
                </span>

                {activeFilterCount >
                0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[8px] font-black text-white">
                    {
                      activeFilterCount
                    }
                  </span>
                ) : null}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">

              <p className="text-[10px] font-bold text-muted-foreground">
                {
                  total.toLocaleString()
                }{" "}
                total tickets
              </p>

              {(activeFilterCount >
                0 ||
                search.trim()) ? (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="text-[10px] font-black text-emerald-600 transition hover:text-emerald-800"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <AnimatePresence
            initial={false}
          >
            {showFilters ? (
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
                className="overflow-visible border-b border-border"
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
                    options={
                      SLA_OPTIONS
                    }
                    onChange={(
                      value
                    ) =>
                      setSla(
                        value as SlaFilter
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
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-semibold text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />

                {error}
              </div>
            </div>
          ) : null}

          {/* =================================================
              TABLE
          ================================================= */}

          <TicketQueue
            loading={
              isLoading
            }
            tickets={
              tickets
            }
            onOpen={(
              ticketId
            ) =>
              setSelectedTicketId(
                ticketId
              )
            }
          />

          {/* =================================================
              PAGINATION
          ================================================= */}

          <QueuePagination
            page={
              page
            }
            pages={
              pages
            }
            total={
              total
            }
            onPage={
              setPage
            }
          />
        </section>
      </div>

      {/* ===================================================
          DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selectedTicketId ? (
          <>
            <motion.button
              type="button"
              aria-label="Close ticket drawer"
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
              className="fixed inset-0 z-[70] cursor-default bg-slate-950/30 backdrop-blur-[2px]"
            />

            <TicketDrawer
              ticket={
                selectedTicket
              }
              onClose={() =>
                setSelectedTicketId(
                  null
                )
              }
              onUpdated={
                refreshSelectedTicket
              }
            />
          </>
        ) : null}
      </AnimatePresence>

      {/* ===================================================
          TOAST
      ==================================================== */}

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 15,
            }}
            className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black text-foreground">
                Support Operations
              </p>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                {toast}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style>{`
        .support-ticket-page,
        .support-ticket-page * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .support-ticket-page::-webkit-scrollbar,
        .support-ticket-page *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   QUEUE STAT
========================================================= */

function QueueStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone:
    | "emerald"
    | "rose"
    | "amber"
    | "violet";
}) {
  const theme = {
    emerald: {
      wrap:
        "border-emerald-400/25 bg-emerald-500 text-white shadow-[0_18px_50px_-30px_rgba(16,185,129,.75)]",
      icon:
        "border-white/15 bg-white/15 text-white",
      label:
        "text-emerald-50/75",
      value:
        "text-white",
      glow:
        "bg-white/18",
    },

    rose: {
      wrap:
        "border-rose-500/20 bg-card",
      icon:
        "border-rose-500/15 bg-rose-500/10 text-rose-600 dark:text-rose-300",
      label:
        "text-muted-foreground",
      value:
        "text-foreground",
      glow:
        "bg-rose-500/10",
    },

    amber: {
      wrap:
        "border-amber-500/20 bg-card",
      icon:
        "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-300",
      label:
        "text-muted-foreground",
      value:
        "text-foreground",
      glow:
        "bg-amber-500/10",
    },

    violet: {
      wrap:
        "border-violet-500/20 bg-card",
      icon:
        "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300",
      label:
        "text-muted-foreground",
      value:
        "text-foreground",
      glow:
        "bg-violet-500/10",
    },
  }[tone];

  return (
    <motion.div
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
        scale: 1.008,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className={`group relative overflow-hidden rounded-[24px] border p-4 ${theme.wrap}`}
    >
      <motion.div
        aria-hidden
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.75, 0.35],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${theme.glow}`}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p
          className={`text-[9px] font-black uppercase tracking-[0.14em] ${theme.label}`}
        >
          {label}
        </p>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm ${theme.icon}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p
        className={`relative mt-3 text-2xl font-black ${theme.value}`}
      >
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   QUEUE ANALYTICS
========================================================= */

function QueueAnalytics({
  tickets,
  loading,
}: {
  tickets: SupportTicketSummary[];
  loading: boolean;
}) {
  const statusData =
    useMemo(
      () =>
        STATUS_OPTIONS
          .filter(
            (item) =>
              item !== "All"
          )
          .map(
            (item) => ({
              name: item,
              value:
                tickets.filter(
                  (ticket) =>
                    ticket.status ===
                    item
                ).length,
            })
          )
          .filter(
            (item) =>
              item.value > 0
          ),
      [tickets]
    );

  const priorityData =
    useMemo(
      () =>
        PRIORITY_OPTIONS
          .filter(
            (item) =>
              item !== "All"
          )
          .map(
            (item) => ({
              name: item,
              count:
                tickets.filter(
                  (ticket) =>
                    ticket.priority ===
                    item
                ).length,
            })
          ),
      [tickets]
    );

  const STATUS_CHART_COLORS = [
    "#D1FAE5",
    "#67E8F9",
    "#FDE68A",
    "#FDA4AF",
    "#A7F3D0",
  ];

  return (
    <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
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
        <div className="flex items-start gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <BarChart3 className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
              Current page analytics
            </p>

            <h2 className="mt-0.5 text-sm font-black text-foreground">
              Priority distribution
            </h2>

            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              Real priority mix from the tickets currently returned by the backend.
            </p>
          </div>
        </div>

        <div className="h-[300px] p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={priorityData}
                margin={{
                  top: 14,
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
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill:
                      "var(--muted-foreground)",
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
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
                    fontSize: 11,
                    boxShadow:
                      "0 18px 45px rgba(15,23,42,.12)",
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Tickets"
                  fill="#10B981"
                  radius={[
                    9,
                    9,
                    0,
                    0,
                  ]}
                  isAnimationActive
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
          delay: 0.06,
        }}
        className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-emerald-500 text-white shadow-[0_24px_65px_-36px_rgba(16,185,129,.72)]"
      >
        <motion.div
          aria-hidden
          animate={{
            scale: [1, 1.16, 1],
            opacity: [0.22, 0.5, 0.22],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl"
        />

        <div className="relative border-b border-white/15 px-5 py-4">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-50/75">
            Queue health
          </p>

          <h2 className="mt-0.5 text-sm font-black text-white">
            Status distribution
          </h2>

          <p className="mt-1 text-[9px] leading-4 text-emerald-50/75">
            Live status composition for the currently visible support queue.
          </p>
        </div>

        <div className="relative h-[300px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : statusData.length ===
            0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs font-bold text-emerald-50/70">
              No visible ticket status data yet.
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
                        "#064E3B",
                      color: "#FFFFFF",
                      fontSize: 11,
                    }}
                  />

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={3}
                    stroke="rgba(255,255,255,.85)"
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={
                      1250
                    }
                  >
                    {statusData.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
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

              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-3xl font-black">
                    {tickets.length}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-50/70">
                    Visible
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.article>
    </section>
  );
}

/* =========================================================
   FILTER SELECT
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

    function handleKey(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
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
      handleKey
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );

      document.removeEventListener(
        "keydown",
        handleKey
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
      <span className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-2xl border bg-background px-3.5 text-left outline-none transition ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-border hover:border-emerald-500/35"
        }`}
      >
        <span className="truncate text-xs font-black text-foreground">
          {value}
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
              y: -7,
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
            className="support-scrollbar-hidden absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-64 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.30)] backdrop-blur-xl"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  option === value;

                return (
                  <button
                    key={option}
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
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-emerald-500 text-white"
                        : "text-foreground hover:bg-emerald-500/10"
                    }`}
                  >
                    <span className="truncate text-xs font-extrabold">
                      {option}
                    </span>

                    {active ? (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/15">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
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
   TICKET QUEUE
========================================================= */

function TicketQueue({
  loading,
  tickets,
  onOpen,
}: {
  loading: boolean;
  tickets: SupportTicketSummary[];
  onOpen: (
    ticketId: string
  ) => void;
}) {
  if (
    loading
  ) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({
          length: 7,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="h-20 animate-pulse rounded-2xl bg-muted"
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
      <div className="flex min-h-[360px] items-center justify-center p-8">
        <div className="max-w-sm text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Inbox className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-sm font-black text-foreground">
            No tickets match this view
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Adjust the search or filters to return to the active support queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="support-scrollbar-hidden overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">

        <thead>
          <tr className="border-b border-border bg-muted/40">

            {[
              "Ticket",
              "Customer",
              "Issue",
              "Priority",
              "Status",
              "Owner",
              "SLA",
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
                  className={`px-5 py-3.5 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground ${
                    index ===
                    7
                      ? "text-right"
                      : ""
                  }`}
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
                    0.02,
                }}
                onClick={() =>
                  onOpen(
                    ticket.id
                  )
                }
                className="group cursor-pointer bg-card transition hover:bg-emerald-500/[0.055]"
              >

                {/* TICKET */}

                <td className="px-5 py-4">
                  <p className="text-xs font-black text-emerald-700">
                    {
                      ticket.ticketNumber
                    }
                  </p>

                  <p className="mt-1 text-[8px] text-muted-foreground">
                    {formatRelativeTime(
                      ticket.lastActivityAt
                    )}
                  </p>
                </td>

                {/* CUSTOMER */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 text-[9px] font-black text-emerald-700">
                      {getInitials(
                        ticket.customerName
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate text-xs font-black text-foreground">
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

                {/* ISSUE */}

                <td className="px-5 py-4">
                  <p className="max-w-[260px] truncate text-xs font-bold text-foreground">
                    {
                      ticket.subject
                    }
                  </p>

                  <p className="mt-1 text-[8px] font-semibold text-muted-foreground">
                    {
                      ticket.category
                    }
                  </p>
                </td>

                {/* PRIORITY */}

                <td className="px-5 py-4">
                  <PriorityBadge
                    priority={
                      ticket.priority
                    }
                  />
                </td>

                {/* STATUS */}

                <td className="px-5 py-4">
                  <StatusBadge
                    status={
                      ticket.status
                    }
                  />
                </td>

                {/* OWNER */}

                <td className="px-5 py-4">
                  <p
                    className={`text-[10px] font-black ${
                      ticket.assignee
                        .id
                        ? "text-foreground"
                        : "text-amber-700"
                    }`}
                  >
                    {
                      ticket.assignee
                        .name
                    }
                  </p>
                </td>

                {/* SLA */}

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

                {/* ACTION */}

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      onOpen(
                        ticket.id
                      );
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-card px-3 text-[9px] font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Open

                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
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
   PAGINATION
========================================================= */

function QueuePagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (
    page: number
  ) => void;
}) {
  const safePages =
    Math.max(
      1,
      pages
    );

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

      <p className="text-[10px] font-semibold text-muted-foreground">
        {total.toLocaleString()} total tickets
      </p>

      <div className="flex items-center gap-2">

        <button
          type="button"
          disabled={
            page <= 1
          }
          onClick={() =>
            onPage(
              Math.max(
                1,
                page - 1
              )
            )
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
          {page} / {safePages}
        </span>

        <button
          type="button"
          disabled={
            page >=
            safePages
          }
          onClick={() =>
            onPage(
              Math.min(
                safePages,
                page + 1
              )
            )
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   TICKET DRAWER
========================================================= */

function TicketDrawer({
  ticket,
  onClose,
  onUpdated,
}: {
  ticket:
    | SupportTicketDetail
    | null;

  onClose: () => void;

  onUpdated: () =>
    Promise<void>;
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
    busyAction,
    setBusyAction,
  ] = useState<
    "reply" | "note" | null
  >(null);

  const [
    tab,
    setTab,
  ] = useState<
    "conversation" | "activity"
  >(
    "conversation"
  );

  /* =======================================================
     ACTION
  ======================================================= */

  const runAction =
    async (
      type:
        | "reply"
        | "note",
      body: string
    ) => {
      if (
        !ticket ||
        !body.trim()
      ) {
        return;
      }

      setBusyAction(
        type
      );

      try {
        if (
          type ===
          "reply"
        ) {
          await supportDashboardApi.addReply(
            ticket.id,
            body.trim()
          );

          setReply("");
        } else {
          await supportDashboardApi.addInternalNote(
            ticket.id,
            body.trim()
          );

          setNote("");
        }

        await onUpdated();
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
        setBusyAction(
          null
        );
      }
    };

  /* =======================================================
     DRAWER
  ======================================================= */

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
        damping: 28,
        stiffness: 230,
      }}
      className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-3xl flex-col border-l border-border bg-card shadow-[-24px_0_70px_rgba(15,23,42,0.18)]"
    >
      {!ticket ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* =============================================
              HEADER
          ============================================== */}

          <div className="shrink-0 border-b border-border bg-emerald-500/[0.06] p-5 md:p-6">
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

                <h2 className="mt-3 text-xl font-black leading-7 text-foreground">
                  {
                    ticket.subject
                  }
                </h2>

                <p className="mt-1 text-[9px] text-muted-foreground">
                  {
                    ticket.category
                  }{" "}
                  • opened{" "}
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
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONTEXT */}

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">

              <ContextCard
                label="Customer"
                value={
                  ticket.customer.name
                }
                icon={
                  Users
                }
              />

              <ContextCard
                label="Email"
                value={
                  ticket.customer.email
                }
                icon={
                  MessageSquare
                }
              />

              <ContextCard
                label="Owner"
                value={
                  ticket.assignee.name
                }
                icon={
                  Users
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
                icon={
                  Clock3
                }
              />
            </div>
          </div>

          {/* =============================================
              TABS
          ============================================== */}

          <div className="shrink-0 border-b border-border bg-card px-5 md:px-6">
            <div className="flex items-center gap-1">

              <button
                type="button"
                onClick={() =>
                  setTab(
                    "conversation"
                  )
                }
                className={`relative px-3 py-3 text-[10px] font-black transition ${
                  tab ===
                  "conversation"
                    ? "text-emerald-700"
                    : "text-muted-foreground hover:text-muted-foreground"
                }`}
              >
                Conversation

                {tab ===
                  "conversation" ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500" />
                ) : null}
              </button>

              <button
                type="button"
                onClick={() =>
                  setTab(
                    "activity"
                  )
                }
                className={`relative px-3 py-3 text-[10px] font-black transition ${
                  tab ===
                  "activity"
                    ? "text-emerald-700"
                    : "text-muted-foreground hover:text-muted-foreground"
                }`}
              >
                Activity

                {tab ===
                  "activity" ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500" />
                ) : null}
              </button>

            </div>
          </div>

          {/* =============================================
              BODY
          ============================================== */}

          <div className="min-h-0 flex-1 support-scrollbar-hidden overflow-y-auto bg-background p-4 md:p-5">

            {tab ===
            "conversation" ? (
              <div className="space-y-4">

                {/* ISSUE */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    Customer Issue
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                    {
                      ticket.description
                    }
                  </p>

                  {ticket.relatedReference ? (
                    <p className="mt-3 break-all text-[9px] font-black text-emerald-700">
                      Reference:{" "}
                      {
                        ticket.relatedReference
                      }
                    </p>
                  ) : null}
                </div>

                {/* AI verifies and recommends; the supporter remains in control. */}

                <SupportAiCopilot
                  ticket={ticket}
                  onUseReply={setReply}
                />

                {/* MESSAGES */}

                {ticket.messages.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-7 text-center">

                    <MessageSquare className="mx-auto h-5 w-5 text-muted-foreground" />

                    <p className="mt-3 text-xs font-black text-foreground">
                      No conversation messages yet.
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Send the first reply to the customer.
                    </p>
                  </div>
                ) : (
                  ticket.messages.map(
                    (
                      message
                    ) => (
                      <MessageBubble
                        key={
                          message.id
                        }
                        message={
                          message
                        }
                      />
                    )
                  )
                )}

                {/* REPLY */}

                <Composer
                  title="Reply to customer"
                  value={
                    reply
                  }
                  setValue={
                    setReply
                  }
                  placeholder="Write a clear customer-facing response..."
                  actionLabel="Send Reply"
                  icon={
                    Send
                  }
                  busy={
                    busyAction ===
                    "reply"
                  }
                  onSubmit={() =>
                    void runAction(
                      "reply",
                      reply
                    )
                  }
                />

                {/* INTERNAL NOTE */}

                <Composer
                  title="Internal note"
                  value={
                    note
                  }
                  setValue={
                    setNote
                  }
                  placeholder="Add investigation context visible only to support staff..."
                  actionLabel="Add Note"
                  icon={
                    MessageSquare
                  }
                  busy={
                    busyAction ===
                    "note"
                  }
                  internal
                  onSubmit={() =>
                    void runAction(
                      "note",
                      note
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">

                {ticket.activity.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-7 text-center">

                    <ShieldAlert className="mx-auto h-5 w-5 text-muted-foreground" />

                    <p className="mt-3 text-xs font-black text-foreground">
                      No activity recorded yet.
                    </p>
                  </div>
                ) : (
                  ticket.activity.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="flex gap-3 rounded-2xl border border-border bg-card p-4"
                      >
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                        <div className="min-w-0">

                          <p className="text-xs font-black text-foreground">
                            {
                              item.summary
                            }
                          </p>

                          <p className="mt-1 text-[9px] text-muted-foreground">
                            {
                              item.actorName
                            }{" "}
                            •{" "}
                            {formatRelativeTime(
                              item.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}

/* =========================================================
   CONTEXT CARD
========================================================= */

function ContextCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-[10px] font-black text-foreground">
        {value || "Not assigned"}
      </p>
    </div>
  );
}

/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function MessageBubble({
  message,
}: {
  message:
    SupportTicketDetail["messages"][number];
}) {
  const isInternal =
    message.visibility ===
    "internal";

  const isAgent =
    message.authorType ===
    "admin";

  return (
    <div
      className={`flex ${
        isAgent &&
        !isInternal
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[90%] rounded-2xl p-3.5 ${
          isInternal
            ? "border border-amber-200 bg-amber-50"
            : isAgent
              ? "bg-emerald-600 text-white"
              : "border border-border bg-card text-foreground"
        }`}
      >

        <div className="flex items-center gap-2">

          <p
            className={`text-[9px] font-black ${
              isInternal
                ? "text-amber-700"
                : isAgent
                  ? "text-emerald-50"
                  : "text-emerald-700"
            }`}
          >
            {
              message.authorName
            }
          </p>

          {isInternal ? (
            <span className="rounded-full bg-card px-2 py-0.5 text-[7px] font-black text-amber-700">
              INTERNAL
            </span>
          ) : isAgent ? (
            <span className="rounded-full bg-emerald-500/40 px-2 py-0.5 text-[7px] font-black text-emerald-50">
              SUPPORT
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[7px] font-black text-muted-foreground">
              CUSTOMER
            </span>
          )}
        </div>

        <p
          className={`mt-2 whitespace-pre-wrap text-xs leading-5 ${
            isAgent &&
            !isInternal
              ? "text-emerald-50"
              : "text-muted-foreground"
          }`}
        >
          {
            message.body
          }
        </p>

        <p
          className={`mt-2 text-[8px] ${
            isAgent &&
            !isInternal
              ? "text-emerald-100/70"
              : "text-muted-foreground"
          }`}
        >
          {formatRelativeTime(
            message.createdAt
          )}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   COMPOSER
========================================================= */

function Composer({
  title,
  value,
  setValue,
  placeholder,
  actionLabel,
  icon: Icon,
  busy,
  internal = false,
  onSubmit,
}: {
  title: string;
  value: string;
  setValue: (
    value: string
  ) => void;
  placeholder: string;
  actionLabel: string;
  icon: React.ElementType;
  busy: boolean;
  internal?: boolean;
  onSubmit: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        internal
          ? "border-amber-500/20 bg-amber-500/[0.08]"
          : "border-border bg-card"
      }`}
    >

      <p
        className={`text-[9px] font-black uppercase tracking-[0.12em] ${
          internal
            ? "text-amber-700"
            : "text-emerald-700"
        }`}
      >
        {title}
      </p>

      <textarea
        value={
          value
        }
        onChange={(
          event
        ) =>
          setValue(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        rows={4}
        maxLength={4000}
        className="mt-3 w-full resize-none rounded-xl border border-border bg-card p-3 text-xs leading-5 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
      />

      <div className="mt-3 flex items-center justify-between gap-3">

        <span className="text-[8px] text-muted-foreground">
          {
            value.length
          }
          /4000
        </span>

        <button
          type="button"
          disabled={
            busy ||
            !value.trim()
          }
          onClick={
            onSubmit
          }
          className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[9px] font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            internal
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}

          {actionLabel}
        </button>
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
  const tone: Record<
    TicketPriority,
    string
  > = {
    Urgent:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

    High:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",

    Normal:
      "border-border bg-muted/50 text-muted-foreground",

    Low:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black ${tone[priority]}`}
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
  const tone: Record<
    TicketStatus,
    string
  > = {
    Open:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",

    "In Progress":
      "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",

    "Waiting for Customer":
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",

    Escalated:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

    Resolved:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span
      className={`inline-flex max-w-[150px] rounded-full border px-2.5 py-1 text-[8px] font-black ${tone[status]}`}
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
    breached ||
    minutes <= 0
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[8px] font-black text-rose-700">
        <AlertCircle className="h-3 w-3" />

        Breached
      </span>
    );
  }

  const dueSoon =
    minutes <=
    15;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[8px] font-black ${
        dueSoon
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border-border bg-muted/50 text-muted-foreground"
      }`}
    >
      <Clock3 className="h-3 w-3" />

      {formatSla(
        minutes
      )}
    </span>
  );
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  value: string
): string {
  const result =
    value
      .split(
        /\s+/
      )
      .filter(Boolean)
      .slice(
        0,
        2
      )
      .map(
        (
          part
        ) =>
          part.charAt(
            0
          )
      )
      .join("")
      .toUpperCase();

  return (
    result ||
    "?"
  );
}

/* =========================================================
   SLA FORMAT
========================================================= */

function formatSla(
  minutes: number
): string {
  if (
    !Number.isFinite(
      minutes
    )
  ) {
    return "—";
  }

  if (
    minutes <= 0
  ) {
    return "Breached";
  }

  if (
    minutes < 60
  ) {
    return `${Math.round(
      minutes
    )}m`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  const rest =
    Math.round(
      minutes %
        60
    );

  return rest
    ? `${hours}h ${rest}m`
    : `${hours}h`;
}

/* =========================================================
   RELATIVE TIME
========================================================= */

function formatRelativeTime(
  value: string
): string {
  const timestamp =
    Date.parse(
      value
    );

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return "Recently";
  }

  const diff =
    Date.now() -
    timestamp;

  const minutes =
    Math.max(
      0,
      Math.floor(
        diff /
          60000
      )
    );

  if (
    minutes < 1
  ) {
    return "just now";
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

  if (
    days < 30
  ) {
    return `${days}d ago`;
  }

  return new Date(
    timestamp
  ).toLocaleDateString();
}
