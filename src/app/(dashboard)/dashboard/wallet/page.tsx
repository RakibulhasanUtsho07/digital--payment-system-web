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
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  WalletCards,
  X,
} from "lucide-react";

import {
  getMyWallet,
  type WalletData,
} from "@/lib/api/walletApi";

import {
  depositFunds,
  validatePaymentSource,
  withdrawFunds,
  type FundsResponse,
  type PaymentSourceAccount,
} from "@/lib/api/fundsApi";

import { apiClient } from "@/lib/api/client";

import PremiumWalletCard from "./components/PremiumWalletCard";

/* =========================================================
   TYPES
========================================================= */

type FundsAction = "deposit" | "withdraw";

type AddMoneySource = "MFS" | "BANK";

type AddMoneyProvider =
  | "bkash"
  | "nagad"
  | "rocket"
  | "upay"
  | "dbbl"
  | "brac"
  | "city"
  | "ebl"
  | "bankasia"
  | "prime"
  | "sonali";

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
   PROVIDERS
========================================================= */

const MFS_PROVIDERS: AddMoneyProviderItem[] = [
  {
    id: "bkash",
    name: "bKash",
    description: "Add money using bKash",
    icon: "৳",
  },
  {
    id: "nagad",
    name: "Nagad",
    description: "Add money using Nagad",
    icon: "৳",
  },
  {
    id: "rocket",
    name: "Rocket",
    description: "Add money using Rocket",
    icon: "R",
  },
  {
    id: "upay",
    name: "Upay",
    description: "Add money using Upay",
    icon: "U",
  },
];

