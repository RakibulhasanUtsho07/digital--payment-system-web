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
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileBarChart2,
  Filter,
  Landmark,
  RefreshCw,
  Search,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

import {
  getMerchantReport,
  type MerchantReportResponse,
  type MerchantReportType,
} from "@/lib/api/merchantReportApi";

/* =========================================================
   TYPES
========================================================= */

type ModeFilter =
  | "all"
  | "test"
  | "live";

interface ReportFilters {
  from: string;

  to: string;

  status: string;

  provider: string;

  sourceType: string;

  payoutMethod: string;

  currency: string;

  mode:
    ModeFilter;
}

interface SelectOption {
  value: string;

  label: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_FILTERS:
  ReportFilters = {
  from: "",
  to: "",
  status: "",
  provider: "",
  sourceType: "",
  payoutMethod: "",
  currency: "",
  mode: "all",
};

const REPORT_TABS: Array<{
  value:
    MerchantReportType;

  label: string;

  icon:
    React.ElementType;
}> = [
  {
    value:
      "summary",

    label:
      "Overview",

    icon:
      BarChart3,
  },
  {
    value:
      "payments",

    label:
      "Payment Report",

    icon:
      CircleDollarSign,
  },
  {
    value:
      "payouts",

    label:
      "Payout Report",

    icon:
      WalletCards,
  },
  {
    value:
      "settlements",

    label:
      "Settlement Report",

    icon:
      Landmark,
  },
];

const PAYMENT_STATUS_OPTIONS:
  SelectOption[] = [
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
      "authorized",
    label:
      "Authorized",
  },
  {
    value:
      "captured",
    label:
      "Captured",
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
  {
    value:
      "expired",
    label:
      "Expired",
  },
];

const PAYOUT_STATUS_OPTIONS:
  SelectOption[] = [
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
];

const SETTLEMENT_STATUS_OPTIONS:
  SelectOption[] = [
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
      "settled",
    label:
      "Settled",
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
];

const MODE_OPTIONS:
  SelectOption[] = [
  {
    value:
      "all",
    label:
      "All environments",
  },
  {
    value:
      "test",
    label:
      "Test",
  },
  {
    value:
      "live",
    label:
      "Live",
  },
];

const PAYOUT_METHOD_OPTIONS:
  SelectOption[] = [
  {
    value: "",
    label:
      "All payout methods",
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
      "Mobile wallet",
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
];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value:
    number,

  currency =
    "BDT"
): string {
  const safeValue =
    Number.isFinite(
      value
    )
      ? value
      : 0;

  return `${currency} ${safeValue.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

function formatNumber(
  value:
    number
): string {
  return Number(
    value || 0
  ).toLocaleString(
    "en-BD"
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined
): string {
  if (
    !value
  ) {
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
      year:
        "numeric",

      month:
        "short",

      day:
        "2-digit",
    }
  ).format(
    date
  );
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (
    !value
  ) {
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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll(
      "_",
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

function getStatusClasses(
  status:
    string
): string {
  switch (
    status.toLowerCase()
  ) {
    case "completed":
    case "settled":
      return "bg-emerald-500/10 text-emerald-600";

    case "pending":
    case "processing":
    case "authorized":
    case "captured":
      return "bg-amber-500/10 text-amber-600";

    case "failed":
    case "cancelled":
    case "expired":
      return "bg-rose-500/10 text-rose-600";

    default:
      return "bg-violet-500/10 text-violet-600";
  }
}

function shortId(
  value:
    string
): string {
  if (
    value.length <=
    24
  ) {
    return value;
  }

  return `${value.slice(
    0,
    13
  )}...${value.slice(
    -6
  )}`;
}

function escapeCsvValue(
  value:
    unknown
): string {
  const stringValue =
    value ===
      null ||
    value ===
      undefined
      ? ""
      : String(
          value
        );

  return `"${stringValue.replaceAll(
    '"',
    '""'
  )}"`;
}

