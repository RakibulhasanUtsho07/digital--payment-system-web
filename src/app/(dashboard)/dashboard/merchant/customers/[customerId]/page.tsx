"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  customerId: string;

  name: string;

  avatarUrl?: string;

  accountStatus?: string;

  kycStatus?: string;

  emailVerified?: boolean;

  emailVerifiedAt?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
}

interface CustomerSummary {
  totalPayments: number;

  successfulPayments: number;

  pendingPayments: number;

  failedPayments: number;

  totalVolume:
    | string
    | number;

  averagePaymentValue:
    | string
    | number;

  successRate: number;

  firstPaymentAt:
    | string
    | null;

  lastPaymentAt:
    | string
    | null;
}

interface CustomerPayment {
  paymentId: string;

  orderId?:
    | string
    | null;

  amount:
    | string
    | number;

  currency: string;

  feeAmount:
    | string
    | number;

  netAmount:
    | string
    | number;

  sourceType: string;

  provider: string;

  mode: string;

  status: string;

  merchantReference?:
    | string
    | null;

  providerPaymentId?:
    | string
    | null;

  failureCode?:
    | string
    | null;

  failureMessage?:
    | string
    | null;

  authorizedAt?:
    | string
    | null;

  capturedAt?:
    | string
    | null;

  completedAt?:
    | string
    | null;

  failedAt?:
    | string
    | null;

  cancelledAt?:
    | string
    | null;

  expiredAt?:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
}

interface CustomerDetailsResponse {
  success?: boolean;

  message?: string;

  merchant?: {
    _id: string;

    businessName?: string;

    displayName?: string;

    defaultCurrency?: string;
  };

  customer?: Customer;

  summary?:
    CustomerSummary;

  payments?:
    CustomerPayment[];

  data?: {
    merchant?: {
      _id: string;

      businessName?: string;

      displayName?: string;

      defaultCurrency?: string;
    };

    customer?: Customer;

    summary?:
      CustomerSummary;

    payments?:
      CustomerPayment[];
  };
}

/* =========================================================
   ANIMATION
========================================================= */

const heroContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren:
        0.08,
    },
  },
};

const heroItem = {
  hidden: {
    opacity:
      0,

    y:
      16,
  },

  visible: {
    opacity:
      1,

    y:
      0,

    transition: {
      duration:
        0.55,

      ease: [
        0.22,
        1,
        0.36,
        1,
      ] as const,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value:
    | string
    | number
    | null
    | undefined,

  currency =
    "BDT",
): string {
  const amount =
    Number(
      value ??
        0,
    );

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      },
    )
      .format(
        amount,
      )
      .replace(
        /\u00A0/g,
        " ",
      );
  } catch {
    return `${currency} ${amount.toFixed(
      2,
    )}`;
  }
}

function formatDate(
  value?:
    | string
    | null,
): string {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

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
    },
  ).format(
    date,
  );
}

function formatCompactDate(
  value?:
    | string
    | null,
): string {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  ).format(
    date,
  );
}

function humanize(
  value?:
    | string
    | null,
): string {
  if (
    !value
  ) {
    return "—";
  }

  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}

function truncate(
  value?:
    | string
    | null,

  length =
    24,
): string {
  if (
    !value
  ) {
    return "—";
  }

  if (
    value.length <=
    length
  ) {
    return value;
  }

  return `${value.slice(
    0,
    length,
  )}…`;
}

function getInitial(
  name?:
    string,
): string {
  if (
    !name?.trim()
  ) {
    return "C";
  }

  return name
    .trim()
    .charAt(
      0,
    )
    .toUpperCase();
}

function getValueTextSize(
  value:
    string,
): string {
  if (
    value.length >=
    24
  ) {
    return "text-sm sm:text-base";
  }

  if (
    value.length >=
    19
  ) {
    return "text-base sm:text-lg";
  }

  if (
    value.length >=
    15
  ) {
    return "text-lg sm:text-xl";
  }

  return "text-xl sm:text-2xl";
}

/* =========================================================
   META
========================================================= */