const BANK_PROVIDERS: AddMoneyProviderItem[] = [
  {
    id: "dbbl",
    name: "Dutch-Bangla Bank",
    description: "Transfer from DBBL",
    icon: "DB",
  },
  {
    id: "brac",
    name: "BRAC Bank",
    description: "Transfer from BRAC Bank",
    icon: "BB",
  },
  {
    id: "city",
    name: "City Bank",
    description: "Transfer from City Bank",
    icon: "CB",
  },
  {
    id: "ebl",
    name: "Eastern Bank",
    description: "Transfer from EBL",
    icon: "EB",
  },
  {
    id: "bankasia",
    name: "Bank Asia",
    description: "Transfer from Bank Asia",
    icon: "BA",
  },
  {
    id: "prime",
    name: "Prime Bank",
    description: "Transfer from Prime Bank",
    icon: "PB",
  },
  {
    id: "sonali",
    name: "Sonali Bank",
    description: "Transfer from Sonali Bank",
    icon: "SB",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createSecureRequestId(): string {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID !== "function"
  ) {
    throw new Error(
      "Secure request IDs are not supported by this browser.",
    );
  }

  return crypto.randomUUID();
}

/* =========================================================
   PAGE
========================================================= */

export default function WalletPage() {
  const router = useRouter();

  /* =======================================================
     WALLET
  ====================================================== */

  const [wallet, setWallet] = useState<WalletData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     KYC
  ====================================================== */

  const [kycStatus, setKycStatus] =
    useState<KYCStatus | null>(null);

  const [kycLoading, setKycLoading] = useState(true);

  const [kycError, setKycError] = useState("");

  const [kycGuardOpen, setKycGuardOpen] = useState(false);

  /* =======================================================
     FUNDS
  ====================================================== */

  const [fundsAction, setFundsAction] =
    useState<FundsAction | null>(null);

  const [fundsAmount, setFundsAmount] = useState("");

  const [fundsReference, setFundsReference] = useState("");

  const [fundsSubmitting, setFundsSubmitting] = useState(false);

  const [fundsError, setFundsError] = useState("");

  const [fundsSuccess, setFundsSuccess] = useState("");

  const [lastFundsResponse, setLastFundsResponse] =
    useState<FundsResponse | null>(null);

  const idempotencyRef =
    useRef<IdempotencyState | null>(null);

  /* =======================================================
     ADD MONEY SOURCE
  ====================================================== */

  const [addMoneySource, setAddMoneySource] =
    useState<AddMoneySource>("MFS");

  const [addMoneyProvider, setAddMoneyProvider] =
    useState<AddMoneyProvider>("bkash");

  const [sourceAccountNumber, setSourceAccountNumber] =
    useState("");

  const [sourceSecretCode, setSourceSecretCode] =
    useState("");

  const [showSourceSecret, setShowSourceSecret] =
    useState(false);

  const [
    sourceVerificationState,
    setSourceVerificationState,
  ] = useState<
    "idle" | "checking" | "verified" | "failed"
  >("idle");

  const [
    sourceVerificationError,
    setSourceVerificationError,
  ] = useState("");

  const [verifiedSource, setVerifiedSource] =
    useState<PaymentSourceAccount | null>(null);

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

        const response = await getMyWallet();

        if (!response.success || !response.wallet) {
          throw new Error(
            response.message ||
              "Unable to load wallet information.",
          );
        }

        setWallet(response.wallet);
      } catch (error) {
        console.error("Wallet loading error:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load wallet.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* =========================================================
     LOAD KYC
  ========================================================== */

  const loadKYCStatus = useCallback(async () => {
    try {
      setKycLoading(true);
      setKycError("");

      const response =
        await apiClient<KYCStatusResponse>(
          "/kyc/status",
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to verify KYC status.",
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
        error,
      );

      setKycStatus(null);

      setKycError(
        error instanceof Error
          ? error.message
          : "Unable to verify KYC status.",
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
  }, [loadWallet, loadKYCStatus]);

  /* =========================================================
     REFRESH
  ========================================================== */

  const refreshWalletPage = async () => {
    await Promise.allSettled([
      loadWallet(true),
      loadKYCStatus(),
    ]);
  };

  /* =========================================================
     KYC GUARD
  ========================================================== */

  const requireVerifiedKYC = (
    callback: () => void,
  ) => {
    if (
      !kycLoading &&
      !kycError &&
      kycStatus === "verified"
    ) {
      callback();
      return;
    }

    setKycGuardOpen(true);
  };

  const openProtectedRoute = (href: string) => {
    requireVerifiedKYC(() =>
      router.push(href),
    );
  };

  /* =========================================================
     SOURCE VERIFICATION RESET
  ========================================================== */

  const resetSourceVerification = () => {
    setSourceAccountNumber("");
    setSourceSecretCode("");
    setShowSourceSecret(false);
    setVerifiedSource(null);
    setSourceVerificationState("idle");
    setSourceVerificationError("");
  };

  /* =========================================================
     OPEN FUNDS MODAL
  ========================================================== */

  const openFundsModalUnsafe = (
    action: FundsAction,
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
      setAddMoneyProvider("bkash");

      resetSourceVerification();
    }
  };

  const openFundsModal = (action: FundsAction) => {
    if (action === "withdraw") {
      requireVerifiedKYC(() =>
        openFundsModalUnsafe("withdraw"),
      );

      return;
    }

    openFundsModalUnsafe(action);
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

    resetSourceVerification();
  };

  /* =========================================================
     PROVIDER NAME
  ========================================================== */

  const getProviderName = (
    provider: AddMoneyProvider,
  ) => {
    const allProviders = [
      ...MFS_PROVIDERS,
      ...BANK_PROVIDERS,
    ];

    return (
      allProviders.find(
        (item) => item.id === provider,
      )?.name || provider
    );
  };

  /* =========================================================
     SOURCE CHANGE
  ========================================================== */

  const handleSourceChange = (
    source: AddMoneySource,
  ) => {
    setAddMoneySource(source);

    if (source === "MFS") {
      setAddMoneyProvider("bkash");
    } else {
      setAddMoneyProvider("dbbl");
    }

    resetSourceVerification();
    setFundsError("");
  };

  const handleProviderChange = (
    provider: AddMoneyProvider,
  ) => {
    setAddMoneyProvider(provider);

    resetSourceVerification();
    setFundsError("");
  };

  /* =========================================================
     VERIFY SOURCE ACCOUNT
  ========================================================== */

  const verifySourceAccount = async () => {
    if (!fundsAction) {
      return;
    }

    const account = sourceAccountNumber
      .trim()
      .replace(/\s+/g, "");

    const secret = sourceSecretCode.trim();

    setSourceVerificationError("");
    setVerifiedSource(null);

    if (!account) {
      setSourceVerificationState("failed");
      setSourceVerificationError(
        "Enter the source account number.",
      );
      return;
    }

    if (account.length < 8 || account.length > 32) {
      setSourceVerificationState("failed");
      setSourceVerificationError(
        "Enter a valid account number.",
      );
      return;
    }

    if (!secret) {
      setSourceVerificationState("failed");
      setSourceVerificationError(
        "Enter the source account secret code.",
      );
      return;
    }

    setSourceVerificationState("checking");

    try {
      const response =
        await validatePaymentSource({
          provider: addMoneyProvider,
          accountNumber: account,
          secretCode: secret,
        });

      if (!response.success || !response.account) {
        throw new Error(
          response.message ||
            "Unable to verify source account.",
        );
      }

      setVerifiedSource(response.account);
      setSourceAccountNumber(account);
      setSourceVerificationState("verified");
      setFundsError("");
    } catch (error) {
      console.error(
        "SOURCE ACCOUNT VERIFICATION ERROR:",
        error,
      );

      setSourceVerificationState("failed");

      setSourceVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to verify source account.",
      );
    }
  };

  /* =========================================================
     IDEMPOTENCY
  ========================================================== */

  const getOrCreateIdempotencyKey = (
    action: FundsAction,
    amountMinorUnits: number,
    reference: string,
    provider?: AddMoneyProvider,
    accountNumber?: string,
  ) => {
    const fingerprint = [
      action,
      amountMinorUnits,
      reference,
      provider || "",
      accountNumber || "",
    ].join("|");

    if (
      idempotencyRef.current?.fingerprint ===
      fingerprint
    ) {
      return idempotencyRef.current.key;
    }

    const key = createSecureRequestId();

    idempotencyRef.current = {
      fingerprint,
      key,
    };

    return key;
  };

  /* =========================================================
     SUBMIT FUNDS
  ========================================================== */

  const handleFundsSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!fundsAction || !wallet) {
      return;
    }

    setFundsError("");
    setFundsSuccess("");
    setLastFundsResponse(null);

    const rawAmount = fundsAmount.trim();

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(rawAmount)
    ) {
      setFundsError(
        "Enter a valid amount with up to 2 decimal places.",
      );
      return;
    }

    const numericAmount = Number(rawAmount);

    const minorUnits = Math.round(
      numericAmount * 100,
    );

    if (
      !Number.isFinite(numericAmount) ||
      !Number.isSafeInteger(minorUnits) ||
      minorUnits <= 0
    ) {
      setFundsError(
        "Amount must be greater than 0.",
      );
      return;
    }

    const normalizedAmount = minorUnits / 100;

    if (
      fundsAction === "withdraw" &&
      normalizedAmount >
        Number(wallet.balance || 0)
    ) {
      setFundsError(
        "Insufficient wallet balance.",
      );
      return;
    }

    let reference = fundsReference.trim();

    if (reference.length > 160) {
      setFundsError(
        "Reference must be 160 characters or fewer.",
      );
      return;
    }

    if (fundsAction === "deposit") {
      if (
        sourceVerificationState !== "verified" ||
        !verifiedSource
      ) {
        setFundsError(
          "Please verify the source account before adding money.",
        );
        return;
      }

      if (!sourceSecretCode.trim()) {
        setFundsError(
          "Source account secret code is required.",
        );
        return;
      }

      if (
        normalizedAmount >
        Number(
          verifiedSource.availableBalance || 0,
        )
      ) {
        setFundsError(
          `Insufficient source account balance. Available ${formatCurrency(
            verifiedSource.availableBalance,
          )}.`,
        );
        return;
      }

      const providerLabel =
        getProviderName(addMoneyProvider);

      const prefix =
        `[${addMoneySource}] ${providerLabel}`;

      reference = reference
        ? `${prefix} - ${reference}`
        : prefix;

      reference = reference.slice(0, 160);
    }

    try {
      setFundsSubmitting(true);

      const idempotencyKey =
        getOrCreateIdempotencyKey(
          fundsAction,
          minorUnits,
          reference,
          fundsAction === "deposit"
            ? addMoneyProvider
            : undefined,
          fundsAction === "deposit"
            ? verifiedSource?.accountNumber
            : undefined,
        );

      const response =
        fundsAction === "deposit"
          ? await depositFunds({
              provider: addMoneyProvider,
              accountNumber:
                verifiedSource!.accountNumber,
              secretCode:
                sourceSecretCode.trim(),
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
            "Funds request failed.",
        );
      }

      setWallet((current) => {
        if (!current) {
          return current;
        }

        const backendStatus =
          response.wallet?.status;

        const updatedStatus =
          backendStatus === "ACTIVE" ||
          backendStatus === "FROZEN" ||
          backendStatus === "BLOCKED"
            ? backendStatus
            : current.status;

        const updatedWallet: WalletData = {
          ...current,
          balance: Number(
            response.wallet.balance,
          ),
          pendingBalance:
            response.wallet.pendingBalance ??
            current.pendingBalance,
          status: updatedStatus,
          currency:
            response.wallet.currency ??
            current.currency,
          updatedAt:
            response.wallet.updatedAt ??
            new Date().toISOString(),
        };

        return updatedWallet;
      });

      setLastFundsResponse(response);

      setFundsSuccess(
        response.duplicate
          ? "This request was already processed. Your balance was not changed twice."
          : response.message ||
              (fundsAction === "deposit"
                ? `Money added successfully through ${getProviderName(
                    addMoneyProvider,
                  )}.`
                : "Money withdrawn successfully."),
      );

      idempotencyRef.current = null;

      await loadWallet(true);
    } catch (error) {
      console.error(
        "FUNDS REQUEST ERROR:",
        error,
      );

      setFundsError(
        error instanceof Error
          ? error.message
          : "Unable to process the request.",
      );
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
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#4C1D95] to-[#6D28D9] text-white shadow-[0_14px_35px_rgba(79,70,229,.2)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-foreground">
            Loading your wallet
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your latest balance and wallet information...
          </p>
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
        <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-card p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-rose-900/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600 dark:bg-rose-950/30">
            <CreditCard className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-foreground">
            Wallet unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage ||
              "Unable to retrieve your wallet information."}
          </p>

          <button
            type="button"
            onClick={() => void loadWallet()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-violet-700 px-5 text-xs font-extrabold text-white transition hover:bg-violet-800"
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

  const balance = Number(wallet.balance) || 0;

  const formattedBalance = formatCurrency(balance);

  /* =========================================================
     MAIN
  ========================================================== */

  return (
    <>
      <main className="space-y-6 pb-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-[0_10px_35px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/30 dark:text-violet-300">
                <WalletCards className="h-3.5 w-3.5" />
                Digital Wallet
              </div>

              <h1 className="text-2xl font-black tracking-[-0.035em] text-foreground sm:text-3xl">
                My Wallet
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Monitor your balance, add or withdraw funds and access secure payment actions from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void refreshWalletPage()
              }
              disabled={refreshing}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-border bg-background px-4 text-xs font-bold text-foreground shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
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
            PREMIUM CARD
        ================================================= */}

        <PremiumWalletCard
          walletId={wallet._id}
          balance={balance}
          kycStatus={kycStatus}
          kycLoading={kycLoading}
        />

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WalletActionButton
            icon={Plus}
            title="Add Money"
            description="Top up using bank or MFS"
            iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300"
            onClick={() =>
              openFundsModal("deposit")
            }
          />

          <WalletActionButton
            icon={Banknote}
            title="Withdraw"
            description={
              kycStatus === "verified"
                ? "Withdraw from wallet balance"
                : "KYC verification required"
            }
            iconClass="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
            onClick={() =>
              openFundsModal("withdraw")
            }
          />

          <WalletActionButton
            icon={
              kycStatus === "verified"
                ? ArrowUpRight
                : LockKeyhole
            }
            title="Send Money"
            description={
              kycStatus === "verified"
                ? "Transfer funds securely"
                : "KYC verification required"
            }
            iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"
            onClick={() =>
              openProtectedRoute(
                "/dashboard/send",
              )
            }
          />

          <WalletAction
            href="/dashboard/receive"
            icon={ArrowDownLeft}
            title="Receive Money"
            description="Share QR or payment request"
            iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"
          />

          <WalletAction
            href="/dashboard/transactions"
            icon={CreditCard}
            title="Transactions"
            description="View wallet activity"
            iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300"
          />

          <WalletAction
            href="/dashboard/kyc"
            icon={ShieldCheck}
            title="KYC Verification"
            description="Secure your account"
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300"
          />
        </section>

        {/* =================================================
            WALLET INFORMATION
        ================================================= */}

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />

            <div className="relative p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_22px_rgba(79,70,229,0.22)]">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-violet-500 dark:text-violet-400">
                      Account overview
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-foreground">
                      Wallet Information
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Your wallet details and current account status.
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    Active Wallet
                  </span>
                </div>
              </div>

              {/* AVAILABLE BALANCE - intentionally fixed/static */}
              <div className="relative mt-6 overflow-hidden rounded-[22px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-slate-950 dark:to-violet-950/30 sm:p-6">
                <div className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-300">
                        Available Balance
                      </p>

                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        <span className="text-3xl font-black tracking-[-0.04em] text-indigo-950 dark:text-indigo-100 sm:text-4xl">
                          {formattedBalance}
                        </span>

                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          BDT
                        </span>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-indigo-100 bg-white text-indigo-600 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                      <Banknote className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 h-px bg-indigo-100 dark:bg-indigo-900/50" />

                  <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Your current wallet balance
                    </span>

                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                      Updated{" "}
                      {formatDate(
                        wallet.updatedAt,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ModernInfoItem
                  label="Wallet Owner ID"
                  value={String(
                    wallet.userId,
                  )}
                  icon={ShieldCheck}
                />

                <ModernInfoItem
                  label="Currency"
                  value="Bangladeshi Taka (BDT)"
                  icon={Banknote}
                />

                <ModernInfoItem
                  label="Created"
                  value={formatDate(
                    wallet.createdAt,
                  )}
                  icon={CreditCard}
                />

                <ModernInfoItem
                  label="Last Updated"
                  value={formatDate(
                    wallet.updatedAt,
                  )}
                  icon={RefreshCw}
                />
              </div>
            </div>
          </div>

          {/* SECURITY */}

          <div className="relative overflow-hidden rounded-[28px] border border-violet-200 bg-gradient-to-br from-indigo-950 via-violet-950 to-[#3B1B75] p-5 text-white shadow-[0_18px_50px_rgba(30,27,75,0.16)] dark:border-violet-800/60 sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-violet-100 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-violet-100">
                    Protected
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-violet-200">
                  Wallet security
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                  Secure Wallet
                </h2>

                <p className="mt-3 text-xs leading-6 text-violet-100/75">
                  {getWalletKYCMessage(
                    kycStatus,
                    kycLoading,
                    kycError,
                  )}
                </p>
              </div>

              <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
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
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-violet-200">
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
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-white px-4 text-xs font-extrabold text-indigo-950 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:bg-violet-50 dark:hover:bg-violet-100"
                >
                  Verification Center

                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <p className="mt-3 text-center text-[9px] leading-4 text-violet-200/55">
                  Your protected wallet actions remain secured by backend verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <section className="rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-[0_10px_35px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-extrabold text-foreground">
                  Your money, one secure place.
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add, withdraw, send, receive and track your digital payments through your Coffer wallet.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/transactions"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
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
          router.push("/dashboard/kyc");
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
          submitting={fundsSubmitting}
          errorMessage={fundsError}
          successMessage={fundsSuccess}
          transactionId={
            lastFundsResponse
              ?.transaction?._id
          }
          addMoneySource={
            addMoneySource
          }
          addMoneyProvider={
            addMoneyProvider
          }
          sourceAccountNumber={
            sourceAccountNumber
          }
          sourceSecretCode={
            sourceSecretCode
          }
          showSourceSecret={
            showSourceSecret
          }
          sourceVerificationState={
            sourceVerificationState
          }
          sourceVerificationError={
            sourceVerificationError
          }
          verifiedSource={
            verifiedSource
          }
          onAddMoneySourceChange={
            handleSourceChange
          }
          onAddMoneyProviderChange={
            handleProviderChange
          }
          onSourceAccountNumberChange={(
            value,
          ) => {
            setSourceAccountNumber(
              value
                .replace(/\s+/g, "")
                .replace(
                  /[^\d]/g,
                  "",
                ),
            );

            setVerifiedSource(null);
            setSourceVerificationState(
              "idle",
            );
            setSourceVerificationError("");
          }}
          onSourceSecretCodeChange={(
            value,
          ) => {
            setSourceSecretCode(value);
            setVerifiedSource(null);
            setSourceVerificationState(
              "idle",
            );
            setSourceVerificationError("");
          }}
          onToggleSourceSecret={() =>
            setShowSourceSecret(
              (current) => !current,
            )
          }
          onVerifySource={
            verifySourceAccount
          }
          onAmountChange={
            setFundsAmount
          }
          onReferenceChange={
            setFundsReference
          }
          onClose={closeFundsModal}
          onSubmit={handleFundsSubmit}
        />
      )}

      {/* =====================================================
          SUCCESS TOAST
      ====================================================== */}

      {fundsSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm rounded-2xl border border-emerald-200 bg-card px-5 py-4 text-card-foreground shadow-2xl dark:border-emerald-800/60">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

            <div className="min-w-0">
              <p className="text-sm font-black text-foreground">
                Funds processed
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {fundsSuccess}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFundsSuccess("")
              }
              className="text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
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
    <div className="group rounded-[19px] border border-border bg-muted/60 p-4 transition duration-300 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-700 dark:hover:bg-violet-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-card text-violet-600 shadow-sm ring-1 ring-border transition group-hover:bg-violet-50 dark:text-violet-300 dark:group-hover:bg-violet-950/40">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-1.5 break-all text-[12px] font-bold leading-5 text-foreground">
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
    getWalletKYCContent(status);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close KYC notice"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-border bg-card text-card-foreground shadow-2xl">
        <div className="relative overflow-hidden border-b border-border bg-muted p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-border bg-card text-violet-600 shadow-sm dark:text-violet-300">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            Identity verification
          </p>

          <h2 className="relative mt-1.5 text-xl font-black tracking-[-0.02em] text-foreground">
            {loading
              ? "Checking KYC status"
              : errorMessage
                ? "Unable to verify KYC"
                : content.title}
          </h2>

          <p className="relative mt-2 text-xs leading-5 text-muted-foreground">
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-violet-700 text-xs font-extrabold text-white transition hover:bg-violet-800"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </button>
          ) : status === "verified" ? (
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
              onClick={onGoToKYC}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-violet-700 text-xs font-extrabold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />

              {content.cta}

              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">
            Backend verification still protects Send Money and Withdraw even if this UI check is bypassed.
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
  status: KYCStatus | null,
) {
  switch (status) {
    case "verified":
      return {
        title: "Identity verified",
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
        cta: "View KYC Status",
      };

    case "rejected":
      return {
        title:
          "KYC needs resubmission",
        description:
          "Your previous verification was not approved. Review the status and resubmit the required documents.",
        cta: "Review & Resubmit",
      };

    case "not_started":
    default:
      return {
        title:
          "KYC verification required",
        description:
          "Complete identity verification to use Send Money and Withdraw.",
        cta: "Start Verification",
      };
  }
}

