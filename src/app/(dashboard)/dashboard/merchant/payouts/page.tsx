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
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Send,
  Wallet,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  createPortal,
} from "react-dom";

import {
  createMerchantPayout,
  getMerchantPayouts,
  type MerchantPayout,
  type MerchantPayoutBalance,
  type MerchantPayoutMethod,
  type MerchantPayoutStatus,
  type MerchantPayoutSummary,
} from "@/lib/api/merchantPayoutApi";

/* =========================================================
   TYPES
========================================================= */

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

interface PayoutFormState {
  amount: string;

  payoutMethod:
    MerchantPayoutMethod;

  destination: string;

  destinationReference: string;

  merchantReference: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_LIMIT =
  20;

const EMPTY_SUMMARY:
  MerchantPayoutSummary = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,

  totalAmount: 0,
  pendingAmount: 0,
  completedAmount: 0,
};

const EMPTY_BALANCE:
  MerchantPayoutBalance = {
  currency: "BDT",
  ledgerBalance: 0,
  reservedAmount: 0,
  availableBalance: 0,
};

const EMPTY_FORM:
  PayoutFormState = {
  amount: "",

  payoutMethod:
    "bank",

  destination: "",

  destinationReference: "",

  merchantReference: "",
};

const STATUS_OPTIONS = [
  {
    value: "",
    label:
      "All statuses",
  },

  {
    value:
      "pending",
    label:
      "Pending",
  },

  {
    value:
      "processing",
    label:
      "Processing",
  },

  {
    value:
      "completed",
    label:
      "Completed",
  },

  {
    value:
      "failed",
    label:
      "Failed",
  },

  {
    value:
      "cancelled",
    label:
      "Cancelled",
  },
] as const;

const METHOD_OPTIONS = [
  {
    value: "",
    label:
      "All methods",
  },

  {
    value:
      "bank",
    label:
      "Bank",
  },

  {
    value:
      "mobile_wallet",
    label:
      "Mobile Wallet",
  },

  {
    value:
      "wallet",
    label:
      "Wallet",
  },

  {
    value:
      "other",
    label:
      "Other",
  },
] as const;

