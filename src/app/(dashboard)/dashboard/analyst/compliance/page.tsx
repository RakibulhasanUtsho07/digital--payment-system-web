"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  useRouter,
} from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DatabaseZap,
  FileCheck2,
  Fingerprint,
  Gauge,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRoundCheck,
  Users,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getAnalystCompliance,
  type AnalystComplianceData,
  type AnalystRange,
} from "@/lib/api/analystApi";

const OCEAN = {
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  red: "#EF4444",
  slate: "#94A3B8",
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const RANGE_OPTIONS: Array<SelectOption<AnalystRange>> = [
  { value: "24h", label: "Last 24 hours", description: "Hourly compliance pulse" },
  { value: "7d", label: "Last 7 days", description: "Short-term signal trend" },
  { value: "30d", label: "Last 30 days", description: "Monthly compliance view" },
  { value: "90d", label: "Last 90 days", description: "Quarterly compliance pattern" },
];

const BREAKDOWN_COLORS = [
  OCEAN.tealBright,
  OCEAN.cyan,
  OCEAN.emerald,
  OCEAN.violet,
  OCEAN.amber,
  OCEAN.red,
  OCEAN.sky,
  OCEAN.slate,
];

function numberText(value: number) {
  return new Intl.NumberFormat("en-BD").format(value);
}

function percentText(value: number) {
  return `${value.toFixed(2)}%`;
}

function bucketLabel(value: string, range: AnalystRange) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(
    "en-BD",
    range === "24h"
      ? { hour: "numeric", hour12: true }
      : { month: "short", day: "numeric" }
  ).format(date);
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function selectedLabel<T extends string>(options: Array<SelectOption<T>>, value: T) {
  return options.find((item) => item.value === value)?.label ?? value;
}

const reveal = {
  hidden: { opacity: 0, y: 16, filter: "blur(7px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

function OceanSelect<T extends string>({
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
  const selected = options.find((item) => item.value === value) ?? options[0];

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white/90 px-3.5 text-left shadow-sm outline-none transition dark:bg-slate-950/70 ${
          open
            ? "border-teal-500/60 ring-4 ring-teal-500/10"
            : "border-slate-200 hover:border-teal-500/35 dark:border-white/10"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
            {selected?.label}
          </span>
          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
              {selected.description}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#091820]/95"
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
                    active ? "bg-teal-500/10" : "hover:bg-slate-100/80 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-white/5"
                    }`}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
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

type MetricTone = "ocean" | "emerald" | "violet" | "cyan" | "red" | "amber";

function metricTone(tone: MetricTone) {
  const map = {
    ocean: ["border-teal-500/15 bg-teal-500/10 text-teal-700 dark:text-teal-300", "bg-teal-500/10", "via-teal-400/60"],
    emerald: ["border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", "bg-emerald-500/10", "via-emerald-400/60"],
    violet: ["border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400", "bg-violet-500/10", "via-violet-400/60"],
    cyan: ["border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300", "bg-cyan-500/10", "via-cyan-400/60"],
    red: ["border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400", "bg-red-500/10", "via-red-400/60"],
    amber: ["border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400", "bg-amber-500/10", "via-amber-400/60"],
  } as const;
  return map[tone];
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  const [iconClass, glowClass, lineClass] = metricTone(tone);
  return (
    <motion.article
      variants={reveal}
      whileHover={{ y: -4, scale: 1.008 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.48)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${glowClass}`} />
      <div className={`pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent ${lineClass} to-transparent`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.article>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
      <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          {Icon && (
            <motion.div
              whileHover={{ rotate: 8, scale: 1.06 }}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 dark:text-teal-300"
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          )}
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function OceanTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[190px] rounded-2xl border border-white/10 bg-[#071923]/95 p-3 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.name ?? "series"}-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? OCEAN.tealBright }} />
              {entry.name}
            </span>
            <span className="text-[10px] font-black text-white">
              {typeof entry.value === "number" ? entry.value.toLocaleString("en-BD") : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  description,
  rows,
  icon: Icon,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; count: number; percentage: number }>;
  icon: LucideIcon;
}) {
  const pieData = rows
    .filter((row) => row.count > 0)
    .map((row, index) => ({ ...row, color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length] }));

  return (
    <Panel title={title} description={description} icon={Icon}>
      {rows.length ? (
        <div className="space-y-5">
          <div className="relative mx-auto h-[210px] max-w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<OceanTooltip />} />
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="transparent"
                  isAnimationActive
                  animationDuration={900}
                >
                  {pieData.map((item) => <Cell key={item.label} fill={item.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-950 dark:text-white">
                  {numberText(rows.reduce((total, row) => total + row.count, 0))}
                </p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Signals</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.035, 0.18) }}
                className="rounded-2xl border border-slate-200/80 bg-white/75 p-3.5 dark:border-white/10 dark:bg-black/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length] }} />
                    <span className="truncate">{humanize(row.label)}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-slate-500 dark:text-slate-400">{numberText(row.count)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length] }}
                  />
                </div>
                <p className="mt-2 text-right text-[9px] font-black text-slate-500 dark:text-slate-400">{percentText(row.percentage)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-200 text-center dark:border-white/10">
          <div>
            <DatabaseZap className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-500">No compliance breakdown data</p>
          </div>
        </div>
      )}
    </Panel>
  );
}

function InsightCard({
  insight,
  index,
}: {
  insight: AnalystComplianceData["insights"][number];
  index: number;
}) {
  const severity = String(insight.severity).toLowerCase();
  const positive = severity === "positive";
  const critical = severity === "critical" || severity === "high";
  const informational = severity === "info" || severity === "informational";
  const Icon = positive ? CheckCircle2 : critical ? XCircle : informational ? Sparkles : ShieldAlert;
  const shell = positive
    ? "border-emerald-500/20 from-emerald-500/[0.06]"
    : critical
      ? "border-red-500/20 from-red-500/[0.06]"
      : informational
        ? "border-cyan-500/20 from-cyan-500/[0.06]"
        : "border-amber-500/20 from-amber-500/[0.06]";
  const icon = positive
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : critical
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : informational
        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, filter: "blur(5px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      whileHover={{ y: -3 }}
      className={`rounded-[22px] border bg-gradient-to-br ${shell} via-white to-white p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.55)] dark:via-slate-950 dark:to-slate-950`}
    >
      <div className="flex items-start gap-3">
        <motion.div whileHover={{ rotate: 8, scale: 1.08 }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${icon}`}>
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">{insight.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${icon}`}>
              {String(insight.severity)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{insight.description}</p>
          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-white/10 dark:bg-black/10">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">Evidence</p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{insight.evidence}</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ComplianceLoading() {
  return (
    <div className="grid min-h-[470px] place-items-center rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-center">
        <div className="relative mx-auto h-20 w-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-teal-500/35" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border border-cyan-500/30" />
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-lg shadow-teal-500/20">
            <ShieldCheck className="h-6 w-6" />
          </motion.div>
        </div>
        <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">Aggregating compliance intelligence</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Reading real KYC, risk, security and system signals...</p>
      </div>
    </div>
  );
}

export default function AnalystCompliancePage() {
  const router =
    useRouter();

  /*
   * DashboardSessionContext is populated from the
   * authenticated backend profile by the dashboard layout.
   * The backend-confirmed role is the source of truth.
   */
  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

  /* =======================================================
     ANALYST-ONLY PAGE GUARD

     Only role=analyst can stay on Compliance Analytics.
     Every other dashboard role is redirected to its own
     dashboard home.
  ======================================================= */

  useEffect(() => {
    if (isAnalystRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isAnalystRole,
    router,
    user.role,
  ]);

  const [range, setRange] = useState<AnalystRange>("30d");
  const [data, setData] = useState<AnalystComplianceData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      setData(null);
      setError("");

      return;
    }

    const controller =
      new AbortController();

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAnalystCompliance(
            range,
            controller.signal
          );

        if (active) {
          setData(result);
        }
      } catch (cause: unknown) {
        if (
          active &&
          !controller.signal.aborted
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load compliance analytics."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    isAnalystRole,
    range,
    refreshKey,
  ]);

  const chartData = useMemo(
    () => data?.trend.map((item) => ({ ...item, label: bucketLabel(item.bucket, range) })) ?? [],
    [data, range]
  );

  const kycRows = useMemo(
    () => data?.kycStatuses.map((item) => ({ label: item.status, count: item.count, percentage: item.percentage })) ?? [],
    [data]
  );
  const aiRiskRows = useMemo(
    () => data?.aiRiskLevels.map((item) => ({ label: item.riskLevel, count: item.count, percentage: item.percentage })) ?? [],
    [data]
  );
  const securityRows = useMemo(
    () => data?.securityEvents.map((item) => ({ label: item.eventType, count: item.count, percentage: item.percentage })) ?? [],
    [data]
  );

  if (!isAnalystRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Compliance Analytics is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  if (loading && !data) {
    return <ComplianceLoading />;
  }

  return (
    <main className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-6 text-white shadow-[0_30px_90px_-45px_rgba(13,148,136,0.65)] md:p-7 lg:p-8"
      >
        <motion.div animate={{ x: [0, 34, -12, 0], y: [0, -16, 12, 0], scale: [1, 1.12, 0.96, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-[90px]" />
        <motion.div animate={{ x: [0, -24, 18, 0], y: [0, 18, -10, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-teal-300/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />
        <motion.div animate={{ x: ["-30%", "130%"] }} transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }} className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.9)]" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" /> Compliance Intelligence
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" /> Read-only analyst
              </div>
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">Compliance Analytics</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
              KYC verification, AI review risk, security warnings, critical settings activity and system compliance signals from real backend analytics.
            </p>
            {data && (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" /> {selectedLabel(RANGE_OPTIONS, range)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Users className="h-3.5 w-3.5 text-teal-300" /> {percentText(data.population.verificationCoverage)} coverage
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" /> Live compliance data
                </span>
              </div>
            )}
          </div>

          <div className="relative flex shrink-0 items-center">
            <div className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-300/10 blur-3xl" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-cyan-200/20 lg:block">
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            </motion.div>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (!isAnalystRole) {
                  return;
                }

                setRefreshKey(
                  (value) =>
                    value + 1
                );
              }}
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        {loading && data && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.15, repeat: Infinity }} className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />}
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }} className="relative z-30 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <OceanSelect
              label="Analysis range"
              value={range}
              options={RANGE_OPTIONS}
              onChange={(nextRange) => {
                if (!isAnalystRole) {
                  return;
                }

                setRange(nextRange);
              }}
              icon={Clock3}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isAnalystRole) {
                return;
              }

              setRange("30d");
              setError("");
            }}
            disabled={
              range === "30d"
            }
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-teal-500/30 hover:text-teal-700 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset range
          </button>
        </div>
      </motion.section>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-3 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] p-4 text-red-600 shadow-sm dark:text-red-400">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-black">Compliance analytics request failed</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data && (
        <>
          <motion.section variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="KYC coverage" value={percentText(data.population.verificationCoverage)} subtitle="Current verified population coverage" icon={Users} tone="ocean" />
            <MetricCard title="Submitted KYC" value={numberText(data.metrics.submittedKycCount.value)} subtitle="Applications submitted in scope" icon={FileCheck2} tone="cyan" />
            <MetricCard title="Verified" value={numberText(data.metrics.verifiedKycCount.value)} subtitle="Successful KYC verifications" icon={UserRoundCheck} tone="emerald" />
            <MetricCard title="AI reviews" value={numberText(data.metrics.aiReviewCount.value)} subtitle="AI-assisted review events" icon={Sparkles} tone="violet" />
            <MetricCard title="High-risk AI" value={numberText(data.metrics.highRiskAiReviewCount.value)} subtitle="High-risk AI review signals" icon={Gauge} tone="amber" />
            <MetricCard title="Security warnings" value={numberText(data.metrics.securityWarningCount.value)} subtitle="Security warning events" icon={ShieldAlert} tone="amber" />
            <MetricCard title="Critical settings" value={numberText(data.metrics.criticalSettingsChangeCount.value)} subtitle="Critical settings changes" icon={TriangleAlert} tone="red" />
            <MetricCard title="System errors" value={numberText(data.metrics.systemErrorCount.value)} subtitle="System-level compliance errors" icon={XCircle} tone="red" />
          </motion.section>

          <Panel title="Compliance Signal Trend" description="KYC submissions, verified cases, high-risk AI review signals and system errors across the selected period." icon={Activity} action={<span className="rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Real API trend</span>}>
            {chartData.length ? (
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
                <div className="relative h-[370px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} minTickGap={22} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<OceanTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#CBD5E1", paddingTop: 10 }} />
                      <Line type="monotone" dataKey="submittedKycCount" name="KYC submitted" stroke={OCEAN.sky} strokeWidth={2.4} dot={false} />
                      <Line type="monotone" dataKey="verifiedKycCount" name="KYC verified" stroke={OCEAN.emerald} strokeWidth={2.6} dot={false} />
                      <Line type="monotone" dataKey="highRiskAiReviewCount" name="High-risk AI" stroke={OCEAN.amber} strokeWidth={2.2} dot={false} />
                      <Line type="monotone" dataKey="systemErrorCount" name="System errors" stroke={OCEAN.red} strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <div className="text-center"><BarChart3 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-500">No compliance trend data</p></div>
              </div>
            )}
          </Panel>

          <div className="grid items-start gap-6 xl:grid-cols-3">
            <BreakdownCard title="KYC Status" description="Identity verification state distribution." rows={kycRows} icon={Fingerprint} />
            <BreakdownCard title="AI Risk Levels" description="AI review risk-level distribution." rows={aiRiskRows} icon={Gauge} />
            <BreakdownCard title="Security Warnings" description="Security warning event distribution." rows={securityRows} icon={ShieldAlert} />
          </div>

          <Panel title="Compliance Intelligence Signals" description="Deterministic evidence-backed findings from the current compliance analytics response." icon={Zap} action={<span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">{data.insights.length} signals</span>}>
            {data.insights.length ? (
              <div className={`grid gap-4 ${data.insights.length > 1 ? "xl:grid-cols-2" : "grid-cols-1"}`}>
                {data.insights.map((insight, index) => <InsightCard key={insight.id} insight={insight} index={index} />)}
              </div>
            ) : (
              <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <div className="text-center"><Sparkles className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-500">No compliance insights for this range</p></div>
              </div>
            )}
          </Panel>

          <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_55px_-40px_rgba(15,118,110,0.45)] dark:border-white/10 dark:bg-slate-950/70">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-[70px]" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300"><ShieldCheck className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">Read-only analyst boundary</p>
                <p className="mt-1 max-w-4xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">This page only reads aggregated compliance analytics. It does not approve or reject KYC, modify security settings, or change system compliance records.</p>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}
