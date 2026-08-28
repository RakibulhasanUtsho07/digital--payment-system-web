"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";

import {
  getMyWallet,
  type WalletData,
} from "@/lib/api/walletApi";
import {
  depositFunds,
  withdrawFunds,
  type FundsResponse,
} from "@/lib/api/fundsApi";

import PremiumWalletCard from "./components/PremiumWalletCard";

/* =========================================================
   TYPES
========================================================= */

type FundsAction =
  | "deposit"
  | "withdraw";

type IdempotencyState = {
  fingerprint: string;
  key: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function WalletPage() {
  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [fundsAction, setFundsAction] =
    useState<FundsAction | null>(null);

  const [fundsAmount, setFundsAmount] =
    useState("");

  const [fundsReference, setFundsReference] =
    useState("");

  const [fundsSubmitting, setFundsSubmitting] =
    useState(false);

  const [fundsError, setFundsError] =
    useState("");

  const [fundsSuccess, setFundsSuccess] =
    useState("");

  const [lastFundsResponse, setLastFundsResponse] =
    useState<FundsResponse | null>(null);

  const idempotencyRef =
    useRef<IdempotencyState | null>(null);

  /* =========================================================
     LOAD WALLET
  ========================================================== */

  const loadWallet = useCallback(
    async (silent = false) => {
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

        setWallet(response.wallet);
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

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /* =========================================================
     FUNDS MODAL
  ========================================================== */

  const openFundsModal = (
    action: FundsAction
  ) => {
    setFundsAction(action);
    setFundsAmount("");
    setFundsReference("");
    setFundsError("");
    setFundsSuccess("");
    setLastFundsResponse(null);
    idempotencyRef.current = null;
  };

  const closeFundsModal = () => {
    if (fundsSubmitting) {
      return;
    }

    setFundsAction(null);
    setFundsAmount("");
    setFundsReference("");
    setFundsError("");
    setFundsSuccess("");
    setLastFundsResponse(null);
    idempotencyRef.current = null;
  };

  const getOrCreateIdempotencyKey = (
    action: FundsAction,
    amountMinorUnits: number,
    reference: string
  ): string => {
    const fingerprint = [
      action,
      amountMinorUnits,
      reference,
    ].join("|");

    if (
      idempotencyRef.current?.fingerprint ===
      fingerprint
    ) {
      return idempotencyRef.current.key;
    }

    if (
      typeof crypto === "undefined" ||
      typeof crypto.randomUUID !== "function"
    ) {
      throw new Error(
        "Your browser does not support secure request IDs. Please update your browser."
      );
    }

    const key = crypto.randomUUID();

    idempotencyRef.current = {
      fingerprint,
      key,
    };

    return key;
  };

  const handleFundsSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!fundsAction || !wallet) {
      return;
    }

    setFundsError("");
    setFundsSuccess("");
    setLastFundsResponse(null);

    const rawAmount =
      fundsAmount.trim();

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(
        rawAmount
      )
    ) {
      setFundsError(
        "Enter a valid amount with up to 2 decimal places."
      );
      return;
    }

    const numericAmount =
      Number(rawAmount);

    const minorUnits = Math.round(
      numericAmount * 100
    );

    if (
      !Number.isFinite(numericAmount) ||
      !Number.isSafeInteger(minorUnits) ||
      minorUnits <= 0
    ) {
      setFundsError(
        "Amount must be greater than 0."
      );
      return;
    }

    const normalizedAmount =
      minorUnits / 100;

    if (
      fundsAction === "withdraw" &&
      normalizedAmount >
        Number(wallet.balance || 0)
    ) {
      setFundsError(
        "Insufficient wallet balance."
      );
      return;
    }

    const reference =
      fundsReference.trim();

    if (reference.length > 160) {
      setFundsError(
        "Reference must be 160 characters or fewer."
      );
      return;
    }

    try {
      setFundsSubmitting(true);

      const idempotencyKey =
        getOrCreateIdempotencyKey(
          fundsAction,
          minorUnits,
          reference
        );

      const response =
        fundsAction === "deposit"
          ? await depositFunds({
              amount: normalizedAmount,
              reference:
                reference || undefined,
              idempotencyKey,
            })
          : await withdrawFunds({
              amount: normalizedAmount,
              reference:
                reference || undefined,
              idempotencyKey,
            });

      if (
        !response.success ||
        !response.wallet
      ) {
        throw new Error(
          response.message ||
            "Funds request failed."
        );
      }

      setWallet((current) =>
        current
          ? {
              ...current,
              balance:
                response.wallet.balance,
              updatedAt:
                new Date().toISOString(),
            }
          : current
      );

      setLastFundsResponse(response);

      setFundsSuccess(
        response.duplicate
          ? "This request was already processed. Your balance was not changed twice."
          : response.message ||
              (fundsAction === "deposit"
                ? "Money added successfully."
                : "Money withdrawn successfully.")
      );

      idempotencyRef.current = null;
    } catch (error) {
      console.error(
        "Funds request error:",
        error
      );

      setFundsError(
        error instanceof Error
          ? error.message
          : "Unable to process the request."
      );

      // Keep the same idempotency key after a failed/network
      // response so retrying the same request cannot duplicate it.
    } finally {
      setFundsSubmitting(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#102D4E] to-[#1F5EA8] text-white shadow-[0_14px_35px_rgba(31,94,168,0.22)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
            <Loader2 className="relative h-6 w-6 animate-spin" />
          </div>

          <div>
            <p className="text-sm font-extrabold text-slate-800">
              Loading your wallet
            </p>
            <p className="mt-1 text-xs text-slate-400">
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

  if (errorMessage || !wallet) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600">
            <CreditCard className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-slate-900">
            Wallet unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage ||
              "Unable to retrieve your wallet information."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadWallet()
            }
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#1F5EA8] px-5 text-xs font-extrabold text-white transition hover:bg-[#184E8D]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const balance =
    Number(wallet.balance) || 0;

  const formattedBalance =
    formatCurrency(balance);

  return (
    <>
      <main className="space-y-6 pb-10">
        {/* HEADER */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-[#F0F7FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F5EA8]">
              <WalletCards className="h-3.5 w-3.5" />
              Digital Wallet
            </div>

            <h1 className="text-2xl font-black tracking-[-0.035em] text-[#102A43] sm:text-3xl">
              My Wallet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718296]">
              Monitor your balance, add or withdraw funds and access secure payment actions from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadWallet(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[#DCE6EF] bg-white px-4 text-xs font-bold text-[#566C80] shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8] disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* WALLET CARD */}
        <PremiumWalletCard
          walletId={wallet._id}
          balance={balance}
        />

        {/* QUICK ACTIONS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WalletActionButton
            icon={Plus}
            title="Add Money"
            description="Top up your wallet balance"
            iconClass="bg-emerald-50 text-emerald-600"
            onClick={() =>
              openFundsModal("deposit")
            }
          />

          <WalletActionButton
            icon={Banknote}
            title="Withdraw"
            description="Withdraw from wallet balance"
            iconClass="bg-rose-50 text-rose-600"
            onClick={() =>
              openFundsModal("withdraw")
            }
          />

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
            description="Share QR or payment request"
            iconClass="bg-cyan-50 text-cyan-600"
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

        {/* WALLET INFORMATION */}
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[26px] border border-[#DFE8F1] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)] sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#1F5EA8]">
                  Account
                </p>
                <h2 className="mt-1.5 text-lg font-extrabold tracking-[-0.02em] text-[#18324A]">
                  Wallet Information
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#EEF6FD] text-[#1F5EA8]">
                <WalletCards className="h-[18px] w-[18px]" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Wallet Balance"
                value={formattedBalance}
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
          <div className="relative overflow-hidden rounded-[26px] border border-[#DDEAF4] bg-gradient-to-br from-[#F2F9FF] via-white to-[#EFFAF7] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-emerald-100 bg-white text-emerald-600 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-[#18324A]">
                Secure Wallet
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#687D91]">
                Your wallet is protected by authenticated access. Complete identity verification to unlock protected financial actions.
              </p>

              <Link
                href="/dashboard/kyc"
                className="group mt-5 inline-flex h-10 items-center gap-2 rounded-[13px] border border-blue-100 bg-white px-4 text-[11px] font-extrabold text-[#1F5EA8] shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                Verification Center
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER NOTE */}
        <section className="rounded-[26px] border border-[#DFE8F1] bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-blue-50 text-[#1F5EA8]">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-extrabold text-[#18324A]">
                  Your money, one secure place.
                </p>
                <p className="mt-1 text-xs leading-5 text-[#77899B]">
                  Add, withdraw, send, receive and track your digital payments through your Coffer wallet.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/transactions"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#1F5EA8]"
            >
              View transaction history
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {fundsAction && (
        <FundsModal
          action={fundsAction}
          balance={balance}
          amount={fundsAmount}
          reference={fundsReference}
          submitting={fundsSubmitting}
          errorMessage={fundsError}
          successMessage={fundsSuccess}
          transactionId={
            lastFundsResponse?.transaction?._id
          }
          onAmountChange={setFundsAmount}
          onReferenceChange={
            setFundsReference
          }
          onClose={closeFundsModal}
          onSubmit={handleFundsSubmit}
        />
      )}
    </>
  );
}

/* =========================================================
   FUNDS MODAL
========================================================= */

function FundsModal({
  action,
  balance,
  amount,
  reference,
  submitting,
  errorMessage,
  successMessage,
  transactionId,
  onAmountChange,
  onReferenceChange,
  onClose,
  onSubmit,
}: {
  action: FundsAction;
  balance: number;
  amount: string;
  reference: string;
  submitting: boolean;
  errorMessage: string;
  successMessage: string;
  transactionId?: string;
  onAmountChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  const isDeposit =
    action === "deposit";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close funds dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
        <div
          className={`relative overflow-hidden p-6 text-white ${
            isDeposit
              ? "bg-gradient-to-br from-[#0F6A55] via-[#14806A] to-[#1B9C7F]"
              : "bg-gradient-to-br from-[#7C233A] via-[#A33650] to-[#C94A64]"
          }`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/65">
                Wallet Funds
              </p>
              <h2 className="mt-1 text-xl font-black">
                {isDeposit
                  ? "Add Money"
                  : "Withdraw Money"}
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/70">
                {isDeposit
                  ? "Add funds to your Coffer wallet."
                  : "Withdraw funds from your available wallet balance."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6"
        >
          {successMessage ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-black text-slate-900">
                Completed
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {successMessage}
              </p>

              {transactionId && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Transaction ID
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-700">
                    {transactionId}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 h-11 w-full rounded-xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Available Balance
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(balance)}
                </p>
              </div>

              <div className="mt-5">
                <label className="text-xs font-bold text-slate-700">
                  Amount
                </label>

                <div className="relative mt-2">
                  <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    required
                    autoFocus
                    value={amount}
                    onChange={(event) =>
                      onAmountChange(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        [
                          "-",
                          "+",
                          "e",
                          "E",
                        ].includes(
                          event.key
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                    placeholder="0.00"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#1F5EA8] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700">
                  Reference
                  <span className="ml-1 font-medium text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  type="text"
                  maxLength={160}
                  value={reference}
                  onChange={(event) =>
                    onReferenceChange(
                      event.target.value
                    )
                  }
                  placeholder="Example: Monthly top-up"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#1F5EA8] focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-1 text-right text-[10px] text-slate-400">
                  {reference.length}/160
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-xs font-medium leading-5 text-rose-700">
                    {errorMessage}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDeposit
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isDeposit ? (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Money
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="h-4 w-4" />
                    Withdraw
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
                Duplicate submissions are protected with a unique request ID.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   WALLET ACTION LINK
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
      href={href}
      className="group rounded-[23px] border border-[#E1E9F0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-[#18324A]">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-[#8A9AAA]">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   WALLET ACTION BUTTON
========================================================= */

function WalletActionButton({
  icon: Icon,
  title,
  description,
  iconClass,
  onClick,
}: {
  icon: ElementType;
  title: string;
  description: string;
  iconClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[23px] border border-[#E1E9F0] bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-[#18324A]">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-[#8A9AAA]">
        {description}
      </p>
    </button>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
  valueClass = "text-[#18324A]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[17px] border border-[#EDF1F5] bg-[#F8FAFC] p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#95A3B1]">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-sm font-bold transition ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CURRENCY / DATE
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

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


