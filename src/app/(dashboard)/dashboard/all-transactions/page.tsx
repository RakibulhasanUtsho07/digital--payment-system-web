"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import { apiClient } from "@/lib/api/client";

interface TransactionUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Transaction {
  _id: string;
  senderId:
    | string
    | TransactionUser;

  receiverId:
    | string
    | TransactionUser;

  amount: number;
  currency: string;

  type:
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW";

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED";

  reference?: string;

  riskScore:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  createdAt?: string;
  updatedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: Transaction[];
  message?: string;
}

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

function formatCurrency(
  amount: number,
  currency: string
) {
  return `${currency === "BDT" ? "৳" : currency} ${amount.toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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

export default function AllTransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] = useState<
    Transaction[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    | "ALL"
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
  >("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    | "ALL"
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW"
  >("ALL");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const pageSize = 10;

  const loadTransactions =
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
            "/admin/transactions"
          );

        if (
          !data ||
          data.success !== true
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
      } catch (error: unknown) {
        console.error(
          "ADMIN ALL TRANSACTIONS ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load all transactions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    void loadTransactions(true);
  }, []);

  const filteredTransactions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
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
    }, [
      transactions,
      search,
      statusFilter,
      typeFilter,
    ]);

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
      (safePage - 1) *
        pageSize,
      safePage *
        pageSize
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    typeFilter,
  ]);

  const stats =
    useMemo(() => {
      const completed =
        transactions.filter(
          (item) =>
            item.status ===
            "COMPLETED"
        );

      const pending =
        transactions.filter(
          (item) =>
            item.status ===
            "PENDING"
        );

      const failed =
        transactions.filter(
          (item) =>
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
      };
    }, [
      transactions,
    ]);

  const refreshTransactions =
    async () => {
      await loadTransactions(
        false
      );
    };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F2745] text-white shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-800">
            Loading all transactions
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching secure platform transaction data...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-12">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* header */}

        <motion.section
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-[30px] bg-[#0F2745] p-6 text-white shadow-xl sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/60">
                Administrator
              </p>

              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                All Transactions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/70">
                Monitor transaction activity, status,
                risk levels and platform payment flow.
              </p>
            </div>

            <button
              type="button"
              onClick={
                refreshTransactions
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </motion.section>

        {errorMessage && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-rose-800">
                  Could not load transactions
                </p>
                <p className="mt-1 text-xs text-rose-600">
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadTransactions(true)
                }
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* stats */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Transactions"
            value={stats.total}
            tone="blue"
          />

          <StatCard
            label="Completed"
            value={
              stats.completed
            }
            tone="emerald"
          />

          <StatCard
            label="Pending"
            value={
              stats.pending
            }
            tone="amber"
          />

          <StatCard
            label="Failed"
            value={
              stats.failed
            }
            tone="rose"
          />

          <StatCard
            label="Completed Volume"
            value={formatCurrency(
              stats.volume,
              "BDT"
            )}
            tone="slate"
          />
        </div>

        {/* filters */}

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search user, transaction ID or reference..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event
                        .target
                        .value as typeof statusFilter
                    )
                  }
                  className="h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs font-bold text-slate-600 outline-none"
                >
                  <option value="ALL">
                    All Status
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
              </div>

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event
                      .target
                      .value as typeof typeFilter
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600 outline-none"
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
            </div>
          </div>
        </section>

        {/* table */}

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Transaction
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Sender
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Receiver
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Risk
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedTransactions.map(
                  (
                    transaction
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
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              {transaction.type ===
                              "DEPOSIT" ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-black text-slate-800">
                                {
                                  transaction.reference ||
                                  "No reference"
                                }
                              </p>

                              <p className="mt-0.5 font-mono text-[9px] text-slate-400">
                                {
                                  transaction._id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-800">
                            {sender}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-800">
                            {receiver}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-black text-slate-900">
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency
                            )}
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
                          <p className="whitespace-nowrap text-xs text-slate-500">
                            {formatDate(
                              transaction.createdAt
                            )}
                          </p>
                        </td>
                      </motion.tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {paginatedTransactions.length ===
            0 && (
            <div className="py-16 text-center">
              <p className="text-sm font-black text-slate-800">
                No transactions found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {/* pagination */}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Showing{" "}
              {filteredTransactions.length ===
              0
                ? 0
                : (safePage -
                    1) *
                    pageSize +
                  1}{" "}
             –{" "}
              {Math.min(
                safePage *
                  pageSize,
                filteredTransactions.length
              )}{" "}
              of{" "}
              {
                filteredTransactions.length
              }
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  safePage <=
                  1
                }
                onClick={() =>
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="min-w-16 text-center text-xs font-bold text-slate-600">
                {safePage} /{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  safePage >=
                  totalPages
                }
                onClick={() =>
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone:
    | "blue"
    | "emerald"
    | "amber"
    | "rose"
    | "slate";
}) {
  const toneMap = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
    },
    slate: {
      bg: "bg-slate-50",
      text: "text-slate-600",
    },
  };

  const selected =
    toneMap[tone];

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <span
          className={`h-2.5 w-2.5 rounded-full ${selected.bg} ${selected.text}`}
        />
      </div>

      <p className="mt-3 text-2xl font-black text-[#0F2745]">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED";
}) {
  const config =
    status ===
    "COMPLETED"
      ? {
          label: "Completed",
          className:
            "bg-emerald-50 text-emerald-700",
          icon: CheckCircle2,
        }
      : status ===
          "PENDING"
        ? {
            label: "Pending",
            className:
              "bg-amber-50 text-amber-700",
            icon: Clock3,
          }
        : {
            label: "Failed",
            className:
              "bg-rose-50 text-rose-700",
            icon: XCircle,
          };

  const Icon =
    config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* =========================================================
   RISK BADGE
========================================================= */

function RiskBadge({
  risk,
}: {
  risk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
}) {
  const config =
    risk === "HIGH"
      ? "bg-rose-50 text-rose-700"
      : risk === "MEDIUM"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${config}`}
    >
      <ShieldAlert className="h-3 w-3" />
      {risk}
    </span>
  );
}