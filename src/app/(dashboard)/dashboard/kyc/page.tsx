"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Loader2,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

import {
  createLivenessChallenge,
  getCurrentEKYC,
  submitEKYC,
} from "@/lib/api/ekycApi";

import {
  getPasskeys,
  registerDevicePasskey,
  type PasskeySummary,
} from "@/lib/api/passkeyApi";

import type {
  ActiveLivenessAction,
  CompletedLivenessCapture,
  EKYCStatus,
  EKYCVerification,
} from "@/types/ekyc";

/* =========================================================
   FILE CONFIG
========================================================= */

const MAX_FILE_BYTES = 1024 * 1024;
const TARGET_FILE_BYTES = 800 * 1024;

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/* =========================================================
   FORM STATE
========================================================= */

interface FormState {
  claimedName: string;
  dateOfBirth: string;
  nid: string;
  frontImage: File | null;
  backImage: File | null;
  selfieImage: File | null;
  liveness: CompletedLivenessCapture | null;
}

const emptyForm: FormState = {
  claimedName: "",
  dateOfBirth: "",
  nid: "",
  frontImage: null,
  backImage: null,
  selfieImage: null,
  liveness: null,
};

/* =========================================================
   AGE
========================================================= */

function ageFromDOB(value: string): number {
  const birth = new Date(`${value}T00:00:00Z`);

  if (!Number.isFinite(birth.getTime())) {
    return -1;
  }

  const today = new Date();

  let age =
    today.getUTCFullYear() -
    birth.getUTCFullYear();

  if (
    today.getUTCMonth() <
      birth.getUTCMonth() ||
    (
      today.getUTCMonth() ===
        birth.getUTCMonth() &&
      today.getUTCDate() <
        birth.getUTCDate()
    )
  ) {
    age -= 1;
  }

  return age;
}

/* =========================================================
   IMAGE COMPRESSION
========================================================= */

