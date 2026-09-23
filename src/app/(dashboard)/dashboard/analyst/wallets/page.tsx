"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  AreaChart as AreaChartIcon,
  BadgeCheck,
  Banknote,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  CreditCard,
  DatabaseZap,
  LockKeyhole,
  RefreshCcw,
  Sparkles,
  Repeat2,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
  getAnalystWalletAnalytics,
  type AnalystMetric,
  type AnalystRange,
  type AnalystWalletAnalyticsData,
  type AnalystWalletInsight,
} from "@/lib/api/analystApi";

import {
  isApiAbortError,
} from "@/lib/api/client";

/* =========================================================
   OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{ value: AnalystRange; label: string }> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];


type RangeOption = (typeof RANGE_OPTIONS)[number];

function AnalystRangeSelect({
  value,
  onChange,
}: {
  value: AnalystRange;
  onChange: (value: AnalystRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = RANGE_OPTIONS.find((option) => option.value === value) ?? RANGE_OPTIONS[2];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative min-w-[178px] ${open ? "z-[120]" : "z-20"}`}>
      <span className="sr-only">
        Period
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left text-xs font-black text-white shadow-sm outline-none backdrop-blur-md transition-all ${
          open
            ? "border-white/35 bg-white/[0.14] ring-4 ring-white/10"
            : "border-white/[0.14] bg-white/[0.09] hover:border-white/25 hover:bg-white/[0.13]"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? "Last 30 days"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="h-4 w-4 text-cyan-100" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.985 }}
            transition={{ duration: 0.16 }}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[130] overflow-hidden rounded-2xl border border-[#D8E5E2] bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(7,47,60,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#091820]/95"
          >
            {RANGE_OPTIONS.map((option) => {
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
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                    active
                      ? "bg-[#0D5960]/10 text-[#0B4F52] dark:text-cyan-300"
                      : "text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{option.label}</span>
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
   OPAL GLOW THEME
========================================================= */

const OPAL_GLOW = {
  ink: "#0D2335",
  primary: "#0D5960",
  primaryStrong: "#0B766D",
  mint: "#20C7B5",
  rose: "#7C5CFC",
  sky: "#08B6D4",
  canvas: "#F2F5EF",
} as const;

/* Trend series config — drives both the chart and the
   clickable legend, so adding a series means editing one
   place instead of three. */
const TREND_SERIES = [
  { key: "engaged", name: "Engaged wallets", color: OPAL_GLOW.primary },
  { key: "merchant", name: "Merchant payments", color: OPAL_GLOW.rose },
  { key: "p2p", name: "P2P transfers", color: OPAL_GLOW.mint },
  { key: "newWallets", name: "New wallets", color: OPAL_GLOW.sky },
] as const;

type TrendSeriesKey = (typeof TREND_SERIES)[number]["key"];
type TrendView = "flow" | "compare";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* =========================================================
   FORMAT
