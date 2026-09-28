"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UploadCloud,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getMerchantVerification,
  submitMerchantVerification,
  type MerchantRegistrationType,
  type MerchantVerificationData,
  type MerchantVerificationStatus,
} from "@/lib/api/merchantVerificationApi";

/* =========================================================
   CONFIGURATION
========================================================= */

const REGISTRATION_OPTIONS: Array<{
  value: MerchantRegistrationType;
  label: string;
  description: string;
}> = [
  {
    value: "trade_license",
    label: "Trade license",
    description:
      "Government-issued trade license for your business.",
  },
  {
    value: "company_registration",
    label: "Company registration",
    description:
      "Registered company or incorporation certificate.",
  },
  {
    value: "partnership_deed",
    label: "Partnership deed",
    description:
      "Legal partnership deed or equivalent registration.",
  },
  {
    value: "other",
    label: "Other registration",
    description:
      "Another accepted legal business registration record.",
  },
];

const ACCEPTED_FILES =
  ".pdf,.jpg,.jpeg,.png,.webp";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

/* =========================================================
   PURPLE SIGNATURE BACKGROUND
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
          x: [0, 95, 20, 0],
          y: [0, 30, 75, 0],
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
          -top-36
          h-[420px]
          w-[420px]
          rounded-full
          bg-fuchsia-400/30
          blur-[110px]
        "
      />

      <motion.div
        aria-hidden
        animate={{
          x: [0, -85, 25, 0],
          y: [0, -35, 55, 0],
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
          opacity: [0.15, 0.32, 0.15],
          scale: [0.85, 1.2, 0.9],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          left-[40%]
          top-[8%]
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
          duration: 46,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[10%]
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
        aria-hidden
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
        aria-hidden
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
    return "—";
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

function formatFileSize(
  bytes: number
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "0 KB";
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.ceil(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function statusContent(
  status:
    MerchantVerificationStatus | undefined
): {
  label: string;
  description: string;
  icon: React.ElementType;
  badgeClass: string;
} {
  if (
    status === "verified"
  ) {
    return {
      label: "Verified",
      description:
        "Business verification is complete and live API access is enabled.",
      icon: CheckCircle2,
      badgeClass:
        "border-emerald-200/20 bg-emerald-300/15 text-emerald-100",
    };
  }

  if (
    status === "submitted" ||
    status === "under_review"
  ) {
    return {
      label:
        status ===
        "under_review"
          ? "Under review"
          : "Submitted",

      description:
        "Your business documents are waiting for an administrator's decision.",

      icon: Clock3,

      badgeClass:
        "border-amber-200/20 bg-amber-300/15 text-amber-100",
    };
  }

  if (
    status === "rejected"
  ) {
    return {
      label:
        "Action required",

      description:
        "Review the rejection reason, correct the information, and submit again.",

      icon:
        XCircle,

      badgeClass:
        "border-red-200/20 bg-red-300/15 text-red-100",
    };
  }

  return {
    label:
      "Not submitted",

    description:
      "Submit your business information to request live payment access.",

    icon:
      FileText,

    badgeClass:
      "border-white/15 bg-white/10 text-white",
  };
}

function documentLabel(
  kind: string
): string {
  if (
    kind ===
    "registration"
  ) {
    return "Registration document";
  }

  if (
    kind ===
    "tax"
  ) {
    return "Tax document";
  }

  if (
    kind ===
    "bank"
  ) {
    return "Bank ownership proof";
  }

  return "Business document";
}

function validateFile(
  file: File
): string {
  const acceptedTypes =
    new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

  if (
    !acceptedTypes.has(
      file.type
    )
  ) {
    return "Select a PDF, JPG, PNG, or WEBP file.";
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    return "The selected file must be 5 MB or smaller.";
  }

  return "";
}

/* =========================================================
   API ACCESS STAT CARD
========================================================= */

