"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Filter,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  WalletCards,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface TransactionUser {
  _id:
    string;
  name?:
    string;
  email?:
    string;
  phone?:
    string;
}

interface Transaction {
  _id:
    string;

  senderId:
    | string
    | TransactionUser;

  receiverId:
    | string
    | TransactionUser;

  amount:
    number;

  currency:
    string;

  type:
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW";

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED";

  reference?:
    string;

  riskScore:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  createdAt?:
    string;

  updatedAt?:
    string;
}

interface TransactionsResponse {
  success:
    boolean;
  count:
    number;
  transactions:
    Transaction[];
  message?:
    string;
}

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

type TypeFilter =
  | "ALL"
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW";

interface SelectOption<T extends string> {
  value:
    T;
  label:
    string;
  description:
    string;
  tone:
    "blue"
    | "emerald"
    | "amber"
    | "rose"
    | "violet"
    | "slate";
}

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS:
  SelectOption<StatusFilter>[] = [
  {
    value:
      "ALL",
    label:
      "All Status",
    description:
      "Show every transaction status",
    tone:
      "blue",
  },
  {
    value:
      "COMPLETED",
    label:
      "Completed",
    description:
      "Successful settled transactions",
    tone:
      "emerald",
  },
  {
    value:
      "PENDING",
    label:
      "Pending",
    description:
      "Transactions still processing",
    tone:
      "amber",
  },
  {
    value:
      "FAILED",
    label:
      "Failed",
    description:
      "Unsuccessful transactions",
    tone:
      "rose",
  },
];

const TYPE_OPTIONS:
  SelectOption<TypeFilter>[] = [
  {
    value:
      "ALL",
    label:
      "All Types",
    description:
      "Show every transaction type",
    tone:
      "blue",
  },
  {
    value:
      "TRANSFER",
    label:
      "Transfer",
    description:
      "Wallet-to-wallet transfers",
    tone:
      "violet",
  },
  {
    value:
      "DEPOSIT",
    label:
      "Deposit",
    description:
      "Incoming wallet deposits",
    tone:
      "emerald",
  },
  {
    value:
      "WITHDRAW",
    label:
      "Withdraw",
    description:
      "Outgoing cash withdrawals",
    tone:
      "amber",
  },
];

const TONE_CLASSES = {
  blue: {
    soft:
      "bg-blue-50",
    border:
      "border-blue-100",
    text:
      "text-blue-700",
    dot:
      "bg-blue-500",
  },
  emerald: {
    soft:
      "bg-emerald-50",
    border:
      "border-emerald-100",
    text:
      "text-emerald-700",
    dot:
      "bg-emerald-500",
  },
  amber: {
    soft:
      "bg-amber-50",
    border:
      "border-amber-100",
    text:
      "text-amber-700",
    dot:
      "bg-amber-500",
  },
  rose: {
    soft:
      "bg-rose-50",
    border:
      "border-rose-100",
    text:
      "text-rose-700",
    dot:
      "bg-rose-500",
  },
  violet: {
    soft:
      "bg-violet-50",
    border:
      "border-violet-100",
    text:
      "text-violet-700",
    dot:
      "bg-violet-500",
  },
  slate: {
    soft:
      "bg-slate-50",
    border:
      "border-slate-200",
    text:
      "text-slate-700",
    dot:
      "bg-slate-400",
  },
} as const;

/* =========================================================
   HELPERS
========================================================= */

function getUserName(
  value:
    | string
    | TransactionUser
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return (
    value.name ||
    value.email ||
    value._id
  );
}

function getUserEmail(
  value:
    | string
    | TransactionUser
) {
  if (
    typeof value ===
    "string"
  ) {
    return "";
  }

  return (
    value.email ||
    ""
  );
}

function getUserPhone(
  value:
    | string
    | TransactionUser
) {
  if (
    typeof value ===
    "string"
  ) {
    return "";
  }

  return (
    value.phone ||
    ""
  );
}

function getUserId(
  value:
    | string
    | TransactionUser
) {
  return typeof value ===
    "string"
    ? value
    : value._id;
}

