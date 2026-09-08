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
  FileText,
  Lightbulb,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
  UserRound,
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
   SHARED LAYOUT
========================================================= */

const TWO_COLUMN_TEMPLATE =
  "xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]";

const NARROW_CARD_MIN_HEIGHT =
  "min-h-[250px]";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function UserDashboardOverview({
  user,
  wallet,
  transactions,
}: UserDashboardOverviewProps) {
  /* =======================================================
     GREETING
  ======================================================== */

  const [
    timeGreeting,
    setTimeGreeting,
  ] = useState(
    "Good afternoon"
  );

  /* =======================================================
     REVEAL STATES
  ======================================================== */

  const [
    revealed,
    setRevealed,
  ] = useState<
    Record<string, boolean>
  >({});

  /* =======================================================
     BUDGET
  ======================================================== */

  const [
    budgetExpenses,
    setBudgetExpenses,
  ] = useState<
    BudgetExpense[]
  >([]);

  const [
    budgetExpensesLoading,
    setBudgetExpensesLoading,
  ] = useState(true);

  /* =======================================================
     GREETING EFFECT
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
     REVEAL HANDLER
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

  /* =======================================================
     LOAD BUDGET EXPENSES
  ======================================================== */

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

  /* =======================================================
     INITIAL BUDGET LOAD
  ======================================================== */

  useEffect(() => {
    void loadBudgetExpenses();
  }, [
    loadBudgetExpenses,
  ]);

  /* =======================================================
     AUTO REFRESH
  ======================================================== */

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

  /* =======================================================
     COMPLETED TRANSACTIONS
  ======================================================== */

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

  /* =======================================================
     TOTAL RECEIVED
  ======================================================== */

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

  /* =======================================================
     TOTAL SENT
  ======================================================== */

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

  /* =======================================================
     CURRENT MONTH BUDGET EXPENSES
  ======================================================== */

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

  /* =======================================================
     BUDGET TOTAL
  ======================================================== */

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

  /* =======================================================
     MONTHLY SPENDING
  ======================================================== */

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

  /* =======================================================
     RECENT ACTIVITY
  ======================================================== */

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

  /* =======================================================
     SPENDING CHART
  ======================================================== */

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

  /* =======================================================
     SEVEN DAY TOTAL
  ======================================================== */

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

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden pb-10">
      {/* ====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden rounded-[30px] border border-violet-900/20 bg-gradient-to-br from-[#080414] via-[#160A36] to-[#35127B] px-5 py-7 text-white shadow-[0_24px_80px_rgba(76,29,149,0.22)] sm:px-7 sm:py-8 lg:px-9 lg:py-9">
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
          className="pointer-events-none absolute right-[14%] top-7 h-2.5 w-2.5 rounded-full bg-violet-200 shadow-[0_0_20px_rgba(196,181,253,0.7)]"
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
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-300/10 ring-1 ring-violet-200/10">
                <WalletCards className="h-3.5 w-3.5 text-violet-200" />
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
                <h1 className="min-w-0 truncate bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-[2.55rem] font-black leading-[0.98] tracking-[-0.055em] text-transparent sm:text-[3.6rem]">
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-200/10 bg-white/[0.06] text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.15)] sm:h-11 sm:w-11"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
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
                className="mt-3 h-[3px] rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300"
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

                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/10 bg-violet-300/5 px-3 py-1.5 text-[10px] font-semibold text-violet-100/70">
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
              className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-xs font-extrabold text-violet-950 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.25)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Send className="h-3.5 w-3.5" />
              </span>

              Send Money

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard/receive"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-violet-200/15 bg-white/[0.08] px-5 text-xs font-extrabold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.13]"
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
          iconClass="from-violet-400/20 to-indigo-500/20 text-violet-200 ring-violet-300/15"
          accent="violet"
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
          iconClass="from-emerald-400/20 to-violet-400/10 text-emerald-200 ring-emerald-300/15"
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
          iconClass="from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200 ring-fuchsia-300/15"
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
          iconClass="from-violet-400/20 to-indigo-400/10 text-violet-200 ring-violet-300/15"
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
          TRANSACTIONS + QUICK SNAPSHOT
      ===================================================== */}

      <section
        className={`grid min-w-0 items-stretch gap-6 ${TWO_COLUMN_TEMPLATE}`}
      >
        {/* ==================================================
            RECENT TRANSACTIONS
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.45,
          }}
          className="min-w-0 rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)] sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-black text-foreground">
                Recent Transactions
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your latest wallet and budget activity.
              </p>
            </div>

            <Link
              href="/dashboard/transactions"
              className="group inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-violet-600 transition hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
            >
              View all

              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {budgetExpensesLoading &&
          transactions.length ===
            0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/50 p-8">
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
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.35,
                        delay:
                          index *
                          0.05,
                      }}
                      whileHover={{
                        x: 2,
                      }}
                      className="group flex min-w-0 items-center justify-between rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-violet-200 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            transaction.isCredit
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : transaction.source ===
                                  "budget"
                                ? "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-foreground">
                            {
                              transaction.title
                            }
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
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
                            ? "text-emerald-600 dark:text-emerald-400"
                            : transaction.source ===
                                "budget"
                              ? "text-violet-600 dark:text-violet-300"
                              : "text-foreground"
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
        </motion.div>

        {/* ==================================================
            QUICK SNAPSHOT
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.45,
            delay: 0.06,
          }}
          className="min-w-0 rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)] sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                Wallet
              </p>

              <h2 className="mt-1 text-lg font-black text-foreground">
                Quick Snapshot
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                A compact view of your balance, wallet state and activity.
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
              <WalletCards className="h-4 w-4" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-violet-300/20 bg-gradient-to-br from-[#120729] via-[#24104F] to-[#4C1D95] p-5 text-white shadow-[0_18px_50px_rgba(76,29,149,0.22)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-violet-400/15 blur-3xl" />

            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/40 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/60">
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
                    valueClass="text-white"
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
                  whileHover={{
                    scale: 1.04,
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

              <div className="mt-6 grid grid-cols-2 gap-3">
                <SnapshotMetric
                  label="Wallet status"
                  value="Active"
                  icon={CheckCircle2}
                  tone="emerald"
                />

                <SnapshotMetric
                  label="Security"
                  value="Protected"
                  icon={ShieldCheck}
                  tone="violet"
                />

                <SnapshotMetric
                  label="This month"
                  value={formatCurrency(
                    monthlySpending
                  )}
                  icon={BarChart3}
                  tone="fuchsia"
                />

                <SnapshotMetric
                  label="Last 7 days"
                  value={formatCurrency(
                    lastSevenDaysTotal
                  )}
                  icon={Clock3}
                  tone="indigo"
                />
              </div>
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

          <Link
            href="/dashboard/insights"
            className="group mt-3 flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100/70 dark:border-violet-800 dark:bg-violet-950/20 dark:hover:border-violet-700 dark:hover:bg-violet-950/35"
          >
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                Smart insights
              </p>

              <p className="mt-1 truncate text-xs font-black text-foreground">
                Explore your spending patterns
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-violet-500 transition-transform group-hover:translate-x-1 dark:text-violet-300" />
          </Link>
        </motion.div>
      </section>

      {/* ====================================================
          ANALYTICS + SECURITY
      ===================================================== */}

      <section
        className={`grid min-w-0 items-stretch gap-6 ${TWO_COLUMN_TEMPLATE}`}
      >
        {/* ==================================================
            SPENDING INSIGHTS
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.45,
          }}
          className="min-w-0 overflow-hidden rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)] sm:p-6"
        >
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                <BarChart3 className="h-[18px] w-[18px]" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">
                  Analytics
                </p>

                <h2 className="mt-0.5 truncate text-lg font-black text-foreground">
                  Spending Insights
                </h2>
              </div>
            </div>

            <Link
              href="/dashboard/insights"
              className="group inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-violet-600 dark:text-violet-300"
            >
              Open insights

              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Last 7 days
              </p>

              <p className="mt-1 text-sm font-black text-foreground">
                {formatCurrency(
                  lastSevenDaysTotal
                )}
              </p>
            </div>

            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold ${
                spendingTrend ===
                "up"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                  : spendingTrend ===
                      "down"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
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
              tone="violet"
            />
          </div>
        </motion.div>

        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <div className="grid min-w-0 gap-5">
          {/* IDENTITY VERIFICATION */}

          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.12,
            }}
            transition={{
              duration: 0.45,
            }}
            className={`min-w-0 ${NARROW_CARD_MIN_HEIGHT} flex flex-col rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)] sm:p-6`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
                      Account security
                    </p>

                    <h2 className="mt-0.5 truncate text-base font-black text-foreground">
                      Identity Verification
                    </h2>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  Keep your identity verified to unlock secure wallet functionality.
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
                className="group mt-4 flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-violet-200 bg-violet-50/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/20 dark:hover:border-violet-700 dark:hover:bg-violet-950/35"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-foreground">
                    Complete KYC verification
                  </p>

                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    Submit your identity documents to unlock protected actions.
                  </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-violet-600 shadow-sm dark:text-violet-300">
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {kycStatus ===
              "verified" && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/25">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-emerald-600 shadow-sm dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                    Identity verified
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-emerald-700 dark:text-emerald-300">
                    Your protected wallet actions are available.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <div className="grid grid-cols-2 gap-2">
                <MiniSecurityStat
                  label="Session"
                  value="Protected"
                />

                <MiniSecurityStat
                  label="Verification"
                  value={
                    kycStatus ===
                    "verified"
                      ? "Complete"
                      : "Required"
                  }
                />
              </div>
            </div>
          </motion.div>

          {/* SMART WALLET TIP */}

          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.12,
            }}
            transition={{
              duration: 0.45,
              delay: 0.06,
            }}
            className={`relative min-w-0 ${NARROW_CARD_MIN_HEIGHT} flex flex-col overflow-hidden rounded-[28px] border border-violet-200 bg-gradient-to-br from-violet-50 via-background to-indigo-50 p-5 text-foreground shadow-[var(--dashboard-shadow)] dark:border-violet-800 dark:from-violet-950/25 dark:via-card dark:to-indigo-950/20 sm:p-6`}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />

            <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-fuchsia-300/10 blur-3xl dark:bg-fuchsia-500/10" />

            <div className="relative z-10 flex min-w-0 gap-4">
              <motion.div
                animate={{
                  y: [
                    0,
                    -3,
                    0,
                  ],
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-background text-violet-600 shadow-sm dark:border-violet-800 dark:text-violet-300"
              >
                <Lightbulb className="h-5 w-5" />
              </motion.div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-foreground">
                    Smart Wallet Tip
                  </p>

                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                    Tip
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  Your current monthly spending is{" "}
                  <span className="font-extrabold text-foreground">
                    {formatCurrency(
                      monthlySpending
                    )}
                  </span>
                  . Keeping spending visible helps you make better saving decisions.
                </p>

                <Link
                  href="/dashboard/budgeting"
                  className="group mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-violet-600 dark:text-violet-300"
                >
                  Open budgeting

                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="relative z-10 mt-auto pt-5">
              <div className="grid grid-cols-2 gap-2">
                <MiniSecurityStat
                  label="Monthly spending"
                  value={formatCurrency(
                    monthlySpending
                  )}
                />

                <MiniSecurityStat
                  label="7 day spending"
                  value={formatCurrency(
                    lastSevenDaysTotal
                  )}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SNAPSHOT METRIC
========================================================= */

function SnapshotMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone:
    | "emerald"
    | "violet"
    | "fuchsia"
    | "indigo";
}) {
  const toneClasses = {
    emerald:
      "bg-emerald-400/10 text-emerald-200 border-emerald-300/10",

    violet:
      "bg-violet-400/10 text-violet-200 border-violet-300/10",

    fuchsia:
      "bg-fuchsia-400/10 text-fuchsia-200 border-fuchsia-300/10",

    indigo:
      "bg-indigo-400/10 text-indigo-200 border-indigo-300/10",
  };

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className={`rounded-[16px] border p-3 ${toneClasses[tone]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" />

        <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/45">
          {label}
        </p>
      </div>

      <p className="mt-1 truncate text-[11px] font-black text-white">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   MINI SECURITY STAT
========================================================= */

function MiniSecurityStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate text-[10px] font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY TRANSACTIONS
========================================================= */

function EmptyTransactions() {
  return (
    <div className="rounded-[22px] border border-dashed border-border bg-muted/50 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
        <Activity className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-extrabold text-foreground">
        No transactions yet
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
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
      "from-violet-300 via-indigo-400 to-violet-500",

    emerald:
      "from-emerald-300 via-teal-300 to-violet-400",

    fuchsia:
      "from-fuchsia-300 via-pink-400 to-violet-500",

    violet:
      "from-violet-300 via-fuchsia-300 to-indigo-300",
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
      className="group relative min-h-[182px] w-full overflow-hidden rounded-[26px] border border-violet-900/10 bg-gradient-to-br from-[#0A071C] via-[#140A2D] to-[#2A1156] p-5 text-left shadow-[0_18px_45px_rgba(25,8,63,0.22)] outline-none transition-shadow duration-300 hover:shadow-[0_24px_55px_rgba(74,24,145,0.32)] focus-visible:ring-2 focus-visible:ring-violet-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

      <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-indigo-400/5 blur-2xl" />

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

      <AnimatePresence initial={false}>
        {!revealed ? (
          <motion.div
            key="hidden-status"
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
        ) : (
          <motion.div
            key="visible-status"
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
    "text-foreground",
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
    "৳ •••••";

  return (
    <div
      className={`relative ${
        compact
          ? "text-2xl sm:text-[2rem]"
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
            className={`inline-block ${
              dark
                ? "text-white"
                : valueClass
            }`}
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
              dark
                ? "text-violet-100/90"
                : "text-foreground"
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

/* =========================================================
   REVEAL ICON
========================================================= */

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
              data.length - 1,
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
          <div className="rounded-full border border-border bg-background/90 px-4 py-2 text-[10px] font-bold text-muted-foreground shadow-sm backdrop-blur">
            No spending activity yet
          </div>
        </div>
      )}

      <div className="relative min-w-0 overflow-hidden rounded-[22px] border border-border bg-gradient-to-b from-violet-50/70 to-background p-3 dark:from-violet-950/20 dark:to-card">
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
                stopColor="#7C3AED"
                stopOpacity="0.25"
              />

              <stop
                offset="100%"
                stopColor="#7C3AED"
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
                  stroke="#E9D5FF"
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
            stroke="#7C3AED"
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
                stroke="#7C3AED"
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
                <span className="text-[9px] font-bold text-muted-foreground">
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
    | "violet";
}) {
  const styles = {
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",

    rose:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",

    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  } as const;

  return (
    <div className="min-w-0 rounded-2xl bg-muted/60 p-3">
      <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
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
      className="group flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-xs font-bold text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-800 dark:hover:bg-violet-950/20 dark:hover:text-violet-300"
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
        "bg-muted text-muted-foreground",
    },

    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    },

    under_review: {
      label: "Under Review",
      className:
        "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    },

    verified: {
      label: "Verified",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },

    rejected: {
      label: "Rejected",
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
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
   USER ID
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

/* =========================================================
   USER NAME
========================================================= */

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

/* =========================================================
   DATE
========================================================= */

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

/* =========================================================
   TIMESTAMP
========================================================= */

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

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

/* =========================================================
   GREETING
========================================================= */

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