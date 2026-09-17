"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  UserRound,
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
    useState<
      TicketStatus | "All"
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
  ====================================================== */

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
            requestError instanceof Error
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
      window.setTimeout(() => {
        void loadConversations();
      }, 250);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loadConversations,
  ]);

  /* =======================================================
     RESET PAGE WHEN STATUS CHANGES
  ====================================================== */

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [status]);

  /* =======================================================
     OPEN CONVERSATION
  ====================================================== */

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
            requestError instanceof Error
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
     PAGINATION
  ====================================================== */

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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                    Support Operations
                  </p>

                  <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                    Conversations
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Review merchant payment support
                conversations and the complete message
                history associated with each case.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-500">
                  Conversations
                </p>

                <p className="mt-1 text-lg font-black text-violet-700">
                  {total}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadConversations(
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
                placeholder="Search ticket, subject, customer, reference..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
              />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as TicketStatus |
                      "All"
                  )
                }
                className="h-11 min-w-[200px] appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
              >
                {STATUS_OPTIONS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Status: {item}
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
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

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
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Conversation
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Assignee
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Last Message
                  </th>

                  <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Activity
                  </th>

                  <th className="px-5 py-4 text-right text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : conversations.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-black text-slate-600">
                        No conversations found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing the search or
                        status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  conversations.map(
                    (item) => (
                      <ConversationRow
                        key={item.id}
                        item={item}
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

      {selectedConversationId ? (
        <ConversationDrawer
          loading={
            detailLoading
          }
          error={
            detailError
          }
          detail={detail}
          onClose={
            closeConversation
          }
        />
      ) : null}
    </main>
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
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MessageSquare className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-violet-600">
              {item.ticketNumber}
            </p>

            <p className="mt-1 max-w-[280px] truncate text-xs font-black text-slate-800">
              {item.subject}
            </p>

            <p className="mt-1 text-[9px] font-semibold text-slate-400">
              {item.category} ·{" "}
              {item.priority}
            </p>

            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black ${
                priorityClasses[
                  item.priority
                ] ??
                priorityClasses.Normal
              }`}
            >
              {item.priority}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              {item.customer.name}
            </p>

            <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
              {item.customer.email}
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
            "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {item.status}
        </span>

        <p className="mt-2 text-[9px] font-semibold text-slate-400">
          Waiting:{" "}
          {item.waitingOn}
        </p>
      </td>

      <td className="px-5 py-4">
        {item.assignee ? (
          <div>
            <p className="text-xs font-bold text-slate-800">
              {item.assignee.name}
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
              {item.assignee.role}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">
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
                    ? "bg-sky-50 text-sky-700"
                    : "bg-violet-50 text-violet-700"
                }`}
              >
                {
                  item.lastMessage
                    .authorType
                }
              </span>

              <span className="text-[8px] font-semibold text-slate-400">
                {item.lastMessage
                  .visibility ===
                "internal"
                  ? "Internal"
                  : "Public"}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-slate-600">
              {item.lastMessage.body}
            </p>

            <p className="mt-1 text-[8px] font-semibold text-slate-400">
              {formatDateTime(
                item.lastMessage
                  .createdAt
              )}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">
            No messages
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <Clock3 className="h-3.5 w-3.5 text-slate-400" />

          {formatDateTime(
            item.lastActivityAt
          )}
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          View Conversation
        </button>
      </td>
    </tr>
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
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[650px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <MessageSquare className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-500">
                  Conversation History
                </p>

                <h2 className="mt-1 text-sm font-black text-slate-900">
                  Support Conversation
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

              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />

              <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

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

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-violet-700">
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

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                      statusClasses[
                        detail.status
                      ] ??
                      "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {detail.status}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-black leading-7 text-slate-900">
                  {detail.subject}
                </h3>

                <p className="mt-2 text-xs text-slate-400">
                  {detail.category}
                </p>
              </section>

              {/* ==========================================
                  CUSTOMER / ASSIGNEE
              ========================================== */}

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" />

                    <h3 className="text-xs font-black text-slate-900">
                      Customer
                    </h3>
                  </div>

                  <p className="mt-3 text-sm font-black text-slate-800">
                    {detail.customer.name}
                  </p>

                  <p className="mt-1 break-all text-[10px] text-slate-400">
                    {detail.customer.email}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <h3 className="text-xs font-black text-slate-900">
                    Assignee
                  </h3>

                  {detail.assignee ? (
                    <>
                      <p className="mt-3 text-sm font-black text-slate-800">
                        {detail.assignee.name}
                      </p>

                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                        {detail.assignee.role}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-xs font-bold text-slate-400">
                      Unassigned
                    </p>
                  )}
                </div>
              </section>

              {/* ==========================================
                  CONVERSATION META
              ========================================== */}

              <section className="rounded-[22px] border border-slate-200 bg-white p-4">
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

              {/* ==========================================
                  MESSAGES
              ========================================== */}

              <section className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Message History
                    </h3>

                    <p className="mt-1 text-[9px] font-semibold text-slate-400">
                      Full ticket conversation
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">
                    {detail.messages.length}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {detail.messages.length ===
                  0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center">
                      <MessageSquare className="mx-auto h-7 w-7 text-slate-300" />

                      <p className="mt-3 text-xs font-black text-slate-500">
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
                                ? "border-amber-200 bg-amber-50/60"
                                : isCustomer
                                  ? "border-sky-100 bg-sky-50/50"
                                  : "border-violet-100 bg-violet-50/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-black text-slate-800">
                                    {
                                      message.authorName
                                    }
                                  </p>

                                  {message.authorRole ? (
                                    <span className="rounded-full bg-white/80 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                                      {
                                        message.authorRole
                                      }
                                    </span>
                                  ) : null}

                                  <span
                                    className={`rounded-full px-2 py-1 text-[8px] font-black ${
                                      isInternal
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-white text-slate-500"
                                    }`}
                                  >
                                    {isInternal
                                      ? "Internal"
                                      : "Public"}
                                  </span>
                                </div>
                              </div>

                              <span className="shrink-0 text-[8px] font-semibold text-slate-400">
                                {formatDateTime(
                                  message.createdAt
                                )}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-700">
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

/* =========================================================
   SELECT CHEVRON
========================================================= */

function ChevronDownIcon() {
  return (
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    />
  );
}