const CREATE_METHOD_OPTIONS = [
  {
    value:
      "bank",
    label:
      "Bank",
  },

  {
    value:
      "mobile_wallet",
    label:
      "Mobile Wallet",
  },

  {
    value:
      "wallet",
    label:
      "Wallet",
  },

  {
    value:
      "other",
    label:
      "Other",
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount:
    number,

  currency:
    string,
): string {
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
  value:
    string |
    null |
    undefined,
): string {
  if (!value) {
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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}

function formatCompactDate(
  value:
    string |
    null |
    undefined,
): string {
  if (!value) {
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

function shortId(
  value:
    string,

  start =
    10,

  end =
    5,
): string {
  if (
    value.length <=
    start +
      end +
      3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start,
  )}...${value.slice(
    -end,
  )}`;
}

function methodLabel(
  method:
    MerchantPayoutMethod,
): string {
  switch (method) {
    case "bank":
      return "Bank";

    case "mobile_wallet":
      return "Mobile Wallet";

    case "wallet":
      return "Wallet";

    default:
      return "Other";
  }
}

function methodIcon(
  method:
    MerchantPayoutMethod,
) {
  switch (method) {
    case "bank":
      return Banknote;

    case "mobile_wallet":
    case "wallet":
      return Wallet;

    default:
      return CreditCard;
  }
}

function statusMeta(
  status:
    MerchantPayoutStatus,
) {
  switch (status) {
    case "completed":
      return {
        label:
          "Completed",

        icon:
          CheckCircle2,

        className:
          "merchant-status-success",
      };

    case "processing":
      return {
        label:
          "Processing",

        icon:
          RefreshCw,

        className:
          "merchant-status-info",
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

    default:
      return {
        label:
          "Pending",

        icon:
          Clock3,

        className:
          "merchant-status-warning",
      };
  }
}

/* =========================================================
   PURPLE AURORA
========================================================= */

function PurpleAuroraBackground() {
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
          -top-28
          h-80
          w-80
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            24,
            0,
          ],

          y: [
            0,
            -16,
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
          -bottom-40
          left-[28%]
          h-80
          w-80
          rounded-full
          bg-violet-200/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            -20,
            0,
          ],

          scale: [
            1,
            1.1,
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
   DROPDOWN
========================================================= */

function PayoutDropdown({
  value,
  options,
  onChange,
}: {
  value: string;

  options:
    readonly DropdownOption[];

  onChange:
    (
      value:
        string,
    ) => void;
}) {
  const [
    mounted,
    setMounted,
  ] =
    useState(false);

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    position,
    setPosition,
  ] =
    useState<
      DropdownPosition | null
    >(null);

  const triggerRef =
    useRef<HTMLButtonElement>(
      null,
    );

  const menuRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(
    () => {
      setMounted(true);
    },
    [],
  );

  const selected =
    options.find(
      (
        option,
      ) =>
        option.value ===
        value,
    ) ??
    options[0];

  const calculatePosition =
    () => {
      const trigger =
        triggerRef.current;

      if (!trigger) {
        return;
      }

      const rect =
        trigger.getBoundingClientRect();

      const gap =
        8;

      const padding =
        12;

      const below =
        window.innerHeight -
        rect.bottom -
        gap -
        padding;

      const above =
        rect.top -
        gap -
        padding;

      const width =
        Math.min(
          rect.width,
          window.innerWidth -
            padding *
              2,
        );

      const left =
        Math.min(
          Math.max(
            padding,
            rect.left,
          ),

          window.innerWidth -
            width -
            padding,
        );

      if (
        below >=
          180 ||
        below >=
          above
      ) {
        setPosition({
          left,
          width,

          top:
            rect.bottom +
            gap,

          maxHeight:
            Math.max(
              140,
              Math.min(
                260,
                below,
              ),
            ),
        });

        return;
      }

      setPosition({
        left,
        width,

        bottom:
          window.innerHeight -
          rect.top +
          gap,

        maxHeight:
          Math.max(
            140,
            Math.min(
              260,
              above,
            ),
          ),
      });
    };

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const outsideClick =
        (
          event:
            PointerEvent,
        ) => {
          const target =
            event.target as Node;

          if (
            triggerRef.current?.contains(
              target,
            ) ||
            menuRef.current?.contains(
              target,
            )
          ) {
            return;
          }

          setOpen(false);
        };

      const escape =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(false);
          }
        };

      const close =
        () => {
          setOpen(false);
        };

      document.addEventListener(
        "pointerdown",
        outsideClick,
      );

      document.addEventListener(
        "keydown",
        escape,
      );

      window.addEventListener(
        "scroll",
        close,
        true,
      );

      window.addEventListener(
        "resize",
        close,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          outsideClick,
        );

        document.removeEventListener(
          "keydown",
          escape,
        );

        window.removeEventListener(
          "scroll",
          close,
          true,
        );

        window.removeEventListener(
          "resize",
          close,
        );
      };
    },
    [
      open,
    ],
  );

  const menu =
    mounted &&
    open &&
    position
      ? createPortal(
          <motion.div
            ref={
              menuRef
            }
            initial={{
              opacity: 0,
              y: -4,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            style={{
              position:
                "fixed",

              left:
                position.left,

              width:
                position.width,

              top:
                position.top,

              bottom:
                position.bottom,

              maxHeight:
                position.maxHeight,

              zIndex:
                30,
            }}
            className="
              overflow-y-auto
              rounded-2xl
              bg-white/95
              p-1.5
              shadow-[0_22px_60px_rgba(30,15,60,0.18)]
              backdrop-blur-xl

              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden

              dark:bg-slate-950/95
            "
          >
            {options.map(
              (
                option,
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value ||
                      "__all"
                    }
                    type="button"
                    onClick={() => {
                      onChange(
                        option.value,
                      );

                      setOpen(false);
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
                      text-sm
                      font-semibold
                      transition

                      ${
                        active
                          ? "bg-violet-500/10 text-violet-600"
                          : "merchant-text hover:bg-violet-500/[0.055]"
                      }
                    `}
                  >
                    {option.label}

                    {active ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </button>
                );
              },
            )}
          </motion.div>,

          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={
          triggerRef
        }
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }

          calculatePosition();
          setOpen(true);
        }}
        className="
          merchant-text

          flex
          h-12
          w-full
          items-center
          justify-between
          gap-3
          rounded-2xl
          border-0
          bg-violet-500/[0.055]
          px-4
          text-sm
          font-semibold
          outline-none
          transition

          hover:bg-violet-500/[0.09]

          focus-visible:ring-4
          focus-visible:ring-violet-500/[0.09]

          dark:bg-white/[0.045]
        "
      >
        <span className="truncate">
          {selected?.label}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            bg-violet-500/[0.08]
            text-violet-600
          "
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {menu}
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  amount,
  currency,
  description,
  icon:
    Icon,
  featured = false,
}: {
  title: string;

  amount: number;

  currency: string;

  description: string;

  icon:
    React.ComponentType<{
      className?:
        string;
    }>;

  featured?: boolean;
}) {
  const content =
    (
      <>
        <div className="flex items-start justify-between gap-4">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.14em] ${
              featured
                ? "text-violet-100/85"
                : "merchant-muted"
            }`}
          >
            {title}
          </p>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              featured
                ? "border border-white/15 bg-white/10"
                : "bg-violet-500/[0.08] text-violet-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p
          className={`
            mt-3
            whitespace-nowrap
            text-[clamp(1.05rem,1.8vw,1.7rem)]
            font-black
            leading-none
            tracking-[-0.035em]
            tabular-nums

            ${
              featured
                ? "text-white"
                : "merchant-text"
            }
          `}
        >
          {formatMoney(
            amount,
            currency,
          )}
        </p>

        <p
          className={`mt-4 text-xs ${
            featured
              ? "text-violet-100/80"
              : "merchant-muted"
          }`}
        >
          {description}
        </p>
      </>
    );

  if (featured) {
    return (
      <motion.article
        whileHover={{
          y: -4,
        }}
        className="
          relative
          overflow-hidden
          rounded-[24px]
          p-5
          shadow-[0_16px_38px_rgba(109,40,217,0.16)]
        "
        style={{
          background:
            "linear-gradient(135deg,#5B21B6 0%,#7C3AED 58%,#A855F7 100%)",
        }}
      >
        {content}
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={{
        y: -4,
      }}
      className="
        rounded-[24px]
        bg-white/80
        p-5
        shadow-[0_10px_30px_rgba(109,40,217,0.04)]

        dark:bg-slate-950/50
      "
    >
      {content}
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantPayoutsPage() {
  const [
    payouts,
    setPayouts,
  ] =
    useState<
      MerchantPayout[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      MerchantPayoutSummary
    >(
      EMPTY_SUMMARY,
    );

  const [
    balance,
    setBalance,
  ] =
    useState<
      MerchantPayoutBalance
    >(
      EMPTY_BALANCE,
    );

  const [
    merchantName,
    setMerchantName,
  ] =
    useState(
      "Merchant",
    );

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<
      MerchantPayoutStatus | ""
    >("");

  const [
    method,
    setMethod,
  ] =
    useState<
      MerchantPayoutMethod | ""
    >("");

  const [
    from,
    setFrom,
  ] =
    useState("");

  const [
    to,
    setTo,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    hasNextPage,
    setHasNextPage,
  ] =
    useState(false);

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    payoutModalOpen,
    setPayoutModalOpen,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<PayoutFormState>(
      EMPTY_FORM,
    );

  /* =======================================================
     FETCH
  ======================================================== */

  const loadPayouts =
    useCallback(
      async (
        silent = false,
      ) => {
        try {
          setError("");

          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getMerchantPayouts({
              page,

              limit:
                DEFAULT_LIMIT,

              search:
                search ||
                undefined,

              status:
                status ||
                undefined,

              payoutMethod:
                method ||
                undefined,

              from:
                from ||
                undefined,

              to:
                to ||
                undefined,
            });

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load payouts.",
            );
          }

          const data =
            response.data;

          setPayouts(
            data.payouts,
          );

          setSummary(
            data.summary,
          );

          setBalance(
            data.balance,
          );

          setMerchantName(
            data.merchant
              .businessDisplayName ||
              data.merchant
                .businessName ||
              "Merchant",
          );

          setPage(
            data.pagination.page,
          );

          setTotalPages(
            data.pagination.totalPages,
          );

          setTotal(
            data.pagination.total,
          );

          setHasNextPage(
            data.pagination.hasNextPage,
          );

          setHasPreviousPage(
            data.pagination.hasPreviousPage,
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load merchant payouts.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        from,
        method,
        page,
        search,
        status,
        to,
      ],
    );

  useEffect(
    () => {
      void loadPayouts();
    },
    [
      loadPayouts,
    ],
  );

  /* =======================================================
     SEARCH
  ======================================================== */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setSearch(
              searchInput.trim(),
            );

            setPage(1);
          },
          350,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      searchInput,
    ],
  );

  /* =======================================================
     CREATE PAYOUT
  ======================================================== */

  const openPayoutModal =
    () => {
      setForm(
        EMPTY_FORM,
      );

      setError("");
      setSuccess("");

      setPayoutModalOpen(
        true,
      );
    };

  const submitPayout =
    async () => {
      const amount =
        Number(
          form.amount,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount <=
          0
      ) {
        setError(
          "Enter a valid payout amount.",
        );

        return;
      }

      if (
        amount >
        balance.availableBalance
      ) {
        setError(
          `Payout amount cannot exceed the available balance of ${formatMoney(
            balance.availableBalance,
            balance.currency,
          )}.`,
        );

        return;
      }

      if (
        form.payoutMethod !==
          "wallet" &&
        !form.destinationReference.trim()
      ) {
        setError(
          "Destination reference is required for this payout method.",
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");
        setSuccess("");

        const response =
          await createMerchantPayout({
            amount,

            currency:
              balance.currency,

            payoutMethod:
              form.payoutMethod,

            destination:
              form.destination.trim() ||
              undefined,

            destinationReference:
              form.destinationReference.trim() ||
              undefined,

            merchantReference:
              form.merchantReference.trim() ||
              undefined,

            idempotencyKey:
              globalThis.crypto?.randomUUID
                ? `merchant-payout-${globalThis.crypto.randomUUID()}`
                : `merchant-payout-${Date.now()}`,
          });

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to create payout.",
          );
        }

        setSuccess(
          response.data.duplicate
            ? "Existing payout request returned."
            : "Payout request created successfully.",
        );

        setPayoutModalOpen(
          false,
        );

        setPage(1);

        await loadPayouts(
          true,
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to create payout.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
     DERIVED
  ======================================================== */

  const hasFilters =
    Boolean(
      search ||
      status ||
      method ||
      from ||
      to,
    );

  const clearFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatus("");
      setMethod("");
      setFrom("");
      setTo("");
      setPage(1);
    };

  const visibleStart =
    total === 0
      ? 0
      : (
          page -
          1
        ) *
          DEFAULT_LIMIT +
        1;

  const visibleEnd =
    Math.min(
      page *
        DEFAULT_LIMIT,

      total,
    );

  const currency =
    balance.currency ||
    "BDT";

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              mb-6
              overflow-hidden
              rounded-[30px]
              px-5
              py-6
              text-white
              shadow-[0_20px_58px_rgba(76,29,149,0.17)]

              sm:px-7
              sm:py-7
            "
          >
            <PurpleAuroraBackground />

            <div className="relative">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100">
                    <Send className="h-3.5 w-3.5" />

                    Merchant finance
                  </div>

                  <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    Payouts
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/85">
                    Manage merchant payout requests, available balance,
                    reservations and completed disbursements.
                  </p>

                  <p className="mt-3 text-xs font-semibold text-violet-100/70">
                    {merchantName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void loadPayouts(
                        true,
                      )
                    }
                    disabled={
                      refreshing
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-bold"
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

                  <button
                    type="button"
                    onClick={
                      openPayoutModal
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-violet-700"
                  >
                    <Plus className="h-4 w-4" />

                    Request payout
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/70">
                    Total payouts
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {summary.total.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/70">
                    Pending
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {summary.pending.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/70">
                    Processing
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {summary.processing.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* NOTICES */}

          {success ? (
            <div className="mb-5 rounded-2xl bg-emerald-500/[0.08] p-4 text-sm font-semibold text-emerald-600">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-rose-500/[0.07] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <p className="text-sm font-semibold text-rose-600">
                {error}
              </p>
            </div>
          ) : null}

          {/* =================================================
              BALANCE
          ================================================= */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Available"
              amount={
                balance.availableBalance
              }
              currency={
                currency
              }
              description="Available to request for payout"
              icon={
                WalletCards
              }
              featured
            />

            <StatCard
              title="Ledger balance"
              amount={
                balance.ledgerBalance
              }
              currency={
                currency
              }
              description="Merchant payable ledger balance"
              icon={
                Wallet
              }
            />

            <StatCard
              title="Reserved"
              amount={
                balance.reservedAmount
              }
              currency={
                currency
              }
              description="Pending and processing payouts"
              icon={
                Clock3
              }
            />

            <StatCard
              title="Paid out"
              amount={
                summary.completedAmount
              }
              currency={
                currency
              }
              description={`${summary.completed.toLocaleString()} completed payouts`}
              icon={
                CheckCircle2
              }
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <section className="mb-6 overflow-hidden rounded-[28px] bg-white/65 shadow-[0_12px_40px_rgba(109,40,217,0.045)] backdrop-blur dark:bg-slate-950/40">
            <div
              className="px-5 py-4 text-white"
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <Filter className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-black">
                    Payout filters
                  </h2>

                  <p className="mt-0.5 text-xs text-violet-100/75">
                    Search and refine merchant payout activity
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-12 xl:p-5">
              <div className="relative md:col-span-2 xl:col-span-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                <input
                  value={
                    searchInput
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Payout ID, destination or reference..."
                  className="merchant-text h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/[0.09]"
                />
              </div>

              <div className="xl:col-span-2">
                <PayoutDropdown
                  value={
                    status
                  }
                  options={
                    STATUS_OPTIONS
                  }
                  onChange={(
                    value,
                  ) => {
                    setStatus(
                      value as
                        | MerchantPayoutStatus
                        | "",
                    );

                    setPage(1);
                  }}
                />
              </div>

              <div className="xl:col-span-2">
                <PayoutDropdown
                  value={
                    method
                  }
                  options={
                    METHOD_OPTIONS
                  }
                  onChange={(
                    value,
                  ) => {
                    setMethod(
                      value as
                        | MerchantPayoutMethod
                        | "",
                    );

                    setPage(1);
                  }}
                />
              </div>

              <div className="xl:col-span-2">
                <input
                  type="date"
                  value={
                    from
                  }
                  max={
                    to ||
                    undefined
                  }
                  onChange={(
                    event,
                  ) => {
                    setFrom(
                      event.target.value,
                    );

                    setPage(1);
                  }}
                  className="merchant-text h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                />
              </div>

              <div className="xl:col-span-2">
                <input
                  type="date"
                  value={
                    to
                  }
                  min={
                    from ||
                    undefined
                  }
                  onChange={(
                    event,
                  ) => {
                    setTo(
                      event.target.value,
                    );

                    setPage(1);
                  }}
                  className="merchant-text h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                />
              </div>
            </div>

            {hasFilters ? (
              <div className="flex justify-end px-5 pb-5">
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500/[0.07] px-3 py-2 text-xs font-bold text-violet-600"
                >
                  <X className="h-3.5 w-3.5" />

                  Clear filters
                </button>
              </div>
            ) : null}
          </section>

          {/* =================================================
              PAYOUT LIST
          ================================================= */}

          <section className="overflow-hidden rounded-[28px] bg-white/65 shadow-[0_12px_38px_rgba(109,40,217,0.04)] backdrop-blur dark:bg-slate-950/40">
            <div
              className="px-5 py-4 text-white"
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black">
                    Payout activity
                  </h2>

                  <p className="mt-1 text-xs text-violet-100/75">
                    {loading
                      ? "Loading payout records..."
                      : `${total.toLocaleString()} payout records`}
                  </p>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  {summary.completed} completed
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="h-16 animate-pulse rounded-2xl bg-violet-500/[0.045]"
                    />
                  ),
                )}
              </div>
            ) : payouts.length ===
              0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                  <Send className="h-7 w-7" />
                </div>

                <h3 className="mt-4 font-black merchant-text">
                  No payouts found
                </h3>

                <p className="mt-2 text-sm merchant-muted">
                  Your payout requests will appear here.
                </p>

                <button
                  type="button"
                  onClick={
                    openPayoutModal
                  }
                  className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  Request payout
                </button>
              </div>
            ) : (
              <>
                {/* MOBILE */}

                <div className="space-y-3 p-4 xl:hidden">
                  {payouts.map(
                    (
                      payout,
                    ) => {
                      const meta =
                        statusMeta(
                          payout.status,
                        );

                      const StatusIcon =
                        meta.icon;

                      const MethodIcon =
                        methodIcon(
                          payout.payoutMethod,
                        );

                      return (
                        <Link
                          key={
                            payout.payoutId
                          }
                          href={`/dashboard/merchant/payouts/${encodeURIComponent(
                            payout.payoutId,
                          )}`}
                          className="block rounded-[22px] bg-violet-500/[0.035] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-mono text-xs font-black text-violet-600">
                                {
                                  payout.payoutId
                                }
                              </p>

                              <p className="mt-1 text-xs merchant-muted">
                                {formatCompactDate(
                                  payout.requestedAt,
                                )}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${meta.className}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />

                              {meta.label}
                            </span>
                          </div>

                          <p className="mt-4 whitespace-nowrap text-xl font-black merchant-text">
                            {formatMoney(
                              payout.netAmount,
                              payout.currency,
                            )}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                                <MethodIcon className="h-4 w-4" />
                              </span>

                              <span className="text-sm font-semibold merchant-text">
                                {methodLabel(
                                  payout.payoutMethod,
                                )}
                              </span>
                            </div>

                            <ArrowRight className="h-4 w-4 text-violet-600" />
                          </div>
                        </Link>
                      );
                    },
                  )}
                </div>

                {/* DESKTOP */}

                <div
                  className="
                    hidden
                    overflow-x-auto
                    scroll-smooth
                    xl:block

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="bg-violet-500/[0.03] text-left">
                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Payout
                        </th>

                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Amount
                        </th>

                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Method
                        </th>

                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Destination
                        </th>

                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Status
                        </th>

                        <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Requested
                        </th>

                        <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-wider merchant-muted">
                          View
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {payouts.map(
                        (
                          payout,
                        ) => {
                          const meta =
                            statusMeta(
                              payout.status,
                            );

                          const StatusIcon =
                            meta.icon;

                          const MethodIcon =
                            methodIcon(
                              payout.payoutMethod,
                            );

                          return (
                            <tr
                              key={
                                payout.payoutId
                              }
                              className="transition-colors hover:bg-violet-500/[0.035]"
                            >
                              <td className="px-5 py-4">
                                <Link
                                  href={`/dashboard/merchant/payouts/${encodeURIComponent(
                                    payout.payoutId,
                                  )}`}
                                  className="font-mono text-xs font-black merchant-text hover:text-violet-600"
                                >
                                  {shortId(
                                    payout.payoutId,
                                  )}
                                </Link>

                                <p className="mt-1 max-w-[180px] truncate text-xs merchant-muted">
                                  {payout.merchantReference ||
                                    "No reference"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-black merchant-text">
                                  {formatMoney(
                                    payout.netAmount,
                                    payout.currency,
                                  )}
                                </p>

                                {payout.feeAmount >
                                0 ? (
                                  <p className="mt-1 text-[11px] merchant-muted">
                                    Fee{" "}
                                    {formatMoney(
                                      payout.feeAmount,
                                      payout.currency,
                                    )}
                                  </p>
                                ) : null}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                                    <MethodIcon className="h-4 w-4" />
                                  </span>

                                  <span className="text-sm font-semibold merchant-text">
                                    {methodLabel(
                                      payout.payoutMethod,
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="max-w-[210px] truncate text-sm font-semibold merchant-text">
                                  {payout.destination ||
                                    payout.destinationReference ||
                                    "—"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${meta.className}`}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />

                                  {meta.label}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <p className="min-w-[150px] text-xs font-semibold merchant-text">
                                  {formatDate(
                                    payout.requestedAt,
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <Link
                                  href={`/dashboard/merchant/payouts/${encodeURIComponent(
                                    payout.payoutId,
                                  )}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.07] text-violet-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                <div className="flex flex-col gap-3 bg-violet-500/[0.018] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs merchant-muted">
                    {total === 0
                      ? "No records"
                      : `Showing ${visibleStart}-${visibleEnd} of ${total}`}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        !hasPreviousPage
                      }
                      onClick={() =>
                        setPage(
                          (
                            current,
                          ) =>
                            Math.max(
                              1,
                              current -
                                1,
                            ),
                        )
                      }
                      className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-500/[0.06] px-3 text-xs font-bold merchant-text disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" />

                      Previous
                    </button>

                    <span className="inline-flex h-9 items-center rounded-xl bg-violet-500/[0.1] px-3 text-xs font-black text-violet-600">
                      {page}
                      {" / "}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        !hasNextPage
                      }
                      onClick={() =>
                        setPage(
                          (
                            current,
                          ) =>
                            Math.min(
                              totalPages,
                              current +
                                1,
                            ),
                        )
                      }
                      className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-500/[0.06] px-3 text-xs font-bold merchant-text disabled:opacity-40"
                    >
                      Next

                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ===================================================
          CREATE PAYOUT MODAL
      ==================================================== */}

      <AnimatePresence>
        {payoutModalOpen ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            onMouseDown={() =>
              setPayoutModalOpen(
                false,
              )
            }
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 16,
                scale: 0.98,
              }}
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
              className="merchant-surface w-full max-w-xl overflow-hidden rounded-[28px] shadow-2xl"
            >
              <div
                className="px-5 py-5 text-white"
                style={{
                  background:
                    "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black">
                      Request payout
                    </h2>

                    <p className="mt-1 text-xs text-violet-100/80">
                      Available{" "}
                      {formatMoney(
                        balance.availableBalance,
                        balance.currency,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPayoutModalOpen(
                        false,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="text-xs font-bold merchant-muted">
                    Amount
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      form.amount
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          amount:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="0.00"
                    className="merchant-text mt-2 h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                  />
                </label>

                <div>
                  <p className="text-xs font-bold merchant-muted">
                    Payout method
                  </p>

                  <div className="mt-2">
                    <PayoutDropdown
                      value={
                        form.payoutMethod
                      }
                      options={
                        CREATE_METHOD_OPTIONS
                      }
                      onChange={(
                        value,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            payoutMethod:
                              value as MerchantPayoutMethod,
                          }),
                        )
                      }
                    />
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-bold merchant-muted">
                    Destination label
                  </span>

                  <input
                    value={
                      form.destination
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          destination:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Example: BRAC Bank ****1234"
                    className="merchant-text mt-2 h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold merchant-muted">
                    Destination reference
                    {form.payoutMethod !==
                    "wallet"
                      ? " *"
                      : ""}
                  </span>

                  <input
                    value={
                      form.destinationReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          destinationReference:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Account or destination reference"
                    className="merchant-text mt-2 h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold merchant-muted">
                    Merchant reference
                  </span>

                  <input
                    value={
                      form.merchantReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          merchantReference:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Optional internal reference"
                    className="merchant-text mt-2 h-12 w-full rounded-2xl border-0 bg-violet-500/[0.055] px-4 text-sm outline-none focus:ring-4 focus:ring-violet-500/[0.09]"
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPayoutModalOpen(
                        false,
                      )
                    }
                    className="h-11 flex-1 rounded-2xl bg-violet-500/[0.06] text-sm font-bold merchant-text"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      void submitPayout()
                    }
                    className="h-11 flex-1 rounded-2xl bg-violet-600 text-sm font-black text-white disabled:opacity-50"
                  >
                    {submitting
                      ? "Creating..."
                      : "Request payout"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}