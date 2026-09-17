"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
} from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  LockKeyhole,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react";

import { getMyWallet, type WalletData } from "@/lib/api/walletApi";

import {
  depositFunds,
  validatePaymentSource,
  type FundsResponse,
  type PaymentProvider,
  type PaymentSourceAccount,
} from "@/lib/api/fundsApi";

/* =========================================================
   TYPES
========================================================= */

type FundingType = "mfs" | "bank";

interface Provider {
  id: PaymentProvider;

  type: FundingType;

  name: string;

  shortName: string;

  description: string;

  icon: ElementType;

  enabled: boolean;
}

interface IdempotencyState {
  fingerprint: string;

  key: string;
}

type VerificationState = "idle" | "checking" | "verified" | "failed";

/* =========================================================
   PROVIDERS
========================================================= */

const PROVIDERS: Provider[] = [
  {
    id: "bkash",
    type: "mfs",
    name: "bKash",
    shortName: "bKash",
    description: "Mobile financial service",
    icon: Smartphone,
    enabled: true,
  },

  {
    id: "nagad",
    type: "mfs",
    name: "Nagad",
    shortName: "Nagad",
    description: "Mobile financial service",
    icon: Smartphone,
    enabled: true,
  },

  {
    id: "rocket",
    type: "mfs",
    name: "Rocket",
    shortName: "Rocket",
    description: "Mobile financial service",
    icon: Smartphone,
    enabled: true,
  },

  {
    id: "upay",
    type: "mfs",
    name: "upay",
    shortName: "upay",
    description: "Mobile financial service",
    icon: Smartphone,
    enabled: true,
  },

  {
    id: "dbbl",
    type: "bank",
    name: "Dutch-Bangla Bank",
    shortName: "DBBL",
    description: "Bank account",
    icon: Landmark,
    enabled: true,
  },

  {
    id: "brac",
    type: "bank",
    name: "BRAC Bank",
    shortName: "BRAC Bank",
    description: "Bank account",
    icon: Building2,
    enabled: true,
  },

  {
    id: "city",
    type: "bank",
    name: "City Bank",
    shortName: "City Bank",
    description: "Bank account",
    icon: Landmark,
    enabled: true,
  },

  {
    id: "ebl",
    type: "bank",
    name: "Eastern Bank",
    shortName: "EBL",
    description: "Bank account",
    icon: Building2,
    enabled: true,
  },

  {
    id: "bankasia",
    type: "bank",
    name: "Bank Asia",
    shortName: "Bank Asia",
    description: "Bank account",
    icon: Landmark,
    enabled: true,
  },

  {
    id: "prime",
    type: "bank",
    name: "Prime Bank",
    shortName: "Prime Bank",
    description: "Bank account",
    icon: Building2,
    enabled: true,
  },

  {
    id: "sonali",
    type: "bank",
    name: "Sonali Bank",
    shortName: "Sonali Bank",
    description: "Bank account",
    icon: Landmark,
    enabled: true,
  },
];

/* =========================================================
   CONSTANTS
========================================================= */

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const MIN_AMOUNT = 10;

const MAX_AMOUNT = 500000;

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function createSecureRequestId(): string {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID !== "function"
  ) {
    throw new Error("Secure request IDs are not supported by this browser.");
  }

  return crypto.randomUUID();
}

