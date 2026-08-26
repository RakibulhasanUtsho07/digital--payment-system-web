"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import {
  AnimatePresence,
  motion,
  useAnimation,
} from "framer-motion";

import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
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

const quickAmounts = [
  100,
  500,
  1000,
  5000,
];

const recentContacts = [
  {
    name: "Rakibul Islam",
    phone: "017XX-XXXXXX",
    initial: "RI",
    gradient:
      "from-blue-500 to-sky-400",
    glow:
      "shadow-blue-500/20",
  },
  {
    name: "Anisur Rahman",
    phone: "019XX-XXXXXX",
    initial: "AR",
    gradient:
      "from-emerald-500 to-teal-400",
    glow:
      "shadow-emerald-500/20",
  },
  {
    name: "Jahid Hasan",
    phone: "018XX-XXXXXX",
    initial: "JH",
    gradient:
      "from-violet-500 to-fuchsia-400",
    glow:
      "shadow-violet-500/20",
  },
];

/* =========================================================
   MOTION
========================================================= */

const stepVariants = {
  enter: (
    direction: number
  ) => ({
    opacity: 0,
    x:
      direction *
      35,
    filter:
      "blur(5px)",
  }),

  center: {
    opacity: 1,
    x: 0,
    filter:
      "blur(0px)",
  },

  exit: (
    direction: number
  ) => ({
    opacity: 0,
    x:
      direction *
      -35,
    filter:
      "blur(5px)",
  }),
};

/* =========================================================
   PAGE
========================================================= */

