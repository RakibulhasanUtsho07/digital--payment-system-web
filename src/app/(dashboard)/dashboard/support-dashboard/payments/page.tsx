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
  BadgeCheck,
  Banknote,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  Gauge,
  Hash,
  Landmark,
  Loader2,
  Mail,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportPayment,
} from "@/lib/api/supportDashboardApi";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

/* =========================================================
   TYPES
========================================================= */

type PaymentStatusFilter =
  | "All"
  | SupportPayment["status"];

type PaymentSourceFilter =
  | "All"
  | SupportPayment["sourceType"];

type PaymentModeFilter =
  | "All"
  | SupportPayment["mode"];

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

const STATUS_OPTIONS: Array<SelectOption<PaymentStatusFilter>> = [
  {
    value: "All",
    label: "All statuses",
    description: "Entire payment lifecycle",
  },
  {
    value: "pending",
    label: "Pending",
    description: "Waiting to proceed",
  },
  {
    value: "authorized",
    label: "Authorized",
    description: "Authorized but not captured",
  },
  {
    value: "captured",
    label: "Captured",
    description: "Funds captured",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Payment completed",
  },
  {
    value: "failed",
    label: "Failed",
    description: "Payment failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Payment cancelled",
  },
  {
    value: "expired",
    label: "Expired",
    description: "Payment expired",
  },
];

const SOURCE_OPTIONS: Array<SelectOption<PaymentSourceFilter>> = [
  {
    value: "All",
    label: "All sources",
    description: "Every payment source",
  },
  {
    value: "card",
    label: "Card",
    description: "Card payment source",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "PayPal payment source",
  },
  {
    value: "local_psp",
    label: "Local PSP",
    description: "Local payment service provider",
  },
  {
    value: "wallet",
    label: "Wallet",
    description: "Coffer wallet source",
  },
];

const MODE_OPTIONS: Array<SelectOption<PaymentModeFilter>> = [
  {
    value: "All",
    label: "All modes",
    description: "Test and live payments",
  },
  {
    value: "live",
    label: "Live",
    description: "Production payment mode",
  },
  {
    value: "test",
    label: "Test",
    description: "Sandbox payment mode",
  },
];

