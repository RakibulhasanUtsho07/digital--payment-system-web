"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  useRouter,
} from "next/navigation";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DatabaseZap,
  Gauge,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  ShieldAlert,
  TimerReset,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
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
  getAnalystLivePulse,
  type AnalystLivePulseData,
  type AnalystMode,
  type AnalystPulseAlert,
  type AnalystPulseScore,
  type AnalystPulseStatus,
} from "@/lib/api/analystApi";

const ANALYST = {
  navy: "#10243A",
  tealDeep: "#0B4F52",
  navySoft: "#10273A",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  violet: "#8B5CF6",
};

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
   OPTIONS
========================================================= */

const MODE_OPTIONS: Array<{
  value: AnalystMode;
  label: string;
}> = [
  {
    value: "all",
    label: "All modes",
  },
  {
    value: "live",
    label: "Live only",
  },
  {
    value: "test",
    label: "Test only",
  },
];

/* =========================================================
   FORMATTERS
========================================================= */

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-BD"
  ).format(value);
}

function formatMoney(
  minor: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      minor / 100
    );
  } catch {
    return `${currency} ${(
      minor / 100
    ).toLocaleString(
      "en-BD",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }
}

function formatCompactMoney(
  minor: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }
    ).format(
      minor / 100
    );
  } catch {
    return formatMoney(
      minor,
      currency
    );
  }
}

function formatDateTime(
  value: string
): string {
  const date =
    new Date(value);

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
      dateStyle: "medium",
      timeStyle: "medium",
    }
  ).format(date);
}

function formatBucket(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}

function humanize(
  value: string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/* =========================================================
   PRESENTATION HELPERS
========================================================= */

const STATUS_STYLES: Record<
  AnalystPulseStatus,
  string
> = {
  healthy:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  attention:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical:
    "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
};

const SCORE_BAR_STYLES: Record<
  AnalystPulseStatus,
  string
> = {
  healthy:
    "bg-emerald-500",
  attention:
    "bg-amber-500",
  critical:
    "bg-red-500",
};

function StatusBadge({
  status,
}: {
  status: AnalystPulseStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${STATUS_STYLES[status]}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>

      {status}
    </span>
  );
}

function ChangeLabel({
  value,
  suffix = "%",
}: {
  value: number | null;
  suffix?: string;
}) {
  if (value === null) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">
        No previous baseline
      </span>
    );
  }

  const positive =
    value > 0;

  const neutral =
    value === 0;

  const Icon =
    positive
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
        neutral
          ? "text-muted-foreground"
          : positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
      }`}
    >
      {!neutral && (
        <Icon className="h-3.5 w-3.5" />
      )}

      {Math.abs(value).toFixed(2)}
      {suffix}

      <span className="font-medium text-muted-foreground">
        vs prior hour
      </span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  children,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={reveal}
      whileHover={{
        y: -4,
        scale: 1.008,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.48)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 9,
            scale: 1.08,
          }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/50 shadow-sm ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      {children && (
        <div className="relative mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
          {children}
        </div>
      )}
    </motion.div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />

      <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{
              rotate: 8,
              scale: 1.06,
            }}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 dark:text-teal-300"
          >
            <Activity className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />

      <p className="mt-3 text-sm font-bold text-foreground">
        No real activity recorded
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function ScoreCard({
  score,
}: {
  score: AnalystPulseScore;
}) {
  const TrendIcon =
    score.trend === "up"
      ? ArrowUpRight
      : score.trend === "down"
        ? ArrowDownRight
        : Activity;

  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.01,
      }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-black/10"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/55 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold text-foreground">
            {score.label}
          </p>

          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {score.status}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TrendIcon className="h-4 w-4 text-muted-foreground" />

          <span className="text-2xl font-black text-foreground">
            {score.score}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{
            width: 0,
          }}
          whileInView={{
            width:
              `${score.score}%`,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.75,
            ease: "easeOut",
          }}
          className={`h-full rounded-full ${SCORE_BAR_STYLES[score.status]}`}
        />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        {score.basis}
      </p>
    </motion.div>
  );
}

