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
    <main className="min-h-screen bg-transparent">
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
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-emerald-200
            bg-white
            shadow-[0_16px_50px_rgba(15,23,42,0.06)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

          <div className="relative flex flex-col gap-5 p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">

                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                      Ticket Queue
                    </h1>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>

                      LIVE
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Investigate customer cases,
                    prioritize SLA risk, and keep
                    every support conversation moving.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Queue Size
                </p>

                <p className="mt-0.5 text-sm font-black text-slate-800">
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
                className="
                  inline-flex
                  h-11
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-emerald-200
                  bg-white
                  px-4
                  text-xs
                  font-black
                  text-emerald-700
                  transition
                  hover:-translate-y-0.5
                  hover:bg-emerald-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
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

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="mt-5 overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.05)]">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 flex-1 items-center gap-2">

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                  className="
                    h-11
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    pl-10
                    pr-4
                    text-xs
                    font-semibold
                    text-slate-700
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-emerald-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-emerald-50
                  "
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
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
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

              <p className="text-[10px] font-bold text-slate-400">
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
                className="overflow-visible border-b border-slate-100"
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
            className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black text-slate-800">
                Support Operations
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                {toast}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
        "border-emerald-100 bg-emerald-50/70",

      icon:
        "bg-white text-emerald-600",

      value:
        "text-emerald-700",
    },

    rose: {
      wrap:
        "border-rose-100 bg-rose-50/70",

      icon:
        "bg-white text-rose-600",

      value:
        "text-rose-700",
    },

    amber: {
      wrap:
        "border-amber-100 bg-amber-50/70",

      icon:
        "bg-white text-amber-600",

      value:
        "text-amber-700",
    },

    violet: {
      wrap:
        "border-violet-100 bg-violet-50/70",

      icon:
        "bg-white text-violet-600",

      value:
        "text-violet-700",
    },
  }[tone];

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
      className={`rounded-[22px] border p-4 ${theme.wrap}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${theme.icon}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p
        className={`mt-3 text-2xl font-black ${theme.value}`}
      >
        {value}
      </p>
    </motion.div>
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
  return (
    <label className="block">
      <span className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
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
              event.target.value
            )
          }
          className="
            h-11
            w-full
            appearance-none
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-3
            pr-9
            text-xs
            font-black
            text-slate-700
            outline-none
            transition
            focus:border-emerald-400
            focus:ring-4
            focus:ring-emerald-50
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

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
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
              className="h-20 animate-pulse rounded-2xl bg-slate-100"
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

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Inbox className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-sm font-black text-slate-900">
            No tickets match this view
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Adjust the search or filters to return to the active support queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">

        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">

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
                  className={`px-5 py-3.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 ${
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

        <tbody className="divide-y divide-slate-100">

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
                className="group cursor-pointer bg-white transition hover:bg-emerald-50/30"
              >

                {/* TICKET */}

                <td className="px-5 py-4">
                  <p className="text-xs font-black text-emerald-700">
                    {
                      ticket.ticketNumber
                    }
                  </p>

                  <p className="mt-1 text-[8px] text-slate-400">
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
                      <p className="max-w-[180px] truncate text-xs font-black text-slate-800">
                        {
                          ticket.customerName
                        }
                      </p>

                      <p className="mt-0.5 max-w-[190px] truncate text-[9px] text-slate-400">
                        {
                          ticket.customerEmail
                        }
                      </p>
                    </div>
                  </div>
                </td>

                {/* ISSUE */}

                <td className="px-5 py-4">
                  <p className="max-w-[260px] truncate text-xs font-bold text-slate-800">
                    {
                      ticket.subject
                    }
                  </p>

                  <p className="mt-1 text-[8px] font-semibold text-slate-400">
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
                        ? "text-slate-700"
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
                    className="
                      inline-flex
                      h-9
                      items-center
                      gap-1.5
                      rounded-xl
                      border
                      border-emerald-200
                      bg-white
                      px-3
                      text-[9px]
                      font-black
                      text-emerald-700
                      transition
                      hover:bg-emerald-50
                    "
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
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

      <p className="text-[10px] font-semibold text-slate-400">
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
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            text-slate-500
            transition
            hover:bg-emerald-50
            hover:text-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
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
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            text-slate-500
            transition
            hover:bg-emerald-50
            hover:text-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
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
      className="
        fixed
        inset-y-0
        right-0
        z-[80]
        flex
        w-full
        max-w-3xl
        flex-col
        bg-white
        shadow-[-24px_0_70px_rgba(15,23,42,0.18)]
      "
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

          <div className="shrink-0 border-b border-slate-100 bg-slate-50 p-5 md:p-6">
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

                <h2 className="mt-3 text-xl font-black leading-7 text-slate-900">
                  {
                    ticket.subject
                  }
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
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
                className="
                  inline-flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-400
                  transition
                  hover:bg-emerald-50
                  hover:text-emerald-600
                "
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

          <div className="shrink-0 border-b border-slate-100 bg-white px-5 md:px-6">
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
                    : "text-slate-400 hover:text-slate-600"
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
                    : "text-slate-400 hover:text-slate-600"
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

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">

            {tab ===
            "conversation" ? (
              <div className="space-y-4">

                {/* ISSUE */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    Customer Issue
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
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
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center">

                    <MessageSquare className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-3 text-xs font-black text-slate-700">
                      No conversation messages yet.
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
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
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center">

                    <ShieldAlert className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-3 text-xs font-black text-slate-700">
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
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                        <div className="min-w-0">

                          <p className="text-xs font-black text-slate-800">
                            {
                              item.summary
                            }
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-[10px] font-black text-slate-700">
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
              : "border border-slate-200 bg-white text-slate-700"
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
            <span className="rounded-full bg-white px-2 py-0.5 text-[7px] font-black text-amber-700">
              INTERNAL
            </span>
          ) : isAgent ? (
            <span className="rounded-full bg-emerald-500/40 px-2 py-0.5 text-[7px] font-black text-emerald-50">
              SUPPORT
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-black text-slate-600">
              CUSTOMER
            </span>
          )}
        </div>

        <p
          className={`mt-2 whitespace-pre-wrap text-xs leading-5 ${
            isAgent &&
            !isInternal
              ? "text-emerald-50"
              : "text-slate-600"
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
              : "text-slate-400"
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
          ? "border-amber-200 bg-amber-50/60"
          : "border-emerald-100 bg-white"
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
        className="
          mt-3
          w-full
          resize-none
          rounded-xl
          border
          border-slate-200
          bg-white
          p-3
          text-xs
          leading-5
          text-slate-700
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-emerald-400
          focus:ring-4
          focus:ring-emerald-50
        "
      />

      <div className="mt-3 flex items-center justify-between gap-3">

        <span className="text-[8px] text-slate-400">
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
      "border-rose-200 bg-rose-50 text-rose-700",

    High:
      "border-amber-200 bg-amber-50 text-amber-700",

    Normal:
      "border-slate-200 bg-slate-50 text-slate-600",

    Low:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
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
      "border-blue-200 bg-blue-50 text-blue-700",

    "In Progress":
      "border-cyan-200 bg-cyan-50 text-cyan-700",

    "Waiting for Customer":
      "border-amber-200 bg-amber-50 text-amber-700",

    Escalated:
      "border-rose-200 bg-rose-50 text-rose-700",

    Resolved:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
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
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
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
