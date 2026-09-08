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
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  LockKeyhole,
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

import { apiClient } from "@/lib/api/client";

import PremiumWalletCard from "./components/PremiumWalletCard";

/* =========================================================
   TYPES
========================================================= */

type FundsAction =
  | "deposit"
  | "withdraw";

type AddMoneySource =
  | "MFS"
  | "BANK";

type AddMoneyProvider =
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "UPAY"
  | "DBBL"
  | "BRAC_BANK"
  | "CITY_BANK"
  | "EBL"
  | "BANK_ASIA"
  | "PRIME_BANK"
  | "SONALI_BANK";

type IdempotencyState = {
  fingerprint: string;
  key: string;
};

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

interface KYCStatusResponse {
  success: boolean;
  message?: string;

  kyc?: {
    status?: KYCStatus;
  };

  userKycStatus?:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
}

interface AddMoneyProviderItem {
  id: AddMoneyProvider;
  name: string;
  description: string;
  icon: string;
}

/* =========================================================
   MFS PROVIDERS

   Demo UI only.
   Real gateway credentials can be connected later.
========================================================= */

const MFS_PROVIDERS: AddMoneyProviderItem[] = [
  {
    id: "BKASH",
    name: "bKash",
    description: "Add money using bKash",
    icon: "৳",
  },
  {
    id: "NAGAD",
    name: "Nagad",
    description: "Add money using Nagad",
    icon: "৳",
  },
  {
    id: "ROCKET",
    name: "Rocket",
    description: "Add money using Rocket",
    icon: "R",
  },
  {
    id: "UPAY",
    name: "Upay",
    description: "Add money using Upay",
    icon: "U",
  },
];

/* =========================================================
   BANK PROVIDERS

   Demo UI only.
========================================================= */