function AlertCard({
  alert,
}: {
  alert: AnalystPulseAlert;
}) {
  const styles = {
    critical:
      "border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400",
    warning:
      "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    info:
      "border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    positive:
      "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  }[alert.severity];

  const Icon =
    alert.severity === "positive"
      ? CheckCircle2
      : alert.severity === "critical"
        ? XCircle
        : alert.severity === "warning"
          ? AlertTriangle
          : Activity;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      whileHover={{
        y: -3,
      }}
      className={`relative overflow-hidden rounded-[20px] border p-4 shadow-sm ${styles}`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/45 to-transparent" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-current/10">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-extrabold text-foreground">
              {alert.title}
            </p>

            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
              {alert.severity}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {alert.description}
          </p>

          <p className="mt-3 text-[11px] font-extrabold text-foreground/80">
            {alert.metric}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystLivePulsePage() {
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

  const [mode, setMode] =
    useState<AnalystMode>(
      "all"
    );

  const [currency, setCurrency] =
    useState("BDT");

  const [currencyDraft, setCurrencyDraft] =
    useState("BDT");

  const [data, setData] =
    useState<AnalystLivePulseData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    if (
      !isAnalystRole ||
      !autoRefresh
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setRefreshKey(
            (current) =>
              current + 1
          );
        },
        20_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    autoRefresh,
    isAnalystRole,
  ]);

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      setRefreshing(false);
      setData(null);
      setError("");

      return;
    }

    const controller =
      new AbortController();

    let active = true;

    const load = async () => {
      setRefreshing(true);
      setError("");

      try {
        const result =
          await getAnalystLivePulse(
            {
              mode,
              currency,
            },
            controller.signal
          );

        if (active) {
          setData(result);
        }
      } catch (
        loadError: unknown
      ) {
        if (
          active &&
          !controller.signal.aborted
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the live platform pulse."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    isAnalystRole,
    mode,
    currency,
    refreshKey,
  ]);

  const chartData =
    useMemo(
      () =>
        data?.timeline.map(
          (point) => ({
            ...point,
            label:
              formatBucket(
                point.bucket
              ),
            volumeMajor:
              point.volumeMinor /
              100,
          })
        ) ?? [],
      [data]
    );

  const hasTimelineActivity =
    chartData.some(
      (point) =>
        point.attemptCount > 0
    );

  const applyCurrency = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAnalystRole) {
      return;
    }

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
        "Currency must be a three-letter ISO code."
      );

      return;
    }

    setCurrency(
      normalized
    );
  };

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
            Live Platform Pulse is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-6 text-white shadow-[0_30px_90px_-45px_rgba(13,148,136,0.65)] md:p-7 lg:p-8"
        >
          <motion.div
            animate={{
              x: [0, 34, -12, 0],
              y: [0, -16, 12, 0],
              scale: [1, 1.12, 0.96, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-[90px]"
          />

          <motion.div
            animate={{
              x: [0, -24, 18, 0],
              y: [0, 18, -10, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-teal-300/15 blur-[100px]"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

          <motion.div
            animate={{
              x: ["-30%", "130%"],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.9)]"
          />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100 backdrop-blur-md">
                  <Activity className="h-3.5 w-3.5" />
                  Analyst Command Center
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Analyst only
                </div>

                {data && (
                  <StatusBadge
                    status={data.status}
                  />
                )}
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
                Live Platform Pulse
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                A read-only operational snapshot generated from current MongoDB payment,
                wallet transaction, and payout records with live analyst-grade monitoring.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                  {data
                    ? `Updated ${formatDateTime(data.generatedAt)}`
                    : "Waiting for first snapshot"}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                  <TimerReset className="h-3.5 w-3.5 text-teal-300" />
                  {autoRefresh
                    ? `Auto refresh · ${data?.refreshAfterSeconds ?? 20}s`
                    : "Auto refresh paused"}
                </span>
              </div>
            </div>

            <div className="relative flex shrink-0 flex-wrap items-center gap-2">
              <div className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-300/10 blur-3xl" />

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-cyan-200/20 lg:block"
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              </motion.div>

              <button
                type="button"
                onClick={() => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setAutoRefresh(
                    (current) =>
                      !current
                  );
                }}
                className={`relative inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-xs font-black shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 ${
                  autoRefresh
                    ? "border-emerald-200/20 bg-emerald-300/[0.10] text-emerald-100"
                    : "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                }`}
              >
                {autoRefresh ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}

                {autoRefresh
                  ? "Auto-refresh on"
                  : "Auto-refresh off"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setRefreshKey(
                    (current) =>
                      current + 1
                  );
                }}
                disabled={refreshing}
                className="relative inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing"
                  : "Refresh now"}
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mode}
                onChange={(event) => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setMode(
                    event.target.value as AnalystMode
                  );
                }}
                aria-label="Payment mode"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.08] px-3 text-xs font-black text-white outline-none backdrop-blur transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
              >
                {MODE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#10243A] text-white"
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <form
                onSubmit={applyCurrency}
                className="flex items-center gap-2"
              >
                <input
                  value={currencyDraft}
                  onChange={(event) =>
                    setCurrencyDraft(
                      event.target.value
                        .replace(
                          /[^a-zA-Z]/g,
                          ""
                        )
                        .slice(
                          0,
                          3
                        )
                        .toUpperCase()
                    )
                  }
                  aria-label="Currency"
                  maxLength={3}
                  className="h-10 w-24 rounded-xl border border-white/10 bg-white/[0.08] px-3 text-center text-xs font-black uppercase text-white outline-none placeholder:text-slate-300 backdrop-blur transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
                />

                <button
                  type="submit"
                  className="h-10 rounded-xl border border-cyan-200/15 bg-cyan-300/[0.10] px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[0.15]"
                >
                  Apply
                </button>
              </form>
            </div>

            <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-slate-200/70">
              <DatabaseZap className="h-3.5 w-3.5 text-teal-300" />
              Source: MongoDB live collections
            </span>
          </div>

          {refreshing && (
            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
              }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            />
          )}
        </motion.section>

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex items-start gap-3 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] p-4 text-red-600 shadow-sm dark:text-red-400"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                Live pulse request failed
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {error}
              </p>
            </div>
          </motion.div>
        )}

        {loading && !data ? (
          <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <div className="text-center">
              <div className="relative mx-auto h-20 w-20">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border border-dashed border-teal-500/35"
                />

                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-2 rounded-full border border-cyan-500/30"
                />

                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                  }}
                  className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-lg shadow-teal-500/20"
                >
                  <Activity className="h-6 w-6" />
                </motion.div>
              </div>

              <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
                Reading live platform activity
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Aggregating current MongoDB records...
              </p>
            </div>
          </div>
        ) : data ? (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Attempts · 5 min"
                value={formatNumber(
                  data.windows.last5Minutes.attemptCount
                )}
                description={`${formatNumber(data.windows.last5Minutes.completedCount)} completed · ${formatNumber(data.windows.last5Minutes.failedCount)} failed`}
                icon={Activity}
                iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              />

              <MetricCard
                label="Success · 15 min"
                value={`${data.windows.last15Minutes.successRate.toFixed(2)}%`}
                description={`${formatNumber(data.windows.last15Minutes.pendingCount)} payments currently in progress`}
                icon={CheckCircle2}
                iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />

              <MetricCard
                label="Completed volume · 60 min"
                value={formatCompactMoney(
                  data.windows.last60Minutes.volumeMinor,
                  data.filters.currency
                )}
                description={`${formatNumber(data.windows.last60Minutes.completedCount)} completed gateway payments`}
                icon={CircleDollarSign}
                iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                <ChangeLabel
                  value={data.comparison.volumeChangePercent}
                />
              </MetricCard>

              <MetricCard
                label="Wallet transactions · 60 min"
                value={formatNumber(
                  data.transactions.last60Minutes.count
                )}
                description={`${formatNumber(data.transactions.last60Minutes.failedCount)} failed · encrypted amounts remain private`}
                icon={WalletCards}
                iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              />

              <MetricCard
                label="Payment failure rate"
                value={`${data.windows.last60Minutes.failureRate.toFixed(2)}%`}
                description={`${formatNumber(data.windows.last60Minutes.failedCount)} failed during the current hour`}
                icon={XCircle}
                iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
              />

              <MetricCard
                label="High-risk wallet activity"
                value={formatNumber(
                  data.transactions.last60Minutes.highRiskCount
                )}
                description={`${data.transactions.last60Minutes.highRiskRate.toFixed(2)}% of wallet transactions in the last hour`}
                icon={ShieldAlert}
                iconClass="bg-orange-500/10 text-orange-600 dark:text-orange-400"
              />

              <MetricCard
                label="Stale payment queue"
                value={formatNumber(
                  data.queues.stalePaymentCount
                )}
                description="Pending, authorized, or captured for more than 15 minutes"
                icon={TimerReset}
                iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />

              <MetricCard
                label="Payout queue"
                value={
                  data.payouts.included
                    ? formatNumber(
                        data.payouts.pendingCount +
                          data.payouts.processingCount
                      )
                    : "Excluded"
                }
                description={
                  data.payouts.included
                    ? `${formatMoney(data.payouts.pendingAmountMinor + data.payouts.processingAmountMinor, data.filters.currency)} waiting or processing`
                    : "Payouts are not included in test-only mode"
                }
                icon={Banknote}
                iconClass="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
              />
            </motion.div>

            <div className="grid gap-6 2xl:grid-cols-[1.55fr_1fr]">
              <Panel
                title="Gateway traffic · last 60 minutes"
                description="Five-minute buckets from real payment records; completed volume excludes failed payments."
                action={
                  <ChangeLabel
                    value={data.comparison.attemptChangePercent}
                  />
                }
              >
                {hasTimelineActivity ? (
                  <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#0A2028] via-[#0A2A2D] to-[#0A1B26] p-3 shadow-inner">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                    <div className="relative h-[330px] w-full">
                      <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <ComposedChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 8,
                          bottom: 0,
                          left: -18,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="currentColor"
                          className="text-border"
                        />

                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={22}
                        />

                        <YAxis
                          yAxisId="count"
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          yAxisId="volume"
                          orientation="right"
                          tick={{
                            fontSize: 10,
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            new Intl.NumberFormat(
                              "en-BD",
                              {
                                notation: "compact",
                              }
                            ).format(value)
                          }
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            border:
                              "1px solid hsl(var(--border))",
                            background:
                              "hsl(var(--card))",
                            fontSize: 12,
                          }}
                          formatter={(
                            value: unknown,
                            name: unknown
                          ) => {
                            const numeric =
                              Number(value) || 0;

                            return name ===
                              "Completed volume"
                              ? [
                                  formatMoney(
                                    numeric * 100,
                                    data.filters.currency
                                  ),
                                  String(name),
                                ]
                              : [
                                  formatNumber(
                                    numeric
                                  ),
                                  String(name),
                                ];
                          }}
                        />

                        <Bar
                          yAxisId="count"
                          dataKey="failedCount"
                          name="Failed"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={18}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="attemptCount"
                          name="Attempts"
                          stroke="#22C7D6"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 5,
                          }}
                        />

                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="completedCount"
                          name="Completed"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                        />

                        <Area
                          yAxisId="volume"
                          type="monotone"
                          dataKey="volumeMajor"
                          name="Completed volume"
                          stroke="#38BDF8"
                          fill="#38BDF8"
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                      </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No gateway payment attempt exists in the selected currency and mode during the last 60 minutes." />
                )}
              </Panel>

              <Panel
                title="Deterministic platform scores"
                description="Transparent operational scores from stored facts; these values are not AI predictions."
                action={
                  <StatusBadge
                    status={data.status}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  {data.scores.map(
                    (score) => (
                      <ScoreCard
                        key={score.key}
                        score={score}
                      />
                    )
                  )}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel
                title="Payment provider health"
                description="Attempt, completion, failure, and completed volume by provider for the last hour."
              >
                {data.providers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="border-b border-border px-3 py-3">
                            Provider
                          </th>
                          <th className="border-b border-border px-3 py-3 text-right">
                            Attempts
                          </th>
                          <th className="border-b border-border px-3 py-3 text-right">
                            Failed
                          </th>
                          <th className="border-b border-border px-3 py-3 text-right">
                            Success
                          </th>
                          <th className="border-b border-border px-3 py-3 text-right">
                            Volume
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.providers.map(
                          (provider) => (
                            <tr
                              key={provider.provider}
                              className="text-xs transition hover:bg-teal-500/[0.04]"
                            >
                              <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${SCORE_BAR_STYLES[provider.status]}`}
                                  />

                                  <span className="font-extrabold text-foreground">
                                    {humanize(
                                      provider.provider
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-foreground">
                                {formatNumber(
                                  provider.attemptCount
                                )}
                              </td>

                              <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-red-600 dark:text-red-400">
                                {formatNumber(
                                  provider.failedCount
                                )}
                              </td>

                              <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-foreground">
                                {provider.successRate.toFixed(2)}%
                              </td>

                              <td className="border-b border-slate-200/70 dark:border-white/10 px-3 py-3.5 text-right font-bold text-foreground">
                                {formatCompactMoney(
                                  provider.volumeMinor,
                                  data.filters.currency
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No provider activity was recorded for this filter during the last 60 minutes." />
                )}
              </Panel>

              <Panel
                title="Failure reason distribution"
                description="Only failed gateway payments from the current 60-minute window are included."
              >
                {data.failureReasons.length > 0 ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                    <div className="h-[260px]">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={data.failureReasons}
                          margin={{
                            top: 12,
                            right: 8,
                            left: -22,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="failureArea"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="rgba(148,163,184,0.14)"
                          />

                          <XAxis
                            dataKey="code"
                            tickFormatter={(value: unknown) =>
                              humanize(
                                String(value)
                              )
                            }
                            tick={{
                              fontSize: 9,
                            }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={16}
                          />

                          <YAxis
                            allowDecimals={false}
                            tick={{
                              fontSize: 10,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip
                            labelFormatter={(label: unknown) =>
                              humanize(
                                String(label)
                              )
                            }
                            formatter={(value: unknown) => [
                              formatNumber(
                                Number(value) || 0
                              ),
                              "Failures",
                            ]}
                            contentStyle={{
                              borderRadius: 14,
                              border:
                                "1px solid hsl(var(--border))",
                              background:
                                "hsl(var(--card))",
                              fontSize: 12,
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#ef4444"
                            strokeWidth={3}
                            fill="url(#failureArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {data.failureReasons.map(
                        (reason) => (
                          <div
                            key={reason.code}
                            className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-black/10"
                          >
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="truncate font-bold text-foreground">
                                {humanize(
                                  reason.code
                                )}
                              </span>

                              <span className="shrink-0 font-black text-red-600 dark:text-red-400">
                                {formatNumber(
                                  reason.count
                                )}
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{
                                  width:
                                    `${Math.min(100, reason.percentage)}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
                              {reason.percentage.toFixed(2)}% of failures
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No failed gateway payments were recorded during the current hour." />
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
              <Panel
                title="Environment traffic"
                description="Gateway request distribution for the selected currency during the last 60 minutes."
              >
                {data.modeTraffic.length > 0 ? (
                  <div className="space-y-5">
                    {data.modeTraffic.map(
                      (item) => (
                        <div key={item.mode}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  item.mode === "live"
                                    ? "bg-emerald-500"
                                    : "bg-cyan-500"
                                }`}
                              />

                              <span className="font-extrabold text-foreground">
                                {humanize(
                                  item.mode
                                )}
                              </span>
                            </div>

                            <span className="font-bold text-muted-foreground">
                              {formatNumber(
                                item.count
                              )} · {item.percentage.toFixed(2)}%
                            </span>
                          </div>

                          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                item.mode === "live"
                                  ? "bg-emerald-500"
                                  : "bg-cyan-500"
                              }`}
                              style={{
                                width:
                                  `${Math.min(100, item.percentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}

                    <div className="rounded-xl border border-border bg-muted/20 p-3 text-[11px] leading-5 text-muted-foreground">
                      {data.scopeNote}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No test or live gateway request was recorded during this pulse window." />
                )}
              </Panel>

              <Panel
                title="Operational alerts"
                description="Rule-based thresholds highlight conditions for analyst review without changing platform data."
                action={
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" />
                    {data.calculationEngine.version}
                  </span>
                }
              >
                <div className="space-y-3">
                  {data.alerts.map(
                    (alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                      />
                    )
                  )}
                </div>
              </Panel>
            </div>

            <motion.section
              initial={{
                opacity: 0,
                y: 12,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              className="relative overflow-hidden rounded-[24px] border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.07] via-cyan-500/[0.04] to-transparent p-5 shadow-[0_18px_55px_-42px_rgba(15,118,110,0.50)]"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-[70px]" />

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    <CreditCard className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                      Read-only analyst boundary
                    </p>

                    <p className="mt-1 max-w-4xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      This page reads aggregated operational facts only. It cannot create payments,
                      change wallets, process payouts, approve verification, or reveal merchant secrets.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
                  Source: MongoDB live collections
                </span>
              </div>
            </motion.section>
          </>
        ) : null}
      </div>
    </div>
  );
}
