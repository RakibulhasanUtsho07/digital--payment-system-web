"use client";

import {
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
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  Gauge,
  IdCard,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportKycCase,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportDashboardApi";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "All"
  | TicketStatus;

type PriorityFilter =
  | "All"
  | TicketPriority;

type SelectOption<
  T extends string,
> = {
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

const PAGE_SIZE = 12;

const STATUS_OPTIONS: Array<
  SelectOption<StatusFilter>
> = [
  {
    value: "All",
    label: "All ticket states",
    description:
      "Every KYC support case",
  },
  {
    value: "Open",
    label: "Open",
    description:
      "New KYC support cases",
  },
  {
    value:
      "Waiting for Customer",
    label:
      "Waiting for Customer",
    description:
      "Customer response needed",
  },
  {
    value: "In Progress",
    label: "In Progress",
    description:
      "Actively under support review",
  },
  {
    value: "Escalated",
    label: "Escalated",
    description:
      "Needs higher-level review",
  },
  {
    value: "Resolved",
    label: "Resolved",
    description:
      "Support case completed",
  },
];

const PRIORITY_OPTIONS: Array<
  SelectOption<PriorityFilter>
> = [
  {
    value: "All",
    label: "All priorities",
    description:
      "Every urgency level",
  },
  {
    value: "Urgent",
    label: "Urgent",
    description:
      "Immediate attention",
  },
  {
    value: "High",
    label: "High",
    description:
      "High customer impact",
  },
  {
    value: "Normal",
    label: "Normal",
    description:
      "Standard priority",
  },
  {
    value: "Low",
    label: "Low",
    description:
      "Lower urgency",
  },
];

const HERO_PARTICLES = [
  {
    left: "7%",
    top: "21%",
    size: 4,
    delay: 0.2,
    duration: 7.4,
  },
  {
    left: "17%",
    top: "72%",
    size: 3,
    delay: 1.1,
    duration: 8.8,
  },
  {
    left: "31%",
    top: "17%",
    size: 5,
    delay: 0.7,
    duration: 9.6,
  },
  {
    left: "46%",
    top: "77%",
    size: 4,
    delay: 2.1,
    duration: 7.9,
  },
  {
    left: "60%",
    top: "27%",
    size: 3,
    delay: 1.5,
    duration: 8.4,
  },
  {
    left: "73%",
    top: "69%",
    size: 5,
    delay: 0.5,
    duration: 10.1,
  },
  {
    left: "85%",
    top: "22%",
    size: 3,
    delay: 2.4,
    duration: 7.2,
  },
  {
    left: "92%",
    top: "74%",
    size: 4,
    delay: 1.4,
    duration: 9.3,
  },
] as const;

/* =========================================================
   AUTHORIZATION ERROR HELPER
========================================================= */

function isAuthorizationError(
  error: unknown
): boolean {
  const record =
    error &&
    typeof error === "object"
      ? (
          error as Record<
            string,
            unknown
          >
        )
      : null;

  const response =
    record?.response &&
    typeof record.response ===
      "object"
      ? (
          record.response as
            Record<
              string,
              unknown
            >
        )
      : null;

  const status = Number(
    record?.status ??
      record?.statusCode ??
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

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? "Not available"
    : date.toLocaleString();
}

function humanize(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function priorityTone(
  priority: TicketPriority
): string {
  if (
    priority === "Urgent"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    priority === "High"
  ) {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }

  if (
    priority === "Low"
  ) {
    return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  }

  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
}

function statusTone(
  status: TicketStatus
): string {
  if (
    status === "Resolved"
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    status === "Escalated"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    status ===
    "Waiting for Customer"
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (
    status === "In Progress"
  ) {
    return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }

  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
}

function kycTone(
  value:
    | string
    | null
    | undefined
): string {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "verified"
    ) &&
    !normalized.includes(
      "unverified"
    )
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    normalized.includes(
      "reject"
    ) ||
    normalized.includes(
      "fail"
    )
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    normalized.includes(
      "pending"
    ) ||
    normalized.includes(
      "review"
    )
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
}

function slaText(
  item: SupportKycCase
): string {
  if (
    item.sla.breached
  ) {
    return `${Math.abs(
      item.sla.minutesRemaining
    )}m breached`;
  }

  return `${Math.max(
    0,
    item.sla.minutesRemaining
  )}m remaining`;
}

function waitingText(
  value:
    SupportKycCase["waitingOn"]
): string {
  if (
    value === "customer"
  ) {
    return "Customer";
  }

  if (
    value === "admin"
  ) {
    return "Support";
  }

  return "Nobody";
}

function metricTone(
  tone: MetricTone
): {
  shell: string;
  glow: string;
  bar: string;
} {
  if (
    tone === "cyan"
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
    tone === "violet"
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
    tone === "amber"
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
    tone === "rose"
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
   ACCESS STATES
========================================================= */

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
            <IdCard className="h-6 w-6" />
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
   SELECT
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
    (value: T) =>
      void;
  icon: LucideIcon;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const selected =
    options.find(
      (item) =>
        item.value === value
    ) ?? options[0];

  return (
    <div className="relative">
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left shadow-sm outline-none transition dark:bg-slate-950/70 ${
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
            {selected?.label}
          </span>

          {selected?.description ? (
            <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
              {
                selected.description
              }
            </span>
          ) : null}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Close select"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() =>
                setOpen(false)
              }
            />

            <motion.div
              initial={{
                opacity: 0,
                y: -6,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -5,
                scale: 0.98,
              }}
              role="listbox"
              className="support-kyc-scroll absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-emerald-100 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071b16]/95"
            >
              {options.map(
                (option) => {
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
                        <span className="block text-xs font-extrabold text-slate-900 dark:text-white">
                          {option.label}
                        </span>

                        {option.description ? (
                          <span className="mt-0.5 block text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                            {
                              option.description
                            }
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                }
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

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
  const styles =
    metricTone(tone);

  return (
    <motion.article
      variants={reveal}
      whileHover={{
        y: -4,
        scale: 1.006,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
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
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <motion.div
          initial={{
            width: "20%",
          }}
          animate={{
            width: [
              "20%",
              "74%",
              "48%",
            ],
          }}
          transition={{
            duration: 4.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
        />
      </div>
    </motion.article>
  );
}

/* =========================================================
   SMALL INFO BLOCK
========================================================= */

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 dark:border-white/10 dark:bg-white/[0.025]">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <div className="mt-1.5 flex min-w-0 items-start gap-2">
        {Icon ? (
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : null}

        <p className="min-w-0 break-words [overflow-wrap:anywhere] text-[10px] font-black leading-4 text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   OUTER ACCESS GATE

   IMPORTANT:
   - No localStorage role trust.
   - user comes from DashboardSessionContext.
   - That context is populated by the parent dashboard layout
     after /users/profile succeeds.
   - The support-dashboard parent layout also independently
     verifies /users/profile and only renders support users.
========================================================= */

export default function SupportKycPage() {
  const {
    user,
  } =
    useDashboardSession();

  const [
    accessDenied,
    setAccessDenied,
  ] =
    useState(false);

  const denyAccess =
    useCallback(() => {
      setAccessDenied(true);
    }, []);

  if (
    accessDenied ||
    user.role !==
      "support"
  ) {
    return (
      <SupportNotFoundState />
    );
  }

  return (
    <SupportKycContent
      onUnauthorized={
        denyAccess
      }
    />
  );
}

/* =========================================================
   PAGE CONTENT
========================================================= */

function SupportKycContent({
  onUnauthorized,
}: {
  onUnauthorized: () =>
    void;
}) {
  const [
    cases,
    setCases,
  ] =
    useState<
      SupportKycCase[]
    >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "All"
    );

  const [
    priority,
    setPriority,
  ] =
    useState<PriorityFilter>(
      "All"
    );

  const [
    kycStatus,
    setKycStatus,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    selected,
    setSelected,
  ] =
    useState<
      SupportKycCase |
        null
    >(null);

  const loadCases =
    useCallback(
      async (
        fullLoader:
          boolean
      ) => {
        if (
          fullLoader
        ) {
          setLoading(true);
        } else {
          setRefreshing(
            true
          );
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getKycCases(
              {
                search:
                  search.trim() ||
                  undefined,
                status,
                priority,
                kycStatus:
                  kycStatus.trim() ||
                  undefined,
                page,
                limit:
                  PAGE_SIZE,
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load KYC support cases."
            );
          }

          setCases(
            response.cases ??
              []
          );

          setTotal(
            response.total ?? 0
          );

          setTotalPages(
            Math.max(
              1,
              response.totalPages ??
                1
            )
          );
        } catch (
          requestError:
            unknown
        ) {
          if (
            isAuthorizationError(
              requestError
            )
          ) {
            onUnauthorized();
            return;
          }

          setError(
            messageOf(
              requestError
            )
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [
        search,
        status,
        priority,
        kycStatus,
        page,
        onUnauthorized,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadCases(
            cases.length ===
              0
          );
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loadCases,
    refreshKey,
  ]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function onKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSelected(null);
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
  }, [
    selected,
  ]);

  const activeFilterCount =
    useMemo(
      () =>
        [
          Boolean(
            search.trim()
          ),
          status !== "All",
          priority !== "All",
          Boolean(
            kycStatus.trim()
          ),
        ].filter(
          Boolean
        ).length,
      [
        search,
        status,
        priority,
        kycStatus,
      ]
    );

  const visibleUrgent =
    useMemo(
      () =>
        cases.filter(
          (item) =>
            item.priority ===
            "Urgent"
        ).length,
      [cases]
    );

  const visibleBreached =
    useMemo(
      () =>
        cases.filter(
          (item) =>
            item.sla.breached
        ).length,
      [cases]
    );

  const visibleVerified =
    useMemo(
      () =>
        cases.filter(
          (item) => {
            const value =
              item.customer
                .kycStatus
                .toLowerCase();

            return (
              value.includes(
                "verified"
              ) &&
              !value.includes(
                "unverified"
              )
            );
          }
        ).length,
      [cases]
    );

  const visibleLinked =
    useMemo(
      () =>
        cases.filter(
          (item) =>
            item.customer
              .walletLinked
        ).length,
      [cases]
    );

  const kycSuggestions =
    useMemo(
      () =>
        Array.from(
          new Set(
            cases
              .map(
                (item) =>
                  item.customer
                    .kycStatus
              )
              .filter(Boolean)
          )
        ),
      [cases]
    );

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setKycStatus("");
    setPage(1);
    setError("");
  }

  return (
    <main className="w-full min-w-0 space-y-5 overflow-x-clip pb-8 sm:space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

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
            duration: 13,
            repeat: Infinity,
            ease: "easeInOut",
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
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[100px]"
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

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100 backdrop-blur">
                <IdCard className="h-3.5 w-3.5" />
                Support KYC
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Read-only verification support
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              KYC support cases
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Review customer verification-related support cases, KYC status,
              ticket state, SLA exposure and account context from the existing
              support workflow. This workspace does not directly approve or
              reject KYC verification.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <FileCheck2 className="h-3.5 w-3.5" />
                {total.toLocaleString(
                  "en-BD"
                )}{" "}
                KYC cases
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Gauge className="h-3.5 w-3.5" />
                {visibleBreached} visible SLA breaches
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Support investigation only
              </span>
            </div>
          </div>

          <div className="relative w-full shrink-0 sm:w-auto">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 19,
                repeat: Infinity,
                ease: "linear",
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
                  (value) =>
                    value + 1
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

              Refresh KYC cases
            </button>
          </div>
        </div>

        {(refreshing ||
          loading) ? (
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
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
          />
        ) : null}
      </motion.section>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
          duration: 0.45,
        }}
        className="relative z-30 rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
              KYC case filters
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              Search and narrow the support KYC queue · {activeFilterCount} active filters
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

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.55fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Search KYC case
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035]">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={search}
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setPage(1);
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="Ticket, customer, email or reference"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>
          </div>

          <SupportSelect
            label="Ticket status"
            value={status}
            options={
              STATUS_OPTIONS
            }
            onChange={(
              value
            ) => {
              setStatus(value);
              setPage(1);
            }}
            icon={
              CheckCircle2
            }
          />

          <SupportSelect
            label="Priority"
            value={priority}
            options={
              PRIORITY_OPTIONS
            }
            onChange={(
              value
            ) => {
              setPriority(value);
              setPage(1);
            }}
            icon={Gauge}
          />

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              KYC status
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3.5 shadow-sm transition focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/70">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                list="support-kyc-status-options"
                value={kycStatus}
                onChange={(
                  event
                ) => {
                  setKycStatus(
                    event.target
                      .value
                  );

                  setPage(1);
                }}
                placeholder="Any KYC state"
                className="min-w-0 flex-1 bg-transparent text-xs font-black text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />

              {kycStatus ? (
                <button
                  type="button"
                  onClick={() => {
                    setKycStatus("");
                    setPage(1);
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-700"
                  aria-label="Clear KYC status"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>

            <datalist id="support-kyc-status-options">
              {kycSuggestions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  />
                )
              )}
            </datalist>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          METRICS
      ==================================================== */}

      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <MetricCard
          label="Total KYC cases"
          value={total.toLocaleString(
            "en-BD"
          )}
          description="Matches current filters"
          icon={FileCheck2}
          tone="emerald"
        />

        <MetricCard
          label="Urgent visible"
          value={String(
            visibleUrgent
          )}
          description="Urgent on this page"
          icon={AlertTriangle}
          tone="rose"
        />

        <MetricCard
          label="SLA breached"
          value={String(
            visibleBreached
          )}
          description="Breached on this page"
          icon={Clock3}
          tone="amber"
        />

        <MetricCard
          label="Verified visible"
          value={String(
            visibleVerified
          )}
          description="Verified customers visible"
          icon={BadgeCheck}
          tone="violet"
        />

        <MetricCard
          label="Wallet linked"
          value={String(
            visibleLinked
          )}
          description="Linked wallets visible"
          icon={WalletCards}
          tone="cyan"
        />
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -6,
            }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4"
          >
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

              <p className="break-words text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ===================================================
          CASES
      ==================================================== */}

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_60px_-45px_rgba(5,150,105,.42)] dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex flex-col gap-3 border-b border-emerald-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <IdCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">
                KYC support queue
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Customer verification-related support cases returned by the support API.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Support only
          </span>
        </div>

        {loading ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-1">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-[22px] border border-emerald-100 bg-emerald-50/30 dark:border-white/10 dark:bg-white/[0.025]"
                />
              )
            )}
          </div>
        ) : cases.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <FileCheck2 className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
              No KYC support cases found
            </p>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              Try changing the ticket status, priority, KYC state or search query.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE / TABLET */}

            <div className="space-y-3 p-4 lg:hidden">
              {cases.map(
                (item) => (
                  <motion.article
                    key={item.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950"
                  >
                    <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-[9px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
                          {
                            item.ticketNumber
                          }
                        </p>

                        <h3 className="mt-1 break-words text-sm font-black leading-5 text-slate-950 dark:text-white">
                          {item.subject}
                        </h3>
                      </div>

                      <span
                        className={`max-w-full self-start whitespace-normal rounded-full border px-2.5 py-1 text-left text-[8px] font-black uppercase leading-4 tracking-wide ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 min-[460px]:grid-cols-2">
                      <InfoBlock
                        label="Customer"
                        value={
                          item.customer
                            .name
                        }
                        icon={
                          UserRound
                        }
                      />

                      <InfoBlock
                        label="KYC status"
                        value={
                          item.customer
                            .kycStatus
                        }
                        icon={
                          BadgeCheck
                        }
                      />

                      <InfoBlock
                        label="Ticket state"
                        value={
                          item.status
                        }
                        icon={
                          CheckCircle2
                        }
                      />

                      <InfoBlock
                        label="SLA"
                        value={
                          slaText(
                            item
                          )
                        }
                        icon={Clock3}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between dark:border-white/10 dark:bg-white/[0.025]">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Last activity
                        </p>

                        <p className="mt-1 break-words text-[10px] font-black leading-4 text-slate-700 dark:text-slate-200">
                          {formatDateTime(
                            item.lastActivityAt
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelected(
                            item
                          )
                        }
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-black text-white transition hover:bg-emerald-700 min-[520px]:w-auto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open case
                      </button>
                    </div>
                  </motion.article>
                )
              )}
            </div>

            {/* DESKTOP */}

            <div className="support-kyc-scroll hidden overflow-x-auto overscroll-x-contain lg:block">
              <table className="w-full min-w-[1080px] text-left">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/55 dark:border-white/10 dark:bg-white/[0.025]">
                    {[
                      "Case",
                      "Customer",
                      "KYC",
                      "Status",
                      "Priority",
                      "SLA",
                      "Last activity",
                      "Action",
                    ].map(
                      (
                        heading
                      ) => (
                        <th
                          key={
                            heading
                          }
                          className={`px-4 py-4 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 ${
                            heading ===
                            "Action"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {cases.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b border-emerald-100/70 text-xs transition hover:bg-emerald-50/60 last:border-b-0 dark:border-white/5 dark:hover:bg-emerald-500/[0.04]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <IdCard className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[190px] break-all font-black text-slate-900 dark:text-white">
                                {
                                  item.ticketNumber
                                }
                              </p>

                              <p className="mt-1 max-w-[220px] break-words text-[9px] leading-4 text-slate-400">
                                {item.subject}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[190px] break-words font-black leading-5 text-slate-800 dark:text-slate-100">
                            {
                              item.customer
                                .name
                            }
                          </p>

                          <p className="mt-1 max-w-[190px] break-all text-[9px] leading-4 text-slate-400">
                            {
                              item.customer
                                .email
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex max-w-[160px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${kycTone(
                              item.customer
                                .kycStatus
                            )}`}
                          >
                            {
                              item.customer
                                .kycStatus
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex max-w-[160px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${statusTone(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${priorityTone(
                              item.priority
                            )}`}
                          >
                            {
                              item.priority
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <p
                            className={`max-w-[150px] break-words text-[10px] font-black leading-4 ${
                              item.sla
                                .breached
                                ? "text-rose-600 dark:text-rose-400"
                                : item.sla
                                      .minutesRemaining <=
                                    30
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {slaText(
                              item
                            )}
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
                            {formatDateTime(
                              item.sla
                                .dueAt
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[160px] text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                            {formatDateTime(
                              item.lastActivityAt
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(
                                item
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Open
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="border-t border-emerald-100 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.02]">
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
                      page <= 1 ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          Math.max(
                            1,
                            value - 1
                          )
                      )
                    }
                    className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    aria-label="Previous KYC page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                        totalPages ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          Math.min(
                            totalPages,
                            value + 1
                          )
                      )
                    }
                    className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    aria-label="Next KYC page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ===================================================
          DETAIL DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelected(null);
              }
            }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-[3px]"
          >
            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="support-kyc-scroll absolute inset-y-0 right-0 w-full max-w-[760px] overflow-y-auto overscroll-contain border-l border-emerald-100 bg-white text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,.32)] dark:border-white/10 dark:bg-slate-950 dark:text-white 2xl:max-w-[820px]"
            >
              <div className="sticky top-0 z-20 border-b border-emerald-100 bg-[#064E3B]/95 p-4 text-white backdrop-blur-xl dark:border-white/10 sm:p-5">
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-100/70">
                      Support KYC case
                    </p>

                    <h2 className="mt-1 break-all text-xl font-black leading-7 text-white">
                      {
                        selected.ticketNumber
                      }
                    </h2>

                    <p className="mt-1 break-words [overflow-wrap:anywhere] text-[10px] leading-4 text-emerald-50/60">
                      {selected.subject}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(null)
                    }
                    aria-label="Close KYC case"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-4 pb-10 sm:p-6 sm:pb-12">
                <section className="relative overflow-hidden rounded-[26px] border border-emerald-500/15 bg-emerald-500/[0.055] p-4 sm:p-5">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`max-w-full whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${kycTone(
                          selected.customer
                            .kycStatus
                        )}`}
                      >
                        KYC{" "}
                        {
                          selected.customer
                            .kycStatus
                        }
                      </span>

                      <span
                        className={`max-w-full whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black leading-4 ${statusTone(
                          selected.status
                        )}`}
                      >
                        {
                          selected.status
                        }
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${priorityTone(
                          selected.priority
                        )}`}
                      >
                        {
                          selected.priority
                        }
                      </span>
                    </div>

                    <h3 className="mt-4 break-words [overflow-wrap:anywhere] text-lg font-black leading-7 text-slate-950 dark:text-white">
                      {selected.subject}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      KYC-related support case · direct verification decisions are not exposed from this support endpoint.
                    </p>
                  </div>
                </section>

                <section className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />

                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      Customer & verification
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoBlock
                      label="Name"
                      value={
                        selected.customer
                          .name
                      }
                      icon={
                        UserRound
                      }
                    />

                    <InfoBlock
                      label="Role"
                      value={
                        humanize(
                          selected.customer
                            .role
                        )
                      }
                      icon={
                        ShieldCheck
                      }
                    />

                    <InfoBlock
                      label="Email"
                      value={
                        selected.customer
                          .email
                      }
                      icon={Mail}
                    />

                    <InfoBlock
                      label="Phone"
                      value={
                        selected.customer
                          .phone ||
                        "Not available"
                      }
                      icon={Phone}
                    />

                    <InfoBlock
                      label="KYC status"
                      value={
                        selected.customer
                          .kycStatus
                      }
                      icon={
                        BadgeCheck
                      }
                    />

                    <InfoBlock
                      label="Email verified"
                      value={
                        selected.customer
                          .emailVerified
                          ? "Verified"
                          : "Not verified"
                      }
                      icon={
                        selected.customer
                          .emailVerified
                          ? CheckCircle2
                          : XCircle
                      }
                    />

                    <InfoBlock
                      label="Email verified at"
                      value={
                        formatDateTime(
                          selected.customer
                            .emailVerifiedAt
                        )
                      }
                      icon={Clock3}
                    />

                    <InfoBlock
                      label="Wallet"
                      value={
                        selected.customer
                          .walletLinked
                          ? "Linked"
                          : "Not linked"
                      }
                      icon={
                        WalletCards
                      }
                    />
                  </div>
                </section>

                <section className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />

                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      Case context
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoBlock
                      label="Ticket number"
                      value={
                        selected.ticketNumber
                      }
                      icon={IdCard}
                    />

                    <InfoBlock
                      label="Category"
                      value={
                        selected.category
                      }
                      icon={
                        FileCheck2
                      }
                    />

                    <InfoBlock
                      label="Waiting on"
                      value={
                        waitingText(
                          selected.waitingOn
                        )
                      }
                      icon={Clock3}
                    />

                    <InfoBlock
                      label="Related reference"
                      value={
                        selected.relatedReference ||
                        "Not available"
                      }
                      icon={FileCheck2}
                    />

                    <InfoBlock
                      label="Created"
                      value={
                        formatDateTime(
                          selected.createdAt
                        )
                      }
                      icon={Clock3}
                    />

                    <InfoBlock
                      label="Last activity"
                      value={
                        formatDateTime(
                          selected.lastActivityAt
                        )
                      }
                      icon={RefreshCcw}
                    />
                  </div>
                </section>

                <section className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />

                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      SLA status
                    </h3>
                  </div>

                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      selected.sla
                        .breached
                        ? "border-rose-500/20 bg-rose-500/[0.06]"
                        : selected.sla
                              .minutesRemaining <=
                            30
                          ? "border-amber-500/20 bg-amber-500/[0.06]"
                          : "border-emerald-500/20 bg-emerald-500/[0.06]"
                    }`}
                  >
                    <p
                      className={`text-sm font-black ${
                        selected.sla
                          .breached
                          ? "text-rose-700 dark:text-rose-300"
                          : selected.sla
                                .minutesRemaining <=
                              30
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {slaText(
                        selected
                      )}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      Due{" "}
                      {formatDateTime(
                        selected.sla
                          .dueAt
                      )}
                    </p>
                  </div>
                </section>

                <section className="rounded-[24px] border border-cyan-500/15 bg-cyan-500/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" />

                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        Support review boundary
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                        This page is designed for support investigation and customer assistance.
                        The supplied support API exposes KYC case data but no direct KYC approval
                        or rejection action, so verification decisions remain outside this page.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style jsx global>{`
        .support-kyc-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(
              16,
              185,
              129,
              0.42
            )
            transparent;
        }

        .support-kyc-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-kyc-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-kyc-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            rgba(
              16,
              185,
              129,
              0.36
            );
          background-clip:
            padding-box;
        }

        .support-kyc-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(
              5,
              150,
              105,
              0.54
            );
          background-clip:
            padding-box;
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .support-kyc-scroll *,
          .support-kyc-scroll {
            scroll-behavior:
              auto !important;
          }
        }
      `}</style>
    </main>
  );
}
