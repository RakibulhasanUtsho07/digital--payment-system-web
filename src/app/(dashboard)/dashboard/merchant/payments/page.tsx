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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TestTube2,
  WalletCards,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

type PaymentMode =
  | "test"
  | "live";

type SourceType =
  | "paypal"
  | "card"
  | "local_psp"
  | "wallet";

interface MerchantPayment {
  paymentId: string;
  merchantId: string;
  customerId?: string | null;
  orderId?: string | null;
  amount: string | number;
  currency: string;
  feeAmount?: string | number | null;
  netAmount?: string | number | null;
  sourceType: SourceType | string;
  provider: string;
  mode: PaymentMode;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  merchantReference?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  returnUrl?: string | null;
  cancelUrl?: string | null;
  checkoutUrl?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentsResponse {
  success?: boolean;
  message?: string;

  data?: {
    payments: MerchantPayment[];
    pagination: Pagination;
    filters?: Record<string, unknown>;
  };

  payments?: MerchantPayment[];
  pagination?: Pagination;
}

interface FiltersState {
  search: string;
  status: string;
  mode: string;
  provider: string;
  sourceType: string;
  from: string;
  to: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const STATUS_OPTIONS: SelectOption[] = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "authorized",
    label: "Authorized",
  },
  {
    value: "captured",
    label: "Captured",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "expired",
    label: "Expired",
  },
];

const MODE_OPTIONS: SelectOption[] = [
  {
    value: "",
    label: "All modes",
  },
  {
    value: "test",
    label: "Test mode",
  },
  {
    value: "live",
    label: "Live mode",
  },
];

const SOURCE_OPTIONS: SelectOption[] = [
  {
    value: "",
    label: "All methods",
  },
  {
    value: "wallet",
    label: "Wallet",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "paypal",
    label: "PayPal",
  },
  {
    value: "local_psp",
    label: "Local PSP",
  },
];

const PROVIDER_OPTIONS: SelectOption[] = [
  {
    value: "",
    label: "All providers",
  },
  {
    value: "damo_wallet",
    label: "DAMO Wallet",
  },
  {
    value: "coffer_wallet",
    label: "Coffer Wallet",
  },
  {
    value: "paypal",
    label: "PayPal",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "bkash",
    label: "bKash",
  },
  {
    value: "nagad",
    label: "Nagad",
  },
  {
    value: "rocket",
    label: "Rocket",
  },
  {
    value: "upay",
    label: "Upay",
  },
];

