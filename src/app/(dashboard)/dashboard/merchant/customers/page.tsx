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
  CreditCard,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
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
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface MerchantCustomer {
  customerId: string;

  customer: {
    name: string;
    avatarUrl?: string;
    accountStatus?: string;
    kycStatus?: string;
    emailVerified?: boolean;
    createdAt?: string;
  };

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

  lastPaymentAt:
    | string
    | null;

  firstPaymentAt:
    | string
    | null;
}

interface CustomersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CustomersResponse {
  success?: boolean;
  message?: string;

  customers?:
    MerchantCustomer[];

  pagination?:
    CustomersPagination;

  filters?: {
    search?: string;
    status?: string;
    kycStatus?: string;
    from?: string;
    to?: string;
  };

  data?: {
    customers?:
      MerchantCustomer[];

    pagination?:
      CustomersPagination;

    filters?: {
      search?: string;
      status?: string;
      kycStatus?: string;
      from?: string;
      to?: string;
    };
  };
}

interface CustomerFilters {
  search: string;
  status: string;
  kycStatus: string;
  from: string;
  to: string;
}

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

const STATUS_OPTIONS = [
  {
    value: "",
    label:
      "All account statuses",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "deleted",
    label: "Deleted",
  },
] as const;

const KYC_OPTIONS = [
  {
    value: "",
    label:
      "All KYC statuses",
  },
  {
    value:
      "not_started",
    label:
      "Not started",
  },
  {
    value:
      "pending",
    label:
      "Pending",
  },
  {
    value:
      "under_review",
    label:
      "Under review",
  },
  {
    value:
      "verified",
    label:
      "Verified",
  },
  {
    value:
      "rejected",
    label:
      "Rejected",
  },
] as const;

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

function getInitialFilters():
  CustomerFilters {
  return {
    search: "",
    status: "",
    kycStatus: "",
    from: "",
    to: "",
  };
}

function buildQuery(
  filters:
    CustomerFilters,

  page:
    number,

  limit:
    number,
): string {
  const params =
    new URLSearchParams();

  params.set(
    "page",
    String(
      page,
    ),
  );

  params.set(
    "limit",
    String(
      limit,
    ),
  );

  if (
    filters.search.trim()
  ) {
    params.set(
      "search",
      filters.search.trim(),
    );
  }

  if (
    filters.status
  ) {
    params.set(
      "status",
      filters.status,
    );
  }

  if (
    filters.kycStatus
  ) {
    params.set(
      "kycStatus",
      filters.kycStatus,
    );
  }

  if (
    filters.from
  ) {
    params.set(
      "from",
      filters.from,
    );
  }

  if (
    filters.to
  ) {
    params.set(
      "to",
      filters.to,
    );
  }

  return params.toString();
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
    20,
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

function formatMoney(
  value:
    | string
    | number
    | null
    | undefined,
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
    return "BDT 0.00";
  }

  return `BDT ${amount.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}`;
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

function getNameInitial(
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

/* =========================================================
   STATUS HELPERS
========================================================= */

function getAccountStatusMeta(
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

        className:
          "merchant-status-success",

        icon:
          CheckCircle2,
      };

    case "deleted":
      return {
        label:
          "Deleted",

        className:
          "merchant-status-danger",

        icon:
          XCircle,
      };

    default:
      return {
        label:
          humanize(
            status,
          ),

        className:
          "merchant-status-warning",

        icon:
          Clock3,
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

        className:
          "merchant-status-success",

        icon:
          ShieldCheck,
      };

    case "rejected":
      return {
        label:
          "Rejected",

        className:
          "merchant-status-danger",

        icon:
          XCircle,
      };

    case "pending":
      return {
        label:
          "Pending",

        className:
          "merchant-status-warning",

        icon:
          Clock3,
      };

    case "under_review":
      return {
        label:
          "Under review",

        className:
          "merchant-status-info",

        icon:
          ShieldCheck,
      };

    case "not_started":
      return {
        label:
          "Not started",

        className:
          "merchant-status-warning",

        icon:
          Clock3,
      };

    default:
      return {
        label:
          humanize(
            status,
          ),

        className:
          "merchant-status-warning",

        icon:
          Clock3,
      };
  }
}

