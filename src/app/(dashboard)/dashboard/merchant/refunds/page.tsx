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
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  Receipt,
  RefreshCcw,
  RotateCcw,
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
  getMerchantRefunds,
  type MerchantRefund,
  type MerchantRefundMode,
  type MerchantRefundStatus,
} from "@/lib/api/merchantRefundApi";

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

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS = [
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
    value: "failed",
    label: "Failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
] as const;

const MODE_OPTIONS = [
  {
    value: "",
    label: "All modes",
  },
  {
    value: "live",
    label: "Live",
  },
  {
    value: "test",
    label: "Test",
  },
] as const;

/* =========================================================
   ANIMATION
========================================================= */

const heroContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.55,

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
  amount: string,
  currency: string,
): string {
  const value =
    Number(amount);

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )
      .format(
        Number.isFinite(value)
          ? value
          : 0,
      )
      .replace(
        /\u00A0/g,
        " ",
      );
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatCompactDate(
  value?: string,
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
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function shortId(
  value:
    | string
    | null
    | undefined,

  start = 10,
  end = 5,
): string {
  if (!value) {
    return "—";
  }

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

function getMoneyTextClass(
  value: string,
): string {
  const length =
    value.length;

  if (
    length >= 22
  ) {
    return "text-base sm:text-lg";
  }

  if (
    length >= 18
  ) {
    return "text-lg sm:text-xl";
  }

  if (
    length >= 14
  ) {
    return "text-xl sm:text-[1.4rem]";
  }

  return "text-2xl";
}

function statusMeta(
  status:
    MerchantRefundStatus,
) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "merchant-status-success",
      };

    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        className:
          "merchant-status-danger",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className:
          "merchant-status-danger",
      };

    default:
      return {
        label: "Pending",
        icon: Clock3,
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
          left-[26%]
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
   DROPDOWN
========================================================= */

function FilterDropdown({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;

  onChange:
    (
      value:
        string,
    ) => void;

  options:
    readonly DropdownOption[];

  ariaLabel: string;
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

  const updatePosition =
    useCallback(
      () => {
        const trigger =
          triggerRef.current;

        if (!trigger) {
          return;
        }

        const rect =
          trigger.getBoundingClientRect();

        const gap = 8;
        const padding = 12;

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

        const openBelow =
          below >= 180 ||
          below >= above;

        if (
          openBelow
        ) {
          setPosition({
            left,
            width,

            top:
              rect.bottom +
              gap,

            maxHeight:
              Math.max(
                145,

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
              145,

              Math.min(
                260,
                above,
              ),
            ),
        });
      },
      [],
    );

  const toggleOpen =
    () => {
      if (open) {
        setOpen(false);
        return;
      }

      updatePosition();
      setOpen(true);
    };

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const handlePointer =
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

      const handleKey =
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
        handlePointer,
      );

      document.addEventListener(
        "keydown",
        handleKey,
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
          handlePointer,
        );

        document.removeEventListener(
          "keydown",
          handleKey,
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

                /*
                 * Dashboard navbar should remain
                 * above this menu.
                 */
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
                      <span>
                        {option.label}
                      </span>

                      {active ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>
                  );
                },
              )}
            </motion.div>
          </AnimatePresence>,

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
        aria-label={
          ariaLabel
        }
        aria-expanded={
          open
        }
        onClick={
          toggleOpen
        }
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
          text-left
          text-sm
          font-semibold
          outline-none
          transition

          hover:bg-violet-500/[0.09]

          focus-visible:ring-4
          focus-visible:ring-violet-500/[0.09]

          dark:bg-white/[0.045]
          dark:hover:bg-white/[0.07]
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
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon:
    Icon,
  featured = false,
  delay = 0,
}: {
  label: string;
  value: string;
  description: string;

  icon:
    React.ComponentType<{
      className?:
        string;
    }>;

  featured?: boolean;
  delay?: number;
}) {
  const textClass =
    getMoneyTextClass(
      value,
    );

  if (
    featured
  ) {
    return (
      <motion.article
        initial={{
          opacity: 0,
          y: 16,
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
        className="
          relative
          min-w-0
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

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-100/85">
              {label}
            </p>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <Icon className="h-5 w-5" />
            </div>
          </div>

          <p
            title={
              value
            }
            className={`
              mt-2
              whitespace-nowrap
              font-black
              leading-none
              tracking-[-0.035em]
              tabular-nums

              ${textClass}
            `}
          >
            {value}
          </p>

          <p className="mt-4 text-xs leading-5 text-violet-100/80">
            {description}
          </p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 16,
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
      className="
        min-w-0
        rounded-[24px]
        bg-white/80
        p-5
        shadow-[0_10px_30px_rgba(109,40,217,0.04)]
        transition

        hover:bg-white
        hover:shadow-[0_14px_35px_rgba(109,40,217,0.07)]

        dark:bg-slate-950/50
        dark:hover:bg-slate-950/65
      "
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] merchant-muted">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/[0.08] text-violet-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p
        title={
          value
        }
        className={`
          mt-2
          whitespace-nowrap
          font-black
          leading-none
          tracking-[-0.035em]
          merchant-text
          tabular-nums

          ${textClass}
        `}
      >
        {value}
      </p>

      <p className="mt-4 text-xs leading-5 merchant-muted">
        {description}
      </p>
    </motion.article>
  );
}

/* =========================================================
   MOBILE REFUND CARD
========================================================= */

function RefundCard({
  refund,
}: {
  refund:
    MerchantRefund;
}) {
  const meta =
    statusMeta(
      refund.status,
    );

  const Icon =
    meta.icon;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      className="
        rounded-[22px]
        bg-violet-500/[0.035]
        p-4
        transition

        hover:bg-violet-500/[0.055]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/merchant/refunds/${encodeURIComponent(
              refund.refundId,
            )}`}
            className="font-mono text-xs font-black text-violet-600"
          >
            {shortId(
              refund.refundId,
            )}
          </Link>

          <p className="mt-1 truncate text-xs merchant-muted">
            {refund.merchantReference ||
              "No merchant reference"}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${meta.className}`}
        >
          <Icon className="h-3.5 w-3.5" />

          {meta.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-violet-500/[0.045] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
          Refunded amount
        </p>

        <p className="mt-1 whitespace-nowrap text-lg font-black tracking-tight merchant-text tabular-nums">
          {formatMoney(
            refund.amount,
            refund.currency,
          )}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-violet-500/[0.035] p-3">
          <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
            Mode
          </p>

          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
              refund.mode ===
              "live"
                ? "merchant-mode-live"
                : "merchant-mode-test"
            }`}
          >
            {refund.mode}
          </span>
        </div>

        <div className="rounded-2xl bg-violet-500/[0.035] p-3">
          <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
            Created
          </p>

          <p className="mt-2 text-xs font-bold merchant-text">
            {formatCompactDate(
              refund.createdAt,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/dashboard/merchant/payments/${encodeURIComponent(
            refund.paymentId,
          )}`}
          className="min-w-0 truncate font-mono text-xs font-semibold text-violet-600"
        >
          {shortId(
            refund.paymentId,
          )}
        </Link>

        <Link
          href={`/dashboard/merchant/refunds/${encodeURIComponent(
            refund.refundId,
          )}`}
          className="
            inline-flex
            shrink-0
            items-center
            gap-1.5
            rounded-xl
            bg-violet-500/[0.07]
            px-3
            py-2
            text-xs
            font-bold
            merchant-text
            transition

            hover:bg-violet-500/[0.12]
            hover:text-violet-600
          "
        >
          View

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantRefundsPage() {
  const [
    refunds,
    setRefunds,
  ] =
    useState<
      MerchantRefund[]
    >([]);

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
      MerchantRefundStatus | ""
    >("");

  const [
    mode,
    setMode,
  ] =
    useState<
      MerchantRefundMode | ""
    >("");

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

  /* =======================================================
     DATA
  ======================================================== */

  const loadRefunds =
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
            await getMerchantRefunds({
              search:
                search ||
                undefined,

              status:
                status ||
                undefined,

              mode:
                mode ||
                undefined,

              page,

              limit:
                DEFAULT_LIMIT,
            });

          setRefunds(
            response.refunds,
          );

          setTotal(
            response.pagination.total,
          );

          setTotalPages(
            Math.max(
              response.pagination
                .totalPages,

              1,
            ),
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load refunds.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        mode,
        page,
        search,
        status,
      ],
    );

  useEffect(
    () => {
      void loadRefunds();
    },
    [
      loadRefunds,
    ],
  );

  /* =======================================================
     SEARCH DEBOUNCE
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

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      searchInput,
    ],
  );

  /* =======================================================
     SUMMARY
  ======================================================== */

  const completedRefunds =
    useMemo(
      () =>
        refunds.filter(
          (
            refund,
          ) =>
            refund.status ===
            "completed",
        ),
      [
        refunds,
      ],
    );

  const visibleAmount =
    useMemo(
      () =>
        completedRefunds.reduce(
          (
            totalAmount,
            refund,
          ) =>
            totalAmount +
            Number(
              refund.amount,
            ),
          0,
        ),
      [
        completedRefunds,
      ],
    );

  const pendingVisible =
    useMemo(
      () =>
        refunds.filter(
          (
            refund,
          ) =>
            refund.status ===
            "pending",
        ).length,
      [
        refunds,
      ],
    );

  const summaryCurrency =
    refunds[0]?.currency ||
    "BDT";

  const completedAmountText =
    formatMoney(
      String(
        visibleAmount,
      ),
      summaryCurrency,
    );

  const hasFilters =
    Boolean(
      search ||
      status ||
      mode,
    );

  const clearFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatus("");
      setMode("");
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

  return (
    /*
     * No secondary full-page background.
     * Dashboard background is used directly.
     */
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          {/* =================================================
              HERO
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
                  <motion.div
                    variants={
                      heroItem
                    }
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
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-violet-100
                      backdrop-blur
                    "
                  >
                    <RotateCcw className="h-3.5 w-3.5" />

                    Finance operations
                  </motion.div>

                  <motion.h1
                    variants={
                      heroItem
                    }
                    className="mt-4 text-2xl font-black tracking-tight sm:text-3xl"
                  >
                    Refunds
                  </motion.h1>

                  <motion.p
                    variants={
                      heroItem
                    }
                    className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/85"
                  >
                    Review completed, pending, failed and cancelled customer
                    refunds associated with merchant payments.
                  </motion.p>
                </div>

                <motion.button
                  variants={
                    heroItem
                  }
                  whileHover={{
                    y: -2,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  type="button"
                  onClick={() =>
                    void loadRefunds(
                      true,
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
                    self-start
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
                  <RefreshCcw
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

              <motion.div
                variants={
                  heroItem
                }
                className="mt-6 grid gap-3 sm:grid-cols-3"
              >
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Total refunds
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {total.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Visible records
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {refunds.length.toLocaleString()}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Pending visible
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {pendingVisible.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total refunds"
              value={
                total.toLocaleString()
              }
              description="All merchant refund records"
              icon={
                Receipt
              }
              featured
              delay={
                0.03
              }
            />

            <StatCard
              label="Visible records"
              value={
                refunds.length.toLocaleString()
              }
              description={`Page ${page} of ${totalPages}`}
              icon={
                WalletCards
              }
              delay={
                0.08
              }
            />

            <StatCard
              label="Completed amount"
              value={
                completedAmountText
              }
              description="Completed refunds on the current page"
              icon={
                CheckCircle2
              }
              delay={
                0.13
              }
            />
          </div>

          {/* =================================================
              PURPLE SECTION 2 — FILTERS
          ================================================= */}

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
              duration: 0.48,
              delay: 0.1,
            }}
            className="
              relative
              z-0
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
              className="relative overflow-hidden px-5 py-4 text-white"
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <motion.div
                className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-white/10 blur-2xl"
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

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{
                      rotate: 6,
                      scale: 1.06,
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10"
                  >
                    <Filter className="h-4 w-4" />
                  </motion.div>

                  <div>
                    <h2 className="text-sm font-black sm:text-base">
                      Refund filters
                    </h2>

                    <p className="mt-0.5 text-xs text-violet-100/75">
                      Search and refine merchant refund activity
                    </p>
                  </div>
                </div>

                <p className="text-xs font-bold text-violet-100">
                  {total === 0
                    ? "0 results"
                    : `${visibleStart}-${visibleEnd} of ${total}`}
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-12 xl:gap-4 xl:p-5">
              {/* SEARCH */}

              <div className="relative md:col-span-2 xl:col-span-6">
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
                  value={
                    searchInput
                  }
                  onChange={(
                    event,
                  ) => {
                    setSearchInput(
                      event.target.value,
                    );
                  }}
                  placeholder="Search refund ID, payment ID or reference..."
                  className="
                    merchant-text

                    h-12
                    w-full
                    rounded-2xl
                    border-0
                    bg-violet-500/[0.055]
                    pl-11
                    pr-11
                    text-sm
                    font-medium
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
                      transition

                      hover:bg-violet-500/10
                      hover:text-violet-600
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* STATUS */}

              <div className="xl:col-span-3">
                <FilterDropdown
                  ariaLabel="Refund status"
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
                        | MerchantRefundStatus
                        | "",
                    );

                    setPage(1);
                  }}
                />
              </div>

              {/* MODE */}

              <div className="xl:col-span-3">
                <FilterDropdown
                  ariaLabel="Refund mode"
                  value={
                    mode
                  }
                  options={
                    MODE_OPTIONS
                  }
                  onChange={(
                    value,
                  ) => {
                    setMode(
                      value as
                        | MerchantRefundMode
                        | "",
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
                    merchant-text
                    transition

                    hover:bg-violet-500/[0.11]
                    hover:text-violet-600
                  "
                >
                  <X className="h-3.5 w-3.5" />

                  Clear filters
                </button>
              </div>
            ) : null}
          </motion.section>

          {/* ERROR */}

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-500/[0.055] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

              <div>
                <p className="text-sm font-bold merchant-text">
                  Unable to load refunds
                </p>

                <p className="mt-1 text-sm merchant-danger">
                  {error}
                </p>
              </div>
            </div>
          ) : null}

          {/* =================================================
              PURPLE SECTION 3 — REFUND ACTIVITY
          ================================================= */}

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
              duration: 0.48,
              delay: 0.16,
            }}
            className="
              relative
              z-0
              overflow-hidden
              rounded-[28px]
              bg-white/65
              shadow-[0_12px_38px_rgba(109,40,217,0.04)]
              backdrop-blur

              dark:bg-slate-950/40
            "
          >
            <div
              className="relative overflow-hidden px-5 py-4 text-white"
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <Receipt className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-sm font-black sm:text-base">
                      Refund activity
                    </h2>

                    <p className="mt-0.5 text-xs text-violet-100/75">
                      Merchant refund records and linked payments
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100">
                  <RotateCcw className="h-3.5 w-3.5" />

                  {total.toLocaleString()} refunds
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
                          0.06,
                        repeat: Infinity,
                      }}
                      className="h-16 rounded-2xl bg-violet-500/[0.045]"
                    />
                  ),
                )}
              </div>
            ) : refunds.length ===
              0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                  <RefreshCcw className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-base font-black merchant-text">
                  No refunds found
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
                  Refunds issued from completed wallet payments will appear
                  here.
                </p>

                {hasFilters ? (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="mt-5 rounded-xl bg-violet-500/[0.07] px-4 py-2.5 text-sm font-bold text-violet-600"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {/* MOBILE / TABLET */}

                <div className="space-y-3 p-4 xl:hidden">
                  {refunds.map(
                    (
                      refund,
                    ) => (
                      <RefundCard
                        key={
                          refund.refundId
                        }
                        refund={
                          refund
                        }
                      />
                    ),
                  )}
                </div>

                {/* DESKTOP TABLE */}

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
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="bg-violet-500/[0.03]">
                        <TableHeading>
                          Refund
                        </TableHeading>

                        <TableHeading>
                          Payment
                        </TableHeading>

                        <TableHeading>
                          Amount
                        </TableHeading>

                        <TableHeading>
                          Mode
                        </TableHeading>

                        <TableHeading>
                          Status
                        </TableHeading>

                        <TableHeading>
                          Created
                        </TableHeading>

                        <TableHeading align="right">
                          Action
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody>
                      {refunds.map(
                        (
                          refund,
                          index,
                        ) => {
                          const meta =
                            statusMeta(
                              refund.status,
                            );

                          const Icon =
                            meta.icon;

                          return (
                            <motion.tr
                              key={
                                refund.refundId
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
                                duration: 0.26,
                                delay:
                                  index *
                                  0.025,
                              }}
                              className="
                                transition-colors

                                hover:bg-violet-500/[0.035]
                              "
                            >
                              <TableCell>
                                <div className="min-w-[170px]">
                                  <Link
                                    href={`/dashboard/merchant/refunds/${encodeURIComponent(
                                      refund.refundId,
                                    )}`}
                                    className="font-mono text-xs font-black merchant-text transition hover:text-violet-600"
                                  >
                                    {shortId(
                                      refund.refundId,
                                    )}
                                  </Link>

                                  <p className="mt-1 max-w-[190px] truncate text-xs merchant-muted">
                                    {refund.merchantReference ||
                                      "No reference"}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Link
                                  href={`/dashboard/merchant/payments/${encodeURIComponent(
                                    refund.paymentId,
                                  )}`}
                                  className="font-mono text-xs font-bold text-violet-600"
                                >
                                  {shortId(
                                    refund.paymentId,
                                  )}
                                </Link>
                              </TableCell>

                              <TableCell>
                                <p className="whitespace-nowrap text-sm font-black merchant-text tabular-nums">
                                  {formatMoney(
                                    refund.amount,
                                    refund.currency,
                                  )}
                                </p>
                              </TableCell>

                              <TableCell>
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-bold ${
                                    refund.mode ===
                                    "live"
                                      ? "merchant-mode-live"
                                      : "merchant-mode-test"
                                  }`}
                                >
                                  {refund.mode}
                                </span>
                              </TableCell>

                              <TableCell>
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold ${meta.className}`}
                                >
                                  <Icon className="h-3.5 w-3.5" />

                                  {meta.label}
                                </span>
                              </TableCell>

                              <TableCell>
                                <div className="min-w-[150px]">
                                  <p className="text-xs font-semibold merchant-text">
                                    {formatCompactDate(
                                      refund.createdAt,
                                    )}
                                  </p>

                                  <p className="mt-1 text-[11px] merchant-muted">
                                    {formatDate(
                                      refund.createdAt,
                                    )}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex justify-end">
                                  <Link
                                    href={`/dashboard/merchant/refunds/${encodeURIComponent(
                                      refund.refundId,
                                    )}`}
                                    className="
                                      inline-flex
                                      h-9
                                      items-center
                                      gap-2
                                      rounded-xl
                                      bg-violet-500/[0.055]
                                      px-3
                                      text-xs
                                      font-bold
                                      merchant-text
                                      transition

                                      hover:bg-violet-500/[0.11]
                                      hover:text-violet-600
                                    "
                                  >
                                    <Eye className="h-4 w-4" />

                                    View
                                  </Link>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                <div className="flex flex-col gap-3 bg-violet-500/[0.018] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs font-semibold merchant-muted">
                    {total === 0
                      ? "No records"
                      : `Showing ${visibleStart}-${visibleEnd} of ${total}`}
                  </p>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{
                        scale: 0.96,
                      }}
                      type="button"
                      disabled={
                        page <= 1
                      }
                      onClick={() =>
                        setPage(
                          (
                            current,
                          ) =>
                            Math.max(
                              current -
                                1,
                              1,
                            ),
                        )
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1
                        rounded-xl
                        bg-violet-500/[0.055]
                        px-3
                        text-xs
                        font-bold
                        merchant-text
                        transition

                        hover:bg-violet-500/[0.1]
                        hover:text-violet-600

                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <ArrowLeft className="h-4 w-4" />

                      Previous
                    </motion.button>

                    <span className="inline-flex h-9 items-center rounded-xl bg-violet-500/[0.1] px-3 text-xs font-black text-violet-600">
                      {page}
                      {" / "}
                      {totalPages}
                    </span>

                    <motion.button
                      whileTap={{
                        scale: 0.96,
                      }}
                      type="button"
                      disabled={
                        page >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          (
                            current,
                          ) =>
                            Math.min(
                              current +
                                1,
                              totalPages,
                            ),
                        )
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1
                        rounded-xl
                        bg-violet-500/[0.055]
                        px-3
                        text-xs
                        font-bold
                        merchant-text
                        transition

                        hover:bg-violet-500/[0.1]
                        hover:text-violet-600

                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      Next

                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
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

/* =========================================================
   TABLE
========================================================= */

function TableHeading({
  children,
  align = "left",
}: {
  children:
    React.ReactNode;

  align?:
    "left"
    | "right";
}) {
  return (
    <th
      className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <td className="px-5 py-4 align-middle">
      {children}
    </td>
  );
}