function downloadCsv(
  filename:
    string,

  headers:
    string[],

  rows:
    unknown[][]
): void {
  const csv =
    [
      headers
        .map(
          escapeCsvValue
        )
        .join(
          ","
        ),

      ...rows.map(
        (
          row
        ) =>
          row
            .map(
              escapeCsvValue
            )
            .join(
              ","
            )
      ),
    ].join(
      "\n"
    );

  const blob =
    new Blob(
      [
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url
  );
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
          left-[26%]
          h-80
          w-80
          rounded-full
          bg-violet-100/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            -18,
            0,
          ],

          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration:
            14,

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
   CUSTOM SELECT
========================================================= */

function PurpleSelect({
  label,
  value,
  options,
  onChange,
}: {
  label:
    string;

  value:
    string;

  options:
    SelectOption[];

  onChange:
    (
      value:
        string
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
      if (
        !open
      ) {
        return;
      }

      const onOutside =
        (
          event:
            MouseEvent
        ) => {
          if (
            !rootRef.current?.contains(
              event.target as
                Node
            )
          ) {
            setOpen(
              false
            );
          }
        };

      const onEscape =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(
              false
            );
          }
        };

      const onScroll =
        () => {
          setOpen(
            false
          );
        };

      document.addEventListener(
        "mousedown",
        onOutside
      );

      document.addEventListener(
        "keydown",
        onEscape
      );

      window.addEventListener(
        "scroll",
        onScroll,
        true
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          onOutside
        );

        document.removeEventListener(
          "keydown",
          onEscape
        );

        window.removeEventListener(
          "scroll",
          onScroll,
          true
        );
      };
    },
    [
      open,
    ]
  );

  return (
    <div
      ref={
        rootRef
      }
      className={`
        relative

        ${
          open
            ? "z-40"
            : "z-10"
        }
      `}
    >
      <label
        className="
          mb-2
          block
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          merchant-muted
        "
      >
        {label}
      </label>

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
          border-0
          bg-violet-500/[0.055]
          px-4
          text-left
          text-sm
          font-bold
          merchant-text
          outline-none
          transition

          hover:bg-violet-500/[0.09]

          focus:ring-4
          focus:ring-violet-500/[0.08]
        "
      >
        <span className="truncate">
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

      {open ? (
        <motion.div
          initial={{
            opacity:
              0,

            y:
              -5,

            scale:
              0.98,
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
              0.16,
          }}
          className="
            absolute
            left-0
            top-[calc(100%+8px)]
            z-50
            w-full
            min-w-[190px]
            overflow-hidden
            rounded-2xl
            merchant-surface
            p-1.5
            shadow-[0_22px_55px_rgba(40,18,80,0.16)]
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
                    gap-3
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
      ) : null}
    </div>
  );
}

/* =========================================================
   TEXT / DATE FIELD
========================================================= */

