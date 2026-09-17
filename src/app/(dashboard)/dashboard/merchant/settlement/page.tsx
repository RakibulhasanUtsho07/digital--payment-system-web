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
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Eye,
  Filter,
  RefreshCw,
  Search,
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
  getMerchantSettlements,
  type MerchantSettlement,
  type MerchantSettlementStatus,
  type MerchantSettlementSummary,
} from "@/lib/api/merchantSettlementApi";

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

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_LIMIT =
  20;

const EMPTY_SUMMARY:
  MerchantSettlementSummary = {
  total: 0,

  pending: 0,

  processing: 0,

  settled: 0,

  failed: 0,

  cancelled: 0,

  grossAmount: 0,

  feeAmount: 0,

  refundAmount: 0,

  netAmount: 0,
};

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "settled",
    label: "Settled",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount: number,
  currency: string
): string {
  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  return `${currency} ${safeAmount.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value:
    | string
    | null
    | undefined
): string {
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
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatCompactDate(
  value:
    | string
    | null
    | undefined
): string {
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
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatPeriod(
  start: string,
  end: string
): string {
  const startDate =
    new Date(start);

  const endDate =
    new Date(end);

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return "—";
  }

  return `${formatCompactDate(
    start
  )} – ${formatCompactDate(
    end
  )}`;
}

function shortId(
  value:
    | string
    | null
    | undefined,
  start = 11,
  end = 5
): string {
  if (!value) {
    return "—";
  }

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start
  )}...${value.slice(
    -end
  )}`;
}

