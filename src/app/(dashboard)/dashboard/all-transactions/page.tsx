"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Filter,
  Hash,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  XCircle,
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
  getAdminTransactions,
  type AdminTransactionsMeta,
  type TransactionItem,
  type TransactionStatus,
  type TransactionType,
  type TransactionUser,
} from "@/lib/api/transactionApi";

/* =========================================================
   TYPES
========================================================= */

type Transaction = TransactionItem;

type StatusFilter =
  | "ALL"
  | TransactionStatus;

type TypeFilter =
  | "ALL"
  | TransactionType;

type Stats = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  cancelled: number;
  volume: number;
  completionRate: number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const EMPTY_META: AdminTransactionsMeta = {
  integrityWarnings: 0,
  sourceCounts: {
    WALLET: 0,
    ADD_MONEY: 0,
    MERCHANT_PAYMENT: 0,
    MERCHANT_REFUND: 0,
  },
};

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "All statuses",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "FAILED",
    label: "Failed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

const TYPE_OPTIONS: Array<{
  value: TypeFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "All transaction types",
  },
  {
    value: "TRANSFER",
    label: "Send money",
  },
  {
    value: "DEPOSIT",
    label: "Add money",
  },
  {
    value: "PAYMENT",
    label: "Merchant payment",
  },
  {
    value: "REFUND",
    label: "Refund",
  },
  {
    value: "WITHDRAW",
    label: "Withdraw",
  },
];

const TYPE_META: Record<
  TransactionType,
  {
    label: string;
    color: string;
  }
> = {
  TRANSFER: {
    label: "Send money",
    color: "#6366f1",
  },
  DEPOSIT: {
    label: "Add money",
    color: "#10b981",
  },
  PAYMENT: {
    label: "Payment",
    color: "#8b5cf6",
  },
  REFUND: {
    label: "Refund",
    color: "#ec4899",
  },
  WITHDRAW: {
    label: "Withdraw",
    color: "#f59e0b",
  },
};

const STATUS_META: Record<
  TransactionStatus,
  {
    label: string;
    color: string;
  }
> = {
  COMPLETED: {
    label: "Completed",
    color: "#10b981",
  },
  PENDING: {
    label: "Pending",
    color: "#f59e0b",
  },
  FAILED: {
    label: "Failed",
    color: "#f43f5e",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#64748b",
  },
};

/* =========================================================
   ANIMATION
========================================================= */

const pageContainer = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getPartyName(
  value: string | TransactionUser
): string {
  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.email ||
    value._id
  );
}

function getPartyDetail(
  value: string | TransactionUser
): string {
  if (typeof value === "string") {
    return "";
  }

  return (
    value.email ||
    value.phone ||
    value.kind ||
    ""
  );
}

function getPartyId(
  value: string | TransactionUser
): string {
  return typeof value === "string"
    ? value
    : value._id;
}

