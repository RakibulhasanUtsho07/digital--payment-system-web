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
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  FileSearch,
  Gauge,
  Hash,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  supportDashboardApi,
} from "@/lib/api/supportDashboardApi";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

/* =========================================================
   DISPUTE DOMAIN
   Uses the platform's real dispute field contract.
========================================================= */

type SupportDisputeStatus =
  | "disputed"
  | "under_review"
  | "won"
  | "lost";

interface SupportDisputeCase {
  disputeId: string;
  paymentId: string;
  customerId: string | null;
  customerName: string;
  customerAvatarUrl?: string;
  amount: string;
  currency: string;
  reason: string;
  description?: string | null;
  status: SupportDisputeStatus;
  merchantResponse?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SupportDisputeSummary {
  total: number;
  disputed: number;
  underReview: number;
  won: number;
  lost: number;
  disputedAmount: string;
}

interface SupportDisputeListResponse {
  disputes: SupportDisputeCase[];
  summary: SupportDisputeSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  filters?: {
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}

type SupportDisputeApi = {
  getDisputeCases: (query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SupportDisputeStatus;
    from?: string;
    to?: string;
  }) => Promise<SupportDisputeListResponse>;
};

/*
 * This narrow cast keeps the page isolated from unrelated support API types.
 * It expects supportDashboardApi to expose the support-authorized dispute
 * read endpoint. It intentionally does not use the merchant-only route.
 */
const disputeApi =
  supportDashboardApi as typeof supportDashboardApi &
    SupportDisputeApi;

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "all"
  | SupportDisputeStatus;

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

const STATUS_OPTIONS: Array<
  SelectOption<StatusFilter>
> = [
  {
    value: "all",
    label: "All statuses",
    description: "Every dispute outcome",
  },
  {
    value: "disputed",
    label: "Disputed",
    description: "New unresolved dispute",
  },
  {
    value: "under_review",
    label: "Under review",
    description: "Currently being reviewed",
  },
  {
    value: "won",
    label: "Won",
    description: "Resolved in merchant/platform favor",
  },
  {
    value: "lost",
    label: "Lost",
    description: "Resolved unfavorably",
  },
];

const HERO_PARTICLES = [
  {
    left: "7%",
    top: "22%",
    size: 4,
    delay: 0.2,
    duration: 7.6,
  },
  {
    left: "17%",
    top: "71%",
    size: 3,
    delay: 1.1,
    duration: 8.5,
  },
  {
    left: "30%",
    top: "17%",
    size: 5,
    delay: 0.7,
    duration: 9.8,
  },
  {
    left: "44%",
    top: "77%",
    size: 4,
    delay: 2.1,
    duration: 8.2,
  },
  {
    left: "59%",
    top: "27%",
    size: 3,
    delay: 1.5,
    duration: 7.4,
  },
  {
    left: "72%",
    top: "66%",
    size: 5,
    delay: 0.5,
    duration: 10.2,
  },
  {
    left: "85%",
    top: "24%",
    size: 3,
    delay: 2.4,
    duration: 8.7,
  },
  {
    left: "93%",
    top: "72%",
    size: 4,
    delay: 1.7,
    duration: 9.1,
  },
] as const;

const EMPTY_SUMMARY: SupportDisputeSummary = {
  total: 0,
  disputed: 0,
  underReview: 0,
  won: 0,
  lost: 0,
  disputedAmount: "0",
};

/* =========================================================
   HELPERS
========================================================= */

function messageOf(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

function humanize(
  value: string
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDateTime(
  value:
    | string
    | Date
    | null
    | undefined
): string {
  if (
    !value
  ) {
    return "Not available";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? "Not available"
    : date.toLocaleString();
}

function money(
  value: string,
  currency: string
): string {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return `${currency} ${value}`;
  }

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
      numeric
    );
  } catch {
    return `${currency} ${numeric.toLocaleString(
      "en-BD",
      {
        maximumFractionDigits:
          2,
      }
    )}`;
  }
}

function selectedLabel<
  T extends string,
>(
  options:
    Array<
      SelectOption<T>
    >,
  value: T
): string {
  return (
    options.find(
      (item) =>
        item.value ===
        value
    )?.label ??
    value
  );
}

function statusTone(
  status:
    SupportDisputeStatus
): string {
  if (
    status ===
    "won"
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    status ===
    "lost"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    status ===
    "under_review"
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
}

function statusIcon(
  status:
    SupportDisputeStatus
): LucideIcon {
  if (
    status ===
    "won"
  ) {
    return CheckCircle2;
  }

  if (
    status ===
    "lost"
  ) {
    return XCircle;
  }

  if (
    status ===
    "under_review"
  ) {
    return Clock3;
  }

  return AlertCircle;
}

function daysOld(
  value:
    | string
    | Date
): number {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (
        Date.now() -
        date.getTime()
      ) /
        86_400_000
    )
  );
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter:
      "blur(7px)",
  },

  show: {
    opacity: 1,
    y: 0,
    filter:
      "blur(0px)",
  },
};

