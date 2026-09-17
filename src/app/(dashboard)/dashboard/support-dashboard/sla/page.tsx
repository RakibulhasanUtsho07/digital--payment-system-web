"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Ticket,
  UserRound,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportSlaStatus,
  type SupportSlaSummary,
  type SupportSlaTicket,
  type TicketPriority,
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

const PRIORITY_OPTIONS: Array<
  TicketPriority | "All"
> = [
  "All",
  "Urgent",
  "High",
  "Normal",
  "Low",
];

const SLA_STATUS_OPTIONS: Array<
  SupportSlaStatus | "All"
> = [
  "All",
  "Healthy",
  "Due Soon",
  "Breached",
  "Resolved",
];

/* =========================================================
   HELPERS
========================================================= */

const statusClasses: Record<
  string,
  string
> = {
  Open:
    "border-sky-200 bg-sky-50 text-sky-700",

  "Waiting for Customer":
    "border-amber-200 bg-amber-50 text-amber-700",

  "In Progress":
    "border-violet-200 bg-violet-50 text-violet-700",

  Escalated:
    "border-rose-200 bg-rose-50 text-rose-700",

  Resolved:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const priorityClasses: Record<
  string,
  string
> = {
  Urgent:
    "border-rose-200 bg-rose-50 text-rose-700",

  High:
    "border-orange-200 bg-orange-50 text-orange-700",

  Normal:
    "border-sky-200 bg-sky-50 text-sky-700",

  Low:
    "border-slate-200 bg-slate-50 text-slate-600",
};

const slaClasses: Record<
  SupportSlaStatus,
  string
> = {
  Healthy:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Due Soon":
    "border-amber-200 bg-amber-50 text-amber-700",

  Breached:
    "border-rose-200 bg-rose-50 text-rose-700",

  Resolved:
    "border-slate-200 bg-slate-100 text-slate-600",
};

const formatDateTime = (
  value?: string | null
) => {
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
};

const formatMinutes = (
  minutes: number
) => {
  if (minutes <= 0) {
    return "0m";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  if (
    remaining === 0
  ) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
};

/* =========================================================
   PAGE
========================================================= */

export default function SupportSlaPage() {
  const [
    summary,
    setSummary,
  ] =
    useState<SupportSlaSummary>({
      active: 0,
      healthy: 0,
      dueSoon: 0,
      breached: 0,
      resolved: 0,
    });

  const [
    tickets,
    setTickets,
  ] =
    useState<
      SupportSlaTicket[]
    >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<
      TicketStatus | "All"
    >("All");

  const [
    priority,
    setPriority,
  ] =
    useState<
      TicketPriority | "All"
    >("All");

  const [
    slaStatus,
    setSlaStatus,
  ] =
    useState<
      SupportSlaStatus | "All"
    >("All");

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
    summaryLoading,
    setSummaryLoading,
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
     LOAD SUMMARY
  ====================================================== */

  const loadSummary =
    useCallback(
      async () => {
        setSummaryLoading(
          true
        );

        try {
          const response =
            await supportDashboardApi.getSlaSummary();

          if (
            response.success
          ) {
            setSummary(
              response.summary
            );
          }
        } catch {
          /*
           * Keep summary cards at their
           * current values if summary
           * request fails.
           */
        } finally {
          setSummaryLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD SLA TICKETS
  ====================================================== */

  const loadSlaTickets =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (
          isRefresh
        ) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getSla(
              {
                search:
                  search.trim() ||
                  undefined,

                status,

                priority,

                page,

                limit:
                  PAGE_SIZE,
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load SLA monitoring data."
            );
          }

          let nextTickets =
            response.tickets ??
            [];

          /*
           * The backend already calculates
           * SLA status. We additionally filter
           * locally for the SLA status selector
           * because the current backend query
           * accepts ticket status and priority,
           * not calculated SLA status.
           */

          if (
            slaStatus !==
            "All"
          ) {
            nextTickets =
              nextTickets.filter(
                (
                  ticket
                ) =>
                  ticket.sla
                    .status ===
                  slaStatus
              );
          }

          setTickets(
            nextTickets
          );

          /*
           * Keep backend pagination as the
           * authoritative pagination.
           */
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
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load SLA monitoring data."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        page,
        priority,
        search,
        slaStatus,
        status,
      ]
    );

  /* =======================================================
     INITIAL / FILTER LOAD
  ====================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadSlaTickets();
      }, 250);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loadSlaTickets,
  ]);

  useEffect(() => {
    void loadSummary();
  }, [
    loadSummary,
  ]);

  /* =======================================================
     RESET PAGE ON FILTER CHANGE
  ====================================================== */

  useEffect(() => {
    if (
      page !== 1
    ) {
      setPage(1);
    }
  }, [
    priority,
    slaStatus,
    status,
  ]);

  /* =======================================================
     SUMMARY TOTAL
  ====================================================== */

  const summaryCards =
    useMemo(
      () => [
        {
          key: "active",
          label: "Active",
          value:
            summary.active,
          icon: (
            <Clock3 className="h-4 w-4" />
          ),
          className:
            "border-sky-200 bg-sky-50 text-sky-700",
        },
        {
          key: "healthy",
          label: "Healthy",
          value:
            summary.healthy,
          icon: (
            <CheckCircle2 className="h-4 w-4" />
          ),
          className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        },
        {
          key: "dueSoon",
          label: "Due Soon",
          value:
            summary.dueSoon,
          icon: (
            <Clock3 className="h-4 w-4" />
          ),
          className:
            "border-amber-200 bg-amber-50 text-amber-700",
        },
        {
          key: "breached",
          label: "Breached",
          value:
            summary.breached,
          icon: (
            <ShieldAlert className="h-4 w-4" />
          ),
          className:
            "border-rose-200 bg-rose-50 text-rose-700",
        },
        {
          key: "resolved",
          label: "Resolved",
          value:
            summary.resolved,
          icon: (
            <CheckCircle2 className="h-4 w-4" />
          ),
          className:
            "border-slate-200 bg-slate-100 text-slate-600",
        },
      ],
      [summary]
    );

  const paginationText =
    useMemo(() => {
      if (
        total === 0
      ) {
        return "0 SLA cases";
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

      return `${start}-${end} of ${total} SLA cases`;
    }, [
      page,
      total,
    ]);

  /* =======================================================
     REFRESH ALL
  ====================================================== */

  const refreshAll =
    async () => {
      setRefreshing(
        true
      );

      await Promise.all([
        loadSlaTickets(
          true
        ),
        loadSummary(),
      ]);

      setRefreshing(
        false
      );
    };

  return (
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* =================================================
            HEADER
        ================================================== */}

        <section className="mb-5 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_14px_45px_rgba(16,185,129,0.06)] md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                    Support Operations
                  </p>

                  <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                    SLA Monitoring
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor active support cases,
                identify approaching SLA deadlines
                and prioritize breached cases.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void refreshAll()
              }
              disabled={
                refreshing
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>
          </div>
        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================== */}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {summaryCards.map(
            (card) => (
              <div
                key={
                  card.key
                }
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.className}`}
                  >
                    {card.icon}
                  </span>

                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {card.label}
                  </span>
                </div>

                <div className="mt-4">
                  {summaryLoading ? (
                    <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    <p className="text-2xl font-black text-slate-900">
                      {card.value}
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </section>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section className="mb-5 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_180px]">
            {/* SEARCH */}

            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  if (
                    page !==
                    1
                  ) {
                    setPage(
                      1
                    );
                  }
                }}
                placeholder="Search ticket, subject, reference..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </div>

            {/* STATUS */}

            <SelectField
              value={
                status
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
              options={
                STATUS_OPTIONS
              }
              label="Status"
            />

            {/* PRIORITY */}

            <SelectField
              value={
                priority
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
              options={
                PRIORITY_OPTIONS
              }
              label="Priority"
            />

            {/* SLA STATUS */}

            <SelectField
              value={
                slaStatus
              }
              onChange={(
                value
              ) =>
                setSlaStatus(
                  value as
                    | SupportSlaStatus
                    | "All"
                )
              }
              options={
                SLA_STATUS_OPTIONS
              }
              label="SLA"
            />
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================== */}

        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

              <p className="text-xs font-bold leading-5 text-rose-700">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            TABLE
        ================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Ticket
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Assignee
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    SLA Status
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Time
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Due At
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : tickets.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <Clock3 className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-black text-slate-600">
                        No SLA cases found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your
                        filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tickets.map(
                    (
                      ticket
                    ) => (
                      <SlaRow
                        key={
                          ticket.id
                        }
                        ticket={
                          ticket
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
          ================================================== */}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-bold text-slate-400">
              {paginationText}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  page <=
                    1 ||
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="min-w-[75px] rounded-xl bg-slate-50 px-3 py-2 text-center text-[10px] font-black text-slate-600">
                {page} /{" "}
                {
                  totalPages
                }
              </div>

              <button
                type="button"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   SLA ROW
========================================================= */

function SlaRow({
  ticket,
}: {
  ticket: SupportSlaTicket;
}) {
  const isBreached =
    ticket.sla.status ===
    "Breached";

  const isDueSoon =
    ticket.sla.status ===
    "Due Soon";

  const remaining =
    ticket.sla.minutesRemaining;

  const overdue =
    ticket.sla.minutesOverdue;

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      {/* TICKET */}

      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isBreached
                ? "bg-rose-50 text-rose-600"
                : isDueSoon
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Ticket className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-600">
              {
                ticket.ticketNumber
              }
            </p>

            <p className="mt-1 max-w-[280px] truncate text-xs font-black text-slate-800">
              {
                ticket.subject
              }
            </p>

            <p className="mt-1 text-[9px] font-semibold text-slate-400">
              {ticket.category}
            </p>
          </div>
        </div>
      </td>

      {/* CUSTOMER */}

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              {
                ticket
                  .customer
                  .name
              }
            </p>

            <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
              {
                ticket
                  .customer
                  .email
              }
            </p>
          </div>
        </div>
      </td>

      {/* PRIORITY */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${
            priorityClasses[
              ticket.priority
            ] ??
            priorityClasses.Normal
          }`}
        >
          {
            ticket.priority
          }
        </span>
      </td>

      {/* STATUS */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${
            statusClasses[
              ticket.status
            ] ??
            "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {
            ticket.status
          }
        </span>

        <p className="mt-2 text-[9px] font-semibold text-slate-400">
          Waiting:{" "}
          {
            ticket.waitingOn
          }
        </p>
      </td>

      {/* ASSIGNEE */}

      <td className="px-5 py-4">
        {ticket.assignee ? (
          <div>
            <p className="text-xs font-bold text-slate-800">
              {
                ticket
                  .assignee
                  .name
              }
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
              {
                ticket
                  .assignee
                  .role
              }
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">
            Unassigned
          </span>
        )}
      </td>

      {/* SLA STATUS */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${
            slaClasses[
              ticket.sla
                .status
            ]
          }`}
        >
          {
            ticket.sla
              .status
          }
        </span>
      </td>

      {/* TIME */}

      <td className="px-5 py-4">
        {ticket.sla
          .status ===
        "Resolved" ? (
          <span className="text-[10px] font-black text-slate-500">
            Resolved
          </span>
        ) : isBreached ? (
          <div>
            <p className="text-xs font-black text-rose-600">
              {formatMinutes(
                overdue
              )}{" "}
              overdue
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              SLA breached
            </p>
          </div>
        ) : (
          <div>
            <p
              className={`text-xs font-black ${
                isDueSoon
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {formatMinutes(
                remaining
              )}{" "}
              remaining
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Until SLA deadline
            </p>
          </div>
        )}
      </td>

      {/* DUE AT */}

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 text-slate-400" />

          <div>
            <p className="text-[10px] font-bold text-slate-700">
              {formatDateTime(
                ticket.sla
                  .dueAt
              )}
            </p>

            {ticket.sla
              .breached ? (
              <p className="mt-1 text-[9px] font-black text-rose-600">
                Breached
              </p>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  options: readonly string[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
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
              {label}:{" "}
              {option}
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
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
        (_, index) => (
          <tr
            key={
              index
            }
            className="border-b border-slate-100"
          >
            {Array.from({
              length: 8,
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
                  <div className="h-9 animate-pulse rounded-xl bg-slate-100" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}