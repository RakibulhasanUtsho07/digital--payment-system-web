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

import { AnimatePresence, motion } from "framer-motion";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Wallet,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import {
  getMyWallet,
  type WalletData,
} from "@/lib/api/walletApi";

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

type VerificationState =
  | "idle"
  | "checking"
  | "verified"
  | "failed";

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
    shortName: "BRAC",
    description: "Bank account",
    icon: Building2,
    enabled: true,
  },
  {
    id: "city",
    type: "bank",
    name: "City Bank",
    shortName: "City",
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
    shortName: "Prime",
    description: "Bank account",
    icon: Building2,
    enabled: true,
  },
  {
    id: "sonali",
    type: "bank",
    name: "Sonali Bank",
    shortName: "Sonali",
    description: "Bank account",
    icon: Landmark,
    enabled: true,
  },
];

/* =========================================================
   CONSTANTS
========================================================= */

const QUICK_AMOUNTS = [
  500,
  1000,
  2000,
  5000,
  10000,
  20000,
];

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
    throw new Error(
      "Secure request IDs are not supported by this browser."
    );
  }

  return crypto.randomUUID();
}

function maskAccount(value: string): string {
  const clean = value.replace(/\s+/g, "");

  if (clean.length <= 4) {
    return clean;
  }

  return `${"*".repeat(clean.length - 4)}${clean.slice(-4)}`;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/[^\d]/g, "");
}

function getProviderIcon(provider: Provider): ElementType {
  return provider.icon;
}

/* =========================================================
   PAGE
========================================================= */

