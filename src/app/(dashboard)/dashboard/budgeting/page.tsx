"use client";

import React, {
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
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar as CalendarIcon,
  Car,
  CheckCircle2,
  ChevronRight,
  Edit2,
  FileText,
  Film,
  Info,
  Loader2,
  MoreHorizontal,
  PieChart,
  RefreshCw,
  Plane,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  addBudgetSavings,
  createBudgetCategory,
  createBudgetExpense,
  getBudgetDashboard,
  saveBudgetCategoryLimit,
  saveBudgetSettings,
} from "@/lib/api/budgetApi";

/* =========================================================
   TYPES
========================================================= */

interface Category {
  id: string;
  name: string;
  iconName: string;
  limit: number;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string;
  method: string;
}

interface BudgetSettings {
  totalLimit: number;
  savingsGoal: number;
  currentSavings: number;
}

interface ToastInfo {
  message: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info";
}

/* =========================================================
   INITIAL STATE
   Real data is loaded from /api/budgets/dashboard.
========================================================= */

const DEFAULT_CATEGORIES:
  Category[] = [];

const DEFAULT_SETTINGS:
  BudgetSettings = {
    totalLimit: 0,
    savingsGoal: 0,
    currentSavings: 0,
  };

const DEFAULT_EXPENSES:
  Expense[] = [];

/* =========================================================
   HELPERS
========================================================= */

const iconMap: Record<
  string,
  React.ElementType
> = {
  Utensils,
  ShoppingBag,
  Car,
  FileText,
  Film,
  Activity,
  BookOpen,
  Plane,
  Zap,
  MoreHorizontal,
};

function getIcon(
  name: string
) {
  const Icon =
    iconMap[name] ||
    MoreHorizontal;

  return (
    <Icon className="h-5 w-5" />
  );
}

