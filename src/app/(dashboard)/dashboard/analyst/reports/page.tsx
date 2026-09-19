"use client";

import {
  useCallback,
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
  BarChart3,
  Check,
  ChevronDown,
  CircleCheckBig,
  Clock3,
  DatabaseZap,
  Download,
  FileBarChart,
  FileSpreadsheet,
  Filter,
  Gauge,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  createAnalystReport,
  downloadAnalystReportCsv,
  getAnalystReports,
  type AnalystMode,
  type AnalystRange,
  type AnalystReportFormat,
  type AnalystReportSummary,
} from "@/lib/api/analystApi";

/* =========================================================
   THEME
========================================================= */

const DARK_SURFACE =
  "bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: AnalystRange;
  label: string;
  helper: string;
}> = [
  { value: "24h", label: "Last 24 hours", helper: "Short operational window" },
  { value: "7d", label: "Last 7 days", helper: "Weekly analyst view" },
  { value: "30d", label: "Last 30 days", helper: "Monthly analyst view" },
  { value: "90d", label: "Last 90 days", helper: "Quarter-scale view" },
];

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
  helper: string;
}> = [
  { value: "all", label: "All modes", helper: "Live + test where supported" },
  { value: "live", label: "Live only", helper: "Production payment activity" },
  { value: "test", label: "Test only", helper: "Sandbox payment activity" },
];

const FORMAT_OPTIONS: Array<{
  value: AnalystReportFormat;
  label: string;
  helper: string;
}> = [
  { value: "executive", label: "Executive", helper: "Cross-platform summary" },
  { value: "payments", label: "Payments", helper: "Gateway payment performance" },
  { value: "risk", label: "Risk", helper: "Risk and exception signals" },
  { value: "revenue", label: "Revenue", helper: "Revenue and leakage analysis" },
];

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function reportFormatLabel(value: AnalystReportFormat | string): string {
  return FORMAT_OPTIONS.find((item) => item.value === value)?.label ?? humanize(value);
}

function statusClasses(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === "ready" || normalized === "completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  if (normalized === "processing" || normalized === "queued" || normalized === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }

  if (normalized === "failed" || normalized === "error") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
  }

  return "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400";
}