const HERO_PARTICLES = [
  { left: "7%", top: "22%", size: 4, delay: 0.2, duration: 7.6 },
  { left: "17%", top: "71%", size: 3, delay: 1.1, duration: 8.5 },
  { left: "31%", top: "18%", size: 5, delay: 0.7, duration: 9.8 },
  { left: "45%", top: "76%", size: 4, delay: 2.1, duration: 8.2 },
  { left: "58%", top: "28%", size: 3, delay: 1.5, duration: 7.4 },
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


function isAuthorizationError(
  error: unknown
): boolean {
  const record =
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

  const status =
    Number(
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

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function money(
  value: string | null,
  currency: string
): string {
  if (value === null || value === "") {
    return "Not available";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return `${currency} ${value}`;
  }

  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function amountNumber(value: string | null): number {
  if (!value) return 0;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function selectedLabel<T extends string>(
  options: Array<SelectOption<T>>,
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

function statusTone(status: SupportPayment["status"]): string {
  if (status === "completed" || status === "captured") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "failed") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (status === "pending" || status === "authorized") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

function sourceIcon(source: SupportPayment["sourceType"]): LucideIcon {
  if (source === "wallet") return WalletCards;
  if (source === "card") return CreditCard;
  if (source === "paypal") return CircleDollarSign;
  return Landmark;
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
    <div ref={rootRef} className="relative">
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
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
            {selected?.label}
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
              {selected.description}
            </span>
          )}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
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
            className="support-payment-scroll absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-emerald-100 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071b16]/95"
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
          whileHover={{ rotate: 8, scale: 1.08 }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
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
      className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_60px_-45px_rgba(5,150,105,.42)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="flex flex-col gap-3 border-b border-emerald-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.06 }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
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
            onClick={() => void copyValue()}
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
            <CircleDollarSign className="h-6 w-6" />
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
   PAGE
========================================================= */

export default function SupportPaymentsPage() {
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
    <SupportPaymentsContent
      onUnauthorized={
        denyAccess
      }
    />
  );
}

function SupportPaymentsContent({
  onUnauthorized,
}: {
  onUnauthorized: () =>
    void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatusFilter>("All");
  const [sourceType, setSourceType] = useState<PaymentSourceFilter>("All");
  const [mode, setMode] = useState<PaymentModeFilter>("All");
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [payments, setPayments] = useState<SupportPayment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<(SupportPayment & {
    support: {
      readOnly: true;
      canExecuteFinancialAction: false;
    };
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (payments.length === 0) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const result = await supportDashboardApi.searchPayments({
            search: search.trim() || undefined,
            status: status === "All" ? undefined : status,
            provider: provider.trim() || undefined,
            sourceType: sourceType === "All" ? undefined : sourceType,
            mode: mode === "All" ? undefined : mode,
            page,
            limit: 20,
          });

          if (!active) return;

          setPayments(result.payments);
          setTotal(result.total);
          setTotalPages(Math.max(1, result.totalPages));
        } catch (requestError: unknown) {
          if (
            active &&
            isAuthorizationError(
              requestError
            )
          ) {
            onUnauthorized();
            return;
          }

          if (active) {
            setError(
              messageOf(
                requestError
              )
            );
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
  }, [
    search,
    status,
    sourceType,
    mode,
    provider,
    page,
    refreshKey,
    onUnauthorized,
  ]);

  useEffect(() => {
    if (!selectedPaymentId) {
      setDetail(null);
      return;
    }

    let active = true;

    setDetailLoading(true);
    setDetail(null);
    setError("");

    void supportDashboardApi
      .getPayment(selectedPaymentId)
      .then((result) => {
        if (active) {
          setDetail(result.payment);
        }
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

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
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    selectedPaymentId,
    onUnauthorized,
  ]);

  useEffect(() => {
    if (!selectedPaymentId) {
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
        setSelectedPaymentId(
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
  }, [
    selectedPaymentId,
  ]);

  const visibleCompleted = useMemo(
    () => payments.filter((payment) => payment.status === "completed").length,
    [payments]
  );

  const visibleFailed = useMemo(
    () => payments.filter((payment) => payment.status === "failed").length,
    [payments]
  );

  const visibleAmount = useMemo(
    () => payments.reduce(
      (totalAmount, payment) => totalAmount + amountNumber(payment.amount),
      0
    ),
    [payments]
  );

  const visibleCurrency = useMemo(() => {
    const unique = Array.from(new Set(payments.map((payment) => payment.currency)));
    return unique.length === 1 ? unique[0] : "Mixed";
  }, [payments]);

  const activeFilterCount = useMemo(
    () => [
      status !== "All",
      sourceType !== "All",
      mode !== "All",
      Boolean(provider.trim()),
      Boolean(search.trim()),
    ].filter(Boolean).length,
    [status, sourceType, mode, provider, search]
  );

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setSourceType("All");
    setMode("All");
    setProvider("");
    setPage(1);
    setError("");
  }

  return (
    <main className="w-full min-w-0 space-y-5 overflow-x-clip pb-8 sm:space-y-6">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_48%,#065F46_100%)] p-5 text-white shadow-[0_28px_80px_-42px_rgba(5,150,105,.58)] sm:p-6 md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [0, 30, -12, 0],
            y: [0, -16, 11, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-300/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [0, -22, 16, 0],
            y: [0, 17, -9, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[100px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

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
                <CircleDollarSign className="h-3.5 w-3.5" />
                Payment Lookup
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Financial read-only
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Investigate merchant payments
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Search payment IDs, provider references, merchant references,
              customer IDs or customer email, then inspect payment lifecycle,
              provider context and failure evidence without changing financial state.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Search className="h-3.5 w-3.5" />
                {total.toLocaleString("en-BD")} matches
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Gauge className="h-3.5 w-3.5" />
                {selectedLabel(STATUS_OPTIONS, status)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {selectedLabel(SOURCE_OPTIONS, sourceType)}
              </span>
            </div>
          </div>

          <div className="relative w-full shrink-0 sm:w-auto">
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
              className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-900 shadow-[0_12px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing || loading ? "animate-spin" : ""}`}
              />
              Refresh payments
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
        className="relative z-30 rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
              Payment investigation filters
            </p>
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              API-backed filters · {activeFilterCount} active
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.55fr)_minmax(200px,1fr)_minmax(200px,1fr)_minmax(190px,1fr)_minmax(200px,1fr)]">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Search payment
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035]">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="Payment ID, provider ref, merchant ref, customer ID/email"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-700"
                  aria-label="Clear payment search"
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
            label="Source"
            value={sourceType}
            options={SOURCE_OPTIONS}
            onChange={(value) => {
              setSourceType(value);
              setPage(1);
            }}
            icon={CreditCard}
          />

          <SupportSelect
            label="Mode"
            value={mode}
            options={MODE_OPTIONS}
            onChange={(value) => {
              setMode(value);
              setPage(1);
            }}
            icon={Sparkles}
          />

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Provider
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/70">
              <Landmark className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={provider}
                onChange={(event) => {
                  setProvider(event.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="e.g. stripe"
              />
            </label>
          </div>
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
              <p className="text-sm font-black">Payment lookup failed</p>
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
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        <MetricCard
          label="Matching payments"
          value={total.toLocaleString("en-BD")}
          description="Total server-side payment matches"
          icon={CircleDollarSign}
          tone="emerald"
        />

        <MetricCard
          label="Visible completed"
          value={visibleCompleted.toLocaleString("en-BD")}
          description="Completed payments on this page"
          icon={BadgeCheck}
          tone="cyan"
        />

        <MetricCard
          label="Visible failed"
          value={visibleFailed.toLocaleString("en-BD")}
          description="Failed payments on this page"
          icon={XCircle}
          tone="rose"
        />

        <MetricCard
          label="Visible gross value"
          value={
            visibleCurrency === "Mixed"
              ? `${visibleAmount.toLocaleString("en-BD", { maximumFractionDigits: 2 })} mixed`
              : money(String(visibleAmount), visibleCurrency)
          }
          description="Derived from currently visible payments"
          icon={Banknote}
          tone="violet"
        />
      </motion.section>

      {/* RESULTS */}
      <Panel
        title="Payment Results"
        description="Real merchant payment records matching the selected support filters."
        icon={CircleDollarSign}
        action={
          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-300">
            {payments.length} visible
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

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                Searching payment records
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                Reading merchant payment and customer context...
              </p>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="grid min-h-[340px] place-items-center rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Search className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                No payment records match
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Try a different payment reference, customer, provider, status,
                source or mode filter.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {payments.map((payment, index) => {
                const SourceIcon = sourceIcon(payment.sourceType);

                return (
                  <motion.article
                    key={payment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.18) }}
                    className="rounded-[20px] border border-emerald-100 bg-emerald-50/20 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <SourceIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="break-all text-sm font-black leading-5 text-slate-950 dark:text-white">
                            {payment.paymentId}
                          </p>
                          <p className="mt-1 break-words [overflow-wrap:anywhere] text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                            {payment.provider} · {humanize(payment.sourceType)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`max-w-full self-start whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black uppercase leading-4 tracking-wide ${statusTone(payment.status)}`}
                      >
                        {humanize(payment.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-[10px] min-[460px]:grid-cols-2">
                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">Amount</p>
                        <p className="mt-1 break-words text-sm font-black leading-5 text-slate-700 dark:text-slate-200">
                          {money(payment.amount, payment.currency)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">Mode</p>
                        <p className="mt-1 font-black text-slate-700 dark:text-slate-200">
                          {humanize(payment.mode)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentId(payment.paymentId)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                    >
                      <Eye className="h-4 w-4" />
                      Open payment
                    </button>
                  </motion.article>
                );
              })}
            </div>

            <div className="support-payment-scroll hidden overflow-x-auto overscroll-x-contain lg:block">
              <table className="w-full min-w-[1040px] text-left">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/60 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Provider / source</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Created</th>
                    <th className="px-4 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment, index) => {
                    const SourceIcon = sourceIcon(payment.sourceType);

                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 0.16) }}
                        className="border-b border-emerald-100/70 text-xs transition hover:bg-emerald-50/60 dark:border-white/5 dark:hover:bg-emerald-500/[0.04]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <SourceIcon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] break-all font-black leading-5 text-slate-900 dark:text-white">
                                {payment.paymentId}
                              </p>
                              <p className="mt-1 max-w-[220px] break-all text-[9px] leading-4 text-slate-400">
                                {payment.merchantReference || payment.providerPaymentId || payment.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex max-w-[150px] whitespace-normal rounded-full border px-2.5 py-1 text-left text-[9px] font-black uppercase leading-4 tracking-wide ${statusTone(payment.status)}`}
                          >
                            {humanize(payment.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-black text-slate-900 dark:text-white">
                            {money(payment.amount, payment.currency)}
                          </p>
                          <p className="mt-1 text-[9px] text-slate-400">
                            Net {money(payment.netAmount, payment.currency)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-black text-slate-700 dark:text-slate-200">
                            {payment.provider || "Not available"}
                          </p>
                          <p className="mt-1 text-[9px] text-slate-400">
                            {humanize(payment.sourceType)} · {humanize(payment.mode)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[190px] break-words font-bold leading-5 text-slate-700 dark:text-slate-200">
                            {payment.customer?.name || "Guest / unavailable"}
                          </p>
                          <p className="mt-1 max-w-[190px] break-all text-[9px] leading-4 text-slate-400">
                            {payment.customer?.email || payment.customerId || "No customer ID"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-[10px] text-slate-500 dark:text-slate-400">
                          {formatDateTime(payment.timestamps.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPaymentId(payment.paymentId)}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                          >
                            <Eye className="mr-1.5 inline h-3.5 w-3.5" />
                            Open
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Page <span className="font-black text-slate-900 dark:text-white">{page}</span> of{" "}
                <span className="font-black text-slate-900 dark:text-white">{totalPages}</span>{" "}
                · {total.toLocaleString("en-BD")} matches
              </p>

              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Previous payment page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Next payment page"
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
        {selectedPaymentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedPaymentId(null);
              }
            }}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="support-payment-scroll absolute inset-y-0 right-0 w-full max-w-[780px] overflow-y-auto overscroll-contain border-l border-emerald-100 bg-white text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,.32)] dark:border-white/10 dark:bg-slate-950 dark:text-white 2xl:max-w-[840px]"
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_52%,#065F46_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{
                    x: [0, 18, -7, 0],
                    y: [0, -9, 6, 0],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100/70">
                      Payment investigation
                    </p>
                    <h2 className="mt-1 break-all text-xl font-black leading-7 text-white">
                      {detail?.paymentId || selectedPaymentId}
                    </h2>
                    <p className="mt-1 break-words text-[10px] leading-4 text-emerald-50/55">
                      Read-only support evidence
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentId(null)}
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20"
                    aria-label="Close payment detail"
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
                    <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                      Loading payment evidence...
                    </p>
                  </div>
                </div>
              ) : detail ? (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-5 p-4 pb-10 sm:p-6 sm:pb-12"
                >
                  <motion.section
                    variants={reveal}
                    className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/45 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${statusTone(detail.status)}`}
                        >
                          {humanize(detail.status)}
                        </span>

                        <p className="mt-4 break-words text-xl font-black leading-7 text-slate-950 dark:text-white sm:text-2xl">
                          {money(detail.amount, detail.currency)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Net {money(detail.netAmount, detail.currency)} · Fee {money(detail.feeAmount, detail.currency)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-right dark:border-white/10 dark:bg-white/5">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Mode
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">
                          {humanize(detail.mode)}
                        </p>
                      </div>
                    </div>
                  </motion.section>

                  <Panel
                    title="Payment References"
                    description="Core merchant, provider and order identifiers."
                    icon={Hash}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CopyField label="Payment ID" value={detail.paymentId} icon={CircleDollarSign} />
                      <CopyField label="Provider payment ID" value={detail.providerPaymentId} icon={Landmark} />
                      <CopyField label="Merchant reference" value={detail.merchantReference} icon={Store} />
                      <CopyField label="Order ID" value={detail.orderId} icon={Hash} />
                      <CopyField label="Merchant ID" value={detail.merchantId} icon={Store} />
                      <CopyField label="Customer ID" value={detail.customerId} icon={UserRound} />
                    </div>
                  </Panel>

                  <Panel
                    title="Provider & Source"
                    description="Payment routing context recorded by the gateway."
                    icon={CreditCard}
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["Provider", detail.provider || "Not available", Landmark],
                        ["Source", humanize(detail.sourceType), CreditCard],
                        ["Mode", humanize(detail.mode), Sparkles],
                      ].map(([label, value, Icon]) => {
                        const ItemIcon = Icon as LucideIcon;
                        return (
                          <motion.div
                            key={String(label)}
                            whileHover={{ y: -2 }}
                            className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                          >
                            <ItemIcon className="h-4 w-4 text-emerald-600" />
                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              {String(label)}
                            </p>
                            <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-100">
                              {String(value)}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel
                    title="Customer Context"
                    description="Customer details attached to this payment when available."
                    icon={UserRound}
                  >
                    {detail.customer ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CopyField label="Customer name" value={detail.customer.name} icon={UserRound} />
                        <CopyField label="Customer email" value={detail.customer.email} icon={Mail} />

                        <motion.div
                          whileHover={{ y: -2 }}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                        >
                          <BadgeCheck className="h-4 w-4 text-emerald-600" />
                          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            KYC status
                          </p>
                          <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800 dark:text-slate-100">
                            {humanize(detail.customer.kycStatus)}
                          </p>
                        </motion.div>

                        <motion.div
                          whileHover={{ y: -2 }}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                        >
                          <WalletCards className="h-4 w-4 text-emerald-600" />
                          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Wallet
                          </p>
                          <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800 dark:text-slate-100">
                            {detail.customer.walletLinked ? "Linked" : "Not linked"}
                          </p>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center dark:border-white/10 dark:bg-white/[0.02]">
                        <div>
                          <UserRound className="mx-auto h-6 w-6 text-slate-300" />
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            No customer profile is linked to this payment.
                          </p>
                        </div>
                      </div>
                    )}
                  </Panel>

                  {detail.failure && (
                    <motion.section
                      variants={reveal}
                      className="rounded-[24px] border border-rose-500/20 bg-rose-500/[0.06] p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                          <AlertTriangle className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-black text-rose-700 dark:text-rose-300">
                            Failure evidence
                          </p>
                          <p className="mt-2 text-xs font-black text-slate-800 dark:text-slate-100">
                            {detail.failure.code || "No failure code"}
                          </p>
                          <p className="mt-1 break-words [overflow-wrap:anywhere] text-xs leading-5 text-slate-600 dark:text-slate-300">
                            {detail.failure.message || "No failure message recorded."}
                          </p>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  <Panel
                    title="Payment Timeline"
                    description="Recorded lifecycle timestamps for this payment."
                    icon={Clock3}
                  >
                    <div className="relative space-y-3 pl-7">
                      <div className="absolute bottom-2 left-[9px] top-2 w-px bg-emerald-100 dark:bg-white/10" />

                      {[
                        ["Created", detail.timestamps.createdAt],
                        ["Authorized", detail.timestamps.authorizedAt],
                        ["Captured", detail.timestamps.capturedAt],
                        ["Completed", detail.timestamps.completedAt],
                        ["Failed", detail.timestamps.failedAt],
                        ["Cancelled", detail.timestamps.cancelledAt],
                        ["Expired", detail.timestamps.expiredAt],
                        ["Last updated", detail.timestamps.updatedAt],
                      ].map(([label, value], index) => (
                        <motion.div
                          key={String(label)}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(index * 0.035, 0.2) }}
                          className="relative rounded-2xl border border-emerald-100 bg-emerald-50/25 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"
                        >
                          <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)] dark:border-slate-950" />

                          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                            {String(label)}
                          </p>
                          <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800 dark:text-slate-100">
                            {formatDateTime(value as string | null)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
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
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                          Financial action boundary
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                          This support view is read-only. The API explicitly exposes
                          readOnly = true and canExecuteFinancialAction = false, so
                          this route cannot capture, refund, cancel, retry, or mutate
                          the payment.
                        </p>
                      </div>
                    </div>
                  </motion.section>
                </motion.div>
              ) : (
                <div className="grid min-h-[60vh] place-items-center px-6 text-center">
                  <div>
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="mt-3 text-sm font-black">Payment unavailable</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Close the drawer and try the payment lookup again.
                    </p>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .support-payment-scroll {
          scrollbar-width: thin;
          scrollbar-color:
            rgba(16, 185, 129, 0.42)
            transparent;
        }

        .support-payment-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-payment-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-payment-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            rgba(16, 185, 129, 0.36);
          background-clip:
            padding-box;
        }

        .support-payment-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(5, 150, 105, 0.54);
          background-clip:
            padding-box;
        }
      `}</style>
    </main>
  );
}
