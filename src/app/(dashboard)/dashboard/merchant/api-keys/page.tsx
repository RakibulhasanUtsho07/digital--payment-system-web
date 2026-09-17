"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  createMerchantApiKey,
  getMerchantApiKeys,
  revokeMerchantApiKey,
  rotateMerchantApiKey,
  type GeneratedMerchantApiKey,
  type MerchantApiKeyEnvironment,
  type MerchantApiKeyStatus,
  type MerchantApiKeySummary,
  type MerchantApiScope,
} from "@/lib/api/merchantApiKeyApi";

/* =========================================================
   TYPES
========================================================= */

type EnvironmentFilter =
  | "all"
  | MerchantApiKeyEnvironment;

interface ScopeOption {
  value: MerchantApiScope;
  label: string;
  description: string;
  recommended?: boolean;
}

/* =========================================================
   CONFIG
========================================================= */

const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: "orders:write",
    label: "Create orders",
    description:
      "Create merchant orders and receive a Coffer hosted checkout URL.",
    recommended: true,
  },
  {
    value: "orders:read",
    label: "Read orders",
    description:
      "Read order status and verify checkout orders from your backend.",
    recommended: true,
  },
  {
    value: "payments:write",
    label: "Create payments",
    description:
      "Create a Coffer payment and receive its hosted checkout URL.",
    recommended: true,
  },
  {
    value: "payments:read",
    label: "Read payments",
    description:
      "Read payment status and reconcile a merchant order.",
    recommended: true,
  },
  {
    value: "refunds:write",
    label: "Create refunds",
    description:
      "Request refunds for this merchant's eligible payments.",
  },
  {
    value: "webhooks:manage",
    label: "Manage webhooks",
    description:
      "Create, list, rotate, retry, and disable webhook endpoints.",
  },
];

const DEFAULT_SCOPES: MerchantApiScope[] = [
  "orders:write",
  "orders:read",
  "payments:write",
  "payments:read",
];

/* =========================================================
   ANIMATION
========================================================= */

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

/* =========================================================
   PURPLE BACKGROUND
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg, #240B4A 0%, #4C1D95 30%, #6D28D9 60%, #7C3AED 80%, #9333EA 100%)",
        }}
      />

      <motion.div
        aria-hidden
        animate={{
          x: [0, 100, 20, 0],
          y: [0, 25, 70, 0],
          scale: [1, 1.18, 0.94, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -left-32
          -top-40
          h-[430px]
          w-[430px]
          rounded-full
          bg-fuchsia-400/30
          blur-[110px]
        "
      />

      <motion.div
        aria-hidden
        animate={{
          x: [0, -80, 30, 0],
          y: [0, -30, 55, 0],
          scale: [1, 0.92, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-44
          right-[-80px]
          h-[470px]
          w-[470px]
          rounded-full
          bg-violet-300/30
          blur-[120px]
        "
      />

      <motion.div
        aria-hidden
        animate={{
          scale: [0.85, 1.2, 0.9],
          opacity: [0.15, 0.32, 0.15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          left-[42%]
          top-[10%]
          h-[260px]
          w-[260px]
          rounded-full
          bg-indigo-300
          blur-[120px]
        "
      />

      <motion.div
        aria-hidden
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[9%]
          top-[-190px]
          h-[390px]
          w-[390px]
          rounded-full
          border
          border-white/10
        "
      />

      <motion.div
        aria-hidden
        animate={{
          x: ["-40%", "150%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -top-1/2
          h-[200%]
          w-[190px]
          rotate-[18deg]
          bg-gradient-to-r
          from-transparent
          via-white/[0.10]
          to-transparent
          blur-xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.08]

          [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]
          [background-size:24px_24px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-40
          bg-gradient-to-t
          from-[#16052f]/35
          to-transparent
        "
      />
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value?: string
): string {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function effectiveStatus(
  apiKey: MerchantApiKeySummary
): MerchantApiKeyStatus {
  if (
    apiKey.status === "active" &&
    apiKey.expiresAt &&
    new Date(
      apiKey.expiresAt
    ).getTime() <=
      Date.now()
  ) {
    return "expired";
  }

  return apiKey.status;
}

function statusLabel(
  status: MerchantApiKeyStatus
): string {
  if (
    status === "active"
  ) {
    return "Active";
  }

  if (
    status === "revoked"
  ) {
    return "Revoked";
  }

  return "Expired";
}

function statusClass(
  status: MerchantApiKeyStatus
): string {
  if (
    status === "active"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    status === "revoked"
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
}

function maskedKey(
  apiKey: MerchantApiKeySummary
): string {
  return `${apiKey.keyPrefix}${"•".repeat(
    18
  )}`;
}

async function copyText(
  value: string
): Promise<void> {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      value
    );

    return;
  }

  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value =
    value;

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  document.body.appendChild(
    textarea
  );

  textarea.select();

  const copied =
    document.execCommand(
      "copy"
    );

  textarea.remove();

  if (!copied) {
    throw new Error(
      "Unable to copy the API key."
    );
  }
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: MerchantApiKeyStatus;
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-black

        ${statusClass(
          status
        )}
      `}
    >
      <motion.span
        animate={
          status ===
          "active"
            ? {
                opacity: [
                  0.45,
                  1,
                  0.45,
                ],
              }
            : undefined
        }
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="h-1.5 w-1.5 rounded-full bg-current"
      />

      {statusLabel(
        status
      )}
    </span>
  );
}

/* =========================================================
   ENVIRONMENT BADGE
========================================================= */

