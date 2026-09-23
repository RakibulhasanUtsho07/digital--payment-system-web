"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  FileBarChart2,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  WalletCards,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type Period =
  | "1d"
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

type NumericLike =
  | number
  | string
  | {
      $numberDecimal?: string;
    }
  | null
  | undefined;

interface MerchantInfo {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  slug: string;

  status: string;

  verificationStatus:
    string;

  defaultCurrency:
    string;

  testEnabled:
    boolean;

  liveEnabled:
    boolean;
}

interface OverviewSummary {
  totalPayments: number;

  successfulPayments:
    number;

  pendingPayments:
    number;

  processingPayments:
    number;

  failedPayments:
    number;

  cancelledPayments:
    number;

  expiredPayments:
    number;

  grossVolume:
    number;

  totalFees:
    number;

  netRevenue:
    number;

  successRate:
    number;

  averagePaymentValue:
    number;

  uniqueCustomers:
    number;
}

interface BreakdownItem {
  key: string;

  count: number;

  amount: number;
}

interface TrendItem {
  date: string;

  paymentCount:
    number;

  volume:
    number;
}

interface RecentPayment {
  paymentId: string;

  customerId:
    | string
    | null;

  orderId:
    | string
    | null;

  amount: number;

  currency: string;

  feeAmount: number;

  netAmount:
    | number
    | null;

  sourceType: string;

  provider: string;

  mode:
    | "test"
    | "live";

  status:
    PaymentStatus;

  merchantReference:
    | string
    | null;

  failureCode:
    | string
    | null;

  failureMessage:
    | string
    | null;

  createdAt: string;

  completedAt:
    | string
    | null;
}

interface MerchantOverviewData {
  merchant:
    MerchantInfo;

  period:
    Period;

  periodStart:
    | string
    | null;

  generatedAt:
    string;

  summary:
    OverviewSummary;

  statusBreakdown:
    BreakdownItem[];

  paymentMethods:
    BreakdownItem[];

  providers:
    BreakdownItem[];

  trend:
    TrendItem[];

  recentPayments:
    RecentPayment[];
}

interface MerchantOverviewResponse {
  success:
    boolean;

  message?:
    string;

  data:
    MerchantOverviewData;
}

/* =========================================================
   CONSTANTS
========================================================= */

const PERIOD_OPTIONS: {
  value:
    Period;

  label:
    string;

  shortLabel:
    string;
}[] = [
  {
    value:
      "1d",

    label:
      "Last 24 hours",

    shortLabel:
      "24H",
  },

  {
    value:
      "7d",

    label:
      "Last 7 days",

    shortLabel:
      "7D",
  },

  {
    value:
      "30d",

    label:
      "Last 30 days",

    shortLabel:
      "30D",
  },

  {
    value:
      "90d",

    label:
      "Last 90 days",

    shortLabel:
      "90D",
  },

  {
    value:
      "12m",

    label:
      "Last 12 months",

    shortLabel:
      "12M",
  },

  {
    value:
      "all",

    label:
      "All time",

    shortLabel:
      "ALL",
  },
];

/* =========================================================
   MOTION
========================================================= */

const springTransition = {
  type:
    "spring" as const,

  stiffness:
    260,

  damping:
    24,
};

const sectionInitial = {
  opacity:
    0,

  y:
    22,
};

const sectionAnimate = {
  opacity:
    1,

  y:
    0,
};

/* =========================================================
   NUMBER NORMALIZATION
========================================================= */

function toNumber(
  value:
    unknown
): number {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }

  if (
    typeof value ===
    "string"
  ) {
    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const decimal =
      (
        value as {
          $numberDecimal?:
            string;
        }
      ).$numberDecimal;

    if (
      typeof decimal ===
      "string"
    ) {
      const parsed =
        Number(
          decimal
        );

      return Number.isFinite(
        parsed
      )
        ? parsed
        : 0;
    }

    const parsed =
      Number(
        String(
          value
        )
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  return 0;
}

/* =========================================================
   NORMALIZE API DATA
========================================================= */

function normalizeOverviewData(
  raw:
    MerchantOverviewData
): MerchantOverviewData {
  const summary =
    raw.summary;

  return {
    ...raw,

    summary: {
      totalPayments:
        toNumber(
          summary?.totalPayments
        ),

      successfulPayments:
        toNumber(
          summary?.successfulPayments
        ),

      pendingPayments:
        toNumber(
          summary?.pendingPayments
        ),

      processingPayments:
        toNumber(
          summary?.processingPayments
        ),

      failedPayments:
        toNumber(
          summary?.failedPayments
        ),

      cancelledPayments:
        toNumber(
          summary?.cancelledPayments
        ),

      expiredPayments:
        toNumber(
          summary?.expiredPayments
        ),

      grossVolume:
        toNumber(
          summary?.grossVolume
        ),

      totalFees:
        toNumber(
          summary?.totalFees
        ),

      netRevenue:
        toNumber(
          summary?.netRevenue
        ),

      successRate:
        toNumber(
          summary?.successRate
        ),

      averagePaymentValue:
        toNumber(
          summary?.averagePaymentValue
        ),

      uniqueCustomers:
        toNumber(
          summary?.uniqueCustomers
        ),
    },

    statusBreakdown:
      (
        raw.statusBreakdown ??
        []
      ).map(
        (
          item
        ) => ({
          ...item,

          count:
            toNumber(
              item.count
            ),

          amount:
            toNumber(
              item.amount
            ),
        })
      ),

    paymentMethods:
      (
        raw.paymentMethods ??
        []
      ).map(
        (
          item
        ) => ({
          ...item,

          count:
            toNumber(
              item.count
            ),

          amount:
            toNumber(
              item.amount
            ),
        })
      ),

    providers:
      (
        raw.providers ??
        []
      ).map(
        (
          item
        ) => ({
          ...item,

          count:
            toNumber(
              item.count
            ),

          amount:
            toNumber(
              item.amount
            ),
        })
      ),

    trend:
      (
        raw.trend ??
        []
      ).map(
        (
          item
        ) => ({
          ...item,

          paymentCount:
            toNumber(
              item.paymentCount
            ),

          volume:
            toNumber(
              item.volume
            ),
        })
      ),

    recentPayments:
      (
        raw.recentPayments ??
        []
      ).map(
        (
          payment
        ) => ({
          ...payment,

          amount:
            toNumber(
              payment.amount
            ),

          feeAmount:
            toNumber(
              payment.feeAmount
            ),

          netAmount:
            payment.netAmount ===
              null ||
            payment.netAmount ===
              undefined
              ? null
              : toNumber(
                  payment.netAmount
                ),
        })
      ),
  };
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatMoney(
  amount:
    NumericLike,
  currency =
    "BDT"
) {
  const safeAmount =
    toNumber(
      amount
    );

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      }
    ).format(
      safeAmount
    );
  } catch {
    return `${currency} ${safeAmount.toLocaleString()}`;
  }
}

function formatCompactMoney(
  amount:
    NumericLike,
  currency =
    "BDT"
) {
  const safeAmount =
    toNumber(
      amount
    );

  if (
    Math.abs(
      safeAmount
    ) >=
    1_000_000
  ) {
    return `${currency} ${(
      safeAmount /
      1_000_000
    ).toFixed(
      2
    )}M`;
  }

  if (
    Math.abs(
      safeAmount
    ) >=
    1_000
  ) {
    return `${currency} ${(
      safeAmount /
      1_000
    ).toFixed(
      1
    )}K`;
  }

  return formatMoney(
    safeAmount,
    currency
  );
}

function formatDate(
  value:
    string
) {
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
    "en-BD",
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

function formatShortDate(
  value:
    string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      day:
        "2-digit",

      month:
        "short",
    }
  ).format(
    date
  );
}

function formatStatus(
  status:
    string
) {
  return status
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}

function formatSourceType(
  value:
    string
) {
  const labels:
    Record<
      string,
      string
    > = {
    wallet:
      "Wallet",

    card:
      "Card",

    paypal:
      "PayPal",

    local_psp:
      "Local PSP",
  };

  return (
    labels[
      value
    ] ??
    formatStatus(
      value
    )
  );
}

