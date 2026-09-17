"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  createMerchantRefund,
  type MerchantRefund,
  type MerchantRefundMode,
} from "@/lib/api/merchantRefundApi";

/* =========================================================
   TYPES
========================================================= */

interface IssueRefundButtonProps {
  paymentId: string;
  paymentAmount: number;
  currency: string;
  status?: string;
  sourceType?: string;
  provider?: string;
  mode?: string;

  onCompleted?: (
    refund:
      MerchantRefund
  ) => void;
}

/* =========================================================
   HELPERS
========================================================= */

function createRequestId(): string {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return `refund_${crypto.randomUUID()}`;
  }

  return `refund_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =========================================================
   PURPLE BACKGROUND
========================================================= */

function PurpleModalBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 32%,#6D28D9 62%,#9333EA 100%)",
        }}
      />

      <motion.div
        animate={{
          x: [
            0,
            70,
            0,
          ],
          y: [
            0,
            25,
            0,
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="
          pointer-events-none
          absolute
          -left-20
          -top-24
          h-56
          w-56
          rounded-full
          bg-fuchsia-400/30
          blur-[70px]
        "
      />

      <motion.div
        animate={{
          scale: [
            1,
            1.2,
            1,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="
          pointer-events-none
          absolute
          -bottom-28
          right-[-30px]
          h-64
          w-64
          rounded-full
          bg-violet-300/25
          blur-[80px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.07]
          [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]
          [background-size:22px_22px]
        "
      />
    </>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function IssueRefundButton({
  paymentId,
  paymentAmount,
  currency,
  status,
  sourceType,
  provider,
  mode,
  onCompleted,
}: IssueRefundButtonProps) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    amount,
    setAmount,
  ] =
    useState(
      paymentAmount.toFixed(
        2
      )
    );

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    merchantReference,
    setMerchantReference,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    createdRefund,
    setCreatedRefund,
  ] =
    useState<MerchantRefund | null>(
      null
    );

  const normalizedStatus =
    status?.toLowerCase();

  const normalizedSource =
    sourceType?.toLowerCase();

  const normalizedProvider =
    provider?.toLowerCase();

  const refundable =
    normalizedStatus ===
      "completed" &&
    normalizedSource ===
      "wallet" &&
    (
      normalizedProvider ===
        "damo_wallet" ||
      normalizedProvider ===
        "coffer_wallet"
    );

  if (
    !refundable
  ) {
    return null;
  }

  const normalizedMode:
    MerchantRefundMode =
    mode?.toLowerCase() ===
    "live"
      ? "live"
      : "test";

  const openModal =
    () => {
      setAmount(
        paymentAmount.toFixed(
          2
        )
      );

      setReason(
        ""
      );

      setMerchantReference(
        ""
      );

      setError(
        ""
      );

      setCreatedRefund(
        null
      );

      setOpen(
        true
      );
    };

  const closeModal =
    () => {
      if (
        submitting
      ) {
        return;
      }

      setOpen(
        false
      );
    };

  const submitRefund =
    async () => {
      const numericAmount =
        Number(
          amount
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        setError(
          "Refund amount must be greater than zero."
        );

        return;
      }

      if (
        numericAmount >
        paymentAmount
      ) {
        setError(
          "Refund amount cannot exceed the original payment amount."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setError(
          ""
        );

        const response =
          await createMerchantRefund({
            paymentId,

            mode:
              normalizedMode,

            amount:
              numericAmount.toFixed(
                2
              ),

            reason:
              reason ||
              undefined,

            merchantReference:
              merchantReference ||
              undefined,

            idempotencyKey:
              createRequestId(),
          });

        setCreatedRefund(
          response.refund
        );

        onCompleted?.(
          response.refund
        );
      } catch (
        err
      ) {
        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to process refund."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{
          y:
            -2,
        }}
        whileTap={{
          scale:
            0.98,
        }}
        onClick={
          openModal
        }
        className="
          inline-flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-xl
          border
          border-violet-300/30
          bg-violet-500/[0.08]
          px-4
          text-sm
          font-black
          text-violet-700
          transition

          hover:bg-violet-500/[0.13]

          dark:text-violet-200
        "
      >
        <RefreshCcw className="h-4 w-4" />

        Issue refund
      </motion.button>

      <AnimatePresence>
        {open && (
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-black/60
              p-4
              backdrop-blur-md
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.98,
              }}
              className="
                merchant-border
                merchant-surface

                w-full
                max-w-lg
                overflow-hidden
                rounded-[28px]
                border
              "
            >
              {/* PURPLE HEADER */}

              <div className="relative overflow-hidden p-5 text-white sm:p-6">
                <PurpleModalBackground />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-white/15
                        bg-white/10
                        backdrop-blur
                      "
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.17em] text-fuchsia-100/55">
                        Wallet refund
                      </p>

                      <h2
                        id="refund-modal-title"
                        className="mt-1 text-xl font-black"
                      >
                        Issue payment refund
                      </h2>

                      <p className="mt-1 text-xs text-white/60">
                        Return an eligible wallet payment securely.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      submitting
                    }
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/15
                      bg-white/10

                      hover:bg-white/15
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {createdRefund ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >
                    <div
                      className="
                        rounded-2xl
                        border
                        border-emerald-300/30
                        bg-emerald-500/[0.07]
                        p-5
                      "
                    >
                      <CheckCircle2 className="h-9 w-9 text-emerald-500" />

                      <h3 className="mt-4 text-lg font-black text-foreground">
                        Refund completed
                      </h3>

                      <p className="mt-2 text-sm merchant-muted">
                        {currency}{" "}
                        {Number(
                          createdRefund.amount
                        ).toFixed(
                          2
                        )}{" "}
                        was returned to the customer wallet.
                      </p>

                      <p className="mt-3 break-all font-mono text-xs text-violet-600 dark:text-violet-300">
                        {
                          createdRefund.refundId
                        }
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/dashboard/merchant/refunds/${encodeURIComponent(
                          createdRefund.refundId
                        )}`}
                        className="
                          inline-flex
                          h-11
                          flex-1
                          items-center
                          justify-center
                          rounded-xl
                          bg-violet-600
                          px-4
                          text-sm
                          font-black
                          text-white
                        "
                      >
                        View refund
                      </Link>

                      <button
                        type="button"
                        onClick={
                          closeModal
                        }
                        className="
                          inline-flex
                          h-11
                          flex-1
                          items-center
                          justify-center
                          rounded-xl
                          border
                          merchant-border
                          px-4
                          text-sm
                          font-black
                          text-foreground
                        "
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* PAYMENT SUMMARY */}

                    <div
                      className="
                        rounded-2xl
                        border
                        border-violet-300/20
                        bg-violet-500/[0.035]
                        p-4
                      "
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-500">
                        Payment
                      </p>

                      <p className="mt-1 break-all font-mono text-sm font-black text-foreground">
                        {
                          paymentId
                        }
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wide merchant-muted">
                            Maximum refund
                          </p>

                          <p className="mt-1 text-lg font-black text-violet-700 dark:text-violet-200">
                            {
                              currency
                            }{" "}
                            {paymentAmount.toFixed(
                              2
                            )}
                          </p>
                        </div>

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            bg-violet-500/10
                            text-violet-600
                          "
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="
                          mt-4
                          flex
                          items-start
                          gap-3
                          rounded-xl
                          border
                          border-red-200
                          bg-red-500/[0.06]
                          p-3
                        "
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                        <p className="text-sm text-red-600 dark:text-red-300">
                          {
                            error
                          }
                        </p>
                      </motion.div>
                    )}

                    <div className="mt-5 space-y-4">
                      <div>
                        <label
                          htmlFor="refund-amount"
                          className="text-sm font-black text-foreground"
                        >
                          Refund amount
                        </label>

                        <div
                          className="
                            mt-2
                            flex
                            rounded-xl
                            border
                            merchant-border
                            bg-background
                            transition

                            focus-within:border-violet-400
                            focus-within:ring-4
                            focus-within:ring-violet-500/10
                          "
                        >
                          <span className="flex items-center border-r merchant-border px-3 text-sm font-black text-violet-600">
                            {
                              currency
                            }
                          </span>

                          <input
                            id="refund-amount"
                            type="number"
                            min="0.01"
                            max={
                              paymentAmount
                            }
                            step="0.01"
                            value={
                              amount
                            }
                            onChange={(
                              event
                            ) =>
                              setAmount(
                                event.target.value
                              )
                            }
                            className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setAmount(
                              paymentAmount.toFixed(
                                2
                              )
                            )
                          }
                          className="mt-2 text-xs font-black text-violet-600 hover:text-fuchsia-600"
                        >
                          Use full amount
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="refund-reason"
                          className="text-sm font-black text-foreground"
                        >
                          Reason
                        </label>

                        <textarea
                          id="refund-reason"
                          maxLength={
                            500
                          }
                          rows={
                            3
                          }
                          value={
                            reason
                          }
                          onChange={(
                            event
                          ) =>
                            setReason(
                              event.target.value
                            )
                          }
                          placeholder="Customer request, duplicate payment..."
                          className="
                            mt-2
                            w-full
                            resize-none
                            rounded-xl
                            border
                            merchant-border
                            bg-background
                            p-3
                            text-sm
                            text-foreground
                            outline-none

                            focus:border-violet-400
                            focus:ring-4
                            focus:ring-violet-500/10
                          "
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="refund-reference"
                          className="text-sm font-black text-foreground"
                        >
                          Merchant reference
                        </label>

                        <input
                          id="refund-reference"
                          maxLength={
                            150
                          }
                          value={
                            merchantReference
                          }
                          onChange={(
                            event
                          ) =>
                            setMerchantReference(
                              event.target.value
                            )
                          }
                          placeholder="Optional internal reference"
                          className="
                            mt-2
                            h-12
                            w-full
                            rounded-xl
                            border
                            merchant-border
                            bg-background
                            px-3
                            text-sm
                            text-foreground
                            outline-none

                            focus:border-violet-400
                            focus:ring-4
                            focus:ring-violet-500/10
                          "
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={
                          closeModal
                        }
                        disabled={
                          submitting
                        }
                        className="
                          inline-flex
                          h-11
                          items-center
                          justify-center
                          rounded-xl
                          border
                          merchant-border
                          px-5
                          text-sm
                          font-black
                          text-foreground

                          disabled:opacity-50
                        "
                      >
                        Cancel
                      </button>

                      <motion.button
                        type="button"
                        whileHover={{
                          y:
                            -2,
                        }}
                        whileTap={{
                          scale:
                            0.98,
                        }}
                        onClick={() =>
                          void submitRefund()
                        }
                        disabled={
                          submitting
                        }
                        className="
                          inline-flex
                          h-11
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-gradient-to-r
                          from-violet-700
                          via-purple-600
                          to-fuchsia-600
                          px-5
                          text-sm
                          font-black
                          text-white

                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />

                            Processing...
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="h-4 w-4" />

                            Confirm refund
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}