async function compressImage(
  file: File,
): Promise<File> {
  if (!allowedTypes.has(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP images are supported.",
    );
  }

  if (file.size <= TARGET_FILE_BYTES) {
    return file;
  }

  const bitmap =
    await createImageBitmap(file);

  const scale = Math.min(
    1,
    1800 /
      Math.max(
        bitmap.width,
        bitmap.height,
      ),
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = Math.max(
    1,
    Math.round(
      bitmap.width * scale,
    ),
  );

  canvas.height = Math.max(
    1,
    Math.round(
      bitmap.height * scale,
    ),
  );

  const context =
    canvas.getContext("2d");

  if (!context) {
    bitmap.close();

    throw new Error(
      "Your browser could not optimize the selected image.",
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;

  while (quality >= 0.5) {
    blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            quality,
          );
        },
      );

    if (
      blob &&
      blob.size <= TARGET_FILE_BYTES
    ) {
      break;
    }

    quality -= 0.08;
  }

  if (
    !blob ||
    blob.size > MAX_FILE_BYTES
  ) {
    throw new Error(
      "The image is still larger than 1 MB after optimization.",
    );
  }

  return new File(
    [blob],
    `${file.name.replace(
      /\.[^.]+$/,
      "",
    )}.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    },
  );
}

/* =========================================================
   REJECTION MESSAGE
========================================================= */

function reasonMessage(
  reasons: string[],
): string {
  const reason = reasons[0];

  const messages: Record<string, string> = {
    AGE_UNDER_18:
      "The applicant must be at least 18 years old.",

    NID_MISMATCH:
      "The submitted NID did not match the authoritative identity record.",

    DOB_MISMATCH:
      "The date of birth did not match the identity record.",

    OCR_NID_MISMATCH:
      "The NID number could not be confirmed from the uploaded card.",

    OCR_DOB_MISMATCH:
      "The date of birth could not be confirmed from the uploaded card.",

    FACE_SCORE_REJECTED:
      "The selfie could not be matched confidently with the NID photograph.",

    LIVENESS_FAILED:
      "The live-person check was not completed successfully.",

    NID_ALREADY_VERIFIED:
      "This NID is already linked to another verified account.",

    ADMIN_OVERRIDE:
      "The verification was declined after manual review.",
  };

  return reason
    ? messages[reason] ||
        "The verification could not be approved."
    : "The verification could not be approved.";
}

/* =========================================================
   STATUS CONTENT
========================================================= */

const statusContent: Record<
  EKYCStatus,
  {
    title: string;
    description: string;
    icon: typeof Clock3;
    tone: string;
  }
> = {
  QUEUED: {
    title: "Verification queued",
    description:
      "Your encrypted application is waiting for automated processing.",
    icon: Clock3,
    tone:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-300",
  },

  PROCESSING: {
    title: "Identity checks in progress",
    description:
      "OCR, liveness, face matching, duplicate detection and compliance screening are running.",
    icon: ScanFace,
    tone:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300",
  },

  PENDING_MANUAL_REVIEW: {
    title: "Manual review required",
    description:
      "A protected reviewer will inspect the verification signals before making a final decision.",
    icon: ShieldCheck,
    tone:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300",
  },

  VERIFIED: {
    title: "Identity verified",
    description:
      "Your advanced e-KYC verification has been completed successfully.",
    icon: BadgeCheck,
    tone:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  },

  REJECTED: {
    title: "Verification not approved",
    description:
      "Review the reason below, correct the information and submit a new attempt.",
    icon: XCircle,
    tone:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300",
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function AdvancedKYCPage() {
  const [
    verification,
    setVerification,
  ] =
    useState<EKYCVerification | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      emptyForm,
    );

  const [
    step,
    setStep,
  ] =
    useState<1 | 2 | 3 | 4>(1);

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
    processingFile,
    setProcessingFile,
  ] =
    useState<string | null>(null);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD STATUS
  ====================================================== */

  const loadStatus =
    useCallback(
      async (silent = false) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const current =
            await getCurrentEKYC();

          setVerification(current);
          setError("");
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load e-KYC status.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  /* =======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  /* =======================================================
     POLLING
  ====================================================== */

  useEffect(() => {
    if (
      !verification ||
      ![
        "QUEUED",
        "PROCESSING",
      ].includes(
        verification.status,
      )
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void loadStatus(true);
        },
        4000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    verification,
    loadStatus,
  ]);

  /* =======================================================
     IDENTITY VALIDATION
  ====================================================== */

  const validateIdentity = () => {
    const nid =
      form.nid.replace(
        /[\s-]/g,
        "",
      );

    if (
      form.claimedName.trim().length <
      2
    ) {
      return "Enter your full name exactly as it appears on the NID.";
    }

    if (!form.dateOfBirth) {
      return "Select your date of birth.";
    }

    if (
      ageFromDOB(
        form.dateOfBirth,
      ) < 18
    ) {
      return "The applicant must be at least 18 years old.";
    }

    if (
      ![10, 13, 17].includes(
        nid.length,
      ) ||
      !/^\d+$/.test(nid)
    ) {
      return "NID must contain exactly 10, 13, or 17 digits.";
    }

    return "";
  };

  /* =======================================================
     FILE SELECT
  ====================================================== */

  const selectFile = async (
    field:
      | "frontImage"
      | "backImage"
      | "selfieImage",
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    try {
      setProcessingFile(field);
      setError("");

      const optimized =
        await compressImage(file);

      setForm(
        (current) => ({
          ...current,
          [field]: optimized,
        }),
      );
    } catch (fileError) {
      setError(
        fileError instanceof Error
          ? fileError.message
          : "Unable to process the image.",
      );
    } finally {
      setProcessingFile(null);
    }
  };

  /* =======================================================
     NEXT STEP
  ====================================================== */

  const goNext = () => {
    setError("");

    if (step === 1) {
      const validationError =
        validateIdentity();

      if (validationError) {
        setError(
          validationError,
        );
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (
        !form.frontImage ||
        !form.backImage
      ) {
        setError(
          "Upload clear images of the NID front and back.",
        );
        return;
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      if (
        !form.liveness ||
        !form.selfieImage
      ) {
        setError(
          "Complete the live camera challenge before continuing.",
        );
        return;
      }

      setStep(4);
    }
  };

  /* =======================================================
     SUBMIT
  ====================================================== */

  const submit =
    async () => {
      if (
        !form.frontImage ||
        !form.backImage ||
        !form.selfieImage ||
        !form.liveness
      ) {
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const response =
          await submitEKYC({
            claimedName:
              form.claimedName,

            dateOfBirth:
              form.dateOfBirth,

            nid:
              form.nid,

            frontImage:
              form.frontImage,

            backImage:
              form.backImage,

            selfieImage:
              form.selfieImage,

            liveness:
              form.liveness,
          });

        setVerification(
          response.verification,
        );

        setForm(
          emptyForm,
        );

        setStep(1);
      } catch (submitError) {
        setError(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to submit e-KYC.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
     START AGAIN
  ====================================================== */

  const startAgain =
    () => {
      setVerification(null);
      setForm(emptyForm);
      setStep(1);
      setError("");
    };

  /* =======================================================
     LOADING
  ====================================================== */

  if (loading) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* =================================================
            TOP HERO
        ================================================= */}

        <motion.header
          initial={{
            opacity: 0,
            y: -18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-indigo-900/20 bg-gradient-to-br from-[#170C35] via-[#31205F] to-[#5B35A6] p-5 text-white shadow-[0_28px_80px_rgba(49,32,106,.22)] sm:p-7 lg:p-8"
        >
          <motion.div
            animate={{
              scale: [
                0.9,
                1.1,
                0.9,
              ],
              opacity: [
                0.1,
                0.24,
                0.1,
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-[350px] w-[350px] rounded-full bg-indigo-300/15 blur-[100px]"
          />

          <motion.div
            animate={{
              x: [
                -15,
                20,
                -15,
              ],
              opacity: [
                0.06,
                0.18,
                0.06,
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-40 left-[25%] h-[290px] w-[290px] rounded-full bg-violet-300/10 blur-[100px]"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotate: 2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_15px_35px_rgba(0,0,0,.14)] backdrop-blur"
              >
                <Fingerprint className="h-7 w-7 text-violet-200" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Identity Security
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-bold text-emerald-100">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    Protected
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-[42px]">
                  Advanced e-KYC
                </h1>

                <p className="mt-3 max-w-3xl text-xs leading-6 text-violet-100/70 sm:text-sm">
                  Verify your Bangladesh NID through encrypted
                  document capture, live liveness checks,
                  identity matching and protected compliance
                  processing.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-bold text-violet-100/55">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                    NID verification
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                    Live biometric check
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                    Secure processing
                  </span>
                </div>
              </div>
            </div>

            {verification && (
              <motion.button
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                type="button"
                onClick={() =>
                  void loadStatus(
                    true,
                  )
                }
                disabled={refreshing}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 text-[11px] font-black text-white backdrop-blur transition hover:bg-white/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh status"}
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* =================================================
            ERROR
        ================================================= */}

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
              className="mt-4"
            >
              <div className="flex items-start gap-3 rounded-[20px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-rose-600 shadow-sm dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-rose-600 dark:text-rose-400">
                    Verification notice
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-rose-800 dark:text-rose-200">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            FORM / STATUS
        ================================================= */}

        <AnimatePresence mode="wait">
          {verification ? (
            <StatusPanel
              key="status"
              verification={
                verification
              }
              onStartAgain={
                startAgain
              }
            />
          ) : (
            <motion.section
              key="form"
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              transition={{
                duration: 0.35,
              }}
              className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            >
              <div className="overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_55px_rgba(15,23,42,.06)] dark:shadow-none">
                <div className="border-b border-border bg-muted/40 p-5 sm:p-7">
                  <StepHeader
                    step={step}
                  />
                </div>

                <div className="p-5 sm:p-7">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="identity"
                        initial={{
                          opacity: 0,
                          x: 16,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                        }}
                      >
                        <IdentityStep
                          form={form}
                          setForm={
                            setForm
                          }
                        />
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="documents"
                        initial={{
                          opacity: 0,
                          x: 16,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                        }}
                      >
                        <DocumentsStep
                          form={form}
                          processingFile={
                            processingFile
                          }
                          onSelect={
                            selectFile
                          }
                          onRemove={(
                            field,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                [field]:
                                  null,
                              }),
                            )
                          }
                        />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="biometrics"
                        initial={{
                          opacity: 0,
                          x: 16,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                        }}
                      >
                        <BiometricsStep
                          form={form}
                          setForm={
                            setForm
                          }
                          onError={
                            setError
                          }
                        />
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="review"
                        initial={{
                          opacity: 0,
                          x: 16,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                        }}
                      >
                        <ReviewStep
                          form={form}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setStep(
                          (
                            current,
                          ) =>
                            Math.max(
                              1,
                              current -
                                1,
                            ) as
                              | 1
                              | 2
                              | 3
                              | 4,
                        )
                      }
                      disabled={
                        step === 1 ||
                        submitting
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:invisible"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>

                    {step < 4 ? (
                      <motion.button
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        type="button"
                        onClick={
                          goNext
                        }
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(79,70,229,.20)] transition hover:from-indigo-700 hover:to-violet-700"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        type="button"
                        onClick={() =>
                          void submit()
                        }
                        disabled={
                          submitting
                        }
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(79,70,229,.20)] transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}

                        {submitting
                          ? "Submitting securely..."
                          : "Submit verification"}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              <SecurityAside />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* =========================================================
   STEP HEADER
========================================================= */

function StepHeader({
  step,
}: {
  step: 1 | 2 | 3 | 4;
}) {
  const labels = [
    "Identity",
    "Documents",
    "Biometrics",
    "Review",
  ];

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
            Verification progress
          </p>

          <p className="mt-1 text-sm font-black text-foreground">
            Step {step} of 4
          </p>
        </div>

        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
          {
            labels[
              step - 1
            ]
          }
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {labels.map(
          (
            label,
            index,
          ) => {
            const value =
              index + 1;

            const active =
              value <= step;

            return (
              <div key={label}>
                <motion.div
                  animate={{
                    scaleX:
                      active
                        ? 1
                        : 0.97,
                  }}
                  className={`h-1.5 origin-left rounded-full transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500"
                      : "bg-muted"
                  }`}
                />

                <p
                  className={`mt-2 text-[9px] font-black uppercase tracking-wider ${
                    active
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {value}.{" "}
                  {label}
                </p>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

/* =========================================================
   IDENTITY STEP
========================================================= */

function IdentityStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: Dispatch<
    SetStateAction<FormState>
  >;
}) {
  const field = (
    key:
      | "claimedName"
      | "dateOfBirth"
      | "nid",
    value: string,
  ) =>
    setForm(
      (
        current,
      ) => ({
        ...current,
        [key]: value,
      }),
    );

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
          <BadgeCheck className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
            Step 01
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Personal identity
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enter the information exactly as printed
            on your Bangladesh NID.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name on NID"
          className="sm:col-span-2"
        >
          <input
            value={
              form.claimedName
            }
            onChange={(
              event,
            ) =>
              field(
                "claimedName",
                event.target.value,
              )
            }
            autoComplete="name"
            maxLength={160}
            placeholder="Enter your full legal name"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </Field>

        <Field label="Date of birth">
          <input
            type="date"
            value={
              form.dateOfBirth
            }
            onChange={(
              event,
            ) =>
              field(
                "dateOfBirth",
                event.target.value,
              )
            }
            autoComplete="bday"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </Field>

        <Field label="NID number">
          <input
            inputMode="numeric"
            value={form.nid}
            onChange={(
              event,
            ) =>
              field(
                "nid",
                event.target.value.replace(
                  /[^\d\s-]/g,
                  "",
                ),
              )
            }
            autoComplete="off"
            placeholder="10, 13 or 17 digits"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </Field>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-indigo-200 bg-indigo-50 p-4 text-[11px] leading-5 text-indigo-800 dark:border-indigo-900/70 dark:bg-indigo-950/25 dark:text-indigo-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />

        <div>
          <p className="font-black">
            Protected identity information
          </p>

          <p className="mt-1 opacity-75">
            Your NID number, date of birth and name
            are encrypted before they are stored.
            They are never placed in the processing
            queue.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   DOCUMENTS
========================================================= */

function DocumentsStep({
  form,
  processingFile,
  onSelect,
  onRemove,
}: {
  form: FormState;
  processingFile:
    | string
    | null;
  onSelect: (
    field:
      | "frontImage"
      | "backImage"
      | "selfieImage",
    file?: File,
  ) => void;
  onRemove: (
    field:
      | "frontImage"
      | "backImage"
      | "selfieImage",
  ) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
          <FileCheck2 className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Step 02
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Identity documents
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Use clear, uncropped images. Each file is
            optimized and must remain below 1 MB.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <UploadCard
          title="NID front"
          hint="All details readable"
          file={
            form.frontImage
          }
          loading={
            processingFile ===
            "frontImage"
          }
          icon={
            <FileCheck2 />
          }
          onSelect={(
            file,
          ) =>
            onSelect(
              "frontImage",
              file,
            )
          }
          onRemove={() =>
            onRemove(
              "frontImage",
            )
          }
        />

        <UploadCard
          title="NID back"
          hint="Complete back side"
          file={
            form.backImage
          }
          loading={
            processingFile ===
            "backImage"
          }
          icon={
            <FileCheck2 />
          }
          onSelect={(
            file,
          ) =>
            onSelect(
              "backImage",
              file,
            )
          }
          onRemove={() =>
            onRemove(
              "backImage",
            )
          }
        />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-violet-200 bg-violet-50 p-4 text-[11px] leading-5 text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/25 dark:text-violet-200">
        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />

        <div>
          <p className="font-black">
            Live selfie comes next
          </p>

          <p className="mt-1 opacity-75">
            Your selfie will be captured directly
            from the live camera in the next step.
            Gallery uploads are not accepted as live
            evidence.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LIVENESS LABELS
========================================================= */

const challengeLabels: Record<
  ActiveLivenessAction,
  string
> = {
  BLINK:
    "Blink both eyes naturally",

  TURN_LEFT:
    "Slowly turn your head left",

  TURN_RIGHT:
    "Slowly turn your head right",
};

/* =========================================================
   BIOMETRICS
========================================================= */

function BiometricsStep({
  form,
  setForm,
  onError,
}: {
  form: FormState;
  setForm: Dispatch<
    SetStateAction<FormState>
  >;
  onError: (
    message: string,
  ) => void;
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const streamRef =
    useRef<MediaStream | null>(
      null,
    );

  const recorderRef =
    useRef<MediaRecorder | null>(
      null,
    );

  const chunksRef =
    useRef<Blob[]>([]);

  const sessionRef =
    useRef<
      Awaited<
        ReturnType<
          typeof createLivenessChallenge
        >
      > | null
    >(null);

  const startedAtRef =
    useRef("");

  const [
    cameraStarting,
    setCameraStarting,
  ] =
    useState(false);

  const [
    recording,
    setRecording,
  ] =
    useState(false);

  const [
    challengeIndex,
    setChallengeIndex,
  ] =
    useState(0);

  const stopCamera =
    useCallback(() => {
      streamRef.current
        ?.getTracks()
        .forEach(
          (
            track,
          ) =>
            track.stop(),
        );

      streamRef.current =
        null;

      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }
    }, []);

  useEffect(
    () => () => {
      stopCamera();
    },
    [stopCamera],
  );

  /* =======================================================
     BEGIN LIVE CHECK
  ====================================================== */

  const beginLiveness =
    async () => {
      if (
        !navigator.mediaDevices
          ?.getUserMedia ||
        typeof MediaRecorder ===
          "undefined"
      ) {
        onError(
          "This browser does not support secure live camera recording. Use a current Chrome or Edge browser.",
        );

        return;
      }

      try {
        setCameraStarting(
          true,
        );

        onError("");

        setForm(
          (
            current,
          ) => ({
            ...current,
            selfieImage:
              null,
            liveness:
              null,
          }),
        );

        const session =
          await createLivenessChallenge();

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: false,
              video: {
                facingMode: "user",
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
            },
          );

        streamRef.current =
          stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        const candidates = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
          "video/mp4",
        ];

        const mimeType =
          candidates.find(
            (
              value,
            ) =>
              MediaRecorder.isTypeSupported(
                value,
              ),
          );

        const recorder =
          new MediaRecorder(
            stream,
            mimeType
              ? {
                  mimeType,
                }
              : undefined,
          );

        chunksRef.current = [];

        recorder.ondataavailable =
          (
            event,
          ) => {
            if (
              event.data.size >
              0
            ) {
              chunksRef.current.push(
                event.data,
              );
            }
          };

        recorder.start(
          500,
        );

        recorderRef.current =
          recorder;

        sessionRef.current =
          session;

        startedAtRef.current =
          new Date().toISOString();

        setChallengeIndex(0);
        setRecording(true);
      } catch (captureError) {
        stopCamera();

        onError(
          captureError instanceof
            Error
            ? captureError.message
            : "Unable to start the live camera.",
        );
      } finally {
        setCameraStarting(
          false,
        );
      }
    };

  /* =======================================================
     FINISH LIVE CHECK
  ====================================================== */

  const finishLiveness =
    async () => {
      const recorder =
        recorderRef.current;

      const session =
        sessionRef.current;

      const video =
        videoRef.current;

      if (
        !recorder ||
        !session ||
        !video ||
        challengeIndex <
          session.challenges.length
      ) {
        return;
      }

      const completedAt =
        new Date().toISOString();

      const duration =
        new Date(
          completedAt,
        ).getTime() -
        new Date(
          startedAtRef.current,
        ).getTime();

      if (
        duration <
        6000
      ) {
        onError(
          "Keep the camera running for at least 6 seconds, then finish the live check.",
        );

        return;
      }

      try {
        onError("");

        const canvas =
          document.createElement(
            "canvas",
          );

        canvas.width =
          video.videoWidth ||
          720;

        canvas.height =
          video.videoHeight ||
          720;

        const context =
          canvas.getContext(
            "2d",
          );

        if (!context) {
          throw new Error(
            "Unable to capture the live selfie frame.",
          );
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const selfieBlob =
          await new Promise<Blob>(
            (
              resolve,
              reject,
            ) => {
              canvas.toBlob(
                (
                  blob,
                ) => {
                  if (
                    blob
                  ) {
                    resolve(
                      blob,
                    );
                  } else {
                    reject(
                      new Error(
                        "Unable to create the live selfie.",
                      ),
                    );
                  }
                },
                "image/jpeg",
                0.88,
              );
            },
          );

        const selfie =
          await compressImage(
            new File(
              [
                selfieBlob,
              ],
              "live-selfie.jpg",
              {
                type: "image/jpeg",
              },
            ),
          );

        const recordingBlob =
          await new Promise<Blob>(
            (
              resolve,
              reject,
            ) => {
              recorder.onerror =
                () =>
                  reject(
                    new Error(
                      "Live recording failed.",
                    ),
                  );

              recorder.onstop =
                () => {
                  const type =
                    recorder.mimeType.startsWith(
                      "video/mp4",
                    )
                      ? "video/mp4"
                      : "video/webm";

                  resolve(
                    new Blob(
                      chunksRef.current,
                      {
                        type,
                      },
                    ),
                  );
                };

              recorder.stop();
            },
          );

        if (
          !recordingBlob.size ||
          recordingBlob.size >
            8 *
              1024 *
              1024
        ) {
          throw new Error(
            "The liveness recording must be smaller than 8 MB. Please retry.",
          );
        }

        const extension =
          recordingBlob.type ===
          "video/mp4"
            ? "mp4"
            : "webm";

        const liveness: CompletedLivenessCapture =
          {
            session,
            startedAt:
              startedAtRef.current,
            completedAt,
            selfie,
            video:
              new File(
                [
                  recordingBlob,
                ],
                `active-liveness.${extension}`,
                {
                  type:
                    recordingBlob.type,
                },
              ),
          };

        setForm(
          (
            current,
          ) => ({
            ...current,
            selfieImage:
              selfie,
            liveness,
          }),
        );

        setRecording(false);
        stopCamera();
      } catch (captureError) {
        if (
          recorder.state !==
          "inactive"
        ) {
          recorder.stop();
        }

        setRecording(false);
        stopCamera();

        onError(
          captureError instanceof
            Error
            ? captureError.message
            : "Unable to finish the live check.",
        );
      }
    };

  const session =
    sessionRef.current;

  const currentChallenge =
    session?.challenges[
      challengeIndex
    ];

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
          <ScanFace className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
            Step 03
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Live biometric checks
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Complete the live camera challenge. After
            your identity is verified, you can protect
            payments with Windows Hello or your device passkey.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,.75fr)]">
        {/* CAMERA */}
        <section className="overflow-hidden rounded-[24px] border border-border bg-muted shadow-sm">
          <div className="relative aspect-video overflow-hidden bg-slate-950">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full scale-x-[-1] object-cover ${
                recording
                  ? "block"
                  : "hidden"
              }`}
            />

            {!recording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-violet-200/10 bg-white/[0.07]">
                  {form.liveness ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  ) : (
                    <ScanFace className="h-8 w-8 text-violet-300" />
                  )}
                </div>

                <p className="mt-4 text-base font-black">
                  {form.liveness
                    ? "Live check completed"
                    : "Camera is off"}
                </p>

                <p className="mt-2 max-w-sm text-[10px] leading-5 text-slate-400">
                  Use good lighting and keep your
                  full face visible.
                </p>
              </div>
            )}

            {recording && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-rose-200/10 bg-rose-600 px-3 py-1.5 text-[9px] font-black text-white shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            )}
          </div>

          <div className="bg-card p-4">
            {recording &&
            session ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {session.challenges.map(
                    (
                      challenge,
                      index,
                    ) => (
                      <div
                        key={
                          challenge
                        }
                        className={`rounded-xl border p-2.5 text-center text-[9px] font-black ${
                          index <
                          challengeIndex
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300"
                            : index ===
                              challengeIndex
                              ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
                              : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {index <
                        challengeIndex
                          ? "✓ "
                          : `${index + 1}. `}

                        {challenge.replace(
                          "_",
                          " ",
                        )}
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5 rounded-[18px] border border-indigo-200 bg-indigo-50 p-4 text-center dark:border-indigo-900/60 dark:bg-indigo-950/25">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-indigo-500 dark:text-indigo-400">
                    Current action
                  </p>

                  <p className="mt-1 text-sm font-black text-foreground">
                    {currentChallenge
                      ? challengeLabels[
                          currentChallenge
                        ]
                      : "All actions completed"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    currentChallenge
                      ? setChallengeIndex(
                          (
                            value,
                          ) =>
                            value +
                            1,
                        )
                      : void finishLiveness()
                  }
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-xs font-black text-white transition hover:from-indigo-700 hover:to-violet-700"
                >
                  {currentChallenge ? (
                    <>
                      <Check className="h-4 w-4" />
                      I completed this action
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Finish live capture
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void beginLiveness()
                }
                disabled={
                  cameraStarting
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-xs font-black text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
              >
                {cameraStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}

                {form.liveness
                  ? "Retake live check"
                  : cameraStarting
                    ? "Starting camera..."
                    : "Start live camera check"}
              </button>
            )}
          </div>
        </section>

        {/* DEVICE BIOMETRIC */}
        <section className="rounded-[24px] border border-border bg-muted/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-violet-600 shadow-sm dark:text-violet-300">
              <Fingerprint className="h-6 w-6" />
            </div>

            <span className="rounded-full border border-violet-200 bg-background px-2.5 py-1 text-[8px] font-black text-violet-700 dark:border-violet-800 dark:text-violet-300">
              After KYC
            </span>
          </div>

          <h3 className="mt-5 text-sm font-black text-foreground">
            Windows Hello protection
          </h3>

          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            Once e-KYC is verified, register this device
            using Windows Hello, fingerprint, face unlock,
            or device PIN. Your biometric never leaves the
            device; the server stores only a public key.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/25">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <p className="text-[10px] leading-5 text-indigo-800 dark:text-indigo-200">
              This is real WebAuthn device verification,
              not a simulated fingerprint capture.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   UPLOAD CARD
========================================================= */

function UploadCard({
  title,
  hint,
  file,
  loading,
  icon,
  onSelect,
  onRemove,
  capture,
}: {
  title: string;
  hint: string;
  file: File | null;
  loading: boolean;
  icon: ReactNode;
  onSelect: (
    file?: File,
  ) => void;
  onRemove: () => void;
  capture?: "user";
}) {
  const preview =
    useMemo(
      () =>
        file
          ? URL.createObjectURL(
              file,
            )
          : "",
      [file],
    );

  const fileName =
    file?.name ?? "";

  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(
          preview,
        );
      }
    },
    [preview],
  );

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`relative min-h-[255px] overflow-hidden rounded-[24px] border-2 border-dashed ${
        file
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
          : "border-violet-200 bg-violet-50/50 dark:border-violet-900/60 dark:bg-violet-950/20"
      }`}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={`${title} preview`}
            className="h-[175px] w-full object-cover"
          />

          <div className="border-t border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

                  <p className="truncate text-xs font-black text-foreground">
                    {title}
                  </p>
                </div>

                <p className="mt-1 truncate text-[9px] text-muted-foreground">
                  {fileName}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                Ready
              </span>
            </div>

            <button
              type="button"
              onClick={onRemove}
              className="mt-2 text-[10px] font-bold text-rose-600 hover:underline dark:text-rose-400"
            >
              Remove and replace
            </button>
          </div>
        </>
      ) : (
        <label className="flex min-h-[255px] cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-card">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={capture}
            className="sr-only"
            onChange={(event) =>
              onSelect(
                event.target.files?.[0],
              )
            }
          />

          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-violet-600 shadow-sm ring-1 ring-violet-100 dark:text-violet-300 dark:ring-violet-900/60">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              icon
            )}
          </span>

          <span className="mt-4 text-sm font-black text-foreground">
            {loading
              ? "Optimizing..."
              : title}
          </span>

          <span className="mt-1 max-w-[220px] text-[10px] leading-5 text-muted-foreground">
            {hint}
          </span>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
            <UploadCloud className="h-3.5 w-3.5" />
            Choose image
          </span>

          <span className="mt-3 text-[8px] font-semibold text-muted-foreground">
            JPG · PNG · WEBP
          </span>
        </label>
      )}
    </motion.div>
  );
}

