"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "framer-motion";

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

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

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

const slaClasses: Record<
  SupportSlaStatus,
  string
> = {
  Healthy:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

  "Due Soon":
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",

  Breached:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

  Resolved:
    "border-border bg-muted text-muted-foreground",
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


function isAuthorizationError(
  error: unknown
): boolean {
  const record =
    error &&
    typeof error === "object"
      ? (error as Record<string, unknown>)
      : null;

  const response =
    record?.response &&
    typeof record.response === "object"
      ? (record.response as Record<string, unknown>)
      : null;

  const status = Number(
    record?.status ??
      record?.statusCode ??
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
      ? error.message.toLowerCase()
      : String(error ?? "").toLowerCase();

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("access denied") ||
    message.includes("not authorized")
  );
}

/* =========================================================
   SUPPORT-ONLY ACCESS
========================================================= */

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
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
            <ShieldAlert className="h-6 w-6" />
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

export default function SupportSlaPage() {
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
    return <SupportNotFoundState />;
  }

  return (
    <SupportSlaContent
      onUnauthorized={denyAccess}
    />
  );
}

function SupportSlaContent({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
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

          /*
           * Keep summary cards at their
           * current values if a non-auth
           * summary request fails.
           */
        } finally {
          setSummaryLoading(
            false
          );
        }
      },
      [
        onUnauthorized,
      ]
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
          if (
            isAuthorizationError(
              requestError
            )
          ) {
            onUnauthorized();
            return;
          }

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
        onUnauthorized,
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
            "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
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
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
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
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
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
            "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
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
            "border-border bg-muted text-muted-foreground",
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
    <main className="w-full min-w-0 overflow-x-clip bg-transparent px-1 pb-8 sm:px-2 md:px-3">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        {/* =================================================
            PREMIUM SUPPORT HERO
        ================================================== */}
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
          className="support-sla-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.22)]"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-sla-grid absolute inset-0 opacity-40" />
            <div className="support-sla-stars absolute inset-0 opacity-50" />

            <div className="support-sla-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="support-sla-orb-delayed absolute -bottom-32 left-[30%] h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />
            <div className="support-sla-beam absolute -left-48 top-1/2 h-28 w-[520px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="support-sla-ring support-sla-ring-one absolute -right-20 top-1/2 hidden h-[380px] w-[380px] -translate-y-1/2 rounded-full border border-white/10 2xl:block" />
            <div className="support-sla-ring support-sla-ring-two absolute right-0 top-1/2 hidden h-[250px] w-[250px] -translate-y-1/2 rounded-full border border-white/10 2xl:block" />
          </div>

          <div className="relative z-10 grid min-h-[300px] gap-8 p-5 sm:p-6 lg:p-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center xl:p-8 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-50 backdrop-blur-md sm:text-[10px]">
                <span className="support-sla-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                Support Operations
                <span className="h-1 w-1 rounded-full bg-white/40" />
                SLA Control Center
              </div>

              <div className="mt-5 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start">
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
                  <Clock3 className="h-6 w-6 sm:h-7 sm:w-7" />
                  <span className="support-sla-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
                </motion.div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                    SLA Monitoring
                  </h1>

                  <p className="mt-3 max-w-2xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                    Monitor active support cases, spot approaching deadlines
                    and prioritize breached tickets from one live operational
                    workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                {[
                  {
                    label: "Active cases",
                    value: String(summary.active),
                    icon: Ticket,
                  },
                  {
                    label: "Healthy",
                    value: String(summary.healthy),
                    icon: CheckCircle2,
                  },
                  {
                    label: "Breached",
                    value: String(summary.breached),
                    icon: ShieldAlert,
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
                        delay: 0.15 + index * 0.06,
                      }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md"
                    >
                      <div className="support-sla-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className="relative flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.14em] text-white/55">
                            {item.label}
                          </p>

                          <p className="mt-0.5 break-words text-sm font-black leading-5 text-white">
                            {summaryLoading ? "…" : item.value}
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
                    void refreshAll()
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
                    ? "Refreshing SLA data…"
                    : "Refresh SLA data"}
                </motion.button>

                <span className="inline-flex items-center justify-center gap-2 text-[9px] font-bold text-white/65 sm:justify-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                  Live backend-calculated SLA status
                </span>
              </div>
            </div>

            {/* Animated SLA visual */}
            <div className="relative mx-auto hidden h-[260px] w-full max-w-[430px] xl:block">
              <div className="absolute left-1/2 top-1/2 h-[238px] w-[238px] -translate-x-1/2 -translate-y-1/2">
                <div className="support-sla-core absolute left-1/2 top-1/2 flex h-[108px] w-[108px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_28px_65px_rgba(6,78,59,0.30)] backdrop-blur-xl">
                  <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-white">
                    <Clock3 className="h-8 w-8" />
                    <span className="support-sla-clock-hand absolute left-1/2 top-1/2 h-[2px] w-6 origin-left rounded-full bg-white/80" />
                  </div>

                  <span className="support-sla-core-ring absolute -inset-3 rounded-full border border-white/15" />
                  <span className="support-sla-core-ring support-sla-core-ring-delay absolute -inset-7 rounded-full border border-white/10" />
                </div>

                <div className="support-sla-orbit support-sla-orbit-one absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                  <div className="support-sla-orbit-item support-sla-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-sla-orbit support-sla-orbit-two absolute left-1/2 top-1/2 h-[246px] w-[246px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="support-sla-orbit-item support-sla-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-sla-float-card support-sla-float-card-one absolute -left-14 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Clock3 className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Due soon
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        {summaryLoading ? "…" : summary.dueSoon}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="support-sla-float-card support-sla-float-card-two absolute -right-16 bottom-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Resolved
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        {summaryLoading ? "…" : summary.resolved}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-sla-scan absolute left-1/2 top-1/2 h-[1px] w-[315px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* =================================================
            SUMMARY CARDS
        ================================================== */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
          {summaryCards.map(
            (card, index) => (
              <motion.div
                key={card.key}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.045,
                }}
                className="rounded-[24px] border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card.className}`}
                  >
                    {card.icon}
                  </span>

                  <span className="break-words text-right text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-muted-foreground">
                    {card.label}
                  </span>
                </div>

                <div className="mt-4">
                  {summaryLoading ? (
                    <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
                  ) : (
                    <p className="break-words text-xl font-black leading-7 text-foreground sm:text-2xl">
                      {card.value}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          )}
        </section>

        {/* =================================================
            FILTERS
        ================================================== */}
        <section className="rounded-[26px] border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(260px,1fr)_180px_180px_180px]">
            <div className="relative min-w-0 md:col-span-2 2xl:col-span-1">
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

            <SelectField
              value={status}
              onChange={(value) =>
                setStatus(
                  value as
                    | TicketStatus
                    | "All"
                )
              }
              options={STATUS_OPTIONS}
              label="Status"
            />

            <SelectField
              value={priority}
              onChange={(value) =>
                setPriority(
                  value as
                    | TicketPriority
                    | "All"
                )
              }
              options={PRIORITY_OPTIONS}
              label="Priority"
            />

            <SelectField
              value={slaStatus}
              onChange={(value) =>
                setSlaStatus(
                  value as
                    | SupportSlaStatus
                    | "All"
                )
              }
              options={SLA_STATUS_OPTIONS}
              label="SLA"
            />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

              <p className="min-w-0 break-words [overflow-wrap:anywhere] text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            MOBILE / TABLET CARDS
        ================================================== */}
        <section className="space-y-3 xl:hidden">
          {loading ? (
            <div className="space-y-3">
              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-[190px] animate-pulse rounded-[24px] border border-border bg-card"
                  />
                )
              )}
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center">
              <Clock3 className="mx-auto h-8 w-8 text-muted-foreground/40" />

              <p className="mt-3 text-sm font-black text-foreground">
                No SLA cases found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing your filters.
              </p>
            </div>
          ) : (
            tickets.map(
              (ticket) => (
                <SlaMobileCard
                  key={ticket.id}
                  ticket={ticket}
                />
              )
            )
          )}
        </section>

        {/* =================================================
            DESKTOP TABLE
        ================================================== */}
        <section className="hidden min-w-0 overflow-hidden rounded-[28px] border border-border bg-card shadow-sm xl:block">
          <div className="support-sla-scroll overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  {[
                    "Ticket",
                    "Customer",
                    "Priority",
                    "Status",
                    "Assignee",
                    "SLA Status",
                    "Time",
                    "Due At",
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground"
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
                ) : tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <Clock3 className="mx-auto h-8 w-8 text-muted-foreground/40" />

                      <p className="mt-3 text-sm font-black text-foreground">
                        No SLA cases found
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Try changing your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tickets.map(
                    (ticket) => (
                      <SlaRow
                        key={ticket.id}
                        ticket={ticket}
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =================================================
            PAGINATION
        ================================================== */}
        <section className="flex flex-col gap-3 rounded-[22px] border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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

      <style>{`
        .support-sla-hero {
          isolation: isolate;
        }

        .support-sla-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(16, 185, 129, 0.42)
            transparent;
        }

        .support-sla-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-sla-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-sla-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.36);
          background-clip: padding-box;
        }

        .support-sla-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(5, 150, 105, 0.54);
          background-clip: padding-box;
        }

        .support-sla-grid {
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
          animation: supportSlaGridMove 20s linear infinite;
        }

        .support-sla-stars {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.20) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 28%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 36% 82%, rgba(255,255,255,0.14) 0 1px, transparent 1px);
          background-size: 82px 82px, 104px 104px, 126px 126px;
          animation: supportSlaStars 28s linear infinite;
        }

        .support-sla-orb {
          animation: supportSlaOrb 7.5s ease-in-out infinite;
        }

        .support-sla-orb-delayed {
          animation: supportSlaOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .support-sla-beam {
          animation: supportSlaBeam 8s ease-in-out infinite;
        }

        .support-sla-ring-one {
          animation: supportSlaRing 12s linear infinite;
        }

        .support-sla-ring-two {
          animation: supportSlaRing 8.5s linear infinite reverse;
        }

        .support-sla-live-dot {
          box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.65);
          animation: supportSlaLiveDot 2s ease-out infinite;
        }

        .support-sla-icon-pulse {
          animation: supportSlaIconPulse 3.2s ease-out infinite;
        }

        .support-sla-card-shine {
          animation: supportSlaCardShine 6.5s ease-in-out infinite;
        }

        .support-sla-core {
          animation: supportSlaCoreFloat 5.3s ease-in-out infinite;
        }

        .support-sla-core-ring {
          animation: supportSlaCoreRing 3.5s ease-out infinite;
        }

        .support-sla-core-ring-delay {
          animation-delay: 1.75s;
        }

        .support-sla-clock-hand {
          transform: translateY(-50%) rotate(-90deg);
          animation: supportSlaClockHand 8s linear infinite;
        }

        .support-sla-orbit-one {
          animation: supportSlaOrbit 13s linear infinite;
        }

        .support-sla-orbit-two {
          animation: supportSlaOrbit 18s linear infinite reverse;
        }

        .support-sla-orbit-item-one {
          animation: supportSlaCounterOrbit 13s linear infinite reverse;
        }

        .support-sla-orbit-item-two {
          animation: supportSlaCounterOrbit 18s linear infinite;
        }

        .support-sla-float-card-one {
          animation: supportSlaFloatCard 5.4s ease-in-out infinite;
        }

        .support-sla-float-card-two {
          animation: supportSlaFloatCard 6.3s ease-in-out 0.8s infinite reverse;
        }

        .support-sla-scan {
          animation: supportSlaScan 4.4s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209, 250, 229, 0.6));
        }

        @keyframes supportSlaGridMove {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(28px, 28px, 0);
          }
        }

        @keyframes supportSlaStars {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-46px, 30px, 0);
          }
        }

        @keyframes supportSlaOrb {
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

        @keyframes supportSlaBeam {
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

        @keyframes supportSlaRing {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        @keyframes supportSlaLiveDot {
          0% {
            box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.58);
          }
          75%,
          100% {
            box-shadow: 0 0 0 8px rgba(167, 243, 208, 0);
          }
        }

        @keyframes supportSlaIconPulse {
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

        @keyframes supportSlaCardShine {
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

        @keyframes supportSlaCoreFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-7px);
          }
        }

        @keyframes supportSlaCoreRing {
          0% {
            transform: scale(0.88);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes supportSlaClockHand {
          from {
            transform: translateY(-50%) rotate(-90deg);
          }
          to {
            transform: translateY(-50%) rotate(270deg);
          }
        }

        @keyframes supportSlaOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes supportSlaCounterOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes supportSlaFloatCard {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -9px, 0);
          }
        }

        @keyframes supportSlaScan {
          0%,
          100% {
            transform: translate(-50%, -98px) scaleX(0.75);
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
            transform: translate(-50%, 98px) scaleX(0.75);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .support-sla-grid {
            background-size: 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-sla-grid,
          .support-sla-stars,
          .support-sla-orb,
          .support-sla-orb-delayed,
          .support-sla-beam,
          .support-sla-ring-one,
          .support-sla-ring-two,
          .support-sla-live-dot,
          .support-sla-icon-pulse,
          .support-sla-card-shine,
          .support-sla-core,
          .support-sla-core-ring,
          .support-sla-clock-hand,
          .support-sla-orbit-one,
          .support-sla-orbit-two,
          .support-sla-orbit-item-one,
          .support-sla-orbit-item-two,
          .support-sla-float-card-one,
          .support-sla-float-card-two,
          .support-sla-scan {
            animation: none !important;
          }
        }
      `}</style>
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
    <tr className="border-b border-border transition hover:bg-muted/40 last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isBreached
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : isDueSoon
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            <Ticket className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
              {ticket.ticketNumber}
            </p>

            <p className="mt-1 max-w-[280px] break-words text-xs font-black leading-5 text-foreground">
              {ticket.subject}
            </p>

            <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
              {ticket.category}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">
              {ticket.customer.name}
            </p>

            <p className="mt-1 max-w-[220px] break-all text-[9px] leading-4 text-muted-foreground">
              {ticket.customer.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex max-w-[160px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${
            priorityClasses[
              ticket.priority
            ] ??
            priorityClasses.Normal
          }`}
        >
          {ticket.priority}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex max-w-[160px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${
            statusClasses[
              ticket.status
            ] ??
            "border-border bg-muted text-muted-foreground"
          }`}
        >
          {ticket.status}
        </span>

        <p className="mt-2 text-[9px] font-semibold text-muted-foreground">
          Waiting: {ticket.waitingOn}
        </p>
      </td>

      <td className="px-5 py-4">
        {ticket.assignee ? (
          <div>
            <p className="text-xs font-bold text-foreground">
              {ticket.assignee.name}
            </p>

            <p className="mt-1 break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em] text-muted-foreground">
              {ticket.assignee.role}
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            Unassigned
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex max-w-[160px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${
            slaClasses[
              ticket.sla.status
            ]
          }`}
        >
          {ticket.sla.status}
        </span>
      </td>

      <td className="px-5 py-4">
        {ticket.sla.status ===
        "Resolved" ? (
          <span className="text-[10px] font-black text-muted-foreground">
            Resolved
          </span>
        ) : isBreached ? (
          <div>
            <p className="text-xs font-black text-rose-600 dark:text-rose-400">
              {formatMinutes(
                overdue
              )}{" "}
              overdue
            </p>

            <p className="mt-1 text-[9px] text-muted-foreground">
              SLA breached
            </p>
          </div>
        ) : (
          <div>
            <p
              className={`text-xs font-black ${
                isDueSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {formatMinutes(
                remaining
              )}{" "}
              remaining
            </p>

            <p className="mt-1 text-[9px] text-muted-foreground">
              Until SLA deadline
            </p>
          </div>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />

          <div>
            <p className="break-words text-[10px] font-bold leading-4 text-foreground">
              {formatDateTime(
                ticket.sla.dueAt
              )}
            </p>

            {ticket.sla.breached ? (
              <p className="mt-1 text-[9px] font-black text-rose-600 dark:text-rose-400">
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
   MOBILE SLA CARD
========================================================= */

function SlaMobileCard({
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

  return (
    <article className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">
            {ticket.ticketNumber}
          </p>

          <h2 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-foreground">
            {ticket.subject}
          </h2>

          <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
            {ticket.category}
          </p>
        </div>

        <span
          className={`max-w-full self-start whitespace-normal rounded-full border px-2.5 py-1 text-left text-[8px] font-black leading-4 min-[480px]:shrink-0 ${
            slaClasses[
              ticket.sla.status
            ]
          }`}
        >
          {ticket.sla.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2">
        <MobileInfo
          label="Customer"
          value={ticket.customer.name}
        />

        <MobileInfo
          label="Priority"
          value={ticket.priority}
        />

        <MobileInfo
          label="Status"
          value={ticket.status}
        />

        <MobileInfo
          label="Assignee"
          value={
            ticket.assignee
              ? ticket.assignee.name
              : "Unassigned"
          }
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-muted/55 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            SLA time
          </p>

          <p
            className={`mt-1 text-xs font-black ${
              isBreached
                ? "text-rose-600 dark:text-rose-400"
                : isDueSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {ticket.sla.status === "Resolved"
              ? "Resolved"
              : isBreached
                ? `${formatMinutes(
                    ticket.sla.minutesOverdue
                  )} overdue`
                : `${formatMinutes(
                    ticket.sla.minutesRemaining
                  )} remaining`}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Due at
          </p>

          <p className="mt-1 break-words text-[10px] font-bold leading-4 text-foreground">
            {formatDateTime(
              ticket.sla.dueAt
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

function MobileInfo({
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

      <p className="mt-1 break-words text-[10px] font-bold text-foreground">
        {value || "—"}
      </p>
    </div>
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
            event.target.value
          )
        }
        className="h-11 min-w-0 w-full appearance-none rounded-xl border border-border bg-muted/60 px-4 pr-10 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {label}: {option}
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              length: 8,
            }).map(
              (
                __,
                cellIndex
              ) => (
                <td
                  key={cellIndex}
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