/* =========================================================
   RESPONSE
========================================================= */

function extractResponse(
  response:
    CustomersResponse,
): {
  customers:
    MerchantCustomer[];

  pagination:
    CustomersPagination;
} {
  const customers =
    response.data?.customers ??
    response.customers ??
    [];

  const pagination =
    response.data?.pagination ??
    response.pagination ??
    {
      page:
        1,

      limit:
        DEFAULT_LIMIT,

      total:
        customers.length,

      totalPages:
        1,

      hasNextPage:
        false,

      hasPreviousPage:
        false,
    };

  return {
    customers:
      Array.isArray(
        customers,
      )
        ? customers
        : [],

    pagination,
  };
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
          inset-y-[-35%]
          left-[-22%]
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
   CUSTOM DROPDOWN
========================================================= */

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
            190 ||
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
                150,

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
              150,

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
            ) ||
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

      const close =
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
                opacity:
                  0,

                y:
                  -5,

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
                  -5,

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

                /*
                 * Lower than the dashboard navbar.
                 * Dropdown closes automatically when scrolling.
                 */
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
          transition-all

          hover:bg-violet-500/[0.09]

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
   REAL DATE INPUT

   IMPORTANT:
   - no invisible overlay
   - no showPicker dependency
   - browser-native picker works normally
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
    <div className="min-w-0">
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
        {label}
      </label>

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
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
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
          transition-all

          hover:bg-violet-500/[0.09]

          focus:ring-4
          focus:ring-violet-500/[0.09]

          dark:bg-white/[0.045]
          dark:[color-scheme:dark]

          [color-scheme:light]
        "
      />
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function CustomerAvatar({
  name,
  avatarUrl,
}: {
  name?:
    string;

  avatarUrl?:
    string;
}) {
  const [
    broken,
    setBroken,
  ] =
    useState(
      false,
    );

  if (
    avatarUrl &&
    !broken
  ) {
    return (
      <img
        src={
          avatarUrl
        }
        alt={
          name ||
          "Customer"
        }
        onError={() =>
          setBroken(
            true,
          )
        }
        className="
          h-11
          w-11
          shrink-0
          rounded-2xl
          object-cover
          ring-1
          ring-violet-500/10
        "
      />
    );
  }

  return (
    <div
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-2xl
        text-sm
        font-black
        text-white
        merchant-gradient
      "
    >
      {getNameInitial(
        name,
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD

   FIX:
   Icon no longer steals horizontal width from amount.
   Amount receives the whole card width.
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
      <motion.article
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
          min-w-0
          overflow-hidden
          rounded-[24px]
          p-5
          text-white
          shadow-[0_16px_38px_rgba(109,40,217,0.16)]
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
            -right-10
            -top-12
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
          }}
          transition={{
            duration:
              8,

            repeat:
              Infinity,
          }}
        />

        <div className="relative">
          {/* LABEL + ICON */}

          <div className="flex items-start justify-between gap-3">
            <p
              className="
                min-w-0
                text-[11px]
                font-black
                uppercase
                tracking-[0.14em]
                text-violet-100/85
              "
            >
              {label}
            </p>

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-white/15
                bg-white/10
              "
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>

          {/* AMOUNT GETS FULL WIDTH */}

          <p
            title={
              value
            }
            className="
              mt-2
              w-full
              whitespace-nowrap
              text-[clamp(1.15rem,1.7vw,1.75rem)]
              font-black
              leading-none
              tracking-[-0.035em]
              tabular-nums
            "
          >
            {value}
          </p>

          <p className="mt-4 max-w-[90%] text-xs leading-5 text-violet-100/80">
            {description}
          </p>
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
      {/* LABEL + ICON */}

      <div className="flex items-start justify-between gap-3">
        <p
          className="
            min-w-0
            text-[11px]
            font-black
            uppercase
            tracking-[0.14em]
            merchant-muted
          "
        >
          {label}
        </p>

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/[0.08]
            text-violet-600
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* FULL WIDTH VALUE */}

      <p
        title={
          value
        }
        className="
          mt-2
          w-full
          whitespace-nowrap
          text-[clamp(1.05rem,1.55vw,1.65rem)]
          font-black
          leading-none
          tracking-[-0.035em]
          merchant-text
          tabular-nums
        "
      >
        {value}
      </p>

      <p className="mt-4 max-w-[95%] text-xs leading-5 merchant-muted">
        {description}
      </p>
    </motion.article>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingCards() {
  return (
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
                  0.7,
                  0.35,
                ],
              }}
              transition={{
                duration:
                  1.4,

                delay:
                  index *
                  0.05,

                repeat:
                  Infinity,
              }}
              className="
                h-20
                rounded-2xl
                bg-violet-500/[0.04]
              "
            />
          ),
        )}
      </div>
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
  hasFilters:
    boolean;

  onClear:
    () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
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
        <Users className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-lg font-black merchant-text">
        {hasFilters
          ? "No matching customers"
          : "No customers yet"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
        {hasFilters
          ? "Try changing your search or filters to find another customer."
          : "Customers who make payments with your merchant account will appear here."}
      </p>

      {hasFilters ? (
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
            bg-violet-500/[0.07]
            px-4
            py-2.5
            text-sm
            font-bold
            merchant-text
            transition

            hover:bg-violet-500/[0.12]
            hover:text-violet-600
          "
        >
          <X className="h-4 w-4" />

          Clear filters
        </button>
      ) : null}
    </div>
  );
}

