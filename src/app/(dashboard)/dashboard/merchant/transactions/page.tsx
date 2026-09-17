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
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  WalletCards,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  createPortal,
} from "react-dom";

import {
  getMerchantTransactions,
  type MerchantTransaction,
  type MerchantTransactionDirection,
  type MerchantTransactionStatus,
  type MerchantTransactionSummary,
  type MerchantTransactionType,
} from "@/lib/api/merchantTransactionApi";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_LIMIT =
  20;

const EMPTY_SUMMARY:
  MerchantTransactionSummary = {
  currency:
    "BDT",

  transactionCount:
    0,

  postedCount:
    0,

  reversedCount:
    0,

  reversalCount:
    0,

  totalCredits:
    0,

  totalDebits:
    0,

  ledgerBalance:
    0,

  reservedPayoutAmount:
    0,

  availableBalance:
    0,

  pendingPayoutCount:
    0,

  paymentCredits:
    0,

  refundDebits:
    0,

  payoutDebits:
    0,

  feeDebits:
    0,

  paymentNetImpact:
    0,

  refundNetImpact:
    0,

  payoutNetImpact:
    0,

  feeNetImpact:
    0,

  adjustmentNetImpact:
    0,
};

const TYPE_OPTIONS = [
  {
    value:
      "",
    label:
      "All types",
  },

  {
    value:
      "PAYMENT",
    label:
      "Payment",
  },

  {
    value:
      "REFUND",
    label:
      "Refund",
  },

  {
    value:
      "PAYOUT",
    label:
      "Payout",
  },

  {
    value:
      "FEE",
    label:
      "Fee",
  },

  {
    value:
      "ADJUSTMENT",
    label:
      "Adjustment",
  },

  {
    value:
      "REVERSAL",
    label:
      "Reversal",
  },
] as const;

const DIRECTION_OPTIONS = [
  {
    value:
      "",
    label:
      "All directions",
  },

  {
    value:
      "CREDIT",
    label:
      "Credit",
  },

  {
    value:
      "DEBIT",
    label:
      "Debit",
  },
] as const;

const STATUS_OPTIONS = [
  {
    value:
      "",
    label:
      "All statuses",
  },

  {
    value:
      "POSTED",
    label:
      "Posted",
  },

  {
    value:
      "REVERSED",
    label:
      "Reversed",
  },
] as const;