/* =========================================================
   KYC MESSAGE
========================================================= */

function getWalletKYCMessage(
  status: KYCStatus | null,
  loading: boolean,
  errorMessage: string,
) {
  if (loading) {
    return "Checking your identity verification status...";
  }

  if (errorMessage) {
    return "We could not confirm your KYC status. Protected financial actions remain locked until verification can be checked.";
  }

  return getWalletKYCContent(status).description;
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
  sourceAccountNumber,
  sourceSecretCode,
  showSourceSecret,
  sourceVerificationState,
  sourceVerificationError,
  verifiedSource,
  onAddMoneySourceChange,
  onAddMoneyProviderChange,
  onSourceAccountNumberChange,
  onSourceSecretCodeChange,
  onToggleSourceSecret,
  onVerifySource,
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
  sourceAccountNumber: string;
  sourceSecretCode: string;
  showSourceSecret: boolean;
  sourceVerificationState:
    | "idle"
    | "checking"
    | "verified"
    | "failed";
  sourceVerificationError: string;
  verifiedSource: PaymentSourceAccount | null;
  onAddMoneySourceChange: (
    source: AddMoneySource,
  ) => void;
  onAddMoneyProviderChange: (
    provider: AddMoneyProvider,
  ) => void;
  onSourceAccountNumberChange: (
    value: string,
  ) => void;
  onSourceSecretCodeChange: (
    value: string,
  ) => void;
  onToggleSourceSecret: () => void;
  onVerifySource: () => void;
  onAmountChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}) {
  const isDeposit = action === "deposit";

  const providers =
    addMoneySource === "MFS"
      ? MFS_PROVIDERS
      : BANK_PROVIDERS;

  const selectedProvider = providers.find(
    (item) =>
      item.id === addMoneyProvider,
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close funds dialog"
        onClick={onClose}
        disabled={submitting}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-border bg-card text-card-foreground shadow-2xl">
        {/* HEADER */}

        <div className="bg-gradient-to-br from-indigo-950 via-violet-950 to-[#3B1B75] p-6 text-white sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/60">
                Wallet Funds
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {isDeposit
                  ? "Add Money"
                  : "Withdraw Money"}
              </h2>

              <p className="mt-2 max-w-xl text-xs leading-5 text-violet-100/70">
                {isDeposit
                  ? "Verify your source account first, then add money securely to your wallet."
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
          className="space-y-6 p-6 sm:p-7"
        >
          {!successMessage ? (
            <>
              {/* PAYMENT SOURCE */}

              {isDeposit && (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Payment Source
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Select where the money will come from.
                        </p>
                      </div>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
                        Demo provider
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          onAddMoneySourceChange(
                            "MFS",
                          )
                        }
                        className={[
                          "rounded-[20px] border p-4 text-left transition",
                          addMoneySource === "MFS"
                            ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100 dark:border-violet-500 dark:bg-violet-950/30 dark:ring-violet-900/50"
                            : "border-border bg-card hover:border-violet-300 hover:bg-muted",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            <Smartphone className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-black text-foreground">
                              Mobile Financial Service
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              bKash, Nagad, Rocket & Upay
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onAddMoneySourceChange(
                            "BANK",
                          )
                        }
                        className={[
                          "rounded-[20px] border p-4 text-left transition",
                          addMoneySource ===
                          "BANK"
                            ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100 dark:border-indigo-500 dark:bg-indigo-950/30 dark:ring-indigo-900/50"
                            : "border-border bg-card hover:border-indigo-300 hover:bg-muted",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            <Landmark className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-black text-foreground">
                              Bank Account
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              DBBL, BRAC, City, EBL & more
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* PROVIDER */}

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-foreground">
                        Select Provider
                      </p>

                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                        {providers.length} available
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {providers.map(
                        (item) => {
                          const active =
                            addMoneyProvider ===
                            item.id;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                onAddMoneyProviderChange(
                                  item.id,
                                )
                              }
                              className={[
                                "flex items-center gap-3 rounded-[18px] border p-4 text-left transition",
                                active
                                  ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100 dark:border-violet-500 dark:bg-violet-950/30 dark:ring-violet-900/50"
                                  : "border-border bg-card hover:border-violet-300 hover:bg-muted",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black",
                                  active
                                    ? "bg-violet-600 text-white"
                                    : "bg-muted text-muted-foreground",
                                ].join(" ")}
                              >
                                {item.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-foreground">
                                  {item.name}
                                </p>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>

                              {active && (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* SOURCE ACCOUNT */}

                  <div className="rounded-[22px] border border-border bg-muted/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Source Account
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter the account that will fund your wallet.
                        </p>
                      </div>

                      {sourceVerificationState ===
                        "verified" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                        {selectedProvider?.name ||
                          "Provider"}{" "}
                        Account Number
                      </label>

                      <div className="relative mt-2">
                        <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={
                            sourceAccountNumber
                          }
                          onChange={(event) =>
                            onSourceAccountNumberChange(
                              event.target.value,
                            )
                          }
                          disabled={
                            submitting ||
                            sourceVerificationState ===
                              "checking"
                          }
                          placeholder={
                            addMoneySource ===
                            "MFS"
                              ? "01710000001"
                              : "1000000001"
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                          Secret Code
                        </label>

                        <span className="text-[9px] font-medium text-muted-foreground">
                          Never stored in browser
                        </span>
                      </div>

                      <div className="relative mt-2">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type={
                            showSourceSecret
                              ? "text"
                              : "password"
                          }
                          autoComplete="off"
                          value={
                            sourceSecretCode
                          }
                          onChange={(event) =>
                            onSourceSecretCodeChange(
                              event.target.value,
                            )
                          }
                          disabled={
                            submitting ||
                            sourceVerificationState ===
                              "checking"
                          }
                          placeholder={
                            addMoneySource ===
                            "MFS"
                              ? "Enter MFS secret code"
                              : "Enter bank secret code"
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-12 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={
                            onToggleSourceSecret
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        >
                          {showSourceSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        onVerifySource
                      }
                      disabled={
                        submitting ||
                        sourceVerificationState ===
                          "checking"
                      }
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 text-xs font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sourceVerificationState ===
                      "checking" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying source...
                        </>
                      ) : sourceVerificationState ===
                        "verified" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Source Verified
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify Source Account
                        </>
                      )}
                    </button>

                    {sourceVerificationError && (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

                          <p className="text-[10px] font-semibold leading-5 text-rose-700 dark:text-rose-300">
                            {sourceVerificationError}
                          </p>
                        </div>
                      </div>
                    )}

                    {verifiedSource && (
                      <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/25">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-emerald-600 shadow-sm dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                              {verifiedSource.accountName}
                            </p>

                            <p className="mt-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                              {verifiedSource.accountNumber}
                            </p>

                            <p className="mt-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                              Available balance:{" "}
                              {formatCurrency(
                                verifiedSource.availableBalance,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* WALLET BALANCE */}

              <div className="rounded-[18px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/60 dark:bg-violet-950/25">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                  Wallet Balance
                </p>

                <p className="mt-1 text-lg font-black text-foreground">
                  {formatCurrency(balance)}
                </p>
              </div>

              {/* AMOUNT */}

              <div>
                <label className="text-xs font-black text-foreground">
                  Amount
                </label>

                <div className="relative mt-2">
                  <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    required
                    autoFocus={!isDeposit}
                    value={amount}
                    onChange={(event) =>
                      onAmountChange(
                        event.target.value,
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
                          event.key,
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                    placeholder="0.00"
                    className="h-13 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm font-black text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>
              </div>

              {/* REFERENCE */}

              <div>
                <label className="text-xs font-black text-foreground">
                  Reference{" "}
                  <span className="font-medium text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <input
                  type="text"
                  maxLength={160}
                  value={reference}
                  onChange={(event) =>
                    onReferenceChange(
                      event.target.value,
                    )
                  }
                  placeholder={
                    isDeposit
                      ? "Example: Monthly top-up"
                      : "Example: Cash withdrawal"
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />

                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {reference.length}/160
                </p>
              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="flex items-start gap-3 rounded-[18px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

                  <p className="text-xs font-semibold leading-5 text-rose-700 dark:text-rose-300">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  submitting ||
                  (isDeposit &&
                    sourceVerificationState !==
                      "verified")
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
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

              <p className="text-center text-[10px] leading-4 text-muted-foreground">
                All fund requests are protected with server-side validation and idempotent processing.
              </p>
            </>
          ) : (
            /* SUCCESS */
            <div className="py-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-xl font-black text-foreground">
                Transaction completed
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {successMessage}
              </p>

              {selectedProvider &&
                isDeposit && (
                  <div className="mx-auto mt-5 max-w-sm rounded-[18px] border border-violet-200 bg-violet-50 p-4 text-left dark:border-violet-800/60 dark:bg-violet-950/25">
                    <p className="text-[9px] font-black uppercase tracking-wide text-violet-600 dark:text-violet-300">
                      Provider
                    </p>

                    <p className="mt-1 text-sm font-black text-foreground">
                      {selectedProvider.name}
                    </p>

                    {verifiedSource && (
                      <p className="mt-1 font-mono text-[10px] text-violet-700 dark:text-violet-300">
                        {verifiedSource.accountNumber}
                      </p>
                    )}
                  </div>
                )}

              {transactionId && (
                <div className="mx-auto mt-4 max-w-sm rounded-[18px] border border-border bg-muted p-4 text-left">
                  <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                    Transaction ID
                  </p>

                  <p className="mt-1 break-all font-mono text-[10px] font-bold text-foreground">
                    {transactionId}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 h-11 w-full rounded-xl bg-foreground text-xs font-black text-background transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
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
      href={href}
      className="group rounded-[23px] border border-border bg-card p-5 text-card-foreground shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)] dark:hover:border-violet-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-foreground">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
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
      className="group rounded-[23px] border border-border bg-card p-5 text-left text-card-foreground shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)] dark:hover:border-violet-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-foreground">
        {title}
      </h3>

      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
        {description}
      </p>
    </button>
  );
}