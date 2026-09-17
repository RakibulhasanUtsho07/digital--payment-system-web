"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCw,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Webhook as WebhookIcon,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  MERCHANT_WEBHOOK_EVENTS,
  createMerchantWebhook,
  disableMerchantWebhook,
  getMerchantWebhookDeliveries,
  getMerchantWebhookEndpoints,
  retryMerchantWebhookDelivery,
  rotateMerchantWebhookSecret,
  type MerchantWebhookDelivery,
  type MerchantWebhookDeliveryStatus,
  type MerchantWebhookEndpoint,
  type MerchantWebhookEnvironment,
  type MerchantWebhookEventType,
  type MerchantWebhookPagination,
} from "@/lib/api/merchantWebhookApi";

/* =========================================================
   TYPES
========================================================= */

type ConfirmationAction =
  | {
      type: "disable";
      endpoint: MerchantWebhookEndpoint;
    }
  | {
      type: "rotate";
      endpoint: MerchantWebhookEndpoint;
    }
  | null;

/* =========================================================
   HELPERS
========================================================= */

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function eventLabel(
  event:
    MerchantWebhookEventType,
): string {
  return event
    .split(".")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function deliveryStatusClasses(
  status:
    MerchantWebhookDeliveryStatus,
): string {
  if (
    status ===
    "delivered"
  ) {
    return [
      "bg-emerald-500/10",
      "text-emerald-700",
      "dark:text-emerald-300",
    ].join(" ");
  }

  if (
    status ===
    "failed"
  ) {
    return [
      "bg-rose-500/10",
      "text-rose-700",
      "dark:text-rose-300",
    ].join(" ");
  }

  if (
    status ===
    "processing"
  ) {
    return [
      "bg-blue-500/10",
      "text-blue-700",
      "dark:text-blue-300",
    ].join(" ");
  }

  return [
    "bg-amber-500/10",
    "text-amber-700",
    "dark:text-amber-300",
  ].join(" ");
}

function deliveryStatusDot(
  status:
    MerchantWebhookDeliveryStatus,
): string {
  if (
    status ===
    "delivered"
  ) {
    return "bg-emerald-500";
  }

  if (
    status ===
    "failed"
  ) {
    return "bg-rose-500";
  }

  if (
    status ===
    "processing"
  ) {
    return "bg-blue-500";
  }

  return "bg-amber-500";
}

function environmentClasses(
  environment:
    MerchantWebhookEnvironment,
): string {
  if (
    environment ===
    "live"
  ) {
    return [
      "bg-emerald-500/10",
      "text-emerald-700",
      "dark:text-emerald-300",
    ].join(" ");
  }

  return [
    "bg-violet-500/10",
    "text-violet-700",
    "dark:text-violet-300",
  ].join(" ");
}

/* =========================================================
   HERO BACKGROUND
========================================================= */

function AuroraBackground() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-24
          h-72
          w-72
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            18,
            0,
          ],

          y: [
            0,
            -10,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-24
          left-1/3
          h-60
          w-60
          rounded-full
          bg-cyan-300/15
          blur-3xl
        "
        animate={{
          scale: [
            1,
            1.14,
            1,
          ],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  helper,
  icon:
    Icon,
  iconClass,
}: {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <motion.article
      whileHover={{
        y: -2,
      }}
      className="
        rounded-[22px]
        merchant-surface
        p-5
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-xs
              font-bold
              merchant-muted
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-2xl
              font-black
              tracking-tight
              merchant-text
            "
          >
            {value.toLocaleString(
              "en-BD",
            )}
          </p>

          <p
            className="
              mt-1
              text-[10px]
              merchant-muted
            "
          >
            {helper}
          </p>
        </div>

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${iconClass}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   CREATE ENDPOINT MODAL
========================================================= */

function CreateEndpointModal({
  environment,
  onClose,
  onCreated,
}: {
  environment:
    MerchantWebhookEnvironment;

  onClose:
    () => void;

  onCreated:
    (
      endpoint:
        MerchantWebhookEndpoint,

      signingSecret:
        string,

      warning:
        string,
    ) => void;
}) {
  const [
    url,
    setUrl,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    events,
    setEvents,
  ] =
    useState<
      MerchantWebhookEventType[]
    >([
      "payment.completed",
      "payment.failed",
    ]);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const toggleEvent =
    (
      event:
        MerchantWebhookEventType,
    ) => {
      setEvents(
        (
          current,
        ) =>
          current.includes(
            event,
          )
            ? current.filter(
                (
                  item,
                ) =>
                  item !==
                  event,
              )
            : [
                ...current,
                event,
              ],
      );
    };

  const handleSubmit =
    async (
      submitEvent:
        FormEvent<HTMLFormElement>,
    ) => {
      submitEvent.preventDefault();

      if (
        !url.trim()
      ) {
        setError(
          "Webhook URL is required.",
        );

        return;
      }

      if (
        events.length ===
        0
      ) {
        setError(
          "Select at least one webhook event.",
        );

        return;
      }

      try {
        setSubmitting(
          true,
        );

        setError("");

        const response =
          await createMerchantWebhook({
            url:
              url.trim(),

            environment,

            events,

            description:
              description.trim() ||
              undefined,
          });

        onCreated(
          response.webhook,
          response.signingSecret,
          response.warning,
        );
      } catch (
        requestError
      ) {
        setError(
          errorMessage(
            requestError,
          ),
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

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
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-[#090311]/70
        p-4
        backdrop-blur-md
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale: 0.98,
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
          merchant-surface
          max-h-[92vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-[30px]
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {/* HEADER */}

        <div
          className="
            relative
            overflow-hidden
            p-6
            text-white

            sm:p-7
          "
          style={{
            background:
              "linear-gradient(135deg,#240B4A 0%,#4C1D95 40%,#7C3AED 100%)",
          }}
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-20
              h-52
              w-52
              rounded-full
              bg-white/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white/10
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                "
              >
                <WebhookIcon className="h-3.5 w-3.5" />

                {environment} webhook
              </div>

              <h2
                className="
                  mt-4
                  text-xl
                  font-black
                "
              >
                Add webhook endpoint
              </h2>

              <p
                className="
                  mt-2
                  max-w-lg
                  text-xs
                  leading-6
                  text-violet-100/75
                "
              >
                Coffer will send signed payment events to your
                merchant server whenever a subscribed event occurs.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={
                onClose
              }
              disabled={
                submitting
              }
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white/10
                transition

                hover:bg-white/15

                disabled:opacity-50
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="
            space-y-5
            p-6

            sm:p-7
          "
        >
          <div>
            <label
              className="
                text-xs
                font-black
                merchant-text
              "
            >
              Endpoint URL
            </label>

            <div className="relative mt-2">
              <Server
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-violet-500
                "
              />

              <input
                type="url"
                value={
                  url
                }
                onChange={(
                  event,
                ) =>
                  setUrl(
                    event.target
                      .value,
                  )
                }
                placeholder="https://merchant.example.com/api/coffer-webhook"
                maxLength={
                  2048
                }
                required
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-violet-200/70
                  bg-transparent
                  pl-10
                  pr-4
                  text-sm
                  merchant-text
                  outline-none
                  transition

                  placeholder:text-slate-400

                  focus:border-violet-500
                  focus:ring-2
                  focus:ring-violet-500/10

                  dark:border-white/10
                "
              />
            </div>

            <p
              className="
                mt-2
                text-[10px]
                leading-5
                merchant-muted
              "
            >
              Production destinations must use HTTPS and should return
              a successful 2xx response quickly.
            </p>
          </div>

          <div>
            <label
              className="
                text-xs
                font-black
                merchant-text
              "
            >
              Description
            </label>

            <input
              type="text"
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              placeholder="Production payment webhook"
              maxLength={
                500
              }
              className="
                mt-2
                h-12
                w-full
                rounded-xl
                border
                border-violet-200/70
                bg-transparent
                px-4
                text-sm
                merchant-text
                outline-none
                transition

                placeholder:text-slate-400

                focus:border-violet-500
                focus:ring-2
                focus:ring-violet-500/10

                dark:border-white/10
              "
            />
          </div>

          {/* EVENTS */}

          <div>
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-black
                    merchant-text
                  "
                >
                  Subscribe to events
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    merchant-muted
                  "
                >
                  Select which payment lifecycle events should be
                  delivered.
                </p>
              </div>

              <span
                className="
                  rounded-full
                  bg-violet-500/10
                  px-2.5
                  py-1
                  text-[10px]
                  font-black
                  text-violet-700

                  dark:text-violet-300
                "
              >
                {events.length} selected
              </span>
            </div>

            <div
              className="
                mt-3
                grid
                gap-2

                sm:grid-cols-2
              "
            >
              {MERCHANT_WEBHOOK_EVENTS.map(
                (
                  event,
                ) => {
                  const selected =
                    events.includes(
                      event,
                    );

                  return (
                    <button
                      key={
                        event
                      }
                      type="button"
                      onClick={() =>
                        toggleEvent(
                          event,
                        )
                      }
                      className={`
                        flex
                        min-h-14
                        items-center
                        gap-3
                        rounded-2xl
                        p-3
                        text-left
                        transition

                        ${
                          selected
                            ? "bg-violet-500/10 ring-1 ring-violet-500/30"
                            : "merchant-surface-soft hover:bg-violet-500/5"
                        }
                      `}
                    >
                      <span
                        className={`
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          transition

                          ${
                            selected
                              ? "bg-violet-600 text-white"
                              : "bg-violet-500/10 text-violet-500"
                          }
                        `}
                      >
                        {selected ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                      </span>

                      <span
                        className="
                          min-w-0
                          text-xs
                          font-bold
                          merchant-text
                        "
                      >
                        {eventLabel(
                          event,
                        )}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {error ? (
            <div
              className="
                flex
                items-start
                gap-3
                rounded-2xl
                bg-rose-500/10
                p-4
                text-rose-700

                dark:text-rose-300
              "
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p
                className="
                  text-xs
                  leading-5
                "
              >
                {error}
              </p>
            </div>
          ) : null}

          {/* FOOTER */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-violet-500/10
              pt-5

              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                submitting
              }
              className="
                h-11
                rounded-xl
                bg-violet-500/10
                px-5
                text-sm
                font-black
                text-violet-700
                transition

                hover:bg-violet-500/15

                disabled:opacity-50

                dark:text-violet-300
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                events.length ===
                  0
              }
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-5
                text-sm
                font-black
                text-white
                transition

                hover:bg-violet-700

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {submitting
                ? "Creating..."
                : "Create endpoint"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   SIGNING SECRET MODAL
========================================================= */

function SecretModal({
  title,
  secret,
  warning,
  onClose,
}: {
  title: string;
  secret: string;
  warning: string;
  onClose: () => void;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const copySecret =
    async () => {
      try {
        await navigator.clipboard.writeText(
          secret,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1800,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

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
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
        bg-[#090311]/75
        p-4
        backdrop-blur-md
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 15,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
          y: 10,
        }}
        className="
          merchant-surface
          w-full
          max-w-lg
          overflow-hidden
          rounded-[30px]
        "
      >
        <div
          className="
            p-6
            text-white

            sm:p-7
          "
          style={{
            background:
              "linear-gradient(135deg,#240B4A 0%,#6D28D9 65%,#9333EA 100%)",
          }}
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white/10
            "
          >
            <KeyRound className="h-5 w-5" />
          </div>

          <h2
            className="
              mt-5
              text-xl
              font-black
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-2
              text-xs
              leading-6
              text-violet-100/75
            "
          >
            {warning}
          </p>
        </div>

        <div
          className="
            p-6

            sm:p-7
          "
        >
          <div
            className="
              rounded-2xl
              bg-[#18092D]
              p-4
              text-white
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-violet-200/60
                "
              >
                Signing secret
              </p>

              <LockKeyhole className="h-4 w-4 text-violet-300" />
            </div>

            <p
              className="
                mt-3
                break-all
                font-mono
                text-xs
                leading-6
                text-violet-100
              "
            >
              {secret}
            </p>
          </div>

          <div
            className="
              mt-4
              flex
              items-start
              gap-3
              rounded-2xl
              bg-amber-500/10
              p-4
              text-amber-800

              dark:text-amber-300
            "
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p
              className="
                text-xs
                leading-5
              "
            >
              Store this secret on your merchant backend only. Never
              expose it in React, Next.js client code or a public
              repository.
            </p>
          </div>

          <div
            className="
              mt-6
              grid
              gap-3

              sm:grid-cols-2
            "
          >
            <button
              type="button"
              onClick={() =>
                void copySecret()
              }
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-4
                text-sm
                font-black
                text-white
                transition

                hover:bg-violet-700
              "
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              {copied
                ? "Copied"
                : "Copy secret"}
            </button>

            <button
              type="button"
              onClick={
                onClose
              }
              className="
                h-11
                rounded-xl
                bg-violet-500/10
                px-4
                text-sm
                font-black
                text-violet-700
                transition

                hover:bg-violet-500/15

                dark:text-violet-300
              "
            >
              I saved it
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function ConfirmationModal({
  action,
  loading,
  onClose,
  onConfirm,
}: {
  action:
    Exclude<
      ConfirmationAction,
      null
    >;

  loading:
    boolean;

  onClose:
    () => void;

  onConfirm:
    () => void;
}) {
  const isRotate =
    action.type ===
    "rotate";

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
      className="
        fixed
        inset-0
        z-[70]
        flex
        items-center
        justify-center
        bg-[#090311]/70
        p-4
        backdrop-blur-md
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
        }}
        className="
          merchant-surface
          w-full
          max-w-md
          rounded-[28px]
          p-6

          sm:p-7
        "
      >
        <div
          className={`
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl

            ${
              isRotate
                ? "bg-violet-500/10 text-violet-600"
                : "bg-rose-500/10 text-rose-600"
            }
          `}
        >
          {isRotate ? (
            <RotateCw className="h-5 w-5" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </div>

        <h2
          className="
            mt-5
            text-lg
            font-black
            merchant-text
          "
        >
          {isRotate
            ? "Rotate signing secret?"
            : "Disable webhook endpoint?"}
        </h2>

        <p
          className="
            mt-2
            text-xs
            leading-6
            merchant-muted
          "
        >
          {isRotate
            ? "A new signing secret will be generated. Your previous secret will stop working, so update your merchant server immediately."
            : "Coffer will stop sending new payment events to this endpoint. Historical delivery records will remain available."}
        </p>

        <div
          className="
            mt-4
            rounded-xl
            bg-violet-500/5
            p-3
          "
        >
          <p
            className="
              break-all
              font-mono
              text-[10px]
              merchant-text
            "
          >
            {action.endpoint.url}
          </p>
        </div>

        <div
          className="
            mt-6
            grid
            gap-3

            sm:grid-cols-2
          "
        >
          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              onClose
            }
            className="
              h-11
              rounded-xl
              bg-violet-500/10
              text-sm
              font-black
              text-violet-700
              transition

              hover:bg-violet-500/15

              disabled:opacity-50

              dark:text-violet-300
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              onConfirm
            }
            className={`
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              text-sm
              font-black
              text-white
              transition
              disabled:opacity-50

              ${
                isRotate
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            `}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRotate ? (
              <RotateCw className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {loading
              ? "Working..."
              : isRotate
                ? "Rotate secret"
                : "Disable endpoint"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   ENDPOINT CARD
========================================================= */

function EndpointCard({
  endpoint,
  actionId,
  onRotate,
  onDisable,
}: {
  endpoint:
    MerchantWebhookEndpoint;

  actionId:
    string;

  onRotate:
    (
      endpoint:
        MerchantWebhookEndpoint,
    ) => void;

  onDisable:
    (
      endpoint:
        MerchantWebhookEndpoint,
    ) => void;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const copyUrl =
    async () => {
      try {
        await navigator.clipboard.writeText(
          endpoint.url,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1500,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

  return (
    <motion.article
      layout
      whileHover={{
        y: -2,
      }}
      className="
        rounded-[22px]
        merchant-surface-soft
        p-4

        sm:p-5
      "
    >
      <div
        className="
          flex
          flex-col
          gap-5

          xl:flex-row
          xl:items-start
          xl:justify-between
        "
      >
        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className={`
                inline-flex
                items-center
                gap-1.5
                rounded-full
                px-2.5
                py-1
                text-[10px]
                font-black
                uppercase
                tracking-wider

                ${
                  endpoint.enabled
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-500/10 text-slate-500"
                }
              `}
            >
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full

                  ${
                    endpoint.enabled
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }
                `}
              />

              {endpoint.enabled
                ? "Active"
                : "Disabled"}
            </span>

            <span
              className={`
                rounded-full
                px-2.5
                py-1
                text-[10px]
                font-black
                uppercase
                tracking-wider

                ${environmentClasses(
                  endpoint.environment,
                )}
              `}
            >
              {endpoint.environment}
            </span>

            <span
              className="
                rounded-full
                bg-violet-500/10
                px-2.5
                py-1
                text-[10px]
                font-black
                text-violet-700

                dark:text-violet-300
              "
            >
              Secret v
              {endpoint.secretVersion}
            </span>
          </div>

          <div
            className="
              mt-4
              flex
              items-start
              gap-2
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-violet-500/10
                text-violet-600
              "
            >
              <Server className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  break-all
                  font-mono
                  text-xs
                  font-black
                  merchant-text
                "
              >
                {endpoint.url}
              </p>

              {endpoint.description ? (
                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    merchant-muted
                  "
                >
                  {endpoint.description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="Copy endpoint URL"
              onClick={() =>
                void copyUrl()
              }
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-violet-500/10
                text-violet-600
                transition

                hover:bg-violet-500/15
              "
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div
            className="
              mt-4
              flex
              flex-wrap
              gap-2
            "
          >
            {endpoint.events.map(
              (
                event,
              ) => (
                <span
                  key={
                    event
                  }
                  className="
                    rounded-lg
                    bg-violet-500/5
                    px-2.5
                    py-1.5
                    text-[10px]
                    font-bold
                    text-violet-700

                    dark:text-violet-300
                  "
                >
                  {event}
                </span>
              ),
            )}
          </div>

          <div
            className="
              mt-4
              flex
              flex-wrap
              gap-x-5
              gap-y-2
              text-[10px]
              merchant-muted
            "
          >
            <span>
              Secret{" "}
              <strong className="merchant-text">
                {endpoint.secretHint}
              </strong>
            </span>

            <span>
              Last delivery{" "}
              <strong className="merchant-text">
                {formatDate(
                  endpoint.lastDeliveredAt,
                )}
              </strong>
            </span>

            {endpoint.secretRotatedAt ? (
              <span>
                Rotated{" "}
                <strong className="merchant-text">
                  {formatDate(
                    endpoint.secretRotatedAt,
                  )}
                </strong>
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="
            flex
            shrink-0
            flex-wrap
            gap-2
          "
        >
          <button
            type="button"
            onClick={() =>
              onRotate(
                endpoint,
              )
            }
            disabled={
              !endpoint.enabled ||
              Boolean(
                actionId,
              )
            }
            className="
              inline-flex
              h-10
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-violet-500/10
              px-3
              text-xs
              font-black
              text-violet-700
              transition

              hover:bg-violet-500/15

              disabled:cursor-not-allowed
              disabled:opacity-40

              dark:text-violet-300

              sm:flex-none
            "
          >
            {actionId ===
            `rotate:${endpoint.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}

            Rotate
          </button>

          <button
            type="button"
            onClick={() =>
              onDisable(
                endpoint,
              )
            }
            disabled={
              !endpoint.enabled ||
              Boolean(
                actionId,
              )
            }
            className="
              inline-flex
              h-10
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-rose-500/10
              px-3
              text-xs
              font-black
              text-rose-700
              transition

              hover:bg-rose-500/15

              disabled:cursor-not-allowed
              disabled:opacity-40

              dark:text-rose-300

              sm:flex-none
            "
          >
            {actionId ===
            `disable:${endpoint.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Disable
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantWebhooksPage() {
  const [
    environment,
    setEnvironment,
  ] =
    useState<
      MerchantWebhookEnvironment
    >("test");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | MerchantWebhookDeliveryStatus
      | "all"
    >("all");

  const [
    endpoints,
    setEndpoints,
  ] =
    useState<
      MerchantWebhookEndpoint[]
    >([]);

  const [
    deliveries,
    setDeliveries,
  ] =
    useState<
      MerchantWebhookDelivery[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<
      MerchantWebhookPagination
    >({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(false);

  const [
    actionId,
    setActionId,
  ] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] =
    useState<
      ConfirmationAction
    >(null);

  const [
    secretState,
    setSecretState,
  ] =
    useState<{
      title: string;
      secret: string;
      warning: string;
    } | null>(
      null,
    );

  /* =======================================================
     LOAD DATA
  ======================================================== */

  const loadDashboard =
    useCallback(
      async ({
        page = 1,
        silent = false,
      }: {
        page?: number;
        silent?: boolean;
      } = {}) => {
        try {
          if (
            silent
          ) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError("");

          const [
            endpointData,
            deliveryData,
          ] =
            await Promise.all([
              getMerchantWebhookEndpoints(
                environment,
              ),

              getMerchantWebhookDeliveries({
                environment,

                status:
                  statusFilter,

                page,

                limit:
                  20,
              }),
            ]);

          setEndpoints(
            endpointData,
          );

          setDeliveries(
            deliveryData.events,
          );

          setPagination(
            deliveryData.pagination,
          );
        } catch (
          requestError
        ) {
          setError(
            errorMessage(
              requestError,
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        environment,
        statusFilter,
      ],
    );

  useEffect(
    () => {
      void loadDashboard({
        page: 1,
      });
    },
    [
      loadDashboard,
    ],
  );

  /* =======================================================
     DERIVED STATS
  ======================================================== */

  const stats =
    useMemo(
      () => {
        const active =
          endpoints.filter(
            (
              endpoint,
            ) =>
              endpoint.enabled,
          ).length;

        const delivered =
          deliveries.filter(
            (
              event,
            ) =>
              event.status ===
              "delivered",
          ).length;

        const failed =
          deliveries.filter(
            (
              event,
            ) =>
              event.status ===
              "failed",
          ).length;

        const pending =
          deliveries.filter(
            (
              event,
            ) =>
              event.status ===
                "pending" ||
              event.status ===
                "processing",
          ).length;

        return {
          active,
          delivered,
          failed,
          pending,
        };
      },
      [
        endpoints,
        deliveries,
      ],
    );

  /* =======================================================
     ENVIRONMENT SWITCH
  ======================================================== */

  const changeEnvironment =
    (
      mode:
        MerchantWebhookEnvironment,
    ) => {
      if (
        mode ===
        environment
      ) {
        return;
      }

      setEnvironment(
        mode,
      );

      setStatusFilter(
        "all",
      );

      setEndpoints([]);

      setDeliveries([]);

      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });

      setError("");
    };

  /* =======================================================
     CREATED
  ======================================================== */

  const handleCreated =
    (
      endpoint:
        MerchantWebhookEndpoint,

      signingSecret:
        string,

      warning:
        string,
    ) => {
      setCreateOpen(
        false,
      );

      setEndpoints(
        (
          current,
        ) => [
          endpoint,
          ...current.filter(
            (
              item,
            ) =>
              item.id !==
              endpoint.id,
          ),
        ],
      );

      setSecretState({
        title:
          "Save your signing secret",

        secret:
          signingSecret,

        warning,
      });

      void loadDashboard({
        page: 1,
        silent: true,
      });
    };

  /* =======================================================
     DISABLE
  ======================================================== */

  const executeDisable =
    async (
      endpoint:
        MerchantWebhookEndpoint,
    ) => {
      try {
        setActionId(
          `disable:${endpoint.id}`,
        );

        setError("");

        await disableMerchantWebhook(
          endpoint.id,
          environment,
        );

        setConfirmation(
          null,
        );

        await loadDashboard({
          page:
            pagination.page,

          silent:
            true,
        });
      } catch (
        requestError
      ) {
        setError(
          errorMessage(
            requestError,
          ),
        );
      } finally {
        setActionId("");
      }
    };

  /* =======================================================
     ROTATE
  ======================================================== */

  const executeRotate =
    async (
      endpoint:
        MerchantWebhookEndpoint,
    ) => {
      try {
        setActionId(
          `rotate:${endpoint.id}`,
        );

        setError("");

        const response =
          await rotateMerchantWebhookSecret(
            endpoint.id,
            environment,
          );

        setConfirmation(
          null,
        );

        setSecretState({
          title:
            "Save your new signing secret",

          secret:
            response.signingSecret,

          warning:
            response.warning,
        });

        await loadDashboard({
          page:
            pagination.page,

          silent:
            true,
        });
      } catch (
        requestError
      ) {
        setError(
          errorMessage(
            requestError,
          ),
        );
      } finally {
        setActionId("");
      }
    };

  /* =======================================================
     CONFIRM ACTION
  ======================================================== */

  const confirmAction =
    () => {
      if (
        !confirmation
      ) {
        return;
      }

      if (
        confirmation.type ===
        "rotate"
      ) {
        void executeRotate(
          confirmation.endpoint,
        );

        return;
      }

      void executeDisable(
        confirmation.endpoint,
      );
    };

  /* =======================================================
     RETRY DELIVERY
  ======================================================== */

  const handleRetry =
    async (
      delivery:
        MerchantWebhookDelivery,
    ) => {
      try {
        setActionId(
          `retry:${delivery.eventId}`,
        );

        setError("");

        await retryMerchantWebhookDelivery(
          delivery.eventId,
          environment,
        );

        await loadDashboard({
          page:
            pagination.page,

          silent:
            true,
        });
      } catch (
        requestError
      ) {
        setError(
          errorMessage(
            requestError,
          ),
        );
      } finally {
        setActionId("");
      }
    };

  /* =======================================================
     UI
  ======================================================== */

  return (
    <main
      className="
        merchant-theme
        min-h-full
        px-4
        py-5

        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          max-w-[1550px]
          space-y-6
        "
      >
        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            relative
            overflow-hidden
            rounded-[30px]
            p-5
            text-white

            sm:p-7
          "
        >
          <AuroraBackground />

          <div className="relative z-10">
            <div
              className="
                flex
                flex-col
                gap-6

                xl:flex-row
                xl:items-end
                xl:justify-between
              "
            >
              <div className="max-w-3xl">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-3
                    py-1.5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    backdrop-blur
                  "
                >
                  <WebhookIcon className="h-3.5 w-3.5" />

                  Merchant integration
                </div>

                <h1
                  className="
                    mt-4
                    text-2xl
                    font-black
                    tracking-tight

                    sm:text-3xl
                  "
                >
                  Webhooks
                </h1>

                <p
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    leading-7
                    text-violet-100/80
                  "
                >
                  Connect Coffer payment events to your backend,
                  manage signing secrets and monitor every delivery
                  attempt from one secure workspace.
                </p>
              </div>

              <div
                className="
                  flex
                  flex-col
                  gap-3

                  sm:flex-row
                  sm:items-center
                "
              >
                {/* MODE SWITCH */}

                <div
                  className="
                    flex
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    p-1
                    backdrop-blur
                  "
                >
                  {(
                    [
                      "test",
                      "live",
                    ] as const
                  ).map(
                    (
                      mode,
                    ) => (
                      <button
                        key={
                          mode
                        }
                        type="button"
                        onClick={() =>
                          changeEnvironment(
                            mode,
                          )
                        }
                        className={`
                          h-9
                          min-w-[84px]
                          rounded-xl
                          px-4
                          text-xs
                          font-black
                          capitalize
                          transition

                          ${
                            environment ===
                            mode
                              ? "bg-white text-violet-700"
                              : "text-white/75 hover:bg-white/10 hover:text-white"
                          }
                        `}
                      >
                        {mode}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadDashboard({
                      page:
                        pagination.page,

                      silent:
                        true,
                    })
                  }
                  disabled={
                    refreshing
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-black
                    text-white
                    backdrop-blur
                    transition

                    hover:bg-white/15

                    disabled:opacity-50
                  "
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCreateOpen(
                      true,
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-white
                    px-4
                    text-sm
                    font-black
                    text-violet-700
                    transition

                    hover:bg-violet-50
                  "
                >
                  <Plus className="h-4 w-4" />

                  Add endpoint
                </button>
              </div>
            </div>

            {/* HERO INFO */}

            <div
              className="
                mt-6
                grid
                gap-3

                md:grid-cols-3
              "
            >
              <HeroInfo
                icon={
                  ShieldCheck
                }
                label="Environment"
                value={
                  environment ===
                  "test"
                    ? "Sandbox"
                    : "Production"
                }
              />

              <HeroInfo
                icon={
                  WebhookIcon
                }
                label="Active endpoints"
                value={
                  loading
                    ? "Loading..."
                    : String(
                        stats.active,
                      )
                }
              />

              <HeroInfo
                icon={
                  Activity
                }
                label="Delivery records"
                value={
                  loading
                    ? "Loading..."
                    : pagination.total.toLocaleString(
                        "en-BD",
                      )
                }
              />
            </div>
          </div>
        </motion.section>

        {/* =================================================
            ENVIRONMENT NOTICE
        ================================================= */}

        <motion.div
          key={
            environment
          }
          initial={{
            opacity: 0,
            y: 5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`
            flex
            items-start
            gap-3
            rounded-2xl
            p-4

            ${
              environment ===
              "test"
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            }
          `}
        >
          <div
            className="
              mt-0.5
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-current/10
            "
          >
            {environment ===
            "test" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </div>

          <div>
            <p
              className="
                text-xs
                font-black
              "
            >
              {environment ===
              "test"
                ? "Test webhook environment"
                : "Live webhook environment"}
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                opacity-80
              "
            >
              {environment ===
              "test"
                ? "Test webhooks receive only sandbox payment events and use their own signing secrets. They never receive live transaction events."
                : "Live webhooks receive production payment events. Live access requires an active, verified merchant with live access enabled."}
            </p>
          </div>
        </motion.div>

        {/* =================================================
            ERROR
        ================================================= */}

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{
                opacity: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -5,
              }}
              className="
                flex
                items-start
                gap-3
                rounded-2xl
                bg-rose-500/10
                p-4
                text-rose-700

                dark:text-rose-300
              "
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="flex-1">
                <p
                  className="
                    text-xs
                    font-black
                  "
                >
                  Unable to complete request
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    opacity-80
                  "
                >
                  {error}
                </p>
              </div>

              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() =>
                  setError("")
                }
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* =================================================
            STATS
        ================================================= */}

        <section
          className="
            grid
            gap-3

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            label="Active endpoints"
            value={
              stats.active
            }
            helper={`${environment} environment`}
            icon={
              WebhookIcon
            }
            iconClass="bg-violet-500/10 text-violet-600"
          />

          <StatCard
            label="Delivered"
            value={
              stats.delivered
            }
            helper="Current result page"
            icon={
              CheckCircle2
            }
            iconClass="bg-emerald-500/10 text-emerald-600"
          />

          <StatCard
            label="Pending"
            value={
              stats.pending
            }
            helper="Pending or processing"
            icon={
              Clock3
            }
            iconClass="bg-amber-500/10 text-amber-600"
          />

          <StatCard
            label="Failed"
            value={
              stats.failed
            }
            helper="Current result page"
            icon={
              AlertCircle
            }
            iconClass="bg-rose-500/10 text-rose-600"
          />
        </section>

        {/* =================================================
            ENDPOINTS
        ================================================= */}

        <section
          className="
            rounded-[28px]
            merchant-surface
            p-5

            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
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
                  <Server className="h-4 w-4" />
                </div>

                <div>
                  <h2
                    className="
                      text-lg
                      font-black
                      merchant-text
                    "
                  >
                    Webhook endpoints
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      merchant-muted
                    "
                  >
                    {environment ===
                    "test"
                      ? "Sandbox endpoints"
                      : "Production endpoints"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setCreateOpen(
                  true,
                )
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/10
                px-4
                text-xs
                font-black
                text-violet-700
                transition

                hover:bg-violet-500/15

                dark:text-violet-300
              "
            >
              <Plus className="h-4 w-4" />

              New endpoint
            </button>
          </div>

          {loading ? (
            <LoadingState
              label="Loading webhook endpoints..."
            />
          ) : endpoints.length ===
            0 ? (
            <EmptyState
              icon={
                WebhookIcon
              }
              title="No webhook endpoints"
              description={`Create your first ${environment} webhook endpoint to start receiving Coffer payment events.`}
              actionLabel="Add endpoint"
              onAction={() =>
                setCreateOpen(
                  true,
                )
              }
            />
          ) : (
            <div
              className="
                mt-5
                space-y-3
              "
            >
              {endpoints.map(
                (
                  endpoint,
                ) => (
                  <EndpointCard
                    key={
                      endpoint.id
                    }
                    endpoint={
                      endpoint
                    }
                    actionId={
                      actionId
                    }
                    onRotate={(
                      selected,
                    ) =>
                      setConfirmation({
                        type:
                          "rotate",

                        endpoint:
                          selected,
                      })
                    }
                    onDisable={(
                      selected,
                    ) =>
                      setConfirmation({
                        type:
                          "disable",

                        endpoint:
                          selected,
                      })
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        {/* =================================================
            DELIVERY HISTORY
        ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            merchant-surface
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-violet-500/10
              p-5

              sm:p-6

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
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
                <Activity className="h-4 w-4" />
              </div>

              <div>
                <h2
                  className="
                    text-lg
                    font-black
                    merchant-text
                  "
                >
                  Delivery history
                </h2>

                <p
                  className="
                    mt-0.5
                    text-xs
                    merchant-muted
                  "
                >
                  Inspect responses, failures and retry attempts.
                </p>
              </div>
            </div>

            <div
              className="
                flex
                flex-col
                gap-2

                sm:flex-row
              "
            >
              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | MerchantWebhookDeliveryStatus
                      | "all",
                  )
                }
                className="
                  h-10
                  rounded-xl
                  border
                  border-violet-200/70
                  bg-transparent
                  px-3
                  text-xs
                  font-black
                  merchant-text
                  outline-none
                  transition

                  focus:border-violet-500

                  dark:border-white/10
                "
              >
                <option value="all">
                  All statuses
                </option>

                <option value="delivered">
                  Delivered
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="processing">
                  Processing
                </option>

                <option value="failed">
                  Failed
                </option>
              </select>

              <button
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadDashboard({
                    page:
                      pagination.page,

                    silent:
                      true,
                  })
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-500/10
                  px-3
                  text-xs
                  font-black
                  text-violet-700
                  transition

                  hover:bg-violet-500/15

                  disabled:opacity-50

                  dark:text-violet-300
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>

          {/* BODY */}

          {loading ? (
            <LoadingState
              label="Loading webhook deliveries..."
            />
          ) : deliveries.length ===
            0 ? (
            <EmptyState
              icon={
                Activity
              }
              title="No delivery events"
              description="Webhook delivery attempts will appear here after a matching payment event occurs."
            />
          ) : (
            <div
              className="
                overflow-x-auto
                [scrollbar-width:none]
                [-ms-overflow-style:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              <table
                className="
                  w-full
                  min-w-[1020px]
                  text-left
                "
              >
                <thead
                  className="
                    bg-violet-500/5
                  "
                >
                  <tr
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      merchant-muted
                    "
                  >
                    <th className="px-5 py-4">
                      Event
                    </th>

                    <th className="px-5 py-4">
                      Payment
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Attempts
                    </th>

                    <th className="px-5 py-4">
                      Response
                    </th>

                    <th className="px-5 py-4">
                      Last activity
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {deliveries.map(
                    (
                      delivery,
                    ) => (
                      <tr
                        key={
                          delivery.id
                        }
                        className="
                          border-t
                          border-violet-500/10
                          transition

                          hover:bg-violet-500/5
                        "
                      >
                        <td className="px-5 py-4">
                          <div
                            className="
                              flex
                              items-start
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-violet-500/10
                                text-violet-600
                              "
                            >
                              <Zap className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  text-xs
                                  font-black
                                  merchant-text
                                "
                              >
                                {eventLabel(
                                  delivery.type,
                                )}
                              </p>

                              <p
                                title={
                                  delivery.eventId
                                }
                                className="
                                  mt-1
                                  max-w-[180px]
                                  truncate
                                  font-mono
                                  text-[10px]
                                  merchant-muted
                                "
                              >
                                {
                                  delivery.eventId
                                }
                              </p>

                              {delivery.lastError ? (
                                <p
                                  title={
                                    delivery.lastError
                                  }
                                  className="
                                    mt-2
                                    max-w-[260px]
                                    truncate
                                    text-[10px]
                                    text-rose-600

                                    dark:text-rose-300
                                  "
                                >
                                  {
                                    delivery.lastError
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td
                          className="
                            px-5
                            py-4
                          "
                        >
                          <p
                            title={
                              delivery.paymentId
                            }
                            className="
                              max-w-[180px]
                              truncate
                              font-mono
                              text-[11px]
                              font-bold
                              merchant-text
                            "
                          >
                            {
                              delivery.paymentId
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-2
                              rounded-full
                              px-2.5
                              py-1.5
                              text-[10px]
                              font-black
                              uppercase
                              tracking-wider

                              ${deliveryStatusClasses(
                                delivery.status,
                              )}
                            `}
                          >
                            <span
                              className={`
                                h-1.5
                                w-1.5
                                rounded-full

                                ${deliveryStatusDot(
                                  delivery.status,
                                )}
                              `}
                            />

                            {
                              delivery.status
                            }
                          </span>
                        </td>

                        <td
                          className="
                            px-5
                            py-4
                            text-xs
                            font-black
                            merchant-text
                          "
                        >
                          {
                            delivery.attempts
                          }
                        </td>

                        <td className="px-5 py-4">
                          {delivery.lastResponseStatus ? (
                            <span
                              className={`
                                rounded-lg
                                px-2.5
                                py-1
                                text-[10px]
                                font-black

                                ${
                                  delivery.lastResponseStatus >=
                                    200 &&
                                  delivery.lastResponseStatus <
                                    300
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                }
                              `}
                            >
                              HTTP{" "}
                              {
                                delivery.lastResponseStatus
                              }
                            </span>
                          ) : (
                            <span className="text-xs merchant-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td
                          className="
                            px-5
                            py-4
                            text-xs
                            merchant-muted
                          "
                        >
                          {formatDate(
                            delivery.deliveredAt ||
                              delivery.lastAttemptAt ||
                              delivery.createdAt,
                          )}
                        </td>

                        <td
                          className="
                            px-5
                            py-4
                            text-right
                          "
                        >
                          {delivery.status ===
                          "failed" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleRetry(
                                  delivery,
                                )
                              }
                              disabled={
                                Boolean(
                                  actionId,
                                )
                              }
                              className="
                                inline-flex
                                h-9
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-violet-500/10
                                px-3
                                text-[11px]
                                font-black
                                text-violet-700
                                transition

                                hover:bg-violet-500/15

                                disabled:opacity-50

                                dark:text-violet-300
                              "
                            >
                              {actionId ===
                              `retry:${delivery.eventId}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}

                              Retry
                            </button>
                          ) : (
                            <span
                              className="
                                text-xs
                                merchant-muted
                              "
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-violet-500/10
              p-4

              sm:flex-row
              sm:items-center
              sm:justify-between

              sm:px-6
            "
          >
            <p
              className="
                text-xs
                merchant-muted
              "
            >
              {pagination.total.toLocaleString(
                "en-BD",
              )}{" "}
              delivery event
              {pagination.total ===
              1
                ? ""
                : "s"}
            </p>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                disabled={
                  pagination.page <=
                    1 ||
                  loading ||
                  refreshing
                }
                onClick={() =>
                  void loadDashboard({
                    page:
                      pagination.page -
                      1,
                  })
                }
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-1
                  rounded-xl
                  bg-violet-500/10
                  px-3
                  text-xs
                  font-black
                  text-violet-700

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  dark:text-violet-300
                "
              >
                <ChevronLeft className="h-4 w-4" />

                Previous
              </button>

              <span
                className="
                  min-w-[90px]
                  text-center
                  text-xs
                  font-black
                  merchant-text
                "
              >
                Page{" "}
                {
                  pagination.page
                }{" "}
                of{" "}
                {Math.max(
                  pagination.totalPages,
                  1,
                )}
              </span>

              <button
                type="button"
                disabled={
                  pagination.page >=
                    Math.max(
                      pagination.totalPages,
                      1,
                    ) ||
                  loading ||
                  refreshing
                }
                onClick={() =>
                  void loadDashboard({
                    page:
                      pagination.page +
                      1,
                  })
                }
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-1
                  rounded-xl
                  bg-violet-500/10
                  px-3
                  text-xs
                  font-black
                  text-violet-700

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  dark:text-violet-300
                "
              >
                Next

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            WEBHOOK FLOW
        ================================================= */}

        <section
          className="
            rounded-[28px]
            bg-violet-500/5
            p-5

            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  font-black
                  text-violet-700

                  dark:text-violet-300
                "
              >
                <Sparkles className="h-4 w-4" />

                How delivery works
              </div>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-xs
                  leading-6
                  merchant-muted
                "
              >
                Coffer signs every webhook request before sending it
                to your server. Verify the signature before trusting
                the payload and make your endpoint idempotent.
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
                text-[10px]
                font-black
                merchant-muted
              "
            >
              <FlowBadge
                icon={
                  Activity
                }
                label="Payment event"
              />

              <ArrowRight className="h-3.5 w-3.5" />

              <FlowBadge
                icon={
                  LockKeyhole
                }
                label="Signed payload"
              />

              <ArrowRight className="h-3.5 w-3.5" />

              <FlowBadge
                icon={
                  Server
                }
                label="Merchant server"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ===================================================
          MODALS
      ==================================================== */}

      <AnimatePresence>
        {createOpen ? (
          <CreateEndpointModal
            environment={
              environment
            }
            onClose={() =>
              setCreateOpen(
                false,
              )
            }
            onCreated={
              handleCreated
            }
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {secretState ? (
          <SecretModal
            title={
              secretState.title
            }
            secret={
              secretState.secret
            }
            warning={
              secretState.warning
            }
            onClose={() =>
              setSecretState(
                null,
              )
            }
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation ? (
          <ConfirmationModal
            action={
              confirmation
            }
            loading={
              Boolean(
                actionId,
              )
            }
            onClose={() => {
              if (
                !actionId
              ) {
                setConfirmation(
                  null,
                );
              }
            }}
            onConfirm={
              confirmAction
            }
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   HERO INFO
========================================================= */

function HeroInfo({
  icon:
    Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-3
        backdrop-blur
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/10
        "
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-wider
            text-violet-100/60
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-xs
            font-black
            text-white
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState({
  label,
}: {
  label: string;
}) {
  return (
    <div
      className="
        flex
        min-h-[240px]
        items-center
        justify-center
      "
    >
      <div className="text-center">
        <Loader2
          className="
            mx-auto
            h-7
            w-7
            animate-spin
            text-violet-600
          "
        />

        <p
          className="
            mt-3
            text-xs
            merchant-muted
          "
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  icon:
    Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="
        mt-5
        flex
        min-h-[260px]
        flex-col
        items-center
        justify-center
        rounded-[22px]
        bg-violet-500/5
        p-6
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-violet-500/10
          text-violet-600
        "
      >
        <Icon className="h-6 w-6" />
      </div>

      <h3
        className="
          mt-4
          text-sm
          font-black
          merchant-text
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-2
          max-w-md
          text-xs
          leading-6
          merchant-muted
        "
      >
        {description}
      </p>

      {actionLabel &&
      onAction ? (
        <button
          type="button"
          onClick={
            onAction
          }
          className="
            mt-5
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-violet-600
            px-4
            text-xs
            font-black
            text-white
            transition

            hover:bg-violet-700
          "
        >
          <Plus className="h-4 w-4" />

          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/* =========================================================
   FLOW BADGE
========================================================= */

function FlowBadge({
  icon:
    Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        bg-violet-500/10
        px-3
        py-2
        text-violet-700

        dark:text-violet-300
      "
    >
      <Icon className="h-3.5 w-3.5" />

      {label}
    </div>
  );
}