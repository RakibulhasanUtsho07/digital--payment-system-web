"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ElementType,
} from "react";

import Link from "next/link";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  getMyWallet,
  type WalletData,
} from "@/lib/api/walletApi";

import PremiumWalletCard from "./components/PremiumWalletCard";

/* =========================================================
   PAGE
========================================================= */

export default function WalletPage() {
  const [
    wallet,
    setWallet,
  ] = useState<WalletData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =========================================================
     LOAD WALLET
  ========================================================== */

  const loadWallet = useCallback(
    async (
      silent = false
    ) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response =
          await getMyWallet();

        if (
          !response.success ||
          !response.wallet
        ) {
          throw new Error(
            response.message ||
              "Unable to load wallet information."
          );
        }

        setWallet(
          response.wallet
        );
      } catch (error) {
        console.error(
          "Wallet loading error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load wallet."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadWallet();
  }, [
    loadWallet,
  ]);

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center
          px-4
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
            text-center
          "
        >
          <div
            className="
              relative

              flex
              h-14
              w-14
              items-center
              justify-center

              overflow-hidden

              rounded-[18px]

              bg-gradient-to-br
              from-[#102D4E]
              to-[#1F5EA8]

              text-white

              shadow-[0_14px_35px_rgba(31,94,168,0.22)]
            "
          >
            <div
              className="
                absolute
                inset-0

                bg-gradient-to-br
                from-white/15
                to-transparent
              "
            />

            <Loader2
              className="
                relative
                h-6
                w-6
                animate-spin
              "
            />
          </div>

          <div>
            <p
              className="
                text-sm
                font-extrabold
                text-slate-800
              "
            >
              Loading your wallet
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Syncing your latest balance and wallet information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================== */

  if (
    errorMessage ||
    !wallet
  ) {
    return (
      <div
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-md

            rounded-[28px]

            border
            border-rose-100

            bg-white

            p-7
            text-center

            shadow-[0_18px_50px_rgba(15,23,42,0.06)]
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

              rounded-[18px]

              bg-rose-50

              text-rose-600
            "
          >
            <CreditCard
              className="
                h-6
                w-6
              "
            />
          </div>

          <h2
            className="
              mt-5

              text-xl
              font-black

              tracking-[-0.02em]

              text-slate-900
            "
          >
            Wallet unavailable
          </h2>

          <p
            className="
              mt-2

              text-sm
              leading-6

              text-slate-500
            "
          >
            {errorMessage ||
              "Unable to retrieve your wallet information."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadWallet()
            }
            className="
              mt-6

              inline-flex
              h-11
              items-center
              justify-center
              gap-2

              rounded-[14px]

              bg-[#1F5EA8]

              px-5

              text-xs
              font-extrabold

              text-white

              transition

              hover:bg-[#184E8D]
            "
          >
            <RefreshCw
              className="
                h-4
                w-4
              "
            />

            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     WALLET DATA
  ========================================================== */

  const balance =
    Number(
      wallet.balance
    ) || 0;

  const formattedBalance =
    formatCurrency(
      balance
    );

  /* =========================================================
     PAGE
  ========================================================== */

  return (
    <main
      className="
        space-y-6
        pb-10
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section
        className="
          flex
          flex-col
          gap-5

          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              mb-3

              inline-flex
              items-center
              gap-2

              rounded-full

              border
              border-blue-100

              bg-[#F0F7FF]

              px-3
              py-1.5

              text-[10px]
              font-extrabold
              uppercase

              tracking-[0.16em]

              text-[#1F5EA8]
            "
          >
            <WalletCards
              className="
                h-3.5
                w-3.5
              "
            />

            Digital Wallet
          </div>

          <h1
            className="
              text-2xl
              font-black

              tracking-[-0.035em]

              text-[#102A43]

              sm:text-3xl
            "
          >
            My Wallet
          </h1>

          <p
            className="
              mt-2

              max-w-2xl

              text-sm
              leading-6

              text-[#718296]
            "
          >
            Monitor your balance, manage wallet details and access
            secure payment actions from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadWallet(
              true
            )
          }
          disabled={
            refreshing
          }
          className="
            inline-flex
            h-11
            shrink-0
            items-center
            justify-center
            gap-2

            rounded-[14px]

            border
            border-[#DCE6EF]

            bg-white

            px-4

            text-xs
            font-bold

            text-[#566C80]

            shadow-[0_6px_20px_rgba(15,23,42,0.04)]

            transition

            hover:border-blue-200
            hover:bg-blue-50
            hover:text-[#1F5EA8]

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
            ? "Syncing..."
            : "Refresh"}
        </button>
      </section>

      {/* =====================================================
          PREMIUM WALLET CARD
      ====================================================== */}

      <PremiumWalletCard
        walletId={
          wallet._id
        }
        balance={
          balance
        }
      />

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section
        className="
          grid
          gap-4

          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <WalletAction
          href="/dashboard/send"
          icon={
            ArrowUpRight
          }
          title="Send Money"
          description="Transfer funds securely"
          iconClass="bg-blue-50 text-blue-600"
        />

        <WalletAction
          href="/dashboard/receive"
          icon={
            ArrowDownLeft
          }
          title="Receive Money"
          description="Receive funds into wallet"
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <WalletAction
          href="/dashboard/transactions"
          icon={
            CreditCard
          }
          title="Transactions"
          description="View wallet activity"
          iconClass="bg-violet-50 text-violet-600"
        />

        <WalletAction
          href="/dashboard/kyc"
          icon={
            ShieldCheck
          }
          title="KYC Verification"
          description="Secure your account"
          iconClass="bg-amber-50 text-amber-600"
        />
      </section>

      {/* =====================================================
          WALLET INFORMATION
      ====================================================== */}

      <section
        className="
          grid
          gap-6

          lg:grid-cols-[1.3fr_0.7fr]
        "
      >
        {/* WALLET DETAILS */}

        <div
          className="
            rounded-[26px]

            border
            border-[#DFE8F1]

            bg-white

            p-5

            shadow-[0_12px_40px_rgba(15,23,42,0.045)]

            sm:p-6
          "
        >
          <div
            className="
              mb-6

              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-extrabold
                  uppercase

                  tracking-[0.17em]

                  text-[#1F5EA8]
                "
              >
                Account
              </p>

              <h2
                className="
                  mt-1.5

                  text-lg
                  font-extrabold

                  tracking-[-0.02em]

                  text-[#18324A]
                "
              >
                Wallet Information
              </h2>
            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center

                rounded-[13px]

                bg-[#EEF6FD]

                text-[#1F5EA8]
              "
            >
              <WalletCards
                className="
                  h-[18px]
                  w-[18px]
                "
              />
            </div>
          </div>

          <div
            className="
              grid
              gap-3

              sm:grid-cols-2
            "
          >
            <InfoCard
              label="Wallet Balance"
              value={
                formattedBalance
              }
            />

            <InfoCard
              label="Currency"
              value="Bangladeshi Taka (BDT)"
            />

            <InfoCard
              label="Wallet Owner ID"
              value={
                wallet.userId
              }
            />

            <InfoCard
              label="Wallet Status"
              value="Active"
              valueClass="text-emerald-600"
            />

            <InfoCard
              label="Created"
              value={formatDate(
                wallet.createdAt
              )}
            />

            <InfoCard
              label="Last Updated"
              value={formatDate(
                wallet.updatedAt
              )}
            />
          </div>
        </div>

        {/* SECURITY */}

        <div
          className="
            relative
            overflow-hidden

            rounded-[26px]

            border
            border-[#DDEAF4]

            bg-gradient-to-br
            from-[#F2F9FF]
            via-white
            to-[#EFFAF7]

            p-5

            shadow-[0_12px_40px_rgba(15,23,42,0.04)]

            sm:p-6
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16

              h-40
              w-40

              rounded-full

              bg-blue-400/10

              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center

                rounded-[15px]

                border
                border-emerald-100

                bg-white

                text-emerald-600

                shadow-sm
              "
            >
              <ShieldCheck
                className="
                  h-5
                  w-5
                "
              />
            </div>

            <h2
              className="
                mt-5

                text-lg
                font-extrabold

                tracking-[-0.02em]

                text-[#18324A]
              "
            >
              Secure Wallet
            </h2>

            <p
              className="
                mt-2

                text-xs
                leading-5

                text-[#687D91]
              "
            >
              Your wallet is protected by authenticated access.
              Complete identity verification to unlock protected
              financial actions.
            </p>

            <Link
              href="/dashboard/kyc"
              className="
                group

                mt-5

                inline-flex
                h-10
                items-center
                gap-2

                rounded-[13px]

                border
                border-blue-100

                bg-white

                px-4

                text-[11px]
                font-extrabold

                text-[#1F5EA8]

                shadow-sm

                transition

                hover:border-blue-200
                hover:bg-blue-50
              "
            >
              Verification Center

              <ChevronRight
                className="
                  h-3.5
                  w-3.5

                  transition-transform

                  group-hover:translate-x-0.5
                "
              />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER NOTE
      ====================================================== */}

      <section
        className="
          rounded-[26px]

          border
          border-[#DFE8F1]

          bg-white

          p-5

          shadow-[0_10px_35px_rgba(15,23,42,0.035)]

          sm:p-6
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
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

                rounded-[13px]

                bg-blue-50

                text-[#1F5EA8]
              "
            >
              <WalletCards
                className="
                  h-5
                  w-5
                "
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-extrabold
                  text-[#18324A]
                "
              >
                Your money, one secure place.
              </p>

              <p
                className="
                  mt-1

                  text-xs
                  leading-5

                  text-[#77899B]
                "
              >
                Send, receive and track your digital payments
                through your Coffer wallet.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/transactions"
            className="
              group

              inline-flex
              items-center
              gap-1.5

              text-xs
              font-bold

              text-[#1F5EA8]
            "
          >
            View transaction history

            <ChevronRight
              className="
                h-3.5
                w-3.5

                transition-transform

                group-hover:translate-x-0.5
              "
            />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   WALLET ACTION
========================================================= */

function WalletAction({
  href,
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  href: string;
  icon: ElementType;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="
        group

        rounded-[23px]

        border
        border-[#E1E9F0]

        bg-white

        p-5

        shadow-[0_10px_30px_rgba(15,23,42,0.035)]

        transition
        duration-300

        hover:-translate-y-1
        hover:border-blue-100
        hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className={`
            flex
            h-11
            w-11
            items-center
            justify-center

            rounded-[14px]

            ${iconClass}
          `}
        >
          <Icon
            className="
              h-5
              w-5
            "
          />
        </div>

        <ChevronRight
          className="
            h-4
            w-4

            text-slate-300

            transition

            group-hover:translate-x-0.5
            group-hover:text-[#1F5EA8]
          "
        />
      </div>

      <h3
        className="
          mt-5

          text-sm
          font-extrabold

          text-[#18324A]
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1

          text-[11px]
          leading-5

          text-[#8A9AAA]
        "
      >
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
  valueClass =
    "text-[#18324A]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div
      className="
        rounded-[17px]

        border
        border-[#EDF1F5]

        bg-[#F8FAFC]

        p-4
      "
    >
      <p
        className="
          text-[9px]
          font-extrabold
          uppercase

          tracking-[0.14em]

          text-[#95A3B1]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-2

          break-all

          text-sm
          font-bold

          transition

          ${valueClass}
        `}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value?: string
): string {
  if (!value) {
    return "N/A";
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
    return "N/A";
  }

  return date.toLocaleString(
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
    }
  );
}