/* =========================================================
   REVIEW
========================================================= */

function ReviewStep({
  form,
}: {
  form: FormState;
}) {
  const rows = [
    [
      "Full name",
      form.claimedName,
    ],

    [
      "Date of birth",
      form.dateOfBirth,
    ],

    [
      "NID number",
      form.nid.replace(
        /\d(?=\d{4})/g,
        "•",
      ),
    ],

    [
      "NID front",
      form.frontImage?.name ||
        "Missing",
    ],

    [
      "NID back",
      form.backImage?.name ||
        "Missing",
    ],

    [
      "Selfie",
      form.selfieImage?.name ||
        "Missing",
    ],

    [
      "Live challenge",
      form.liveness
        ? "Completed"
        : "Missing",
    ],

    [
      "Device biometric",
      "Windows Hello setup becomes available after verification",
    ],
  ];

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Step 04
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Review and submit
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Confirm the information before starting
            automated verification.
          </p>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-[22px] border border-border bg-card">
        {rows.map(
          (
            [label, value],
            index,
          ) => (
            <div
              key={label}
              className={`flex items-center justify-between gap-5 px-4 py-4 ${
                index <
                rows.length - 1
                  ? "border-b border-border"
                  : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>

                <p className="mt-1 truncate text-xs font-bold text-foreground">
                  {value}
                </p>
              </div>

              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            </div>
          ),
        )}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

        <div>
          <p className="font-black">
            Final confirmation
          </p>

          <p className="mt-1 opacity-75">
            By submitting, you confirm that the
            information and images belong to you and
            may be used only for identity verification
            and fraud prevention.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY ASIDE
========================================================= */

function SecurityAside() {
  const items = [
    [
      "Encrypted identity fields",
      "AES-256-GCM protects sensitive values at rest.",
    ],

    [
      "Private image delivery",
      "Workers receive short-lived signed evidence URLs.",
    ],

    [
      "Layered verification",
      "OCR, liveness, identity, duplicate and compliance checks.",
    ],

    [
      "Tamper-evident history",
      "Important actions are written to a hash-linked audit trail.",
    ],
  ];

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: 12,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="relative overflow-hidden rounded-[30px] border border-violet-900/40 bg-gradient-to-br from-[#170C35] via-[#28144F] to-[#4A2A82] p-6 text-white shadow-[0_22px_65px_rgba(48,31,105,.18)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-14 h-48 w-48 rounded-full bg-violet-300/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <ShieldCheck className="h-5 w-5 text-violet-200" />
        </div>

        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/60">
          Secure pipeline
        </p>

        <h2 className="mt-1 text-xl font-black">
          Protected verification
        </h2>

        <p className="mt-2 text-xs leading-5 text-violet-100/55">
          Your evidence moves through a restricted
          verification pipeline.
        </p>

        <div className="mt-7 space-y-5">
          {items.map(
            (
              [title, text],
              index,
            ) => (
              <motion.div
                key={title}
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
                    0.08 +
                    index *
                      0.06,
                }}
                className="flex gap-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-violet-200">
                  <Check className="h-3 w-3" />
                </span>

                <div>
                  <p className="text-[10px] font-black text-white">
                    {title}
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-400">
                    {text}
                  </p>
                </div>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </motion.aside>
  );
}

/* =========================================================
   STATUS PANEL
========================================================= */

function StatusPanel({
  verification,
  onStartAgain,
}: {
  verification: EKYCVerification;
  onStartAgain: () => void;
}) {
  const [passkeys, setPasskeys] =
    useState<PasskeySummary[]>([]);

  const [passkeyLoading, setPasskeyLoading] =
    useState(false);

  const [passkeyMessage, setPasskeyMessage] =
    useState("");

  const loadRegisteredPasskeys =
    useCallback(async () => {
      if (verification.status !== "VERIFIED") {
        return;
      }

      try {
        const registered =
          await getPasskeys();

        setPasskeys(registered);
      } catch (passkeyError) {
        setPasskeyMessage(
          passkeyError instanceof Error
            ? passkeyError.message
            : "Unable to load registered devices.",
        );
      }
    }, [verification.status]);

  useEffect(() => {
    void loadRegisteredPasskeys();
  }, [loadRegisteredPasskeys]);

  const setupDevicePasskey =
    async () => {
      try {
        setPasskeyLoading(true);
        setPasskeyMessage("");

        await registerDevicePasskey(
          "Windows Hello",
        );

        await loadRegisteredPasskeys();
        setPasskeyMessage(
          "Windows Hello was registered successfully.",
        );
      } catch (passkeyError) {
        setPasskeyMessage(
          passkeyError instanceof Error
            ? passkeyError.message
            : "Windows Hello registration failed.",
        );
      } finally {
        setPasskeyLoading(false);
      }
    };

  const config =
    statusContent[
      verification.status
    ];

  const Icon =
    config.icon;

  const activeStep =
    verification.status ===
    "QUEUED"
      ? 1
      : verification.status ===
          "PROCESSING"
        ? 2
        : 3;

  return (
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
      }}
      className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_55px_rgba(49,32,106,.06)] dark:shadow-none">
        <div className="relative overflow-hidden bg-muted/35 p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/5 blur-3xl" />

          <div className="relative z-10">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] ${config.tone}`}
            >
              <Icon
                className={`h-4 w-4 ${
                  verification.status ===
                  "PROCESSING"
                    ? "animate-pulse"
                    : ""
                }`}
              />

              {verification.status.replaceAll(
                "_",
                " ",
              )}
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {config.title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {
                config.description
              }
            </p>

            {verification.status ===
              "REJECTED" && (
              <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-rose-600 dark:text-rose-400">
                    Review reason
                  </p>

                  <p className="mt-1 text-xs leading-5 text-rose-700 dark:text-rose-200">
                    {reasonMessage(
                      verification.reasonCodes,
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                "Application secured",
                "Automated checks",
                "Final decision",
              ].map(
                (
                  label,
                  index,
                ) => {
                  const done =
                    index + 1 <=
                    activeStep;

                  return (
                    <div
                      key={label}
                      className={`rounded-[20px] border p-4 ${
                        done
                          ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/25"
                          : "border-border bg-muted"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          done
                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                            : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {done ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <p
                        className={`mt-3 text-[9px] font-black ${
                          done
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                  );
                },
              )}
            </div>

            {verification.canResubmit && (
              <button
                type="button"
                onClick={
                  onStartAgain
                }
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-xs font-black text-white shadow-[0_12px_24px_rgba(79,70,229,.20)] transition hover:from-indigo-700 hover:to-violet-700"
              >
                <RefreshCw className="h-4 w-4" />
                Start a new attempt
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-border bg-card p-6 shadow-[0_14px_45px_rgba(49,32,106,.05)] dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
            <FileCheck2 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
              Verification reference
            </p>

            <p className="mt-1 text-xs font-black text-foreground">
              Current application
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/25">
          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-indigo-500 dark:text-indigo-400">
            Reference ID
          </p>

          <p className="mt-2 break-all font-mono text-xs font-bold leading-5 text-indigo-900 dark:text-indigo-200">
            {verification.id}
          </p>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            Submitted
          </p>

          <p className="mt-2 text-xs font-bold text-foreground">
            {verification.submittedAt
              ? new Date(
                  verification.submittedAt,
                ).toLocaleString()
              : "Just now"}
          </p>
        </div>

        <div className="mt-5 rounded-[20px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />

            <p className="text-[10px] leading-5 text-muted-foreground">
              Do not share your verification
              reference or identity images with
              anyone.
            </p>
          </div>
        </div>

        {verification.status === "VERIFIED" && (
          <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <Fingerprint className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-600 dark:text-emerald-400">
                  Payment protection
                </p>

                <p className="mt-1 text-xs font-black text-foreground">
                  {passkeys.length > 0
                    ? `${passkeys.length} device passkey${passkeys.length === 1 ? "" : "s"} registered`
                    : "Set up Windows Hello"}
                </p>

                <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                  Approve future payments with the biometric or PIN protected by this device. The server stores only the credential public key.
                </p>

                {passkeyMessage && (
                  <p className="mt-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    {passkeyMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void setupDevicePasskey()
                  }
                  disabled={passkeyLoading}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passkeyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}

                  {passkeyLoading
                    ? "Waiting for Windows Hello..."
                    : passkeys.length > 0
                      ? "Add another device"
                      : "Set up this device"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[30px] border border-border bg-card">
          <div className="h-36 animate-pulse bg-gradient-to-r from-indigo-950/10 via-violet-950/10 to-slate-500/10" />

          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-5 w-36 animate-pulse rounded-full bg-muted" />

            <div className="h-8 w-64 animate-pulse rounded-xl bg-muted" />

            <div className="h-4 max-w-xl animate-pulse rounded-full bg-muted" />

            <div className="grid gap-4 pt-3 lg:grid-cols-[1fr_320px]">
              <div className="h-52 animate-pulse rounded-2xl bg-muted" />

              <div className="h-52 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center pt-8">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-400" />

            <p className="text-xs font-black text-muted-foreground">
              Loading advanced e-KYC...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