function FilterField({
  label,
  type,
  value,
  onChange,
  placeholder,
  maxLength,
  min,
  max,
}: {
  label:
    string;

  type:
    "text" |
    "date";

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  placeholder?:
    string;

  maxLength?:
    number;

  min?:
    string;

  max?:
    string;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
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
        type={
          type
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        maxLength={
          maxLength
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
          h-12
          w-full
          rounded-2xl
          border-0
          bg-violet-500/[0.055]
          px-4
          text-sm
          font-semibold
          merchant-text
          outline-none

          placeholder:text-slate-400

          focus:ring-4
          focus:ring-violet-500/[0.08]
        "
      />
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  secondary,
  icon:
    Icon,
  featured = false,
  delay = 0,
}: {
  label:
    string;

  value:
    string;

  secondary:
    string;

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
      transition={{
        delay,
      }}
      whileHover={{
        y:
          -3,
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
            : "merchant-surface"
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
        <div className="min-w-0 flex-1">
          <p
            className={`
              text-[10px]
              font-black
              uppercase
              tracking-[0.13em]

              ${
                featured
                  ? "text-violet-100/75"
                  : "merchant-muted"
              }
            `}
          >
            {label}
          </p>

          <p
            title={
              value
            }
            className={`
              mt-3
              truncate
              text-[clamp(1rem,1.7vw,1.45rem)]
              font-black
              leading-tight
              tracking-[-0.03em]
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
            className={`
              mt-2
              truncate
              text-xs

              ${
                featured
                  ? "text-violet-100/75"
                  : "merchant-muted"
              }
            `}
          >
            {secondary}
          </p>
        </div>

        <div
          className={`
            flex
            h-11
            w-11
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
   REPORT METRIC
========================================================= */

function ReportMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -2,
      }}
      className="
        min-w-0
        rounded-2xl
        bg-violet-500/[0.045]
        p-4
      "
    >
      <p
        className="
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          merchant-muted
        "
      >
        {label}
      </p>

      <p
        title={
          value
        }
        className="
          mt-2
          truncate
          text-sm
          font-black
          merchant-text
          tabular-nums
        "
      >
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantReportsPage() {
  const [
    reportType,
    setReportType,
  ] =
    useState<
      MerchantReportType
    >(
      "summary"
    );

  const [
    filters,
    setFilters,
  ] =
    useState<
      ReportFilters
    >({
      ...EMPTY_FILTERS,
    });

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<
      ReportFilters
    >({
      ...EMPTY_FILTERS,
    });

  const [
    report,
    setReport,
  ] =
    useState<
      MerchantReportResponse | null
    >(
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
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    filterOpen,
    setFilterOpen,
  ] =
    useState(
      true
    );

  /* =======================================================
     LOAD
  ======================================================== */

  const loadReport =
    useCallback(
      async (
        refresh =
          false
      ) => {
        try {
          if (
            appliedFilters.from &&
            appliedFilters.to &&
            appliedFilters.from >
              appliedFilters.to
          ) {
            throw new Error(
              "From date cannot be later than To date."
            );
          }

          setError(
            ""
          );

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

          const result =
            await getMerchantReport({
              reportType,

              from:
                appliedFilters.from ||
                undefined,

              to:
                appliedFilters.to ||
                undefined,

              status:
                appliedFilters.status ||
                undefined,

              provider:
                reportType ===
                "payments"
                  ? appliedFilters.provider ||
                    undefined
                  : undefined,

              sourceType:
                reportType ===
                "payments"
                  ? appliedFilters.sourceType ||
                    undefined
                  : undefined,

              payoutMethod:
                reportType ===
                "payouts"
                  ? appliedFilters.payoutMethod ||
                    undefined
                  : undefined,

              currency:
                appliedFilters.currency ||
                undefined,

              mode:
                reportType ===
                  "payments" &&
                appliedFilters.mode !==
                  "all"
                  ? appliedFilters.mode
                  : undefined,
            });

          setReport(
            result
          );
        } catch (
          requestError:
            unknown
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load merchant report."
          );

          setReport(
            null
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
        reportType,
      ]
    );

  useEffect(
    () => {
      void loadReport();
    },
    [
      loadReport,
    ]
  );

  /* =======================================================
     REPORT TYPE
  ======================================================== */

  const changeReportType =
    (
      nextType:
        MerchantReportType
    ) => {
      if (
        nextType ===
        reportType
      ) {
        return;
      }

      const nextFilters:
        ReportFilters = {
        ...filters,

        status:
          "",

        provider:
          "",

        sourceType:
          "",

        payoutMethod:
          "",

        mode:
          "all",
      };

      setReportType(
        nextType
      );

      setFilters(
        nextFilters
      );

      setAppliedFilters(
        nextFilters
      );
    };

  /* =======================================================
     APPLY / RESET
  ======================================================== */

  const applyFilters =
    () => {
      if (
        filters.from &&
        filters.to &&
        filters.from >
          filters.to
      ) {
        setError(
          "From date cannot be later than To date."
        );

        return;
      }

      setError(
        ""
      );

      setAppliedFilters({
        ...filters,

        provider:
          filters.provider
            .trim()
            .toLowerCase(),

        sourceType:
          filters.sourceType
            .trim()
            .toLowerCase(),

        currency:
          filters.currency
            .trim()
            .toUpperCase(),
      });
    };

  const resetFilters =
    () => {
      const clean = {
        ...EMPTY_FILTERS,
      };

      setFilters(
        clean
      );

      setAppliedFilters(
        clean
      );

      setError(
        ""
      );
    };

  const hasFilters =
    Boolean(
      filters.from ||
      filters.to ||
      filters.status ||
      filters.provider ||
      filters.sourceType ||
      filters.payoutMethod ||
      filters.currency ||
      filters.mode !==
        "all"
    );

  /* =======================================================
     STATUS OPTIONS
  ======================================================== */

  const statusOptions =
    reportType ===
      "payments"
      ? PAYMENT_STATUS_OPTIONS
      : reportType ===
          "payouts"
        ? PAYOUT_STATUS_OPTIONS
        : reportType ===
            "settlements"
          ? SETTLEMENT_STATUS_OPTIONS
          : [
              {
                value:
                  "",

                label:
                  "All statuses",
              },
            ];

  /* =======================================================
     SUMMARY
  ======================================================== */

  const summaryCards =
    useMemo(
      () => {
        if (
          !report ||
          report.reportType !==
            "summary"
        ) {
          return [];
        }

        const currency =
          report.merchant
            .defaultCurrency;

        return [
          {
            label:
              "Completed Payments",

            value:
              formatNumber(
                report.report
                  .paymentSummary
                  .completedCount
              ),

            secondary:
              formatMoney(
                report.report
                  .paymentSummary
                  .completedAmount,

                currency
              ),

            icon:
              CheckCircle2,
          },

          {
            label:
              "Gross Payment Volume",

            value:
              formatMoney(
                report.report
                  .paymentSummary
                  .grossAmount,

                currency
              ),

            secondary:
              `${formatNumber(
                report.report
                  .paymentSummary
                  .count
              )} payments`,

            icon:
              CircleDollarSign,
          },

          {
            label:
              "Payouts",

            value:
              formatMoney(
                report.report
                  .payoutSummary
                  .netAmount,

                currency
              ),

            secondary:
              `${formatNumber(
                report.report
                  .payoutSummary
                  .count
              )} payout requests`,

            icon:
              WalletCards,
          },

          {
            label:
              "Settlements",

            value:
              formatMoney(
                report.report
                  .settlementSummary
                  .netAmount,

                currency
              ),

            secondary:
              `${formatNumber(
                report.report
                  .settlementSummary
                  .count
              )} settlements`,

            icon:
              Landmark,
          },
        ];
      },
      [
        report,
      ]
    );

  /* =======================================================
     EXPORT
  ======================================================== */

  const exportReport =
    useCallback(
      () => {
        if (
          !report ||
          report.reportType ===
            "summary"
        ) {
          return;
        }

        const today =
          new Date()
            .toISOString()
            .slice(
              0,
              10
            );

        if (
          report.reportType ===
          "payments"
        ) {
          downloadCsv(
            `coffer-payment-report-${today}.csv`,

            [
              "Payment ID",
              "Order ID",
              "Customer ID",
              "Amount",
              "Currency",
              "Fee",
              "Net Amount",
              "Source Type",
              "Provider",
              "Mode",
              "Status",
              "Merchant Reference",
              "Provider Payment ID",
              "Created At",
              "Completed At",
              "Failed At",
            ],

            report.report.rows.map(
              (
                row
              ) => [
                row.paymentId,
                row.orderId,
                row.customerId,
                row.amount,
                row.currency,
                row.feeAmount,
                row.netAmount,
                row.sourceType,
                row.provider,
                row.mode,
                row.status,
                row.merchantReference,
                row.providerPaymentId,
                row.createdAt,
                row.completedAt,
                row.failedAt,
              ]
            )
          );

          return;
        }

        if (
          report.reportType ===
          "payouts"
        ) {
          downloadCsv(
            `coffer-payout-report-${today}.csv`,

            [
              "Payout ID",
              "Amount",
              "Currency",
              "Fee",
              "Net Amount",
              "Payout Method",
              "Destination",
              "Status",
              "Merchant Reference",
              "External Reference",
              "Requested At",
              "Completed At",
            ],

            report.report.rows.map(
              (
                row
              ) => [
                row.payoutId,
                row.amount,
                row.currency,
                row.feeAmount,
                row.netAmount,
                row.payoutMethod,
                row.destination,
                row.status,
                row.merchantReference,
                row.externalReference,
                row.requestedAt,
                row.completedAt,
              ]
            )
          );

          return;
        }

        downloadCsv(
          `coffer-settlement-report-${today}.csv`,

          [
            "Settlement ID",
            "Period Start",
            "Period End",
            "Currency",
            "Payment Count",
            "Gross Amount",
            "Fee Amount",
            "Refund Amount",
            "Adjustment Amount",
            "Net Amount",
            "Status",
            "Payout ID",
            "Settled At",
          ],

          report.report.rows.map(
            (
              row
            ) => [
              row.settlementId,
              row.periodStart,
              row.periodEnd,
              row.currency,
              row.paymentCount,
              row.grossAmount,
              row.feeAmount,
              row.refundAmount,
              row.adjustmentAmount,
              row.netAmount,
              row.status,
              row.payoutId,
              row.settledAt,
            ]
          )
        );
      },
      [
        report,
      ]
    );

  /* =======================================================
     HERO DATA
  ======================================================== */

  const merchantName =
    report?.merchant
      .businessDisplayName ||
    report?.merchant
      .businessName ||
    "Merchant";

  const reportTitle =
    reportType ===
      "payments"
      ? "Payment Report"
      : reportType ===
          "payouts"
        ? "Payout Report"
        : reportType ===
            "settlements"
          ? "Settlement Report"
          : "Report Overview";

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
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* =================================================
              HERO
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
            transition={{
              duration:
                0.5,
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
                    "
                  >
                    <FileBarChart2 className="h-3.5 w-3.5" />

                    Merchant intelligence
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight">
                    Reports & Exports
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/80">
                    Analyze real Coffer gateway payments, payouts and
                    settlements with financial summaries and CSV
                    exports.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{
                      y:
                        -2,
                    }}
                    whileTap={{
                      scale:
                        0.97,
                    }}
                    type="button"
                    disabled={
                      refreshing ||
                      loading
                    }
                    onClick={() =>
                      void loadReport(
                        true
                      )
                    }
                    className="
                      inline-flex
                      h-11
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

                  <motion.button
                    whileHover={{
                      y:
                        -2,
                    }}
                    whileTap={{
                      scale:
                        0.97,
                    }}
                    type="button"
                    disabled={
                      !report ||
                      report.reportType ===
                        "summary" ||
                      loading
                    }
                    onClick={
                      exportReport
                    }
                    className="
                      inline-flex
                      h-11
                      items-center
                      gap-2
                      rounded-2xl
                      bg-white
                      px-4
                      text-sm
                      font-black
                      text-violet-700

                      disabled:cursor-not-allowed
                      disabled:opacity-45
                    "
                  >
                    <Download className="h-4 w-4" />

                    Export CSV
                  </motion.button>
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Current report
                  </p>

                  <p className="mt-1 text-base font-black">
                    {
                      reportTitle
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Merchant
                  </p>

                  <p className="mt-1 truncate text-base font-black">
                    {
                      merchantName
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
                    Generated
                  </p>

                  <p className="mt-1 truncate text-base font-black">
                    {report
                      ? formatDateTime(
                          report.generatedAt
                        )
                      : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              TABS
          ================================================= */}

          <section
            className="
              overflow-hidden
              rounded-[24px]
              merchant-surface
              p-2
            "
          >
            <div
              className="
                flex
                min-w-max
                gap-2
                overflow-x-auto
                scroll-smooth

                [scrollbar-width:none]
                [-ms-overflow-style:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {REPORT_TABS.map(
                (
                  item
                ) => {
                  const Icon =
                    item.icon;

                  const active =
                    reportType ===
                    item.value;

                  return (
                    <motion.button
                      key={
                        item.value
                      }
                      whileTap={{
                        scale:
                          0.97,
                      }}
                      type="button"
                      onClick={() =>
                        changeReportType(
                          item.value
                        )
                      }
                      className={`
                        inline-flex
                        h-11
                        items-center
                        gap-2
                        rounded-2xl
                        px-4
                        text-sm
                        font-black
                        transition

                        ${
                          active
                            ? "bg-violet-600 text-white"
                            : "merchant-text hover:bg-violet-500/[0.06] hover:text-violet-600"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />

                      {
                        item.label
                      }
                    </motion.button>
                  );
                }
              )}
            </div>
          </section>

          {/* =================================================
              FILTERS
          ================================================= */}

          <motion.section
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
              overflow-visible
              rounded-[28px]
              merchant-surface
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
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
                    Report filters
                  </h2>

                  <p className="mt-0.5 text-xs text-violet-100/70">
                    Refine the financial report before generating it
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFilterOpen(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="
                  flex
                  h-9
                  items-center
                  gap-2
                  rounded-xl
                  bg-white/10
                  px-3
                  text-xs
                  font-bold

                  hover:bg-white/15
                "
              >
                {filterOpen
                  ? "Hide"
                  : "Show"}

                <ChevronDown
                  className={`h-4 w-4 transition ${
                    filterOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </div>

            {filterOpen ? (
              <div className="p-4 sm:p-5">
                <div
                  className="
                    grid
                    gap-4

                    md:grid-cols-2

                    xl:grid-cols-3
                  "
                >
                  <FilterField
                    label="From date"
                    type="date"
                    value={
                      filters.from
                    }
                    max={
                      filters.to ||
                      undefined
                    }
                    onChange={(
                      value
                    ) =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,

                          from:
                            value,
                        })
                      )
                    }
                  />

                  <FilterField
                    label="To date"
                    type="date"
                    value={
                      filters.to
                    }
                    min={
                      filters.from ||
                      undefined
                    }
                    onChange={(
                      value
                    ) =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,

                          to:
                            value,
                        })
                      )
                    }
                  />

                  {reportType !==
                  "summary" ? (
                    <PurpleSelect
                      label="Status"
                      value={
                        filters.status
                      }
                      options={
                        statusOptions
                      }
                      onChange={(
                        value
                      ) =>
                        setFilters(
                          (
                            current
                          ) => ({
                            ...current,

                            status:
                              value,
                          })
                        )
                      }
                    />
                  ) : null}

                  {reportType ===
                  "payments" ? (
                    <>
                      <FilterField
                        label="Provider"
                        type="text"
                        placeholder="damo_wallet, paypal..."
                        value={
                          filters.provider
                        }
                        onChange={(
                          value
                        ) =>
                          setFilters(
                            (
                              current
                            ) => ({
                              ...current,

                              provider:
                                value,
                            })
                          )
                        }
                      />

                      <FilterField
                        label="Source type"
                        type="text"
                        placeholder="wallet, card..."
                        value={
                          filters.sourceType
                        }
                        onChange={(
                          value
                        ) =>
                          setFilters(
                            (
                              current
                            ) => ({
                              ...current,

                              sourceType:
                                value,
                            })
                          )
                        }
                      />

                      <PurpleSelect
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
                          setFilters(
                            (
                              current
                            ) => ({
                              ...current,

                              mode:
                                value as
                                  ModeFilter,
                            })
                          )
                        }
                      />
                    </>
                  ) : null}

                  {reportType ===
                  "payouts" ? (
                    <PurpleSelect
                      label="Payout method"
                      value={
                        filters.payoutMethod
                      }
                      options={
                        PAYOUT_METHOD_OPTIONS
                      }
                      onChange={(
                        value
                      ) =>
                        setFilters(
                          (
                            current
                          ) => ({
                            ...current,

                            payoutMethod:
                              value,
                          })
                        )
                      }
                    />
                  ) : null}

                  <FilterField
                    label="Currency"
                    type="text"
                    maxLength={
                      3
                    }
                    placeholder={
                      "BDT"
                    }
                    value={
                      filters.currency
                    }
                    onChange={(
                      value
                    ) =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,

                          currency:
                            value.toUpperCase(),
                        })
                      )
                    }
                  />
                </div>

                <div
                  className="
                    mt-5
                    flex
                    flex-col
                    gap-2

                    sm:flex-row
                    sm:justify-end
                  "
                >
                  {hasFilters ? (
                    <button
                      type="button"
                      onClick={
                        resetFilters
                      }
                      className="
                        inline-flex
                        h-11
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-violet-500/[0.06]
                        px-4
                        text-sm
                        font-bold
                        text-violet-600

                        hover:bg-violet-500/[0.1]
                      "
                    >
                      <X className="h-4 w-4" />

                      Clear filters
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={
                      applyFilters
                    }
                    className="
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-violet-600
                      px-5
                      text-sm
                      font-black
                      text-white

                      hover:bg-violet-700

                      disabled:opacity-50
                    "
                  >
                    <Search className="h-4 w-4" />

                    Generate report
                  </button>
                </div>
              </div>
            ) : null}
          </motion.section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <motion.div
              initial={{
                opacity:
                  0,

                y:
                  -5,
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
                rounded-2xl
                bg-rose-500/[0.07]
                p-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p className="text-sm font-black text-rose-600">
                  Unable to load report
                </p>

                <p className="mt-1 text-xs text-rose-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadReport(
                    true
                  )
                }
                className="
                  inline-flex
                  h-9
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-rose-500/10
                  px-4
                  text-xs
                  font-black
                  text-rose-600
                "
              >
                <RefreshCw className="h-3.5 w-3.5" />

                Try again
              </button>
            </motion.div>
          ) : null}

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {reportType ===
          "summary" ? (
            <section>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({
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
                        className="
                          h-36
                          animate-pulse
                          rounded-[24px]
                          bg-violet-500/[0.045]
                        "
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map(
                    (
                      card,
                      index
                    ) => (
                      <SummaryCard
                        key={
                          card.label
                        }
                        {...card}
                        featured={
                          index ===
                          0
                        }
                        delay={
                          index *
                          0.05
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          ) : (
            <ReportWorkspace
              report={
                report
              }
              reportType={
                reportType
              }
              loading={
                loading
              }
              title={
                reportTitle
              }
              onExport={
                exportReport
              }
            />
          )}

          {/* =================================================
              PURPLE REPORT CENTER
          ================================================= */}

          <motion.section
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
              relative
              overflow-hidden
              rounded-[26px]
              p-5
              text-white
            "
            style={{
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 60%,#9333EA 100%)",
            }}
          >
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-black">
                    Coffer Report Center
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-violet-100/75">
                    Reports use your real merchant payment, payout and
                    settlement records. CSV exports are generated from
                    the currently loaded report.
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100">
                No demo financial records
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   REPORT WORKSPACE
========================================================= */

function ReportWorkspace({
  report,
  reportType,
  loading,
  title,
  onExport,
}: {
  report:
    MerchantReportResponse | null;

  reportType:
    MerchantReportType;

  loading:
    boolean;

  title:
    string;

  onExport:
    () => void;
}) {
  return (
    <motion.section
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
        overflow-hidden
        rounded-[28px]
        merchant-surface
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
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
            Financial report
          </p>

          <h2 className="mt-1 text-lg font-black">
            {title}
          </h2>

          <p className="mt-1 text-xs text-violet-100/70">
            Generated{" "}
            {report
              ? formatDateTime(
                  report.generatedAt
                )
              : "—"}
          </p>
        </div>

        {report &&
        report.reportType !==
          "summary" ? (
          <button
            type="button"
            onClick={
              onExport
            }
            className="
              inline-flex
              h-10
              w-fit
              items-center
              gap-2
              rounded-xl
              bg-white/10
              px-4
              text-xs
              font-black
              text-white

              hover:bg-white/15
            "
          >
            <Download className="h-4 w-4" />

            Export CSV
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-h-[340px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-600" />

            <p className="mt-3 text-sm font-bold merchant-text">
              Generating report...
            </p>
          </div>
        </div>
      ) : !report ? (
        <EmptyReport />
      ) : report.reportType ===
        "payments" ? (
        <PaymentReportView
          report={
            report
          }
        />
      ) : report.reportType ===
        "payouts" ? (
        <PayoutReportView
          report={
            report
          }
        />
      ) : report.reportType ===
        "settlements" ? (
        <SettlementReportView
          report={
            report
          }
        />
      ) : reportType !==
        "summary" ? (
        <EmptyReport />
      ) : null}
    </motion.section>
  );
}

/* =========================================================
   PAYMENT REPORT
========================================================= */

function PaymentReportView({
  report,
}: {
  report:
    Extract<
      MerchantReportResponse,
      {
        reportType:
          "payments";
      }
    >;
}) {
  return (
    <>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <ReportMetric
          label="Payments"
          value={formatNumber(
            report.report.summary
              .count
          )}
        />

        <ReportMetric
          label="Gross volume"
          value={formatMoney(
            report.report.summary
              .grossAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Fees"
          value={formatMoney(
            report.report.summary
              .feeAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Completed"
          value={formatNumber(
            report.report.summary
              .completedCount
          )}
        />

        <ReportMetric
          label="Completed volume"
          value={formatMoney(
            report.report.summary
              .completedAmount,

            report.merchant
              .defaultCurrency
          )}
        />
      </div>

      <HiddenScrollTable>
        <table className="w-full min-w-[1180px] text-left">
          <ReportTableHead
            columns={[
              "Payment",
              "Amount",
              "Provider",
              "Source",
              "Status",
              "Mode",
              "Created",
            ]}
          />

          <tbody>
            {report.report.rows.map(
              (
                row
              ) => (
                <tr
                  key={
                    row.paymentId
                  }
                  className="
                    transition

                    hover:bg-violet-500/[0.025]
                  "
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/merchant/payments/${encodeURIComponent(
                        row.paymentId
                      )}`}
                      className="font-mono text-xs font-black text-violet-600 hover:underline"
                    >
                      {shortId(
                        row.paymentId
                      )}
                    </Link>

                    {row.merchantReference ? (
                      <p className="mt-1 text-[10px] merchant-muted">
                        Ref:{" "}
                        {
                          row.merchantReference
                        }
                      </p>
                    ) : null}
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm font-black merchant-text">
                      {formatMoney(
                        row.amount,
                        row.currency
                      )}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-[10px] merchant-muted">
                      Fee{" "}
                      {formatMoney(
                        row.feeAmount,
                        row.currency
                      )}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm merchant-text">
                    {formatStatus(
                      row.provider ||
                        "—"
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm merchant-text">
                    {formatStatus(
                      row.sourceType ||
                        "—"
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        row.status
                      }
                    />
                  </td>

                  <td className="px-5 py-4 text-sm capitalize merchant-text">
                    {
                      row.mode
                    }
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs merchant-muted">
                    {formatDate(
                      row.createdAt
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </HiddenScrollTable>

      {report.report.rows.length ===
      0 ? (
        <EmptyRows />
      ) : null}
    </>
  );
}

/* =========================================================
   PAYOUT REPORT
========================================================= */

function PayoutReportView({
  report,
}: {
  report:
    Extract<
      MerchantReportResponse,
      {
        reportType:
          "payouts";
      }
    >;
}) {
  return (
    <>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <ReportMetric
          label="Requests"
          value={formatNumber(
            report.report.summary
              .count
          )}
        />

        <ReportMetric
          label="Requested"
          value={formatMoney(
            report.report.summary
              .amount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Fees"
          value={formatMoney(
            report.report.summary
              .feeAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Net"
          value={formatMoney(
            report.report.summary
              .netAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Completed"
          value={formatMoney(
            report.report.summary
              .completedAmount,

            report.merchant
              .defaultCurrency
          )}
        />
      </div>

      <HiddenScrollTable>
        <table className="w-full min-w-[1120px] text-left">
          <ReportTableHead
            columns={[
              "Payout",
              "Amount",
              "Method",
              "Destination",
              "Status",
              "Requested",
            ]}
          />

          <tbody>
            {report.report.rows.map(
              (
                row
              ) => (
                <tr
                  key={
                    row.payoutId
                  }
                  className="transition hover:bg-violet-500/[0.025]"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/merchant/payouts/${encodeURIComponent(
                        row.payoutId
                      )}`}
                      className="font-mono text-xs font-black text-violet-600 hover:underline"
                    >
                      {shortId(
                        row.payoutId
                      )}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm font-black merchant-text">
                      {formatMoney(
                        row.amount,
                        row.currency
                      )}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-[10px] merchant-muted">
                      Net{" "}
                      {formatMoney(
                        row.netAmount,
                        row.currency
                      )}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm merchant-text">
                    {formatStatus(
                      row.payoutMethod
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm merchant-text">
                    {row.destination ||
                      "—"}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        row.status
                      }
                    />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs merchant-muted">
                    {formatDate(
                      row.requestedAt
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </HiddenScrollTable>

      {report.report.rows.length ===
      0 ? (
        <EmptyRows />
      ) : null}
    </>
  );
}

/* =========================================================
   SETTLEMENT REPORT
========================================================= */

function SettlementReportView({
  report,
}: {
  report:
    Extract<
      MerchantReportResponse,
      {
        reportType:
          "settlements";
      }
    >;
}) {
  return (
    <>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-6">
        <ReportMetric
          label="Settlements"
          value={formatNumber(
            report.report.summary
              .count
          )}
        />

        <ReportMetric
          label="Gross"
          value={formatMoney(
            report.report.summary
              .grossAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Fees"
          value={formatMoney(
            report.report.summary
              .feeAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Refunds"
          value={formatMoney(
            report.report.summary
              .refundAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Adjustments"
          value={formatMoney(
            report.report.summary
              .adjustmentAmount,

            report.merchant
              .defaultCurrency
          )}
        />

        <ReportMetric
          label="Net"
          value={formatMoney(
            report.report.summary
              .netAmount,

            report.merchant
              .defaultCurrency
          )}
        />
      </div>

      <HiddenScrollTable>
        <table className="w-full min-w-[1220px] text-left">
          <ReportTableHead
            columns={[
              "Settlement",
              "Period",
              "Payments",
              "Gross",
              "Fees",
              "Refunds",
              "Net",
              "Status",
            ]}
          />

          <tbody>
            {report.report.rows.map(
              (
                row
              ) => (
                <tr
                  key={
                    row.settlementId
                  }
                  className="transition hover:bg-violet-500/[0.025]"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/merchant/settlement/${encodeURIComponent(
                        row.settlementId
                      )}`}
                      className="font-mono text-xs font-black text-violet-600 hover:underline"
                    >
                      {shortId(
                        row.settlementId
                      )}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-xs merchant-text">
                      {formatDate(
                        row.periodStart
                      )}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-[10px] merchant-muted">
                      to{" "}
                      {formatDate(
                        row.periodEnd
                      )}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-black merchant-text">
                    {formatNumber(
                      row.paymentCount
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-sm font-bold merchant-text">
                    {formatMoney(
                      row.grossAmount,
                      row.currency
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-sm merchant-text">
                    {formatMoney(
                      row.feeAmount,
                      row.currency
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-sm text-rose-600">
                    {formatMoney(
                      row.refundAmount,
                      row.currency
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-sm font-black text-violet-600">
                    {formatMoney(
                      row.netAmount,
                      row.currency
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        row.status
                      }
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </HiddenScrollTable>

      {report.report.rows.length ===
      0 ? (
        <EmptyRows />
      ) : null}
    </>
  );
}

/* =========================================================
   TABLE COMPONENTS
========================================================= */

function HiddenScrollTable({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        overflow-x-auto
        scroll-smooth
        overscroll-x-contain
        touch-pan-x

        [scrollbar-width:none]
        [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      {children}
    </div>
  );
}

function ReportTableHead({
  columns,
}: {
  columns:
    string[];
}) {
  return (
    <thead>
      <tr className="bg-violet-500/[0.03]">
        {columns.map(
          (
            column
          ) => (
            <th
              key={
                column
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
              "
            >
              {
                column
              }
            </th>
          )
        )}
      </tr>
    </thead>
  );
}

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1.5
        text-[10px]
        font-black

        ${getStatusClasses(
          status
        )}
      `}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyReport() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/[0.08] text-violet-600">
          <FileBarChart2 className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black merchant-text">
          No report available
        </p>

        <p className="mt-1 text-xs merchant-muted">
          Try generating the report again.
        </p>
      </div>
    </div>
  );
}

function EmptyRows() {
  return (
    <div className="flex min-h-[220px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/[0.07] text-violet-600">
          <FileBarChart2 className="h-5 w-5" />
        </div>

        <p className="mt-3 text-sm font-black merchant-text">
          No records found
        </p>

        <p className="mt-1 text-xs merchant-muted">
          Try changing the current report filters.
        </p>
      </div>
    </div>
  );
}