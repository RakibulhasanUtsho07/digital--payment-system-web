"use client";

import React, {
  useCallback,
  useEffect,
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
  Banknote,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getMerchantPayoutDetail,
  type MerchantPayout,
  type MerchantPayoutMethod,
  type MerchantPayoutStatus,
} from "@/lib/api/merchantPayoutApi";

/* =========================================================
   TYPES
========================================================= */

interface MerchantInfo {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  defaultCurrency: string;
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
  amount:
    number,

  currency:
    string,
): string {
  const safeAmount =
    Number.isFinite(
      amount,
    )
      ? amount
      : 0;

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
        safeAmount,
      )
      .replace(
        /\u00A0/g,
        " ",
      );
  } catch {
    return `${currency} ${safeAmount.toFixed(
      2,
    )}`;
  }
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
    return "Not available";
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
    return "Not available";
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
    | string
    | null
    | undefined,

  start =
    12,

  end =
    6,
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

function payoutMethodLabel(
  method:
    MerchantPayoutMethod,
): string {
  switch (
    method
  ) {
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

function payoutMethodIcon(
  method:
    MerchantPayoutMethod,
) {
  switch (
    method
  ) {
    case "bank":
      return Banknote;

    case "mobile_wallet":
      return Wallet;

    case "wallet":
      return WalletCards;

    default:
      return CreditCard;
  }
}

function getStatusMeta(
  status:
    MerchantPayoutStatus,
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

        badgeClass:
          "bg-emerald-500/10 text-emerald-600",
      };

    case "processing":
      return {
        label:
          "Processing",

        icon:
          RefreshCw,

        badgeClass:
          "bg-sky-500/10 text-sky-600",
      };

    case "failed":
      return {
        label:
          "Failed",

        icon:
          XCircle,

        badgeClass:
          "bg-rose-500/10 text-rose-600",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        icon:
          XCircle,

        badgeClass:
          "bg-rose-500/10 text-rose-600",
      };

    default:
      return {
        label:
          "Pending",

        icon:
          Clock3,

        badgeClass:
          "bg-amber-500/10 text-amber-600",
      };
  }
}

function getMoneyTextClass(
  value:
    string,
): string {
  if (
    value.length >=
    26
  ) {
    return "text-base sm:text-lg";
  }

  if (
    value.length >=
    21
  ) {
    return "text-lg sm:text-xl";
  }

  if (
    value.length >=
    17
  ) {
    return "text-xl sm:text-2xl";
  }

  return "text-2xl sm:text-3xl";
}

/* =========================================================
   PURPLE BACKGROUND
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
   COPY BUTTON
========================================================= */