function getStatusMeta(
  status:
    MerchantSettlementStatus
) {
  switch (status) {
    case "settled":
      return {
        label: "Settled",
        icon: CheckCircle2,
        className:
          "bg-emerald-500/10 text-emerald-600",
      };

    case "processing":
      return {
        label: "Processing",
        icon: RefreshCw,
        className:
          "bg-sky-500/10 text-sky-600",
      };

    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        className:
          "bg-rose-500/10 text-rose-600",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className:
          "bg-slate-500/10 text-slate-500",
      };

    default:
      return {
        label: "Pending",
        icon: Clock3,
        className:
          "bg-amber-500/10 text-amber-600",
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
          left-[25%]
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

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-y-[-35%]
          left-[-20%]
          w-[18%]
          rotate-[14deg]
          bg-white/[0.055]
          blur-xl
        "
        animate={{
          x: [
            "0%",
            "760%",
          ],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   CUSTOM DROPDOWN
========================================================= */

function SettlementDropdown({
  value,
  options,
  onChange,
}: {
  value: string;

  options:
    readonly DropdownOption[];

  onChange:
    (
      value: string
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
      null
    );

  const menuRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(
    () => {
      setMounted(true);
    },
    []
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

  const calculatePosition =
    useCallback(
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
              padding * 2
          );

        const left =
          Math.min(
            Math.max(
              padding,
              rect.left
            ),
            window.innerWidth -
              width -
              padding
          );

        if (
          below >= 180 ||
          below >= above
        ) {
          setPosition({
            left,
            width,

            top:
              rect.bottom +
              gap,

            maxHeight:
              Math.max(
                150,
                Math.min(
                  280,
                  below
                )
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
              150,
              Math.min(
                280,
                above
              )
            ),
        });
      },
      []
    );

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const onPointerDown =
        (
          event:
            PointerEvent
        ) => {
          const target =
            event.target as Node;

          if (
            triggerRef.current?.contains(
              target
            ) ||
            menuRef.current?.contains(
              target
            )
          ) {
            return;
          }

          setOpen(false);
        };

      const onKeyDown =
        (
          event:
            KeyboardEvent
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
        onPointerDown
      );

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      window.addEventListener(
        "scroll",
        close,
        true
      );

      window.addEventListener(
        "resize",
        close
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          onPointerDown
        );

        document.removeEventListener(
          "keydown",
          onKeyDown
        );

        window.removeEventListener(
          "scroll",
          close,
          true
        );

        window.removeEventListener(
          "resize",
          close
        );
      };
    },
    [
      open,
    ]
  );

  const menu =
    mounted &&
    open &&
    position
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={
                menuRef
              }
              initial={{
                opacity: 0,
                y: -5,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -5,
                scale: 0.985,
              }}
              transition={{
                duration: 0.16,
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

                zIndex: 30,
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
                  option
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
                      <span>
                        {
                          option.label
                        }
                      </span>

                      {active ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>
                  );
                }
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={
          triggerRef
        }
        type="button"
        aria-expanded={
          open
        }
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
          {
            selected?.label
          }
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
            shrink-0
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
   DATE INPUT
========================================================= */

function DateInput({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: string;

  min?: string;

  max?: string;

  label: string;

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <label className="block min-w-0">
      <span
        className="
          mb-1.5
          block
          px-1
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          merchant-muted
        "
      >
        {label}
      </span>

      <input
        type="date"
        value={
          value
        }
        min={
          min
        }
        max={
          max
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="
          merchant-text

          h-12
          w-full
          cursor-pointer
          rounded-2xl
          border-0
          bg-violet-500/[0.055]
          px-4
          text-sm
          font-semibold
          outline-none
          transition

          hover:bg-violet-500/[0.09]

          focus:ring-4
          focus:ring-violet-500/[0.09]

          [color-scheme:light]

          dark:bg-white/[0.045]
          dark:[color-scheme:dark]
        "
      />
    </label>
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
  featured = false,
  delay = 0,
}: {
  label: string;

  value: string;

  helper: string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;

  featured?: boolean;

  delay?: number;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay,
      }}
      whileHover={{
        y: -4,
      }}
      className={`
        relative
        min-w-0
        overflow-hidden
        rounded-[24px]
        p-5
        transition

        ${
          featured
            ? "text-white shadow-[0_16px_38px_rgba(109,40,217,0.16)]"
            : "bg-white/80 shadow-[0_10px_30px_rgba(109,40,217,0.04)] dark:bg-slate-950/50"
        }
      `}
      style={
        featured
          ? {
              background:
                "linear-gradient(135deg,#5B21B6 0%,#7C3AED 58%,#A855F7 100%)",
            }
          : undefined
      }
    >
      {featured ? (
        <motion.div
          className="
            pointer-events-none
            absolute
            -right-12
            -top-14
            h-36
            w-36
            rounded-full
            bg-white/10
            blur-2xl
          "
          animate={{
            scale: [
              1,
              1.12,
              1,
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
        />
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.14em] ${
              featured
                ? "text-violet-100/80"
                : "merchant-muted"
            }`}
          >
            {label}
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
          title={
            value
          }
          className={`
            mt-3
            whitespace-nowrap
            text-[clamp(1.05rem,1.6vw,1.65rem)]
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
          {value}
        </p>

        <p
          className={`mt-4 text-xs leading-5 ${
            featured
              ? "text-violet-100/75"
              : "merchant-muted"
          }`}
        >
          {helper}
        </p>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantSettlementPage() {
  const [
    settlements,
    setSettlements,
  ] =
    useState<
      MerchantSettlement[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      MerchantSettlementSummary
    >(
      EMPTY_SUMMARY
    );

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "BDT"
    );

  const [
    merchantName,
    setMerchantName,
  ] =
    useState(
      "Merchant"
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
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     FILTERS
  ======================================================== */

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
      MerchantSettlementStatus | ""
    >("");

  const [
    currencyFilter,
    setCurrencyFilter,
  ] =
    useState("");

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

  /* =======================================================
     PAGINATION
  ======================================================== */

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
    hasPreviousPage,
    setHasPreviousPage,
  ] =
    useState(false);

  const [
    hasNextPage,
    setHasNextPage,
  ] =
    useState(false);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================== */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setSearch(
              searchInput.trim()
            );

            setPage(1);
          },
          350
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      searchInput,
    ]
  );

  /* =======================================================
     LOAD
  ======================================================== */

  const loadSettlements =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            null
          );

          if (
            from &&
            to &&
            from > to
          ) {
            throw new Error(
              "From date cannot be later than To date."
            );
          }

          const response =
            await getMerchantSettlements({
              page,

              limit:
                DEFAULT_LIMIT,

              search:
                search ||
                undefined,

              status:
                status ||
                undefined,

              currency:
                currencyFilter.trim() ||
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
                "Unable to load settlements."
            );
          }

          const data =
            response.data;

          setSettlements(
            data.settlements ||
              []
          );

          setSummary(
            data.summary ||
              EMPTY_SUMMARY
          );

          setCurrency(
            data.merchant
              .defaultCurrency ||
              "BDT"
          );

          setMerchantName(
            data.merchant
              .businessDisplayName ||
              data.merchant
                .businessName ||
              "Merchant"
          );

          setPage(
            data.pagination.page
          );

          setTotalPages(
            Math.max(
              1,
              data.pagination
                .totalPages
            )
          );

          setTotal(
            data.pagination.total
          );

          setHasPreviousPage(
            data.pagination
              .hasPreviousPage
          );

          setHasNextPage(
            data.pagination
              .hasNextPage
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load settlements."
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
        currencyFilter,
        from,
        page,
        search,
        status,
        to,
      ]
    );

  useEffect(
    () => {
      void loadSettlements();
    },
    [
      loadSettlements,
    ]
  );

  /* =======================================================
     DERIVED
  ======================================================== */

  const hasFilters =
    Boolean(
      search ||
      status ||
      currencyFilter ||
      from ||
      to
    );

  const clearFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatus("");
      setCurrencyFilter("");
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
      total
    );

  const stats =
    useMemo(
      () => [
        {
          label:
            "Net Settled",

          value:
            formatMoney(
              summary.netAmount,
              currency
            ),

          helper:
            `${summary.settled.toLocaleString()} settled records`,

          icon:
            DollarSign,
        },

        {
          label:
            "Gross Volume",

          value:
            formatMoney(
              summary.grossAmount,
              currency
            ),

          helper:
            "Gross payment value included",

          icon:
            CalendarRange,
        },

        {
          label:
            "Refunds",

          value:
            formatMoney(
              summary.refundAmount,
              currency
            ),

          helper:
            "Refunds reconciled",

          icon:
            RefreshCw,
        },

        {
          label:
            "Open Settlements",

          value:
            String(
              summary.pending +
                summary.processing
            ),

          helper:
            `${summary.pending} pending · ${summary.processing} processing`,

          icon:
            Clock3,
        },
      ],
      [
        currency,
        summary,
      ]
    );

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <main
      className="
        merchant-theme
        relative
        z-0
        isolate
        min-h-full
      "
    >
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
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
              <div
                className="
                  flex
                  flex-col
                  gap-6

                  lg:flex-row
                  lg:items-center
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
                      text-[11px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-violet-100
                    "
                  >
                    <CalendarRange className="h-3.5 w-3.5" />

                    Settlement finance
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
                    Settlement
                  </h1>

                  <p
                    className="
                      mt-2
                      max-w-2xl
                      text-sm
                      leading-6
                      text-violet-100/85
                    "
                  >
                    Track payment volume, fees, refunds, adjustments
                    and merchant net settlement activity for{" "}

                    <span className="font-bold text-white">
                      {merchantName}
                    </span>
                    .
                  </p>
                </div>

                <motion.button
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  type="button"
                  disabled={
                    refreshing
                  }
                  onClick={() =>
                    void loadSettlements(
                      true
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    w-fit
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-bold
                    text-white
                    backdrop-blur
                    transition

                    hover:bg-white/15

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </motion.button>
              </div>

              <div
                className="
                  mt-6
                  grid
                  gap-3

                  sm:grid-cols-3
                "
              >
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/65">
                    Net settled
                  </p>

                  <p className="mt-1 whitespace-nowrap text-lg font-black tabular-nums">
                    {formatMoney(
                      summary.netAmount,
                      currency
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/65">
                    Refunds
                  </p>

                  <p className="mt-1 whitespace-nowrap text-lg font-black tabular-nums">
                    {formatMoney(
                      summary.refundAmount,
                      currency
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/65">
                    Settled records
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {
                      summary.settled
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section
            className="
              mb-6
              grid
              gap-4

              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {stats.map(
              (
                stat,
                index
              ) => (
                <StatCard
                  key={
                    stat.label
                  }
                  label={
                    stat.label
                  }
                  value={
                    stat.value
                  }
                  helper={
                    stat.helper
                  }
                  icon={
                    stat.icon
                  }
                  featured={
                    index === 0
                  }
                  delay={
                    0.04 +
                    index *
                      0.05
                  }
                />
              )
            )}
          </section>

          {/* =================================================
              FILTERS
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.46,
              delay: 0.1,
            }}
            className="
              mb-6
              overflow-hidden
              rounded-[28px]
              bg-white/65
              shadow-[0_12px_40px_rgba(109,40,217,0.045)]
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
              <motion.div
                className="
                  pointer-events-none
                  absolute
                  -right-14
                  -top-16
                  h-36
                  w-36
                  rounded-full
                  bg-white/10
                  blur-2xl
                "
                animate={{
                  scale: [
                    1,
                    1.12,
                    1,
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
              />

              <div
                className="
                  relative
                  flex
                  flex-col
                  gap-3

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/15
                      bg-white/10
                    "
                  >
                    <Filter className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-sm font-black sm:text-base">
                      Settlement filters
                    </h2>

                    <p className="mt-0.5 text-xs text-violet-100/75">
                      Search and refine merchant settlement history
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-violet-100">
                  {total === 0
                    ? "0 results"
                    : `${visibleStart}-${visibleEnd} of ${total}`}
                </span>
              </div>
            </div>

            <div
              className="
                grid
                gap-4
                p-4

                md:grid-cols-2

                xl:grid-cols-12
                xl:p-5
              "
            >
              {/* SEARCH */}

              <div className="relative md:col-span-2 xl:col-span-4">
                <label
                  className="
                    mb-1.5
                    block
                    px-1
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    merchant-muted
                  "
                >
                  Search
                </label>

                <div className="relative">
                  <Search
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-violet-500
                    "
                  />

                  <input
                    type="text"
                    value={
                      searchInput
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchInput(
                        event.target.value
                      )
                    }
                    placeholder="Settlement ID, payout ID..."
                    className="
                      merchant-text

                      h-12
                      w-full
                      rounded-2xl
                      border-0
                      bg-violet-500/[0.055]
                      pl-11
                      pr-10
                      text-sm
                      outline-none
                      transition

                      placeholder:text-slate-400

                      hover:bg-violet-500/[0.085]

                      focus:ring-4
                      focus:ring-violet-500/[0.09]

                      dark:bg-white/[0.045]
                    "
                  />

                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        setPage(1);
                      }}
                      className="
                        absolute
                        right-3
                        top-1/2
                        flex
                        h-7
                        w-7
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400

                        hover:bg-violet-500/10
                        hover:text-violet-600
                      "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* STATUS */}

              <div className="xl:col-span-2">
                <label className="mb-1.5 block px-1 text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
                  Status
                </label>

                <SettlementDropdown
                  value={
                    status
                  }
                  options={
                    STATUS_OPTIONS
                  }
                  onChange={(
                    value
                  ) => {
                    setStatus(
                      value as
                        | MerchantSettlementStatus
                        | ""
                    );

                    setPage(1);
                  }}
                />
              </div>

              {/* CURRENCY */}

              <div className="xl:col-span-2">
                <label className="mb-1.5 block px-1 text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
                  Currency
                </label>

                <input
                  type="text"
                  value={
                    currencyFilter
                  }
                  maxLength={
                    3
                  }
                  onChange={(
                    event
                  ) => {
                    setCurrencyFilter(
                      event.target.value
                        .replace(
                          /[^a-z]/gi,
                          ""
                        )
                        .slice(
                          0,
                          3
                        )
                        .toUpperCase()
                    );

                    setPage(1);
                  }}
                  placeholder="BDT"
                  className="
                    merchant-text

                    h-12
                    w-full
                    rounded-2xl
                    border-0
                    bg-violet-500/[0.055]
                    px-4
                    text-sm
                    font-bold
                    uppercase
                    outline-none
                    transition

                    placeholder:text-slate-400

                    hover:bg-violet-500/[0.085]

                    focus:ring-4
                    focus:ring-violet-500/[0.09]

                    dark:bg-white/[0.045]
                  "
                />
              </div>

              {/* FROM */}

              <div className="xl:col-span-2">
                <DateInput
                  label="From date"
                  value={
                    from
                  }
                  max={
                    to ||
                    undefined
                  }
                  onChange={(
                    value
                  ) => {
                    setFrom(
                      value
                    );

                    setPage(1);
                  }}
                />
              </div>

              {/* TO */}

              <div className="xl:col-span-2">
                <DateInput
                  label="To date"
                  value={
                    to
                  }
                  min={
                    from ||
                    undefined
                  }
                  onChange={(
                    value
                  ) => {
                    setTo(
                      value
                    );

                    setPage(1);
                  }}
                />
              </div>
            </div>

            {hasFilters ? (
              <div className="flex justify-end px-4 pb-4 xl:px-5 xl:pb-5">
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-violet-500/[0.065]
                    px-3
                    py-2
                    text-xs
                    font-bold
                    text-violet-600
                    transition

                    hover:bg-violet-500/[0.12]
                  "
                >
                  <X className="h-3.5 w-3.5" />

                  Clear filters
                </button>
              </div>
            ) : null}
          </motion.section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <section
              className="
                mb-6
                flex
                flex-col
                gap-3
                rounded-2xl
                bg-rose-500/[0.065]
                p-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                <div>
                  <p className="text-sm font-black merchant-text">
                    Unable to load settlements
                  </p>

                  <p className="mt-1 text-sm text-rose-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadSettlements(
                    true
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-rose-500/10
                  px-4
                  py-2
                  text-sm
                  font-bold
                  text-rose-600
                "
              >
                <RefreshCw className="h-4 w-4" />

                Try again
              </button>
            </section>
          ) : null}

          {/* =================================================
              HISTORY
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.46,
              delay: 0.16,
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
              <div
                className="
                  relative
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <h2 className="text-sm font-black sm:text-base">
                    Settlement history
                  </h2>

                  <p className="mt-1 text-xs text-violet-100/75">
                    {loading
                      ? "Loading settlement records..."
                      : `${total.toLocaleString()} settlements found`}
                  </p>
                </div>

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white/10
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                  "
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />

                  {
                    summary.settled
                  }{" "}
                  settled
                </span>
              </div>
            </div>

            {loading &&
            settlements.length ===
              0 ? (
              <div className="space-y-3 p-5">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <motion.div
                      key={
                        index
                      }
                      animate={{
                        opacity: [
                          0.35,
                          0.75,
                          0.35,
                        ],
                      }}
                      transition={{
                        duration: 1.4,
                        delay:
                          index *
                          0.05,
                        repeat: Infinity,
                      }}
                      className="h-16 rounded-2xl bg-violet-500/[0.045]"
                    />
                  )
                )}
              </div>
            ) : settlements.length ===
              0 ? (
              <div
                className="
                  flex
                  min-h-[330px]
                  flex-col
                  items-center
                  justify-center
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    bg-violet-500/10
                    text-violet-600
                  "
                >
                  <CalendarRange className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-lg font-black merchant-text">
                  No settlements found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
                  There are no settlement records matching your current
                  filters.
                </p>
              </div>
            ) : (
              <>
                {/* MOBILE */}

                <div className="space-y-3 p-4 xl:hidden">
                  {settlements.map(
                    (
                      settlement,
                      index
                    ) => {
                      const meta =
                        getStatusMeta(
                          settlement.status
                        );

                      const StatusIcon =
                        meta.icon;

                      return (
                        <motion.div
                          key={
                            settlement.settlementId
                          }
                          initial={{
                            opacity: 0,
                            y: 7,
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
                          className="
                            rounded-[22px]
                            bg-violet-500/[0.035]
                            p-4
                          "
                        >
                          <Link
                            href={`/dashboard/merchant/settlement/${encodeURIComponent(
                              settlement.settlementId
                            )}`}
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-xs font-black text-violet-600">
                                  {
                                    settlement.settlementId
                                  }
                                </p>

                                <p className="mt-1 text-xs merchant-muted">
                                  {formatPeriod(
                                    settlement.periodStart,
                                    settlement.periodEnd
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
                                  px-2.5
                                  py-1.5
                                  text-xs
                                  font-bold

                                  ${meta.className}
                                `}
                              >
                                <StatusIcon
                                  className={`h-3.5 w-3.5 ${
                                    settlement.status ===
                                    "processing"
                                      ? "animate-spin"
                                      : ""
                                  }`}
                                />

                                {
                                  meta.label
                                }
                              </span>
                            </div>

                            <div
                              className="
                                mt-4
                                grid
                                gap-3

                                sm:grid-cols-2
                              "
                            >
                              <div className="rounded-2xl bg-violet-500/[0.04] p-3">
                                <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
                                  Gross
                                </p>

                                <p className="mt-1 whitespace-nowrap text-sm font-black merchant-text">
                                  {formatMoney(
                                    settlement.grossAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-violet-500/[0.04] p-3">
                                <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
                                  Net
                                </p>

                                <p className="mt-1 whitespace-nowrap text-sm font-black merchant-text">
                                  {formatMoney(
                                    settlement.netAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className="text-xs merchant-muted">
                                {
                                  settlement.paymentCount
                                }{" "}
                                payments
                              </span>

                              <span className="inline-flex items-center gap-1 text-xs font-black text-violet-600">
                                View details

                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    }
                  )}
                </div>

                {/* DESKTOP */}

                <div
                  className="
                    hidden
                    overflow-x-auto
                    scroll-smooth
                    overscroll-x-contain

                    xl:block

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  <table className="w-full min-w-[1250px]">
                    <thead>
                      <tr className="bg-violet-500/[0.03] text-left">
                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Settlement
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Period
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Payments
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Gross
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Fees
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Refunds
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Net
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Status
                        </th>

                        <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider merchant-muted">
                          View
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {settlements.map(
                        (
                          settlement,
                          index
                        ) => {
                          const meta =
                            getStatusMeta(
                              settlement.status
                            );

                          const StatusIcon =
                            meta.icon;

                          return (
                            <motion.tr
                              key={
                                settlement.settlementId
                              }
                              initial={{
                                opacity: 0,
                                y: 5,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              transition={{
                                delay:
                                  index *
                                  0.02,
                              }}
                              className="transition-colors hover:bg-violet-500/[0.035]"
                            >
                              <td className="px-5 py-4">
                                <Link
                                  href={`/dashboard/merchant/settlement/${encodeURIComponent(
                                    settlement.settlementId
                                  )}`}
                                  className="font-mono text-xs font-black merchant-text transition hover:text-violet-600"
                                >
                                  {shortId(
                                    settlement.settlementId
                                  )}
                                </Link>

                                <p className="mt-1 text-[11px] merchant-muted">
                                  {settlement.payoutId
                                    ? `Payout ${shortId(
                                        settlement.payoutId,
                                        8,
                                        4
                                      )}`
                                    : "No payout linked"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="min-w-[180px] text-sm font-semibold merchant-text">
                                  {formatPeriod(
                                    settlement.periodStart,
                                    settlement.periodEnd
                                  )}
                                </p>

                                <p className="mt-1 text-[11px] merchant-muted">
                                  Created{" "}
                                  {formatCompactDate(
                                    settlement.createdAt
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-xl bg-violet-500/[0.07] px-2.5 py-1.5 text-xs font-black text-violet-600">
                                  {
                                    settlement.paymentCount
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-black merchant-text tabular-nums">
                                  {formatMoney(
                                    settlement.grossAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-semibold merchant-text tabular-nums">
                                  {formatMoney(
                                    settlement.feeAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-bold text-rose-600 tabular-nums">
                                  {formatMoney(
                                    settlement.refundAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-black merchant-text tabular-nums">
                                  {formatMoney(
                                    settlement.netAmount,
                                    settlement.currency
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-full
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    font-bold

                                    ${meta.className}
                                  `}
                                >
                                  <StatusIcon
                                    className={`h-3.5 w-3.5 ${
                                      settlement.status ===
                                      "processing"
                                        ? "animate-spin"
                                        : ""
                                    }`}
                                  />

                                  {
                                    meta.label
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <Link
                                  href={`/dashboard/merchant/settlement/${encodeURIComponent(
                                    settlement.settlementId
                                  )}`}
                                  className="
                                    inline-flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-500/[0.07]
                                    text-violet-600
                                    transition

                                    hover:bg-violet-500/[0.12]
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

                {/* PAGINATION */}

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    bg-violet-500/[0.018]
                    px-5
                    py-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
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
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1.5
                        rounded-xl
                        bg-violet-500/[0.055]
                        px-3
                        text-xs
                        font-bold
                        merchant-text

                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />

                      Previous
                    </button>

                    <span
                      className="
                        inline-flex
                        h-9
                        items-center
                        rounded-xl
                        bg-violet-500/[0.1]
                        px-3
                        text-xs
                        font-black
                        text-violet-600
                      "
                    >
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
                            current
                          ) =>
                            Math.min(
                              totalPages,
                              current +
                                1
                            )
                        )
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1.5
                        rounded-xl
                        bg-violet-500/[0.055]
                        px-3
                        text-xs
                        font-bold
                        merchant-text

                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      Next

                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.section>
        </div>
      </div>
    </main>
  );
}