function getPaymentStatusMeta(
  status?:
    string,
) {
  switch (
    status
  ) {
    case "completed":
      return {
        label:
          "Completed",

        icon:
          CheckCircle2,

        className:
          "merchant-status-success",
      };

    case "failed":
      return {
        label:
          "Failed",

        icon:
          XCircle,

        className:
          "merchant-status-danger",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        icon:
          XCircle,

        className:
          "merchant-status-danger",
      };

    case "expired":
      return {
        label:
          "Expired",

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };

    case "authorized":
      return {
        label:
          "Authorized",

        icon:
          CheckCircle2,

        className:
          "merchant-status-info",
      };

    case "captured":
      return {
        label:
          "Captured",

        icon:
          CreditCard,

        className:
          "merchant-status-info",
      };

    case "pending":
      return {
        label:
          "Pending",

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };

    default:
      return {
        label:
          humanize(
            status,
          ),

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };
  }
}

function getAccountMeta(
  status?:
    string,
) {
  switch (
    status
  ) {
    case "active":
      return {
        label:
          "Active",

        icon:
          CheckCircle2,

        className:
          "merchant-status-success",
      };

    case "deleted":
      return {
        label:
          "Deleted",

        icon:
          XCircle,

        className:
          "merchant-status-danger",
      };

    default:
      return {
        label:
          humanize(
            status,
          ),

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };
  }
}

function getKycMeta(
  status?:
    string,
) {
  switch (
    status
  ) {
    case "verified":
      return {
        label:
          "Verified",

        icon:
          ShieldCheck,

        className:
          "merchant-status-success",
      };

    case "rejected":
      return {
        label:
          "Rejected",

        icon:
          XCircle,

        className:
          "merchant-status-danger",
      };

    case "pending":
      return {
        label:
          "Pending",

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };

    case "under_review":
      return {
        label:
          "Under review",

        icon:
          ShieldCheck,

        className:
          "merchant-status-info",
      };

    case "not_started":
      return {
        label:
          "Not started",

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };

    default:
      return {
        label:
          humanize(
            status,
          ),

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };
  }
}

function getMethodMeta(
  sourceType?:
    string,
) {
  switch (
    sourceType
  ) {
    case "wallet":
      return {
        icon:
          Zap,

        label:
          "Wallet",
      };

    case "card":
      return {
        icon:
          CreditCard,

        label:
          "Card",
      };

    case "paypal":
      return {
        icon:
          CreditCard,

        label:
          "PayPal",
      };

    case "local_psp":
      return {
        icon:
          CreditCard,

        label:
          "Local PSP",
      };

    default:
      return {
        icon:
          CreditCard,

        label:
          humanize(
            sourceType,
          ),
      };
  }
}

