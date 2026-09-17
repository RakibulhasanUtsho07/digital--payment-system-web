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
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileWarning,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";

import {
  getMerchantDisputes,
  type MerchantDispute,
  type MerchantDisputeStatus,
} from "@/lib/api/merchantDisputeApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE =
  20;

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "disputed",
    label: "Disputed",
  },
  {
    value: "under_review",
    label: "Under Review",
  },
  {
    value: "won",
    label: "Won",
  },
  {
    value: "lost",
    label: "Lost",
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount:
    string,

  currency:
    string
): string {
  const value =
    Number(amount);

  if (
    !Number.isFinite(
      value
    )
  ) {
    return `${currency} 0.00`;
  }

  return `${currency} ${value.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value:
    string
): string {
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

function shortId(
  value:
    string
): string {
  if (
    value.length <=
    22
  ) {
    return value;
  }

  return `${value.slice(
    0,
    12
  )}...${value.slice(
    -6
  )}`;
}

function statusLabel(
  status:
    string
): string {
  switch (status) {
    case "disputed":
      return "Disputed";

    case "under_review":
      return "Under Review";

    case "won":
      return "Won";

    case "lost":
      return "Lost";

    default:
      return status;
  }
}

function reasonLabel(
  reason:
    string
): string {
  return reason
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        char
      ) =>
        char.toUpperCase()
    );
}

function statusClasses(
  status:
    string
): string {
  switch (status) {
    case "disputed":
      return "bg-rose-500/10 text-rose-600";

    case "under_review":
      return "bg-amber-500/10 text-amber-600";

    case "won":
      return "bg-emerald-500/10 text-emerald-600";

    case "lost":
      return "bg-slate-500/10 text-slate-500";

    default:
      return "bg-violet-500/10 text-violet-600";
  }
}

function StatusIcon({
  status,
}: {
  status:
    string;
}) {
  if (
    status ===
    "won"
  ) {
    return (
      <CheckCircle2 className="h-3.5 w-3.5" />
    );
  }

  if (
    status ===
    "lost"
  ) {
    return (
      <XCircle className="h-3.5 w-3.5" />
    );
  }

  if (
    status ===
    "under_review"
  ) {
    return (
      <Clock3 className="h-3.5 w-3.5" />
    );
  }

  return (
    <AlertCircle className="h-3.5 w-3.5" />
  );
}

/* =========================================================
   AURORA
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
            22,
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
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-36
          left-[28%]
          h-72
          w-72
          rounded-full
          bg-violet-200/20
          blur-3xl
        "
        animate={{
          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
        }}
      />
    </>
  );
}

/* =========================================================
   CUSTOM DROPDOWN
========================================================= */

function StatusDropdown({
  value,
  onChange,
}: {
  value:
    MerchantDisputeStatus | "";

  onChange:
    (
      value:
        MerchantDisputeStatus | ""
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const closeOnOutside =
        (
          event:
            MouseEvent
        ) => {
          if (
            !rootRef.current?.contains(
              event.target as Node
            )
          ) {
            setOpen(false);
          }
        };

      const closeOnScroll =
        () => {
          setOpen(false);
        };

      document.addEventListener(
        "mousedown",
        closeOnOutside
      );

      window.addEventListener(
        "scroll",
        closeOnScroll,
        true
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          closeOnOutside
        );

        window.removeEventListener(
          "scroll",
          closeOnScroll,
          true
        );
      };
    },
    [
      open,
    ]
  );

  const selected =
    STATUS_OPTIONS.find(
      (
        item
      ) =>
        item.value ===
        value
    ) ??
    STATUS_OPTIONS[0];

  return (
    <div
      ref={
        rootRef
      }
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className="
          flex
          h-12
          w-full
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-violet-500/[0.055]
          px-4
          text-sm
          font-bold
          merchant-text
          outline-none
          transition

          hover:bg-violet-500/[0.09]
        "
      >
        <span>
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

      {open ? (
        <motion.div
          initial={{
            opacity: 0,
            y: -5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            absolute
            left-0
            top-[calc(100%+8px)]
            z-30
            w-full
            overflow-hidden
            rounded-2xl
            bg-white
            p-1.5
            shadow-[0_22px_55px_rgba(30,15,60,0.17)]

            dark:bg-slate-950
          "
        >
          {STATUS_OPTIONS.map(
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
                      option.value as
                        MerchantDisputeStatus | ""
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
                        : "merchant-text hover:bg-violet-500/[0.05]"
                    }
                  `}
                >
                  {
                    option.label
                  }

                  {active ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
              );
            }
          )}
        </motion.div>
      ) : null}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon:
    Icon,
  featured = false,
  delay = 0,
}: {
  label:
    string;

  value:
    string | number;

  icon:
    React.ElementType;

  featured?:
    boolean;

  delay?:
    number;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
      }}
      whileHover={{
        y: -3,
      }}
      className={`
        relative
        min-w-0
        overflow-hidden
        rounded-[24px]
        p-5

        ${
          featured
            ? "text-white"
            : "bg-white/80 dark:bg-slate-950/50"
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
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.13em] ${
              featured
                ? "text-violet-100/75"
                : "merchant-muted"
            }`}
          >
            {label}
          </p>

          <p
            className={`
              mt-3
              truncate
              text-xl
              font-black
              tracking-tight

              ${
                featured
                  ? "text-white"
                  : "merchant-text"
              }
            `}
          >
            {typeof value ===
            "number"
              ? value.toLocaleString()
              : value}
          </p>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${
              featured
                ? "bg-white/10 text-white"
                : "bg-violet-500/[0.08] text-violet-600"
            }
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantDisputesPage() {
  const [
    disputes,
    setDisputes,
  ] =
    useState<
      MerchantDispute[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      total: 0,
      disputed: 0,
      underReview: 0,
      won: 0,
      lost: 0,
      disputedAmount: "0",
    });

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
      MerchantDisputeStatus | ""
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
    useState<
      string | null
    >(null);

  /* =======================================================
     FETCH
  ======================================================== */

  const fetchDisputes =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          if (
            refresh
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

          const response =
            await getMerchantDisputes({
              page,
              limit:
                PAGE_SIZE,

              search:
                search ||
                undefined,

              status:
                status ||
                undefined,

              from:
                from ||
                undefined,

              to:
                to ||
                undefined,
            });

          setDisputes(
            response.data.disputes
          );

          setSummary(
            response.data.summary
          );

          setPage(
            response.data.pagination.page
          );

          setTotal(
            response.data.pagination.total
          );

          setTotalPages(
            Math.max(
              1,
              response.data.pagination.totalPages
            )
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load disputes."
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
        from,
        page,
        search,
        status,
        to,
      ]
    );

  useEffect(
    () => {
      void fetchDisputes();
    },
    [
      fetchDisputes,
    ]
  );

  /* =======================================================
     SEARCH
  ======================================================== */

  const applySearch =
    () => {
      if (
        from &&
        to &&
        from > to
      ) {
        setError(
          "From date cannot be later than To date."
        );

        return;
      }

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  const clearFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatus("");
      setFrom("");
      setTo("");
      setPage(1);
    };

  const hasFilters =
    Boolean(
      search ||
      status ||
      from ||
      to
    );

  const currency =
    disputes[0]
      ?.currency ||
    "BDT";

  const range =
    useMemo(
      () => {
        if (!total) {
          return "0";
        }

        const start =
          (
            page -
            1
          ) *
            PAGE_SIZE +
          1;

        const end =
          Math.min(
            page *
              PAGE_SIZE,
            total
          );

        return `${start}-${end}`;
      },
      [
        page,
        total,
      ]
    );

  return (
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* HERO */}

          <motion.section
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
              px-5
              py-6
              text-white

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
                <div>
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
                    "
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />

                    Risk & disputes
                  </div>

                  <h1 className="mt-4 text-3xl font-black">
                    Disputes
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/80">
                    Review customer payment disputes, monitor open
                    cases and track dispute outcomes.
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
                    void fetchDisputes(
                      true
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    w-fit
                    items-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-bold
                    text-white

                    hover:bg-white/15

                    disabled:opacity-50
                  "
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh
                </motion.button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Total cases
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {
                      summary.total
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Open disputes
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {summary.disputed +
                      summary.underReview}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Open amount
                  </p>

                  <p className="mt-1 truncate text-lg font-black">
                    {formatMoney(
                      summary.disputedAmount,
                      currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* STATS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              icon={
                FileWarning
              }
              label="Total Cases"
              value={
                summary.total
              }
              featured
            />

            <SummaryCard
              icon={
                AlertCircle
              }
              label="Disputed"
              value={
                summary.disputed
              }
              delay={
                0.04
              }
            />

            <SummaryCard
              icon={
                Clock3
              }
              label="Under Review"
              value={
                summary.underReview
              }
              delay={
                0.08
              }
            />

            <SummaryCard
              icon={
                CheckCircle2
              }
              label="Won"
              value={
                summary.won
              }
              delay={
                0.12
              }
            />

            <SummaryCard
              icon={
                ShieldAlert
              }
              label="Open Amount"
              value={formatMoney(
                summary.disputedAmount,
                currency
              )}
              delay={
                0.16
              }
            />
          </section>

          {/* FILTERS */}

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
              overflow-visible
              rounded-[28px]
              bg-white/65
              shadow-[0_12px_40px_rgba(109,40,217,0.045)]

              dark:bg-slate-950/40
            "
          >
            <div
              className="
                rounded-t-[28px]
                px-5
                py-4
                text-white
              "
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Filter className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="font-black">
                    Dispute filters
                  </h2>

                  <p className="mt-0.5 text-xs text-violet-100/70">
                    Search and narrow real merchant dispute cases
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                grid
                gap-4
                p-4

                md:grid-cols-2

                xl:grid-cols-[minmax(0,1.5fr)_220px_180px_180px_auto]
                xl:p-5
              "
            >
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
                    searchInput
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchInput(
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
                      applySearch();
                    }
                  }}
                  placeholder="Dispute ID, payment ID or customer..."
                  className="
                    h-12
                    w-full
                    rounded-2xl
                    border-0
                    bg-violet-500/[0.055]
                    pl-11
                    pr-10
                    text-sm
                    merchant-text
                    outline-none

                    placeholder:text-slate-400

                    focus:ring-4
                    focus:ring-violet-500/[0.09]
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
                      text-violet-500

                      hover:bg-violet-500/10
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <StatusDropdown
                value={
                  status
                }
                onChange={(
                  value
                ) => {
                  setStatus(
                    value
                  );

                  setPage(1);
                }}
              />

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
                  event
                ) => {
                  setFrom(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="
                  h-12
                  rounded-2xl
                  border-0
                  bg-violet-500/[0.055]
                  px-4
                  text-sm
                  font-semibold
                  merchant-text
                  outline-none

                  focus:ring-4
                  focus:ring-violet-500/[0.09]
                "
              />

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
                  event
                ) => {
                  setTo(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="
                  h-12
                  rounded-2xl
                  border-0
                  bg-violet-500/[0.055]
                  px-4
                  text-sm
                  font-semibold
                  merchant-text
                  outline-none

                  focus:ring-4
                  focus:ring-violet-500/[0.09]
                "
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    applySearch
                  }
                  className="
                    h-12
                    flex-1
                    rounded-2xl
                    bg-violet-600
                    px-5
                    text-sm
                    font-black
                    text-white
                    transition

                    hover:bg-violet-700
                  "
                >
                  Search
                </button>

                {hasFilters ? (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="
                      h-12
                      rounded-2xl
                      bg-violet-500/[0.07]
                      px-4
                      text-sm
                      font-bold
                      text-violet-600
                    "
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </motion.section>

          {/* ERROR */}

          {error ? (
            <motion.section
              initial={{
                opacity: 0,
                y: -5,
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
                bg-rose-500/[0.07]
                p-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                <div>
                  <p className="text-sm font-black merchant-text">
                    Unable to load disputes
                  </p>

                  <p className="mt-1 text-xs text-rose-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchDisputes(
                    true
                  )
                }
                className="
                  rounded-xl
                  bg-rose-500/10
                  px-4
                  py-2
                  text-xs
                  font-black
                  text-rose-600
                "
              >
                Try again
              </button>
            </motion.section>
          ) : null}

          {/* CASE QUEUE */}

          <section
            className="
              overflow-hidden
              rounded-[28px]
              bg-white/65

              dark:bg-slate-950/40
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                px-5
                py-4
                text-white

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
              style={{
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
              }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/65">
                  Case queue
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Dispute cases
                </h2>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                {total ===
                0
                  ? "0 cases"
                  : `${range} of ${total}`}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="h-16 animate-pulse rounded-2xl bg-violet-500/[0.04]"
                    />
                  )
                )}
              </div>
            ) : disputes.length ===
              0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/[0.08] text-violet-600">
                  <FileWarning className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-black merchant-text">
                  {hasFilters
                    ? "No matching disputes"
                    : "No disputes yet"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
                  {hasFilters
                    ? "Try changing or clearing the current filters."
                    : "Customer or provider dispute cases will appear here when they are opened."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 xl:hidden">
                  {disputes.map(
                    (
                      dispute
                    ) => (
                      <Link
                        key={
                          dispute.disputeId
                        }
                        href={`/dashboard/merchant/disputes/${encodeURIComponent(
                          dispute.disputeId
                        )}`}
                        className="
                          block
                          rounded-[22px]
                          bg-violet-500/[0.035]
                          p-4
                          transition

                          hover:bg-violet-500/[0.065]
                        "
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs font-black text-violet-600">
                              {shortId(
                                dispute.disputeId
                              )}
                            </p>

                            <p className="mt-1 truncate text-xs merchant-muted">
                              {dispute.customerName}
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
                              text-[10px]
                              font-black

                              ${statusClasses(
                                dispute.status
                              )}
                            `}
                          >
                            <StatusIcon
                              status={
                                dispute.status
                              }
                            />

                            {statusLabel(
                              dispute.status
                            )}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-violet-500/[0.04] p-3">
                            <p className="text-[9px] font-black uppercase merchant-muted">
                              Amount
                            </p>

                            <p className="mt-1 truncate text-sm font-black merchant-text">
                              {formatMoney(
                                dispute.amount,
                                dispute.currency
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-violet-500/[0.04] p-3">
                            <p className="text-[9px] font-black uppercase merchant-muted">
                              Reason
                            </p>

                            <p className="mt-1 truncate text-xs font-black merchant-text">
                              {reasonLabel(
                                dispute.reason
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  )}
                </div>

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
                  <table className="w-full min-w-[1120px]">
                    <thead>
                      <tr className="bg-violet-500/[0.025]">
                        {[
                          "Dispute",
                          "Customer",
                          "Reason",
                          "Amount",
                          "Status",
                          "Created",
                          "",
                        ].map(
                          (
                            label
                          ) => (
                            <th
                              key={
                                label ||
                                "action"
                              }
                              className="
                                px-5
                                py-3.5
                                text-left
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.12em]
                                merchant-muted

                                last:text-right
                              "
                            >
                              {label}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {disputes.map(
                        (
                          dispute,
                          index
                        ) => (
                          <motion.tr
                            key={
                              dispute.disputeId
                            }
                            initial={{
                              opacity: 0,
                              y: 4,
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
                            className="transition hover:bg-violet-500/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <p className="font-mono text-xs font-black merchant-text">
                                {shortId(
                                  dispute.disputeId
                                )}
                              </p>

                              <p className="mt-1 font-mono text-[10px] merchant-muted">
                                {shortId(
                                  dispute.paymentId
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold merchant-text">
                                {
                                  dispute.customerName
                                }
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-xs font-semibold merchant-text">
                                {reasonLabel(
                                  dispute.reason
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap text-sm font-black merchant-text">
                                {formatMoney(
                                  dispute.amount,
                                  dispute.currency
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
                                  text-[10px]
                                  font-black

                                  ${statusClasses(
                                    dispute.status
                                  )}
                                `}
                              >
                                <StatusIcon
                                  status={
                                    dispute.status
                                  }
                                />

                                {statusLabel(
                                  dispute.status
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap text-xs merchant-muted">
                                {formatDate(
                                  dispute.createdAt
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/dashboard/merchant/disputes/${encodeURIComponent(
                                  dispute.disputeId
                                )}`}
                                className="
                                  inline-flex
                                  h-9
                                  items-center
                                  gap-1.5
                                  rounded-xl
                                  bg-violet-500/[0.07]
                                  px-3
                                  text-xs
                                  font-black
                                  text-violet-600

                                  hover:bg-violet-500/[0.12]
                                "
                              >
                                View

                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </motion.tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 bg-violet-500/[0.018] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs merchant-muted">
                    Showing{" "}
                    {range}{" "}
                    of{" "}
                    {total}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        page <=
                        1
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
                        bg-violet-500/[0.06]
                        px-3
                        text-xs
                        font-bold
                        merchant-text

                        disabled:opacity-40
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />

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
                        page >=
                        totalPages
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
                        bg-violet-500/[0.06]
                        px-3
                        text-xs
                        font-bold
                        merchant-text

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
          </section>
        </div>
      </div>
    </main>
  );
}