export default function SendMoneyPage() {
  const [
    step,
    setStep,
  ] =
    useState<
      1 | 2 | 3
    >(1);

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
    pin,
    setPin,
  ] = useState<
    string[]
  >([
    "",
    "",
    "",
    "",
  ]);

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
  ] =
    useState<
      number | null
    >(null);

  const [
    balanceLoading,
    setBalanceLoading,
  ] = useState(true);

  const [
    showBalance,
    setShowBalance,
  ] = useState(true);

  const pinValue =
    pin.join("");

  const pinControls =
    useAnimation();

  /* =========================================================
     LOAD BALANCE
  ========================================================== */

  useEffect(() => {
    const loadBalance =
      async () => {
        try {
          setBalanceLoading(
            true
          );

          const data =
            await apiClient<WalletBalanceResponse>(
              "/wallet"
            );

          if (
            data?.success &&
            data.wallet
          ) {
            setBalance(
              Number(
                data.wallet
                  .balance
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
      };

    void loadBalance();
  }, []);

  /* =========================================================
     VALIDATION
  ========================================================== */

  const numericAmount =
    Number(amount);

  const isRecipientValid =
    recipient
      .trim()
      .length >= 3;

  const isAmountValid =
    amount.trim() !==
      "" &&
    Number.isFinite(
      numericAmount
    ) &&
    numericAmount > 0 &&
    (
      balance ===
        null ||
      numericAmount <=
        balance
    );

  /* =========================================================
     STEP NAVIGATION
  ========================================================== */

  const goToStep = (
    next:
      | 1
      | 2
      | 3
  ) => {
    setDirection(
      next > step
        ? 1
        : -1
    );

    setStep(next);
  };

  const handleNext =
    () => {
      setErrorMessage(
        ""
      );

      if (
        !isRecipientValid
      ) {
        setErrorMessage(
          "Enter a valid mobile number or email for the recipient."
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

  /* =========================================================
     SEND
  ========================================================== */

  const handleSend =
    async () => {
      if (
        pinValue.length <
        4
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

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

              body:
                JSON.stringify(
                  {
                    recipient:
                      recipient.trim(),

                    amount:
                      numericAmount,

                    note:
                      note.trim() ||
                      undefined,

                    pin:
                      pinValue,
                  }
                ),
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

        goToStep(3);

        void (async () => {
          try {
            const fresh =
              await apiClient<WalletBalanceResponse>(
                "/wallet"
              );

            if (
              fresh?.success &&
              fresh.wallet
            ) {
              setBalance(
                Number(
                  fresh
                    .wallet
                    .balance
                ) || 0
              );
            }
          } catch {
            // Non-fatal refresh error
          }
        })();
      } catch (
        error
      ) {
        setErrorMessage(
          error instanceof
            Error
            ? error.message
            : "Transfer failed. Please try again."
        );

        setPin([
          "",
          "",
          "",
          "",
        ]);

        void pinControls.start(
          {
            x: [
              0,
              -10,
              10,
              -10,
              10,
              0,
            ],

            transition: {
              duration:
                0.4,
            },
          }
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  /* =========================================================
     RESET
  ========================================================== */

  const handleReset =
    () => {
      goToStep(1);

      setAmount("");

      setRecipient("");

      setPin([
        "",
        "",
        "",
        "",
      ]);

      setNote("");

      setErrorMessage(
        ""
      );
    };

  const formattedBalance =
    formatCurrency(
      balance ?? 0
    );

  /* =========================================================
     RETURN
  ========================================================== */

  return (
    <div
      className="
        relative
        mx-auto
        w-full
        max-w-[1380px]
        pb-8
      "
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-16
          h-[320px]
          w-[320px]
          rounded-full
          bg-blue-400/[0.06]
          blur-[100px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-48
          h-[300px]
          w-[300px]
          rounded-full
          bg-cyan-400/[0.05]
          blur-[100px]
        "
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: -14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="
          relative
          z-10
          mb-6
          flex
          flex-col
          gap-4
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        {/* Header text */}

        <div>
          <div
            className="
              mb-2
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-blue-100
              bg-blue-50/80
              px-3
              py-1.5
            "
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />

            <span
              className="
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.17em]
                text-blue-700
              "
            >
              Smart Transfer
            </span>
          </div>

          <h1
            className="
              text-2xl
              font-black
              tracking-[-0.04em]
              text-[#102A43]
              sm:text-3xl
              xl:text-[34px]
            "
          >
            Send Money
          </h1>

          <p
            className="
              mt-1.5
              max-w-xl
              text-xs
              font-medium
              leading-6
              text-slate-500
              sm:text-sm
            "
          >
            Transfer funds
            quickly and
            securely from
            your NovaWallet
            account.
          </p>
        </div>

        {/* Balance */}

        <motion.div
          whileHover={{
            y: -3,
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 18,
          }}
          className="
            relative
            w-full
            overflow-hidden
            rounded-[22px]
            border
            border-[#DFE9F3]
            bg-white
            px-4
            py-3.5
            shadow-[0_10px_35px_rgba(15,39,69,0.06)]
            sm:w-auto
            sm:min-w-[275px]
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-8
              -top-8
              h-24
              w-24
              rounded-full
              bg-blue-500/[0.08]
              blur-2xl
            "
          />

          <div className="relative flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-[14px]
                bg-gradient-to-br
                from-[#257DD1]
                to-[#15558F]
                text-white
                shadow-[0_8px_20px_rgba(31,94,168,0.20)]
              "
            >
              <WalletCards className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.14em]
                  text-slate-400
                "
              >
                Available Balance
              </p>

              <div className="mt-0.5 flex items-center gap-2">
                {balanceLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : (
                  <AnimatePresence
                    mode="wait"
                    initial={
                      false
                    }
                  >
                    <motion.p
                      key={
                        showBalance
                          ? "visible"
                          : "masked"
                      }
                      initial={{
                        opacity: 0,
                        filter:
                          "blur(5px)",
                      }}
                      animate={{
                        opacity: 1,
                        filter:
                          "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        filter:
                          "blur(5px)",
                      }}
                      transition={{
                        duration:
                          0.2,
                      }}
                      className="
                        truncate
                        text-lg
                        font-black
                        tracking-tight
                        text-[#102A43]
                      "
                    >
                      {showBalance
                        ? formattedBalance
                        : maskCurrency(
                            formattedBalance
                          )}
                    </motion.p>
                  </AnimatePresence>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setShowBalance(
                      (
                        value
                      ) =>
                        !value
                    )
                  }
                  aria-label={
                    showBalance
                      ? "Hide balance"
                      : "Show balance"
                  }
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    transition-all
                    hover:bg-blue-50
                    hover:text-blue-600
                  "
                >
                  {showBalance ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div
        className="
          relative
          z-10
          grid
          grid-cols-1
          items-start
          gap-5
          xl:grid-cols-[minmax(0,1fr)_340px]
          2xl:grid-cols-[minmax(0,1fr)_360px]
          xl:gap-6
        "
      >
        {/* ===================================================
            LEFT — TRANSFER CARD
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 22,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            delay: 0.06,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="
            relative
            min-w-0
            overflow-hidden
            rounded-[28px]
            border
            border-[#E4ECF4]
            bg-white
            shadow-[0_18px_55px_rgba(15,39,69,0.07)]
          "
        >
          {/* Top decoration */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              h-[2px]
              w-[55%]
              -translate-x-1/2
              bg-gradient-to-r
              from-transparent
              via-blue-500
              to-transparent
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-blue-500/[0.045]
              blur-[70px]
            "
          />

          <div
            className="
              relative
              p-5
              sm:p-7
              lg:p-8
              xl:p-9
            "
          >
            {/* STEP HEADER */}

            {step < 3 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="
                        text-[9px]
                        font-extrabold
                        uppercase
                        tracking-[0.17em]
                        text-blue-600
                      "
                    >
                      Transfer Process
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      Step{" "}
                      {step}{" "}
                      of 2
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StepBadge
                      number={1}
                      active={
                        step >=
                        1
                      }
                      label="Details"
                    />

                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                    <StepBadge
                      number={2}
                      active={
                        step >=
                        2
                      }
                      label="Verify"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[1, 2].map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item
                        }
                        className="
                          h-[5px]
                          flex-1
                          overflow-hidden
                          rounded-full
                          bg-[#EDF2F7]
                        "
                      >
                        <motion.div
                          initial={
                            false
                          }
                          animate={{
                            width:
                              step >=
                              item
                                ? "100%"
                                : "0%",
                          }}
                          transition={{
                            duration:
                              0.45,
                            ease: [
                              0.22,
                              1,
                              0.36,
                              1,
                            ],
                          }}
                          className="
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            from-[#2B7FD1]
                            to-[#4CA9EA]
                          "
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ERROR */}

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -6,
                  }}
                  animate={{
                    opacity: 1,
                    height:
                      "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="overflow-hidden"
                >
                  <div
                    className="
                      mb-6
                      rounded-2xl
                      border
                      border-rose-200
                      bg-rose-50
                      px-4
                      py-3
                      text-xs
                      font-bold
                      leading-5
                      text-rose-600
                    "
                  >
                    {
                      errorMessage
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEPS */}

            <AnimatePresence
              mode="wait"
              custom={
                direction
              }
            >
              {/* =========================
                  STEP 1
              ========================== */}

              {step === 1 && (
                <motion.div
                  key="step-1"
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

                    ease: [
                      0.16,
                      1,
                      0.3,
                      1,
                    ],
                  }}
                  className="space-y-6"
                >
                  {/* Recipient */}

                  <FormField
                    label="Send To"
                    htmlFor="recipient"
                  >
                    <div className="group relative">
                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-0
                          flex
                          items-center
                          pl-4
                          text-slate-400
                          transition-colors
                          group-focus-within:text-blue-600
                        "
                      >
                        <UserRound className="h-[18px] w-[18px]" />
                      </div>

                      <input
                        id="recipient"
                        type="text"
                        placeholder="Enter mobile number or email"
                        value={
                          recipient
                        }
                        onChange={(
                          event
                        ) =>
                          setRecipient(
                            event
                              .target
                              .value
                          )
                        }
                        className="
                          h-[58px]
                          w-full
                          rounded-[16px]
                          border
                          border-[#DDE6EF]
                          bg-[#F8FAFC]
                          pl-12
                          pr-4
                          text-sm
                          font-semibold
                          text-[#253A50]
                          outline-none
                          transition-all
                          placeholder:font-medium
                          placeholder:text-[#9AA9BA]
                          hover:border-[#CAD8E6]
                          focus:border-[#3B8DDA]
                          focus:bg-white
                          focus:ring-4
                          focus:ring-blue-500/[0.08]
                        "
                      />
                    </div>
                  </FormField>

                  {/* Amount */}

                  <FormField
                    label="Amount (৳)"
                    htmlFor="amount"
                  >
                    <div className="group relative">
                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-0
                          flex
                          items-center
                          pl-4
                          text-slate-400
                          transition-colors
                          group-focus-within:text-blue-600
                        "
                      >
                        <Banknote className="h-[18px] w-[18px]" />
                      </div>

                      <input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={
                          amount
                        }
                        onChange={(
                          event
                        ) =>
                          setAmount(
                            event
                              .target
                              .value
                          )
                        }
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
                        className="
                          h-[66px]
                          w-full
                          rounded-[16px]
                          border
                          border-[#DDE6EF]
                          bg-[#F8FAFC]
                          pl-12
                          pr-4
                          text-[24px]
                          font-black
                          tracking-tight
                          text-[#17344D]
                          outline-none
                          transition-all
                          placeholder:font-semibold
                          placeholder:text-[#C4CFDA]
                          hover:border-[#CAD8E6]
                          focus:border-[#3B8DDA]
                          focus:bg-white
                          focus:ring-4
                          focus:ring-blue-500/[0.08]
                        "
                      />
                    </div>

                    {/* Quick Amounts */}

                    <div
                      className="
                        grid
                        grid-cols-2
                        gap-2.5
                        pt-2
                        sm:grid-cols-4
                      "
                    >
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
                              onClick={() =>
                                setAmount(
                                  String(
                                    quickAmount
                                  )
                                )
                              }
                              whileTap={
                                disabled
                                  ? undefined
                                  : {
                                      scale:
                                        0.96,
                                    }
                              }
                              whileHover={
                                disabled
                                  ? undefined
                                  : {
                                      y: -2,
                                    }
                              }
                              className={`
                                h-10
                                rounded-xl
                                border
                                text-xs
                                font-extrabold
                                transition-all

                                ${
                                  disabled
                                    ? "cursor-not-allowed border-[#EDF1F5] bg-[#FAFBFC] text-slate-300"
                                    : active
                                    ? "border-[#3E8FD9] bg-[#EDF6FF] text-[#1F6FB4] shadow-[0_5px_15px_rgba(31,111,180,0.08)]"
                                    : "border-[#E0E8F0] bg-white text-[#66798D] hover:border-[#BFD9F1] hover:bg-[#F5FAFF] hover:text-[#1F6FB4]"
                                }
                              `}
                            >
                              +৳
                              {
                                quickAmount
                              }
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  </FormField>

                  {/* Note */}

                  <FormField
                    label="Reference Note"
                    optional
                    htmlFor="note"
                  >
                    <div className="group relative">
                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-0
                          flex
                          items-center
                          pl-4
                          text-slate-400
                          transition-colors
                          group-focus-within:text-blue-600
                        "
                      >
                        <FileText className="h-[18px] w-[18px]" />
                      </div>

                      <input
                        id="note"
                        type="text"
                        placeholder="What is this transfer for?"
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
                        className="
                          h-[56px]
                          w-full
                          rounded-[16px]
                          border
                          border-[#DDE6EF]
                          bg-[#F8FAFC]
                          pl-12
                          pr-4
                          text-sm
                          font-semibold
                          text-[#253A50]
                          outline-none
                          transition-all
                          placeholder:font-medium
                          placeholder:text-[#9AA9BA]
                          hover:border-[#CAD8E6]
                          focus:border-[#3B8DDA]
                          focus:bg-white
                          focus:ring-4
                          focus:ring-blue-500/[0.08]
                        "
                      />
                    </div>
                  </FormField>

                  {/* Continue */}

                  <motion.button
                    type="button"
                    onClick={
                      handleNext
                    }
                    disabled={
                      !recipient.trim() ||
                      !amount
                    }
                    whileHover={
                      !recipient.trim() ||
                      !amount
                        ? undefined
                        : {
                            y: -2,
                          }
                    }
                    whileTap={{
                      scale:
                        0.985,
                    }}
                    className="
                      group
                      relative
                      flex
                      h-[56px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      overflow-hidden
                      rounded-[16px]
                      bg-gradient-to-r
                      from-[#2478C6]
                      to-[#318DDB]
                      text-sm
                      font-extrabold
                      text-white
                      shadow-[0_12px_30px_rgba(37,120,198,0.20)]
                      transition-all
                      hover:shadow-[0_15px_35px_rgba(37,120,198,0.28)]
                      disabled:cursor-not-allowed
                      disabled:from-[#8FB2E8]
                      disabled:to-[#86A7E4]
                      disabled:shadow-none
                    "
                  >
                    <span
                      className="
                        absolute
                        -left-10
                        top-0
                        h-full
                        w-20
                        -skew-x-12
                        bg-white/10
                        transition-transform
                        duration-700
                        group-hover:translate-x-[650px]
                      "
                    />

                    <span className="relative">
                      Continue to Review
                    </span>

                    <ArrowRight
                      className="
                        relative
                        h-[18px]
                        w-[18px]
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </motion.button>
                </motion.div>
              )}

              {/* =========================
                  STEP 2
              ========================== */}

              {step === 2 && (
                <motion.div
                  key="step-2"
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

                    ease: [
                      0.16,
                      1,
                      0.3,
                      1,
                    ],
                  }}
                  className="space-y-6"
                >
                  <button
                    type="button"
                    onClick={() =>
                      goToStep(
                        1
                      )
                    }
                    className="
                      group
                      flex
                      items-center
                      gap-1.5
                      text-xs
                      font-extrabold
                      text-slate-500
                      transition
                      hover:text-blue-600
                    "
                  >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

                    Edit Details
                  </button>

                  {/* Review card */}

                  <div
                    className="
                      relative
                      overflow-hidden
                      rounded-[22px]
                      border
                      border-[#DFE8F1]
                      bg-gradient-to-br
                      from-[#F8FBFE]
                      to-[#F2F7FC]
                      p-6
                      text-center
                    "
                  >
                    <div
                      className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-0
                        h-24
                        w-56
                        -translate-x-1/2
                        rounded-full
                        bg-blue-500/[0.08]
                        blur-[45px]
                      "
                    />

                    <p className="relative text-xs font-semibold text-slate-500">
                      You are
                      sending
                    </p>

                    <motion.h2
                      initial={{
                        scale:
                          0.96,
                      }}
                      animate={{
                        scale: 1,
                      }}
                      className="
                        relative
                        mt-2
                        text-3xl
                        font-black
                        tracking-[-0.04em]
                        text-[#102A43]
                        sm:text-4xl
                      "
                    >
                      {formatCurrency(
                        numericAmount
                      )}
                    </motion.h2>

                    <div
                      className="
                        relative
                        mx-auto
                        mt-6
                        flex
                        max-w-md
                        items-center
                        justify-center
                        gap-3
                        rounded-2xl
                        border
                        border-white
                        bg-white/80
                        p-3
                        shadow-sm
                        backdrop-blur
                      "
                    >
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-gradient-to-br
                          from-blue-500
                          to-sky-400
                          text-sm
                          font-black
                          text-white
                          shadow-lg
                          shadow-blue-500/15
                        "
                      >
                        {recipient
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-extrabold text-[#193750]">
                          {
                            recipient
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          NovaWallet Recipient
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PIN */}

                  <div
                    className="
                      rounded-[20px]
                      border
                      border-[#E3EAF1]
                      bg-white
                      p-5
                      sm:p-6
                    "
                  >
                    <div className="mb-5 text-center">
                      <div
                        className="
                          mx-auto
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-[14px]
                          bg-[#EEF6FF]
                          text-[#2677C2]
                        "
                      >
                        <LockKeyhole className="h-5 w-5" />
                      </div>

                      <h3 className="mt-3 text-sm font-extrabold text-[#17344D]">
                        Enter Security PIN
                      </h3>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Enter your
                        4-digit PIN
                        to authorize
                        this transfer.
                      </p>
                    </div>

                    <PinInput
                      value={
                        pin
                      }
                      onChange={
                        setPin
                      }
                      controls={
                        pinControls
                      }
                    />
                  </div>

                  <motion.button
                    type="button"
                    onClick={
                      handleSend
                    }
                    disabled={
                      pinValue.length <
                        4 ||
                      isLoading
                    }
                    whileHover={
                      pinValue.length <
                        4 ||
                      isLoading
                        ? undefined
                        : {
                            y: -2,
                          }
                    }
                    whileTap={{
                      scale:
                        0.985,
                    }}
                    className="
                      group
                      flex
                      h-[56px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-[16px]
                      bg-gradient-to-r
                      from-[#1D70BD]
                      to-[#278AD7]
                      text-sm
                      font-extrabold
                      text-white
                      shadow-[0_12px_30px_rgba(31,112,189,0.22)]
                      transition-all
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      disabled:shadow-none
                    "
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />

                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-[18px] w-[18px] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />

                        Confirm &amp;
                        Send
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* =========================
                  SUCCESS
              ========================== */}

              {step === 3 && (
                <motion.div
                  key="step-3"
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
                      0.4,
                  }}
                  className="
                    flex
                    min-h-[470px]
                    flex-col
                    items-center
                    justify-center
                    py-6
                    text-center
                  "
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale:
                        0.55,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      type:
                        "spring",
                      stiffness:
                        250,
                      damping:
                        18,
                    }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        scale: [
                          1,
                          1.45,
                          1,
                        ],

                        opacity: [
                          0.18,
                          0,
                          0.18,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat:
                          Infinity,
                      }}
                      className="
                        absolute
                        -inset-5
                        rounded-full
                        bg-emerald-400/25
                      "
                    />

                    <div
                      className="
                        relative
                        flex
                        h-24
                        w-24
                        items-center
                        justify-center
                        rounded-[28px]
                        bg-emerald-50
                        text-emerald-500
                        shadow-[0_15px_40px_rgba(16,185,129,0.13)]
                      "
                    >
                      <CheckCircle2 className="h-14 w-14" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.16,
                    }}
                    className="mt-6"
                  >
                    <span
                      className="
                        rounded-full
                        bg-emerald-50
                        px-3
                        py-1.5
                        text-[9px]
                        font-extrabold
                        uppercase
                        tracking-[0.15em]
                        text-emerald-600
                      "
                    >
                      Completed
                    </span>

                    <h2
                      className="
                        mt-4
                        text-2xl
                        font-black
                        tracking-tight
                        text-[#102A43]
                      "
                    >
                      Transfer
                      Successful
                    </h2>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-md
                        text-sm
                        leading-6
                        text-slate-500
                      "
                    >
                      You sent{" "}
                      <span className="font-extrabold text-[#17344D]">
                        {formatCurrency(
                          numericAmount
                        )}
                      </span>{" "}
                      to{" "}
                      <span className="font-extrabold text-[#17344D]">
                        {
                          recipient
                        }
                      </span>
                      .
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.24,
                    }}
                    className="
                      mt-8
                      grid
                      w-full
                      max-w-md
                      grid-cols-1
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        handleReset
                      }
                      className="
                        h-12
                        rounded-xl
                        border
                        border-[#DDE6EE]
                        bg-white
                        text-xs
                        font-extrabold
                        text-[#566B80]
                        transition-all
                        hover:border-blue-200
                        hover:bg-blue-50
                        hover:text-blue-700
                      "
                    >
                      Send Another
                    </button>

                    <Link
                      href="/dashboard"
                      className="
                        flex
                        h-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#1F6FB4]
                        text-xs
                        font-extrabold
                        text-white
                        transition-all
                        hover:bg-[#185C96]
                      "
                    >
                      Back to
                      Dashboard
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <motion.aside
          initial={{
            opacity: 0,
            x: 18,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.55,
            delay: 0.14,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="
            space-y-5
            xl:sticky
            xl:top-[100px]
          "
        >
          {/* RECENT CONTACTS */}

          <div
            className="
              overflow-hidden
              rounded-[26px]
              border
              border-[#E3EBF3]
              bg-white
              p-5
              shadow-[0_15px_45px_rgba(15,39,69,0.06)]
              sm:p-6
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-600
                    "
                  >
                    <Clock3 className="h-[17px] w-[17px]" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#17344D]">
                      Recent
                      Transfers
                    </h3>

                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                      Quick
                      recipients
                    </p>
                  </div>
                </div>
              </div>

              <span
                className="
                  rounded-full
                  bg-[#F0F5FA]
                  px-2.5
                  py-1
                  text-[9px]
                  font-extrabold
                  text-slate-500
                "
              >
                {
                  recentContacts.length
                }
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {recentContacts.map(
                (
                  contact,
                  index
                ) => (
                  <motion.button
                    key={
                      contact.phone
                    }
                    type="button"
                    initial={{
                      opacity: 0,
                      x: 12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        0.22 +
                        index *
                          0.07,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    whileTap={{
                      scale:
                        0.98,
                    }}
                    onClick={() =>
                      setRecipient(
                        contact.phone
                      )
                    }
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-[16px]
                      border
                      border-transparent
                      p-2.5
                      text-left
                      transition-all
                      hover:border-[#E0ECF7]
                      hover:bg-[#F7FAFD]
                    "
                  >
                    <div
                      className={`
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-[14px]
                        bg-gradient-to-br
                        ${contact.gradient}
                        text-xs
                        font-black
                        text-white
                        shadow-lg
                        ${contact.glow}
                      `}
                    >
                      {
                        contact.initial
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#203B55] transition-colors group-hover:text-blue-700">
                        {
                          contact.name
                        }
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                        {
                          contact.phone
                        }
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 -translate-x-1 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-blue-500 group-hover:opacity-100" />
                  </motion.button>
                )
              )}
            </div>
          </div>

          {/* SECURITY CARD */}

          <motion.div
            whileHover={{
              y: -4,
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 18,
            }}
            className="
              relative
              overflow-hidden
              rounded-[26px]
              bg-gradient-to-br
              from-[#0E3156]
              via-[#164E82]
              to-[#1D67A8]
              p-6
              text-white
              shadow-[0_20px_45px_rgba(20,78,130,0.22)]
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-14
                -top-14
                h-40
                w-40
                rounded-full
                border
                border-white/10
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -right-6
                -top-6
                h-24
                w-24
                rounded-full
                border
                border-white/10
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-20
                -left-10
                h-40
                w-40
                rounded-full
                bg-sky-300/10
                blur-[45px]
              "
            />

            <div
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-[14px]
                border
                border-white/10
                bg-white/10
                backdrop-blur
              "
            >
              <ShieldCheck className="h-5 w-5 text-sky-200" />
            </div>

            <h3 className="relative mt-5 text-base font-extrabold">
              Secure
              Transfer
            </h3>

            <p
              className="
                relative
                mt-2
                text-xs
                font-medium
                leading-6
                text-blue-100/90
              "
            >
              Your transfer
              is protected
              through secure
              authentication.
              Keep your PIN
              private.
            </p>

            <div
              className="
                relative
                mt-5
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.07]
                px-3
                py-2.5
              "
            >
              <LockKeyhole className="h-3.5 w-3.5 text-sky-200" />

              <span
                className="
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.13em]
                  text-blue-100
                "
              >
                Protected session
              </span>
            </div>
          </motion.div>
        </motion.aside>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={
            htmlFor
          }
          className="
            text-xs
            font-extrabold
            text-[#304A62]
          "
        >
          {label}
        </label>

        {optional && (
          <span
            className="
              rounded-md
              bg-slate-100
              px-2
              py-1
              text-[8px]
              font-extrabold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Optional
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   STEP BADGE
========================================================= */

function StepBadge({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        animate={{
          backgroundColor:
            active
              ? "#1F6FB4"
              : "#EEF2F6",

          color:
            active
              ? "#FFFFFF"
              : "#94A3B8",
        }}
        className="
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-lg
          text-[9px]
          font-black
        "
      >
        {number}
      </motion.span>

      <span
        className={`
          hidden
          text-[9px]
          font-extrabold
          sm:inline

          ${
            active
              ? "text-[#31506C]"
              : "text-slate-400"
          }
        `}
      >
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   PIN INPUT
========================================================= */

function PinInput({
  value,
  onChange,
  controls,
}: {
  value: string[];

  onChange: (
    next: string[]
  ) => void;

  controls:
    ReturnType<
      typeof useAnimation
    >;
}) {
  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const handleChange = (
    index: number,
    raw: string
  ) => {
    const digit =
      raw
        .replace(
          /\D/g,
          ""
        )
        .slice(-1);

    const next = [
      ...value,
    ];

    next[index] =
      digit;

    onChange(next);

    if (
      digit &&
      index <
        value.length -
          1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const handleKeyDown =
    (
      index: number,
      event:
        KeyboardEvent<HTMLInputElement>
    ) => {
      if (
        event.key ===
          "Backspace" &&
        !value[index] &&
        index > 0
      ) {
        inputRefs.current[
          index - 1
        ]?.focus();
      }
    };

  return (
    <motion.div
      animate={
        controls
      }
      className="
        flex
        items-center
        justify-center
        gap-2.5
        sm:gap-3
      "
    >
      {value.map(
        (
          digit,
          index
        ) => (
          <motion.input
            key={
              index
            }
            ref={(
              element
            ) => {
              inputRefs.current[
                index
              ] =
                element;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={
              digit
            }
            aria-label={`PIN digit ${
              index +
              1
            }`}
            animate={
              digit
                ? {
                    scale: [
                      1,
                      1.08,
                      1,
                    ],
                  }
                : {
                    scale: 1,
                  }
            }
            transition={{
              duration:
                0.18,
            }}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              handleChange(
                index,
                event
                  .target
                  .value
              )
            }
            onKeyDown={(
              event
            ) =>
              handleKeyDown(
                index,
                event
              )
            }
            className={`
              h-[58px]
              w-[58px]
              rounded-[16px]
              border
              text-center
              text-xl
              font-black
              text-[#18364F]
              outline-none
              transition-all
              focus:ring-4

              sm:h-16
              sm:w-16

              ${
                digit
                  ? "border-blue-500 bg-blue-50 shadow-[0_7px_18px_rgba(59,130,246,0.08)] focus:ring-blue-500/10"
                  : "border-[#DCE5EE] bg-[#F8FAFC] focus:border-blue-500 focus:bg-white focus:ring-blue-500/10"
              }
            `}
          />
        )
      )}
    </motion.div>
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
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

function maskCurrency(
  formatted: string
): string {
  return formatted.replace(
    /[0-9]/g,
    "•"
  );
}