function CopyButton({
  value,
  inverse =
    false,
}: {
  value:
    string;

  inverse?:
    boolean;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false,
    );

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          value,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () => {
            setCopied(
              false,
            );
          },
          1400,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

  return (
    <motion.button
      type="button"
      whileTap={{
        scale:
          0.94,
      }}
      onClick={() =>
        void handleCopy()
      }
      className={`
        inline-flex
        h-8
        shrink-0
        items-center
        gap-1.5
        rounded-lg
        px-2.5
        text-xs
        font-bold
        transition

        ${
          inverse
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-violet-500/[0.07] text-violet-600 hover:bg-violet-500/[0.12]"
        }
      `}
    >
      <AnimatePresence
        mode="wait"
        initial={
          false
        }
      >
        {copied ? (
          <motion.span
            key="copied"
            initial={{
              opacity:
                0,

              scale:
                0.85,
            }}
            animate={{
              opacity:
                1,

              scale:
                1,
            }}
            exit={{
              opacity:
                0,

              scale:
                0.85,
            }}
            className="inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />

            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />

            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  copy =
    false,
}: {
  label:
    string;

  value:
    React.ReactNode;

  copy?:
    boolean;
}) {
  const copyValue =
    typeof value ===
    "string"
      ? value
      : "";

  return (
    <div
      className="
        flex
        flex-col
        gap-3
        py-4

        sm:flex-row
        sm:items-start
        sm:justify-between
        sm:gap-6
      "
    >
      <div className="min-w-0">
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

        <div
          className="
            mt-1
            break-words
            text-sm
            font-semibold
            leading-5
            merchant-text
            [overflow-wrap:anywhere]
          "
        >
          {value}
        </div>
      </div>

      {copy &&
      copyValue &&
      copyValue !==
        "Not available" ? (
        <CopyButton
          value={
            copyValue
          }
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   PURPLE DETAIL ROW
========================================================= */

function PurpleDetailRow({
  label,
  value,
  copy =
    false,
}: {
  label:
    string;

  value:
    string;

  copy?:
    boolean;
}) {
  return (
    <div
      className="
        flex
        flex-col
        gap-3
        rounded-2xl
        bg-white/[0.075]
        p-3.5

        sm:flex-row
        sm:items-start
        sm:justify-between
        sm:gap-6
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.12em]
            text-violet-100/65
          "
        >
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold leading-5 text-white [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>

      {copy &&
      value !==
        "Not available" ? (
        <CopyButton
          value={
            value
          }
          inverse
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   TIMELINE
========================================================= */

function TimelineItem({
  icon:
    Icon,
  label,
  value,
  active =
    false,
  last =
    false,
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

  active?:
    boolean;

  last?:
    boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last ? (
        <div
          className="
            absolute
            left-[17px]
            top-9
            h-[calc(100%-14px)]
            w-px
            bg-white/15
          "
        />
      ) : null}

      <motion.div
        initial={{
          scale:
            0.85,

          opacity:
            0,
        }}
        animate={{
          scale:
            1,

          opacity:
            1,
        }}
        className={`
          relative
          z-[1]
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl

          ${
            active
              ? "bg-white/15 text-white"
              : "bg-white/[0.06] text-white/40"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </motion.div>

      <div className="min-w-0 pb-5">
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.12em]
            text-violet-100/60
          "
        >
          {label}
        </p>

        <p
          className={`mt-1 break-words text-sm font-bold leading-5 [overflow-wrap:anywhere] ${
            active
              ? "text-white"
              : "text-white/45"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-[30px] bg-violet-500/[0.07]" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[430px] animate-pulse rounded-[28px] bg-violet-500/[0.045]" />

        <div className="space-y-6">
          <div className="h-52 animate-pulse rounded-[28px] bg-violet-500/[0.05]" />

          <div className="h-72 animate-pulse rounded-[28px] bg-violet-500/[0.045]" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantPayoutDetailsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role,
      ),
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const params =
    useParams<{
      payoutId:
        | string
        | string[];
    }>();

  const rawPayoutId =
    params?.payoutId;

  const payoutId =
    Array.isArray(
      rawPayoutId,
    )
      ? rawPayoutId[0]
      : typeof rawPayoutId ===
          "string"
        ? rawPayoutId
        : "";

  const [
    payout,
    setPayout,
  ] =
    useState<
      MerchantPayout | null
    >(
      null,
    );

  const [
    merchant,
    setMerchant,
  ] =
    useState<
      MerchantInfo | null
    >(
      null,
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

  const loadPayout =
    useCallback(
      async (
        silent =
          false,
      ) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setPayout(null);
          setMerchant(null);
          setError("");

          return;
        }

        if (
          !payoutId
        ) {
          setError(
            "Payout ID is missing.",
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
            await getMerchantPayoutDetail(
              payoutId,
            );

          if (
            response.success ===
            false
          ) {
            throw new Error(
              response.message ||
                "Unable to load payout.",
            );
          }

          if (
            !response.data
              ?.payout
          ) {
            throw new Error(
              "Payout data was not returned.",
            );
          }

          setPayout(
            response.data
              .payout,
          );

          setMerchant(
            response.data
              .merchant,
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load payout.",
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
        isMerchantRole,
        payoutId,
      ],
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void loadPayout();
    },
    [
      isMerchantRole,
      loadPayout,
    ],
  );

  /* =======================================================
     MERCHANT-ONLY REDIRECTING
  ======================================================== */

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant payout details are available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    loading
  ) {
    return (
      <main
        className="
          merchant-theme
          relative
          z-0
          isolate
          min-h-full
          px-4
          py-5

          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-[1300px]">
          <LoadingState />
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================== */

  if (
    !payout
  ) {
    return (
      <main
        className="
          merchant-theme
          flex
          min-h-[560px]
          items-center
          justify-center
          p-4
        "
      >
        <motion.div
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
          className="
            w-full
            max-w-xl
            rounded-[28px]
            bg-white/75
            p-6
            text-center
            shadow-[0_18px_50px_rgba(109,40,217,0.07)]

            dark:bg-slate-950/50
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-rose-500/10
              text-rose-600
            "
          >
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-lg font-black merchant-text">
            Unable to load payout
          </h1>

          <p className="mt-2 text-sm leading-6 merchant-muted">
            {error ||
              "The payout could not be found."}
          </p>

          <div
            className="
              mt-6
              flex
              flex-col
              justify-center
              gap-3

              sm:flex-row
            "
          >
            <button
              type="button"
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void loadPayout();
              }}
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
                font-bold
                text-white
              "
            >
              <RefreshCw className="h-4 w-4" />

              Try again
            </button>

            <Link
              href="/dashboard/merchant/payouts"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                py-2.5
                text-sm
                font-bold
                merchant-text
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to payouts
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  /* =======================================================
     DERIVED
  ======================================================== */

  const status =
    getStatusMeta(
      payout.status,
    );

  const StatusIcon =
    status.icon;

  const MethodIcon =
    payoutMethodIcon(
      payout.payoutMethod,
    );

  const grossAmountText =
    formatMoney(
      payout.amount,
      payout.currency,
    );

  const feeAmountText =
    formatMoney(
      payout.feeAmount,
      payout.currency,
    );

  const netAmountText =
    formatMoney(
      payout.netAmount,
      payout.currency,
    );

  const merchantName =
    merchant
      ?.businessDisplayName ||
    merchant
      ?.businessName ||
    "Merchant";

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
      {/*
       * No extra full page background here.
       * Dashboard layout background remains visible.
       */}
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1300px]">
          {/* =================================================
              BACK
          ================================================= */}

          <div
            className="
              mb-5
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <Link
              href="/dashboard/merchant/payouts"
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                text-sm
                font-bold
                merchant-muted
                transition

                hover:text-violet-600
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to payouts
            </Link>

            <motion.button
              whileHover={{
                y:
                  -1,
              }}
              whileTap={{
                scale:
                  0.97,
              }}
              type="button"
              disabled={
                refreshing
              }
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void loadPayout(
                  true,
                );
              }}
              className="
                inline-flex
                h-10
                w-full
                items-center

                sm:w-auto
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                text-sm
                font-bold
                merchant-text
                transition

                hover:bg-violet-500/[0.12]
                hover:text-violet-600

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

          {/* =================================================
              REFRESH ERROR
          ================================================= */}

          {error ? (
            <div
              className="
                mb-5
                flex
                items-start
                gap-3
                rounded-2xl
                bg-rose-500/[0.06]
                p-4
              "
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <div className="min-w-0">
                <p className="text-sm font-bold merchant-text">
                  Refresh failed
                </p>

                <p className="mt-1 break-words text-sm leading-5 text-rose-600 [overflow-wrap:anywhere]">
                  {error}
                </p>
              </div>
            </div>
          ) : null}

          {/* =================================================
              PURPLE HERO
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
              shadow-[0_20px_58px_rgba(76,29,149,0.18)]

              sm:px-7
              sm:py-7
            "
          >
            <PurpleAuroraBackground />

            <div className="relative z-10 min-w-0">
              <div
                className="
                  flex
                  flex-col
                  gap-6

                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >
                <div className="min-w-0 max-w-3xl">
                  <motion.div
                    variants={
                      heroItem
                    }
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        px-3
                        py-1.5
                        text-xs
                        font-black

                        ${status.badgeClass}
                      `}
                    >
                      <StatusIcon
                        className={`h-3.5 w-3.5 ${
                          payout.status ===
                          "processing"
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                      {status.label}
                    </span>

                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-white/15
                        bg-white/10
                        px-3
                        py-1.5
                        text-xs
                        font-bold
                        text-violet-100
                      "
                    >
                      <MethodIcon className="h-3.5 w-3.5" />

                      {payoutMethodLabel(
                        payout.payoutMethod,
                      )}
                    </span>
                  </motion.div>

                  <motion.p
                    variants={
                      heroItem
                    }
                    className="
                      mt-5
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-violet-100/65
                    "
                  >
                    Payout record
                  </motion.p>

                  <motion.h1
                    variants={
                      heroItem
                    }
                    className="
                      mt-2
                      break-all
                      font-mono
                      text-xl
                      font-black
                      tracking-tight

                      sm:text-2xl
                    "
                  >
                    {payout.payoutId}
                  </motion.h1>

                  <motion.p
                    variants={
                      heroItem
                    }
                    className="
                      mt-3
                      max-w-xl
                      text-sm
                      leading-6
                      text-violet-100/80
                    "
                  >
                    Payout request for{" "}

                    <span className="font-bold text-white">
                      {merchantName}
                    </span>

                    . Track destination, amount, ledger reference and
                    payout lifecycle from this page.
                  </motion.p>
                </div>

                <motion.div
                  variants={
                    heroItem
                  }
                  className="
                    flex
                    h-14
                    w-14
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
                  <Send className="h-6 w-6" />
                </motion.div>
              </div>

              {/* HERO MONEY */}

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
                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.08]
                    p-3
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Requested amount
                  </p>

                  <p
                    title={
                      grossAmountText
                    }
                    className={`
                      mt-1
                      whitespace-nowrap
                      font-black
                      tracking-[-0.035em]
                      tabular-nums

                      ${getMoneyTextClass(
                        grossAmountText,
                      )}
                    `}
                  >
                    {grossAmountText}
                  </p>
                </div>

                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.08]
                    p-3
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Fee
                  </p>

                  <p
                    title={
                      feeAmountText
                    }
                    className={`
                      mt-1
                      whitespace-nowrap
                      font-black
                      tracking-[-0.035em]
                      tabular-nums

                      ${getMoneyTextClass(
                        feeAmountText,
                      )}
                    `}
                  >
                    {feeAmountText}
                  </p>
                </div>

                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.08]
                    p-3
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Net payout
                  </p>

                  <p
                    title={
                      netAmountText
                    }
                    className={`
                      mt-1
                      whitespace-nowrap
                      font-black
                      tracking-[-0.035em]
                      tabular-nums

                      ${getMoneyTextClass(
                        netAmountText,
                      )}
                    `}
                  >
                    {netAmountText}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div
            className="
              grid
              gap-6

              xl:grid-cols-[1.1fr_0.9fr]
            "
          >
            {/* =================================================
                LEFT
            ================================================= */}

            <div className="space-y-6">
              {/* PAYOUT INFO */}

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
                    0.45,

                  delay:
                    0.05,
                }}
                className="
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-500/10
                      text-violet-600
                    "
                  >
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Payout information
                    </h2>

                    <p className="mt-0.5 text-xs merchant-muted">
                      Core payout identifiers and financial details
                    </p>
                  </div>
                </div>

                <DetailRow
                  label="Payout ID"
                  value={
                    payout.payoutId
                  }
                  copy
                />

                <DetailRow
                  label="Merchant"
                  value={
                    merchantName
                  }
                />

                <DetailRow
                  label="Merchant ID"
                  value={
                    payout.merchantId ||
                    merchant?.id ||
                    "Not available"
                  }
                  copy
                />

                <DetailRow
                  label="Payout method"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-xl
                          bg-violet-500/[0.08]
                          text-violet-600
                        "
                      >
                        <MethodIcon className="h-4 w-4" />
                      </span>

                      {payoutMethodLabel(
                        payout.payoutMethod,
                      )}
                    </span>
                  }
                />

                <DetailRow
                  label="Currency"
                  value={
                    payout.currency
                  }
                />

                <DetailRow
                  label="Merchant reference"
                  value={
                    payout.merchantReference ||
                    "Not available"
                  }
                  copy={
                    Boolean(
                      payout.merchantReference,
                    )
                  }
                />

                <DetailRow
                  label="External reference"
                  value={
                    payout.externalReference ||
                    "Not available"
                  }
                  copy={
                    Boolean(
                      payout.externalReference,
                    )
                  }
                />
              </motion.section>

              {/* =================================================
                  PURPLE SECTION 2 — FINANCIAL BREAKDOWN
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
                    0.45,

                  delay:
                    0.1,
                }}
                whileHover={{
                  y:
                    -2,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  p-5
                  text-white
                  shadow-[0_18px_45px_rgba(109,40,217,0.16)]
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="
                    pointer-events-none
                    absolute
                    -right-12
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
                  <div
                    className="
                      mb-5
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div>
                      <h2 className="text-base font-black">
                        Financial breakdown
                      </h2>

                      <p className="mt-1 text-xs text-violet-100/75">
                        Requested amount, fee and net payout
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/15
                        bg-white/10
                      "
                    >
                      <WalletCards className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <PurpleDetailRow
                      label="Requested amount"
                      value={
                        grossAmountText
                      }
                    />

                    <PurpleDetailRow
                      label="Payout fee"
                      value={
                        feeAmountText
                      }
                    />

                    <PurpleDetailRow
                      label="Net amount"
                      value={
                        netAmountText
                      }
                    />

                    <PurpleDetailRow
                      label="Ledger group"
                      value={
                        payout.ledgerEntryGroupId ||
                        "Not available"
                      }
                      copy={
                        Boolean(
                          payout.ledgerEntryGroupId,
                        )
                      }
                    />
                  </div>
                </div>
              </motion.section>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="space-y-6">
              {/* DESTINATION */}

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
                    0.45,

                  delay:
                    0.08,
                }}
                className="
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-500/10
                      text-violet-600
                    "
                  >
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Destination
                    </h2>

                    <p className="mt-0.5 text-xs merchant-muted">
                      Where this payout is being sent
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-5
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
                    Destination label
                  </p>

                  <p className="mt-2 break-words text-sm font-black merchant-text">
                    {payout.destination ||
                      "Not available"}
                  </p>
                </div>

                <div
                  className="
                    mt-3
                    rounded-2xl
                    bg-violet-500/[0.045]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-3

                      sm:flex-row
                      sm:items-start
                      sm:justify-between
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.12em]
                          merchant-muted
                        "
                      >
                        Destination reference
                      </p>

                      <p className="mt-2 break-all text-sm font-black merchant-text">
                        {payout.destinationReference ||
                          "Not available"}
                      </p>
                    </div>

                    {payout.destinationReference ? (
                      <CopyButton
                        value={
                          payout.destinationReference
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </motion.section>

              {/* =================================================
                  PURPLE SECTION 3 — TIMELINE
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
                    0.45,

                  delay:
                    0.14,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  p-5
                  text-white
                  shadow-[0_18px_45px_rgba(109,40,217,0.16)]
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="
                    pointer-events-none
                    absolute
                    -bottom-12
                    -right-10
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
                      9,

                    repeat:
                      Infinity,
                  }}
                />

                <div className="relative">
                  <div
                    className="
                      mb-5
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div>
                      <h2 className="text-base font-black">
                        Payout timeline
                      </h2>

                      <p className="mt-1 text-xs text-violet-100/75">
                        Lifecycle timestamps for this payout
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/15
                        bg-white/10
                      "
                    >
                      <Clock3 className="h-5 w-5" />
                    </div>
                  </div>

                  <TimelineItem
                    icon={
                      Send
                    }
                    label="Requested"
                    value={
                      formatDate(
                        payout.requestedAt,
                      )
                    }
                    active={
                      Boolean(
                        payout.requestedAt,
                      )
                    }
                  />

                  <TimelineItem
                    icon={
                      RefreshCw
                    }
                    label="Processing"
                    value={
                      formatDate(
                        payout.processingAt,
                      )
                    }
                    active={
                      Boolean(
                        payout.processingAt,
                      )
                    }
                  />

                  <TimelineItem
                    icon={
                      CheckCircle2
                    }
                    label="Completed"
                    value={
                      formatDate(
                        payout.completedAt,
                      )
                    }
                    active={
                      Boolean(
                        payout.completedAt,
                      )
                    }
                  />

                  <TimelineItem
                    icon={
                      XCircle
                    }
                    label="Failed"
                    value={
                      formatDate(
                        payout.failedAt,
                      )
                    }
                    active={
                      Boolean(
                        payout.failedAt,
                      )
                    }
                  />

                  <TimelineItem
                    icon={
                      XCircle
                    }
                    label="Cancelled"
                    value={
                      formatDate(
                        payout.cancelledAt,
                      )
                    }
                    active={
                      Boolean(
                        payout.cancelledAt,
                      )
                    }
                    last
                  />
                </div>
              </motion.section>

              {/* FAILURE */}

              {payout.failureReason ? (
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
                    rounded-[24px]
                    bg-rose-500/[0.065]
                    p-5
                  "
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-rose-500/10
                        text-rose-600
                      "
                    >
                      <AlertCircle className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-rose-600">
                        Payout failure
                      </h3>

                      <p className="mt-2 text-sm leading-6 merchant-text">
                        {payout.failureReason}
                      </p>
                    </div>
                  </div>
                </motion.section>
              ) : null}

              {/* TRACEABILITY */}

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
                transition={{
                  delay:
                    0.18,
                }}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-[24px]
                  bg-violet-500/[0.045]
                  p-4
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
                    rounded-xl
                    bg-violet-500/[0.08]
                    text-violet-600
                  "
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black merchant-text">
                    Financial traceability
                  </p>

                  <p className="mt-1 text-xs leading-5 merchant-muted">
                    Payout identifiers, destination references and the
                    ledger entry group are retained for merchant
                    reconciliation and financial activity tracking.
                  </p>
                </div>
              </motion.section>
            </div>
          </div>

          {/* =================================================
              FOOTER INFO
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
              delay:
                0.2,
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
            <div>
              <p className="text-sm font-bold merchant-text">
                Created{" "}
                {formatCompactDate(
                  payout.createdAt,
                )}
              </p>

              <p className="mt-1 text-xs merchant-muted">
                Last updated{" "}
                {formatDate(
                  payout.updatedAt,
                )}
              </p>
            </div>

            <Link
              href="/dashboard/merchant/payouts"
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

              All payouts
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}