function formatCurrency(
  amount: number | null,
  currency = "BDT"
): string {
  if (
    amount === null ||
    !Number.isFinite(amount)
  ) {
    return "Unavailable";
  }

  const symbol =
    currency === "BDT"
      ? "৳"
      : currency;

  return `${symbol} ${amount.toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatCompactCurrency(
  value: number
): string {
  if (value >= 1_000_000) {
    return `৳${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `৳${(
      value / 1_000
    ).toFixed(1)}K`;
  }

  return `৳${value.toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function shortId(
  value: string
): string {
  return value.length > 17
    ? `${value.slice(
        0,
        9
      )}…${value.slice(-6)}`
    : value;
}

function typeLabel(
  type: TransactionType
): string {
  return (
    TYPE_META[type]?.label ||
    type
  );
}

/* =========================================================
   ACCESS CONTROL
========================================================= */

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

type UnknownRecord = Record<
  string,
  unknown
>;

const ADMIN_ROLES = new Set([
  "admin",
  "super_admin",
]);

function normalizeRole(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function asRecord(
  value: unknown
): UnknownRecord | null {
  return value !== null &&
    typeof value === "object"
    ? (value as UnknownRecord)
    : null;
}

function getStoredUserRole(
  value: unknown
): string {
  const root = asRecord(value);

  if (!root) {
    return "";
  }

  const directRole =
    root.role;

  if (directRole !== undefined) {
    return normalizeRole(
      directRole
    );
  }

  const nestedUser =
    asRecord(root.user);

  if (
    nestedUser?.role !==
    undefined
  ) {
    return normalizeRole(
      nestedUser.role
    );
  }

  const nestedData =
    asRecord(root.data);

  if (
    nestedData?.role !==
    undefined
  ) {
    return normalizeRole(
      nestedData.role
    );
  }

  return "";
}

function isAllowedAdminRole(
  role: unknown
): boolean {
  return ADMIN_ROLES.has(
    normalizeRole(role)
  );
}

function readAdminAccessFromStorage(): boolean {
  try {
    const authenticated =
      window.localStorage.getItem(
        "is_authenticated"
      );

    const rawUser =
      window.localStorage.getItem(
        "auth_user"
      );

    if (
      authenticated !== "true" ||
      !rawUser
    ) {
      return false;
    }

    const parsedUser: unknown =
      JSON.parse(rawUser);

    return isAllowedAdminRole(
      getStoredUserRole(
        parsedUser
      )
    );
  } catch {
    return false;
  }
}

function isAuthorizationError(
  error: unknown
): boolean {
  const record =
    asRecord(error);

  const status =
    Number(
      record?.status ??
        record?.statusCode ??
        asRecord(record?.response)
          ?.status
    );

  if (
    status === 401 ||
    status === 403 ||
    status === 404
  ) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
          .toLowerCase()
      : String(error ?? "")
          .toLowerCase();

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("forbidden") ||
    message.includes("unauthorized") ||
    message.includes("not authorized") ||
    message.includes("access denied")
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AllTransactionsPage() {
  const reduceMotion =
    useReducedMotion();

  const [
    accessState,
    setAccessState,
  ] =
    useState<AccessState>(
      "checking"
    );

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [meta, setMeta] =
    useState<AdminTransactionsMeta>(
      EMPTY_META
    );

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>("ALL");

  const [page, setPage] =
    useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    selected,
    setSelected,
  ] =
    useState<Transaction | null>(
      null
    );

  /* =======================================================
     FETCH DATA
  ======================================================= */

  async function loadTransactions(
    fullLoader = true
  ) {
    try {
      if (fullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorMessage("");

      const data =
        await getAdminTransactions();

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Failed to load transactions."
        );
      }

      setTransactions(
        Array.isArray(
          data.transactions
        )
          ? data.transactions
          : []
      );

      setMeta(
        data.meta ||
          EMPTY_META
      );
    } catch (error: unknown) {
      if (
        isAuthorizationError(
          error
        )
      ) {
        setAccessState(
          "denied"
        );
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load transactions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const allowed =
      readAdminAccessFromStorage();

    setAccessState(
      allowed
        ? "allowed"
        : "denied"
    );
  }, []);

  useEffect(() => {
    if (
      accessState !==
      "allowed"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadTransactions(
            true
          );
        },
        0
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [accessState]);

  /* =======================================================
     ESC CLOSE DRAWER
  ======================================================= */

  useEffect(() => {
    const closeDrawer = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setSelected(null);
      }
    };

    window.addEventListener(
      "keydown",
      closeDrawer
    );

    return () =>
      window.removeEventListener(
        "keydown",
        closeDrawer
      );
  }, []);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTransactions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const haystack = [
            transaction._id,
            transaction.publicId,
            transaction.reference,
            transaction.source,
            transaction.provider,
            transaction.type,
            transaction.status,
            getPartyName(
              transaction.senderId
            ),
            getPartyName(
              transaction.receiverId
            ),
            getPartyDetail(
              transaction.senderId
            ),
            getPartyDetail(
              transaction.receiverId
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            (!query ||
              haystack.includes(
                query
              )) &&
            (statusFilter ===
              "ALL" ||
              transaction.status ===
                statusFilter) &&
            (typeFilter ===
              "ALL" ||
              transaction.type ===
                typeFilter)
          );
        }
      );
    }, [
      transactions,
      search,
      statusFilter,
      typeFilter,
    ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTransactions.length /
          PAGE_SIZE
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const visibleTransactions =
    filteredTransactions.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage *
        PAGE_SIZE
    );

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo<Stats>(
    () => {
      const count = (
        status: TransactionStatus
      ) =>
        transactions.filter(
          (item) =>
            item.status === status
        ).length;

      const completed =
        count("COMPLETED");

      const volume =
        transactions.reduce(
          (sum, item) =>
            item.status ===
              "COMPLETED" &&
            item.amount !== null
              ? sum +
                item.amount
              : sum,
          0
        );

      return {
        total:
          transactions.length,
        completed,
        pending:
          count("PENDING"),
        failed:
          count("FAILED"),
        cancelled:
          count("CANCELLED"),
        volume,
        completionRate:
          transactions.length >
          0
            ? (completed /
                transactions.length) *
              100
            : 0,
      };
    },
    [transactions]
  );

  if (
    accessState ===
    "checking"
  ) {
    return <AccessCheckingState />;
  }

  if (
    accessState ===
    "denied"
  ) {
    return <NotFoundState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-14 text-foreground">
      {/* Ambient page background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-220px] top-[300px] h-[520px] w-[520px] rounded-full bg-violet-500/[0.035] blur-[100px]" />

        <div className="absolute right-[-200px] top-[900px] h-[500px] w-[500px] rounded-full bg-indigo-500/[0.035] blur-[110px]" />
      </div>

      <motion.div
        variants={
          reduceMotion
            ? undefined
            : pageContainer
        }
        initial={
          reduceMotion
            ? undefined
            : "hidden"
        }
        animate={
          reduceMotion
            ? undefined
            : "show"
        }
        className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:space-y-6 lg:px-8 lg:py-7"
      >
        <motion.div
          variants={
            reduceMotion
              ? undefined
              : fadeUp
          }
        >
          <Hero
            total={stats.total}
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadTransactions(
                false
              )
            }
          />
        </motion.div>

        <AnimatePresence
          mode="popLayout"
        >
          {errorMessage && (
            <Notice
              tone="error"
              title="Could not load transactions"
              message={
                errorMessage
              }
              action={
                <motion.button
                  type="button"
                  whileHover={{
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={() =>
                    void loadTransactions(
                      true
                    )
                  }
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-[10px] font-black text-white shadow-lg shadow-rose-600/15 transition hover:bg-rose-700"
                >
                  Try again
                </motion.button>
              }
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {meta.integrityWarnings >
            0 && (
            <Notice
              tone="warning"
              title={`${
                meta.integrityWarnings
              } legacy record${
                meta.integrityWarnings ===
                1
                  ? ""
                  : "s"
              } need encryption review`}
              message="Those rows remain visible, but their amount is hidden because it cannot be authenticated with the current data-encryption key."
            />
          )}
        </AnimatePresence>

        <motion.div
          variants={
            reduceMotion
              ? undefined
              : fadeUp
          }
        >
          <StatsGrid
            stats={stats}
          />
        </motion.div>

        <motion.div
          variants={
            reduceMotion
              ? undefined
              : fadeUp
          }
        >
          <TransactionAnalytics
            transactions={
              transactions
            }
          />
        </motion.div>

        <motion.div
          variants={
            reduceMotion
              ? undefined
              : fadeUp
          }
        >
          <FilterBar
            search={search}
            status={
              statusFilter
            }
            type={typeFilter}
            filteredCount={
              filteredTransactions.length
            }
            totalCount={
              transactions.length
            }
            onSearch={(
              value
            ) => {
              setSearch(
                value
              );
              setPage(1);
            }}
            onStatus={(
              value
            ) => {
              setStatusFilter(
                value
              );
              setPage(1);
            }}
            onType={(
              value
            ) => {
              setTypeFilter(
                value
              );
              setPage(1);
            }}
            onClear={() => {
              setSearch("");
              setStatusFilter(
                "ALL"
              );
              setTypeFilter(
                "ALL"
              );
              setPage(1);
            }}
          />
        </motion.div>

        <motion.div
          variants={
            reduceMotion
              ? undefined
              : fadeUp
          }
        >
          <TransactionTable
            rows={
              visibleTransactions
            }
            filteredCount={
              filteredTransactions.length
            }
            page={safePage}
            totalPages={
              totalPages
            }
            onPrevious={() =>
              setPage(
                (value) =>
                  Math.max(
                    1,
                    value - 1
                  )
              )
            }
            onNext={() =>
              setPage(
                (value) =>
                  Math.min(
                    totalPages,
                    value + 1
                  )
              )
            }
            onOpen={
              setSelected
            }
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <TransactionDrawer
            transaction={
              selected
            }
            onClose={() =>
              setSelected(null)
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   ACCESS STATES
========================================================= */

function AccessCheckingState() {
  return (
    <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-[110px]" />

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-violet-500/15 bg-violet-500/10 text-violet-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <p className="mt-4 text-sm font-black tracking-tight">
          Verifying access
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Checking administrator permissions…
        </p>
      </motion.div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.08] blur-[120px]" />

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
          duration: 0.5,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-8 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-500/15 bg-violet-500/10 text-violet-600">
            <Search className="h-6 w-6" />
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
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
   LOADING
========================================================= */

function LoadingState() {
  return (
    <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-[110px]" />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.94,
          y: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="relative text-center"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 12px 35px rgba(76,39,133,.15)",
              "0 20px 55px rgba(124,58,237,.28)",
              "0 12px 35px rgba(76,39,133,.15)",
            ],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
          }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#211754,#5b21b6)] text-white"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
        </motion.div>

        <p className="mt-5 text-sm font-black tracking-tight">
          Loading unified
          ledger
        </p>

        <p className="mt-1.5 text-xs text-muted-foreground">
          Combining wallet and
          merchant transactions…
        </p>

        <div className="mx-auto mt-5 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <motion.div
            animate={{
              x: [
                "-100%",
                "200%",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.25,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-violet-600"
          />
        </div>
      </motion.div>
    </main>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({
  total,
  refreshing,
  onRefresh,
}: {
  total: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: -14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="group relative overflow-hidden rounded-[30px] border border-violet-800/60 bg-[linear-gradient(115deg,#100b25_0%,#211754_52%,#4c2785_100%)] p-5 text-white shadow-[0_28px_80px_rgba(39,25,86,0.22)] sm:p-7 lg:p-8"
    >
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
          backgroundSize:
            "42px 42px",
        }}
      />

      {/* Animated glow */}
      <motion.div
        animate={{
          x: [
            0,
            -35,
            0,
          ],
          y: [
            0,
            28,
            0,
          ],
          scale: [
            1,
            1.08,
            1,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-violet-300/[0.17] blur-3xl"
      />

      <motion.div
        animate={{
          x: [
            0,
            45,
            0,
          ],
          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -bottom-40 left-[28%] h-80 w-80 rounded-full bg-indigo-400/[0.12] blur-3xl"
      />

      <div className="pointer-events-none absolute right-[12%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200/70">
              Administrator
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[8px] font-black text-emerald-200 backdrop-blur-xl">
              <motion.span
                animate={{
                  scale: [
                    1,
                    1.35,
                    1,
                  ],
                  opacity: [
                    1,
                    0.5,
                    1,
                  ],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-300"
              />

              Unified live
              ledger
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-[42px]">
            All Transactions
          </h1>

          <p className="mt-3 max-w-2xl text-[12px] font-medium leading-6 text-violet-100/65 sm:text-sm">
            Send money, add
            money, merchant
            payments, refunds and
            withdrawals in one
            secure operational
            view.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <HeroPill
              icon={Activity}
              label={`${total} records`}
            />

            <HeroPill
              icon={Shield}
              label="Integrity monitored"
            />

            <HeroPill
              icon={
                WalletCards
              }
              label="All money flows"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <div className="hidden min-w-[190px] rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.17em] text-violet-200/55">
                  Ledger status
                </p>

                <p className="mt-1.5 text-xs font-black">
                  Operational
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{
              y: -2,
              scale: 1.015,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={
              onRefresh
            }
            disabled={
              refreshing
            }
            className="group/refresh inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[10px] font-black text-violet-950 shadow-[0_12px_35px_rgba(0,0,0,.15)] transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 transition-transform group-hover/refresh:rotate-45 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing…"
              : "Refresh data"}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

function HeroPill({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}) {
  return (
    <motion.span
      whileHover={{
        y: -2,
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.065] px-3 py-1.5 text-[8px] font-black text-violet-100/80 backdrop-blur-lg transition-colors hover:bg-white/[0.1]"
    >
      <Icon className="h-3 w-3" />
      {label}
    </motion.span>
  );
}

/* =========================================================
   NOTICE
========================================================= */

function Notice({
  tone,
  title,
  message,
  action,
}: {
  tone: "error" | "warning";
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const error =
    tone === "error";

  const Icon = error
    ? XCircle
    : AlertTriangle;

  return (
    <motion.section
      layout
      initial={{
        opacity: 0,
        y: -10,
        scale: 0.99,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.99,
      }}
      className={`overflow-hidden rounded-[22px] border p-4 ${
        error
          ? "border-rose-500/20 bg-rose-500/[0.08]"
          : "border-amber-500/20 bg-amber-500/[0.08]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              error
                ? "bg-rose-500/10 text-rose-500"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div>
            <p
              className={`text-[11px] font-black ${
                error
                  ? "text-rose-600"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {title}
            </p>

            <p className="mt-1 max-w-4xl text-[10px] leading-5 text-muted-foreground">
              {message}
            </p>
          </div>
        </div>

        {action}
      </div>
    </motion.section>
  );
}

/* =========================================================
   STATS
========================================================= */

function StatsGrid({
  stats,
}: {
  stats: Stats;
}) {
  const cards = [
    {
      label:
        "Total transactions",
      value:
        stats.total.toLocaleString(),
      helper:
        "Unified ledger records",
      icon: Activity,
      color: "blue",
    },
    {
      label: "Completed",
      value:
        stats.completed.toLocaleString(),
      helper: `${stats.completionRate.toFixed(
        1
      )}% success rate`,
      icon: CheckCircle2,
      color: "emerald",
    },
    {
      label: "Pending",
      value:
        stats.pending.toLocaleString(),
      helper:
        "Awaiting completion",
      icon: Clock3,
      color: "amber",
    },
    {
      label: "Failed",
      value:
        stats.failed.toLocaleString(),
      helper: "Needs review",
      icon: XCircle,
      color: "rose",
    },
    {
      label: "Cancelled",
      value:
        stats.cancelled.toLocaleString(),
      helper:
        "Stopped transactions",
      icon: X,
      color: "slate",
    },
    {
      label:
        "Completed volume",
      value:
        formatCompactCurrency(
          stats.volume
        ),
      helper:
        "Readable settled value",
      icon: CircleDollarSign,
      color: "violet",
    },
  ] as const;

  const styles = {
    blue: {
      icon: "border-blue-500/20 bg-blue-500/10 text-blue-600",
      glow: "group-hover:shadow-blue-500/10",
    },
    emerald: {
      icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
      glow: "group-hover:shadow-emerald-500/10",
    },
    amber: {
      icon: "border-amber-500/20 bg-amber-500/10 text-amber-600",
      glow: "group-hover:shadow-amber-500/10",
    },
    rose: {
      icon: "border-rose-500/20 bg-rose-500/10 text-rose-600",
      glow: "group-hover:shadow-rose-500/10",
    },
    slate: {
      icon: "border-slate-500/20 bg-slate-500/10 text-slate-600",
      glow: "group-hover:shadow-slate-500/10",
    },
    violet: {
      icon: "border-violet-500/20 bg-violet-500/10 text-violet-600",
      glow: "group-hover:shadow-violet-500/10",
    },
  };

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map(
        (
          card,
          index
        ) => {
          const style =
            styles[
              card.color
            ];

          return (
            <motion.article
              key={
                card.label
              }
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.045,
                duration: 0.45,
              }}
              whileHover={{
                y: -5,
              }}
              className={`group relative overflow-hidden rounded-[24px] border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-violet-500/15 hover:shadow-xl ${style.glow}`}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-violet-500/[0.03] blur-2xl transition duration-300 group-hover:bg-violet-500/[0.07]" />

              <div className="relative">
                <motion.div
                  whileHover={{
                    rotate: -5,
                    scale: 1.05,
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${style.icon}`}
                >
                  <card.icon className="h-4 w-4" />
                </motion.div>

                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                  {card.label}
                </p>

                <p className="mt-1.5 text-2xl font-black tracking-[-0.03em]">
                  {card.value}
                </p>

                <p className="mt-1 truncate text-[8px] font-semibold text-muted-foreground">
                  {card.helper}
                </p>
              </div>
            </motion.article>
          );
        }
      )}
    </section>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function TransactionAnalytics({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const lineData =
    useMemo(() => {
      const today =
        new Date();

      return Array.from(
        {
          length: 7,
        },
        (_, index) => {
          const date =
            new Date(
              today
            );

          date.setHours(
            0,
            0,
            0,
            0
          );

          date.setDate(
            today.getDate() -
              (6 - index)
          );

          const next =
            new Date(
              date
            );

          next.setDate(
            date.getDate() +
              1
          );

          const rows =
            transactions.filter(
              (item) => {
                if (
                  !item.createdAt
                ) {
                  return false;
                }

                const created =
                  new Date(
                    item.createdAt
                  );

                return (
                  created >=
                    date &&
                  created <
                    next
                );
              }
            );

          return {
            name: new Intl.DateTimeFormat(
              "en-GB",
              {
                day: "2-digit",
                month:
                  "short",
              }
            ).format(date),

            volume:
              rows.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  (item.amount ??
                    0),
                0
              ),

            count:
              rows.length,
          };
        }
      );
    }, [transactions]);

  const statusData =
    useMemo(
      () =>
        (
          Object.keys(
            STATUS_META
          ) as TransactionStatus[]
        )
          .map(
            (
              status
            ) => ({
              name: STATUS_META[
                status
              ].label,

              value:
                transactions.filter(
                  (
                    item
                  ) =>
                    item.status ===
                    status
                ).length,

              color:
                STATUS_META[
                  status
                ].color,
            })
          )
          .filter(
            (item) =>
              item.value > 0
          ),
      [transactions]
    );

  const typeData =
    useMemo(
      () =>
        (
          Object.keys(
            TYPE_META
          ) as TransactionType[]
        )
          .map(
            (
              type
            ) => ({
              name: TYPE_META[
                type
              ].label,

              value:
                transactions.filter(
                  (
                    item
                  ) =>
                    item.type ===
                    type
                ).length,

              color:
                TYPE_META[
                  type
                ].color,
            })
          )
          .filter(
            (item) =>
              item.value > 0
          ),
      [transactions]
    );

  const safeStatusData =
    statusData.length > 0
      ? statusData
      : [
          {
            name: "No data",
            value: 1,
            color:
              "#cbd5e1",
          },
        ];

  const safeTypeData =
    typeData.length > 0
      ? typeData
      : [
          {
            name: "No data",
            value: 1,
            color:
              "#e2e8f0",
          },
        ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      {/* LINE CHART */}
      <motion.article
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={{
          y: -2,
        }}
        transition={{
          duration: 0.4,
        }}
        className="group relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/[0.045] blur-3xl" />

        <ChartHeader
          eyebrow="7-day movement"
          title="Transaction flow"
          description="Daily value and transaction count across every ledger source."
          icon={Activity}
        />

        <div className="relative h-[325px] px-2 pb-4 pr-5 sm:h-[350px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={lineData}
              margin={{
                top: 18,
                right: 8,
                left: 4,
              }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="4 7"
                vertical={
                  false
                }
                opacity={0.7}
              />

              <XAxis
                dataKey="name"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                tick={{
                  fontSize: 10,
                  fontWeight: 700,
                  fill: "var(--muted-foreground)",
                }}
              />

              <YAxis
                yAxisId="volume"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={62}
                tickFormatter={
                  formatCompactCurrency
                }
                tick={{
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                }}
              />

              <YAxis
                yAxisId="count"
                orientation="right"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                allowDecimals={
                  false
                }
                width={32}
                tick={{
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                }}
              />

              <Tooltip
                cursor={{
                  stroke:
                    "#8b5cf6",
                  strokeOpacity:
                    0.15,
                  strokeWidth:
                    1.5,
                }}
                contentStyle={{
                  borderRadius:
                    16,
                  border:
                    "1px solid var(--border)",
                  background:
                    "var(--card)",
                  color:
                    "var(--card-foreground)",
                  fontSize: 11,
                  fontWeight:
                    700,
                  boxShadow:
                    "0 18px 45px rgba(15,23,42,.12)",
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={38}
                iconType="circle"
                wrapperStyle={{
                  fontSize: 10,
                  fontWeight:
                    800,
                }}
              />

              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Volume (BDT)"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: "#7c3aed",
                  stroke:
                    "var(--card)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#7c3aed",
                  stroke:
                    "var(--card)",
                  strokeWidth: 3,
                }}
                isAnimationActive
                animationBegin={
                  100
                }
                animationDuration={
                  1250
                }
                animationEasing="ease-out"
              />

              <Line
                yAxisId="count"
                type="monotone"
                dataKey="count"
                name="Transactions"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#10b981",
                  stroke:
                    "var(--card)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#10b981",
                  stroke:
                    "var(--card)",
                  strokeWidth: 3,
                }}
                isAnimationActive
                animationBegin={
                  220
                }
                animationDuration={
                  1450
                }
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.article>

      {/* PIE CHART */}
      <motion.article
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={{
          y: -2,
        }}
        transition={{
          delay: 0.08,
          duration: 0.4,
        }}
        className="group relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl"
      >
        <div className="pointer-events-none absolute -right-20 top-20 h-48 w-48 rounded-full bg-indigo-500/[0.04] blur-3xl" />

        <ChartHeader
          eyebrow="Ledger mix"
          title="Status & type distribution"
          description="Inner ring shows status; outer ring shows transaction type."
          icon={
            CircleDollarSign
          }
        />

        <div className="relative grid items-center gap-2 px-3 pb-5 sm:grid-cols-[1fr_150px] xl:grid-cols-1 2xl:grid-cols-[1fr_145px]">
          <div className="relative h-[260px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius:
                      14,
                    border:
                      "1px solid var(--border)",
                    background:
                      "var(--card)",
                    color:
                      "var(--card-foreground)",
                    fontSize:
                      11,
                    fontWeight:
                      700,
                    boxShadow:
                      "0 16px 40px rgba(15,23,42,.12)",
                  }}
                />

                <Pie
                  data={
                    safeStatusData
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="22%"
                  outerRadius="48%"
                  paddingAngle={
                    3
                  }
                  stroke="var(--card)"
                  strokeWidth={
                    3
                  }
                  isAnimationActive
                  animationBegin={
                    100
                  }
                  animationDuration={
                    1100
                  }
                >
                  {safeStatusData.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          entry.color
                        }
                      />
                    )
                  )}
                </Pie>

                <Pie
                  data={
                    safeTypeData
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={
                    3
                  }
                  stroke="var(--card)"
                  strokeWidth={
                    3
                  }
                  isAnimationActive
                  animationBegin={
                    260
                  }
                  animationDuration={
                    1350
                  }
                >
                  {safeTypeData.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          entry.color
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.45,
              }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-2xl font-black tracking-[-0.04em]">
                  {
                    transactions.length
                  }
                </p>

                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Total
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-1">
            {typeData.map(
              (
                item,
                index
              ) => (
                <motion.div
                  key={
                    item.name
                  }
                  initial={{
                    opacity: 0,
                    x: 8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      0.25 +
                      index *
                        0.06,
                  }}
                  whileHover={{
                    x: 2,
                  }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/35 px-3 py-2.5 transition hover:border-violet-500/20 hover:bg-violet-500/[0.04]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <span className="truncate text-[8px] font-bold text-muted-foreground">
                      {
                        item.name
                      }
                    </span>
                  </span>

                  <span className="text-[9px] font-black">
                    {
                      item.value
                    }
                  </span>
                </motion.div>
              )
            )}
          </div>
        </div>
      </motion.article>
    </section>
  );
}