/* =========================================================
   CUSTOM SELECT
========================================================= */

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options: Array<{
    value: T;
    label: string;
    helper: string;
  }>;
  onChange: (value: T) => void;
  icon: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left outline-none transition hover:border-teal-500/45 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
            <Icon className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-foreground">{selected?.label}</p>
            <p className="truncate text-[10px] text-muted-foreground">{selected?.helper}</p>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
            role="listbox"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "hover:bg-muted/60"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold">{option.label}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{option.helper}</p>
                  </div>

                  {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, ease: easeOut }}
      className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
  accentClass,
  index,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: easeOut }}
      className="group relative min-h-[155px] overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-3 truncate text-2xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{helper}</p>
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600"
      >
        <DatabaseZap className="h-7 w-7" />
      </motion.div>

      <p className="mt-4 text-sm font-extrabold text-foreground">No generated reports yet</p>
      <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
        Generate an analyst report using the filters above. Only reports returned by the backend will appear here.
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystReportsPage() {
  const [reports, setReports] = useState<AnalystReportSummary[]>([]);
  const [range, setRange] = useState<AnalystRange>("30d");
  const [mode, setMode] = useState<AnalystMode>("all");
  const [currency, setCurrency] = useState("BDT");
  const [format, setFormat] = useState<AnalystReportFormat>("executive");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      setError("");
      const result = await getAnalystReports();
      setReports(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load reports.");
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [load]);

  const readyReports = useMemo(
    () => reports.filter((report) => report.status.toLowerCase() === "ready").length,
    [reports]
  );

  const inProgressReports = useMemo(
    () =>
      reports.filter((report) => {
        const status = report.status.toLowerCase();
        return status === "processing" || status === "queued" || status === "pending";
      }).length,
    [reports]
  );

  const formatCount = useMemo(
    () => new Set(reports.map((report) => report.format)).size,
    [reports]
  );

  async function generate() {
    try {
      setError("");

      const normalizedCurrency = currency.trim().toUpperCase();

      if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
        setError("Currency must be a three-letter ISO code.");
        return;
      }

      setLoading(true);

      await createAnalystReport({
        range,
        mode,
        currency: normalizedCurrency,
        format,
      });

      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create report.");
    } finally {
      setLoading(false);
    }
  }

  async function download(report: AnalystReportSummary) {
    try {
      setError("");
      setDownloadingId(report.id);
      await downloadAnalystReportCsv(report.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to download report.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="space-y-6 pb-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`relative overflow-hidden rounded-[28px] border border-white/10 p-6 shadow-[0_28px_80px_-42px_rgba(13,148,136,0.62)] sm:p-7 ${DARK_SURFACE}`}
      >
        <motion.div
          aria-hidden
          animate={{ opacity: [0.32, 0.76, 0.32], scale: [1, 1.16, 1], x: [0, 28, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{ opacity: [0.18, 0.48, 0.18], y: [0, -24, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-28 left-[24%] h-64 w-64 rounded-full bg-cyan-400/18 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute right-[18%] top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-teal-200/10 xl:block"
        >
          <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(94,234,212,0.8)]" />
        </motion.div>

        <motion.div
          aria-hidden
          animate={{ x: ["-20%", "120%"], opacity: [0, 0.34, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 backdrop-blur">
              <FileBarChart className="h-3.5 w-3.5" />
              Analyst Reporting Workspace
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">Report Builder</h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Generate analyst-owned reports from verified backend analytics, keep report history visible, and export ready reports as CSV.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Read-only analytics
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-300" />
                CSV export
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                Verified report history
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            disabled={refreshing}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void load(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>
      </motion.section>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="min-w-0 break-words text-xs leading-5">{error}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total Reports"
          value={String(reports.length)}
          helper="Reports returned by backend"
          icon={FileBarChart}
          iconClass="bg-teal-500/10 text-teal-600"
          accentClass="bg-teal-500"
        />

        <StatCard
          index={1}
          label="Ready"
          value={String(readyReports)}
          helper="Available for CSV export"
          icon={CircleCheckBig}
          iconClass="bg-emerald-500/10 text-emerald-600"
          accentClass="bg-emerald-500"
        />

        <StatCard
          index={2}
          label="In Progress"
          value={String(inProgressReports)}
          helper="Queued, pending or processing"
          icon={Clock3}
          iconClass="bg-amber-500/10 text-amber-600"
          accentClass="bg-amber-500"
        />

        <StatCard
          index={3}
          label="Formats Used"
          value={String(formatCount)}
          helper={`${FORMAT_OPTIONS.length} formats supported`}
          icon={Gauge}
          iconClass="bg-cyan-500/10 text-cyan-600"
          accentClass="bg-cyan-500"
        />
      </section>

      <Panel
        title="Build Analyst Report"
        description="Choose the report scope and format. The backend generates the actual report data."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
            <Filter className="h-3.5 w-3.5" />
            Report filters
          </span>
        }
      >
        <div className="relative z-20 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Period" value={range} options={RANGE_OPTIONS} onChange={setRange} icon={Clock3} />
          <SelectField label="Mode" value={mode} options={MODE_OPTIONS} onChange={setMode} icon={WalletCards} />

          <label>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Currency</span>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">ISO</span>

              <input
                value={currency}
                maxLength={3}
                onChange={(event) =>
                  setCurrency(
                    event.target.value
                      .replace(/[^a-z]/gi, "")
                      .slice(0, 3)
                      .toUpperCase()
                  )
                }
                className="h-12 w-full rounded-xl border border-border bg-background pl-12 pr-3 text-center text-xs font-black uppercase outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </label>

          <SelectField label="Report format" value={format} options={FORMAT_OPTIONS} onChange={setFormat} icon={BarChart3} />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold text-foreground">Ready to generate</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {reportFormatLabel(format)} · {range} · {mode} · {currency || "Currency required"}
            </p>
          </div>

          <motion.button
            type="button"
            disabled={loading}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void generate()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-xs font-black text-white shadow-[0_12px_30px_rgba(13,148,136,0.24)] transition hover:shadow-[0_16px_34px_rgba(13,148,136,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate report"}
          </motion.button>
        </div>
      </Panel>

      <Panel
        title="Recent Reports"
        description="Backend-generated report history and export availability."
        action={
          <motion.button
            type="button"
            whileHover={{ rotate: 8, scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            disabled={refreshing}
            onClick={() => void load(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-teal-500/40 hover:text-teal-600 disabled:opacity-50"
            aria-label="Refresh reports"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </motion.button>
        }
      >
        {initialLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="border-b border-border px-3 py-3">Format</th>
                  <th className="border-b border-border px-3 py-3">Range</th>
                  <th className="border-b border-border px-3 py-3">Mode</th>
                  <th className="border-b border-border px-3 py-3">Currency</th>
                  <th className="border-b border-border px-3 py-3">Status</th>
                  <th className="border-b border-border px-3 py-3">Created</th>
                  <th className="border-b border-border px-3 py-3 text-right">Export</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false}>
                  {reports.map((report, index) => {
                    const ready = report.status.toLowerCase() === "ready";
                    const downloading = downloadingId === report.id;

                    return (
                      <motion.tr
                        layout
                        key={report.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, delay: index * 0.025 }}
                        className="transition-colors hover:bg-teal-500/[0.035]"
                      >
                        <td className="border-b border-border/60 px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                              <FileSpreadsheet className="h-4 w-4" />
                            </span>
                            <span className="font-extrabold text-foreground">{reportFormatLabel(report.format)}</span>
                          </div>
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 font-bold">{report.range}</td>

                        <td className="border-b border-border/60 px-3 py-3.5">
                          <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold uppercase">{report.mode}</span>
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 font-black">{report.currency}</td>

                        <td className="border-b border-border/60 px-3 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${statusClasses(report.status)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {humanize(report.status)}
                          </span>
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-muted-foreground">
                          {formatDateTime(report.createdAt)}
                        </td>

                        <td className="border-b border-border/60 px-3 py-3.5 text-right">
                          <motion.button
                            type="button"
                            whileHover={ready ? { y: -1 } : undefined}
                            whileTap={ready ? { scale: 0.97 } : undefined}
                            disabled={!ready || downloading}
                            onClick={() => void download(report)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-[10px] font-extrabold transition hover:border-teal-500/40 hover:bg-teal-500/5 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-teal-300"
                          >
                            {downloading ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            {downloading ? "Preparing" : "CSV"}
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

          <div>
            <p className="text-xs font-extrabold text-foreground">Read-only report workflow</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Report generation and export use analyst-owned reporting data only. This workspace does not alter payments, wallet balances, merchant settlements, payouts, fee rules or transaction state.
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