const BANK_PROVIDERS: AddMoneyProviderItem[] = [
  {
    id: "DBBL",
    name: "Dutch-Bangla Bank",
    description: "Transfer from DBBL",
    icon: "DB",
  },
  {
    id: "BRAC_BANK",
    name: "BRAC Bank",
    description: "Transfer from BRAC Bank",
    icon: "BB",
  },
  {
    id: "CITY_BANK",
    name: "City Bank",
    description: "Transfer from City Bank",
    icon: "CB",
  },
  {
    id: "EBL",
    name: "Eastern Bank",
    description: "Transfer from EBL",
    icon: "EB",
  },
  {
    id: "BANK_ASIA",
    name: "Bank Asia",
    description: "Transfer from Bank Asia",
    icon: "BA",
  },
  {
    id: "PRIME_BANK",
    name: "Prime Bank",
    description: "Transfer from Prime Bank",
    icon: "PB",
  },
  {
    id: "SONALI_BANK",
    name: "Sonali Bank",
    description: "Transfer from Sonali Bank",
    icon: "SB",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function WalletPage() {
  const router = useRouter();

  /* =======================================================
     WALLET
  ======================================================== */

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

  /* =======================================================
     KYC
  ======================================================== */

  const [kycStatus, setKycStatus] =
    useState<KYCStatus | null>(null);

  const [kycLoading, setKycLoading] =
    useState(true);

  const [kycError, setKycError] =
    useState("");

  const [kycGuardOpen, setKycGuardOpen] =
    useState(false);

  /* =======================================================
     FUNDS
  ======================================================== */

  const [fundsAction, setFundsAction] =
    useState<FundsAction | null>(
      null
    );

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
    useState<FundsResponse | null>(
      null
    );

  const idempotencyRef =
    useRef<IdempotencyState | null>(
      null
    );

  /* =======================================================
     ADD MONEY PROVIDER
  ======================================================== */

  const [addMoneySource, setAddMoneySource] =
    useState<AddMoneySource>("MFS");

  const [addMoneyProvider, setAddMoneyProvider] =
    useState<AddMoneyProvider>(
      "BKASH"
    );

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

  /* =========================================================
     LOAD KYC STATUS
  ========================================================== */

  const loadKYCStatus =
    useCallback(async () => {
      try {
        setKycLoading(true);
        setKycError("");

        const response =
          await apiClient<KYCStatusResponse>(
            "/kyc/status"
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to verify KYC status."
          );
        }

        const status =
          response.kyc?.status ||
          response.userKycStatus ||
          "not_started";

        setKycStatus(status);
      } catch (error) {
        console.error(
          "KYC status loading error:",
          error
        );

        setKycStatus(null);

        setKycError(
          error instanceof Error
            ? error.message
            : "Unable to verify KYC status."
        );
      } finally {
        setKycLoading(false);
      }
    }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadWallet();
    void loadKYCStatus();
  }, [
    loadWallet,
    loadKYCStatus,
  ]);

  /* =========================================================
     REFRESH PAGE
  ========================================================== */

  const refreshWalletPage =
    async () => {
      await Promise.allSettled([
        loadWallet(true),
        loadKYCStatus(),
      ]);
    };

  /* =========================================================
     KYC GUARD
  ========================================================== */

  const requireVerifiedKYC = (
    onVerified: () => void
  ) => {
    if (
      !kycLoading &&
      !kycError &&
      kycStatus === "verified"
    ) {
      onVerified();
      return;
    }

    setKycGuardOpen(true);
  };

  /* =========================================================
     OPEN PROTECTED ROUTE
  ========================================================== */

  const openProtectedRoute = (
    href: string
  ) => {
    requireVerifiedKYC(
      () => router.push(href)
    );
  };

  /* =========================================================
     OPEN FUNDS MODAL
  ========================================================== */

  const openFundsModal = (
    action: FundsAction
  ) => {
    if (
      action === "withdraw"
    ) {
      requireVerifiedKYC(() =>
        openFundsModalUnsafe(
          "withdraw"
        )
      );

      return;
    }

    openFundsModalUnsafe(
      action
    );
  };

  /* =========================================================
     OPEN FUNDS UNSAFE
  ========================================================== */

  const openFundsModalUnsafe = (
    action: FundsAction
  ) => {
    setFundsAction(action);

    setFundsAmount("");

    setFundsReference("");

    setFundsError("");

    setFundsSuccess("");

    setLastFundsResponse(null);

    idempotencyRef.current = null;

    if (action === "deposit") {
      setAddMoneySource("MFS");

      setAddMoneyProvider("BKASH");
    }
  };

  /* =========================================================
     CLOSE FUNDS MODAL
  ========================================================== */

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

  /* =========================================================
     PROVIDER NAME
  ========================================================== */

  const getProviderName = (
    provider: AddMoneyProvider
  ): string => {
    const allProviders = [
      ...MFS_PROVIDERS,
      ...BANK_PROVIDERS,
    ];

    const found =
      allProviders.find(
        (item) =>
          item.id === provider
      );

    return (
      found?.name || provider
    );
  };

  /* =========================================================
     IDEMPOTENCY KEY
  ========================================================== */

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
      idempotencyRef.current
        ?.fingerprint ===
      fingerprint
    ) {
      return idempotencyRef.current.key;
    }

    if (
      typeof crypto ===
        "undefined" ||
      typeof crypto.randomUUID !==
        "function"
    ) {
      throw new Error(
        "Your browser does not support secure request IDs. Please update your browser."
      );
    }

    const key =
      crypto.randomUUID();

    idempotencyRef.current = {
      fingerprint,
      key,
    };

    return key;
  };

  /* =========================================================
     FUNDS SUBMIT
  ========================================================== */

  const handleFundsSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !fundsAction ||
        !wallet
      ) {
        return;
      }

      setFundsError("");
      setFundsSuccess("");
      setLastFundsResponse(null);

      /* ================================================
         AMOUNT VALIDATION
      ================================================= */

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

      const minorUnits =
        Math.round(
          numericAmount * 100
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        !Number.isSafeInteger(
          minorUnits
        ) ||
        minorUnits <= 0
      ) {
        setFundsError(
          "Amount must be greater than 0."
        );

        return;
      }

      const normalizedAmount =
        minorUnits / 100;

      /* ================================================
         WITHDRAW BALANCE
      ================================================= */

      if (
        fundsAction ===
          "withdraw" &&
        normalizedAmount >
          Number(
            wallet.balance || 0
          )
      ) {
        setFundsError(
          "Insufficient wallet balance."
        );

        return;
      }

      /* ================================================
         REFERENCE
      ================================================= */

      let reference =
        fundsReference.trim();

      if (
        reference.length > 160
      ) {
        setFundsError(
          "Reference must be 160 characters or fewer."
        );

        return;
      }

      /* ================================================
         ADD MONEY PROVIDER
      ================================================= */

      if (
        fundsAction ===
        "deposit"
      ) {
        const providerName =
          getProviderName(
            addMoneyProvider
          );

        const providerPrefix =
          `[${addMoneySource}] ${providerName}`;

        reference =
          reference
            ? `${providerPrefix} - ${reference}`
            : providerPrefix;

        /*
         * Keep reference under backend limit.
         */
        reference =
          reference.slice(
            0,
            160
          );
      }

      /* ================================================
         SUBMIT
      ================================================= */

      try {
        setFundsSubmitting(
          true
        );

        const idempotencyKey =
          getOrCreateIdempotencyKey(
            fundsAction,
            minorUnits,
            reference
          );

        const response =
          fundsAction ===
          "deposit"
            ? await depositFunds({
                amount:
                  normalizedAmount,

                reference:
                  reference ||
                  undefined,

                idempotencyKey,
              })
            : await withdrawFunds({
                amount:
                  normalizedAmount,

                reference:
                  reference ||
                  undefined,

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

        /* ==============================================
           UPDATE LOCAL BALANCE
        =============================================== */

        setWallet(
          (current) =>
            current
              ? {
                  ...current,
                  balance:
                    response.wallet!
                      .balance,
                  updatedAt:
                    new Date().toISOString(),
                }
              : current
        );

        setLastFundsResponse(
          response
        );

        setFundsSuccess(
          response.duplicate
            ? "This request was already processed. Your balance was not changed twice."
            : response.message ||
                (fundsAction ===
                "deposit"
                  ? `Money added successfully through ${getProviderName(
                      addMoneyProvider
                    )}.`
                  : "Money withdrawn successfully.")
        );

        idempotencyRef.current =
          null;

        /*
         * Final backend sync.
         */
        await loadWallet(true);
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
      } finally {
        setFundsSubmitting(
          false
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
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#4C1D95] to-[#6D28D9] text-white shadow-[0_14px_35px_rgba(109,40,217,0.24)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />

            <Loader2 className="relative h-6 w-6 animate-spin" />
          </div>

          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Loading your wallet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Syncing your latest balance
              and wallet information...
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
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#5B21B6] px-5 text-xs font-extrabold text-white transition hover:bg-[#4C1D95]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     BALANCE
  ========================================================== */

  const balance =
    Number(wallet.balance) ||
    0;

  const formattedBalance =
    formatCurrency(balance);

  /* =========================================================
     MAIN UI
  ========================================================== */

  return (
    <>
      <main className="space-y-6 pb-10">
        {/* =================================================
            HEADER
        ================================================== */}

        <section className="rounded-[26px] border border-indigo-100 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-700">
                <WalletCards className="h-3.5 w-3.5" />
                Digital Wallet
              </div>

              <h1 className="text-2xl font-black tracking-[-0.035em] text-indigo-950 sm:text-3xl">
                My Wallet
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor your balance,
                add or withdraw funds and
                access secure payment
                actions from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void refreshWalletPage()
              }
              disabled={refreshing}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-indigo-100 bg-white px-4 text-xs font-bold text-indigo-700 shadow-[0_6px_20px_rgba(79,70,229,0.06)] transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
        </section>

        {/* =================================================
            PREMIUM WALLET CARD
        ================================================== */}

        <PremiumWalletCard
          walletId={wallet._id}
          balance={balance}
          kycStatus={kycStatus}
          kycLoading={kycLoading}
        />

        {/* =================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WalletActionButton
            icon={Plus}
            title="Add Money"
            description="Top up using bank or MFS"
            iconClass="bg-violet-50 text-violet-600"
            onClick={() =>
              openFundsModal(
                "deposit"
              )
            }
          />

          <WalletActionButton
            icon={Banknote}
            title="Withdraw"
            description={
              kycStatus ===
              "verified"
                ? "Withdraw from wallet balance"
                : "KYC verification required"
            }
            iconClass="bg-fuchsia-50 text-fuchsia-600"
            onClick={() =>
              openFundsModal(
                "withdraw"
              )
            }
          />

          <WalletActionButton
            icon={
              kycStatus ===
              "verified"
                ? ArrowUpRight
                : LockKeyhole
            }
            title="Send Money"
            description={
              kycStatus ===
              "verified"
                ? "Transfer funds securely"
                : "KYC verification required"
            }
            iconClass="bg-indigo-50 text-indigo-600"
            onClick={() =>
              openProtectedRoute(
                "/dashboard/send"
              )
            }
          />

          <WalletAction
            href="/dashboard/receive"
            icon={ArrowDownLeft}
            title="Receive Money"
            description="Share QR or payment request"
            iconClass="bg-indigo-50 text-indigo-600"
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
            iconClass="bg-purple-50 text-purple-600"
          />
        </section>

        {/* =================================================
            WALLET INFORMATION
        ================================================== */}

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />

            <div className="relative p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_22px_rgba(79,70,229,0.22)]">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-500">
                      Account overview
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                      Wallet Information
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Your wallet details and
                      current account status.
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-[10px] font-extrabold text-emerald-700">
                    Active Wallet
                  </span>
                </div>
              </div>

              {/* BALANCE */}

              <div className="relative mt-6 overflow-hidden rounded-[22px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-6">
                <div className="pointer-events-none absolute -bottom-20 -right-10 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-500">
                        Available Balance
                      </p>

                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        <span className="text-3xl font-black tracking-[-0.04em] text-indigo-950 sm:text-4xl">
                          {
                            formattedBalance
                          }
                        </span>

                        <span className="text-xs font-bold text-slate-400">
                          BDT
                        </span>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-indigo-100 bg-white text-indigo-600 shadow-sm">
                      <Banknote className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 h-px bg-indigo-100" />

                  <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Your current wallet
                      balance
                    </span>

                    <span className="font-semibold text-indigo-600">
                      Updated{" "}
                      {formatDate(
                        wallet.updatedAt
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* DETAILS */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ModernInfoItem
                  label="Wallet Owner ID"
                  value={String(
                    wallet.userId
                  )}
                  icon={
                    ShieldCheck
                  }
                />

                <ModernInfoItem
                  label="Currency"
                  value="Bangladeshi Taka (BDT)"
                  icon={
                    Banknote
                  }
                />

                <ModernInfoItem
                  label="Created"
                  value={formatDate(
                    wallet.createdAt
                  )}
                  icon={
                    CreditCard
                  }
                />

                <ModernInfoItem
                  label="Last Updated"
                  value={formatDate(
                    wallet.updatedAt
                  )}
                  icon={
                    RefreshCw
                  }
                />
              </div>
            </div>
          </div>

          {/* =================================================
              SECURITY CARD
          ================================================== */}

          <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-5 text-white shadow-[0_18px_50px_rgba(30,27,75,0.16)] sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-10 h-44 w-44 rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-indigo-100 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-indigo-100">
                    Protected
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-200">
                  Wallet security
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                  Secure Wallet
                </h2>

                <p className="mt-3 text-xs leading-6 text-indigo-100/75">
                  {getWalletKYCMessage(
                    kycStatus,
                    kycLoading,
                    kycError
                  )}
                </p>
              </div>

              <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-[13px]",
                      kycStatus ===
                      "verified"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-amber-400/15 text-amber-300",
                    ].join(" ")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-indigo-200">
                      Verification status
                    </p>

                    <p className="mt-1 truncate text-sm font-extrabold text-white">
                      {kycLoading
                        ? "Checking..."
                        : kycStatus ===
                          "verified"
                          ? "Identity Verified"
                          : kycStatus ===
                            "under_review"
                            ? "Under Review"
                            : kycStatus ===
                              "pending"
                            ? "Pending Verification"
                            : kycStatus ===
                              "rejected"
                            ? "Needs Resubmission"
                            : "Verification Required"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SecurityPoint text="Protected financial actions" />

                <SecurityPoint text="Backend verification enabled" />

                <SecurityPoint text="Secure wallet activity monitoring" />
              </div>

              <div className="mt-auto pt-7">
                <Link
                  href="/dashboard/kyc"
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-white px-4 text-xs font-extrabold text-indigo-950 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:bg-indigo-50"
                >
                  Verification Center

                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <p className="mt-3 text-center text-[9px] leading-4 text-indigo-200/55">
                  Your protected wallet
                  actions remain secured
                  by backend verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================== */}

        <section className="rounded-[26px] border border-indigo-100 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-indigo-50 text-indigo-600">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-extrabold text-indigo-950">
                  Your money, one secure
                  place.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Add, withdraw, send,
                  receive and track your
                  digital payments through
                  your Coffer wallet.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/transactions"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700"
            >
              View transaction history

              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* =====================================================
          KYC MODAL
      ====================================================== */}

      <KYCGuardModal
        open={kycGuardOpen}
        status={kycStatus}
        loading={kycLoading}
        errorMessage={kycError}
        onRetry={() =>
          void loadKYCStatus()
        }
        onClose={() =>
          setKycGuardOpen(false)
        }
        onGoToKYC={() => {
          setKycGuardOpen(false);

          router.push(
            "/dashboard/kyc"
          );
        }}
      />

      {/* =====================================================
          FUNDS MODAL
      ====================================================== */}

      {fundsAction && (
        <FundsModal
          action={fundsAction}
          balance={balance}
          amount={fundsAmount}
          reference={fundsReference}
          submitting={
            fundsSubmitting
          }
          errorMessage={
            fundsError
          }
          successMessage={
            fundsSuccess
          }
          transactionId={
            lastFundsResponse
              ?.transaction
              ?._id
          }
          addMoneySource={
            addMoneySource
          }
          addMoneyProvider={
            addMoneyProvider
          }
          onAddMoneySourceChange={(
            source
          ) => {
            setAddMoneySource(
              source
            );

            if (
              source === "MFS"
            ) {
              setAddMoneyProvider(
                "BKASH"
              );
            } else {
              setAddMoneyProvider(
                "DBBL"
              );
            }
          }}
          onAddMoneyProviderChange={
            setAddMoneyProvider
          }
          onAmountChange={
            setFundsAmount
          }
          onReferenceChange={
            setFundsReference
          }
          onClose={
            closeFundsModal
          }
          onSubmit={
            handleFundsSubmit
          }
        />
      )}
    </>
  );
}

/* =========================================================
   MODERN INFO ITEM
========================================================= */

function ModernInfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <div className="group rounded-[19px] border border-slate-200 bg-slate-50/70 p-4 transition duration-300 hover:border-indigo-200 hover:bg-indigo-50/40">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100 transition group-hover:bg-indigo-50">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-1.5 break-all text-[12px] font-bold leading-5 text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY POINT
========================================================= */

function SecurityPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>

      <span className="text-[11px] font-semibold text-indigo-100/80">
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   KYC GUARD MODAL
========================================================= */

function KYCGuardModal({
  open,
  status,
  loading,
  errorMessage,
  onRetry,
  onClose,
  onGoToKYC,
}: {
  open: boolean;
  status: KYCStatus | null;
  loading: boolean;
  errorMessage: string;
  onRetry: () => void;
  onClose: () => void;
  onGoToKYC: () => void;
}) {
  if (!open) {
    return null;
  }

  const content =
    getWalletKYCContent(
      status
    );

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close KYC notice"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-300/15 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">
            Identity verification
          </p>

          <h2 className="relative mt-1.5 text-xl font-black tracking-[-0.02em] text-indigo-950">
            {loading
              ? "Checking KYC status"
              : errorMessage
                ? "Unable to verify KYC"
                : content.title}
          </h2>

          <p className="relative mt-2 text-xs leading-5 text-slate-600">
            {loading
              ? "Please wait while we confirm your current verification status."
              : errorMessage ||
                content.description}
          </p>
        </div>

        <div className="p-6">
          {errorMessage ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-indigo-700 text-xs font-extrabold text-white transition hover:bg-indigo-800"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </button>
          ) : status ===
            "verified" ? (
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-[14px] bg-emerald-600 text-xs font-extrabold text-white transition hover:bg-emerald-700"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={
                onGoToKYC
              }
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-indigo-700 text-xs font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />

              {content.cta}

              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
            Backend verification still
            protects Send Money and
            Withdraw even if this UI check
            is bypassed.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   KYC CONTENT
========================================================= */

function getWalletKYCContent(
  status: KYCStatus | null
): {
  title: string;
  description: string;
  cta: string;
} {
  switch (status) {
    case "verified":
      return {
        title:
          "Identity verified",
        description:
          "Your KYC is verified and protected wallet actions are available.",
        cta: "Continue",
      };

    case "pending":
    case "under_review":
      return {
        title:
          "KYC is under review",
        description:
          "Your documents are being reviewed. Send Money and Withdraw will unlock after approval.",
        cta:
          "View KYC Status",
      };

    case "rejected":
      return {
        title:
          "KYC needs resubmission",
        description:
          "Your previous verification was not approved. Review the status and resubmit the required documents.",
        cta:
          "Review & Resubmit",
      };

    case "not_started":
    default:
      return {
        title:
          "KYC verification required",
        description:
          "Complete identity verification to use Send Money and Withdraw.",
        cta:
          "Start Verification",
      };
  }
}

/* =========================================================
   KYC MESSAGE
========================================================= */

function getWalletKYCMessage(
  status: KYCStatus | null,
  loading: boolean,
  errorMessage: string
): string {
  if (loading) {
    return "Checking your identity verification status...";
  }

  if (errorMessage) {
    return "We could not confirm your KYC status. Protected financial actions remain locked until verification can be checked.";
  }

  return getWalletKYCContent(
    status
  ).description;
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
  addMoneySource,
  addMoneyProvider,
  onAddMoneySourceChange,
  onAddMoneyProviderChange,
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

  addMoneySource: AddMoneySource;

  addMoneyProvider: AddMoneyProvider;

  onAddMoneySourceChange: (
    source: AddMoneySource
  ) => void;

  onAddMoneyProviderChange: (
    provider: AddMoneyProvider
  ) => void;

  onAmountChange: (
    value: string
  ) => void;

  onReferenceChange: (
    value: string
  ) => void;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  const isDeposit =
    action === "deposit";

  const providers =
    addMoneySource === "MFS"
      ? MFS_PROVIDERS
      : BANK_PROVIDERS;

  const selectedProvider =
    providers.find(
      (item) =>
        item.id ===
        addMoneyProvider
    );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close funds dialog"
        onClick={onClose}
        disabled={submitting}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className={
            isDeposit
              ? "bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-600 p-6 text-white"
              : "bg-gradient-to-br from-fuchsia-900 via-fuchsia-700 to-violet-700 p-6 text-white"
          }
        >
          <div className="flex items-start justify-between gap-4">
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
                  ? "Choose a bank or mobile financial service to add money to your wallet."
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
          {/* =================================================
              SUCCESS
          ================================================== */}

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

              {selectedProvider &&
                isDeposit && (
                  <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-left">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet-500">
                      Funding Provider
                    </p>

                    <p className="mt-1 text-sm font-black text-violet-950">
                      {
                        selectedProvider.name
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-violet-700">
                      {addMoneySource ===
                      "MFS"
                        ? "Mobile Financial Service"
                        : "Bank transfer"}
                    </p>
                  </div>
                )}

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
              {/* =================================================
                  ADD MONEY SOURCE
              ================================================== */}

              {isDeposit && (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          Payment Source
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Select where the money will
                          come from.
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700">
                        Demo gateway
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          onAddMoneySourceChange(
                            "MFS"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          addMoneySource ===
                          "MFS"
                            ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100"
                            : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                              addMoneySource ===
                              "MFS"
                                ? "bg-violet-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className="text-lg font-black">
                              MFS
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-black text-slate-800">
                              Mobile Financial
                              Service
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              bKash, Nagad,
                              Rocket & Upay
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onAddMoneySourceChange(
                            "BANK"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          addMoneySource ===
                          "BANK"
                            ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                              addMoneySource ===
                              "BANK"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Banknote className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-black text-slate-800">
                              Bank Account
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Transfer from
                              your bank
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      PROVIDERS
                  ================================================== */}

                  <div className="mt-7">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-800">
                        Select{" "}
                        {addMoneySource ===
                        "MFS"
                          ? "MFS"
                          : "Bank"}
                      </p>

                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Demo only
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {providers.map(
                        (provider) => {
                          const active =
                            addMoneyProvider ===
                            provider.id;

                          return (
                            <button
                              key={
                                provider.id
                              }
                              type="button"
                              onClick={() =>
                                onAddMoneyProviderChange(
                                  provider.id
                                )
                              }
                              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100"
                                  : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                                  active
                                    ? "bg-violet-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {
                                  provider.icon
                                }
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-800">
                                  {
                                    provider.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    provider.description
                                  }
                                </p>
                              </div>

                              {active && (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-600" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-[10px] leading-5 text-amber-800">
                        This demo shows the selected
                        provider in the payment flow.
                        Real provider API/checkout
                        credentials can be connected
                        later without changing this
                        wallet architecture.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* =================================================
                  AVAILABLE BALANCE
              ================================================== */}

              <div
                className={
                  isDeposit
                    ? "mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"
                    : "rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4"
                }
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Available Balance
                </p>

                <p className="mt-1 text-lg font-black text-indigo-950">
                  {formatCurrency(
                    balance
                  )}
                </p>
              </div>

              {/* =================================================
                  AMOUNT
              ================================================== */}

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
                    onChange={(
                      event
                    ) =>
                      onAmountChange(
                        event.target.value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* =================================================
                  REFERENCE
              ================================================== */}

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
                  onChange={(
                    event
                  ) =>
                    onReferenceChange(
                      event.target.value
                    )
                  }
                  placeholder={
                    isDeposit
                      ? "Example: Monthly top-up"
                      : "Example: Cash withdrawal"
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <p className="mt-1 text-right text-[10px] text-slate-400">
                  {reference.length}
                  /160
                </p>
              </div>

              {/* =================================================
                  ERROR
              ================================================== */}

              {errorMessage && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                  <p className="text-xs font-medium leading-5 text-rose-700">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={submitting}
                className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDeposit
                    ? "bg-violet-700 hover:bg-violet-800"
                    : "bg-fuchsia-700 hover:bg-fuchsia-800"
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
                    {selectedProvider
                      ? ` • ${selectedProvider.name}`
                      : ""}
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="h-4 w-4" />

                    Withdraw
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
                Duplicate submissions are
                protected with a unique
                request ID.
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
      className="group rounded-[23px] border border-indigo-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-indigo-950">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
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
      className="group rounded-[23px] border border-indigo-100 bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-indigo-950">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {description}
      </p>
    </button>
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