/* =========================================================
   CHART HEADER
========================================================= */

function ChartHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ElementType;
}) {
  return (
    <div className="relative flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
      <motion.span
        whileHover={{
          rotate: -5,
          scale: 1.05,
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-500/10 bg-violet-500/10 text-violet-600"
      >
        <Icon className="h-4 w-4" />
      </motion.span>

      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-600">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-sm font-black tracking-tight">
          {title}
        </h2>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER
========================================================= */

function FilterBar({
  search,
  status,
  type,
  filteredCount,
  totalCount,
  onSearch,
  onStatus,
  onType,
  onClear,
}: {
  search: string;
  status: StatusFilter;
  type: TypeFilter;
  filteredCount: number;
  totalCount: number;
  onSearch: (
    value: string
  ) => void;
  onStatus: (
    value: StatusFilter
  ) => void;
  onType: (
    value: TypeFilter
  ) => void;
  onClear: () => void;
}) {
  const hasFilters =
    Boolean(
      search.trim()
    ) ||
    status !== "ALL" ||
    type !== "ALL";

  return (
    <section className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Filter className="h-3.5 w-3.5" />
          </span>

          <div>
            <p className="text-[9px] font-black">
              Filter transactions
            </p>

            <p className="mt-0.5 text-[8px] text-muted-foreground">
              Search and narrow
              the unified
              ledger.
            </p>
          </div>
        </div>

        <motion.span
          layout
          className="w-fit rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[8px] font-black text-muted-foreground"
        >
          {filteredCount} of{" "}
          {totalCount} records
        </motion.span>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_210px_220px_auto]">
        <label className="group relative">
          <span className="sr-only">
            Search
            transactions
          </span>

          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-violet-600" />

          <input
            value={search}
            onChange={(
              event
            ) =>
              onSearch(
                event.target
                  .value
              )
            }
            placeholder="Search ID, reference, user, merchant or provider…"
            className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-[11px] font-semibold outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
          />

          <AnimatePresence>
            {search && (
              <motion.button
                type="button"
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                }}
                onClick={() =>
                  onSearch("")
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </label>

        <select
          value={status}
          onChange={(
            event
          ) =>
            onStatus(
              event.target
                .value as StatusFilter
            )
          }
          className="h-12 cursor-pointer rounded-2xl border border-border bg-background px-4 text-[10px] font-black outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
        >
          {STATUS_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <select
          value={type}
          onChange={(
            event
          ) =>
            onType(
              event.target
                .value as TypeFilter
            )
          }
          className="h-12 cursor-pointer rounded-2xl border border-border bg-background px-4 text-[10px] font-black outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
        >
          {TYPE_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <motion.button
          type="button"
          whileHover={
            hasFilters
              ? {
                  y: -1,
                }
              : undefined
          }
          whileTap={
            hasFilters
              ? {
                  scale:
                    0.97,
                }
              : undefined
          }
          onClick={onClear}
          disabled={
            !hasFilters
          }
          className="h-12 whitespace-nowrap rounded-2xl border border-border bg-muted/60 px-5 text-[10px] font-black transition hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </motion.button>
      </div>

      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
              <span className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Active:
              </span>

              {search.trim() && (
                <ActiveFilter
                  label={`Search: ${search.trim()}`}
                  onRemove={() =>
                    onSearch("")
                  }
                />
              )}

              {status !==
                "ALL" && (
                <ActiveFilter
                  label={
                    STATUS_META[
                      status
                    ].label
                  }
                  onRemove={() =>
                    onStatus(
                      "ALL"
                    )
                  }
                />
              )}

              {type !==
                "ALL" && (
                <ActiveFilter
                  label={
                    TYPE_META[
                      type
                    ].label
                  }
                  onRemove={() =>
                    onType(
                      "ALL"
                    )
                  }
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ActiveFilter({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
      }}
      type="button"
      onClick={
        onRemove
      }
      className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/15 bg-violet-500/[0.08] px-2.5 py-1 text-[8px] font-black text-violet-600 transition hover:bg-violet-500/[0.14]"
    >
      {label}
      <X className="h-2.5 w-2.5" />
    </motion.button>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TransactionTable({
  rows,
  filteredCount,
  page,
  totalPages,
  onPrevious,
  onNext,
  onOpen,
}: {
  rows: Transaction[];
  filteredCount: number;
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onOpen: (
    transaction: Transaction
  ) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-600">
            Unified
            transaction ledger
          </p>

          <h2 className="mt-1 text-base font-black tracking-tight">
            Transaction
            activity
          </h2>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[8px] font-black text-muted-foreground">
          <Sparkles className="h-3 w-3 text-violet-600" />
          Click a row for
          details
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <TableHead>
                Transaction
              </TableHead>

              <TableHead>
                From
              </TableHead>

              <TableHead>
                To
              </TableHead>

              <TableHead>
                Source
              </TableHead>

              <TableHead align="right">
                Amount
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Risk
              </TableHead>

              <TableHead>
                Date
              </TableHead>

              <TableHead align="right">
                Open
              </TableHead>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence
              mode="popLayout"
            >
              {rows.map(
                (
                  transaction,
                  index
                ) => (
                  <motion.tr
                    layout
                    key={`${transaction.source || "ledger"}-${transaction._id}`}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -6,
                    }}
                    transition={{
                      delay:
                        index *
                        0.025,
                      duration: 0.3,
                    }}
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      onOpen(
                        transaction
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        onOpen(
                          transaction
                        );
                      }
                    }}
                    className="group cursor-pointer border-b border-border/80 outline-none transition-colors duration-200 last:border-b-0 hover:bg-violet-500/[0.045] focus-visible:bg-violet-500/[0.07]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TransactionIcon
                          type={
                            transaction.type
                          }
                        />

                        <div className="min-w-0">
                          <p className="max-w-[190px] truncate text-[10px] font-black transition-colors group-hover:text-violet-600">
                            {transaction.reference ||
                              typeLabel(
                                transaction.type
                              )}
                          </p>

                          <p className="mt-1 font-mono text-[8px] text-muted-foreground">
                            {shortId(
                              transaction.publicId ||
                                transaction._id
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <PartyCell
                        party={
                          transaction.senderId
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <PartyCell
                        party={
                          transaction.receiverId
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <SourceBadge
                        source={
                          transaction.source
                        }
                        type={
                          transaction.type
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <p
                        className={`whitespace-nowrap text-[12px] font-black tracking-tight ${
                          transaction.amount ===
                          null
                            ? "text-amber-600"
                            : ""
                        }`}
                      >
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </p>

                      {transaction.integrity ===
                        "UNREADABLE" && (
                        <p className="mt-1 whitespace-nowrap text-[7px] font-black uppercase tracking-wide text-amber-600">
                          Encryption
                          review
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          transaction.status
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <RiskBadge
                        risk={
                          transaction.riskScore ||
                          "LOW"
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-[9px] font-semibold text-muted-foreground">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:border-violet-500/30 group-hover:bg-violet-500/10 group-hover:text-violet-600">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </td>
                  </motion.tr>
                )
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {rows.length ===
          0 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="px-4 py-16 text-center"
          >
            <motion.div
              animate={{
                y: [
                  0,
                  -4,
                  0,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/60 text-muted-foreground"
            >
              <Search className="h-5 w-5" />
            </motion.div>

            <p className="mt-4 text-sm font-black">
              No transactions
              found
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              No ledger records
              match the current
              search and filters.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/[0.15] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[9px] font-medium text-muted-foreground">
          Showing{" "}
          <span className="font-black text-foreground">
            {filteredCount ===
            0
              ? 0
              : (page - 1) *
                  PAGE_SIZE +
                1}
          </span>
          {" – "}
          <span className="font-black text-foreground">
            {Math.min(
              page *
                PAGE_SIZE,
              filteredCount
            )}
          </span>{" "}
          of{" "}
          <span className="font-black text-foreground">
            {filteredCount}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <PageButton
            label="Previous page"
            disabled={
              page <= 1
            }
            onClick={
              onPrevious
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </PageButton>

          <motion.span
            key={`${page}-${totalPages}`}
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="min-w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-[9px] font-black"
          >
            {page} /{" "}
            {totalPages}
          </motion.span>

          <PageButton
            label="Next page"
            disabled={
              page >=
              totalPages
            }
            onClick={
              onNext
            }
          >
            <ChevronRight className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TABLE HELPERS
========================================================= */

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?:
    | "left"
    | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TransactionIcon({
  type,
}: {
  type: TransactionType;
}) {
  const config: Record<
    TransactionType,
    {
      icon: ElementType;
      className: string;
    }
  > = {
    TRANSFER: {
      icon: ArrowUpRight,
      className:
        "border-indigo-500/20 bg-indigo-500/10 text-indigo-600",
    },

    DEPOSIT: {
      icon: ArrowDownLeft,
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    },

    WITHDRAW: {
      icon: ArrowUpRight,
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-600",
    },

    PAYMENT: {
      icon: CreditCard,
      className:
        "border-violet-500/20 bg-violet-500/10 text-violet-600",
    },

    REFUND: {
      icon: RotateCcw,
      className:
        "border-pink-500/20 bg-pink-500/10 text-pink-600",
    },
  };

  const selected =
    config[type];

  const Icon =
    selected.icon;

  return (
    <motion.div
      whileHover={{
        scale: 1.06,
        rotate: -3,
      }}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-shadow group-hover:shadow-md ${selected.className}`}
    >
      <Icon className="h-4 w-4" />
    </motion.div>
  );
}

function PartyCell({
  party,
}: {
  party:
    | string
    | TransactionUser;
}) {
  return (
    <div className="min-w-0">
      <p className="max-w-[175px] truncate text-[10px] font-black">
        {getPartyName(
          party
        )}
      </p>

      <p className="mt-1 max-w-[175px] truncate text-[8px] text-muted-foreground">
        {getPartyDetail(
          party
        ) ||
          shortId(
            getPartyId(
              party
            )
          )}
      </p>
    </div>
  );
}

function SourceBadge({
  source,
  type,
}: {
  source?:
    | Transaction["source"];
  type: TransactionType;
}) {
  const label =
    source ===
    "ADD_MONEY"
      ? "Add money"
      : source ===
          "MERCHANT_PAYMENT"
        ? "Merchant"
        : source ===
            "MERCHANT_REFUND"
          ? "Refund"
          : typeLabel(
              type
            );

  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-2.5 py-1.5 text-[8px] font-black text-violet-600">
      {label}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const classes: Record<
    TransactionStatus,
    string
  > = {
    COMPLETED:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",

    PENDING:
      "border-amber-500/20 bg-amber-500/10 text-amber-600",

    FAILED:
      "border-rose-500/20 bg-rose-500/10 text-rose-600",

    CANCELLED:
      "border-slate-500/20 bg-slate-500/10 text-slate-600",
  };

  const icons: Record<
    TransactionStatus,
    ElementType
  > = {
    COMPLETED:
      CheckCircle2,
    PENDING: Clock3,
    FAILED: XCircle,
    CANCELLED: X,
  };

  const Icon =
    icons[status];

  return (
    <span
      className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black ${classes[status]}`}
    >
      {status ===
        "PENDING" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}

      {status !==
        "PENDING" && (
        <Icon className="h-3 w-3" />
      )}

      {
        STATUS_META[
          status
        ].label
      }
    </span>
  );
}

function RiskBadge({
  risk,
}: {
  risk: string;
}) {
  const normalized =
    risk.toUpperCase();

  const className =
    normalized ===
    "HIGH"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
      : normalized ===
          "MEDIUM"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black ${className}`}
    >
      <ShieldAlert className="h-3 w-3" />
      {normalized}
    </span>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={
        !disabled
          ? {
              y: -1,
              scale: 1.03,
            }
          : undefined
      }
      whileTap={
        !disabled
          ? {
              scale: 0.95,
            }
          : undefined
      }
      aria-label={
        label
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}

/* =========================================================
   TRANSACTION DRAWER
========================================================= */

function TransactionDrawer({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  return (
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
        duration: 0.22,
      }}
      onMouseDown={
        onClose
      }
      className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[6px]"
    >
      <motion.aside
        initial={{
          x: "100%",
          opacity: 0.8,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        exit={{
          x: "100%",
          opacity: 0.8,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 32,
          mass: 0.85,
        }}
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
        className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l border-border bg-background shadow-[0_0_80px_rgba(0,0,0,.24)]"
      >
        {/* HEADER */}
        <div className="relative overflow-hidden border-b border-border bg-card p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.07] blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <TransactionIcon
                type={
                  transaction.type
                }
              />

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-600">
                  Transaction
                  details
                </p>

                <h2 className="mt-1 truncate text-xl font-black tracking-tight">
                  {transaction.reference ||
                    typeLabel(
                      transaction.type
                    )}
                </h2>

                <p className="mt-1 truncate font-mono text-[8px] text-muted-foreground">
                  {transaction.publicId ||
                    transaction._id}
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{
                rotate: 5,
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.94,
              }}
              onClick={
                onClose
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/70 text-muted-foreground transition hover:bg-violet-500/10 hover:text-violet-600"
              aria-label="Close transaction details"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            <StatusBadge
              status={
                transaction.status
              }
            />

            <RiskBadge
              risk={
                transaction.riskScore ||
                "LOW"
              }
            />

            <SourceBadge
              source={
                transaction.source
              }
              type={
                transaction.type
              }
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:space-y-5 sm:p-6">
          {/* AMOUNT */}
          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="relative overflow-hidden rounded-[24px] border border-violet-500/20 bg-violet-500/[0.08] p-5"
          >
            <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-600">
                    Transaction
                    amount
                  </p>

                  <p
                    className={`mt-2 text-3xl font-black tracking-[-0.045em] ${
                      transaction.amount ===
                      null
                        ? "text-amber-600"
                        : ""
                    }`}
                  >
                    {formatCurrency(
                      transaction.amount,
                      transaction.currency
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/15 bg-background/70 text-violet-600 shadow-sm backdrop-blur">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
              </div>

              {transaction.integrity ===
                "UNREADABLE" && (
                <div className="mt-4 flex gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[9px] leading-5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    This legacy
                    amount could
                    not be
                    authenticated.
                    It is excluded
                    from financial
                    totals.
                  </span>
                </div>
              )}
            </div>
          </motion.section>

          <AnimatedDrawerSection
            delay={0.12}
          >
            <DrawerSection
              icon={UserRound}
              title="Parties"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <PartyCard
                  label="From"
                  party={
                    transaction.senderId
                  }
                />

                <PartyCard
                  label="To"
                  party={
                    transaction.receiverId
                  }
                />
              </div>
            </DrawerSection>
          </AnimatedDrawerSection>

          <AnimatedDrawerSection
            delay={0.16}
          >
            <DrawerSection
              icon={Hash}
              title="Identifiers"
            >
              <CopyField
                label="Public transaction ID"
                value={
                  transaction.publicId ||
                  transaction._id
                }
              />

              <div className="mt-3">
                <CopyField
                  label="Reference"
                  value={
                    transaction.reference ||
                    "No reference"
                  }
                />
              </div>
            </DrawerSection>
          </AnimatedDrawerSection>

          <AnimatedDrawerSection
            delay={0.2}
          >
            <DrawerSection
              icon={
                WalletCards
              }
              title="Ledger information"
            >
              <div className="grid grid-cols-2 gap-3">
                <MiniInfo
                  label="Type"
                  value={typeLabel(
                    transaction.type
                  )}
                />

                <MiniInfo
                  label="Source"
                  value={
                    transaction.source ||
                    "WALLET"
                  }
                />

                <MiniInfo
                  label="Currency"
                  value={
                    transaction.currency
                  }
                />

                <MiniInfo
                  label="Mode"
                  value={
                    transaction.mode ||
                    "—"
                  }
                />

                {transaction.provider && (
                  <MiniInfo
                    label="Provider"
                    value={
                      transaction.provider
                    }
                  />
                )}

                <MiniInfo
                  label="Integrity"
                  value={
                    transaction.integrity ||
                    "VERIFIED"
                  }
                />
              </div>
            </DrawerSection>
          </AnimatedDrawerSection>

          <AnimatedDrawerSection
            delay={0.24}
          >
            <DrawerSection
              icon={
                CalendarDays
              }
              title="Timeline"
            >
              <MiniInfo
                label="Created"
                value={formatDate(
                  transaction.createdAt
                )}
              />

              <div className="mt-3">
                <MiniInfo
                  label="Last updated"
                  value={formatDate(
                    transaction.updatedAt
                  )}
                />
              </div>
            </DrawerSection>
          </AnimatedDrawerSection>
        </div>

        {/* FOOTER */}
        <div className="border-t border-border bg-card/95 p-5 backdrop-blur-xl">
          <motion.button
            type="button"
            whileHover={{
              y: -1,
            }}
            whileTap={{
              scale: 0.985,
            }}
            onClick={
              onClose
            }
            className="h-11 w-full rounded-2xl bg-violet-600 text-[10px] font-black text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-700"
          >
            Done
          </motion.button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function AnimatedDrawerSection({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
        duration: 0.38,
      }}
    >
      {children}
    </motion.div>
  );
}

function DrawerSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/10 text-violet-600">
          <Icon className="h-4 w-4" />
        </span>

        <h3 className="text-[12px] font-black">
          {title}
        </h3>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function PartyCard({
  label,
  party,
}: {
  label: string;
  party:
    | string
    | TransactionUser;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-border bg-muted/35 p-4 transition hover:border-violet-500/15 hover:bg-violet-500/[0.035]"
    >
      <p className="text-[7px] font-black uppercase tracking-[0.13em] text-violet-600">
        {label}
      </p>

      <p className="mt-2 truncate text-[10px] font-black">
        {getPartyName(
          party
        )}
      </p>

      <p className="mt-1 truncate text-[8px] text-muted-foreground">
        {getPartyDetail(
          party
        ) ||
          getPartyId(
            party
          )}
      </p>
    </motion.div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/35 p-3 transition hover:bg-muted/55">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-[9px] font-black">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   COPY FIELD
========================================================= */

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  async function copy() {
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
        1400
      );
    } catch {
      setCopied(
        false
      );
    }
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/35 p-3 transition hover:border-violet-500/15 hover:bg-muted/50">
      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate font-mono text-[8px] font-bold">
          {value}
        </p>
      </div>

      <motion.button
        type="button"
        whileHover={{
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.92,
        }}
        aria-label={`Copy ${label}`}
        onClick={() =>
          void copy()
        }
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
          copied
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
            : "border-border bg-card text-violet-600 hover:border-violet-500/20 hover:bg-violet-500/10"
        }`}
      >
        <AnimatePresence
          mode="wait"
        >
          {copied ? (
            <motion.span
              key="done"
              initial={{
                opacity: 0,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.7,
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{
                opacity: 0,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.7,
              }}
            >
              <Copy className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}