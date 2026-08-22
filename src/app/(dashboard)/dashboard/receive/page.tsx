"use client";

import {
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
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Wallet,
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
  [key: string]: unknown;
}

interface WalletResponse {
  success: boolean;
  wallet: WalletData;
}

interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  type: "TRANSFER" | "DEPOSIT" | "WITHDRAW";
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference?: string;
  createdAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: Transaction[];
}

type Mode = "qr" | "request";
type CopiedKey = "id" | "request" | null;

/* =========================================================
   PAGE
========================================================= */

export default function ReceiveMoneyPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  const [mode, setMode] = useState<Mode>("qr");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");

  const [copied, setCopied] = useState<CopiedKey>(null);

  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(true);

  const qrRef = useRef<HTMLCanvasElement>(null);

  /* =========================================================
     LOAD WALLET
  ========================================================== */

  const loadWallet = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await apiClient<WalletResponse>("/wallet");

      if (!data || data.success !== true || !data.wallet) {
        throw new Error("Unable to load wallet information.");
      }

      setWallet(data.wallet);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  /* =========================================================
     LOAD RECENT DEPOSITS
     Only DEPOSIT-type transactions are shown here — those are
     always a credit to this wallet regardless of who initiated
     them, so they're safe to display without knowing "which side
     is me". TRANSFER-type history isn't shown on this page for
     the same reason it's flagged on the transactions page: I
     don't yet have a way to tell sender from receiver client-side.
  ========================================================== */

  useEffect(() => {
    const loadDeposits = async () => {
      try {
        setDepositsLoading(true);

        const data = await apiClient<TransactionsResponse>("/transactions");

        if (data?.success && Array.isArray(data.transactions)) {
          setDeposits(
            data.transactions
              .filter((t) => t.type === "DEPOSIT")
              .slice(0, 5)
          );
        }
      } catch (error) {
        console.error("Failed to load recent deposits:", error);
      } finally {
        setDepositsLoading(false);
      }
    };

    void loadDeposits();
  }, []);

  /* =========================================================
     QR VALUE
  ========================================================== */

  const qrValue = useMemo(() => {
    if (!wallet) return "";

    if (mode === "request" && requestAmount) {
      const params = new URLSearchParams({
        walletId: wallet._id,
        amount: requestAmount,
      });

      if (requestNote.trim()) {
        params.set("note", requestNote.trim());
      }

      return `novawallet-request:${params.toString()}`;
    }

    return wallet._id;
  }, [wallet, mode, requestAmount, requestNote]);

  const requestText = useMemo(() => {
    if (!wallet) return "";

    if (mode === "request" && requestAmount) {
      return `Send me ${formatCurrency(Number(requestAmount))} on NovaWallet${
        requestNote.trim() ? ` — ${requestNote.trim()}` : ""
      }. Wallet ID: ${wallet._id}`;
    }

    return `Send me money on NovaWallet. Wallet ID: ${wallet._id}`;
  }, [wallet, mode, requestAmount, requestNote]);

  /* =========================================================
     ACTIONS
  ========================================================== */

  const handleCopy = async (key: CopiedKey, text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "NovaWallet", text: requestText });
        return;
      } catch (error) {
        // User cancelled the share sheet, or it's unsupported for
        // this content — fall through to copy instead.
      }
    }

    void handleCopy("request", requestText);
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current;
    if (!canvas || !wallet) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `novawallet-qr-${wallet._id}.png`;
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
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">Loading your QR code</p>
            <p className="mt-1 text-xs text-slate-400">Fetching your wallet information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !wallet) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <QrCode className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Couldn&apos;t load your receive info
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage || "Unable to retrieve wallet information."}
          </p>

          <button
            type="button"
            onClick={() => void loadWallet()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17466F]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const balance = Number(wallet.balance) || 0;
  const formattedBalance = formatCurrency(balance);

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
          <QrCode className="h-3.5 w-3.5" />
          Receive Money
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Get paid instantly
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Share your QR code or Wallet ID — anyone on NovaWallet can send you money in seconds.
        </p>
      </motion.div>

      {/* =====================================================
          HERO CARD
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F2745] via-[#173F6D] to-[#1F5EA8] p-6 text-white shadow-[0_20px_55px_rgba(23,63,109,0.2)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* MODE TOGGLE */}
          <div className="relative inline-flex rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm"
              style={{ left: mode === "qr" ? "4px" : "calc(50%)" }}
            />

            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                mode === "qr" ? "text-[#123B66]" : "text-blue-100 hover:text-white"
              }`}
            >
              My QR Code
            </button>

            <button
              type="button"
              onClick={() => setMode("request")}
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                mode === "request" ? "text-[#123B66]" : "text-blue-100 hover:text-white"
              }`}
            >
              Request Amount
            </button>
          </div>

          {/* REQUEST FIELDS */}
          <AnimatePresence initial={false}>
            {mode === "request" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xs overflow-hidden"
              >
                <div className="mt-6 space-y-3 text-left">
                  <div className="relative">
                    <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Amount (৳)"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-sm font-semibold text-white placeholder:text-blue-200/60 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="What's this for? (optional)"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-blue-200/60 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR CODE */}
          <motion.div layout className="relative mt-7 rounded-3xl bg-white p-5 shadow-2xl">
            <motion.div
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] bg-cyan-300/20 blur-xl"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={qrValue}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
              >
                <QRCodeCanvas
                  ref={qrRef}
                  value={qrValue || wallet._id}
                  size={200}
                  level="M"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#0F2745"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {mode === "request" && requestAmount && Number(requestAmount) > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 text-sm font-semibold text-cyan-200"
              >
                Requesting {formatCurrency(Number(requestAmount))}
              </motion.p>
            )}
          </AnimatePresence>

          {/* WALLET ID */}
          <div className="mt-7 w-full max-w-xs rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100/60">
              Wallet ID
            </p>

            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-bold text-white">{wallet._id}</p>

              <button
                type="button"
                onClick={() => void handleCopy("id", wallet._id)}
                aria-label="Copy wallet ID"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied === "id" ? "check" : "copy"}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    {copied === "id" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* BALANCE */}
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-100/70">
            <Wallet className="h-3.5 w-3.5" />
            <span>Balance:</span>

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showBalance ? "visible" : "masked"}
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)" }}
                transition={{ duration: 0.2 }}
                className="font-bold text-white"
              >
                {showBalance ? formattedBalance : maskCurrency(formattedBalance)}
              </motion.span>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setShowBalance((v) => !v)}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
              className="text-blue-200 transition-colors hover:text-white"
            >
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* ACTIONS */}
          <div className="mt-7 grid w-full max-w-xs grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#123B66] transition hover:bg-blue-50 active:scale-95"
            >
              {copied === "request" ? (
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
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
            >
              <Download className="h-4 w-4" /> Save QR
            </button>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <QuickLink
          href="/dashboard/send"
          icon={ArrowUpRight}
          title="Send Money"
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
          title="My Wallet"
          description="Balance and account info"
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </motion.section>

      {/* =====================================================
          RECENT DEPOSITS
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
      >
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Activity</p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">Recently Received</h2>
        </div>

        {depositsLoading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading recent activity...
          </div>
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">Nothing received yet</p>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Money you receive into your wallet will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {deposits.map((deposit, i) => (
              <motion.div
                key={deposit._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50 sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {deposit.reference ? `Reference: ${deposit.reference}` : "Wallet Deposit"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(deposit.createdAt)}</p>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-black text-emerald-600">
                  + {formatCurrency(deposit.amount)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* =====================================================
          SECURITY NOTE
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-blue-50 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Your Wallet ID is safe to share</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Anyone with your Wallet ID or QR code can only send you money — they can never withdraw
              or take funds from your wallet with it. Never share your password or PIN, though.
            </p>

            <Link
              href="/dashboard/kyc"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
            >
              Complete KYC for higher limits
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   QUICK LINK
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
      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
      </div>

      <h3 className="mt-5 text-sm font-extrabold text-slate-900">{title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
    </Link>
  );
}

/* =========================================================
   CURRENCY / DATE
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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