const stagger = {
  hidden: {},

  show: {
    transition: {
      staggerChildren:
        0.055,
    },
  },
};

/* =========================================================
   CUSTOM SELECT
========================================================= */

function SupportSelect<
  T extends string,
>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options:
    Array<
      SelectOption<T>
    >;
  onChange:
    (
      value: T
    ) => void;
  icon: LucideIcon;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const selected =
    options.find(
      (item) =>
        item.value ===
        value
    ) ??
    options[0];

  useEffect(
    () => {
      function onPointerDown(
        event:
          PointerEvent
      ) {
        if (
          rootRef.current &&
          !rootRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );
        }
      }

      function onKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setOpen(
            false
          );
        }
      }

      document.addEventListener(
        "pointerdown",
        onPointerDown
      );

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          onPointerDown
        );

        document.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    []
  );

  return (
    <div
      ref={
        rootRef
      }
      className="relative"
    >
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left shadow-sm outline-none transition duration-200 dark:bg-slate-950/70 ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-emerald-100 hover:border-emerald-300 dark:border-white/10"
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
            {
              selected
                ?.label
            }
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
              {
                selected.description
              }
            </span>
          )}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          transition={{
            duration:
              0.2,
          }}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -6,
              scale:
                0.98,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
              scale:
                1,
            }}
            exit={{
              opacity:
                0,
              y:
                -5,
              scale:
                0.98,
            }}
            transition={{
              duration:
                0.16,
            }}
            role="listbox"
            className="support-dispute-scroll absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-emerald-100 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071b16]/95"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      active
                    }
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
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
                      <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        {
                          option.label
                        }
                      </span>

                      {option.description && (
                        <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
                          {
                            option.description
                          }
                        </span>
                      )}
                    </span>
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function metricTone(
  tone:
    MetricTone
): {
  shell: string;
  glow: string;
  bar: string;
} {
  if (
    tone ===
    "cyan"
  ) {
    return {
      shell:
        "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      glow:
        "bg-cyan-400/10",
      bar:
        "from-cyan-500 to-sky-400",
    };
  }

  if (
    tone ===
    "violet"
  ) {
    return {
      shell:
        "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      glow:
        "bg-violet-400/10",
      bar:
        "from-violet-500 to-fuchsia-400",
    };
  }

  if (
    tone ===
    "amber"
  ) {
    return {
      shell:
        "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      glow:
        "bg-amber-400/10",
      bar:
        "from-amber-500 to-orange-400",
    };
  }

  if (
    tone ===
    "rose"
  ) {
    return {
      shell:
        "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      glow:
        "bg-rose-400/10",
      bar:
        "from-rose-500 to-pink-400",
    };
  }

  return {
    shell:
      "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow:
      "bg-emerald-400/10",
    bar:
      "from-emerald-500 to-teal-400",
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
  description:
    string;
  icon: LucideIcon;
  tone:
    MetricTone;
}) {
  const styles =
    metricTone(
      tone
    );

  return (
    <motion.article
      variants={
        reveal
      }
      whileHover={{
        y: -4,
        scale:
          1.006,
      }}
      transition={{
        type:
          "spring",
        stiffness:
          280,
        damping:
          22,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-emerald-100/90 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(5,150,105,.48)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-words text-xl font-black leading-7 tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            {
              description
            }
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate:
              8,
            scale:
              1.08,
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <motion.div
          initial={{
            width:
              "24%",
          }}
          animate={{
            width: [
              "24%",
              "78%",
              "54%",
            ],
          }}
          transition={{
            duration:
              4.5,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
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
  description:
    string;
  icon: LucideIcon;
  action?: ReactNode;
  children:
    ReactNode;
}) {
  return (
    <motion.section
      variants={
        reveal
      }
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount:
          0.08,
      }}
      className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_60px_-45px_rgba(5,150,105,.42)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="flex flex-col gap-3 border-b border-emerald-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{
              rotate:
                8,
              scale:
                1.06,
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {
                description
              }
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

/* =========================================================
   COPY FIELD
========================================================= */

function CopyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value:
    | string
    | null;
  icon: LucideIcon;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false
    );

  const display =
    value ||
    "Not available";

  async function copyValue() {
    if (
      !value
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(
        true
      );

      window.setTimeout(
        () =>
          setCopied(
            false
          ),
        1300
      );
    } catch {
      setCopied(
        false
      );
    }
  }

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
    >
      <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
        <div className="min-w-0">
          <Icon className="h-4 w-4 text-emerald-600" />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-all text-xs font-black text-slate-800 dark:text-slate-100">
            {display}
          </p>
        </div>

        {value && (
          <button
            type="button"
            onClick={() =>
              void copyValue()
            }
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-700 dark:bg-white/5"
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
   SUPPORT-ONLY ACCESS
========================================================= */

function isAuthorizationError(
  error: unknown
): boolean {
  const maybeRecord =
    error &&
    typeof error === "object"
      ? (
          error as
            Record<
              string,
              unknown
            >
        )
      : null;

  const response =
    maybeRecord?.response &&
    typeof maybeRecord.response ===
      "object"
      ? (
          maybeRecord.response as
            Record<
              string,
              unknown
            >
        )
      : null;

  const status =
    Number(
      maybeRecord?.status ??
        maybeRecord?.statusCode ??
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
      ? error.message
          .toLowerCase()
      : String(
          error ?? ""
        ).toLowerCase();

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "forbidden"
    ) ||
    message.includes(
      "access denied"
    ) ||
    message.includes(
      "not authorized"
    )
  );
}

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
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
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
   OUTER ACCESS GATE
========================================================= */

export default function SupportDisputeCasesPage() {
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
    return (
      <SupportNotFoundState />
    );
  }

  return (
    <SupportDisputeCasesContent
      onUnauthorized={denyAccess}
    />
  );
}

/* =========================================================
   PAGE CONTENT
========================================================= */

function SupportDisputeCasesContent({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    from,
    setFrom,
  ] =
    useState(
      ""
    );

  const [
    to,
    setTo,
  ] =
    useState(
      ""
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    disputes,
    setDisputes,
  ] =
    useState<
      SupportDisputeCase[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<SupportDisputeSummary>(
      EMPTY_SUMMARY
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0
    );

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(
      1
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      SupportDisputeCase |
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

  useEffect(
    () => {
      let active =
        true;

      const timer =
        window.setTimeout(
          () => {
            void (
              async () => {
                if (
                  disputes.length ===
                  0
                ) {
                  setLoading(
                    true
                  );
                } else {
                  setRefreshing(
                    true
                  );
                }

                setError(
                  ""
                );

                try {
                  const result =
                    await disputeApi.getDisputeCases(
                      {
                        page,
                        limit:
                          20,
                        search:
                          search.trim() ||
                          undefined,
                        status:
                          status ===
                          "all"
                            ? undefined
                            : status,
                        from:
                          from ||
                          undefined,
                        to:
                          to ||
                          undefined,
                      }
                    );

                  if (
                    !active
                  ) {
                    return;
                  }

                  setDisputes(
                    Array.isArray(
                      result.disputes
                    )
                      ? result.disputes
                      : []
                  );

                  setSummary(
                    result.summary ??
                      EMPTY_SUMMARY
                  );

                  setTotal(
                    result.pagination
                      ?.total ??
                      0
                  );

                  setTotalPages(
                    Math.max(
                      1,
                      result.pagination
                        ?.totalPages ??
                        1
                    )
                  );
                } catch (
                  requestError:
                    unknown
                ) {
                  if (
                    active &&
                    isAuthorizationError(
                      requestError
                    )
                  ) {
                    onUnauthorized();
                    return;
                  }

                  if (
                    active
                  ) {
                    setError(
                      messageOf(
                        requestError
                      )
                    );
                  }
                } finally {
                  if (
                    active
                  ) {
                    setLoading(
                      false
                    );

                    setRefreshing(
                      false
                    );
                  }
                }
              }
            )();
          },
          250
        );

      return () => {
        active =
          false;

        window.clearTimeout(
          timer
        );
      };
    },
    [
      search,
      status,
      from,
      to,
      page,
      refreshKey,
      onUnauthorized,
    ]
  );

  useEffect(
    () => {
      if (
        !selected
      ) {
        return;
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      function onKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setSelected(
            null
          );
        }
      }

      window.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    [
      selected,
    ]
  );

  const activeFilterCount =
    useMemo(
      () =>
        [
          Boolean(
            search.trim()
          ),
          status !==
            "all",
          Boolean(
            from
          ),
          Boolean(
            to
          ),
        ].filter(
          Boolean
        ).length,
      [
        search,
        status,
        from,
        to,
      ]
    );

  const visibleOpen =
    useMemo(
      () =>
        disputes.filter(
          (
            item
          ) =>
            item.status ===
              "disputed" ||
            item.status ===
              "under_review"
        ).length,
      [
        disputes,
      ]
    );

  const visibleOlderThan7Days =
    useMemo(
      () =>
        disputes.filter(
          (
            item
          ) =>
            (
              item.status ===
                "disputed" ||
              item.status ===
                "under_review"
            ) &&
            daysOld(
              item.createdAt
            ) >=
              7
        ).length,
      [
        disputes,
      ]
    );

  function resetFilters() {
    setSearch(
      ""
    );

    setStatus(
      "all"
    );

    setFrom(
      ""
    );

    setTo(
      ""
    );

    setPage(
      1
    );

    setError(
      ""
    );
  }

  return (
    <main className="w-full min-w-0 space-y-5 overflow-x-clip pb-8 sm:space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity:
            0,
          y:
            14,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        transition={{
          duration:
            0.55,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_48%,#065F46_100%)] p-5 text-white shadow-[0_28px_80px_-42px_rgba(5,150,105,.58)] sm:p-6 md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [
              0,
              30,
              -12,
              0,
            ],
            y: [
              0,
              -16,
              11,
              0,
            ],
            scale: [
              1,
              1.12,
              0.96,
              1,
            ],
          }}
          transition={{
            duration:
              13,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-300/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [
              0,
              -22,
              16,
              0,
            ],
            y: [
              0,
              17,
              -9,
              0,
            ],
          }}
          transition={{
            duration:
              15,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[100px]"
        />

        <motion.div
          animate={{
            rotate: [
              0,
              4,
              -3,
              0,
            ],
            scale: [
              1,
              1.08,
              0.98,
              1,
            ],
          }}
          transition={{
            duration:
              18,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -left-[14%] top-[10%] h-[50%] w-[70%] rounded-[50%] bg-[linear-gradient(90deg,rgba(16,185,129,0),rgba(52,211,153,.12),rgba(34,211,238,.08),rgba(16,185,129,0))] blur-[55px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

        {HERO_PARTICLES.map(
          (
            particle,
            index
          ) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.78)]"
              style={{
                left:
                  particle.left,
                top:
                  particle.top,
                width:
                  particle.size,
                height:
                  particle.size,
              }}
              animate={{
                y: [
                  0,
                  -13,
                  5,
                  0,
                ],
                x: [
                  0,
                  6,
                  -4,
                  0,
                ],
                opacity: [
                  0.18,
                  0.8,
                  0.32,
                  0.18,
                ],
                scale: [
                  0.8,
                  1.25,
                  0.95,
                  0.8,
                ],
              }}
              transition={{
                duration:
                  particle.duration,
                delay:
                  particle.delay,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
            />
          )
        )}

        <motion.div
          animate={{
            x: [
              "-30%",
              "130%",
            ],
          }}
          transition={{
            duration:
              5.8,
            repeat:
              Infinity,
            repeatDelay:
              2.6,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-100 to-transparent shadow-[0_0_18px_rgba(209,250,229,.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100 backdrop-blur">
                <ShieldAlert className="h-3.5 w-3.5" />

                Dispute Cases
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />

                Read-only investigation
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Investigate payment disputes
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Search dispute and payment references, inspect customer context,
              disputed value, reasons, merchant response and resolution evidence
              without changing the dispute outcome.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <FileSearch className="h-3.5 w-3.5" />

                {
                  total.toLocaleString(
                    "en-BD"
                  )
                } cases
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Gauge className="h-3.5 w-3.5" />

                {
                  selectedLabel(
                    STATUS_OPTIONS,
                    status
                  )
                }
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Banknote className="h-3.5 w-3.5" />

                Open exposure visible
              </span>
            </div>
          </div>

          <div className="relative w-full shrink-0 sm:w-auto">
            <motion.div
              animate={{
                rotate:
                  360,
              }}
              transition={{
                duration:
                  19,
                repeat:
                  Infinity,
                ease:
                  "linear",
              }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-emerald-100/20 xl:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.9)]" />
            </motion.div>

            <button
              type="button"
              disabled={
                refreshing ||
                loading
              }
              onClick={() =>
                setRefreshKey(
                  (
                    value
                  ) =>
                    value +
                    1
                )
              }
              className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-900 shadow-[0_12px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing ||
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh disputes
            </button>
          </div>
        </div>

        {(refreshing ||
          loading) && (
          <motion.div
            initial={{
              scaleX:
                0,
            }}
            animate={{
              scaleX:
                1,
            }}
            transition={{
              duration:
                1.15,
              repeat:
                Infinity,
            }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
          />
        )}
      </motion.section>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity:
            0,
          y:
            12,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        transition={{
          delay:
            0.08,
          duration:
            0.45,
        }}
        className="relative z-30 rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
              Dispute investigation filters
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              Server-backed filters · {activeFilterCount} active
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            disabled={
              activeFilterCount ===
              0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />

            Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Search dispute
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035]">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="Dispute ID, payment ID, customer, reason"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch(
                      ""
                    );

                    setPage(
                      1
                    );
                  }}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-700"
                  aria-label="Clear dispute search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          <SupportSelect
            label="Status"
            value={
              status
            }
            options={
              STATUS_OPTIONS
            }
            onChange={(
              value
            ) => {
              setStatus(
                value
              );

              setPage(
                1
              );
            }}
            icon={
              Gauge
            }
          />

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              From
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/70">
              <CalendarDays className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                type="date"
                value={
                  from
                }
                max={
                  to ||
                  undefined
                }
                onChange={(
                  event
                ) => {
                  setFrom(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none dark:text-white"
              />
            </label>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              To
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/70">
              <CalendarDays className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                type="date"
                value={
                  to
                }
                min={
                  from ||
                  undefined
                }
                onChange={(
                  event
                ) => {
                  setTo(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none dark:text-white"
              />
            </label>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -8,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            exit={{
              opacity:
                0,
              y:
                -8,
            }}
            role="alert"
            className="flex items-start gap-3 rounded-[22px] border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-700 dark:text-rose-300"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black">
                Dispute lookup failed
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          METRICS
      ==================================================== */}

      <motion.section
        variants={
          stagger
        }
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <MetricCard
          label="Total disputes"
          value={
            summary.total.toLocaleString(
              "en-BD"
            )
          }
          description="All disputes in the current platform scope"
          icon={
            FileSearch
          }
          tone="emerald"
        />

        <MetricCard
          label="Disputed"
          value={
            summary.disputed.toLocaleString(
              "en-BD"
            )
          }
          description="New unresolved dispute cases"
          icon={
            AlertCircle
          }
          tone="violet"
        />

        <MetricCard
          label="Under review"
          value={
            summary.underReview.toLocaleString(
              "en-BD"
            )
          }
          description="Cases currently being reviewed"
          icon={
            Clock3
          }
          tone="amber"
        />

        <MetricCard
          label="Won / Lost"
          value={`${summary.won.toLocaleString(
            "en-BD"
          )} / ${summary.lost.toLocaleString(
            "en-BD"
          )}`}
          description="Resolved dispute outcomes"
          icon={
            BadgeCheck
          }
          tone="cyan"
        />

        <MetricCard
          label="Open exposure"
          value={
            money(
              summary.disputedAmount,
              disputes[0]?.currency ??
                "USD"
            )
          }
          description="Open disputed + under-review value"
          icon={
            Banknote
          }
          tone="rose"
        />
      </motion.section>

      {/* ===================================================
          OPERATIONAL SNAPSHOT
      ==================================================== */}

      <motion.section
        variants={
          reveal
        }
        initial="hidden"
        animate="show"
        className="grid gap-4 lg:grid-cols-2"
      >
        <div className="relative overflow-hidden rounded-[22px] border border-emerald-100 bg-white p-4 shadow-[0_16px_45px_-38px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <ShieldAlert className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Visible open cases
              </p>

              <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                {
                  visibleOpen.toLocaleString(
                    "en-BD"
                  )
                }
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                Derived only from the cases visible on this page.
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-amber-200 bg-amber-50/40 p-4 shadow-[0_16px_45px_-38px_rgba(245,158,11,.35)] dark:border-amber-500/15 dark:bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Clock3 className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Visible open cases ≥ 7 days
              </p>

              <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                {
                  visibleOlderThan7Days.toLocaleString(
                    "en-BD"
                  )
                }
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                A page-level aging signal; it does not change case priority or outcome.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          RESULTS
      ==================================================== */}

      <Panel
        title="Dispute Case Results"
        description="Real dispute-domain cases with payment, customer, amount, reason and outcome evidence."
        icon={
          ShieldAlert
        }
        action={
          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-300">
            {disputes.length} visible
          </span>
        }
      >
        {loading ? (
          <div className="grid min-h-[340px] place-items-center">
            <div className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <motion.div
                  animate={{
                    rotate:
                      360,
                  }}
                  transition={{
                    duration:
                      4,
                    repeat:
                      Infinity,
                    ease:
                      "linear",
                  }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                />

                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                Loading dispute cases
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reading dispute, payment and customer evidence...
              </p>
            </div>
          </div>
        ) : disputes.length ===
          0 ? (
          <div className="grid min-h-[340px] place-items-center rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Search className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                No dispute cases match
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Try another dispute/payment reference, customer, status or date window.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE */}

            <div className="grid gap-3 lg:hidden">
              {disputes.map(
                (
                  dispute,
                  index
                ) => {
                  const StatusIcon =
                    statusIcon(
                      dispute.status
                    );

                  return (
                    <motion.article
                      key={
                        dispute.disputeId
                      }
                      initial={{
                        opacity:
                          0,
                        y:
                          8,
                      }}
                      animate={{
                        opacity:
                          1,
                        y:
                          0,
                      }}
                      transition={{
                        delay:
                          Math.min(
                            index *
                              0.025,
                            0.18
                          ),
                      }}
                      className="rounded-[20px] border border-emerald-100 bg-emerald-50/20 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            <StatusIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-black leading-5 text-slate-950 dark:text-white">
                              {
                                dispute.disputeId
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                              Payment {
                                dispute.paymentId
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className={`max-w-full self-start whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black uppercase leading-4 tracking-wide min-[480px]:shrink-0 ${statusTone(
                            dispute.status
                          )}`}
                        >
                          {humanize(
                            dispute.status
                          )}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                          <p className="font-bold text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 break-words font-black leading-4 text-slate-700 dark:text-slate-200">
                            {money(
                              dispute.amount,
                              dispute.currency
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                          <p className="font-bold text-slate-400">
                            Age
                          </p>

                          <p className="mt-1 font-black text-slate-700 dark:text-slate-200">
                            {daysOld(
                              dispute.createdAt
                            )}d
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Reason
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                          {
                            dispute.reason
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelected(
                            dispute
                          )
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                      >
                        <Eye className="h-4 w-4" />

                        Open dispute
                      </button>
                    </motion.article>
                  );
                }
              )}
            </div>

            {/* DESKTOP */}

            <div className="support-dispute-scroll hidden overflow-x-auto overscroll-x-contain lg:block">
              <table className="w-full min-w-[1040px] text-left">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/60 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
                    <th className="px-4 py-3.5">
                      Dispute
                    </th>

                    <th className="px-4 py-3.5">
                      Status
                    </th>

                    <th className="px-4 py-3.5">
                      Amount
                    </th>

                    <th className="px-4 py-3.5">
                      Customer
                    </th>

                    <th className="px-4 py-3.5">
                      Reason
                    </th>

                    <th className="px-4 py-3.5">
                      Created
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Inspect
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {disputes.map(
                    (
                      dispute,
                      index
                    ) => {
                      const StatusIcon =
                        statusIcon(
                          dispute.status
                        );

                      return (
                        <motion.tr
                          key={
                            dispute.disputeId
                          }
                          initial={{
                            opacity:
                              0,
                            y:
                              4,
                          }}
                          animate={{
                            opacity:
                              1,
                            y:
                              0,
                          }}
                          transition={{
                            delay:
                              Math.min(
                                index *
                                  0.02,
                                0.16
                              ),
                          }}
                          className="border-b border-emerald-100/70 text-xs transition hover:bg-emerald-50/60 dark:border-white/5 dark:hover:bg-emerald-500/[0.04]"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                <StatusIcon className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate font-black text-slate-900 dark:text-white">
                                  {
                                    dispute.disputeId
                                  }
                                </p>

                                <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
                                  Payment {
                                    dispute.paymentId
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex max-w-[150px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black uppercase leading-4 tracking-wide ${statusTone(
                                dispute.status
                              )}`}
                            >
                              {humanize(
                                dispute.status
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-black text-slate-900 dark:text-white">
                              {money(
                                dispute.amount,
                                dispute.currency
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {daysOld(
                                dispute.createdAt
                              )}d old
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-[190px] truncate font-black text-slate-700 dark:text-slate-200">
                              {
                                dispute.customerName
                              }
                            </p>

                            <p className="mt-1 max-w-[190px] truncate text-[9px] text-slate-400">
                              {dispute.customerId ||
                                "No customer ID"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-[240px] truncate font-bold text-slate-700 dark:text-slate-200">
                              {
                                dispute.reason
                              }
                            </p>

                            <p className="mt-1 max-w-[240px] truncate text-[9px] text-slate-400">
                              {dispute.description ||
                                "No additional description"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-[10px] text-slate-500 dark:text-slate-400">
                            {formatDateTime(
                              dispute.createdAt
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <motion.button
                              type="button"
                              whileHover={{
                                y:
                                  -1,
                              }}
                              whileTap={{
                                scale:
                                  0.98,
                              }}
                              onClick={() =>
                                setSelected(
                                  dispute
                                )
                              }
                              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                            >
                              <Eye className="mr-1.5 inline h-3.5 w-3.5" />

                              Open
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Page{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {totalPages}
                </span>{" "}
                ·{" "}
                {total.toLocaleString(
                  "en-BD"
                )}{" "}
                matches
              </p>

              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button
                  type="button"
                  disabled={
                    page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value -
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Previous dispute page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value +
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Next dispute page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* ===================================================
          DETAIL DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            transition={{
              duration:
                0.18,
            }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-[3px]"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelected(
                  null
                );
              }
            }}
          >
            <motion.aside
              initial={{
                x:
                  "100%",
              }}
              animate={{
                x:
                  0,
              }}
              exit={{
                x:
                  "100%",
              }}
              transition={{
                type:
                  "spring",
                stiffness:
                  260,
                damping:
                  30,
              }}
              className="support-dispute-scroll absolute inset-y-0 right-0 w-full max-w-[760px] overflow-y-auto overscroll-contain border-l border-emerald-100 bg-white text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,.32)] dark:border-white/10 dark:bg-slate-950 dark:text-white 2xl:max-w-[820px]"
            >
              {/* DRAWER HEADER */}

              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_52%,#065F46_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{
                    x: [
                      0,
                      18,
                      -7,
                      0,
                    ],
                    y: [
                      0,
                      -9,
                      6,
                      0,
                    ],
                  }}
                  transition={{
                    duration:
                      12,
                    repeat:
                      Infinity,
                    ease:
                      "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100/70">
                      Dispute case evidence
                    </p>

                    <h2 className="mt-1 break-all text-xl font-black leading-7 text-white">
                      {
                        selected.disputeId
                      }
                    </h2>

                    <p className="mt-1 break-all text-[10px] leading-4 text-emerald-50/55">
                      Payment {
                        selected.paymentId
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        null
                      )
                    }
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20"
                    aria-label="Close dispute detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <motion.div
                variants={
                  stagger
                }
                initial="hidden"
                animate="show"
                className="space-y-5 p-4 pb-10 sm:p-6 sm:pb-12"
              >
                {/* SUMMARY */}

                <motion.section
                  variants={
                    reveal
                  }
                  className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/45 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span
                        className={`inline-flex max-w-full whitespace-normal rounded-full border px-3 py-1.5 text-left text-[9px] font-black uppercase leading-4 tracking-wide ${statusTone(
                          selected.status
                        )}`}
                      >
                        {humanize(
                          selected.status
                        )}
                      </span>

                      <p className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
                        {money(
                          selected.amount,
                          selected.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {daysOld(
                          selected.createdAt
                        )} days since dispute creation
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-right dark:border-white/10 dark:bg-white/5">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Currency
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">
                        {
                          selected.currency
                        }
                      </p>
                    </div>
                  </div>
                </motion.section>

                {/* REFERENCES */}

                <Panel
                  title="Case References"
                  description="Core dispute, payment and customer identifiers."
                  icon={
                    Hash
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CopyField
                      label="Dispute ID"
                      value={
                        selected.disputeId
                      }
                      icon={
                        ShieldAlert
                      }
                    />

                    <CopyField
                      label="Payment ID"
                      value={
                        selected.paymentId
                      }
                      icon={
                        Banknote
                      }
                    />

                    <CopyField
                      label="Customer ID"
                      value={
                        selected.customerId
                      }
                      icon={
                        UserRound
                      }
                    />

                    <CopyField
                      label="Customer name"
                      value={
                        selected.customerName
                      }
                      icon={
                        UserRound
                      }
                    />
                  </div>
                </Panel>

                {/* CUSTOMER */}

                <Panel
                  title="Customer Context"
                  description="Customer identity available on the dispute record."
                  icon={
                    UserRound
                  }
                >
                  <motion.div
                    whileHover={{
                      y:
                        -2,
                    }}
                    className="relative overflow-hidden rounded-[22px] border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />

                    <div className="relative flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                          {
                            selected.customerName
                          }
                        </p>

                        <p className="mt-1 break-all text-[10px] text-slate-500 dark:text-slate-400">
                          {selected.customerId ||
                            "Customer ID unavailable"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Panel>

                {/* REASON */}

                <Panel
                  title="Dispute Reason"
                  description="Reason and description recorded on the dispute case."
                  icon={
                    FileSearch
                  }
                >
                  <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      Reason
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                      {
                        selected.reason
                      }
                    </p>

                    <p className="mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs leading-6 text-slate-600 dark:text-slate-300">
                      {selected.description ||
                        "No additional dispute description is recorded."}
                    </p>
                  </div>
                </Panel>

                {/* MERCHANT RESPONSE */}

                <Panel
                  title="Merchant Response"
                  description="Response evidence supplied by the merchant, when present."
                  icon={
                    Sparkles
                  }
                >
                  <div className="rounded-[20px] border border-violet-500/15 bg-violet-500/[0.05] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                      Merchant statement
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs leading-6 text-slate-600 dark:text-slate-300">
                      {selected.merchantResponse ||
                        "No merchant response is recorded yet."}
                    </p>
                  </div>
                </Panel>

                {/* RESOLUTION */}

                <Panel
                  title="Resolution Evidence"
                  description="Final resolution note and timestamp when the dispute is closed."
                  icon={
                    BadgeCheck
                  }
                >
                  <div
                    className={`rounded-[20px] border p-4 ${
                      selected.status ===
                      "won"
                        ? "border-emerald-500/15 bg-emerald-500/[0.05]"
                        : selected.status ===
                            "lost"
                          ? "border-rose-500/15 bg-rose-500/[0.05]"
                          : "border-amber-500/15 bg-amber-500/[0.05]"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Resolution note
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs leading-6 text-slate-700 dark:text-slate-200">
                      {selected.resolutionNote ||
                        "This dispute does not have a final resolution note yet."}
                    </p>

                    <p className="mt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Resolved:{" "}
                      {formatDateTime(
                        selected.resolvedAt
                      )}
                    </p>
                  </div>
                </Panel>

                {/* TIMELINE */}

                <Panel
                  title="Dispute Timeline"
                  description="Creation, resolution and most recent update timestamps."
                  icon={
                    Clock3
                  }
                >
                  <div className="relative space-y-3 pl-7">
                    <div className="absolute bottom-2 left-[9px] top-2 w-px bg-emerald-100 dark:bg-white/10" />

                    {[
                      [
                        "Dispute created",
                        selected.createdAt,
                      ],
                      [
                        "Resolved",
                        selected.resolvedAt,
                      ],
                      [
                        "Last updated",
                        selected.updatedAt,
                      ],
                    ].map(
                      (
                        [
                          label,
                          value,
                        ],
                        index
                      ) => (
                        <motion.div
                          key={
                            String(
                              label
                            )
                          }
                          initial={{
                            opacity:
                              0,
                            x:
                              8,
                          }}
                          animate={{
                            opacity:
                              1,
                            x:
                              0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.05,
                          }}
                          className="relative rounded-2xl border border-emerald-100 bg-emerald-50/25 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"
                        >
                          <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)] dark:border-slate-950" />

                          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                            {
                              String(
                                label
                              )
                            }
                          </p>

                          <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800 dark:text-slate-100">
                            {formatDateTime(
                              value as
                                | string
                                | Date
                                | null
                            )}
                          </p>
                        </motion.div>
                      )
                    )}
                  </div>
                </Panel>

                {/* READ ONLY */}

                <motion.section
                  variants={
                    reveal
                  }
                  className="rounded-[22px] border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                        Support dispute boundary
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                        This page is for investigation and support context only.
                        It does not create disputes, submit evidence, change the
                        dispute status, declare an outcome, or move funds.
                      </p>
                    </div>
                  </div>
                </motion.section>
              </motion.div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          SCROLLBAR
      ==================================================== */}

      <style jsx global>{`
        .support-dispute-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(16, 185, 129, 0.42)
            transparent;
        }

        .support-dispute-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-dispute-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-dispute-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            rgba(16, 185, 129, 0.36);
          background-clip:
            padding-box;
        }

        .support-dispute-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(5, 150, 105, 0.54);
          background-clip:
            padding-box;
        }
      `}</style>
    </main>
  );
}