function maskAccount(value: string): string {
  const clean = value.replace(/\s+/g, "");

  if (clean.length <= 4) {
    return clean;
  }

  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

function isValidAmount(value: string): boolean {
  return /^\d+(?:\.\d{1,2})?$/.test(value.trim());
}

/* =========================================================
   PAGE
========================================================= */

export default function AddMoneyPage() {
  const router = useRouter();

  /* =======================================================
     WALLET
  ====================================================== */

  const [wallet, setWallet] = useState<WalletData | null>(null);

  const [loadingWallet, setLoadingWallet] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [walletError, setWalletError] = useState("");

  /* =======================================================
     FUNDING TYPE
  ====================================================== */

  const [fundingType, setFundingType] = useState<FundingType>("mfs");

  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>("bkash");

  /* =======================================================
     ACCOUNT
  ====================================================== */

  const [accountNumber, setAccountNumber] = useState("");

  const [secretCode, setSecretCode] = useState("");

  const [showSecretCode, setShowSecretCode] = useState(false);

  const [verifiedAccount, setVerifiedAccount] =
    useState<PaymentSourceAccount | null>(null);

  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");

  const [verificationError, setVerificationError] = useState("");

  /* =======================================================
     AMOUNT
  ====================================================== */

  const [amount, setAmount] = useState("");

  const [reference, setReference] = useState("");

  /* =======================================================
     SUBMISSION
  ====================================================== */

  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [transaction, setTransaction] = useState<FundsResponse | null>(null);

  /* =======================================================
     CONFIRMATION
  ====================================================== */

  const [confirmationOpen, setConfirmationOpen] = useState(false);

  /* =======================================================
     SOURCE SELECTOR MODAL
  ====================================================== */

  const [sourceSelectorOpen, setSourceSelectorOpen] = useState(false);

  /* =======================================================
     IDEMPOTENCY
  ====================================================== */

  const idempotencyRef = useRef<IdempotencyState | null>(null);

  /* =======================================================
     PROVIDER
  ====================================================== */

  const provider = useMemo(
    () =>
      PROVIDERS.find((item) => item.id === selectedProvider) ?? PROVIDERS[0],
    [selectedProvider],
  );

  const visibleProviders = useMemo(
    () => PROVIDERS.filter((item) => item.type === fundingType),
    [fundingType],
  );

  /* =======================================================
     LOAD WALLET
  ====================================================== */

  const loadWallet = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingWallet(true);
      }

      setWalletError("");

      const response = await getMyWallet();

      if (!response.success || !response.wallet) {
        throw new Error(response.message || "Unable to load wallet.");
      }

      setWallet(response.wallet);
    } catch (error) {
      console.error("ADD MONEY WALLET ERROR:", error);

      setWalletError(
        error instanceof Error ? error.message : "Unable to load wallet.",
      );
    } finally {
      setLoadingWallet(false);

      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /* =======================================================
     RESET SOURCE VERIFICATION
  ====================================================== */

  const resetSourceVerification = () => {
    setVerifiedAccount(null);

    setVerificationState("idle");

    setVerificationError("");

    setSecretCode("");

    setShowSecretCode(false);
  };

  /* =======================================================
     FUNDING TYPE CHANGE
  ====================================================== */

  const changeFundingType = (type: FundingType) => {
    setFundingType(type);

    const firstProvider = PROVIDERS.find(
      (item) => item.type === type && item.enabled,
    );

    if (firstProvider) {
      setSelectedProvider(firstProvider.id);
    }

    setSourceSelectorOpen(false);

    resetSourceVerification();

    setErrorMessage("");

    setSuccessMessage("");

    setTransaction(null);
  };

  /* =======================================================
     PROVIDER CHANGE
  ====================================================== */

  const changeProvider = (id: PaymentProvider) => {
    setSelectedProvider(id);

    resetSourceVerification();

    setErrorMessage("");

    setSuccessMessage("");

    setTransaction(null);
  };

  /* =======================================================
     ACCOUNT CHANGE
  ====================================================== */

  const handleAccountChange = (value: string) => {
    const normalized = value.replace(/\s+/g, "").replace(/[^\d]/g, "");

    setAccountNumber(normalized);

    setVerifiedAccount(null);

    setVerificationState("idle");

    setVerificationError("");

    setErrorMessage("");
  };

  /* =======================================================
     SECRET CHANGE
  ====================================================== */

  const handleSecretCodeChange = (value: string) => {
    setSecretCode(value);

    setVerifiedAccount(null);

    setVerificationState("idle");

    setVerificationError("");
  };

  /* =======================================================
     VERIFY SOURCE
  ====================================================== */

  const verifySourceAccount = async () => {
    setVerificationError("");

    setVerifiedAccount(null);

    const normalizedAccount = accountNumber.trim().replace(/\s+/g, "");

    const normalizedSecret = secretCode.trim();

    if (!normalizedAccount) {
      setVerificationError("Enter your account number.");

      setVerificationState("failed");

      return;
    }

    if (normalizedAccount.length < 8) {
      setVerificationError("Enter a valid account number.");

      setVerificationState("failed");

      return;
    }

    if (!normalizedSecret) {
      setVerificationError("Enter your secret code.");

      setVerificationState("failed");

      return;
    }

    if (normalizedSecret.length < 4) {
      setVerificationError("Secret code must contain at least 4 characters.");

      setVerificationState("failed");

      return;
    }

    setVerificationState("checking");

    try {
      const response = await validatePaymentSource({
        provider: selectedProvider,

        accountNumber: normalizedAccount,

        secretCode: normalizedSecret,
      });

      if (!response.success || !response.account) {
        throw new Error(response.message || "Unable to verify source account.");
      }

      setVerifiedAccount(response.account);

      setAccountNumber(normalizedAccount);

      /*
       * We do not need the secret code after
       * successful verification.
       *
       * The final payment request gets its
       * own fresh value from the input.
       */
      setVerificationState("verified");

      setErrorMessage("");

      setSuccessMessage("");
    } catch (error) {
      console.error("SOURCE VERIFICATION ERROR:", error);

      setVerificationState("failed");

      setVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to verify source account.",
      );
    }
  };

  /* =======================================================
     VALIDATE AMOUNT
  ====================================================== */

  const validateAmount = (): number | null => {
    const raw = amount.trim();

    if (!isValidAmount(raw)) {
      setErrorMessage("Enter a valid amount with up to 2 decimal places.");

      return null;
    }

    const numeric = Number(raw);

    const minorUnits = Math.round(numeric * 100);

    if (
      !Number.isFinite(numeric) ||
      !Number.isSafeInteger(minorUnits) ||
      numeric <= 0
    ) {
      setErrorMessage("Amount must be greater than zero.");

      return null;
    }

    if (numeric < MIN_AMOUNT) {
      setErrorMessage(
        `Minimum top-up amount is ${formatCurrency(MIN_AMOUNT)}.`,
      );

      return null;
    }

    if (numeric > MAX_AMOUNT) {
      setErrorMessage(
        `Maximum top-up amount is ${formatCurrency(MAX_AMOUNT)}.`,
      );

      return null;
    }

    return numeric;
  };

  /* =======================================================
     OPEN CONFIRMATION
  ====================================================== */

  const openConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");

    setSuccessMessage("");

    setTransaction(null);

    if (verificationState !== "verified" || !verifiedAccount) {
      setErrorMessage("Verify the source account before continuing.");

      return;
    }

    if (!secretCode.trim()) {
      setErrorMessage("Enter your secret code before continuing.");

      return;
    }

    const numeric = validateAmount();

    if (numeric === null) {
      return;
    }

    if (numeric > Number(verifiedAccount.availableBalance || 0)) {
      setErrorMessage(
        `Insufficient source account balance. Available ${formatCurrency(
          verifiedAccount.availableBalance,
        )}.`,
      );

      return;
    }

    if (reference.trim().length > 160) {
      setErrorMessage("Reference must be 160 characters or fewer.");

      return;
    }

    setConfirmationOpen(true);
  };

  /* =======================================================
     IDEMPOTENCY
  ====================================================== */

  const getIdempotencyKey = (
    amountMinorUnits: number,
    providerId: PaymentProvider,
    account: string,
    referenceValue: string,
  ): string => {
    const fingerprint = [
      "deposit",
      providerId,
      account,
      amountMinorUnits,
      referenceValue,
    ].join("|");

    if (idempotencyRef.current?.fingerprint === fingerprint) {
      return idempotencyRef.current.key;
    }

    const key = createSecureRequestId();

    idempotencyRef.current = {
      fingerprint,
      key,
    };

    return key;
  };

  /* =======================================================
     SUBMIT
  ====================================================== */

  const submitDeposit = async () => {
    if (!wallet) {
      return;
    }

    if (!verifiedAccount || verificationState !== "verified") {
      setErrorMessage("Source account verification is required.");

      setConfirmationOpen(false);

      return;
    }

    if (!secretCode.trim()) {
      setErrorMessage("Secret code is required.");

      return;
    }

    const numericAmount = validateAmount();

    if (numericAmount === null) {
      setConfirmationOpen(false);

      return;
    }

    if (numericAmount > verifiedAccount.availableBalance) {
      setErrorMessage("Insufficient source account balance.");

      setConfirmationOpen(false);

      return;
    }

    setSubmitting(true);

    setErrorMessage("");

    setSuccessMessage("");

    try {
      const minorUnits = Math.round(numericAmount * 100);

      const normalizedReference = reference.trim();

      const idempotencyKey = getIdempotencyKey(
        minorUnits,
        provider.id,
        verifiedAccount.accountNumber,
        normalizedReference,
      );

      const response = await depositFunds({
        provider: provider.id,

        accountNumber: verifiedAccount.accountNumber,

        secretCode: secretCode.trim(),

        amount: minorUnits / 100,

        reference: normalizedReference || undefined,

        idempotencyKey,
      });

      if (!response.success || !response.wallet) {
        throw new Error(response.message || "Money could not be added.");
      }
      setWallet((current) => {
        if (!current) {
          return current;
        }

        const updatedWallet: WalletData = {
          ...current,
          balance: Number(response.wallet!.balance),

          pendingBalance:
            response.wallet!.pendingBalance ?? current.pendingBalance,

          status:
            response.wallet!.status === "ACTIVE" ||
            response.wallet!.status === "FROZEN" ||
            response.wallet!.status === "BLOCKED"
              ? response.wallet!.status
              : current.status,

          currency: response.wallet!.currency ?? current.currency,

          updatedAt: response.wallet!.updatedAt ?? new Date().toISOString(),
        };

        return updatedWallet;
      });
      setTransaction(response);

      setSuccessMessage(
        response.duplicate
          ? "This payment was already processed. Your wallet was not credited twice."
          : response.message ||
              `Money added successfully from ${provider.name}.`,
      );

      setAmount("");

      setReference("");

      setSecretCode("");

      setVerifiedAccount(null);

      setAccountNumber("");

      setVerificationState("idle");

      setVerificationError("");

      setConfirmationOpen(false);

      idempotencyRef.current = null;

      await loadWallet(true);
    } catch (error) {
      console.error("ADD MONEY REQUEST ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Unable to add money.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     BALANCE
  ====================================================== */

  const balance = Number(wallet?.balance) || 0;

  /* =======================================================
     LOADING
  ====================================================== */

  if (loadingWallet) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-violet-800 to-indigo-600 text-white shadow-[0_14px_35px_rgba(79,70,229,.2)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-foreground">
            Loading Add Money
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your wallet balance...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ====================================================== */

  if (!wallet) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-card p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <WalletCards className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-xl font-black text-foreground">
            Wallet unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {walletError || "Unable to load your wallet."}
          </p>

          <button
            type="button"
            onClick={() => void loadWallet()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-xs font-black text-white transition hover:bg-violet-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ====================================================== */

  return (
    <>
      <main className="min-h-screen space-y-6 pb-12">
        {/* =================================================
            TOP HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white shadow-[0_22px_60px_rgba(39,24,93,.16)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-violet-200/10" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-2 text-xs font-bold text-violet-200 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Wallet
              </Link>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
                <Plus className="h-3.5 w-3.5" />
                Wallet Funding
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Add Money
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/75">
                Add money securely from your verified MFS or bank account.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeaderBadge icon={ShieldCheck} text="Authenticated" />

                <HeaderBadge icon={UserCheck} text="Source verification" />

                <HeaderBadge icon={LockKeyhole} text="Protected payment" />
              </div>
            </div>

            <div className="shrink-0 rounded-[22px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-200/60">
                Current Balance
              </p>

              <p className="mt-2 text-2xl font-black text-white">
                {formatCurrency(balance)}
              </p>

              <button
                type="button"
                disabled={refreshing}
                onClick={() => void loadWallet(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  className={
                    refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"
                  }
                />

                {refreshing ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            SOURCE SELECTION
        ================================================= */}

        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black text-foreground">
                Select money source
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                First select whether your money is coming from an MFS or bank.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSourceSelectorOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-xs font-black text-white transition hover:bg-violet-800"
            >
              Change Source
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* CURRENT TYPE */}

          <div className="mt-6 rounded-[22px] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-800 dark:bg-violet-950/20">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-700 text-white">
                {fundingType === "mfs" ? (
                  <Smartphone className="h-5 w-5" />
                ) : (
                  <Landmark className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                  Selected source type
                </p>

                <p className="mt-1 text-sm font-black text-violet-950 dark:text-violet-100">
                  {fundingType === "mfs"
                    ? "Mobile Financial Service"
                    : "Bank Account"}
                </p>

                <p className="mt-1 text-xs text-violet-800/70 dark:text-violet-200/65">
                  {provider.name}
                </p>
              </div>
            </div>
          </div>

          {/* PROVIDERS */}

          <div className="mt-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-foreground">
                Available providers
              </p>

              <span className="text-[10px] font-semibold text-muted-foreground">
                {visibleProviders.length} available
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProviders.map((item) => (
                <ProviderCard
                  key={item.id}
                  provider={item}
                  active={selectedProvider === item.id}
                  onClick={() => changeProvider(item.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =================================================
            VERIFY ACCOUNT
        ================================================= */}

        <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
              Step 2
            </p>

            <h2 className="mt-1 text-xl font-black text-foreground">
              Verify source account
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The backend must confirm that the account exists, is active and
              belongs to the selected provider.
            </p>

            {/* ACCOUNT */}

            <div className="mt-6">
              <label className="text-xs font-black text-foreground">
                {fundingType === "mfs"
                  ? `${provider.name} Number`
                  : `${provider.name} Account Number`}
              </label>

              <div className="mt-2">
                <input
                  value={accountNumber}
                  onChange={(event) => handleAccountChange(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={
                    fundingType === "mfs" ? "01710000001" : "1000000001"
                  }
                  disabled={verificationState === "checking"}
                  className="h-13 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                />
              </div>
            </div>

            {/* SECRET CODE */}

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-black text-foreground">
                  Secret Code
                </label>

                <span className="text-[9px] font-semibold text-muted-foreground">
                  Never stored in browser
                </span>
              </div>

              <div className="relative mt-2">
                <input
                  type={showSecretCode ? "text" : "password"}
                  value={secretCode}
                  onChange={(event) =>
                    handleSecretCodeChange(event.target.value)
                  }
                  autoComplete="off"
                  placeholder={
                    fundingType === "bank"
                      ? "Enter bank secret code"
                      : "Enter MFS secret code"
                  }
                  disabled={verificationState === "checking"}
                  className="h-13 w-full rounded-2xl border border-border bg-background px-4 pr-12 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                />

                <button
                  type="button"
                  onClick={() => setShowSecretCode((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={
                    showSecretCode ? "Hide secret code" : "Show secret code"
                  }
                >
                  {showSecretCode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* VERIFY BUTTON */}

            <button
              type="button"
              disabled={verificationState === "checking"}
              onClick={() => void verifySourceAccount()}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-6 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {verificationState === "checking" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify Account
                </>
              )}
            </button>

            {/* VERIFIED */}

            {verificationState === "verified" && verifiedAccount && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div className="min-w-0">
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                      Account verified
                    </p>

                    <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {verifiedAccount.accountName}
                    </p>

                    <p className="mt-1 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                      {maskAccount(verifiedAccount.accountNumber)}
                    </p>

                    <p className="mt-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Available balance:{" "}
                      {formatCurrency(verifiedAccount.availableBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {verificationError && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                <p className="text-xs font-semibold leading-5 text-rose-700 dark:text-rose-300">
                  {verificationError}
                </p>
              </div>
            )}
          </section>

          {/* SECURITY CARD */}

          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white shadow-[0_22px_60px_rgba(39,24,93,.18)] sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/10" />

            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <LockKeyhole className="h-5 w-5 text-violet-200" />
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                Verification
              </p>

              <h3 className="mt-2 text-2xl font-black">Protected source</h3>

              <p className="mt-3 text-xs leading-6 text-violet-100/70">
                Before your wallet is credited, the backend must validate the
                source account, secret code and available balance.
              </p>

              <div className="mt-6 space-y-3">
                <SecurityBullet text="Authenticated request" />

                <SecurityBullet text="Provider verification" />

                <SecurityBullet text="Account status validation" />

                <SecurityBullet text="Available-balance validation" />

                <SecurityBullet text="Server-side wallet credit" />

                <SecurityBullet text="Idempotent transaction processing" />
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-200/45">
                  Current provider
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <provider.icon className="h-5 w-5 text-violet-200" />
                  </div>

                  <div>
                    <p className="text-sm font-black">{provider.name}</p>

                    <p className="text-[10px] text-violet-100/50">
                      {fundingType === "mfs"
                        ? "Mobile financial service"
                        : "Bank account"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        {/* =================================================
            AMOUNT
        ================================================= */}

        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
            Step 3
          </p>

          <h2 className="mt-1 text-xl font-black text-foreground">
            Enter amount
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Choose how much should be credited to your wallet.
          </p>

          {/* QUICK AMOUNTS */}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {QUICK_AMOUNTS.map((value) => {
              const active = amount === String(value);

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value))}
                  className={[
                    "rounded-xl border px-3 py-3 text-xs font-black transition",
                    active
                      ? "border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-200"
                      : "border-border bg-background text-muted-foreground hover:border-violet-300 hover:bg-violet-50/40",
                  ].join(" ")}
                >
                  ৳{value.toLocaleString("en-BD")}
                </button>
              );
            })}
          </div>

          {/* AMOUNT */}

          <div className="mt-6 max-w-xl">
            <label className="text-xs font-black text-foreground">Amount</label>

            <div className="relative mt-2">
              <Banknote className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <input
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (["-", "+", "e", "E"].includes(event.key)) {
                    event.preventDefault();
                  }
                }}
                placeholder="0.00"
                className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-lg font-black text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Min {formatCurrency(MIN_AMOUNT)}</span>

              <span>Max {formatCurrency(MAX_AMOUNT)}</span>
            </div>
          </div>

          {/* REFERENCE */}

          <div className="mt-6 max-w-xl">
            <label className="text-xs font-black text-foreground">
              Reference{" "}
              <span className="font-medium text-muted-foreground">
                (optional)
              </span>
            </label>

            <div className="relative mt-2">
              <ReceiptText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                maxLength={160}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Example: Monthly top-up"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
              />
            </div>

            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {reference.length}/160
            </p>
          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mt-5 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS */}

          {successMessage && (
            <div className="mt-5 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                    Top-up completed
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </p>

                  {transaction?.payment?.providerTransactionId && (
                    <p className="mt-2 break-all font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                      Provider transaction:{" "}
                      {transaction.payment.providerTransactionId}
                    </p>
                  )}

                  {transaction?.transaction?._id && (
                    <p className="mt-1 break-all font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                      Transaction: {transaction.transaction._id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT */}

          <form onSubmit={openConfirmation} className="mt-7">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(109,40,217,.22)] transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Review Top-up
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        {/* =================================================
            FLOW
        ================================================= */}

        <section className="rounded-[28px] border border-border bg-violet-50/70 p-5 dark:bg-violet-950/20 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                Secure funding flow
              </p>

              <h3 className="text-lg font-black text-foreground">
                How Add Money works
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <FlowStep
              number="01"
              title="Select source"
              text="Choose Bank or MFS, then select a supported provider."
            />

            <FlowStep
              number="02"
              title="Verify account"
              text="Backend validates the account number, secret code and account status."
            />

            <FlowStep
              number="03"
              title="Check funds"
              text="Backend checks that the verified source account has enough available balance."
            />

            <FlowStep
              number="04"
              title="Credit wallet"
              text="After successful processing, the wallet and transaction are updated server-side."
            />
          </div>
        </section>
      </main>

      {/* =================================================
          SOURCE SELECTOR MODAL
      ================================================= */}

      {sourceSelectorOpen && (
        <SourceSelectorModal
          currentType={fundingType}
          onClose={() => setSourceSelectorOpen(false)}
          onSelect={changeFundingType}
        />
      )}

      {/* =================================================
          CONFIRMATION MODAL
      ================================================= */}

      {confirmationOpen && (
        <AddMoneyConfirmationModal
          provider={provider}
          account={verifiedAccount}
          amount={Number(amount) || 0}
          reference={reference}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setConfirmationOpen(false);
            }
          }}
          onConfirm={() => void submitDeposit()}
        />
      )}

      {/* =================================================
          SUCCESS TOAST
      ================================================= */}

      {successMessage && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm rounded-2xl border border-emerald-200 bg-card px-5 py-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div className="min-w-0">
              <p className="text-sm font-black text-foreground">
                Top-up completed
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
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
   HEADER BADGE
========================================================= */

function HeaderBadge({
  icon: Icon,
  text,
}: {
  icon: ElementType;

  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-violet-100">
      <Icon className="h-3.5 w-3.5" />

      {text}
    </span>
  );
}

/* =========================================================
   SOURCE SELECTOR MODAL
========================================================= */

function SourceSelectorModal({
  currentType,
  onClose,
  onSelect,
}: {
  currentType: FundingType;

  onClose: () => void;

  onSelect: (type: FundingType) => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close source selector"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[30px] border border-border bg-card shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/60">
                Step 1
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Where is the money coming from?
              </h2>

              <p className="mt-2 text-xs leading-5 text-violet-100/70">
                Choose your source type before selecting the provider.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-7">
          <SourceTypeOption
            active={currentType === "mfs"}
            icon={Smartphone}
            title="Mobile Financial Service"
            description="bKash, Nagad, Rocket and upay"
            onClick={() => onSelect("mfs")}
          />

          <SourceTypeOption
            active={currentType === "bank"}
            icon={Landmark}
            title="Bank Account"
            description="Use a supported Bangladesh bank account"
            onClick={() => onSelect("bank")}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SOURCE TYPE OPTION
========================================================= */

function SourceTypeOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;

  icon: ElementType;

  title: string;

  description: string;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group rounded-[24px] border p-5 text-left transition duration-300",
        active
          ? "border-violet-600 bg-violet-50 shadow-[0_12px_30px_rgba(109,40,217,.12)] dark:border-violet-500 dark:bg-violet-950/30"
          : "border-border bg-background hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            active
              ? "bg-violet-700 text-white"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        {active && (
          <CheckCircle2 className="h-5 w-5 text-violet-700 dark:text-violet-300" />
        )}
      </div>

      <h3 className="mt-5 text-sm font-black text-foreground">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
        Select
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

/* =========================================================
   PROVIDER CARD
========================================================= */

function ProviderCard({
  provider,
  active,
  onClick,
}: {
  provider: Provider;

  active: boolean;

  onClick: () => void;
}) {
  const Icon = provider.icon;

  return (
    <button
      type="button"
      disabled={!provider.enabled}
      onClick={onClick}
      className={[
        "group rounded-2xl border p-4 text-left transition duration-300",
        active
          ? "border-violet-600 bg-violet-50 shadow-sm dark:border-violet-500 dark:bg-violet-950/30"
          : "border-border bg-background hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            active
              ? "bg-violet-700 text-white"
              : provider.type === "mfs"
                ? "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30"
                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">
            {provider.name}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            {provider.description}
          </p>
        </div>

        {active && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />
        )}
      </div>
    </button>
  );
}

/* =========================================================
   SECURITY BULLET
========================================================= */

function SecurityBullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>

      <span className="text-[11px] font-semibold text-violet-100/75">
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   FLOW STEP
========================================================= */

function FlowStep({
  number,
  title,
  text,
}: {
  number: string;

  title: string;

  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-700 text-[10px] font-black text-white">
          {number}
        </span>

        <p className="text-sm font-black text-foreground">{title}</p>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function AddMoneyConfirmationModal({
  provider,
  account,
  amount,
  reference,
  submitting,
  onClose,
  onConfirm,
}: {
  provider: Provider;

  account: PaymentSourceAccount | null;

  amount: number;

  reference: string;

  submitting: boolean;

  onClose: () => void;

  onConfirm: () => void;
}) {
  const Icon = provider.icon;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        disabled={submitting}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-[30px] border border-border bg-card shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                Final review
              </p>

              <h2 className="mt-1 text-xl font-black">Confirm Add Money</h2>

              <p className="mt-2 text-xs leading-5 text-violet-100/70">
                Review the verified source before submitting the payment.
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/30">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                  Funding source
                </p>

                <p className="mt-1 text-sm font-black text-violet-950 dark:text-violet-100">
                  {provider.name}
                </p>

                {account && (
                  <>
                    <p className="mt-1 text-xs font-bold text-violet-800 dark:text-violet-200">
                      {account.accountName}
                    </p>

                    <p className="mt-1 font-mono text-[10px] text-violet-700 dark:text-violet-300">
                      {maskAccount(account.accountNumber)}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-violet-200 pt-5 dark:border-violet-800">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Amount
              </p>

              <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-violet-950 dark:text-violet-100">
                {formatCurrency(amount)}
              </p>
            </div>

            {account && (
              <div className="mt-5 border-t border-violet-200 pt-5 dark:border-violet-800">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Source balance
                </p>

                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatCurrency(account.availableBalance)}
                </p>
              </div>
            )}

            {reference.trim() && (
              <div className="mt-5 border-t border-violet-200 pt-5 dark:border-violet-800">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Reference
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-foreground">
                  {reference}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/25">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

            <p className="text-[11px] leading-5 text-emerald-800 dark:text-emerald-200">
              The backend will re-check the source account, secret code and
              available balance before crediting the wallet.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Confirm & Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