/* =========================================================
   MOBILE METRIC
========================================================= */

function MobileMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="min-w-0">
      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-[0.12em]
          merchant-muted
        "
      >
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold merchant-text">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantCustomersPage() {
  const [
    customers,
    setCustomers,
  ] =
    useState<
      MerchantCustomer[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<CustomersPagination>({
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

  const [
    filters,
    setFilters,
  ] =
    useState<CustomerFilters>(
      getInitialFilters(),
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<CustomerFilters>(
      getInitialFilters(),
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

  const fetchCustomers =
    useCallback(
      async (
        page =
          1,

        nextFilters =
          appliedFilters,

        options?: {
          silent?:
            boolean;
        },
      ) => {
        const silent =
          options?.silent ===
          true;

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

          const query =
            buildQuery(
              nextFilters,
              page,
              DEFAULT_LIMIT,
            );

          const response =
            await apiClient<CustomersResponse>(
              `/merchants/customers?${query}`,
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
                "Failed to load customers.",
            );
          }

          const {
            customers:
              nextCustomers,

            pagination:
              nextPagination,
          } =
            extractResponse(
              response,
            );

          setCustomers(
            nextCustomers,
          );

          setPagination(
            nextPagination,
          );
        } catch (
          fetchError
        ) {
          console.error(
            "MERCHANT CUSTOMERS FETCH ERROR:",
            fetchError,
          );

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Unable to load merchant customers.",
          );

          setCustomers(
            [],
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
        appliedFilters,
      ],
    );

  useEffect(
    () => {
      void fetchCustomers(
        1,
        appliedFilters,
      );
    },
    [
      appliedFilters,
      fetchCustomers,
    ],
  );

  /* =======================================================
     FILTER STATE
  ======================================================== */

  const handleFilterChange =
    (
      key:
        keyof CustomerFilters,

      value:
        string,
    ) => {
      setFilters(
        (
          current,
        ) => ({
          ...current,

          [key]:
            value,
        }),
      );
    };

  const applyFilters =
    () => {
      /*
       * Prevent impossible date range.
       */
      if (
        filters.from &&
        filters.to &&
        filters.from >
          filters.to
      ) {
        setError(
          "From date cannot be later than To date.",
        );

        return;
      }

      setError(
        "",
      );

      setAppliedFilters({
        ...filters,
      });
    };

  const clearFilters =
    () => {
      const cleared =
        getInitialFilters();

      setFilters(
        cleared,
      );

      setAppliedFilters(
        cleared,
      );

      setError(
        "",
      );
    };

  const hasActiveFilters =
    useMemo(
      () =>
        Object.values(
          appliedFilters,
        ).some(
          (
            value,
          ) =>
            value.trim() !==
            "",
        ),
      [
        appliedFilters,
      ],
    );

  const hasDraftFilters =
    useMemo(
      () =>
        Object.values(
          filters,
        ).some(
          (
            value,
          ) =>
            value.trim() !==
            "",
        ),
      [
        filters,
      ],
    );

  /* =======================================================
     PAGINATION
  ======================================================== */

  const goToPage =
    (
      nextPage:
        number,
    ) => {
      if (
        nextPage <
          1 ||
        nextPage >
          pagination.totalPages
      ) {
        return;
      }

      void fetchCustomers(
        nextPage,
        appliedFilters,
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

        const result:
          number[] = [];

        const current =
          pagination.page;

        const start =
          Math.max(
            1,
            current -
              2,
          );

        const end =
          Math.min(
            totalPages,
            current +
              2,
          );

        for (
          let currentPage =
            start;

          currentPage <=
          end;

          currentPage +=
            1
        ) {
          result.push(
            currentPage,
          );
        }

        if (
          !result.includes(
            1,
          )
        ) {
          result.unshift(
            1,
          );
        }

        if (
          !result.includes(
            totalPages,
          )
        ) {
          result.push(
            totalPages,
          );
        }

        return result;
      },
      [
        pagination,
      ],
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

            pagination.total,
          );

        return `${start.toLocaleString()}–${end.toLocaleString()} of ${pagination.total.toLocaleString()}`;
      },
      [
        pagination,
      ],
    );

  /* =======================================================
     SUMMARY
  ======================================================== */

  const summary =
    useMemo(
      () => {
        return customers.reduce(
          (
            accumulator,
            item,
          ) => {
            accumulator.totalPayments +=
              Number(
                item.totalPayments ??
                  0,
              );

            accumulator.successfulPayments +=
              Number(
                item.successfulPayments ??
                  0,
              );

            accumulator.pendingPayments +=
              Number(
                item.pendingPayments ??
                  0,
              );

            accumulator.failedPayments +=
              Number(
                item.failedPayments ??
                  0,
              );

            accumulator.totalVolume +=
              Number(
                item.totalVolume ??
                  0,
              );

            return accumulator;
          },
          {
            totalPayments:
              0,

            successfulPayments:
              0,

            pendingPayments:
              0,

            failedPayments:
              0,

            totalVolume:
              0,
          },
        );
      },
      [
        customers,
      ],
    );

  const averageCustomerValue =
    customers.length >
    0
      ? summary.totalVolume /
        customers.length
      : 0;

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    /*
     * No extra page background here.
     *
     * Removed:
     * bg-[var(--merchant-background)]
     *
     * Dashboard layout background is now used directly.
     */
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
        <div className="mx-auto max-w-[1800px]">
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
              <div
                className="
                  flex
                  flex-col
                  gap-6

                  xl:flex-row
                  xl:items-center
                  xl:justify-between
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
                      tracking-[0.14em]
                      text-violet-100
                      backdrop-blur
                    "
                  >
                    <Users className="h-3.5 w-3.5" />

                    Merchant customers
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
                    Customers
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
                    Understand customer activity, payment performance,
                    verification status and relationship with your merchant
                    account.
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
                    void fetchCustomers(
                      pagination.page,
                      appliedFilters,
                      {
                        silent:
                          true,
                      },
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                    Total customers
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {pagination.total.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                    Page payments
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {summary.totalPayments.toLocaleString()}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                    Page volume
                  </p>

                  <p
                    className="
                      mt-1
                      whitespace-nowrap
                      text-[clamp(0.9rem,1.4vw,1.1rem)]
                      font-black
                      tabular-nums
                    "
                  >
                    {formatMoney(
                      summary.totalVolume,
                    )}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div
            className="
              mb-6
              grid
              gap-4

              sm:grid-cols-2

              2xl:grid-cols-4
            "
          >
            <SummaryCard
              icon={
                Users
              }
              label="Customers"
              value={
                pagination.total.toLocaleString()
              }
              description="Unique merchant customers"
              featured
              delay={
                0.04
              }
            />

            <SummaryCard
              icon={
                CheckCircle2
              }
              label="Successful payments"
              value={
                summary.successfulPayments.toLocaleString()
              }
              description="Across the current page"
              delay={
                0.09
              }
            />

            <SummaryCard
              icon={
                CreditCard
              }
              label="Payment volume"
              value={
                formatMoney(
                  summary.totalVolume,
                )
              }
              description="Current page successful volume"
              delay={
                0.14
              }
            />

            <SummaryCard
              icon={
                Clock3
              }
              label="Average customer value"
              value={
                formatMoney(
                  averageCustomerValue,
                )
              }
              description="Current page average"
              delay={
                0.19
              }
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <motion.section
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
                0.48,

              delay:
                0.1,
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
            {/* PURPLE HEADER */}

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
                  duration:
                    8,

                  repeat:
                    Infinity,
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
                    <h2 className="text-sm font-black sm:text-base">
                      Customer filters
                    </h2>

                    <p className="mt-0.5 text-xs text-violet-100/75">
                      Search and refine your merchant customer directory
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-violet-100">
                  {
                    visibleRange
                  }
                </span>
              </div>
            </div>

            {/* FILTER BODY */}

            <div className="p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-12">
                {/* SEARCH */}

                <div className="relative xl:col-span-6">
                  <label className="mb-1.5 block px-1 text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
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
                      value={
                        filters.search
                      }
                      onChange={(
                        event,
                      ) =>
                        handleFilterChange(
                          "search",
                          event.target.value,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          applyFilters();
                        }
                      }}
                      placeholder="Customer name or customer ID..."
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

                    {filters.search ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleFilterChange(
                            "search",
                            "",
                          )
                        }
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
                </div>

                {/* ACCOUNT */}

                <div className="xl:col-span-3">
                  <label className="mb-1.5 block px-1 text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
                    Account status
                  </label>

                  <FilterDropdown
                    ariaLabel="Account status"
                    value={
                      filters.status
                    }
                    options={
                      STATUS_OPTIONS
                    }
                    onChange={(
                      value,
                    ) =>
                      handleFilterChange(
                        "status",
                        value,
                      )
                    }
                  />
                </div>

                {/* KYC */}

                <div className="xl:col-span-3">
                  <label className="mb-1.5 block px-1 text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
                    KYC status
                  </label>

                  <FilterDropdown
                    ariaLabel="KYC status"
                    value={
                      filters.kycStatus
                    }
                    options={
                      KYC_OPTIONS
                    }
                    onChange={(
                      value,
                    ) =>
                      handleFilterChange(
                        "kycStatus",
                        value,
                      )
                    }
                  />
                </div>

                {/* FROM */}

                <div className="xl:col-span-3">
                  <DateFilter
                    label="From date"
                    value={
                      filters.from
                    }
                    max={
                      filters.to ||
                      undefined
                    }
                    onChange={(
                      value,
                    ) =>
                      handleFilterChange(
                        "from",
                        value,
                      )
                    }
                  />
                </div>

                {/* TO */}

                <div className="xl:col-span-3">
                  <DateFilter
                    label="To date"
                    value={
                      filters.to
                    }
                    min={
                      filters.from ||
                      undefined
                    }
                    onChange={(
                      value,
                    ) =>
                      handleFilterChange(
                        "to",
                        value,
                      )
                    }
                  />
                </div>

                {/* ACTIONS */}

                <div
                  className="
                    flex
                    items-end
                    gap-2

                    xl:col-span-6
                  "
                >
                  <motion.button
                    whileHover={{
                      y:
                        -1,
                    }}
                    whileTap={{
                      scale:
                        0.98,
                    }}
                    type="button"
                    onClick={
                      applyFilters
                    }
                    className="
                      h-12
                      flex-1
                      rounded-2xl
                      px-5
                      text-sm
                      font-bold
                      text-white
                      merchant-gradient
                      transition

                      hover:opacity-95
                    "
                  >
                    Apply filters
                  </motion.button>

                  {hasDraftFilters ? (
                    <motion.button
                      whileTap={{
                        scale:
                          0.96,
                      }}
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-violet-500/[0.07]
                        text-violet-600
                        transition

                        hover:bg-violet-500/[0.12]
                      "
                      title="Clear filters"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  ) : null}
                </div>
              </div>
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
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

                <div>
                  <p className="text-sm font-bold merchant-text">
                    Unable to load customers
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
                  void fetchCustomers(
                    pagination.page,
                    appliedFilters,
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
                  py-2.5
                  text-sm
                  font-bold
                  merchant-danger
                "
              >
                <RefreshCw className="h-4 w-4" />

                Retry
              </button>
            </div>
          ) : null}

          {/* =================================================
              CUSTOMER DIRECTORY
          ================================================= */}

          <motion.section
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
                0.48,

              delay:
                0.16,
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
            {/* PURPLE DIRECTORY HEADER */}

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
                    <Users className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-sm font-black sm:text-base">
                      Customer directory
                    </h2>

                    <p className="mt-0.5 text-xs text-violet-100/75">
                      {loading
                        ? "Loading customer records..."
                        : `${pagination.total.toLocaleString()} customers found`}
                    </p>
                  </div>
                </div>

                {hasActiveFilters ? (
                  <div
                    className="
                      inline-flex
                      w-fit
                      items-center
                      gap-2
                      rounded-full
                      bg-white/10
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      text-violet-100
                    "
                  >
                    <Filter className="h-3.5 w-3.5" />

                    Filters applied
                  </div>
                ) : null}
              </div>
            </div>

            {/* CONTENT */}

            {loading ? (
              <LoadingCards />
            ) : customers.length ===
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
                  <table className="w-full min-w-[1450px]">
                    <thead>
                      <tr className="bg-violet-500/[0.03] text-left">
                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Customer
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Payments
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Volume
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Avg. payment
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Success rate
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Account
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          KYC
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider merchant-muted">
                          Last payment
                        </th>

                        <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider merchant-muted">
                          View
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map(
                        (
                          item,
                          index,
                        ) => {
                          const accountMeta =
                            getAccountStatusMeta(
                              item.customer
                                ?.accountStatus,
                            );

                          const kycMeta =
                            getKycMeta(
                              item.customer
                                ?.kycStatus,
                            );

                          const AccountIcon =
                            accountMeta.icon;

                          const KycIcon =
                            kycMeta.icon;

                          return (
                            <motion.tr
                              key={
                                item.customerId
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
                              className="
                                transition-colors

                                hover:bg-violet-500/[0.035]
                              "
                            >
                              {/* CUSTOMER */}

                              <td className="px-5 py-4">
                                <div className="flex min-w-[250px] items-center gap-3">
                                  <CustomerAvatar
                                    name={
                                      item.customer
                                        ?.name
                                    }
                                    avatarUrl={
                                      item.customer
                                        ?.avatarUrl
                                    }
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-sm font-bold merchant-text">
                                        {item.customer
                                          ?.name ||
                                          "Customer"}
                                      </p>

                                      {item.customer
                                        ?.emailVerified ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 merchant-success" />
                                      ) : null}
                                    </div>

                                    <p className="mt-1 font-mono text-xs merchant-muted">
                                      {truncate(
                                        item.customerId,
                                        28,
                                      )}
                                    </p>

                                    <p className="mt-1 text-[11px] merchant-muted">
                                      Joined{" "}
                                      {formatCompactDate(
                                        item.customer
                                          ?.createdAt,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* PAYMENTS */}

                              <td className="px-5 py-4">
                                <p className="text-sm font-black merchant-text">
                                  {item.totalPayments.toLocaleString()}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="merchant-success">
                                    {item.successfulPayments.toLocaleString()} successful
                                  </span>

                                  {item.pendingPayments >
                                  0 ? (
                                    <span className="merchant-warning">
                                      {item.pendingPayments.toLocaleString()} pending
                                    </span>
                                  ) : null}
                                </div>

                                {item.failedPayments >
                                0 ? (
                                  <p className="mt-1 text-[11px] merchant-danger">
                                    {item.failedPayments.toLocaleString()} failed
                                  </p>
                                ) : null}
                              </td>

                              {/* VOLUME */}

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-black merchant-text">
                                  {formatMoney(
                                    item.totalVolume,
                                  )}
                                </p>
                              </td>

                              {/* AVG */}

                              <td className="px-5 py-4">
                                <p className="whitespace-nowrap text-sm font-semibold merchant-text">
                                  {formatMoney(
                                    item.averagePaymentValue,
                                  )}
                                </p>
                              </td>

                              {/* RATE */}

                              <td className="px-5 py-4">
                                <div className="min-w-[125px]">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold merchant-text">
                                      {Number(
                                        item.successRate ??
                                          0,
                                      ).toFixed(
                                        1,
                                      )}
                                      %
                                    </span>

                                    <span className="text-[11px] merchant-muted">
                                      success
                                    </span>
                                  </div>

                                  <div
                                    className="
                                      mt-2
                                      h-1.5
                                      overflow-hidden
                                      rounded-full
                                      bg-violet-500/[0.07]
                                    "
                                  >
                                    <motion.div
                                      initial={{
                                        width:
                                          0,
                                      }}
                                      animate={{
                                        width:
                                          `${Math.max(
                                            0,
                                            Math.min(
                                              Number(
                                                item.successRate ??
                                                  0,
                                              ),
                                              100,
                                            ),
                                          )}%`,
                                      }}
                                      transition={{
                                        duration:
                                          0.65,

                                        delay:
                                          0.1 +
                                          index *
                                            0.02,
                                      }}
                                      className="
                                        h-full
                                        rounded-full
                                        merchant-gradient
                                      "
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* ACCOUNT */}

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${accountMeta.className}`}
                                >
                                  <AccountIcon className="h-3.5 w-3.5" />

                                  {
                                    accountMeta.label
                                  }
                                </span>
                              </td>

                              {/* KYC */}

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${kycMeta.className}`}
                                >
                                  <KycIcon className="h-3.5 w-3.5" />

                                  {
                                    kycMeta.label
                                  }
                                </span>
                              </td>

                              {/* LAST PAYMENT */}

                              <td className="px-5 py-4">
                                <div className="min-w-[150px]">
                                  <p className="text-sm font-semibold merchant-text">
                                    {formatCompactDate(
                                      item.lastPaymentAt,
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs merchant-muted">
                                    {item.lastPaymentAt
                                      ? formatDate(
                                          item.lastPaymentAt,
                                        )
                                          .split(
                                            ", ",
                                          )
                                          .at(
                                            -1,
                                          )
                                      : "No payment"}
                                  </p>
                                </div>
                              </td>

                              {/* VIEW */}

                              <td className="px-5 py-4 text-right">
                                <Link
                                  href={`/dashboard/merchant/customers/${encodeURIComponent(
                                    item.customerId,
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
                                  title="View customer"
                                >
                                  <Eye className="h-4 w-4" />
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
                    MOBILE
                ================================================= */}

                <div className="space-y-3 p-4 xl:hidden">
                  {customers.map(
                    (
                      item,
                    ) => {
                      const accountMeta =
                        getAccountStatusMeta(
                          item.customer
                            ?.accountStatus,
                        );

                      const kycMeta =
                        getKycMeta(
                          item.customer
                            ?.kycStatus,
                        );

                      const AccountIcon =
                        accountMeta.icon;

                      const KycIcon =
                        kycMeta.icon;

                      return (
                        <motion.div
                          key={
                            item.customerId
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
                          className="
                            rounded-[22px]
                            bg-violet-500/[0.035]
                            p-4
                          "
                        >
                          <Link
                            href={`/dashboard/merchant/customers/${encodeURIComponent(
                              item.customerId,
                            )}`}
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <CustomerAvatar
                                  name={
                                    item.customer
                                      ?.name
                                  }
                                  avatarUrl={
                                    item.customer
                                      ?.avatarUrl
                                  }
                                />

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold merchant-text">
                                    {item.customer
                                      ?.name ||
                                      "Customer"}
                                  </p>

                                  <p className="mt-1 truncate font-mono text-[11px] merchant-muted">
                                    {
                                      item.customerId
                                    }
                                  </p>
                                </div>
                              </div>

                              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-violet-500" />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${accountMeta.className}`}
                              >
                                <AccountIcon className="h-3.5 w-3.5" />

                                {
                                  accountMeta.label
                                }
                              </span>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${kycMeta.className}`}
                              >
                                <KycIcon className="h-3.5 w-3.5" />

                                {
                                  kycMeta.label
                                }
                              </span>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <MobileMetric
                                label="Payments"
                                value={
                                  item.totalPayments.toLocaleString()
                                }
                              />

                              <MobileMetric
                                label="Volume"
                                value={
                                  formatMoney(
                                    item.totalVolume,
                                  )
                                }
                              />

                              <MobileMetric
                                label="Success"
                                value={`${Number(
                                  item.successRate ??
                                    0,
                                ).toFixed(
                                  1,
                                )}%`}
                              />

                              <MobileMetric
                                label="Last payment"
                                value={
                                  formatCompactDate(
                                    item.lastPaymentAt,
                                  )
                                }
                              />
                            </div>
                          </Link>
                        </motion.div>
                      );
                    },
                  )}
                </div>
              </>
            )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading &&
            customers.length >
              0 &&
            pagination.totalPages >
              1 ? (
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  bg-violet-500/[0.018]
                  px-5
                  py-4

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <p className="text-xs merchant-muted">
                  Showing{" "}

                  <span className="font-bold merchant-text">
                    {
                      visibleRange
                    }
                  </span>
                </p>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(
                        pagination.page -
                          1,
                      )
                    }
                    disabled={
                      !pagination.hasPreviousPage
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
                      transition

                      hover:bg-violet-500/[0.1]
                      hover:text-violet-600

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />

                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map(
                      (
                        pageNumber,
                        index,
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
                          pageNumber -
                            previousPage >
                            1;

                        return (
                          <React.Fragment
                            key={
                              pageNumber
                            }
                          >
                            {showGap ? (
                              <span className="px-1 text-xs merchant-muted">
                                ...
                              </span>
                            ) : null}

                            <button
                              type="button"
                              onClick={() =>
                                goToPage(
                                  pageNumber,
                                )
                              }
                              className={`h-9 min-w-9 rounded-xl px-2 text-xs font-bold transition ${
                                pageNumber ===
                                pagination.page
                                  ? "text-white merchant-gradient"
                                  : "bg-violet-500/[0.055] merchant-text hover:bg-violet-500/[0.1] hover:text-violet-600"
                              }`}
                            >
                              {
                                pageNumber
                              }
                            </button>
                          </React.Fragment>
                        );
                      },
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      goToPage(
                        pagination.page +
                          1,
                      )
                    }
                    disabled={
                      !pagination.hasNextPage
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
                      transition

                      hover:bg-violet-500/[0.1]
                      hover:text-violet-600

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    Next

                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </motion.section>
        </div>
      </div>
    </main>
  );
}