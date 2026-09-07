"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Lightbulb,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
  Wallet,
  WalletCards,
} from "lucide-react";

import {
  getBudgetDashboard,
  type BudgetExpense,
} from "@/lib/api/budgetApi";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user";

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

type TransactionType =
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW";

type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

interface DashboardUser {
  name?: string;
  email?: string;
  greeting?: string;
  role?: UserRole;
  kycStatus?: KYCStatus;
}

interface WalletData {
  _id: string;
  userId: string;
  balance: number;
  [key: string]: unknown;
}

interface PopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}

interface TransactionData {
  _id: string;

  senderId:
    | string
    | PopulatedUser;

  receiverId:
    | string
    | PopulatedUser;

  amount: number;

  currency: string;

  type:
    | TransactionType;

  status:
    | TransactionStatus;

  reference?: string;

  riskScore:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  createdAt?: string;

  updatedAt?: string;
}

interface UserDashboardOverviewProps {
  user: DashboardUser;

  wallet: WalletData;

  transactions:
    TransactionData[];
}

interface RevealStatCardProps {
  title: string;

  value: string;

  subtitle: string;

  icon: React.ElementType;

  iconClass: string;

  valueClass?: string;

  accent:
    | "cyan"
    | "emerald"
    | "fuchsia"
    | "violet";

  revealed: boolean;

  onToggle: () => void;
}

interface ActivityView {
  id: string;

  title: string;

  date: string;

  amount: string;

  isCredit: boolean;

  icon: React.ElementType;

  timestamp: number;

  source:
    | "transaction"
    | "budget";
}

/* =========================================================
   SHARED LAYOUT CONSTANTS
========================================================= */

const TWO_COLUMN_TEMPLATE =
  "xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]";

