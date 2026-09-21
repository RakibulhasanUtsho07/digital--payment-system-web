"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  AlertTriangle,
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
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

  High:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",

  Normal:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",

  Low:
    "border-border bg-muted text-muted-foreground",
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
        "border-border bg-muted text-muted-foreground",
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
        "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }

  const minutes =
    Math.ceil(diff / 60000);

  if (minutes <= 30) {
    return {
      label: `${minutes}m left`,
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: `${minutes}m left`,
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
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

  const visibleUrgent =
    useMemo(
      () =>
        escalations.filter(
          (item) =>
            item.priority ===
            "Urgent"
        ).length,
      [escalations]
    );

  const visibleAssigned =
    useMemo(
      () =>
        escalations.filter(
          (item) =>
            Boolean(
              item.assignee
            )
        ).length,
      [escalations]
    );

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* ===================================================
            PREMIUM SUPPORT HERO
        ==================================================== */}
        <motion.section
          initial={{
            opacity: 0,
            y: -14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="support-escalation-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.22)]"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-escalation-grid absolute inset-0 opacity-40" />
            <div className="support-escalation-stars absolute inset-0 opacity-50" />

            <div className="support-escalation-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="support-escalation-orb-delayed absolute -bottom-32 left-[28%] h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />
            <div className="support-escalation-rose-orb absolute right-[14%] top-[16%] h-40 w-40 rounded-full bg-rose-300/10 blur-3xl" />
            <div className="support-escalation-beam absolute -left-48 top-1/2 h-28 w-[520px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="support-escalation-ring support-escalation-ring-one absolute -right-20 top-1/2 hidden h-[390px] w-[390px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
            <div className="support-escalation-ring support-escalation-ring-two absolute right-1 top-1/2 hidden h-[255px] w-[255px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          </div>

          <div className="relative z-10 grid min-h-[315px] gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-center lg:p-7 xl:grid-cols-[minmax(0,1fr)_440px] xl:p-8">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-md">
                  <span className="support-escalation-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                  Support Operations
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200/20 bg-rose-950/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-rose-50 backdrop-blur-md">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Escalation Command
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                    rotate: [0, 1.5, 0, -1.5, 0],
                  }}
                  transition={{
                    duration: 6.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-[0_14px_34px_rgba(6,78,59,0.22)] backdrop-blur-md sm:h-16 sm:w-16"
                >
                  <ShieldAlert className="h-6 w-6 sm:h-7 sm:w-7" />
                  <span className="support-escalation-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
                </motion.div>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100">
                    Higher-level support review
                  </p>

                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                    Escalations
                  </h1>

                  <p className="mt-3 max-w-3xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                    Review support cases that require deeper investigation,
                    ownership, intervention, and SLA awareness from one live
                    operational workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                {[
                  {
                    label: "Total escalated",
                    value: String(total),
                    icon: ShieldAlert,
                  },
                  {
                    label: "Urgent visible",
                    value: String(visibleUrgent),
                    icon: AlertTriangle,
                  },
                  {
                    label: "Assigned visible",
                    value: String(visibleAssigned),
                    icon: UserRound,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.label}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.14 + index * 0.06,
                      }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md"
                    >
                      <div className="support-escalation-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className="relative flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
                            {item.label}
                          </p>

                          <p className="mt-0.5 truncate text-sm font-black text-white">
                            {loading ? "…" : item.value}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <motion.button
                  type="button"
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() =>
                    void loadEscalations(
                      true
                    )
                  }
                  disabled={refreshing}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-black text-emerald-700 shadow-[0_12px_28px_rgba(6,78,59,0.20)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  {refreshing
                    ? "Refreshing escalations…"
                    : "Refresh escalations"}
                </motion.button>

                <span className="inline-flex items-center justify-center gap-2 text-[9px] font-bold text-white/65 sm:justify-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                  Live support queue · read-only review workspace
                </span>
              </div>
            </div>

            {/* Animated escalation radar */}
            <div className="relative mx-auto hidden h-[270px] w-full max-w-[440px] lg:block">
              <div className="absolute left-1/2 top-1/2 h-[245px] w-[245px] -translate-x-1/2 -translate-y-1/2">
                <div className="support-escalation-core absolute left-1/2 top-1/2 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[34px] border border-white/20 bg-white/10 shadow-[0_28px_65px_rgba(6,78,59,0.30)] backdrop-blur-xl">
                  <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[25px] border border-white/15 bg-white/10 text-white">
                    <ShieldAlert className="h-8 w-8" />
                  </div>

                  <span className="support-escalation-core-ring absolute -inset-3 rounded-[40px] border border-white/15" />
                  <span className="support-escalation-core-ring support-escalation-core-ring-delay absolute -inset-7 rounded-[50px] border border-white/10" />
                </div>

                <div className="support-escalation-orbit support-escalation-orbit-one absolute left-1/2 top-1/2 h-[194px] w-[194px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                  <div className="support-escalation-orbit-item support-escalation-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <Ticket className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-escalation-orbit support-escalation-orbit-two absolute left-1/2 top-1/2 h-[252px] w-[252px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="support-escalation-orbit-item support-escalation-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-rose-950/20 text-white shadow-lg backdrop-blur">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-escalation-float-card support-escalation-float-card-one absolute -left-16 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Clock3 className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Queue
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        {loading
                          ? "…"
                          : `${escalations.length} visible`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="support-escalation-float-card support-escalation-float-card-two absolute -right-16 bottom-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <UserRound className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Ownership
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        {loading
                          ? "…"
                          : `${visibleAssigned} assigned`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-escalation-scan absolute left-1/2 top-1/2 h-[1px] w-[320px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            FILTERS
        ==================================================== */}
        <section className="rounded-[26px] border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

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
                className="h-11 w-full rounded-xl border border-border bg-muted/60 pl-10 pr-4 text-xs font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="relative">
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as
                      | TicketPriority
                      | "All"
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-border bg-muted/60 px-4 pr-10 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
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
        ==================================================== */}
        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

              <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* ===================================================
            MOBILE / TABLET CARDS
        ==================================================== */}
        <section className="space-y-3 lg:hidden">
          {loading ? (
            <div className="space-y-3">
              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-[210px] animate-pulse rounded-[24px] border border-border bg-card"
                  />
                )
              )}
            </div>
          ) : escalations.length ===
            0 ? (
            <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center shadow-sm">
              <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/40" />

              <p className="mt-3 text-sm font-black text-foreground">
                No escalated cases found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing the search or priority filter.
              </p>
            </div>
          ) : (
            escalations.map(
              (item) => (
                <EscalationMobileCard
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
        </section>

        {/* ===================================================
            DESKTOP TABLE
        ==================================================== */}
        <section className="hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  {[
                    "Ticket",
                    "Customer",
                    "Priority",
                    "Assignee",
                    "Escalated",
                    "SLA",
                    "Action",
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground ${
                          heading ===
                          "Action"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    )
                  )}
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
                      <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/40" />

                      <p className="mt-3 text-sm font-black text-foreground">
                        No escalated cases found
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Try changing the search or priority filter.
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
        </section>

        {/* ===================================================
            PAGINATION
        ==================================================== */}
        <section className="flex flex-col gap-3 rounded-[22px] border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-bold text-muted-foreground">
            {paginationText}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-emerald-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="min-w-[75px] rounded-xl bg-muted px-3 py-2 text-center text-[10px] font-black text-foreground">
              {page} / {totalPages}
            </div>

            <button
              type="button"
              aria-label="Next page"
              disabled={
                page >= totalPages ||
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-emerald-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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

      <style>{`
        .support-escalation-hero {
          isolation: isolate;
        }

        .support-escalation-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            );
          background-size: 28px 28px;
          mask-image: radial-gradient(
            circle at 56% 45%,
            rgba(0, 0, 0, 0.98),
            rgba(0, 0, 0, 0.3) 65%,
            transparent 100%
          );
          animation: supportEscalationGridMove 20s linear infinite;
        }

        .support-escalation-stars {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.20) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 28%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 36% 82%, rgba(255,255,255,0.14) 0 1px, transparent 1px);
          background-size: 82px 82px, 104px 104px, 126px 126px;
          animation: supportEscalationStars 28s linear infinite;
        }

        .support-escalation-orb {
          animation: supportEscalationOrb 7.5s ease-in-out infinite;
        }

        .support-escalation-orb-delayed {
          animation: supportEscalationOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .support-escalation-rose-orb {
          animation: supportEscalationRoseOrb 8.5s ease-in-out infinite;
        }

        .support-escalation-beam {
          animation: supportEscalationBeam 8s ease-in-out infinite;
        }

        .support-escalation-ring-one {
          animation: supportEscalationRing 12s linear infinite;
        }

        .support-escalation-ring-two {
          animation: supportEscalationRing 8.5s linear infinite reverse;
        }

        .support-escalation-live-dot {
          box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.65);
          animation: supportEscalationLiveDot 2s ease-out infinite;
        }

        .support-escalation-icon-pulse {
          animation: supportEscalationIconPulse 3.2s ease-out infinite;
        }

        .support-escalation-card-shine {
          animation: supportEscalationCardShine 6.5s ease-in-out infinite;
        }

        .support-escalation-core {
          animation: supportEscalationCoreFloat 5.3s ease-in-out infinite;
        }

        .support-escalation-core-ring {
          animation: supportEscalationCoreRing 3.5s ease-out infinite;
        }

        .support-escalation-core-ring-delay {
          animation-delay: 1.75s;
        }

        .support-escalation-orbit-one {
          animation: supportEscalationOrbit 13s linear infinite;
        }

        .support-escalation-orbit-two {
          animation: supportEscalationOrbit 18s linear infinite reverse;
        }

        .support-escalation-orbit-item-one {
          animation: supportEscalationCounterOrbit 13s linear infinite reverse;
        }

        .support-escalation-orbit-item-two {
          animation: supportEscalationCounterOrbit 18s linear infinite;
        }

        .support-escalation-float-card-one {
          animation: supportEscalationFloatCard 5.4s ease-in-out infinite;
        }

        .support-escalation-float-card-two {
          animation: supportEscalationFloatCard 6.3s ease-in-out 0.8s infinite reverse;
        }

        .support-escalation-scan {
          animation: supportEscalationScan 4.4s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209, 250, 229, 0.6));
        }

        @keyframes supportEscalationGridMove {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(28px, 28px, 0);
          }
        }

        @keyframes supportEscalationStars {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-46px, 30px, 0);
          }
        }

        @keyframes supportEscalationOrb {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.72;
          }
          50% {
            transform: translate3d(0, -15px, 0) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes supportEscalationRoseOrb {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.75;
          }
        }

        @keyframes supportEscalationBeam {
          0%,
          100% {
            transform: translate3d(0, -50%, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate3d(105px, -50%, 0);
            opacity: 0.5;
          }
        }

        @keyframes supportEscalationRing {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        @keyframes supportEscalationLiveDot {
          0% {
            box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.58);
          }
          75%,
          100% {
            box-shadow: 0 0 0 8px rgba(167, 243, 208, 0);
          }
        }

        @keyframes supportEscalationIconPulse {
          0% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          70%,
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }

        @keyframes supportEscalationCardShine {
          0%,
          25% {
            transform: translateX(-180%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          70%,
          100% {
            transform: translateX(460%);
            opacity: 0;
          }
        }

        @keyframes supportEscalationCoreFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-7px) rotate(1.6deg);
          }
        }

        @keyframes supportEscalationCoreRing {
          0% {
            transform: scale(0.88);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes supportEscalationOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes supportEscalationCounterOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes supportEscalationFloatCard {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -9px, 0);
          }
        }

        @keyframes supportEscalationScan {
          0%,
          100% {
            transform: translate(-50%, -100px) scaleX(0.75);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          50% {
            transform: translate(-50%, 0) scaleX(1);
            opacity: 0.98;
          }
          85% {
            opacity: 0.72;
          }
          100% {
            transform: translate(-50%, 100px) scaleX(0.75);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .support-escalation-grid {
            background-size: 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-escalation-grid,
          .support-escalation-stars,
          .support-escalation-orb,
          .support-escalation-orb-delayed,
          .support-escalation-rose-orb,
          .support-escalation-beam,
          .support-escalation-ring-one,
          .support-escalation-ring-two,
          .support-escalation-live-dot,
          .support-escalation-icon-pulse,
          .support-escalation-card-shine,
          .support-escalation-core,
          .support-escalation-core-ring,
          .support-escalation-orbit-one,
          .support-escalation-orbit-two,
          .support-escalation-orbit-item-one,
          .support-escalation-orbit-item-two,
          .support-escalation-float-card-one,
          .support-escalation-float-card-two,
          .support-escalation-scan {
            animation: none !important;
          }
        }
      `}</style>
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
    <tr className="border-b border-border transition hover:bg-muted/40 last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Ticket className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-rose-600 dark:text-rose-400">
              {item.ticketNumber}
            </p>

            <p className="mt-1 max-w-[260px] truncate text-xs font-black text-foreground">
              {item.subject}
            </p>

            <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
              {item.category}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-xs font-bold text-foreground">
            {item.customer.name}
          </p>

          <p className="mt-1 max-w-[220px] truncate text-[9px] text-muted-foreground">
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
            <p className="text-xs font-bold text-foreground">
              {item.assignee.name}
            </p>

            <p className="mt-1 text-[9px] font-semibold uppercase text-muted-foreground">
              {item.assignee.role}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            Unassigned
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-xs font-bold text-foreground">
            {item.escalation
              ?.actorName ??
              "System"}
          </p>

          <p className="mt-1 text-[9px] text-muted-foreground">
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
          className="rounded-xl border border-border bg-background px-3 py-2 text-[10px] font-black text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          View Case
        </button>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function EscalationMobileCard({
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
    <article className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-rose-600 dark:text-rose-400">
            {item.ticketNumber}
          </p>

          <h2 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-foreground">
            {item.subject}
          </h2>

          <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
            {item.category}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black ${
            priorityClasses[
              item.priority
            ] ??
            priorityClasses.Normal
          }`}
        >
          {item.priority}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoBlock
          label="Customer"
          value={
            item.customer.name
          }
        />

        <InfoBlock
          label="Assignee"
          value={
            item.assignee?.name ??
            "Unassigned"
          }
        />

        <InfoBlock
          label="Escalated By"
          value={
            item.escalation
              ?.actorName ??
            "System"
          }
        />

        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            SLA
          </p>

          <span
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black ${sla.className}`}
          >
            <Clock3 className="h-3 w-3" />
            {sla.label}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-muted/45 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Escalated
          </p>

          <p className="mt-1 text-[10px] font-bold text-foreground">
            {formatDateTime(
              item.escalation
                ?.createdAt ??
                item.lastActivityAt
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[10px] font-black text-white transition hover:bg-emerald-700"
        >
          View Case
        </button>
      </div>
    </article>
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
      <motion.button
        type="button"
        aria-label="Close escalation details"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
      />

      <motion.aside
        initial={{
          opacity: 0,
          x: 40,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute right-0 top-0 h-full w-full max-w-[590px] overflow-y-auto border-l border-border bg-card shadow-2xl"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-[0_10px_24px_rgba(16,185,129,0.20)]">
                <ShieldAlert className="h-4 w-4" />
                <span className="absolute inset-0 rounded-xl border border-white/20" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  Escalation Detail
                </p>

                <h2 className="mt-1 text-sm font-black text-foreground">
                  Support Case
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-36 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600 dark:text-rose-400" />

                <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* CASE HEADER */}
              <div className="relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />

                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-rose-700 dark:text-rose-300">
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

                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[9px] font-black text-rose-700 dark:text-rose-300">
                      {detail.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black leading-7 text-foreground">
                    {detail.subject}
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {detail.category}
                  </p>
                </div>
              </div>

              {/* CUSTOMER */}
              <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />

                  <h3 className="text-sm font-black text-foreground">
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

              {/* ASSIGNEE */}
              <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-black text-foreground">
                  Assigned To
                </h3>

                {detail.assignee ? (
                  <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3">
                    <p className="text-xs font-black text-foreground">
                      {detail.assignee.name}
                    </p>

                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-muted-foreground">
                      {detail.assignee.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-bold text-muted-foreground">
                    No assignee
                  </p>
                )}
              </section>

              {/* ESCALATION HISTORY */}
              <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-foreground">
                    Escalation History
                  </h3>

                  <span className="rounded-full bg-muted px-2 py-1 text-[9px] font-black text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">
                      No escalation history found.
                    </p>
                  ) : (
                    detail.escalationHistory.map(
                      (
                        activity,
                        index
                      ) => (
                        <motion.div
                          key={
                            activity.id
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
                              0.04,
                          }}
                          className="relative rounded-2xl border border-border bg-muted/55 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.08)]" />

                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-5 text-foreground">
                                {
                                  activity.summary
                                }
                              </p>

                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold text-muted-foreground">
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
                        </motion.div>
                      )
                    )
                  )}
                </div>
              </section>

              {/* SLA + REFERENCE */}
              <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-black text-foreground">
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

              {/* READ-ONLY NOTICE */}
              <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

                  <div>
                    <p className="text-xs font-black text-foreground">
                      Escalation review mode
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                      This screen is for investigation and escalation review.
                      Financial actions are not executed from this view.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.aside>
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
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-foreground">
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
                  <div className="h-8 animate-pulse rounded-xl bg-muted" />
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
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground"
    />
  );
}
