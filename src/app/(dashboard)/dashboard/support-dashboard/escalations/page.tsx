"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportEscalation,
  type SupportEscalationDetail,
  type TicketPriority,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const PRIORITIES: Array<
  TicketPriority | "All"
> = [
  "All",
  "Urgent",
  "High",
  "Normal",
  "Low",
];

/* =========================================================
   HELPERS
========================================================= */

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

const formatDateTime = (
  value?: string | null
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

const getSlaState = (
  dueAt: string
) => {
  const due =
    new Date(dueAt).getTime();

  const now = Date.now();

  if (
    Number.isNaN(due)
  ) {
    return {
      label: "Unknown",
      className:
        "border-slate-200 bg-slate-50 text-slate-500",
    };
  }

  const diff =
    due - now;

  if (diff < 0) {
    const minutes = Math.ceil(
      Math.abs(diff) / 60000
    );

    return {
      label: `Overdue ${minutes}m`,
      className:
        "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  const minutes =
    Math.ceil(diff / 60000);

  if (minutes <= 30) {
    return {
      label: `${minutes}m left`,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: `${minutes}m left`,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function SupportEscalationsPage() {
  const [escalations, setEscalations] =
    useState<SupportEscalation[]>(
      []
    );

  const [search, setSearch] =
    useState("");

  const [priority, setPriority] =
    useState<
      TicketPriority | "All"
    >("All");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState<string | null>(
    null
  );

  const [
    detail,
    setDetail,
  ] =
    useState<SupportEscalationDetail | null>(
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
     LOAD ESCALATIONS
  ====================================================== */

  const loadEscalations =
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
            await supportDashboardApi.getEscalations(
              {
                search:
                  search.trim() ||
                  undefined,

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
              "Failed to load escalations."
            );
          }

          setEscalations(
            response.escalations ??
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
            requestError instanceof Error
              ? requestError.message
              : "Failed to load escalations."
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
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadEscalations();
      }, 250);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loadEscalations,
  ]);

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ====================================================== */

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [
    priority,
  ]);

  /* =======================================================
     LOAD DETAIL
  ====================================================== */

  const openDetail =
    useCallback(
      async (
        ticketId: string
      ) => {
        setSelectedTicketId(
          ticketId
        );

        setDetail(null);

        setDetailError("");

        setDetailLoading(true);

        try {
          const response =
            await supportDashboardApi.getEscalation(
              ticketId
            );

          if (
            !response.success ||
            !response.escalation
          ) {
            throw new Error(
              "Failed to load escalation details."
            );
          }

          setDetail(
            response.escalation
          );
        } catch (
          requestError
        ) {
          setDetailError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load escalation details."
          );
        } finally {
          setDetailLoading(
            false
          );
        }
      },
      []
    );

  const closeDetail = () => {
    setSelectedTicketId(
      null
    );

    setDetail(null);

    setDetailError("");
  };

  /* =======================================================
     PAGINATION
  ====================================================== */

  const paginationText =
    useMemo(() => {
      if (total === 0) {
        return "0 escalated cases";
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

      return `${start}-${end} of ${total} escalated cases`;
    }, [
      page,
      total,
    ]);

  return (
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="mb-5 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_14px_45px_rgba(16,185,129,0.06)] md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                    Support Operations
                  </p>

                  <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                    Escalations
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Review support cases that require
                higher-level investigation or
                intervention.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-rose-500">
                  Escalated
                </p>

                <p className="mt-1 text-lg font-black text-rose-700">
                  {total}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadEscalations(
                    true
                  )
                }
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <section className="mb-5 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );

                  if (page !== 1) {
                    setPage(1);
                  }
                }}
                placeholder="Search ticket, subject, reference..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </div>

            <div className="relative">
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as TicketPriority |
                      "All"
                  )
                }
                className="h-11 min-w-[160px] appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
              >
                {PRIORITIES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Priority: {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDownIcon />
            </div>
          </div>
        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

              <p className="text-xs font-bold leading-5 text-rose-700">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* ===================================================
            TABLE
        =================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
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
                    Assignee
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Escalated
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    SLA
                  </th>

                  <th className="px-5 py-4 text-right text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : escalations.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <ShieldAlert className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-black text-slate-600">
                        No escalated cases found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing the search
                        or priority filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  escalations.map(
                    (item) => (
                      <EscalationRow
                        key={item.id}
                        item={item}
                        onOpen={() =>
                          void openDetail(
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

          {/* ===============================================
              PAGINATION
          ================================================ */}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-bold text-slate-400">
              {paginationText}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="min-w-[70px] rounded-xl bg-slate-50 px-3 py-2 text-center text-[10px] font-black text-slate-600">
                {page} / {totalPages}
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
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
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

      {/* =====================================================
          DETAIL DRAWER
      ====================================================== */}

      {selectedTicketId ? (
        <EscalationDrawer
          loading={detailLoading}
          error={detailError}
          detail={detail}
          onClose={closeDetail}
        />
      ) : null}
    </main>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

function EscalationRow({
  item,
  onOpen,
}: {
  item: SupportEscalation;
  onOpen: () => void;
}) {
  const sla =
    getSlaState(
      item.slaDueAt
    );

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Ticket className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-rose-600">
              {item.ticketNumber}
            </p>

            <p className="mt-1 max-w-[260px] truncate text-xs font-black text-slate-800">
              {item.subject}
            </p>

            <p className="mt-1 text-[9px] font-semibold text-slate-400">
              {item.category}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-xs font-bold text-slate-800">
            {item.customer.name}
          </p>

          <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
            {item.customer.email}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${
            priorityClasses[
              item.priority
            ] ??
            priorityClasses.Normal
          }`}
        >
          {item.priority}
        </span>
      </td>

      <td className="px-5 py-4">
        {item.assignee ? (
          <div>
            <p className="text-xs font-bold text-slate-800">
              {item.assignee.name}
            </p>

            <p className="mt-1 text-[9px] font-semibold uppercase text-slate-400">
              {item.assignee.role}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">
            Unassigned
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-xs font-bold text-slate-700">
            {item.escalation
              ?.actorName ??
              "System"}
          </p>

          <p className="mt-1 text-[9px] text-slate-400">
            {formatDateTime(
              item.escalation
                ?.createdAt ??
                item.lastActivityAt
            )}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${sla.className}`}
        >
          <Clock3 className="h-3 w-3" />
          {sla.label}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          View Case
        </button>
      </td>
    </tr>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function EscalationDrawer({
  loading,
  error,
  detail,
  onClose,
}: {
  loading: boolean;
  error: string;
  detail: SupportEscalationDetail | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-rose-500">
                  Escalation Detail
                </p>

                <h2 className="mt-1 text-sm font-black text-slate-900">
                  Support Case
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CONTENT */}

        <div className="p-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />

              <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600" />

                <p className="text-xs font-bold leading-5 text-rose-700">
                  {error}
                </p>
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* ==========================================
                  CASE HEADER
              ========================================== */}

              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-rose-700">
                    {detail.ticketNumber}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                      priorityClasses[
                        detail.priority
                      ] ??
                      priorityClasses.Normal
                    }`}
                  >
                    {detail.priority}
                  </span>

                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-black text-rose-700">
                    {detail.status}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-black leading-7 text-slate-900">
                  {detail.subject}
                </h3>

                <p className="mt-2 text-xs text-slate-400">
                  {detail.category}
                </p>
              </div>

              {/* ==========================================
                  CUSTOMER
              ========================================== */}

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-slate-500" />

                  <h3 className="text-sm font-black text-slate-900">
                    Customer
                  </h3>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="Name"
                    value={
                      detail.customer
                        .name
                    }
                  />

                  <InfoBlock
                    label="Email"
                    value={
                      detail.customer
                        .email
                    }
                  />

                  <InfoBlock
                    label="KYC"
                    value={
                      detail.customer
                        .kycStatus
                    }
                  />

                  <InfoBlock
                    label="Wallet"
                    value={
                      detail.customer
                        .walletLinked
                        ? "Linked"
                        : "Not linked"
                    }
                  />
                </div>
              </section>

              {/* ==========================================
                  ASSIGNEE
              ========================================== */}

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-black text-slate-900">
                  Assigned To
                </h3>

                {detail.assignee ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-800">
                      {detail.assignee.name}
                    </p>

                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                      {detail.assignee.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-bold text-slate-400">
                    No assignee
                  </p>
                )}
              </section>

              {/* ==========================================
                  ESCALATION HISTORY
              ========================================== */}

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    Escalation History
                  </h3>

                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                    {
                      detail
                        .escalationHistory
                        .length
                    }
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {detail.escalationHistory
                    .length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No escalation history found.
                    </p>
                  ) : (
                    detail.escalationHistory.map(
                      (
                        activity
                      ) => (
                        <div
                          key={
                            activity.id
                          }
                          className="relative rounded-2xl border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />

                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-5 text-slate-800">
                                {
                                  activity.summary
                                }
                              </p>

                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold text-slate-400">
                                <span>
                                  {
                                    activity.actorName
                                  }
                                </span>

                                <span>
                                  {formatDateTime(
                                    activity.createdAt
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>

              {/* ==========================================
                  SLA + REFERENCE
              ========================================== */}

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-black text-slate-900">
                  Case Context
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="SLA Due"
                    value={formatDateTime(
                      detail.slaDueAt
                    )}
                  />

                  <InfoBlock
                    label="Related Reference"
                    value={
                      detail.relatedReference ??
                      "—"
                    }
                  />

                  <InfoBlock
                    label="Last Activity"
                    value={formatDateTime(
                      detail.lastActivityAt
                    )}
                  />

                  <InfoBlock
                    label="Created"
                    value={formatDateTime(
                      detail.createdAt
                    )}
                  />
                </div>
              </section>

              {/* ==========================================
                  READ-ONLY NOTICE
              ========================================== */}

              <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <div>
                    <p className="text-xs font-black text-amber-900">
                      Escalation review mode
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-amber-800/80">
                      This screen is for investigation
                      and escalation review. Financial
                      actions are not executed from this
                      view.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
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
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-slate-800">
        {value || "—"}
      </p>
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
            key={index}
            className="border-b border-slate-100"
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
                  <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}

/* =========================================================
   SELECT CHEVRON
========================================================= */

function ChevronDownIcon() {
  return (
    <ChevronRight
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400"
    />
  );
}