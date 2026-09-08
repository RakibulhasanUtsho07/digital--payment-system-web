"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
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
    | TransactionDirection;

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
  icon: ElementType;
  iconClass: string;
  amountClass: string;
  transaction: Transaction;
}

/* =========================================================
   CONSTANTS
========================================================= */

const ITEMS_PER_PAGE = 8;

/* =========================================================
   PAGE
========================================================= */

export default function TransactionsPage() {
  /* =======================================================
     DATA
  ======================================================== */

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =======================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [typeOpen, setTypeOpen] =
    useState(false);

  const [statusOpen, setStatusOpen] =
    useState(false);

  const typeDropdownRef =
    useRef<HTMLDivElement | null>(null);

  const statusDropdownRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     PAGINATION
  ======================================================== */

  const [currentPage, setCurrentPage] =
    useState(1);

  /* =======================================================
     DETAILS
  ======================================================== */

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] =
    useState<Transaction | null>(null);

  const [
    loadingTransactionId,
    setLoadingTransactionId,
  ] =
    useState<string | null>(null);

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

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadTransactions(true);
  }, [loadTransactions]);

  /* =========================================================
     OUTSIDE CLICK
  ========================================================== */

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(
          target
        )
      ) {
        setTypeOpen(false);
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(
          target
        )
      ) {
        setStatusOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     TRANSACTION DETAILS
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
     FILTER
  ========================================================== */

  const filteredTransactions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return transactions.filter(
        (transaction) => {
          const senderName =
            getUserSearchValue(
              transaction.senderId
            ).toLowerCase();

          const receiverName =
            getUserSearchValue(
              transaction.receiverId
            ).toLowerCase();

          const counterparty =
            getUserSearchValue(
              transaction.counterparty
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
            senderName.includes(
              query
            ) ||
            receiverName.includes(
              query
            ) ||
            counterparty.includes(
              query
            ) ||
            reference.includes(
              query
            ) ||
            type.includes(
              query
            ) ||
            transaction.status
              .toLowerCase()
              .includes(query);

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
     RESET PAGE WHEN FILTERS CHANGE
  ========================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    typeFilter,
    statusFilter,
  ]);

  /* =========================================================
     PAGINATION DERIVED
  ========================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTransactions.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedTransactions =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredTransactions.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    }, [
      filteredTransactions,
      currentPage,
    ]);

  const transactionViews =
    useMemo(
      () =>
        paginatedTransactions.map(
          (transaction) =>
            createTransactionView(
              transaction
            )
        ),
      [paginatedTransactions]
    );

  const paginationPages =
    useMemo(() => {
      const pages: number[] = [];

      const start =
        Math.max(
          1,
          currentPage - 2
        );

      const end =
        Math.min(
          totalPages,
          currentPage + 2
        );

      for (
        let page = start;
        page <= end;
        page++
      ) {
        pages.push(page);
      }

      return pages;
    }, [
      currentPage,
      totalPages,
    ]);

  const firstVisibleItem =
    filteredTransactions.length ===
    0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleItem =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredTransactions.length
    );

  /* =========================================================
     SUMMARY
  ========================================================== */

  const summary =
    useMemo(() => {
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
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setTypeOpen(false);
    setStatusOpen(false);
    setCurrentPage(1);
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
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-violet-900 via-violet-700 to-indigo-600 text-white shadow-[0_14px_35px_rgba(109,40,217,.22)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />

            <Loader2 className="relative h-6 w-6 animate-spin" />
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-foreground">
              Loading transactions
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
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
    <main className="min-w-0 space-y-6 overflow-x-hidden pb-10 text-foreground">
      {/* ===================================================
          TOP HEADER
      ==================================================== */}

      <section className="relative overflow-hidden rounded-[30px] border border-violet-900/30 bg-gradient-to-br from-[#12082F] via-[#291158] to-[#5B21B6] text-white shadow-[0_20px_65px_rgba(76,29,149,.22)]">
        {/* glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />

        <div className="pointer-events-none absolute left-1/3 top-8 h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-violet-200/40 to-transparent" />

        {/* Decorative dots */}
        <div className="pointer-events-none absolute right-8 top-8 hidden opacity-60 sm:block">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({
              length: 25,
            }).map(
              (_, index) => (
                <span
                  key={index}
                  className="h-1 w-1 rounded-full bg-violet-200/60"
                />
              )
            )}
          </div>
        </div>

        <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            {/* LEFT */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/15 bg-white/[0.07] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-100 shadow-sm backdrop-blur-xl">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-300/10 text-violet-200">
                  <CreditCard className="h-3 w-3" />
                </span>

                Wallet Activity
              </div>

              <h1 className="mt-4 text-[2rem] font-black tracking-[-0.045em] text-white sm:text-[2.4rem] lg:text-[2.7rem]">
                Transactions
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-violet-100/70 sm:text-sm">
                Review your incoming and outgoing payments, transaction status,
                references, and complete wallet activity history.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <HeaderPill
                  icon={ArrowDownLeft}
                  label="Incoming"
                  iconClass="bg-emerald-400/15 text-emerald-300"
                />

                <HeaderPill
                  icon={ArrowUpRight}
                  label="Outgoing"
                  iconClass="bg-violet-300/15 text-violet-200"
                />

                <HeaderPill
                  icon={ShieldCheck}
                  label="Secure Records"
                  iconClass="bg-fuchsia-300/15 text-fuchsia-200"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-sm backdrop-blur-xl lg:text-right">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-violet-200/55">
                  Total Records
                </p>

                <p className="mt-1 text-xl font-black tracking-tight text-white">
                  {transactions.length}
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
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {errorMessage && (
        <section className="rounded-[20px] border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">
                Could not load transactions
              </p>

              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
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
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* ===================================================
          SUMMARY
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Completed"
          value={String(
            summary.completed
          )}
          subtitle="Successful transactions"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
        />

        <SummaryCard
          title="Pending"
          value={String(
            summary.pending
          )}
          subtitle="Awaiting completion"
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
        />

        <SummaryCard
          title="Failed"
          value={String(
            summary.failed
          )}
          subtitle="Unsuccessful transactions"
          icon={XCircle}
          iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
        />

        <SummaryCard
          title="Transaction Volume"
          value={formatCurrency(
            summary.volume
          )}
          subtitle="Completed activity"
          icon={CreditCard}
          iconClass="bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
        />
      </section>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <section className="relative z-30 rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/30 dark:text-violet-300">
                <Filter className="h-3 w-3" />
                Smart Filters
              </div>

              <h2 className="mt-2 text-lg font-black tracking-[-0.025em] text-foreground sm:text-xl">
                Find a transaction
              </h2>

              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                Search and refine your wallet activity by type or status.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className={`inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl px-3 text-[10px] font-extrabold transition sm:self-auto ${
                hasFilters
                  ? "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            {/* SEARCH */}

            <div className="group relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-muted-foreground transition group-focus-within:text-violet-600 dark:group-focus-within:text-violet-300" />

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
                className="h-12 w-full rounded-[15px] border border-border bg-muted pl-11 pr-11 text-xs font-semibold text-foreground outline-none transition duration-200 placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-500 focus:bg-background focus:ring-4 focus:ring-violet-500/10 dark:hover:border-violet-700"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg bg-background px-2 py-1 text-[8px] font-bold text-muted-foreground ring-1 ring-border sm:block">
                  SEARCH
                </div>
              )}
            </div>

            {/* TYPE */}

            <CustomTypeDropdown
              value={typeFilter}
              open={typeOpen}
              dropdownRef={
                typeDropdownRef
              }
              onToggle={() => {
                setTypeOpen(
                  (value) =>
                    !value
                );
                setStatusOpen(false);
              }}
              onChange={(value) => {
                setTypeFilter(value);
                setTypeOpen(false);
              }}
            />

            {/* STATUS */}

            <CustomStatusDropdown
              value={statusFilter}
              open={statusOpen}
              dropdownRef={
                statusDropdownRef
              }
              onToggle={() => {
                setStatusOpen(
                  (value) =>
                    !value
                );
                setTypeOpen(false);
              }}
              onChange={(value) => {
                setStatusFilter(
                  value
                );
                setStatusOpen(false);
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {hasFilters ? (
                <>
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Active:
                  </span>

                  {search && (
                    <span className="inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[9px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                      Search: {search}
                    </span>
                  )}

                  {typeFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1.5 text-[9px] font-bold text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-300">
                      {getTypeFilterLabel(
                        typeFilter
                      )}
                    </span>
                  )}

                  {statusFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {getStatusFilterLabel(
                        statusFilter
                      )}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Showing all transaction activity
                </span>
              )}
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />

              <span className="text-[9px] font-extrabold text-muted-foreground">
                {filteredTransactions.length} result
                {filteredTransactions.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          TRANSACTION HISTORY
      ==================================================== */}

      <section className="relative z-10 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_14px_45px_rgba(15,23,42,0.045)]">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.17em] text-violet-600 dark:text-violet-300">
                History
              </p>

              <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-foreground">
                Transaction History
              </h2>

              {filteredTransactions.length > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Showing{" "}
                  <span className="font-black text-foreground">
                    {firstVisibleItem}
                  </span>
                  –
                  <span className="font-black text-foreground">
                    {lastVisibleItem}
                  </span>{" "}
                  of{" "}
                  <span className="font-black text-foreground">
                    {filteredTransactions.length}
                  </span>
                </p>
              )}
            </div>

            <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
              {filteredTransactions.length} shown
            </span>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="divide-y divide-border">
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

            {totalPages > 1 && (
              <TransactionPagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                pages={
                  paginationPages
                }
                onPageChange={
                  setCurrentPage
                }
              />
            )}
          </>
        )}
      </section>

      {/* ===================================================
          TRANSACTION MODAL
      ==================================================== */}

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
   HEADER PILL
========================================================= */

function HeaderPill({
  icon: Icon,
  label,
  iconClass,
}: {
  icon: ElementType;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="h-3 w-3" />
      </span>

      <span className="text-[10px] font-bold text-violet-100/80">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function TransactionPagination({
  currentPage,
  totalPages,
  pages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  pages: number[];
  onPageChange: (
    page: number
  ) => void;
}) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-[10px] font-semibold text-muted-foreground">
          Page{" "}
          <span className="font-black text-foreground">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-black text-foreground">
            {totalPages}
          </span>
        </p>

        <div className="flex items-center gap-1.5">
          {/* Previous */}

          <button
            type="button"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              onPageChange(
                Math.max(
                  1,
                  currentPage - 1
                )
              )
            }
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>

          {/* First page */}

          {pages[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  onPageChange(1)
                }
                className="h-9 min-w-9 rounded-xl border border-border bg-card px-2.5 text-[10px] font-black text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
              >
                1
              </button>

              {pages[0] > 2 && (
                <span className="px-1 text-muted-foreground">
                  ...
                </span>
              )}
            </>
          )}

          {/* Number pages */}

          {pages.map(
            (page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  onPageChange(
                    page
                  )
                }
                aria-current={
                  currentPage ===
                  page
                    ? "page"
                    : undefined
                }
                className={`h-9 min-w-9 rounded-xl px-2.5 text-[10px] font-black transition ${
                  currentPage === page
                    ? "border border-violet-600 bg-violet-700 text-white shadow-[0_8px_20px_rgba(109,40,217,.20)]"
                    : "border border-border bg-card text-muted-foreground hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Last page */}

          {pages[
            pages.length - 1
          ] < totalPages && (
            <>
              {pages[
                pages.length - 1
              ] <
                totalPages - 1 && (
                <span className="px-1 text-muted-foreground">
                  ...
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  onPageChange(
                    totalPages
                  )
                }
                className="h-9 min-w-9 rounded-xl border border-border bg-card px-2.5 text-[10px] font-black text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}

          <button
            type="button"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              onPageChange(
                Math.min(
                  totalPages,
                  currentPage + 1
                )
              )
            }
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM TYPE DROPDOWN
========================================================= */

function CustomTypeDropdown({
  value,
  open,
  dropdownRef,
  onToggle,
  onChange,
}: {
  value: TypeFilter;
  open: boolean;
  dropdownRef: React.RefObject<
    HTMLDivElement | null
  >;
  onToggle: () => void;
  onChange: (
    value: TypeFilter
  ) => void;
}) {
  const options: TypeFilter[] = [
    "ALL",
    "TRANSFER",
    "DEPOSIT",
    "WITHDRAW",
  ];

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-12 w-full items-center justify-between rounded-[15px] border bg-muted px-3.5 transition duration-200 ${
          open
            ? "border-violet-500 bg-background ring-4 ring-violet-500/10"
            : "border-border hover:border-violet-300"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-background text-violet-700 shadow-sm ring-1 ring-border dark:text-violet-300">
            <CreditCard className="h-3.5 w-3.5" />
          </span>

          <span className="text-left">
            <span className="block text-[8px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">
              Type
            </span>

            <span className="mt-0.5 block text-[11px] font-extrabold text-foreground">
              {getTypeFilterLabel(
                value
              )}
            </span>
          </span>
        </span>

        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open
              ? "-rotate-90 text-violet-600 dark:text-violet-300"
              : "rotate-90"
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-[90] w-full min-w-[205px] overflow-hidden rounded-[18px] border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_20px_55px_rgba(15,23,42,0.15)]"
        >
          <div className="px-2.5 pb-1.5 pt-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Transaction Type
            </p>
          </div>

          {options.map(
            (option) => {
              const active =
                value === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={
                    active
                  }
                  onClick={() =>
                    onChange(
                      option
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-[9px] ${
                        active
                          ? "bg-background text-violet-700 shadow-sm dark:text-violet-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getTypeFilterIcon(
                        option
                      )}
                    </span>

                    <span className="text-[11px] font-bold">
                      {getTypeFilterLabel(
                        option
                      )}
                    </span>
                  </span>

                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CUSTOM STATUS DROPDOWN
========================================================= */

function CustomStatusDropdown({
  value,
  open,
  dropdownRef,
  onToggle,
  onChange,
}: {
  value: StatusFilter;
  open: boolean;
  dropdownRef: React.RefObject<
    HTMLDivElement | null
  >;
  onToggle: () => void;
  onChange: (
    value: StatusFilter
  ) => void;
}) {
  const options: StatusFilter[] = [
    "ALL",
    "COMPLETED",
    "PENDING",
    "FAILED",
  ];

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-12 w-full items-center justify-between rounded-[15px] border bg-muted px-3.5 transition duration-200 ${
          open
            ? "border-violet-500 bg-background ring-4 ring-violet-500/10"
            : "border-border hover:border-violet-300"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-background text-muted-foreground shadow-sm ring-1 ring-border">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>

          <span className="text-left">
            <span className="block text-[8px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">
              Status
            </span>

            <span className="mt-0.5 block text-[11px] font-extrabold text-foreground">
              {getStatusFilterLabel(
                value
              )}
            </span>
          </span>
        </span>

        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open
              ? "-rotate-90 text-violet-600 dark:text-violet-300"
              : "rotate-90"
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-[90] w-full min-w-[205px] overflow-hidden rounded-[18px] border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_20px_55px_rgba(15,23,42,0.15)]"
        >
          <div className="px-2.5 pb-1.5 pt-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Transaction Status
            </p>
          </div>

          {options.map(
            (option) => {
              const active =
                value === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={
                    active
                  }
                  onClick={() =>
                    onChange(
                      option
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        option ===
                        "COMPLETED"
                          ? "bg-emerald-500"
                          : option ===
                            "PENDING"
                          ? "bg-amber-500"
                          : option ===
                            "FAILED"
                          ? "bg-rose-500"
                          : "bg-muted-foreground"
                      }`}
                    />

                    <span className="text-[11px] font-bold">
                      {getStatusFilterLabel(
                        option
                      )}
                    </span>
                  </span>

                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
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
  icon: ElementType;
  iconClass: string;
}) {
  return (
    <div className="group rounded-[24px] border border-border bg-card p-5 text-card-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:hover:border-violet-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${iconClass}`}
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
  const Icon = item.icon;

  return (
    <div className="group flex min-w-0 flex-col gap-4 p-4 text-card-foreground transition hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:scale-105 ${item.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-foreground">
            {item.title}
          </p>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {item.date}
            </span>

            <span className="truncate">
              {item.subtitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p
            className={`text-sm font-black ${item.amountClass}`}
          >
            {item.amount}
          </p>

          <StatusBadge
            status={
              item.transaction
                .status
            }
          />
        </div>

        <button
          type="button"
          onClick={onView}
          disabled={loading}
          className="inline-flex h-10 min-w-[104px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
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

  let icon:
    | ElementType =
    isCredit
      ? ArrowDownLeft
      : ArrowUpRight;

  let iconClass =
    isCredit
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
      : "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300";

  let amountClass =
    isCredit
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground";

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
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300";

    amountClass =
      "text-emerald-600 dark:text-emerald-400";
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
      "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300";

    amountClass =
      "text-rose-600 dark:text-rose-400";
  }

  if (isTransfer) {
    const counterparty =
      transaction.counterparty ||
      (direction === "IN"
        ? transaction.senderId
        : transaction.receiverId);

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
        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
        : "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300";

    amountClass =
      direction === "IN"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";
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

    date: formatDate(
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <CreditCard className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-extrabold text-foreground">
        {hasFilters
          ? "No matching transactions"
          : "No transactions yet"}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {hasFilters
          ? "Try changing your search or filters to find another transaction."
          : "Your transactions will appear here once you send, receive, deposit, or withdraw money."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800"
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
  const [copied, setCopied] =
    useState(false);

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
    (transaction.type ===
    "DEPOSIT"
      ? "IN"
      : "OUT");

  const counterparty =
    transaction.counterparty ||
    (transaction.type ===
    "TRANSFER"
      ? direction === "IN"
        ? transaction.senderId
        : transaction.receiverId
      : null);

  const receiptNumber =
    `COFFER-${transaction._id
      .slice(-10)
      .toUpperCase()}`;

  /* =======================================================
     COPY
  ======================================================== */

  const handleCopyId =
    async () => {
      try {
        await navigator.clipboard.writeText(
          transaction._id
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          1600
        );
      } catch (error) {
        console.error(
          "Copy transaction ID failed:",
          error
        );
      }
    };

  /* =======================================================
     PRINT
  ======================================================== */

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

  /* =======================================================
     DOWNLOAD
  ======================================================== */

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
            type: "text/html;charset=utf-8",
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

      link.href = url;

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
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[590px] overflow-y-auto rounded-[30px] border border-border bg-card text-card-foreground shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        {/* HEADER */}

        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-violet-50 via-card to-indigo-50 p-6 dark:from-violet-950/40 dark:via-card dark:to-indigo-950/30 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-400/10 blur-[70px]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-violet-800 text-white shadow-[0_10px_25px_rgba(109,40,217,.18)]">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                  Coffer receipt
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-foreground">
                  Transaction Receipt
                </h2>

                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                  {receiptNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          {/* AMOUNT */}

          <div className="rounded-[24px] border border-border bg-muted p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[13px] bg-background text-violet-700 shadow-sm dark:text-violet-300">
              {direction ===
              "IN" ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {direction ===
              "IN"
                ? "Money received"
                : "Money sent"}
            </p>

            <p className="mt-2 text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl">
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

          {/* VERIFIED */}

          <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/25">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

            <div>
              <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
                Secure transaction record
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-emerald-700/80 dark:text-emerald-300/75">
                Receipt details are loaded from your authenticated transaction
                record.
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
              value={typeLabel}
            />

            <DetailRow
              label="Direction"
              value={
                direction ===
                "IN"
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

          {/* COPY */}

          <button
            type="button"
            onClick={() =>
              void handleCopyId()
            }
            className="mt-5 flex w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-muted px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
          >
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Transaction identifier
              </p>

              <p className="mt-1 truncate text-[11px] font-bold text-foreground">
                {transaction._id}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-violet-700 shadow-sm dark:text-violet-300">
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-violet-700 px-4 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(109,40,217,.16)] transition hover:bg-violet-800"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={
                handleDownload
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-background px-4 text-xs font-extrabold text-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
          </div>

          <p className="mt-4 text-center text-[9px] leading-4 text-muted-foreground">
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
        "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    },

    COMPLETED: {
      label: "Completed",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },

    FAILED: {
      label: "Failed",
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
    },
  };

  const current =
    config[status];

  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[8px] font-black ${current.className}`}
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
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[68%] break-all text-right text-xs font-bold text-foreground">
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
    | null
    | undefined
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

  return "another user";
}

function getUserSearchValue(
  user:
    | string
    | UserRef
    | null
    | undefined
): string {
  if (
    typeof user ===
      "object" &&
    user !== null
  ) {
    return [
      user.name,
      user.email,
      user.phone,
      user._id,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return user || "";
}

function getUserDisplay(
  user:
    | string
    | UserRef
    | null
    | undefined
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
      user.phone ||
      user._id
    );
  }

  return user || "N/A";
}

/* =========================================================
   FILTER HELPERS
========================================================= */

function getTypeFilterLabel(
  type: TypeFilter
): string {
  switch (type) {
    case "TRANSFER":
      return "Transfer";

    case "DEPOSIT":
      return "Deposit";

    case "WITHDRAW":
      return "Withdraw";

    default:
      return "All Types";
  }
}

function getStatusFilterLabel(
  status: StatusFilter
): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "PENDING":
      return "Pending";

    case "FAILED":
      return "Failed";

    default:
      return "All Statuses";
  }
}

function getTypeFilterIcon(
  type: TypeFilter
) {
  switch (type) {
    case "TRANSFER":
      return (
        <ArrowUpRight className="h-3.5 w-3.5" />
      );

    case "DEPOSIT":
      return (
        <ArrowDownLeft className="h-3.5 w-3.5" />
      );

    case "WITHDRAW":
      return (
        <ArrowUpRight className="h-3.5 w-3.5" />
      );

    default:
      return (
        <CreditCard className="h-3.5 w-3.5" />
      );
  }
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
    (transaction.type ===
    "DEPOSIT"
      ? "IN"
      : "OUT");

  const counterparty =
    transaction.counterparty ||
    (transaction.type ===
    "TRANSFER"
      ? direction ===
        "IN"
        ? transaction.senderId
        : transaction.receiverId
      : null);

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
    ...(transaction.type ===
    "TRANSFER"
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

  <title>
    Coffer Receipt ${escapeHtml(
      receiptNumber
    )}
  </title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 36px 20px;
      background: #f4f7fa;
      color: #24104f;
      font-family: Arial, Helvetica, sans-serif;
    }

    .receipt {
      max-width: 700px;
      margin: 0 auto;
      overflow: hidden;
      border: 1px solid #ddd5f3;
      border-radius: 24px;
      background: #ffffff;
    }

    .header {
      padding: 28px 30px;
      border-bottom: 1px solid #ece8f7;
      background: linear-gradient(
        135deg,
        #f7f2ff 0%,
        #ffffff 58%,
        #f2ecff 100%
      );
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #6d28d9;
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
      color: #89789f;
      font-size: 12px;
      font-weight: 700;
    }

    .amount {
      margin: 24px 30px 0;
      padding: 24px;
      border: 1px solid #e5ddf4;
      border-radius: 18px;
      background: #faf8ff;
      text-align: center;
    }

    .amount small {
      display: block;
      margin-bottom: 8px;
      color: #8c7c9e;
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
      <p class="eyebrow">
        Coffer secure receipt
      </p>

      <h1>
        Transaction Receipt
      </h1>

      <div class="receipt-no">
        ${escapeHtml(
          receiptNumber
        )}
      </div>
    </header>

    <section class="amount">
      <small>
        Transaction amount
      </small>

      <strong>
        ${escapeHtml(
          formatCurrency(
            transaction.amount
          )
        )}
      </strong>

      <div class="status">
        ${escapeHtml(
          transaction.status
        )}
      </div>
    </section>

    <table>
      <tbody>
        ${rowHtml}
      </tbody>
    </table>

    <footer class="footer">
      This receipt was generated from
      your authenticated Coffer
      transaction record.
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