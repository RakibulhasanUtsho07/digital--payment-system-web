"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Check,
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
  Sparkles,
} from "lucide-react";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type WalletStatus =
  | "ACTIVE"
  | "FROZEN"
  | "BLOCKED";

type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

type TransactionType =
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW";

type TransactionDirection =
  | "IN"
  | "OUT";

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

  senderId:
    | SafeTransactionUser
    | string;

  receiverId:
    | SafeTransactionUser
    | string;

  counterparty?:
    | SafeTransactionUser
    | string
    | null;

  direction:
    TransactionDirection;

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

type Mode =
  | "qr"
  | "request";

type CopiedKey =
  | "id"
  | "link"
  | null;

/* =========================================================
   CONSTANTS
========================================================= */

const AUTO_REFRESH_MS =
  60_000;

const MAX_NOTE_LENGTH =
  120;

/* =========================================================
   PAGE
========================================================= */

export default function ReceiveMoneyPage() {
  const [wallet, setWallet] =
    useState<WalletData | null>(
      null
    );

  const [
    receivedTransactions,
    setReceivedTransactions,
  ] = useState<Transaction[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    activityError,
    setActivityError,
  ] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [showBalance, setShowBalance] =
    useState(true);

  const [mode, setMode] =
    useState<Mode>("qr");

  const [requestAmount, setRequestAmount] =
    useState("");

  const [
    requestAmountTouched,
    setRequestAmountTouched,
  ] = useState(false);

  const [requestNote, setRequestNote] =
    useState("");

  const [copied, setCopied] =
    useState<CopiedKey>(null);

  const [actionMessage, setActionMessage] =
    useState("");

  const [appOrigin, setAppOrigin] =
    useState(
      process.env.NEXT_PUBLIC_APP_URL?.replace(
        /\/$/,
        ""
      ) ?? ""
    );

  const qrRef =
    useRef<HTMLCanvasElement>(null);

  const requestInFlightRef =
    useRef(false);

  const copiedTimerRef =
    useRef<number | null>(null);

  /* =========================================================
     APPLICATION ORIGIN
  ========================================================== */

  useEffect(() => {
    if (!appOrigin) {
      setAppOrigin(
        window.location.origin
      );
    }
  }, [appOrigin]);

  /* =========================================================
     LOAD WALLET + TRANSACTIONS
  ========================================================== */

  const loadReceiveData =
    useCallback(
      async (
        silent = false
      ) => {
        if (
          requestInFlightRef.current
        ) {
          return;
        }

        requestInFlightRef.current =
          true;

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setErrorMessage("");
        }

        setActivityError("");

        try {
          const [
            walletResult,
            transactionsResult,
          ] =
            await Promise.allSettled([
              apiClient<WalletResponse>(
                "/wallet"
              ),

              apiClient<TransactionsResponse>(
                "/transactions"
              ),
            ]);

          let receivedFreshData =
            false;

          /* -------------------------------------------------
             WALLET
          ------------------------------------------------- */

          if (
            walletResult.status ===
            "fulfilled"
          ) {
            const data =
              walletResult.value;

            if (
              data?.success &&
              data.wallet
            ) {
              setWallet(
                data.wallet
              );

              setErrorMessage(
                ""
              );

              receivedFreshData =
                true;
            } else {
              setErrorMessage(
                data?.message ??
                  "Unable to load wallet information."
              );
            }
          } else if (!silent) {
            setErrorMessage(
              getErrorMessage(
                walletResult.reason,
                "Failed to load wallet."
              )
            );
          } else {
            setActionMessage(
              "Wallet refresh failed. Your previous data is still shown."
            );
          }

          /* -------------------------------------------------
             TRANSACTIONS
          ------------------------------------------------- */

          if (
            transactionsResult.status ===
            "fulfilled"
          ) {
            const data =
              transactionsResult.value;

            if (
              data?.success &&
              Array.isArray(
                data.transactions
              )
            ) {
              const incoming =
                data.transactions
                  .filter(
                    (
                      transaction
                    ) =>
                      transaction.direction ===
                        "IN" &&
                      (
                        transaction.type ===
                          "TRANSFER" ||
                        transaction.type ===
                          "DEPOSIT"
                      )
                  )
                  .slice(
                    0,
                    5
                  );

              setReceivedTransactions(
                incoming
              );

              setActivityError(
                ""
              );

              receivedFreshData =
                true;
            } else {
              setActivityError(
                data?.message ??
                  "Unable to load received transactions."
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

          if (
            receivedFreshData
          ) {
            setLastUpdated(
              new Date()
            );
          }
        } catch (error) {
          const message =
            getErrorMessage(
              error,
              "Failed to refresh receive data."
            );

          if (silent) {
            setActionMessage(
              message
            );
          } else {
            setErrorMessage(
              message
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
          requestInFlightRef.current =
            false;
        }
      },
      []
    );

  useEffect(() => {
    void loadReceiveData(
      false
    );

    const intervalId =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void loadReceiveData(
              true
            );
          }
        },
        AUTO_REFRESH_MS
      );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadReceiveData(
            true
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (
        copiedTimerRef.current
      ) {
        window.clearTimeout(
          copiedTimerRef.current
        );
      }
    };
  }, [
    loadReceiveData,
  ]);

  /* =========================================================
     REQUEST VALIDATION
  ========================================================== */

  const amountValidation =
    useMemo(() => {
      const value =
        requestAmount.trim();

      if (
        mode !== "request"
      ) {
        return {
          valid: true,
          message: "",
          amount:
            null as
              | number
              | null,
        };
      }

      if (!value) {
        return {
          valid: false,
          message:
            "Enter an amount to create a payment request.",
          amount:
            null as
              | number
              | null,
        };
      }

      if (
        !/^\d+(?:\.\d{1,2})?$/.test(
          value
        )
      ) {
        return {
          valid: false,
          message:
            "Use a positive amount with no more than 2 decimal places.",
          amount:
            null as
              | number
              | null,
        };
      }

      const amount =
        Number(value);

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return {
          valid: false,
          message:
            "Amount must be greater than zero.",
          amount:
            null as
              | number
              | null,
        };
      }

      return {
        valid: true,
        message: "",
        amount,
      };
    }, [
      mode,
      requestAmount,
    ]);

  const walletCanReceive =
    Boolean(
      wallet &&
        wallet.status !==
          "BLOCKED"
    );

  const actionsEnabled =
    Boolean(
      wallet &&
        walletCanReceive &&
        amountValidation.valid
    );

  /* =========================================================
     RECEIVE LINK
  ========================================================== */

  const receiveLink =
    useMemo(() => {
      if (!wallet) {
        return "";
      }

      const params =
        new URLSearchParams({
          walletId:
            wallet._id,

          receiverId:
            wallet.userId,

          currency:
            wallet.currency ||
            "BDT",
        });

      if (
        mode ===
          "request" &&
        amountValidation.amount !=
          null
      ) {
        params.set(
          "amount",
          amountValidation.amount.toFixed(
            2
          )
        );
      }

      const note =
        requestNote.trim();

      if (note) {
        params.set(
          "note",
          note
        );
      }

      const path =
        `/dashboard/send?${params.toString()}`;

      return appOrigin
        ? `${appOrigin}${path}`
        : path;
    }, [
      wallet,
      mode,
      amountValidation.amount,
      requestNote,
      appOrigin,
    ]);

  const requestText =
    useMemo(() => {
      if (!wallet) {
        return "";
      }

      const amountText =
        mode ===
          "request" &&
        amountValidation.amount !=
          null
          ? ` ${formatCurrency(
              amountValidation.amount,
              wallet.currency
            )}`
          : " money";

      const note =
        requestNote.trim();

      return `Send me${amountText} with Coffer${
        note
          ? ` for ${note}`
          : ""
      }.`;
    }, [
      wallet,
      mode,
      amountValidation.amount,
      requestNote,
    ]);

  /* =========================================================
     TEMP MESSAGE
  ========================================================== */

  const showTemporaryAction =
    useCallback(
      (
        message: string
      ) => {
        setActionMessage(
          message
        );

        window.setTimeout(
          () => {
            setActionMessage(
              ""
            );
          },
          2400
        );
      },
      []
    );

  /* =========================================================
     COPY
  ========================================================== */

  const handleCopy =
    async (
      key: CopiedKey,
      text: string
    ) => {
      if (!text) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          text
        );

        setCopied(key);

        if (
          copiedTimerRef.current
        ) {
          window.clearTimeout(
            copiedTimerRef.current
          );
        }

        copiedTimerRef.current =
          window.setTimeout(
            () => {
              setCopied(
                null
              );
            },
            1800
          );
      } catch (error) {
        console.error(
          "Copy failed:",
          error
        );

        showTemporaryAction(
          "Copy failed. Please try again."
        );
      }
    };

  /* =========================================================
     SHARE
  ========================================================== */

  const handleShare =
    async () => {
      if (
        !actionsEnabled ||
        !receiveLink
      ) {
        setRequestAmountTouched(
          true
        );

        return;
      }

      if (
        typeof navigator !==
          "undefined" &&
        "share" in
          navigator
      ) {
        try {
          await navigator.share(
            {
              title:
                "Receive money with Coffer",

              text:
                requestText,

              url:
                receiveLink,
            }
          );

          return;
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }
        }
      }

      await handleCopy(
        "link",
        `${requestText} ${receiveLink}`
      );
    };

  /* =========================================================
     DOWNLOAD QR
  ========================================================== */

  const handleDownloadQr =
    () => {
      if (
        !actionsEnabled
      ) {
        setRequestAmountTouched(
          true
        );

        return;
      }

      const canvas =
        qrRef.current;

      if (
        !canvas ||
        !wallet
      ) {
        return;
      }

      const url =
        canvas.toDataURL(
          "image/png"
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `coffer-receive-${wallet._id}.png`;

      link.click();
    };

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
            <Loader2
              className="h-6 w-6 animate-spin"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">
              Loading receive details
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Fetching your wallet and incoming activity...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     WALLET ERROR
  ========================================================== */

  if (!wallet) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300">
            <QrCode
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-foreground">
            Couldn&apos;t load your wallet
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage ||
              "Unable to retrieve wallet information."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadReceiveData(
                false
              )
            }
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-violet-600
              px-5
              py-3
              text-sm
              font-bold
              text-white
              transition
              hover:bg-violet-500
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-violet-500/20
            "
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     FORMATTED VALUES
  ========================================================== */

  const formattedBalance =
    formatCurrency(
      wallet.balance,
      wallet.currency
    );

  const formattedPendingBalance =
    formatCurrency(
      wallet.pendingBalance,
      wallet.currency
    );

  /* =========================================================
     MAIN
  ========================================================== */

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.header
        initial={{
          opacity: 0,
          y: -12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-border
          bg-card
          p-5
          shadow-sm
          sm:p-6
          md:p-7
        "
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {/* Badge */}

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-violet-200
                  bg-violet-50
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-violet-700
                  dark:border-violet-800
                  dark:bg-violet-950/30
                  dark:text-violet-300
                "
              >
                <QrCode className="h-3.5 w-3.5" />

                Receive money
              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-200
                  bg-emerald-50
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  text-emerald-700
                  dark:border-emerald-800
                  dark:bg-emerald-950/30
                  dark:text-emerald-300
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Wallet ready
              </span>
            </div>

            {/* Heading */}

            <div className="flex items-start gap-3">
              <div className="mt-1 hidden h-1.5 rounded-full bg-gradient-to-b from-violet-500 to-cyan-400 sm:block sm:w-1.5" />

              <div>
                <h1
                  className="
                    max-w-3xl
                    text-3xl
                    font-black
                    tracking-[-0.045em]
                    text-foreground
                    sm:text-4xl
                  "
                >
                  Share your Coffer receive link
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                  Share your QR code or Wallet ID.
                  The sender still confirms the
                  transfer securely from their own
                  account.
                </p>
              </div>
            </div>

            {/* Small info row */}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[9px] font-bold text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
                Secure receiving
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[9px] font-bold text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-cyan-500" />
                {wallet.currency || "BDT"} wallet
              </span>
            </div>
          </div>

          {/* Refresh card */}

          <div
            className="
              shrink-0
              rounded-2xl
              border
              border-border
              bg-background
              p-3
              shadow-sm
            "
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Wallet status
                </p>

                <p className="mt-1 text-xs font-black text-foreground">
                  {wallet.status}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadReceiveData(
                    true
                  )
                }
                disabled={refreshing}
                className="
                  inline-flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-border
                  bg-card
                  px-4
                  text-xs
                  font-bold
                  text-foreground
                  transition
                  hover:border-violet-300
                  hover:text-violet-600
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:hover:border-violet-700
                  dark:hover:text-violet-300
                "
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing"
                  : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* updated */}

        <div className="relative z-10 mt-5 flex items-center justify-between gap-4 border-t border-border pt-4 text-[9px] text-muted-foreground">
          <span className="truncate">
            Share only your public receive details.
          </span>

          {lastUpdated && (
            <span className="shrink-0">
              Updated{" "}
              {formatTime(
                lastUpdated
              )}
            </span>
          )}
        </div>
      </motion.header>

      {/* =====================================================
          ACTION MESSAGE
      ====================================================== */}

      <div className="min-h-4 px-1">
        <p
          className="
            text-right
            text-[10px]
            font-medium
            text-violet-600
            dark:text-violet-300
          "
          aria-live="polite"
        >
          {actionMessage}
        </p>
      </div>

      {/* =====================================================
          BLOCKED WARNING
      ====================================================== */}

      {wallet.status ===
        "BLOCKED" && (
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            flex
            items-start
            gap-3
            rounded-[22px]
            border
            border-red-200
            bg-red-50
            p-4
            text-red-800
            dark:border-red-900/60
            dark:bg-red-950/20
            dark:text-red-200
          "
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="text-sm font-bold">
              Receiving is unavailable
            </p>

            <p className="mt-1 text-xs leading-5 opacity-80">
              This wallet is blocked. Contact
              support before sharing a payment
              request.
            </p>
          </div>
        </motion.div>
      )}

      {/* =====================================================
          MAIN RECEIVE CARD
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.06,
        }}
        className="
          relative
          overflow-hidden
          rounded-[34px]
          border
          border-violet-400/15
          bg-gradient-to-br
          from-[#17133B]
          via-[#281A63]
          to-[#5226A6]
          p-5
          text-white
          shadow-[0_24px_65px_rgba(55,38,125,.18)]
          sm:p-7
          md:p-8
        "
      >
        {/* background decoration */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.08),transparent_34%)]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* -------------------------------------------------
              MODE SWITCH
          -------------------------------------------------- */}

          <div className="relative inline-flex rounded-full border border-white/15 bg-white/[0.08] p-1 backdrop-blur-md">
            <motion.div
              layout
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="
                absolute
                bottom-1
                top-1
                rounded-full
                bg-white
                shadow-lg
              "
              style={{
                width:
                  "calc(50% - 4px)",

                left:
                  mode === "qr"
                    ? "4px"
                    : "50%",
              }}
            />

            <button
              type="button"
              onClick={() => {
                setMode(
                  "qr"
                );

                setRequestAmountTouched(
                  false
                );
              }}
              className={`relative z-10 rounded-full px-5 py-2.5 text-xs font-black transition-colors ${
                mode === "qr"
                  ? "text-[#281A63]"
                  : "text-violet-100/70 hover:text-white"
              }`}
            >
              My QR code
            </button>

            <button
              type="button"
              onClick={() =>
                setMode(
                  "request"
                )
              }
              className={`relative z-10 rounded-full px-5 py-2.5 text-xs font-black transition-colors ${
                mode ===
                "request"
                  ? "text-[#281A63]"
                  : "text-violet-100/70 hover:text-white"
              }`}
            >
              Request amount
            </button>
          </div>

          {/* -------------------------------------------------
              MINI TITLE
          -------------------------------------------------- */}

          <div className="mt-6 flex items-center gap-2 text-center">
            <Sparkles className="h-4 w-4 text-cyan-300" />

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-100/50">
              Your secure receiving point
            </p>
          </div>

          {/* -------------------------------------------------
              REQUEST FORM
          -------------------------------------------------- */}

          <AnimatePresence
            initial={false}
          >
            {mode ===
              "request" && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height:
                    "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration:
                    0.3,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ],
                }}
                className="w-full max-w-sm overflow-hidden"
              >
                <div className="mt-5 space-y-3 text-left">
                  {/* amount */}

                  <div>
                    <label
                      htmlFor="request-amount"
                      className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-violet-100/55"
                    >
                      Amount (
                      {
                        wallet.currency
                      }
                      )
                    </label>

                    <div className="relative">
                      <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200" />

                      <input
                        id="request-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.00"
                        value={
                          requestAmount
                        }
                        onBlur={() =>
                          setRequestAmountTouched(
                            true
                          )
                        }
                        onChange={(
                          event
                        ) => {
                          const nextValue =
                            event
                              .target
                              .value;

                          if (
                            nextValue ===
                              "" ||
                            /^\d*\.?\d{0,2}$/.test(
                              nextValue
                            )
                          ) {
                            setRequestAmount(
                              nextValue
                            );
                          }
                        }}
                        aria-invalid={
                          requestAmountTouched &&
                          !amountValidation.valid
                        }
                        aria-describedby="request-amount-error"
                        className={`
                          w-full
                          rounded-2xl
                          border
                          bg-white/[0.08]
                          py-3.5
                          pl-11
                          pr-4
                          text-sm
                          font-semibold
                          text-white
                          placeholder:text-violet-100/25
                          outline-none
                          transition
                          focus:ring-4
                          ${
                            requestAmountTouched &&
                            !amountValidation.valid
                              ? "border-red-300 focus:border-red-300 focus:ring-red-300/10"
                              : "border-white/10 focus:border-cyan-300 focus:ring-cyan-300/10"
                          }
                        `}
                      />
                    </div>

                    <p
                      id="request-amount-error"
                      className="mt-1.5 min-h-4 text-[10px] text-red-200"
                    >
                      {requestAmountTouched &&
                      !amountValidation.valid
                        ? amountValidation.message
                        : ""}
                    </p>
                  </div>

                  {/* note */}

                  <div>
                    <label
                      htmlFor="request-note"
                      className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-violet-100/55"
                    >
                      Note
                      <span className="ml-1 opacity-50">
                        optional
                      </span>
                    </label>

                    <input
                      id="request-note"
                      type="text"
                      maxLength={
                        MAX_NOTE_LENGTH
                      }
                      placeholder="What is this payment for?"
                      value={
                        requestNote
                      }
                      onChange={(
                        event
                      ) =>
                        setRequestNote(
                          event
                            .target
                            .value
                        )
                      }
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.08]
                        px-4
                        py-3.5
                        text-sm
                        text-white
                        placeholder:text-violet-100/25
                        outline-none
                        transition
                        focus:border-cyan-300
                        focus:ring-4
                        focus:ring-cyan-300/10
                      "
                    />

                    <p className="mt-1 text-right text-[9px] text-violet-100/35">
                      {
                        requestNote.length
                      }
                      /
                      {
                        MAX_NOTE_LENGTH
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* -------------------------------------------------
              QR CARD
          -------------------------------------------------- */}

          <motion.div
            layout
            className="
              relative
              mt-7
              rounded-[30px]
              border
              border-white/10
              bg-white
              p-4
              shadow-[0_18px_45px_rgba(0,0,0,.25)]
              sm:p-5
            "
          >
            <div className="rounded-[22px] border border-slate-100 bg-white p-2">
              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={
                    receiveLink
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.94,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.94,
                  }}
                  transition={{
                    duration:
                      0.22,
                  }}
                >
                  <QRCodeCanvas
                    ref={qrRef}
                    value={
                      receiveLink ||
                      wallet._id
                    }
                    size={210}
                    level="M"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#17133B"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* request amount label */}

          {mode ===
            "request" &&
            amountValidation.amount !=
              null && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-4 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2"
              >
                <p className="text-xs font-black text-cyan-200">
                  Requesting{" "}
                  {formatCurrency(
                    amountValidation.amount,
                    wallet.currency
                  )}
                </p>
              </motion.div>
            )}

          {/* -------------------------------------------------
              WALLET ID
          -------------------------------------------------- */}

          <div className="mt-7 w-full max-w-sm">
            <div
              className="
                rounded-[22px]
                border
                border-white/10
                bg-white/[0.07]
                p-4
                backdrop-blur-md
              "
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-100/45">
                    Wallet ID
                  </p>

                  <p className="mt-1 truncate text-sm font-black text-white">
                    {wallet._id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(
                      "id",
                      wallet._id
                    )
                  }
                  aria-label="Copy wallet ID"
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    text-white
                    transition
                    hover:bg-white/[0.14]
                  "
                >
                  {copied ===
                  "id" ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* account status */}

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[9px] text-violet-100/40">
                  Account status
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[8px] font-black ${
                    wallet.status ===
                    "ACTIVE"
                      ? "bg-emerald-300/10 text-emerald-200"
                      : wallet.status ===
                        "FROZEN"
                      ? "bg-amber-300/10 text-amber-200"
                      : "bg-red-300/10 text-red-200"
                  }`}
                >
                  {
                    wallet.status
                  }
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------
              BALANCE
          -------------------------------------------------- */}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-violet-100/55">
            <Wallet className="h-3.5 w-3.5" />

            <span>
              Available:
            </span>

            <span className="font-black text-white">
              {showBalance
                ? formattedBalance
                : maskCurrency(
                    formattedBalance
                  )}
            </span>

            <button
              type="button"
              onClick={() =>
                setShowBalance(
                  (current) =>
                    !current
                )
              }
              aria-label={
                showBalance
                  ? "Hide balance"
                  : "Show balance"
              }
              className="rounded p-1 text-violet-100/50 transition hover:text-white"
            >
              {showBalance ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>

            {wallet.pendingBalance >
              0 && (
              <span className="ml-1 rounded-full border border-amber-300/10 bg-amber-300/10 px-2.5 py-1 text-[9px] font-bold text-amber-200">
                Pending{" "}
                {
                  formattedPendingBalance
                }
              </span>
            )}
          </div>

          {/* -------------------------------------------------
              ACTIONS
          -------------------------------------------------- */}

          <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                void handleShare()
              }
              disabled={
                !actionsEnabled
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-white
                px-4
                py-3.5
                text-xs
                font-black
                text-[#281A63]
                transition
                hover:bg-violet-50
                active:scale-[.98]
                disabled:cursor-not-allowed
                disabled:opacity-45
              "
            >
              {copied ===
              "link" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  Copied
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />

                  Share
                </>
              )}
            </button>

            <button
              type="button"
              onClick={
                handleDownloadQr
              }
              disabled={
                !actionsEnabled
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-white/15
                bg-white/[0.08]
                px-4
                py-3.5
                text-xs
                font-black
                text-white
                backdrop-blur
                transition
                hover:bg-white/[0.14]
                active:scale-[.98]
                disabled:cursor-not-allowed
                disabled:opacity-45
              "
            >
              <Download className="h-4 w-4" />

              Save QR
            </button>
          </div>

          {/* tiny footer */}

          <div className="mt-6 flex items-center gap-2 text-center text-[9px] text-violet-100/35">
            <ShieldCheck className="h-3.5 w-3.5" />

            Never share your password, PIN,
            token, or OTP.
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          QUICK LINKS
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.12,
        }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <QuickLink
          href="/dashboard/send"
          icon={ArrowUpRight}
          title="Send money"
          description="Transfer funds to someone"
          iconClass="
            border-blue-200
            bg-blue-50
            text-blue-600
            dark:border-blue-800
            dark:bg-blue-950/30
            dark:text-blue-300
          "
        />

        <QuickLink
          href="/dashboard/transactions"
          icon={CreditCard}
          title="Transactions"
          description="View wallet activity"
          iconClass="
            border-violet-200
            bg-violet-50
            text-violet-600
            dark:border-violet-800
            dark:bg-violet-950/30
            dark:text-violet-300
          "
        />

        <QuickLink
          href="/dashboard/wallet"
          icon={WalletCards}
          title="My wallet"
          description="Balance and account information"
          iconClass="
            border-emerald-200
            bg-emerald-50
            text-emerald-600
            dark:border-emerald-800
            dark:bg-emerald-950/30
            dark:text-emerald-300
          "
        />
      </motion.section>

      {/* =====================================================
          RECENTLY RECEIVED
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.18,
        }}
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          shadow-sm
        "
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <ArrowDownLeft className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Incoming activity
              </p>

              <h2 className="mt-1 text-lg font-black text-foreground">
                Recently received
              </h2>
            </div>
          </div>

          <Link
            href="/dashboard/transactions"
            className="
              inline-flex
              items-center
              gap-1
              rounded-lg
              px-2
              py-1.5
              text-[10px]
              font-black
              text-violet-600
              transition
              hover:bg-violet-50
              dark:text-violet-300
              dark:hover:bg-violet-950/30
            "
          >
            View all

            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activityError ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <RefreshCw className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-foreground">
              Couldn&apos;t load incoming activity
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {activityError}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadReceiveData(
                  true
                )
              }
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-border
                bg-background
                px-4
                py-2
                text-xs
                font-bold
                text-foreground
                transition
                hover:border-violet-300
                hover:text-violet-600
                dark:hover:border-violet-700
                dark:hover:text-violet-300
              "
            >
              <RefreshCw className="h-3.5 w-3.5" />

              Retry
            </button>
          </div>
        ) : receivedTransactions.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
              <ArrowDownLeft className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-foreground">
              Nothing received yet
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Incoming transfers and deposits
              will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {receivedTransactions.map(
              (
                transaction,
                index
              ) => (
                <motion.div
                  key={
                    transaction._id
                  }
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.05,
                  }}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    p-4
                    transition
                    hover:bg-muted/40
                    sm:p-5
                  "
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {getTransactionTitle(
                          transaction
                        )}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span>
                          {formatDate(
                            transaction.createdAt
                          )}
                        </span>

                        <StatusBadge
                          status={
                            transaction.status
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-black ${
                      transaction.status ===
                      "COMPLETED"
                        ? "text-emerald-600 dark:text-emerald-300"
                        : transaction.status ===
                          "PENDING"
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {transaction.status ===
                    "COMPLETED"
                      ? "+ "
                      : ""}

                    {formatCurrency(
                      transaction.amount,
                      transaction.currency
                    )}
                  </p>
                </motion.div>
              )
            )}
          </div>
        )}
      </motion.section>

      {/* =====================================================
          SECURITY NOTE
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.22,
        }}
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-violet-200
          bg-gradient-to-br
          from-violet-50
          via-background
          to-cyan-50
          p-5
          shadow-sm
          dark:border-violet-900/60
          dark:from-violet-950/20
          dark:via-card
          dark:to-cyan-950/10
          sm:p-6
        "
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">
              Share receive details, never account secrets
            </p>

            <p className="mt-1 max-w-3xl text-xs leading-6 text-muted-foreground">
              Your Wallet ID and receive link identify
              where a sender intends to pay. They do
              not replace authentication. Never share
              your password, PIN, token, or one-time
              code.
            </p>

            <Link
              href="/dashboard/kyc"
              className="
                mt-3
                inline-flex
                items-center
                gap-1
                rounded-lg
                px-2
                py-1.5
                text-[10px]
                font-black
                text-violet-600
                transition
                hover:bg-violet-500/10
                dark:text-violet-300
              "
            >
              Review verification status

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
      className="
        group
        rounded-[24px]
        border
        border-border
        bg-card
        p-5
        shadow-sm
        transition
        duration-300
        hover:-translate-y-1
        hover:border-violet-300
        hover:shadow-[0_18px_40px_rgba(109,40,217,.08)]
        dark:hover:border-violet-700
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${iconClass}`}
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition group-hover:border-violet-200 group-hover:text-violet-600 dark:group-hover:border-violet-800 dark:group-hover:text-violet-300">
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <h3 className="mt-5 text-sm font-black text-foreground">
        {title}
      </h3>

      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const styles: Record<
    TransactionStatus,
    string
  > = {
    COMPLETED:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",

    PENDING:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",

    FAILED:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        rounded-full
        border
        px-2
        py-0.5
        text-[8px]
        font-black
        ${styles[status]}
      `}
    >
      {status ===
        "PENDING" && (
        <Clock3 className="h-2.5 w-2.5" />
      )}

      {status.toLowerCase()}
    </span>
  );
}

/* =========================================================
   TRANSACTION TITLE
========================================================= */

function getTransactionTitle(
  transaction: Transaction
): string {
  if (
    transaction.reference?.trim()
  ) {
    return transaction.reference.trim();
  }

  if (
    transaction.counterparty &&
    typeof transaction.counterparty ===
      "object" &&
    transaction.counterparty.name
  ) {
    return `From ${transaction.counterparty.name}`;
  }

  return transaction.type ===
    "DEPOSIT"
    ? "Wallet deposit"
    : "Incoming transfer";
}

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
  amount: number,
  currency = "BDT"
): string {
  const safeAmount =
    Number(amount) || 0;

  if (
    currency.toUpperCase() ===
    "BDT"
  ) {
    return `৳ ${safeAmount.toLocaleString(
      "en-BD",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  try {
    return new Intl.NumberFormat(
      "en",
      {
        style:
          "currency",

        currency:
          currency.toUpperCase(),

        minimumFractionDigits: 0,

        maximumFractionDigits: 2,
      }
    ).format(
      safeAmount
    );
  } catch {
    return `${currency.toUpperCase()} ${safeAmount.toLocaleString(
      "en",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }
}

/* =========================================================
   MASK
========================================================= */

function maskCurrency(
  formatted: string
): string {
  return formatted.replace(
    /[0-9]/g,
    "•"
  );
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

/* =========================================================
   TIME
========================================================= */

function formatTime(
  value: Date
): string {
  return value.toLocaleTimeString(
    "en-BD",
    {
      hour: "2-digit",

      minute: "2-digit",
    }
  );
}

/* =========================================================
   ERROR
========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error &&
    error.message
    ? error.message
    : fallback;
}