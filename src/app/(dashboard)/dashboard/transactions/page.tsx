"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type TransactionType =
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW";

type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

type RiskScore =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

interface UserRef {
  _id: string;
  name?: string;
  email?: string;
}

interface Transaction {
  _id: string;

  senderId:
    | string
    | UserRef;

  receiverId:
    | string
    | UserRef;

  amount: number;

  currency: string;

  type: TransactionType;

  status: TransactionStatus;

  reference?: string;

  riskScore?: RiskScore;

  createdAt?: string;

  updatedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: Transaction[];
}

type TypeFilter =
  | "ALL"
  | TransactionType;

type StatusFilter =
  | "ALL"
  | TransactionStatus;

interface TransactionView {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  date: string;
  isCredit: boolean;
  icon: typeof ArrowDownLeft;
  iconClass: string;
  amountClass: string;
  transaction: Transaction;
}

/* =========================================================
   PAGE
========================================================= */

export default function TransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<TypeFilter>("ALL");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("ALL");

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<Transaction | null>(
    null
  );

  /* =========================================================
     LOAD TRANSACTIONS
  ========================================================== */

  const loadTransactions =
    useCallback(
      async (
        showFullLoader = true
      ) => {
        try {
          if (showFullLoader) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setErrorMessage("");

          const data =
            await apiClient<TransactionsResponse>(
              "/transactions"
            );

          if (
            !data ||
            data.success !== true
          ) {
            throw new Error(
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
        } catch (error) {
          console.error(
            "Transactions loading error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load transactions."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadTransactions(true);
  }, [loadTransactions]);

  /* =========================================================
     FILTER TRANSACTIONS
  ========================================================== */

  const filteredTransactions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return transactions.filter(
        (transaction) => {
          const senderName =
            getUserName(
              transaction.senderId
            ).toLowerCase();

          const receiverName =
            getUserName(
              transaction.receiverId
            ).toLowerCase();

          const reference =
            (
              transaction.reference ||
              ""
            ).toLowerCase();

          const type =
            transaction.type.toLowerCase();

          const matchesSearch =
            query.length === 0 ||
            senderName.includes(query) ||
            receiverName.includes(query) ||
            reference.includes(query) ||
            type.includes(query);

          const matchesType =
            typeFilter === "ALL" ||
            transaction.type ===
              typeFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            transaction.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      transactions,
      search,
      typeFilter,
      statusFilter,
    ]);

  /* =========================================================
     SUMMARY
  ========================================================== */

  const summary = useMemo(() => {
    const completed =
      transactions.filter(
        (transaction) =>
          transaction.status ===
          "COMPLETED"
      );

    const pending =
      transactions.filter(
        (transaction) =>
          transaction.status ===
          "PENDING"
      ).length;

    const failed =
      transactions.filter(
        (transaction) =>
          transaction.status ===
          "FAILED"
      ).length;

    const volume =
      completed.reduce(
        (
          total,
          transaction
        ) =>
          total +
          normalizeAmount(
            transaction.amount
          ),
        0
      );

    return {
      completed:
        completed.length,

      pending,

      failed,

      volume,
    };
  }, [transactions]);

  /* =========================================================
     VIEW MODEL
  ========================================================== */

  const transactionViews =
    useMemo(
      () =>
        filteredTransactions.map(
          (transaction) =>
            createTransactionView(
              transaction
            )
        ),
      [filteredTransactions]
    );

  /* =========================================================
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  const hasFilters =
    search.trim().length > 0 ||
    typeFilter !== "ALL" ||
    statusFilter !== "ALL";

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5EA8] text-white shadow-lg shadow-blue-500/20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">
              Loading transactions
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching your transaction history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <main className="space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
              <CreditCard className="h-3.5 w-3.5" />

              Wallet Activity
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Transactions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review your incoming and outgoing payments,
              transaction status, references, and activity history.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadTransactions(
                false
              )
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={
                refreshing
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-800">
                Could not load transactions
              </p>

              <p className="mt-1 text-xs text-red-600">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadTransactions(
                  true
                )
              }
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Completed"
          value={String(
            summary.completed
          )}
          subtitle="Successful transactions"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          title="Pending"
          value={String(
            summary.pending
          )}
          subtitle="Awaiting completion"
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          title="Failed"
          value={String(
            summary.failed
          )}
          subtitle="Unsuccessful transactions"
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
        />

        <SummaryCard
          title="Transaction Volume"
          value={formatCurrency(
            summary.volume
          )}
          subtitle="Completed activity"
          icon={CreditCard}
          iconClass="bg-blue-50 text-blue-600"
        />
      </section>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Filters
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Find a transaction
              </h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-[#1F5EA8] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            {/* SEARCH */}

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, reference or type..."
                aria-label="Search transactions"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* TYPE */}

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target
                      .value as TypeFilter
                  )
                }
                aria-label="Filter by type"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-xs font-bold text-slate-700 outline-none transition focus:border-[#1F5EA8] focus:bg-white sm:min-w-[150px]"
              >
                <option value="ALL">
                  All Types
                </option>

                <option value="TRANSFER">
                  Transfer
                </option>

                <option value="DEPOSIT">
                  Deposit
                </option>

                <option value="WITHDRAW">
                  Withdraw
                </option>
              </select>

              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            {/* STATUS */}

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                aria-label="Filter by status"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-xs font-bold text-slate-700 outline-none transition focus:border-[#1F5EA8] focus:bg-white sm:min-w-[150px]"
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="FAILED">
                  Failed
                </option>
              </select>

              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TRANSACTION LIST
      ====================================================== */}

      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                History
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Transaction History
              </h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
              {filteredTransactions.length} shown
            </span>
          </div>
        </div>

        {filteredTransactions.length ===
        0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {transactionViews.map(
              (item) => (
                <TransactionRow
                  key={item.id}
                  item={item}
                  onView={() =>
                    setSelectedTransaction(
                      item.transaction
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL
      ====================================================== */}

      {selectedTransaction && (
        <TransactionModal
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
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

function TransactionRow({
  item,
  onView,
}: {
  item: TransactionView;
  onView: () => void;
}) {
  const Icon =
    item.icon;

  return (
    <div className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {item.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />

              {item.date}
            </span>

            <span>
              {item.subtitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p
          className={`text-sm font-black ${item.amountClass}`}
        >
          {item.amount}
        </p>

        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8]"
        >
          <Eye className="h-4 w-4" />

          <span className="hidden sm:inline">
            Details
          </span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTION VIEW
========================================================= */

function createTransactionView(
  transaction: Transaction
): TransactionView {
  const isDeposit =
    transaction.type ===
    "DEPOSIT";

  const isWithdraw =
    transaction.type ===
    "WITHDRAW";

  const isTransfer =
    transaction.type ===
    "TRANSFER";

  const isCredit =
    isDeposit;

  let title =
    "Transaction";

  let subtitle =
    "Wallet activity";

  let icon =
    ArrowUpRight;

  let iconClass =
    "bg-blue-50 text-blue-600";

  let amountClass =
    "text-slate-900";

  if (isDeposit) {
    title =
      "Wallet Deposit";

    subtitle =
      transaction.reference
        ? `Reference: ${transaction.reference}`
        : "Funds added to wallet";

    icon =
      ArrowDownLeft;

    iconClass =
      "bg-emerald-50 text-emerald-600";

    amountClass =
      "text-emerald-600";
  }

  if (isWithdraw) {
    title =
      "Wallet Withdrawal";

    subtitle =
      transaction.reference
        ? `Reference: ${transaction.reference}`
        : "Funds withdrawn from wallet";

    icon =
      ArrowUpRight;

    iconClass =
      "bg-rose-50 text-rose-600";

    amountClass =
      "text-rose-600";
  }

  if (isTransfer) {
    title =
      `Transfer with ${getUserName(
        transaction.receiverId
      )}`;

    subtitle =
      transaction.reference
        ? `Reference: ${transaction.reference}`
        : "Peer-to-peer transfer";

    icon =
      ArrowUpRight;

    iconClass =
      "bg-blue-50 text-blue-600";

    amountClass =
      "text-slate-900";
  }

  return {
    id: transaction._id,

    title,

    subtitle,

    amount: `${
      isCredit
        ? "+ "
        : "- "
    }${formatCurrency(
      transaction.amount
    )}`,

    date:
      formatDate(
        transaction.createdAt
      ),

    isCredit,

    icon,

    iconClass,

    amountClass,

    transaction,
  };
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CreditCard className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-extrabold text-slate-900">
        {hasFilters
          ? "No matching transactions"
          : "No transactions yet"}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {hasFilters
          ? "Try changing your search or filters to find another transaction."
          : "Your transactions will appear here once you send, receive, deposit, or withdraw money."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17466F]"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   DETAIL MODAL
========================================================= */

function TransactionModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const typeLabel =
    transaction.type ===
    "TRANSFER"
      ? "Transfer"
      : transaction.type ===
        "DEPOSIT"
      ? "Deposit"
      : "Withdrawal";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close transaction details"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Transaction Details
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-slate-900">
              {typeLabel}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
          <p className="text-xs font-semibold text-slate-400">
            Amount
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {formatCurrency(
              transaction.amount
            )}
          </p>

          <div className="mt-3 flex justify-center">
            <StatusBadge
              status={
                transaction.status
              }
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <DetailRow
            label="Transaction ID"
            value={
              transaction._id
            }
          />

          <DetailRow
            label="Type"
            value={typeLabel}
          />

          <DetailRow
            label="Currency"
            value={
              transaction.currency
            }
          />

          <DetailRow
            label="Reference"
            value={
              transaction.reference ||
              "N/A"
            }
          />

          <DetailRow
            label="Risk Score"
            value={
              transaction.riskScore ||
              "LOW"
            }
          />

          <DetailRow
            label="Created"
            value={formatDate(
              transaction.createdAt
            )}
          />

          <DetailRow
            label="Sender"
            value={getUserDisplay(
              transaction.senderId
            )}
          />

          <DetailRow
            label="Receiver"
            value={getUserDisplay(
              transaction.receiverId
            )}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const config: Record<
    TransactionStatus,
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700",
    },

    COMPLETED: {
      label: "Completed",
      className:
        "bg-emerald-50 text-emerald-700",
    },

    FAILED: {
      label: "Failed",
      className:
        "bg-red-50 text-red-700",
    },
  };

  const current =
    config[status];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="shrink-0 text-xs font-semibold text-slate-400">
        {label}
      </span>

      <span className="max-w-[68%] break-all text-right text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   USER HELPERS
========================================================= */

function getUserName(
  user:
    | string
    | UserRef
): string {
  if (
    typeof user ===
      "object" &&
    user !== null
  ) {
    return (
      user.name ||
      user.email ||
      "User"
    );
  }

  return "User";
}

function getUserDisplay(
  user:
    | string
    | UserRef
): string {
  if (
    typeof user ===
    "object" &&
    user !== null
  ) {
    if (
      user.name &&
      user.email
    ) {
      return `${user.name} (${user.email})`;
    }

    return (
      user.name ||
      user.email ||
      user._id
    );
  }

  return user;
}

/* =========================================================
   NUMBER
========================================================= */

function normalizeAmount(
  amount: number
): number {
  const value =
    Number(amount);

  return Number.isFinite(
    value
  )
    ? Math.abs(value)
    : 0;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value?: string
): string {
  if (!value) {
    return "N/A";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "N/A";
  }

  return date.toLocaleString(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${normalizeAmount(
    amount
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}