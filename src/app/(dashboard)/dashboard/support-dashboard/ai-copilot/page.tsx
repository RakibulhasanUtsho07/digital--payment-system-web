"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Ticket,
  UserRound,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

type TicketSummary = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: "Urgent" | "High" | "Normal" | "Low";
  status:
    | "Open"
    | "Waiting for Customer"
    | "In Progress"
    | "Escalated"
    | "Resolved";
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  slaMinutes: number;
  slaBreached: boolean;
};

type TicketListResponse = {
  success: boolean;
  tickets?: TicketSummary[];
  data?: {
    tickets?: TicketSummary[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

type SupportAiAnalysis = {
  ticketId: string;
  ticketNumber: string;

  provider: "rule-engine";
  mode: "copilot";

  confidence: number;
  summary: string;

  intent: string;

  suggestedPriority:
    | "Urgent"
    | "High"
    | "Normal"
    | "Low";

  urgency:
    | "Critical"
    | "High"
    | "Moderate"
    | "Low";

  sentiment:
    | "Concerned"
    | "Neutral"
    | "Positive";

  possibleRootCause: string;

  recommendedNextAction: string;

  suggestedReply: string;

  verification: {
    status:
      | "verified"
      | "partially_verified"
      | "unverified";
    label: string;
    evidence: string[];
  };

  safety: {
    humanApprovalRequired: true;
    canExecuteFinancialActions: false;
  };

  context: {
    customerName: string;
    customerEmail: string;
    category: string;
    priority: string;
    status: string;
    slaMinutes: number;
    slaBreached: boolean;
    relatedReference: string | null;
    messageCount: number;
  };
};

type AnalysisResponse = {
  success: boolean;
  analysis?: SupportAiAnalysis;
  message?: string;
};

const priorityClasses: Record<string, string> = {
  Urgent:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  High:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Normal:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Low:
    "border-border bg-muted text-muted-foreground",
};

const urgencyClasses: Record<string, string> = {
  Critical:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  High:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Moderate:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Low:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export default function SupportAiCopilotPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedTicketId, setSelectedTicketId] =
    useState("");

  const [search, setSearch] = useState("");

  const [loadingTickets, setLoadingTickets] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState<SupportAiAnalysis | null>(null);

  const [error, setError] = useState("");
  const [ticketsError, setTicketsError] =
    useState("");

  const [replyCopied, setReplyCopied] =
    useState(false);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    setTicketsError("");

    try {
      const response =
        await apiClient<TicketListResponse>(
          "/admin/support/tickets",
          {
            method: "GET",
          }
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Unable to load support tickets."
        );
      }

      const nextTickets =
        response.tickets ??
        response.data?.tickets ??
        [];

      setTickets(nextTickets);

      if (
        nextTickets.length > 0 &&
        !selectedTicketId
      ) {
        setSelectedTicketId(
          nextTickets[0].id
        );
      }
    } catch (ticketsLoadError) {
      setTicketsError(
        ticketsLoadError instanceof Error
          ? ticketsLoadError.message
          : "Unable to load support tickets."
      );
    } finally {
      setLoadingTickets(false);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const selectedTicket = useMemo(
    () =>
      tickets.find(
        (ticket) =>
          ticket.id ===
          selectedTicketId
      ) ?? null,
    [tickets, selectedTicketId]
  );

  const filteredTickets = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const customerName =
        ticket.customer?.name ?? "";

      const customerEmail =
        ticket.customer?.email ?? "";

      return [
        ticket.ticketNumber,
        ticket.subject,
        ticket.category,
        ticket.priority,
        ticket.status,
        customerName,
        customerEmail,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [search, tickets]);

  const runAnalysis = useCallback(async () => {
    if (!selectedTicketId || analyzing) {
      return;
    }

    setAnalyzing(true);
    setError("");
    setReplyCopied(false);

    try {
      const response =
        await apiClient<AnalysisResponse>(
          `/admin/support/tickets/${encodeURIComponent(
            selectedTicketId
          )}/ai-analysis`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

      if (
        !response.success ||
        !response.analysis
      ) {
        throw new Error(
          response.message ||
            "Unable to generate AI support analysis."
        );
      }

      setAnalysis(response.analysis);
    } catch (analysisError) {
      setAnalysis(null);

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to generate AI support analysis."
      );
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, selectedTicketId]);

  const handleSelectTicket = (
    ticketId: string
  ) => {
    setSelectedTicketId(ticketId);
    setAnalysis(null);
    setError("");
    setReplyCopied(false);
  };

  const copySuggestedReply = async () => {
    if (!analysis?.suggestedReply) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        analysis.suggestedReply
      );

      setReplyCopied(true);

      window.setTimeout(() => {
        setReplyCopied(false);
      }, 1800);
    } catch {
      setReplyCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =====================================================
            PREMIUM SUPPORT HERO
        ===================================================== */}
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
          className="support-ai-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.22)]"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-ai-grid absolute inset-0 opacity-40" />
            <div className="support-ai-stars absolute inset-0 opacity-50" />

            <div className="support-ai-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="support-ai-orb-delayed absolute -bottom-32 left-[30%] h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />

            <div className="support-ai-beam absolute -left-48 top-1/2 h-28 w-[520px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="support-ai-ring support-ai-ring-one absolute -right-20 top-1/2 hidden h-[380px] w-[380px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
            <div className="support-ai-ring support-ai-ring-two absolute right-0 top-1/2 hidden h-[250px] w-[250px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          </div>

          <div className="relative z-10 grid min-h-[300px] gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:p-7 xl:grid-cols-[minmax(0,1fr)_430px] xl:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-50 backdrop-blur-md sm:text-[10px]">
                <span className="support-ai-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                Support Operations
                <span className="h-1 w-1 rounded-full bg-white/40" />
                AI-assisted workspace
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
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                  <span className="support-ai-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
                </motion.div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                    AI Support Copilot
                  </h1>

                  <p className="mt-3 max-w-2xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                    Investigate live support tickets, summarize context, detect
                    urgency and prepare a human-reviewed response from one
                    protected support workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                {[
                  {
                    label: "Tickets loaded",
                    value: String(tickets.length),
                    icon: Ticket,
                  },
                  {
                    label: "AI mode",
                    value: "Copilot",
                    icon: Sparkles,
                  },
                  {
                    label: "Approval",
                    value: "Human required",
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
                      <div className="support-ai-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className="relative flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
                            {item.label}
                          </p>

                          <p className="mt-0.5 truncate text-sm font-black text-white">
                            {item.value}
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
                    void loadTickets()
                  }
                  disabled={loadingTickets}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-black text-emerald-700 shadow-[0_12px_28px_rgba(6,78,59,0.20)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loadingTickets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  {loadingTickets
                    ? "Refreshing tickets…"
                    : "Refresh tickets"}
                </motion.button>

                <span className="inline-flex items-center justify-center gap-2 text-[9px] font-bold text-white/65 sm:justify-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                  Rule-engine insights · no automatic financial action
                </span>
              </div>
            </div>

            {/* Desktop animated copilot visual */}
            <div className="relative mx-auto hidden h-[260px] w-full max-w-[430px] lg:block">
              <div className="absolute left-1/2 top-1/2 h-[238px] w-[238px] -translate-x-1/2 -translate-y-1/2">
                <div className="support-ai-core absolute left-1/2 top-1/2 flex h-[108px] w-[108px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[32px] border border-white/20 bg-white/10 shadow-[0_28px_65px_rgba(6,78,59,0.30)] backdrop-blur-xl">
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-white/15 bg-white/10 text-white">
                    <ShieldAlert className="h-8 w-8" />
                  </div>

                  <span className="support-ai-core-ring absolute -inset-3 rounded-[38px] border border-white/15" />
                  <span className="support-ai-core-ring support-ai-core-ring-delay absolute -inset-7 rounded-[48px] border border-white/10" />
                </div>

                <div className="support-ai-orbit support-ai-orbit-one absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                  <div className="support-ai-orbit-item support-ai-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <Ticket className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-ai-orbit support-ai-orbit-two absolute left-1/2 top-1/2 h-[246px] w-[246px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="support-ai-orbit-item support-ai-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <UserRound className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-ai-float-card support-ai-float-card-one absolute -left-14 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Search className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Investigate
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Live ticket context
                      </p>
                    </div>
                  </div>
                </div>

                <div className="support-ai-float-card support-ai-float-card-two absolute -right-16 bottom-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Controlled
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Human approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-ai-scan absolute left-1/2 top-1/2 h-[1px] w-[315px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}
        <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* ===================================================
              TICKET SELECTOR
          =================================================== */}
          <aside className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Select Ticket
                  </h2>

                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                    {tickets.length} support ticket
                    {tickets.length === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadTickets()
                  }
                  disabled={loadingTickets}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-emerald-400"
                  title="Refresh tickets"
                >
                  {loadingTickets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search ticket, customer..."
                  className="h-10 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-3 text-xs font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {ticketsError ? (
                <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <p className="text-[10px] font-bold leading-5 text-rose-700 dark:text-rose-300">
                    {ticketsError}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="max-h-[440px] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-h-[calc(100vh-270px)]">
              {loadingTickets ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-[90px] animate-pulse rounded-2xl bg-muted"
                      />
                    )
                  )}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Ticket className="mx-auto h-7 w-7 text-muted-foreground/40" />

                  <p className="mt-3 text-xs font-black text-muted-foreground">
                    No tickets found
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredTickets.map(
                    (ticket) => {
                      const active =
                        ticket.id ===
                        selectedTicketId;

                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() =>
                            handleSelectTicket(
                              ticket.id
                            )
                          }
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                              : "border-transparent bg-card hover:border-border hover:bg-muted/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                                {ticket.ticketNumber}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-foreground">
                                {ticket.subject}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black ${
                                priorityClasses[
                                  ticket.priority
                                ] ??
                                priorityClasses.Normal
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="truncate text-[9px] font-semibold text-muted-foreground">
                              {ticket.customer?.name ||
                                "Unknown customer"}
                            </span>

                            <span className="text-[8px] font-black uppercase text-muted-foreground">
                              {ticket.status}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ===================================================
              COPILOT PANEL
          =================================================== */}
          <section className="min-w-0">
            {!selectedTicket ? (
              <div className="flex min-h-[480px] items-center justify-center rounded-[28px] border border-border bg-card sm:min-h-[560px]">
                <div className="max-w-sm px-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <h2 className="mt-5 text-lg font-black text-foreground">
                    Select a support ticket
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a ticket to start the AI-assisted investigation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* SELECTED TICKET CONTEXT */}
                <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                          {selectedTicket.ticketNumber}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                            priorityClasses[
                              selectedTicket.priority
                            ] ??
                            priorityClasses.Normal
                          }`}
                        >
                          {selectedTicket.priority}
                        </span>

                        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[9px] font-black text-muted-foreground">
                          {selectedTicket.status}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-black leading-7 text-foreground">
                        {selectedTicket.subject}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {selectedTicket.customer?.name ||
                            "Unknown customer"}
                        </span>

                        <span className="break-all">
                          {selectedTicket.customer?.email ||
                            "No email"}
                        </span>

                        <span>
                          {selectedTicket.category}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {selectedTicket.slaMinutes} min SLA
                        </span>

                        {selectedTicket.slaBreached ? (
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            SLA breached
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void runAnalysis()
                      }
                      disabled={analyzing}
                      className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : analysis ? (
                        <RefreshCw className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}

                      {analysis
                        ? "Re-analyze"
                        : "Analyze Ticket"}
                    </button>
                  </div>
                </div>

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

                {!analysis && !analyzing ? (
                  <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-foreground">
                          AI Support Copilot
                        </h3>

                        <p className="mt-1 text-[10px] font-medium text-emerald-700/70 dark:text-emerald-300/70">
                          Rule-engine copilot · human approval
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Run an analysis to detect ticket intent, urgency,
                      sentiment, suggested priority, possible root cause and
                      recommended next action.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <InfoMini
                        label="AI Provider"
                        value="Rule Engine"
                      />

                      <InfoMini
                        label="Mode"
                        value="Copilot"
                      />

                      <InfoMini
                        label="Financial Actions"
                        value="Disabled"
                      />
                    </div>
                  </div>
                ) : null}

                {analyzing ? (
                  <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-foreground">
                          Analyzing support ticket...
                        </p>

                        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                          Reviewing ticket context and conversation.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[1, 2, 3, 4, 5].map(
                        (item) => (
                          <div
                            key={item}
                            className="h-16 animate-pulse rounded-2xl bg-card"
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {analysis ? (
                  <>
                    {/* TOP AI SIGNALS */}
                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                      <MetricCard
                        label="Confidence"
                        value={`${analysis.confidence}%`}
                        icon={
                          <Sparkles className="h-4 w-4" />
                        }
                      />

                      <MetricCard
                        label="Detected Intent"
                        value={analysis.intent}
                        icon={
                          <Ticket className="h-4 w-4" />
                        }
                      />

                      <MetricCard
                        label="Urgency"
                        value={analysis.urgency}
                        valueClass={
                          urgencyClasses[
                            analysis.urgency
                          ]
                        }
                        icon={
                          <AlertTriangle className="h-4 w-4" />
                        }
                      />

                      <MetricCard
                        label="Sentiment"
                        value={analysis.sentiment}
                        icon={
                          <UserRound className="h-4 w-4" />
                        }
                      />
                    </div>

                    <div
                      className={`rounded-[26px] border p-5 shadow-sm ${
                        analysis.verification.status ===
                        "verified"
                          ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                          : analysis.verification.status ===
                              "partially_verified"
                            ? "border-amber-500/20 bg-amber-500/[0.07]"
                            : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                            Evidence status ·{" "}
                            {analysis.verification.status.replace(
                              "_",
                              " "
                            )}
                          </p>

                          <p className="mt-1 text-sm font-black text-foreground">
                            {analysis.verification.label}
                          </p>

                          {analysis.verification.evidence.length > 0 ? (
                            <ul className="mt-3 space-y-1.5">
                              {analysis.verification.evidence.map(
                                (item) => (
                                  <li
                                    key={item}
                                    className="flex gap-2 text-xs leading-5 text-muted-foreground"
                                  >
                                    <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              The customer claim needs manual verification because no matching live record was found.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ANALYSIS BODY */}
                    <div className="grid gap-5 lg:grid-cols-2">
                      <AnalysisCard
                        title="Ticket Summary"
                        value={analysis.summary}
                      />

                      <AnalysisCard
                        title="Possible Root Cause"
                        value={
                          analysis.possibleRootCause
                        }
                      />

                      <AnalysisCard
                        title="Recommended Next Action"
                        value={
                          analysis.recommendedNextAction
                        }
                        accent="green"
                      />

                      <div className="rounded-[26px] border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                            Suggested Priority
                          </p>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${
                              priorityClasses[
                                analysis
                                  .suggestedPriority
                              ] ??
                              priorityClasses.Normal
                            }`}
                          >
                            {
                              analysis.suggestedPriority
                            }
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                            Current Status
                          </p>

                          <p className="mt-1 text-sm font-black text-foreground">
                            {analysis.context.status}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                            SLA
                          </p>

                          <p
                            className={`mt-1 text-sm font-black ${
                              analysis.context
                                .slaBreached
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-foreground"
                            }`}
                          >
                            {analysis.context.slaBreached
                              ? "Breached"
                              : `${analysis.context.slaMinutes} minutes remaining`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CUSTOMER CONTEXT */}
                    <div className="rounded-[26px] border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />

                        <h3 className="text-sm font-black text-foreground">
                          Customer Context
                        </h3>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ContextItem
                          label="Customer"
                          value={
                            analysis.context
                              .customerName
                          }
                        />

                        <ContextItem
                          label="Email"
                          value={
                            analysis.context
                              .customerEmail
                          }
                        />

                        <ContextItem
                          label="Category"
                          value={
                            analysis.context.category
                          }
                        />

                        <ContextItem
                          label="Messages"
                          value={String(
                            analysis.context
                              .messageCount
                          )}
                        />
                      </div>
                    </div>

                    {/* SUGGESTED REPLY */}
                    <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                            Suggested Customer Reply
                          </p>

                          <h3 className="mt-1 text-sm font-black text-foreground">
                            Human-reviewed response draft
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void copySuggestedReply()
                          }
                          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white transition hover:bg-emerald-700 sm:w-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />

                          {replyCopied
                            ? "Copied"
                            : "Copy Reply"}
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-card p-4">
                        <p className="text-sm leading-7 text-foreground/85">
                          {analysis.suggestedReply}
                        </p>
                      </div>
                    </div>

                    {/* SAFETY */}
                    <div className="rounded-[26px] border border-amber-500/20 bg-amber-500/[0.07] p-5">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

                        <div>
                          <h3 className="text-sm font-black text-foreground">
                            AI Safety Controls
                          </h3>

                          <p className="mt-1 text-xs leading-6 text-muted-foreground">
                            AI only recommends investigation and communication
                            steps. It cannot execute financial actions.
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-amber-500/20 bg-card px-3 py-1.5 text-[9px] font-black text-amber-700 dark:text-amber-300">
                              Human approval required
                            </span>

                            <span className="rounded-full border border-amber-500/20 bg-card px-3 py-1.5 text-[9px] font-black text-amber-700 dark:text-amber-300">
                              Financial actions disabled
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </section>
        </section>
      </div>

      <style>{`
        .support-ai-hero {
          isolation: isolate;
        }

        .support-ai-grid {
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
          animation: supportAiGridMove 20s linear infinite;
        }

        .support-ai-stars {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.20) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 28%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 36% 82%, rgba(255,255,255,0.14) 0 1px, transparent 1px);
          background-size: 82px 82px, 104px 104px, 126px 126px;
          animation: supportAiStars 28s linear infinite;
        }

        .support-ai-orb {
          animation: supportAiOrb 7.5s ease-in-out infinite;
        }

        .support-ai-orb-delayed {
          animation: supportAiOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .support-ai-beam {
          animation: supportAiBeam 8s ease-in-out infinite;
        }

        .support-ai-ring-one {
          animation: supportAiRing 12s linear infinite;
        }

        .support-ai-ring-two {
          animation: supportAiRing 8.5s linear infinite reverse;
        }

        .support-ai-live-dot {
          box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.65);
          animation: supportAiLiveDot 2s ease-out infinite;
        }

        .support-ai-icon-pulse {
          animation: supportAiIconPulse 3.2s ease-out infinite;
        }

        .support-ai-card-shine {
          animation: supportAiCardShine 6.5s ease-in-out infinite;
        }

        .support-ai-core {
          animation: supportAiCoreFloat 5.3s ease-in-out infinite;
        }

        .support-ai-core-ring {
          animation: supportAiCoreRing 3.5s ease-out infinite;
        }

        .support-ai-core-ring-delay {
          animation-delay: 1.75s;
        }

        .support-ai-orbit-one {
          animation: supportAiOrbit 13s linear infinite;
        }

        .support-ai-orbit-two {
          animation: supportAiOrbit 18s linear infinite reverse;
        }

        .support-ai-orbit-item-one {
          animation: supportAiCounterOrbit 13s linear infinite reverse;
        }

        .support-ai-orbit-item-two {
          animation: supportAiCounterOrbit 18s linear infinite;
        }

        .support-ai-float-card-one {
          animation: supportAiFloatCard 5.4s ease-in-out infinite;
        }

        .support-ai-float-card-two {
          animation: supportAiFloatCard 6.3s ease-in-out 0.8s infinite reverse;
        }

        .support-ai-scan {
          animation: supportAiScan 4.4s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209, 250, 229, 0.6));
        }

        @keyframes supportAiGridMove {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(28px, 28px, 0);
          }
        }

        @keyframes supportAiStars {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-46px, 30px, 0);
          }
        }

        @keyframes supportAiOrb {
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

        @keyframes supportAiBeam {
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

        @keyframes supportAiRing {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        @keyframes supportAiLiveDot {
          0% {
            box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.58);
          }
          75%,
          100% {
            box-shadow: 0 0 0 8px rgba(167, 243, 208, 0);
          }
        }

        @keyframes supportAiIconPulse {
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

        @keyframes supportAiCardShine {
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

        @keyframes supportAiCoreFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-7px) rotate(1.6deg);
          }
        }

        @keyframes supportAiCoreRing {
          0% {
            transform: scale(0.88);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes supportAiOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes supportAiCounterOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes supportAiFloatCard {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -9px, 0);
          }
        }

        @keyframes supportAiScan {
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
          .support-ai-grid {
            background-size: 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-ai-grid,
          .support-ai-stars,
          .support-ai-orb,
          .support-ai-orb-delayed,
          .support-ai-beam,
          .support-ai-ring-one,
          .support-ai-ring-two,
          .support-ai-live-dot,
          .support-ai-icon-pulse,
          .support-ai-card-shine,
          .support-ai-core,
          .support-ai-core-ring,
          .support-ai-orbit-one,
          .support-ai-orbit-two,
          .support-ai-orbit-item-one,
          .support-ai-orbit-item-two,
          .support-ai-float-card-one,
          .support-ai-float-card-two,
          .support-ai-scan {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function InfoMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        {icon}

        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-muted-foreground">
          {label}
        </p>
      </div>

      {valueClass ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${valueClass}`}
          >
            {value}
          </span>
        </div>
      ) : (
        <p className="mt-3 break-words text-lg font-black text-foreground">
          {value}
        </p>
      )}
    </div>
  );
}

function AnalysisCard({
  title,
  value,
  accent = "violet",
}: {
  title: string;
  value: string;
  accent?: "violet" | "green";
}) {
  const accentClasses =
    accent === "green"
      ? "border-emerald-500/20 bg-emerald-500/[0.07]"
      : "border-teal-500/20 bg-teal-500/[0.06]";

  return (
    <div
      className={`rounded-[26px] border p-5 ${accentClasses}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>

      <p className="mt-3 text-sm leading-7 text-foreground/85">
        {value}
      </p>
    </div>
  );
}

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/70 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}
