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
  Copy,
  CreditCard,
  Download,
  Eye,
  Filter,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
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

interface UserRef {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

type TransactionDirection =
  | "IN"
  | "OUT";

interface Transaction {
  _id: string;

  senderId:
    | string
    | UserRef;

  receiverId:
    | string
    | UserRef;

  counterparty?:
    | string
    | UserRef
    | null;

  direction?:
    TransactionDirection;

  amount: number;

  currency: string;

  type: TransactionType;

  status: TransactionStatus;

  reference?: string;

  createdAt?: string;

  updatedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: Transaction[];
}

interface TransactionDetailsResponse {
  success: boolean;
  transaction: Transaction;
  message?: string;
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

  const [
    loadingTransactionId,
    setLoadingTransactionId,
  ] = useState<string | null>(null);

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
     LOAD SINGLE TRANSACTION DETAILS
     GET /api/transactions/:id
  ========================================================== */

  const openTransactionDetails =
    useCallback(
      async (
        transactionId: string
      ) => {
        try {
          setLoadingTransactionId(
            transactionId
          );

          setErrorMessage("");

          const data =
            await apiClient<TransactionDetailsResponse>(
              `/transactions/${encodeURIComponent(
                transactionId
              )}`
            );

          if (
            !data ||
            data.success !== true ||
            !data.transaction
          ) {
            throw new Error(
              data?.message ||
                "Failed to load transaction details."
            );
          }

          setSelectedTransaction(
            data.transaction
          );
        } catch (error: unknown) {
          console.error(
            "Transaction details loading error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load transaction details."
          );
        } finally {
          setLoadingTransactionId(
            null
          );
        }
      },
      []
    );

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
                  loading={
                    loadingTransactionId ===
                    item.id
                  }
                  onView={() =>
                    void openTransactionDetails(
                      item.id
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
  loading,
}: {
  item: TransactionView;
  onView: () => void;
  loading: boolean;
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
          disabled={loading}
          className="inline-flex h-10 min-w-[104px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}

          <span className="hidden sm:inline">
            {loading
              ? "Loading..."
              : "Details"}
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

  const direction =
    transaction.direction ||
    (isDeposit
      ? "IN"
      : "OUT");

  const isCredit =
    direction === "IN";

  let title =
    "Transaction";

  let subtitle =
    "Wallet activity";

  let icon =
    isCredit
      ? ArrowDownLeft
      : ArrowUpRight;

  let iconClass =
    isCredit
      ? "bg-emerald-50 text-emerald-600"
      : "bg-blue-50 text-blue-600";

  let amountClass =
    isCredit
      ? "text-emerald-600"
      : "text-slate-900";

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
    const counterparty =
      transaction.counterparty ||
      (
        direction === "IN"
          ? transaction.senderId
          : transaction.receiverId
      );

    const counterpartyName =
      getUserName(
        counterparty
      );

    title =
      direction === "IN"
        ? `Received from ${counterpartyName}`
        : `Sent to ${counterpartyName}`;

    subtitle =
      transaction.reference
        ? `Reference: ${transaction.reference}`
        : "Peer-to-peer transfer";

    icon =
      direction === "IN"
        ? ArrowDownLeft
        : ArrowUpRight;

    iconClass =
      direction === "IN"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-blue-50 text-blue-600";

    amountClass =
      direction === "IN"
        ? "text-emerald-600"
        : "text-slate-900";
  }

  return {
    id:
      transaction._id,

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
  const [
    copied,
    setCopied,
  ] = useState(false);

  const typeLabel =
    transaction.type ===
    "TRANSFER"
      ? "Transfer"
      : transaction.type ===
        "DEPOSIT"
      ? "Deposit"
      : "Withdrawal";

  const direction =
    transaction.direction ||
    (
      transaction.type === "DEPOSIT"
        ? "IN"
        : "OUT"
    );

  const counterparty =
    transaction.counterparty ||
    (
      transaction.type === "TRANSFER"
        ? direction === "IN"
          ? transaction.senderId
          : transaction.receiverId
        : null
    );

  const receiptNumber =
    `COFFER-${transaction._id
      .slice(-10)
      .toUpperCase()}`;

  const handleCopyId =
    async () => {
      try {
        await navigator.clipboard.writeText(
          transaction._id
        );

        setCopied(
          true
        );

        window.setTimeout(
          () =>
            setCopied(
              false
            ),
          1600
        );
      } catch (error) {
        console.error(
          "Copy transaction ID failed:",
          error
        );
      }
    };

  const handlePrint =
    () => {
      const printWindow =
        window.open(
          "",
          "_blank",
          "width=760,height=900"
        );

      if (!printWindow) {
        return;
      }

      printWindow.document.open();

      printWindow.document.write(
        buildReceiptHtml(
          transaction,
          receiptNumber
        )
      );

      printWindow.document.close();

      printWindow.focus();

      window.setTimeout(
        () => {
          printWindow.print();
        },
        250
      );
    };

  const handleDownload =
    () => {
      const html =
        buildReceiptHtml(
          transaction,
          receiptNumber
        );

      const blob =
        new Blob(
          [html],
          {
            type:
              "text/html;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        `coffer-receipt-${transaction._id}.html`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url
      );
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close transaction receipt"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[590px] overflow-y-auto rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        {/* RECEIPT HEADER */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(135deg,#F8FCFF_0%,#FFFFFF_58%,#F1F8FE_100%)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-400/10 blur-[70px]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#123E67] text-white shadow-[0_10px_25px_rgba(18,62,103,0.18)]">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2B78BA]">
                  Coffer receipt
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-[#17344D]">
                  Transaction Receipt
                </h2>

                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {receiptNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          {/* AMOUNT */}
          <div className="rounded-[24px] border border-[#E4ECF3] bg-[#F8FBFD] p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[13px] bg-white text-[#1F5EA8] shadow-sm">
              {direction === "IN" ? (
                <ArrowDownLeft className="h-4.5 w-4.5" />
              ) : (
                <ArrowUpRight className="h-4.5 w-4.5" />
              )}
            </div>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {direction === "IN"
                ? "Money received"
                : "Money sent"}
            </p>

            <p className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#17344D] sm:text-4xl">
              {formatCurrency(
                transaction.amount
              )}
            </p>

            <div className="mt-4 flex justify-center">
              <StatusBadge
                status={
                  transaction.status
                }
              />
            </div>
          </div>

          {/* VERIFIED RECEIPT */}
          <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

            <div>
              <p className="text-[11px] font-extrabold text-emerald-800">
                Secure transaction record
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-emerald-700/75">
                Receipt details are loaded from your authenticated transaction record.
              </p>
            </div>
          </div>

          {/* DETAILS */}
          <div className="mt-6 space-y-4">
            <DetailRow
              label="Transaction ID"
              value={
                transaction._id
              }
            />

            <DetailRow
              label="Type"
              value={
                typeLabel
              }
            />

            <DetailRow
              label="Direction"
              value={
                direction === "IN"
                  ? "Incoming"
                  : "Outgoing"
              }
            />

            <DetailRow
              label="Currency"
              value={
                transaction.currency
              }
            />

            {transaction.type ===
              "TRANSFER" &&
              counterparty && (
                <DetailRow
                  label="Counterparty"
                  value={getUserDisplay(
                    counterparty
                  )}
                />
              )}

            <DetailRow
              label="Reference"
              value={
                transaction.reference ||
                "No reference"
              }
            />

            <DetailRow
              label="Date & Time"
              value={formatDate(
                transaction.createdAt
              )}
            />

            {transaction.updatedAt && (
              <DetailRow
                label="Last Updated"
                value={formatDate(
                  transaction.updatedAt
                )}
              />
            )}
          </div>

          {/* ID COPY */}
          <button
            type="button"
            onClick={() =>
              void handleCopyId()
            }
            className="mt-5 flex w-full items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Transaction identifier
              </p>

              <p className="mt-1 truncate text-[11px] font-bold text-slate-700">
                {transaction._id}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </div>
          </button>

          {/* ACTIONS */}
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#173F63] px-4 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(23,63,99,0.16)] transition hover:bg-[#103553]"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8]"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
          </div>

          <p className="mt-4 text-center text-[9px] leading-4 text-slate-400">
            Use “Print / Save PDF” to save a PDF copy from your browser.
          </p>
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
   RECEIPT HELPERS
========================================================= */

function escapeHtml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function buildReceiptHtml(
  transaction: Transaction,
  receiptNumber: string
): string {
  const typeLabel =
    transaction.type ===
    "TRANSFER"
      ? "Transfer"
      : transaction.type ===
        "DEPOSIT"
      ? "Deposit"
      : "Withdrawal";

  const direction =
    transaction.direction ||
    (
      transaction.type === "DEPOSIT"
        ? "IN"
        : "OUT"
    );

  const counterparty =
    transaction.counterparty ||
    (
      transaction.type === "TRANSFER"
        ? direction === "IN"
          ? transaction.senderId
          : transaction.receiverId
        : null
    );

  const counterpartyText =
    counterparty
      ? getUserDisplay(
          counterparty
        )
      : "N/A";

  const rows = [
    [
      "Receipt No.",
      receiptNumber,
    ],
    [
      "Transaction ID",
      transaction._id,
    ],
    [
      "Type",
      typeLabel,
    ],
    [
      "Direction",
      direction === "IN"
        ? "Incoming"
        : "Outgoing",
    ],
    [
      "Amount",
      formatCurrency(
        transaction.amount
      ),
    ],
    [
      "Currency",
      transaction.currency,
    ],
    ...(transaction.type === "TRANSFER"
      ? [
          [
            "Counterparty",
            counterpartyText,
          ],
        ]
      : []),
    [
      "Reference",
      transaction.reference ||
        "No reference",
    ],
    [
      "Status",
      transaction.status,
    ],
    [
      "Date & Time",
      formatDate(
        transaction.createdAt
      ),
    ],
  ];

  const rowHtml =
    rows
      .map(
        ([label, value]) =>
          `<tr>
            <td>${escapeHtml(
              String(label)
            )}</td>
            <td>${escapeHtml(
              String(value)
            )}</td>
          </tr>`
      )
      .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />
  <title>Coffer Receipt ${escapeHtml(
    receiptNumber
  )}</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 36px 20px;
      background: #f4f7fa;
      color: #17344d;
      font-family: Arial, Helvetica, sans-serif;
    }

    .receipt {
      max-width: 700px;
      margin: 0 auto;
      overflow: hidden;
      border: 1px solid #dde7ef;
      border-radius: 24px;
      background: #ffffff;
    }

    .header {
      padding: 28px 30px;
      border-bottom: 1px solid #e8eef3;
      background: #f8fbfd;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #2b78ba;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 26px;
      line-height: 1.2;
    }

    .receipt-no {
      margin-top: 8px;
      color: #7890a4;
      font-size: 12px;
      font-weight: 700;
    }

    .amount {
      margin: 24px 30px 0;
      padding: 24px;
      border: 1px solid #e3ebf1;
      border-radius: 18px;
      background: #f8fbfd;
      text-align: center;
    }

    .amount small {
      display: block;
      margin-bottom: 8px;
      color: #8194a5;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .12em;
    }

    .amount strong {
      font-size: 34px;
    }

    .status {
      display: inline-block;
      margin-top: 12px;
      padding: 7px 11px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .08em;
    }

    table {
      width: calc(100% - 60px);
      margin: 24px 30px;
      border-collapse: collapse;
    }

    td {
      padding: 13px 0;
      border-bottom: 1px solid #eef2f5;
      vertical-align: top;
      font-size: 12px;
    }

    td:first-child {
      width: 34%;
      color: #8494a4;
      font-weight: 700;
    }

    td:last-child {
      text-align: right;
      word-break: break-word;
      font-weight: 700;
    }

    .footer {
      margin: 0 30px 28px;
      padding-top: 2px;
      color: #8a9aaa;
      font-size: 10px;
      line-height: 1.6;
      text-align: center;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }

      .receipt {
        max-width: none;
        border: 0;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <main class="receipt">
    <header class="header">
      <p class="eyebrow">Coffer secure receipt</p>
      <h1>Transaction Receipt</h1>
      <div class="receipt-no">${escapeHtml(
        receiptNumber
      )}</div>
    </header>

    <section class="amount">
      <small>Transaction amount</small>
      <strong>${escapeHtml(
        formatCurrency(
          transaction.amount
        )
      )}</strong>
      <div class="status">${escapeHtml(
        transaction.status
      )}</div>
    </section>

    <table>
      <tbody>
        ${rowHtml}
      </tbody>
    </table>

    <footer class="footer">
      This receipt was generated from your authenticated Coffer transaction record.
      Sensitive account information is masked.
    </footer>
  </main>
</body>
</html>`;
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