function EnvironmentBadge({
  environment,
}: {
  environment:
    MerchantApiKeyEnvironment;
}) {
  const live =
    environment ===
    "live";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-black
        uppercase
        tracking-wide

        ${
          live
            ? "border-violet-300/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
            : "border-sky-300/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        }
      `}
    >
      {live ? (
        <Zap className="h-3 w-3" />
      ) : (
        <TestTube2 className="h-3 w-3" />
      )}

      {environment}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function ApiStatCard({
  label,
  value,
  icon:
    Icon,
  index,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  index: number;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay:
          index *
          0.06,
      }}
      whileHover={{
        y: -7,
        scale: 1.012,
      }}
      className="
        merchant-border
        merchant-shadow

        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        bg-[linear-gradient(145deg,rgba(124,58,237,0.075),rgba(168,85,247,0.025),rgba(255,255,255,0.92))]
        p-5
        transition-shadow
        duration-300

        hover:shadow-[0_20px_45px_rgba(91,33,182,.13)]

        dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.12),rgba(88,28,135,0.08),rgba(15,23,42,0.9))]
      "
    >
      <motion.div
        initial={{
          scaleX: 0,
        }}
        animate={{
          scaleX: 1,
        }}
        transition={{
          duration: 0.55,
          delay:
            0.1 +
            index *
              0.05,
        }}
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          origin-left
          bg-gradient-to-r
          from-violet-700
          via-purple-500
          to-fuchsia-400
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          bg-violet-500/[0.08]
          blur-3xl
          transition

          group-hover:bg-violet-500/[0.16]
        "
      />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600/70 dark:text-violet-300/70">
            {
              label
            }
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-violet-800 dark:text-violet-100">
            {
              value
            }
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 7,
            scale: 1.12,
          }}
          transition={
            springTransition
          }
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="px-5 py-16 text-center"
    >
      <motion.div
        animate={{
          y: [
            0,
            -5,
            0,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-violet-500/10
          text-violet-600

          dark:text-violet-300
        "
      >
        <KeyRound className="h-7 w-7" />
      </motion.div>

      <h2 className="mt-5 text-base font-black text-foreground">
        No API keys found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 merchant-muted">
        Create a test key, store it in your website backend,
        then use it to create secure Coffer checkout sessions.
      </p>

      <motion.button
        type="button"
        whileHover={{
          y: -2,
        }}
        whileTap={{
          scale: 0.98,
        }}
        onClick={
          onCreate
        }
        className="
          mt-5
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
          px-4
          text-sm
          font-black
          text-white
          shadow-[0_12px_30px_rgba(124,58,237,.25)]
        "
      >
        <Plus className="h-4 w-4" />

        Create API key
      </motion.button>
    </motion.div>
  );
}

/* =========================================================
   CREATE DIALOG
========================================================= */

interface CreateDialogProps {
  open: boolean;

  onClose:
    () => void;

  onCreated: (
    apiKey:
      GeneratedMerchantApiKey,

    message:
      string
  ) => void;
}

function CreateKeyDialog({
  open,
  onClose,
  onCreated,
}: CreateDialogProps) {
  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    name,
    setName,
  ] =
    useState(
      "Website backend"
    );

  const [
    environment,
    setEnvironment,
  ] =
    useState<MerchantApiKeyEnvironment>(
      "test"
    );

  const [
    scopes,
    setScopes,
  ] =
    useState<MerchantApiScope[]>(
      DEFAULT_SCOPES
    );

  const [
    expiresOn,
    setExpiresOn,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState("");

  useEffect(
    () => {
      if (!open) {
        return;
      }

      setName(
        "Website backend"
      );

      setEnvironment(
        "test"
      );

      setScopes(
        DEFAULT_SCOPES
      );

      setExpiresOn(
        ""
      );

      setFormError(
        ""
      );

      setSubmitting(
        false
      );
    },
    [
      open,
    ]
  );

  const toggleScope =
    (
      scope:
        MerchantApiScope
    ) => {
      setScopes(
        (
          current
        ) =>
          current.includes(
            scope
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  scope
              )
            : [
                ...current,
                scope,
              ]
      );
    };

  const submit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setFormError(
        ""
      );

      if (
        scopes.length ===
        0
      ) {
        setFormError(
          "Select at least one permission."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        const response =
          await createMerchantApiKey({
            name:
              name.trim() ||
              undefined,

            environment,

            scopes,

            expiresAt:
              expiresOn
                ? new Date(
                    `${expiresOn}T23:59:59.999Z`
                  ).toISOString()
                : undefined,
          });

        onCreated(
          response.apiKey,
          response.message
        );
      } catch (
        error
      ) {
        setFormError(
          error instanceof
            Error
            ? error.message
            : "Unable to create the API key."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  const minimumDate =
    new Date(
      Date.now() +
        24 *
          60 *
          60 *
          1000
    )
      .toISOString()
      .slice(
        0,
        10
      );

  return (
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
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/70
            p-4
            backdrop-blur-md
          "
        >
          <motion.div
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 14,
              scale: 0.98,
            }}
            transition={
              springTransition
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-api-key-title"
            className="
              merchant-border
              merchant-surface

              max-h-[92vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-[28px]
              border
              shadow-[0_30px_90px_rgba(30,10,60,.32)]
            "
          >
            {/* DIALOG HEADER */}

            <div
              className="
                relative
                overflow-hidden
                rounded-t-[27px]
                p-5
                text-white

                sm:p-6
              "
            >
              <PurpleAuroraBackground />

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
                      backdrop-blur-xl
                    "
                  >
                    <KeyRound className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-100/60">
                      Developer credentials
                    </p>

                    <h2
                      id="create-api-key-title"
                      className="mt-1 text-lg font-black"
                    >
                      Create secret API key
                    </h2>

                    <p className="mt-1 max-w-lg text-sm leading-6 text-white/65">
                      Use only the permissions required by your
                      website backend.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    onClose
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
                    text-white
                    transition

                    hover:bg-white/20
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                submit
              }
              className="space-y-6 p-5 sm:p-6"
            >
              <div>
                <label
                  htmlFor="api-key-name"
                  className="mb-2 block text-xs font-black text-foreground"
                >
                  Key name
                </label>

                <input
                  id="api-key-name"
                  type="text"
                  value={
                    name
                  }
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target.value
                    )
                  }
                  maxLength={
                    100
                  }
                  placeholder="Production website"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    merchant-border
                    bg-background
                    px-3.5
                    text-sm
                    text-foreground
                    outline-none
                    transition

                    focus:border-violet-400
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>

              {/* ENVIRONMENT */}

              <fieldset>
                <legend className="mb-2 text-xs font-black text-foreground">
                  Environment
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      "test",
                      "live",
                    ] as const
                  ).map(
                    (
                      item
                    ) => {
                      const selected =
                        environment ===
                        item;

                      return (
                        <motion.button
                          key={
                            item
                          }
                          type="button"
                          whileHover={{
                            y: -3,
                          }}
                          onClick={() =>
                            setEnvironment(
                              item
                            )
                          }
                          className={`
                            rounded-2xl
                            border
                            p-4
                            text-left
                            transition-all

                            ${
                              selected
                                ? "border-violet-400 bg-violet-500/[0.08] shadow-[0_10px_30px_rgba(124,58,237,.09)]"
                                : "merchant-border bg-muted/20 hover:border-violet-400/35 hover:bg-violet-500/[0.035]"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-violet-500/10
                                  text-violet-600

                                  dark:text-violet-300
                                "
                              >
                                {item ===
                                "test" ? (
                                  <TestTube2 className="h-4 w-4" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </div>

                              <span className="text-sm font-black capitalize text-foreground">
                                {item} mode
                              </span>
                            </div>

                            <span
                              className={`
                                flex
                                h-5
                                w-5
                                items-center
                                justify-center
                                rounded-full
                                border

                                ${
                                  selected
                                    ? "border-violet-500 bg-violet-600 text-white"
                                    : "merchant-border"
                                }
                              `}
                            >
                              {selected && (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-5 merchant-muted">
                            {item ===
                            "test"
                              ? "Safe sandbox environment. No real money is moved."
                              : "Processes real payments and requires verified live access."}
                          </p>
                        </motion.button>
                      );
                    }
                  )}
                </div>
              </fieldset>

              {/* PERMISSIONS */}

              <fieldset>
                <div className="mb-3 flex items-center justify-between">
                  <legend className="text-xs font-black text-foreground">
                    Permissions
                  </legend>

                  <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-black text-violet-600 dark:text-violet-300">
                    {
                      scopes.length
                    }{" "}
                    selected
                  </span>
                </div>

                <div className="space-y-2">
                  {SCOPE_OPTIONS.map(
                    (
                      option
                    ) => {
                      const selected =
                        scopes.includes(
                          option.value
                        );

                      return (
                        <motion.label
                          key={
                            option.value
                          }
                          whileHover={{
                            x: 3,
                          }}
                          className={`
                            flex
                            cursor-pointer
                            items-start
                            gap-3
                            rounded-2xl
                            border
                            p-3.5
                            transition-all

                            ${
                              selected
                                ? "border-violet-400/70 bg-violet-500/[0.065]"
                                : "merchant-border bg-muted/20 hover:border-violet-400/30"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleScope(
                                option.value
                              )
                            }
                            className="sr-only"
                          />

                          <span
                            className={`
                              mt-0.5
                              flex
                              h-5
                              w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-md
                              border

                              ${
                                selected
                                  ? "border-violet-600 bg-violet-600 text-white"
                                  : "merchant-border"
                              }
                            `}
                          >
                            {selected && (
                              <Check className="h-3 w-3" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-foreground">
                                {
                                  option.label
                                }
                              </span>

                              {option.recommended && (
                                <span
                                  className="
                                    rounded-full
                                    bg-violet-500/10
                                    px-2
                                    py-0.5
                                    text-[8px]
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-violet-600

                                    dark:text-violet-300
                                  "
                                >
                                  Recommended
                                </span>
                              )}
                            </span>

                            <span className="mt-1 block text-xs leading-5 merchant-muted">
                              {
                                option.description
                              }
                            </span>

                            <code className="mt-1.5 inline-block text-[11px] font-black text-violet-600 dark:text-violet-300">
                              {
                                option.value
                              }
                            </code>
                          </span>
                        </motion.label>
                      );
                    }
                  )}
                </div>
              </fieldset>

              {/* EXPIRY */}

              <div>
                <label
                  htmlFor="api-key-expiry"
                  className="mb-2 block text-xs font-black text-foreground"
                >
                  Expiry date

                  <span className="ml-1 font-medium merchant-muted">
                    (optional)
                  </span>
                </label>

                <input
                  id="api-key-expiry"
                  type="date"
                  min={
                    minimumDate
                  }
                  value={
                    expiresOn
                  }
                  onChange={(
                    event
                  ) =>
                    setExpiresOn(
                      event.target.value
                    )
                  }
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    merchant-border
                    bg-background
                    px-3.5
                    text-sm
                    text-foreground
                    outline-none

                    focus:border-violet-400
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-500/[0.06]
                    p-4
                    text-red-600
                  "
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="text-sm font-semibold">
                    {
                      formError
                    }
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t merchant-border pt-5 sm:flex-row sm:justify-end">
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
                    border
                    merchant-border
                    px-4
                    text-sm
                    font-black
                    text-foreground
                    transition

                    hover:bg-violet-500/[0.05]
                  "
                >
                  Cancel
                </button>

                <motion.button
                  type="submit"
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  disabled={
                    submitting ||
                    scopes.length ===
                      0
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
                    px-4
                    text-sm
                    font-black
                    text-white
                    shadow-[0_12px_30px_rgba(124,58,237,.24)]

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}

                  {submitting
                    ? "Creating..."
                    : "Create secret key"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   SECRET DIALOG
========================================================= */

function SecretDialog({
  apiKey,
  message,
  onClose,
}: {
  apiKey:
    GeneratedMerchantApiKey | null;

  message:
    string;

  onClose:
    () => void;
}) {
  const [
    visible,
    setVisible,
  ] =
    useState(false);

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    copyError,
    setCopyError,
  ] =
    useState("");

  useEffect(
    () => {
      setVisible(
        false
      );

      setCopied(
        false
      );

      setCopyError(
        ""
      );
    },
    [
      apiKey,
    ]
  );

  if (
    !apiKey
  ) {
    return null;
  }

  const copyKey =
    async () => {
      try {
        await copyText(
          apiKey.key
        );

        setCopied(
          true
        );

        setCopyError(
          ""
        );
      } catch (
        error
      ) {
        setCopyError(
          error instanceof
            Error
            ? error.message
            : "Unable to copy the API key."
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
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
        bg-slate-950/75
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
        transition={
          springTransition
        }
        className="
          merchant-border
          merchant-surface

          w-full
          max-w-2xl
          overflow-hidden
          rounded-[28px]
          border
          shadow-[0_30px_90px_rgba(30,10,60,.35)]
        "
      >
        <div className="relative overflow-hidden p-5 text-white sm:p-6">
          <PurpleAuroraBackground />

          <div className="relative z-10">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                border
                border-white/15
                bg-white/10
                backdrop-blur
              "
            >
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Copy your secret key now
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              {
                message
              }
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border merchant-border bg-violet-500/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <EnvironmentBadge
                  environment={
                    apiKey.environment
                  }
                />

                <span className="text-xs font-black merchant-muted">
                  {apiKey.name ||
                    "Unnamed key"}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVisible(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-xl
                  border
                  merchant-border
                  px-3
                  text-xs
                  font-black
                  text-violet-600
                  transition

                  hover:bg-violet-500/[0.06]

                  dark:text-violet-300
                "
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}

                {visible
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            <div className="mt-4 flex items-stretch gap-2">
              <code
                className="
                  min-w-0
                  flex-1
                  overflow-x-auto
                  rounded-xl
                  border
                  border-violet-300/20
                  bg-background
                  px-3.5
                  py-3
                  text-sm
                  font-black
                  text-violet-700

                  dark:text-violet-200
                "
              >
                {visible
                  ? apiKey.key
                  : `${apiKey.key.slice(
                      0,
                      apiKey.keyPrefix.length
                    )}${"•".repeat(
                      28
                    )}`}
              </code>

              <motion.button
                type="button"
                whileHover={{
                  y: -2,
                }}
                onClick={() =>
                  void copyKey()
                }
                className="
                  inline-flex
                  h-12
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-4
                  text-sm
                  font-black
                  text-white
                  shadow-[0_10px_25px_rgba(124,58,237,.22)]
                "
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}

                <span className="hidden sm:inline">
                  {copied
                    ? "Copied"
                    : "Copy"}
                </span>
              </motion.button>
            </div>

            {copyError && (
              <p className="mt-2 text-xs font-semibold text-red-500">
                {
                  copyError
                }
              </p>
            )}
          </div>

          <div
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-500/[0.07]
              p-4
              text-amber-700

              dark:border-amber-900/50
              dark:text-amber-200
            "
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="text-sm font-black">
                  It will not be shown again
                </p>

                <p className="mt-1 text-xs leading-5">
                  Store it only in your merchant website backend
                  environment. Never expose this key through
                  React client code, GitHub, or browser requests.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border merchant-border bg-violet-500/[0.035] p-4">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <Clipboard className="h-4 w-4 text-violet-600" />

              Backend .env example
            </div>

            <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950 px-3.5 py-3 text-xs font-semibold text-violet-200">
              COFFER_SECRET_KEY=
              {visible
                ? apiKey.key
                : `${apiKey.keyPrefix}${"•".repeat(
                    28
                  )}`}
            </code>
          </div>

          <motion.button
            type="button"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={
              onClose
            }
            className="
              h-11
              w-full
              rounded-xl
              bg-gradient-to-r
              from-violet-700
              via-purple-600
              to-fuchsia-600
              px-4
              text-sm
              font-black
              text-white
              shadow-[0_12px_30px_rgba(124,58,237,.25)]
            "
          >
            I have saved this key
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantApiKeysPage() {
  const [
    apiKeys,
    setApiKeys,
  ] =
    useState<
      MerchantApiKeySummary[]
    >([]);

  const [
    filter,
    setFilter,
  ] =
    useState<EnvironmentFilter>(
      "all"
    );

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
    createOpen,
    setCreateOpen,
  ] =
    useState(false);

  const [
    actionKeyId,
    setActionKeyId,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    notice,
    setNotice,
  ] =
    useState("");

  const [
    revealedKey,
    setRevealedKey,
  ] =
    useState<
      GeneratedMerchantApiKey | null
    >(null);

  const [
    revealedMessage,
    setRevealedMessage,
  ] =
    useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadApiKeys =
    useCallback(
      async (
        silent =
          false
      ) => {
        try {
          setError(
            ""
          );

          if (
            silent
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          const result =
            await getMerchantApiKeys();

          setApiKeys(
            result
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load API keys."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void loadApiKeys();
    },
    [
      loadApiKeys,
    ]
  );

  const filteredKeys =
    useMemo(
      () =>
        filter ===
        "all"
          ? apiKeys
          : apiKeys.filter(
              (
                apiKey
              ) =>
                apiKey.environment ===
                filter
            ),
      [
        apiKeys,
        filter,
      ]
    );

  const statistics =
    useMemo(
      () => ({
        active:
          apiKeys.filter(
            (
              apiKey
            ) =>
              effectiveStatus(
                apiKey
              ) ===
              "active"
          ).length,

        test:
          apiKeys.filter(
            (
              apiKey
            ) =>
              apiKey.environment ===
                "test" &&
              effectiveStatus(
                apiKey
              ) ===
                "active"
          ).length,

        live:
          apiKeys.filter(
            (
              apiKey
            ) =>
              apiKey.environment ===
                "live" &&
              effectiveStatus(
                apiKey
              ) ===
                "active"
          ).length,

        inactive:
          apiKeys.filter(
            (
              apiKey
            ) =>
              effectiveStatus(
                apiKey
              ) !==
              "active"
          ).length,
      }),
      [
        apiKeys,
      ]
    );

  const handleCreated =
    async (
      apiKey:
        GeneratedMerchantApiKey,

      message:
        string
    ) => {
      setCreateOpen(
        false
      );

      setRevealedKey(
        apiKey
      );

      setRevealedMessage(
        message
      );

      setNotice(
        "API key created successfully."
      );

      await loadApiKeys(
        true
      );
    };

  const openCreate =
    () => {
      setNotice(
        ""
      );

      setError(
        ""
      );

      setCreateOpen(
        true
      );
    };

  const rotateKey =
    async (
      apiKey:
        MerchantApiKeySummary
    ) => {
      const confirmed =
        window.confirm(
          `Rotate "${
            apiKey.name ||
            apiKey.keyId
          }"? The current key will stop working immediately.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError(
          ""
        );

        setNotice(
          ""
        );

        setActionKeyId(
          apiKey.keyId
        );

        const response =
          await rotateMerchantApiKey(
            apiKey.keyId
          );

        setRevealedKey(
          response.apiKey
        );

        setRevealedMessage(
          response.message
        );

        setNotice(
          "API key rotated successfully."
        );

        await loadApiKeys(
          true
        );
      } catch (
        rotateError
      ) {
        setError(
          rotateError instanceof
            Error
            ? rotateError.message
            : "Unable to rotate the API key."
        );
      } finally {
        setActionKeyId(
          ""
        );
      }
    };

  const revokeKey =
    async (
      apiKey:
        MerchantApiKeySummary
    ) => {
      const confirmed =
        window.confirm(
          `Revoke "${
            apiKey.name ||
            apiKey.keyId
          }"? Requests using this key will fail immediately.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError(
          ""
        );

        setNotice(
          ""
        );

        setActionKeyId(
          apiKey.keyId
        );

        const response =
          await revokeMerchantApiKey(
            apiKey.keyId
          );

        setNotice(
          response.message
        );

        await loadApiKeys(
          true
        );
      } catch (
        revokeError
      ) {
        setError(
          revokeError instanceof
            Error
            ? revokeError.message
            : "Unable to revoke the API key."
        );
      } finally {
        setActionKeyId(
          ""
        );
      }
    };

  return (
    <>
      <main className="merchant-theme min-h-full">
        <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">

          {/* =================================================
              TOP HERO — PURPLE
          ================================================== */}

          <motion.header
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.995,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.55,
            }}
            whileHover={{
              y: -2,
            }}
            className="
              relative
              overflow-hidden
              rounded-[30px]
              p-6
              text-white
              shadow-[0_28px_70px_rgba(91,33,182,0.27)]

              sm:p-7
              lg:p-8
            "
          >
            <PurpleAuroraBackground />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-8

                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >
              <div className="max-w-[800px]">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{
                      rotate: -7,
                      scale: 1.1,
                    }}
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/15
                      bg-white/10
                      backdrop-blur-xl
                    "
                  >
                    <Code2 className="h-5 w-5" />
                  </motion.div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.20em] text-fuchsia-100/55">
                      Developer credentials
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg font-black sm:text-xl">
                        Coffer Gateway
                      </span>

                      <span
                        className="
                          rounded-full
                          border
                          border-emerald-200/15
                          bg-emerald-300/15
                          px-2.5
                          py-1
                          text-[8px]
                          font-black
                          uppercase
                          tracking-wide
                          text-emerald-100
                        "
                      >
                        Secure
                      </span>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.12,
                  }}
                  className="mt-8"
                >
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.20em] text-fuchsia-100/70">
                    <Sparkles className="h-3.5 w-3.5" />

                    Secure integration
                  </div>

                  <h1
                    className="
                      mt-3
                      max-w-[760px]
                      text-[34px]
                      font-black
                      leading-[1.02]
                      tracking-[-0.055em]

                      sm:text-[42px]
                      lg:text-[48px]
                    "
                  >
                    API keys built for
                    <span
                      className="
                        block
                        bg-gradient-to-r
                        from-white
                        via-fuchsia-100
                        to-violet-200
                        bg-clip-text
                        text-transparent
                      "
                    >
                      secure payment integrations.
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[690px] text-[13px] font-medium leading-6 text-white/70 sm:text-sm">
                    Connect your backend to Coffer, create hosted
                    checkout payments, read payment status and
                    securely manage your merchant credentials.
                  </p>
                </motion.div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() =>
                    void loadApiKeys(
                      true
                    )
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
                    rounded-xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-xs
                    font-black
                    text-white
                    backdrop-blur-xl

                    hover:bg-white/15
                  "
                >
                  <RefreshCw
                    className={`
                      h-4
                      w-4

                      ${
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    `}
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={
                    openCreate
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    text-xs
                    font-black
                    text-violet-700
                    shadow-[0_14px_35px_rgba(30,10,60,.20)]

                    hover:bg-fuchsia-50
                  "
                >
                  <Plus className="h-4 w-4" />

                  Create secret key
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* =================================================
              STATS
          ================================================== */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ApiStatCard
              label="Active keys"
              value={
                statistics.active
              }
              icon={
                KeyRound
              }
              index={
                0
              }
            />

            <ApiStatCard
              label="Test keys"
              value={
                statistics.test
              }
              icon={
                TestTube2
              }
              index={
                1
              }
            />

            <ApiStatCard
              label="Live keys"
              value={
                statistics.live
              }
              icon={
                Zap
              }
              index={
                2
              }
            />

            <ApiStatCard
              label="Inactive keys"
              value={
                statistics.inactive
              }
              icon={
                LockKeyhole
              }
              index={
                3
              }
            />
          </section>

          {/* =================================================
              SECURITY SECTION — PURPLE
          ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -4,
            }}
            className="
              relative
              overflow-hidden
              rounded-[24px]
              p-5
              text-white
              shadow-[0_22px_55px_rgba(91,33,182,.20)]

              sm:p-6
            "
          >
            <PurpleAuroraBackground />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-5

                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{
                    scale: [
                      1,
                      1.07,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
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
                    backdrop-blur-xl
                  "
                >
                  <LockKeyhole className="h-5 w-5" />
                </motion.div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-fuchsia-100/55">
                    Credential security
                  </p>

                  <h2 className="mt-1 text-base font-black">
                    Secret-key safety
                  </h2>

                  <p className="mt-2 max-w-3xl text-xs leading-6 text-white/65">
                    Secret API keys authenticate only your merchant
                    backend. Never expose them in browser code,
                    React components, public repositories or
                    client-side requests.
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  shrink-0
                  grid-cols-2
                  gap-2
                  text-center

                  sm:grid-cols-3
                "
              >
                {[
                  "Backend only",
                  "Never public",
                  "Rotate safely",
                ].map(
                  (
                    item
                  ) => (
                    <motion.div
                      key={
                        item
                      }
                      whileHover={{
                        y: -3,
                      }}
                      className="
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.08]
                        px-3
                        py-2.5
                        text-[9px]
                        font-black
                        text-fuchsia-50
                        backdrop-blur-xl
                      "
                    >
                      {
                        item
                      }
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </motion.section>

          {/* ERROR */}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-500/[0.06]
                  p-4
                  text-red-600
                "
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="text-sm font-semibold">
                    {
                      error
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setError(
                      ""
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NOTICE */}

          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                  rounded-2xl
                  border
                  border-emerald-200
                  bg-emerald-500/[0.07]
                  p-4
                  text-emerald-700

                  dark:border-emerald-900/50
                  dark:text-emerald-300
                "
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="text-sm font-semibold">
                    {
                      notice
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      ""
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================
              KEYS MANAGEMENT
          ================================================== */}

          <motion.section
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              merchant-border
              merchant-surface
              merchant-shadow

              overflow-hidden
              rounded-[24px]
              border
            "
          >
            {/* PURPLE HEADER */}

            <div
              className="
                relative
                overflow-hidden
                px-5
                py-5
                text-white

                sm:px-6
              "
            >
              <PurpleAuroraBackground />

              <div
                className="
                  relative
                  z-10
                  flex
                  flex-col
                  gap-4

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-100/55">
                    Credentials
                  </p>

                  <h2 className="mt-1 text-base font-black">
                    Your secret keys
                  </h2>

                  <p className="mt-1 text-xs text-white/60">
                    Only prefixes and safe metadata remain visible
                    after creation.
                  </p>
                </div>

                {/* FILTER */}

                <div
                  className="
                    inline-flex
                    self-start
                    rounded-xl
                    border
                    border-white/10
                    bg-black/10
                    p-1
                    backdrop-blur-xl
                  "
                >
                  {(
                    [
                      "all",
                      "test",
                      "live",
                    ] as const
                  ).map(
                    (
                      item
                    ) => {
                      const active =
                        filter ===
                        item;

                      return (
                        <motion.button
                          key={
                            item
                          }
                          type="button"
                          whileTap={{
                            scale: 0.96,
                          }}
                          onClick={() =>
                            setFilter(
                              item
                            )
                          }
                          className={`
                            relative
                            rounded-lg
                            px-4
                            py-2
                            text-[10px]
                            font-black
                            capitalize
                            transition

                            ${
                              active
                                ? "text-violet-700"
                                : "text-white/65 hover:text-white"
                            }
                          `}
                        >
                          {active && (
                            <motion.span
                              layoutId="api-key-filter"
                              transition={
                                springTransition
                              }
                              className="
                                absolute
                                inset-0
                                rounded-lg
                                bg-white
                                shadow-sm
                              "
                            />
                          )}

                          <span className="relative z-10">
                            {
                              item
                            }
                          </span>
                        </motion.button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* BODY */}

            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" />

                  <p className="mt-3 text-sm font-semibold merchant-muted">
                    Loading API keys...
                  </p>
                </div>
              </div>
            ) : filteredKeys.length ===
              0 ? (
              <EmptyState
                onCreate={
                  openCreate
                }
              />
            ) : (
              <div className="divide-y merchant-border">
                {filteredKeys.map(
                  (
                    apiKey,
                    index
                  ) => {
                    const status =
                      effectiveStatus(
                        apiKey
                      );

                    const active =
                      status ===
                      "active";

                    const acting =
                      actionKeyId ===
                      apiKey.keyId;

                    return (
                      <motion.article
                        key={
                          apiKey.id
                        }
                        initial={{
                          opacity: 0,
                          y: 14,
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
                        whileHover={{
                          x: 3,
                        }}
                        className="
                          group
                          relative
                          p-5
                          transition-colors

                          hover:bg-violet-500/[0.035]

                          sm:p-6
                        "
                      >
                        <motion.div
                          initial={{
                            opacity: 0,
                          }}
                          whileHover={{
                            opacity: 1,
                          }}
                          className="
                            absolute
                            bottom-0
                            left-0
                            top-0
                            w-[3px]
                            bg-gradient-to-b
                            from-violet-600
                            via-purple-500
                            to-fuchsia-400
                          "
                        />

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
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-black text-foreground">
                                {apiKey.name ||
                                  "Unnamed API key"}
                              </h3>

                              <EnvironmentBadge
                                environment={
                                  apiKey.environment
                                }
                              />

                              <StatusBadge
                                status={
                                  status
                                }
                              />
                            </div>

                            {/* MASKED KEY */}

                            <motion.div
                              whileHover={{
                                scale: 1.004,
                              }}
                              className="
                                mt-4
                                flex
                                max-w-2xl
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-violet-300/20
                                bg-violet-500/[0.035]
                                px-3.5
                                py-3
                              "
                            >
                              <KeyRound className="h-4 w-4 shrink-0 text-violet-500" />

                              <code className="min-w-0 flex-1 truncate text-xs font-black text-violet-700 dark:text-violet-200">
                                {maskedKey(
                                  apiKey
                                )}
                              </code>
                            </motion.div>

                            {/* META */}

                            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                              {[
                                {
                                  label:
                                    "Key ID",

                                  value:
                                    apiKey.keyId,
                                },
                                {
                                  label:
                                    "Created",

                                  value:
                                    formatDate(
                                      apiKey.createdAt
                                    ),
                                },
                                {
                                  label:
                                    "Last used",

                                  value:
                                    formatDate(
                                      apiKey.lastUsedAt
                                    ),
                                },
                                {
                                  label:
                                    "Expires",

                                  value:
                                    apiKey.expiresAt
                                      ? formatDate(
                                          apiKey.expiresAt
                                        )
                                      : "No expiry",
                                },
                              ].map(
                                (
                                  item
                                ) => (
                                  <div
                                    key={
                                      item.label
                                    }
                                    className="
                                      rounded-xl
                                      bg-muted/25
                                      p-3
                                      transition

                                      group-hover:bg-violet-500/[0.025]
                                    "
                                  >
                                    <p className="text-[9px] font-black uppercase tracking-[0.11em] text-violet-500/70">
                                      {
                                        item.label
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-[10px] font-black text-foreground">
                                      {
                                        item.value
                                      }
                                    </p>
                                  </div>
                                )
                              )}
                            </div>

                            {/* SCOPES */}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {apiKey.scopes.map(
                                (
                                  scope
                                ) => (
                                  <code
                                    key={
                                      scope
                                    }
                                    className="
                                      rounded-lg
                                      border
                                      border-violet-300/20
                                      bg-violet-500/[0.045]
                                      px-2.5
                                      py-1.5
                                      text-[10px]
                                      font-black
                                      text-violet-700

                                      dark:text-violet-200
                                    "
                                  >
                                    {
                                      scope
                                    }
                                  </code>
                                )
                              )}
                            </div>
                          </div>

                          {/* ACTIONS */}

                          {active && (
                            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                              <motion.button
                                type="button"
                                whileHover={{
                                  y: -2,
                                }}
                                whileTap={{
                                  scale: 0.97,
                                }}
                                onClick={() =>
                                  void rotateKey(
                                    apiKey
                                  )
                                }
                                disabled={
                                  acting
                                }
                                className="
                                  inline-flex
                                  h-10
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  border
                                  border-violet-300/30
                                  bg-violet-500/[0.05]
                                  px-3.5
                                  text-xs
                                  font-black
                                  text-violet-700

                                  hover:bg-violet-500/[0.10]

                                  disabled:opacity-50

                                  dark:text-violet-200
                                "
                              >
                                {acting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}

                                Rotate
                              </motion.button>

                              <motion.button
                                type="button"
                                whileHover={{
                                  y: -2,
                                }}
                                whileTap={{
                                  scale: 0.97,
                                }}
                                onClick={() =>
                                  void revokeKey(
                                    apiKey
                                  )
                                }
                                disabled={
                                  acting
                                }
                                className="
                                  inline-flex
                                  h-10
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  border
                                  border-red-200
                                  bg-red-500/[0.06]
                                  px-3.5
                                  text-xs
                                  font-black
                                  text-red-600

                                  hover:bg-red-500/[0.10]

                                  disabled:opacity-50

                                  dark:border-red-900/50
                                  dark:text-red-300
                                "
                              >
                                <Trash2 className="h-4 w-4" />

                                Revoke
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.article>
                    );
                  }
                )}
              </div>
            )}
          </motion.section>
        </div>
      </main>

      <CreateKeyDialog
        open={
          createOpen
        }
        onClose={() => {
          setCreateOpen(
            false
          );
        }}
        onCreated={(
          apiKey,
          message
        ) => {
          void handleCreated(
            apiKey,
            message
          );
        }}
      />

      <SecretDialog
        apiKey={
          revealedKey
        }
        message={
          revealedMessage
        }
        onClose={() => {
          setRevealedKey(
            null
          );

          setRevealedMessage(
            ""
          );
        }}
      />
    </>
  );
}