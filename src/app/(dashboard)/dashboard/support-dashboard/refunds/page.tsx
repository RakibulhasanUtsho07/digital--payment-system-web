"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Eye,
  FileText,
  Gauge,
  Hash,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  supportDashboardApi,
  type SupportRefundRequest,
  type SupportTicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "All"
  | TicketStatus;

type PriorityFilter =
  | "All"
  | TicketPriority;

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type MetricTone =
  | "emerald"
  | "cyan"
  | "violet"
  | "amber"
  | "rose";

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS: Array<SelectOption<StatusFilter>> = [
  {
    value: "All",
    label: "All statuses",
    description: "Entire refund-support lifecycle",
  },
  {
    value: "Open",
    label: "Open",
    description: "New or unresolved request",
  },
  {
    value: "Waiting for Customer",
    label: "Waiting for Customer",
    description: "Customer input is required",
  },
  {
    value: "In Progress",
    label: "In Progress",
    description: "Support investigation underway",
  },
  {
    value: "Escalated",
    label: "Escalated",
    description: "Escalated support case",
  },
  {
    value: "Resolved",
    label: "Resolved",
    description: "Support case resolved",
  },
];

const PRIORITY_OPTIONS: Array<SelectOption<PriorityFilter>> = [
  {
    value: "All",
    label: "All priorities",
    description: "No priority restriction",
  },
  {
    value: "Low",
    label: "Low",
    description: "Low support urgency",
  },
  {
    value: "Normal",
    label: "Normal",
    description: "Standard support priority",
  },
  {
    value: "High",
    label: "High",
    description: "High-priority refund case",
  },
  {
    value: "Urgent",
    label: "Urgent",
    description: "Immediate support attention",
  },
];