const DEFAULT_LIMIT =
  20;

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

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
        animate={{
          x: [0, 90, 10, 0],
          y: [0, 30, 70, 0],
          scale: [1, 1.18, 0.92, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -left-32
          -top-40
          h-[430px]
          w-[430px]
          rounded-full
          bg-fuchsia-400/30
          blur-[110px]
        "
      />

      <motion.div
        animate={{
          x: [0, -80, 30, 0],
          y: [0, -30, 55, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-44
          right-[-70px]
          h-[460px]
          w-[460px]
          rounded-full
          bg-violet-300/30
          blur-[120px]
        "
      />

      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[10%]
          top-[-190px]
          h-[390px]
          w-[390px]
          rounded-full
          border
          border-white/10
        "
      />

      <motion.div
        animate={{
          x: ["-40%", "155%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -top-1/2
          h-[200%]
          w-[180px]
          rotate-[18deg]
          bg-gradient-to-r
          from-transparent
          via-white/[0.10]
          to-transparent
          blur-xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.07]
          [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]
          [background-size:24px_24px]
        "
      />
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value: string | number | null | undefined,
  currency = "BDT"
): string {
  const amount =
    Number(
      value ?? 0
    );

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      amount
    );
  } catch {
    return `${currency} ${amount.toFixed(
      2
    )}`;
  }
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    date
  );
}

function formatCompactDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
}

function humanize(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function truncate(
  value?: string | null,
  length = 18
): string {
  if (!value) {
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
    length
  )}…`;
}

function getStatusMeta(
  status: PaymentStatus
) {
  switch (
    status
  ) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300",
      };

    case "failed":
    case "cancelled":
      return {
        label:
          status ===
          "failed"
            ? "Failed"
            : "Cancelled",

        icon:
          XCircle,

        className:
          "border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/50 dark:text-red-300",
      };

    case "expired":
      return {
        label:
          "Expired",

        icon:
          Clock3,

        className:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",
      };

    case "authorized":
    case "captured":
      return {
        label:
          status ===
          "authorized"
            ? "Authorized"
            : "Captured",

        icon:
          status ===
          "captured"
            ? CreditCard
            : CheckCircle2,

        className:
          "border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      };

    case "pending":
    default:
      return {
        label:
          "Pending",

        icon:
          Clock3,

        className:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",
      };
  }
}

function getModeMeta(
  mode: PaymentMode
) {
  if (
    mode ===
    "live"
  ) {
    return {
      label:
        "Live",

      className:
        "border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }

  return {
    label:
      "Test",

    className:
      "border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-900/50 dark:text-sky-300",
  };
}

function getMethodMeta(
  sourceType?: string
) {
  switch (
    sourceType
  ) {
    case "wallet":
      return {
        icon:
          WalletCards,

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
          Zap,

        label:
          "Local PSP",
      };

    default:
      return {
        icon:
          CreditCard,

        label:
          humanize(
            sourceType
          ),
      };
  }
}

function getInitialFilters(): FiltersState {
  return {
    search: "",
    status: "",
    mode: "",
    provider: "",
    sourceType: "",
    from: "",
    to: "",
  };
}

function buildQueryString(
  filters: FiltersState,
  page: number,
  limit: number
): string {
  const params =
    new URLSearchParams();

  params.set(
    "page",
    String(
      page
    )
  );

  params.set(
    "limit",
    String(
      limit
    )
  );

  if (
    filters.search.trim()
  ) {
    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (
    filters.status
  ) {
    params.set(
      "status",
      filters.status
    );
  }

  if (
    filters.mode
  ) {
    params.set(
      "mode",
      filters.mode
    );
  }

  if (
    filters.provider
  ) {
    params.set(
      "provider",
      filters.provider
    );
  }

  if (
    filters.sourceType
  ) {
    params.set(
      "sourceType",
      filters.sourceType
    );
  }

  if (
    filters.from
  ) {
    params.set(
      "from",
      filters.from
    );
  }

  if (
    filters.to
  ) {
    params.set(
      "to",
      filters.to
    );
  }

  return params.toString();
}

function extractResponse(
  response:
    PaymentsResponse |
    unknown
): {
  payments:
    MerchantPayment[];

  pagination:
    Pagination;
} {
  const result =
    response as
      PaymentsResponse;

  const nested =
    result?.data;

  const payments =
    nested?.payments ??
    result?.payments ??
    [];

  const pagination =
    nested?.pagination ??
    result?.pagination ??
    ({
      page: 1,
      limit: DEFAULT_LIMIT,
      total:
        payments.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    } satisfies Pagination);

  return {
    payments:
      Array.isArray(
        payments
      )
        ? payments
        : [],

    pagination,
  };
}

/* =========================================================
   CUSTOM DROPDOWN
========================================================= */

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (
    value: string
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const ref =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    options.find(
      (
        option
      ) =>
        option.value ===
        value
    ) ??
    options[0];

  useEffect(
    () => {
      function handleOutside(
        event:
          MouseEvent
      ) {
        if (
          ref.current &&
          !ref.current.contains(
            event.target as Node
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

      return () =>
        document.removeEventListener(
          "mousedown",
          handleOutside
        );
    },
    []
  );

  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-violet-500">
        {
          label
        }
      </p>

      <div
        ref={
          ref
        }
        className="relative z-30"
      >
        <motion.button
          type="button"
          whileTap={{
            scale:
              0.985,
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
            items-center
            justify-between
            gap-3
            rounded-xl
            border
            bg-background
            px-3.5
            text-left
            transition-all

            ${
              open
                ? "border-violet-400 ring-4 ring-violet-500/10"
                : "merchant-border hover:border-violet-400/40"
            }
          `}
        >
          <span className="truncate text-sm font-bold text-foreground">
            {
              selected.label
            }
          </span>

          <motion.span
            animate={{
              rotate:
                open
                  ? 180
                  : 0,
            }}
          >
            <ChevronDown className="h-4 w-4 text-violet-500" />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
                y: -7,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 7,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -5,
                scale: 0.98,
              }}
              className="
                absolute
                left-0
                right-0
                top-full
                overflow-hidden
                rounded-2xl
                border
                merchant-border
                bg-card
                p-1.5
                shadow-[0_16px_35px_rgba(30,10,60,.14)]
              "
            >
              {options.map(
                (
                  option,
                  index
                ) => {
                  const active =
                    option.value ===
                    value;

                  return (
                    <motion.button
                      key={`${label}-${option.value}`}
                      type="button"
                      initial={{
                        opacity: 0,
                        x: 7,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index *
                          0.02,
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
                            : "text-foreground hover:bg-violet-500/[0.05]"
                        }
                      `}
                    >
                      <span className="text-xs font-bold">
                        {
                          option.label
                        }
                      </span>

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
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingRows() {
  return (
    <div className="divide-y merchant-border">
      {Array.from({
        length:
          8,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="grid grid-cols-[1.3fr_1.2fr_1fr_0.9fr_0.9fr_1fr_0.9fr_0.75fr_0.9fr_auto] gap-4 px-5 py-4"
          >
            {Array.from({
              length:
                10,
            }).map(
              (
                __,
                columnIndex
              ) => (
                <div
                  key={
                    columnIndex
                  }
                  className="h-4 animate-pulse rounded-md bg-muted"
                />
              )
            )}
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
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
        }}
        className="
          mb-5
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-violet-500/10
          text-violet-600

          dark:text-violet-300
        "
      >
        <CreditCard className="h-8 w-8" />
      </motion.div>

      <h3 className="text-lg font-black text-foreground">
        {hasFilters
          ? "No matching payments"
          : "No payments yet"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
        {hasFilters
          ? "Change the current search or filters and try again."
          : "Payments created for your merchant account will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={
            onClear
          }
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-violet-600
            px-4
            py-2.5
            text-sm
            font-black
            text-white
          "
        >
          <X className="h-4 w-4" />

          Clear filters
        </button>
      )}
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantPaymentsPage() {
  const [
    payments,
    setPayments,
  ] =
    useState<
      MerchantPayment[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>({
      page: 1,
      limit: DEFAULT_LIMIT,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [
    filters,
    setFilters,
  ] =
    useState<FiltersState>(
      getInitialFilters()
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<FiltersState>(
      getInitialFilters()
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
    error,
    setError,
  ] =
    useState("");

  const fetchPayments =
    useCallback(
      async (
        page = 1,
        nextAppliedFilters =
          appliedFilters,
        options?: {
          silent?: boolean;
        }
      ) => {
        const isSilent =
          options?.silent ===
          true;

        try {
          setError(
            ""
          );

          if (
            isSilent
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          const query =
            buildQueryString(
              nextAppliedFilters,
              page,
              DEFAULT_LIMIT
            );

          const response =
            await apiClient<PaymentsResponse>(
              `/merchants/payments?${query}`,
              {
                method:
                  "GET",
              }
            );

          const {
            payments:
              nextPayments,

            pagination:
              nextPagination,
          } =
            extractResponse(
              response
            );

          setPayments(
            nextPayments
          );

          setPagination(
            nextPagination
          );
        } catch (
          err
        ) {
          const message =
            err instanceof
              Error
              ? err.message
              : "Failed to load merchant payments.";

          setError(
            message
          );

          setPayments(
            []
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
        appliedFilters,
      ]
    );

  useEffect(
    () => {
      void fetchPayments(
        1,
        appliedFilters
      );
    },
    [
      fetchPayments,
      appliedFilters,
    ]
  );

  const hasActiveFilters =
    useMemo(
      () =>
        Object.values(
          appliedFilters
        ).some(
          (
            value
          ) =>
            value.trim() !==
            ""
        ),
      [
        appliedFilters,
      ]
    );

  const visibleRange =
    useMemo(
      () => {
        if (
          pagination.total ===
          0
        ) {
          return "0 results";
        }

        const start =
          (
            pagination.page -
            1
          ) *
            pagination.limit +
          1;

        const end =
          Math.min(
            pagination.page *
              pagination.limit,
            pagination.total
          );

        return `${start.toLocaleString()}–${end.toLocaleString()} of ${pagination.total.toLocaleString()}`;
      },
      [
        pagination,
      ]
    );

  const handleFilterChange =
    (
      key:
        keyof FiltersState,
      value:
        string
    ) => {
      setFilters(
        (
          current
        ) => ({
          ...current,
          [key]:
            value,
        })
      );
    };

  const applyFilters =
    () => {
      setAppliedFilters({
        ...filters,
      });
    };

  const clearFilters =
    () => {
      const cleared =
        getInitialFilters();

      setFilters(
        cleared
      );

      setAppliedFilters(
        cleared
      );
    };

  const goToPage =
    (
      page:
        number
    ) => {
      if (
        page <
          1 ||
        page >
          pagination.totalPages
      ) {
        return;
      }

      void fetchPayments(
        page
      );
    };

  const pageNumbers =
    useMemo(
      () => {
        const totalPages =
          pagination.totalPages;

        if (
          totalPages <=
          1
        ) {
          return [
            1,
          ];
        }

        const pages:
          number[] = [];

        const current =
          pagination.page;

        const start =
          Math.max(
            1,
            current -
              2
          );

        const end =
          Math.min(
            totalPages,
            current +
              2
          );

        for (
          let page =
            start;
          page <=
          end;
          page +=
          1
        ) {
          pages.push(
            page
          );
        }

        if (
          !pages.includes(
            1
          )
        ) {
          pages.unshift(
            1
          );
        }

        if (
          !pages.includes(
            totalPages
          )
        ) {
          pages.push(
            totalPages
          );
        }

        return pages;
      },
      [
        pagination,
      ]
    );

  return (
    <div className="merchant-theme min-h-full">
      <div className="min-h-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1800px] space-y-6">

          {/* =================================================
              HERO
          ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              overflow-hidden
              rounded-[30px]
              p-6
              text-white

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
                gap-7

                xl:flex-row
                xl:items-end
                xl:justify-between
              "
            >
              <div className="max-w-[850px]">
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
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/15
                      bg-white/10
                      backdrop-blur-xl
                    "
                  >
                    <CreditCard className="h-5 w-5" />
                  </motion.div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-fuchsia-100/55">
                      Merchant Payments
                    </p>

                    <p className="mt-1 text-lg font-black">
                      Payment operations
                    </p>
                  </div>
                </div>

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
                    delay:
                      0.1,
                  }}
                  className="mt-7"
                >
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-fuchsia-100/65">
                    <Sparkles className="h-3.5 w-3.5" />

                    Payment intelligence
                  </div>

                  <h1
                    className="
                      mt-3
                      max-w-[800px]
                      text-[34px]
                      font-black
                      leading-[1.02]
                      tracking-[-0.055em]

                      sm:text-[42px]
                      lg:text-[48px]
                    "
                  >
                    Track every payment
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
                      from creation to completion.
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[720px] text-sm leading-6 text-white/68">
                    Search, filter, inspect and manage all
                    merchant payment activity through one secure
                    payment workspace.
                  </p>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div
                  className="
                    rounded-xl
                    border
                    border-white/15
                    bg-white/[0.09]
                    px-4
                    py-2.5
                    backdrop-blur
                  "
                >
                  <p className="text-[8px] font-black uppercase tracking-wider text-white/50">
                    Records
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {pagination.total.toLocaleString()}
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{
                    y:
                      -3,
                  }}
                  whileTap={{
                    scale:
                      0.98,
                  }}
                  onClick={() =>
                    void fetchPayments(
                      pagination.page,
                      appliedFilters,
                      {
                        silent:
                          true,
                      }
                    )
                  }
                  disabled={
                    refreshing
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    text-xs
                    font-black
                    text-violet-700

                    disabled:opacity-60
                  "
                >
                  <RefreshCw
                    className={`
                      h-4
                      w-4

                      ${
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    `}
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              FILTER SECTION — PURPLE HEADER
          ================================================== */}

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
              delay:
                0.05,
            }}
            className="
              overflow-visible
              rounded-[24px]
              border
              merchant-border
              merchant-surface
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-t-[23px]
                px-5
                py-4
                text-white
              "
            >
              <PurpleAuroraBackground />

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/15
                      bg-white/10
                    "
                  >
                    <Filter className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-fuchsia-100/55">
                      Find payments
                    </p>

                    <h2 className="mt-0.5 text-sm font-black">
                      Search & filters
                    </h2>
                  </div>
                </div>

                <span
                  className="
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-3
                    py-1.5
                    text-[10px]
                    font-bold
                    text-fuchsia-50
                  "
                >
                  {
                    visibleRange
                  }
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr]">

                {/* SEARCH */}

                <div>
                  <label
                    htmlFor="payment-search"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-violet-500"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                    <input
                      id="payment-search"
                      type="text"
                      value={
                        filters.search
                      }
                      onChange={(
                        event
                      ) =>
                        handleFilterChange(
                          "search",
                          event.target.value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          applyFilters();
                        }
                      }}
                      placeholder="Payment ID, merchant reference..."
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        merchant-border
                        bg-background
                        pl-10
                        pr-10
                        text-sm
                        text-foreground
                        outline-none
                        transition

                        placeholder:text-muted-foreground/60

                        focus:border-violet-400
                        focus:ring-4
                        focus:ring-violet-500/10
                      "
                    />

                    {filters.search && (
                      <button
                        type="button"
                        onClick={() =>
                          handleFilterChange(
                            "search",
                            ""
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <FilterDropdown
                  label="Status"
                  value={
                    filters.status
                  }
                  options={
                    STATUS_OPTIONS
                  }
                  onChange={(
                    value
                  ) =>
                    handleFilterChange(
                      "status",
                      value
                    )
                  }
                />

                <FilterDropdown
                  label="Environment"
                  value={
                    filters.mode
                  }
                  options={
                    MODE_OPTIONS
                  }
                  onChange={(
                    value
                  ) =>
                    handleFilterChange(
                      "mode",
                      value
                    )
                  }
                />

                <FilterDropdown
                  label="Payment method"
                  value={
                    filters.sourceType
                  }
                  options={
                    SOURCE_OPTIONS
                  }
                  onChange={(
                    value
                  ) =>
                    handleFilterChange(
                      "sourceType",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
                <FilterDropdown
                  label="Provider"
                  value={
                    filters.provider
                  }
                  options={
                    PROVIDER_OPTIONS
                  }
                  onChange={(
                    value
                  ) =>
                    handleFilterChange(
                      "provider",
                      value
                    )
                  }
                />

                <div>
                  <label
                    htmlFor="payment-from"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-violet-500"
                  >
                    From date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                    <input
                      id="payment-from"
                      type="date"
                      value={
                        filters.from
                      }
                      onChange={(
                        event
                      ) =>
                        handleFilterChange(
                          "from",
                          event.target.value
                        )
                      }
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        merchant-border
                        bg-background
                        pl-10
                        pr-3
                        text-sm
                        text-foreground
                        outline-none

                        focus:border-violet-400
                        focus:ring-4
                        focus:ring-violet-500/10
                      "
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-to"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-violet-500"
                  >
                    To date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                    <input
                      id="payment-to"
                      type="date"
                      value={
                        filters.to
                      }
                      min={
                        filters.from ||
                        undefined
                      }
                      onChange={(
                        event
                      ) =>
                        handleFilterChange(
                          "to",
                          event.target.value
                        )
                      }
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        merchant-border
                        bg-background
                        pl-10
                        pr-3
                        text-sm
                        text-foreground
                        outline-none

                        focus:border-violet-400
                        focus:ring-4
                        focus:ring-violet-500/10
                      "
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <motion.button
                    type="button"
                    whileHover={{
                      y:
                        -2,
                    }}
                    whileTap={{
                      scale:
                        0.98,
                    }}
                    onClick={
                      applyFilters
                    }
                    className="
                      h-11
                      flex-1
                      rounded-xl
                      bg-gradient-to-r
                      from-violet-700
                      via-purple-600
                      to-fuchsia-600
                      px-5
                      text-sm
                      font-black
                      text-white
                    "
                  >
                    Apply filters
                  </motion.button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-violet-300/30
                        bg-violet-500/[0.05]
                        text-violet-600

                        hover:bg-violet-500/10
                      "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* ERROR */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                flex
                flex-col
                gap-3
                rounded-2xl
                border
                border-red-200
                bg-red-500/[0.06]
                p-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <div>
                  <p className="text-sm font-black text-foreground">
                    Unable to load payments
                  </p>

                  <p className="mt-1 text-sm merchant-muted">
                    {
                      error
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchPayments(
                    pagination.page,
                    appliedFilters
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-4
                  py-2.5
                  text-sm
                  font-black
                  text-white
                "
              >
                <RefreshCw className="h-4 w-4" />

                Retry
              </button>
            </motion.div>
          )}

          {/* =================================================
              PAYMENTS TABLE
          ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              overflow-hidden
              rounded-[24px]
              border
              merchant-border
              merchant-surface
            "
          >
            {/* THIRD PURPLE SECTION */}

            <div
              className="
                relative
                overflow-hidden
                px-5
                py-4
                text-white
              "
            >
              <PurpleAuroraBackground />

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.17em] text-fuchsia-100/55">
                    Transaction records
                  </p>

                  <h2 className="mt-1 text-base font-black">
                    All payments
                  </h2>

                  <p className="mt-1 text-[10px] text-white/60">
                    {loading
                      ? "Loading payment records..."
                      : `${pagination.total.toLocaleString()} payment records`}
                  </p>
                </div>

                {hasActiveFilters && (
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      self-start
                      rounded-full
                      border
                      border-white/15
                      bg-white/10
                      px-3
                      py-1.5
                      text-[9px]
                      font-black
                    "
                  >
                    <Filter className="h-3.5 w-3.5" />

                    Filters applied
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div
                className="
                  hidden
                  overflow-x-auto
                  scroll-smooth
                  overscroll-x-contain

                  [scrollbar-width:none]
                  [-ms-overflow-style:none]
                  [&::-webkit-scrollbar]:hidden

                  xl:block
                "
              >
                <LoadingRows />
              </div>
            ) : payments.length ===
              0 ? (
              <EmptyState
                hasFilters={
                  hasActiveFilters
                }
                onClear={
                  clearFilters
                }
              />
            ) : (
              <>
                {/* DESKTOP TABLE */}

                <div
                  className="
                    hidden
                    overflow-x-auto
                    scroll-smooth
                    overscroll-x-contain

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden

                    xl:block
                  "
                >
                  <table className="w-full min-w-[1500px]">
                    <thead>
                      <tr
                        className="
                          border-b
                          border-violet-300/15
                          bg-violet-500/[0.035]
                          text-left
                        "
                      >
                        {[
                          "Payment",
                          "Customer",
                          "Amount",
                          "Fee",
                          "Net",
                          "Method",
                          "Status",
                          "Mode",
                          "Date",
                          "View",
                        ].map(
                          (
                            title,
                            index
                          ) => (
                            <th
                              key={
                                title
                              }
                              className={`
                                px-5
                                py-3.5
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.12em]
                                text-violet-600/75

                                dark:text-violet-300/70

                                ${
                                  index ===
                                  9
                                    ? "text-right"
                                    : ""
                                }
                              `}
                            >
                              {
                                title
                              }
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y merchant-border">
                      {payments.map(
                        (
                          payment,
                          rowIndex
                        ) => {
                          const statusMeta =
                            getStatusMeta(
                              payment.status
                            );

                          const modeMeta =
                            getModeMeta(
                              payment.mode
                            );

                          const methodMeta =
                            getMethodMeta(
                              payment.sourceType
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
                                opacity: 0,
                              }}
                              animate={{
                                opacity: 1,
                              }}
                              transition={{
                                delay:
                                  rowIndex *
                                  0.018,
                              }}
                              className="
                                group
                                transition-colors

                                hover:bg-violet-500/[0.035]
                              "
                            >
                              <td className="px-5 py-4">
                                <div className="min-w-[200px]">
                                  <Link
                                    href={`/dashboard/merchant/payments/${encodeURIComponent(
                                      payment.paymentId
                                    )}`}
                                    className="font-mono text-sm font-black text-violet-700 hover:text-fuchsia-600 dark:text-violet-300"
                                  >
                                    {truncate(
                                      payment.paymentId,
                                      24
                                    )}
                                  </Link>

                                  <p className="mt-1 text-xs merchant-muted">
                                    {payment.merchantReference
                                      ? truncate(
                                          payment.merchantReference,
                                          28
                                        )
                                      : "No merchant reference"}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="min-w-[170px]">
                                  <p className="font-mono text-xs font-bold text-foreground">
                                    {truncate(
                                      payment.customerId,
                                      24
                                    )}
                                  </p>

                                  {payment.orderId && (
                                    <p className="mt-1 text-xs merchant-muted">
                                      Order:{" "}
                                      {truncate(
                                        payment.orderId,
                                        18
                                      )}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-black text-violet-700 dark:text-violet-200">
                                  {formatMoney(
                                    payment.amount,
                                    payment.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm merchant-muted">
                                  {formatMoney(
                                    payment.feeAmount,
                                    payment.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-bold text-foreground">
                                  {formatMoney(
                                    payment.netAmount,
                                    payment.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex min-w-[170px] items-center gap-2.5">
                                  <motion.div
                                    whileHover={{
                                      rotate:
                                        -5,
                                      scale:
                                        1.1,
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
                                    "
                                  >
                                    <MethodIcon className="h-4 w-4" />
                                  </motion.div>

                                  <div>
                                    <p className="text-sm font-bold text-foreground">
                                      {
                                        methodMeta.label
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs merchant-muted">
                                      {humanize(
                                        payment.provider
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    whitespace-nowrap
                                    rounded-full
                                    border
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    font-bold

                                    ${statusMeta.className}
                                  `}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />

                                  {
                                    statusMeta.label
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`
                                    inline-flex
                                    rounded-full
                                    border
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    font-bold

                                    ${modeMeta.className}
                                  `}
                                >
                                  {
                                    modeMeta.label
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="min-w-[130px]">
                                  <p className="text-sm font-bold text-foreground">
                                    {formatCompactDate(
                                      payment.createdAt
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs merchant-muted">
                                    {new Date(
                                      payment.createdAt
                                    ).toLocaleTimeString(
                                      "en-BD",
                                      {
                                        hour:
                                          "2-digit",
                                        minute:
                                          "2-digit",
                                      }
                                    )}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <Link
                                  href={`/dashboard/merchant/payments/${encodeURIComponent(
                                    payment.paymentId
                                  )}`}
                                  className="
                                    inline-flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    border-violet-300/25
                                    bg-violet-500/[0.04]
                                    text-violet-600
                                    transition

                                    hover:bg-violet-500/10
                                  "
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </td>
                            </motion.tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div className="divide-y xl:hidden merchant-border">
                  {payments.map(
                    (
                      payment,
                      index
                    ) => {
                      const statusMeta =
                        getStatusMeta(
                          payment.status
                        );

                      const modeMeta =
                        getModeMeta(
                          payment.mode
                        );

                      const methodMeta =
                        getMethodMeta(
                          payment.sourceType
                        );

                      const StatusIcon =
                        statusMeta.icon;

                      const MethodIcon =
                        methodMeta.icon;

                      return (
                        <motion.div
                          key={
                            payment.paymentId
                          }
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.025,
                          }}
                        >
                          <Link
                            href={`/dashboard/merchant/payments/${encodeURIComponent(
                              payment.paymentId
                            )}`}
                            className="
                              block
                              p-4
                              transition-colors

                              hover:bg-violet-500/[0.035]

                              sm:p-5
                            "
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-sm font-black text-violet-700 dark:text-violet-300">
                                  {truncate(
                                    payment.paymentId,
                                    28
                                  )}
                                </p>

                                <p className="mt-1 text-xs merchant-muted">
                                  {formatDate(
                                    payment.createdAt
                                  )}
                                </p>
                              </div>

                              <span
                                className={`
                                  inline-flex
                                  shrink-0
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  border
                                  px-2.5
                                  py-1.5
                                  text-xs
                                  font-bold

                                  ${statusMeta.className}
                                `}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />

                                {
                                  statusMeta.label
                                }
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wide text-violet-500/70">
                                  Amount
                                </p>

                                <p className="mt-1 text-sm font-black text-violet-700 dark:text-violet-200">
                                  {formatMoney(
                                    payment.amount,
                                    payment.currency
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wide text-violet-500/70">
                                  Net
                                </p>

                                <p className="mt-1 text-sm font-bold text-foreground">
                                  {formatMoney(
                                    payment.netAmount,
                                    payment.currency
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wide text-violet-500/70">
                                  Method
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  <MethodIcon className="h-3.5 w-3.5 text-violet-600" />

                                  <span className="text-sm font-bold text-foreground">
                                    {
                                      methodMeta.label
                                    }
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wide text-violet-500/70">
                                  Mode
                                </p>

                                <span
                                  className={`
                                    mt-1
                                    inline-flex
                                    rounded-full
                                    border
                                    px-2
                                    py-1
                                    text-xs
                                    font-bold

                                    ${modeMeta.className}
                                  `}
                                >
                                  {
                                    modeMeta.label
                                  }
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3 merchant-border">
                              <div className="min-w-0">
                                <p className="text-xs merchant-muted">
                                  Provider
                                </p>

                                <p className="truncate text-sm font-bold text-foreground">
                                  {humanize(
                                    payment.provider
                                  )}
                                </p>
                              </div>

                              <div className="inline-flex shrink-0 items-center gap-1.5 text-sm font-black text-violet-600">
                                View details

                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </>
            )}

            {/* PAGINATION */}

            {!loading &&
              payments.length >
                0 &&
              pagination.totalPages >
                1 && (
                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    border-t
                    border-violet-300/15
                    bg-violet-500/[0.025]
                    px-5
                    py-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <p className="text-xs merchant-muted">
                    Showing{" "}
                    <span className="font-black text-violet-700 dark:text-violet-300">
                      {
                        visibleRange
                      }
                    </span>
                  </p>

                  <div
                    className="
                      flex
                      max-w-full
                      items-center
                      justify-end
                      gap-1.5
                      overflow-x-auto
                      scroll-smooth

                      [scrollbar-width:none]
                      [-ms-overflow-style:none]
                      [&::-webkit-scrollbar]:hidden
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          pagination.page -
                            1
                        )
                      }
                      disabled={
                        !pagination.hasPreviousPage
                      }
                      className="
                        inline-flex
                        h-9
                        shrink-0
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        border-violet-300/25
                        bg-violet-500/[0.035]
                        px-3
                        text-xs
                        font-black
                        text-violet-700

                        disabled:cursor-not-allowed
                        disabled:opacity-40

                        dark:text-violet-300
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />

                      Previous
                    </button>

                    {pageNumbers.map(
                      (
                        page,
                        index
                      ) => {
                        const previousPage =
                          pageNumbers[
                            index -
                              1
                          ];

                        const showGap =
                          index >
                            0 &&
                          previousPage !==
                            undefined &&
                          page -
                            previousPage >
                            1;

                        return (
                          <React.Fragment
                            key={
                              page
                            }
                          >
                            {showGap && (
                              <span className="px-1 text-xs merchant-muted">
                                ...
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                goToPage(
                                  page
                                )
                              }
                              className={`
                                h-9
                                min-w-9
                                shrink-0
                                rounded-lg
                                px-2
                                text-xs
                                font-black
                                transition

                                ${
                                  page ===
                                  pagination.page
                                    ? "bg-violet-600 text-white"
                                    : "border border-violet-300/20 bg-violet-500/[0.03] text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                                }
                              `}
                            >
                              {
                                page
                              }
                            </button>
                          </React.Fragment>
                        );
                      }
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          pagination.page +
                            1
                        )
                      }
                      disabled={
                        !pagination.hasNextPage
                      }
                      className="
                        inline-flex
                        h-9
                        shrink-0
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        border-violet-300/25
                        bg-violet-500/[0.035]
                        px-3
                        text-xs
                        font-black
                        text-violet-700

                        disabled:cursor-not-allowed
                        disabled:opacity-40

                        dark:text-violet-300
                      "
                    >
                      Next

                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}