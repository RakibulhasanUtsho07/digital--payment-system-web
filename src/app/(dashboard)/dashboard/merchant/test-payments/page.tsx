"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FlaskConical,
  History,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TestTube2,
  WalletCards,
  Webhook,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  createSandboxOrder,
  getSandboxOrder,
  listSandboxOrders,
  type CreateSandboxOrderInput,
  type SandboxOrder,
  type SandboxOrderDetail,
  type SandboxOrderStatus,
  type SandboxPagination,
} from "@/lib/api/merchantSandboxApi";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "all"
  | SandboxOrderStatus;

/* =========================================================
   CONSTANTS
========================================================= */

const FINAL_STATUSES:
  readonly SandboxOrderStatus[] = [
    "paid",
    "partially_refunded",
    "refunded",
    "cancelled",
    "expired",
    "failed",
  ];

const STATUS_OPTIONS: Array<{
  value: StatusFilter;

  label: string;
}> = [
  {
    value: "all",
    label: "All statuses",
  },

  {
    value: "created",
    label: "Created",
  },

  {
    value: "pending",
    label: "Pending",
  },

  {
    value: "paid",
    label: "Paid",
  },

  {
    value: "partially_refunded",
    label: "Partially refunded",
  },

  {
    value: "refunded",
    label: "Refunded",
  },

  {
    value: "failed",
    label: "Failed",
  },

  {
    value: "expired",
    label: "Expired",
  },

  {
    value: "cancelled",
    label: "Cancelled",
  },
];

/* =========================================================
   SHARED UI CLASSES
========================================================= */

const inputClass =
  [
    "mt-2",
    "h-11",
    "w-full",
    "rounded-xl",
    "border",
    "border-violet-200/70",
    "bg-transparent",
    "px-3",
    "text-sm",
    "merchant-text",
    "outline-none",
    "transition",
    "placeholder:text-slate-400",
    "focus:border-violet-500",
    "focus:ring-2",
    "focus:ring-violet-500/10",
    "dark:border-white/10",
  ].join(" ");

/* =========================================================
   HELPERS
========================================================= */

function createIdempotencyKey():
  string {
  const randomPart =
    typeof globalThis.crypto
      ?.randomUUID ===
    "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `dashboard-sandbox-${randomPart}`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatMoney(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      },
    ).format(amount);
  } catch {
    return `${currency} ${Number(
      amount || 0,
    ).toLocaleString("en-BD", {
      maximumFractionDigits:
        2,
    })}`;
  }
}

function statusLabel(
  status: string,
): string {
  return status
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function statusClasses(
  status: SandboxOrderStatus,
): string {
  if (
    status === "paid" ||
    status === "refunded" ||
    status ===
      "partially_refunded"
  ) {
    return [
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
      "dark:border-emerald-900/50",
      "dark:bg-emerald-950/30",
      "dark:text-emerald-300",
    ].join(" ");
  }

  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "expired"
  ) {
    return [
      "border-rose-200",
      "bg-rose-50",
      "text-rose-700",
      "dark:border-rose-900/50",
      "dark:bg-rose-950/30",
      "dark:text-rose-300",
    ].join(" ");
  }

  return [
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
    "dark:border-amber-900/50",
    "dark:bg-amber-950/30",
    "dark:text-amber-300",
  ].join(" ");
}

function StatusIcon({
  status,
}: {
  status:
    SandboxOrderStatus;
}) {
  if (
    status === "paid" ||
    status === "refunded" ||
    status ===
      "partially_refunded"
  ) {
    return (
      <CheckCircle2 className="h-4 w-4" />
    );
  }

  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "expired"
  ) {
    return (
      <XCircle className="h-4 w-4" />
    );
  }

  return (
    <Clock3 className="h-4 w-4" />
  );
}

/* =========================================================
   HERO BACKGROUND
========================================================= */

