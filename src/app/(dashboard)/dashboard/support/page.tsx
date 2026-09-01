// src/app/(dashboard)/dashboard/support/page.tsx
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
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  Inbox,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  SunMedium,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

import {
  supportApi,
  type CreateSupportTicketInput,
  type SupportAttention,
  type SupportMetrics,
  type SupportTicketDetail,
  type SupportTicketSummary,
  type TicketCategory,
  type TicketListQuery,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportApi";

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

const EMPTY_METRICS: SupportMetrics = {
  openTickets: 0,
  pendingReplies: 0,
  slaRisk: 0,
  breached: 0,
  resolvedToday: 0,
  csat: null,
  unassigned: 0,
  escalated: 0,
};

const EMPTY_ATTENTION: SupportAttention = {
  slaDueSoon: 0,
  priorityWaiting: 0,
  escalated: 0,
  unassigned: 0,
};

export default function SupportDashboard() {
  const [metrics, setMetrics] =
    useState<SupportMetrics>(EMPTY_METRICS);
  const [attention, setAttention] =
    useState<SupportAttention>(EMPTY_ATTENTION);
  const [tickets, setTickets] =
    useState<SupportTicketSummary[]>([]);
  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicketDetail | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<TicketStatus | "All">("All");
  const [priority, setPriority] =
    useState<TicketPriority | "All">("All");
  const [category, setCategory] =
    useState<TicketCategory | "All">("All");
  const [sla, setSla] =
    useState<"All" | "Due Soon" | "Breached">("All");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] =
    useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] =
    useState(false);
  const [createOpen, setCreateOpen] =
    useState(false);
  const [toast, setToast] =
    useState<string | null>(null);

  const query: TicketListQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
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

  const loadDashboard = useCallback(
    async (mode: "load" | "refresh" = "load") => {
      mode === "load"
        ? setIsLoading(true)
        : setIsRefreshing(true);

      setError("");

      try {
        const [overview, queue] =
          await Promise.all([
            supportApi.getOverview(),
            supportApi.getTickets(query),
          ]);

        setMetrics(overview.metrics);
        setAttention(overview.attention);
        setTickets(queue.tickets);
        setPages(queue.pagination.pages);
        setTotal(queue.pagination.total);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Support Operations."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [query]
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadDashboard("load"),
      220
    );

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, category, sla]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(
      () => setToast(null),
      2600
    );

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }

    let active = true;

    void supportApi
      .getTicket(selectedTicketId)
      .then((response) => {
        if (active) {
          setSelectedTicket(response.ticket);
        }
      })
      .catch((detailError) => {
        if (active) {
          setToast(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load ticket details."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  const refreshSelectedTicket = async (
    ticketId: string
  ) => {
    const response =
      await supportApi.getTicket(ticketId);

    setSelectedTicket(response.ticket);
    await loadDashboard("refresh");
  };

  const filterForAttention = (
    type:
      | "sla"
      | "priority"
      | "escalated"
      | "unassigned"
  ) => {
    setSearch("");

    if (type === "sla") {
      setSla("Due Soon");
      setStatus("All");
      setPriority("All");
    }

    if (type === "priority") {
      setPriority("Urgent");
      setStatus("All");
      setSla("All");
    }

    if (type === "escalated") {
      setStatus("Escalated");
      setPriority("All");
      setSla("All");
    }

    if (type === "unassigned") {
      setStatus("All");
      setPriority("All");
      setSla("All");
      setToast(
        "Open an unassigned ticket and choose an owner from the ticket workflow."
      );
    }

    document
      .getElementById("support-queue")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setCategory("All");
    setSla("All");
    setPage(1);
  };

  const activeFilterCount = [
    status !== "All",
    priority !== "All",
    category !== "All",
    sla !== "All",
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#F4F8FC] px-4 py-5 font-sans text-[#0F2745] sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <SupportHeader
          refreshing={isRefreshing}
          onRefresh={() => void loadDashboard("refresh")}
          onExport={async () => {
            try {
              await supportApi.downloadExport(query);
              setToast("Support queue export prepared.");
            } catch (exportError) {
              setToast(
                exportError instanceof Error
                  ? exportError.message
                  : "Unable to export support tickets."
              );
            }
          }}
          onCreate={() => setCreateOpen(true)}
        />

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
          <SupportPulse
            metrics={metrics}
            loading={isLoading}
          />
          <SupportWeather metrics={metrics} />
        </section>

        <AttentionGrid
          attention={attention}
          onSelect={filterForAttention}
        />

        <section
          id="support-queue"
          className="relative mt-6 overflow-visible rounded-[28px] border border-[#DCE7F0] bg-white shadow-[0_14px_50px_rgba(15,39,69,0.06)]"
        >
          <QueueToolbar
            search={search}
            setSearch={setSearch}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            activeFilterCount={activeFilterCount}
            total={total}
            onClear={clearFilters}
          />

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="relative z-30 border-b border-slate-100 bg-[#F8FBFE]"
              >
                <div className="grid gap-3 p-4 md:grid-cols-4">
                  <FilterSelect
                    label="Status"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(value) =>
                      setStatus(
                        value as TicketStatus | "All"
                      )
                    }
                  />
                  <FilterSelect
                    label="Priority"
                    value={priority}
                    options={PRIORITY_OPTIONS}
                    onChange={(value) =>
                      setPriority(
                        value as TicketPriority | "All"
                      )
                    }
                  />
                  <FilterSelect
                    label="Category"
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={(value) =>
                      setCategory(
                        value as TicketCategory | "All"
                      )
                    }
                  />
                  <FilterSelect
                    label="SLA"
                    value={sla}
                    options={[
                      "All",
                      "Due Soon",
                      "Breached",
                    ]}
                    onChange={(value) =>
                      setSla(
                        value as
                          | "All"
                          | "Due Soon"
                          | "Breached"
                      )
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <SupportQueue
            loading={isLoading}
            tickets={tickets}
            onOpen={setSelectedTicketId}
          />

          <QueuePagination
            page={page}
            pages={pages}
            total={total}
            onPage={setPage}
          />
        </section>
      </div>

      <AnimatePresence>
        {selectedTicketId && (
          <>
            <motion.button
              type="button"
              aria-label="Close ticket drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketId(null)}
              className="fixed inset-0 z-40 bg-[#0A2038]/40 backdrop-blur-[2px]"
            />

            <TicketDrawer
              ticket={selectedTicket}
              onClose={() => setSelectedTicketId(null)}
              onUpdated={async (ticketId, message) => {
                setToast(message);
                await refreshSelectedTicket(ticketId);
              }}
            />
          </>
        )}
      </AnimatePresence>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (ticket) => {
          setCreateOpen(false);
          setToast(
            `${ticket.ticketNumber} created successfully.`
          );
          await loadDashboard("refresh");
          setSelectedTicketId(ticket.id);
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-4 top-4 z-[120] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#D6E5F0] bg-white p-4 shadow-2xl"
          >
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-black text-[#0F2745]">
                  Support Operations
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {toast}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}


function SupportHeader({
  refreshing,
  onRefresh,
  onExport,
  onCreate,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onCreate: () => void;
}) {
  return (
    <header className="rounded-[28px] border border-[#DCE7F0] bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,39,69,0.05)] backdrop-blur md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#0F2745] md:text-[30px]">
              Support Operations
            </h1>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Operational
            </span>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#1F5EA8]">
              Administrator
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Resolve customer issues, control SLA risk, coordinate ownership, and keep every support action auditable from one workspace.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <HeaderButton
            icon={Download}
            label="Export"
            onClick={onExport}
          />
          <HeaderButton
            icon={RefreshCcw}
            label="Refresh"
            onClick={onRefresh}
            spinning={refreshing}
          />
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F5EA8] to-[#256DB9] px-4 text-xs font-black text-white shadow-[0_10px_24px_rgba(31,94,168,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,94,168,0.28)] sm:px-5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              Create Ticket
            </span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  icon: Icon,
  label,
  onClick,
  spinning = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE7F0] bg-white px-3 text-xs font-black text-[#173F6D] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 sm:px-4"
    >
      <Icon
        className={`h-4 w-4 ${
          spinning ? "animate-spin" : ""
        }`}
      />
      {label}
    </button>
  );
}

function SupportPulse({
  metrics,
  loading,
}: {
  metrics: SupportMetrics;
  loading: boolean;
}) {
  const items = [
    {
      label: "Open Tickets",
      value: metrics.openTickets,
      icon: Inbox,
      tone: "text-white",
    },
    {
      label: "Pending Replies",
      value: metrics.pendingReplies,
      icon: MessageSquare,
      tone: "text-blue-100",
    },
    {
      label: "SLA Risk",
      value: metrics.slaRisk,
      icon: Clock3,
      tone: "text-amber-300",
    },
    {
      label: "Resolved Today",
      value: metrics.resolvedToday,
      icon: CheckCircle2,
      tone: "text-emerald-300",
    },
    {
      label: "CSAT",
      value:
        metrics.csat === null
          ? "—"
          : `${metrics.csat.toFixed(1)}%`,
      icon: Sparkles,
      tone: "text-cyan-300",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] border border-[#183B5E] bg-gradient-to-br from-[#0C2846] via-[#10385D] to-[#154A77] p-5 text-white shadow-[0_18px_48px_rgba(15,39,69,0.18)] md:p-6"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/80">
                Live Support Pulse
              </p>
            </div>

            <h2 className="mt-1 text-lg font-black">
              Queue health at a glance
            </h2>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold text-blue-100/70">
            Admin intelligence
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
              }}
              className="group rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/20 hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-2">
                <item.icon className="h-4 w-4 text-blue-100/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/50" />
              </div>

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.12em] text-blue-100/50">
                {item.label}
              </p>

              <div
                className={`mt-1 text-2xl font-black tracking-tight ${item.tone}`}
              >
                {loading ? (
                  <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  item.value
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SupportWeather({
  metrics,
}: {
  metrics: SupportMetrics;
}) {
  const state =
    metrics.breached > 0
      ? {
          label: "Pressure Rising",
          text: "Breached cases need immediate ownership.",
          icon: ShieldAlert,
          bg: "from-rose-50 to-white",
          iconBg: "bg-rose-50",
          iconColor: "text-rose-500",
          pill: "bg-rose-50 text-rose-600 border-rose-100",
        }
      : metrics.slaRisk >= 10
        ? {
            label: "Watch Queue",
            text: "Several tickets are approaching SLA limits.",
            icon: BellRing,
            bg: "from-amber-50 to-white",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            pill: "bg-amber-50 text-amber-700 border-amber-100",
          }
        : {
            label: "Clear Skies",
            text: "Backlog is healthy and SLA pressure is controlled.",
            icon: SunMedium,
            bg: "from-emerald-50 to-white",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
          };

  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[28px] border border-[#DCE7F0] bg-gradient-to-br ${state.bg} p-5 shadow-[0_14px_40px_rgba(15,39,69,0.06)] md:p-6`}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${state.iconBg}`}
          >
            <Icon
              className={`h-6 w-6 ${state.iconColor}`}
            />
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${state.pill}`}
          >
            Live indicator
          </span>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6F8DAA]">
            Support Weather
          </p>
          <h3 className="mt-1 text-xl font-black text-[#0F2745]">
            {state.label}
          </h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {state.text}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniWeatherStat
            label="Breached"
            value={metrics.breached}
            tone={
              metrics.breached > 0
                ? "text-rose-600"
                : "text-emerald-600"
            }
          />
          <MiniWeatherStat
            label="Escalated"
            value={metrics.escalated}
            tone="text-amber-700"
          />
        </div>
      </div>
    </motion.div>
  );
}

function MiniWeatherStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function AttentionGrid({
  attention,
  onSelect,
}: {
  attention: SupportAttention;
  onSelect: (
    type:
      | "sla"
      | "priority"
      | "escalated"
      | "unassigned"
  ) => void;
}) {
  const items = [
    {
      title: "SLA Due Soon",
      value: attention.slaDueSoon,
      description:
        "Tickets may breach within the next 15 minutes.",
      action: "Review Queue",
      type: "sla" as const,
      accent: "rose" as const,
      icon: Clock3,
    },
    {
      title: "Priority Waiting",
      value: attention.priorityWaiting,
      description:
        "Urgent and high-priority customers need a reply.",
      action: "Open Priority",
      type: "priority" as const,
      accent: "amber" as const,
      icon: Zap,
    },
    {
      title: "Escalated Cases",
      value: attention.escalated,
      description:
        "Cases currently routed to higher-level support.",
      action: "Review Escalations",
      type: "escalated" as const,
      accent: "blue" as const,
      icon: ShieldAlert,
    },
    {
      title: "Unassigned Queue",
      value: attention.unassigned,
      description:
        "Tickets still need a clear owner.",
      action: "Assign Owners",
      type: "unassigned" as const,
      accent: "cyan" as const,
      icon: UsersRound,
    },
  ];

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-rose-500" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#173F6D]">
          Attention Required
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <AttentionCard
            key={item.title}
            {...item}
            delay={index * 0.04}
            onClick={() => onSelect(item.type)}
          />
        ))}
      </div>
    </section>
  );
}

function AttentionCard({
  title,
  value,
  description,
  action,
  accent,
  icon: Icon,
  delay,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  action: string;
  accent: "rose" | "amber" | "blue" | "cyan";
  icon: React.ElementType;
  delay: number;
  onClick: () => void;
}) {
  const tone = {
    rose: {
      line: "bg-rose-500",
      icon: "bg-rose-50 text-rose-500",
      action: "text-rose-600",
    },
    amber: {
      line: "bg-amber-500",
      icon: "bg-amber-50 text-amber-600",
      action: "text-amber-700",
    },
    blue: {
      line: "bg-blue-500",
      icon: "bg-blue-50 text-blue-600",
      action: "text-blue-600",
    },
    cyan: {
      line: "bg-cyan-500",
      icon: "bg-cyan-50 text-cyan-700",
      action: "text-cyan-700",
    },
  }[accent];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-[22px] border border-[#DCE7F0] bg-white p-4 text-left shadow-[0_8px_28px_rgba(15,39,69,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,39,69,0.08)]"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${tone.line}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-2xl font-black text-[#0F2745]">
          {value}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-black text-[#0F2745]">
        {title}
      </h3>

      <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-500">
        {description}
      </p>

      <div
        className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black ${tone.action}`}
      >
        {action}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

function QueueToolbar({
  search,
  setSearch,
  showFilters,
  setShowFilters,
  activeFilterCount,
  total,
  onClear,
}: {
  search: string;
  setSearch: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  activeFilterCount: number;
  total: number;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 bg-[#FBFDFF] p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1F5EA8]">
          <Inbox className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-[#0F2745]">
            Support Queue
          </h2>
          <p className="text-[10px] text-slate-400">
            {total.toLocaleString()} matching tickets
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
        <label className="relative min-w-0 flex-1 md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search ticket, customer or subject..."
            className="h-11 w-full rounded-2xl border border-[#DCE7F0] bg-white pl-9 pr-3 text-xs text-[#0F2745] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="relative inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE7F0] bg-white px-4 text-xs font-black text-[#173F6D] transition hover:bg-blue-50/60"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1F5EA8] px-1 text-[9px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {(activeFilterCount > 0 || search) && (
          <button
            type="button"
            onClick={onClear}
            className="h-11 rounded-2xl px-3 text-[10px] font-black text-slate-500 transition hover:bg-slate-100"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const theme =
    label === "Priority"
      ? {
          icon: Zap,
          iconWrap:
            "border-amber-200 bg-amber-50 text-amber-700",
          ring:
            "focus-visible:ring-amber-200/70",
          glow:
            "from-amber-200/25 via-transparent to-transparent",
          menuAccent:
            "from-amber-400 via-orange-400 to-rose-400",
        }
      : label === "Category"
        ? {
            icon: Inbox,
            iconWrap:
              "border-violet-200 bg-violet-50 text-violet-700",
            ring:
              "focus-visible:ring-violet-200/70",
            glow:
              "from-violet-200/25 via-transparent to-transparent",
            menuAccent:
              "from-violet-500 via-indigo-500 to-blue-500",
          }
        : label === "SLA"
          ? {
              icon: Clock3,
              iconWrap:
                "border-rose-200 bg-rose-50 text-rose-700",
              ring:
                "focus-visible:ring-rose-200/70",
              glow:
                "from-rose-200/25 via-transparent to-transparent",
              menuAccent:
                "from-rose-500 via-pink-500 to-orange-400",
            }
          : {
              icon: Sparkles,
              iconWrap:
                "border-blue-200 bg-blue-50 text-blue-700",
              ring:
                "focus-visible:ring-blue-200/70",
              glow:
                "from-blue-200/25 via-transparent to-transparent",
              menuAccent:
                "from-blue-500 via-cyan-500 to-sky-400",
            };

  const Icon = theme.icon;

  return (
    <div
      className={`relative ${
        open ? "z-[70]" : "z-10"
      }`}
    >
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => !current)
        }
        className={`group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#D8E5EF] bg-white px-2.5 text-left shadow-[0_6px_18px_rgba(15,39,69,0.04)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFD5E8] hover:shadow-[0_12px_28px_rgba(15,39,69,0.09)] focus-visible:ring-4 ${theme.ring}`}
      >
        <span
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${theme.glow} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
        />

        <span
          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${theme.iconWrap}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="relative z-10 min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-[#173F6D]">
            {value}
          </span>
          <span className="mt-0.5 block truncate text-[8px] font-semibold text-slate-400">
            {value === "All"
              ? `Any ${label.toLowerCase()}`
              : `Filtered by ${label.toLowerCase()}`}
          </span>
        </span>

        <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F9FC] text-slate-400 transition group-hover:bg-blue-50 group-hover:text-[#1F5EA8]">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label={`Close ${label} filter`}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] cursor-default"
            />

            <motion.div
              role="listbox"
              aria-label={`${label} filter options`}
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -6,
                scale: 0.98,
              }}
              transition={{
                duration: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-[20px] border border-[#D6E4EF] bg-white/95 p-2 shadow-[0_22px_60px_rgba(15,39,69,0.18)] backdrop-blur-xl"
            >
              <div
                className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${theme.menuAccent}`}
              />

              <div className="mb-1 flex items-center justify-between px-2 py-1.5">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Select {label}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
                    Update queue instantly
                  </p>
                </div>

                <span className="rounded-lg bg-slate-50 px-2 py-1 text-[8px] font-black text-slate-400">
                  {options.length} options
                </span>
              </div>

              <div className="max-h-64 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                {options.map((option, index) => {
                  const selected =
                    option === value;

                  const optionTone =
                    getFilterOptionTone(option);

                  return (
                    <motion.button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      key={option}
                      whileHover={{
                        x: 2,
                      }}
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                      className={`group/option flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                        selected
                          ? "bg-gradient-to-r from-[#EEF6FF] to-[#F7FBFF] ring-1 ring-inset ring-blue-100"
                          : "hover:bg-[#F7FAFD]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${optionTone.wrap}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${optionTone.dot}`}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[11px] font-black ${
                            selected
                              ? "text-[#1259A7]"
                              : "text-[#173F6D]"
                          }`}
                        >
                          {option}
                        </span>
                        <span className="mt-0.5 block text-[8px] font-medium text-slate-400">
                          {option === "All"
                            ? "Show every matching ticket"
                            : `Use ${option.toLowerCase()} filter`}
                        </span>
                      </span>

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                          selected
                            ? "bg-[#1F5EA8] text-white shadow-sm"
                            : "bg-slate-50 text-transparent group-hover/option:text-slate-300"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>

                      <span className="hidden">
                        {index + 1}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function getFilterOptionTone(
  option: string
): {
  wrap: string;
  dot: string;
} {
  const normalized =
    option.toLowerCase();

  if (
    normalized.includes("urgent") ||
    normalized.includes("breached") ||
    normalized.includes("security") ||
    normalized.includes("escalated")
  ) {
    return {
      wrap:
        "border-rose-100 bg-rose-50",
      dot:
        "bg-rose-500",
    };
  }

  if (
    normalized.includes("high") ||
    normalized.includes("due soon") ||
    normalized.includes("waiting") ||
    normalized.includes("kyc")
  ) {
    return {
      wrap:
        "border-amber-100 bg-amber-50",
      dot:
        "bg-amber-500",
    };
  }

  if (
    normalized.includes("resolved") ||
    normalized.includes("deposit") ||
    normalized.includes("low")
  ) {
    return {
      wrap:
        "border-emerald-100 bg-emerald-50",
      dot:
        "bg-emerald-500",
    };
  }

  if (
    normalized.includes("withdrawal") ||
    normalized.includes("account")
  ) {
    return {
      wrap:
        "border-violet-100 bg-violet-50",
      dot:
        "bg-violet-500",
    };
  }

  if (
    normalized.includes("transfer") ||
    normalized.includes("progress")
  ) {
    return {
      wrap:
        "border-cyan-100 bg-cyan-50",
      dot:
        "bg-cyan-500",
    };
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("normal")
  ) {
    return {
      wrap:
        "border-blue-100 bg-blue-50",
      dot:
        "bg-blue-500",
    };
  }

  return {
    wrap:
      "border-slate-200 bg-slate-50",
    dot:
      "bg-slate-400",
  };
}


function SupportQueue({
  loading,
  tickets,
  onOpen,
}: {
  loading: boolean;
  tickets: SupportTicketSummary[];
  onOpen: (ticketId: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1F5EA8]">
            <Inbox className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-black text-[#0F2745]">
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
      <table className="w-full min-w-[1050px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-[#F8FBFE]">
            {[
              "Ticket",
              "Customer",
              "Issue",
              "Priority",
              "Status",
              "Owner",
              "SLA",
              "Action",
            ].map((label, index) => (
              <th
                key={label}
                className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 ${
                  index === 7 ? "text-right" : ""
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket, index) => (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => onOpen(ticket.id)}
              className="group cursor-pointer bg-white transition hover:bg-[#F7FBFF]"
            >
              <td className="px-5 py-4">
                <p className="text-xs font-black text-[#1F5EA8]">
                  {ticket.ticketNumber}
                </p>
                <p className="mt-1 text-[9px] text-slate-400">
                  {formatRelativeTime(ticket.lastActivityAt)}
                </p>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-[9px] font-black text-[#1F5EA8]">
                    {getInitials(ticket.customerName)}
                  </span>

                  <div className="min-w-0">
                    <p className="max-w-[180px] truncate text-xs font-black text-[#0F2745]">
                      {ticket.customerName}
                    </p>
                    <p className="mt-0.5 max-w-[190px] truncate text-[9px] text-slate-400">
                      {ticket.customerEmail}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <p className="max-w-[260px] truncate text-xs font-bold text-[#0F2745]">
                  {ticket.subject}
                </p>
                <p className="mt-1 text-[9px] font-semibold text-slate-400">
                  {ticket.category}
                </p>
              </td>

              <td className="px-5 py-4">
                <PriorityBadge priority={ticket.priority} />
              </td>

              <td className="px-5 py-4">
                <StatusBadge status={ticket.status} />
              </td>

              <td className="px-5 py-4">
                <p
                  className={`text-[10px] font-black ${
                    ticket.assignee.id
                      ? "text-[#173F6D]"
                      : "text-amber-700"
                  }`}
                >
                  {ticket.assignee.name}
                </p>
              </td>

              <td className="px-5 py-4">
                <SlaBadge
                  minutes={ticket.slaMinutes}
                  breached={ticket.slaBreached}
                />
              </td>

              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(ticket.id);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition group-hover:bg-blue-50 group-hover:text-[#1F5EA8]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueuePagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#FBFDFF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[10px] font-semibold text-slate-400">
        {total.toLocaleString()} total tickets
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE7F0] bg-white text-[#173F6D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-[#1F5EA8]">
          {page} / {Math.max(1, pages)}
        </span>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE7F0] bg-white text-[#173F6D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TicketDrawer({
  ticket,
  onClose,
  onUpdated,
}: {
  ticket: SupportTicketDetail | null;
  onClose: () => void;
  onUpdated: (
    ticketId: string,
    message: string
  ) => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [busyAction, setBusyAction] =
    useState<string | null>(null);
  const [admins, setAdmins] =
    useState<Array<{
      id: string;
      name: string;
    }>>([]);
  const [tab, setTab] =
    useState<"conversation" | "activity">(
      "conversation"
    );

  useEffect(() => {
    let active = true;

    void supportApi
      .getAdmins()
      .then((response) => {
        if (active) {
          setAdmins(response.admins);
        }
      })
      .catch(() => {
        if (active) {
          setAdmins([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const run = async (
    action: string,
    work: () => Promise<unknown>,
    message: string
  ) => {
    if (!ticket) return;

    setBusyAction(action);

    try {
      await work();
      await onUpdated(ticket.id, message);
    } catch (actionError) {
      window.alert(
        actionError instanceof Error
          ? actionError.message
          : "Support action failed."
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 230,
      }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col bg-white shadow-[-20px_0_60px_rgba(15,39,69,0.16)]"
    >
      {!ticket ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1F5EA8]" />
        </div>
      ) : (
        <>
          <div className="border-b border-slate-100 bg-[#F8FBFE] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-[#1F5EA8]">
                    {ticket.ticketNumber}
                  </span>
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>

                <h2 className="mt-3 text-xl font-black leading-7 text-[#0F2745]">
                  {ticket.subject}
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  {ticket.category} • opened{" "}
                  {formatRelativeTime(ticket.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
            <ContextCard
              label="Customer"
              value={ticket.customer.name}
              subvalue={ticket.customer.email}
              icon={UserRound}
            />
            <ContextCard
              label="KYC"
              value={toTitleCase(ticket.customer.kycStatus)}
              subvalue={
                ticket.customer.walletLinked
                  ? "Wallet linked"
                  : "No wallet link"
              }
              icon={ShieldAlert}
            />
            <ContextCard
              label="Owner"
              value={ticket.assignee.name}
              subvalue={
                ticket.slaBreached
                  ? "SLA breached"
                  : formatSla(ticket.slaMinutes)
              }
              icon={UsersRound}
            />
          </div>

          <div className="border-b border-slate-100 p-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <DrawerSelect
                label="Status"
                value={ticket.status}
                options={STATUS_OPTIONS.filter(
                  (item) => item !== "All"
                )}
                disabled={busyAction !== null}
                onChange={(value) =>
                  void run(
                    "status",
                    () =>
                      supportApi.updateTicket(
                        ticket.id,
                        {
                          status:
                            value as TicketStatus,
                        }
                      ),
                    "Ticket status updated."
                  )
                }
              />

              <DrawerSelect
                label="Priority"
                value={ticket.priority}
                options={PRIORITY_OPTIONS.filter(
                  (item) => item !== "All"
                )}
                disabled={busyAction !== null}
                onChange={(value) =>
                  void run(
                    "priority",
                    () =>
                      supportApi.updateTicket(
                        ticket.id,
                        {
                          priority:
                            value as TicketPriority,
                        }
                      ),
                    "Ticket priority updated."
                  )
                }
              />

              <label>
                <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Owner
                </span>
                <select
                  value={ticket.assignee.id ?? ""}
                  disabled={busyAction !== null}
                  onChange={(event) =>
                    void run(
                      "assignee",
                      () =>
                        supportApi.updateTicket(
                          ticket.id,
                          {
                            assigneeAdminId:
                              event.target.value ||
                              null,
                          }
                        ),
                      "Ticket owner updated."
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold text-[#173F6D] outline-none disabled:opacity-50"
                >
                  <option value="">
                    Unassigned
                  </option>
                  {admins.map((admin) => (
                    <option
                      key={admin.id}
                      value={admin.id}
                    >
                      {admin.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => {
                  const reason = window.prompt(
                    "Escalation reason:"
                  );

                  if (!reason?.trim()) return;

                  void run(
                    "escalate",
                    () =>
                      supportApi.escalate(
                        ticket.id,
                        reason
                      ),
                    "Ticket escalated."
                  );
                }}
                className="mt-auto h-10 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[10px] font-black text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Escalate
              </button>

              <button
                type="button"
                disabled={
                  busyAction !== null ||
                  ticket.status === "Resolved"
                }
                onClick={() => {
                  const resolution = window.prompt(
                    "Resolution summary:"
                  );

                  if (!resolution?.trim()) return;

                  void run(
                    "resolve",
                    () =>
                      supportApi.resolve(
                        ticket.id,
                        resolution
                      ),
                    "Ticket resolved."
                  );
                }}
                className="mt-auto h-10 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 px-4 pt-3">
            <div className="flex gap-1">
              {(["conversation", "activity"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`border-b-2 px-3 pb-2 text-[10px] font-black capitalize transition ${
                      tab === item
                        ? "border-[#1F5EA8] text-[#1F5EA8]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FBFDFF] p-4 md:p-5">
            {tab === "conversation" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#1F5EA8]">
                    Customer issue
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {ticket.description}
                  </p>

                  {ticket.relatedReference && (
                    <p className="mt-3 text-[10px] font-bold text-[#173F6D]">
                      Reference: {ticket.relatedReference}
                    </p>
                  )}
                </div>

                {ticket.messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                    No conversation messages yet.
                  </div>
                ) : (
                  ticket.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))
                )}

                <Composer
                  title="Reply to customer"
                  value={reply}
                  setValue={setReply}
                  placeholder="Write a clear customer-facing response..."
                  actionLabel="Send Reply"
                  icon={Send}
                  busy={busyAction === "reply"}
                  onSubmit={() => {
                    const body = reply.trim();
                    if (!body) return;

                    void run(
                      "reply",
                      () =>
                        supportApi.addReply(
                          ticket.id,
                          body
                        ),
                      "Reply sent."
                    ).then(() => setReply(""));
                  }}
                />

                <Composer
                  title="Internal note"
                  value={note}
                  setValue={setNote}
                  placeholder="Add context visible only to admins..."
                  actionLabel="Add Note"
                  icon={MessageSquare}
                  busy={busyAction === "note"}
                  internal
                  onSubmit={() => {
                    const body = note.trim();
                    if (!body) return;

                    void run(
                      "note",
                      () =>
                        supportApi.addInternalNote(
                          ticket.id,
                          body
                        ),
                      "Internal note added."
                    ).then(() => setNote(""));
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {ticket.activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                    No activity recorded yet.
                  </div>
                ) : (
                  ticket.activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4"
                    >
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1F5EA8]" />
                      <div>
                        <p className="text-xs font-black text-[#0F2745]">
                          {item.summary}
                        </p>
                        <p className="mt-1 text-[9px] text-slate-400">
                          {item.actorName} •{" "}
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}

function ContextCard({
  label,
  value,
  subvalue,
  icon: Icon,
}: {
  label: string;
  value: string;
  subvalue: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-black text-[#0F2745]">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[9px] text-slate-400">
          {subvalue}
        </p>
      </div>
    </div>
  );
}

function DrawerSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold text-[#173F6D] outline-none disabled:opacity-50"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MessageBubble({
  message,
}: {
  message: SupportTicketDetail["messages"][number];
}) {
  const isInternal =
    message.visibility === "internal";
  const isAdmin =
    message.authorType === "admin";

  return (
    <div
      className={`flex ${
        isAdmin && !isInternal
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[88%] rounded-2xl p-3.5 ${
          isInternal
            ? "border border-amber-100 bg-amber-50"
            : isAdmin
              ? "bg-[#173F6D] text-white"
              : "border border-slate-200 bg-white text-[#0F2745]"
        }`}
      >
        <div className="flex items-center gap-2">
          <p
            className={`text-[9px] font-black ${
              isInternal
                ? "text-amber-700"
                : isAdmin
                  ? "text-cyan-100"
                  : "text-[#1F5EA8]"
            }`}
          >
            {message.authorName}
          </p>

          {isInternal && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-black text-amber-700">
              INTERNAL
            </span>
          )}
        </div>

        <p
          className={`mt-2 whitespace-pre-wrap text-xs leading-5 ${
            isAdmin && !isInternal
              ? "text-blue-50"
              : "text-slate-600"
          }`}
        >
          {message.body}
        </p>

        <p
          className={`mt-2 text-[8px] ${
            isAdmin && !isInternal
              ? "text-blue-100/50"
              : "text-slate-400"
          }`}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

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
  setValue: (value: string) => void;
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
          ? "border-amber-100 bg-amber-50/50"
          : "border-blue-100 bg-white"
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.12em] ${
          internal
            ? "text-amber-700"
            : "text-[#1F5EA8]"
        }`}
      >
        {title}
      </p>

      <textarea
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        rows={3}
        maxLength={4000}
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-[#0F2745] outline-none transition placeholder:text-slate-400 focus:border-blue-300"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[8px] text-slate-400">
          {value.length}/4000
        </span>

        <button
          type="button"
          disabled={busy || !value.trim()}
          onClick={onSubmit}
          className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
            internal
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-[#1F5EA8] text-white hover:bg-[#173F6D]"
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


function CreateTicketModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (
    ticket: SupportTicketDetail
  ) => Promise<void>;
}) {
  const [form, setForm] =
    useState<CreateSupportTicketInput>({
      customerEmail: "",
      subject: "",
      description: "",
      category: "Transfer",
      priority: "Normal",
      relatedReference: "",
      tags: [],
    });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const update = <
    K extends keyof CreateSupportTicketInput,
  >(
    key: K,
    value: CreateSupportTicketInput[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async () => {
    if (
      !form.customerEmail.trim() ||
      !form.subject.trim() ||
      !form.description.trim()
    ) {
      setError(
        "Customer email, subject and description are required."
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response =
        await supportApi.createTicket({
          ...form,
          customerEmail:
            form.customerEmail.trim(),
          subject: form.subject.trim(),
          description: form.description.trim(),
          relatedReference:
            form.relatedReference?.trim() ||
            undefined,
        });

      setForm({
        customerEmail: "",
        subject: "",
        description: "",
        category: "Transfer",
        priority: "Normal",
        relatedReference: "",
        tags: [],
      });

      await onCreated(response.ticket);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create support ticket."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A2038]/45 p-4 backdrop-blur-[2px]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#DCE7F0] bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-slate-100 bg-[#F8FBFE] p-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#1F5EA8]">
                Admin Support
              </p>
              <h2 className="mt-1 text-xl font-black text-[#0F2745]">
                Create Support Ticket
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Open an auditable case for an existing customer.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <FormField
              label="Customer Email"
              value={form.customerEmail}
              onChange={(value) =>
                update("customerEmail", value)
              }
              placeholder="customer@example.com"
            />

            <FormField
              label="Related Reference"
              value={form.relatedReference || ""}
              onChange={(value) =>
                update("relatedReference", value)
              }
              placeholder="TXN / KYC / payment reference"
            />

            <label>
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Category
              </span>
              <select
                value={form.category}
                onChange={(event) =>
                  update(
                    "category",
                    event.target.value as TicketCategory
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#173F6D] outline-none"
              >
                {CATEGORY_OPTIONS.filter(
                  (item) => item !== "All"
                ).map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Priority
              </span>
              <select
                value={form.priority}
                onChange={(event) =>
                  update(
                    "priority",
                    event.target.value as TicketPriority
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#173F6D] outline-none"
              >
                {PRIORITY_OPTIONS.filter(
                  (item) => item !== "All"
                ).map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <FormField
                label="Subject"
                value={form.subject}
                onChange={(value) =>
                  update("subject", value)
                }
                placeholder="Short issue summary"
              />
            </div>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                maxLength={4000}
                placeholder="Describe the customer problem and any verified context..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-[#0F2745] outline-none focus:border-blue-300"
              />
            </label>

            {error && (
              <div className="md:col-span-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[10px] font-semibold text-rose-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-xs font-black text-slate-500 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 text-xs font-black text-white transition hover:bg-[#173F6D] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Ticket
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#0F2745] outline-none transition placeholder:text-slate-400 focus:border-blue-300"
      />
    </label>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  const tone: Record<TicketPriority, string> = {
    Urgent:
      "border-rose-100 bg-rose-50 text-rose-600",
    High:
      "border-amber-100 bg-amber-50 text-amber-700",
    Normal:
      "border-blue-100 bg-blue-50 text-blue-600",
    Low:
      "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[8px] font-black ${tone[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: TicketStatus;
}) {
  const tone: Record<TicketStatus, string> = {
    Open:
      "border-blue-100 bg-blue-50 text-blue-600",
    "In Progress":
      "border-cyan-100 bg-cyan-50 text-cyan-700",
    "Waiting for Customer":
      "border-amber-100 bg-amber-50 text-amber-700",
    Escalated:
      "border-rose-100 bg-rose-50 text-rose-600",
    Resolved:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex max-w-[150px] rounded-full border px-2.5 py-1 text-[8px] font-black ${tone[status]}`}
    >
      {status}
    </span>
  );
}

function SlaBadge({
  minutes,
  breached,
}: {
  minutes: number;
  breached: boolean;
}) {
  if (breached || minutes <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[9px] font-black text-rose-600">
        <AlertCircle className="h-3 w-3" />
        Breached
      </span>
    );
  }

  const dueSoon = minutes <= 15;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black ${
        dueSoon
          ? "border-amber-100 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <Clock3 className="h-3 w-3" />
      {formatSla(minutes)}
    </span>
  );
}

function formatSla(minutes: number) {
  if (minutes <= 0) {
    return "Breached";
  }

  if (minutes < 60) {
    return `${minutes}m remaining`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest
    ? `${hours}h ${rest}m remaining`
    : `${hours}h remaining`;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatRelativeTime(value: string) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return "Recently";
  }

  const diff = Date.now() - timestamp;
  const mins = Math.max(
    0,
    Math.floor(diff / 60000)
  );

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
