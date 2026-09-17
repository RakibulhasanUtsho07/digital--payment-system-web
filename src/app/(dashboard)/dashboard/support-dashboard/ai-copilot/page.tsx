"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
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
    "border-rose-200 bg-rose-50 text-rose-700",
  High:
    "border-orange-200 bg-orange-50 text-orange-700",
  Normal:
    "border-sky-200 bg-sky-50 text-sky-700",
  Low:
    "border-slate-200 bg-slate-50 text-slate-600",
};

const urgencyClasses: Record<string, string> = {
  Critical:
    "border-rose-200 bg-rose-50 text-rose-700",
  High:
    "border-orange-200 bg-orange-50 text-orange-700",
  Moderate:
    "border-amber-200 bg-amber-50 text-amber-700",
  Low:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
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
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <section className="mb-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_14px_45px_rgba(16,185,129,0.06)]">
          <div className="relative p-5 md:p-6">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-50 blur-3xl" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                      Support Operations
                    </p>

                    <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                      AI Copilot
                    </h1>
                  </div>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  AI-assisted support investigation for
                  ticket summary, intent, urgency, possible
                  root cause and suggested customer reply.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2">
                <ShieldAlert className="h-4 w-4 text-violet-600" />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-500">
                    Safety mode
                  </p>

                  <p className="text-xs font-bold text-violet-800">
                    Human approval required
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}
        <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* ===================================================
              TICKET SELECTOR
          =================================================== */}
          <aside className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    Select Ticket
                  </h2>

                  <p className="mt-1 text-[10px] font-medium text-slate-400">
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search ticket, customer..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white"
                />
              </div>

              {ticketsError ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-[10px] font-bold leading-5 text-rose-700">
                    {ticketsError}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="max-h-[calc(100vh-270px)] overflow-y-auto p-2">
              {loadingTickets ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-[90px] animate-pulse rounded-2xl bg-slate-100"
                      />
                    )
                  )}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Ticket className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-3 text-xs font-black text-slate-500">
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
                              ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
                              : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-emerald-600">
                                {ticket.ticketNumber}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-800">
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
                            <span className="truncate text-[9px] font-semibold text-slate-400">
                              {ticket.customer?.name ||
                                "Unknown customer"}
                            </span>

                            <span className="text-[8px] font-black uppercase text-slate-400">
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
              <div className="flex min-h-[560px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
                <div className="max-w-sm px-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <h2 className="mt-5 text-lg font-black text-slate-900">
                    Select a support ticket
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose a ticket from the left side to
                    start the AI investigation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* =============================================
                    SELECTED TICKET CONTEXT
                ============================================= */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">
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

                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black text-slate-600">
                          {selectedTicket.status}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-black leading-7 text-slate-900">
                        {selectedTicket.subject}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {selectedTicket.customer?.name ||
                            "Unknown customer"}
                        </span>

                        <span>
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
                          <span className="font-black text-rose-600">
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
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                      <p className="text-xs font-bold leading-5 text-rose-700">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!analysis && !analyzing ? (
                  <div className="rounded-[28px] border border-violet-200 bg-[#FAF7FF] p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                        <Sparkles className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-violet-900">
                          AI Support Copilot
                        </h3>

                        <p className="mt-1 text-[10px] font-medium text-violet-500">
                          Rule-engine copilot · human approval
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                      Run an analysis to detect ticket intent,
                      urgency, sentiment, suggested priority,
                      possible root cause and recommended next
                      action.
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
                  <div className="rounded-[28px] border border-violet-200 bg-[#FAF7FF] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-violet-900">
                          Analyzing support ticket...
                        </p>

                        <p className="mt-1 text-[10px] font-medium text-violet-500">
                          Reviewing ticket context and conversation.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[1, 2, 3, 4, 5].map(
                        (item) => (
                          <div
                            key={item}
                            className="h-16 animate-pulse rounded-2xl bg-white"
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {analysis ? (
                  <>
                    {/* ==========================================
                        TOP AI SIGNALS
                    ========================================== */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                    {/* ==========================================
                        ANALYSIS BODY
                    ========================================== */}
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

                      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
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
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Current Status
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-800">
                            {analysis.context.status}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            SLA
                          </p>

                          <p
                            className={`mt-1 text-sm font-black ${
                              analysis.context
                                .slaBreached
                                ? "text-rose-600"
                                : "text-slate-800"
                            }`}
                          >
                            {analysis.context.slaBreached
                              ? "Breached"
                              : `${analysis.context.slaMinutes} minutes remaining`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ==========================================
                        CUSTOMER CONTEXT
                    ========================================== */}
                    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-slate-500" />

                        <h3 className="text-sm font-black text-slate-900">
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

                    {/* ==========================================
                        SUGGESTED REPLY
                    ========================================== */}
                    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-600">
                            Suggested Customer Reply
                          </p>

                          <h3 className="mt-1 text-sm font-black text-emerald-950">
                            Human-reviewed response draft
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void copySuggestedReply()
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white transition hover:bg-emerald-700"
                        >
                          {replyCopied ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}

                          {replyCopied
                            ? "Copied"
                            : "Copy Reply"}
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                        <p className="text-sm leading-7 text-slate-700">
                          {analysis.suggestedReply}
                        </p>
                      </div>
                    </div>

                    {/* ==========================================
                        SAFETY
                    ========================================== */}
                    <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div>
                          <h3 className="text-sm font-black text-amber-900">
                            AI Safety Controls
                          </h3>

                          <p className="mt-1 text-xs leading-6 text-amber-800/80">
                            AI only recommends investigation
                            and communication steps. It cannot
                            execute financial actions.
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[9px] font-black text-amber-800">
                              Human approval required
                            </span>

                            <span className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[9px] font-black text-amber-800">
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
    <div className="rounded-2xl border border-violet-100 bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-violet-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-violet-900">
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-violet-600">
        {icon}

        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
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
        <p className="mt-3 text-lg font-black text-slate-900">
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
      ? "border-emerald-200 bg-emerald-50/40"
      : "border-violet-200 bg-violet-50/40";

  const textClasses =
    accent === "green"
      ? "text-emerald-950"
      : "text-violet-950";

  return (
    <div
      className={`rounded-[26px] border p-5 ${accentClasses}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>

      <p
        className={`mt-3 text-sm leading-7 ${textClasses}`}
      >
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