const NARROW_CARD_MIN_HEIGHT =
  "min-h-[232px]";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function UserDashboardOverview({
  user,
  wallet,
  transactions,
}: UserDashboardOverviewProps) {
  /* =======================================================
     EXISTING UI STATE
  ======================================================== */

  const [
    timeGreeting,
    setTimeGreeting,
  ] =
    useState(
      "Good afternoon"
    );

  const [
    revealed,
    setRevealed,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  /* =======================================================
     BUDGET EXPENSE STATE

     Budget expenses are stored in a separate
     BudgetExpense collection, so User Overview
     must fetch them explicitly.
  ======================================================== */

  const [
    budgetExpenses,
    setBudgetExpenses,
  ] =
    useState<
      BudgetExpense[]
    >([]);

  const [
    budgetExpensesLoading,
    setBudgetExpensesLoading,
  ] =
    useState(true);

  /* =======================================================
     GREETING
  ======================================================== */

  useEffect(() => {
    setTimeGreeting(
      getGreeting()
    );
  }, []);

  /* =======================================================
     BASIC VALUES
  ======================================================== */

  const greeting =
    user.greeting ||
    timeGreeting;

  const kycStatus =
    user.kycStatus ||
    "not_started";

  const balance =
    Number(
      wallet.balance
    ) || 0;

  /* =======================================================
     REVEAL
  ======================================================== */

  const toggleReveal = (
    key: string
  ) => {
    setRevealed(
      (previous) => ({
        ...previous,
        [key]:
          !previous[key],
      })
    );
  };

  /* =========================================================
     LOAD CURRENT MONTH BUDGET EXPENSES
     
     This is the important sync fix.
     
     Budget expenses do not exist inside the Transaction
     collection. They exist inside BudgetExpense, so
     User Overview fetches the current month's budget
     dashboard and reads response.expenses.
  ========================================================== */

  const loadBudgetExpenses =
    useCallback(
      async () => {
        try {
          setBudgetExpensesLoading(
            true
          );

          const current =
            new Date();

          const response =
            await getBudgetDashboard(
              current.getMonth() +
                1,
              current.getFullYear()
            );

          if (
            !response ||
            response.success !==
              true
          ) {
            throw new Error(
              response?.message ||
                "Unable to load budget expenses."
            );
          }

          setBudgetExpenses(
            Array.isArray(
              response.expenses
            )
              ? response.expenses
              : []
          );
        } catch (
          error
        ) {
          console.error(
            "USER OVERVIEW BUDGET EXPENSE LOAD ERROR:",
            error
          );

          /*
           * Do not break the dashboard if the
           * optional budget source fails.
           *
           * Existing transaction data will
           * continue to render.
           */
          setBudgetExpenses(
            []
          );
        } finally {
          setBudgetExpensesLoading(
            false
          );
        }
      },
      []
    );

  /* =========================================================
     INITIAL BUDGET LOAD
  ========================================================== */

  useEffect(() => {
    void loadBudgetExpenses();
  }, [
    loadBudgetExpenses,
  ]);

  /* =========================================================
     REFRESH BUDGET DATA WHEN DASHBOARD BECOMES ACTIVE

     This solves the case where:
     Budget page -> add expense -> navigate back to dashboard

     or:

     another tab/page updates a budget expense.
  ========================================================== */

  useEffect(() => {
    const handleFocus =
      () => {
        void loadBudgetExpenses();
      };

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadBudgetExpenses();
        }
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    loadBudgetExpenses,
  ]);

  /* =========================================================
     COMPLETED TRANSACTIONS
  ========================================================== */

  const completedTransactions =
    useMemo(
      () =>
        transactions.filter(
          (
            transaction
          ) =>
            transaction.status ===
            "COMPLETED"
        ),
      [transactions]
    );

  /* =========================================================
     TOTAL RECEIVED
     
     Only wallet transactions count as received money.
     Budget expenses are expenses, so they must NOT affect
     total received.
  ========================================================== */

  const totalReceived =
    useMemo(
      () =>
        completedTransactions
          .filter(
            (
              transaction
            ) =>
              getUserId(
                transaction.receiverId
              ) ===
              wallet.userId
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          ),
      [
        completedTransactions,
        wallet.userId,
      ]
    );

  /* =========================================================
     TOTAL SENT
     
     Existing wallet transaction calculation.
  ========================================================== */

  const totalSent =
    useMemo(
      () =>
        completedTransactions
          .filter(
            (
              transaction
            ) =>
              getUserId(
                transaction.senderId
              ) ===
              wallet.userId
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          ),
      [
        completedTransactions,
        wallet.userId,
      ]
    );

  /* =========================================================
     CURRENT MONTH BUDGET EXPENSES
  ========================================================== */

  const currentMonthBudgetExpenses =
    useMemo(
      () => {
        const now =
          new Date();

        const currentMonth =
          now.getMonth();

        const currentYear =
          now.getFullYear();

        return budgetExpenses.filter(
          (
            expense
          ) => {
            const date =
              new Date(
                expense.date
              );

            if (
              Number.isNaN(
                date.getTime()
              )
            ) {
              return false;
            }

            return (
              date.getMonth() ===
                currentMonth &&
              date.getFullYear() ===
                currentYear
            );
          }
        );
      },
      [budgetExpenses]
    );

  /* =========================================================
     BUDGET EXPENSE TOTAL
  ========================================================== */

  const totalBudgetExpenses =
    useMemo(
      () =>
        currentMonthBudgetExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            Number(
              expense.amount ||
                0
            ),
          0
        ),
      [
        currentMonthBudgetExpenses,
      ]
    );

  /* =========================================================
     MONTHLY SPENDING

     IMPORTANT:
     Existing transaction spending
     +
     Budget manual expenses
  ========================================================== */

  const monthlySpending =
    useMemo(() => {
      const currentDate =
        new Date();

      const currentMonth =
        currentDate.getMonth();

      const currentYear =
        currentDate.getFullYear();

      const transactionSpending =
        completedTransactions
          .filter(
            (
              transaction
            ) => {
              if (
                !transaction.createdAt
              ) {
                return false;
              }

              const date =
                new Date(
                  transaction.createdAt
                );

              if (
                Number.isNaN(
                  date.getTime()
                )
              ) {
                return false;
              }

              return (
                date.getMonth() ===
                  currentMonth &&
                date.getFullYear() ===
                  currentYear &&
                getUserId(
                  transaction.senderId
                ) ===
                  wallet.userId &&
                transaction.type !==
                  "DEPOSIT"
              );
            }
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          );

      return (
        transactionSpending +
        totalBudgetExpenses
      );
    }, [
      completedTransactions,
      wallet.userId,
      totalBudgetExpenses,
    ]);

  /* =========================================================
     RECENT UNIFIED ACTIVITY

     Combines:
     - Wallet transactions
     - Budget expenses

     Sorted by actual timestamp.
  ========================================================== */

  const recentTransactions =
    useMemo<
      ActivityView[]
    >(() => {
      const transactionItems =
        transactions.map(
          (
            transaction
          ) => {
            const view =
              createTransactionView(
                transaction,
                wallet.userId
              );

            return {
              id:
                `transaction-${transaction._id}`,

              title:
                view.title,

              date:
                formatDate(
                  transaction.createdAt
                ),

              amount:
                view.amount,

              isCredit:
                view.isCredit,

              icon:
                view.icon,

              timestamp:
                getTimestamp(
                  transaction.createdAt
                ),

              source:
                "transaction" as const,
            };
          }
        );

      const budgetItems =
        budgetExpenses.map(
          (
            expense
          ) => ({
            id:
              `budget-${expense.id}`,

            title:
              expense.title,

            date:
              formatDate(
                expense.date
              ),

            amount:
              `- ${formatCurrency(
                expense.amount
              )}`,

            isCredit:
              false,

            icon:
              ArrowUpRight,

            timestamp:
              getTimestamp(
                expense.date
              ),

            source:
              "budget" as const,
          })
        );

      return [
        ...transactionItems,
        ...budgetItems,
      ]
        .sort(
          (a, b) =>
            b.timestamp -
            a.timestamp
        )
        .slice(0, 5);
    }, [
      transactions,
      wallet.userId,
      budgetExpenses,
    ]);

  /* =========================================================
     SPENDING CHART

     Wallet outgoing transactions
     +
     Budget expenses
  ========================================================== */

  const spendingChart =
    useMemo(
      () =>
        getLastSevenDaysSpending(
          completedTransactions,
          wallet.userId,
          budgetExpenses
        ),
      [
        completedTransactions,
        wallet.userId,
        budgetExpenses,
      ]
    );

  const maxChartValue =
    Math.max(
      ...spendingChart.map(
        (item) =>
          item.amount
      ),
      1
    );

  const chartHasData =
    spendingChart.some(
      (item) =>
        item.amount > 0
    );

  const previousDay =
    spendingChart[
      spendingChart.length - 2
    ]?.amount || 0;

  const currentDay =
    spendingChart[
      spendingChart.length - 1
    ]?.amount || 0;

  const spendingTrend =
    currentDay >
    previousDay
      ? "up"
      : currentDay <
          previousDay
        ? "down"
        : "same";

  /* =========================================================
     TOTAL LAST 7 DAYS
  ========================================================== */

  const lastSevenDaysTotal =
    useMemo(
      () =>
        spendingChart.reduce(
          (
            total,
            item
          ) =>
            total +
            item.amount,
          0
        ),
      [spendingChart]
    );

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden pb-10">
      {/* ====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#09051B] via-[#160A36] to-[#2D1168] px-5 py-7 text-white shadow-[0_24px_80px_rgba(56,24,120,0.28)] sm:px-7 sm:py-8 lg:px-9 lg:py-9">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl" />

        <motion.div
          animate={{
            y: [0, -8, 0],
            opacity: [
              0.2,
              0.55,
              0.2,
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute right-[14%] top-7 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.7)]"
        />

        <motion.div
          animate={{
            y: [0, 10, 0],
            opacity: [
              0.1,
              0.4,
              0.1,
            ],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
          className="pointer-events-none absolute bottom-12 right-[28%] h-2 w-2 rounded-full bg-fuchsia-200"
        />

        <div className="relative z-10 flex min-w-0 flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
              }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300/10 ring-1 ring-cyan-200/10">
                <WalletCards className="h-3.5 w-3.5 text-cyan-200" />
              </span>

              Smart Wallet Overview

              <span className="h-1 w-1 rounded-full bg-violet-200/70" />

              <span className="normal-case tracking-normal text-violet-100/60">
                Live dashboard
              </span>
            </motion.div>

            <motion.div
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
                delay: 0.05,
              }}
              className="max-w-3xl"
            >
              <p className="text-xl font-semibold leading-none text-white/90 sm:text-2xl">
                {greeting},
              </p>

              <div className="mt-2 flex min-w-0 items-center gap-2.5 sm:gap-3">
                <h1 className="min-w-0 truncate bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-[2.55rem] font-black leading-[0.98] tracking-[-0.055em] text-transparent sm:text-[3.6rem]">
                  {user.name ||
                    "User"}
                </h1>

                <motion.span
                  animate={{
                    rotate: [
                      0,
                      10,
                      -8,
                      0,
                    ],
                    scale: [
                      1,
                      1.08,
                      1,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/10 bg-white/[0.06] text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.15)] sm:h-11 sm:w-11"
                >
                  <Sparkles className="h-4.5 w-4.5 sm:h-5 w-5" />
                </motion.span>
              </div>

              <motion.div
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  width: "7rem",
                  opacity: 1,
                }}
                transition={{
                  duration: 0.65,
                  delay: 0.2,
                }}
                className="mt-3 h-[3px] rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300"
              />

              <motion.p
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.14,
                }}
                className="mt-5 max-w-2xl text-sm leading-6 text-violet-100/65 sm:text-[15px]"
              >
                Keep track of your wallet,
                transfers, spending and
                account activity from one
                secure place.
              </motion.p>

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="mt-5 flex flex-wrap items-center gap-2.5"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.08)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Wallet active
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-violet-100/70">
                  <LockKeyhole className="h-3 w-3" />
                  Secure session
                </span>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              x: 12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.18,
            }}
            className="flex shrink-0 flex-wrap gap-3"
          >
            <Link
              href="/dashboard/send"
              className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-xs font-extrabold text-[#221046] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.25)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D1168]/10">
                <Send className="h-3.5 w-3.5" />
              </span>

              Send Money

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard/receive"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-5 text-xs font-extrabold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.13]"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Receive
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====================================================
          STATS
      ===================================================== */}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevealStatCard
          title="Available Balance"
          value={formatCurrency(
            balance
          )}
          subtitle="Current wallet balance"
          icon={Wallet}
          iconClass="from-cyan-400/20 to-violet-500/20 text-cyan-200 ring-cyan-300/15"
          accent="cyan"
          revealed={Boolean(
            revealed.balance
          )}
          onToggle={() =>
            toggleReveal(
              "balance"
            )
          }
        />

        <RevealStatCard
          title="Total Received"
          value={formatCurrency(
            totalReceived
          )}
          subtitle={`${completedTransactions.length} completed transactions`}
          icon={ArrowDownLeft}
          iconClass="from-emerald-400/20 to-cyan-400/10 text-emerald-200 ring-emerald-300/15"
          accent="emerald"
          valueClass="text-emerald-100"
          revealed={Boolean(
            revealed.received
          )}
          onToggle={() =>
            toggleReveal(
              "received"
            )
          }
        />

        <RevealStatCard
          title="Total Sent"
          value={formatCurrency(
            totalSent
          )}
          subtitle="Completed outgoing payments"
          icon={ArrowUpRight}
          iconClass="from-fuchsia-400/20 to-rose-500/10 text-fuchsia-200 ring-fuchsia-300/15"
          accent="fuchsia"
          valueClass="text-fuchsia-100"
          revealed={Boolean(
            revealed.sent
          )}
          onToggle={() =>
            toggleReveal(
              "sent"
            )
          }
        />

        <RevealStatCard
          title="Monthly Spending"
          value={formatCurrency(
            monthlySpending
          )}
          subtitle="Wallet + budget expenses"
          icon={TrendingUp}
          iconClass="from-violet-400/20 to-cyan-400/10 text-violet-200 ring-violet-300/15"
          accent="violet"
          valueClass="text-violet-100"
          revealed={Boolean(
            revealed.spending
          )}
          onToggle={() =>
            toggleReveal(
              "spending"
            )
          }
        />
      </section>

      {/* ====================================================
          TRANSACTIONS
      ===================================================== */}

      <section
        className={`grid min-w-0 items-start gap-6 ${TWO_COLUMN_TEMPLATE}`}
      >
        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900">
                Recent Transactions
              </h2>
            </div>

            <Link
              href="/dashboard/transactions"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#1F5EA8] transition hover:text-[#123B66]"
            >
              View all

              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {budgetExpensesLoading &&
          transactions.length ===
            0 ? (
            <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-8">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          ) : recentTransactions.length ===
            0 ? (
            <EmptyTransactions />
          ) : (
            <div className="min-w-0 space-y-2">
              {recentTransactions.map(
                (
                  transaction,
                  index
                ) => {
                  const Icon =
                    transaction.icon;

                  return (
                    <motion.div
                      key={
                        transaction.id
                      }
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.35,
                        delay:
                          index *
                          0.05,
                      }}
                      className="group flex min-w-0 items-center justify-between rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            transaction.isCredit
                              ? "bg-emerald-50 text-emerald-600"
                              : transaction.source ===
                                  "budget"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">
                            {
                              transaction.title
                            }
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">
                              {
                                transaction.date
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`shrink-0 pl-4 text-sm font-black ${
                          transaction.isCredit
                            ? "text-emerald-600"
                            : "text-slate-900"
                        }`}
                      >
                        {
                          transaction.amount
                        }
                      </div>
                    </motion.div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">
              Wallet
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Quick Snapshot
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#09051B] via-[#160A36] to-[#2D1168] p-5 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-2xl" />

            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet-400/10 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-100/60">
                  Current Balance
                </p>

                <RevealAmount
                  value={formatCurrency(
                    balance
                  )}
                  revealed={Boolean(
                    revealed.snapshot
                  )}
                  compact
                  dark
                />

                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/10">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>

                  Wallet is active
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.92,
                }}
                onClick={() =>
                  toggleReveal(
                    "snapshot"
                  )
                }
                aria-label={
                  revealed.snapshot
                    ? "Hide balance"
                    : "Show balance"
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-violet-100 backdrop-blur-md transition hover:bg-white/15"
              >
                <RevealIcon
                  visible={Boolean(
                    revealed.snapshot
                  )}
                />
              </motion.button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickAction
              href="/dashboard/wallet"
              icon={Wallet}
              label="View Wallet"
            />

            <QuickAction
              href="/dashboard/transactions"
              icon={Download}
              label="Statements"
            />
          </div>
        </div>
      </section>

      {/* ====================================================
          ANALYTICS + SECURITY
      ===================================================== */}

      <section
        className={`grid min-w-0 items-start gap-6 ${TWO_COLUMN_TEMPLATE}`}
      >
        <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                <BarChart3 className="h-[18px] w-[18px]" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">
                  Analytics
                </p>

                <h2 className="mt-0.5 truncate text-lg font-black text-slate-900">
                  Spending Insights
                </h2>
              </div>
            </div>

            <Link
              href="/dashboard/insights"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#1F5EA8] hover:underline"
            >
              Open insights

              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Last 7 days
              </p>

              <p className="mt-1 text-sm font-black text-slate-900">
                {formatCurrency(
                  lastSevenDaysTotal
                )}
              </p>
            </div>

            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold ${
                spendingTrend ===
                "up"
                  ? "bg-rose-50 text-rose-600"
                  : spendingTrend ===
                      "down"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {spendingTrend ===
              "up" ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : spendingTrend ===
                "down" ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}

              <span className="hidden sm:inline">
                {spendingTrend ===
                "up"
                  ? "Spending increased"
                  : spendingTrend ===
                      "down"
                    ? "Spending decreased"
                    : "Stable activity"}
              </span>
            </div>
          </div>

          <SpendingChart
            data={
              spendingChart
            }
            maxValue={
              maxChartValue
            }
            hasData={
              chartHasData
            }
          />

          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniMetric
              label="Received"
              value={formatCurrency(
                totalReceived
              )}
              tone="emerald"
            />

            <MiniMetric
              label="Sent"
              value={formatCurrency(
                totalSent
              )}
              tone="rose"
            />

            <MiniMetric
              label="This month"
              value={formatCurrency(
                monthlySpending
              )}
              tone="blue"
            />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div
            className={`min-w-0 ${NARROW_CARD_MIN_HEIGHT} flex flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                      Account security
                    </p>

                    <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
                      Identity Verification
                    </h2>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                  Keep your identity verified
                  to access secure wallet
                  features.
                </p>
              </div>

              <KycBadge
                status={
                  kycStatus
                }
              />
            </div>

            {kycStatus !==
              "verified" && (
              <Link
                href="/dashboard/kyc"
                className="group mt-4 flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#173F6D]">
                    Complete KYC
                    verification
                  </p>

                  <p className="mt-1 truncate text-[10px] text-blue-700/70">
                    Submit your identity
                    documents.
                  </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm transition-transform duration-300 group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            )}

            {kycStatus ===
              "verified" && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-emerald-800">
                    Identity verified
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-emerald-700">
                    Your account is fully
                    verified.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`relative min-w-0 ${NARROW_CARD_MIN_HEIGHT} flex flex-col overflow-hidden rounded-[28px] border border-cyan-100 bg-gradient-to-br from-[#ECFBFF] via-[#F3FCFF] to-[#EFF6FF] p-5 sm:p-6`}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-200/25 blur-3xl" />

            <div className="relative z-10 flex min-w-0 gap-4">
              <motion.div
                animate={{
                  y: [0, -3, 0],
                  rotate: [
                    0,
                    -4,
                    4,
                    0,
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-white text-cyan-600 shadow-sm"
              >
                <Lightbulb className="h-5 w-5" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-slate-900">
                    Smart Wallet Tip
                  </p>

                  <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-cyan-700">
                    Tip
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                  Your current monthly
                  spending is{" "}
                  <span className="font-extrabold text-slate-800">
                    {formatCurrency(
                      monthlySpending
                    )}
                  </span>
                  . Staying within budget
                  helps improve your
                  savings.
                </p>

                <Link
                  href="/dashboard/budgeting"
                  className="group mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#1F5EA8]"
                >
                  Open budgeting

                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   EMPTY TRANSACTIONS
========================================================= */

function EmptyTransactions() {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <Activity className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-extrabold text-slate-700">
        No transactions yet
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Your recent wallet activity will
        appear here.
      </p>
    </div>
  );
}

/* =========================================================
   REVEAL STAT CARD
========================================================= */

function RevealStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  valueClass =
    "text-white",
  accent,
  revealed,
  onToggle,
}: RevealStatCardProps) {
  const accentMap = {
    cyan:
      "from-cyan-300 via-sky-400 to-violet-500",

    emerald:
      "from-emerald-300 via-cyan-300 to-teal-400",

    fuchsia:
      "from-fuchsia-300 via-pink-400 to-violet-500",

    violet:
      "from-violet-300 via-fuchsia-300 to-cyan-300",
  } as const;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -5,
      }}
      whileTap={{
        scale: 0.985,
      }}
      transition={{
        duration: 0.28,
      }}
      className="group relative min-h-[182px] w-full overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-[#0A071C] via-[#140A2D] to-[#24104E] p-5 text-left shadow-[0_18px_45px_rgba(25,8,63,0.22)] outline-none transition-shadow duration-300 hover:shadow-[0_24px_55px_rgba(74,24,145,0.32)] focus-visible:ring-2 focus-visible:ring-violet-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      aria-label={`${revealed ? "Hide" : "Reveal"} ${title}`}
    >
      <motion.div
        className={`absolute left-0 top-0 h-[3px] rounded-br-full bg-gradient-to-r ${accentMap[accent]}`}
        initial={{
          width: "4.5rem",
        }}
        whileHover={{
          width: "8rem",
        }}
        transition={{
          duration: 0.35,
        }}
      />

      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-fuchsia-400/10" />

      <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-cyan-400/5 blur-2xl" />

      <div className="relative z-10 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-100/55">
            {title}
          </p>

          <div className="mt-4">
            <RevealAmount
              value={value}
              revealed={revealed}
              valueClass={
                valueClass
              }
              dark
            />
          </div>

          <p className="mt-2 truncate text-[11px] font-medium text-violet-100/45">
            {subtitle}
          </p>
        </div>

        <div
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconClass} ring-1 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105`}
        >
          <span className="absolute inset-0 rounded-2xl bg-white/[0.04]" />

          <AnimatePresence
            mode="wait"
            initial={false}
          >
            {revealed ? (
              <motion.div
                key="revealed-icon"
                initial={{
                  scale: 0.55,
                  opacity: 0,
                  rotate: -18,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                exit={{
                  scale: 0.55,
                  opacity: 0,
                  rotate: 18,
                }}
                transition={{
                  duration: 0.22,
                }}
                className="relative"
              >
                <Unlock className="h-[18px] w-[18px]" />
              </motion.div>
            ) : (
              <motion.div
                key="hidden-icon"
                initial={{
                  scale: 0.55,
                  opacity: 0,
                  rotate: 18,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                exit={{
                  scale: 0.55,
                  opacity: 0,
                  rotate: -18,
                }}
                transition={{
                  duration: 0.22,
                }}
                className="relative"
              >
                <Icon className="h-[18px] w-[18px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence
        initial={false}
      >
        {!revealed && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -5,
            }}
            className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-[9px] font-bold text-violet-100/45"
          >
            <LockKeyhole className="h-3 w-3" />

            Click card to reveal amount
          </motion.div>
        )}

        {revealed && (
          <motion.div
            initial={{
              opacity: 0,
              y: 4,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -4,
            }}
            className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-200/70"
          >
            <Unlock className="h-3 w-3" />

            Balance visible
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{
          x: "-120%",
          opacity: 0,
        }}
        whileHover={{
          x: "120%",
          opacity: 0.6,
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm"
      />
    </motion.button>
  );
}

/* =========================================================
   REVEAL AMOUNT
========================================================= */

function RevealAmount({
  value,
  revealed,
  valueClass =
    "text-slate-900",
  compact = false,
  dark = false,
}: {
  value: string;
  revealed: boolean;
  valueClass?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  const maskedPlaceholder =
    "\u09F3 \u2022\u2022\u2022\u2022\u2022";

  return (
    <div
      className={`relative ${
        compact
          ? "text-2xl"
          : "text-[1.75rem]"
      } font-black tracking-tight`}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {revealed ? (
          <motion.span
            key="revealed"
            initial={{
              opacity: 0,
              filter:
                "blur(10px)",
              y: 5,
            }}
            animate={{
              opacity: 1,
              filter:
                "blur(0px)",
              y: 0,
            }}
            exit={{
              opacity: 0,
              filter:
                "blur(8px)",
              y: -4,
            }}
            transition={{
              duration: 0.3,
            }}
            className={`inline-block ${valueClass}`}
          >
            {value}
          </motion.span>
        ) : (
          <motion.span
            key="hidden"
            initial={{
              opacity: 0,
              filter:
                "blur(6px)",
            }}
            animate={{
              opacity: 1,
              filter:
                "blur(0px)",
            }}
            exit={{
              opacity: 0,
              filter:
                "blur(6px)",
            }}
            transition={{
              duration: 0.25,
            }}
            className={`inline-block ${
              dark ||
              compact
                ? "text-violet-100/90"
                : "text-slate-700"
            } tracking-[0.14em]`}
          >
            {
              maskedPlaceholder
            }
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function RevealIcon({
  visible,
}: {
  visible: boolean;
}) {
  return (
    <AnimatePresence
      mode="wait"
      initial={false}
    >
      {visible ? (
        <motion.div
          key="unlock"
          initial={{
            scale: 0.5,
            opacity: 0,
            rotate: -20,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          exit={{
            scale: 0.5,
            opacity: 0,
            rotate: 20,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <Unlock className="h-4 w-4" />
        </motion.div>
      ) : (
        <motion.div
          key="lock"
          initial={{
            scale: 0.5,
            opacity: 0,
            rotate: 20,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          exit={{
            scale: 0.5,
            opacity: 0,
            rotate: -20,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <LockKeyhole className="h-4 w-4" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   SPENDING CHART
========================================================= */

function SpendingChart({
  data,
  maxValue,
  hasData,
}: {
  data: {
    label: string;
    shortLabel: string;
    amount: number;
  }[];

  maxValue: number;

  hasData: boolean;
}) {
  const width = 680;

  const height = 230;

  const paddingX = 18;

  const paddingTop = 20;

  const paddingBottom = 42;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const chartWidth =
    width -
    paddingX * 2;

  const points =
    data.map(
      (
        item,
        index
      ) => {
        const x =
          paddingX +
          (index /
            Math.max(
              data.length -
                1,
              1
            )) *
            chartWidth;

        const y =
          paddingTop +
          chartHeight -
          (item.amount /
            Math.max(
              maxValue,
              1
            )) *
            chartHeight;

        return {
          x,
          y,
        };
      }
    );

  const linePath =
    points
      .map(
        (
          point,
          index
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`
      )
      .join(" ");

  const lastPoint =
    points[
      points.length - 1
    ];

  const firstPoint =
    points[0];

  const bottomY =
    height -
    paddingBottom;

  const areaPath = `${linePath} L ${
    lastPoint?.x ??
    width -
      paddingX
  } ${bottomY} L ${
    firstPoint?.x ??
    paddingX
  } ${bottomY} Z`;

  return (
    <div className="relative mt-5 min-w-0">
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-[10px] font-bold text-slate-400 shadow-sm backdrop-blur">
            No spending activity yet
          </div>
        </div>
      )}

      <div className="relative min-w-0 overflow-hidden rounded-[22px] border border-slate-100 bg-gradient-to-b from-slate-50/90 to-white p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full max-w-full"
          role="img"
          aria-label="Seven day spending chart"
        >
          <defs>
            <linearGradient
              id="spendingFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#1F5EA8"
                stopOpacity="0.22"
              />

              <stop
                offset="100%"
                stopColor="#1F5EA8"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[
            0,
            1,
            2,
            3,
          ].map(
            (
              line
            ) => {
              const y =
                paddingTop +
                (chartHeight /
                  3) *
                  line;

              return (
                <line
                  key={line}
                  x1={paddingX}
                  x2={
                    width -
                    paddingX
                  }
                  y1={y}
                  y2={y}
                  stroke="#E8EEF5"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            }
          )}

          <motion.path
            d={areaPath}
            fill="url(#spendingFill)"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity:
                hasData
                  ? 1
                  : 0.35,
            }}
            transition={{
              duration: 0.7,
            }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="#1F5EA8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength: 1,
            }}
            transition={{
              duration: 1.15,
              ease: "easeInOut",
            }}
          />

          {points.map(
            (
              point,
              index
            ) => (
              <motion.circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#FFFFFF"
                stroke="#1F5EA8"
                strokeWidth="3"
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale:
                    hasData
                      ? 1
                      : 0.6,
                }}
                transition={{
                  duration: 0.35,
                  delay:
                    0.15 +
                    index *
                      0.05,
                }}
              />
            )
          )}
        </svg>

        <div className="mt-1 grid grid-cols-7 gap-1 px-1">
          {data.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item.shortLabel}-${index}`}
                className="min-w-0 text-center"
              >
                <span className="text-[9px] font-bold text-slate-400">
                  {
                    item.shortLabel
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "emerald"
    | "rose"
    | "blue";
}) {
  const styles = {
    emerald:
      "bg-emerald-50 text-emerald-700",

    rose:
      "bg-rose-50 text-rose-700",

    blue:
      "bg-blue-50 text-blue-700",
  } as const;

  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3">
      <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-black ${styles[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8]"
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />

      <span className="truncate">
        {label}
      </span>
    </Link>
  );
}

/* =========================================================
   KYC BADGE
========================================================= */

function KycBadge({
  status,
}: {
  status: KYCStatus;
}) {
  const config: Record<
    KYCStatus,
    {
      label: string;
      className: string;
    }
  > = {
    not_started: {
      label: "Not Started",
      className:
        "bg-slate-100 text-slate-600",
    },

    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700",
    },

    under_review: {
      label: "Under Review",
      className:
        "bg-blue-50 text-blue-700",
    },

    verified: {
      label: "Verified",
      className:
        "bg-emerald-50 text-emerald-700",
    },

    rejected: {
      label: "Rejected",
      className:
        "bg-red-50 text-red-700",
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

/* =========================================================
   TRANSACTION VIEW
========================================================= */

function createTransactionView(
  transaction: TransactionData,
  currentUserId: string
) {
  const receiverId =
    getUserId(
      transaction.receiverId
    );

  const isCredit =
    receiverId ===
    currentUserId;

  const counterparty =
    isCredit
      ? getUserName(
          transaction.senderId
        )
      : getUserName(
          transaction.receiverId
        );

  let title = isCredit
    ? `Received from ${counterparty}`
    : `Sent to ${counterparty}`;

  if (
    transaction.type ===
    "DEPOSIT"
  ) {
    title =
      "Wallet Deposit";
  }

  if (
    transaction.type ===
    "WITHDRAW"
  ) {
    title =
      "Wallet Withdrawal";
  }

  return {
    id:
      transaction._id,

    title,

    date:
      formatDate(
        transaction.createdAt
      ),

    amount: `${
      isCredit
        ? "+"
        : "-"
    } ${formatCurrency(
      transaction.amount
    )}`,

    type:
      transaction.type,

    isCredit,

    icon: isCredit
      ? ArrowDownLeft
      : transaction.type ===
          "WITHDRAW"
        ? Banknote
        : ArrowUpRight,
  };
}

/* =========================================================
   7 DAYS SPENDING

   Combines wallet outgoing transactions
   and manual Budget expenses.
========================================================= */

function getLastSevenDaysSpending(
  transactions: TransactionData[],
  currentUserId: string,
  budgetExpenses: BudgetExpense[]
) {
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

      date.setDate(
        today.getDate() -
          (6 - index)
      );

      date.setHours(
        0,
        0,
        0,
        0
      );

      const nextDay =
        new Date(
          date
        );

      nextDay.setDate(
        date.getDate() +
          1
      );

      const transactionAmount =
        transactions
          .filter(
            (
              transaction
            ) => {
              if (
                transaction.status !==
                "COMPLETED"
              ) {
                return false;
              }

              if (
                getUserId(
                  transaction.senderId
                ) !==
                currentUserId
              ) {
                return false;
              }

              if (
                transaction.type ===
                "DEPOSIT"
              ) {
                return false;
              }

              if (
                !transaction.createdAt
              ) {
                return false;
              }

              const created =
                new Date(
                  transaction.createdAt
                );

              if (
                Number.isNaN(
                  created.getTime()
                )
              ) {
                return false;
              }

              return (
                created >=
                  date &&
                created <
                  nextDay
              );
            }
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          );

      const budgetAmount =
        budgetExpenses
          .filter(
            (
              expense
            ) => {
              if (
                !expense.date
              ) {
                return false;
              }

              const created =
                new Date(
                  expense.date
                );

              if (
                Number.isNaN(
                  created.getTime()
                )
              ) {
                return false;
              }

              return (
                created >=
                  date &&
                created <
                  nextDay
              );
            }
          )
          .reduce(
            (
              total,
              expense
            ) =>
              total +
              Number(
                expense.amount ||
                  0
              ),
            0
          );

      return {
        label:
          date.toLocaleDateString(
            "en-BD",
            {
              weekday:
                "long",
            }
          ),

        shortLabel:
          date.toLocaleDateString(
            "en-BD",
            {
              weekday:
                "short",
            }
          ),

        amount:
          transactionAmount +
          budgetAmount,
      };
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getUserId(
  value:
    | string
    | PopulatedUser
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return String(
    value?._id || ""
  );
}

function getUserName(
  value:
    | string
    | PopulatedUser
): string {
  if (
    typeof value ===
      "object" &&
    value?.name
  ) {
    return value.name;
  }

  return "another user";
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "Recent";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recent";
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

function getTimestamp(
  value?: string
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}

function formatCurrency(
  amount: number
): string {
  return `\u09F3 ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getGreeting(): string {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}