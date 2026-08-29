"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  History,
  Loader2,
  LockKeyhole,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
  WalletCards,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { apiClient } from "@/lib/api/client";
import { getMyWallet } from "@/lib/api/walletApi";

/* =========================================================
   TYPES
========================================================= */

interface TransferResponse {
  success: boolean;
  message?: string;
  duplicate?: boolean;
  retryable?: boolean;
  transaction?: {
    _id: string;
    amount: number;
    status: string;
    currency?: string;
    reference?: string;
    createdAt?: string;
  };
}

interface PaymentHistoryItem {
  id: string;
  recipient: string;
  amount: number;
  status: string;
  note?: string;
  createdAt: string;
}

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

/* =========================================================
   CONSTANTS
========================================================= */

const quickAmounts = [100, 500, 1000, 5000];

const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 28,
    filter: "blur(7px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -28,
    filter: "blur(7px)",
  }),
};

/* =========================================================
   PAGE
========================================================= */

export default function SendMoneyPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [kycStatus, setKycStatus] =
    useState<KYCStatus | null>(null);
  const [kycLoading, setKycLoading] =
    useState(true);
  const [kycError, setKycError] =
    useState("");

  // Requirement: hidden by default.
  const [showBalance, setShowBalance] = useState(false);

  // The current backend response shown in the supplied file does not include
  // an older transaction-history endpoint, so this stores only confirmed
  // transfers completed during the current page session.
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);

  /* =========================================================
     IDEMPOTENCY

     - Same logical transfer keeps the same key while retrying.
     - Editing recipient / amount / note creates a fresh key.
     - Password is intentionally NOT part of the fingerprint.
  ========================================================== */

  const idempotencyKeyRef = useRef<string | null>(null);
  const transferFingerprintRef = useRef<string | null>(null);

  /* =========================================================
     WALLET BALANCE
  ========================================================== */

  const loadBalance = async () => {
    try {
      setBalanceLoading(true);

      const data = await getMyWallet();

      if (data?.success && data.wallet) {
        setBalance(Number(data.wallet.balance) || 0);
      }
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    void loadBalance();
  }, []);

  /* =========================================================
     KYC STATUS

     Frontend guard is intentionally fail-closed.
     The backend requireVerifiedKYC middleware remains the
     source-of-truth security boundary for the transfer itself.
  ========================================================== */

  const loadKYCStatus = async () => {
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
            "Unable to verify your identity status."
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
          : "Unable to verify your KYC status."
      );
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    void loadKYCStatus();
  }, []);

  /* =========================================================
     DERIVED STATE
  ========================================================== */

  const numericAmount = Number(amount);

  const isRecipientValid = recipient.trim().length >= 3;

  const isAmountValid =
    amount.trim() !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (balance === null || numericAmount <= balance);

  const formattedBalance = formatCurrency(balance ?? 0);

  const recentRecipients = useMemo(() => {
    const unique = new Map<string, PaymentHistoryItem>();

    paymentHistory.forEach((item) => {
      if (!unique.has(item.recipient)) {
        unique.set(item.recipient, item);
      }
    });

    return Array.from(unique.values()).slice(0, 4);
  }, [paymentHistory]);

  /* =========================================================
     STEP NAVIGATION
  ========================================================== */

  const goToStep = (next: 1 | 2 | 3) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNext = () => {
    setErrorMessage("");

    if (kycStatus !== "verified") {
      setErrorMessage(
        "Verified KYC is required before you can send money."
      );
      return;
    }

    if (!isRecipientValid) {
      setErrorMessage(
        "Enter a valid mobile number or email for the recipient."
      );
      return;
    }

    if (!isAmountValid) {
      setErrorMessage(
        balance !== null && numericAmount > balance
          ? "That amount is more than your available balance."
          : "Enter a valid amount greater than 0."
      );
      return;
    }

    goToStep(2);
  };

  /* =========================================================
     IDEMPOTENCY KEY
  ========================================================== */

  const getIdempotencyKey = (): string => {
    const amountInMinorUnits = Math.round(numericAmount * 100);

    const fingerprint = JSON.stringify({
      recipient: recipient.trim().toLowerCase(),
      amountInMinorUnits,
      reference: note.trim(),
    });

    if (
      !idempotencyKeyRef.current ||
      transferFingerprintRef.current !== fingerprint
    ) {
      idempotencyKeyRef.current = crypto.randomUUID();
      transferFingerprintRef.current = fingerprint;
    }

    return idempotencyKeyRef.current;
  };

  /* =========================================================
     SEND MONEY
  ========================================================== */

  const handleSend = async () => {
    if (isLoading) {
      return;
    }

    if (kycStatus !== "verified") {
      setErrorMessage(
        "Verified KYC is required before you can send money."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Enter your login password to confirm this transfer."
      );
      return;
    }

    if (!isRecipientValid || !isAmountValid) {
      setErrorMessage(
        "The transfer details changed. Please review the recipient and amount again."
      );
      goToStep(1);
      return;
    }

    const idempotencyKey = getIdempotencyKey();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await apiClient<TransferResponse>("/transfers", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          recipient: recipient.trim(),
          amount: numericAmount,
          reference: note.trim() || undefined,
          password,
        }),
      });

      if (!data?.success) {
        throw new Error(data?.message || "Transfer failed.");
      }

      if (data.transaction?._id) {
        const historyItem: PaymentHistoryItem = {
          id: data.transaction._id,
          recipient: recipient.trim(),
          amount: Number(data.transaction.amount) || numericAmount,
          status: data.transaction.status || "COMPLETED",
          note: data.transaction.reference ?? (note.trim() || undefined),
          createdAt: data.transaction.createdAt || new Date().toISOString(),
        };

        setPaymentHistory((current) => {
          if (current.some((item) => item.id === historyItem.id)) {
            return current;
          }

          return [historyItem, ...current];
        });
      }

      /*
       * The logical transfer is complete.
       * A future transfer must receive a fresh idempotency key.
       */
      idempotencyKeyRef.current = null;
      transferFingerprintRef.current = null;

      setPassword("");
      setShowPassword(false);

      goToStep(3);
      void loadBalance();
    } catch (error) {
      /*
       * Keep the current key on failure so a network retry
       * of the SAME transfer remains idempotent.
       */
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Transfer failed. Please try again."
      );

      setPassword("");
      setShowPassword(false);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     RESET
  ========================================================== */

  const handleReset = () => {
    goToStep(1);
    setAmount("");
    setRecipient("");
    setPassword("");
    setShowPassword(false);
    setNote("");
    setErrorMessage("");
    idempotencyKeyRef.current = null;
    transferFingerprintRef.current = null;
  };

  /* =========================================================
     UI
  ========================================================== */

  if (kycLoading) {
    return <KYCCheckingState />;
  }

  if (
    kycError ||
    kycStatus !== "verified"
  ) {
    return (
      <KYCRequiredState
        status={kycStatus}
        errorMessage={kycError}
        onRetry={() =>
          void loadKYCStatus()
        }
      />
    );
  }

  return (
    <main className="relative mx-auto w-full max-w-[1420px] pb-10">
      {/* ambient page glows */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#77C8FF]/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-[420px] h-[360px] w-[360px] rounded-full bg-[#60A5FA]/10 blur-[110px]" />

      {/* =====================================================
          HEADER + BALANCE
      ====================================================== */}

      <section className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-stretch">
        <TransferHeroCard />

        <BalanceRevealCard
          balanceLoading={balanceLoading}
          formattedBalance={formattedBalance}
          showBalance={showBalance}
          onToggle={() => setShowBalance((current) => !current)}
        />
      </section>

      {/* =====================================================
          MAIN WORKSPACE
      ====================================================== */}

      <section className="relative z-10 mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* TRANSFER PANEL */}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="overflow-hidden rounded-[30px] border border-[#DFE9F2] bg-white shadow-[0_22px_65px_rgba(15,39,69,0.07)]"
        >
          <div className="border-b border-[#EDF2F6] bg-gradient-to-r from-[#FBFDFF] to-[#F6FAFE] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#2B78BA]">
                  Payment workspace
                </p>
                <h2 className="mt-1.5 text-xl font-black tracking-[-0.025em] text-[#17344D]">
                  {step === 1
                    ? "Transfer details"
                    : step === 2
                    ? "Review & authorize"
                    : "Payment completed"}
                </h2>
              </div>

              {step < 3 && <ProgressSteps step={step} />}
            </div>
          </div>

          <div className="p-5 sm:p-7 lg:p-8">
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-600">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="details"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <FormField
                      label="Recipient"
                      hint="Mobile number or email"
                      htmlFor="recipient"
                    >
                      <div className="group relative">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93A5B7] transition group-focus-within:text-[#2B7BC0]" />
                        <input
                          id="recipient"
                          type="text"
                          autoComplete="off"
                          placeholder="e.g. 01XXXXXXXXX or name@email.com"
                          value={recipient}
                          onChange={(event) => setRecipient(event.target.value)}
                          className="h-[58px] w-full rounded-[16px] border border-[#DCE6EF] bg-[#F8FAFC] pl-12 pr-4 text-sm font-semibold text-[#243D54] outline-none transition placeholder:font-medium placeholder:text-[#9DABBA] hover:border-[#CAD8E6] focus:border-[#3D8DD2] focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07]"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Amount"
                      hint="Bangladeshi Taka"
                      htmlFor="amount"
                    >
                      <div className="group relative">
                        <Banknote className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93A5B7] transition group-focus-within:text-[#2B7BC0]" />
                        <input
                          id="amount"
                          type="number"
                          min="1"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          onKeyDown={(event) => {
                            if (["-", "e", "E", "+"].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          className="h-[58px] w-full rounded-[16px] border border-[#DCE6EF] bg-[#F8FAFC] pl-12 pr-16 text-[21px] font-black tracking-[-0.02em] text-[#17344D] outline-none transition placeholder:text-[#C2CDD8] hover:border-[#CAD8E6] focus:border-[#3D8DD2] focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07]"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6E8396] shadow-sm">
                          BDT
                        </span>
                      </div>
                    </FormField>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#71869A]">
                        Quick amounts
                      </p>
                      {balance !== null && (
                        <p className="text-[10px] font-semibold text-[#98A7B6]">
                          Limited by available balance
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {quickAmounts.map((quickAmount) => {
                        const disabled =
                          balance !== null && quickAmount > balance;
                        const active = amount === String(quickAmount);

                        return (
                          <motion.button
                            key={quickAmount}
                            type="button"
                            disabled={disabled}
                            whileTap={disabled ? undefined : { scale: 0.97 }}
                            whileHover={disabled ? undefined : { y: -2 }}
                            onClick={() => setAmount(String(quickAmount))}
                            className={`h-11 rounded-[13px] border text-xs font-black transition ${
                              disabled
                                ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                : active
                                ? "border-[#3E8FD9] bg-[#EEF7FF] text-[#1F6FB4] shadow-[0_7px_18px_rgba(31,111,180,0.09)]"
                                : "border-[#E1E8EF] bg-white text-[#60768A] hover:border-[#BFD7EB] hover:bg-[#F7FBFF] hover:text-[#1F6FB4]"
                            }`}
                          >
                            ৳ {quickAmount.toLocaleString("en-BD")}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <FormField
                    label="Payment note"
                    hint="Optional reference"
                    htmlFor="note"
                  >
                    <div className="group relative">
                      <FileText className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93A5B7] transition group-focus-within:text-[#2B7BC0]" />
                      <input
                        id="note"
                        type="text"
                        placeholder="Add a short note for this payment"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="h-[56px] w-full rounded-[16px] border border-[#DCE6EF] bg-[#F8FAFC] pl-12 pr-4 text-sm font-semibold text-[#243D54] outline-none transition placeholder:font-medium placeholder:text-[#9DABBA] hover:border-[#CAD8E6] focus:border-[#3D8DD2] focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07]"
                      />
                    </div>
                  </FormField>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    disabled={!recipient.trim() || !amount}
                    whileTap={{ scale: 0.988 }}
                    className="group relative flex h-[58px] w-full items-center justify-center gap-2 overflow-hidden rounded-[17px] bg-gradient-to-r from-[#15558F] via-[#1F6FB4] to-[#2C8DD2] text-sm font-black text-white shadow-[0_15px_35px_rgba(31,111,180,0.22)] transition hover:shadow-[0_18px_42px_rgba(31,111,180,0.28)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                  >
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 -left-20 w-20 skew-x-[-18deg] bg-white/15"
                      animate={{ x: [0, 760] }}
                      transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.4 }}
                    />
                    <span className="relative">Review payment</span>
                    <ArrowRight className="relative h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="verify"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="group inline-flex items-center gap-1.5 text-xs font-black text-[#6B7F92] transition hover:text-[#1F6FB4]"
                  >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Edit details
                  </button>

                  <div className="overflow-hidden rounded-[24px] border border-[#DCE8F2] bg-gradient-to-br from-[#F8FCFF] to-[#EFF7FD]">
                    <div className="border-b border-white bg-white/65 p-5 text-center sm:p-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#6F8498]">
                        You are sending
                      </p>
                      <h3 className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#102A43]">
                        {formatCurrency(numericAmount)}
                      </h3>
                    </div>

                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                      <ReviewItem
                        icon={UserRound}
                        label="Recipient"
                        value={recipient}
                      />
                      <ReviewItem
                        icon={FileText}
                        label="Reference"
                        value={note.trim() || "No note added"}
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#E0E8F0] bg-white p-5 sm:p-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#EEF7FF] text-[#1F6FB4]">
                        <LockKeyhole className="h-5 w-5" />
                      </div>

                      <h3 className="mt-3 text-sm font-black text-[#17344D]">
                        Confirm with your login password
                      </h3>

                      <p className="mt-1 text-[11px] leading-5 text-[#8798A8]">
                        Re-enter your account password to authorize this transfer.
                      </p>
                    </div>

                    <div className="relative mt-5">
                      <input
                        id="transfer-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (errorMessage) {
                            setErrorMessage("");
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && password.trim() && !isLoading) {
                            void handleSend();
                          }
                        }}
                        placeholder="Enter your login password"
                        className="h-[58px] w-full rounded-[16px] border border-[#DCE6EF] bg-[#F8FAFC] px-4 pr-12 text-sm font-semibold text-[#243D54] outline-none transition placeholder:font-medium placeholder:text-[#9DABBA] hover:border-[#CAD8E6] focus:border-[#3D8DD2] focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9AAA] transition hover:text-[#1F6FB4]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-[18px] w-[18px]" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" />
                        )}
                      </button>
                    </div>

                    <div className="mt-3 flex items-start gap-2 rounded-[13px] bg-[#F7FAFD] px-3 py-2.5">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <p className="text-[10px] font-medium leading-5 text-[#7A8D9F]">
                        Your password is sent only to the secure backend over HTTPS for verification and is never stored in the transaction.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      void handleSend();
                    }}
                    disabled={!password.trim() || isLoading}
                    whileTap={{ scale: 0.988 }}
                    className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[17px] bg-gradient-to-r from-[#0F5D9E] to-[#278AD7] text-sm font-black text-white shadow-[0_14px_34px_rgba(31,112,189,0.22)] transition disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing payment...
                      </>
                    ) : (
                      <>
                        <Send className="h-[18px] w-[18px]" />
                        Confirm & send
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="success"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38 }}
                  className="flex min-h-[500px] flex-col items-center justify-center py-8 text-center"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-6 rounded-full bg-emerald-400/20"
                      animate={{ scale: [1, 1.55, 1], opacity: [0.18, 0, 0.18] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      initial={{ scale: 0.55, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 18 }}
                      className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-[0_18px_42px_rgba(16,185,129,0.14)]"
                    >
                      <CheckCircle2 className="h-14 w-14" />
                    </motion.div>
                  </div>

                  <span className="mt-7 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Payment sent
                  </span>

                  <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#102A43] sm:text-3xl">
                    Transfer completed successfully
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#74879A]">
                    {formatCurrency(numericAmount)} was sent to{" "}
                    <span className="font-black text-[#17344D]">{recipient}</span>.
                  </p>

                  <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-12 rounded-[14px] border border-[#DCE6EF] bg-white text-xs font-black text-[#61768A] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F6FB4]"
                    >
                      Send another
                    </button>

                    <Link
                      href="/dashboard"
                      className="flex h-12 items-center justify-center rounded-[14px] bg-[#1F6FB4] text-xs font-black text-white transition hover:bg-[#195E98]"
                    >
                      Back to dashboard
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* RIGHT SIDEBAR */}

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="space-y-5 xl:sticky xl:top-[100px]"
        >
          <div className="rounded-[26px] border border-[#E1EAF2] bg-white p-5 shadow-[0_16px_46px_rgba(15,39,69,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#EEF7FF] text-[#1F6FB4]">
                  <Clock3 className="h-[18px] w-[18px]" />
                </div>
                <h3 className="mt-4 text-sm font-black text-[#17344D]">
                  Recent recipients
                </h3>
                <p className="mt-1 text-[10px] leading-5 text-[#8B9AAA]">
                  Reuse recipients from transfers completed in this session.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {recentRecipients.length > 0 ? (
                recentRecipients.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRecipient(item.recipient);
                      if (step !== 1) {
                        goToStep(1);
                      }
                    }}
                    className="group flex w-full items-center gap-3 rounded-[15px] border border-transparent p-2.5 text-left transition hover:border-[#DFEAF4] hover:bg-[#F8FBFE]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#256FB0] to-[#51B9EA] text-xs font-black text-white shadow-[0_8px_20px_rgba(37,111,176,0.15)]">
                      {getInitial(item.recipient)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[#294258]">
                        {item.recipient}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold text-[#98A5B3]">
                        Last sent {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F6FB4]" />
                  </button>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#DCE6EF] bg-[#FAFCFE] px-4 py-5 text-center">
                  <UserRound className="mx-auto h-5 w-5 text-[#A1B0BE]" />
                  <p className="mt-2 text-[10px] font-semibold leading-5 text-[#8A9AAA]">
                    Recent recipients will appear here after you complete a transfer.
                  </p>
                </div>
              )}
            </div>
          </div>

          <PaymentHistoryDrawer history={paymentHistory} />

          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0A2A49] via-[#164E82] to-[#2078B7] p-6 text-white shadow-[0_22px_50px_rgba(20,78,130,0.22)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-sky-300/10 blur-[50px]" />

            <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-[#BFE8FF]" />
            </div>

            <h3 className="relative mt-5 text-base font-black">
              Payment protection
            </h3>

            <p className="relative mt-2 text-xs font-medium leading-6 text-blue-100/90">
              Review the recipient and amount before authorizing. Never share your account password.
            </p>

            <div className="relative mt-5 flex items-center gap-2 rounded-[13px] border border-white/10 bg-white/[0.07] px-3 py-2.5">
              <LockKeyhole className="h-3.5 w-3.5 text-sky-200" />
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-100">
                Secure confirmation flow
              </span>
            </div>
          </div>
        </motion.aside>
      </section>
    </main>
  );
}

/* =========================================================
   KYC GATE STATES
========================================================= */

function KYCCheckingState() {
  return (
    <main className="mx-auto flex min-h-[68vh] w-full max-w-[760px] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[30px] border border-[#DFE8F1] bg-white p-8 text-center shadow-[0_22px_65px_rgba(15,39,69,0.07)]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EEF7FF] text-[#1F6FB4]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>

        <h1 className="mt-5 text-xl font-black text-[#17344D]">
          Checking verification
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71869A]">
          Confirming your KYC status before opening the secure transfer workspace.
        </p>
      </motion.div>
    </main>
  );
}

function KYCRequiredState({
  status,
  errorMessage,
  onRetry,
}: {
  status: KYCStatus | null;
  errorMessage: string;
  onRetry: () => void;
}) {
  const content =
    getKYCGuardContent(status);

  return (
    <main className="mx-auto flex min-h-[68vh] w-full max-w-[760px] items-center justify-center px-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.985,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.42,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-full overflow-hidden rounded-[32px] border border-[#DCE7F0] bg-white p-7 text-center shadow-[0_24px_70px_rgba(15,39,69,0.08)] sm:p-9"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-300/10 blur-[80px]" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[21px] border border-blue-100 bg-[#F1F8FF] text-[#1F6FB4] shadow-sm">
            {errorMessage ? (
              <X className="h-7 w-7" />
            ) : (
              <ShieldCheck className="h-7 w-7" />
            )}
          </div>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#D8E8F5] bg-[#F7FBFF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#2B78BA]">
            <LockKeyhole className="h-3.5 w-3.5" />
            Protected financial action
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-[#17344D]">
            {errorMessage
              ? "Verification check unavailable"
              : content.title}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#71869A]">
            {errorMessage ||
              content.description}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {errorMessage ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[#1F6FB4] px-5 text-xs font-black text-white transition hover:bg-[#185C97]"
              >
                <Loader2 className="h-4 w-4" />
                Check Again
              </button>
            ) : (
              <Link
                href="/dashboard/kyc"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[#1F6FB4] px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(31,111,180,0.20)] transition hover:bg-[#185C97]"
              >
                <ShieldCheck className="h-4 w-4" />
                {content.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/dashboard/wallet"
              className="inline-flex h-12 items-center justify-center rounded-[15px] border border-[#DCE6EF] bg-white px-5 text-xs font-black text-[#60768A] transition hover:bg-[#F8FBFD]"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

function getKYCGuardContent(
  status: KYCStatus | null
): {
  title: string;
  description: string;
  cta: string;
} {
  switch (status) {
    case "pending":
    case "under_review":
      return {
        title: "KYC is under review",
        description:
          "Your identity documents have been submitted. Send Money will unlock automatically after an administrator verifies your KYC.",
        cta: "View Verification Status",
      };

    case "rejected":
      return {
        title: "KYC needs resubmission",
        description:
          "Your previous verification was not approved. Review the verification status and submit the required identity information again.",
        cta: "Review & Resubmit",
      };

    case "not_started":
    default:
      return {
        title: "Complete KYC to send money",
        description:
          "Identity verification is required before money can be transferred from your wallet.",
        cta: "Start Verification",
      };
  }
}

/* =========================================================
   TRANSFER HERO CARD
========================================================= */

function TransferHeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative min-h-[220px] overflow-hidden rounded-[30px] border border-[#D9E7F2] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_48%,#F1F8FE_100%)] p-6 shadow-[0_24px_70px_rgba(15,61,103,0.08)] sm:p-7 lg:p-8"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-300/10 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-24 right-[18%] h-56 w-56 rounded-full bg-blue-400/10 blur-[80px]" />
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#78BEEA]/45 to-transparent" />

      <div className="relative z-10 grid h-full items-center gap-7 md:grid-cols-[minmax(0,1fr)_190px] lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CFE7F7] bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#1769AA] shadow-[0_6px_18px_rgba(23,105,170,0.06)]">
              <Sparkles className="h-3.5 w-3.5" />
              Secure transfer
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1.5 text-[9px] font-black text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
              Protected
            </span>
          </div>

          <h1 className="mt-4 max-w-[560px] text-[32px] font-black leading-[1.04] tracking-[-0.055em] text-[#0E2A43] sm:text-[38px] lg:text-[41px]">
            Send money with
            <span className="relative ml-2 inline-block text-[#1E70B5]">
              confidence.
              <motion.span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-[#1F77BA] via-[#61C3EA] to-transparent"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-[13px] font-medium leading-6 text-[#6B8297] sm:text-sm">
            A guided Coffer transfer flow with review, password confirmation,
            encrypted transaction data, and duplicate-payment protection.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-[#6F879B]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Protected session
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-[#2B80C5]" />
              Retry-safe payment
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2B80C5]" />
              Review before send
            </span>
          </div>
        </div>

        <div className="relative hidden h-[168px] md:block">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 overflow-hidden rounded-[24px] border border-[#D7E8F5] bg-white/80 p-4 shadow-[0_18px_42px_rgba(31,111,180,0.10)] backdrop-blur-xl"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#63C7EE]/15 blur-[34px]" />

            <div className="relative flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#155E9D] to-[#38A7DE] text-white shadow-[0_8px_20px_rgba(31,111,180,0.22)]">
                <WalletCards className="h-[18px] w-[18px]" />
              </div>

              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D9E9F5] bg-[#F4FAFF] text-[#1F72B5]"
              >
                <ArrowUpRight className="h-4 w-4" />
              </motion.div>

              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-[18px] w-[18px]" />
              </div>
            </div>

            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-[#E8F2F9]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1E70B5] to-[#65C9EC]"
                animate={{ width: ["18%", "100%", "18%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[12px] bg-[#F4F9FD] px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#90A3B4]">Authorize</p>
                <p className="mt-1 text-[10px] font-black text-[#29475F]">Password check</p>
              </div>
              <div className="rounded-[12px] bg-[#F4F9FD] px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#90A3B4]">Protection</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-[#29475F]">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Duplicate safe
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   BALANCE CARD
========================================================= */

function BalanceRevealCard({
  balanceLoading,
  formattedBalance,
  showBalance,
  onToggle,
}: {
  balanceLoading: boolean;
  formattedBalance: string;
  showBalance: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.992 }}
      aria-label={showBalance ? "Hide balance" : "Reveal balance"}
      className="group relative min-h-[220px] w-full overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#07192C] via-[#0B365C] to-[#176DA7] p-6 text-left text-white shadow-[0_26px_65px_rgba(13,65,105,0.24)] sm:p-7"
    >
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#62D4FF]/20 blur-[80px]"
        animate={{ x: [0, 18, 0], y: [0, 12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-blue-500/20 blur-[90px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 backdrop-blur">
              <WalletCards className="h-5 w-5 text-[#9BE8FF]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9DDBFF]">
                Available balance
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/50">
                Coffer wallet · BDT
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/10 bg-white/10 text-[#C6F1FF] backdrop-blur">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showBalance ? "eye" : "eye-off"}
                initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                className="flex"
              >
                {showBalance ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-7">
          {balanceLoading ? (
            <div className="flex h-[64px] items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#9BE8FF]" />
              <span className="text-xs font-bold text-white/60">Syncing balance...</span>
            </div>
          ) : (
            <div className="relative h-[68px] overflow-hidden rounded-[18px]">
              <AnimatePresence mode="wait" initial={false}>
                {showBalance ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -26, filter: "blur(12px)" }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-full items-center"
                  >
                    <span className="bg-gradient-to-r from-white via-[#E8FAFF] to-[#91E3FF] bg-clip-text text-[38px] font-black tracking-[-0.05em] text-transparent sm:text-[46px]">
                      {formattedBalance}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0, y: -18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    className="absolute inset-0 flex items-center overflow-hidden rounded-[18px] border border-white/10 bg-[#06182A]/35 px-4 backdrop-blur-xl"
                  >
                    <motion.div
                      className="absolute inset-y-0 -left-24 w-24 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                      animate={{ x: [0, 520] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 0.8 }}
                    />

                    <div className="relative flex items-center gap-2.5">
                      {[0, 1, 2, 3, 4, 5].map((item) => (
                        <motion.span
                          key={item}
                          className="w-[8px] rounded-full bg-[#A8EBFF] shadow-[0_0_12px_rgba(168,235,255,0.45)]"
                          animate={{
                            height: [8, 18, 8],
                            opacity: [0.35, 1, 0.35],
                          }}
                          transition={{
                            duration: 1.25,
                            repeat: Infinity,
                            delay: item * 0.08,
                          }}
                        />
                      ))}
                    </div>

                    <span className="relative ml-auto text-[9px] font-black uppercase tracking-[0.14em] text-[#A6E8FF]">
                      Tap to reveal
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-white/45">
              <LockKeyhole className="h-3 w-3 text-[#8FE6FF]" />
              {showBalance ? "Tap again to hide" : "Privacy mode is active"}
            </span>

            <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
              Wallet active
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* =========================================================
   PAYMENT HISTORY DRAWER
========================================================= */

function PaymentHistoryDrawer({
  history,
}: {
  history: PaymentHistoryItem[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#DEE8F1] bg-white p-4 text-left shadow-[0_12px_38px_rgba(15,39,69,0.045)] transition hover:-translate-y-0.5 hover:border-[#C9DDED] hover:shadow-[0_18px_44px_rgba(15,39,69,0.07)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EEF7FF] text-[#1F6FB4]">
              <History className="h-[19px] w-[19px]" />
            </div>
            <div>
              <p className="text-xs font-black text-[#213E57]">Payment history</p>
              <p className="mt-0.5 text-[9px] font-semibold text-[#91A0AF]">
                {history.length > 0
                  ? `${history.length} confirmed payment${history.length > 1 ? "s" : ""}`
                  : "View recent payment activity"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F6FB4]" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-[#E0E8F0] bg-[#F7FAFC] p-0 sm:max-w-[470px]"
      >
        <SheetHeader className="sticky top-0 z-20 border-b border-[#E6EDF3] bg-white/95 px-5 py-5 text-left backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EEF7FF] text-[#1F6FB4]">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-black tracking-[-0.02em] text-[#17344D]">
                Payment history
              </SheetTitle>
              <SheetDescription className="mt-1 text-[10px] leading-5 text-[#8597A7]">
                Confirmed transfers completed from this payment screen.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 sm:p-5">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-[18px] border border-[#E1E9F0] bg-white p-4 shadow-[0_8px_24px_rgba(15,39,69,0.035)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1F6FB4] to-[#4CB5EA] text-xs font-black text-white">
                        {getInitial(item.recipient)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#213E57]">
                          {item.recipient}
                        </p>
                        <p className="mt-0.5 text-[9px] font-semibold text-[#96A4B1]">
                          {formatPaymentTime(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-[#17344D]">
                        -{formatCurrency(item.amount)}
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-600">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {item.note && (
                    <div className="mt-3 rounded-[12px] bg-[#F7FAFC] px-3 py-2 text-[10px] font-medium leading-5 text-[#73869A]">
                      {item.note}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#DDE8F1] bg-white text-[#7E9AB2] shadow-sm">
                <History className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-sm font-black text-[#17344D]">
                No payments yet
              </h3>
              <p className="mt-2 max-w-xs text-[11px] leading-6 text-[#8C9CAB]">
                Payments completed during this session will appear here with amount, recipient and status.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-black text-[#304A62]">
          {label}
        </label>
        {hint && (
          <span className="text-[9px] font-semibold text-[#98A6B5]">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* =========================================================
   PROGRESS STEPS
========================================================= */

function ProgressSteps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] border border-[#E0E9F1] bg-white p-1.5 shadow-sm">
      <ProgressPill number={1} label="Details" active={step >= 1} current={step === 1} />
      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
      <ProgressPill number={2} label="Verify" active={step >= 2} current={step === 2} />
    </div>
  );
}

function ProgressPill({
  number,
  label,
  active,
  current,
}: {
  number: number;
  label: string;
  active: boolean;
  current: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] px-2.5 py-2 transition ${
        current ? "bg-[#EEF7FF]" : ""
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-[8px] text-[9px] font-black ${
          active ? "bg-[#1F6FB4] text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {number}
      </span>
      <span
        className={`hidden text-[9px] font-black sm:inline ${
          active ? "text-[#35546E]" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   REVIEW ITEM
========================================================= */

function ReviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#EEF7FF] text-[#1F6FB4]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#91A0AF]">
            {label}
          </p>
          <p className="mt-1 break-all text-xs font-black leading-5 text-[#2B455C]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitial(value: string): string {
  const cleaned = value.trim();

  if (!cleaned) {
    return "U";
  }

  if (cleaned.includes("@")) {
    return cleaned.charAt(0).toUpperCase();
  }

  const digits = cleaned.replace(/\D/g, "");

  if (digits.length >= 2) {
    return digits.slice(-2);
  }

  return cleaned.charAt(0).toUpperCase();
}

function formatPaymentTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