/* =========================================================
   PURPLE BACKGROUND
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl"
        animate={{
          x: [
            0,
            24,
            0,
          ],

          y: [
            0,
            -14,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration:
            11,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-36 left-[25%] h-80 w-80 rounded-full bg-violet-200/20 blur-3xl"
        animate={{
          x: [
            0,
            -18,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration:
            13,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function CustomerAvatar({
  customer,
}: {
  customer:
    Customer;
}) {
  const [
    broken,
    setBroken,
  ] =
    useState(
      false,
    );

  if (
    customer.avatarUrl &&
    !broken
  ) {
    return (
      <img
        src={
          customer.avatarUrl
        }
        alt={
          customer.name
        }
        onError={() =>
          setBroken(
            true,
          )
        }
        className="
          h-16
          w-16
          shrink-0
          rounded-2xl
          border-2
          border-white/25
          object-cover
          shadow-lg

          sm:h-20
          sm:w-20
        "
      />
    );
  }

  return (
    <div
      className="
        flex
        h-16
        w-16
        shrink-0
        items-center
        justify-center
        rounded-2xl
        border
        border-white/15
        bg-white/10
        text-xl
        font-black
        text-white
        backdrop-blur

        sm:h-20
        sm:w-20
        sm:text-2xl
      "
    >
      {getInitial(
        customer.name,
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon:
    Icon,
  label,
  value,
  description,
  featured =
    false,
  delay =
    0,
}: {
  icon:
    React.ComponentType<{
      className?:
        string;
    }>;

  label:
    string;

  value:
    string;

  description:
    string;

  featured?:
    boolean;

  delay?:
    number;
}) {
  if (
    featured
  ) {
    return (
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
          duration:
            0.45,

          delay,
        }}
        whileHover={{
          y:
            -4,
        }}
        className="
          relative
          overflow-hidden
          rounded-[24px]
          p-5
          text-white
          shadow-[0_16px_38px_rgba(109,40,217,0.18)]
        "
        style={{
          background:
            "linear-gradient(135deg,#5B21B6 0%,#7C3AED 58%,#A855F7 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-100/85">
              {label}
            </p>

            <p
              className={`
                mt-2
                overflow-hidden
                whitespace-nowrap
                font-black
                tracking-tight
                tabular-nums

                ${getValueTextSize(
                  value,
                )}
              `}
            >
              {value}
            </p>

            <p className="mt-3 text-xs text-violet-100/80">
              {description}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
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
        duration:
          0.45,

        delay,
      }}
      whileHover={{
        y:
          -4,
      }}
      className="
        rounded-[24px]
        bg-white/80
        p-5
        shadow-[0_10px_30px_rgba(109,40,217,0.045)]

        dark:bg-slate-950/50
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] merchant-muted">
            {label}
          </p>

          <p
            className={`
              mt-2
              overflow-hidden
              whitespace-nowrap
              font-black
              tracking-tight
              merchant-text
              tabular-nums

              ${getValueTextSize(
                value,
              )}
            `}
          >
            {value}
          </p>

          <p className="mt-3 text-xs merchant-muted">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/[0.08] text-violet-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
  mono =
    false,
}: {
  label:
    string;

  value:
    React.ReactNode;

  mono?:
    boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium merchant-muted">
        {label}
      </span>

      <span
        className={`text-sm font-semibold merchant-text ${
          mono
            ? "font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function CustomerDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-52 animate-pulse rounded-[28px] bg-violet-500/[0.07]" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }
              className="h-32 animate-pulse rounded-[24px] bg-violet-500/[0.05]"
            />
          ),
        )}
      </div>

      <div className="h-[500px] animate-pulse rounded-[28px] bg-violet-500/[0.04]" />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantCustomerDetailsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const customerId =
    typeof params?.customerId ===
    "string"
      ? params.customerId
      : "";

  const [
    customer,
    setCustomer,
  ] =
    useState<Customer | null>(
      null,
    );

  const [
    summary,
    setSummary,
  ] =
    useState<CustomerSummary | null>(
      null,
    );

  const [
    payments,
    setPayments,
  ] =
    useState<
      CustomerPayment[]
    >([]);

  const [
    merchantName,
    setMerchantName,
  ] =
    useState(
      "",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  /* =======================================================
     FETCH
  ======================================================== */

  const fetchCustomer =
    useCallback(
      async (
        silent =
          false,
      ) => {
        if (
          !customerId
        ) {
          setError(
            "Customer ID is missing.",
          );

          setLoading(
            false,
          );

          return;
        }

        try {
          setError(
            "",
          );

          if (
            silent
          ) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          const response =
            await apiClient<CustomerDetailsResponse>(
              `/merchants/customers/${encodeURIComponent(
                customerId,
              )}`,
              {
                method:
                  "GET",
              },
            );

          if (
            response?.success ===
            false
          ) {
            throw new Error(
              response.message ||
                "Unable to load customer details.",
            );
          }

          const data =
            response.data;

          const nextCustomer =
            data?.customer ??
            response.customer;

          const nextSummary =
            data?.summary ??
            response.summary;

          const nextPayments =
            data?.payments ??
            response.payments ??
            [];

          const nextMerchant =
            data?.merchant ??
            response.merchant;

          if (
            !nextCustomer
          ) {
            throw new Error(
              "Customer details were not returned by the server.",
            );
          }

          setCustomer(
            nextCustomer,
          );

          setSummary(
            nextSummary ??
              null,
          );

          setPayments(
            Array.isArray(
              nextPayments,
            )
              ? nextPayments
              : [],
          );

          setMerchantName(
            nextMerchant?.displayName ||
              nextMerchant?.businessName ||
              "",
          );
        } catch (
          fetchError
        ) {
          console.error(
            "MERCHANT CUSTOMER DETAIL ERROR:",
            fetchError,
          );

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Unable to load customer details.",
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        customerId,
      ],
    );

  useEffect(
    () => {
      void fetchCustomer();
    },
    [
      fetchCustomer,
    ],
  );

  /* =======================================================
     DERIVED
  ======================================================== */

  const accountMeta =
    useMemo(
      () =>
        getAccountMeta(
          customer?.accountStatus,
        ),
      [
        customer?.accountStatus,
      ],
    );

  const kycMeta =
    useMemo(
      () =>
        getKycMeta(
          customer?.kycStatus,
        ),
      [
        customer?.kycStatus,
      ],
    );

  const AccountIcon =
    accountMeta.icon;

  const KycIcon =
    kycMeta.icon;

  const successfulPaymentRatio =
    useMemo(
      () => {
        if (
          !summary ||
          summary.totalPayments <=
            0
        ) {
          return 0;
        }

        return Math.max(
          0,
          Math.min(
            100,
            summary.successRate,
          ),
        );
      },
      [
        summary,
      ],
    );

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    loading
  ) {
    return (
      <main className="merchant-theme min-h-full">
        <div className="min-h-full bg-[var(--merchant-background)] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <CustomerDetailsSkeleton />
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (
    error &&
    !customer
  ) {
    return (
      <main className="merchant-theme min-h-full">
        <div className="flex min-h-[70vh] items-center justify-center bg-[var(--merchant-background)] px-4 py-8">
          <div className="w-full max-w-lg rounded-[28px] bg-white/75 p-6 text-center shadow-[0_18px_50px_rgba(109,40,217,0.08)] dark:bg-slate-950/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl merchant-danger-soft">
              <AlertCircle className="h-7 w-7 merchant-danger" />
            </div>

            <h2 className="mt-5 text-lg font-black merchant-text">
              Unable to load customer
            </h2>

            <p className="mt-2 text-sm leading-6 merchant-muted">
              {
                error
              }
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  void fetchCustomer()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white merchant-gradient"
              >
                <RefreshCw className="h-4 w-4" />

                Retry
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/merchant/customers",
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500/[0.07] px-4 py-2.5 text-sm font-bold merchant-text"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to customers
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    !customer
  ) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="min-h-full bg-[var(--merchant-background)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          {/* TOP ACTIONS */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/merchant/customers",
                )
              }
              className="inline-flex w-fit items-center gap-2 text-sm font-bold merchant-muted transition hover:text-violet-600"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to customers
            </button>

            <button
              type="button"
              onClick={() =>
                void fetchCustomer(
                  true,
                )
              }
              disabled={
                refreshing
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                text-sm
                font-bold
                merchant-text
                transition

                hover:bg-violet-500/[0.11]
                hover:text-violet-600

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
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

          {/* =================================================
              PURPLE TOP HERO
          ================================================= */}

          <motion.section
            variants={
              heroContainer
            }
            initial="hidden"
            animate="visible"
            className="
              relative
              mb-6
              overflow-hidden
              rounded-[30px]
              px-5
              py-7
              text-white
              shadow-[0_20px_58px_rgba(76,29,149,0.18)]

              sm:px-7

              lg:px-8
            "
          >
            <PurpleAuroraBackground />

            <div className="relative">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <motion.div
                  variants={
                    heroItem
                  }
                  className="flex min-w-0 items-center gap-4 sm:gap-5"
                >
                  <CustomerAvatar
                    customer={
                      customer
                    }
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-xl font-black sm:text-2xl">
                        {
                          customer.name
                        }
                      </h1>

                      {customer.emailVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />

                          Verified
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 truncate font-mono text-xs text-white/70 sm:text-sm">
                      {
                        customer.customerId
                      }
                    </p>

                    {merchantName ? (
                      <p className="mt-2 text-xs text-white/65">
                        Customer relationship with{" "}
                        {
                          merchantName
                        }
                      </p>
                    ) : null}
                  </div>
                </motion.div>

                <motion.div
                  variants={
                    heroItem
                  }
                  className="flex flex-wrap gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                    <AccountIcon className="h-3.5 w-3.5" />

                    {
                      accountMeta.label
                    }
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                    <KycIcon className="h-3.5 w-3.5" />

                    KYC:{" "}
                    {
                      kycMeta.label
                    }
                  </span>
                </motion.div>
              </div>

              <motion.div
                variants={
                  heroItem
                }
                className="mt-6 grid gap-3 sm:grid-cols-3"
              >
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <div className="flex items-center gap-2 text-violet-100/70">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                      Customer since
                    </p>
                  </div>

                  <p className="mt-1 text-sm font-black">
                    {formatCompactDate(
                      customer.createdAt,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    First payment
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {formatCompactDate(
                      summary?.firstPaymentAt,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Last payment
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {formatCompactDate(
                      summary?.lastPaymentAt,
                    )}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ERROR AFTER LOADED */}

          {error &&
          customer ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-500/[0.055] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

              <div>
                <p className="text-sm font-bold merchant-text">
                  Refresh failed
                </p>

                <p className="mt-1 text-sm merchant-muted">
                  {
                    error
                  }
                </p>
              </div>
            </div>
          ) : null}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={
                CreditCard
              }
              label="Total payments"
              value={
                String(
                  summary?.totalPayments ??
                    0,
                )
              }
              description="Payments made to your merchant"
              featured
              delay={
                0.03
              }
            />

            <SummaryCard
              icon={
                CheckCircle2
              }
              label="Successful payments"
              value={
                String(
                  summary?.successfulPayments ??
                    0,
                )
              }
              description={`${Number(
                summary?.successRate ??
                  0,
              ).toFixed(
                1,
              )}% overall success rate`}
              delay={
                0.08
              }
            />

            <SummaryCard
              icon={
                Zap
              }
              label="Total volume"
              value={
                formatMoney(
                  summary?.totalVolume,
                )
              }
              description="Successfully completed payment volume"
              delay={
                0.13
              }
            />

            <SummaryCard
              icon={
                Clock3
              }
              label="Average payment"
              value={
                formatMoney(
                  summary?.averagePaymentValue,
                )
              }
              description="Average successful payment value"
              delay={
                0.18
              }
            />
          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-6">
              {/* CUSTOMER PROFILE */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    14,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                className="
                  rounded-[26px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Customer profile
                    </h2>

                    <p className="mt-0.5 text-xs merchant-muted">
                      Account information
                    </p>
                  </div>
                </div>

                <InfoRow
                  label="Customer ID"
                  value={
                    truncate(
                      customer.customerId,
                      30,
                    )
                  }
                  mono
                />

                <InfoRow
                  label="Name"
                  value={
                    customer.name ||
                    "—"
                  }
                />

                <InfoRow
                  label="Account status"
                  value={
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${accountMeta.className}`}
                    >
                      <AccountIcon className="h-3.5 w-3.5" />

                      {
                        accountMeta.label
                      }
                    </span>
                  }
                />

                <InfoRow
                  label="KYC status"
                  value={
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${kycMeta.className}`}
                    >
                      <KycIcon className="h-3.5 w-3.5" />

                      {
                        kycMeta.label
                      }
                    </span>
                  }
                />

                <InfoRow
                  label="Email verification"
                  value={
                    customer.emailVerified
                      ? "Verified"
                      : "Not verified"
                  }
                />

                <InfoRow
                  label="Joined"
                  value={
                    formatDate(
                      customer.createdAt,
                    )
                  }
                />
              </motion.section>

              {/* =================================================
                  PURPLE SECTION 2 — PERFORMANCE
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    14,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                whileHover={{
                  y:
                    -3,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[26px]
                  p-5
                  text-white
                  shadow-[0_18px_42px_rgba(109,40,217,0.17)]
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-white/10 blur-2xl"
                  animate={{
                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }}
                  transition={{
                    duration:
                      8,

                    repeat:
                      Infinity,
                  }}
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black">
                        Payment performance
                      </h2>

                      <p className="mt-1 text-xs text-violet-100/75">
                        Customer activity with your business
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-violet-100/75">
                        Success rate
                      </span>

                      <span className="text-lg font-black">
                        {Number(
                          summary?.successRate ??
                            0,
                        ).toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{
                          width:
                            0,
                        }}
                        animate={{
                          width:
                            `${successfulPaymentRatio}%`,
                        }}
                        transition={{
                          duration:
                            0.8,

                          delay:
                            0.15,
                        }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                      <p className="text-[11px] text-violet-100/70">
                        Pending
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {summary?.pendingPayments ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                      <p className="text-[11px] text-violet-100/70">
                        Failed
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {summary?.failedPayments ??
                          0}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>

            {/* =================================================
                PURPLE SECTION 3 — PAYMENT HISTORY
            ================================================= */}

            <motion.section
              initial={{
                opacity:
                  0,

                y:
                  14,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              className="
                overflow-hidden
                rounded-[28px]
                bg-white/65
                shadow-[0_12px_38px_rgba(109,40,217,0.04)]
                backdrop-blur

                dark:bg-slate-950/40
              "
            >
              <div
                className="
                  relative
                  overflow-hidden
                  px-5
                  py-4
                  text-white
                "
                style={{
                  background:
                    "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
                }}
              >
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <CreditCard className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-black sm:text-base">
                        Payment history
                      </h2>

                      <p className="mt-0.5 text-xs text-violet-100/75">
                        Latest payment activity for this customer
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100">
                    <CreditCard className="h-3.5 w-3.5" />

                    {payments.length} recent records
                  </span>
                </div>
              </div>

              {payments.length ===
              0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                    <CreditCard className="h-8 w-8" />
                  </div>

                  <h3 className="mt-5 text-base font-black merchant-text">
                    No payments found
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 merchant-muted">
                    This customer does not have any payment records with
                    your merchant account.
                  </p>
                </div>
              ) : (
                <>
                  {/* =================================================
                      DESKTOP
                  ================================================= */}

                  <div
                    className="
                      hidden
                      overflow-x-auto
                      scroll-smooth
                      overscroll-x-contain
                      lg:block

                      [scrollbar-width:none]
                      [-ms-overflow-style:none]
                      [&::-webkit-scrollbar]:hidden
                    "
                  >
                    <table className="w-full min-w-[1100px]">
                      <thead>
                        <tr className="bg-violet-500/[0.03] text-left">
                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Payment
                          </th>

                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Amount
                          </th>

                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Method
                          </th>

                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Status
                          </th>

                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Mode
                          </th>

                          <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                            Date
                          </th>

                          <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider merchant-muted">
                            View
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {payments.map(
                          (
                            payment,
                            index,
                          ) => {
                            const statusMeta =
                              getPaymentStatusMeta(
                                payment.status,
                              );

                            const methodMeta =
                              getMethodMeta(
                                payment.sourceType,
                              );

                            const StatusIcon =
                              statusMeta.icon;

                            const MethodIcon =
                              methodMeta.icon;

                            return (
                              <motion.tr
                                key={
                                  payment.paymentId
                                }
                                initial={{
                                  opacity:
                                    0,

                                  y:
                                    6,
                                }}
                                animate={{
                                  opacity:
                                    1,

                                  y:
                                    0,
                                }}
                                transition={{
                                  duration:
                                    0.25,

                                  delay:
                                    index *
                                    0.025,
                                }}
                                className="transition-colors hover:bg-violet-500/[0.035]"
                              >
                                <td className="px-5 py-4">
                                  <div className="min-w-[220px]">
                                    <Link
                                      href={`/dashboard/merchant/payments/${encodeURIComponent(
                                        payment.paymentId,
                                      )}`}
                                      className="font-mono text-sm font-bold text-violet-600 hover:underline"
                                    >
                                      {truncate(
                                        payment.paymentId,
                                        28,
                                      )}
                                    </Link>

                                    <p className="mt-1 text-xs merchant-muted">
                                      {payment.merchantReference
                                        ? truncate(
                                            payment.merchantReference,
                                            30,
                                          )
                                        : "No merchant reference"}
                                    </p>

                                    {payment.orderId ? (
                                      <p className="mt-1 text-[11px] merchant-muted">
                                        Order:{" "}
                                        {truncate(
                                          payment.orderId,
                                          20,
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="whitespace-nowrap text-sm font-black merchant-text">
                                    {formatMoney(
                                      payment.amount,
                                      payment.currency,
                                    )}
                                  </p>

                                  <p className="mt-1 whitespace-nowrap text-xs merchant-muted">
                                    Net{" "}
                                    {formatMoney(
                                      payment.netAmount,
                                      payment.currency,
                                    )}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex min-w-[160px] items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                                      <MethodIcon className="h-4 w-4" />
                                    </div>

                                    <div>
                                      <p className="text-sm font-semibold merchant-text">
                                        {
                                          methodMeta.label
                                        }
                                      </p>

                                      <p className="mt-0.5 text-xs merchant-muted">
                                        {humanize(
                                          payment.provider,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusMeta.className}`}
                                  >
                                    <StatusIcon className="h-3.5 w-3.5" />

                                    {
                                      statusMeta.label
                                    }
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                                      payment.mode ===
                                      "live"
                                        ? "merchant-mode-live"
                                        : "merchant-mode-test"
                                    }`}
                                  >
                                    {humanize(
                                      payment.mode,
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="min-w-[140px]">
                                    <p className="text-sm font-semibold merchant-text">
                                      {formatCompactDate(
                                        payment.createdAt,
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs merchant-muted">
                                      {formatDate(
                                        payment.createdAt,
                                      )
                                        .split(
                                          ", ",
                                        )
                                        .at(
                                          -1,
                                        ) ||
                                        "—"}
                                    </p>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <Link
                                    href={`/dashboard/merchant/payments/${encodeURIComponent(
                                      payment.paymentId,
                                    )}`}
                                    className="
                                      inline-flex
                                      h-9
                                      w-9
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-violet-500/[0.055]
                                      merchant-text
                                      transition

                                      hover:bg-violet-500/[0.11]
                                      hover:text-violet-600
                                    "
                                    title="View payment"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </td>
                              </motion.tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* =================================================
                      MOBILE / TABLET
                  ================================================= */}

                  <div className="space-y-3 p-4 lg:hidden">
                    {payments.map(
                      (
                        payment,
                      ) => {
                        const statusMeta =
                          getPaymentStatusMeta(
                            payment.status,
                          );

                        const methodMeta =
                          getMethodMeta(
                            payment.sourceType,
                          );

                        const StatusIcon =
                          statusMeta.icon;

                        const MethodIcon =
                          methodMeta.icon;

                        return (
                          <Link
                            key={
                              payment.paymentId
                            }
                            href={`/dashboard/merchant/payments/${encodeURIComponent(
                              payment.paymentId,
                            )}`}
                            className="block rounded-[22px] bg-violet-500/[0.035] p-4 transition hover:bg-violet-500/[0.055]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-sm font-bold text-violet-600">
                                  {
                                    payment.paymentId
                                  }
                                </p>

                                <p className="mt-1 text-xs merchant-muted">
                                  {formatDate(
                                    payment.createdAt,
                                  )}
                                </p>
                              </div>

                              <span
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusMeta.className}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />

                                {
                                  statusMeta.label
                                }
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider merchant-muted">
                                  Amount
                                </p>

                                <p className="mt-1 whitespace-nowrap text-base font-black merchant-text">
                                  {formatMoney(
                                    payment.amount,
                                    payment.currency,
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                                  <MethodIcon className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold merchant-text">
                                    {
                                      methodMeta.label
                                    }
                                  </p>

                                  <p className="text-xs merchant-muted">
                                    {humanize(
                                      payment.provider,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-xl bg-violet-500/[0.04] p-3">
                                <p className="text-[11px] merchant-muted">
                                  Net amount
                                </p>

                                <p className="mt-1 whitespace-nowrap text-sm font-bold merchant-text">
                                  {formatMoney(
                                    payment.netAmount,
                                    payment.currency,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl bg-violet-500/[0.04] p-3">
                                <p className="text-[11px] merchant-muted">
                                  Mode
                                </p>

                                <p className="mt-1 text-sm font-bold merchant-text">
                                  {humanize(
                                    payment.mode,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className="truncate text-xs merchant-muted">
                                {payment.merchantReference ||
                                  "No merchant reference"}
                              </span>

                              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-violet-600">
                                View

                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </Link>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </motion.section>
          </div>

          {/* FOOTER */}

          <motion.div
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
            className="
              mt-6
              flex
              flex-col
              gap-3
              rounded-[22px]
              bg-white/55
              p-4
              backdrop-blur

              sm:flex-row
              sm:items-center
              sm:justify-between

              dark:bg-slate-950/35
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                <Users className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold merchant-text">
                  Customer directory
                </p>

                <p className="text-xs merchant-muted">
                  Inspect other merchant customers and their payment
                  activity.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/merchant/customers"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/[0.065]
                px-4
                py-2.5
                text-sm
                font-bold
                merchant-text
                transition

                hover:bg-violet-500/[0.11]
                hover:text-violet-600
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to customers
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}