const HERO_PARTICLES = [
  { left: "7%", top: "22%", size: 4, delay: 0.2, duration: 7.6 },
  { left: "18%", top: "71%", size: 3, delay: 1.1, duration: 8.5 },
  { left: "31%", top: "18%", size: 5, delay: 0.7, duration: 9.8 },
  { left: "45%", top: "76%", size: 4, delay: 2.1, duration: 8.2 },
  { left: "59%", top: "27%", size: 3, delay: 1.5, duration: 7.4 },
  { left: "72%", top: "67%", size: 5, delay: 0.5, duration: 10.2 },
  { left: "85%", top: "24%", size: 3, delay: 2.4, duration: 8.7 },
  { left: "93%", top: "72%", size: 4, delay: 1.7, duration: 9.1 },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function selectedLabel<T extends string>(
  options: Array<SelectOption<T>>,
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

function priorityTone(priority: TicketPriority): string {
  if (priority === "Urgent") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (priority === "High") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (priority === "Normal") {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
  }

  return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

function statusTone(status: TicketStatus): string {
  if (status === "Resolved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "Escalated") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (status === "Waiting for Customer") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
}

function slaLabel(
  minutesRemaining: number,
  breached: boolean
): string {
  if (breached) {
    return "SLA breached";
  }

  if (minutesRemaining <= 60) {
    return `${Math.max(0, minutesRemaining)}m remaining`;
  }

  if (minutesRemaining <= 1440) {
    return `${(minutesRemaining / 60).toFixed(1)}h remaining`;
  }

  return `${(minutesRemaining / 1440).toFixed(1)}d remaining`;
}

function slaTone(
  minutesRemaining: number,
  breached: boolean
): string {
  if (breached) {
    return "text-rose-600 dark:text-rose-300";
  }

  if (minutesRemaining <= 60) {
    return "text-amber-600 dark:text-amber-300";
  }

  return "text-emerald-600 dark:text-emerald-300";
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

/* =========================================================
   CUSTOM SELECT
========================================================= */

function SupportSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  icon: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected =
    options.find((item) => item.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative ${open ? "z-[90]" : "z-10"}`}
    >
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-background px-3.5 text-left shadow-sm outline-none transition duration-200 ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-border hover:border-emerald-500/35"
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-foreground">
            {selected?.label}
          </span>
          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
              {selected.description}
            </span>
          )}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="listbox"
            className="support-scroll-hidden absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-72 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.28)]"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-emerald-500/10"
                      : "hover:bg-emerald-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-white/5"
                    }`}
                  >
                    {active ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-foreground">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function metricTone(tone: MetricTone): {
  shell: string;
  glow: string;
  bar: string;
} {
  if (tone === "cyan") {
    return {
      shell:
        "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      glow: "bg-cyan-400/10",
      bar: "from-cyan-500 to-sky-400",
    };
  }

  if (tone === "violet") {
    return {
      shell:
        "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      glow: "bg-violet-400/10",
      bar: "from-violet-500 to-fuchsia-400",
    };
  }

  if (tone === "amber") {
    return {
      shell:
        "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      glow: "bg-amber-400/10",
      bar: "from-amber-500 to-orange-400",
    };
  }

  if (tone === "rose") {
    return {
      shell:
        "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      glow: "bg-rose-400/10",
      bar: "from-rose-500 to-pink-400",
    };
  }

  return {
    shell:
      "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow: "bg-emerald-400/10",
    bar: "from-emerald-500 to-teal-400",
  };
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  const styles = metricTone(tone);

  return (
    <motion.article
      variants={reveal}
      whileHover={{ y: -4, scale: 1.006 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-[0_18px_50px_-40px_rgba(5,150,105,.35)]"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 break-words text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: 8, scale: 1.08 }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: "24%" }}
          animate={{ width: ["24%", "78%", "54%"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
        />
      </div>
    </motion.article>
  );
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
      className="overflow-hidden rounded-[26px] border border-border bg-card shadow-[0_20px_60px_-45px_rgba(5,150,105,.30)]"
    >
      <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.06 }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-sm font-black text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   COPY FIELD
========================================================= */

function CopyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: LucideIcon;
}) {
  const [copied, setCopied] = useState(false);
  const display = value || "Not available";

  async function copyValue() {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-muted/25 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Icon className="h-4 w-4 text-emerald-600" />
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 break-all text-xs font-black text-foreground">
            {display}
          </p>
        </div>

        {value && (
          <button
            type="button"
            onClick={() => void copyValue()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-700"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportRefundRequestsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [requests, setRequests] = useState<SupportRefundRequest[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (requests.length === 0) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const result = await supportDashboardApi.getRefundRequests({
            search: search.trim() || undefined,
            status,
            priority,
            page,
            limit: 20,
          });

          if (!active) return;

          setRequests(result.requests);
          setTotal(result.total);
          setTotalPages(Math.max(1, result.totalPages));
        } catch (requestError: unknown) {
          if (active) {
            setError(messageOf(requestError));
          }
        } finally {
          if (active) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      })();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, status, priority, page, refreshKey]);

  useEffect(() => {
    if (!selectedTicketId) {
      setDetail(null);
      return;
    }

    let active = true;

    setDetailLoading(true);
    setDetail(null);
    setError("");

    void supportDashboardApi
      .getTicket(selectedTicketId)
      .then((result) => {
        if (active) {
          setDetail(result.ticket);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(messageOf(requestError));
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  useEffect(() => {
    if (!selectedTicketId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTicketId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTicketId]);

  const visibleUrgentHigh = useMemo(
    () => requests.filter(
      (request) => request.priority === "Urgent" || request.priority === "High"
    ).length,
    [requests]
  );

  const visibleBreached = useMemo(
    () => requests.filter((request) => request.sla.breached).length,
    [requests]
  );

  const visibleWaitingOnAdmin = useMemo(
    () => requests.filter((request) => request.waitingOn === "admin").length,
    [requests]
  );

  const statusChartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const request of requests) {
      counts.set(
        request.status,
        (counts.get(request.status) ?? 0) + 1
      );
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  const priorityChartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const request of requests) {
      counts.set(
        request.priority,
        (counts.get(request.priority) ?? 0) + 1
      );
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  const activeFilterCount = useMemo(
    () => [
      Boolean(search.trim()),
      status !== "All",
      priority !== "All",
    ].filter(Boolean).length,
    [search, status, priority]
  );

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setPage(1);
    setError("");
  }

  return (
    <main className="support-refunds-page space-y-6 bg-transparent pb-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/25 bg-[linear-gradient(135deg,#10B981_0%,#059669_48%,#047857_100%)] p-6 text-white shadow-[0_28px_80px_-38px_rgba(5,150,105,.70)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [0, 30, -12, 0],
            y: [0, -16, 11, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-emerald-100/30 blur-[95px]"
        />

        <motion.div
          animate={{ x: [0, -22, 16, 0], y: [0, 17, -9, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-32 left-[18%] h-80 w-80 rounded-full bg-cyan-100/20 blur-[105px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute right-[15%] top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-dashed border-white/20 xl:block"
        >
          <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.90)]" />
        </motion.div>

        <motion.div
          aria-hidden
          animate={{
            x: ["-25%", "125%"],
            opacity: [0, 0.34, 0],
          }}
          transition={{
            duration: 7.2,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
        />

        {HERO_PARTICLES.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}-${index}`}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.78)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -13, 5, 0],
              x: [0, 6, -4, 0],
              opacity: [0.18, 0.8, 0.32, 0.18],
              scale: [0.8, 1.25, 0.95, 0.8],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <motion.div
          animate={{ x: ["-30%", "130%"] }}
          transition={{
            duration: 5.8,
            repeat: Infinity,
            repeatDelay: 2.6,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-100 to-transparent shadow-[0_0_18px_rgba(209,250,229,.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100 backdrop-blur">
                <RefreshCcw className="h-3.5 w-3.5" />
                Refund Requests
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Support case review
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Investigate refund-related support cases
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Review refund, chargeback and money-back support tickets, customer
              context, SLA pressure, messages and audit activity. This route does
              not execute refunds or mutate payment state.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Search className="h-3.5 w-3.5" />
                {total.toLocaleString("en-BD")} requests
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Gauge className="h-3.5 w-3.5" />
                {selectedLabel(STATUS_OPTIONS, status)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                {selectedLabel(PRIORITY_OPTIONS, priority)}
              </span>
            </div>
          </div>

          <div className="relative shrink-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-emerald-100/20 xl:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.9)]" />
            </motion.div>

            <button
              type="button"
              disabled={refreshing || loading}
              onClick={() => setRefreshKey((value) => value + 1)}
              className="relative inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-900 shadow-[0_12px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing || loading ? "animate-spin" : ""}`}
              />
              Refresh requests
            </button>
          </div>
        </div>

        {(refreshing || loading) && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.15, repeat: Infinity }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
          />
        )}
      </motion.section>

      {/* FILTERS */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
        className="relative z-30 overflow-visible rounded-[26px] border border-emerald-500/15 bg-emerald-500/[0.055] p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.32)]"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
              Refund case filters
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Server-side ticket filters · {activeFilterCount} active
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black uppercase tracking-wide text-muted-foreground transition hover:border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Search refund case
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 transition focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
                placeholder="Ticket number, subject, related reference"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="rounded-lg p-1 text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-700"
                  aria-label="Clear refund search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          <SupportSelect
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            icon={Gauge}
          />

          <SupportSelect
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={(value) => {
              setPriority(value);
              setPage(1);
            }}
            icon={ShieldAlert}
          />
        </div>
      </motion.section>

      {/* ERROR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
            className="flex items-start gap-3 rounded-[22px] border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-700 dark:text-rose-300"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black">Refund case request failed</p>
              <p className="mt-1 text-xs leading-5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Matching refund cases"
          value={total.toLocaleString("en-BD")}
          description="Total server-side refund-related support matches"
          icon={RefreshCcw}
          tone="emerald"
        />

        <MetricCard
          label="Visible high / urgent"
          value={visibleUrgentHigh.toLocaleString("en-BD")}
          description="High or urgent cases on this page"
          icon={ShieldAlert}
          tone="amber"
        />

        <MetricCard
          label="Visible SLA breached"
          value={visibleBreached.toLocaleString("en-BD")}
          description="Breached SLA cases on this page"
          icon={Clock3}
          tone="rose"
        />

        <MetricCard
          label="Waiting on support"
          value={visibleWaitingOnAdmin.toLocaleString("en-BD")}
          description="Visible cases currently waiting on admin/support"
          icon={MessageSquare}
          tone="violet"
        />
      </motion.section>

      {/* REAL VISIBLE CHARTS */}
      <section className="grid gap-5 xl:grid-cols-2">
        <motion.article
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
          className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-border bg-emerald-500/[0.055] px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <BarChart3 className="h-5 w-5" />
            </span>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Real visible data
              </p>

              <h2 className="mt-0.5 text-sm font-black text-foreground">
                Refund case status distribution
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                Status counts from the refund cases returned on the current API page.
              </p>
            </div>
          </div>

          <div className="h-[310px] p-4 sm:p-5">
            {statusChartData.length === 0 ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                <div>
                  <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-3 text-xs font-black text-foreground">
                    No status chart data
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    The chart will appear when refund cases are loaded.
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusChartData}
                  margin={{
                    top: 12,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(148,163,184,.18)"
                    strokeDasharray="4 6"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={12}
                    tick={{
                      fontSize: 9,
                      fill: "#94A3B8",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "#94A3B8",
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(16,185,129,.06)",
                    }}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid rgba(148,163,184,.22)",
                      background: "rgba(15,23,42,.96)",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      boxShadow: "0 18px 45px rgba(15,23,42,.18)",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    name="Cases"
                    fill="#10B981"
                    radius={[9, 9, 3, 3]}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.article>

        <motion.article
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
          className="relative isolate overflow-hidden rounded-[26px] border border-emerald-400/20 bg-[linear-gradient(145deg,#10B981_0%,#059669_58%,#047857_100%)] p-5 text-white shadow-[0_22px_65px_-38px_rgba(5,150,105,.65)]"
        >
          <motion.div
            aria-hidden
            animate={{
              scale: [1, 1.12, 1],
              x: [0, 18, 0],
              opacity: [0.26, 0.50, 0.26],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

          <div className="relative">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
              <Gauge className="h-5 w-5" />
            </span>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100">
              Visible refund-case pulse
            </p>

            <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {requests.length.toLocaleString("en-BD")}
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-50/75">
              Real refund-support records on the current page, summarized without mock data.
            </p>

            <div className="mt-6 space-y-2.5">
              {priorityChartData.length === 0 ? (
                <div className="rounded-2xl border border-white/12 bg-white/[0.08] p-4 text-xs text-emerald-50/75">
                  Priority distribution will appear when requests are loaded.
                </div>
              ) : (
                priorityChartData.map((item, index) => {
                  const max = Math.max(
                    1,
                    ...priorityChartData.map((entry) => entry.count)
                  );

                  return (
                    <motion.div
                      key={item.name}
                      initial={{
                        opacity: 0,
                        x: -8,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: index * 0.05,
                      }}
                      className="rounded-2xl border border-white/12 bg-white/[0.08] p-3 backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-black text-white">
                          {item.name}
                        </span>

                        <span className="text-[9px] font-black tabular-nums text-emerald-50/80">
                          {item.count}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          whileInView={{
                            width: `${Math.max(
                              8,
                              (item.count / max) * 100
                            )}%`,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: 0.85,
                            delay: index * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="h-full rounded-full bg-white"
                        />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.article>
      </section>

      {/* RESULTS */}
      <Panel
        title="Refund Support Cases"
        description="Refund-related support tickets detected by the existing backend refund service."
        icon={RefreshCcw}
        action={
          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-300">
            {requests.length} visible
          </span>
        }
      >
        {loading ? (
          <div className="grid min-h-[340px] place-items-center">
            <div className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                />
                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
              </div>
              <p className="mt-4 text-sm font-black text-foreground">
                Loading refund-support cases
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reading refund-related tickets, customer context and SLA state...
              </p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="grid min-h-[340px] place-items-center rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Search className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-black text-foreground">
                No refund cases match
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Try another ticket number, subject, related reference, status or priority.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {requests.map((request, index) => (
                <motion.article
                  key={request.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.18) }}
                  className="rounded-[20px] border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                        {request.ticketNumber}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-foreground">
                        {request.subject}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${priorityTone(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${statusTone(request.status)}`}>
                      {request.status}
                    </span>
                    <span className={`rounded-full bg-muted px-2.5 py-1 text-[9px] font-black ${slaTone(request.sla.minutesRemaining, request.sla.breached)}`}>
                      {slaLabel(request.sla.minutesRemaining, request.sla.breached)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-muted/40 p-3">
                    <p className="truncate text-xs font-black text-foreground">
                      {request.customer.name}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {request.customer.email || request.customer.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(request.id)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                  >
                    <Eye className="h-4 w-4" />
                    Open refund case
                  </button>
                </motion.article>
              ))}
            </div>

            <div className="support-scroll-hidden hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-border bg-emerald-500/[0.055] text-[9px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                    <th className="px-4 py-3.5">Case</th>
                    <th className="px-4 py-3.5">Status / priority</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">SLA</th>
                    <th className="px-4 py-3.5">Last activity</th>
                    <th className="px-4 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.16) }}
                      className="border-b border-border text-xs transition hover:bg-emerald-500/[0.045]"
                    >
                      <td className="px-4 py-4">
                        <p className="font-black text-emerald-700 dark:text-emerald-300">
                          {request.ticketNumber}
                        </p>
                        <p className="mt-1 max-w-[260px] truncate font-bold text-foreground">
                          {request.subject}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${statusTone(request.status)}`}>
                          {request.status}
                        </span>
                        <div className="mt-1.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ${priorityTone(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[190px] truncate font-black text-foreground">
                          {request.customer.name}
                        </p>
                        <p className="mt-1 max-w-[190px] truncate text-[9px] text-slate-400">
                          {request.customer.email || request.customer.id}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[200px] truncate font-bold text-foreground">
                          {request.relatedReference || "Not available"}
                        </p>
                        <p className="mt-1 text-[9px] text-slate-400">
                          Waiting on {request.waitingOn}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className={`font-black ${slaTone(request.sla.minutesRemaining, request.sla.breached)}`}>
                          {slaLabel(request.sla.minutesRemaining, request.sla.breached)}
                        </p>
                        <p className="mt-1 text-[9px] text-slate-400">
                          Due {formatDateTime(request.sla.dueAt)}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-[10px] text-muted-foreground">
                        {formatDateTime(request.lastActivityAt)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTicketId(request.id)}
                          className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                        >
                          <Eye className="mr-1.5 inline h-3.5 w-3.5" />
                          Open
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.055] p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-bold text-muted-foreground">
                Page <span className="font-black text-foreground">{page}</span> of{" "}
                <span className="font-black text-foreground">{totalPages}</span>{" "}
                · {total.toLocaleString("en-BD")} matches
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-30"
                  aria-label="Previous refund page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-30"
                  aria-label="Next refund page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {selectedTicketId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedTicketId(null);
              }
            }}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="support-scroll-hidden absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-background text-foreground shadow-[-24px_0_80px_rgba(15,23,42,.32)]"
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/15 bg-[linear-gradient(135deg,#10B981_0%,#059669_52%,#047857_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{ x: [0, 18, -7, 0], y: [0, -9, 6, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100/70">
                      Refund support case
                    </p>
                    <h2 className="mt-1 truncate text-xl font-black text-white">
                      {detail?.ticketNumber || "Loading case"}
                    </h2>
                    <p className="mt-1 truncate text-[10px] text-emerald-50/55">
                      {detail?.subject || selectedTicketId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20"
                    aria-label="Close refund case detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="grid min-h-[70vh] place-items-center">
                  <div className="text-center">
                    <div className="relative mx-auto h-16 w-16">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                      />
                      <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-muted-foreground">
                      Loading refund case evidence...
                    </p>
                  </div>
                </div>
              ) : detail ? (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-5 p-5 sm:p-6"
                >
                  <motion.section
                    variants={reveal}
                    className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/45 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${statusTone(detail.status)}`}>
                          {detail.status}
                        </span>
                        <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${priorityTone(detail.priority)}`}>
                          {detail.priority}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-black text-foreground">
                        {detail.subject}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                        {detail.description || "No decrypted description is available."}
                      </p>
                    </div>
                  </motion.section>

                  <Panel
                    title="Case References"
                    description="Ticket and payment-related references attached to this support case."
                    icon={Hash}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CopyField label="Ticket number" value={detail.ticketNumber} icon={FileText} />
                      <CopyField label="Related reference" value={detail.relatedReference || null} icon={CircleDollarSign} />
                      <CopyField label="Ticket ID" value={detail.id} icon={Hash} />
                      <CopyField label="Customer ID" value={detail.customer.userId} icon={UserRound} />
                    </div>
                  </Panel>

                  <Panel
                    title="Customer Context"
                    description="Customer identity and account context attached to the ticket."
                    icon={UserRound}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CopyField label="Customer name" value={detail.customer.name} icon={UserRound} />
                      <CopyField label="Customer email" value={detail.customer.email} icon={Mail} />

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-border bg-muted/25 p-4"
                      >
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          KYC status
                        </p>
                        <p className="mt-1 text-xs font-black text-foreground">
                          {humanize(detail.customer.kycStatus)}
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-border bg-muted/25 p-4"
                      >
                        <WalletCards className="h-4 w-4 text-emerald-600" />
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Wallet
                        </p>
                        <p className="mt-1 text-xs font-black text-foreground">
                          {detail.customer.walletLinked ? "Linked" : "Not linked"}
                        </p>
                      </motion.div>
                    </div>
                  </Panel>

                  <Panel
                    title="SLA & Ownership"
                    description="Current support ownership and SLA pressure for this refund case."
                    icon={Clock3}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-border bg-muted/25 p-4"
                      >
                        <Clock3 className={`h-4 w-4 ${detail.slaBreached ? "text-rose-600" : "text-emerald-600"}`} />
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          SLA state
                        </p>
                        <p className={`mt-1 text-xs font-black ${detail.slaBreached ? "text-rose-600 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                          {detail.slaBreached ? "Breached" : `${detail.slaMinutes} minutes remaining`}
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-border bg-muted/25 p-4"
                      >
                        <UserRound className="h-4 w-4 text-emerald-600" />
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Assignee
                        </p>
                        <p className="mt-1 text-xs font-black text-foreground">
                          {detail.assignee.name || "Unassigned"}
                        </p>
                      </motion.div>
                    </div>
                  </Panel>

                  <Panel
                    title="Conversation"
                    description="Public, internal and system messages recorded on this support ticket."
                    icon={MessageSquare}
                  >
                    {detail.messages.length > 0 ? (
                      <div className="space-y-3">
                        {detail.messages.map((message, index) => (
                          <motion.article
                            key={message.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.025, 0.16) }}
                            className={`rounded-2xl border p-4 ${
                              message.visibility === "internal"
                                ? "border-violet-500/15 bg-violet-500/[0.05]"
                                : "border-emerald-100 bg-emerald-50/25 dark:border-white/10 dark:bg-white/[0.025]"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-foreground">
                                  {message.authorName}
                                </span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-300">
                                  {message.visibility}
                                </span>
                              </div>

                              <span className="text-[9px] text-slate-400">
                                {formatDateTime(message.createdAt)}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                              {message.body}
                            </p>
                          </motion.article>
                        ))}
                      </div>
                    ) : (
                      <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center dark:border-white/10 dark:bg-white/[0.02]">
                        <p className="text-xs font-bold text-slate-500">
                          No messages are recorded for this case.
                        </p>
                      </div>
                    )}
                  </Panel>

                  <Panel
                    title="Activity Timeline"
                    description="Audit activity recorded for the refund-support ticket."
                    icon={Sparkles}
                  >
                    {detail.activity.length > 0 ? (
                      <div className="relative space-y-3 pl-7">
                        <div className="absolute bottom-2 left-[9px] top-2 w-px bg-emerald-100 dark:bg-white/10" />

                        {detail.activity.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(index * 0.035, 0.2) }}
                            className="relative rounded-2xl border border-emerald-100 bg-emerald-50/25 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"
                          >
                            <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)] dark:border-slate-950" />

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs font-black text-foreground">
                                {humanize(item.eventType)}
                              </p>
                              <span className="text-[9px] text-slate-400">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {item.summary}
                            </p>
                            <p className="mt-1 text-[9px] font-bold text-slate-400">
                              Actor: {item.actorName}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No activity events are available for this ticket.
                      </p>
                    )}
                  </Panel>

                  <motion.section
                    variants={reveal}
                    className="rounded-[22px] border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
                          Refund execution boundary
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                          This route investigates refund-related support tickets only.
                          It does not create, approve, issue, retry, or settle a refund.
                          Financial actions remain outside this support view.
                        </p>
                      </div>
                    </div>
                  </motion.section>
                </motion.div>
              ) : (
                <div className="grid min-h-[60vh] place-items-center px-6 text-center">
                  <div>
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="mt-3 text-sm font-black">Refund case unavailable</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Close the drawer and try opening the support case again.
                    </p>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .support-refunds-page,
        .support-refunds-page *,
        .support-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .support-refunds-page::-webkit-scrollbar,
        .support-refunds-page *::-webkit-scrollbar,
        .support-scroll-hidden::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `}</style>
    </main>
  );
}
