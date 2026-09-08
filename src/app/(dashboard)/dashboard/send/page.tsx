"use client";

import {
  useCallback,
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
  Banknote,
  Check,
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
  QrCode,
  ReceiptText,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  apiClient,
} from "@/lib/api/client";

import {
  getMyWallet,
} from "@/lib/api/walletApi";

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

interface ParsedQRRecipient {
  recipient: string;
  walletId?: string;
  receiverId?: string;
  amount?: number;
  note?: string;
  currency?: string;
  source: "Coffer QR";
}

/* =========================================================
   CONSTANTS
========================================================= */

const quickAmounts = [
  100,
  500,
  1000,
  5000,
];

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
   QR PARSER
========================================================= */

function parseCofferQR(
  rawValue: string
): ParsedQRRecipient | null {
  const decoded = rawValue.trim();

  if (!decoded) {
    return null;
  }

  /*
   * Coffer custom URL
   *
   * Example:
   *
   * coffer://pay?recipient=01710000000
   * coffer://pay?email=test@example.com
   * coffer://pay?walletId=...
   */

  if (
    decoded.startsWith(
      "coffer://"
    )
  ) {
    try {
      const parsed =
        new URL(decoded);

      const recipient =
        parsed.searchParams.get(
          "recipient"
        ) ||
        parsed.searchParams.get(
          "phone"
        ) ||
        parsed.searchParams.get(
          "email"
        );

      const walletId =
        parsed.searchParams.get(
          "walletId"
        ) || undefined;

      const receiverId =
        parsed.searchParams.get(
          "receiverId"
        ) || undefined;

      const amountValue =
        parsed.searchParams.get(
          "amount"
        );

      const note =
        parsed.searchParams.get(
          "note"
        ) || undefined;

      const currency =
        parsed.searchParams.get(
          "currency"
        ) || undefined;

      const amount =
        amountValue &&
        /^\d+(?:\.\d{1,2})?$/.test(
          amountValue
        )
          ? Number(amountValue)
          : undefined;

      const finalRecipient =
        recipient ||
        walletId ||
        receiverId;

      if (!finalRecipient) {
        return null;
      }

      return {
        recipient:
          finalRecipient,
        walletId,
        receiverId,
        amount,
        note,
        currency,
        source: "Coffer QR",
      };
    } catch {
      return null;
    }
  }

  /*
   * Coffer web receive/send link
   */

  try {
    const parsed =
      new URL(
        decoded,
        window.location.origin
      );

    const isCofferRoute =
      parsed.pathname ===
        "/dashboard/send" ||
      parsed.pathname ===
        "/dashboard/receive";

    if (!isCofferRoute) {
      throw new Error(
        "Not a Coffer route"
      );
    }

    const walletId =
      parsed.searchParams.get(
        "walletId"
      ) || undefined;

    const receiverId =
      parsed.searchParams.get(
        "receiverId"
      ) || undefined;

    const recipient =
      parsed.searchParams.get(
        "recipient"
      ) ||
      parsed.searchParams.get(
        "email"
      ) ||
      parsed.searchParams.get(
        "phone"
      ) ||
      undefined;

    const amountValue =
      parsed.searchParams.get(
        "amount"
      );

    const note =
      parsed.searchParams.get(
        "note"
      ) || undefined;

    const currency =
      parsed.searchParams.get(
        "currency"
      ) || undefined;

    const amount =
      amountValue &&
      /^\d+(?:\.\d{1,2})?$/.test(
        amountValue
      )
        ? Number(amountValue)
        : undefined;

    const finalRecipient =
      recipient ||
      walletId ||
      receiverId;

    if (!finalRecipient) {
      return null;
    }

    return {
      recipient:
        finalRecipient,
      walletId,
      receiverId,
      amount,
      note,
      currency,
      source: "Coffer QR",
    };
  } catch {
    /*
     * Plain QR value:
     *
     * phone
     * email
     * mongodb-style wallet id
     */

    const plain =
      decoded.trim();

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        plain
      );

    const isPhone =
      /^\+?\d{8,20}$/.test(
        plain
      );

    const isMongoId =
      /^[a-f\d]{24}$/i.test(
        plain
      );

    if (
      isEmail ||
      isPhone ||
      isMongoId
    ) {
      return {
        recipient: plain,
        source: "Coffer QR",
      };
    }

    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function SendMoneyPage() {
  const [
    step,
    setStep,
  ] = useState<1 | 2 | 3>(1);

  const [
    direction,
    setDirection,
  ] = useState(1);

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    recipient,
    setRecipient,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    balance,
    setBalance,
  ] = useState<number | null>(
    null
  );

  const [
    balanceLoading,
    setBalanceLoading,
  ] = useState(true);

  const [
    kycStatus,
    setKycStatus,
  ] = useState<KYCStatus | null>(
    null
  );

  const [
    kycLoading,
    setKycLoading,
  ] = useState(true);

  const [
    kycError,
    setKycError,
  ] = useState("");

  const [
    showBalance,
    setShowBalance,
  ] = useState(false);

  const [
    paymentHistory,
    setPaymentHistory,
  ] = useState<
    PaymentHistoryItem[]
  >([]);

  /* =====================================================
     QR SCANNER
  ===================================================== */

  const [
    qrScannerOpen,
    setQrScannerOpen,
  ] = useState(false);

  const [
    qrScannerLoading,
    setQrScannerLoading,
  ] = useState(false);

  const [
    qrScannerError,
    setQrScannerError,
  ] = useState("");

  const [
    scannedRecipient,
    setScannedRecipient,
  ] =
    useState<ParsedQRRecipient | null>(
      null
    );

  const qrScannerRef =
    useRef<
      import("html5-qrcode").Html5Qrcode | null
    >(null);

  const qrStartingRef =
    useRef(false);

  const qrStoppedRef =
    useRef(false);

  /* =====================================================
     IDEMPOTENCY
  ===================================================== */

  const idempotencyKeyRef =
    useRef<string | null>(
      null
    );

  const transferFingerprintRef =
    useRef<string | null>(
      null
    );

  /* =====================================================
     BALANCE
  ===================================================== */

  const loadBalance =
    useCallback(
      async () => {
        try {
          setBalanceLoading(
            true
          );

          const data =
            await getMyWallet();

          if (
            data?.success &&
            data.wallet
          ) {
            setBalance(
              Number(
                data.wallet.balance
              ) || 0
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to load wallet balance:",
            error
          );
        } finally {
          setBalanceLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  /* =====================================================
     KYC
  ===================================================== */

  const loadKYCStatus =
    useCallback(
      async () => {
        try {
          setKycLoading(
            true
          );

          setKycError("");

          const response =
            await apiClient<KYCStatusResponse>(
              "/kyc/status"
            );

          if (
            !response?.success
          ) {
            throw new Error(
              response?.message ||
                "Unable to verify your identity status."
            );
          }

          const status =
            response.kyc?.status ||
            response.userKycStatus ||
            "not_started";

          setKycStatus(
            status
          );
        } catch (
          error
        ) {
          console.error(
            "KYC status loading error:",
            error
          );

          setKycStatus(
            null
          );

          setKycError(
            error instanceof Error
              ? error.message
              : "Unable to verify your KYC status."
          );
        } finally {
          setKycLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadKYCStatus();
  }, [loadKYCStatus]);

  /* =====================================================
     QR CLEANUP
  ===================================================== */

  const stopQRScanner =
    useCallback(
      async () => {
        const scanner =
          qrScannerRef.current;

        qrStoppedRef.current =
          true;

        qrStartingRef.current =
          false;

        if (!scanner) {
          return;
        }

        try {
          await scanner.stop();
        } catch {
          // Already stopped.
        }

        try {
          scanner.clear();
        } catch {
          // Cleanup failed safely.
        }

        qrScannerRef.current =
          null;
      },
      []
    );

  const closeQRScanner =
    useCallback(
      async () => {
        await stopQRScanner();

        setQrScannerOpen(
          false
        );

        setQrScannerLoading(
          false
        );

        setQrScannerError(
          ""
        );
      },
      [stopQRScanner]
    );

  /* =====================================================
     QR DECODE
  ===================================================== */

  const handleQRDecoded =
    useCallback(
      async (
        decodedText: string
      ) => {
        const parsed =
          parseCofferQR(
            decodedText
          );

        if (!parsed) {
          setQrScannerError(
            "This QR code is not a valid Coffer payment QR."
          );
          return;
        }

        setScannedRecipient(
          parsed
        );

        setRecipient(
          parsed.recipient
        );

        if (
          parsed.amount !==
          undefined
        ) {
          setAmount(
            String(
              parsed.amount
            )
          );
        }

        if (
          parsed.note
        ) {
          setNote(
            parsed.note
          );
        }

        setErrorMessage("");

        await closeQRScanner();

        setDirection(-1);

        setStep(1);
      },
      [closeQRScanner]
    );

  /* =====================================================
     START QR SCANNER
  ===================================================== */

  const startQRScanner =
    useCallback(
      async () => {
        if (
          qrStartingRef.current
        ) {
          return;
        }

        qrStartingRef.current =
          true;

        qrStoppedRef.current =
          false;

        setQrScannerError(
          ""
        );

        setQrScannerLoading(
          true
        );

        try {
          const {
            Html5Qrcode,
            Html5QrcodeSupportedFormats,
          } =
            await import(
              "html5-qrcode"
            );

          const reader =
            document.getElementById(
              "coffer-qr-reader"
            );

          if (!reader) {
            throw new Error(
              "QR scanner area is not ready."
            );
          }

          const scanner =
            new Html5Qrcode(
              "coffer-qr-reader",
              {
                formatsToSupport: [
                  Html5QrcodeSupportedFormats.QR_CODE,
                ],
                verbose:
                  false,
              }
            );

          qrScannerRef.current =
            scanner;

          await scanner.start(
            {
              facingMode:
                "environment",
            },
            {
              fps: 10,

              qrbox: {
                width: 240,
                height: 240,
              },

              aspectRatio: 1,
            },
            async (
              decodedText
            ) => {
              if (
                qrStoppedRef.current
              ) {
                return;
              }

              await handleQRDecoded(
                decodedText
              );
            },
            () => {
              /*
               * Normal frame scan failures.
               */
            }
          );

          if (
            !qrStoppedRef.current
          ) {
            setQrScannerLoading(
              false
            );
          }
        } catch (
          error
        ) {
          console.error(
            "QR scanner error:",
            error
          );

          setQrScannerLoading(
            false
          );

          setQrScannerError(
            error instanceof Error
              ? error.message
              : "Unable to start the QR scanner."
          );

          await stopQRScanner();
        } finally {
          qrStartingRef.current =
            false;
        }
      },
      [
        handleQRDecoded,
        stopQRScanner,
      ]
    );

  /* =====================================================
     OPEN QR
  ===================================================== */

  const openQRScanner =
    () => {
      setQrScannerError("");

      setScannedRecipient(
        null
      );

      setQrScannerOpen(
        true
      );
    };

  useEffect(() => {
    if (
      !qrScannerOpen
    ) {
      return;
    }

    let cancelled =
      false;

    const timer =
      window.setTimeout(
        () => {
          if (
            !cancelled
          ) {
            void startQRScanner();
          }
        },
        150
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer
      );
    };
  }, [
    qrScannerOpen,
    startQRScanner,
  ]);

  useEffect(() => {
    return () => {
      void stopQRScanner();
    };
  }, [stopQRScanner]);

  /* =====================================================
     DERIVED VALUES
  ===================================================== */

  const numericAmount =
    Number(amount);

  const isRecipientValid =
    recipient.trim().length >=
    3;

  const isAmountValid =
    amount.trim() !== "" &&
    /^\d+(?:\.\d{1,2})?$/.test(
      amount.trim()
    ) &&
    Number.isFinite(
      numericAmount
    ) &&
    numericAmount > 0 &&
    (balance === null ||
      numericAmount <=
        balance);

  const formattedBalance =
    formatCurrency(
      balance ?? 0
    );

  const remainingBalance =
    Math.max(
      0,
      (balance ?? 0) -
        Math.max(
          numericAmount,
          0
        )
    );

  const amountUsedPercentage =
    balance &&
    balance > 0 &&
    numericAmount > 0
      ? Math.min(
          100,
          (numericAmount /
            balance) *
            100
        )
      : 0;

  const recentRecipients =
    useMemo(() => {
      const unique =
        new Map<
          string,
          PaymentHistoryItem
        >();

      paymentHistory.forEach(
        (item) => {
          if (
            !unique.has(
              item.recipient
            )
          ) {
            unique.set(
              item.recipient,
              item
            );
          }
        }
      );

      return Array.from(
        unique.values()
      ).slice(0, 4);
    }, [paymentHistory]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const goToStep =
    (
      next: 1 | 2 | 3
    ) => {
      setDirection(
        next > step
          ? 1
          : -1
      );

      setStep(
        next
      );
    };

  /* =====================================================
     HANDLE NEXT
  ===================================================== */

  const handleNext =
    () => {
      setErrorMessage("");

      if (
        kycStatus !==
        "verified"
      ) {
        setErrorMessage(
          "Verified KYC is required before you can send money."
        );
        return;
      }

      if (
        !isRecipientValid
      ) {
        setErrorMessage(
          "Enter a valid mobile number, email, or wallet ID."
        );
        return;
      }

      if (
        !isAmountValid
      ) {
        setErrorMessage(
          balance !==
            null &&
          numericAmount >
            balance
            ? "That amount is more than your available balance."
            : "Enter a valid amount greater than 0."
        );

        return;
      }

      goToStep(2);
    };

  /* =====================================================
     IDEMPOTENCY
  ===================================================== */

  const getIdempotencyKey =
    (): string => {
      const amountMinor =
        Math.round(
          numericAmount *
            100
        );

      const fingerprint =
        JSON.stringify({
          recipient:
            recipient
              .trim()
              .toLowerCase(),

          amountMinorUnits:
            amountMinor,

          reference:
            note.trim(),
        });

      if (
        !idempotencyKeyRef.current ||
        transferFingerprintRef.current !==
          fingerprint
      ) {
        if (
          typeof crypto ===
            "undefined" ||
          typeof crypto.randomUUID !==
            "function"
        ) {
          throw new Error(
            "Secure request IDs are not supported by this browser."
          );
        }

        idempotencyKeyRef.current =
          crypto.randomUUID();

        transferFingerprintRef.current =
          fingerprint;
      }

      return idempotencyKeyRef.current;
    };

  /* =====================================================
     SEND
  ===================================================== */

  const handleSend =
    async () => {
      if (
        isLoading
      ) {
        return;
      }

      if (
        kycStatus !==
        "verified"
      ) {
        setErrorMessage(
          "Verified KYC is required before you can send money."
        );
        return;
      }

      if (
        !password.trim()
      ) {
        setErrorMessage(
          "Enter your login password to confirm this transfer."
        );
        return;
      }

      if (
        !isRecipientValid ||
        !isAmountValid
      ) {
        setErrorMessage(
          "The transfer details changed. Please review the recipient and amount again."
        );

        goToStep(1);

        return;
      }

      let idempotencyKey =
        "";

      try {
        idempotencyKey =
          getIdempotencyKey();
      } catch (
        error
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to create a secure payment request."
        );

        return;
      }

      setErrorMessage("");

      setIsLoading(
        true
      );

      try {
        const data =
          await apiClient<TransferResponse>(
            "/transfers",
            {
              method:
                "POST",

              headers: {
                "Idempotency-Key":
                  idempotencyKey,
              },

              body:
                JSON.stringify({
                  recipient:
                    recipient.trim(),

                  amount:
                    numericAmount,

                  reference:
                    note.trim() ||
                    undefined,

                  password:
                    password,
                }),
            }
          );

        if (
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Transfer failed."
          );
        }

        if (
          data.transaction?._id
        ) {
          const item: PaymentHistoryItem =
            {
              id:
                data.transaction
                  ._id,

              recipient:
                recipient.trim(),

              amount:
                Number(
                  data.transaction
                    .amount
                ) ||
                numericAmount,

              status:
                data.transaction
                  .status ||
                "COMPLETED",

              note:
                data.transaction
                  .reference ??
                (note.trim() ||
                  undefined),

              createdAt:
                data.transaction
                  .createdAt ||
                new Date()
                  .toISOString(),
            };

          setPaymentHistory(
            (current) => {
              if (
                current.some(
                  (entry) =>
                    entry.id ===
                    item.id
                )
              ) {
                return current;
              }

              return [
                item,
                ...current,
              ];
            }
          );
        }

        idempotencyKeyRef.current =
          null;

        transferFingerprintRef.current =
          null;

        setPassword("");

        setShowPassword(
          false
        );

        goToStep(3);

        void loadBalance();
      } catch (
        error
      ) {
        console.error(
          "Transfer request error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Transfer failed. Please try again."
        );

        setPassword("");

        setShowPassword(
          false
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset =
    () => {
      goToStep(1);

      setAmount("");

      setRecipient("");

      setPassword("");

      setShowPassword(
        false
      );

      setNote("");

      setErrorMessage("");

      setScannedRecipient(
        null
      );

      idempotencyKeyRef.current =
        null;

      transferFingerprintRef.current =
        null;
    };

  /* =====================================================
     KYC STATES
  ===================================================== */

  if (
    kycLoading
  ) {
    return (
      <KYCCheckingState />
    );
  }

  if (
    kycError ||
    kycStatus !==
      "verified"
  ) {
    return (
      <KYCRequiredState
        status={
          kycStatus
        }
        errorMessage={
          kycError
        }
        onRetry={() =>
          void loadKYCStatus()
        }
      />
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <main className="relative mx-auto w-full max-w-[1420px] pb-10 text-foreground">
      {/* Ambient violet background */}

      <div className="pointer-events-none absolute -left-48 top-20 h-[440px] w-[440px] rounded-full bg-violet-500/10 blur-[130px]" />

      <div className="pointer-events-none absolute right-0 top-[430px] h-[380px] w-[380px] rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative z-10 space-y-5">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <TransferHeroCard
            onScanQR={
              openQRScanner
            }
            scannedRecipient={
              scannedRecipient
            }
          />

          <BalanceRevealCard
            balanceLoading={
              balanceLoading
            }
            formattedBalance={
              formattedBalance
            }
            showBalance={
              showBalance
            }
            currentBalance={
              balance ?? 0
            }
            transferAmount={
              numericAmount
            }
            onToggle={() =>
              setShowBalance(
                (current) =>
                  !current
              )
            }
          />
        </section>

        {/* =================================================
            MAIN AREA
        ================================================= */}

        <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* =================================================
              TRANSFER WORKSPACE
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.55,
            }}
            className="overflow-hidden rounded-[30px] border border-border bg-card text-card-foreground shadow-[var(--dashboard-shadow)]"
          >
            <div className="border-b border-border bg-violet-50/50 px-5 py-5 dark:bg-violet-950/10 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    Payment workspace
                  </p>

                  <h2 className="mt-1.5 text-xl font-black tracking-[-0.025em]">
                    {step ===
                    1
                      ? "Transfer details"
                      : step ===
                          2
                        ? "Review & authorize"
                        : "Payment completed"}
                  </h2>
                </div>

                {step <
                  3 && (
                  <ProgressSteps
                    step={
                      step
                    }
                  />
                )}
              </div>
            </div>

            <div className="p-5 sm:p-7 lg:p-8">
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -8,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      height:
                        "auto",
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-600">
                      <X className="mt-0.5 h-4 w-4 shrink-0" />

                      <span>
                        {
                          errorMessage
                        }
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence
                mode="wait"
                custom={
                  direction
                }
              >
                {/* =================================================
                    STEP 1
                ================================================= */}

                {step ===
                  1 && (
                  <motion.div
                    key="details"
                    custom={
                      direction
                    }
                    variants={
                      stepVariants
                    }
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration:
                        0.36,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className="space-y-6"
                  >
                    <div className="grid gap-5 lg:grid-cols-2">
                      {/* Recipient */}

                      <FormField
                        label="Recipient"
                        hint="Mobile, email or wallet ID"
                        htmlFor="recipient"
                      >
                        <div className="group relative">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition group-focus-within:text-violet-600" />

                          <input
                            id="recipient"
                            type="text"
                            autoComplete="off"
                            placeholder="01XXXXXXXXX, name@email.com or wallet ID"
                            value={
                              recipient
                            }
                            onChange={(
                              event
                            ) => {
                              setRecipient(
                                event
                                  .target
                                  .value
                              );

                              setScannedRecipient(
                                null
                              );

                              setErrorMessage(
                                ""
                              );
                            }}
                            className="h-[58px] w-full rounded-[16px] border border-input bg-background pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:font-medium placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-600 focus:bg-background focus:ring-4 focus:ring-violet-600/10"
                          />
                        </div>
                      </FormField>

                      {/* Amount */}

                      <FormField
                        label="Amount"
                        hint="Bangladeshi Taka"
                        htmlFor="amount"
                      >
                        <div className="group relative">
                          <Banknote className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition group-focus-within:text-violet-600" />

                          <input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={
                              amount
                            }
                            onChange={(
                              event
                            ) => {
                              setAmount(
                                event
                                  .target
                                  .value
                              );

                              setErrorMessage(
                                ""
                              );
                            }}
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                [
                                  "-",
                                  "e",
                                  "E",
                                  "+",
                                ].includes(
                                  event.key
                                )
                              ) {
                                event.preventDefault();
                              }
                            }}
                            className="h-[58px] w-full rounded-[16px] border border-input bg-background pl-12 pr-16 text-[21px] font-black tracking-[-0.02em] text-foreground outline-none transition placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-600 focus:bg-background focus:ring-4 focus:ring-violet-600/10"
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-border bg-card px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground shadow-sm">
                            BDT
                          </span>
                        </div>
                      </FormField>
                    </div>

                    {/* Scan */}

                    <motion.button
                      type="button"
                      onClick={
                        openQRScanner
                      }
                      whileHover={{
                        y: -2,
                      }}
                      whileTap={{
                        scale:
                          0.985,
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-[20px] border border-violet-200 bg-violet-50/60 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/20 dark:hover:bg-violet-950/30 sm:p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                          <ScanLine className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-black text-violet-950 dark:text-violet-100">
                            Scan recipient QR
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-violet-800/65 dark:text-violet-200/60">
                            Scan a Coffer Receive Money QR and fill the recipient automatically.
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-violet-400" />
                    </motion.button>

                    {/* Scanned info */}

                    <AnimatePresence>
                      {scannedRecipient && (
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
                          className="rounded-[18px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              <QrCode className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-black text-violet-950 dark:text-violet-100">
                                  Recipient scanned
                                </p>

                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                  Coffer QR
                                </span>
                              </div>

                              <p className="mt-1 break-all text-[11px] font-bold text-violet-700 dark:text-violet-300">
                                {
                                  scannedRecipient.recipient
                                }
                              </p>

                              {scannedRecipient.walletId && (
                                <p className="mt-1 break-all text-[9px] font-medium text-violet-700/70 dark:text-violet-300/70">
                                  Wallet ID:{" "}
                                  {
                                    scannedRecipient.walletId
                                  }
                                </p>
                              )}

                              {scannedRecipient.amount !==
                                undefined && (
                                <p className="mt-1 text-[9px] font-bold text-violet-700 dark:text-violet-300">
                                  Amount:{" "}
                                  {formatCurrency(
                                    scannedRecipient.amount
                                  )}
                                </p>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setScannedRecipient(
                                    null
                                  )
                                }
                                className="mt-2 text-[10px] font-black text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                              >
                                Use different recipient
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick amounts */}

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                          Quick amounts
                        </p>

                        {balance !==
                          null && (
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            Available{" "}
                            {formatCurrency(
                              balance
                            )}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {quickAmounts.map(
                          (
                            quickAmount
                          ) => {
                            const disabled =
                              balance !==
                                null &&
                              quickAmount >
                                balance;

                            const active =
                              amount ===
                              String(
                                quickAmount
                              );

                            return (
                              <motion.button
                                key={
                                  quickAmount
                                }
                                type="button"
                                disabled={
                                  disabled
                                }
                                whileTap={
                                  disabled
                                    ? undefined
                                    : {
                                        scale: 0.97,
                                      }
                                }
                                whileHover={
                                  disabled
                                    ? undefined
                                    : {
                                        y: -2,
                                      }
                                }
                                onClick={() =>
                                  setAmount(
                                    String(
                                      quickAmount
                                    )
                                  )
                                }
                                className={[
                                  "h-11 rounded-[13px] border text-xs font-black transition",
                                  disabled
                                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                    : active
                                      ? "border-violet-600 bg-violet-50 text-violet-700 shadow-[0_7px_18px_rgba(109,40,217,.10)] dark:border-violet-500 dark:bg-violet-950/30 dark:text-violet-300"
                                      : "border-border bg-background text-muted-foreground hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 dark:hover:bg-violet-950/20",
                                ].join(
                                  " "
                                )}
                              >
                                ৳{" "}
                                {quickAmount.toLocaleString(
                                  "en-BD"
                                )}
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Payment note */}

                    <FormField
                      label="Payment note"
                      hint="Optional reference"
                      htmlFor="note"
                    >
                      <div className="group relative">
                        <FileText className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition group-focus-within:text-violet-600" />

                        <input
                          id="note"
                          type="text"
                          maxLength={
                            160
                          }
                          placeholder="Add a short note for this payment"
                          value={
                            note
                          }
                          onChange={(
                            event
                          ) =>
                            setNote(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-[56px] w-full rounded-[16px] border border-input bg-background pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:font-medium placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                        />
                      </div>
                    </FormField>

                    {/* Balance impact */}

                    <AnimatePresence>
                      {numericAmount >
                        0 &&
                        balance !==
                          null && (
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
                            className="rounded-[22px] border border-violet-200 bg-gradient-to-br from-violet-50 via-background to-indigo-50 p-5 dark:border-violet-900 dark:from-violet-950/25 dark:via-background dark:to-indigo-950/20"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                                  Balance impact
                                </p>

                                <p className="mt-1 text-sm font-black text-foreground">
                                  After this payment
                                </p>
                              </div>

                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <BalanceMetric
                                label="Current"
                                value={formatCurrency(
                                  balance
                                )}
                              />

                              <BalanceMetric
                                label="Remaining"
                                value={formatCurrency(
                                  remainingBalance
                                )}
                                highlight
                              />
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                <span>
                                  Balance used
                                </span>

                                <span>
                                  {
                                    amountUsedPercentage.toFixed(
                                      1
                                    )
                                  }
                                  %
                                </span>
                              </div>

                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950/40">
                                <motion.div
                                  initial={{
                                    width: 0,
                                  }}
                                  animate={{
                                    width: `${amountUsedPercentage}%`,
                                  }}
                                  transition={{
                                    duration:
                                      0.35,
                                  }}
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Review */}

                    <motion.button
                      type="button"
                      onClick={
                        handleNext
                      }
                      disabled={
                        !recipient.trim() ||
                        !amount
                      }
                      whileTap={{
                        scale:
                          0.988,
                      }}
                      className="group relative flex h-[58px] w-full items-center justify-center gap-2 overflow-hidden rounded-[17px] bg-gradient-to-r from-violet-700 to-indigo-600 text-sm font-black text-white shadow-[0_15px_35px_rgba(109,40,217,.22)] transition hover:from-violet-600 hover:to-indigo-500 hover:shadow-[0_18px_42px_rgba(109,40,217,.28)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 -left-20 w-20 skew-x-[-18deg] bg-white/15"
                        animate={{
                          x: [
                            0,
                            760,
                          ],
                        }}
                        transition={{
                          duration:
                            3.2,
                          repeat:
                            Infinity,
                          repeatDelay:
                            2.4,
                        }}
                      />

                      <span className="relative">
                        Review payment
                      </span>

                      <ArrowRight className="relative h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                    </motion.button>

                    <TransferInfoStrip />
                  </motion.div>
                )}

                {/* =================================================
                    STEP 2
                ================================================= */}

                {step ===
                  2 && (
                  <motion.div
                    key="verify"
                    custom={
                      direction
                    }
                    variants={
                      stepVariants
                    }
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration:
                        0.36,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className="space-y-5"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        goToStep(
                          1
                        )
                      }
                      className="group inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground transition hover:text-violet-600"
                    >
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      Edit details
                    </button>

                    <div className="overflow-hidden rounded-[24px] border border-border bg-violet-50/40 dark:bg-violet-950/10">
                      <div className="border-b border-violet-100 bg-card/90 p-5 text-center dark:border-violet-900 sm:p-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-muted-foreground">
                          You are sending
                        </p>

                        <h3 className="mt-2 text-4xl font-black tracking-[-0.05em] text-violet-950 dark:text-violet-100">
                          {formatCurrency(
                            numericAmount
                          )}
                        </h3>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                        <ReviewItem
                          icon={
                            UserRound
                          }
                          label="Recipient"
                          value={
                            recipient
                          }
                        />

                        <ReviewItem
                          icon={
                            FileText
                          }
                          label="Reference"
                          value={
                            note.trim() ||
                            "No note added"
                          }
                        />

                        <ReviewItem
                          icon={
                            WalletCards
                          }
                          label="Wallet before"
                          value={
                            formatCurrency(
                              balance ??
                                0
                            )
                          }
                        />

                        <ReviewItem
                          icon={
                            CheckCircle2
                          }
                          label="Wallet after"
                          value={
                            formatCurrency(
                              remainingBalance
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-border bg-card p-5 sm:p-6">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-violet-100 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300">
                          <LockKeyhole className="h-5 w-5" />
                        </div>

                        <h3 className="mt-3 text-sm font-black">
                          Confirm with your login password
                        </h3>

                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                          Re-enter your account password to authorize this transfer.
                        </p>
                      </div>

                      <div className="relative mt-5">
                        <input
                          id="transfer-password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          value={
                            password
                          }
                          onChange={(
                            event
                          ) => {
                            setPassword(
                              event
                                .target
                                .value
                            );

                            if (
                              errorMessage
                            ) {
                              setErrorMessage(
                                ""
                              );
                            }
                          }}
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                                "Enter" &&
                              password.trim() &&
                              !isLoading
                            ) {
                              void handleSend();
                            }
                          }}
                          placeholder="Enter your login password"
                          className="h-[58px] w-full rounded-[16px] border border-input bg-background px-4 pr-12 text-sm font-semibold outline-none transition placeholder:font-medium placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (
                                current
                              ) =>
                                !current
                            )
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-violet-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>

                      <div className="mt-3 flex items-start gap-2 rounded-[13px] bg-violet-50/60 px-3 py-2.5 dark:bg-violet-950/20">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />

                        <p className="text-[10px] font-medium leading-5 text-muted-foreground">
                          Your password is used only for secure authorization and is not stored in this transfer record.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={() =>
                        void handleSend()
                      }
                      disabled={
                        !password.trim() ||
                        isLoading
                      }
                      whileTap={{
                        scale:
                          0.988,
                      }}
                      className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[17px] bg-gradient-to-r from-violet-700 to-indigo-600 text-sm font-black text-white shadow-[0_14px_34px_rgba(109,40,217,.22)] transition hover:from-violet-600 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
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

                {/* =================================================
                    STEP 3
                ================================================= */}

                {step ===
                  3 && (
                  <motion.div
                    key="success"
                    custom={
                      direction
                    }
                    variants={
                      stepVariants
                    }
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration:
                        0.38,
                    }}
                    className="flex min-h-[520px] flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-6 rounded-full bg-emerald-400/20"
                        animate={{
                          scale: [
                            1,
                            1.55,
                            1,
                          ],
                          opacity: [
                            0.18,
                            0,
                            0.18,
                          ],
                        }}
                        transition={{
                          duration:
                            2,
                          repeat:
                            Infinity,
                        }}
                      />

                      <motion.div
                        initial={{
                          scale: 0.55,
                          opacity: 0,
                          rotate:
                            -12,
                        }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          rotate: 0,
                        }}
                        transition={{
                          type:
                            "spring",
                          stiffness:
                            240,
                          damping:
                            18,
                        }}
                        className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-[0_18px_42px_rgba(16,185,129,.14)]"
                      >
                        <CheckCircle2 className="h-14 w-14" />
                      </motion.div>
                    </div>

                    <span className="mt-7 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                      Payment sent
                    </span>

                    <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-card-foreground sm:text-3xl">
                      Transfer completed successfully
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      {formatCurrency(
                        numericAmount
                      )}{" "}
                      was sent to{" "}
                      <span className="font-black text-foreground">
                        {
                          recipient
                        }
                      </span>
                      .
                    </p>

                    <div className="mt-6 rounded-[20px] border border-violet-200 bg-violet-50 px-5 py-4 dark:border-violet-900 dark:bg-violet-950/20">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-500">
                        Remaining wallet balance
                      </p>

                      <p className="mt-1 text-xl font-black text-violet-950 dark:text-violet-100">
                        {formatCurrency(
                          remainingBalance
                        )}
                      </p>
                    </div>

                    <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={
                          handleReset
                        }
                        className="h-12 rounded-[14px] border border-border bg-background text-xs font-black text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/20"
                      >
                        Send another
                      </button>

                      <Link
                        href="/dashboard"
                        className="flex h-12 items-center justify-center rounded-[14px] bg-gradient-to-r from-violet-700 to-indigo-600 text-xs font-black text-white transition hover:brightness-105"
                      >
                        Back to dashboard
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <motion.aside
            initial={{
              opacity: 0,
              x: 16,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration:
                0.55,
              delay: 0.12,
            }}
            className="space-y-5 xl:sticky xl:top-[100px]"
          >
            {/* Recent */}

            <div className="rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                  <Clock3 className="h-[18px] w-[18px]" />
                </div>

                <div>
                  <h3 className="text-sm font-black">
                    Recent recipients
                  </h3>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Reuse recipients from transfers completed in this session.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {recentRecipients.length >
                0 ? (
                  recentRecipients.map(
                    (
                      item
                    ) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() => {
                          setRecipient(
                            item.recipient
                          );

                          setScannedRecipient(
                            null
                          );

                          if (
                            step !==
                            1
                          ) {
                            goToStep(
                              1
                            );
                          }
                        }}
                        className="group flex w-full items-center gap-3 rounded-[15px] border border-transparent p-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/50 dark:hover:bg-violet-950/15"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-violet-600 to-indigo-500 text-xs font-black text-white shadow-[0_8px_20px_rgba(109,40,217,.18)]">
                          {getInitial(
                            item.recipient
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black">
                            {
                              item.recipient
                            }
                          </p>

                          <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">
                            Last sent{" "}
                            {formatCurrency(
                              item.amount
                            )}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                      </button>
                    )
                  )
                ) : (
                  <div className="rounded-[16px] border border-dashed border-violet-200 bg-violet-50/40 px-4 py-5 text-center dark:border-violet-900 dark:bg-violet-950/10">
                    <UserRound className="mx-auto h-5 w-5 text-violet-400" />

                    <p className="mt-2 text-[10px] font-semibold leading-5 text-muted-foreground">
                      Recent recipients will appear here after you complete a transfer.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* History */}

            <PaymentHistoryDrawer
              history={
                paymentHistory
              }
            />

            {/* Protection */}

            <motion.div
              whileHover={{
                y: -3,
              }}
              className="relative overflow-hidden rounded-[26px] border border-violet-900/30 bg-gradient-to-br from-[#21103E] via-[#35206D] to-[#4C2494] p-6 text-white shadow-[0_22px_55px_rgba(76,36,148,.30)]"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-[60px]" />

              <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-indigo-400/15 blur-[55px]" />

              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/35 to-transparent" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <motion.div
                    animate={{
                      y: [
                        0,
                        -3,
                        0,
                      ],
                      rotate: [
                        0,
                        -3,
                        3,
                        0,
                      ],
                    }}
                    transition={{
                      duration:
                        4.4,
                      repeat:
                        Infinity,
                      ease:
                        "easeInOut",
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 text-violet-200 shadow-[0_10px_24px_rgba(0,0,0,.10)] backdrop-blur"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </motion.div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1.5 text-[9px] font-black text-emerald-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    Protected
                  </span>
                </div>

                <h3 className="relative mt-5 text-base font-black tracking-[-0.02em]">
                  Payment protection
                </h3>

                <p className="relative mt-2 text-xs font-medium leading-6 text-white/70">
                  Your transfer is protected with recipient review, password authorization, KYC validation and duplicate-payment protection.
                </p>

                <div className="relative mt-5 grid grid-cols-2 gap-2.5">
                  <ProtectionItem
                    icon={
                      LockKeyhole
                    }
                    label="Authorization"
                    value="Password"
                  />

                  <ProtectionItem
                    icon={
                      Fingerprint
                    }
                    label="Retry safety"
                    value="Idempotent"
                  />
                </div>

                {/* NEW FILL CONTENT */}

                <div className="relative mt-5 grid grid-cols-2 gap-2.5">
                  <SecurityMetric
                    icon={
                      ShieldCheck
                    }
                    title="KYC"
                    value="Verified"
                  />

                  <SecurityMetric
                    icon={
                      CheckCircle2
                    }
                    title="Review"
                    value="Required"
                  />

                  <SecurityMetric
                    icon={
                      QrCode
                    }
                    title="QR"
                    value="Supported"
                  />

                  <SecurityMetric
                    icon={Zap}
                    title="Processing"
                    value="Server-side"
                  />
                </div>

                <div className="relative mt-4 rounded-[15px] border border-white/10 bg-white/[0.05] p-3.5">
                  <div className="flex items-start gap-2.5">
                    <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-200" />

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-200/65">
                        Secure transfer engine
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-white/45">
                        Recipient, amount and authorization are checked before the transfer reaches the wallet ledger.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-violet-300/0 via-violet-200/80 to-fuchsia-300/0"
                    animate={{
                      x: [
                        "-120%",
                        "320%",
                      ],
                    }}
                    transition={{
                      duration:
                        2.8,
                      repeat:
                        Infinity,
                      repeatDelay:
                        1.2,
                      ease:
                        "easeInOut",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.aside>
        </section>
      </div>

      {/* =====================================================
          QR MODAL
      ===================================================== */}

      <AnimatePresence>
        {qrScannerOpen && (
          <QRScannerModal
            loading={
              qrScannerLoading
            }
            errorMessage={
              qrScannerError
            }
            onClose={() =>
              void closeQRScanner()
            }
            onRetry={() => {
              setQrScannerError(
                ""
              );

              void stopQRScanner().then(
                () => {
                  void startQRScanner();
                }
              );
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   KYC CHECKING
========================================================= */

function KYCCheckingState() {
  return (
    <main className="mx-auto flex min-h-[68vh] w-full max-w-[760px] items-center justify-center px-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="w-full rounded-[30px] border border-border bg-card p-8 text-center shadow-[var(--dashboard-shadow)]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>

        <h1 className="mt-5 text-xl font-black">
          Checking verification
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Confirming your KYC status before opening the secure transfer workspace.
        </p>
      </motion.div>
    </main>
  );
}

/* =========================================================
   KYC REQUIRED
========================================================= */

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
    getKYCGuardContent(
      status
    );

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
          duration:
            0.42,
        }}
        className="relative w-full overflow-hidden rounded-[32px] border border-violet-200 bg-card p-7 text-center shadow-[0_24px_70px_rgba(76,36,148,.10)] sm:p-9"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-300/10 blur-[80px]" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[21px] border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-300">
            {errorMessage ? (
              <X className="h-7 w-7" />
            ) : (
              <ShieldCheck className="h-7 w-7" />
            )}
          </div>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-700 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300">
            <LockKeyhole className="h-3.5 w-3.5" />
            Protected financial action
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-[-0.03em]">
            {errorMessage
              ? "Verification check unavailable"
              : content.title}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            {errorMessage ||
              content.description}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {errorMessage ? (
              <button
                type="button"
                onClick={
                  onRetry
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[15px] bg-violet-700 px-5 text-xs font-black text-white transition hover:bg-violet-800"
              >
                <RefreshIcon />
                Check Again
              </button>
            ) : (
              <Link
                href="/dashboard/kyc"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-violet-700 to-indigo-600 px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(109,40,217,.18)] transition hover:brightness-105"
              >
                <ShieldCheck className="h-4 w-4" />

                {
                  content.cta
                }

                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/dashboard/wallet"
              className="inline-flex h-12 items-center justify-center rounded-[15px] border border-border bg-background px-5 text-xs font-black text-muted-foreground transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/20"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

/* =========================================================
   KYC CONTENT
========================================================= */

function getKYCGuardContent(
  status: KYCStatus | null
): {
  title: string;
  description: string;
  cta: string;
} {
  switch (
    status
  ) {
    case "pending":
    case "under_review":
      return {
        title:
          "KYC is under review",

        description:
          "Your identity documents have been submitted. Send Money will unlock after your verification is approved.",

        cta:
          "View Verification Status",
      };

    case "rejected":
      return {
        title:
          "KYC needs resubmission",

        description:
          "Your previous verification was not approved. Review your KYC information and resubmit the required documents.",

        cta:
          "Review & Resubmit",
      };

    case "not_started":
    default:
      return {
        title:
          "Complete KYC to send money",

        description:
          "Identity verification is required before money can be transferred from your wallet.",

        cta:
          "Start Verification",
      };
  }
}

/* =========================================================
   HERO
========================================================= */

function TransferHeroCard({
  onScanQR,
  scannedRecipient,
}: {
  onScanQR: () => void;
  scannedRecipient:
    | ParsedQRRecipient
    | null;
}) {
  return (
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
        duration:
          0.55,
      }}
      className="group relative isolate min-h-[250px] overflow-hidden rounded-[30px] border border-border bg-card p-5 text-card-foreground shadow-[var(--dashboard-shadow)] sm:p-7 lg:p-8"
    >
      <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-violet-500/10 blur-[85px]" />

      <div className="pointer-events-none absolute -bottom-28 right-[16%] h-64 w-64 rounded-full bg-indigo-500/10 blur-[90px]" />

      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <motion.div
        aria-hidden
        animate={{
          x: [
            0,
            18,
            0,
          ],
          opacity: [
            0.15,
            0.45,
            0.15,
          ],
        }}
        transition={{
          duration:
            6,
          repeat:
            Infinity,
          ease:
            "easeInOut",
        }}
        className="pointer-events-none absolute right-[31%] top-8 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,.35)]"
      />

      <div className="relative z-10 grid h-full items-center gap-7 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-700 shadow-sm dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                <Send className="h-3 w-3" />
              </span>

              Secure transfer
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1.5 text-[9px] font-black text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Protected
            </span>
          </div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.5,
              delay:
                0.12,
            }}
            className="mt-4 max-w-[610px] text-[34px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[40px] lg:text-[43px]"
          >
            Send money with{" "}
            <span className="relative ml-2 inline-block bg-gradient-to-r from-violet-700 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              confidence.

              <motion.span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-transparent"
                initial={{
                  scaleX: 0,
                  opacity: 0,
                }}
                animate={{
                  scaleX: 1,
                  opacity: 1,
                }}
                transition={{
                  delay:
                    0.45,
                  duration:
                    0.75,
                }}
              />
            </span>
          </motion.h1>

          <p className="mt-3 max-w-xl text-[13px] font-medium leading-6 text-muted-foreground sm:text-sm">
            Send by mobile number, email, wallet ID, or scan a Coffer QR code. The transfer stays protected by KYC, password confirmation and retry-safe processing.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <HeroAction
              icon={
                QrCode
              }
              label="Scan recipient QR"
              onClick={
                onScanQR
              }
            />

            {scannedRecipient && (
              <span className="inline-flex max-w-[270px] items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                QR recipient selected
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <FeaturePill
              icon={
                ShieldCheck
              }
              text="Protected session"
              tone="green"
            />

            <FeaturePill
              icon={
                Fingerprint
              }
              text="Retry-safe payment"
              tone="violet"
            />

            <FeaturePill
              icon={
                QrCode
              }
              text="QR recipient scan"
              tone="violet"
            />
          </div>
        </div>

        <div className="relative hidden h-[178px] md:block">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration:
                0.5,
              delay:
                0.16,
            }}
            className="absolute inset-0 overflow-hidden rounded-[24px] border border-border bg-background/80 p-4 shadow-[var(--dashboard-shadow)] backdrop-blur-xl"
          >
            <div className="relative flex items-center justify-between">
              <FlowIcon
                icon={
                  WalletCards
                }
                active
              />

              <motion.div
                animate={{
                  x: [
                    0,
                    5,
                    0,
                  ],
                }}
                transition={{
                  duration:
                    2.1,
                  repeat:
                    Infinity,
                  ease:
                    "easeInOut",
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300"
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>

              <FlowIcon
                icon={
                  QrCode
                }
                success
              />
            </div>

            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                animate={{
                  width: [
                    "12%",
                    "100%",
                    "12%",
                  ],
                }}
                transition={{
                  duration:
                    4.2,
                  repeat:
                    Infinity,
                  ease:
                    "easeInOut",
                }}
              />
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <FlowMiniCard
                label="Recipient"
                value="QR / Wallet"
                icon={
                  QrCode
                }
              />

              <FlowMiniCard
                label="Protection"
                value="Duplicate safe"
                icon={
                  Zap
                }
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* =========================================================
   HERO ACTION
========================================================= */

function HeroAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale:
          0.98,
      }}
      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-[10px] font-black text-violet-700 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-300 dark:hover:bg-violet-950/40"
    >
      <Icon className="h-3.5 w-3.5" />

      {label}
    </motion.button>
  );
}

/* =========================================================
   FEATURE PILL
========================================================= */

function FeaturePill({
  icon: Icon,
  text,
  tone,
}: {
  icon: ElementType;
  text: string;
  tone:
    | "green"
    | "violet";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
        tone ===
        "green"
          ? "text-emerald-600 dark:text-emerald-300"
          : "text-muted-foreground"
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${
          tone ===
          "green"
            ? "text-emerald-500"
            : "text-violet-600 dark:text-violet-300"
        }`}
      />

      {text}
    </span>
  );
}

/* =========================================================
   FLOW ICON
========================================================= */

function FlowIcon({
  icon: Icon,
  active = false,
  success = false,
}: {
  icon: ElementType;
  active?: boolean;
  success?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        scale:
          1.04,
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-[13px] border ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          : active
            ? "border-transparent bg-gradient-to-br from-violet-700 to-indigo-600 text-white shadow-[0_8px_20px_rgba(109,40,217,.20)]"
            : "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </motion.div>
  );
}

/* =========================================================
   FLOW MINI
========================================================= */

function FlowMiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ElementType;
}) {
  return (
    <div className="rounded-[12px] bg-violet-50/70 px-3 py-2.5 dark:bg-violet-950/20">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 flex items-center gap-1 text-[10px] font-black">
        {Icon && (
          <Icon className="h-3 w-3 text-violet-600 dark:text-violet-300" />
        )}

        {value}
      </p>
    </div>
  );
}

/* =========================================================
   BALANCE REVEAL CARD
========================================================= */

function BalanceRevealCard({
  balanceLoading,
  formattedBalance,
  showBalance,
  onToggle,
  currentBalance,
  transferAmount,
}: {
  balanceLoading: boolean;
  formattedBalance: string;
  showBalance: boolean;
  onToggle: () => void;
  currentBalance: number;
  transferAmount: number;
}) {
  const safeTransferAmount =
    Number.isFinite(
      transferAmount
    ) &&
    transferAmount > 0
      ? transferAmount
      : 0;

  const remainingBalance =
    Math.max(
      0,
      currentBalance -
        safeTransferAmount
    );

  const percentage =
    currentBalance >
      0 &&
    safeTransferAmount >
      0
      ? Math.min(
          100,
          (safeTransferAmount /
            currentBalance) *
            100
        )
      : 0;

  const hasTransfer =
    safeTransferAmount >
    0;

  return (
    <motion.section
      whileHover={{
        y: -4,
      }}
      className="relative min-h-[250px] w-full overflow-hidden rounded-[30px] border border-violet-900/30 bg-gradient-to-br from-[#241047] via-[#35206F] to-[#4C2494] p-5 text-white shadow-[0_26px_70px_rgba(76,36,148,.30)] sm:p-7"
    >
      <div className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-violet-400/20 blur-[90px]" />

      <div className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-indigo-400/15 blur-[90px]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/50 to-transparent" />

      <div className="relative z-10 flex min-h-[216px] flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate:
                  5,
                scale:
                  1.04,
              }}
              className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-violet-200/10 bg-violet-400/10 text-violet-200 shadow-[0_10px_26px_rgba(0,0,0,.12)]"
            >
              <WalletCards className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200">
                Available balance
              </p>

              <p className="mt-1 text-[11px] font-semibold text-white/60">
                Coffer wallet · BDT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-label={
              showBalance
                ? "Hide balance"
                : "Reveal balance"
            }
            className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/10 bg-white/10 text-violet-100 backdrop-blur transition hover:bg-white/15"
          >
            {showBalance ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-6">
          {balanceLoading ? (
            <div className="flex h-[72px] items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.05] px-4">
              <Loader2 className="h-5 w-5 animate-spin text-violet-200" />

              <span className="text-xs font-bold text-white/60">
                Syncing balance...
              </span>
            </div>
          ) : (
            <AnimatePresence
              mode="wait"
              initial={
                false
              }
            >
              {showBalance ? (
                <motion.div
                  key="balance"
                  initial={{
                    opacity: 0,
                    y: 18,
                    filter:
                      "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter:
                      "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: -18,
                    filter:
                      "blur(10px)",
                  }}
                  className="min-h-[72px] flex items-center"
                >
                  <span className="max-w-full whitespace-nowrap bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-[34px] font-black leading-none tracking-[-0.05em] text-transparent sm:text-[40px]"
                  >
                    {formattedBalance}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="hidden"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className="flex h-[72px] items-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4"
                >
                  <div className="flex gap-2">
                    {[
                      0,
                      1,
                      2,
                      3,
                      4,
                    ].map(
                      (
                        item
                      ) => (
                        <motion.span
                          key={
                            item
                          }
                          className="w-2 rounded-full bg-violet-200"
                          animate={{
                            height:
                              [
                                8,
                                18,
                                8,
                              ],
                            opacity:
                              [
                                0.35,
                                1,
                                0.35,
                              ],
                          }}
                          transition={{
                            duration:
                              1.25,
                            repeat:
                              Infinity,
                            delay:
                              item *
                              0.08,
                          }}
                        />
                      )
                    )}
                  </div>

                  <span className="ml-auto text-[9px] font-black uppercase tracking-[0.14em] text-violet-200">
                    Tap to reveal
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* LIVE BALANCE BREAKDOWN */}

        <AnimatePresence>
          {hasTransfer &&
            showBalance && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                className="mt-4 rounded-[19px] border border-violet-300/15 bg-white/[0.06] p-3.5 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.13em] text-violet-200/55">
                      After this transfer
                    </p>

                    <p className="mt-1 text-lg font-black text-white">
                      {formatCurrency(
                        remainingBalance
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.13em] text-violet-200/55">
                      Sending
                    </p>

                    <p className="mt-1 text-sm font-black text-violet-200">
                      -{" "}
                      {formatCurrency(
                        safeTransferAmount
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${percentage}%`,
                    }}
                    transition={{
                      duration:
                        0.35,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[8px] font-semibold text-violet-100/45">
                  <span>
                    Current balance
                  </span>

                  <span>
                    {percentage.toFixed(
                      1
                    )}
                    % used
                  </span>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-white/45">
              <LockKeyhole className="h-3 w-3 text-violet-200" />

              {showBalance
                ? "Tap again to hide"
                : "Privacy mode is active"}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Wallet active
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* =========================================================
   SECURITY METRIC
========================================================= */

function SecurityMetric({
  icon: Icon,
  title,
  value,
}: {
  icon: ElementType;
  title: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-[14px] border border-white/10 bg-white/[0.055] px-3 py-3 transition hover:bg-white/[0.08]"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white/40">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-black text-white/85">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PROTECTION ITEM
========================================================= */

function ProtectionItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -1,
      }}
      className="rounded-[14px] border border-white/10 bg-white/[0.07] px-3 py-3 backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-violet-200">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.11em] text-white/50">
            {label}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-black text-white/85">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   BALANCE METRIC
========================================================= */

function BalanceMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-violet-200 bg-card p-3 dark:border-violet-900">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-black ${
          highlight
            ? "text-violet-700 dark:text-violet-300"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
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
      <SheetTrigger
        asChild
      >
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-4 rounded-[22px] border border-border bg-card p-4 text-left shadow-[var(--dashboard-shadow)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/30 dark:hover:bg-violet-950/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <History className="h-[19px] w-[19px]" />
            </div>

            <div>
              <p className="text-xs font-black">
                Payment history
              </p>

              <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">
                {history.length >
                0
                  ? `${history.length} confirmed payment${
                      history.length >
                      1
                        ? "s"
                        : ""
                    }`
                  : "View recent payment activity"}
              </p>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-violet-100 bg-background p-0 sm:max-w-[470px]"
      >
        <SheetHeader className="sticky top-0 z-20 border-b border-border bg-card/95 px-5 py-5 text-left backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <ReceiptText className="h-5 w-5" />
            </div>

            <div>
              <SheetTitle className="text-base font-black tracking-[-0.02em]">
                Payment history
              </SheetTitle>

              <SheetDescription className="mt-1 text-[10px] leading-5">
                Confirmed transfers completed from this payment screen.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 sm:p-5">
          {history.length >
          0 ? (
            <div className="space-y-3">
              {history.map(
                (
                  item,
                  index
                ) => (
                  <motion.div
                    key={
                      item.id
                    }
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.04,
                    }}
                    className="rounded-[18px] border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 to-indigo-500 text-xs font-black text-white">
                          {getInitial(
                            item.recipient
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-black">
                            {
                              item.recipient
                            }
                          </p>

                          <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">
                            {formatPaymentTime(
                              item.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black">
                          -{formatCurrency(
                            item.amount
                          )}
                        </p>

                        <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300">
                          {
                            item.status
                          }
                        </span>
                      </div>
                    </div>

                    {item.note && (
                      <div className="mt-3 rounded-[12px] bg-violet-50/50 px-3 py-2 text-[10px] font-medium leading-5 text-muted-foreground dark:bg-violet-950/10">
                        {
                          item.note
                        }
                      </div>
                    )}
                  </motion.div>
                )
              )}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-200 bg-violet-50 text-violet-500 shadow-sm dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300">
                <History className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-sm font-black">
                No payments yet
              </h3>

              <p className="mt-2 max-w-xs text-[11px] leading-6 text-muted-foreground">
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
   TRANSFER INFO
========================================================= */

function TransferInfoStrip() {
  const items = [
    {
      icon:
        CheckCircle2,
      title:
        "Review before sending",
      text:
        "Recipient and amount are confirmed on the next step.",
    },

    {
      icon:
        ShieldCheck,
      title:
        "Secure authorization",
      text:
        "Your password is used only to authorize the payment.",
    },

    {
      icon:
        QrCode,
      title:
        "QR ready",
      text:
        "Scan a Coffer receive QR to fill the recipient automatically.",
    },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          0.4,
      }}
      className="rounded-[22px] border border-border bg-violet-50/40 p-4 dark:bg-violet-950/10 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            Before you send
          </p>

          <h3 className="mt-1 text-sm font-black">
            A safer transfer, step by step
          </h3>
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
          Protected flow
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {items.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            return (
              <motion.div
                key={
                  item.title
                }
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration:
                    0.3,
                  delay:
                    0.18 +
                    index *
                      0.05,
                }}
                whileHover={{
                  y: -2,
                }}
                className="rounded-[16px] border border-border bg-background/70 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                  <Icon className="h-4 w-4" />
                </div>

                <p className="mt-3 text-[10px] font-black">
                  {
                    item.title
                  }
                </p>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  {
                    item.text
                  }
                </p>
              </motion.div>
            );
          }
        )}
      </div>
    </motion.div>
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
        <label
          htmlFor={
            htmlFor
          }
          className="text-xs font-black"
        >
          {label}
        </label>

        {hint && (
          <span className="text-[9px] font-semibold text-muted-foreground">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   PROGRESS
========================================================= */

function ProgressSteps({
  step,
}: {
  step: 1 | 2 | 3;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] border border-border bg-card p-1.5 shadow-sm">
      <ProgressPill
        number={1}
        label="Details"
        active={
          step >= 1
        }
        current={
          step === 1
        }
      />

      <ChevronRight className="h-3.5 w-3.5 text-violet-300" />

      <ProgressPill
        number={2}
        label="Verify"
        active={
          step >= 2
        }
        current={
          step === 2
        }
      />
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
        current
          ? "bg-violet-50 dark:bg-violet-950/20"
          : ""
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-[8px] text-[9px] font-black ${
          active
            ? "bg-gradient-to-br from-violet-700 to-indigo-600 text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {number}
      </span>

      <span
        className={`hidden text-[9px] font-black sm:inline ${
          active
            ? "text-foreground"
            : "text-muted-foreground"
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
    <div className="rounded-[16px] border border-border bg-background/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 break-all text-xs font-black leading-5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QR SCANNER MODAL
========================================================= */

function QRScannerModal({
  loading,
  errorMessage,
  onClose,
  onRetry,
}: {
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
    >
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
        transition={{
          duration:
            0.25,
        }}
        className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-violet-900/30 bg-card shadow-[0_30px_90px_rgba(76,36,148,.30)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#241047] via-[#35206F] to-[#4C2494] p-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <QrCode className="h-5 w-5 text-violet-200" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/60">
                  Secure recipient scanner
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Scan Coffer QR
                </h2>

                <p className="mt-1 text-xs leading-5 text-violet-100/70">
                  Point your camera at the recipient&apos;s Coffer QR code.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              aria-label="Close QR scanner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="relative overflow-hidden rounded-[26px] border border-violet-900/20 bg-slate-950">
            <div
              id="coffer-qr-reader"
              className="min-h-[340px] w-full overflow-hidden"
            />

            {!errorMessage &&
              !loading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-60 w-60">
                    <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-violet-300" />

                    <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-violet-300" />

                    <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-violet-300" />

                    <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-violet-300" />

                    <motion.div
                      animate={{
                        y: [
                          8,
                          225,
                          8,
                        ],
                      }}
                      transition={{
                        duration:
                          2.2,
                        repeat:
                          Infinity,
                        ease:
                          "easeInOut",
                      }}
                      className="absolute left-3 right-3 top-0 h-0.5 bg-violet-300 shadow-[0_0_16px_rgba(196,181,253,.85)]"
                    />
                  </div>
                </div>
              )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-violet-200">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>

                  <p className="mt-4 text-sm font-black text-white">
                    Starting camera...
                  </p>

                  <p className="mt-1 max-w-xs text-[10px] leading-5 text-white/60">
                    Please allow camera access when your browser asks.
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"
            >
              <div className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                <div className="min-w-0">
                  <p className="text-xs font-black text-rose-800">
                    QR scanner unavailable
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-rose-700">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  onRetry
                }
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-black text-white transition hover:bg-violet-800"
              >
                <QrCode className="h-4 w-4" />
                Try scanner again
              </button>
            </motion.div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ScannerInfo
              icon={
                ShieldCheck
              }
              title="Secure"
              text="Only recipient data is read."
            />

            <ScannerInfo
              icon={
                Fingerprint
              }
              title="Private"
              text="No password or PIN is scanned."
            />

            <ScannerInfo
              icon={
                CheckCircle2
              }
              title="Protected"
              text="Normal transfer security still applies."
            />
          </div>

          <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-900 dark:bg-violet-950/15">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />

              <p className="text-[10px] leading-5 text-muted-foreground">
                Scan a QR generated by your Coffer Receive Money page. The recipient will be inserted into the transfer form automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="mt-5 h-12 w-full rounded-2xl border border-border bg-background text-xs font-black text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   SCANNER INFO
========================================================= */

function ScannerInfo({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/15">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm dark:bg-violet-950/30 dark:text-violet-300">
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-2 text-[10px] font-black">
        {title}
      </p>

      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getInitial(
  value: string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return "U";
  }

  if (
    cleaned.includes(
      "@"
    )
  ) {
    return cleaned
      .charAt(0)
      .toUpperCase();
  }

  const digits =
    cleaned.replace(
      /\D/g,
      ""
    );

  if (
    digits.length >= 2
  ) {
    return digits.slice(
      -2
    );
  }

  return cleaned
    .charAt(0)
    .toUpperCase();
}

function formatPaymentTime(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Just now";
  }

  return date.toLocaleString(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   SMALL ICON
========================================================= */

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11a8.1 8.1 0 0 0-14.9-4L3 10m0 0V5m0 5h5M4 13a8.1 8.1 0 0 0 14.9 4L21 14m0 0v5m0-5h-5"
      />
    </svg>
  );
}