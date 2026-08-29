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
  Calendar as CalendarIcon,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  createCashFlowPlan,
  deleteCashFlowPlan,
  getCashFlowPlans,
  getCashFlowTransactions,
  getCashFlowWallet,
  type CashFlowTransaction,
} from "@/lib/api/cashFlowApi";

/* =========================================================
   TYPES
========================================================= */

type TransactionType =
  | "income"
  | "expense";

type Timeframe =
  | "30D"
  | "90D"
  | "6M";

interface CashFlowEvent {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isRecurring: boolean;
  status:
    | "completed"
    | "pending";
}

interface SimulatorState {
  active: boolean;
  amount: number;
  type: TransactionType;
  daysFromNow: number;
}

interface ForecastPoint {
  day: number;
  date: Date;
  balance: number;
  phase:
    | "historical"
    | "projected";
  hasEvent: boolean;
  simulated: boolean;
}

interface ChartPoint
  extends ForecastPoint {
  x: number;
  y: number;
}

interface ToastInfo {
  message: string;
  type:
    | "success"
    | "info"
    | "warning"
    | "error";
}

/* =========================================================
   CASH-FLOW CONSTANTS
========================================================= */

const BUFFER_AMOUNT =
  5000;

const DAY_MS =
  86400000;

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount: number
) {
  const sign =
    amount < 0
      ? "-"
      : "";

  return `${sign}৳ ${Math.abs(
    amount
  ).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function addDays(
  date: Date,
  days: number
) {
  return new Date(
    date.getTime() +
      days * DAY_MS
  );
}

function startOfDay(
  date: Date
) {
  const next =
    new Date(date);

  next.setHours(
    0,
    0,
    0,
    0
  );

  return next;
}

function dateKey(
  date: Date
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
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

function timeframeDays(
  timeframe: Timeframe
) {
  if (
    timeframe === "90D"
  ) {
    return 90;
  }

  if (
    timeframe === "6M"
  ) {
    return 180;
  }

  return 30;
}

function getRecurringOccurrences(
  event: CashFlowEvent,
  start: Date,
  end: Date
) {
  const occurrenceDates:
    Date[] = [];

  const eventDate =
    startOfDay(
      new Date(
        event.date
      )
    );

  if (
    !event.isRecurring
  ) {
    if (
      eventDate >= start &&
      eventDate <= end
    ) {
      occurrenceDates.push(
        eventDate
      );
    }

    return occurrenceDates;
  }

  let cursor =
    new Date(
      eventDate
    );

  while (
    cursor < start
  ) {
    cursor =
      addDays(
        cursor,
        30
      );
  }

  while (
    cursor <= end
  ) {
    occurrenceDates.push(
      new Date(
        cursor
      )
    );

    cursor =
      addDays(
        cursor,
        30
      );
  }

  return occurrenceDates;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CashFlowPage() {
  const [
    isMounted,
    setIsMounted,
  ] =
    useState(false);

  const [
    events,
    setEvents,
  ] =
    useState<CashFlowEvent[]>(
      []
    );

  const [
    balance,
    setBalance,
  ] =
    useState(0);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(false);

  const [
    isSavingPlan,
    setIsSavingPlan,
  ] =
    useState(false);

  const [
    deletingPlanId,
    setDeletingPlanId,
  ] =
    useState<string | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    timeframe,
    setTimeframe,
  ] =
    useState<Timeframe>(
      "30D"
    );

  const [
    showSafeToSpendDetails,
    setShowSafeToSpendDetails,
  ] =
    useState(false);

  const [
    addEventModalOpen,
    setAddEventModalOpen,
  ] =
    useState(false);

  const [
    selectedScheduleDate,
    setSelectedScheduleDate,
  ] =
    useState<string | null>(
      null
    );

  const [
    showAllUpcoming,
    setShowAllUpcoming,
  ] =
    useState(false);

  const [
    hoveredPoint,
    setHoveredPoint,
  ] =
    useState<ChartPoint | null>(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastInfo | null>(
      null
    );

  const [
    simulator,
    setSimulator,
  ] =
    useState<SimulatorState>({
      active: false,
      amount: 5000,
      type: "expense",
      daysFromNow: 5,
    });

  const [
    formTitle,
    setFormTitle,
  ] =
    useState("");

  const [
    formAmount,
    setFormAmount,
  ] =
    useState("");

  const [
    formType,
    setFormType,
  ] =
    useState<TransactionType>(
      "expense"
    );

  const [
    formDate,
    setFormDate,
  ] =
    useState("");

  const [
    formCategory,
    setFormCategory,
  ] =
    useState("");

  const [
    formRecurring,
    setFormRecurring,
  ] =
    useState(false);

  /* =======================================================
     BACKEND DATA
  ======================================================= */

  const getUserIdFromRef =
    (
      value:
        | string
        | {
            _id: string;
          }
    ) =>
      typeof value ===
      "string"
        ? value
        : value._id;

  const transactionToEvent =
    (
      transaction:
        CashFlowTransaction,
      userId: string
    ):
      CashFlowEvent | null => {
      if (
        transaction.status !==
          "COMPLETED" ||
        !transaction.createdAt
      ) {
        return null;
      }

      let type:
        TransactionType;

      let title:
        string;

      if (
        transaction.type ===
        "DEPOSIT"
      ) {
        type =
          "income";

        title =
          transaction.reference ||
          "Wallet Deposit";
      } else if (
        transaction.type ===
        "WITHDRAW"
      ) {
        type =
          "expense";

        title =
          transaction.reference ||
          "Wallet Withdrawal";
      } else {
        const senderId =
          getUserIdFromRef(
            transaction.senderId
          );

        const receiverId =
          getUserIdFromRef(
            transaction.receiverId
          );

        const incoming =
          transaction.direction ===
            "IN" ||
          (
            transaction.direction ===
              undefined &&
            receiverId ===
              userId &&
            senderId !==
              userId
          );

        type =
          incoming
            ? "income"
            : "expense";

        title =
          transaction.reference ||
          (
            incoming
              ? "Received Transfer"
              : "Sent Transfer"
          );
      }

      return {
        id:
          `txn_${transaction._id}`,

        title,

        amount:
          Number(
            transaction.amount
          ) || 0,

        type,

        category:
          "Wallet",

        date:
          transaction.createdAt,

        isRecurring:
          false,

        status:
          "completed",
      };
    };

  const loadCashFlow =
    async (
      silent = false
    ) => {
      try {
        if (silent) {
          setIsRefreshing(
            true
          );
        } else {
          setIsLoading(
            true
          );
        }

        setErrorMessage(
          ""
        );

        const [
          walletResponse,
          transactionResponse,
          planResponse,
        ] =
          await Promise.all([
            getCashFlowWallet(),
            getCashFlowTransactions(),
            getCashFlowPlans(),
          ]);

        if (
          !walletResponse
            ?.success ||
          !walletResponse
            .wallet
        ) {
          throw new Error(
            walletResponse
              ?.message ||
              "Unable to load wallet."
          );
        }

        if (
          !transactionResponse
            ?.success
        ) {
          throw new Error(
            transactionResponse
              ?.message ||
              "Unable to load transaction history."
          );
        }

        if (
          !planResponse
            ?.success
        ) {
          throw new Error(
            planResponse
              ?.message ||
              "Unable to load cash-flow plans."
          );
        }

        const userId =
          String(
            walletResponse
              .wallet
              .userId
          );

        const completedEvents =
          (
            transactionResponse
              .transactions ||
            []
          )
            .map(
              (
                transaction
              ) =>
                transactionToEvent(
                  transaction,
                  userId
                )
            )
            .filter(
              (
                event
              ):
                event is CashFlowEvent =>
                  event !==
                    null
            );

        const plannedEvents:
          CashFlowEvent[] =
          (
            planResponse
              .plans ||
            []
          ).map(
            (
              plan
            ) => ({
              ...plan,
              status:
                "pending",
            })
          );

        setBalance(
          Number(
            walletResponse
              .wallet
              .balance
          ) || 0
        );

        setEvents([
          ...completedEvents,
          ...plannedEvents,
        ]);

        setIsMounted(
          true
        );
      } catch (
        error
      ) {
        console.error(
          "Cash flow loading error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load cash-flow data."
        );

        setIsMounted(
          true
        );
      } finally {
        setIsLoading(
          false
        );

        setIsRefreshing(
          false
        );
      }
    };

  useEffect(() => {
    void loadCashFlow();
  }, []);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast =
    (
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
        3200
      );
    };

  /* =======================================================
     CORE CALCULATIONS
  ======================================================= */

  const now =
    useMemo(
      () =>
        new Date(),
      []
    );

  const today =
    useMemo(
      () =>
        startOfDay(
          now
        ),
      [
        now,
      ]
    );

  const upcomingEvents =
    useMemo(
      () =>
        events
          .filter(
            (
              event
            ) =>
              event.status ===
              "pending"
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                a.date
              ).getTime() -
              new Date(
                b.date
              ).getTime()
          ),
      [
        events,
      ]
    );

  const upcomingExpensesAmount =
    useMemo(() => {
      const limit =
        today.getTime() +
        14 * DAY_MS;

      return upcomingEvents
        .filter(
          (
            event
          ) =>
            event.type ===
              "expense" &&
            new Date(
              event.date
            ).getTime() <=
              limit
        )
        .reduce(
          (
            total,
            event
          ) =>
            total +
            event.amount,
          0
        );
    }, [
      upcomingEvents,
      today,
    ]);

  const safeToSpend =
    useMemo(
      () =>
        Math.max(
          balance -
            upcomingExpensesAmount -
            BUFFER_AMOUNT,
          0
        ),
      [
        balance,
        upcomingExpensesAmount,
      ]
    );

  const completedLast30Days =
    useMemo(() => {
      const start =
        addDays(
          today,
          -30
        );

      return events.filter(
        (
          event
        ) => {
          if (
            event.status !==
            "completed"
          ) {
            return false;
          }

          const date =
            new Date(
              event.date
            );

          return (
            date >= start &&
            date <= now
          );
        }
      );
    }, [
      events,
      today,
      now,
    ]);

  const netFlow =
    useMemo(() => {
      const income =
        completedLast30Days
          .filter(
            (
              event
            ) =>
              event.type ===
              "income"
          )
          .reduce(
            (
              total,
              event
            ) =>
              total +
              event.amount,
            0
          );

      const expense =
        completedLast30Days
          .filter(
            (
              event
            ) =>
              event.type ===
              "expense"
          )
          .reduce(
            (
              total,
              event
            ) =>
              total +
              event.amount,
            0
          );

      return (
        income -
        expense
      );
    }, [
      completedLast30Days,
    ]);

  /* =======================================================
     FORECAST ENGINE

     Historical balance is reconstructed backward from
     current balance using completed events from the past.
     Forecast uses upcoming events and 30-day recurrence.
  ======================================================= */

  const forecastData =
    useMemo(() => {
      const futureDays =
        timeframeDays(
          timeframe
        );

      const points:
        ForecastPoint[] =
        [];

      const completedByDate =
        new Map<
          string,
          CashFlowEvent[]
        >();

      events
        .filter(
          (
            event
          ) =>
            event.status ===
            "completed"
        )
        .forEach(
          (
            event
          ) => {
            const key =
              dateKey(
                new Date(
                  event.date
                )
              );

            const existing =
              completedByDate.get(
                key
              ) || [];

            existing.push(
              event
            );

            completedByDate.set(
              key,
              existing
            );
          }
        );

      /*
       * Reconstruct the previous seven closing balances.
       */
      let backwardBalance =
        balance;

      const historical:
        ForecastPoint[] =
        [];

      for (
        let day = -1;
        day >= -7;
        day -= 1
      ) {
        const date =
          addDays(
            today,
            day
          );

        const eventsOnDate =
          completedByDate.get(
            dateKey(
              date
            )
          ) || [];

        for (
          const event
          of eventsOnDate
        ) {
          if (
            event.type ===
            "income"
          ) {
            backwardBalance -=
              event.amount;
          } else {
            backwardBalance +=
              event.amount;
          }
        }

        historical.push({
          day,
          date,
          balance:
            backwardBalance,
          phase:
            "historical",
          hasEvent:
            eventsOnDate.length >
            0,
          simulated:
            false,
        });
      }

      historical
        .reverse()
        .forEach(
          (
            point
          ) =>
            points.push(
              point
            )
        );

      points.push({
        day: 0,
        date:
          new Date(
            today
          ),
        balance,
        phase:
          "projected",
        hasEvent: false,
        simulated:
          false,
      });

      const forecastEnd =
        addDays(
          today,
          futureDays
        );

      const occurrenceMap =
        new Map<
          string,
          CashFlowEvent[]
        >();

      upcomingEvents.forEach(
        (
          event
        ) => {
          getRecurringOccurrences(
            event,
            today,
            forecastEnd
          ).forEach(
            (
              occurrence
            ) => {
              const key =
                dateKey(
                  occurrence
                );

              const existing =
                occurrenceMap.get(
                  key
                ) || [];

              existing.push(
                event
              );

              occurrenceMap.set(
                key,
                existing
              );
            }
          );
        }
      );

      let projectedBalance =
        balance;

      for (
        let day = 1;
        day <= futureDays;
        day += 1
      ) {
        const date =
          addDays(
            today,
            day
          );

        const eventsOnDate =
          occurrenceMap.get(
            dateKey(
              date
            )
          ) || [];

        for (
          const event
          of eventsOnDate
        ) {
          projectedBalance +=
            event.type ===
            "income"
              ? event.amount
              : -event.amount;
        }

        const simulated =
          simulator.active &&
          day ===
            simulator.daysFromNow;

        if (simulated) {
          projectedBalance +=
            simulator.type ===
            "income"
              ? simulator.amount
              : -simulator.amount;
        }

        points.push({
          day,
          date,
          balance:
            projectedBalance,
          phase:
            "projected",
          hasEvent:
            eventsOnDate.length >
            0,
          simulated,
        });
      }

      return points;
    }, [
      balance,
      events,
      upcomingEvents,
      timeframe,
      simulator,
      today,
    ]);

  const chart =
    useMemo(() => {
      const width =
        1000;

      const height =
        300;

      const left =
        64;

      const right =
        22;

      const top =
        20;

      const bottom =
        42;

      const plotWidth =
        width -
        left -
        right;

      const plotHeight =
        height -
        top -
        bottom;

      const values =
        forecastData.map(
          (
            point
          ) =>
            point.balance
        );

      values.push(
        BUFFER_AMOUNT
      );

      const rawMin =
        Math.min(
          ...values
        );

      const rawMax =
        Math.max(
          ...values
        );

      const spread =
        Math.max(
          rawMax -
            rawMin,
          1000
        );

      const minBalance =
        Math.floor(
          (
            rawMin -
            spread * 0.14
          ) /
            1000
        ) * 1000;

      const maxBalance =
        Math.ceil(
          (
            rawMax +
            spread * 0.14
          ) /
            1000
        ) * 1000;

      const minDay =
        -7;

      const maxDay =
        timeframeDays(
          timeframe
        );

      const xForDay =
        (
          day: number
        ) =>
          left +
          (
            (day -
              minDay) /
            (maxDay -
              minDay)
          ) *
            plotWidth;

      const yForBalance =
        (
          value: number
        ) =>
          top +
          (
            1 -
            (
              value -
              minBalance
            ) /
              Math.max(
                maxBalance -
                  minBalance,
                1
              )
          ) *
            plotHeight;

      const points:
        ChartPoint[] =
        forecastData.map(
          (
            point
          ) => ({
            ...point,
            x:
              xForDay(
                point.day
              ),
            y:
              yForBalance(
                point.balance
              ),
          })
        );

      const historical =
        points.filter(
          (
            point
          ) =>
            point.day <= 0
        );

      const projected =
        points.filter(
          (
            point
          ) =>
            point.day >= 0
        );

      const linePath =
        (
          items:
            ChartPoint[]
        ) =>
          items
            .map(
              (
                point,
                index
              ) =>
                `${index === 0 ? "M" : "L"} ${point.x.toFixed(
                  2
                )} ${point.y.toFixed(
                  2
                )}`
            )
            .join(
              " "
            );

      const projectedLine =
        linePath(
          projected
        );

      const projectedArea =
        projected.length >
        0
          ? `${projectedLine} L ${projected[
              projected.length -
                1
            ].x.toFixed(
              2
            )} ${(top + plotHeight).toFixed(
              2
            )} L ${projected[
              0
            ].x.toFixed(
              2
            )} ${(top + plotHeight).toFixed(
              2
            )} Z`
          : "";

      const yTicks =
        Array.from(
          {
            length: 5,
          },
          (
            _,
            index
          ) => {
            const ratio =
              index /
              4;

            const value =
              maxBalance -
              (
                maxBalance -
                minBalance
              ) *
                ratio;

            return {
              value,
              y:
                top +
                plotHeight *
                  ratio,
            };
          }
        );

      const futureDays =
        timeframeDays(
          timeframe
        );

      const xTickDays =
        timeframe === "30D"
          ? [
              -7,
              0,
              7,
              14,
              21,
              30,
            ]
          : timeframe ===
              "90D"
            ? [
                -7,
                0,
                30,
                60,
                90,
              ]
            : [
                -7,
                0,
                30,
                60,
                90,
                120,
                150,
                180,
              ];

      const xTicks =
        xTickDays.map(
          (
            day
          ) => ({
            day,
            x:
              xForDay(
                day
              ),
            date:
              addDays(
                today,
                day
              ),
          })
        );

      const lowestProjected =
        projected.reduce(
          (
            lowest,
            point
          ) =>
            point.balance <
            lowest.balance
              ? point
              : lowest,
          projected[0]
        );

      const highestProjected =
        projected.reduce(
          (
            highest,
            point
          ) =>
            point.balance >
            highest.balance
              ? point
              : highest,
          projected[0]
        );

      const endPoint =
        projected[
          projected.length -
            1
        ];

      return {
        width,
        height,
        left,
        right,
        top,
        bottom,
        plotWidth,
        plotHeight,
        minBalance,
        maxBalance,
        points,
        historical,
        projected,
        historicalPath:
          linePath(
            historical
          ),
        projectedPath:
          projectedLine,
        projectedArea,
        yTicks,
        xTicks,
        todayX:
          xForDay(
            0
          ),
        bufferY:
          yForBalance(
            BUFFER_AMOUNT
          ),
        lowestProjected,
        highestProjected,
        endPoint,
        futureDays,
      };
    }, [
      forecastData,
      timeframe,
      today,
    ]);

  const projectedChange =
    chart.endPoint
      ? chart.endPoint.balance -
        balance
      : 0;

  const projectedChangePercent =
    balance !== 0
      ? (
          projectedChange /
          Math.abs(
            balance
          )
        ) *
        100
      : 0;

  const projectedBelowBuffer =
    chart.lowestProjected
      ? chart.lowestProjected
          .balance <
        BUFFER_AMOUNT
      : false;

  const projectedBelowZero =
    chart.lowestProjected
      ? chart.lowestProjected
          .balance <
        0
      : false;

  const upcomingWithinTimeframe =
    useMemo(() => {
      const end =
        addDays(
          today,
          timeframeDays(
            timeframe
          )
        );

      return upcomingEvents.filter(
        (
          event
        ) => {
          const date =
            new Date(
              event.date
            );

          return (
            date >= today &&
            date <= end
          );
        }
      );
    }, [
      upcomingEvents,
      timeframe,
      today,
    ]);

  const healthScore =
    useMemo(() => {
      let score =
        100;

      if (
        netFlow < 0
      ) {
        score -= 20;
      }

      if (
        safeToSpend <
        2000
      ) {
        score -= 15;
      }

      if (
        upcomingExpensesAmount >
        balance * 0.5
      ) {
        score -= 15;
      }

      if (
        projectedBelowBuffer
      ) {
        score -= 15;
      }

      if (
        projectedBelowZero
      ) {
        score -= 25;
      }

      return clamp(
        score,
        0,
        100
      );
    }, [
      netFlow,
      safeToSpend,
      upcomingExpensesAmount,
      balance,
      projectedBelowBuffer,
      projectedBelowZero,
    ]);

  /* =======================================================
     SCHEDULE
  ======================================================= */

  const scheduleDays =
    useMemo(
      () =>
        Array.from(
          {
            length: 14,
          },
          (
            _,
            index
          ) =>
            addDays(
              today,
              index
            )
        ),
      [
        today,
      ]
    );

  const filteredUpcomingEvents =
    useMemo(() => {
      if (
        selectedScheduleDate
      ) {
        return upcomingEvents.filter(
          (
            event
          ) =>
            dateKey(
              new Date(
                event.date
              )
            ) ===
            selectedScheduleDate
        );
      }

      return upcomingEvents;
    }, [
      upcomingEvents,
      selectedScheduleDate,
    ]);

  const visibleUpcomingEvents =
    showAllUpcoming
      ? filteredUpcomingEvents
      : filteredUpcomingEvents.slice(
          0,
          4
        );

  /* =======================================================
     CHART INTERACTION
  ======================================================= */

  const handleChartMove =
    (
      event:
        React.MouseEvent<
          SVGSVGElement
        >
    ) => {
      const rect =
        event.currentTarget.getBoundingClientRect();

      const viewX =
        (
          (event.clientX -
            rect.left) /
          rect.width
        ) *
        chart.width;

      const candidates =
        chart.points;

      if (
        candidates.length ===
        0
      ) {
        return;
      }

      let nearest =
        candidates[0];

      let distance =
        Math.abs(
          nearest.x -
            viewX
        );

      for (
        const point
        of candidates
      ) {
        const nextDistance =
          Math.abs(
            point.x -
              viewX
          );

        if (
          nextDistance <
          distance
        ) {
          nearest =
            point;

          distance =
            nextDistance;
        }
      }

      setHoveredPoint(
        nearest
      );
    };

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const openAddEvent =
    (
      type:
        TransactionType
    ) => {
      setFormType(
        type
      );

      setFormDate(
        dateKey(
          addDays(
            today,
            1
          )
        )
      );

      setAddEventModalOpen(
        true
      );
    };

  const handleAddEvent =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (
        isSavingPlan
      ) {
        return;
      }

      const amount =
        Number(
          formAmount
        );

      const title =
        formTitle.trim();

      const category =
        formCategory.trim() ||
        "General";

      if (
        !title ||
        !Number.isFinite(
          amount
        ) ||
        amount <= 0 ||
        !formDate
      ) {
        showToast(
          "Please enter valid plan details.",
          "error"
        );

        return;
      }

      const selectedDate =
        startOfDay(
          new Date(
            `${formDate}T12:00:00`
          )
        );

      if (
        selectedDate <
        today
      ) {
        showToast(
          "Planned cash-flow events cannot be added in the past.",
          "warning"
        );

        return;
      }

      try {
        setIsSavingPlan(
          true
        );

        const response =
          await createCashFlowPlan(
            {
              title,
              amount,
              type:
                formType,
              category,
              date:
                selectedDate.toISOString(),
              isRecurring:
                formRecurring,
            }
          );

        if (
          !response
            ?.success ||
          !response.plan
        ) {
          throw new Error(
            response?.message ||
              "Failed to create cash-flow plan."
          );
        }

        setEvents(
          (
            current
          ) => [
            ...current,
            {
              ...response.plan,
              status:
                "pending",
            },
          ]
        );

        setAddEventModalOpen(
          false
        );

        setFormTitle("");
        setFormAmount("");
        setFormCategory("");
        setFormRecurring(
          false
        );

        showToast(
          response.message ||
            "Cash-flow plan created."
        );
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to create cash-flow plan.",
          "error"
        );
      } finally {
        setIsSavingPlan(
          false
        );
      }
    };

  const handleDeletePlan =
    async (
      id: string
    ) => {
      if (
        id.startsWith(
          "txn_"
        ) ||
        deletingPlanId
      ) {
        return;
      }

      try {
        setDeletingPlanId(
          id
        );

        const response =
          await deleteCashFlowPlan(
            id
          );

        if (
          !response
            ?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to delete plan."
          );
        }

        setEvents(
          (
            current
          ) =>
            current.filter(
              (
                event
              ) =>
                event.id !==
                id
            )
        );

        showToast(
          response.message ||
            "Cash-flow plan deleted.",
          "info"
        );
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to delete plan.",
          "error"
        );
      } finally {
        setDeletingPlanId(
          null
        );
      }
    };

  const refreshCashFlow =
    () => {
      setSimulator(
        (
          current
        ) => ({
          ...current,
          active: false,
        })
      );

      setSelectedScheduleDate(
        null
      );

      void loadCashFlow(
        true
      );
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
            Loading cash flow
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Syncing wallet balance, transactions, and future plans.
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage &&
    events.length ===
      0
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <h1 className="mt-4 text-lg font-black text-[#0F2745]">
            Cash flow unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadCashFlow()
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

  const healthLabel =
    healthScore >= 80
      ? "Excellent"
      : healthScore >= 60
        ? "Healthy"
        : healthScore >= 40
          ? "Needs Attention"
          : "At Risk";

  const lowBalanceRisk =
    upcomingExpensesAmount >
      balance * 0.8 ||
    projectedBelowBuffer;

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
              onClick={refreshCashFlow}
              className="inline-flex shrink-0 items-center gap-2 text-xs font-black text-amber-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
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
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

          <svg
            className="pointer-events-none absolute right-0 top-0 h-full w-[58%] opacity-25"
            viewBox="0 0 600 300"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="heroFlow"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="#67e8f9"
                  stopOpacity="0"
                />

                <stop
                  offset="50%"
                  stopColor="#67e8f9"
                  stopOpacity="0.9"
                />

                <stop
                  offset="100%"
                  stopColor="#60a5fa"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[72, 126, 184, 238].map(
              (
                y,
                index
              ) => (
                <motion.path
                  key={
                    y
                  }
                  d={`M 0 ${y} C 120 ${y - 55} 235 ${y + 45} 350 ${y - 5} S 500 ${y + 25} 600 ${y - 18}`}
                  fill="none"
                  stroke="url(#heroFlow)"
                  strokeWidth={
                    index ===
                    1
                      ? 3
                      : 1.4
                  }
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity:
                      index ===
                      1
                        ? 0.9
                        : 0.45,
                  }}
                  transition={{
                    duration:
                      1.8 +
                      index *
                        0.2,
                    delay:
                      index *
                      0.08,
                    ease:
                      "easeOut",
                  }}
                />
              )
            )}
          </svg>

          <div className="relative z-10 grid items-center gap-8 xl:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                <Activity className="h-3.5 w-3.5" />
                Cash Flow Intelligence
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                See where your money is heading.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80 md:text-base">
                Track commitments, forecast future balance,
                simulate decisions, and keep a healthy cash
                buffer before money leaves your wallet.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-200/80">
                    Current Balance
                  </p>

                  <p className="mt-1 text-3xl font-black sm:text-4xl">
                    {formatCurrency(
                      balance
                    )}
                  </p>
                </div>

                <div className="hidden h-12 w-px bg-white/15 sm:block" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-200/80">
                    Net Flow • 30 Days
                  </p>

                  <div
                    className={`mt-1 flex items-center gap-2 text-xl font-black ${
                      netFlow >=
                      0
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {netFlow >=
                    0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}

                    {netFlow >=
                    0
                      ? "+"
                      : "-"}

                    {formatCurrency(
                      Math.abs(
                        netFlow
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openAddEvent(
                      "income"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#1F5EA8] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 active:translate-y-0"
                >
                  <Plus className="h-4 w-4" />
                  Plan Income
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAddEvent(
                      "expense"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0"
                >
                  <Plus className="h-4 w-4" />
                  Plan Expense
                </button>

                <button
                  type="button"
                  onClick={
                    refreshCashFlow
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-blue-100 transition hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* SAFE TO SPEND */}

            <motion.div
              whileHover={{
                y: -3,
              }}
              className="w-full max-w-[380px] rounded-[28px] border border-white/15 bg-white/[0.08] p-6 backdrop-blur-xl md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
                    <ShieldCheck className="h-4 w-4" />
                    Safe to Spend
                  </div>

                  <p className="mt-3 text-4xl font-black tracking-tight">
                    {formatCurrency(
                      safeToSpend
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowSafeToSpendDetails(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100 transition hover:bg-white/15"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-blue-100/75">
                Estimated amount available after near-term
                expenses and your safety buffer.
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      `${clamp(
                        balance > 0
                          ? (
                              safeToSpend /
                              balance
                            ) *
                              100
                          : 0,
                        0,
                        100
                      )}%`,
                  }}
                  transition={{
                    duration: 0.9,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                />
              </div>

              <AnimatePresence
                initial={false}
              >
                {showSafeToSpendDetails && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height:
                        "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
                      <div className="flex justify-between gap-4 text-blue-100/80">
                        <span>
                          Current Balance
                        </span>

                        <span className="font-bold text-white">
                          {formatCurrency(
                            balance
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-rose-200">
                        <span>
                          Bills in 14 days
                        </span>

                        <span className="font-bold">
                          -{" "}
                          {formatCurrency(
                            upcomingExpensesAmount
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-amber-200">
                        <span>
                          Safety Buffer
                        </span>

                        <span className="font-bold">
                          -{" "}
                          {formatCurrency(
                            BUFFER_AMOUNT
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-black text-white">
                        <span>
                          Safe to Spend
                        </span>

                        <span>
                          {formatCurrency(
                            safeToSpend
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.section>

        {/* ===================================================
            SUMMARY STRIP
        ==================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                `${timeframe} End Balance`,
              value:
                chart.endPoint
                  ? formatCurrency(
                      chart.endPoint
                        .balance
                    )
                  : "—",
              detail:
                projectedChange >=
                0
                  ? `+${projectedChangePercent.toFixed(
                      1
                    )}% vs today`
                  : `${projectedChangePercent.toFixed(
                      1
                    )}% vs today`,
              tone:
                projectedChange >=
                0
                  ? "text-emerald-600"
                  : "text-rose-600",
              icon:
                projectedChange >=
                0
                  ? TrendingUp
                  : TrendingDown,
            },
            {
              label:
                "Lowest Forecast",
              value:
                chart.lowestProjected
                  ? formatCurrency(
                      chart.lowestProjected
                        .balance
                    )
                  : "—",
              detail:
                chart.lowestProjected
                  ? chart.lowestProjected.date.toLocaleDateString(
                      "en-US",
                      {
                        month:
                          "short",
                        day:
                          "numeric",
                      }
                    )
                  : "No data",
              tone:
                projectedBelowBuffer
                  ? "text-amber-600"
                  : "text-[#1F5EA8]",
              icon:
                AlertTriangle,
            },
            {
              label:
                "Upcoming Commitments",
              value:
                String(
                  upcomingWithinTimeframe.length
                ),
              detail:
                `within ${timeframe}`,
              tone:
                "text-[#1F5EA8]",
              icon:
                Clock,
            },
            {
              label:
                "Cash Flow Health",
              value:
                `${Math.round(
                  healthScore
                )}/100`,
              detail:
                healthLabel,
              tone:
                healthScore >=
                60
                  ? "text-emerald-600"
                  : "text-amber-600",
              icon:
                ShieldCheck,
            },
          ].map(
            (
              item
            ) => {
              const Icon =
                item.icon;

              return (
                <motion.div
                  key={
                    item.label
                  }
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  whileHover={{
                    y: -3,
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.035)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                      {
                        item.label
                      }
                    </p>

                    <Icon
                      className={`h-4 w-4 ${item.tone}`}
                    />
                  </div>

                  <p className="mt-3 text-2xl font-black text-[#0F2745]">
                    {
                      item.value
                    }
                  </p>

                  <p
                    className={`mt-1 text-xs font-bold ${item.tone}`}
                  >
                    {
                      item.detail
                    }
                  </p>
                </motion.div>
              );
            }
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-12">
          {/* =================================================
              MAIN COLUMN
          ================================================== */}

          <div className="space-y-6 xl:col-span-8">
            {/* ===============================================
                FORECAST CHART
            ================================================ */}

            <motion.section
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.08,
              }}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.045)]"
            >
              <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                        <Activity className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-xl font-black text-[#0F2745]">
                          Balance Forecast
                        </h2>

                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                          Historical balance + scheduled
                          commitments + simulation
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                    {(
                      [
                        "30D",
                        "90D",
                        "6M",
                      ] as Timeframe[]
                    ).map(
                      (
                        option
                      ) => (
                        <button
                          key={
                            option
                          }
                          type="button"
                          onClick={() => {
                            setTimeframe(
                              option
                            );

                            setHoveredPoint(
                              null
                            );
                          }}
                          className={`relative rounded-lg px-4 py-2 text-xs font-black transition ${
                            timeframe ===
                            option
                              ? "text-[#1F5EA8]"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {timeframe ===
                            option && (
                            <motion.span
                              layoutId="forecast-timeframe"
                              className="absolute inset-0 rounded-lg bg-white shadow-sm"
                              transition={{
                                type:
                                  "spring",
                                stiffness:
                                  400,
                                damping:
                                  32,
                              }}
                            />
                          )}

                          <span className="relative z-10">
                            {
                              option
                            }
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded-full bg-[#1F5EA8]" />
                    Historical
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded-full bg-cyan-500" />
                    Projected
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-5 border-t border-dashed border-amber-400" />
                    Safety Buffer
                  </span>

                  {simulator.active && (
                    <span className="flex items-center gap-2 text-violet-500">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      Simulation active
                    </span>
                  )}
                </div>
              </div>

              <div className="relative px-3 pb-4 pt-3 sm:px-5">
                <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/70">
                  <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    className="h-[330px] w-full cursor-crosshair select-none"
                    preserveAspectRatio="none"
                    onMouseMove={
                      handleChartMove
                    }
                    onMouseLeave={() =>
                      setHoveredPoint(
                        null
                      )
                    }
                  >
                    <defs>
                      <linearGradient
                        id="forecastArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#06b6d4"
                          stopOpacity="0.22"
                        />

                        <stop
                          offset="100%"
                          stopColor="#06b6d4"
                          stopOpacity="0"
                        />
                      </linearGradient>

                      <linearGradient
                        id="forecastStroke"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0891b2"
                        />

                        <stop
                          offset="100%"
                          stopColor="#22d3ee"
                        />
                      </linearGradient>

                      <filter
                        id="softGlow"
                        x="-40%"
                        y="-40%"
                        width="180%"
                        height="180%"
                      >
                        <feGaussianBlur
                          stdDeviation="5"
                          result="blur"
                        />

                        <feMerge>
                          <feMergeNode
                            in="blur"
                          />

                          <feMergeNode
                            in="SourceGraphic"
                          />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* horizontal grid + y labels */}

                    {chart.yTicks.map(
                      (
                        tick
                      ) => (
                        <g
                          key={
                            tick.y
                          }
                        >
                          <line
                            x1={
                              chart.left
                            }
                            y1={
                              tick.y
                            }
                            x2={
                              chart.width -
                              chart.right
                            }
                            y2={
                              tick.y
                            }
                            stroke="#e8eef5"
                            strokeWidth="1"
                          />

                          <text
                            x="8"
                            y={
                              tick.y +
                              4
                            }
                            fontSize="11"
                            fill="#94a3b8"
                            fontWeight="700"
                          >
                            {Math.abs(
                              tick.value
                            ) >=
                            1000
                              ? `${tick.value < 0 ? "-" : ""}৳${(
                                  Math.abs(
                                    tick.value
                                  ) /
                                  1000
                                ).toFixed(
                                  0
                                )}k`
                              : formatCurrency(
                                  tick.value
                                )}
                          </text>
                        </g>
                      )
                    )}

                    {/* x labels */}

                    {chart.xTicks.map(
                      (
                        tick
                      ) => (
                        <g
                          key={
                            tick.day
                          }
                        >
                          <line
                            x1={
                              tick.x
                            }
                            y1={
                              chart.top
                            }
                            x2={
                              tick.x
                            }
                            y2={
                              chart.top +
                              chart.plotHeight
                            }
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />

                          <text
                            x={
                              tick.x
                            }
                            y={
                              chart.height -
                              14
                            }
                            textAnchor="middle"
                            fontSize="10"
                            fill="#94a3b8"
                            fontWeight="700"
                          >
                            {tick.day ===
                            0
                              ? "Today"
                              : tick.date.toLocaleDateString(
                                  "en-US",
                                  {
                                    month:
                                      "short",
                                    day:
                                      "numeric",
                                  }
                                )}
                          </text>
                        </g>
                      )
                    )}

                    {/* safety buffer */}

                    <line
                      x1={
                        chart.left
                      }
                      y1={
                        chart.bufferY
                      }
                      x2={
                        chart.width -
                        chart.right
                      }
                      y2={
                        chart.bufferY
                      }
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="7 7"
                      opacity="0.75"
                    />

                    <text
                      x={
                        chart.width -
                        chart.right -
                        4
                      }
                      y={
                        chart.bufferY -
                        7
                      }
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="800"
                      fill="#d97706"
                    >
                      Safety buffer
                    </text>

                    {/* projected area */}

                    <motion.path
                      key={`area-${timeframe}-${simulator.active}-${simulator.amount}-${simulator.daysFromNow}-${simulator.type}`}
                      d={
                        chart.projectedArea
                      }
                      fill="url(#forecastArea)"
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.55,
                      }}
                    />

                    {/* historical line */}

                    <motion.path
                      key={`historical-${timeframe}`}
                      d={
                        chart.historicalPath
                      }
                      fill="none"
                      stroke="#1F5EA8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{
                        pathLength: 0,
                        opacity: 0,
                      }}
                      animate={{
                        pathLength: 1,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                    />

                    {/* projected line */}

                    <motion.path
                      key={`projected-${timeframe}-${simulator.active}-${simulator.amount}-${simulator.daysFromNow}-${simulator.type}`}
                      d={
                        chart.projectedPath
                      }
                      fill="none"
                      stroke="url(#forecastStroke)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{
                        pathLength: 0,
                        opacity: 0,
                      }}
                      animate={{
                        pathLength: 1,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.1,
                        ease:
                          "easeOut",
                        delay: 0.12,
                      }}
                    />

                    {/* today marker */}

                    <line
                      x1={
                        chart.todayX
                      }
                      y1={
                        chart.top
                      }
                      x2={
                        chart.todayX
                      }
                      y2={
                        chart.top +
                        chart.plotHeight
                      }
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4 6"
                    />

                    <circle
                      cx={
                        chart.todayX
                      }
                      cy={
                        chart.points.find(
                          (
                            point
                          ) =>
                            point.day ===
                            0
                        )?.y ??
                        0
                      }
                      r="6"
                      fill="#ffffff"
                      stroke="#06b6d4"
                      strokeWidth="4"
                    />

                    {/* event markers */}

                    {chart.projected
                      .filter(
                        (
                          point
                        ) =>
                          point.hasEvent ||
                          point.simulated
                      )
                      .map(
                        (
                          point
                        ) => (
                          <motion.circle
                            key={`${point.day}-${point.simulated}`}
                            cx={
                              point.x
                            }
                            cy={
                              point.y
                            }
                            r={
                              point.simulated
                                ? 7
                                : 4.5
                            }
                            fill={
                              point.simulated
                                ? "#8b5cf6"
                                : "#ffffff"
                            }
                            stroke={
                              point.simulated
                                ? "#ffffff"
                                : "#06b6d4"
                            }
                            strokeWidth={
                              point.simulated
                                ? 3
                                : 3
                            }
                            initial={{
                              scale: 0,
                            }}
                            animate={{
                              scale: 1,
                            }}
                            transition={{
                              delay: 0.5,
                              type:
                                "spring",
                            }}
                            filter={
                              point.simulated
                                ? "url(#softGlow)"
                                : undefined
                            }
                          />
                        )
                      )}

                    {/* hover crosshair */}

                    {hoveredPoint && (
                      <>
                        <line
                          x1={
                            hoveredPoint.x
                          }
                          y1={
                            chart.top
                          }
                          x2={
                            hoveredPoint.x
                          }
                          y2={
                            chart.top +
                            chart.plotHeight
                          }
                          stroke="#64748b"
                          strokeWidth="1"
                          strokeDasharray="3 5"
                          opacity="0.45"
                        />

                        <circle
                          cx={
                            hoveredPoint.x
                          }
                          cy={
                            hoveredPoint.y
                          }
                          r="7"
                          fill="#ffffff"
                          stroke={
                            hoveredPoint.phase ===
                            "historical"
                              ? "#1F5EA8"
                              : "#06b6d4"
                          }
                          strokeWidth="4"
                        />
                      </>
                    )}

                    {/* transparent interaction surface */}

                    <rect
                      x={
                        chart.left
                      }
                      y={
                        chart.top
                      }
                      width={
                        chart.plotWidth
                      }
                      height={
                        chart.plotHeight
                      }
                      fill="transparent"
                    />
                  </svg>

                  <AnimatePresence>
                    {hoveredPoint && (
                      <motion.div
                        key={`${hoveredPoint.day}-${hoveredPoint.balance}`}
                        initial={{
                          opacity: 0,
                          y: 8,
                          scale: 0.96,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 6,
                          scale: 0.98,
                        }}
                        className="pointer-events-none absolute right-4 top-4 min-w-[185px] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                              hoveredPoint.phase ===
                              "historical"
                                ? "bg-blue-50 text-[#1F5EA8]"
                                : "bg-cyan-50 text-cyan-700"
                            }`}
                          >
                            {
                              hoveredPoint.phase
                            }
                          </span>

                          {hoveredPoint.simulated && (
                            <span className="text-[9px] font-black uppercase text-violet-600">
                              Simulation
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-xl font-black text-[#0F2745]">
                          {formatCurrency(
                            hoveredPoint.balance
                          )}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {hoveredPoint.date.toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "short",
                              month:
                                "short",
                              day:
                                "numeric",
                              year:
                                "numeric",
                            }
                          )}
                        </p>

                        {hoveredPoint.hasEvent && (
                          <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-cyan-700">
                            <Zap className="h-3 w-3" />
                            Scheduled cash-flow event
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Projected Change
                    </p>

                    <p
                      className={`mt-1 text-lg font-black ${
                        projectedChange >=
                        0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {projectedChange >=
                      0
                        ? "+"
                        : ""}

                      {formatCurrency(
                        projectedChange
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Forecast Low
                    </p>

                    <p
                      className={`mt-1 text-lg font-black ${
                        projectedBelowBuffer
                          ? "text-amber-600"
                          : "text-[#0F2745]"
                      }`}
                    >
                      {chart.lowestProjected
                        ? formatCurrency(
                            chart.lowestProjected
                              .balance
                          )
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Forecast High
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0F2745]">
                      {chart.highestProjected
                        ? formatCurrency(
                            chart.highestProjected
                              .balance
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-slate-400">
                  Recurring commitments are projected every
                  30 days for planning purposes. The simulator
                  changes forecast only and does not save a
                  real transaction.
                </p>
              </div>
            </motion.section>

            {/* ===============================================
                UPCOMING SCHEDULE
            ================================================ */}

            <motion.section
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.14,
              }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-7"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                    <CalendarIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#0F2745]">
                      Upcoming Schedule
                    </h2>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      Select a date to filter commitments
                    </p>
                  </div>
                </div>

                {selectedScheduleDate && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedScheduleDate(
                        null
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#1F5EA8]"
                  >
                    Clear date filter
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-3">
                {scheduleDays.map(
                  (
                    date
                  ) => {
                    const key =
                      dateKey(
                        date
                      );

                    const dayEvents =
                      upcomingEvents.filter(
                        (
                          event
                        ) =>
                          dateKey(
                            new Date(
                              event.date
                            )
                          ) ===
                          key
                      );

                    const hasIncome =
                      dayEvents.some(
                        (
                          event
                        ) =>
                          event.type ===
                          "income"
                      );

                    const hasExpense =
                      dayEvents.some(
                        (
                          event
                        ) =>
                          event.type ===
                          "expense"
                      );

                    const isToday =
                      key ===
                      dateKey(
                        today
                      );

                    const selected =
                      selectedScheduleDate ===
                      key;

                    return (
                      <button
                        key={
                          key
                        }
                        type="button"
                        onClick={() =>
                          setSelectedScheduleDate(
                            selected
                              ? null
                              : key
                          )
                        }
                        className={`relative flex h-[88px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
                          selected
                            ? "border-[#1F5EA8] bg-[#1F5EA8] text-white shadow-lg shadow-blue-200"
                            : isToday
                              ? "border-blue-200 bg-blue-50 text-[#1F5EA8]"
                              : "border-slate-100 bg-slate-50/60 text-[#0F2745] hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-black uppercase ${
                            selected
                              ? "text-blue-100"
                              : "text-slate-400"
                          }`}
                        >
                          {date.toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "short",
                            }
                          )}
                        </span>

                        <span className="mt-1 text-xl font-black">
                          {date.getDate()}
                        </span>

                        <div className="absolute bottom-2.5 flex gap-1">
                          {hasIncome && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          )}

                          {hasExpense && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {visibleUpcomingEvents.map(
                  (
                    event
                  ) => (
                    <div
                      key={
                        event.id
                      }
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            event.type ===
                            "income"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {event.type ===
                          "income" ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <TrendingDown className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-[#0F2745]">
                            {
                              event.title
                            }
                          </p>

                          <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                            {new Date(
                              event.date
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
                            {" • "}
                            {
                              event.category
                            }

                            {event.isRecurring
                              ? " • Recurring"
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <p
                          className={`text-right font-black ${
                            event.type ===
                            "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {event.type ===
                          "income"
                            ? "+"
                            : "-"}

                          {formatCurrency(
                            event.amount
                          )}
                        </p>

                        {!event.id.startsWith(
                          "txn_"
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeletePlan(
                                event.id
                              )
                            }
                            disabled={
                              deletingPlanId ===
                              event.id
                            }
                            aria-label="Delete planned event"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingPlanId ===
                            event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}

                {visibleUpcomingEvents.length ===
                  0 && (
                  <div className="flex min-h-36 flex-col items-center justify-center text-center">
                    <CalendarIcon className="h-6 w-6 text-slate-300" />

                    <p className="mt-2 text-sm font-black text-slate-600">
                      No commitments on this date
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Choose another day or clear the date filter.
                    </p>
                  </div>
                )}
              </div>

              {filteredUpcomingEvents.length >
                4 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllUpcoming(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#1F5EA8]"
                >
                  {showAllUpcoming
                    ? "Show Less"
                    : `View All (${filteredUpcomingEvents.length})`}

                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.section>
          </div>

          {/* =================================================
              SIDEBAR
          ================================================== */}

          <aside className="space-y-6 xl:col-span-4">
            {/* CASH FLOW HEALTH */}

            <motion.section
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-black text-[#0F2745]">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Cash Flow Health
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Based on balance, commitments and forecast
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                    healthScore >=
                    80
                      ? "bg-emerald-50 text-emerald-600"
                      : healthScore >=
                          60
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {
                    healthLabel
                  }
                </span>
              </div>

              <div className="mt-6 flex items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
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
                      stroke={
                        healthScore >=
                        80
                          ? "#10b981"
                          : healthScore >=
                              60
                            ? "#3b82f6"
                            : "#f59e0b"
                      }
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
                            healthScore /
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
                        healthScore
                      )}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                    {netFlow >=
                    0 ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}

                    <span>
                      {netFlow >=
                      0
                        ? "Positive recent net flow"
                        : "Recent outflow exceeds inflow"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                    {projectedBelowBuffer ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    )}

                    <span>
                      {projectedBelowBuffer
                        ? "Forecast drops below safety buffer"
                        : "Forecast stays above safety buffer"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                    {projectedBelowZero ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    )}

                    <span>
                      {projectedBelowZero
                        ? "Negative balance risk detected"
                        : "No negative balance projected"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* WHAT IF SIMULATOR */}

            <motion.section
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.16,
              }}
              className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/70 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5EA8] text-white shadow-lg shadow-blue-200">
                  <Calculator className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-black text-[#0F2745]">
                    What-If Simulator
                  </h3>

                  <p className="text-xs font-medium text-[#1F5EA8]">
                    Preview a future income or expense
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 rounded-xl border border-blue-100 bg-white p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSimulator(
                        (
                          current
                        ) => ({
                          ...current,
                          type:
                            "expense",
                        })
                      )
                    }
                    className={`rounded-lg py-2 text-xs font-black transition ${
                      simulator.type ===
                      "expense"
                        ? "bg-rose-100 text-rose-700"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Expense
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSimulator(
                        (
                          current
                        ) => ({
                          ...current,
                          type:
                            "income",
                        })
                      )
                    }
                    className={`rounded-lg py-2 text-xs font-black transition ${
                      simulator.type ===
                      "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-600">
                    Amount (৳)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      simulator.amount
                    }
                    onChange={(
                      event
                    ) =>
                      setSimulator(
                        (
                          current
                        ) => ({
                          ...current,
                          amount:
                            Math.max(
                              Number(
                                event.target.value
                              ) ||
                                0,
                              0
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-black text-[#0F2745] outline-none transition focus:border-[#1F5EA8] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-xs font-black text-slate-600">
                      Days from now
                    </label>

                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#1F5EA8] shadow-sm">
                      In{" "}
                      {
                        simulator.daysFromNow
                      }{" "}
                      days
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max={
                      Math.min(
                        chart.futureDays,
                        90
                      )
                    }
                    value={
                      Math.min(
                        simulator.daysFromNow,
                        Math.min(
                          chart.futureDays,
                          90
                        )
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      setSimulator(
                        (
                          current
                        ) => ({
                          ...current,
                          daysFromNow:
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                    className="w-full accent-[#1F5EA8]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !simulator.active &&
                      simulator.amount <=
                        0
                    ) {
                      showToast(
                        "Enter a simulation amount first.",
                        "warning"
                      );

                      return;
                    }

                    setSimulator(
                      (
                        current
                      ) => ({
                        ...current,
                        active:
                          !current.active,
                      })
                    );
                  }}
                  className={`w-full rounded-xl py-3 text-sm font-black text-white shadow-sm transition ${
                    simulator.active
                      ? "bg-violet-600 hover:bg-violet-700"
                      : "bg-[#1F5EA8] hover:bg-[#173F6D]"
                  }`}
                >
                  {simulator.active
                    ? "Clear Simulation"
                    : "Run Simulation"}
                </button>
              </div>

              <AnimatePresence>
                {simulator.active && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height:
                        "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />

                        <p className="text-xs font-black text-violet-700">
                          Simulation Impact
                        </p>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        A{" "}
                        <span className="font-black">
                          {simulator.type}
                        </span>{" "}
                        of{" "}
                        <span className="font-black text-[#0F2745]">
                          {formatCurrency(
                            simulator.amount
                          )}
                        </span>{" "}
                        in{" "}
                        {
                          simulator.daysFromNow
                        }{" "}
                        days is now included in the forecast.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* ALERT / INSIGHT */}

            <motion.section
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.22,
              }}
              className={`rounded-[24px] border p-5 ${
                lowBalanceRisk
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-100 bg-emerald-50"
              }`}
            >
              <div className="flex gap-3">
                {lowBalanceRisk ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                ) : (
                  <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                )}

                <div>
                  <h4
                    className={`font-black ${
                      lowBalanceRisk
                        ? "text-amber-900"
                        : "text-emerald-900"
                    }`}
                  >
                    {lowBalanceRisk
                      ? "Cash Buffer Warning"
                      : "Forecast Looks Stable"}
                  </h4>

                  <p
                    className={`mt-1 text-sm leading-6 ${
                      lowBalanceRisk
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {lowBalanceRisk
                      ? "Your near-term commitments or projected balance approach the safety buffer. Review non-essential planned expenses before they become due."
                      : "Your projected balance currently remains above the configured safety buffer for the selected forecast period."}
                  </p>
                </div>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>

      {/* ===================================================
          ADD EVENT MODAL
      ==================================================== */}

      <AnimatePresence>
        {addEventModalOpen && (
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
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1F5EA8]">
                    Planned Cash Flow
                  </p>

                  <h3 className="mt-1 text-xl font-black capitalize text-[#0F2745]">
                    Plan{" "}
                    {
                      formType
                    }
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAddEventModalOpen(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={
                  handleAddEvent
                }
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    Title
                  </label>

                  <input
                    required
                    value={
                      formTitle
                    }
                    onChange={(
                      event
                    ) =>
                      setFormTitle(
                        event.target.value
                      )
                    }
                    type="text"
                    placeholder="e.g. Salary, Rent"
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
                      formAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setFormAmount(
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

                  <input
                    value={
                      formCategory
                    }
                    onChange={(
                      event
                    ) =>
                      setFormCategory(
                        event.target.value
                      )
                    }
                    type="text"
                    placeholder="e.g. Salary, Bills, Food"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    Date
                  </label>

                  <input
                    required
                    value={
                      formDate
                    }
                    onChange={(
                      event
                    ) =>
                      setFormDate(
                        event.target.value
                      )
                    }
                    type="date"
                    min={dateKey(today)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/15"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-black text-[#0F2745]">
                      Recurring Event
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Repeat every 30 days in the forecast only.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      formRecurring
                    }
                    onChange={(
                      event
                    ) =>
                      setFormRecurring(
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 accent-[#1F5EA8]"
                  />
                </label>

                <div className="flex gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setAddEventModalOpen(
                        false
                      )
                    }
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingPlan}
                    className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#173F6D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingPlan
                      ? "Saving..."
                      : "Save Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================
          TOAST
      ==================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 35,
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
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type ===
                "error"
                  ? "bg-rose-100 text-rose-600"
                  : toast.type ===
                      "warning"
                    ? "bg-amber-100 text-amber-600"
                    : toast.type ===
                        "info"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {toast.type ===
              "error" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : toast.type ===
                "warning" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : toast.type ===
                "info" ? (
                <Info className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <p className="text-sm font-bold text-slate-700">
              {
                toast.message
              }
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