function AccessCard({
  title,
  value,
  description,
  icon:
    Icon,
  tone,
  index,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone:
    | "purple"
    | "emerald"
    | "sky"
    | "amber";
  index: number;
}) {
  const iconClass =
    tone ===
    "emerald"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone ===
          "sky"
        ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
        : tone ===
            "amber"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
          : "bg-violet-500/10 text-violet-600 dark:text-violet-300";

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
          0.07,
      }}
      whileHover={{
        scale: 1.006,
      }}
      className="
        merchant-border
        merchant-shadow

        group
        relative
        h-full
        min-w-0
        overflow-hidden
        rounded-[22px]
        border
        bg-[linear-gradient(145deg,rgba(124,58,237,0.065),rgba(168,85,247,0.02),rgba(255,255,255,0.94))]
        p-5
        transition-all
        duration-300

        hover:shadow-[0_20px_45px_rgba(91,33,182,.13)]

        dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.12),rgba(88,28,135,0.07),rgba(15,23,42,.92))]
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
              0.06,
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
          -right-10
          -top-12
          h-32
          w-32
          rounded-full
          bg-violet-500/[0.07]
          blur-3xl
          transition
          duration-300

          group-hover:bg-violet-500/[0.15]
        "
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-600/70 dark:text-violet-300/70">
            {
              title
            }
          </p>

          <p className="mt-2 break-words text-lg font-black leading-tight tracking-[-0.03em] text-foreground [overflow-wrap:anywhere]">
            {
              value
            }
          </p>

          <p className="mt-2 max-w-[230px] break-words text-[10px] font-semibold leading-4 merchant-muted [overflow-wrap:anywhere]">
            {
              description
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
        </motion.div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   CUSTOM REGISTRATION DROPDOWN
========================================================= */

function RegistrationTypeDropdown({
  value,
  onChange,
}: {
  value:
    MerchantRegistrationType;

  onChange: (
    value:
      MerchantRegistrationType
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const ref =
    useRef<HTMLDivElement | null>(
      null
    );

  const selected =
    REGISTRATION_OPTIONS.find(
      (
        option
      ) =>
        option.value ===
        value
    ) ??
    REGISTRATION_OPTIONS[0];

  useEffect(
    () => {
      function handleOutside(
        event:
          MouseEvent
      ) {
        if (
          ref.current &&
          !ref.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handleOutside
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutside
        );
      };
    },
    []
  );

  return (
    <div
      ref={
        ref
      }
      className={`relative ${open ? "z-[80]" : "z-30"}`}
    >
      <motion.button
        type="button"
        whileTap={{
          scale: 0.985,
        }}
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`
          flex
          min-h-11
          w-full
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          bg-background
          px-3.5
          py-2.5
          text-left
          transition-all

          ${
            open
              ? "border-violet-400 ring-4 ring-violet-500/10"
              : "merchant-border hover:border-violet-400/45"
          }
        `}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {
              selected.label
            }
          </p>

          <p className="mt-0.5 truncate text-[9px] merchant-muted">
            {
              selected.description
            }
          </p>
        </div>

        <motion.div
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-violet-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 7,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
            }}
            className="
              absolute
              left-0
              right-0
              top-full
              z-[90]
              min-w-[220px]
              max-w-[calc(100vw-2rem)]
              overflow-hidden
              rounded-2xl
              border
              merchant-border
              bg-card
              p-1.5
              shadow-[0_24px_65px_rgba(40,10,70,.24)]
              backdrop-blur-xl
            "
          >
            {REGISTRATION_OPTIONS.map(
              (
                option,
                index
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <motion.button
                    key={
                      option.value
                    }
                    type="button"
                    initial={{
                      opacity: 0,
                      x: 8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.025,
                    }}
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition

                      ${
                        active
                          ? "bg-violet-500/10"
                          : "hover:bg-violet-500/[0.05]"
                      }
                    `}
                  >
                    <div className="min-w-0">
                      <p
                        className={`
                          text-xs
                          font-black

                          ${
                            active
                              ? "text-violet-700 dark:text-violet-300"
                              : "text-foreground"
                          }
                        `}
                      >
                        {
                          option.label
                        }
                      </p>

                      <p className="mt-1 text-[9px] merchant-muted">
                        {
                          option.description
                        }
                      </p>
                    </div>

                    {active && (
                      <Check className="h-4 w-4 shrink-0 text-violet-600" />
                    )}
                  </motion.button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   FILE FIELD
========================================================= */

function FileField({
  id,
  title,
  description,
  required,
  value,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  required?: boolean;
  value: File | null;
  onChange: (
    file: File | null
  ) => void;
}) {
  return (
    <motion.div
      whileHover={{
        scale: 1.004,
      }}
      className="
        merchant-border

        group
        relative
        overflow-hidden
        rounded-[20px]
        border
        bg-violet-500/[0.025]
        p-4
        transition-all

        hover:border-violet-400/35
        hover:bg-violet-500/[0.05]
        hover:shadow-[0_14px_35px_rgba(91,33,182,.08)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-28
          w-28
          rounded-full
          bg-violet-500/[0.07]
          blur-3xl
        "
      />

      <div className="relative flex min-w-0 items-start gap-3">
        <motion.div
          whileHover={{
            rotate: -6,
            scale: 1.1,
          }}
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <UploadCloud className="h-4 w-4" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={
                id
              }
              className="text-sm font-black text-foreground"
            >
              {
                title
              }
            </label>

            <span
              className="
                rounded-full
                bg-violet-500/[0.07]
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
              {required
                ? "Required"
                : "Optional"}
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 merchant-muted">
            {
              description
            }
          </p>

          <input
            id={
              id
            }
            type="file"
            accept={
              ACCEPTED_FILES
            }
            required={
              required
            }
            onChange={(
              event
            ) => {
              onChange(
                event.target
                  .files?.[0] ||
                  null
              );
            }}
            className="
              mt-3
              block
              w-full
              text-xs
              merchant-muted

              file:mr-3
              file:cursor-pointer
              file:rounded-lg
              file:border-0
              file:bg-violet-600
              file:px-3
              file:py-2
              file:text-xs
              file:font-black
              file:text-white
              file:transition

              hover:file:bg-violet-700
            "
          />

          <AnimatePresence>
            {value && (
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
                  y: -5,
                }}
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  border
                  border-violet-300/20
                  bg-violet-500/[0.04]
                  px-3
                  py-2
                "
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-foreground">
                    {
                      value.name
                    }
                  </p>

                  <p className="mt-0.5 text-[10px] text-violet-500">
                    {formatFileSize(
                      value.size
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      null
                    )
                  }
                  aria-label={`Remove ${title}`}
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-red-200
                    bg-red-500/[0.05]
                    text-red-500
                    transition

                    hover:bg-red-500/10
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantVerificationPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const [
    data,
    setData,
  ] =
    useState<MerchantVerificationData | null>(
      null
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
    submitting,
    setSubmitting,
  ] =
    useState(false);

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
    legalBusinessName,
    setLegalBusinessName,
  ] =
    useState("");

  const [
    registrationType,
    setRegistrationType,
  ] =
    useState<MerchantRegistrationType>(
      "trade_license"
    );

  const [
    registrationNumber,
    setRegistrationNumber,
  ] =
    useState("");

  const [
    businessAddress,
    setBusinessAddress,
  ] =
    useState("");

  const [
    registrationDocument,
    setRegistrationDocument,
  ] =
    useState<File | null>(
      null
    );

  const [
    taxDocument,
    setTaxDocument,
  ] =
    useState<File | null>(
      null
    );

  const [
    bankDocument,
    setBankDocument,
  ] =
    useState<File | null>(
      null
    );

  /* =======================================================
     LOAD
  ======================================================= */

  const loadVerification =
    useCallback(
      async (
        silent =
          false
      ) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setData(null);
          setError("");
          setNotice("");

          return;
        }

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
            await getMerchantVerification();

          setData(
            result
          );

          setLegalBusinessName(
            (
              current
            ) =>
              current ||
              result.verification
                ?.legalBusinessName ||
              result.merchant
                .businessName ||
              ""
          );

          setBusinessAddress(
            (
              current
            ) =>
              current ||
              result.verification
                ?.businessAddress ||
              ""
          );

          if (
            result.verification
              ?.registrationType
          ) {
            setRegistrationType(
              result.verification
                .registrationType
            );
          }
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load merchant verification."
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
      [
        isMerchantRole,
      ]
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void loadVerification();
    },
    [
      isMerchantRole,
      loadVerification,
    ]
  );

  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const currentStatus =
    data?.verification
      ?.status;

  const status =
    useMemo(
      () =>
        statusContent(
          currentStatus
        ),
      [
        currentStatus,
      ]
    );

  const StatusIcon =
    status.icon;

  const reviewPending =
    currentStatus ===
      "submitted" ||
    currentStatus ===
      "under_review";

  const verified =
    currentStatus ===
      "verified" &&
    data?.apiAccess
      .live ===
      true;

  const canSubmit =
    data?.ownerIdentity
      .verified ===
      true &&
    !reviewPending &&
    !verified;

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!isMerchantRole) {
        return;
      }

      setError(
        ""
      );

      setNotice(
        ""
      );

      if (
        !registrationDocument
      ) {
        setError(
          "Select the business registration document."
        );

        return;
      }

      const files = [
        registrationDocument,
        taxDocument,
        bankDocument,
      ].filter(
        (
          file
        ): file is File =>
          Boolean(
            file
          )
      );

      for (
        const file of files
      ) {
        const fileError =
          validateFile(
            file
          );

        if (
          fileError
        ) {
          setError(
            `${file.name}: ${fileError}`
          );

          return;
        }
      }

      try {
        setSubmitting(
          true
        );

        const response =
          await submitMerchantVerification({
            legalBusinessName:
              legalBusinessName.trim(),

            registrationType,

            registrationNumber:
              registrationNumber.trim(),

            businessAddress:
              businessAddress.trim(),

            registrationDocument,

            taxDocument:
              taxDocument ||
              undefined,

            bankDocument:
              bankDocument ||
              undefined,
          });

        setData(
          response.data
        );

        setNotice(
          response.message ||
            "Business documents submitted successfully."
        );

        setRegistrationDocument(
          null
        );

        setTaxDocument(
          null
        );

        setBankDocument(
          null
        );

        setRegistrationNumber(
          ""
        );
      } catch (
        submitError
      ) {
        setError(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to submit merchant verification."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     MERCHANT-ONLY REDIRECTING
  ======================================================= */

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant verification is available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="merchant-theme min-h-full">
      <div className="mx-auto w-full max-w-[1450px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HERO
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
            duration: 0.6,
          }}
          whileHover={{
            scale: 1.002,
          }}
          className="
            relative
            overflow-hidden
            rounded-[30px]
            p-6
            text-white
            shadow-[0_28px_70px_rgba(91,33,182,.28)]

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
            <div className="min-w-0 max-w-[820px]">
              <div className="flex min-w-0 items-start gap-3">
                <motion.div
                  whileHover={{
                    rotate: -7,
                    scale: 1.1,
                  }}
                  transition={
                    springTransition
                  }
                  className="
                    flex
                    h-12
                    w-12
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
                  <BadgeCheck className="h-5 w-5" />
                </motion.div>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.20em] text-fuchsia-100/55">
                    Merchant KYB
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-black sm:text-xl">
                      Business verification
                    </span>

                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-white/15
                        bg-white/10
                        px-2.5
                        py-1
                        text-[8px]
                        font-black
                        uppercase
                        tracking-wide
                        text-fuchsia-100
                      "
                    >
                      <ShieldCheck className="h-3 w-3" />

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

                  Business identity
                </div>

                <h1
                  className="
                    mt-3
                    max-w-[800px]
                    break-words
                    text-[34px]
                    font-black
                    [overflow-wrap:anywhere]
                    leading-[1.02]
                    tracking-[-0.055em]

                    sm:text-[42px]
                    lg:text-[48px]
                  "
                >
                  Verify your business and
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
                    unlock live payments.
                  </span>
                </h1>

                <p className="mt-4 max-w-[700px] text-[13px] font-medium leading-6 text-white/70 sm:text-sm">
                  Link your verified owner identity with valid
                  business documents to securely activate Coffer
                  live payment processing.
                </p>
              </motion.div>
            </div>

            <motion.button
              type="button"
              whileHover={{
                y: -3,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void loadVerification(
                  true
                );
              }}
              disabled={
                refreshing
              }
              className="
                inline-flex
                h-11
                w-full
                shrink-0
                items-center

                sm:w-auto
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
                shadow-lg
                backdrop-blur-xl

                hover:bg-white/15

                disabled:opacity-60
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
          </div>
        </motion.header>

        {/* =================================================
            ALERTS
        ================================================== */}

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
                y: -6,
              }}
              role="alert"
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

                dark:border-red-900/50
                dark:text-red-300
              "
            >
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="min-w-0 break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere]">
                  {
                    error
                  }
                </p>
              </div>

              <button
                type="button"
                className="shrink-0"
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
              role="status"
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
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="min-w-0 break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere]">
                  {
                    notice
                  }
                </p>
              </div>

              <button
                type="button"
                className="shrink-0"
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
            LOADING
        ================================================== */}

        {loading ? (
          <div
            className="
              merchant-border
              merchant-surface
              merchant-shadow

              flex
              min-h-[420px]
              items-center
              justify-center
              rounded-[24px]
              border
            "
          >
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />

              <p className="mt-3 text-sm font-semibold merchant-muted">
                Loading verification...
              </p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* =================================================
                ACCESS CARDS
            ================================================== */}

            <section className="grid gap-4 lg:grid-cols-3">
              <AccessCard
                title="Owner identity"
                value={
                  data.ownerIdentity
                    .verified
                    ? "NID e-KYC verified"
                    : "NID e-KYC required"
                }
                description={
                  data.ownerIdentity
                    .verified
                    ? "The merchant owner identity has been securely verified."
                    : "Owner identity must be verified before business submission."
                }
                icon={
                  data.ownerIdentity
                    .verified
                    ? CheckCircle2
                    : ShieldCheck
                }
                tone={
                  data.ownerIdentity
                    .verified
                    ? "emerald"
                    : "amber"
                }
                index={
                  0
                }
              />

              <AccessCard
                title="Test API"
                value={
                  data.apiAccess
                    .test
                    ? "Available"
                    : "Disabled"
                }
                description="Sandbox payment access for development and integration testing."
                icon={
                  TestTube2
                }
                tone="sky"
                index={
                  1
                }
              />

              <AccessCard
                title="Live API"
                value={
                  data.apiAccess
                    .live
                    ? "Enabled"
                    : "Locked"
                }
                description={
                  data.apiAccess
                    .live
                    ? "Production payment access is available."
                    : "Complete business verification to unlock production access."
                }
                icon={
                  Zap
                }
                tone={
                  data.apiAccess
                    .live
                    ? "emerald"
                    : "purple"
                }
                index={
                  2
                }
              />
            </section>

            {/* =================================================
                STATUS — SECOND PURPLE SECTION
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
                rounded-[25px]
                p-5
                text-white
                shadow-[0_24px_60px_rgba(91,33,182,.23)]

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

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div className="flex min-w-0 items-start gap-4">
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
                    <StatusIcon className="h-5 w-5" />
                  </motion.div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-100/55">
                      Verification status
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black">
                        Merchant verification
                      </h2>

                      <span
                        className={`
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-[9px]
                          font-black

                          ${status.badgeClass}
                        `}
                      >
                        {
                          status.label
                        }
                      </span>
                    </div>

                    <p className="mt-2 max-w-2xl break-words text-xs leading-5 text-white/65 [overflow-wrap:anywhere]">
                      {
                        status.description
                      }
                    </p>

                    {data.verification
                      ?.submittedAt && (
                      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.10em] text-fuchsia-100/50">
                        Submitted{" "}
                        {formatDate(
                          data
                            .verification
                            .submittedAt
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {verified && (
                  <motion.div
                    whileHover={{
                      y: -3,
                    }}
                  >
                    <Link
                      href="/dashboard/merchant/api-keys"
                      className="
                        inline-flex
                        h-11
                        w-full
                        shrink-0
                        items-center

                        sm:w-auto
                        justify-center
                        gap-2
                        rounded-xl
                        bg-white
                        px-4
                        text-xs
                        font-black
                        text-violet-700
                        shadow-[0_12px_30px_rgba(20,0,40,.20)]

                        hover:bg-fuchsia-50
                      "
                    >
                      <KeyRound className="h-4 w-4" />

                      Create live key

                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* =================================================
                OWNER KYC REQUIRED
            ================================================== */}

            {!data.ownerIdentity
              .verified && (
              <motion.section
                initial={{
                  opacity: 0,
                  y: 14,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                whileHover={{
                  y: -4,
                }}
                className="
                  rounded-[22px]
                  border
                  border-amber-200
                  bg-amber-500/[0.07]
                  p-5
                  text-amber-800

                  dark:border-amber-900/50
                  dark:text-amber-200
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
                  <div className="flex min-w-0 items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-black leading-tight [overflow-wrap:anywhere]">
                        Verify the merchant owner first
                      </h2>

                      <p className="mt-1 max-w-2xl text-xs leading-5">
                        Complete the existing Coffer NID,
                        selfie, liveness and identity
                        verification before submitting merchant
                        business documents.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/kyc"
                    className="
                      inline-flex
                      h-10
                      w-full
                      shrink-0
                      items-center

                      sm:w-auto
                      justify-center
                      gap-2
                      rounded-xl
                      bg-violet-600
                      px-4
                      text-xs
                      font-black
                      text-white
                      shadow-[0_10px_25px_rgba(124,58,237,.20)]
                      transition

                      hover:bg-violet-700
                    "
                  >
                    Complete e-KYC

                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.section>
            )}

            {/* =================================================
                CURRENT SUBMISSION
            ================================================== */}

            {data.verification && (
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
                  y: -3,
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
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    border-b
                    border-violet-300/20
                    bg-violet-500/[0.04]
                    px-5
                    py-4
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

                      dark:text-violet-300
                    "
                  >
                    <FileCheck2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-500">
                      Submitted information
                    </p>

                    <h2 className="mt-0.5 text-base font-black text-foreground">
                      Current submission
                    </h2>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label:
                          "Legal business name",

                        value:
                          data.verification
                            .legalBusinessName,
                      },

                      {
                        label:
                          "Registration number",

                        value:
                          data.verification
                            .registrationNumberMasked,
                      },

                      {
                        label:
                          "Business address",

                        value:
                          data.verification
                            .businessAddress,
                      },
                    ].map(
                      (
                        item,
                        index
                      ) => (
                        <motion.div
                          key={
                            item.label
                          }
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.05,
                          }}
                          whileHover={{
                            y: -3,
                          }}
                          className="
                            rounded-2xl
                            border
                            merchant-border
                            bg-violet-500/[0.025]
                            p-4

                            last:sm:col-span-2
                          "
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-500/75">
                            {
                              item.label
                            }
                          </p>

                          <p className="mt-2 break-words text-sm font-black leading-6 text-foreground [overflow-wrap:anywhere]">
                            {
                              item.value
                            }
                          </p>
                        </motion.div>
                      )
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-500">
                      Submitted documents
                    </p>

                    <div className="mt-3 space-y-2">
                      {data.verification
                        .documents.map(
                          (
                            document,
                            index
                          ) => (
                            <motion.div
                              key={
                                document.kind
                              }
                              initial={{
                                opacity: 0,
                                x: 10,
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
                              whileHover={{
                                scale: 1.002,
                              }}
                              className="
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                border
                                merchant-border
                                bg-violet-500/[0.03]
                                p-3
                                transition

                                hover:border-violet-400/30
                                hover:bg-violet-500/[0.055]
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

                                  dark:text-violet-300
                                "
                              >
                                <FileCheck2 className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-black text-foreground">
                                  {documentLabel(
                                    document.kind
                                  )}
                                </p>

                                <p className="mt-0.5 text-[10px] text-violet-500">
                                  {formatFileSize(
                                    document.size
                                  )}
                                </p>
                              </div>
                            </motion.div>
                          )
                        )}
                    </div>
                  </div>
                </div>

                {currentStatus ===
                  "rejected" &&
                  data.verification
                    .rejectionReason && (
                    <div className="border-t merchant-border p-5">
                      <div
                        className="
                          rounded-2xl
                          border
                          border-red-200
                          bg-red-500/[0.06]
                          p-4
                          text-red-600

                          dark:border-red-900/50
                          dark:text-red-300
                        "
                      >
                        <p className="text-[9px] font-black uppercase tracking-wide">
                          Rejection reason
                        </p>

                        <p className="mt-2 break-words text-sm leading-6 [overflow-wrap:anywhere]">
                          {
                            data.verification
                              .rejectionReason
                          }
                        </p>
                      </div>
                    </div>
                  )}
              </motion.section>
            )}

            {/* =================================================
                SUBMISSION FORM
            ================================================== */}

            {canSubmit && (
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

                  overflow-visible
                  rounded-[26px]
                  border
                "
              >
                {/* THIRD PURPLE AREA */}

                <div
                  className="
                    relative
                    overflow-hidden
                    p-5
                    text-white

                    sm:p-6
                  "
                >
                  <PurpleAuroraBackground />

                  <div className="relative z-10 flex min-w-0 items-start gap-4">
                    <motion.div
                      whileHover={{
                        rotate: -6,
                        scale: 1.1,
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
                      <Building2 className="h-5 w-5" />
                    </motion.div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-fuchsia-100/55">
                        Business documents
                      </p>

                      <h2 className="mt-1 break-words text-base font-black leading-tight [overflow-wrap:anywhere]">
                        {currentStatus ===
                        "rejected"
                          ? "Resubmit verification"
                          : "Submit business documents"}
                      </h2>

                      <p className="mt-1 max-w-2xl text-xs leading-5 text-white/60">
                        Files are stored privately and reviewed
                        only by authorized administrators.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-6 p-5 sm:p-6"
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    {/* LEGAL NAME */}

                    <div>
                      <label
                        htmlFor="legalBusinessName"
                        className="mb-2 block text-xs font-black text-foreground"
                      >
                        Legal business name
                      </label>

                      <input
                        id="legalBusinessName"
                        type="text"
                        required
                        minLength={
                          2
                        }
                        maxLength={
                          160
                        }
                        value={
                          legalBusinessName
                        }
                        onChange={(
                          event
                        ) =>
                          setLegalBusinessName(
                            event
                              .target
                              .value
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
                          transition

                          focus:border-violet-400
                          focus:ring-4
                          focus:ring-violet-500/10
                        "
                      />
                    </div>

                    {/* CUSTOM REGISTRATION TYPE */}

                    <div>
                      <label className="mb-2 block text-xs font-black text-foreground">
                        Registration type
                      </label>

                      <RegistrationTypeDropdown
                        value={
                          registrationType
                        }
                        onChange={(
                          value
                        ) => {
                          if (!isMerchantRole) {
                            return;
                          }

                          setRegistrationType(
                            value
                          );
                        }}
                      />
                    </div>

                    {/* REGISTRATION NUMBER */}

                    <div>
                      <label
                        htmlFor="registrationNumber"
                        className="mb-2 block text-xs font-black text-foreground"
                      >
                        Registration number
                      </label>

                      <input
                        id="registrationNumber"
                        type="text"
                        required
                        minLength={
                          4
                        }
                        maxLength={
                          100
                        }
                        value={
                          registrationNumber
                        }
                        onChange={(
                          event
                        ) =>
                          setRegistrationNumber(
                            event
                              .target
                              .value
                          )
                        }
                        autoComplete="off"
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

                    {/* ADDRESS */}

                    <div>
                      <label
                        htmlFor="businessAddress"
                        className="mb-2 block text-xs font-black text-foreground"
                      >
                        Registered business address
                      </label>

                      <textarea
                        id="businessAddress"
                        required
                        minLength={
                          5
                        }
                        maxLength={
                          500
                        }
                        rows={
                          3
                        }
                        value={
                          businessAddress
                        }
                        onChange={(
                          event
                        ) =>
                          setBusinessAddress(
                            event
                              .target
                              .value
                          )
                        }
                        className="
                          w-full
                          resize-none
                          rounded-xl
                          border
                          merchant-border
                          bg-background
                          px-3.5
                          py-3
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
                  </div>

                  {/* FILES */}

                  <div>
                    <div className="mb-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-500">
                        Verification documents
                      </p>

                      <p className="mt-1 text-xs merchant-muted">
                        PDF, JPG, PNG or WEBP. Maximum 5 MB per file.
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <FileField
                        id="registrationDocument"
                        title="Registration document"
                        description="Trade license, registration certificate, or equivalent record."
                        required
                        value={
                          registrationDocument
                        }
                        onChange={
                          setRegistrationDocument
                        }
                      />

                      <FileField
                        id="taxDocument"
                        title="Tax document"
                        description="Tax, TIN, or another supporting business tax document."
                        value={
                          taxDocument
                        }
                        onChange={
                          setTaxDocument
                        }
                      />

                      <FileField
                        id="bankDocument"
                        title="Bank ownership proof"
                        description="Proof that the settlement account belongs to this business."
                        value={
                          bankDocument
                        }
                        onChange={
                          setBankDocument
                        }
                      />
                    </div>
                  </div>

                  {/* SUBMIT */}

                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      border-t
                      merchant-border
                      pt-5

                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <div className="max-w-2xl">
                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-500">
                        Review required
                      </p>

                      <p className="mt-1 text-xs leading-5 merchant-muted">
                        Submitting documents does not immediately
                        enable live payments. An administrator
                        must approve both the verified owner
                        identity and business documentation.
                      </p>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{
                        y: -3,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      disabled={
                        submitting
                      }
                      className="
                        inline-flex
                        h-11
                        w-full
                        shrink-0
                        items-center

                        sm:w-auto
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
                        shadow-[0_12px_30px_rgba(124,58,237,.25)]

                        hover:shadow-[0_16px_38px_rgba(124,58,237,.34)]

                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}

                      {submitting
                        ? "Submitting..."
                        : "Submit for review"}
                    </motion.button>
                  </div>
                </form>
              </motion.section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}