export default function AddMoneyPage() {
  /* =======================================================
     WALLET
  ====================================================== */

  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [loadingWallet, setLoadingWallet] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [walletError, setWalletError] =
    useState("");

  /* =======================================================
     SOURCE
  ====================================================== */

  const [fundingType, setFundingType] =
    useState<FundingType>("mfs");

  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>("bkash");

  const [sourceSelectorOpen, setSourceSelectorOpen] =
    useState(false);

  /* =======================================================
     ACCOUNT
  ====================================================== */

  const [accountNumber, setAccountNumber] =
    useState("");

  const [secretCode, setSecretCode] =
    useState("");

  const [showSecretCode, setShowSecretCode] =
    useState(false);

  const [verifiedAccount, setVerifiedAccount] =
    useState<PaymentSourceAccount | null>(null);

  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");

  const [verificationError, setVerificationError] =
    useState("");

  /* =======================================================
     AMOUNT
  ====================================================== */

  const [amount, setAmount] =
    useState("");

  const [reference, setReference] =
    useState("");

  /* =======================================================
     SUBMISSION
  ====================================================== */

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [transaction, setTransaction] =
    useState<FundsResponse | null>(null);

  /* =======================================================
     CONFIRMATION
  ====================================================== */

  const [confirmationOpen, setConfirmationOpen] =
    useState(false);

  /* =======================================================
     IDEMPOTENCY
  ====================================================== */

  const idempotencyRef =
    useRef<IdempotencyState | null>(null);

  /* =======================================================
     PROVIDER
  ====================================================== */

  const provider = useMemo(
    () =>
      PROVIDERS.find(
        (item) =>
          item.id === selectedProvider
      ) ?? PROVIDERS[0],
    [selectedProvider]
  );

  const visibleProviders = useMemo(
    () =>
      PROVIDERS.filter(
        (item) =>
          item.type === fundingType &&
          item.enabled
      ),
    [fundingType]
  );

  const ProviderIcon = getProviderIcon(provider);

  /* =======================================================
     LOAD WALLET
  ====================================================== */

  const loadWallet = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoadingWallet(true);
        }

        setWalletError("");

        const response =
          await getMyWallet();

        if (
          !response.success ||
          !response.wallet
        ) {
          throw new Error(
            response.message ||
              "Unable to load wallet."
          );
        }

        setWallet(response.wallet);
      } catch (error) {
        console.error(
          "ADD MONEY WALLET ERROR:",
          error
        );

        setWalletError(
          error instanceof Error
            ? error.message
            : "Unable to load wallet."
        );
      } finally {
        setLoadingWallet(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /* =======================================================
     RESET VERIFICATION
  ====================================================== */

  const resetSourceVerification = useCallback(() => {
    setVerifiedAccount(null);
    setVerificationState("idle");
    setVerificationError("");
  }, []);

  /* =======================================================
     CHANGE SOURCE TYPE
  ====================================================== */

  const changeFundingType = (
    type: FundingType
  ) => {
    setFundingType(type);

    const firstProvider =
      PROVIDERS.find(
        (item) =>
          item.type === type &&
          item.enabled
      );

    if (firstProvider) {
      setSelectedProvider(firstProvider.id);
    }

    setSourceSelectorOpen(false);

    setAccountNumber("");
    setSecretCode("");
    setAmount("");
    setReference("");

    setShowSecretCode(false);

    resetSourceVerification();

    setErrorMessage("");
    setSuccessMessage("");
    setTransaction(null);

    idempotencyRef.current = null;
  };

  /* =======================================================
     CHANGE PROVIDER
  ====================================================== */

  const changeProvider = (
    id: PaymentProvider
  ) => {
    setSelectedProvider(id);

    setAccountNumber("");
    setSecretCode("");
    setShowSecretCode(false);

    resetSourceVerification();

    setErrorMessage("");
    setSuccessMessage("");
    setTransaction(null);

    idempotencyRef.current = null;
  };

  /* =======================================================
     ACCOUNT INPUT
  ====================================================== */

  const handleAccountChange = (
    value: string
  ) => {
    const normalized =
      normalizeDigits(value);

    setAccountNumber(normalized);

    resetSourceVerification();

    setVerificationError("");
    setErrorMessage("");
  };

  /* =======================================================
     SECRET INPUT
  ====================================================== */

  const handleSecretCodeChange = (
    value: string
  ) => {
    setSecretCode(value);

    resetSourceVerification();

    setVerificationError("");
    setErrorMessage("");
  };

  /* =======================================================
     VERIFY SOURCE
  ====================================================== */

  const verifySourceAccount = async () => {
    setVerificationError("");
    setVerifiedAccount(null);

    const normalizedAccount =
      normalizeDigits(accountNumber);

    const normalizedSecret =
      secretCode.trim();

    if (!normalizedAccount) {
      setVerificationError(
        "Enter your account number."
      );

      setVerificationState("failed");
      return;
    }

    if (
      normalizedAccount.length < 8 ||
      normalizedAccount.length > 32
    ) {
      setVerificationError(
        "Enter a valid account number."
      );

      setVerificationState("failed");
      return;
    }

    if (!normalizedSecret) {
      setVerificationError(
        "Enter your secret code."
      );

      setVerificationState("failed");
      return;
    }

    if (normalizedSecret.length < 4) {
      setVerificationError(
        "Secret code must contain at least 4 characters."
      );

      setVerificationState("failed");
      return;
    }

    setVerificationState("checking");

    try {
      const response =
        await validatePaymentSource({
          provider: selectedProvider,
          accountNumber:
            normalizedAccount,
          secretCode:
            normalizedSecret,
        });

      if (
        !response.success ||
        !response.account
      ) {
        throw new Error(
          response.message ||
            "Unable to verify source account."
        );
      }

      setVerifiedAccount(
        response.account
      );

      setAccountNumber(
        normalizedAccount
      );

      setVerificationState(
        "verified"
      );

      setErrorMessage("");
      setSuccessMessage("");
    } catch (error) {
      console.error(
        "SOURCE VERIFICATION ERROR:",
        error
      );

      setVerificationState("failed");

      setVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to verify source account."
      );
    }
  };

  /* =======================================================
     AMOUNT VALIDATION
  ====================================================== */

  const validateAmount =
    useCallback((): number | null => {
      const raw = amount.trim();

      if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
        setErrorMessage(
          "Enter a valid amount with up to 2 decimal places."
        );

        return null;
      }

      const numeric =
        Number(raw);

      const minorUnits =
        Math.round(
          numeric * 100
        );

      if (
        !Number.isFinite(numeric) ||
        !Number.isSafeInteger(
          minorUnits
        ) ||
        numeric <= 0
      ) {
        setErrorMessage(
          "Amount must be greater than zero."
        );

        return null;
      }

      if (numeric < MIN_AMOUNT) {
        setErrorMessage(
          `Minimum top-up amount is ${formatCurrency(
            MIN_AMOUNT
          )}.`
        );

        return null;
      }

      if (numeric > MAX_AMOUNT) {
        setErrorMessage(
          `Maximum top-up amount is ${formatCurrency(
            MAX_AMOUNT
          )}.`
        );

        return null;
      }

      return numeric;
    }, [amount]);

  /* =======================================================
     OPEN CONFIRMATION
  ====================================================== */

  const openConfirmation = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setTransaction(null);

    if (
      verificationState !==
        "verified" ||
      !verifiedAccount
    ) {
      setErrorMessage(
        "Verify the source account before continuing."
      );

      return;
    }

    if (!secretCode.trim()) {
      setErrorMessage(
        "Enter your secret code before continuing."
      );

      return;
    }

    if (
      wallet?.status !==
      "ACTIVE"
    ) {
      setErrorMessage(
        "Your wallet is not active."
      );

      return;
    }

    const numeric =
      validateAmount();

    if (numeric === null) {
      return;
    }

    const available =
      Number(
        verifiedAccount.availableBalance ||
          0
      );

    if (numeric > available) {
      setErrorMessage(
        `Insufficient source account balance. Available ${formatCurrency(
          available
        )}.`
      );

      return;
    }

    if (
      reference.trim().length > 160
    ) {
      setErrorMessage(
        "Reference must be 160 characters or fewer."
      );

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
    referenceValue: string
  ): string => {
    const fingerprint = [
      "deposit",
      providerId,
      account,
      amountMinorUnits,
      referenceValue,
    ].join("|");

    if (
      idempotencyRef.current
        ?.fingerprint ===
      fingerprint
    ) {
      return idempotencyRef.current
        .key;
    }

    const key =
      createSecureRequestId();

    idempotencyRef.current = {
      fingerprint,
      key,
    };

    return key;
  };

  /* =======================================================
     SUBMIT DEPOSIT
  ====================================================== */

  const submitDeposit = async () => {
    if (!wallet) {
      return;
    }

    if (
      !verifiedAccount ||
      verificationState !==
        "verified"
    ) {
      setErrorMessage(
        "Source account verification is required."
      );

      setConfirmationOpen(false);
      return;
    }

    if (!secretCode.trim()) {
      setErrorMessage(
        "Secret code is required."
      );

      setConfirmationOpen(false);
      return;
    }

    if (
      wallet.status !==
      "ACTIVE"
    ) {
      setErrorMessage(
        "Your wallet is not active."
      );

      setConfirmationOpen(false);
      return;
    }

    const numericAmount =
      validateAmount();

    if (numericAmount === null) {
      setConfirmationOpen(false);
      return;
    }

    if (
      numericAmount >
      Number(
        verifiedAccount.availableBalance ||
          0
      )
    ) {
      setErrorMessage(
        "Insufficient source account balance."
      );

      setConfirmationOpen(false);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const minorUnits =
        Math.round(
          numericAmount * 100
        );

      const normalizedReference =
        reference.trim();

      const idempotencyKey =
        getIdempotencyKey(
          minorUnits,
          provider.id,
          verifiedAccount.accountNumber,
          normalizedReference
        );

      const response =
        await depositFunds({
          provider: provider.id,

          accountNumber:
            verifiedAccount.accountNumber,

          secretCode:
            secretCode.trim(),

          amount:
            minorUnits / 100,

          reference:
            normalizedReference ||
            undefined,

          idempotencyKey,
        });

      if (
        !response.success ||
        !response.wallet
      ) {
        throw new Error(
          response.message ||
            "Money could not be added."
        );
      }

      setWallet(
        (current) =>
          current
            ? {
                ...current,

                balance:
                  response.wallet!
                    .balance,

                pendingBalance:
                  response.wallet!
                    .pendingBalance ??
                  current.pendingBalance,

                status:
                  response.wallet!
                    .status,

                updatedAt:
                  response.wallet!
                    .updatedAt ||
                  new Date().toISOString(),
              }
            : current
      );

      setTransaction(response);

      setSuccessMessage(
        response.duplicate
          ? "This payment was already processed. Your wallet was not credited twice."
          : response.message ||
              `Money added successfully from ${provider.name}.`
      );

      setAmount("");
      setReference("");
      setSecretCode("");

      setVerifiedAccount(null);
      setAccountNumber("");

      setVerificationState("idle");
      setVerificationError("");

      setShowSecretCode(false);
      setConfirmationOpen(false);

      idempotencyRef.current =
        null;

      await loadWallet(true);
    } catch (error) {
      console.error(
        "ADD MONEY REQUEST ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add money."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     DERIVED VALUES
  ====================================================== */

  const balance =
    Number(wallet?.balance) || 0;

  const sourceBalance =
    Number(
      verifiedAccount?.availableBalance
    ) || 0;

  const numericAmount =
    Number(amount) || 0;

  const remainingSourceBalance =
    Math.max(
      0,
      sourceBalance - numericAmount
    );

  const amountPercentage =
    sourceBalance > 0
      ? Math.min(
          100,
          (numericAmount /
            sourceBalance) *
            100
        )
      : 0;

  /* =======================================================
     LOADING
  ====================================================== */

  if (loadingWallet) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-600 text-white shadow-[0_18px_45px_rgba(109,40,217,.25)]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <p className="mt-5 text-base font-black text-foreground">
            Loading Add Money
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your wallet balance...
          </p>
        </motion.div>
      </div>
    );
  }

  /* =======================================================
     WALLET ERROR
  ====================================================== */

  if (!wallet) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/30">
            <WalletCards className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-xl font-black text-foreground">
            Wallet unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {walletError ||
              "Unable to load your wallet."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadWallet()
            }
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
     MAIN
  ====================================================== */

  return (
    <>
      <main className="min-h-screen pb-14">
        <div className="mx-auto max-w-[1280px] space-y-6">
          {/* =================================================
              TOP HEADER
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: -16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
            }}
            className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white shadow-[0_24px_70px_rgba(39,24,93,.20)] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />

            <div className="pointer-events-none absolute bottom-[-130px] left-[28%] h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <div className="pointer-events-none absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Link
                  href="/dashboard/wallet"
                  className="inline-flex items-center gap-2 text-xs font-bold text-violet-200 transition hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Wallet
                </Link>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wallet Funding
                </div>

                <h1 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                  Add Money
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/75">
                  Fund your Coffer wallet securely
                  from a verified mobile financial
                  service or bank account.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <HeaderBadge
                    icon={ShieldCheck}
                    text="Authenticated"
                  />

                  <HeaderBadge
                    icon={UserCheck}
                    text="Verified source"
                  />

                  <HeaderBadge
                    icon={LockKeyhole}
                    text="Protected payment"
                  />
                </div>
              </div>

              <div className="w-full max-w-[300px] rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/60">
                      Current Balance
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight">
                      {formatCurrency(
                        balance
                      )}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                    <Wallet className="h-5 w-5 text-violet-200" />
                  </div>
                </div>

                <div className="mt-4 h-px bg-white/10" />

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-200/50">
                      Source
                    </p>

                    <p className="mt-1 text-sm font-black">
                      {provider.shortName}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={() =>
                      void loadWallet(true)
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 text-[10px] font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={
                        refreshing
                          ? "h-3.5 w-3.5 animate-spin"
                          : "h-3.5 w-3.5"
                      }
                    />

                    {refreshing
                      ? "Syncing"
                      : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              MINI FLOW
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="grid gap-2 sm:grid-cols-3"
          >
            <MiniStep
              active={
                verificationState ===
                  "idle" ||
                verificationState ===
                  "checking" ||
                verificationState ===
                  "failed"
              }
              number="01"
              title="Choose source"
              detail={`${fundingType === "mfs" ? "MFS" : "Bank"} • ${provider.shortName}`}
            />

            <MiniStep
              active={
                verificationState ===
                "verified"
              }
              number="02"
              title="Verify account"
              detail={
                verificationState ===
                "verified"
                  ? "Account verified"
                  : "Waiting for verification"
              }
            />

            <MiniStep
              active={
                Boolean(
                  verificationState ===
                    "verified" &&
                    amount
                )
              }
              number="03"
              title="Enter amount"
              detail={
                amount
                  ? formatCurrency(
                      numericAmount
                    )
                  : "Choose your top-up amount"
              }
            />
          </motion.section>

          {/* =================================================
              STEP 1
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12,
            }}
            className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-sm"
          >
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-violet-500/5 blur-3xl" />

            <div className="relative z-10 p-5 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading
                  step="Step 1"
                  icon={CreditCard}
                  title="Select money source"
                  description="Choose where the money is coming from, then select the provider you use."
                />

                <button
                  type="button"
                  onClick={() =>
                    setSourceSelectorOpen(
                      true
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-xs font-black text-white shadow-[0_10px_24px_rgba(109,40,217,.18)] transition hover:-translate-y-0.5 hover:bg-violet-800"
                >
                  Change Source
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-7 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                {/* Selected source */}
                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 dark:from-violet-950/40 dark:via-violet-950/20 dark:to-indigo-950/20">
                  <div className="absolute right-[-35px] top-[-35px] h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />

                  <div className="relative">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                      Selected source
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-lg shadow-violet-700/20">
                        <ProviderIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground">
                          {fundingType ===
                          "mfs"
                            ? "Mobile Financial Service"
                            : "Bank Account"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {provider.name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <InfoRow
                        label="Method"
                        value={
                          fundingType ===
                          "mfs"
                            ? "MFS"
                            : "Bank"
                        }
                      />

                      <InfoRow
                        label="Provider"
                        value={
                          provider.shortName
                        }
                      />

                      <InfoRow
                        label="Status"
                        value={
                          provider.enabled
                            ? "Available"
                            : "Unavailable"
                        }
                        positive={
                          provider.enabled
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Providers */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Available providers
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Select one provider to continue
                      </p>
                    </div>

                    <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black text-muted-foreground">
                      {
                        visibleProviders.length
                      }{" "}
                      available
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleProviders.map(
                      (item, index) => (
                        <ProviderCard
                          key={item.id}
                          provider={item}
                          active={
                            selectedProvider ===
                            item.id
                          }
                          index={index}
                          onClick={() =>
                            changeProvider(
                              item.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              STEP 2
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.16,
            }}
            className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-sm"
          >
            <div className="relative z-10 p-5 sm:p-7">
              <SectionHeading
                step="Step 2"
                icon={UserCheck}
                title="Verify source account"
                description="We verify the selected provider, account number, secret code, and source-account status before moving money."
              />

              <div className="mt-7 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
                {/* Verification form */}
                <div className="rounded-[24px] border border-border bg-background/70 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Account credentials
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Enter the details for the selected provider.
                      </p>
                    </div>

                    <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 sm:flex">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-xs font-black text-foreground">
                        {fundingType ===
                        "mfs"
                          ? `${provider.name} Number`
                          : `${provider.name} Account Number`}
                      </label>

                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          {fundingType ===
                          "mfs" ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Landmark className="h-4 w-4" />
                          )}
                        </div>

                        <input
                          value={
                            accountNumber
                          }
                          onChange={(
                            event
                          ) =>
                            handleAccountChange(
                              event
                                .target
                                .value
                            )
                          }
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={
                            fundingType ===
                            "mfs"
                              ? "01710000001"
                              : "1000000001"
                          }
                          disabled={
                            verificationState ===
                            "checking"
                          }
                          className="h-14 w-full rounded-2xl border border-border bg-card pl-14 pr-4 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-black text-foreground">
                          Secret Code
                        </label>

                        <span className="text-[9px] font-semibold text-muted-foreground">
                          Never stored in browser
                        </span>
                      </div>

                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <LockKeyhole className="h-4 w-4" />
                        </div>

                        <input
                          type={
                            showSecretCode
                              ? "text"
                              : "password"
                          }
                          value={
                            secretCode
                          }
                          onChange={(
                            event
                          ) =>
                            handleSecretCodeChange(
                              event
                                .target
                                .value
                            )
                          }
                          autoComplete="off"
                          placeholder={
                            fundingType ===
                            "bank"
                              ? "Enter bank secret code"
                              : "Enter MFS secret code"
                          }
                          disabled={
                            verificationState ===
                            "checking"
                          }
                          className="h-14 w-full rounded-2xl border border-border bg-card pl-14 pr-12 text-sm font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowSecretCode(
                              (
                                current
                              ) =>
                                !current
                            )
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {showSecretCode ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        verificationState ===
                        "checking"
                      }
                      onClick={() =>
                        void verifySourceAccount()
                      }
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(109,40,217,.18)] transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verificationState ===
                      "checking" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying source...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {verificationState ===
                      "verified" &&
                      verifiedAccount && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/25"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                                Source account verified
                              </p>

                              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                {
                                  verifiedAccount.accountName
                                }
                              </p>

                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <VerifiedMeta
                                  label="Account"
                                  value={maskAccount(
                                    verifiedAccount.accountNumber
                                  )}
                                />

                                <VerifiedMeta
                                  label="Available"
                                  value={formatCurrency(
                                    verifiedAccount.availableBalance
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {verificationError && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/25"
                    >
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                      <p className="text-xs font-semibold leading-5 text-rose-700 dark:text-rose-300">
                        {verificationError}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Verification side panel */}
                <VerificationPanel
                  provider={provider}
                  fundingType={fundingType}
                  verificationState={
                    verificationState
                  }
                  verifiedAccount={
                    verifiedAccount
                  }
                />
              </div>
            </div>
          </motion.section>

          {/* =================================================
              STEP 3
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-sm"
          >
            <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />

            <div className="relative z-10 p-5 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading
                  step="Step 3"
                  icon={Banknote}
                  title="Enter top-up amount"
                  description="Choose how much should be credited to your Coffer wallet."
                />

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-300">
                  <Zap className="h-3.5 w-3.5" />
                  Instant server-side processing
                </div>
              </div>

              <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                {/* Amount form */}
                <div className="rounded-[24px] border border-border bg-background/70 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Choose amount
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Quick amounts or enter a custom value.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Limit
                      </p>

                      <p className="mt-1 text-xs font-black text-foreground">
                        {formatCurrency(
                          MAX_AMOUNT
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick amounts */}
                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {QUICK_AMOUNTS.map(
                      (value) => {
                        const active =
                          amount ===
                          String(value);

                        return (
                          <motion.button
                            whileTap={{
                              scale:
                                0.98,
                            }}
                            key={value}
                            type="button"
                            onClick={() =>
                              setAmount(
                                String(
                                  value
                                )
                              )
                            }
                            className={[
                              "relative overflow-hidden rounded-2xl border px-4 py-3.5 text-sm font-black transition",
                              active
                                ? "border-violet-600 bg-violet-700 text-white shadow-[0_10px_25px_rgba(109,40,217,.18)]"
                                : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 dark:hover:bg-violet-950/20",
                            ].join(
                              " "
                            )}
                          >
                            {active && (
                              <span className="absolute right-2 top-2">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}

                            <span className="text-[11px] opacity-70">
                              BDT
                            </span>

                            <span className="ml-1">
                              ৳
                              {value.toLocaleString(
                                "en-BD"
                              )}
                            </span>
                          </motion.button>
                        );
                      }
                    )}
                  </div>

                  {/* Main amount input */}
                  <div className="mt-6">
                    <label className="text-xs font-black text-foreground">
                      Custom amount
                    </label>

                    <div className="relative mt-2">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                        <CircleDollarSign className="h-5 w-5" />
                      </div>

                      <input
                        type="number"
                        min={
                          MIN_AMOUNT
                        }
                        max={
                          MAX_AMOUNT
                        }
                        step="0.01"
                        inputMode="decimal"
                        value={amount}
                        onChange={(
                          event
                        ) => {
                          const next =
                            event
                              .target
                              .value;

                          setAmount(next);
                          setErrorMessage("");
                        }}
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
                        className="h-16 w-full rounded-2xl border border-border bg-card pl-16 pr-4 text-xl font-black text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                      <span>
                        Minimum{" "}
                        <strong className="font-black text-foreground">
                          {formatCurrency(
                            MIN_AMOUNT
                          )}
                        </strong>
                      </span>

                      <span className="text-right">
                        Maximum{" "}
                        <strong className="font-black text-foreground">
                          {formatCurrency(
                            MAX_AMOUNT
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-black text-foreground">
                        Reference
                        <span className="ml-1 font-medium text-muted-foreground">
                          (optional)
                        </span>
                      </label>

                      <span className="text-[10px] text-muted-foreground">
                        {
                          reference.length
                        }
                        /160
                      </span>
                    </div>

                    <div className="relative mt-2">
                      <ReceiptText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        type="text"
                        maxLength={160}
                        value={
                          reference
                        }
                        onChange={(
                          event
                        ) =>
                          setReference(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Example: Monthly top-up"
                        className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/25"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                      <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                        {errorMessage}
                      </p>
                    </motion.div>
                  )}

                  {/* Review button */}
                  <form
                    onSubmit={
                      openConfirmation
                    }
                    className="mt-6"
                  >
                    <button
                      type="submit"
                      disabled={
                        submitting
                      }
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(109,40,217,.18)] transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Review Top-up
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Live summary */}
                <AmountSummaryPanel
                  amount={
                    numericAmount
                  }
                  walletBalance={
                    balance
                  }
                  sourceBalance={
                    sourceBalance
                  }
                  remainingSourceBalance={
                    remainingSourceBalance
                  }
                  amountPercentage={
                    amountPercentage
                  }
                  provider={
                    provider
                  }
                  verified={
                    verificationState ===
                    "verified"
                  }
                />
              </div>

              {/* Success state */}
              {successMessage && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                        Top-up completed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                        {successMessage}
                      </p>

                      {transaction
                        ?.payment
                        ?.providerTransactionId && (
                        <p className="mt-3 break-all rounded-xl border border-emerald-200 bg-white/50 px-3 py-2 font-mono text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                          Provider TX:{" "}
                          {
                            transaction
                              .payment
                              .providerTransactionId
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* =================================================
              HOW IT WORKS
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.24,
            }}
            className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white shadow-[0_22px_60px_rgba(39,24,93,.18)] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />

            <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                    Secure funding flow
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    How Add Money works
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-violet-100/65">
                    Every step is verified server-side before your wallet receives funds.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <LockKeyhole className="h-5 w-5 text-violet-200" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <FlowCard
                  number="01"
                  title="Choose source"
                  text="Select Bank or MFS and choose your provider."
                />

                <FlowCard
                  number="02"
                  title="Verify account"
                  text="The backend checks account, provider and secret code."
                />

                <FlowCard
                  number="03"
                  title="Check balance"
                  text="Available source balance is checked before debit."
                />

                <FlowCard
                  number="04"
                  title="Credit wallet"
                  text="The source is debited and your wallet is credited atomically."
                />
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* =====================================================
          SOURCE MODAL
      ===================================================== */}

      {sourceSelectorOpen && (
        <SourceSelectorModal
          currentType={fundingType}
          onClose={() =>
            setSourceSelectorOpen(
              false
            )
          }
          onSelect={
            changeFundingType
          }
        />
      )}

      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      {confirmationOpen && (
        <AddMoneyConfirmationModal
          provider={provider}
          account={
            verifiedAccount
          }
          amount={
            numericAmount
          }
          reference={
            reference
          }
          submitting={
            submitting
          }
          onClose={() => {
            if (!submitting) {
              setConfirmationOpen(
                false
              );
            }
          }}
          onConfirm={() =>
            void submitDeposit()
          }
        />
      )}

      {/* =====================================================
          SUCCESS TOAST
      ===================================================== */}

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            className="fixed bottom-5 right-5 z-[300] w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-emerald-200 bg-card p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground">
                  Money added successfully
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {successMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccessMessage("")
                }
                className="text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {step}
        </p>

        <h2 className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STEP
========================================================= */

function MiniStep({
  number,
  title,
  detail,
  active,
}: {
  number: string;
  title: string;
  detail: string;
  active: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
        active
          ? "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20"
          : "border-border bg-card",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black",
          active
            ? "bg-violet-700 text-white"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {number}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs font-bold text-foreground">
          {detail}
        </p>
      </div>
    </div>
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
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>

      <span
        className={[
          "text-xs font-black",
          positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   PROVIDER CARD
========================================================= */

function ProviderCard({
  provider,
  active,
  index,
  onClick,
}: {
  provider: Provider;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const Icon = provider.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!provider.enabled}
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.04,
      }}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.99,
      }}
      className={[
        "group relative overflow-hidden rounded-[20px] border p-4 text-left transition duration-300",
        active
          ? "border-violet-600 bg-violet-50 shadow-[0_12px_28px_rgba(109,40,217,.12)] dark:border-violet-500 dark:bg-violet-950/25"
          : "border-border bg-background hover:border-violet-300 hover:bg-violet-50/30 dark:hover:bg-violet-950/15",
      ].join(" ")}
    >
      {active && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500" />
      )}

      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
            active
              ? "bg-violet-700 text-white"
              : provider.type ===
                "mfs"
              ? "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300",
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

        <div
          className={[
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            active
              ? "border-violet-500 bg-violet-700 text-white"
              : "border-border text-transparent",
          ].join(" ")}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.button>
  );
}

/* =========================================================
   VERIFIED META
========================================================= */

function VerifiedMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
      <p className="text-[9px] font-black uppercase tracking-wide text-emerald-700/60 dark:text-emerald-300/60">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-emerald-800 dark:text-emerald-200">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   VERIFICATION PANEL
========================================================= */

function VerificationPanel({
  provider,
  fundingType,
  verificationState,
  verifiedAccount,
}: {
  provider: Provider;
  fundingType: FundingType;
  verificationState: VerificationState;
  verifiedAccount: PaymentSourceAccount | null;
}) {
  const statusText =
    verificationState ===
    "verified"
      ? "Verified"
      : verificationState ===
        "checking"
        ? "Checking..."
        : "Pending";

  const statusTone =
    verificationState ===
    "verified"
      ? "text-emerald-600 dark:text-emerald-400"
      : verificationState ===
        "checking"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  const ProviderIcon =
    provider.icon;

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-5 text-white shadow-[0_20px_45px_rgba(39,24,93,.16)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/55">
              Verification status
            </p>

            <h3 className="mt-1 text-xl font-black">
              Protected source
            </h3>
          </div>

          <span
            className={`rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-black ${statusTone}`}
          >
            {statusText}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ProviderIcon className="h-5 w-5 text-violet-200" />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-violet-200/45">
                Current provider
              </p>

              <p className="mt-1 truncate text-sm font-black">
                {provider.name}
              </p>

              <p className="mt-1 text-[10px] text-violet-100/50">
                {fundingType ===
                "mfs"
                  ? "Mobile financial service"
                  : "Bank account"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <SecurityCheck
            done={
              Boolean(
                provider.enabled
              )
            }
            text="Selected provider is available"
          />

          <SecurityCheck
            done={
              Boolean(
                verifiedAccount
              )
            }
            text="Account exists and is active"
          />

          <SecurityCheck
            done={
              verificationState ===
              "verified"
            }
            text="Secret code verified"
          />

          <SecurityCheck
            done={
              Boolean(
                verifiedAccount
              )
            }
            text="Source balance loaded"
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />

          <p className="text-[10px] leading-5 text-violet-100/65">
            Your secret code is used only for
            verification and is not persisted
            in browser storage.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY CHECK
========================================================= */

function SecurityCheck({
  done,
  text,
}: {
  done: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-emerald-300/15 text-emerald-300"
            : "bg-white/10 text-white/30",
        ].join(" ")}
      >
        {done ? (
          <Check className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
      </div>

      <span
        className={[
          "text-[11px] font-semibold",
          done
            ? "text-violet-100/85"
            : "text-violet-100/40",
        ].join(" ")}
      >
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   AMOUNT SUMMARY
========================================================= */

function AmountSummaryPanel({
  amount,
  walletBalance,
  sourceBalance,
  remainingSourceBalance,
  amountPercentage,
  provider,
  verified,
}: {
  amount: number;
  walletBalance: number;
  sourceBalance: number;
  remainingSourceBalance: number;
  amountPercentage: number;
  provider: Provider;
  verified: boolean;
}) {
  const ProviderIcon =
    provider.icon;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 dark:border-violet-800 dark:from-violet-950/35 dark:via-violet-950/15 dark:to-indigo-950/20 sm:p-6">
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Live top-up preview
            </p>

            <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Funding summary
            </h3>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-700 text-white shadow-lg shadow-violet-700/20">
            <ProviderIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-violet-200 bg-white/70 p-5 dark:border-violet-800 dark:bg-violet-950/20">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            You are adding
          </p>

          <motion.p
            key={amount}
            initial={{
              opacity: 0.4,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-1 text-4xl font-black tracking-[-0.05em] text-violet-950 dark:text-violet-100"
          >
            {formatCurrency(
              amount
            )}
          </motion.p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${amountPercentage}%`,
              }}
              transition={{
                duration: 0.45,
              }}
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
            <span>
              Source balance
            </span>

            <span>
              {formatCurrency(
                sourceBalance
              )}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryMetric
            label="Wallet before"
            value={formatCurrency(
              walletBalance
            )}
          />

          <SummaryMetric
            label="Wallet after"
            value={formatCurrency(
              walletBalance +
                amount
            )}
            highlight
          />

          <SummaryMetric
            label="Source after"
            value={formatCurrency(
              remainingSourceBalance
            )}
          />

          <SummaryMetric
            label="Verification"
            value={
              verified
                ? "Verified"
                : "Required"
            }
            positive={
              verified
            }
          />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />

            <p className="text-[10px] leading-5 text-muted-foreground">
              The backend performs the final
              source-account, balance and
              transaction checks before your
              wallet is credited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY METRIC
========================================================= */

function SummaryMetric({
  label,
  value,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "mt-1.5 text-sm font-black",
          highlight
            ? "text-violet-700 dark:text-violet-300"
            : positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   FLOW CARD
========================================================= */

function FlowCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[10px] font-black text-violet-100">
          {number}
        </div>

        <p className="text-sm font-black">
          {title}
        </p>
      </div>

      <p className="mt-3 text-[10px] leading-5 text-violet-100/60">
        {text}
      </p>
    </motion.div>
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
  onSelect: (
    type: FundingType
  ) => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <motion.button
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        type="button"
        aria-label="Close source selector"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.22,
        }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[30px] border border-border bg-card shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                Funding source
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Where is the money coming from?
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-5 text-violet-100/70">
                Choose Bank or MFS. We&apos;ll
                show the relevant providers next.
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
            active={
              currentType ===
              "mfs"
            }
            icon={Smartphone}
            title="Mobile Financial Service"
            description="bKash, Nagad, Rocket and upay"
            accent="fuchsia"
            onClick={() =>
              onSelect("mfs")
            }
          />

          <SourceTypeOption
            active={
              currentType ===
              "bank"
            }
            icon={Landmark}
            title="Bank Account"
            description="Supported Bangladesh bank accounts"
            accent="indigo"
            onClick={() =>
              onSelect("bank")
            }
          />
        </div>
      </motion.div>
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
  accent,
}: {
  active: boolean;
  icon: ElementType;
  title: string;
  description: string;
  onClick: () => void;
  accent: "fuchsia" | "indigo";
}) {
  const activeClasses =
    accent === "fuchsia"
      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/20"
      : "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20";

  const iconClasses =
    accent === "fuchsia"
      ? "bg-fuchsia-600"
      : "bg-indigo-600";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.99,
      }}
      className={[
        "group relative rounded-[24px] border p-5 text-left transition",
        active
          ? activeClasses
          : "border-border bg-background hover:border-violet-300 hover:bg-violet-50/30 dark:hover:bg-violet-950/15",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg",
            active
              ? iconClasses
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        {active && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-700 text-white">
            <Check className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <h3 className="mt-5 text-base font-black text-foreground">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
        Select source
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
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
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        disabled={submitting}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.22,
        }}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[30px] border border-border bg-card shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#17133B] via-[#281A63] to-[#5226A6] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                Final review
              </p>

              <h2 className="mt-1 text-xl font-black">
                Confirm Add Money
              </h2>

              <p className="mt-2 text-xs leading-5 text-violet-100/70">
                Review the verified source and
                amount before processing.
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
          <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/25">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                  Funding source
                </p>

                <p className="mt-1 text-sm font-black text-violet-950 dark:text-violet-100">
                  {provider.name}
                </p>

                {account && (
                  <>
                    <p className="mt-1 text-xs font-semibold text-violet-800 dark:text-violet-200">
                      {
                        account.accountName
                      }
                    </p>

                    <p className="mt-1 font-mono text-[10px] text-violet-700 dark:text-violet-300">
                      {maskAccount(
                        account.accountNumber
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-violet-200 pt-5 dark:border-violet-800">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Add to wallet
              </p>

              <p className="mt-1 text-4xl font-black tracking-[-0.05em] text-violet-950 dark:text-violet-100">
                {formatCurrency(
                  amount
                )}
              </p>
            </div>

            {account && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryMetric
                  label="Source balance"
                  value={formatCurrency(
                    account.availableBalance
                  )}
                />

                <SummaryMetric
                  label="After debit"
                  value={formatCurrency(
                    Math.max(
                      0,
                      account.availableBalance -
                        amount
                    )
                  )}
                />
              </div>
            )}

            {reference.trim() && (
              <div className="mt-4 rounded-xl border border-border bg-background p-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                  Reference
                </p>

                <p className="mt-1 break-words text-xs font-semibold text-foreground">
                  {reference}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

            <p className="text-[10px] leading-5 text-emerald-800 dark:text-emerald-200">
              The backend will re-check the
              source account, secret code,
              balance and wallet status before
              crediting the funds.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:opacity-50"
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
      </motion.div>
    </div>
  );
}