function AuroraBackground() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            20,
            0,
          ],

          y: [
            0,
            -12,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-28
          left-1/3
          h-64
          w-64
          rounded-full
          bg-cyan-300/15
          blur-3xl
        "
        animate={{
          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   HERO MINI STAT
========================================================= */

function HeroStat({
  label,
  value,
  icon:
    Icon,
}: {
  label: string;

  value: string;

  icon:
    React.ElementType;
}) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-3
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-3
        backdrop-blur
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/10
        "
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-wider
            text-violet-100/65
          "
        >
          {label}
        </p>

        <p
          title={value}
          className="
            mt-0.5
            truncate
            text-xs
            font-black
            text-white
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function OrderStatusBadge({
  status,
}: {
  status:
    SandboxOrderStatus;
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-black

        ${statusClasses(
          status,
        )}
      `}
    >
      <StatusIcon
        status={
          status
        }
      />

      {statusLabel(
        status,
      )}
    </span>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MerchantTestPaymentsPage() {
  /* =======================================================
     FORM
  ======================================================== */

  const [
    amount,
    setAmount,
  ] =
    useState("100");

  const [
    currency,
    setCurrency,
  ] =
    useState("BDT");

  const [
    merchantReference,
    setMerchantReference,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState(
      "Coffer sandbox payment",
    );

  const [
    customerName,
    setCustomerName,
  ] =
    useState("");

  const [
    customerEmail,
    setCustomerEmail,
  ] =
    useState("");

  const [
    returnUrl,
    setReturnUrl,
  ] =
    useState("");

  const [
    cancelUrl,
    setCancelUrl,
  ] =
    useState("");

  const [
    expiresInMinutes,
    setExpiresInMinutes,
  ] =
    useState("30");

  /* =======================================================
     REQUEST STATE
  ======================================================== */

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    refreshingOrder,
    setRefreshingOrder,
  ] =
    useState(false);

  const [
    loadingOrders,
    setLoadingOrders,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    notice,
    setNotice,
  ] =
    useState("");

  /* =======================================================
     DATA
  ======================================================== */

  const [
    current,
    setCurrent,
  ] =
    useState<SandboxOrderDetail | null>(
      null,
    );

  const [
    orders,
    setOrders,
  ] =
    useState<SandboxOrder[]>(
      [],
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<SandboxPagination>({
      page: 1,

      limit: 10,

      total: 0,

      totalPages: 1,

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    });

  /* =======================================================
     FILTER
  ======================================================== */

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] =
    useState("");

  /* =======================================================
     IDEMPOTENCY
  ======================================================== */

  const [
    lastRequest,
    setLastRequest,
  ] =
    useState<CreateSandboxOrderInput | null>(
      null,
    );

  const [
    lastIdempotencyKey,
    setLastIdempotencyKey,
  ] =
    useState("");

  /* =======================================================
     DEFAULT REDIRECTS
  ======================================================== */

  useEffect(
    () => {
      const origin =
        window.location.origin;

      setReturnUrl(
        `${origin}/dashboard/merchant/test-payments?result=success`,
      );

      setCancelUrl(
        `${origin}/dashboard/merchant/test-payments?result=cancelled`,
      );
    },
    [],
  );

  /* =======================================================
     LIST ORDERS
  ======================================================== */

  const loadOrders =
    useCallback(
      async () => {
        try {
          setLoadingOrders(
            true,
          );

          setError("");

          const result =
            await listSandboxOrders({
              page:
                pagination.page,

              limit:
                pagination.limit,

              status,

              search:
                appliedSearch,
            });

          setOrders(
            result.orders,
          );

          setPagination(
            result.pagination,
          );

          setCurrency(
            (currentCurrency) =>
              currentCurrency.trim()
                ? currentCurrency
                : result.merchant
                    .defaultCurrency ||
                  "BDT",
          );
        } catch (
          loadError:
            unknown
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load sandbox orders.",
          );
        } finally {
          setLoadingOrders(
            false,
          );
        }
      },
      [
        appliedSearch,
        pagination.limit,
        pagination.page,
        status,
      ],
    );

  useEffect(
    () => {
      void loadOrders();
    },
    [
      loadOrders,
    ],
  );

  /* =======================================================
     FORM VALIDATION
  ======================================================== */

  const canSubmit =
    useMemo(
      () => {
        const numericAmount =
          Number(
            amount,
          );

        const numericExpiry =
          Number(
            expiresInMinutes,
          );

        return (
          Number.isFinite(
            numericAmount,
          ) &&
          numericAmount >
            0 &&
          /^[A-Za-z]{3}$/.test(
            currency.trim(),
          ) &&
          Number.isInteger(
            numericExpiry,
          ) &&
          numericExpiry >=
            5 &&
          numericExpiry <=
            1440
        );
      },
      [
        amount,
        currency,
        expiresInMinutes,
      ],
    );

  /* =======================================================
     BUILD REQUEST
  ======================================================== */

  const buildRequest =
    (): CreateSandboxOrderInput => {
      const normalizedName =
        customerName.trim();

      const normalizedEmail =
        customerEmail.trim();

      return {
        amount:
          Number(
            amount,
          ),

        currency:
          currency
            .trim()
            .toUpperCase(),

        merchantReference:
          merchantReference.trim() ||
          undefined,

        description:
          description.trim() ||
          undefined,

        customer:
          normalizedName ||
          normalizedEmail
            ? {
                name:
                  normalizedName ||
                  undefined,

                email:
                  normalizedEmail ||
                  undefined,
              }
            : undefined,

        returnUrl:
          returnUrl.trim() ||
          undefined,

        cancelUrl:
          cancelUrl.trim() ||
          undefined,

        expiresInMinutes:
          Number(
            expiresInMinutes,
          ),

        metadata: {
          simulator:
            true,

          source:
            "merchant_test_payments_page",
        },
      };
    };

  /* =======================================================
     SUBMIT REQUEST
  ======================================================== */

  const submitRequest =
    async (
      request:
        CreateSandboxOrderInput,

      idempotencyKey:
        string,
    ) => {
      try {
        setCreating(
          true,
        );

        setError("");

        setNotice("");

        const result =
          await createSandboxOrder(
            request,
            idempotencyKey,
          );

        setCurrent({
          order:
            result.order,

          payment:
            null,
        });

        setNotice(
          result.message,
        );

        setLastRequest(
          request,
        );

        setLastIdempotencyKey(
          idempotencyKey,
        );

        await loadOrders();
      } catch (
        createError:
          unknown
      ) {
        setError(
          createError instanceof
            Error
            ? createError.message
            : "Unable to create sandbox order.",
        );
      } finally {
        setCreating(
          false,
        );
      }
    };

  /* =======================================================
     CREATE
  ======================================================== */

  const handleCreate =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !canSubmit
      ) {
        setError(
          "Enter a valid amount, three-letter currency and an expiry between 5 and 1440 minutes.",
        );

        return;
      }

      await submitRequest(
        buildRequest(),
        createIdempotencyKey(),
      );
    };

  /* =======================================================
     IDEMPOTENCY REPLAY
  ======================================================== */

  const repeatLastRequest =
    async () => {
      if (
        !lastRequest ||
        !lastIdempotencyKey
      ) {
        return;
      }

      await submitRequest(
        lastRequest,
        lastIdempotencyKey,
      );
    };

  /* =======================================================
     REFRESH / INSPECT
  ======================================================== */

  const refreshOrder =
    useCallback(
      async (
        explicitOrderId?:
          string,
      ) => {
        const orderId =
          explicitOrderId?.trim() ||
          current?.order
            .orderId ||
          "";

        if (!orderId) {
          return;
        }

        try {
          setRefreshingOrder(
            true,
          );

          setError("");

          const detail =
            await getSandboxOrder(
              orderId,
            );

          setCurrent(
            detail,
          );

          await loadOrders();
        } catch (
          refreshError:
            unknown
        ) {
          setError(
            refreshError instanceof
              Error
              ? refreshError.message
              : "Unable to refresh sandbox order.",
          );
        } finally {
          setRefreshingOrder(
            false,
          );
        }
      },
      [
        current?.order
          .orderId,
        loadOrders,
      ],
    );

  /* =======================================================
     AUTO REFRESH AFTER CHECKOUT TAB

     When merchant returns/focuses this dashboard after
     completing hosted checkout, refresh the current run.
  ======================================================== */

  useEffect(
    () => {
      const handleFocus =
        () => {
          if (
            !current
          ) {
            return;
          }

          if (
            FINAL_STATUSES.includes(
              current.order
                .status,
            )
          ) {
            return;
          }

          void refreshOrder(
            current.order
              .orderId,
          );
        };

      window.addEventListener(
        "focus",
        handleFocus,
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus,
        );
      };
    },
    [
      current,
      refreshOrder,
    ],
  );

  /* =======================================================
     COPY ID
  ======================================================== */

  const copyOrderId =
    async () => {
      if (
        !current?.order
          .orderId
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          current.order
            .orderId,
        );

        setNotice(
          "Order ID copied.",
        );
      } catch {
        setError(
          "Unable to copy the Order ID.",
        );
      }
    };

  /* =======================================================
     DERIVED
  ======================================================== */

  const currentIsFinal =
    current
      ? FINAL_STATUSES.includes(
          current.order
            .status,
        )
      : false;

  const paymentStatus =
    current?.payment
      ?.status ||
    "No payment attempt yet";

  const currentMode =
    current?.order.mode ||
    "test";

  /* =======================================================
     UI
  ======================================================== */

  return (
    <main
      className="
        merchant-theme
        min-h-full
        px-4
        py-5

        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          max-w-[1550px]
          space-y-6
        "
      >
        {/* =================================================
            HERO
        ================================================= */}

        <motion.header
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            relative
            overflow-hidden
            rounded-[30px]
            p-5
            text-white

            sm:p-7
          "
        >
          <AuroraBackground />

          <div className="relative z-10">
            <div
              className="
                flex
                flex-col
                gap-6

                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >
              <div className="max-w-3xl">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-3
                    py-1.5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                  "
                >
                  <FlaskConical className="h-3.5 w-3.5" />

                  Safe test environment
                </div>

                <h1
                  className="
                    mt-4
                    text-2xl
                    font-black
                    tracking-tight

                    sm:text-3xl
                  "
                >
                  Sandbox Test Payments
                </h1>

                <p
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    leading-7
                    text-violet-100/80
                  "
                >
                  Create test-mode Coffer orders, launch hosted
                  checkout, inspect payment status and verify your
                  merchant integration without moving live money.
                </p>
              </div>

              <div
                className="
                  flex
                  flex-col
                  gap-2

                  sm:flex-row
                "
              >
                <Link
                  href="/dashboard/merchant/developers"
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-black
                    text-white
                    backdrop-blur
                    transition

                    hover:bg-white/15
                  "
                >
                  Integration guide

                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard/merchant/webhooks"
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-white
                    px-4
                    text-sm
                    font-black
                    text-violet-700
                    transition

                    hover:bg-violet-50
                  "
                >
                  <Webhook className="h-4 w-4" />

                  Webhooks
                </Link>
              </div>
            </div>

            <div
              className="
                mt-6
                grid
                gap-3

                sm:grid-cols-3
              "
            >
              <HeroStat
                label="Environment"
                value="TEST only"
                icon={
                  TestTube2
                }
              />

              <HeroStat
                label="Sandbox orders"
                value={
                  loadingOrders
                    ? "Loading..."
                    : pagination.total.toLocaleString(
                        "en-BD",
                      )
                }
                icon={
                  History
                }
              />

              <HeroStat
                label="Current mode"
                value={
                  currentMode.toUpperCase()
                }
                icon={
                  ShieldCheck
                }
              />
            </div>
          </div>
        </motion.header>

        {/* =================================================
            SAFETY
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            bg-cyan-500/10
            p-4
            text-xs
            leading-6
            text-cyan-800

            dark:text-cyan-200
          "
        >
          <div
            className="
              mt-0.5
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-cyan-500/10
            "
          >
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div>
            <p className="font-black">
              Isolated sandbox environment
            </p>

            <p className="mt-0.5 opacity-80">
              Every order created here is forced to test mode by the
              backend. It cannot enable live mode, debit a real wallet
              or move a live merchant balance.
            </p>
          </div>
        </motion.div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            role="alert"
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              bg-rose-500/10
              p-4
              text-sm
              font-semibold
              text-rose-700

              dark:text-rose-300
            "
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() =>
                setError("")
              }
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}

        {notice ? (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            role="status"
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              bg-emerald-500/10
              p-4
              text-sm
              font-semibold
              text-emerald-700

              dark:text-emerald-300
            "
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="flex-1">
              {notice}
            </span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() =>
                setNotice("")
              }
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}

        {/* =================================================
            FORM + CURRENT RUN
        ================================================= */}

        <section
          className="
            grid
            gap-6

            xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]
          "
        >
          {/* ===============================================
              FORM
          ================================================ */}

          <motion.form
            initial={{
              opacity: 0,
              x: -8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            onSubmit={(
              event
            ) => {
              void handleCreate(
                event,
              );
            }}
            className="
              rounded-[28px]
              merchant-surface
              p-5

              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-violet-600
                  "
                >
                  New sandbox order
                </p>

                <h2
                  className="
                    mt-1
                    text-lg
                    font-black
                    merchant-text
                  "
                >
                  Payment details
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    merchant-muted
                  "
                >
                  Create a real database-backed Coffer test order.
                </p>
              </div>

              <span
                className="
                  rounded-full
                  bg-violet-500/10
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-violet-600
                "
              >
                Test only
              </span>
            </div>

            {/* AMOUNT */}

            <div
              className="
                mt-6
                grid
                gap-4

                sm:grid-cols-[1fr_140px]
              "
            >
              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Amount
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={
                    amount
                  }
                  onChange={(
                    event
                  ) =>
                    setAmount(
                      event.target
                        .value,
                    )
                  }
                  placeholder="100.00"
                  className={
                    inputClass
                  }
                />
              </label>

              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Currency
                </span>

                <input
                  type="text"
                  maxLength={
                    3
                  }
                  required
                  value={
                    currency
                  }
                  onChange={(
                    event
                  ) =>
                    setCurrency(
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z]/g,
                          "",
                        ),
                    )
                  }
                  className={`${inputClass} uppercase`}
                />
              </label>
            </div>

            {/* REFERENCE */}

            <div
              className="
                mt-4
                grid
                gap-4

                sm:grid-cols-2
              "
            >
              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Merchant reference
                </span>

                <input
                  type="text"
                  maxLength={
                    150
                  }
                  value={
                    merchantReference
                  }
                  onChange={(
                    event
                  ) =>
                    setMerchantReference(
                      event.target
                        .value,
                    )
                  }
                  placeholder="SHOP-1001"
                  className={
                    inputClass
                  }
                />
              </label>

              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Expires in minutes
                </span>

                <input
                  type="number"
                  min="5"
                  max="1440"
                  required
                  value={
                    expiresInMinutes
                  }
                  onChange={(
                    event
                  ) =>
                    setExpiresInMinutes(
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </label>
            </div>

            {/* DESCRIPTION */}

            <label className="mt-4 block">
              <span
                className="
                  text-xs
                  font-bold
                  merchant-text
                "
              >
                Description
              </span>

              <input
                type="text"
                maxLength={
                  500
                }
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                className={
                  inputClass
                }
              />
            </label>

            {/* CUSTOMER */}

            <div
              className="
                mt-4
                grid
                gap-4

                sm:grid-cols-2
              "
            >
              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Test customer name
                </span>

                <input
                  type="text"
                  maxLength={
                    150
                  }
                  value={
                    customerName
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional"
                  className={
                    inputClass
                  }
                />
              </label>

              <label className="block">
                <span
                  className="
                    text-xs
                    font-bold
                    merchant-text
                  "
                >
                  Test customer email
                </span>

                <input
                  type="email"
                  maxLength={
                    254
                  }
                  value={
                    customerEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerEmail(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional"
                  className={
                    inputClass
                  }
                />
              </label>
            </div>

            {/* URL SETTINGS */}

            <details
              className="
                mt-5
                overflow-hidden
                rounded-2xl
                bg-violet-500/5
              "
            >
              <summary
                className="
                  cursor-pointer
                  px-4
                  py-3
                  text-xs
                  font-black
                  merchant-text
                "
              >
                Redirect URL settings
              </summary>

              <div
                className="
                  space-y-4
                  border-t
                  border-violet-500/10
                  p-4
                "
              >
                <label className="block">
                  <span
                    className="
                      text-xs
                      font-bold
                      merchant-muted
                    "
                  >
                    Return URL
                  </span>

                  <input
                    type="url"
                    maxLength={
                      1000
                    }
                    value={
                      returnUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setReturnUrl(
                        event.target
                          .value,
                      )
                    }
                    className={`${inputClass} text-xs`}
                  />
                </label>

                <label className="block">
                  <span
                    className="
                      text-xs
                      font-bold
                      merchant-muted
                    "
                  >
                    Cancel URL
                  </span>

                  <input
                    type="url"
                    maxLength={
                      1000
                    }
                    value={
                      cancelUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setCancelUrl(
                        event.target
                          .value,
                      )
                    }
                    className={`${inputClass} text-xs`}
                  />
                </label>
              </div>
            </details>

            {/* ACTIONS */}

            <div
              className="
                mt-6
                grid
                gap-3

                sm:grid-cols-2
              "
            >
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                type="submit"
                disabled={
                  creating ||
                  !canSubmit
                }
                className="
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-5
                  text-sm
                  font-black
                  text-white
                  transition

                  hover:bg-violet-700

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}

                {creating
                  ? "Creating..."
                  : "Create test order"}
              </motion.button>

              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                type="button"
                disabled={
                  creating ||
                  !lastRequest ||
                  !lastIdempotencyKey
                }
                onClick={() => {
                  void repeatLastRequest();
                }}
                className="
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-500/10
                  px-5
                  text-sm
                  font-black
                  text-violet-700
                  transition

                  hover:bg-violet-500/15

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  dark:text-violet-300
                "
              >
                <RotateCcw className="h-4 w-4" />

                Test idempotency
              </motion.button>
            </div>

            <p
              className="
                mt-3
                text-center
                text-[10px]
                leading-5
                merchant-muted
              "
            >
              Idempotency replay sends the previous request with the
              exact same key. The backend should return the existing
              sandbox order instead of creating another one.
            </p>
          </motion.form>

          {/* ===============================================
              CURRENT RUN
          ================================================ */}

          <motion.section
            initial={{
              opacity: 0,
              x: 8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="
              h-fit
              overflow-hidden
              rounded-[28px]
              merchant-surface
            "
          >
            <div
              className="
                relative
                overflow-hidden
                p-5
                text-white

                sm:p-6
              "
              style={{
                background:
                  "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
              }}
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-12
                  -top-16
                  h-40
                  w-40
                  rounded-full
                  bg-white/10
                  blur-3xl
                "
              />

              <div
                className="
                  relative
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-violet-100/70
                    "
                  >
                    Current sandbox run
                  </p>

                  <h2
                    className="
                      mt-1
                      text-lg
                      font-black
                    "
                  >
                    Checkout status
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-violet-100/70
                    "
                  >
                    Inspect the latest selected test order.
                  </p>
                </div>

                {current ? (
                  <button
                    type="button"
                    disabled={
                      refreshingOrder
                    }
                    onClick={() => {
                      void refreshOrder();
                    }}
                    className="
                      inline-flex
                      h-10
                      items-center
                      gap-2
                      rounded-xl
                      bg-white/10
                      px-3
                      text-xs
                      font-black
                      text-white
                      transition

                      hover:bg-white/15

                      disabled:opacity-50
                    "
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        refreshingOrder
                          ? "animate-spin"
                          : ""
                      }`}
                    />

                    Refresh
                  </button>
                ) : null}
              </div>
            </div>

            {!current ? (
              <div
                className="
                  flex
                  min-h-[430px]
                  flex-col
                  items-center
                  justify-center
                  p-6
                  text-center
                "
              >
                <motion.div
                  animate={{
                    y: [
                      0,
                      -5,
                      0,
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-3xl
                    bg-violet-500/10
                    text-violet-600
                  "
                >
                  <FlaskConical className="h-7 w-7" />
                </motion.div>

                <h3
                  className="
                    mt-4
                    font-black
                    merchant-text
                  "
                >
                  No active sandbox run
                </h3>

                <p
                  className="
                    mt-2
                    max-w-xs
                    text-xs
                    leading-6
                    merchant-muted
                  "
                >
                  Create a test order or inspect one from the recent
                  sandbox order list.
                </p>
              </div>
            ) : (
              <div
                className="
                  space-y-4
                  p-5

                  sm:p-6
                "
              >
                {/* AMOUNT */}

                <div
                  className="
                    flex
                    flex-wrap
                    items-start
                    justify-between
                    gap-4
                    rounded-2xl
                    bg-violet-500/5
                    p-4
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        merchant-muted
                      "
                    >
                      Payment amount
                    </p>

                    <p
                      title={formatMoney(
                        current.order
                          .amount,
                        current.order
                          .currency,
                      )}
                      className="
                        mt-1
                        truncate
                        text-xl
                        font-black
                        tracking-tight
                        merchant-text
                      "
                    >
                      {formatMoney(
                        current.order
                          .amount,
                        current.order
                          .currency,
                      )}
                    </p>
                  </div>

                  <OrderStatusBadge
                    status={
                      current.order
                        .status
                    }
                  />
                </div>

                {/* ORDER ID */}

                <div
                  className="
                    rounded-2xl
                    bg-[#18092D]
                    p-4
                    text-white
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-violet-200/60
                    "
                  >
                    Coffer Order ID
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <code
                      className="
                        min-w-0
                        flex-1
                        break-all
                        text-xs
                        font-bold
                        text-violet-200
                      "
                    >
                      {
                        current
                          .order
                          .orderId
                      }
                    </code>

                    <button
                      type="button"
                      aria-label="Copy Order ID"
                      onClick={() => {
                        void copyOrderId();
                      }}
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-white/10
                        transition

                        hover:bg-white/15
                      "
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* DETAIL GRID */}

                <dl
                  className="
                    grid
                    gap-3
                    text-xs

                    sm:grid-cols-2
                  "
                >
                  <DetailBox
                    label="Environment"
                    value={
                      current.order.mode.toUpperCase()
                    }
                  />

                  <DetailBox
                    label="Payment status"
                    value={statusLabel(
                      paymentStatus,
                    )}
                  />

                  <DetailBox
                    label="Reference"
                    value={
                      current.order
                        .merchantReference ||
                      "—"
                    }
                  />

                  <DetailBox
                    label="Expires"
                    value={formatDate(
                      current.order
                        .expiresAt,
                    )}
                  />

                  {current.payment
                    ?.provider ? (
                    <DetailBox
                      label="Provider"
                      value={statusLabel(
                        current.payment
                          .provider,
                      )}
                    />
                  ) : null}

                  {current.payment
                    ?.paymentId ? (
                    <DetailBox
                      label="Payment ID"
                      value={
                        current.payment
                          .paymentId
                      }
                    />
                  ) : null}
                </dl>

                {/* CHECKOUT */}

                {!currentIsFinal ? (
                  <>
                    <a
                      href={
                        current.order
                          .checkoutUrl
                      }
                      target="_blank"
                      rel="noreferrer noopener"
                      className="
                        inline-flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-violet-600
                        px-5
                        text-sm
                        font-black
                        text-white
                        transition

                        hover:bg-violet-700
                      "
                    >
                      Open hosted checkout

                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <p
                      className="
                        text-center
                        text-[10px]
                        leading-5
                        merchant-muted
                      "
                    >
                      Complete the checkout in the new tab. When you
                      return to this page, the selected test order is
                      automatically refreshed.
                    </p>
                  </>
                ) : null}

                {/* SUCCESS */}

                {current.order
                  .status ===
                "paid" ? (
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      rounded-2xl
                      bg-emerald-500/10
                      p-4
                      text-xs
                      leading-5
                      text-emerald-700

                      dark:text-emerald-300
                    "
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                      <p className="font-black">
                        Test payment completed
                      </p>

                      <p className="mt-1 opacity-80">
                        Open the Webhooks section to inspect the
                        payment.completed delivery.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* FAILED */}

                {current.order
                  .status ===
                "failed" ? (
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      rounded-2xl
                      bg-rose-500/10
                      p-4
                      text-xs
                      leading-5
                      text-rose-700

                      dark:text-rose-300
                    "
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                      <p className="font-black">
                        Test payment failed
                      </p>

                      <p className="mt-1 opacity-80">
                        Inspect the payment status and try another
                        sandbox order if needed.
                      </p>
                    </div>
                  </div>
                ) : null}

                {currentIsFinal ? (
                  <Link
                    href="/dashboard/merchant/webhooks"
                    className="
                      inline-flex
                      h-11
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-violet-500/10
                      text-sm
                      font-black
                      text-violet-700
                      transition

                      hover:bg-violet-500/15

                      dark:text-violet-300
                    "
                  >
                    <Webhook className="h-4 w-4" />

                    Inspect webhooks
                  </Link>
                ) : null}
              </div>
            )}
          </motion.section>
        </section>

        {/* =================================================
            FLOW
        ================================================= */}

        <section
          className="
            grid
            gap-3

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <FlowStep
            step="01"
            title="Create"
            description="Create a database-backed test order."
            icon={
              FlaskConical
            }
          />

          <FlowStep
            step="02"
            title="Checkout"
            description="Open the Coffer hosted checkout."
            icon={
              ExternalLink
            }
          />

          <FlowStep
            step="03"
            title="Complete"
            description="Run the sandbox payment lifecycle."
            icon={
              Zap
            }
          />

          <FlowStep
            step="04"
            title="Verify"
            description="Inspect order status and webhook delivery."
            icon={
              Webhook
            }
          />
        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            overflow-hidden
            rounded-[28px]
            merchant-surface
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-violet-500/10
              p-5

              lg:flex-row
              lg:items-center
              lg:justify-between

              sm:p-6
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-500/10
                  text-violet-600
                "
              >
                <History className="h-5 w-5" />
              </div>

              <div>
                <h2
                  className="
                    font-black
                    merchant-text
                  "
                >
                  Recent sandbox orders
                </h2>

                <p
                  className="
                    mt-0.5
                    text-xs
                    merchant-muted
                  "
                >
                  Real test-mode records returned by the backend.
                </p>
              </div>
            </div>

            {/* FILTER */}

            <div
              className="
                flex
                flex-col
                gap-2

                sm:flex-row
              "
            >
              <form
                onSubmit={(
                  event
                ) => {
                  event.preventDefault();

                  setPagination(
                    (
                      currentPagination,
                    ) => ({
                      ...currentPagination,

                      page: 1,
                    }),
                  );

                  setAppliedSearch(
                    search.trim(),
                  );
                }}
                className="relative"
              >
                <Search
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="search"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search order, reference or customer"
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-violet-200/70
                    bg-transparent
                    pl-9
                    pr-3
                    text-xs
                    merchant-text
                    outline-none
                    transition

                    focus:border-violet-500

                    dark:border-white/10

                    sm:w-72
                  "
                />
              </form>

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) => {
                  setStatus(
                    event.target
                      .value as
                      StatusFilter,
                  );

                  setPagination(
                    (
                      currentPagination,
                    ) => ({
                      ...currentPagination,

                      page: 1,
                    }),
                  );
                }}
                className="
                  h-10
                  rounded-xl
                  border
                  border-violet-200/70
                  bg-transparent
                  px-3
                  text-xs
                  font-bold
                  merchant-text
                  outline-none
                  transition

                  focus:border-violet-500

                  dark:border-white/10
                "
              >
                {STATUS_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                onClick={() => {
                  void loadOrders();
                }}
                disabled={
                  loadingOrders
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-500/10
                  px-3
                  text-xs
                  font-black
                  text-violet-700
                  transition

                  hover:bg-violet-500/15

                  disabled:opacity-50

                  dark:text-violet-300
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loadingOrders
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>

          {/* BODY */}

          {loadingOrders ? (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >
              <div className="text-center">
                <Loader2
                  className="
                    mx-auto
                    h-8
                    w-8
                    animate-spin
                    text-violet-600
                  "
                />

                <p
                  className="
                    mt-3
                    text-xs
                    merchant-muted
                  "
                >
                  Loading sandbox orders...
                </p>
              </div>
            </div>
          ) : orders.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[300px]
                flex-col
                items-center
                justify-center
                p-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-500/10
                  text-violet-600
                "
              >
                <FlaskConical className="h-6 w-6" />
              </div>

              <h3
                className="
                  mt-4
                  font-black
                  merchant-text
                "
              >
                No sandbox orders found
              </h3>

              <p
                className="
                  mt-1
                  max-w-sm
                  text-xs
                  leading-6
                  merchant-muted
                "
              >
                Create your first test payment above or change the
                current search and status filters.
              </p>
            </div>
          ) : (
            <div>
              {orders.map(
                (
                  order,
                  index,
                ) => (
                  <motion.article
                    key={
                      order.orderId
                    }
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        Math.min(
                          index *
                            0.025,
                          0.15,
                        ),
                    }}
                    className="
                      flex
                      flex-col
                      gap-4
                      border-b
                      border-violet-500/10
                      p-4
                      transition

                      hover:bg-violet-500/5

                      last:border-b-0

                      sm:p-5

                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                    "
                  >
                    <div className="min-w-0">
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
                        <h3
                          className="
                            max-w-full
                            truncate
                            font-mono
                            text-xs
                            font-black
                            merchant-text
                          "
                        >
                          {
                            order.orderId
                          }
                        </h3>

                        <OrderStatusBadge
                          status={
                            order.status
                          }
                        />
                      </div>

                      <div
                        className="
                          mt-2
                          flex
                          flex-wrap
                          items-center
                          gap-x-4
                          gap-y-1
                          text-xs
                          merchant-muted
                        "
                      >
                        <span
                          className="
                            whitespace-nowrap
                            font-black
                            text-violet-600
                          "
                        >
                          {formatMoney(
                            order.amount,
                            order.currency,
                          )}
                        </span>

                        <span>
                          {order.merchantReference ||
                            "No reference"}
                        </span>

                        <span>
                          {formatDate(
                            order.createdAt,
                          )}
                        </span>

                        {order.customer
                          ?.email ? (
                          <span className="truncate">
                            {
                              order
                                .customer
                                .email
                            }
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        gap-2

                        lg:shrink-0
                      "
                    >
                      <button
                        type="button"
                        disabled={
                          refreshingOrder
                        }
                        onClick={() => {
                          void refreshOrder(
                            order.orderId,
                          );
                        }}
                        className="
                          inline-flex
                          h-10
                          flex-1
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-violet-500/10
                          px-4
                          text-xs
                          font-black
                          text-violet-700
                          transition

                          hover:bg-violet-500/15

                          disabled:opacity-50

                          dark:text-violet-300

                          lg:flex-none
                        "
                      >
                        <RefreshCw className="h-4 w-4" />

                        Inspect
                      </button>

                      {!FINAL_STATUSES.includes(
                        order.status,
                      ) ? (
                        <a
                          href={
                            order.checkoutUrl
                          }
                          target="_blank"
                          rel="noreferrer noopener"
                          className="
                            inline-flex
                            h-10
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-violet-600
                            px-4
                            text-xs
                            font-black
                            text-white
                            transition

                            hover:bg-violet-700

                            lg:flex-none
                          "
                        >
                          Checkout

                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </motion.article>
                ),
              )}
            </div>
          )}

          {/* PAGINATION */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-violet-500/10
              p-4
              text-xs
              font-semibold
              merchant-muted

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span>
              {pagination.total.toLocaleString(
                "en-BD",
              )}{" "}
              test orders
            </span>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage ||
                  loadingOrders
                }
                onClick={() => {
                  setPagination(
                    (
                      currentPagination,
                    ) => ({
                      ...currentPagination,

                      page:
                        Math.max(
                          1,
                          currentPagination.page -
                            1,
                        ),
                    }),
                  );
                }}
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-violet-500/10
                  px-3
                  font-black
                  text-violet-700

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  dark:text-violet-300
                "
              >
                <ChevronLeft className="h-4 w-4" />

                Previous
              </button>

              <span
                className="
                  min-w-[90px]
                  text-center
                  font-black
                  merchant-text
                "
              >
                Page{" "}
                {
                  pagination.page
                }{" "}
                of{" "}
                {Math.max(
                  pagination.totalPages,
                  1,
                )}
              </span>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage ||
                  loadingOrders
                }
                onClick={() => {
                  setPagination(
                    (
                      currentPagination,
                    ) => ({
                      ...currentPagination,

                      page:
                        currentPagination.page +
                        1,
                    }),
                  );
                }}
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-violet-500/10
                  px-3
                  font-black
                  text-violet-700

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  dark:text-violet-300
                "
              >
                Next

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <section
          className="
            flex
            flex-col
            gap-4
            rounded-[24px]
            bg-violet-500/5
            p-5

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-violet-500/10
                text-violet-600
              "
            >
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-black
                  merchant-text
                "
              >
                Coffer Sandbox
              </p>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-xs
                  leading-5
                  merchant-muted
                "
              >
                This dashboard uses real backend sandbox records.
                Test payments remain isolated from production wallet
                balances and live merchant money movement.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              bg-emerald-500/10
              px-3
              py-1.5
              text-[10px]
              font-black
              uppercase
              tracking-wider
              text-emerald-700

              dark:text-emerald-300
            "
          >
            <ShieldCheck className="h-3.5 w-3.5" />

            Test environment
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   DETAIL BOX
========================================================= */

function DetailBox({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        bg-violet-500/5
        p-3
      "
    >
      <dt
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-wider
          merchant-muted
        "
      >
        {label}
      </dt>

      <dd
        title={value}
        className="
          mt-1
          truncate
          text-xs
          font-black
          merchant-text
        "
      >
        {value}
      </dd>
    </div>
  );
}

/* =========================================================
   FLOW STEP
========================================================= */

function FlowStep({
  step,
  title,
  description,
  icon:
    Icon,
}: {
  step: string;

  title: string;

  description: string;

  icon:
    React.ElementType;
}) {
  return (
    <motion.article
      whileHover={{
        y: -2,
      }}
      className="
        rounded-[22px]
        merchant-surface
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/10
            text-violet-600
          "
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-widest
                text-violet-600
              "
            >
              {step}
            </span>

            <h3
              className="
                text-sm
                font-black
                merchant-text
              "
            >
              {title}
            </h3>
          </div>

          <p
            className="
              mt-1
              text-xs
              leading-5
              merchant-muted
            "
          >
            {description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}