function clamp(
  value:
    number,
  min:
    number,
  max:
    number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

/* =========================================================
   CHART DATA
========================================================= */

function prepareTrendData(
  data:
    TrendItem[],
  periodStart:
    string | null | undefined
): TrendItem[] {
  if (
    !data.length
  ) {
    return [];
  }

  if (
    !periodStart
  ) {
    return data;
  }

  const start =
    new Date(
      periodStart
    );

  const end =
    new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );

  end.setHours(
    0,
    0,
    0,
    0
  );

  const dayCount =
    Math.ceil(
      (
        end.getTime() -
        start.getTime()
      ) /
        86_400_000
    );

  if (
    dayCount >
    100
  ) {
    return data;
  }

  const map =
    new Map<
      string,
      TrendItem
    >();

  data.forEach(
    (
      item
    ) => {
      map.set(
        item.date,
        item
      );
    }
  );

  const result:
    TrendItem[] = [];

  const cursor =
    new Date(
      start
    );

  while (
    cursor <=
    end
  ) {
    const key =
      cursor
        .toISOString()
        .slice(
          0,
          10
        );

    result.push(
      map.get(
        key
      ) ?? {
        date:
          key,

        paymentCount:
          0,

        volume:
          0,
      }
    );

    cursor.setDate(
      cursor.getDate() +
        1
    );
  }

  return result;
}

/* =========================================================
   STATUS CONFIG
========================================================= */

function getStatusConfig(
  status:
    PaymentStatus
) {
  switch (
    status
  ) {
    case "completed":
      return {
        label:
          "Completed",

        className:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",

        barClass:
          "bg-emerald-300",

        icon:
          CheckCircle2,
      };

    case "pending":
      return {
        label:
          "Pending",

        className:
          "bg-amber-500/15 text-amber-600 dark:text-amber-300",

        barClass:
          "bg-amber-300",

        icon:
          Clock3,
      };

    case "authorized":
    case "captured":
      return {
        label:
          formatStatus(
            status
          ),

        className:
          "bg-violet-500/15 text-violet-600 dark:text-violet-300",

        barClass:
          "bg-violet-300",

        icon:
          Activity,
      };

    case "failed":
    case "cancelled":
    case "expired":
      return {
        label:
          formatStatus(
            status
          ),

        className:
          "bg-red-500/15 text-red-600 dark:text-red-300",

        barClass:
          "bg-rose-300",

        icon:
          XCircle,
      };

    default:
      return {
        label:
          formatStatus(
            status
          ),

        className:
          "bg-muted text-muted-foreground",

        barClass:
          "bg-slate-300",

        icon:
          Activity,
      };
  }
}

