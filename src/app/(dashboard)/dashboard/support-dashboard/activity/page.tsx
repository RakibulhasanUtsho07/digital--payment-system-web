"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportActivityLog,
} from "@/lib/api/supportDashboardApi";

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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

function eventClass(
  eventType: string
) {
  if (
    eventType ===
    "ESCALATED"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    eventType ===
    "RESOLVED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    eventType.includes(
      "REPLY"
    )
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (
    eventType ===
    "INTERNAL_NOTE"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportActivityPage() {
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
    useState<
      (typeof EVENT_TYPES)[number]
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
     PAGINATION TEXT
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
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  Support Audit
                  Trail
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                  Activity
                </h1>

                <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">
                  Track support
                  actions, ticket
                  events,
                  replies,
                  escalations and
                  resolution
                  history.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadActivity(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.2)] transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing…"
                : "Refresh"}
            </button>
          </div>
        </motion.section>

        {/* =================================================
            FILTER
        ================================================= */}

        <section className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search summary or actor name…"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[11px] font-semibold outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <select
              value={
                eventType
              }
              onChange={(
                event
              ) =>
                setEventType(
                  event
                    .target
                    .value as (typeof EVENT_TYPES)[number]
                )
              }
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              {EVENT_TYPES.map(
                (
                  item
                ) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item ===
                    "All"
                      ? "All activity types"
                      : item.replaceAll(
                          "_",
                          " "
                        )}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");

                setEventType(
                  "All"
                );

                setPage(1);
              }}
              disabled={
                !search &&
                eventType ===
                  "All"
              }
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* =================================================
            ACTIVITY LIST
        ================================================= */}

        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-500">
                Operational
                history
              </p>

              <h2 className="mt-1 text-sm font-black text-slate-900">
                Support
                activity log
              </h2>
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[8px] font-black text-slate-500">
              {total} events
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : activities.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto h-6 w-6 text-slate-300" />

              <p className="mt-3 text-sm font-black text-slate-800">
                No activity
                found
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Try changing
                your filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
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
                        index *
                        0.02,
                    }}
                    className="grid gap-4 px-5 py-4 transition hover:bg-emerald-50/30 lg:grid-cols-[160px_1fr_220px] lg:items-center"
                  >
                    {/* EVENT */}

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-black ${eventClass(
                          item.eventType
                        )}`}
                      >
                        {item.eventType.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                      <div className="mt-2 flex items-center gap-1.5 text-[8px] font-semibold text-slate-400">
                        <Clock3 className="h-3 w-3" />

                        {formatDateTime(
                          item.createdAt
                        )}
                      </div>
                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0">
                      <p className="text-[10px] font-black leading-5 text-slate-800">
                        {
                          item.summary
                        }
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[8px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3 w-3 text-emerald-600" />

                          {
                            item.actor.name
                          }
                        </span>

                        {item.actor
                          .role && (
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-slate-400" />

                            {
                              item.actor.role
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* TICKET */}

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Related
                        ticket
                      </p>

                      <p className="mt-1 truncate text-[9px] font-black text-slate-700">
                        {item.ticket
                          .ticketNumber ||
                          item.ticket
                            .id}
                      </p>

                      <p className="mt-0.5 truncate text-[8px] text-slate-400">
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

          <div className="flex flex-col gap-3 border-t border-emerald-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] font-semibold text-slate-500">
              {
                paginationText
              }
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="min-w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[9px] font-black text-slate-700">
                {page} /{" "}
                {totalPages}
              </span>

              <button
                type="button"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
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