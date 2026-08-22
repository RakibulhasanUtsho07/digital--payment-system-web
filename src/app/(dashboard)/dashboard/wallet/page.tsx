"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface WalletData {
  _id: string;
  userId: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

interface WalletResponse {
  success: boolean;
  wallet: WalletData;
}

/* =========================================================
   PAGE
========================================================= */

export default function WalletPage() {
  const [wallet, setWallet] =
    useState<WalletData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  // Balance visibility — starts shown; the toggle just masks the
  // digits in place rather than hiding the whole card, so the
  // layout never jumps.
  const [showBalance, setShowBalance] =
    useState(true);

  /* =========================================================
     LOAD WALLET
  ========================================================== */

  const loadWallet = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorMessage("");

      const data =
        await apiClient<WalletResponse>(
          "/wallet"
        );

      if (
        !data ||
        data.success !== true ||
        !data.wallet
      ) {
        throw new Error(
          "Unable to load wallet information."
        );
      }

      setWallet(
        data.wallet
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
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadWallet(true);
  }, []);

  /* =========================================================
     COPY WALLET ID
  ========================================================== */

  const handleCopyWalletId =
    async () => {
      if (!wallet?._id) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          wallet._id
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 1800);
      } catch (error) {
        console.error(
          "Copy wallet ID failed:",
          error
        );
      }
    };

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5EA8] text-white shadow-lg shadow-blue-500/20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              Loading wallet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching your wallet information...
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
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <CreditCard className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Wallet unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage ||
              "Unable to retrieve wallet information."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadWallet(
                true
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17466F]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const balance =
    Number(
      wallet.balance
    ) || 0;

  const formattedBalance =
    formatCurrency(balance);

  return (
    <main className="space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
            <WalletCards className="h-3.5 w-3.5" />
            Digital Wallet
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            My Wallet
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage your wallet balance, account details,
            and quick payment actions from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadWallet(
              false
            )
          }
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={
              refreshing
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      {/* =====================================================
          MAIN WALLET CARD
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0F2745] via-[#173F6D] to-[#1F5EA8] p-6 text-white shadow-[0_20px_55px_rgba(23,63,109,0.2)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT */}

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md">
                  <WalletCards className="h-6 w-6 text-cyan-200" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/70">
                    Available Balance
                  </p>

                  <p className="mt-1 text-xs font-medium text-blue-100/70">
                    Personal Wallet
                  </p>
                </div>
              </div>

              {/* BALANCE — animated show/hide. Masks digits in
                  place (৳ 12,500 -> ৳ ••,•••) rather than swapping
                  in a fixed placeholder, so the shape of the
                  number stays recognizable without revealing it. */}
              <div className="mt-7 flex items-center gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={showBalance ? "visible" : "masked"}
                    initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(6px)", y: -6 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`text-4xl font-black tracking-tight sm:text-5xl ${
                      showBalance ? "" : "select-none tracking-wider"
                    }`}
                    aria-hidden={!showBalance}
                  >
                    {showBalance
                      ? formattedBalance
                      : maskCurrency(formattedBalance)}
                  </motion.p>
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() =>
                    setShowBalance((value) => !value)
                  }
                  aria-label={
                    showBalance
                      ? "Hide balance"
                      : "Show balance"
                  }
                  aria-pressed={!showBalance}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cyan-100 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showBalance ? "eye" : "eye-off"}
                      initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                      transition={{ duration: 0.25 }}
                      className="flex"
                    >
                      {showBalance ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>

                <span className="sr-only" role="status">
                  {showBalance
                    ? "Balance visible"
                    : "Balance hidden"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Wallet Active
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-100">
                  BDT
                </span>
              </div>
            </div>

            {/* RIGHT */}

            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md lg:w-auto">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100/60">
                    Wallet ID
                  </p>

                  <p className="mt-2 break-all text-sm font-bold text-white">
                    {wallet._id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCopyWalletId
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Copy wallet ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {copied && (
                <p className="mt-3 text-[10px] font-semibold text-cyan-200">
                  Wallet ID copied
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WalletAction
          href="/dashboard/send"
          icon={ArrowUpRight}
          title="Send Money"
          description="Transfer funds securely"
          iconClass="bg-blue-50 text-blue-600"
        />

        <WalletAction
          href="/dashboard/receive"
          icon={ArrowDownLeft}
          title="Receive Money"
          description="Receive funds into wallet"
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <WalletAction
          href="/dashboard/transactions"
          icon={CreditCard}
          title="Transactions"
          description="View wallet activity"
          iconClass="bg-violet-50 text-violet-600"
        />

        <WalletAction
          href="/dashboard/kyc"
          icon={ShieldCheck}
          title="KYC Verification"
          description="Secure your account"
          iconClass="bg-amber-50 text-amber-600"
        />
      </section>

      {/* =====================================================
          WALLET INFORMATION
      ====================================================== */}

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* WALLET DETAILS */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Account
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Wallet Information
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Wallet Balance"
              value={
                showBalance
                  ? formattedBalance
                  : maskCurrency(formattedBalance)
              }
            />

            <InfoCard
              label="Currency"
              value="Bangladeshi Taka (BDT)"
            />

            <InfoCard
              label="Wallet Owner ID"
              value={wallet.userId}
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

        <div className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-blue-50 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-slate-900">
            Secure Wallet
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Your wallet is protected by authenticated access.
            Complete KYC verification before using advanced
            wallet features.
          </p>

          <Link
            href="/dashboard/kyc"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#1F5EA8] shadow-sm transition hover:bg-slate-50"
          >
            Verification Center
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* =====================================================
          BALANCE NOTE
      ====================================================== */}

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
              <WalletCards className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Your money, one secure place.
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use your wallet to send, receive, and track your
                digital payments.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
          >
            View transaction history
            <ChevronRight className="h-3.5 w-3.5" />
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
  icon: React.ElementType;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-slate-400">
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
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-sm font-bold transition-all duration-300 ${valueClass}`}
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

// Replaces digits in an already-formatted currency string with
// bullets, keeping the symbol/commas/decimal point — so the masked
// balance still reads as "a number-shaped thing" instead of a
// generic placeholder.
function maskCurrency(formatted: string): string {
  return formatted.replace(/[0-9]/g, "•");
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
    new Date(value);

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}