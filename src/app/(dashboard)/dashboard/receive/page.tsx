"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  RefreshCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  WalletCards,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type WalletStatus = "ACTIVE" | "FROZEN" | "BLOCKED";
type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";
type TransactionType = "TRANSFER" | "DEPOSIT" | "WITHDRAW";
type TransactionDirection = "IN" | "OUT";

interface WalletData {
  _id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  status: WalletStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletResponse {
  success: boolean;
  wallet: WalletData;
  message?: string;
}

interface SafeTransactionUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Transaction {
  _id: string;
  senderId: SafeTransactionUser | string;
  receiverId: SafeTransactionUser | string;
  counterparty?: SafeTransactionUser | string | null;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  reference?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: Transaction[];
  message?: string;
}

type Mode = "qr" | "request";
type CopiedKey = "id" | "link" | null;

const AUTO_REFRESH_MS = 60_000;
const MAX_NOTE_LENGTH = 120;

/* =========================================================
   PAGE
========================================================= */

export default function ReceiveMoneyPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [receivedTransactions, setReceivedTransactions] = useState<
    Transaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activityError, setActivityError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showBalance, setShowBalance] = useState(true);
  const [mode, setMode] = useState<Mode>("qr");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestAmountTouched, setRequestAmountTouched] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [copied, setCopied] = useState<CopiedKey>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [appOrigin, setAppOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  );

  const qrRef = useRef<HTMLCanvasElement>(null);
  const requestInFlightRef = useRef(false);
  const copiedTimerRef = useRef<number | null>(null);

  /* =========================================================
     APPLICATION ORIGIN
  ========================================================== */

  useEffect(() => {
    if (!appOrigin) {
      setAppOrigin(window.location.origin);
    }
  }, [appOrigin]);

  /* =========================================================
     LOAD REAL WALLET + TRANSACTIONS

     /wallet and /transactions are relative to apiClient's
     configured /api base URL.
  ========================================================== */

  const loadReceiveData = useCallback(async (silent = false) => {
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setErrorMessage("");
    }

    setActivityError("");

    try {
      const [walletResult, transactionsResult] = await Promise.allSettled([
        apiClient<WalletResponse>("/wallet"),
        apiClient<TransactionsResponse>("/transactions"),
      ]);

      let receivedFreshData = false;

      if (walletResult.status === "fulfilled") {
        const data = walletResult.value;

        if (data?.success && data.wallet) {
          setWallet(data.wallet);
          setErrorMessage("");
          receivedFreshData = true;
        } else {
          setErrorMessage(data?.message || "Unable to load wallet information.");
        }
      } else if (!silent) {
        setErrorMessage(
          getErrorMessage(walletResult.reason, "Failed to load wallet.")
        );
      } else {
        setActionMessage(
          "Wallet refresh failed. Your previous data is still shown."
        );
      }

      if (transactionsResult.status === "fulfilled") {
        const data = transactionsResult.value;

        if (data?.success && Array.isArray(data.transactions)) {
          const incoming = data.transactions
            .filter(
              (transaction) =>
                transaction.direction === "IN" &&
                (transaction.type === "TRANSFER" ||
                  transaction.type === "DEPOSIT")
            )
            .slice(0, 5);

          setReceivedTransactions(incoming);
          setActivityError("");
          receivedFreshData = true;
        } else {
          setActivityError(
            data?.message || "Unable to load received transactions."
          );
        }
      } else {
        setActivityError(
          getErrorMessage(
            transactionsResult.reason,
            "Failed to load received transactions."
          )
        );
      }

      if (receivedFreshData) {
        setLastUpdated(new Date());
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to refresh receive data.");

      if (silent) {
        setActionMessage(message);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadReceiveData(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadReceiveData(true);
      }
    }, AUTO_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadReceiveData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, [loadReceiveData]);

  /* =========================================================
     REQUEST VALIDATION
  ========================================================== */

  const amountValidation = useMemo(() => {
    const value = requestAmount.trim();

    if (mode !== "request") {
      return { valid: true, message: "", amount: null as number | null };
    }

    if (!value) {
      return {
        valid: false,
        message: "Enter an amount to create a payment request.",
        amount: null as number | null,
      };
    }

    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
      return {
        valid: false,
        message: "Use a positive amount with no more than 2 decimal places.",
        amount: null as number | null,
      };
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        valid: false,
        message: "Amount must be greater than zero.",
        amount: null as number | null,
      };
    }

    return { valid: true, message: "", amount };
  }, [mode, requestAmount]);

  const walletCanReceive = wallet?.status !== "BLOCKED";
  const actionsEnabled = Boolean(wallet && walletCanReceive && amountValidation.valid);

  /* =========================================================
     COFFER RECEIVE LINK + QR VALUE

     The link prefills the send page. The sender's authenticated
     backend transfer endpoint still performs the real transfer.
  ========================================================== */

  const receiveLink = useMemo(() => {
    if (!wallet) return "";

    const params = new URLSearchParams({
      walletId: wallet._id,
      receiverId: wallet.userId,
      currency: wallet.currency || "BDT",
    });

    if (mode === "request" && amountValidation.amount != null) {
      params.set("amount", amountValidation.amount.toFixed(2));
    }

    const note = requestNote.trim();

    if (note) {
      params.set("note", note);
    }

    const path = `/dashboard/send?${params.toString()}`;

    return appOrigin ? `${appOrigin}${path}` : path;
  }, [wallet, mode, amountValidation.amount, requestNote, appOrigin]);

  const requestText = useMemo(() => {
    if (!wallet) return "";

    const amountText =
      mode === "request" && amountValidation.amount != null
        ? ` ${formatCurrency(amountValidation.amount, wallet.currency)}`
        : " money";

    const note = requestNote.trim();

    return `Send me${amountText} with Coffer${note ? ` for ${note}` : ""}.`;
  }, [wallet, mode, amountValidation.amount, requestNote]);

  /* =========================================================
     ACTIONS
  ========================================================== */

  const showTemporaryAction = useCallback((message: string) => {
    setActionMessage(message);

    window.setTimeout(() => {
      setActionMessage("");
    }, 2400);
  }, []);

  const handleCopy = async (key: CopiedKey, text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);

      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }

      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(null);
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      showTemporaryAction("Copy failed. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!actionsEnabled || !receiveLink) {
      setRequestAmountTouched(true);
      return;
    }

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Receive money with Coffer",
          text: requestText,
          url: receiveLink,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await handleCopy("link", `${requestText} ${receiveLink}`);
  };

  const handleDownloadQr = () => {
    if (!actionsEnabled) {
      setRequestAmountTouched(true);
      return;
    }

    const canvas = qrRef.current;
    if (!canvas || !wallet) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `coffer-receive-${wallet._id}.png`;
    link.click();
  };

  /* =========================================================
     LOADING / ERROR
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5EA8] text-white shadow-lg shadow-blue-500/20">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              Loading receive details
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fetching your wallet and incoming activity...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <QrCode className="h-6 w-6" aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Couldn&apos;t load your wallet
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage || "Unable to retrieve wallet information."}
          </p>

          <button
            type="button"
            onClick={() => void loadReceiveData(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17466F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const formattedBalance = formatCurrency(wallet.balance, wallet.currency);
  const formattedPendingBalance = formatCurrency(
    wallet.pendingBalance,
    wallet.currency
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Receive money
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Share your Coffer receive link
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Share your QR code or Wallet ID. The sender still confirms the
            transfer securely from their own account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReceiveData(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#1F5EA8] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </motion.header>

      <div className="flex min-h-5 items-center justify-between gap-4 text-[11px] text-slate-400">
        <span aria-live="polite">{actionMessage}</span>
        {lastUpdated && (
          <span className="ml-auto shrink-0">
            Updated {formatTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* Wallet blocked warning */}
      {wallet.status === "BLOCKED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold">Receiving is unavailable</p>
            <p className="mt-1 text-xs leading-5 text-red-700/80">
              This wallet is blocked. Contact support before sharing a payment
              request.
            </p>
          </div>
        </div>
      )}

      {/* Main QR card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F2745] via-[#173F6D] to-[#1F5EA8] p-6 text-white shadow-[0_20px_55px_rgba(23,63,109,0.2)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Mode toggle */}
          <div className="relative inline-flex rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute bottom-1 top-1 rounded-full bg-white shadow-sm"
              style={{
                width: "calc(50% - 4px)",
                left: mode === "qr" ? "4px" : "50%",
              }}
            />

            <button
              type="button"
              onClick={() => {
                setMode("qr");
                setRequestAmountTouched(false);
              }}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                mode === "qr"
                  ? "text-[#123B66]"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              My QR code
            </button>

            <button
              type="button"
              onClick={() => setMode("request")}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                mode === "request"
                  ? "text-[#123B66]"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              Request amount
            </button>
          </div>

          {/* Request fields */}
          <AnimatePresence initial={false}>
            {mode === "request" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm overflow-hidden"
              >
                <div className="mt-6 space-y-3 text-left">
                  <div>
                    <label
                      htmlFor="request-amount"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/65"
                    >
                      Amount ({wallet.currency})
                    </label>

                    <div className="relative">
                      <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
                      <input
                        id="request-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.00"
                        value={requestAmount}
                        onBlur={() => setRequestAmountTouched(true)}
                        onChange={(event) => {
                          const nextValue = event.target.value;

                          if (nextValue === "" || /^\d*\.?\d{0,2}$/.test(nextValue)) {
                            setRequestAmount(nextValue);
                          }
                        }}
                        aria-invalid={
                          requestAmountTouched && !amountValidation.valid
                        }
                        aria-describedby="request-amount-error"
                        className={`w-full rounded-xl border bg-white/10 py-3 pl-11 pr-4 text-sm font-semibold text-white placeholder:text-blue-200/60 outline-none transition focus:ring-4 ${
                          requestAmountTouched && !amountValidation.valid
                            ? "border-red-300 focus:border-red-300 focus:ring-red-300/10"
                            : "border-white/15 focus:border-cyan-300 focus:ring-cyan-300/10"
                        }`}
                      />
                    </div>

                    <p
                      id="request-amount-error"
                      className="mt-1.5 min-h-4 text-[11px] text-red-200"
                    >
                      {requestAmountTouched && !amountValidation.valid
                        ? amountValidation.message
                        : ""}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="request-note"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/65"
                    >
                      Note (optional)
                    </label>

                    <input
                      id="request-note"
                      type="text"
                      maxLength={MAX_NOTE_LENGTH}
                      placeholder="What is this payment for?"
                      value={requestNote}
                      onChange={(event) => setRequestNote(event.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-blue-200/60 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                    />

                    <p className="mt-1 text-right text-[10px] text-blue-100/45">
                      {requestNote.length}/{MAX_NOTE_LENGTH}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR code */}
          <motion.div
            layout
            className={`relative mt-7 rounded-3xl bg-white p-5 shadow-2xl ${
              !actionsEnabled ? "opacity-60" : ""
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={receiveLink}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22 }}
              >
                <QRCodeCanvas
                  ref={qrRef}
                  value={receiveLink || wallet._id}
                  size={200}
                  level="M"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#0F2745"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {mode === "request" && amountValidation.amount != null && (
            <p className="mt-3 text-sm font-semibold text-cyan-200">
              Requesting {formatCurrency(amountValidation.amount, wallet.currency)}
            </p>
          )}

          {/* Wallet ID */}
          <div className="mt-7 w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100/60">
              Wallet ID
            </p>

            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-bold text-white">{wallet._id}</p>

              <button
                type="button"
                onClick={() => void handleCopy("id", wallet._id)}
                aria-label="Copy wallet ID"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
              >
                {copied === "id" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-blue-100/70">
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Available:</span>

            <span className="font-bold text-white">
              {showBalance ? formattedBalance : maskCurrency(formattedBalance)}
            </span>

            <button
              type="button"
              onClick={() => setShowBalance((current) => !current)}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
              className="text-blue-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            >
              {showBalance ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>

            {wallet.pendingBalance > 0 && (
              <span className="ml-1 rounded-full bg-amber-300/15 px-2 py-1 text-[10px] font-bold text-amber-200">
                Pending {formattedPendingBalance}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={!walletCanReceive}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#123B66] transition hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied === "link" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Share
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!walletCanReceive}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Save QR
            </button>
          </div>
        </div>
      </motion.section>

      {/* Quick links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <QuickLink
          href="/dashboard/send"
          icon={ArrowUpRight}
          title="Send money"
          description="Transfer funds to someone"
          iconClass="bg-blue-50 text-blue-600"
        />

        <QuickLink
          href="/dashboard/transactions"
          icon={CreditCard}
          title="Transactions"
          description="View wallet activity"
          iconClass="bg-violet-50 text-violet-600"
        />

        <QuickLink
          href="/dashboard/wallet"
          icon={WalletCards}
          title="My wallet"
          description="Balance and account information"
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </motion.section>

      {/* Received transactions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Incoming activity
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Recently received
            </h2>
          </div>

          <Link
            href="/dashboard/transactions"
            className="text-xs font-bold text-[#1F5EA8] hover:underline"
          >
            View all
          </Link>
        </div>

        {activityError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-slate-700">
              Couldn&apos;t load incoming activity
            </p>
            <p className="mt-1 text-xs text-slate-400">{activityError}</p>
            <button
              type="button"
              onClick={() => void loadReceiveData(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-[#1F5EA8]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : receivedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">
              Nothing received yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Incoming transfers and deposits will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {receivedTransactions.map((transaction, index) => (
              <motion.div
                key={transaction._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50 sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {getTransactionTitle(transaction)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{formatDate(transaction.createdAt)}</span>
                      <StatusBadge status={transaction.status} />
                    </div>
                  </div>
                </div>

                <p
                  className={`shrink-0 text-sm font-black ${
                    transaction.status === "COMPLETED"
                      ? "text-emerald-600"
                      : transaction.status === "PENDING"
                        ? "text-amber-600"
                        : "text-slate-400"
                  }`}
                >
                  {transaction.status === "COMPLETED" ? "+ " : ""}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Security note */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-blue-50 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Share receive details, never account secrets
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Your Wallet ID and receive link identify where a sender intends
              to pay. They do not replace authentication. Never share your
              password, PIN, token, or one-time code.
            </p>

            <Link
              href="/dashboard/kyc"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
            >
              Review verification status
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function QuickLink({
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
      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-slate-900">{title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles: Record<TransactionStatus, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    FAILED: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${styles[status]}`}
    >
      {status === "PENDING" && <Clock3 className="h-2.5 w-2.5" />}
      {status.toLowerCase()}
    </span>
  );
}

/* =========================================================
   FORMATTERS
========================================================= */

function getTransactionTitle(transaction: Transaction): string {
  if (transaction.reference?.trim()) {
    return transaction.reference.trim();
  }

  if (
    transaction.counterparty &&
    typeof transaction.counterparty === "object" &&
    transaction.counterparty.name
  ) {
    return `From ${transaction.counterparty.name}`;
  }

  return transaction.type === "DEPOSIT" ? "Wallet deposit" : "Incoming transfer";
}

function formatCurrency(amount: number, currency = "BDT"): string {
  const safeAmount = Number(amount) || 0;

  if (currency.toUpperCase() === "BDT") {
    return `৳ ${safeAmount.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${currency.toUpperCase()} ${safeAmount.toLocaleString("en", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function maskCurrency(formatted: string): string {
  return formatted.replace(/[0-9]/g, "•");
}

function formatDate(value?: string): string {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