========================================================= */

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-BD").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatMoney(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString("en-BD")}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBucket(value: string, range: AnalystRange) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (range === "24h") {
    return new Intl.DateTimeFormat("en-BD", {
      hour: "numeric",
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-BD", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/* =========================================================
   ANIMATED NUMBER

   Counts from 0 to the real value the first time it scrolls
   into view, and re-counts from the previous value whenever
   the data changes (range switch, refresh). Makes every stat
   feel live instead of static text swapping in place.
========================================================= */

function AnimatedNumber({
  value,
  format = formatNumber,
  className = "",
  duration = 1.1,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
  duration?: number;
}) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(nodeRef, { once: true, amount: 0.4 });
  const previous = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;

    if (!node || !inView) {
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: easeOut,
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });

    previous.current = value;

    return () => controls.stop();
  }, [value, inView, duration, format]);

  return (
    <span ref={nodeRef} className={className}>
      {format(0)}
    </span>
  );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function GlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      className="min-w-[180px] rounded-2xl border border-[#0B4F52]/20 bg-white/95 p-3 shadow-[0_18px_50px_rgba(91,108,220,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95"
    >
      {label ? (
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#0F766E] dark:text-[#99F6E4]">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-slate-500 dark:text-slate-400">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </span>

            <span className="shrink-0 font-black tabular-nums text-[#10283A] dark:text-slate-100">
              {formatNumber(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, ease: easeOut }}
      whileHover={{ y: -2 }}
      className="group relative min-w-0 overflow-hidden rounded-[26px] border border-[#DBE6E3] bg-white shadow-[0_18px_55px_-40px_rgba(8,69,82,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFD9D4] hover:shadow-[0_22px_58px_-38px_rgba(8,69,82,0.34)] dark:border-white/10 dark:bg-slate-950/[0.78]"
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#20C7B5]/55 to-transparent" />

      {/* slow drifting bloom instead of a static blur blob */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.95, 0.5], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#08B6D4]/[0.08] blur-3xl"
      />

      <div className="relative flex flex-col gap-3 border-b border-[#E4ECEA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-[#10283A] dark:text-slate-100">
            {title}
          </h2>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="relative min-w-0 p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   CHANGE
========================================================= */

function ChangeBadge({ metric }: { metric: AnalystMetric }) {
  if (metric.changePercent === null) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        New vs previous period
      </span>
    );
  }

  const positive = metric.changePercent >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.25 }}
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <motion.span
        animate={{ y: positive ? [0, -2, 0] : [0, 2, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-3.5 w-3.5" />
      </motion.span>

      {Math.abs(metric.changePercent).toFixed(2)}%
      <span className="font-medium text-muted-foreground">vs previous</span>
    </motion.span>
  );
}

/* =========================================================
   METRIC
========================================================= */

function MetricCard({
  label,
  value,
  metric,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  metric: AnalystMetric;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#DCE7E4] bg-white p-5 shadow-[0_16px_44px_-34px_rgba(8,69,82,0.30)] transition-all hover:-translate-y-1 hover:border-[#BFD9D4] hover:shadow-[0_20px_48px_-32px_rgba(8,69,82,0.36)] dark:border-white/10 dark:bg-slate-950/[0.78]"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#0D5960]/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#22C7B8]/70 to-transparent" />

      {/* sheen sweep on hover */}
      <motion.div
        aria-hidden
        initial={{ x: "-130%" }}
        whileHover={{ x: "130%" }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/10"
      />

      <div className="relative z-10 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[11px] font-black uppercase leading-4 tracking-[0.13em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <AnimatedNumber
            value={value}
            className="mt-3 block break-words text-2xl font-black [overflow-wrap:anywhere] tabular-nums tracking-tight text-[#10283A] dark:text-slate-50"
          />
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_12px_28px_-16px_currentColor] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-auto border-t border-[#DCE7E4] pt-3">
        <ChangeBadge metric={metric} />
      </div>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: ReactNode;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.34, ease: easeOut }}
      className="group relative isolate flex h-full min-w-0 overflow-hidden rounded-[24px] border border-[#DCE7E4] bg-white p-5 shadow-[0_16px_44px_-34px_rgba(8,69,82,0.28)] transition-all hover:-translate-y-1 hover:border-[#BFD9D4] dark:border-white/10 dark:bg-slate-950/[0.78]"
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#22C7B8]/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />

      <div className="relative flex w-full justify-between gap-4">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] font-black uppercase leading-4 tracking-[0.13em] text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-black tabular-nums tracking-tight text-[#10283A] dark:text-slate-50">
            {value}
          </p>

          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: -6, scale: 1.08 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_12px_28px_-16px_currentColor] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   RADIAL RATE

   Replaces the flat percentage text in the engagement grid —
   the ring draws itself in so a rate reads at a glance.
========================================================= */

function RadialRate({
  label,
  value,
  color,
  caption,
}: {
  label: string;
  value: number;
  color: string;
  caption?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 34;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -4 }}
      className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#DCE7E4] bg-white p-4 text-center shadow-sm transition hover:border-[#BFD9D4] dark:from-slate-950/80 dark:to-[#0B4F52]/[0.04]"
    >
      <div className="relative flex h-[92px] w-[92px] items-center justify-center">
        <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            strokeWidth="7"
            className="stroke-[#0B4F52]/10"
          />

          <motion.circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{
              strokeDashoffset: circumference - (safe / 100) * circumference,
            }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: easeOut }}
          />
        </svg>

        <AnimatedNumber
          value={safe}
          format={(current) => `${current.toFixed(1)}%`}
          className="relative text-sm font-black tabular-nums text-[#10283A] dark:text-slate-100"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          {label}
        </p>

        {caption ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400 dark:text-slate-500">
            {caption}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyData({ text }: { text: string }) {
  return (
    <div className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[#0B4F52]/20 bg-gradient-to-br from-[#0B4F52]/[0.035] via-white/60 to-[#22C7B8]/[0.05] px-6 text-center dark:via-slate-950/50">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-24 w-24 rounded-full bg-[#38BDF8]/10 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D5960]/10 text-[#0F766E]"
      >
        <DatabaseZap className="h-6 w-6" />
      </motion.div>

      <p className="relative mt-3 text-sm font-extrabold text-[#10283A] dark:text-slate-100">
        No wallet activity
      </p>

      <p className="relative mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   INSIGHT
========================================================= */

function InsightCard({
  insight,
  index,
}: {
  insight: AnalystWalletInsight;
  index: number;
}) {
  const style = {
    critical: "border-red-500/25 bg-red-500/[0.055] text-red-600 dark:text-red-400",
    high: "border-orange-500/25 bg-orange-500/[0.055] text-orange-600 dark:text-orange-400",
    medium: "border-amber-500/25 bg-amber-500/[0.055] text-amber-600 dark:text-amber-400",
    info: "border-[#0B4F52]/20 bg-[#0B4F52]/[0.055] text-[#0F766E] dark:text-[#99F6E4]",
    positive:
      "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-600 dark:text-emerald-400",
  }[insight.severity];

  const Icon =
    insight.severity === "positive"
      ? BadgeCheck
      : insight.severity === "info"
        ? BrainCircuit
        : AlertTriangle;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: easeOut }}
      whileHover={{ y: -3 }}
      className={`group relative flex overflow-hidden rounded-[22px] border p-4 transition-shadow hover:shadow-[0_18px_50px_-36px_rgba(85,102,242,0.7)] ${style}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-current/5 blur-3xl" />

      <div className="relative flex w-full items-start gap-3">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.08 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10"
        >
          <Icon className="h-4 w-4" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#10283A] dark:text-slate-100">
              {insight.title}
            </p>

            <span className="shrink-0 rounded-full border border-current/20 bg-white/50 px-2 py-0.5 text-[9px] font-black uppercase backdrop-blur dark:bg-slate-950/30">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {insight.description}
          </p>

          <div className="mt-3 rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur dark:border-white/5 dark:bg-slate-950/[0.35]">
            <p className="text-[11px] font-bold text-[#10283A] dark:text-slate-200">Evidence</p>
            <p className="mt-1 break-words text-[11px] text-slate-500 dark:text-slate-400">
              {insight.evidence}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
            <strong>Recommended review:</strong> {insight.recommendedReview}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystWalletsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

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
  const [currency, setCurrency] = useState("BDT");
  const [currencyDraft, setCurrencyDraft] = useState("BDT");
  const [data, setData] = useState<AnalystWalletAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /* Interactive chart state — legend toggles and view switch. */
  const [hiddenSeries, setHiddenSeries] = useState<TrendSeriesKey[]>([]);
  const [trendView, setTrendView] = useState<TrendView>("flow");
  const [activeUsageIndex, setActiveUsageIndex] = useState<number | null>(null);

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      setRefreshing(false);
      setData(null);
      setError("");
      return;
    }

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setRefreshing(true);
      setError("");

      try {
        const result = await getAnalystWalletAnalytics(
          { range, currency },
          controller.signal
        );

        if (!active || controller.signal.aborted) {
          return;
        }

        setData(result);
      } catch (loadError: unknown) {
        if (!active || controller.signal.aborted || isApiAbortError(loadError)) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load wallet analytics."
        );
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      active = false;

      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
  }, [isAnalystRole, range, currency, refreshKey]);

  /* =======================================================
     CURRENCY
  ======================================================= */

  const applyCurrency = (event: FormEvent) => {
    event.preventDefault();

    if (!isAnalystRole) {
      return;
    }

    const normalized = currencyDraft.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      setError("Currency must be a valid three-letter code.");
      return;
    }

    setCurrency(normalized);
  };

  const toggleSeries = (key: TrendSeriesKey) => {
    if (!isAnalystRole) {
      return;
    }

    setHiddenSeries((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  /* =======================================================
     CHART
  ======================================================= */

  const trendData = useMemo(
    () =>
      data?.trend.map((item) => ({
        name: formatBucket(item.bucket, data.filters.range),
        engaged: item.engagedWallets,
        newWallets: item.newWallets,
        p2p: item.p2pTransferCount,
        merchant: item.merchantPaymentCount,
        funding: item.fundingCount,
      })) ?? [],
    [data]
  );

  const usageData = useMemo(() => data?.usageMix ?? [], [data]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (!isAnalystRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening analyst workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Wallet Analytics is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  if (loading && !data) {
    return (
      <div className="relative isolate space-y-5">
        <div className="h-44 animate-pulse rounded-[30px] border border-[#DCE7E4] bg-gradient-to-r from-[#0B4F52]/10 via-[#38BDF8]/10 to-[#22C7B8]/10" />

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: index * 0.08,
                ease: "easeInOut",
              }}
              className="h-40 rounded-[24px] border border-[#DCE7E4] bg-white/70 shadow-sm dark:bg-slate-950/60"
            />
          ))}
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!data && error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg rounded-[28px] border border-red-500/20 bg-white/[0.85] p-8 text-center shadow-[0_20px_70px_-42px_rgba(239,68,68,0.55)] backdrop-blur-xl dark:bg-slate-950/[0.75]"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          </motion.div>

          <h1 className="mt-4 text-xl font-black">Wallet analytics unavailable</h1>

          <p className="mt-2 text-sm text-muted-foreground">{error}</p>

          <button
            type="button"
            onClick={() => {
                if (!isAnalystRole) {
                  return;
                }

                setRefreshKey((value) => value + 1);
              }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0B4F52] to-[#38BDF8] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(109,124,255,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-14px_rgba(109,124,255,0.9)]"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusClass =
    data.status === "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
      : data.status === "attention"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

  const visibleSeries = TREND_SERIES.filter(
    (series) => !hiddenSeries.includes(series.key)
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative isolate min-w-0 space-y-6 overflow-x-clip rounded-[34px] bg-[#F2F5EF] p-1 pb-10 dark:bg-slate-950">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.85, 0.4], y: [0, -18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[9%] top-20 -z-10 h-40 w-40 rounded-full bg-[#20C7B5]/[0.07] blur-[90px]"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.35, 0.8, 0.35], y: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[6%] top-72 -z-10 h-44 w-44 rounded-full bg-[#08B6D4]/[0.06] blur-[95px]"
      />

      {/* HEADER */}

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut }}
        className="relative overflow-hidden rounded-[30px] border border-[#1B6670]/40 px-5 py-6 text-white shadow-[0_30px_70px_-38px_rgba(6,45,58,0.75)] sm:px-7 sm:py-7 lg:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 22%, rgba(21,196,181,0.18), transparent 26%), radial-gradient(circle at 38% 110%, rgba(10,151,137,0.18), transparent 34%), radial-gradient(rgba(255,255,255,0.075) 1px, transparent 1px), linear-gradient(135deg,#0B2D3C 0%,#0D5B5B 56%,#0B263B 100%)",
          backgroundSize:
            "auto, auto, 22px 22px, auto",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.018),transparent_45%,rgba(255,255,255,0.02))]" />

        <motion.div
          aria-hidden
          animate={{
            opacity: [0.18, 0.42, 0.18],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute right-[20%] top-16 h-28 w-28 rounded-full border border-cyan-200/10"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-white/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50 backdrop-blur-md">
              <Activity className="h-3.5 w-3.5" />
              Analyst Command Center
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              Analyst Only
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                data.status === "critical"
                  ? "border-red-300/25 bg-red-400/10 text-red-200"
                  : data.status === "attention"
                    ? "border-amber-300/25 bg-amber-400/10 text-amber-200"
                    : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-35" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
              {data.status}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Wallet Analytics
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50/70">
                A read-only analyst snapshot of wallet adoption, engagement,
                P2P usage, funding activity and merchant-payment behavior
                generated from live Coffer platform records.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 text-xs font-black text-cyan-50/85 backdrop-blur-md">
                <DatabaseZap className="h-4 w-4 text-cyan-300" />
                Live wallet data
              </div>

              <motion.button
                type="button"
                disabled={refreshing}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setRefreshKey((value) => value + 1);
                }}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/[0.14] bg-white/[0.10] px-4 text-xs font-black text-white backdrop-blur-md transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-4 w-4 transition-transform group-hover:rotate-45 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh now
              </motion.button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-bold text-cyan-50/65">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-300" />
              Updated {formatDate(data.generatedAt)}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3 py-1.5">
              <WalletCards className="h-3.5 w-3.5 text-emerald-300" />
              Personal wallets only
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3 py-1.5">
              <CreditCard className="h-3.5 w-3.5 text-violet-300" />
              Live merchant payments
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.10] pt-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <AnalystRangeSelect
                value={range}
                onChange={(nextRange) => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setRange(nextRange);
                }}
              />

              <form
                onSubmit={applyCurrency}
                className="flex min-w-0 items-end gap-2"
              >
                <div>
                  <span className="sr-only">
                    Currency
                  </span>

                  <input
                    value={currencyDraft}
                    onChange={(event) => {
                      if (!isAnalystRole) {
                        return;
                      }

                      setCurrencyDraft(
                        event.target.value
                          .replace(/[^a-z]/gi, "")
                          .slice(0, 3)
                          .toUpperCase()
                      );
                    }}
                    aria-label="Currency code"
                    className="h-11 w-24 rounded-xl border border-white/[0.14] bg-white/[0.09] px-3 text-center text-xs font-black text-white outline-none backdrop-blur-md transition placeholder:text-white/40 focus:border-cyan-200/35 focus:bg-white/[0.13] focus:ring-4 focus:ring-cyan-200/10"
                  />
                </div>

                <button
                  type="submit"
                  className="h-11 rounded-xl border border-cyan-200/20 bg-cyan-300/[0.10] px-4 text-[10px] font-black uppercase tracking-wide text-cyan-50 transition hover:bg-cyan-300/[0.16]"
                >
                  Apply
                </button>
              </form>
            </div>

            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-cyan-50/55">
              <DatabaseZap className="h-3.5 w-3.5 text-cyan-300" />
              Source: MongoDB live collections
            </div>
          </div>
        </div>
      </motion.section>

      {/* POPULATION */}

      <section className="grid items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          title="Total wallets"
          value={<AnimatedNumber value={data.population.totalWallets} />}
          description="Personal Coffer wallets"
          icon={WalletCards}
          iconClass="bg-[#0D5960]/10 text-[#0F766E] dark:text-[#99F6E4]"
        />

        <SummaryCard
          title="Active status"
          value={<AnimatedNumber value={data.population.activeStatusWallets} />}
          description={`${formatPercent(data.population.activeStatusRate)} of wallets`}
          icon={BadgeCheck}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <SummaryCard
          title="Dormant this period"
          value={<AnimatedNumber value={data.population.dormantWallets} />}
          description={`${formatPercent(data.population.dormantWalletRate)} had no activity`}
          icon={Activity}
          iconClass="bg-amber-500/10 text-amber-600"
        />

        <SummaryCard
          title="Locked wallets"
          value={<AnimatedNumber value={data.population.lockedWallets} />}
          description={`${data.population.frozenWallets} frozen · ${data.population.blockedWallets} blocked`}
          icon={LockKeyhole}
          iconClass="bg-red-500/10 text-red-600"
        />
      </section>

      {/* METRICS */}

      <section className="grid items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="Engaged wallets"
          value={data.metrics.engagedWallets.value}
          metric={data.metrics.engagedWallets}
          icon={UserRoundCheck}
          iconClass="bg-[#0D5960]/10 text-[#0F766E] dark:text-[#99F6E4]"
        />

        <MetricCard
          label="New wallets"
          value={data.metrics.newWallets.value}
          metric={data.metrics.newWallets}
          icon={WalletCards}
          iconClass="bg-[#20C7B5]/[0.14] text-[#0F766E] dark:text-[#99F6E4]"
        />

        <MetricCard
          label="Merchant-paying"
          value={data.metrics.merchantPayingWallets.value}
          metric={data.metrics.merchantPayingWallets}
          icon={CreditCard}
          iconClass="bg-[#7C5CFC]/[0.11] text-[#6D55E8] dark:text-[#C4B5FD]"
        />

        <MetricCard
          label="P2P wallets"
          value={data.metrics.p2pWallets.value}
          metric={data.metrics.p2pWallets}
          icon={UsersRound}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <MetricCard
          label="Repeat engaged"
          value={data.metrics.repeatEngagedWallets.value}
          metric={data.metrics.repeatEngagedWallets}
          icon={Repeat2}
          iconClass="bg-[#08B6D4]/[0.12] text-[#0789A3] dark:text-[#A5F3FC]"
        />

        <MetricCard
          label="Wallet events"
          value={data.metrics.walletActivityEvents.value}
          metric={data.metrics.walletActivityEvents}
          icon={TrendingUp}
          iconClass="bg-[#20C7B5]/[0.14] text-[#0F766E] dark:text-[#99F6E4]"
        />

        <MetricCard
          label="Merchant payments"
          value={data.metrics.merchantPaymentCount.value}
          metric={data.metrics.merchantPaymentCount}
          icon={CreditCard}
          iconClass="bg-[#7C5CFC]/[0.11] text-[#6D55E8] dark:text-[#C4B5FD]"
        />

        <MetricCard
          label="P2P transfers"
          value={data.metrics.p2pTransferCount.value}
          metric={data.metrics.p2pTransferCount}
          icon={Activity}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
      </section>

      {/* TREND */}

      <Panel
        title="Wallet network activity"
        description="Engaged wallets, P2P transfers, merchant payments and new wallet creation. Click a series to isolate it."
        action={
          <div className="flex items-center gap-1 rounded-xl border border-[#0B4F52]/[0.15] bg-white/60 p-1 shadow-sm backdrop-blur dark:bg-slate-950/50">
            {(
              [
                { value: "flow", label: "Flow", icon: AreaChartIcon },
                { value: "compare", label: "Compare", icon: BarChart3 },
              ] as const
            ).map((option) => {
              const active = trendView === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (!isAnalystRole) {
                      return;
                    }

                    setTrendView(option.value);
                  }}
                  className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition ${
                    active
                      ? "text-white"
                      : "text-slate-500 hover:text-[#0F766E] dark:text-slate-400"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="trend-view-pill"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#0B4F52] to-[#38BDF8]"
                    />
                  ) : null}

                  <option.icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{option.label}</span>
                </button>
              );
            })}
          </div>
        }
      >
        {trendData.length > 0 ? (
          <div className="space-y-4">
            {/* Interactive legend — toggles series in the chart */}
            <div className="flex flex-wrap gap-2">
              {TREND_SERIES.map((series) => {
                const hidden = hiddenSeries.includes(series.key);

                return (
                  <motion.button
                    key={series.key}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSeries(series.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition ${
                      hidden
                        ? "border-slate-200 bg-transparent text-slate-400 dark:border-white/10"
                        : "border-[#0B4F52]/15 bg-white/70 text-[#10283A] shadow-sm dark:bg-slate-950/50 dark:text-slate-200"
                    }`}
                  >
                    <motion.span
                      animate={{ scale: hidden ? 0.7 : 1, opacity: hidden ? 0.35 : 1 }}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: series.color }}
                    />
                    {series.name}
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              key={trendView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="h-[360px] rounded-2xl bg-gradient-to-b from-[#0B4F52]/[0.025] to-transparent p-1"
            >
              <ResponsiveContainer width="100%" height="100%">
                {trendView === "flow" ? (
                  <ComposedChart data={trendData}>
                    <defs>
                      <linearGradient id="walletEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={OPAL_GLOW.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={OPAL_GLOW.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.08} />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                      tick={{ fill: "#7A849A", fontSize: 11 }}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7A849A", fontSize: 11 }}
                    />

                    <Tooltip
                      content={<GlowTooltip />}
                      cursor={{ stroke: "rgba(109,124,255,0.2)", strokeWidth: 2 }}
                    />

                    {!hiddenSeries.includes("engaged") ? (
                      <Area
                        type="monotone"
                        dataKey="engaged"
                        name="Engaged wallets"
                        stroke={OPAL_GLOW.primary}
                        strokeWidth={2.5}
                        fill="url(#walletEngagementGradient)"
                        isAnimationActive
                        animationDuration={1200}
                        animationEasing="ease-out"
                        activeDot={{ r: 5, fill: OPAL_GLOW.primary, strokeWidth: 0 }}
                      />
                    ) : null}

                    {TREND_SERIES.filter((series) => series.key !== "engaged").map(
                      (series, index) =>
                        hiddenSeries.includes(series.key) ? null : (
                          <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.name}
                            stroke={series.color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive
                            animationBegin={220 + index * 180}
                            animationDuration={1200}
                            activeDot={{ r: 4.5, fill: series.color, strokeWidth: 0 }}
                          />
                        )
                    )}
                  </ComposedChart>
                ) : (
                  <BarChart data={trendData} barGap={4}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.08} />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                      tick={{ fill: "#7A849A", fontSize: 11 }}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7A849A", fontSize: 11 }}
                    />

                    <Tooltip
                      content={<GlowTooltip />}
                      cursor={{ fill: "rgba(109,124,255,0.05)" }}
                    />

                    {visibleSeries.map((series, index) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        name={series.name}
                        fill={series.color}
                        radius={[6, 6, 0, 0]}
                        isAnimationActive
                        animationBegin={index * 140}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </div>
        ) : (
          <EmptyData text="Wallet activity will appear after real platform activity exists." />
        )}
      </Panel>

      {/* FUNNEL + USAGE */}

      <div className="grid items-stretch gap-5 2xl:grid-cols-2">
        <Panel
          title="Wallet engagement funnel"
          description="From provisioned wallets to wallets actively paying Coffer merchants."
        >
          <div className="space-y-5">
            {data.funnel.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.35, ease: easeOut }}
              >
                <div className="mb-2 flex justify-between gap-4">
                  <span className="min-w-0 truncate text-xs font-bold">{item.label}</span>

                  <span className="shrink-0 text-xs font-black tabular-nums text-muted-foreground">
                    {formatNumber(item.value)} · {formatPercent(item.percentage)}
                  </span>
                </div>

                <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(item.percentage, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1,
                      delay: index * 0.09,
                      ease: easeOut,
                    }}
                    className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#0D5960] via-[#08B6D4] to-[#20C7B5] shadow-[0_0_18px_rgba(109,124,255,0.24)]"
                  >
                    {/* travelling shimmer along the filled bar */}
                    <motion.span
                      aria-hidden
                      animate={{ x: ["-100%", "220%"] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2,
                      }}
                      className="absolute inset-y-0 w-12 bg-white/40 blur-sm"
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Wallet usage mix"
          description="Completed wallet activity by use case. Hover a bar to highlight it."
        >
          {usageData.some((item) => item.count > 0) ? (
            <div className="h-[280px] rounded-2xl bg-gradient-to-b from-[#38BDF8]/[0.025] to-transparent p-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={usageData}
                  layout="vertical"
                  onMouseLeave={() => setActiveUsageIndex(null)}
                >
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} opacity={0.08} />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#7A849A", fontSize: 11 }}
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={120}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#7A849A", fontSize: 11 }}
                  />

                  <Tooltip content={<GlowTooltip />} cursor={{ fill: "rgba(109,124,255,0.05)" }} />

                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    isAnimationActive
                    animationDuration={950}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => setActiveUsageIndex(index)}
                  >
                    {usageData.map((item, index) => {
                      const color = [
                        OPAL_GLOW.primary,
                        OPAL_GLOW.rose,
                        OPAL_GLOW.mint,
                        OPAL_GLOW.sky,
                      ][index % 4];

                      const dimmed =
                        activeUsageIndex !== null && activeUsageIndex !== index;

                      return (
                        <Cell
                          key={item.key}
                          fill={color}
                          fillOpacity={dimmed ? 0.35 : 1}
                          style={{ transition: "fill-opacity 220ms ease" }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyData text="No completed wallet usage event exists for this period." />
          )}
        </Panel>
      </div>

      {/* ENGAGEMENT */}

      <Panel
        title="Wallet engagement"
        description="Adoption and repeat-usage indicators for the Coffer wallet ecosystem."
      >
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
          <RadialRate
            label="Wallet engagement"
            value={data.engagement.walletEngagementRate}
            color={OPAL_GLOW.primary}
            caption="Wallets active this period"
          />

          <RadialRate
            label="Merchant adoption"
            value={data.engagement.merchantPaymentAdoptionRate}
            color={OPAL_GLOW.rose}
            caption="Paid a Coffer merchant"
          />

          <RadialRate
            label="P2P adoption"
            value={data.engagement.p2pAdoptionRate}
            color={OPAL_GLOW.mint}
            caption="Sent a wallet-to-wallet transfer"
          />

          <RadialRate
            label="Repeat activity"
            value={data.engagement.repeatActivityRate}
            color={OPAL_GLOW.sky}
            caption="More than one activity event"
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="flex h-full flex-col justify-center rounded-2xl border border-[#DCE7E4] bg-white p-4 text-center shadow-sm transition hover:border-[#BFD9D4] dark:from-slate-950/80 dark:to-[#0B4F52]/[0.04]"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D5960]/10 text-[#0F766E] dark:text-[#99F6E4]"
            >
              <Activity className="h-5 w-5" />
            </motion.div>

            <AnimatedNumber
              value={Number(data.engagement.transactionsPerEngagedWallet) || 0}
              format={(current) => current.toFixed(2)}
              className="mt-3 block text-2xl font-black tabular-nums text-[#10283A] dark:text-slate-50"
            />

            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
              Events / engaged
            </p>
          </motion.div>
        </div>
      </Panel>

      {/* LIQUIDITY */}

      <Panel
        title="Wallet balance snapshot"
        description="Current wallet balances aggregated directly from the wallet collection for the selected currency."
      >
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total balance"
            value={
              <AnimatedNumber
                value={data.liquidity.totalBalanceMinor}
                format={(current) => formatMoney(current, data.filters.currency)}
              />
            }
            description="Current aggregate wallet balance"
            icon={Banknote}
            iconClass="bg-emerald-500/10 text-emerald-600"
          />

          <SummaryCard
            title="Pending balance"
            value={
              <AnimatedNumber
                value={data.liquidity.totalPendingBalanceMinor}
                format={(current) => formatMoney(current, data.filters.currency)}
              />
            }
            description="Aggregate pending wallet balance"
            icon={Activity}
            iconClass="bg-amber-500/10 text-amber-600"
          />

          <SummaryCard
            title="Average wallet balance"
            value={
              <AnimatedNumber
                value={data.liquidity.averageBalanceMinor}
                format={(current) => formatMoney(current, data.filters.currency)}
              />
            }
            description="Average across matching wallets"
            icon={WalletCards}
            iconClass="bg-[#0D5960]/10 text-[#0F766E] dark:text-[#99F6E4]"
          />
        </div>
      </Panel>

      {/* STATUS */}

      <Panel
        title="Wallet status distribution"
        description="Current operational wallet state."
      >
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {data.walletStatuses.map((item, index) => {
            const className =
              item.status === "ACTIVE"
                ? "text-emerald-600 bg-emerald-500/10"
                : item.status === "FROZEN"
                  ? "text-amber-600 bg-amber-500/10"
                  : "text-red-600 bg-red-500/10";

            return (
              <motion.div
                key={item.status}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="flex h-full flex-col rounded-2xl border border-[#DCE7E4] bg-white p-4 shadow-sm transition hover:border-[#BFD9D4] dark:from-slate-950/80 dark:to-[#0B4F52]/[0.04]"
              >
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-black ${className}`}
                >
                  {item.status}
                </span>

                <AnimatedNumber
                  value={item.count}
                  className="mt-4 block text-2xl font-black tabular-nums"
                />

                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(item.percentage, 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: index * 0.08, ease: easeOut }}
                      className="h-full rounded-full bg-gradient-to-r from-[#0D5960] to-[#20C7B5]"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatPercent(item.percentage)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Panel>

      {/* INSIGHTS */}

      <Panel
        title="Wallet intelligence"
        description="Deterministic signals derived from real Coffer wallet activity."
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#0B4F52]/[0.15] bg-[#0B4F52]/[0.075] px-3 py-1.5 text-[10px] font-black text-[#0F766E] shadow-sm dark:text-[#A7F3D0]">
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
            </motion.span>
            Rules-based
          </span>
        }
      >
        {data.insights.length > 0 ? (
          <div className="grid items-stretch gap-3 lg:grid-cols-2">
            {data.insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        ) : (
          <EmptyData text="No deterministic wallet signal was generated for this period." />
        )}
      </Panel>

      {/* PRIVACY */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[24px] border border-[#DCE7E4] bg-white p-5 shadow-[0_16px_44px_-34px_rgba(8,69,82,0.26)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" />

          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#10283A] dark:text-slate-100">
              Privacy-safe wallet analytics
            </p>

            <p className="mt-1 break-words text-[11px] leading-5 text-muted-foreground [overflow-wrap:anywhere]">
              {data.privacy.note}
            </p>

            <p className="mt-1 break-words text-[11px] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{data.scopeNote}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}