/* =========================================================
   PURPLE SIGNATURE BACKGROUND

   USED ONLY IN:
   1. Hero
   2. Payment Status
   3. Merchant Health
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg, #240B4A 0%, #4C1D95 30%, #6D28D9 60%, #7C3AED 80%, #9333EA 100%)",
        }}
      />

      {/* TOP LEFT GLOW */}

      <motion.div
        aria-hidden
        animate={{
          x: [
            0,
            90,
            20,
            0,
          ],

          y: [
            0,
            25,
            75,
            0,
          ],

          scale: [
            1,
            1.18,
            0.92,
            1,
          ],
        }}
        transition={{
          duration:
            18,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -left-28
          -top-36
          h-[400px]
          w-[400px]
          rounded-full
          bg-fuchsia-400/30
          blur-[105px]
        "
      />

      {/* BOTTOM RIGHT GLOW */}

      <motion.div
        aria-hidden
        animate={{
          x: [
            0,
            -90,
            30,
            0,
          ],

          y: [
            0,
            -35,
            55,
            0,
          ],

          scale: [
            1,
            0.92,
            1.2,
            1,
          ],
        }}
        transition={{
          duration:
            22,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-40
          right-[-70px]
          h-[450px]
          w-[450px]
          rounded-full
          bg-violet-300/30
          blur-[115px]
        "
      />

      {/* CENTER INDIGO GLOW */}

      <motion.div
        aria-hidden
        animate={{
          scale: [
            0.85,
            1.2,
            0.9,
          ],

          opacity: [
            0.18,
            0.34,
            0.18,
          ],
        }}
        transition={{
          duration:
            12,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          left-[38%]
          top-[15%]
          h-[260px]
          w-[260px]
          rounded-full
          bg-indigo-300
          blur-[120px]
        "
      />

      {/* ROTATING ORBIT */}

      <motion.div
        aria-hidden
        animate={{
          rotate: [
            0,
            360,
          ],
        }}
        transition={{
          duration:
            48,

          repeat:
            Infinity,

          ease:
            "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[12%]
          top-[-185px]
          h-[390px]
          w-[390px]
          rounded-full
          border
          border-white/[0.10]
        "
      />

      <motion.div
        aria-hidden
        animate={{
          rotate: [
            360,
            0,
          ],
        }}
        transition={{
          duration:
            35,

          repeat:
            Infinity,

          ease:
            "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[17%]
          top-[-125px]
          h-[270px]
          w-[270px]
          rounded-full
          border
          border-fuchsia-200/[0.08]
        "
      />

      {/* MOVING SHINE */}

      <motion.div
        aria-hidden
        animate={{
          x: [
            "-35%",
            "150%",
          ],
        }}
        transition={{
          duration:
            8,

          repeat:
            Infinity,

          repeatDelay:
            3,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -top-1/2
          h-[200%]
          w-[190px]
          rotate-[18deg]
          bg-gradient-to-r
          from-transparent
          via-white/[0.10]
          to-transparent
          blur-xl
        "
      />

      {/* DOT MATRIX */}

      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.08]

          [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]
          [background-size:24px_24px]
        "
      />

      {/* BOTTOM DEPTH */}

      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-40
          bg-gradient-to-t
          from-[#16052f]/35
          to-transparent
        "
      />
    </>
  );
}

/* =========================================================
   MOTION SURFACE
========================================================= */

function MotionSurface({
  children,
  className =
    "",
  delay =
    0,
}: {
  children:
    React.ReactNode;

  className?:
    string;

  delay?:
    number;
}) {
  return (
    <motion.div
      initial={
        sectionInitial
      }
      animate={
        sectionAnimate
      }
      transition={{
        duration:
          0.5,

        delay,
      }}
      whileHover={{
        y:
          -5,

        scale:
          1.002,
      }}
      className={`
        merchant-surface
        merchant-border
        merchant-shadow

        relative
        overflow-hidden
        rounded-[24px]
        border

        transition-shadow
        duration-300

        hover:shadow-[0_22px_55px_rgba(91,33,182,0.12)]

        dark:hover:shadow-[0_22px_60px_rgba(0,0,0,0.30)]

        ${className}
      `}
    >
      {
        children
      }
    </motion.div>
  );
}

/* =========================================================
   CUSTOM PERIOD DROPDOWN
========================================================= */

function PeriodDropdown({
  value,
  onChange,
}: {
  value:
    Period;

  onChange:
    (
      value:
        Period
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    PERIOD_OPTIONS.find(
      (
        item
      ) =>
        item.value ===
        value
    ) ??
    PERIOD_OPTIONS[2];

  useEffect(
    () => {
      function handleOutside(
        event:
          MouseEvent
      ) {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target as
              Node
          )
        ) {
          setOpen(
            false
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handleOutside
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutside
        );
      };
    },
    []
  );

  return (
    <div
      ref={
        containerRef
      }
      className={`relative w-full min-w-0 ${open ? "z-[90]" : "z-20"} sm:w-auto`}
    >
      <motion.button
        type="button"
        whileTap={{
          scale:
            0.98,
        }}
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`
          flex
          h-11
          w-full
          min-w-0
          items-center

          sm:min-w-[170px]
          justify-between
          gap-3
          rounded-2xl
          border
          bg-card
          px-3.5
          text-left
          shadow-sm
          outline-none
          transition-all
          duration-200

          ${
            open
              ? "border-violet-400/70 shadow-[0_8px_30px_rgba(124,58,237,.12)] ring-4 ring-violet-500/10"
              : "merchant-border hover:border-violet-400/45 hover:shadow-md"
          }
        `}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              bg-violet-500/10
              text-violet-600

              dark:bg-violet-400/10
              dark:text-violet-300
            "
          >
            <CalendarRange className="h-3.5 w-3.5" />
          </div>

          <div>
            <p
              className="
                text-[7px]
                font-black
                uppercase
                tracking-[0.14em]
                text-violet-500/80
              "
            >
              Time range
            </p>

            <p className="mt-0.5 text-[10px] font-black text-foreground">
              {
                selected.label
              }
            </p>
          </div>
        </div>

        <motion.div
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
        >
          <ChevronDown className="h-4 w-4 text-violet-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity:
                0,

              y:
                -8,

              scale:
                0.96,
            }}
            animate={{
              opacity:
                1,

              y:
                8,

              scale:
                1,
            }}
            exit={{
              opacity:
                0,

              y:
                -5,

              scale:
                0.97,
            }}
            transition={{
              duration:
                0.18,
            }}
            className="
              absolute
              right-0
              top-full
              z-[100]
              w-[min(220px,calc(100vw-2rem))]
              overflow-hidden
              rounded-2xl
              border
              merchant-border
              bg-card
              p-1.5
              shadow-[0_22px_60px_rgba(30,10,60,.22)]
              backdrop-blur-xl
            "
          >
            {PERIOD_OPTIONS.map(
              (
                option,
                index
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <motion.button
                    key={
                      option.value
                    }
                    type="button"
                    initial={{
                      opacity:
                        0,

                      x:
                        8,
                    }}
                    animate={{
                      opacity:
                        1,

                      x:
                        0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.025,
                    }}
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      transition

                      ${
                        active
                          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                          : "text-foreground hover:bg-violet-500/[0.06]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-[8px]
                          font-black

                          ${
                            active
                              ? "bg-violet-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {
                          option.shortLabel
                        }
                      </span>

                      <span className="text-[11px] font-bold">
                        {
                          option.label
                        }
                      </span>
                    </div>

                    {active && (
                      <Check className="h-4 w-4 text-violet-600" />
                    )}
                  </motion.button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  helper,
  icon:
    Icon,
  tone,
  loading,
  index,
  financial =
    false,
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
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "neutral";

  loading?:
    boolean;

  index:
    number;

  financial?:
    boolean;
}) {
  const iconClass =
    tone ===
    "primary"
      ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
      : tone ===
          "success"
        ? "merchant-success-soft merchant-success"
        : tone ===
            "warning"
          ? "merchant-warning-soft merchant-warning"
          : tone ===
              "danger"
            ? "merchant-danger-soft merchant-danger"
            : "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{
        opacity:
          0,

        y:
          22,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      transition={{
        duration:
          0.45,

        delay:
          index *
          0.045,
      }}
      whileHover={{
        y:
          -8,

        scale:
          1.012,
      }}
      whileTap={{
        scale:
          0.995,
      }}
      className={`
        merchant-border
        merchant-shadow

        group
        relative
        overflow-hidden
        rounded-[23px]
        border
        p-5
        transition-shadow
        duration-300

        hover:shadow-[0_22px_50px_rgba(91,33,182,0.14)]

        ${
          financial
            ? `
              bg-[linear-gradient(145deg,rgba(124,58,237,0.085),rgba(168,85,247,0.035),rgba(255,255,255,0.92))]
              dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.16),rgba(88,28,135,0.10),rgba(15,23,42,0.92))]
            `
            : "merchant-surface"
        }
      `}
    >
      {/* TOP PURPLE LINE */}

      <motion.div
        aria-hidden
        initial={{
          scaleX:
            0,
        }}
        animate={{
          scaleX:
            1,
        }}
        transition={{
          delay:
            0.15 +
            index *
              0.04,

          duration:
            0.55,
        }}
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          origin-left
          bg-gradient-to-r
          from-violet-700
          via-purple-500
          to-fuchsia-400
        "
      />

      {/* GLOW */}

      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-14
          h-36
          w-36
          rounded-full
          bg-violet-500/[0.07]
          blur-[42px]
          transition-all
          duration-500

          group-hover:bg-violet-500/[0.15]
        "
      />

      {financial && (
        <motion.div
          aria-hidden
          animate={{
            x: [
              "-200%",
              "350%",
            ],
          }}
          transition={{
            duration:
              4.5,

            repeat:
              Infinity,

            repeatDelay:
              5,
          }}
          className="
            pointer-events-none
            absolute
            -top-1/2
            h-[200%]
            w-16
            rotate-[20deg]
            bg-white/20
            blur-xl
          "
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`
              max-w-[170px]
              text-[10px]
              font-black
              uppercase
              leading-4
              tracking-[0.17em]

              ${
                financial
                  ? "text-violet-600/75 dark:text-violet-300/75"
                  : "merchant-muted"
              }
            `}
          >
            {
              label
            }
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p
              className={`
                mt-2
                truncate
                text-[26px]
                font-black
                tracking-[-0.05em]

                ${
                  financial
                    ? "text-violet-800 dark:text-violet-100"
                    : "text-foreground"
                }
              `}
            >
              {
                value
              }
            </p>
          )}

          <p className="mt-2 max-w-[195px] text-[10px] font-semibold leading-4 merchant-muted">
            {
              helper
            }
          </p>

          {financial && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />

              <span className="text-[8px] font-black uppercase tracking-[0.11em] text-violet-600/70 dark:text-violet-300/70">
                Live financial metric
              </span>
            </div>
          )}
        </div>

        <motion.div
          whileHover={{
            rotate:
              7,

            scale:
              1.13,
          }}
          transition={
            springTransition
          }
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            border
            border-white/40
            shadow-sm

            ${iconClass}
          `}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   REVENUE CHART
========================================================= */

function RevenueTrendChart({
  data,
  currency,
  loading,
  periodStart,
}: {
  data:
    TrendItem[];

  currency:
    string;

  loading:
    boolean;

  periodStart:
    string | null | undefined;
}) {
  const chartData =
    useMemo(
      () =>
        prepareTrendData(
          data,
          periodStart
        ),
      [
        data,
        periodStart,
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="h-[360px] animate-pulse rounded-[22px] bg-muted/60" />
    );
  }

  if (
    !data.length
  ) {
    return (
      <div
        className="
          flex
          h-[360px]
          items-center
          justify-center
          rounded-[22px]
          border
          border-dashed
          border-violet-300/30
          bg-violet-500/[0.025]
        "
      >
        <div className="text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-violet-400" />

          <p className="mt-3 text-sm font-black text-foreground">
            No completed payment data yet
          </p>

          <p className="mt-1 text-xs merchant-muted">
            Revenue activity will appear after completed payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        relative
        h-[360px]
        overflow-hidden
        rounded-[22px]
        border
        border-violet-300/20

        bg-[radial-gradient(circle_at_12%_8%,rgba(168,85,247,0.12),transparent_34%),linear-gradient(145deg,rgba(124,58,237,0.07),rgba(255,255,255,0.55))]

        dark:bg-[radial-gradient(circle_at_12%_8%,rgba(168,85,247,0.14),transparent_34%),linear-gradient(145deg,rgba(88,28,135,0.14),rgba(15,23,42,0.5))]

        p-3
      "
    >
      <motion.div
        animate={{
          x: [
            -20,
            50,
            -20,
          ],

          y: [
            0,
            25,
            0,
          ],
        }}
        transition={{
          duration:
            12,

          repeat:
            Infinity,
        }}
        className="
          pointer-events-none
          absolute
          -left-16
          -top-20
          h-52
          w-52
          rounded-full
          bg-fuchsia-400/10
          blur-[75px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-24
          right-0
          h-56
          w-56
          rounded-full
          bg-violet-500/10
          blur-[75px]
        "
      />

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <ComposedChart
          data={
            chartData
          }
          margin={{
            top:
              22,

            right:
              18,

            left:
              -12,

            bottom:
              2,
          }}
        >
          <defs>
            <linearGradient
              id="purpleRevenueArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#7C3AED"
                stopOpacity={
                  0.42
                }
              />

              <stop
                offset="50%"
                stopColor="#A855F7"
                stopOpacity={
                  0.14
                }
              />

              <stop
                offset="100%"
                stopColor="#D946EF"
                stopOpacity={
                  0.01
                }
              />
            </linearGradient>

            <linearGradient
              id="purpleRevenueStroke"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#6D28D9"
              />

              <stop
                offset="55%"
                stopColor="#8B5CF6"
              />

              <stop
                offset="100%"
                stopColor="#D946EF"
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 8"
            vertical={
              false
            }
            stroke="rgba(124,58,237,0.11)"
          />

          <XAxis
            dataKey="date"
            tickFormatter={
              formatShortDate
            }
            axisLine={
              false
            }
            tickLine={
              false
            }
            minTickGap={
              40
            }
            tick={{
              fontSize:
                9,

              fill:
                "#7C3AED",

              fontWeight:
                700,
            }}
          />

          <YAxis
            yAxisId="money"
            axisLine={
              false
            }
            tickLine={
              false
            }
            width={
              75
            }
            tickFormatter={(
              value
            ) =>
              formatCompactMoney(
                toNumber(
                  value
                ),
                currency
              )
            }
            tick={{
              fontSize:
                9,

              fill:
                "#7C3AED",

              fontWeight:
                700,
            }}
          />

          <YAxis
            yAxisId="count"
            orientation="right"
            hide
          />

          <Tooltip
            cursor={{
              stroke:
                "#8B5CF6",

              strokeOpacity:
                0.28,

              strokeDasharray:
                "4 4",
            }}
            labelFormatter={(
              label
            ) =>
              formatDate(
                `${String(
                  label
                )}T00:00:00`
              )
            }
            formatter={(
              value,
              name
            ) => {
              if (
                name ===
                "Payments"
              ) {
                return [
                  `${toNumber(
                    value
                  )} payments`,

                  "Payments",
                ];
              }

              return [
                formatMoney(
                  toNumber(
                    value
                  ),
                  currency
                ),

                "Revenue",
              ];
            }}
            contentStyle={{
              borderRadius:
                "16px",

              border:
                "1px solid rgba(139,92,246,.22)",

              background:
                "rgba(255,255,255,.97)",

              boxShadow:
                "0 18px 45px rgba(76,29,149,.18)",

              fontSize:
                "11px",

              fontWeight:
                700,
            }}
          />

          <Area
            yAxisId="money"
            type="monotone"
            dataKey="volume"
            name="Revenue"
            stroke="url(#purpleRevenueStroke)"
            strokeWidth={
              3.5
            }
            fill="url(#purpleRevenueArea)"
            dot={
              false
            }
            activeDot={{
              r:
                6,

              fill:
                "#7C3AED",

              stroke:
                "#ffffff",

              strokeWidth:
                3,
            }}
            isAnimationActive
            animationDuration={
              1300
            }
            animationEasing="ease-out"
          />

          <Line
            yAxisId="count"
            type="monotone"
            dataKey="paymentCount"
            name="Payments"
            stroke="#D946EF"
            strokeWidth={
              2
            }
            strokeDasharray="6 6"
            dot={
              false
            }
            activeDot={{
              r:
                4,

              fill:
                "#D946EF",
            }}
            animationDuration={
              1550
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function PaymentStatusPanel({
  items,
  total,
  processingPayments,
  successRate,
  loading,
}: {
  items:
    BreakdownItem[];

  total:
    number;

  processingPayments:
    number;

  successRate:
    number;

  loading:
    boolean;
}) {
  const orderedStatuses:
    PaymentStatus[] = [
    "completed",
    "pending",
    "authorized",
    "captured",
    "failed",
    "cancelled",
    "expired",
  ];

  const orderedItems =
    orderedStatuses
      .map(
        (
          status
        ) =>
          items.find(
            (
              item
            ) =>
              item.key ===
              status
          )
      )
      .filter(
        (
          item
        ): item is BreakdownItem =>
          Boolean(
            item
          )
      );

  return (
    <motion.div
      initial={{
        opacity:
          0,

        x:
          20,
      }}
      animate={{
        opacity:
          1,

        x:
          0,
      }}
      whileHover={{
        y:
          -5,
      }}
      className="
        relative
        flex
        min-h-[485px]
        flex-col
        overflow-hidden
        rounded-[25px]
        p-5
        text-white
        shadow-[0_26px_65px_rgba(91,33,182,0.24)]

        sm:p-6
      "
    >
      <PurpleAuroraBackground />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate:
                  8,

                scale:
                  1.1,
              }}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                border
                border-white/15
                bg-white/10
                backdrop-blur-xl
              "
            >
              <Activity className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-100/60">
                Live Distribution
              </p>

              <h3 className="mt-1 text-base font-black">
                Payment Status
              </h3>

              <p className="mt-1 text-[10px] font-semibold text-white/60">
                Payment lifecycle performance
              </p>
            </div>
          </div>

          <motion.div
            animate={{
              rotate: [
                0,
                8,
                -4,
                0,
              ],

              scale: [
                1,
                1.08,
                1,
              ],
            }}
            transition={{
              duration:
                5,

              repeat:
                Infinity,
            }}
          >
            <Sparkles className="h-5 w-5 text-fuchsia-200" />
          </motion.div>
        </div>

        {/* SUMMARY */}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <motion.div
            whileHover={{
              y:
                -3,

              backgroundColor:
                "rgba(255,255,255,.14)",
            }}
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.09]
              p-4
              backdrop-blur-xl
            "
          >
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/50">
              Total Payments
            </p>

            <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
              {
                total
              }
            </p>
          </motion.div>

          <motion.div
            whileHover={{
              y:
                -3,

              backgroundColor:
                "rgba(255,255,255,.14)",
            }}
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.09]
              p-4
              backdrop-blur-xl
            "
          >
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/50">
              Success Rate
            </p>

            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-emerald-200">
              {successRate.toFixed(
                1
              )}
              %
            </p>
          </motion.div>
        </div>

        {/* LIST */}

        <div className="mt-6 flex-1 space-y-3">
          {loading ? (
            Array.from({
              length:
                4,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-16 animate-pulse rounded-2xl bg-white/10"
                />
              )
            )
          ) : orderedItems.length ? (
            orderedItems.map(
              (
                item,
                index
              ) => {
                const percentage =
                  total >
                  0
                    ? (
                        item.count /
                        total
                      ) *
                      100
                    : 0;

                const config =
                  getStatusConfig(
                    item.key as
                      PaymentStatus
                  );

                const Icon =
                  config.icon;

                return (
                  <motion.div
                    key={
                      item.key
                    }
                    initial={{
                      opacity:
                        0,

                      x:
                        18,
                    }}
                    animate={{
                      opacity:
                        1,

                      x:
                        0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.055,
                    }}
                    whileHover={{
                      x:
                        5,

                      scale:
                        1.012,
                    }}
                    className="
                      rounded-2xl
                      border
                      border-white/[0.10]
                      bg-white/[0.075]
                      p-3
                      backdrop-blur-xl
                      transition-colors

                      hover:bg-white/[0.12]
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl

                            ${config.className}
                          `}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black">
                            {
                              config.label
                            }
                          </p>

                          <p className="mt-0.5 text-[8px] font-semibold text-white/50">
                            {
                              item.count
                            }{" "}
                            payments
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-black text-fuchsia-100">
                        {percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{
                          width:
                            0,
                        }}
                        animate={{
                          width:
                            `${clamp(
                              percentage,
                              0,
                              100
                            )}%`,
                        }}
                        transition={{
                          duration:
                            0.85,

                          delay:
                            index *
                            0.05,
                        }}
                        className={`
                          h-full
                          rounded-full

                          ${config.barClass}
                        `}
                      />
                    </div>
                  </motion.div>
                );
              }
            )
          ) : (
            <div
              className="
                flex
                h-40
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white/[0.06]
              "
            >
              <div className="text-center">
                <Activity className="mx-auto h-6 w-6 text-white/55" />

                <p className="mt-2 text-xs font-black">
                  No payment activity
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-2.5
            border-t
            border-white/10
            pt-4
          "
        >
          <div className="rounded-xl bg-black/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[8px] font-black uppercase tracking-wider text-white/45">
              Processing
            </p>

            <p className="mt-1 text-lg font-black">
              {
                processingPayments
              }
            </p>
          </div>

          <div className="rounded-xl bg-black/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[8px] font-black uppercase tracking-wider text-white/45">
              Status
            </p>

            <p className="mt-1 text-[11px] font-black text-fuchsia-100">
              Live monitoring
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   RECENT PAYMENTS
========================================================= */

function RecentPayments({
  payments,
  currency,
  loading,
}: {
  payments:
    RecentPayment[];

  currency:
    string;

  loading:
    boolean;
}) {
  if (
    loading
  ) {
    return (
      <div className="space-y-2">
        {Array.from({
          length:
            6,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="h-[68px] animate-pulse rounded-2xl bg-muted/60"
            />
          )
        )}
      </div>
    );
  }

  if (
    !payments.length
  ) {
    return (
      <div
        className="
          flex
          min-h-[340px]
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-violet-300/30
          bg-violet-500/[0.025]
          text-center
        "
      >
        <div>
          <CreditCard className="mx-auto h-8 w-8 text-violet-400" />

          <p className="mt-3 text-sm font-black text-foreground">
            No payments found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        max-h-[430px]
        space-y-2
        overflow-y-auto
        overscroll-contain
        pr-1

        [scrollbar-width:none]
        [-ms-overflow-style:none]

        [&::-webkit-scrollbar]:hidden
      "
    >
      {payments.map(
        (
          payment,
          index
        ) => {
          const status =
            getStatusConfig(
              payment.status
            );

          return (
            <motion.div
              key={
                payment.paymentId
              }
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
                delay:
                  index *
                  0.035,
              }}
              whileHover={{
                x:
                  5,

                scale:
                  1.004,
              }}
            >
              <Link
                href={`/dashboard/merchant/payments/${encodeURIComponent(
                  payment.paymentId
                )}`}
                className="
                  group
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  merchant-border
                  bg-background/55
                  px-3
                  py-3
                  transition-all
                  duration-200

                  hover:border-violet-400/45
                  hover:bg-violet-500/[0.045]
                  hover:shadow-[0_12px_30px_rgba(91,33,182,0.08)]
                "
              >
                <motion.div
                  whileHover={{
                    rotate:
                      -5,

                    scale:
                      1.1,
                  }}
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-500/10
                    text-violet-600

                    dark:text-violet-300
                  "
                >
                  <CreditCard className="h-4 w-4" />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="max-w-[255px] truncate text-xs font-black text-foreground">
                      {
                        payment.paymentId
                      }
                    </p>

                    <span
                      className={`
                        shrink-0
                        rounded-full
                        px-2
                        py-1
                        text-[8px]
                        font-black

                        ${status.className}
                      `}
                    >
                      {
                        status.label
                      }
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[10px] font-semibold merchant-muted">
                    {formatSourceType(
                      payment.sourceType
                    )}{" "}
                    •{" "}
                    {
                      payment.provider
                    }{" "}
                    •{" "}
                    {formatDate(
                      payment.createdAt
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-violet-700 dark:text-violet-200">
                    {formatMoney(
                      payment.amount,
                      payment.currency ||
                        currency
                    )}
                  </p>

                  <p className="mt-1 text-[9px] font-semibold merchant-muted">
                    {
                      payment.mode.toUpperCase()
                    }
                  </p>
                </div>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-1 sm:block" />
              </Link>
            </motion.div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   BREAKDOWN CARD
========================================================= */

function BreakdownCard({
  title,
  subtitle,
  icon:
    Icon,
  items,
  currency,
  loading,
  delay =
    0,
}: {
  title:
    string;

  subtitle:
    string;

  icon:
    React.ElementType;

  items:
    BreakdownItem[];

  currency:
    string;

  loading:
    boolean;

  delay?:
    number;
}) {
  return (
    <MotionSurface
      delay={
        delay
      }
      className="p-5"
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          bg-violet-500/[0.075]
          blur-3xl
        "
      />

      <div className="relative mb-4 flex items-center gap-3">
        <motion.div
          whileHover={{
            rotate:
              7,

            scale:
              1.1,
          }}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <Icon className="h-4 w-4" />
        </motion.div>

        <div>
          <h3 className="text-sm font-black text-foreground">
            {
              title
            }
          </h3>

          <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
            {
              subtitle
            }
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({
            length:
              2,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-14 animate-pulse rounded-xl bg-muted/60"
              />
            )
          )}
        </div>
      ) : items.length ? (
        <div className="space-y-2">
          {items
            .slice(
              0,
              5
            )
            .map(
              (
                item,
                index
              ) => (
                <motion.div
                  key={
                    item.key
                  }
                  initial={{
                    opacity:
                      0,

                    x:
                      10,
                  }}
                  animate={{
                    opacity:
                      1,

                    x:
                      0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.05,
                  }}
                  whileHover={{
                    x:
                      4,

                    scale:
                      1.01,
                  }}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    merchant-border
                    bg-muted/25
                    px-3
                    py-3
                    transition-colors

                    hover:border-violet-400/30
                    hover:bg-violet-500/[0.05]
                  "
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-foreground">
                      {title ===
                      "Payment Methods"
                        ? formatSourceType(
                            item.key
                          )
                        : formatStatus(
                            item.key
                          )}
                    </p>

                    <p className="mt-1 text-[9px] font-semibold merchant-muted">
                      {
                        item.count
                      }{" "}
                      payments
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-black text-violet-700 dark:text-violet-200">
                    {formatCompactMoney(
                      item.amount,
                      currency
                    )}
                  </p>
                </motion.div>
              )
            )}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/30 px-4 py-7 text-center">
          <p className="text-xs font-bold merchant-muted">
            No data available yet.
          </p>
        </div>
      )}
    </MotionSurface>
  );
}

/* =========================================================
   GATEWAY STATUS
========================================================= */

function GatewayStatusCard({
  merchant,
  generatedAt,
  loading,
}: {
  merchant:
    MerchantInfo | undefined;

  generatedAt:
    string | undefined;

  loading:
    boolean;
}) {
  const ready =
    Boolean(
      merchant?.status ===
        "active" &&
        merchant
          ?.verificationStatus ===
          "verified"
    );

  return (
    <MotionSurface
      delay={
        0.15
      }
      className="p-5"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={
            ready
              ? {
                  scale: [
                    1,
                    1.08,
                    1,
                  ],
                }
              : {}
          }
          transition={{
            duration:
              2.5,

            repeat:
              Infinity,
          }}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <ShieldCheck className="h-4 w-4" />
        </motion.div>

        <div>
          <h3 className="text-sm font-black text-foreground">
            Gateway Status
          </h3>

          <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
            Merchant payment readiness
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStatus
          label="Account"
          value={
            loading
              ? "..."
              : formatStatus(
                  merchant?.status ??
                    "unknown"
                )
          }
          healthy={
            merchant?.status ===
            "active"
          }
        />

        <MiniStatus
          label="Verification"
          value={
            loading
              ? "..."
              : formatStatus(
                  merchant
                    ?.verificationStatus ??
                    "unknown"
                )
          }
          healthy={
            merchant
              ?.verificationStatus ===
            "verified"
          }
        />

        <MiniStatus
          label="Test Mode"
          value={
            merchant
              ?.testEnabled
              ? "Enabled"
              : "Disabled"
          }
          healthy={
            Boolean(
              merchant
                ?.testEnabled
            )
          }
        />

        <MiniStatus
          label="Live Mode"
          value={
            merchant
              ?.liveEnabled
              ? "Enabled"
              : "Disabled"
          }
          healthy={
            Boolean(
              merchant
                ?.liveEnabled
            )
          }
        />
      </div>

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
          rounded-xl
          bg-violet-500/[0.045]
          px-3
          py-2.5
        "
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{
              opacity: [
                0.5,
                1,
                0.5,
              ],
            }}
            transition={{
              duration:
                2,

              repeat:
                Infinity,
            }}
            className={`
              h-2
              w-2
              rounded-full

              ${
                ready
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }
            `}
          />

          <span className="text-[10px] font-black text-foreground">
            {ready
              ? "Gateway ready"
              : "Action required"}
          </span>
        </div>

        <span className="text-[9px] font-semibold merchant-muted">
          {generatedAt
            ? formatDate(
                generatedAt
              )
            : "Waiting..."}
        </span>
      </div>
    </MotionSurface>
  );
}

/* =========================================================
   MINI STATUS
========================================================= */

function MiniStatus({
  label,
  value,
  healthy,
}: {
  label:
    string;

  value:
    string;

  healthy:
    boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -3,

        scale:
          1.015,
      }}
      className="
        rounded-xl
        border
        merchant-border
        bg-muted/25
        p-3
        transition-colors

        hover:bg-violet-500/[0.04]
      "
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-violet-500/70">
        {
          label
        }
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full

            ${
              healthy
                ? "bg-emerald-500"
                : "bg-amber-500"
            }
          `}
        />

        <p className="truncate text-[10px] font-black text-foreground">
          {
            value
          }
        </p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   MERCHANT HEALTH
========================================================= */

function MerchantHealthPanel({
  merchant,
  successRate,
  totalPayments,
  liveEnvironmentReady,
  loading,
}: {
  merchant:
    MerchantInfo | undefined;

  successRate:
    number;

  totalPayments:
    number;

  liveEnvironmentReady:
    boolean;

  loading:
    boolean;
}) {
  const readiness = [
    {
      label:
        "Merchant account",

      description:
        "Account is active and allowed to access gateway services.",

      ready:
        merchant
          ?.status ===
        "active",
    },

    {
      label:
        "Business verification",

      description:
        "Business verification required for production payment processing.",

      ready:
        merchant
          ?.verificationStatus ===
        "verified",
    },

    {
      label:
        "Live environment",

      description:
        "Production payments are enabled for this merchant.",

      ready:
        liveEnvironmentReady,
    },

    {
      label:
        "Payment activity",

      description:
        "The gateway has received merchant payment activity.",

      ready:
        totalPayments >
        0,
    },
  ];

  const healthScore =
    readiness.length >
    0
      ? Math.round(
          (
            readiness.filter(
              (
                item
              ) =>
                item.ready
            ).length /
            readiness.length
          ) *
            100
        )
      : 0;

  return (
    <motion.div
      initial={{
        opacity:
          0,

        y:
          18,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      whileHover={{
        y:
          -5,
      }}
      className="
        relative
        min-h-[470px]
        overflow-hidden
        rounded-[25px]
        p-5
        text-white
        shadow-[0_26px_65px_rgba(91,33,182,0.24)]

        sm:p-6
      "
    >
      <PurpleAuroraBackground />

      <div className="relative z-10">
        <div
          className="
            flex
            flex-col
            gap-6

            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate:
                  -7,

                scale:
                  1.1,
              }}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                border
                border-white/15
                bg-white/10
                backdrop-blur-xl
              "
            >
              <Store className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-100/55">
                System Readiness
              </p>

              <h3 className="mt-1 text-base font-black">
                Merchant Health
              </h3>

              <p className="mt-1 text-[10px] font-semibold text-white/60">
                Integration and gateway readiness
              </p>
            </div>
          </div>

          {/* HEALTH RING */}

          <div className="flex shrink-0 items-center justify-center">
            <motion.div
              whileHover={{
                scale:
                  1.05,
              }}
              className="
                relative
                flex
                h-[125px]
                w-[125px]
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-white/[0.08]
                shadow-[0_15px_40px_rgba(20,0,40,.15)]
                backdrop-blur-xl
              "
            >
              <svg
                className="absolute inset-[6px] h-[113px] w-[113px] -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,.12)"
                  strokeWidth="7"
                />

                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#E9D5FF"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  initial={{
                    strokeDashoffset:
                      264,
                  }}
                  animate={{
                    strokeDashoffset:
                      264 -
                      (
                        healthScore /
                        100
                      ) *
                        264,
                  }}
                  transition={{
                    duration:
                      1.3,

                    ease:
                      "easeOut",
                  }}
                />
              </svg>

              <div className="relative text-center">
                <p className="text-2xl font-black tracking-[-0.05em]">
                  {
                    healthScore
                  }
                  %
                </p>

                <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-fuchsia-100/55">
                  Ready
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* STATUS CARDS */}

        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          <HealthGlassCard
            title="Account"
            value={formatStatus(
              merchant
                ?.status ??
                "unknown"
            )}
            ready={
              merchant
                ?.status ===
              "active"
            }
          />

          <HealthGlassCard
            title="Verification"
            value={formatStatus(
              merchant
                ?.verificationStatus ??
                "unknown"
            )}
            ready={
              merchant
                ?.verificationStatus ===
              "verified"
            }
          />

          <HealthGlassCard
            title="Success Rate"
            value={
              loading
                ? "—"
                : `${successRate.toFixed(
                    1
                  )}%`
            }
            ready={
              successRate >
              0
            }
          />
        </div>

        {/* CHECKLIST */}

        <div
          className="
            mt-5
            rounded-[20px]
            border
            border-white/10
            bg-black/[0.08]
            p-4
            backdrop-blur-xl
          "
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-fuchsia-100/50">
                Readiness Checklist
              </p>

              <p className="mt-1 text-xs font-black">
                Gateway health checks
              </p>
            </div>

            <span
              className="
                rounded-full
                border
                border-white/10
                bg-white/10
                px-2.5
                py-1
                text-[8px]
                font-black
              "
            >
              {
                totalPayments
              }{" "}
              payments
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {readiness.map(
              (
                item,
                index
              ) => (
                <motion.div
                  key={
                    item.label
                  }
                  initial={{
                    opacity:
                      0,

                    y:
                      8,
                  }}
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.06,
                  }}
                  whileHover={{
                    y:
                      -3,

                    scale:
                      1.01,

                    backgroundColor:
                      "rgba(255,255,255,.13)",
                  }}
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.07]
                    p-3
                  "
                >
                  <div
                    className={`
                      mt-0.5
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg

                      ${
                        item.ready
                          ? "bg-emerald-300/20 text-emerald-100"
                          : "bg-amber-300/20 text-amber-100"
                      }
                    `}
                  >
                    {item.ready ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black">
                      {
                        item.label
                      }
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-white/55">
                      {
                        item.description
                      }
                    </p>
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   HEALTH GLASS
========================================================= */

function HealthGlassCard({
  title,
  value,
  ready,
}: {
  title:
    string;

  value:
    string;

  ready:
    boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -4,

        scale:
          1.02,
      }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.08]
        p-3
        backdrop-blur-xl
      "
    >
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-fuchsia-100/50">
        {
          title
        }
      </p>

      <div className="mt-2 flex items-center gap-2">
        <motion.span
          animate={{
            opacity: [
              0.5,
              1,
              0.5,
            ],
          }}
          transition={{
            duration:
              2,

            repeat:
              Infinity,
          }}
          className={`
            h-2
            w-2
            rounded-full

            ${
              ready
                ? "bg-emerald-300"
                : "bg-amber-300"
            }
          `}
        />

        <span className="truncate text-[11px] font-black">
          {
            value
          }
        </span>
      </div>
    </motion.div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon:
    Icon,
  label,
  description,
  index,
}: {
  href:
    string;

  icon:
    React.ElementType;

  label:
    string;

  description:
    string;

  index:
    number;
}) {
  return (
    <motion.div
      initial={{
        opacity:
          0,

        x:
          16,
      }}
      animate={{
        opacity:
          1,

        x:
          0,
      }}
      transition={{
        delay:
          index *
          0.055,
      }}
      whileHover={{
        x:
          5,

        scale:
          1.008,
      }}
    >
      <Link
        href={
          href
        }
        className="
          group
          flex
          items-center
          gap-3
          rounded-2xl
          border
          merchant-border
          bg-muted/25
          p-3
          transition-all
          duration-200

          hover:border-violet-400/40
          hover:bg-violet-500/[0.05]
          hover:shadow-[0_10px_30px_rgba(91,33,182,0.08)]
        "
      >
        <motion.div
          whileHover={{
            rotate:
              -5,

            scale:
              1.12,
          }}
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <Icon className="h-4 w-4" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-foreground">
            {
              label
            }
          </p>

          <p className="mt-0.5 truncate text-[9px] font-semibold merchant-muted">
            {
              description
            }
          </p>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

/* =========================================================
   HERO PILL
========================================================= */

function HeroPill({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <motion.span
      whileHover={{
        y:
          -3,

        scale:
          1.03,
      }}
      transition={
        springTransition
      }
      className="
        rounded-full
        border
        border-white/15
        bg-white/[0.09]
        px-3
        py-1.5
        text-[9px]
        font-black
        uppercase
        tracking-wider
        text-fuchsia-50
        shadow-sm
        backdrop-blur-xl
      "
    >
      {
        children
      }
    </motion.span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantOverviewPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const [
    period,
    setPeriod,
  ] =
    useState<Period>(
      "30d"
    );

  const [
    data,
    setData,
  ] =
    useState<MerchantOverviewData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* =======================================================
     LOAD LIVE OVERVIEW
  ======================================================= */

  const loadOverview =
    useCallback(
      async (
        isRefresh =
          false
      ) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setData(null);
          setErrorMessage("");

          return;
        }

        try {
          if (
            isRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setErrorMessage(
            ""
          );

          const response =
            await apiClient<MerchantOverviewResponse>(
              `/merchants/overview?period=${period}`,
              {
                method:
                  "GET",
              }
            );

          if (
            !response
              ?.success ||
            !response.data
          ) {
            throw new Error(
              response
                ?.message ||
                "Unable to load merchant overview."
            );
          }

          setData(
            normalizeOverviewData(
              response.data
            )
          );
        } catch (
          error
        ) {
          console.error(
            "Merchant overview loading error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load merchant overview."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        isMerchantRole,
        period,
      ]
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void loadOverview();
    },
    [
      isMerchantRole,
      loadOverview,
    ]
  );

  /* =======================================================
     DERIVED
  ======================================================= */

  const summary =
    data?.summary;

  const merchant =
    data?.merchant;

  const currency =
    merchant
      ?.defaultCurrency ||
    "BDT";

  const totalPayments =
    summary
      ?.totalPayments ??
    0;

  const successfulPayments =
    summary
      ?.successfulPayments ??
    0;

  const pendingPayments =
    summary
      ?.pendingPayments ??
    0;

  const failedPayments =
    summary
      ?.failedPayments ??
    0;

  const processingPayments =
    summary
      ?.processingPayments ??
    0;

  const successRate =
    summary
      ?.successRate ??
    0;

  const grossVolume =
    summary
      ?.grossVolume ??
    0;

  const totalFees =
    summary
      ?.totalFees ??
    0;

  const netRevenue =
    summary
      ?.netRevenue ??
    0;

  const averagePaymentValue =
    summary
      ?.averagePaymentValue ??
    0;

  const uniqueCustomers =
    summary
      ?.uniqueCustomers ??
    0;

  const periodLabel =
    PERIOD_OPTIONS.find(
      (
        item
      ) =>
        item.value ===
        period
    )?.label ??
    "Last 30 days";

  const liveEnvironmentReady =
    Boolean(
      merchant
        ?.liveEnabled &&
        merchant
          ?.verificationStatus ===
          "verified" &&
        merchant
          ?.status ===
          "active"
    );

  const latestActivityText =
    useMemo(
      () => {
        if (
          !data
            ?.generatedAt
        ) {
          return "Waiting for data...";
        }

        return `Updated ${formatDate(
          data.generatedAt
        )}`;
      },
      [
        data
          ?.generatedAt,
      ]
    );

  /* =======================================================
     MERCHANT-ONLY REDIRECTING
  ======================================================= */

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant overview is available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     FULL ERROR
  ======================================================= */

  if (
    !loading &&
    errorMessage &&
    !data
  ) {
    return (
      <div className="merchant-theme">
        <div className="mx-auto max-w-[1440px]">
          <MotionSurface className="p-8 text-center">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-red-500/10
                text-red-500
              "
            >
              <XCircle className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-black text-foreground">
              Merchant overview unavailable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 merchant-muted">
              {
                errorMessage
              }
            </p>

            <button
              type="button"
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void loadOverview();
              }}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-violet-700
                to-purple-600
                px-5
                py-3
                text-sm
                font-black
                text-white
                shadow-[0_12px_30px_rgba(124,58,237,.25)]
                transition

                hover:-translate-y-0.5
                hover:shadow-[0_15px_35px_rgba(124,58,237,.35)]
              "
            >
              <RefreshCcw className="h-4 w-4" />

              Try Again
            </button>
          </MotionSurface>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-theme space-y-6">

      {/* =================================================
          HERO — PURPLE SIGNATURE SECTION
      ================================================== */}

      <motion.section
        initial={{
          opacity:
            0,

          y:
            18,

          scale:
            0.995,
        }}
        animate={{
          opacity:
            1,

          y:
            0,

          scale:
            1,
        }}
        transition={{
          duration:
            0.6,
        }}
        className="
          relative
          overflow-hidden
          rounded-[30px]
          p-6
          text-white
          shadow-[0_28px_70px_rgba(91,33,182,0.28)]

          sm:p-7
          lg:p-8
        "
      >
        <PurpleAuroraBackground />

        <div
          className="
            relative
            z-10
            flex
            flex-col
            gap-8

            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div className="min-w-0 max-w-[810px]">
            {/* MERCHANT */}

            <div className="flex min-w-0 items-start gap-3">
              <motion.div
                whileHover={{
                  rotate:
                    -7,

                  scale:
                    1.1,
                }}
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/15
                  bg-white/[0.10]
                  shadow-lg
                  backdrop-blur-xl
                "
              >
                <Store className="h-5 w-5" />
              </motion.div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-fuchsia-100/55">
                  Merchant Portal
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="
                      break-words
                      text-xl
                      font-black
                      leading-tight
                      tracking-[-0.03em]
                      [overflow-wrap:anywhere]

                      sm:text-2xl
                    "
                  >
                    {merchant
                      ?.businessDisplayName ||
                      merchant
                        ?.businessName ||
                      "Your Business"}
                  </span>

                  {merchant
                    ?.status ===
                    "active" && (
                    <motion.span
                      animate={{
                        boxShadow: [
                          "0 0 0 rgba(52,211,153,0)",
                          "0 0 24px rgba(52,211,153,.28)",
                          "0 0 0 rgba(52,211,153,0)",
                        ],
                      }}
                      transition={{
                        duration:
                          2.8,

                        repeat:
                          Infinity,
                      }}
                      className="
                        flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-emerald-200/15
                        bg-emerald-300/15
                        px-2.5
                        py-1
                        text-[8px]
                        font-black
                        uppercase
                        tracking-wider
                        text-emerald-100
                      "
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

                      Active
                    </motion.span>
                  )}
                </div>
              </div>
            </div>

            {/* TITLE */}

            <motion.div
              initial={{
                opacity:
                  0,

                y:
                  16,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              transition={{
                delay:
                  0.12,
              }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-fuchsia-100/70">
                <TrendingUp className="h-3.5 w-3.5" />

                Business performance
              </div>

              <h1
                className="
                  mt-3
                  max-w-[790px]
                  text-[34px]
                  font-black
                  leading-[1.02]
                  tracking-[-0.055em]
                  text-white

                  sm:text-[42px]
                  lg:text-[48px]
                "
              >
                Payments, revenue and
                <span
                  className="
                    block
                    bg-gradient-to-r
                    from-white
                    via-fuchsia-100
                    to-violet-200
                    bg-clip-text
                    text-transparent
                  "
                >
                  business growth in one place.
                </span>
              </h1>

              <p className="mt-4 max-w-[690px] text-[13px] font-medium leading-6 text-white/70 sm:text-sm">
                Monitor revenue, payment performance,
                customer activity and gateway health
                through one secure merchant workspace.
              </p>
            </motion.div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <HeroPill>
                {
                  periodLabel
                }
              </HeroPill>

              <HeroPill>
                {
                  currency
                }
              </HeroPill>

              <HeroPill>
                {
                  latestActivityText
                }
              </HeroPill>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <motion.div
              whileHover={{
                y:
                  -4,
              }}
            >
              <Link
                href="/dashboard/merchant/payments"
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-white/[0.10]
                  px-4
                  py-3
                  text-xs
                  font-black
                  text-white
                  shadow-lg
                  backdrop-blur-xl
                  transition

                  hover:bg-white/[0.16]
                "
              >
                <CreditCard className="h-4 w-4" />

                View Payments
              </Link>
            </motion.div>

            <motion.div
              whileHover={{
                y:
                  -4,
              }}
            >
              <Link
                href="/dashboard/merchant/analytics"
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-4
                  py-3
                  text-xs
                  font-black
                  text-violet-700
                  shadow-[0_14px_35px_rgba(30,10,60,.20)]
                  transition

                  hover:bg-fuchsia-50
                "
              >
                <BarChart3 className="h-4 w-4" />

                Analytics
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* =================================================
          ERROR
      ================================================== */}

      {errorMessage &&
        data && (
          <motion.div
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
            className="
              flex
              min-w-0
              flex-col
              gap-3
              rounded-2xl

              sm:flex-row
              sm:items-center
              sm:justify-between
              border
              border-red-200/70
              bg-red-500/5
              px-4
              py-3
              text-xs
              font-bold
              text-red-600
            "
          >
            <div className="flex min-w-0 items-start gap-2">
              <XCircle className="h-4 w-4 shrink-0" />

              {
                errorMessage
              }
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void loadOverview(
                  true
                );
              }}
              className="rounded-lg px-3 py-2 font-black hover:bg-red-500/5"
            >
              Retry
            </button>
          </motion.div>
        )}

      {/* =================================================
          OVERVIEW HEADER + CUSTOM DROPDOWN
      ================================================== */}

      <motion.div
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
        className="
          flex
          flex-col
          gap-3

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-violet-600 dark:text-violet-300">
            Business Overview
          </p>

          <h2 className="mt-1 break-words text-xl font-black leading-tight tracking-[-0.03em] text-foreground [overflow-wrap:anywhere]">
            Performance snapshot
          </h2>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <PeriodDropdown
            value={
              period
            }
            onChange={(
              nextPeriod
            ) => {
              if (!isMerchantRole) {
                return;
              }

              setPeriod(
                nextPeriod
              );
            }}
          />

          <motion.button
            type="button"
            whileTap={{
              scale:
                0.97,
            }}
            onClick={() =>
              void loadOverview(
                true
              )
            }
            disabled={
              refreshing
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-violet-700
              to-purple-600
              px-4
              text-xs
              font-black
              text-white
              shadow-[0_10px_28px_rgba(124,58,237,.22)]
              transition

              hover:-translate-y-0.5
              hover:shadow-[0_14px_35px_rgba(124,58,237,.34)]

              disabled:opacity-60
            "
          >
            <RefreshCcw
              className={`
                h-3.5
                w-3.5

                ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              `}
            />

            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* =================================================
          STATS
      ================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={
            0
          }
          label="Gross Payment Volume"
          value={formatCompactMoney(
            grossVolume,
            currency
          )}
          helper={`${totalPayments.toLocaleString()} total payments`}
          icon={
            CircleDollarSign
          }
          tone="primary"
          loading={
            loading
          }
          financial
        />

        <StatCard
          index={
            1
          }
          label="Net Revenue"
          value={formatCompactMoney(
            netRevenue,
            currency
          )}
          helper={`${formatMoney(
            totalFees,
            currency
          )} platform fees`}
          icon={
            WalletCards
          }
          tone="primary"
          loading={
            loading
          }
          financial
        />

        <StatCard
          index={
            2
          }
          label="Successful Payments"
          value={successfulPayments.toLocaleString()}
          helper={`${successRate.toFixed(
            1
          )}% payment success rate`}
          icon={
            CheckCircle2
          }
          tone="success"
          loading={
            loading
          }
        />

        <StatCard
          index={
            3
          }
          label="Failed Payments"
          value={failedPayments.toLocaleString()}
          helper={`${pendingPayments.toLocaleString()} currently pending`}
          icon={
            XCircle
          }
          tone="danger"
          loading={
            loading
          }
        />

        <StatCard
          index={
            4
          }
          label="Total Customers"
          value={uniqueCustomers.toLocaleString()}
          helper="Unique customers in selected period"
          icon={
            Users
          }
          tone="neutral"
          loading={
            loading
          }
        />

        <StatCard
          index={
            5
          }
          label="Average Payment"
          value={formatCompactMoney(
            averagePaymentValue,
            currency
          )}
          helper="Average completed payment value"
          icon={
            ShoppingBag
          }
          tone="primary"
          loading={
            loading
          }
          financial
        />

        <StatCard
          index={
            6
          }
          label="Pending Payments"
          value={pendingPayments.toLocaleString()}
          helper={`${processingPayments.toLocaleString()} authorized / captured`}
          icon={
            Clock3
          }
          tone="warning"
          loading={
            loading
          }
        />

        <StatCard
          index={
            7
          }
          label="Fee Impact"
          value={formatCompactMoney(
            totalFees,
            currency
          )}
          helper="Platform fee total for selected period"
          icon={
            RefreshCcw
          }
          tone="primary"
          loading={
            loading
          }
          financial
        />
      </section>

      {/* =================================================
          CHART + PAYMENT STATUS
      ================================================== */}

      <section
        className="
          grid
          items-stretch
          gap-5

          xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]
        "
      >
        <MotionSurface className="p-5 sm:p-6">
          <div
            className="
              mb-5
              flex
              flex-col
              gap-4

              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  rotate:
                    7,

                  scale:
                    1.1,
                }}
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                  text-violet-600

                  dark:text-violet-300
                "
              >
                <TrendingUp className="h-5 w-5" />
              </motion.div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-500">
                  Revenue intelligence
                </p>

                <h3 className="mt-1 text-sm font-black text-foreground">
                  Revenue Trend
                </h3>

                <p className="mt-1 text-[10px] font-semibold merchant-muted">
                  Completed payment volume and activity
                </p>
              </div>
            </div>

            <motion.div
              whileHover={{
                y:
                  -3,

                scale:
                  1.02,
              }}
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-violet-300/20
                bg-gradient-to-br
                from-violet-500/[0.10]
                to-fuchsia-500/[0.035]
                px-4
                py-3
              "
            >
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-violet-500">
                Net Revenue
              </p>

              <p className="mt-1 text-base font-black tracking-[-0.03em] text-violet-800 dark:text-violet-100">
                {loading
                  ? "—"
                  : formatMoney(
                      netRevenue,
                      currency
                    )}
              </p>
            </motion.div>
          </div>

          <RevenueTrendChart
            data={
              data
                ?.trend ??
              []
            }
            periodStart={
              data
                ?.periodStart
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />
        </MotionSurface>

        <PaymentStatusPanel
          items={
            data
              ?.statusBreakdown ??
            []
          }
          total={
            totalPayments
          }
          processingPayments={
            processingPayments
          }
          successRate={
            successRate
          }
          loading={
            loading
          }
        />
      </section>

      {/* =================================================
          RECENT PAYMENTS
      ================================================== */}

      <section
        className="
          grid
          items-stretch
          gap-5

          xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]
        "
      >
        <MotionSurface className="h-full p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-500">
                Payment activity
              </p>

              <h3 className="mt-1 text-sm font-black text-foreground">
                Recent Payments
              </h3>

              <p className="mt-1 text-[10px] font-semibold merchant-muted">
                Latest activity from your payment gateway
              </p>
            </div>

            <Link
              href="/dashboard/merchant/payments"
              className="
                group
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                px-2.5
                py-2
                text-[10px]
                font-black
                text-violet-600
                transition

                hover:bg-violet-500/[0.06]

                dark:text-violet-300
              "
            >
              View all

              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <RecentPayments
            payments={
              data
                ?.recentPayments ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />

          <Link
            href="/dashboard/merchant/payments"
            className="
              group
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-violet-300/20
              bg-violet-500/[0.045]
              px-4
              py-3
              text-[10px]
              font-black
              text-violet-700
              transition

              hover:bg-violet-500/[0.09]

              dark:text-violet-200
            "
          >
            View All Payments

            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </MotionSurface>

        <div className="grid h-full gap-5">
          <BreakdownCard
            title="Payment Methods"
            subtitle="Completed payment sources"
            icon={
              CreditCard
            }
            items={
              data
                ?.paymentMethods ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />

          <BreakdownCard
            title="Providers"
            subtitle="Payment provider distribution"
            icon={
              Activity
            }
            items={
              data
                ?.providers ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
            delay={
              0.08
            }
          />

          <GatewayStatusCard
            merchant={
              merchant
            }
            generatedAt={
              data
                ?.generatedAt
            }
            loading={
              loading
            }
          />
        </div>
      </section>

      {/* =================================================
          MERCHANT HEALTH + SMALLER QUICK ACTIONS

          Merchant Health gets considerably more width.
      ================================================== */}

      <section
        className="
          grid
          items-stretch
          gap-5

          lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.55fr)]
        "
      >
        <MerchantHealthPanel
          merchant={
            merchant
          }
          successRate={
            successRate
          }
          totalPayments={
            totalPayments
          }
          liveEnvironmentReady={
            liveEnvironmentReady
          }
          loading={
            loading
          }
        />

        <MotionSurface className="h-full p-5 sm:p-5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                rotate: [
                  0,
                  5,
                  0,
                  -5,
                  0,
                ],
              }}
              transition={{
                duration:
                  4,

                repeat:
                  Infinity,
              }}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-violet-500/10
                text-violet-600

                dark:text-violet-300
              "
            >
              <Zap className="h-4 w-4" />
            </motion.div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-500">
                Shortcuts
              </p>

              <h3 className="mt-1 text-sm font-black text-foreground">
                Quick Actions
              </h3>

              <p className="mt-1 text-[9px] font-semibold merchant-muted">
                Merchant tools
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <QuickAction
              index={
                0
              }
              href="/dashboard/merchant/payments"
              icon={
                CreditCard
              }
              label="Payments"
              description="Review payment activity"
            />

            <QuickAction
              index={
                1
              }
              href="/dashboard/merchant/analytics"
              icon={
                BarChart3
              }
              label="Analytics"
              description="Payment performance"
            />

            <QuickAction
              index={
                2
              }
              href="/dashboard/merchant/ai-assistant"
              icon={
                Bot
              }
              label="AI Assistant"
              description="Integration guidance"
            />

            <QuickAction
              index={
                3
              }
              href="/dashboard/merchant/api-keys"
              icon={
                KeyRound
              }
              label="API Keys"
              description="Manage credentials"
            />

            <QuickAction
              index={
                4
              }
              href="/dashboard/merchant/webhooks"
              icon={
                Webhook
              }
              label="Webhooks"
              description="Configure delivery"
            />

            <QuickAction
              index={
                5
              }
              href="/dashboard/merchant/reports"
              icon={
                FileBarChart2
              }
              label="Reports"
              description="Merchant reports"
            />
          </div>
        </MotionSurface>
      </section>

      {/* =================================================
          FOOTER
      ================================================== */}

      <motion.div
        initial={{
          opacity:
            0,
        }}
        animate={{
          opacity:
            1,
        }}
        className="
          flex
          flex-col
          gap-3
          border-t
          border-violet-300/20
          pt-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-bold merchant-muted">
          <span>
            {totalPayments.toLocaleString()}{" "}
            payments
          </span>

          <span>
            {uniqueCustomers.toLocaleString()}{" "}
            customers
          </span>

          <span className="font-black text-violet-600 dark:text-violet-300">
            {formatMoney(
              grossVolume,
              currency
            )}{" "}
            gross volume
          </span>
        </div>

        <Link
          href="/dashboard/merchant/reports"
          className="
            group
            inline-flex
            items-center
            gap-1.5
            text-[9px]
            font-black
            text-violet-600
            transition

            hover:text-fuchsia-600

            dark:text-violet-300
          "
        >
          Open reports

          <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </div>
  );
}