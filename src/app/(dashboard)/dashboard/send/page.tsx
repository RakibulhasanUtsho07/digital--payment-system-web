"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface WalletBalanceResponse {
  success: boolean;
  wallet: {
    balance: number;
    [key: string]: unknown;
  };
}

interface TransferResponse {
  success: boolean;
  message?: string;
  transaction?: {
    _id: string;
    amount: number;
    status: string;
  };
}

/* =========================================================
   CONSTANTS
========================================================= */

const quickAmounts = [100, 500, 1000, 5000];

const recentContacts = [
  { name: "Rakibul Islam", phone: "017XX-XXXXXX", initial: "RI", color: "bg-blue-100 text-blue-600" },
  { name: "Anisur Rahman", phone: "019XX-XXXXXX", initial: "AR", color: "bg-emerald-100 text-emerald-600" },
  { name: "Jahid Hasan", phone: "018XX-XXXXXX", initial: "JH", color: "bg-purple-100 text-purple-600" },
];

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
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
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const pinValue = pin.join("");
  const pinControls = useAnimation();

  /* =========================================================
     LOAD BALANCE
  ========================================================== */

  useEffect(() => {
    const loadBalance = async () => {
      try {
        setBalanceLoading(true);

        const data = await apiClient<WalletBalanceResponse>("/wallet");

        if (data?.success && data.wallet) {
          setBalance(Number(data.wallet.balance) || 0);
        }
      } catch (error) {
        console.error("Failed to load wallet balance:", error);
      } finally {
        setBalanceLoading(false);
      }
    };

    void loadBalance();
  }, []);

  /* =========================================================
     VALIDATION
  ========================================================== */

  const numericAmount = Number(amount);

  const isRecipientValid = recipient.trim().length >= 3;

  const isAmountValid =
    amount.trim() !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (balance === null || numericAmount <= balance);

  /* =========================================================
     STEP NAVIGATION
  ========================================================== */

  const goToStep = (next: 1 | 2 | 3) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNext = () => {
    setErrorMessage("");

    if (!isRecipientValid) {
      setErrorMessage("Enter a valid mobile number or email for the recipient.");
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
     SEND
     NOTE: `/transfers` and this request body are my best guess
     based on your `transferRoutes` mount — I haven't seen
     `transferController.ts`, so the field names (`recipient`,
     `amount`, `note`, `pin`) and the success shape below may not
     match exactly. Share that controller and I'll correct this
     to the real contract.
  ========================================================== */

  const handleSend = async () => {
    if (pinValue.length < 4) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await apiClient<TransferResponse>("/transfers", {
        method: "POST",
        body: JSON.stringify({
          recipient: recipient.trim(),
          amount: numericAmount,
          note: note.trim() || undefined,
          pin: pinValue,
        }),
      });

      if (!data?.success) {
        throw new Error(data?.message || "Transfer failed.");
      }

      goToStep(3);

      // Refresh balance in the background — non-fatal if it fails,
      // the figure just stays stale until the next visit.
      void (async () => {
        try {
          const fresh = await apiClient<WalletBalanceResponse>("/wallet");
          if (fresh?.success && fresh.wallet) {
            setBalance(Number(fresh.wallet.balance) || 0);
          }
        } catch {
          // ignore
        }
      })();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Transfer failed. Please try again."
      );
      setPin(["", "", "", ""]);
      void pinControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    goToStep(1);
    setAmount("");
    setRecipient("");
    setPin(["", "", "", ""]);
    setNote("");
    setErrorMessage("");
  };

  const formattedBalance = formatCurrency(balance ?? 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Send Money</h1>
          <p className="mt-1 text-sm text-slate-500">Transfer funds securely to any user.</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Available Balance</p>

            <div className="mt-0.5 flex items-center gap-2">
              {balanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={showBalance ? "visible" : "masked"}
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.25 }}
                    className="text-lg font-bold text-slate-800"
                  >
                    {showBalance ? formattedBalance : maskCurrency(formattedBalance)}
                  </motion.p>
                </AnimatePresence>
              )}

              <button
                type="button"
                onClick={() => setShowBalance((value) => !value)}
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* =====================================================
            MAIN FORM AREA
        ====================================================== */}

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            {/* STEP PROGRESS */}
            {step < 3 && (
              <div className="mb-8 flex items-center gap-2">
                {[1, 2].map((s) => (
                  <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      initial={false}
                      animate={{ width: step >= s ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={direction}>
              {/* ===================================================
                  STEP 1
              ==================================================== */}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  {/* Recipient */}
                  <div className="space-y-2">
                    <label htmlFor="recipient" className="text-sm font-semibold text-slate-700">
                      Send To
                    </label>

                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                        <User className="h-5 w-5" />
                      </div>

                      <input
                        id="recipient"
                        type="text"
                        placeholder="Enter mobile number or email"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                      Amount (৳)
                    </label>

                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                        <Banknote className="h-5 w-5" />
                      </div>

                      <input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-2xl font-bold text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex gap-3 pt-2">
                      {quickAmounts.map((q) => {
                        const disabled = balance !== null && q > balance;
                        const active = amount === String(q);

                        return (
                          <button
                            key={q}
                            type="button"
                            disabled={disabled}
                            onClick={() => setAmount(String(q))}
                            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-all active:scale-95 ${
                              disabled
                                ? "cursor-not-allowed border-slate-100 text-slate-300"
                                : active
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                          >
                            +৳{q}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reference note */}
                  <div className="space-y-2">
                    <label htmlFor="note" className="text-sm font-semibold text-slate-700">
                      Reference Note (Optional)
                    </label>

                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                        <FileText className="h-5 w-5" />
                      </div>

                      <input
                        id="note"
                        type="text"
                        placeholder="What is this for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    disabled={!recipient.trim() || !amount}
                    whileTap={{ scale: 0.98 }}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                  >
                    Continue to Review
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </motion.div>
              )}

              {/* ===================================================
                  STEP 2
              ==================================================== */}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                  >
                    <ChevronLeft className="h-4 w-4" /> Edit Details
                  </button>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-medium text-slate-500">You are sending</p>

                    <h2 className="mt-2 text-4xl font-black text-slate-800">
                      {formatCurrency(numericAmount)}
                    </h2>

                    <div className="mt-6 flex items-center justify-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                        {recipient.charAt(0).toUpperCase()}
                      </div>

                      <div className="text-left">
                        <p className="font-bold text-slate-800">{recipient}</p>
                        <p className="text-xs text-slate-500">Digital Wallet</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-center text-sm font-semibold text-slate-700">
                      Enter Security PIN
                    </label>

                    <PinInput value={pin} onChange={setPin} controls={pinControls} />
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleSend}
                    disabled={pinValue.length < 4 || isLoading}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Send className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                        Confirm &amp; Send
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* ===================================================
                  STEP 3
              ==================================================== */}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center space-y-4 py-8"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -inset-4 rounded-full bg-emerald-500/20"
                    />
                    <CheckCircle2 className="relative h-24 w-24 rounded-full bg-white text-emerald-500" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-bold text-slate-800"
                  >
                    Transfer Successful!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-slate-500"
                  >
                    You have successfully sent{" "}
                    <span className="font-bold text-slate-800">{formatCurrency(numericAmount)}</span> to{" "}
                    <span className="font-bold text-slate-800">{recipient}</span>.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full space-y-3 pt-6"
                  >
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      Send Another
                    </button>

                    <Link
                      href="/dashboard"
                      className="flex w-full justify-center rounded-xl bg-blue-50 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      Back to Dashboard
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <Clock className="h-5 w-5 text-blue-500" /> Recent Transfers
            </h3>

            <div className="mt-6 space-y-4">
              {recentContacts.map((contact, i) => (
                <motion.div
                  key={contact.phone}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => setRecipient(contact.phone)}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl p-2 transition-all hover:bg-slate-50 active:scale-95"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${contact.color}`}>
                    {contact.initial}
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 transition-colors group-hover:text-blue-600">
                      {contact.name}
                    </p>
                    <p className="text-xs text-slate-500">{contact.phone}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-3xl bg-gradient-to-br from-[#123B66] to-[#1F5EA8] p-6 text-white shadow-lg"
          >
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-blue-300" /> Secure Transfer
            </h3>

            <p className="text-sm leading-relaxed text-blue-100 opacity-90">
              All your transactions are end-to-end encrypted. Never share your PIN with anyone.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PIN INPUT — four separate boxes, auto-advancing focus,
   digit-only, with a shake animation wired up by the parent
   on a failed submission.
========================================================= */

function PinInput({
  value,
  onChange,
  controls,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  controls: ReturnType<typeof useAnimation>;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < value.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div animate={controls} className="flex justify-center gap-3">
      {value.map((digit, index) => (
        <motion.input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          aria-label={`PIN digit ${index + 1}`}
          animate={digit ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={`h-14 w-14 rounded-2xl border text-center text-2xl font-bold outline-none transition-all focus:ring-4 ${
            digit
              ? "border-blue-500 bg-blue-50 focus:ring-blue-500/10"
              : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500/10"
          }`}
        />
      ))}
    </motion.div>
  );
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function maskCurrency(formatted: string): string {
  return formatted.replace(/[0-9]/g, "•");
}