const CURRENCY_OPTIONS = [
  {
    value:
      "",
    label:
      "Default currency",
  },

  {
    value:
      "BDT",
    label:
      "BDT",
  },

  {
    value:
      "USD",
    label:
      "USD",
  },

  {
    value:
      "EUR",
    label:
      "EUR",
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount:
    number,

  currency =
    "BDT",
): string {
  try {
    return new Intl.NumberFormat(
      "en-US",
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

function maskCurrency(
  value:
    string,
): string {
  let digitIndex =
    0;

  return value.replace(
    /\d/g,
    (
      digit,
    ) => {
      digitIndex +=
        1;

      /*
       * Keep only first 2 digits visible.
       *
       * BDT 82,500.00
       * =>
       * BDT 82,•••.••
       */
      if (
        digitIndex <=
        2
      ) {
        return digit;
      }

      return "•";
    },
  );
}

function shouldProtectAmount(
  amount:
    number,
): boolean {
  return (
    Math.abs(
      amount,
    ) >=
    10_000
  );
}

function getMoneyFontSize(
  value:
    string,
): string {
  const length =
    value.length;

  if (
    length >=
    28
  ) {
    return "text-[0.82rem] sm:text-[0.9rem]";
  }

  if (
    length >=
    24
  ) {
    return "text-[0.9rem] sm:text-base";
  }

  if (
    length >=
    20
  ) {
    return "text-base sm:text-lg";
  }

  if (
    length >=
    17
  ) {
    return "text-lg sm:text-xl";
  }

  if (
    length >=
    14
  ) {
    return "text-xl sm:text-[1.4rem]";
  }

  return "text-2xl sm:text-[1.65rem]";
}

function formatDate(
  value:
    | string
    | null
    | undefined,
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
    "en-GB",
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

function formatSelectedDate(
  value:
    string,
): string {
  if (
    !value
  ) {
    return "";
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
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
    | string
    | null
    | undefined,

  start =
    9,

  end =
    5,
): string {
  if (
    !value
  ) {
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

function humanize(
  value:
    | string
    | null
    | undefined,
): string {
  if (
    !value
  ) {
    return "—";
  }

  return value
    .toLowerCase()
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
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
            25,
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
          duration:
            11,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-40
          left-[24%]
          h-80
          w-80
          rounded-full
          bg-violet-300/20
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
            1.09,
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

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-y-[-30%]
          left-[-22%]
          w-[22%]
          rotate-[15deg]
          bg-white/[0.055]
          blur-xl
        "
        animate={{
          x: [
            "0%",
            "620%",
          ],
        }}
        transition={{
          duration:
            7,

          repeat:
            Infinity,

          repeatDelay:
            4,

          ease:
            "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   FLOATING FILTER DROPDOWN
========================================================= */

interface DropdownOption {
  value:
    string;

  label:
    string;
}

interface DropdownPosition {
  left:
    number;

  width:
    number;

  top?:
    number;

  bottom?:
    number;

  maxHeight:
    number;
}

function FilterDropdown({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value:
    string;

  onChange:
    (
      value:
        string,
    ) => void;

  options:
    readonly DropdownOption[];

  ariaLabel:
    string;
}) {
  const [
    mounted,
    setMounted,
  ] =
    useState(
      false,
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );

  const [
    position,
    setPosition,
  ] =
    useState<
      DropdownPosition | null
    >(
      null,
    );

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
      setMounted(
        true,
      );
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

        if (
          !trigger
        ) {
          return;
        }

        const rect =
          trigger.getBoundingClientRect();

        const gap =
          8;

        const viewportPadding =
          12;

        const availableBelow =
          window.innerHeight -
          rect.bottom -
          gap -
          viewportPadding;

        const availableAbove =
          rect.top -
          gap -
          viewportPadding;

        const width =
          Math.min(
            rect.width,
            window.innerWidth -
              viewportPadding *
                2,
          );

        const left =
          Math.min(
            Math.max(
              viewportPadding,
              rect.left,
            ),

            window.innerWidth -
              width -
              viewportPadding,
          );

        const openBelow =
          availableBelow >=
            200 ||
          availableBelow >=
            availableAbove;

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
                140,

                Math.min(
                  280,
                  availableBelow,
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
                280,
                availableAbove,
              ),
            ),
        });
      },
      [],
    );

  const toggleOpen =
    () => {
      if (
        open
      ) {
        setOpen(
          false,
        );

        return;
      }

      updatePosition();

      setOpen(
        true,
      );
    };

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const handlePointer =
        (
          event:
            PointerEvent,
        ) => {
          const target =
            event.target as
              Node;

          if (
            triggerRef.current?.contains(
              target,
            )
          ) {
            return;
          }

          if (
            menuRef.current?.contains(
              target,
            )
          ) {
            return;
          }

          setOpen(
            false,
          );
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
            setOpen(
              false,
            );
          }
        };

      const closeOnScroll =
        () => {
          setOpen(
            false,
          );
        };

      const closeOnResize =
        () => {
          setOpen(
            false,
          );
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
        closeOnScroll,
        true,
      );

      window.addEventListener(
        "resize",
        closeOnResize,
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
          closeOnScroll,
          true,
        );

        window.removeEventListener(
          "resize",
          closeOnResize,
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
                opacity:
                  0,

                y:
                  -4,

                scale:
                  0.985,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,

                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,

                y:
                  -4,

                scale:
                  0.985,
              }}
              transition={{
                duration:
                  0.16,
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
                  20,
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

                        setOpen(
                          false,
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
                        transition-colors

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
          bg-violet-500/[0.055]
          px-4
          text-left
          text-sm
          font-bold
          outline-none
          transition-all
          duration-200

          hover:bg-violet-500/[0.085]

          focus-visible:ring-4
          focus-visible:ring-violet-500/[0.09]

          dark:bg-white/[0.045]
          dark:hover:bg-white/[0.07]
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
   DATE FILTER
========================================================= */

function DateFilter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label:
    string;

  value:
    string;

  min?:
    string;

  max?:
    string;

  onChange:
    (
      value:
        string,
    ) => void;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -1,
      }}
      transition={{
        duration:
          0.18,
      }}
      className="
        group
        relative
        h-12
        overflow-hidden
        rounded-2xl
        bg-violet-500/[0.055]
        transition

        hover:bg-violet-500/[0.085]

        focus-within:ring-4
        focus-within:ring-violet-500/[0.09]

        dark:bg-white/[0.045]
        dark:hover:bg-white/[0.07]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          flex
          items-center
          gap-3
          px-3
        "
      >
        <span
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-500/[0.09]
            text-violet-600
          "
        >
          <CalendarDays className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className="
              block
              text-[9px]
              font-black
              uppercase
              tracking-[0.12em]
              merchant-muted
            "
          >
            {label}
          </span>

          <span
            className={`mt-0.5 block truncate text-xs font-bold ${
              value
                ? "merchant-text"
                : "text-slate-400"
            }`}
          >
            {value
              ? formatSelectedDate(
                  value,
                )
              : "Select date"}
          </span>
        </span>

        <ChevronDown
          className="
            h-4
            w-4
            shrink-0
            text-violet-500
          "
        />
      </div>

      {/*
       * Real native input covers the entire control.
       * Therefore the calendar opens reliably from
       * anywhere the user clicks.
       */}
      <input
        type="date"
        aria-label={
          label
        }
        value={
          value
        }
        min={
          min
        }
        max={
          max
        }
        onClick={(
          event,
        ) => {
          const input =
            event.currentTarget as
              HTMLInputElement & {
                showPicker?:
                  () => void;
              };

          try {
            input.showPicker?.();
          } catch {
            // Browser will use its normal date input behavior.
          }
        }}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="
          absolute
          inset-0
          z-[1]
          h-full
          w-full
          cursor-pointer
          opacity-0
        "
      />
    </motion.div>
  );
}

/* =========================================================
   MONEY
========================================================= */

function ProtectedMoney({
  amount,
  currency,
  revealBalances,
  highlighted =
    false,
}: {
  amount:
    number;

  currency:
    string;

  revealBalances:
    boolean;

  highlighted?:
    boolean;
}) {
  const formatted =
    formatCurrency(
      amount,
      currency,
    );

  const protectedAmount =
    shouldProtectAmount(
      amount,
    );

  const showFull =
    !protectedAmount ||
    revealBalances;

  const displayedValue =
    showFull
      ? formatted
      : maskCurrency(
          formatted,
        );

  return (
    <div className="mt-2 min-w-0 overflow-hidden">
      <AnimatePresence
        mode="wait"
        initial={
          false
        }
      >
        <motion.p
          key={
            showFull
              ? "revealed"
              : "masked"
          }
          initial={{
            opacity:
              0,

            y:
              5,

            filter:
              "blur(5px)",
          }}
          animate={{
            opacity:
              1,

            y:
              0,

            filter:
              "blur(0px)",
          }}
          exit={{
            opacity:
              0,

            y:
              -5,

            filter:
              "blur(5px)",
          }}
          transition={{
            duration:
              0.23,

            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          title={
            showFull
              ? formatted
              : "Balance hidden"
          }
          className={`
            max-w-full
            overflow-hidden
            whitespace-nowrap
            font-black
            leading-[1.05]
            tracking-[-0.035em]
            tabular-nums

            ${getMoneyFontSize(
              formatted,
            )}

            ${
              highlighted
                ? "text-white"
                : "merchant-text"
            }
          `}
        >
          {
            displayedValue
          }
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  amount,
  currency,
  description,
  icon:
    Icon,
  revealBalances,
  highlighted =
    false,
  index =
    0,
}: {
  title:
    string;

  amount:
    number;

  currency:
    string;

  description:
    string;

  icon:
    React.ElementType;

  revealBalances:
    boolean;

  highlighted?:
    boolean;

  index?:
    number;
}) {
  if (
    highlighted
  ) {
    return (
      <motion.article
        initial={{
          opacity:
            0,

          y:
            18,

          scale:
            0.985,
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
            0.45,

          delay:
            index *
            0.05,
        }}
        whileHover={{
          y:
            -4,

          scale:
            1.004,
        }}
        className="
          relative
          min-w-0
          overflow-hidden
          rounded-[24px]
          p-5
          text-white
          shadow-[0_16px_38px_rgba(109,40,217,0.20)]
        "
        style={{
          background:
            "linear-gradient(135deg,#5B21B6 0%,#7C3AED 55%,#A855F7 100%)",
        }}
      >
        <motion.div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-14
            h-32
            w-32
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

            x: [
              0,
              -8,
              0,
            ],
          }}
          transition={{
            duration:
              8,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
        />

        <div className="relative flex min-h-[112px] items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="
                text-[11px]
                font-black
                uppercase
                tracking-[0.14em]
                text-violet-100/90
              "
            >
              {title}
            </p>

            <ProtectedMoney
              amount={
                amount
              }
              currency={
                currency
              }
              revealBalances={
                revealBalances
              }
              highlighted
            />

            <p className="mt-3 text-xs font-medium text-violet-100/80">
              {description}
            </p>
          </div>

          <motion.div
            whileHover={{
              rotate:
                -5,

              scale:
                1.08,
            }}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-white/15
              bg-white/10
              backdrop-blur
            "
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{
        opacity:
          0,

        y:
          18,

        scale:
          0.985,
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
          0.45,

        delay:
          index *
          0.05,
      }}
      whileHover={{
        y:
          -4,
      }}
      className="
        relative
        min-w-0
        overflow-hidden
        rounded-[24px]
        bg-white/80
        p-5
        shadow-[0_10px_28px_rgba(109,40,217,0.045)]
        transition

        hover:bg-white
        hover:shadow-[0_15px_35px_rgba(109,40,217,0.075)]

        dark:bg-slate-950/50
        dark:hover:bg-slate-950/65
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          inset-x-8
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-violet-300/50
          to-transparent
        "
      />

      <div className="flex min-h-[112px] items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="
              text-[11px]
              font-black
              uppercase
              tracking-[0.14em]
              merchant-muted
            "
          >
            {title}
          </p>

          <ProtectedMoney
            amount={
              amount
            }
            currency={
              currency
            }
            revealBalances={
              revealBalances
            }
          />

          <p className="mt-3 text-xs font-medium merchant-muted">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate:
              5,

            scale:
              1.08,
          }}
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/[0.08]
            text-violet-600
          "
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   BADGES
========================================================= */

function DirectionBadge({
  direction,
}: {
  direction:
    MerchantTransactionDirection;
}) {
  if (
    direction ===
    "CREDIT"
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-emerald-500/10
          px-2.5
          py-1
          text-xs
          font-bold
          text-emerald-600
        "
      >
        <ArrowDownLeft className="h-3.5 w-3.5" />

        Credit
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-rose-500/10
        px-2.5
        py-1
        text-xs
        font-bold
        text-rose-600
      "
    >
      <ArrowUpRight className="h-3.5 w-3.5" />

      Debit
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status:
    MerchantTransactionStatus;
}) {
  if (
    status ===
    "REVERSED"
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-amber-500/10
          px-2.5
          py-1
          text-xs
          font-bold
          text-amber-600
        "
      >
        <RotateCcw className="h-3.5 w-3.5" />

        Reversed
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-violet-500/10
        px-2.5
        py-1
        text-xs
        font-bold
        text-violet-600
      "
    >
      <Check className="h-3.5 w-3.5" />

      Posted
    </span>
  );
}

function TypeBadge({
  type,
}: {
  type:
    MerchantTransactionType;
}) {
  const icon =
    type ===
    "PAYMENT"
      ? CircleDollarSign
      : type ===
          "REFUND"
        ? RotateCcw
        : type ===
            "PAYOUT"
          ? Send
          : type ===
              "FEE"
            ? Coins
            : type ===
                "REVERSAL"
              ? RefreshCw
              : Activity;

  const Icon =
    icon;

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-xl
        bg-violet-500/[0.08]
        px-2.5
        py-1.5
        text-xs
        font-bold
        text-violet-600
      "
    >
      <Icon className="h-3.5 w-3.5" />

      {humanize(
        type,
      )}
    </span>
  );
}

/* =========================================================
   MOBILE TRANSACTION CARD
========================================================= */

function MobileTransactionCard({
  transaction,
}: {
  transaction:
    MerchantTransaction;
}) {
  const positive =
    transaction.balanceImpact >=
    0;

  return (
    <motion.article
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
      whileHover={{
        y:
          -2,
      }}
      className="
        rounded-[22px]
        bg-white/80
        p-4
        shadow-[0_8px_24px_rgba(109,40,217,0.04)]

        dark:bg-slate-950/50
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/merchant/transactions/${encodeURIComponent(
              transaction.transactionId,
            )}`}
            className="
              font-mono
              text-xs
              font-bold
              merchant-text
              transition

              hover:text-violet-600
            "
          >
            {shortId(
              transaction.transactionId,
            )}
          </Link>

          <p className="mt-1 text-xs merchant-muted">
            {formatDate(
              transaction.effectiveAt,
            )}
          </p>
        </div>

        <TypeBadge
          type={
            transaction.type
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-violet-500/[0.045] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide merchant-muted">
            Direction
          </p>

          <div className="mt-2">
            <DirectionBadge
              direction={
                transaction.direction
              }
            />
          </div>
        </div>

        <div className="rounded-2xl bg-violet-500/[0.045] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide merchant-muted">
            Impact
          </p>

          <p
            className={`mt-2 text-sm font-black tabular-nums ${
              positive
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {positive
              ? "+"
              : ""}

            {formatCurrency(
              transaction.balanceImpact,
              transaction.currency,
            )}
          </p>
        </div>
      </div>

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-violet-500/[0.045]
          p-3
        "
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide merchant-muted">
            Reference
          </p>

          <p className="mt-1 truncate font-mono text-xs font-semibold merchant-text">
            {
              transaction.referenceId
            }
          </p>
        </div>

        <StatusBadge
          status={
            transaction.status
          }
        />
      </div>

      <Link
        href={`/dashboard/merchant/transactions/${encodeURIComponent(
          transaction.transactionId,
        )}`}
        className="
          mt-4
          inline-flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-2xl
          bg-violet-500/[0.055]
          px-4
          py-2.5
          text-sm
          font-bold
          merchant-text
          transition

          hover:bg-violet-500/[0.09]
          hover:text-violet-600
        "
      >
        View transaction

        <ExternalLink className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantTransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] =
    useState<
      MerchantTransaction[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      MerchantTransactionSummary
    >(
      EMPTY_SUMMARY,
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

  const [
    revealBalances,
    setRevealBalances,
  ] =
    useState(
      false,
    );

  const [
    searchInput,
    setSearchInput,
  ] =
    useState(
      "",
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    type,
    setType,
  ] =
    useState<
      MerchantTransactionType | ""
    >(
      "",
    );

  const [
    direction,
    setDirection,
  ] =
    useState<
      MerchantTransactionDirection | ""
    >(
      "",
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      MerchantTransactionStatus | ""
    >(
      "",
    );

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "",
    );

  const [
    from,
    setFrom,
  ] =
    useState(
      "",
    );

  const [
    to,
    setTo,
  ] =
    useState(
      "",
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState({
      page:
        1,

      limit:
        DEFAULT_LIMIT,

      total:
        0,

      totalPages:
        1,

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    });

  /* =======================================================
     FETCH
  ======================================================== */

  const loadTransactions =
    useCallback(
      async (
        fullLoader =
          true,
      ) => {
        try {
          setError(
            "",
          );

          if (
            fullLoader
          ) {
            setLoading(
              true,
            );
          } else {
            setRefreshing(
              true,
            );
          }

          const result =
            await getMerchantTransactions({
              page,

              limit:
                DEFAULT_LIMIT,

              search:
                search ||
                undefined,

              type:
                type ||
                undefined,

              direction:
                direction ||
                undefined,

              status:
                status ||
                undefined,

              currency:
                currency ||
                undefined,

              from:
                from ||
                undefined,

              to:
                to ||
                undefined,
            });

          setTransactions(
            result.transactions ??
              [],
          );

          setSummary(
            result.summary,
          );

          setPagination(
            result.pagination,
          );
        } catch (
          requestError
        ) {
          setTransactions(
            [],
          );

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load merchant transactions.",
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
        page,
        search,
        type,
        direction,
        status,
        currency,
        from,
        to,
      ],
    );

  useEffect(
    () => {
      void loadTransactions(
        true,
      );
    },
    [
      loadTransactions,
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
            setPage(
              1,
            );

            setSearch(
              searchInput.trim(),
            );
          },
          400,
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
     FILTERS
  ======================================================== */

  const hasActiveFilters =
    Boolean(
      search ||
        type ||
        direction ||
        status ||
        currency ||
        from ||
        to,
    );

  const clearFilters =
    () => {
      setSearchInput(
        "",
      );

      setSearch(
        "",
      );

      setType(
        "",
      );

      setDirection(
        "",
      );

      setStatus(
        "",
      );

      setCurrency(
        "",
      );

      setFrom(
        "",
      );

      setTo(
        "",
      );

      setPage(
        1,
      );
    };

  const visibleRange =
    useMemo(
      () => {
        if (
          pagination.total ===
          0
        ) {
          return "0 transactions";
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

            pagination.total,
          );

        return `${start}-${end} of ${pagination.total}`;
      },
      [
        pagination,
      ],
    );

  const summaryCurrency =
    summary.currency ||
    "BDT";

  const summaryCards =
    [
      {
        title:
          "Available",

        amount:
          summary.availableBalance,

        description:
          "Ready for payout",

        icon:
          WalletCards,

        highlighted:
          true,
      },

      {
        title:
          "Credits",

        amount:
          summary.totalCredits,

        description:
          "Total money in",

        icon:
          ArrowDownRight,

        highlighted:
          false,
      },

      {
        title:
          "Debits",

        amount:
          summary.totalDebits,

        description:
          "Total money out",

        icon:
          ArrowUpRight,

        highlighted:
          false,
      },

      {
        title:
          "Payments",

        amount:
          summary.paymentCredits,

        description:
          "Payment credits",

        icon:
          CircleDollarSign,

        highlighted:
          false,
      },

      {
        title:
          "Refunded",

        amount:
          summary.refundDebits,

        description:
          "Refund debits",

        icon:
          RotateCcw,

        highlighted:
          false,
      },

      {
        title:
          "Payouts",

        amount:
          summary.payoutDebits,

        description:
          `${summary.pendingPayoutCount} pending`,

        icon:
          Banknote,

        highlighted:
          false,
      },
    ];

  return (
    <main
      className="
        relative
        z-0
        isolate
        min-h-full
        merchant-surface-soft
      "
    >
      <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
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
            z-0
            mb-6
            overflow-hidden
            rounded-[28px]
            px-5
            py-6
            text-white
            shadow-[0_20px_55px_rgba(76,29,149,0.17)]

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
                    tracking-[0.12em]
                    text-violet-100
                    backdrop-blur
                  "
                >
                  <Activity className="h-3.5 w-3.5" />

                  Merchant ledger
                </motion.div>

                <motion.h1
                  variants={
                    heroItem
                  }
                  className="
                    mt-4
                    text-2xl
                    font-black
                    tracking-tight

                    sm:text-3xl
                  "
                >
                  Transactions
                </motion.h1>

                <motion.p
                  variants={
                    heroItem
                  }
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    leading-6
                    text-violet-100/85
                  "
                >
                  Track every real credit and debit affecting your
                  merchant balance, including payments, refunds,
                  payouts and ledger reversals.
                </motion.p>
              </div>

              <motion.button
                variants={
                  heroItem
                }
                whileHover={{
                  y:
                    -2,

                  scale:
                    1.02,
                }}
                whileTap={{
                  scale:
                    0.97,
                }}
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadTransactions(
                    false,
                  )
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

            <motion.div
              variants={
                heroItem
              }
              className="
                mt-6
                grid
                gap-3

                sm:grid-cols-3
              "
            >
              {[
                {
                  label:
                    "Ledger balance",

                  value:
                    revealBalances ||
                    !shouldProtectAmount(
                      summary.ledgerBalance,
                    )
                      ? formatCurrency(
                          summary.ledgerBalance,
                          summaryCurrency,
                        )
                      : maskCurrency(
                          formatCurrency(
                            summary.ledgerBalance,
                            summaryCurrency,
                          ),
                        ),
                },

                {
                  label:
                    "Reserved",

                  value:
                    revealBalances ||
                    !shouldProtectAmount(
                      summary.reservedPayoutAmount,
                    )
                      ? formatCurrency(
                          summary.reservedPayoutAmount,
                          summaryCurrency,
                        )
                      : maskCurrency(
                          formatCurrency(
                            summary.reservedPayoutAmount,
                            summaryCurrency,
                          ),
                        ),
                },

                {
                  label:
                    "Ledger records",

                  value:
                    summary.transactionCount.toLocaleString(),
                },
              ].map(
                (
                  item,
                  index,
                ) => (
                  <motion.div
                    key={
                      item.label
                    }
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
                    transition={{
                      duration:
                        0.42,

                      delay:
                        0.3 +
                        index *
                          0.07,
                    }}
                    whileHover={{
                      y:
                        -2,

                      backgroundColor:
                        "rgba(255,255,255,0.12)",
                    }}
                    className="
                      min-w-0
                      overflow-hidden
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/[0.08]
                      p-3
                      backdrop-blur
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-violet-100/70
                      "
                    >
                      {
                        item.label
                      }
                    </p>

                    <AnimatePresence
                      mode="wait"
                      initial={
                        false
                      }
                    >
                      <motion.p
                        key={
                          item.value
                        }
                        initial={{
                          opacity:
                            0,

                          filter:
                            "blur(4px)",
                        }}
                        animate={{
                          opacity:
                            1,

                          filter:
                            "blur(0px)",
                        }}
                        exit={{
                          opacity:
                            0,

                          filter:
                            "blur(4px)",
                        }}
                        className="
                          mt-1
                          overflow-hidden
                          whitespace-nowrap
                          text-base
                          font-black
                          tracking-tight
                          tabular-nums
                        "
                      >
                        {
                          item.value
                        }
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                ),
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <div
            className="
              mb-6
              flex
              flex-col
              gap-3
              rounded-2xl
              bg-rose-500/[0.055]
              p-4

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <div>
                <p className="text-sm font-bold merchant-text">
                  Unable to load transactions
                </p>

                <p className="mt-1 text-xs merchant-muted">
                  {
                    error
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadTransactions(
                  true,
                )
              }
              className="
                rounded-xl
                bg-rose-500/10
                px-4
                py-2.5
                text-sm
                font-bold
                text-rose-600
              "
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* =================================================
            BALANCE OVERVIEW
        ================================================= */}

        <motion.section
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
          transition={{
            duration:
              0.5,

            delay:
              0.08,
          }}
          className="
            relative
            z-0
            mb-6
            rounded-[30px]
            bg-white/60
            p-4
            shadow-[0_14px_46px_rgba(109,40,217,0.05)]
            backdrop-blur

            sm:p-5

            dark:bg-slate-950/40
          "
        >
          <div
            className="
              mb-5
              flex
              flex-col
              gap-4

              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-violet-500/[0.08]
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-violet-600
                "
              >
                <WalletCards className="h-3.5 w-3.5" />

                Balance overview
              </div>

              <h2
                className="
                  mt-3
                  text-lg
                  font-black
                  tracking-tight
                  merchant-text

                  sm:text-xl
                "
              >
                Real merchant balance snapshot
              </h2>

              <p className="mt-1 text-sm merchant-muted">
                Live summary of credits, debits, payouts and current
                available balance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                type="button"
                whileHover={{
                  y:
                    -1,
                }}
                whileTap={{
                  scale:
                    0.96,
                }}
                onClick={() =>
                  setRevealBalances(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-full
                  bg-violet-500/[0.08]
                  px-3
                  text-xs
                  font-bold
                  text-violet-600
                  transition

                  hover:bg-violet-500/[0.13]
                "
              >
                {revealBalances ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}

                {revealBalances
                  ? "Hide balances"
                  : "Show balances"}
              </motion.button>

              <div
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-full
                  bg-violet-500/[0.08]
                  px-3
                  text-xs
                  font-bold
                  text-violet-600
                "
              >
                <Coins className="h-3.5 w-3.5" />

                {summary.transactionCount.toLocaleString()} ledger records
              </div>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2

              xl:grid-cols-3
            "
          >
            {summaryCards.map(
              (
                card,
                index,
              ) => (
                <SummaryCard
                  key={
                    card.title
                  }
                  title={
                    card.title
                  }
                  amount={
                    card.amount
                  }
                  currency={
                    summaryCurrency
                  }
                  description={
                    card.description
                  }
                  icon={
                    card.icon
                  }
                  highlighted={
                    card.highlighted
                  }
                  revealBalances={
                    revealBalances
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </motion.section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <motion.section
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
          transition={{
            duration:
              0.5,

            delay:
              0.14,
          }}
          className="
            relative
            z-0
            mb-6
            overflow-hidden
            rounded-[28px]
            bg-white/60
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
                -right-10
                -top-16
                h-40
                w-40
                rounded-full
                bg-white/10
                blur-2xl
              "
              animate={{
                scale: [
                  1,
                  1.13,
                  1,
                ],

                x: [
                  0,
                  -10,
                  0,
                ],
              }}
              transition={{
                duration:
                  8,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
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
                <motion.div
                  whileHover={{
                    rotate:
                      7,

                    scale:
                      1.06,
                  }}
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
                </motion.div>

                <div>
                  <h2 className="text-sm font-black">
                    Ledger filters
                  </h2>

                  <p className="mt-0.5 text-xs text-violet-100/75">
                    Filter real merchant balance activity
                  </p>
                </div>
              </div>

              {hasActiveFilters ? (
                <motion.button
                  type="button"
                  whileTap={{
                    scale:
                      0.96,
                  }}
                  onClick={
                    clearFilters
                  }
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    bg-white/10
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-white/90
                    transition

                    hover:bg-white/15
                  "
                >
                  <X className="h-3.5 w-3.5" />

                  Clear filters
                </motion.button>
              ) : null}
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-3
              p-4

              md:grid-cols-2

              xl:grid-cols-12
              xl:gap-4
              xl:p-5
            "
          >
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
                type="search"
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
                placeholder="Transaction ID, payment, refund, payout or reference..."
                className="
                  merchant-text

                  h-12
                  w-full
                  rounded-2xl
                  border-0
                  bg-violet-500/[0.055]
                  pl-11
                  pr-4
                  text-sm
                  font-medium
                  outline-none
                  transition-all
                  duration-200

                  placeholder:text-slate-400

                  hover:bg-violet-500/[0.085]

                  focus:ring-4
                  focus:ring-violet-500/[0.09]

                  dark:bg-white/[0.045]
                "
              />
            </div>

            {/* TYPE */}

            <div className="xl:col-span-3">
              <FilterDropdown
                ariaLabel="Transaction type"
                value={
                  type
                }
                options={
                  TYPE_OPTIONS
                }
                onChange={(
                  value,
                ) => {
                  setType(
                    value as
                      | MerchantTransactionType
                      | "",
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>

            {/* DIRECTION */}

            <div className="xl:col-span-3">
              <FilterDropdown
                ariaLabel="Transaction direction"
                value={
                  direction
                }
                options={
                  DIRECTION_OPTIONS
                }
                onChange={(
                  value,
                ) => {
                  setDirection(
                    value as
                      | MerchantTransactionDirection
                      | "",
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>

            {/* STATUS */}

            <div className="xl:col-span-3">
              <FilterDropdown
                ariaLabel="Ledger status"
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
                      | MerchantTransactionStatus
                      | "",
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>

            {/* CURRENCY */}

            <div className="xl:col-span-3">
              <FilterDropdown
                ariaLabel="Currency"
                value={
                  currency
                }
                options={
                  CURRENCY_OPTIONS
                }
                onChange={(
                  value,
                ) => {
                  setCurrency(
                    value,
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>

            {/* FROM DATE */}

            <div className="xl:col-span-3">
              <DateFilter
                label="From date"
                value={
                  from
                }
                max={
                  to ||
                  undefined
                }
                onChange={(
                  value,
                ) => {
                  setFrom(
                    value,
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>

            {/* TO DATE */}

            <div className="xl:col-span-3">
              <DateFilter
                label="To date"
                value={
                  to
                }
                min={
                  from ||
                  undefined
                }
                onChange={(
                  value,
                ) => {
                  setTo(
                    value,
                  );

                  setPage(
                    1,
                  );
                }}
              />
            </div>
          </div>
        </motion.section>

        {/* =================================================
            BALANCE ACTIVITY
        ================================================= */}

        <motion.section
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
          transition={{
            duration:
              0.5,

            delay:
              0.2,
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
            className="
              flex
              flex-col
              gap-3
              px-5
              py-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-violet-500/[0.08]
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.13em]
                  text-violet-600
                "
              >
                <Activity className="h-3.5 w-3.5" />

                Balance activity
              </div>

              <p className="mt-2 text-xs merchant-muted">
                Showing{" "}

                <span className="font-bold text-violet-600">
                  {
                    visibleRange
                  }
                </span>
              </p>
            </div>

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                bg-violet-500/[0.08]
                px-3
                py-1.5
                text-xs
                font-bold
                text-violet-600
              "
            >
              <Activity className="h-3.5 w-3.5" />

              Real ledger activity
            </div>
          </div>

          {loading ? (
            <div className="p-5">
              <div className="space-y-3">
                {Array.from({
                  length:
                    7,
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
                        duration:
                          1.4,

                        delay:
                          index *
                          0.06,

                        repeat:
                          Infinity,
                      }}
                      className="
                        h-16
                        rounded-2xl
                        bg-violet-500/[0.045]
                      "
                    />
                  ),
                )}
              </div>
            </div>
          ) : transactions.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <div
                className="
                  mx-auto
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
                <Activity className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-base font-black merchant-text">
                No ledger transactions found
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 merchant-muted">
                No merchant balance activity matched the current filters.
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="
                    mt-5
                    rounded-xl
                    bg-violet-500/[0.065]
                    px-4
                    py-2.5
                    text-sm
                    font-bold
                    merchant-text
                    transition

                    hover:bg-violet-500/[0.1]
                    hover:text-violet-600
                  "
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="space-y-3 p-4 xl:hidden">
                {transactions.map(
                  (
                    transaction,
                  ) => (
                    <MobileTransactionCard
                      key={
                        transaction.transactionId
                      }
                      transaction={
                        transaction
                      }
                    />
                  ),
                )}
              </div>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

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
                <table className="w-full min-w-[1320px]">
                  <thead>
                    <tr className="bg-violet-500/[0.032]">
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Transaction
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Type
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Direction
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Amount
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Balance impact
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Reference
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Status
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-wider merchant-muted">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map(
                      (
                        transaction,
                        index,
                      ) => {
                        const positive =
                          transaction.balanceImpact >=
                          0;

                        return (
                          <motion.tr
                            key={
                              transaction.transactionId
                            }
                            initial={{
                              opacity:
                                0,

                              y:
                                7,
                            }}
                            animate={{
                              opacity:
                                1,

                              y:
                                0,
                            }}
                            transition={{
                              duration:
                                0.28,

                              delay:
                                index *
                                0.025,
                            }}
                            className="
                              transition-colors
                              hover:bg-violet-500/[0.035]
                            "
                          >
                            <td className="px-5 py-4">
                              <div className="min-w-[190px]">
                                <Link
                                  href={`/dashboard/merchant/transactions/${encodeURIComponent(
                                    transaction.transactionId,
                                  )}`}
                                  className="
                                    font-mono
                                    text-xs
                                    font-bold
                                    merchant-text
                                    transition

                                    hover:text-violet-600
                                  "
                                >
                                  {shortId(
                                    transaction.transactionId,
                                    11,
                                    5,
                                  )}
                                </Link>

                                <p className="mt-1 text-[11px] merchant-muted">
                                  Group:{" "}

                                  {shortId(
                                    transaction.entryGroupId,
                                    9,
                                    4,
                                  )}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <TypeBadge
                                type={
                                  transaction.type
                                }
                              />
                            </td>

                            <td className="px-4 py-4">
                              <DirectionBadge
                                direction={
                                  transaction.direction
                                }
                              />
                            </td>

                            <td className="px-4 py-4">
                              <p
                                className="
                                  whitespace-nowrap
                                  text-sm
                                  font-black
                                  merchant-text
                                  tabular-nums
                                "
                              >
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.currency,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p
                                className={`whitespace-nowrap text-sm font-black tabular-nums ${
                                  positive
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {positive
                                  ? "+"
                                  : ""}

                                {formatCurrency(
                                  transaction.balanceImpact,
                                  transaction.currency,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <div className="min-w-[165px]">
                                <p className="font-mono text-xs font-bold merchant-text">
                                  {shortId(
                                    transaction.referenceId,
                                    10,
                                    5,
                                  )}
                                </p>

                                <p className="mt-1 text-[11px] capitalize merchant-muted">
                                  {humanize(
                                    transaction.referenceType,
                                  )}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <StatusBadge
                                status={
                                  transaction.status
                                }
                              />
                            </td>

                            <td className="px-4 py-4">
                              <p className="min-w-[145px] text-xs font-semibold merchant-text">
                                {formatDate(
                                  transaction.effectiveAt,
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/dashboard/merchant/transactions/${encodeURIComponent(
                                  transaction.transactionId,
                                )}`}
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-xl
                                  bg-violet-500/[0.055]
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  merchant-text
                                  transition

                                  hover:bg-violet-500/[0.1]
                                  hover:text-violet-600
                                "
                              >
                                Details

                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      },
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
                  px-4
                  py-4

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-5
                "
              >
                <p className="text-xs font-semibold merchant-muted">
                  Showing{" "}

                  <span className="font-black merchant-text">
                    {
                      visibleRange
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{
                      scale:
                        0.96,
                    }}
                    type="button"
                    disabled={
                      !pagination.hasPreviousPage ||
                      loading
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
                    <ChevronLeft className="h-4 w-4" />

                    Previous
                  </motion.button>

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
                    {
                      pagination.page
                    }
                    {" / "}
                    {
                      pagination.totalPages
                    }
                  </span>

                  <motion.button
                    whileTap={{
                      scale:
                        0.96,
                    }}
                    type="button"
                    disabled={
                      !pagination.hasNextPage ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.min(
                            pagination.totalPages,
                            current +
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
                    Next

                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.section>

        {/* =================================================
            FOOTER
        ================================================= */}

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
          transition={{
            duration:
              0.4,

            delay:
              0.25,
          }}
          className="
            mt-5
            flex
            flex-col
            gap-2
            rounded-2xl
            bg-white/55
            px-4
            py-4
            backdrop-blur

            sm:flex-row
            sm:items-center
            sm:justify-between

            dark:bg-slate-950/35
          "
        >
          <div className="flex items-center gap-2 text-xs merchant-muted">
            <Activity className="h-4 w-4 text-violet-600" />

            <span>
              Live merchant ledger only. Sandbox payments do not affect
              this balance.
            </span>
          </div>

          <span className="text-xs font-bold text-violet-600">
            {DEFAULT_LIMIT} records per page
          </span>
        </motion.div>
      </div>
    </main>
  );
}