function formatCurrency(
  amount: number
) {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function isSameMonth(
  date: Date,
  target: Date
) {
  return (
    date.getFullYear() ===
      target.getFullYear() &&
    date.getMonth() ===
      target.getMonth()
  );
}

function getStartOfWeek(
  date: Date
) {
  const start =
    new Date(date);

  start.setHours(
    0,
    0,
    0,
    0
  );

  const day =
    start.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  start.setDate(
    start.getDate() +
      diff
  );

  return start;
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error &&
    error.message
    ? error.message
    : fallback;
}

/* =========================================================
   MODAL SHELL
========================================================= */

function ModalShell({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children:
    React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 14,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 14,
            }}
            transition={{
              duration: 0.2,
            }}
            className={`max-h-[88vh] w-full overflow-y-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl md:p-8 ${maxWidth}`}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-[#0F2745]">
                {title}
              </h3>

              <button
                type="button"
                onClick={
                  onClose
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BudgetingPage() {
  const [
    isMounted,
    setIsMounted,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    toast,
    setToast,
  ] =
    useState<ToastInfo | null>(
      null
    );

  const [
    settings,
    setSettings,
  ] =
    useState<BudgetSettings>(
      DEFAULT_SETTINGS
    );

  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>(
      DEFAULT_CATEGORIES
    );

  const [
    expenses,
    setExpenses,
  ] =
    useState<Expense[]>(
      DEFAULT_EXPENSES
    );

  const [
    expenseModalOpen,
    setExpenseModalOpen,
  ] =
    useState(false);

  const [
    budgetModalOpen,
    setBudgetModalOpen,
  ] =
    useState(false);

  const [
    savingsModalOpen,
    setSavingsModalOpen,
  ] =
    useState(false);

  const [
    categoryModalOpen,
    setCategoryModalOpen,
  ] =
    useState(false);

  const [
    showAllExpenses,
    setShowAllExpenses,
  ] =
    useState(false);

  const [
    expTitle,
    setExpTitle,
  ] =
    useState("");

  const [
    expAmount,
    setExpAmount,
  ] =
    useState("");

  const [
    expCategory,
    setExpCategory,
  ] =
    useState("");

  const [
    editTotalLimit,
    setEditTotalLimit,
  ] =
    useState("");

  const [
    editSavingsGoal,
    setEditSavingsGoal,
  ] =
    useState("");

  const [
    savingsAmount,
    setSavingsAmount,
  ] =
    useState("");

  const [
    newCategoryName,
    setNewCategoryName,
  ] =
    useState("");

  const [
    newCategoryLimit,
    setNewCategoryLimit,
  ] =
    useState("");

  /* =======================================================
     BACKEND DATA
  ======================================================= */

  const loadBudgetData =
    async () => {
      try {
        setIsLoading(
          true
        );

        setErrorMessage(
          ""
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
              "Unable to load budget data."
          );
        }

        setSettings(
          response.settings
        );

        setCategories(
          response.categories
        );

        setExpenses(
          response.expenses
        );

        setExpCategory(
          (
            currentValue
          ) => {
            const stillExists =
              response.categories.some(
                (
                  category
                ) =>
                  category.id ===
                  currentValue
              );

            if (
              stillExists
            ) {
              return currentValue;
            }

            return (
              response.categories[
                0
              ]?.id || ""
            );
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Budget dashboard loading error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load budget data."
          )
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  useEffect(() => {
    setIsMounted(
      true
    );

    void loadBudgetData();
  }, []);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (
    message: string,
    type:
      ToastInfo["type"] =
      "success"
  ) => {
    setToast({
      message,
      type,
    });

    window.setTimeout(
      () =>
        setToast(null),
      3500
    );
  };

  /* =======================================================
     CURRENT PERIOD
  ======================================================= */

  const now =
    new Date();

  const daysInMonth =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

  const remainingDays =
    Math.max(
      daysInMonth -
        now.getDate(),
      0
    );

  const monthLabel =
    now.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  const currentMonthExpenses =
    useMemo(
      () =>
        expenses
          .filter(
            (
              expense
            ) =>
              isSameMonth(
                new Date(
                  expense.date
                ),
                now
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.date
              ).getTime() -
              new Date(
                a.date
              ).getTime()
          ),
      [
        expenses,
        now.getFullYear(),
        now.getMonth(),
      ]
    );

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const totalSpent =
    useMemo(
      () =>
        currentMonthExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            expense.amount,
          0
        ),
      [
        currentMonthExpenses,
      ]
    );

  const percentageUsed =
    settings.totalLimit > 0
      ? Math.min(
          (
            totalSpent /
            settings.totalLimit
          ) *
            100,
          100
        )
      : 0;

  const rawPercentageUsed =
    settings.totalLimit > 0
      ? (
          totalSpent /
          settings.totalLimit
        ) * 100
      : 0;

  const remainingBudget =
    settings.totalLimit -
    totalSpent;

  const categoryStats =
    useMemo(
      () =>
        categories.map(
          (
            category
          ) => {
            const spent =
              currentMonthExpenses
                .filter(
                  (
                    expense
                  ) =>
                    expense.categoryId ===
                    category.id
                )
                .reduce(
                  (
                    total,
                    expense
                  ) =>
                    total +
                    expense.amount,
                  0
                );

            const rawPercentage =
              category.limit >
              0
                ? (
                    spent /
                    category.limit
                  ) *
                  100
                : 0;

            return {
              ...category,
              spent,
              percentage:
                Math.min(
                  rawPercentage,
                  100
                ),
              rawPercentage,
              remaining:
                category.limit -
                spent,
            };
          }
        ),
      [
        categories,
        currentMonthExpenses,
      ]
    );

  const categoriesOverBudget =
    categoryStats.filter(
      (
        category
      ) =>
        category.spent >
        category.limit
    ).length;

  const savingsProgress =
    settings.savingsGoal > 0
      ? clamp(
          (
            settings.currentSavings /
            settings.savingsGoal
          ) *
            100,
          0,
          100
        )
      : 0;

  const healthScore =
    useMemo(() => {
      let score = 100;

      if (
        rawPercentageUsed >
        100
      ) {
        score -= 40;
      } else if (
        rawPercentageUsed >
        90
      ) {
        score -= 30;
      } else if (
        rawPercentageUsed >
        75
      ) {
        score -= 15;
      }

      score -=
        categoriesOverBudget *
        10;

      if (
        savingsProgress >=
        50
      ) {
        score += 5;
      }

      return clamp(
        score,
        0,
        100
      );
    }, [
      rawPercentageUsed,
      categoriesOverBudget,
      savingsProgress,
    ]);

  const scoreStatus =
    useMemo(() => {
      if (
        healthScore >= 90
      ) {
        return {
          label:
            "Excellent",
          color:
            "text-emerald-600",
          bg:
            "bg-emerald-100",
        };
      }

      if (
        healthScore >= 75
      ) {
        return {
          label: "Healthy",
          color:
            "text-blue-600",
          bg:
            "bg-blue-100",
        };
      }

      if (
        healthScore >= 50
      ) {
        return {
          label:
            "Needs Attention",
          color:
            "text-amber-600",
          bg:
            "bg-amber-100",
        };
      }

      return {
        label: "At Risk",
        color:
          "text-rose-600",
        bg:
          "bg-rose-100",
      };
    }, [
      healthScore,
    ]);

  /* =======================================================
     REAL WEEKLY SPENDING FROM LOCAL EXPENSE DATA
  ======================================================= */

  const weeklySpending =
    useMemo(() => {
      const start =
        getStartOfWeek(
          now
        );

      return [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ].map(
        (
          name,
          index
        ) => {
          const day =
            new Date(
              start
            );

          day.setDate(
            start.getDate() +
              index
          );

          const amount =
            expenses
              .filter(
                (
                  expense
                ) => {
                  const date =
                    new Date(
                      expense.date
                    );

                  return (
                    date.getFullYear() ===
                      day.getFullYear() &&
                    date.getMonth() ===
                      day.getMonth() &&
                    date.getDate() ===
                      day.getDate()
                  );
                }
              )
              .reduce(
                (
                  total,
                  expense
                ) =>
                  total +
                  expense.amount,
                0
              );

          return {
            name,
            amount,
          };
        }
      );
    }, [
      expenses,
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ]);

  const maxWeeklySpend =
    Math.max(
      ...weeklySpending.map(
        (
          day
        ) =>
          day.amount
      ),
      1
    );

  /* =======================================================
     SMART INSIGHTS
  ======================================================= */

  const elapsedMonthPercent =
    (
      now.getDate() /
      daysInMonth
    ) *
    100;

  const spendingPaceDelta =
    rawPercentageUsed -
    elapsedMonthPercent;

  const spendingPaceInsight =
    spendingPaceDelta >
    10
      ? {
          title:
            "Spending Pace",
          text:
            "You are spending faster than the current pace of the month. Consider slowing down discretionary spending.",
          tone:
            "warning",
        }
      : {
          title:
            "Spending Pace",
          text:
            "Your spending pace is currently within a comfortable range for this month.",
          tone:
            "good",
        };

  const largestCategory =
    useMemo(
      () =>
        [...categoryStats].sort(
          (
            a,
            b
          ) =>
            b.spent -
            a.spent
        )[0],
      [
        categoryStats,
      ]
    );

  /* =======================================================
     CALENDAR
  ======================================================= */

  const calendarDays =
    useMemo(() => {
      const firstDay =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).getDay();

      const activeExpenseDays =
        new Set(
          currentMonthExpenses.map(
            (
              expense
            ) =>
              new Date(
                expense.date
              ).getDate()
          )
        );

      const cells: Array<
        number | null
      > = [];

      for (
        let index = 0;
        index < firstDay;
        index += 1
      ) {
        cells.push(
          null
        );
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day += 1
      ) {
        cells.push(
          day
        );
      }

      return {
        cells,
        activeExpenseDays,
      };
    }, [
      currentMonthExpenses,
      now.getFullYear(),
      now.getMonth(),
      daysInMonth,
    ]);

  /* =======================================================
     HANDLERS
  ======================================================= */

  const openBudgetModal =
    () => {
      setEditTotalLimit(
        settings.totalLimit.toString()
      );

      setEditSavingsGoal(
        settings.savingsGoal.toString()
      );

      setBudgetModalOpen(
        true
      );
    };

  const handleAddExpense =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      const amount =
        Number(
          expAmount
        );

      if (
        !expTitle.trim() ||
        !Number.isFinite(
          amount
        ) ||
        amount <= 0 ||
        !expCategory
      ) {
        showToast(
          "Please enter valid expense details.",
          "error"
        );

        return;
      }

      try {
        setIsSaving(
          true
        );

        const current =
          new Date();

        const response =
          await createBudgetExpense(
            {
              month:
                current.getMonth() +
                1,

              year:
                current.getFullYear(),

              title:
                expTitle.trim(),

              amount,

              categoryId:
                expCategory,

              method:
                "Manual Entry",
            }
          );

        setExpenses(
          (
            existing
          ) => [
            response.expense,
            ...existing,
          ]
        );

        setExpenseModalOpen(
          false
        );

        setExpTitle("");
        setExpAmount("");

        showToast(
          response.message ||
            "Expense added successfully."
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Failed to add expense."
          ),
          "error"
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const handleUpdateBudget =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      const limit =
        Number(
          editTotalLimit
        );

      const goal =
        Number(
          editSavingsGoal
        );

      if (
        !Number.isFinite(
          limit
        ) ||
        limit <= 0 ||
        !Number.isFinite(
          goal
        ) ||
        goal <= 0
      ) {
        showToast(
          "Please enter valid budget amounts.",
          "error"
        );

        return;
      }

      try {
        setIsSaving(
          true
        );

        const current =
          new Date();

        const response =
          await saveBudgetSettings(
            {
              month:
                current.getMonth() +
                1,

              year:
                current.getFullYear(),

              totalLimit:
                limit,

              savingsGoal:
                goal,
            }
          );

        setSettings(
          response.settings
        );

        setBudgetModalOpen(
          false
        );

        showToast(
          response.message ||
            "Budget settings updated."
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Failed to update budget settings."
          ),
          "error"
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const handleAddSavings =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      const amount =
        Number(
          savingsAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        showToast(
          "Enter a valid savings amount.",
          "error"
        );

        return;
      }

      try {
        setIsSaving(
          true
        );

        const response =
          await addBudgetSavings(
            amount
          );

        setSettings(
          (
            current
          ) => ({
            ...current,

            savingsGoal:
              response.savings
                .savingsGoal,

            currentSavings:
              response.savings
                .currentSavings,
          })
        );

        setSavingsAmount("");

        setSavingsModalOpen(
          false
        );

        showToast(
          response.message ||
            "Savings updated successfully."
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Failed to update savings."
          ),
          "error"
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const handleAddCategory =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      const limit =
        Number(
          newCategoryLimit
        );

      if (
        !newCategoryName.trim() ||
        !Number.isFinite(
          limit
        ) ||
        limit <= 0
      ) {
        showToast(
          "Enter a valid category name and limit.",
          "error"
        );

        return;
      }

      const exists =
        categories.some(
          (
            category
          ) =>
            category.name
              .trim()
              .toLowerCase() ===
            newCategoryName
              .trim()
              .toLowerCase()
        );

      if (exists) {
        showToast(
          "A category with this name already exists.",
          "warning"
        );

        return;
      }

      try {
        setIsSaving(
          true
        );

        const current =
          new Date();

        const response =
          await createBudgetCategory(
            {
              month:
                current.getMonth() +
                1,

              year:
                current.getFullYear(),

              name:
                newCategoryName.trim(),

              limit,

              iconName:
                "MoreHorizontal",
            }
          );

        setCategories(
          (
            existing
          ) => [
            ...existing,
            response.category,
          ]
        );

        setNewCategoryName("");
        setNewCategoryLimit("");

        setExpCategory(
          (
            currentValue
          ) =>
            currentValue ||
            response.category.id
        );

        showToast(
          response.message ||
            "Category added."
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Failed to add category."
          ),
          "error"
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const updateCategoryLimit =
    async (
      id: string,
      value: string
    ) => {
      if (isSaving) {
        return;
      }

      const limit =
        Number(
          value
        );

      if (
        !Number.isFinite(
          limit
        ) ||
        limit <= 0
      ) {
        showToast(
          "Enter a valid category limit.",
          "error"
        );

        return;
      }

      const previous =
        categories.find(
          (
            category
          ) =>
            category.id ===
            id
        );

      if (
        previous &&
        previous.limit ===
          limit
      ) {
        return;
      }

      try {
        setIsSaving(
          true
        );

        const current =
          new Date();

        const response =
          await saveBudgetCategoryLimit(
            id,
            {
              month:
                current.getMonth() +
                1,

              year:
                current.getFullYear(),

              limit,
            }
          );

        setCategories(
          (
            existing
          ) =>
            existing.map(
              (
                category
              ) =>
                category.id ===
                id
                  ? response.category
                  : category
            )
        );

        showToast(
          response.message ||
            "Category limit updated."
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Failed to update category."
          ),
          "error"
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  if (
    !isMounted ||
    isLoading
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-[#1F5EA8]" />
          </div>

          <p className="mt-4 text-sm font-black text-[#0F2745]">
            Loading your budget
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Syncing budget settings, categories, savings, and expenses.
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage &&
    categories.length ===
      0
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <h1 className="mt-4 text-lg font-black text-[#0F2745]">
            Budget data could not be loaded
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadBudgetData()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173F6D]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const visibleExpenses =
    showAllExpenses
      ? currentMonthExpenses
      : currentMonthExpenses.slice(
          0,
          5
        );

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-16">
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

              <p className="text-xs font-semibold leading-5 text-amber-800">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadBudgetData()
              }
              className="inline-flex shrink-0 items-center gap-2 text-xs font-black text-amber-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        )}

        {/* ===================================================
            HERO
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F2745] via-[#173F6D] to-[#1F5EA8] p-7 text-white shadow-[0_24px_70px_rgba(15,39,69,0.18)] md:p-10"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                <Wallet className="h-3.5 w-3.5" />
                Coffer Budget Planner
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Budget & Spending
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80 md:text-base">
                Plan your monthly budget, track expenses,
                manage categories, and grow your savings
                from one clean dashboard.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-200/80">
                    Monthly Budget
                  </p>

                  <p className="mt-1 text-2xl font-black sm:text-3xl">
                    {formatCurrency(
                      settings.totalLimit
                    )}
                  </p>
                </div>

                <div className="hidden h-11 w-px bg-white/15 sm:block" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-200/80">
                    Spent So Far
                  </p>

                  <p className="mt-1 text-2xl font-black text-cyan-300 sm:text-3xl">
                    {formatCurrency(
                      totalSpent
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    openBudgetModal
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#1F5EA8] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 active:translate-y-0"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Budget
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setExpenseModalOpen(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </button>
              </div>
            </div>

            <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl sm:w-[240px]">
              <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
                Budget Health
              </p>

              <div className="relative mx-auto mt-4 h-36 w-36">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="41"
                    fill="none"
                    stroke="rgba(255,255,255,.10)"
                    strokeWidth="10"
                  />

                  <motion.circle
                    cx="50"
                    cy="50"
                    r="41"
                    fill="none"
                    stroke={
                      healthScore >=
                      75
                        ? "#34d399"
                        : healthScore >=
                            50
                          ? "#fbbf24"
                          : "#fb7185"
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={
                      2 *
                      Math.PI *
                      41
                    }
                    initial={{
                      strokeDashoffset:
                        2 *
                        Math.PI *
                        41,
                    }}
                    animate={{
                      strokeDashoffset:
                        2 *
                        Math.PI *
                        41 *
                        (1 -
                          healthScore /
                            100),
                    }}
                    transition={{
                      duration: 1.2,
                      ease: "easeOut",
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">
                    {Math.round(
                      healthScore
                    )}
                  </span>

                  <span className="text-[11px] font-semibold text-white/50">
                    / 100
                  </span>
                </div>
              </div>

              <div
                className={`mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${scoreStatus.bg} ${scoreStatus.color}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {scoreStatus.label}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            ROW 1
            Overview + Savings
        ==================================================== */}

        <div className="grid gap-6 xl:grid-cols-12">
          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="xl:col-span-8"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)] md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                      <PieChart className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-[#0F2745]">
                        Monthly Overview
                      </h2>

                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {remainingDays} days remaining in {monthLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Remaining
                  </p>

                  <p
                    className={`mt-1 text-2xl font-black ${
                      remainingBudget <
                      0
                        ? "text-rose-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(
                      remainingBudget
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-extrabold text-[#0F2745]">
                    {rawPercentageUsed.toFixed(
                      1
                    )}
                    % used
                  </span>

                  <span className="text-right text-xs font-bold text-slate-500">
                    {formatCurrency(
                      totalSpent
                    )}
                    {" / "}
                    {formatCurrency(
                      settings.totalLimit
                    )}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/70">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width:
                        `${percentageUsed}%`,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full ${
                      rawPercentageUsed >
                      100
                        ? "bg-rose-500"
                        : rawPercentageUsed >
                            85
                          ? "bg-amber-500"
                          : "bg-[#1F5EA8]"
                    }`}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Daily Avg.
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0F2745]">
                      {formatCurrency(
                        totalSpent /
                          Math.max(
                            now.getDate(),
                            1
                          )
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Categories
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0F2745]">
                      {categories.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Over Limit
                    </p>

                    <p
                      className={`mt-1 text-lg font-black ${
                        categoriesOverBudget >
                        0
                          ? "text-rose-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {categoriesOverBudget}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12,
            }}
            className="xl:col-span-4"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Target className="h-4.5 w-4.5" />
                  </div>

                  <h3 className="font-black text-[#0F2745]">
                    Savings Goal
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    openBudgetModal
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#1F5EA8]"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex h-[calc(100%-48px)] flex-col items-center justify-center pt-6">
                <div className="relative h-32 w-32">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="11"
                    />

                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={
                        2 *
                        Math.PI *
                        42
                      }
                      initial={{
                        strokeDashoffset:
                          2 *
                          Math.PI *
                          42,
                      }}
                      animate={{
                        strokeDashoffset:
                          2 *
                          Math.PI *
                          42 *
                          (1 -
                            savingsProgress /
                              100),
                      }}
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                      }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-[#0F2745]">
                      {Math.round(
                        savingsProgress
                      )}
                      %
                    </span>
                  </div>
                </div>

                <h4 className="mt-4 text-base font-black text-slate-800">
                  Emergency Fund
                </h4>

                <p className="mt-1 text-center text-xs leading-5 text-slate-400">
                  {savingsProgress >=
                  100
                    ? "Goal completed. Great work!"
                    : "Keep building your safety net consistently."}
                </p>

                <div className="mt-5 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Saved
                    </span>

                    <span className="font-black text-emerald-600">
                      {formatCurrency(
                        settings.currentSavings
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Target
                    </span>

                    <span className="font-black text-[#0F2745]">
                      {formatCurrency(
                        settings.savingsGoal
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSavingsModalOpen(
                      true
                    )
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Plus className="h-4 w-4" />
                  Add to Savings
                </button>
              </div>
            </div>
          </motion.section>
        </div>

        {/* ===================================================
            ROW 2
            Categories + Insights
        ==================================================== */}

        <div className="grid gap-6 xl:grid-cols-12">
          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.16,
            }}
            className="xl:col-span-8"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)] md:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F2745]">
                    Budget Categories
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Category limits and current month usage
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCategoryModalOpen(
                      true
                    )
                  }
                  className="inline-flex items-center gap-1 text-sm font-extrabold text-[#1F5EA8] transition hover:text-[#173F6D]"
                >
                  Manage
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {categoryStats.map(
                  (
                    category,
                    index
                  ) => {
                    const isOddLast =
                      categoryStats.length %
                        2 ===
                        1 &&
                      index ===
                        categoryStats.length -
                          1;

                    return (
                      <motion.div
                        key={
                          category.id
                        }
                        whileHover={{
                          y: -3,
                        }}
                        className={`rounded-2xl border border-slate-200 bg-slate-50/65 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-md ${
                          isOddLast
                            ? "md:col-span-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                category.rawPercentage >
                                100
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-blue-50 text-[#1F5EA8]"
                              }`}
                            >
                              {getIcon(
                                category.iconName
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-[#0F2745]">
                                {
                                  category.name
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                Monthly limit
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-black ${
                              category.rawPercentage >
                              100
                                ? "bg-rose-100 text-rose-600"
                                : category.rawPercentage >
                                    85
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-white text-slate-500"
                            }`}
                          >
                            {category.rawPercentage.toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-4 text-xs font-bold">
                          <span className="text-[#0F2745]">
                            {formatCurrency(
                              category.spent
                            )}
                          </span>

                          <span className="text-slate-400">
                            {formatCurrency(
                              category.limit
                            )}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80">
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width:
                                `${category.percentage}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              delay:
                                index *
                                0.05,
                            }}
                            className={`h-full rounded-full ${
                              category.rawPercentage >
                              100
                                ? "bg-rose-500"
                                : category.rawPercentage >
                                    85
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                        </div>

                        <p
                          className={`mt-2 text-right text-[11px] font-bold ${
                            category.remaining <
                            0
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}
                        >
                          {category.remaining <
                          0
                            ? `Over by ${formatCurrency(
                                Math.abs(
                                  category.remaining
                                )
                              )}`
                            : `${formatCurrency(
                                category.remaining
                              )} left`}
                        </p>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="xl:col-span-4"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Zap className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-black text-[#0F2745]">
                    Smart Insights
                  </h3>

                  <p className="text-[11px] font-medium text-slate-400">
                    Based on your current budget data
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {categoriesOverBudget >
                  0 && (
                  <div className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

                    <div>
                      <p className="text-sm font-black text-rose-800">
                        Action Required
                      </p>

                      <p className="mt-1 text-xs leading-5 text-rose-600">
                        {categoriesOverBudget} category
                        {categoriesOverBudget >
                        1
                          ? "ies are"
                          : " is"}{" "}
                        currently over budget.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 rounded-2xl border p-4 ${
                    spendingPaceInsight.tone ===
                    "warning"
                      ? "border-amber-100 bg-amber-50"
                      : "border-blue-100 bg-blue-50"
                  }`}
                >
                  {spendingPaceInsight.tone ===
                  "warning" ? (
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  )}

                  <div>
                    <p
                      className={`text-sm font-black ${
                        spendingPaceInsight.tone ===
                        "warning"
                          ? "text-amber-900"
                          : "text-blue-900"
                      }`}
                    >
                      {
                        spendingPaceInsight.title
                      }
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        spendingPaceInsight.tone ===
                        "warning"
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}
                    >
                      {
                        spendingPaceInsight.text
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-black text-emerald-900">
                      Savings Progress
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      You have completed{" "}
                      <span className="font-black">
                        {Math.round(
                          savingsProgress
                        )}
                        %
                      </span>{" "}
                      of your current savings goal.
                    </p>
                  </div>
                </div>

                {largestCategory &&
                  largestCategory.spent >
                    0 && (
                    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                      <div>
                        <p className="text-sm font-black text-slate-800">
                          Highest Spend
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {
                            largestCategory.name
                          }{" "}
                          is currently your largest category at{" "}
                          <span className="font-black text-slate-700">
                            {formatCurrency(
                              largestCategory.spent
                            )}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* ===================================================
            ROW 3
            Weekly Trend + Calendar
        ==================================================== */}

        <div className="grid gap-6 xl:grid-cols-12">
          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.24,
            }}
            className="xl:col-span-8"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)] md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#1F5EA8]" />

                    <h2 className="text-xl font-black text-[#0F2745]">
                      Weekly Spending Trend
                    </h2>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Real spending from this week
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 px-3 py-2 text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-400">
                    Week Total
                  </p>

                  <p className="text-sm font-black text-[#1F5EA8]">
                    {formatCurrency(
                      weeklySpending.reduce(
                        (
                          total,
                          day
                        ) =>
                          total +
                          day.amount,
                        0
                      )
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex h-56 items-end gap-2 rounded-2xl border border-slate-100 bg-slate-50/65 px-3 pb-4 pt-6 sm:gap-4 sm:px-5">
                {weeklySpending.map(
                  (
                    day,
                    index
                  ) => {
                    const height =
                      day.amount >
                      0
                        ? Math.max(
                            (
                              day.amount /
                              maxWeeklySpend
                            ) *
                              100,
                            8
                          )
                        : 3;

                    return (
                      <div
                        key={
                          day.name
                        }
                        className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div className="relative flex h-full w-full items-end justify-center">
                          <motion.div
                            initial={{
                              height: 0,
                            }}
                            animate={{
                              height:
                                `${height}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              delay:
                                index *
                                0.05,
                            }}
                            className={`relative w-full max-w-[46px] rounded-t-xl transition ${
                              day.amount >
                              0
                                ? "bg-[#1F5EA8]/25 group-hover:bg-[#1F5EA8]"
                                : "bg-slate-200"
                            }`}
                          >
                            {day.amount >
                              0 && (
                              <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-[#0F2745] px-2 py-1 text-[10px] font-black text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                                {formatCurrency(
                                  day.amount
                                )}
                              </div>
                            )}
                          </motion.div>
                        </div>

                        <span className="text-[11px] font-bold text-slate-400 transition group-hover:text-[#0F2745]">
                          {day.name}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.28,
            }}
            className="xl:col-span-4"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                  <CalendarIcon className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-black text-[#0F2745]">
                    {monthLabel}
                  </h3>

                  <p className="text-[11px] font-medium text-slate-400">
                    Expense activity calendar
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-1.5 text-center">
                {[
                  "S",
                  "M",
                  "T",
                  "W",
                  "T",
                  "F",
                  "S",
                ].map(
                  (
                    day,
                    index
                  ) => (
                    <div
                      key={`${day}-${index}`}
                      className="text-[10px] font-black uppercase text-slate-400"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {calendarDays.cells.map(
                  (
                    day,
                    index
                  ) => {
                    if (
                      day ===
                      null
                    ) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="h-9"
                        />
                      );
                    }

                    const isToday =
                      day ===
                      now.getDate();

                    const hasExpense =
                      calendarDays.activeExpenseDays.has(
                        day
                      );

                    return (
                      <div
                        key={
                          day
                        }
                        className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${
                          isToday
                            ? "bg-[#1F5EA8] text-white shadow-md shadow-blue-200"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {day}

                        {hasExpense &&
                          !isToday && (
                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rose-500" />
                          )}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-[#1F5EA8]" />
                  Today
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Expense
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* ===================================================
            ROW 4
            Recent Expenses + Budget Toolkit
            No empty right-side gap anymore.
        ==================================================== */}

        <div className="grid gap-6 xl:grid-cols-12">
          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.32,
            }}
            className="xl:col-span-8"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)] md:p-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F2745]">
                    Recent Expenses
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Latest records from {monthLabel}
                  </p>
                </div>

                {currentMonthExpenses.length >
                  5 && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllExpenses(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="text-sm font-extrabold text-[#1F5EA8] transition hover:text-[#173F6D]"
                  >
                    {showAllExpenses
                      ? "Show Less"
                      : "View All"}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {visibleExpenses.map(
                  (
                    expense
                  ) => {
                    const category =
                      categories.find(
                        (
                          item
                        ) =>
                          item.id ===
                          expense.categoryId
                      );

                    return (
                      <div
                        key={
                          expense.id
                        }
                        className="-mx-3 flex items-center justify-between gap-4 rounded-2xl px-3 py-4 transition hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            {category
                              ? getIcon(
                                  category.iconName
                                )
                              : (
                                <FileText className="h-5 w-5" />
                              )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black text-[#0F2745]">
                              {
                                expense.title
                              }
                            </p>

                            <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                              {category?.name ||
                                "Uncategorized"}
                              {" • "}
                              {new Date(
                                expense.date
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month:
                                    "short",
                                  day:
                                    "numeric",
                                  year:
                                    "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-black text-[#0F2745]">
                            -{" "}
                            {formatCurrency(
                              expense.amount
                            )}
                          </p>

                          <p className="mt-1 max-w-[120px] truncate text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                            {
                              expense.method
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {visibleExpenses.length ===
                  0 && (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                    <FileText className="h-7 w-7 text-slate-300" />

                    <p className="mt-3 text-sm font-black text-slate-600">
                      No expenses yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Add your first expense to start tracking this month.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.36,
            }}
            className="xl:col-span-4"
          >
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-black text-[#0F2745]">
                    Budget Toolkit
                  </h3>

                  <p className="text-[11px] font-medium text-slate-400">
                    Quick actions and status
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setExpenseModalOpen(
                      true
                    )
                  }
                  className="group rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-blue-100"
                >
                  <Plus className="h-5 w-5 text-[#1F5EA8]" />

                  <p className="mt-3 text-xs font-black text-[#0F2745]">
                    Add Expense
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Record a new spend
                  </p>
                </button>

                <button
                  type="button"
                  onClick={
                    openBudgetModal
                  }
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  <Edit2 className="h-5 w-5 text-slate-600" />

                  <p className="mt-3 text-xs font-black text-[#0F2745]">
                    Edit Budget
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Change total limits
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSavingsModalOpen(
                      true
                    )
                  }
                  className="group rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  <Target className="h-5 w-5 text-emerald-600" />

                  <p className="mt-3 text-xs font-black text-[#0F2745]">
                    Add Savings
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Update your progress
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCategoryModalOpen(
                      true
                    )
                  }
                  className="group rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-amber-100"
                >
                  <PieChart className="h-5 w-5 text-amber-600" />

                  <p className="mt-3 text-xs font-black text-[#0F2745]">
                    Categories
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Add or edit limits
                  </p>
                </button>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    Budget remaining
                  </span>

                  <span
                    className={`font-black ${
                      remainingBudget <
                      0
                        ? "text-rose-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(
                      remainingBudget
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    Expense records
                  </span>

                  <span className="font-black text-[#0F2745]">
                    {
                      currentMonthExpenses.length
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    Savings progress
                  </span>

                  <span className="font-black text-[#0F2745]">
                    {Math.round(
                      savingsProgress
                    )}
                    %
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpenseModalOpen(
                    true
                  )
                }
                className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#0F2745] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#173F6D]"
              >
                Add New Record

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ===================================================
          ADD EXPENSE MODAL
      ==================================================== */}

      <ModalShell
        open={
          expenseModalOpen
        }
        title="Add Expense"
        onClose={() =>
          setExpenseModalOpen(
            false
          )
        }
      >
        <form
          onSubmit={
            handleAddExpense
          }
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Title / Merchant
            </label>

            <input
              required
              value={
                expTitle
              }
              onChange={(
                event
              ) =>
                setExpTitle(
                  event.target.value
                )
              }
              type="text"
              placeholder="e.g. Uber Ride"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Amount (৳)
            </label>

            <input
              required
              value={
                expAmount
              }
              onChange={(
                event
              ) =>
                setExpAmount(
                  event.target.value
                )
              }
              type="number"
              min="1"
              step="1"
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Category
            </label>

            <select
              required
              value={
                expCategory
              }
              onChange={(
                event
              ) =>
                setExpCategory(
                  event.target.value
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
            >
              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() =>
                setExpenseModalOpen(
                  false
                )
              }
              className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#173F6D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : "Add Record"}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* ===================================================
          EDIT BUDGET MODAL
      ==================================================== */}

      <ModalShell
        open={
          budgetModalOpen
        }
        title="Update Budget"
        onClose={() =>
          setBudgetModalOpen(
            false
          )
        }
      >
        <form
          onSubmit={
            handleUpdateBudget
          }
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Total Monthly Budget Limit (৳)
            </label>

            <input
              required
              value={
                editTotalLimit
              }
              onChange={(
                event
              ) =>
                setEditTotalLimit(
                  event.target.value
                )
              }
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Savings Goal (৳)
            </label>

            <input
              required
              value={
                editSavingsGoal
              }
              onChange={(
                event
              ) =>
                setEditSavingsGoal(
                  event.target.value
                )
              }
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
            />
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() =>
                setBudgetModalOpen(
                  false
                )
              }
              className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 text-sm font-black text-white transition hover:bg-[#173F6D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* ===================================================
          ADD SAVINGS MODAL
      ==================================================== */}

      <ModalShell
        open={
          savingsModalOpen
        }
        title="Add to Savings"
        onClose={() =>
          setSavingsModalOpen(
            false
          )
        }
      >
        <form
          onSubmit={
            handleAddSavings
          }
          className="space-y-4"
        >
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">
              Current Savings
            </p>

            <p className="mt-1 text-2xl font-black text-emerald-800">
              {formatCurrency(
                settings.currentSavings
              )}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Amount to Add (৳)
            </label>

            <input
              autoFocus
              required
              value={
                savingsAmount
              }
              onChange={(
                event
              ) =>
                setSavingsAmount(
                  event.target.value
                )
              }
              type="number"
              min="1"
              step="1"
              placeholder="5000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Saving..."
              : "Update Savings"}
          </button>
        </form>
      </ModalShell>

      {/* ===================================================
          MANAGE CATEGORIES MODAL
      ==================================================== */}

      <ModalShell
        open={
          categoryModalOpen
        }
        title="Manage Categories"
        onClose={() =>
          setCategoryModalOpen(
            false
          )
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map(
              (
                category
              ) => (
                <div
                  key={
                    category.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
                      {getIcon(
                        category.iconName
                      )}
                    </div>

                    <p className="font-black text-[#0F2745]">
                      {
                        category.name
                      }
                    </p>
                  </div>

                  <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Monthly Limit
                  </label>

                  <input
                    type="number"
                    min="1"
                    defaultValue={
                      category.limit
                    }
                    onBlur={(
                      event
                    ) => {
                      void updateCategoryLimit(
                        category.id,
                        event.target.value
                      );
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1F5EA8] focus:ring-2 focus:ring-[#1F5EA8]/10"
                  />
                </div>
              )
            )}
          </div>

          <form
            onSubmit={
              handleAddCategory
            }
            className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
          >
            <div className="mb-4">
              <h4 className="font-black text-[#0F2745]">
                Add New Category
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                New categories automatically use a neutral icon for now.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <input
                value={
                  newCategoryName
                }
                onChange={(
                  event
                ) =>
                  setNewCategoryName(
                    event.target.value
                  )
                }
                placeholder="Category name"
                className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#1F5EA8]"
              />

              <input
                value={
                  newCategoryLimit
                }
                onChange={(
                  event
                ) =>
                  setNewCategoryLimit(
                    event.target.value
                  )
                }
                type="number"
                min="1"
                placeholder="Limit"
                className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#1F5EA8]"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#173F6D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                {isSaving
                  ? "Saving"
                  : "Add"}
              </button>
            </div>
          </form>
        </div>
      </ModalShell>

      {/* ===================================================
          TOAST
      ==================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.96,
            }}
            className="fixed bottom-6 right-6 z-[120] flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
          >
            {toast.type ===
            "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : toast.type ===
              "error" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Info className="h-5 w-5" />
              </div>
            )}

            <p className="text-sm font-bold text-slate-700">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(
                  null
                )
              }
              className="ml-1 text-slate-400 transition hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