function formatCurrency(
  amount:
    number,
  currency:
    string
) {
  return `${
    currency ===
    "BDT"
      ? "৳"
      : currency
  } ${amount.toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(
  value?:
    string
) {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

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
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

function shortId(
  value:
    string,
  start =
    8,
  end =
    5
) {
  if (
    value.length <=
    start +
      end +
      3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start
  )}...${value.slice(
    -end
  )}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AllTransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] =
    useState<
      Transaction[]
    >(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "ALL"
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "ALL"
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    errorMessage,
    setErrorMessage,
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
    selectedTransaction,
    setSelectedTransaction,
  ] =
    useState<Transaction | null>(
      null
    );

  const pageSize =
    10;

  const loadTransactions =
    async (
      showFullLoader =
        true
    ) => {
      try {
        if (
          showFullLoader
        ) {
          setLoading(
            true
          );
        } else {
          setRefreshing(
            true
          );
        }

        setErrorMessage(
          ""
        );

        const data =
          await apiClient<TransactionsResponse>(
            "/admin/transactions"
          );

        if (
          !data ||
          data.success !==
            true
        ) {
          throw new Error(
            data?.message ||
              "Failed to load all transactions."
          );
        }

        setTransactions(
          Array.isArray(
            data.transactions
          )
            ? data.transactions
            : []
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "ADMIN ALL TRANSACTIONS ERROR:",
          error
        );

        setErrorMessage(
          error instanceof
            Error
            ? error.message
            : "Failed to load all transactions."
        );
      } finally {
        setLoading(
          false
        );

        setRefreshing(
          false
        );
      }
    };

  useEffect(
    () => {
      void loadTransactions(
        true
      );
    },
    []
  );

  useEffect(
    () => {
      const onKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setSelectedTransaction(
              null
            );
          }
        };

      window.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    []
  );

  const filteredTransactions =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return transactions.filter(
          (
            transaction
          ) => {
            const sender =
              getUserName(
                transaction.senderId
              ).toLowerCase();

            const receiver =
              getUserName(
                transaction.receiverId
              ).toLowerCase();

            const reference =
              transaction.reference
                ?.toLowerCase() ||
              "";

            const id =
              transaction._id.toLowerCase();

            const matchesSearch =
              !query ||
              sender.includes(
                query
              ) ||
              receiver.includes(
                query
              ) ||
              reference.includes(
                query
              ) ||
              id.includes(
                query
              );

            const matchesStatus =
              statusFilter ===
                "ALL" ||
              transaction.status ===
                statusFilter;

            const matchesType =
              typeFilter ===
                "ALL" ||
              transaction.type ===
                typeFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            );
          }
        );
      },
      [
        transactions,
        search,
        statusFilter,
        typeFilter,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTransactions.length /
          pageSize
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const paginatedTransactions =
    filteredTransactions.slice(
      (
        safePage -
        1
      ) *
        pageSize,
      safePage *
        pageSize
    );

  useEffect(
    () => {
      setPage(
        1
      );
    },
    [
      search,
      statusFilter,
      typeFilter,
    ]
  );

  const stats =
    useMemo(
      () => {
        const completed =
          transactions.filter(
            (
              item
            ) =>
              item.status ===
              "COMPLETED"
          );

        const pending =
          transactions.filter(
            (
              item
            ) =>
              item.status ===
              "PENDING"
          );

        const failed =
          transactions.filter(
            (
              item
            ) =>
              item.status ===
              "FAILED"
          );

        const volume =
          completed.reduce(
            (
              total,
              item
            ) =>
              total +
              item.amount,
            0
          );

        const completionRate =
          transactions.length >
          0
            ? (
                completed.length /
                transactions.length
              ) *
              100
            : 0;

        return {
          total:
            transactions.length,
          completed:
            completed.length,
          pending:
            pending.length,
          failed:
            failed.length,
          volume,
          completionRate,
        };
      },
      [
        transactions,
      ]
    );

  const activeFilters =
    [
      statusFilter !==
      "ALL",
      typeFilter !==
      "ALL",
      Boolean(
        search.trim()
      ),
    ].filter(
      Boolean
    ).length;

  const refreshTransactions =
    async () => {
      await loadTransactions(
        false
      );
    };

  if (
    loading
  ) {
    return (
      <TransactionLoadingState />
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F7FB] pb-12">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <AdminHero
          refreshing={
            refreshing
          }
          total={
            stats.total
          }
          onRefresh={() =>
            void refreshTransactions()
          }
        />

        <AnimatePresence>
          {errorMessage && (
            <motion.section
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
              className="rounded-[22px] border border-rose-100 bg-rose-50/80 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                    <XCircle className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[11px] font-black text-rose-800">
                      Could not load transactions
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-rose-600">
                      {
                        errorMessage
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadTransactions(
                      true
                    )
                  }
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <StatsGrid
          stats={
            stats
          }
        />

        <FilterBar
          search={
            search
          }
          onSearchChange={
            setSearch
          }
          statusFilter={
            statusFilter
          }
          onStatusChange={
            setStatusFilter
          }
          typeFilter={
            typeFilter
          }
          onTypeChange={
            setTypeFilter
          }
          activeFilters={
            activeFilters
          }
          onClear={() => {
            setSearch(
              ""
            );

            setStatusFilter(
              "ALL"
            );

            setTypeFilter(
              "ALL"
            );
          }}
        />

        <TransactionTable
          rows={
            paginatedTransactions
          }
          filteredCount={
            filteredTransactions.length
          }
          safePage={
            safePage
          }
          totalPages={
            totalPages
          }
          pageSize={
            pageSize
          }
          onPrevious={() =>
            setPage(
              (
                current
              ) =>
                Math.max(
                  1,
                  current -
                    1
                )
            )
          }
          onNext={() =>
            setPage(
              (
                current
              ) =>
                Math.min(
                  totalPages,
                  current +
                    1
                )
            )
          }
          onOpenTransaction={
            setSelectedTransaction
          }
        />
      </div>

      <AnimatePresence>
        {selectedTransaction && (
          <TransactionDrawer
            transaction={
              selectedTransaction
            }
            onClose={() =>
              setSelectedTransaction(
                null
              )
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   LOADING
========================================================= */

function TransactionLoadingState() {
  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-[#F3F7FB] px-4">
      <motion.div
        initial={{
          opacity:
            0,
          scale:
            0.96,
        }}
        animate={{
          opacity:
            1,
          scale:
            1,
        }}
        className="text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#0F2745,#1F5EA8)] text-white shadow-[0_18px_40px_rgba(15,39,69,0.22)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>

        <p className="mt-4 text-sm font-black text-[#0F2745]">
          Loading transactions
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Fetching secure platform transaction data...
        </p>
      </motion.div>
    </main>
  );
}

/* =========================================================
   HERO
========================================================= */

function AdminHero({
  refreshing,
  total,
  onRefresh,
}: {
  refreshing:
    boolean;
  total:
    number;
  onRefresh:
    () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity:
          0,
        y:
          -10,
      }}
      animate={{
        opacity:
          1,
        y:
          0,
      }}
      transition={{
        duration:
          0.5,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="relative overflow-hidden rounded-[32px] border border-[#163A5B] bg-[linear-gradient(135deg,#0D2947_0%,#113B61_52%,#174F78_100%)] p-6 text-white shadow-[0_22px_55px_rgba(15,39,69,0.18)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/55">
              Administrator
            </p>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live ledger
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-[34px]">
            All Transactions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/65">
            Monitor payment activity, transaction status, risk level and wallet flow from a single operational view.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <HeroPill
              icon={
                Activity
              }
              label={`${total.toLocaleString()} records`}
            />

            <HeroPill
              icon={
                ShieldAlert
              }
              label="Risk monitored"
            />

            <HeroPill
              icon={
                ArrowRight
              }
              label="Open row details"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={
            onRefresh
          }
          disabled={
            refreshing
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 text-[11px] font-black text-white shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {
            refreshing
              ? "Refreshing"
              : "Refresh Data"
          }
        </button>
      </div>
    </motion.section>
  );
}

function HeroPill({
  icon:
    Icon,
  label,
}: {
  icon:
    React.ElementType;
  label:
    string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1.5 text-[8px] font-black text-blue-100/65">
      <Icon className="h-3 w-3" />
      {
        label
      }
    </span>
  );
}

/* =========================================================
   STATS
========================================================= */

function StatsGrid({
  stats,
}: {
  stats: {
    total:
      number;
    completed:
      number;
    pending:
      number;
    failed:
      number;
    volume:
      number;
    completionRate:
      number;
  };
}) {
  const items = [
    {
      label:
        "Total Transactions",
      value:
        stats.total.toLocaleString(),
      helper:
        "All ledger records",
      icon:
        Activity,
      tone:
        "blue" as const,
      progress:
        100,
    },
    {
      label:
        "Completed",
      value:
        stats.completed.toLocaleString(),
      helper:
        `${stats.completionRate.toFixed(
          1
        )}% success rate`,
      icon:
        CheckCircle2,
      tone:
        "emerald" as const,
      progress:
        stats.completionRate,
    },
    {
      label:
        "Pending",
      value:
        stats.pending.toLocaleString(),
      helper:
        "Awaiting settlement",
      icon:
        Clock3,
      tone:
        "amber" as const,
      progress:
        stats.total >
        0
          ? (
              stats.pending /
              stats.total
            ) *
            100
          : 0,
    },
    {
      label:
        "Failed",
      value:
        stats.failed.toLocaleString(),
      helper:
        "Needs review",
      icon:
        XCircle,
      tone:
        "rose" as const,
      progress:
        stats.total >
        0
          ? (
              stats.failed /
              stats.total
            ) *
            100
          : 0,
    },
    {
      label:
        "Completed Volume",
      value:
        formatCurrency(
          stats.volume,
          "BDT"
        ),
      helper:
        "Settled transaction value",
      icon:
        CircleDollarSign,
      tone:
        "violet" as const,
      progress:
        stats.completed >
        0
          ? 100
          : 0,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(
        (
          item,
          index
        ) => (
          <StatCard
            key={
              item.label
            }
            {...item}
            index={
              index
            }
          />
        )
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon:
    Icon,
  tone,
  progress,
  index,
}: {
  label:
    string;
  value:
    string;
  helper:
    string;
  icon:
    React.ElementType;
  tone:
    keyof typeof TONE_CLASSES;
  progress:
    number;
  index:
    number;
}) {
  const selected =
    TONE_CLASSES[
      tone
    ];

  return (
    <motion.div
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
        duration:
          0.42,
        delay:
          index *
          0.045,
      }}
      whileHover={{
        y:
          -3,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-[#DCE7F0] bg-white p-4 shadow-[0_10px_28px_rgba(15,39,69,0.045)] transition hover:border-blue-100 hover:shadow-[0_16px_38px_rgba(15,39,69,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${selected.border} ${selected.soft} ${selected.text}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span
          className={`h-2 w-2 rounded-full ${selected.dot}`}
        />
      </div>

      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
        {
          label
        }
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-[#0F2745]">
        {
          value
        }
      </p>

      <p className="mt-1 truncate text-[8px] font-semibold text-slate-400">
        {
          helper
        }
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{
            width:
              0,
          }}
          animate={{
            width:
              `${Math.max(
                0,
                Math.min(
                  100,
                  progress
                )
              )}%`,
          }}
          transition={{
            duration:
              0.75,
            delay:
              0.1 +
              index *
                0.04,
          }}
          className={`h-full rounded-full ${selected.dot}`}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   FILTERS
========================================================= */

function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  activeFilters,
  onClear,
}: {
  search:
    string;
  onSearchChange:
    (
      value:
        string
    ) => void;
  statusFilter:
    StatusFilter;
  onStatusChange:
    (
      value:
        StatusFilter
    ) => void;
  typeFilter:
    TypeFilter;
  onTypeChange:
    (
      value:
        TypeFilter
    ) => void;
  activeFilters:
    number;
  onClear:
    () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity:
          0,
        y:
          10,
      }}
      animate={{
        opacity:
          1,
        y:
          0,
      }}
      className="relative z-20 overflow-visible rounded-[26px] border border-[#DCE7F0] bg-white p-4 shadow-[0_10px_32px_rgba(15,39,69,0.045)]"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
            Search Transactions
          </label>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                onSearchChange(
                  event.target
                    .value
                )
              }
              placeholder="Search user, transaction ID or reference..."
              className="h-12 w-full rounded-2xl border border-[#DCE7F0] bg-[#F8FBFD] pl-10 pr-4 text-xs font-semibold text-[#0F2745] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100/60"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
          <PremiumSelect
            label="Status"
            icon={
              Filter
            }
            value={
              statusFilter
            }
            options={
              STATUS_OPTIONS
            }
            onChange={
              onStatusChange
            }
          />

          <PremiumSelect
            label="Type"
            icon={
              WalletCards
            }
            value={
              typeFilter
            }
            options={
              TYPE_OPTIONS
            }
            onChange={
              onTypeChange
            }
          />
        </div>

        <AnimatePresence>
          {activeFilters >
            0 && (
            <motion.button
              type="button"
              initial={{
                opacity:
                  0,
                scale:
                  0.95,
              }}
              animate={{
                opacity:
                  1,
                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,
                scale:
                  0.95,
              }}
              onClick={
                onClear
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[9px] font-black text-slate-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="h-3.5 w-3.5" />
              Clear {
                activeFilters
              }
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function PremiumSelect<
  T extends string
>({
  label,
  icon:
    Icon,
  value,
  options,
  onChange,
}: {
  label:
    string;
  icon:
    React.ElementType;
  value:
    T;
  options:
    SelectOption<T>[];
  onChange:
    (
      value:
        T
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const selected =
    options.find(
      (
        item
      ) =>
        item.value ===
        value
    ) ??
    options[
      0
    ];

  const selectedTone =
    TONE_CLASSES[
      selected.tone
    ];

  return (
    <div
      className={`relative ${
        open
          ? "z-[80]"
          : "z-10"
      }`}
    >
      <label className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
        {
          label
        }
      </label>

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
        className={`group flex h-12 w-full items-center gap-2.5 rounded-[15px] border bg-white px-3 text-left shadow-[0_3px_12px_rgba(15,39,69,0.035)] outline-none transition duration-200 ${
          open
            ? "border-blue-300 ring-4 ring-blue-100/55"
            : "border-[#D8E4EE] hover:border-[#BCD2E5] hover:shadow-[0_7px_20px_rgba(15,39,69,0.07)]"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] ${selectedTone.soft} ${selectedTone.text}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
            {
              label
            }
          </span>

          <span className="mt-0.5 block truncate text-[10px] font-black text-[#174A7A]">
            {
              selected.label
            }
          </span>
        </span>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F8FB] text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              open
                ? "rotate-180"
                : ""
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label={`Close ${label} filter`}
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="fixed inset-0 z-[70] cursor-default"
            />

            <motion.div
              role="listbox"
              initial={{
                opacity:
                  0,
                y:
                  -7,
                scale:
                  0.985,
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
                  0.99,
              }}
              transition={{
                duration:
                  0.15,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="absolute left-0 top-[calc(100%+7px)] z-[90] w-full min-w-[220px] overflow-hidden rounded-[16px] border border-[#D8E4EE] bg-white p-1.5 shadow-[0_20px_55px_rgba(15,39,69,0.16)]"
            >
              <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
                <span className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Select {
                    label
                  }
                </span>

                <span className="text-[7px] font-bold text-slate-300">
                  {
                    options.length
                  } options
                </span>
              </div>

              <div className="space-y-0.5">
                {options.map(
                  (
                    option
                  ) => {
                    const tone =
                      TONE_CLASSES[
                        option.tone
                      ];

                    const active =
                      option.value ===
                      value;

                    return (
                      <motion.button
                        type="button"
                        role="option"
                        aria-selected={
                          active
                        }
                        key={
                          option.value
                        }
                        whileHover={{
                          x:
                            1,
                        }}
                        onClick={() => {
                          onChange(
                            option.value
                          );

                          setOpen(
                            false
                          );
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2.5 text-left transition ${
                          active
                            ? "bg-[#EEF6FF]"
                            : "hover:bg-[#F7FAFD]"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
                        />

                        <span
                          className={`min-w-0 flex-1 truncate text-[10px] font-black ${
                            active
                              ? "text-[#1259A7]"
                              : "text-[#174A7A]"
                          }`}
                        >
                          {
                            option.label
                          }
                        </span>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                            active
                              ? "bg-[#1F5EA8] text-white"
                              : "border border-slate-200 bg-white text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </motion.button>
                    );
                  }
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TransactionTable({
  rows,
  filteredCount,
  safePage,
  totalPages,
  pageSize,
  onPrevious,
  onNext,
  onOpenTransaction,
}: {
  rows:
    Transaction[];
  filteredCount:
    number;
  safePage:
    number;
  totalPages:
    number;
  pageSize:
    number;
  onPrevious:
    () => void;
  onNext:
    () => void;
  onOpenTransaction:
    (
      transaction:
        Transaction
    ) => void;
}) {
  return (
    <motion.section
      initial={{
        opacity:
          0,
        y:
          10,
      }}
      animate={{
        opacity:
          1,
        y:
          0,
      }}
      className="overflow-hidden rounded-[28px] border border-[#DCE7F0] bg-white shadow-[0_12px_36px_rgba(15,39,69,0.05)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#E7EEF4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#5B8BB7]">
            Transaction Ledger
          </p>

          <h2 className="mt-1 text-base font-black text-[#0F2745]">
            Transaction Activity
          </h2>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[8px] font-black text-slate-500">
          Row click opens details
        </span>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FBFD]">
              <TableHead>
                Transaction
              </TableHead>

              <TableHead>
                Sender
              </TableHead>

              <TableHead>
                Receiver
              </TableHead>

              <TableHead
                align="right"
              >
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

              <TableHead
                align="right"
              >
                Action
              </TableHead>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                transaction,
                index
              ) => {
                const sender =
                  getUserName(
                    transaction.senderId
                  );

                const receiver =
                  getUserName(
                    transaction.receiverId
                  );

                return (
                  <motion.tr
                    key={
                      transaction._id
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
                      duration:
                        0.3,
                      delay:
                        index *
                        0.025,
                    }}
                    tabIndex={
                      0
                    }
                    role="button"
                    onClick={() =>
                      onOpenTransaction(
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

                        onOpenTransaction(
                          transaction
                        );
                      }
                    }}
                    className="group cursor-pointer border-b border-slate-100 outline-none transition hover:bg-blue-50/35 focus-visible:bg-blue-50/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TransactionIcon
                          type={
                            transaction.type
                          }
                        />

                        <div className="min-w-0">
                          <p className="max-w-[210px] truncate text-[11px] font-black text-[#0F2745]">
                            {
                              transaction.reference ||
                              "No reference"
                            }
                          </p>

                          <p className="mt-0.5 font-mono text-[8px] text-slate-400">
                            {
                              shortId(
                                transaction._id
                              )
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <PersonCell
                        name={
                          sender
                        }
                        user={
                          transaction.senderId
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <PersonCell
                        name={
                          receiver
                        }
                        user={
                          transaction.receiverId
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <p className="text-[12px] font-black text-[#0F2745]">
                        {
                          formatCurrency(
                            transaction.amount,
                            transaction.currency
                          )
                        }
                      </p>

                      <p className="mt-0.5 text-[8px] font-semibold text-slate-400">
                        {
                          transaction.type
                        }
                      </p>
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
                          transaction.riskScore
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-[10px] font-semibold text-slate-500">
                        {
                          formatDate(
                            transaction.createdAt
                          )
                        }
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </td>
                  </motion.tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {rows.length ===
        0 && (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Search className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-black text-slate-800">
            No transactions found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try changing your search or filters.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] text-slate-400">
          Showing{" "}
          {
            filteredCount ===
            0
              ? 0
              : (
                  safePage -
                  1
                ) *
                  pageSize +
                1
          }{" "}
          –{" "}
          {
            Math.min(
              safePage *
                pageSize,
              filteredCount
            )
          }{" "}
          of{" "}
          {
            filteredCount
          }
        </p>

        <div className="flex items-center gap-2">
          <PaginationButton
            disabled={
              safePage <=
              1
            }
            onClick={
              onPrevious
            }
            label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          <span className="min-w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[9px] font-black text-slate-600">
            {
              safePage
            } / {
              totalPages
            }
          </span>

          <PaginationButton
            disabled={
              safePage >=
              totalPages
            }
            onClick={
              onNext
            }
            label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </motion.section>
  );
}

function TableHead({
  children,
  align =
    "left",
}: {
  children:
    React.ReactNode;
  align?:
    "left"
    | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {
        children
      }
    </th>
  );
}

function TransactionIcon({
  type,
}: {
  type:
    Transaction["type"];
}) {
  const config =
    type ===
    "DEPOSIT"
      ? {
          icon:
            ArrowDownLeft,
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-600",
        }
      : type ===
        "WITHDRAW"
        ? {
            icon:
              ArrowUpRight,
            className:
              "border-amber-100 bg-amber-50 text-amber-600",
          }
        : {
            icon:
              ArrowUpRight,
            className:
              "border-blue-100 bg-blue-50 text-blue-600",
          };

  const Icon =
    config.icon;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${config.className}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function PersonCell({
  name,
  user,
}: {
  name:
    string;
  user:
    | string
    | TransactionUser;
}) {
  const email =
    getUserEmail(
      user
    );

  return (
    <div className="min-w-0">
      <p className="max-w-[180px] truncate text-[10px] font-black text-slate-700">
        {
          name
        }
      </p>

      {email && (
        <p className="mt-0.5 max-w-[180px] truncate text-[8px] text-slate-400">
          {
            email
          }
        </p>
      )}
    </div>
  );
}

function PaginationButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled:
    boolean;
  onClick:
    () => void;
  label:
    string;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      aria-label={
        label
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {
        children
      }
    </button>
  );
}

/* =========================================================
   BADGES
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    Transaction["status"];
}) {
  const config =
    status ===
    "COMPLETED"
      ? {
          label:
            "Completed",
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
          icon:
            CheckCircle2,
        }
      : status ===
        "PENDING"
        ? {
            label:
              "Pending",
            className:
              "border-amber-100 bg-amber-50 text-amber-700",
            icon:
              Clock3,
          }
        : {
            label:
              "Failed",
            className:
              "border-rose-100 bg-rose-50 text-rose-700",
            icon:
              XCircle,
          };

  const Icon =
    config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {
        config.label
      }
    </span>
  );
}

function RiskBadge({
  risk,
}: {
  risk:
    Transaction["riskScore"];
}) {
  const config =
    risk ===
    "HIGH"
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : risk ===
        "MEDIUM"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black ${config}`}
    >
      <ShieldAlert className="h-3 w-3" />
      {
        risk
      }
    </span>
  );
}

/* =========================================================
   TRANSACTION DRAWER
========================================================= */

function TransactionDrawer({
  transaction,
  onClose,
}: {
  transaction:
    Transaction;
  onClose:
    () => void;
}) {
  const sender =
    transaction.senderId;

  const receiver =
    transaction.receiverId;

  return (
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
      className="fixed inset-0 z-[120] bg-[#071B30]/45 backdrop-blur-[3px]"
      onMouseDown={
        onClose
      }
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
            290,
          damping:
            30,
        }}
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
        className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-[#DCE7F0] bg-[#F7FAFD] shadow-[-24px_0_70px_rgba(7,27,48,0.22)]"
      >
        <div className="border-b border-[#DCE7F0] bg-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <TransactionIcon
                type={
                  transaction.type
                }
              />

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#5B8BB7]">
                  Transaction Details
                </p>

                <h2 className="mt-1 truncate text-xl font-black text-[#0F2745]">
                  {
                    transaction.reference ||
                    "Transaction Record"
                  }
                </h2>

                <p className="mt-1 font-mono text-[8px] text-slate-400">
                  {
                    transaction._id
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              status={
                transaction.status
              }
            />

            <RiskBadge
              risk={
                transaction.riskScore
              }
            />

            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[8px] font-black text-blue-700">
              <WalletCards className="h-3 w-3" />
              {
                transaction.type
              }
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#EFF7FF_0%,#FFFFFF_100%)] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-500">
              Transaction Amount
            </p>

            <motion.p
              initial={{
                opacity:
                  0,
                y:
                  5,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
              }}
              className="mt-2 text-3xl font-black tracking-tight text-[#0F2745]"
            >
              {
                formatCurrency(
                  transaction.amount,
                  transaction.currency
                )
              }
            </motion.p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <DrawerMiniStat
                label="Currency"
                value={
                  transaction.currency
                }
              />

              <DrawerMiniStat
                label="Type"
                value={
                  transaction.type
                }
              />
            </div>
          </section>

          <DrawerSection
            icon={
              UserRound
            }
            eyebrow="Parties"
            title="Sender & Receiver"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <PartyCard
                role="Sender"
                user={
                  sender
                }
                tone="blue"
              />

              <PartyCard
                role="Receiver"
                user={
                  receiver
                }
                tone="emerald"
              />
            </div>
          </DrawerSection>

          <DrawerSection
            icon={
              Hash
            }
            eyebrow="Identifiers"
            title="Reference & Transaction ID"
          >
            <CopyField
              label="Reference"
              value={
                transaction.reference ||
                "No reference"
              }
            />

            <div className="mt-3">
              <CopyField
                label="Transaction ID"
                value={
                  transaction._id
                }
              />
            </div>
          </DrawerSection>

          <DrawerSection
            icon={
              CalendarDays
            }
            eyebrow="Timeline"
            title="Transaction Timeline"
          >
            <TimelineItem
              label="Created"
              value={
                formatDate(
                  transaction.createdAt
                )
              }
              active
            />

            <TimelineItem
              label="Last Updated"
              value={
                formatDate(
                  transaction.updatedAt
                )
              }
            />

            <TimelineItem
              label="Current Status"
              value={
                transaction.status
              }
            />
          </DrawerSection>

          <DrawerSection
            icon={
              ShieldAlert
            }
            eyebrow="Risk Review"
            title="Transaction Risk"
          >
            <div className="rounded-[20px] border border-[#E2EAF1] bg-[#FAFCFE] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black text-[#174A7A]">
                    Risk classification
                  </p>

                  <p className="mt-1 text-[9px] leading-5 text-slate-500">
                    This value comes from the transaction record currently returned by the admin transactions API.
                  </p>
                </div>

                <RiskBadge
                  risk={
                    transaction.riskScore
                  }
                />
              </div>
            </div>
          </DrawerSection>
        </div>

        <div className="border-t border-[#DCE7F0] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={
              onClose
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#174A7A] text-[10px] font-black text-white transition hover:bg-[#0F2745]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Done
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function DrawerSection({
  icon:
    Icon,
  eyebrow,
  title,
  children,
}: {
  icon:
    React.ElementType;
  eyebrow:
    string;
  title:
    string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[24px] border border-[#DCE7F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,39,69,0.035)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
          <Icon className="h-4 w-4" />
        </span>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
            {
              eyebrow
            }
          </p>

          <h3 className="mt-0.5 text-[12px] font-black text-[#0F2745]">
            {
              title
            }
          </h3>
        </div>
      </div>

      <div className="mt-4">
        {
          children
        }
      </div>
    </section>
  );
}

function DrawerMiniStat({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="rounded-[16px] border border-white bg-white/85 p-3 shadow-sm">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-slate-400">
        {
          label
        }
      </p>

      <p className="mt-1 text-[10px] font-black text-[#174A7A]">
        {
          value
        }
      </p>
    </div>
  );
}

function PartyCard({
  role,
  user,
  tone,
}: {
  role:
    string;
  user:
    | string
    | TransactionUser;
  tone:
    "blue"
    | "emerald";
}) {
  const style =
    TONE_CLASSES[
      tone
    ];

  const name =
    getUserName(
      user
    );

  const email =
    getUserEmail(
      user
    );

  const phone =
    getUserPhone(
      user
    );

  const id =
    getUserId(
      user
    );

  return (
    <div
      className={`rounded-[20px] border p-4 ${style.border} ${style.soft}`}
    >
      <p
        className={`text-[7px] font-black uppercase tracking-[0.13em] ${style.text}`}
      >
        {
          role
        }
      </p>

      <p className="mt-2 truncate text-[11px] font-black text-[#0F2745]">
        {
          name
        }
      </p>

      {email && (
        <p className="mt-1 truncate text-[8px] text-slate-500">
          {
            email
          }
        </p>
      )}

      {phone && (
        <p className="mt-1 truncate text-[8px] text-slate-500">
          {
            phone
          }
        </p>
      )}

      <p className="mt-2 font-mono text-[7px] text-slate-400">
        {
          shortId(
            id,
            7,
            4
          )
        }
      </p>
    </div>
  );
}

function CopyField({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false
    );

  const copy =
    async () => {
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
          1200
        );
      } catch {
        setCopied(
          false
        );
      }
    };

  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#E2EAF1] bg-[#FAFCFE] p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[7px] font-black uppercase tracking-[0.11em] text-slate-400">
          {
            label
          }
        </p>

        <p className="mt-1 break-all font-mono text-[8px] leading-4 text-[#174A7A]">
          {
            value
          }
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          void copy()
        }
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
          copied
            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
            : "border-slate-200 bg-white text-slate-400 hover:text-blue-600"
        }`}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  active =
    false,
}: {
  label:
    string;
  value:
    string;
  active?:
    boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <div className="relative z-10 mt-1">
        <span
          className={`block h-2.5 w-2.5 rounded-full ${
            active
              ? "bg-blue-500"
              : "bg-slate-300"
          }`}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-500">
          {
            label
          }
        </p>

        <p className="mt-0.5 text-[9px] font-semibold text-[#174A7A]">
          {
            value
          }
        </p>
      </div>

      <span className="absolute bottom-0 left-[4px] top-3 w-px bg-slate-200 last:hidden" />
    </div>
  );
}
