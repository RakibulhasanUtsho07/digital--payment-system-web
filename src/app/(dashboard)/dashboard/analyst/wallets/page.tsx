"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BrainCircuit,
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
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const RANGE_OPTIONS: Array<{
  value:
    AnalystRange;

  label:
    string;
}> = [
  {
    value:
      "24h",

    label:
      "Last 24 hours",
  },

  {
    value:
      "7d",

    label:
      "Last 7 days",
  },

  {
    value:
      "30d",

    label:
      "Last 30 days",
  },

  {
    value:
      "90d",

    label:
      "Last 90 days",
  },
];

/* =========================================================
   OPAL GLOW THEME
   A lighter, luminous palette that avoids deep navy.
========================================================= */

const OPAL_GLOW = {
  ink: "#33415C",
  primary: "#6D7CFF",
  primaryStrong: "#5566F2",
  mint: "#55E6C1",
  rose: "#FF8BCB",
  sky: "#8AD8FF",
  canvas: "#F8FAFF",
} as const;

const chartTooltipStyle = {
  borderRadius: 16,
  border: "1px solid rgba(109, 124, 255, 0.18)",
  background: "rgba(255, 255, 255, 0.96)",
  boxShadow: "0 18px 50px rgba(91, 108, 220, 0.16)",
  fontSize: 12,
};

/* =========================================================
   FORMAT
========================================================= */

function formatNumber(
  value:
    number
) {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(
    value
  );
}

function formatPercent(
  value:
    number
) {
  return `${value.toFixed(
    1
  )}%`;
}

function formatMoney(
  minor:
    number,
  currency:
    string
) {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      }
    ).format(
      minor /
        100
    );
  } catch {
    return `${currency} ${(
      minor /
      100
    ).toLocaleString(
      "en-BD"
    )}`;
  }
}

function formatDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function formatBucket(
  value:
    string,
  range:
    AnalystRange
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  if (
    range ===
    "24h"
  ) {
    return new Intl.DateTimeFormat(
      "en-BD",
      {
        hour:
          "numeric",

        hour12:
          true,
      }
    ).format(
      date
    );
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      month:
        "short",

      day:
        "numeric",
    }
  ).format(
    date
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
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[28px] border border-[#6D7CFF]/10 bg-white/[0.82] shadow-[0_20px_65px_-40px_rgba(85,102,242,0.55)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_24px_75px_-38px_rgba(85,102,242,0.7)] dark:border-white/10 dark:bg-slate-950/[0.72]"
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#6D7CFF]/70 to-transparent" />
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#FF8BCB]/10 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />

      <div className="relative flex flex-col gap-3 border-b border-[#6D7CFF]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#33415C] dark:text-slate-100">
            {title}
          </h2>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        {action}
      </div>

      <div className="relative p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   CHANGE
========================================================= */

function ChangeBadge({
  metric,
}: {
  metric:
    AnalystMetric;
}) {
  if (
    metric.changePercent ===
    null
  ) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        New vs previous period
      </span>
    );
  }

  const positive =
    metric.changePercent >=
    0;

  const Icon =
    positive
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {Math.abs(
        metric.changePercent
      ).toFixed(
        2
      )}
      %

      <span className="font-medium text-muted-foreground">
        vs previous
      </span>
    </span>
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
  value: string;
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
      className="group relative overflow-hidden rounded-[24px] border border-[#6D7CFF]/10 bg-white/[0.86] p-5 shadow-[0_18px_55px_-38px_rgba(85,102,242,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.75]"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#6D7CFF]/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#55E6C1]/70 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-[#33415C] dark:text-slate-50">
            {value}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_12px_28px_-16px_currentColor] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 border-t border-[#6D7CFF]/10 pt-3">
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
  value: string;
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
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[24px] border border-[#6D7CFF]/10 bg-white/[0.86] p-5 shadow-[0_18px_50px_-38px_rgba(85,102,242,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.75]"
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#55E6C1]/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />

      <div className="relative flex justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-[#33415C] dark:text-slate-50">
            {value}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
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
   EMPTY
========================================================= */

function EmptyData({ text }: { text: string }) {
  return (
    <div className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[#6D7CFF]/20 bg-gradient-to-br from-[#6D7CFF]/[0.035] via-white/60 to-[#55E6C1]/[0.05] px-6 text-center dark:via-slate-950/50">
      <div className="absolute h-24 w-24 rounded-full bg-[#FF8BCB]/10 blur-3xl" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6D7CFF]/10 text-[#5B68E8]">
        <DatabaseZap className="h-6 w-6" />
      </div>

      <p className="relative mt-3 text-sm font-extrabold text-[#33415C] dark:text-slate-100">
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

function InsightCard({ insight }: { insight: AnalystWalletInsight }) {
  const style = {
    critical:
      "border-red-500/25 bg-red-500/[0.055] text-red-600 dark:text-red-400",
    high:
      "border-orange-500/25 bg-orange-500/[0.055] text-orange-600 dark:text-orange-400",
    medium:
      "border-amber-500/25 bg-amber-500/[0.055] text-amber-600 dark:text-amber-400",
    info:
      "border-[#6D7CFF]/20 bg-[#6D7CFF]/[0.055] text-[#5B68E8] dark:text-[#AEB7FF]",
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
      whileHover={{ y: -3 }}
      className={`group relative overflow-hidden rounded-[22px] border p-4 transition-shadow hover:shadow-[0_18px_50px_-36px_rgba(85,102,242,0.7)] ${style}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-current/5 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#33415C] dark:text-slate-100">
              {insight.title}
            </p>

            <span className="rounded-full border border-current/20 bg-white/50 px-2 py-0.5 text-[9px] font-black uppercase backdrop-blur dark:bg-slate-950/30">
              {insight.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {insight.description}
          </p>

          <div className="mt-3 rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur dark:border-white/5 dark:bg-slate-950/[0.35]">
            <p className="text-[11px] font-bold text-[#33415C] dark:text-slate-200">
              Evidence
            </p>

            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
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
  const [
    range,
    setRange,
  ] =
    useState<AnalystRange>(
      "30d"
    );

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "BDT"
    );

  const [
    currencyDraft,
    setCurrencyDraft,
  ] =
    useState(
      "BDT"
    );

  const [
    data,
    setData,
  ] =
    useState<
      AnalystWalletAnalyticsData |
      null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(
      0
    );

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      let active =
        true;

      const load =
        async () => {
          setRefreshing(
            true
          );

          setError(
            ""
          );

          try {
            const result =
              await getAnalystWalletAnalytics(
                {
                  range,

                  currency,
                },

                controller.signal
              );

            if (
              !active ||
              controller.signal.aborted
            ) {
              return;
            }

            setData(
              result
            );
          } catch (
            loadError:
              unknown
          ) {
            if (
              !active ||
              controller.signal.aborted ||
              isApiAbortError(
                loadError
              )
            ) {
              return;
            }

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load wallet analytics."
            );
          } finally {
            if (
              active &&
              !controller.signal.aborted
            ) {
              setLoading(
                false
              );

              setRefreshing(
                false
              );
            }
          }
        };

      void load();

      return () => {
        active =
          false;

        if (
          !controller.signal.aborted
        ) {
          controller.abort();
        }
      };
    },
    [
      range,
      currency,
      refreshKey,
    ]
  );

  /* =======================================================
     CURRENCY
  ======================================================= */

  const applyCurrency =
    (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      const normalized =
        currencyDraft
          .trim()
          .toUpperCase();

      if (
        !/^[A-Z]{3}$/.test(
          normalized
        )
      ) {
        setError(
          "Currency must be a valid three-letter code."
        );

        return;
      }

      setCurrency(
        normalized
      );
    };

  /* =======================================================
     CHART
  ======================================================= */

  const trendData =
    useMemo(
      () =>
        data?.trend.map(
          (
            item
          ) => ({
            name:
              formatBucket(
                item.bucket,
                data.filters.range
              ),

            engaged:
              item.engagedWallets,

            newWallets:
              item.newWallets,

            p2p:
              item.p2pTransferCount,

            merchant:
              item.merchantPaymentCount,

            funding:
              item.fundingCount,
          })
        ) ??
        [],
      [
        data,
      ]
    );

  const usageData =
    useMemo(
      () =>
        data?.usageMix ??
        [],
      [
        data,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="relative isolate space-y-5">
        <div className="h-44 animate-pulse rounded-[30px] border border-[#6D7CFF]/10 bg-gradient-to-r from-[#6D7CFF]/10 via-[#FF8BCB]/10 to-[#55E6C1]/10" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length:
              8,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-40 animate-pulse rounded-[24px] border border-[#6D7CFF]/10 bg-white/70 shadow-sm dark:bg-slate-950/60"
              />
            )
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    !data &&
    error
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-[28px] border border-red-500/20 bg-white/[0.85] p-8 text-center shadow-[0_20px_70px_-42px_rgba(239,68,68,0.55)] backdrop-blur-xl dark:bg-slate-950/[0.75]">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-black">
            Wallet analytics unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (
                  value
                ) =>
                  value +
                  1
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6D7CFF] to-[#FF8BCB] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(109,124,255,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-14px_rgba(109,124,255,0.9)]"
          >
            <RotateCcw className="h-4 w-4" />

            Try again
          </button>
        </div>
      </div>
    );
  }

  if (
    !data
  ) {
    return null;
  }

  const statusClass =
    data.status ===
    "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
      : data.status ===
          "attention"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="relative isolate space-y-6 overflow-hidden rounded-[34px] p-1 pb-10"
      style={{
        background:
          "radial-gradient(circle at 8% 2%, rgba(109,124,255,0.10), transparent 25%), radial-gradient(circle at 92% 8%, rgba(255,139,203,0.09), transparent 22%), radial-gradient(circle at 78% 78%, rgba(85,230,193,0.08), transparent 24%)",
      }}
    >
      <div className="pointer-events-none absolute left-[9%] top-16 -z-10 h-40 w-40 rounded-full bg-[#6D7CFF]/10 blur-[80px] motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute right-[6%] top-72 -z-10 h-44 w-44 rounded-full bg-[#FF8BCB]/10 blur-[90px] motion-safe:animate-pulse" />

      {/* HEADER */}

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[30px] border border-[#6D7CFF]/[0.15] bg-white/[0.82] p-6 shadow-[0_28px_90px_-52px_rgba(85,102,242,0.68)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-slate-950/[0.76]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(109,124,255,0.055),transparent_36%,rgba(255,139,203,0.05)_68%,rgba(85,230,193,0.06))]" />
        <motion.div
          aria-hidden
          animate={{ x: [0, 22, 0], y: [0, -14, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#6D7CFF]/[0.18] blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -18, 0], y: [0, 16, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-24 left-[28%] h-56 w-56 rounded-full bg-[#FF8BCB]/[0.14] blur-3xl"
        />
        <div className="pointer-events-none absolute bottom-0 right-[18%] h-40 w-40 rounded-full bg-[#55E6C1]/[0.12] blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur ${statusClass}`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-35" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                </span>
                Network {data.status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-[#6D7CFF]/[0.15] bg-[#6D7CFF]/[0.075] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#5B68E8] shadow-sm backdrop-blur dark:text-[#B6BEFF]">
                <Sparkles className="h-3.5 w-3.5" />
                Opal Glow workspace
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-[#55E6C1]/20 bg-[#55E6C1]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#188E75] dark:text-[#82F3D6]">
                <WalletCards className="h-3.5 w-3.5" />
                Coffer Wallet Network
              </span>
            </div>

            <h1 className="mt-4 bg-gradient-to-r from-[#33415C] via-[#6D7CFF] to-[#2FBF9D] bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-4xl">
              Wallet Analytics
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Analyze wallet adoption, engagement, P2P usage, funding activity and
              Coffer Wallet merchant-payment behavior with a softer, luminous
              operations view.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#6D7CFF]/10 bg-white/[0.55] p-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.45]">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Period
              </span>

              <select
                value={range}
                onChange={(event) => setRange(event.target.value as AnalystRange)}
                className="h-11 rounded-xl border border-[#6D7CFF]/[0.15] bg-white/80 px-3 text-xs font-bold text-[#33415C] outline-none transition focus:border-[#6D7CFF]/50 focus:ring-4 focus:ring-[#6D7CFF]/10 dark:bg-slate-950/70 dark:text-slate-100"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <form onSubmit={applyCurrency}>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Currency
              </span>

              <div className="flex overflow-hidden rounded-xl shadow-sm ring-1 ring-[#6D7CFF]/[0.15] focus-within:ring-4 focus-within:ring-[#6D7CFF]/10">
                <input
                  value={currencyDraft}
                  onChange={(event) =>
                    setCurrencyDraft(
                      event.target.value
                        .replace(/[^a-z]/gi, "")
                        .slice(0, 3)
                        .toUpperCase()
                    )
                  }
                  aria-label="Currency code"
                  className="h-11 w-20 border-0 bg-white/[0.85] px-3 text-center text-xs font-black text-[#33415C] outline-none dark:bg-slate-950/70 dark:text-slate-100"
                />

                <button
                  type="submit"
                  className="h-11 border-l border-[#6D7CFF]/10 bg-[#6D7CFF]/[0.075] px-3 text-[10px] font-black uppercase text-[#5B68E8] transition hover:bg-[#6D7CFF]/[0.15] dark:text-[#B6BEFF]"
                >
                  Apply
                </button>
              </div>
            </form>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => setRefreshKey((value) => value + 1)}
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6D7CFF] to-[#FF8BCB] px-4 text-xs font-black text-white shadow-[0_14px_32px_-16px_rgba(109,124,255,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-16px_rgba(109,124,255,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 transition-transform group-hover:rotate-45 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2 border-t border-[#6D7CFF]/10 pt-4 text-[11px] text-slate-500 dark:text-slate-400">
          {[`Updated ${formatDate(data.generatedAt)}`, data.filters.currency, "Personal wallets only", "Live merchant payments"].map(
            (item) => (
              <span
                key={item}
                className="rounded-full border border-[#6D7CFF]/10 bg-white/[0.55] px-3 py-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/[0.35]"
              >
                {item}
              </span>
            )
          )}
        </div>
      </motion.section>

      {/* POPULATION */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total wallets"
          value={formatNumber(
            data.population
              .totalWallets
          )}
          description="Personal Coffer wallets"
          icon={
            WalletCards
          }
          iconClass="bg-[#6D7CFF]/10 text-[#5B68E8] dark:text-[#AEB7FF]"
        />

        <SummaryCard
          title="Active status"
          value={formatNumber(
            data.population
              .activeStatusWallets
          )}
          description={`${formatPercent(
            data.population
              .activeStatusRate
          )} of wallets`}
          icon={
            BadgeCheck
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <SummaryCard
          title="Dormant this period"
          value={formatNumber(
            data.population
              .dormantWallets
          )}
          description={`${formatPercent(
            data.population
              .dormantWalletRate
          )} had no activity`}
          icon={
            Activity
          }
          iconClass="bg-amber-500/10 text-amber-600"
        />

        <SummaryCard
          title="Locked wallets"
          value={formatNumber(
            data.population
              .lockedWallets
          )}
          description={`${data.population.frozenWallets} frozen · ${data.population.blockedWallets} blocked`}
          icon={
            LockKeyhole
          }
          iconClass="bg-red-500/10 text-red-600"
        />
      </section>

      {/* METRICS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Engaged wallets"
          value={formatNumber(
            data.metrics
              .engagedWallets
              .value
          )}
          metric={
            data.metrics
              .engagedWallets
          }
          icon={
            UserRoundCheck
          }
          iconClass="bg-[#6D7CFF]/10 text-[#5B68E8] dark:text-[#AEB7FF]"
        />

        <MetricCard
          label="New wallets"
          value={formatNumber(
            data.metrics
              .newWallets
              .value
          )}
          metric={
            data.metrics
              .newWallets
          }
          icon={
            WalletCards
          }
          iconClass="bg-[#55E6C1]/[0.14] text-[#188E75] dark:text-[#82F3D6]"
        />

        <MetricCard
          label="Merchant-paying"
          value={formatNumber(
            data.metrics
              .merchantPayingWallets
              .value
          )}
          metric={
            data.metrics
              .merchantPayingWallets
          }
          icon={
            CreditCard
          }
          iconClass="bg-[#FF8BCB]/[0.12] text-[#D85AA8] dark:text-[#FFA7D8]"
        />

        <MetricCard
          label="P2P wallets"
          value={formatNumber(
            data.metrics
              .p2pWallets
              .value
          )}
          metric={
            data.metrics
              .p2pWallets
          }
          icon={
            UsersRound
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <MetricCard
          label="Repeat engaged"
          value={formatNumber(
            data.metrics
              .repeatEngagedWallets
              .value
          )}
          metric={
            data.metrics
              .repeatEngagedWallets
          }
          icon={
            Repeat2
          }
          iconClass="bg-[#8AD8FF]/[0.15] text-[#397FAB] dark:text-[#A9E5FF]"
        />

        <MetricCard
          label="Wallet events"
          value={formatNumber(
            data.metrics
              .walletActivityEvents
              .value
          )}
          metric={
            data.metrics
              .walletActivityEvents
          }
          icon={
            TrendingUp
          }
          iconClass="bg-[#55E6C1]/[0.14] text-[#188E75] dark:text-[#82F3D6]"
        />

        <MetricCard
          label="Merchant payments"
          value={formatNumber(
            data.metrics
              .merchantPaymentCount
              .value
          )}
          metric={
            data.metrics
              .merchantPaymentCount
          }
          icon={
            CreditCard
          }
          iconClass="bg-[#FF8BCB]/[0.12] text-[#D85AA8] dark:text-[#FFA7D8]"
        />

        <MetricCard
          label="P2P transfers"
          value={formatNumber(
            data.metrics
              .p2pTransferCount
              .value
          )}
          metric={
            data.metrics
              .p2pTransferCount
          }
          icon={
            Activity
          }
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
      </section>

      {/* TREND */}

      <Panel
        title="Wallet network activity"
        description="Engaged wallets, P2P transfers, merchant payments and new wallet creation."
      >
        {trendData.length >
        0 ? (
          <div className="h-[360px] rounded-2xl bg-gradient-to-b from-[#6D7CFF]/[0.025] to-transparent p-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={
                  trendData
                }
              >
                <defs>
                  <linearGradient
                    id="walletEngagementGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={OPAL_GLOW.primary}
                      stopOpacity={
                        0.3
                      }
                    />

                    <stop
                      offset="95%"
                      stopColor={OPAL_GLOW.primary}
                      stopOpacity={
                        0.02
                      }
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={
                    false
                  }
                  opacity={
                    0.08
                  }
                />

                <XAxis
                  dataKey="name"
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  minTickGap={
                    24
                  }
                  tick={{ fill: "#7A849A", fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  tick={{ fill: "#7A849A", fontSize: 11 }}
                />

                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "rgba(109,124,255,0.14)" }} />

                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />

                <Area
                  type="monotone"
                  dataKey="engaged"
                  name="Engaged wallets"
                  stroke={OPAL_GLOW.primary}
                  strokeWidth={
                    2.5
                  }
                  fill="url(#walletEngagementGradient)"
                />

                <Line
                  type="monotone"
                  dataKey="merchant"
                  name="Merchant payments"
                  stroke={OPAL_GLOW.rose}
                  strokeWidth={
                    2
                  }
                  dot={
                    false
                  }
                />

                <Line
                  type="monotone"
                  dataKey="p2p"
                  name="P2P transfers"
                  stroke={OPAL_GLOW.mint}
                  strokeWidth={
                    2
                  }
                  dot={
                    false
                  }
                />

                <Line
                  type="monotone"
                  dataKey="newWallets"
                  name="New wallets"
                  stroke={OPAL_GLOW.sky}
                  strokeWidth={
                    2
                  }
                  dot={
                    false
                  }
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyData
            text="Wallet activity will appear after real platform activity exists."
          />
        )}
      </Panel>

      {/* FUNNEL + USAGE */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Wallet engagement funnel"
          description="From provisioned wallets to wallets actively paying Coffer merchants."
        >
          <div className="space-y-5">
            {data.funnel.map(
              (
                item
              ) => (
                <div
                  key={
                    item.key
                  }
                >
                  <div className="mb-2 flex justify-between gap-4">
                    <span className="text-xs font-bold">
                      {item.label}
                    </span>

                    <span className="text-xs font-black text-muted-foreground">
                      {formatNumber(
                        item.value
                      )}{" "}
                      ·{" "}
                      {formatPercent(
                        item.percentage
                      )}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6D7CFF] via-[#FF8BCB] to-[#55E6C1] shadow-[0_0_18px_rgba(109,124,255,0.24)] transition-all duration-700"
                      style={{
                        width:
                          `${Math.min(
                            item.percentage,
                            100
                          )}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </Panel>

        <Panel
          title="Wallet usage mix"
          description="Completed wallet activity by use case. This is count-based, not transaction-volume based."
        >
          {usageData.some(
            (
              item
            ) =>
              item.count >
              0
          ) ? (
            <div className="h-[280px] rounded-2xl bg-gradient-to-b from-[#FF8BCB]/[0.025] to-transparent p-1">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    usageData
                  }
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={
                      false
                    }
                    opacity={
                      0.08
                    }
                  />

                  <XAxis
                    type="number"
                    allowDecimals={
                      false
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={
                      120
                    }
                  />

                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(109,124,255,0.05)" }} />

                  <Bar
                    dataKey="count"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                  >
                    {usageData.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={
                            item.key
                          }
                          fill={
                            [
                              OPAL_GLOW.primary,
                              OPAL_GLOW.rose,
                              OPAL_GLOW.mint,
                              OPAL_GLOW.sky,
                            ][
                              index %
                                4
                            ]
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyData
              text="No completed wallet usage event exists for this period."
            />
          )}
        </Panel>
      </div>

      {/* ENGAGEMENT */}

      <Panel
        title="Wallet engagement"
        description="Adoption and repeat-usage indicators for the Coffer wallet ecosystem."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label:
                "Wallet engagement",

              value:
                data.engagement
                  .walletEngagementRate,
            },

            {
              label:
                "Merchant adoption",

              value:
                data.engagement
                  .merchantPaymentAdoptionRate,
            },

            {
              label:
                "P2P adoption",

              value:
                data.engagement
                  .p2pAdoptionRate,
            },

            {
              label:
                "Repeat activity",

              value:
                data.engagement
                  .repeatActivityRate,
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-[#6D7CFF]/10 bg-gradient-to-br from-white/90 to-[#6D7CFF]/[0.035] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6D7CFF]/20 dark:from-slate-950/80 dark:to-[#6D7CFF]/[0.04]"
              >
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-3 text-2xl font-black">
                  {formatPercent(
                    item.value
                  )}
                </p>
              </div>
            )
          )}

          <div className="rounded-2xl border border-[#6D7CFF]/10 bg-gradient-to-br from-white/90 to-[#6D7CFF]/[0.035] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6D7CFF]/20 dark:from-slate-950/80 dark:to-[#6D7CFF]/[0.04]">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              Events / engaged
            </p>

            <p className="mt-3 text-2xl font-black">
              {
                data.engagement
                  .transactionsPerEngagedWallet
              }
            </p>
          </div>
        </div>
      </Panel>

      {/* LIQUIDITY */}

      <Panel
        title="Wallet balance snapshot"
        description="Current wallet balances aggregated directly from the wallet collection for the selected currency."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total balance"
            value={formatMoney(
              data.liquidity
                .totalBalanceMinor,
              data.filters
                .currency
            )}
            description="Current aggregate wallet balance"
            icon={
              Banknote
            }
            iconClass="bg-emerald-500/10 text-emerald-600"
          />

          <SummaryCard
            title="Pending balance"
            value={formatMoney(
              data.liquidity
                .totalPendingBalanceMinor,
              data.filters
                .currency
            )}
            description="Aggregate pending wallet balance"
            icon={
              Activity
            }
            iconClass="bg-amber-500/10 text-amber-600"
          />

          <SummaryCard
            title="Average wallet balance"
            value={formatMoney(
              data.liquidity
                .averageBalanceMinor,
              data.filters
                .currency
            )}
            description="Average across matching wallets"
            icon={
              WalletCards
            }
            iconClass="bg-[#6D7CFF]/10 text-[#5B68E8] dark:text-[#AEB7FF]"
          />
        </div>
      </Panel>

      {/* STATUS */}

      <Panel
        title="Wallet status distribution"
        description="Current operational wallet state."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {data.walletStatuses.map(
            (
              item
            ) => {
              const className =
                item.status ===
                "ACTIVE"
                  ? "text-emerald-600 bg-emerald-500/10"
                  : item.status ===
                      "FROZEN"
                    ? "text-amber-600 bg-amber-500/10"
                    : "text-red-600 bg-red-500/10";

              return (
                <div
                  key={
                    item.status
                  }
                  className="rounded-2xl border border-[#6D7CFF]/10 bg-gradient-to-br from-white/90 to-[#6D7CFF]/[0.035] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6D7CFF]/20 dark:from-slate-950/80 dark:to-[#6D7CFF]/[0.04]"
                >
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${className}`}
                  >
                    {item.status}
                  </span>

                  <p className="mt-4 text-2xl font-black">
                    {formatNumber(
                      item.count
                    )}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPercent(
                      item.percentage
                    )}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </Panel>

      {/* INSIGHTS */}

      <Panel
        title="Wallet intelligence"
        description="Deterministic signals derived from real Coffer wallet activity."
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#6D7CFF]/[0.15] bg-[#6D7CFF]/[0.075] px-3 py-1.5 text-[10px] font-black text-[#5B68E8] shadow-sm dark:text-[#B6BEFF]">
            <BrainCircuit className="h-3.5 w-3.5" />

            Rules-based
          </span>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {data.insights.map(
            (
              insight
            ) => (
              <InsightCard
                key={
                  insight.id
                }
                insight={
                  insight
                }
              />
            )
          )}
        </div>
      </Panel>

      {/* PRIVACY */}

      <div className="relative overflow-hidden rounded-[24px] border border-[#6D7CFF]/10 bg-white/[0.78] p-5 shadow-[0_18px_55px_-40px_rgba(85,102,242,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#5B68E8]" />

          <div>
            <p className="text-xs font-extrabold text-[#33415C] dark:text-slate-100">
              Privacy-safe wallet analytics
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {data.privacy.note}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {data.scopeNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}