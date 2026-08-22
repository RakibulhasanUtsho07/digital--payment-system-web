"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileImage,
  Fingerprint,
  IdCard,
  Info,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
  CircleCheck,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

type DocumentType =
  | "nid"
  | "passport"
  | "driving_license";

interface KYCResponse {
  success: boolean;
  message: string;
  userKycStatus: KYCStatus;
  kyc: {
    status: KYCStatus;
    documentType?: DocumentType;
    documentNumber?: string;
    frontImageUrl?: string;
    backImageUrl?: string;
    selfieImageUrl?: string;
  };
}

/* =========================================================
   CONSTANTS
========================================================= */

const steps = [
  {
    id: 1,
    title: "Identity",
    subtitle: "Basic details",
    description: "Tell us which identity document you will use.",
    icon: IdCard,
  },
  {
    id: 2,
    title: "Documents",
    subtitle: "Upload ID",
    description: "Upload clear images of your identity document.",
    icon: FileImage,
  },
  {
    id: 3,
    title: "Selfie",
    subtitle: "Face verification",
    description: "Confirm that the document belongs to you.",
    icon: Fingerprint,
  },
  {
    id: 4,
    title: "Review",
    subtitle: "Final submission",
    description: "Review your information and submit the application.",
    icon: FileCheck2,
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function KYCPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [status, setStatus] =
    useState<KYCStatus>("not_started");

  const [documentType, setDocumentType] =
    useState<DocumentType>("nid");

  const [documentNumber, setDocumentNumber] =
    useState("");

  const [frontImage, setFrontImage] =
    useState<File | null>(null);

  const [backImage, setBackImage] =
    useState<File | null>(null);

  const [selfieImage, setSelfieImage] =
    useState<File | null>(null);

  const [frontPreview, setFrontPreview] =
    useState("");

  const [backPreview, setBackPreview] =
    useState("");

  const [selfiePreview, setSelfiePreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingStatus, setLoadingStatus] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================================================
     LOAD KYC STATUS
  ========================================================= */

  useEffect(() => {
    const loadKYC = async () => {
      try {
        setLoadingStatus(true);
        setErrorMessage("");

        const data =
          await apiClient<KYCResponse>(
            "/kyc/status"
          );

        setStatus(
          data.userKycStatus
        );

        if (data.kyc.documentType) {
          setDocumentType(
            data.kyc.documentType
          );
        }

        if (data.kyc.documentNumber) {
          setDocumentNumber(
            data.kyc.documentNumber
          );
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load KYC information."
        );
      } finally {
        setLoadingStatus(false);
      }
    };

    loadKYC();
  }, []);

  /* =========================================================
     FILE VALIDATION
  ========================================================= */

  const validateImage = (
    file: File
  ): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB.";
    }

    return null;
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const validationError =
      validateImage(file);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setMessage("");

    const preview =
      URL.createObjectURL(file);

    if (type === "front") {
      setFrontImage(file);
      setFrontPreview(preview);
    }

    if (type === "back") {
      setBackImage(file);
      setBackPreview(preview);
    }

    if (type === "selfie") {
      setSelfieImage(file);
      setSelfiePreview(preview);
    }
  };

  const clearFile = (
    type: "front" | "back" | "selfie"
  ) => {
    if (type === "front") {
      setFrontImage(null);
      setFrontPreview("");
    }

    if (type === "back") {
      setBackImage(null);
      setBackPreview("");
    }

    if (type === "selfie") {
      setSelfieImage(null);
      setSelfiePreview("");
    }
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateStep = (): boolean => {
    setErrorMessage("");
    setMessage("");

    if (currentStep === 1) {
      if (!documentType) {
        setErrorMessage(
          "Please select a document type."
        );
        return false;
      }

      if (!documentNumber.trim()) {
        setErrorMessage(
          "Please enter your document number."
        );
        return false;
      }

      return true;
    }

    if (currentStep === 2) {
      if (!frontImage) {
        setErrorMessage(
          "Please upload the front side of your document."
        );
        return false;
      }

      if (
        documentType === "nid" &&
        !backImage
      ) {
        setErrorMessage(
          "Please upload the back side of your NID."
        );
        return false;
      }

      return true;
    }

    if (currentStep === 3) {
      if (!selfieImage) {
        setErrorMessage(
          "Please upload a selfie."
        );
        return false;
      }

      return true;
    }

    return true;
  };

  /* =========================================================
     SAVE IDENTITY
  ========================================================= */

  const saveIdentity = async () => {
    await apiClient(
      "/kyc/start",
      {
        method: "POST",
        body: JSON.stringify({
          documentType,
          documentNumber:
            documentNumber.trim(),
        }),
      }
    );

    setStatus("pending");
  };

  /* =========================================================
     NEXT
  ========================================================= */

  const handleNext = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);

      if (currentStep === 1) {
        await saveIdentity();
      }

      setCurrentStep(
        (step) => step + 1
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to continue."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const handlePrevious = () => {
    setErrorMessage("");
    setMessage("");

    setCurrentStep(
      (step) => Math.max(1, step - 1)
    );
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    if (
      !frontImage ||
      (documentType === "nid" &&
        !backImage) ||
      !selfieImage
    ) {
      setErrorMessage(
        "Please complete all required document and selfie uploads."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setMessage("");

      const formData =
        new FormData();

      formData.append(
        "documentType",
        documentType
      );

      formData.append(
        "documentNumber",
        documentNumber.trim()
      );

      formData.append(
        "frontImage",
        frontImage
      );

      if (backImage) {
        formData.append(
          "backImage",
          backImage
        );
      }

      formData.append(
        "selfieImage",
        selfieImage
      );

      const response =
        await fetch(
          `${
            process.env
              .NEXT_PUBLIC_API_URL ||
            "http://localhost:5000/api"
          }/kyc/submit`,
          {
            method: "PUT",
            credentials: "include",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "KYC submission failed."
        );
      }

      setStatus(
        data.userKycStatus ||
          "pending"
      );

      setMessage(
        "Your KYC application has been submitted successfully. Our verification team will review it."
      );

      setCurrentStep(4);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "KYC submission failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const statusMeta =
    useMemo(() => {
      switch (status) {
        case "verified":
          return {
            label: "Verified",
            description:
              "Your identity has been successfully verified.",
            icon: CheckCircle2,
            className:
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            accent:
              "bg-emerald-500",
          };

        case "rejected":
          return {
            label: "Rejected",
            description:
              "Your application needs correction or additional information.",
            icon: AlertCircle,
            className:
              "border-red-200 bg-red-50 text-red-700",
            accent:
              "bg-red-500",
          };

        case "under_review":
          return {
            label: "Under Review",
            description:
              "Our verification team is reviewing your information.",
            icon: Clock3,
            className:
              "border-amber-200 bg-amber-50 text-amber-700",
            accent:
              "bg-amber-500",
          };

        case "pending":
          return {
            label: "Pending",
            description:
              "Your KYC process has started.",
            icon: Clock3,
            className:
              "border-blue-200 bg-blue-50 text-blue-700",
            accent:
              "bg-blue-500",
          };

        default:
          return {
            label: "Not Started",
            description:
              "Complete the steps below to verify your identity.",
            icon: ShieldCheck,
            className:
              "border-slate-200 bg-slate-50 text-slate-600",
            accent:
              "bg-slate-400",
          };
      }
    }, [status]);

  const StatusIcon =
    statusMeta.icon;

  /* =========================================================
     LOADING
  ========================================================= */

  if (loadingStatus) {
    return (
      <main className="min-h-[70vh] bg-[#F4F7FB]">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex flex-col items-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC]">
              <Loader2 className="h-7 w-7 animate-spin text-[#1F5EA8]" />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#334155]">
              Loading verification status
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Preparing your secure KYC workspace...
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  /* =========================================================
     VERIFIED
  ========================================================= */

  if (status === "verified") {
    return (
      <main className="min-h-[80vh] bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
            className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_25px_80px_rgba(23,54,93,0.08)]"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#EFFBF5] via-white to-[#EEF6FF] px-6 py-14 text-center sm:px-10">
              <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />

              <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-blue-200/25 blur-3xl" />

              <motion.div
                initial={{
                  scale: 0.7,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 180,
                }}
                className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-emerald-100 bg-emerald-50 text-emerald-600 shadow-lg"
              >
                <CheckCircle2 className="h-11 w-11" />
              </motion.div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Identity Verified
              </p>

              <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#162A43] sm:text-4xl">
                Your wallet is verified.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Your identity verification is complete. Verified wallet
                features and protected financial actions are now available to
                your account.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <StatusPill
                  icon={ShieldCheck}
                  label="Identity Verified"
                />

                <StatusPill
                  icon={LockKeyhole}
                  label="Protected Account"
                />

                <StatusPill
                  icon={CheckCircle2}
                  label="Verification Complete"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-160px] top-[140px] h-[360px] w-[360px] rounded-full bg-[#1F5EA8]/[0.035] blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-300/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

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
            duration: 0.55,
          }}
          className="mb-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DCEAF7] bg-white px-3 py-1.5 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1F5EA8]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#1F5EA8]">
                  Secure Identity Verification
                </span>
              </div>

              <h1 className="font-serif text-3xl font-bold tracking-[-0.03em] text-[#162A43] sm:text-4xl lg:text-5xl">
                Verify your identity.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Complete a simple verification process to unlock secure wallet
                capabilities and protect your account.
              </p>
            </div>

            {/* status */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${statusMeta.className}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusMeta.accent}`}
              />

              {statusMeta.label}
            </div>
          </div>
        </motion.div>

        {/* =====================================================
            TOP INFO GRID
        ====================================================== */}

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">

          {/* Status Card */}
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
              delay: 0.08,
              duration: 0.5,
            }}
            className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(23,54,93,0.07)] sm:p-7"
          >
            <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-[#1F5EA8]/[0.045] blur-2xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#1F5EA8]">
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Current Status
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#162A43]">
                      {statusMeta.label}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {statusMeta.description}
                </p>
              </div>

              <ProgressRing
                step={currentStep}
                total={4}
              />
            </div>
          </motion.div>

          {/* Security Card */}
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
              delay: 0.16,
              duration: 0.5,
            }}
            className="relative overflow-hidden rounded-[1.75rem] bg-[#173D68] p-6 text-white shadow-[0_20px_60px_rgba(23,54,93,0.12)]"
          >
            <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-[#4EA3E3]/10 blur-2xl" />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#9DDCFF]">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <p className="mt-5 text-sm font-semibold">
                Why verify your identity?
              </p>

              <div className="mt-4 space-y-3">
                <SecurityPoint text="Protect your account" />
                <SecurityPoint text="Enable secure wallet actions" />
                <SecurityPoint text="Support higher-trust transactions" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            MAIN KYC WORKSPACE
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
            duration: 0.6,
          }}
          className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_80px_rgba(23,54,93,0.08)]"
        >

          {/* ===================================================
              STEPPER
          ==================================================== */}

          <div className="border-b border-slate-100 bg-[#F8FAFC] p-4 sm:p-6 lg:p-7">
            <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
              {/* connecting line */}
              <div className="pointer-events-none absolute left-[10%] right-[10%] top-[28px] hidden h-px bg-slate-200 md:block" />

              <motion.div
                animate={{
                  width: `${Math.max(
                    0,
                    ((currentStep - 1) / 3) * 80
                  )}%`,
                }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                }}
                className="pointer-events-none absolute left-[10%] top-[28px] hidden h-px bg-gradient-to-r from-[#1F5EA8] to-[#62B9F0] md:block"
              />

              {steps.map((step) => {
                const Icon = step.icon;

                const active =
                  currentStep === step.id;

                const completed =
                  currentStep > step.id;

                return (
                  <motion.div
                    key={step.id}
                    layout
                    className="relative z-10"
                  >
                    <div
                      className={`rounded-2xl border p-3 transition-all sm:p-4 ${
                        active
                          ? "border-[#BFDDF5] bg-white shadow-[0_10px_30px_rgba(31,94,168,0.10)]"
                          : completed
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-transparent bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            scale: active
                              ? [1, 1.06, 1]
                              : 1,
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: active
                              ? Infinity
                              : 0,
                          }}
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            active
                              ? "bg-[#1F5EA8] text-white shadow-lg shadow-[#1F5EA8]/20"
                              : completed
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </motion.div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold ${
                              active
                                ? "text-[#162A43]"
                                : completed
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                          >
                            {step.title}
                          </p>

                          <p className="mt-1 hidden text-[9px] text-slate-400 sm:block">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ===================================================
              CONTENT
          ==================================================== */}

          <div className="p-5 sm:p-8 lg:p-10">

            {/* Alerts */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  key="error"
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {message && (
                <motion.div
                  key="message"
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
                >
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                STEP CONTENT
            ================================================== */}

            <AnimatePresence mode="wait">

              {/* STEP 1 */}
              {currentStep === 1 && (
                <motion.div
                  key="identity"
                  initial={{
                    opacity: 0,
                    x: 25,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -25,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="mx-auto max-w-3xl"
                >
                  <StepHeading
                    step="01"
                    eyebrow="Identity Information"
                    title="Choose your identity document"
                    description="Select the document you want to use and enter its identification number."
                  />

                  {/* document cards */}
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {(
                      [
                        {
                          value: "nid",
                          title: "National ID",
                          description:
                            "Government-issued NID",
                          icon: IdCard,
                        },
                        {
                          value: "passport",
                          title: "Passport",
                          description:
                            "Valid international passport",
                          icon: FileCheck2,
                        },
                        {
                          value: "driving_license",
                          title: "Driving License",
                          description:
                            "Valid driving license",
                          icon: FileImage,
                        },
                      ] as {
                        value: DocumentType;
                        title: string;
                        description: string;
                        icon: typeof IdCard;
                      }[]
                    ).map((item) => {
                      const selected =
                        documentType ===
                        item.value;

                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.value}
                          type="button"
                          whileHover={{
                            y: -3,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          onClick={() =>
                            setDocumentType(
                              item.value
                            )
                          }
                          className={`relative overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all ${
                            selected
                              ? "border-[#75B9E8] bg-[#EEF7FD] shadow-[0_15px_35px_rgba(31,94,168,0.10)]"
                              : "border-slate-200 bg-white hover:border-[#C7DFF2] hover:bg-slate-50"
                          }`}
                        >
                          {selected && (
                            <motion.div
                              layoutId="selected-document"
                              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F5EA8] text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.div>
                          )}

                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                              selected
                                ? "bg-[#1F5EA8] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <p className="mt-5 text-sm font-bold text-[#162A43]">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-slate-400">
                            {item.description}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* number */}
                  <div className="mt-7">
                    <label
                      htmlFor="documentNumber"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                    >
                      Document Number
                    </label>

                    <div className="relative">
                      <input
                        id="documentNumber"
                        value={documentNumber}
                        onChange={(e) =>
                          setDocumentNumber(
                            e.target.value
                          )
                        }
                        placeholder="Enter your document number"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-[#FAFBFD] px-4 text-sm text-slate-900 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-[#1F5EA8]/10"
                      />

                      <IdCard className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  {/* privacy */}
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#DCEAF7] bg-[#F4F9FD] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
                      <LockKeyhole className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#334155]">
                        Your identity stays protected
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Identity information is used for verification and
                        account protection.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <motion.div
                  key="documents"
                  initial={{
                    opacity: 0,
                    x: 25,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -25,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="mx-auto max-w-4xl"
                >
                  <StepHeading
                    step="02"
                    eyebrow="Document Verification"
                    title="Upload your identity document"
                    description="Make sure your document is fully visible, sharp and readable."
                  />

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <UploadBox
                      label="Front Side"
                      description="JPG, PNG or WEBP • Max 5MB"
                      preview={frontPreview}
                      onClear={() =>
                        clearFile("front")
                      }
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          "front"
                        )
                      }
                    />

                    <UploadBox
                      label="Back Side"
                      description={
                        documentType === "nid"
                          ? "Required for National ID"
                          : "Optional"
                      }
                      preview={backPreview}
                      onClear={() =>
                        clearFile("back")
                      }
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          "back"
                        )
                      }
                    />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <QualityPoint text="Fully visible" />
                    <QualityPoint text="Good lighting" />
                    <QualityPoint text="Readable details" />
                  </div>
                </motion.div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <motion.div
                  key="selfie"
                  initial={{
                    opacity: 0,
                    x: 25,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -25,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="mx-auto max-w-3xl"
                >
                  <StepHeading
                    step="03"
                    eyebrow="Face Verification"
                    title="Confirm your identity with a selfie"
                    description="Use a recent clear photo with your face fully visible."
                  />

                  <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F8FAFC] p-5 sm:p-7">
                    {selfiePreview ? (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        className="relative mx-auto max-w-sm overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-2 shadow-sm"
                      >
                        <img
                          src={selfiePreview}
                          alt="Selfie preview"
                          className="aspect-[4/5] w-full rounded-[1.4rem] object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            clearFile("selfie")
                          }
                          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <label className="mx-auto flex max-w-sm cursor-pointer flex-col items-center justify-center rounded-[1.7rem] border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center transition-all hover:border-[#76B8E5] hover:bg-[#F4F9FD]">
                        <motion.div
                          animate={{
                            y: [0, -5, 0],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FC] text-[#1F5EA8]"
                        >
                          <UserRound className="h-8 w-8" />
                        </motion.div>

                        <p className="mt-5 text-sm font-bold text-[#334155]">
                          Upload your selfie
                        </p>

                        <p className="mt-2 max-w-xs text-[11px] leading-5 text-slate-400">
                          Use a recent, clear photo with your face fully
                          visible.
                        </p>

                        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#1F5EA8]/20">
                          <Upload className="h-4 w-4" />
                          Choose Selfie
                        </span>

                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              "selfie"
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <QualityPoint text="Face clearly visible" />
                    <QualityPoint text="Good lighting" />
                    <QualityPoint text="No sunglasses" />
                  </div>
                </motion.div>
              )}

              {/* STEP 4 */}
              {currentStep === 4 && (
                <motion.div
                  key="review"
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                  }}
                  className="mx-auto max-w-3xl"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{
                        rotate: [0, 2, -2, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#1F5EA8]"
                    >
                      <FileCheck2 className="h-8 w-8" />
                    </motion.div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#1F5EA8]">
                      Step 04
                    </p>

                    <h2 className="mt-2 font-serif text-3xl font-bold text-[#162A43]">
                      Review your information
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      Everything looks ready. Review the information below
                      before submitting your verification.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <ReviewItem
                      label="Document Type"
                      value={
                        documentType === "nid"
                          ? "National ID"
                          : documentType === "passport"
                          ? "Passport"
                          : "Driving License"
                      }
                      icon={IdCard}
                    />

                    <ReviewItem
                      label="Document Number"
                      value={
                        documentNumber || "Not provided"
                      }
                      icon={Fingerprint}
                    />

                    <ReviewItem
                      label="Front Document"
                      value={
                        frontImage
                          ? "Uploaded successfully"
                          : "Not uploaded"
                      }
                      icon={FileImage}
                    />

                    <ReviewItem
                      label="Back Document"
                      value={
                        backImage
                          ? "Uploaded successfully"
                          : documentType === "nid"
                          ? "Not uploaded"
                          : "Optional"
                      }
                      icon={FileImage}
                    />

                    <ReviewItem
                      label="Selfie"
                      value={
                        selfieImage
                          ? "Uploaded successfully"
                          : "Not uploaded"
                      }
                      icon={Fingerprint}
                    />

                    <ReviewItem
                      label="Submission State"
                      value="Ready for review"
                      icon={ShieldCheck}
                    />
                  </div>

                  {message && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700"
                    >
                      {message}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                ACTIONS
            ================================================== */}

            {status !== "under_review" &&
              status !== "verified" && (
                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={
                      handlePrevious
                    }
                    disabled={
                      currentStep === 1 ||
                      loading
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <p className="self-center px-2 text-[9px] text-slate-400">
                      Your information is encrypted and handled securely.
                    </p>

                    {currentStep < 4 ? (
                      <motion.button
                        type="button"
                        onClick={
                          handleNext
                        }
                        disabled={loading}
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] px-6 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,94,168,0.20)] transition hover:bg-[#184880] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={
                          handleSubmit
                        }
                        disabled={loading}
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#123B66] px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0E2F50] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit KYC
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

            {/* =================================================
                PENDING / REVIEW
            ================================================== */}

            {(status === "pending" ||
              status === "under_review") && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                      <Clock3 className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        Verification is in progress
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700/80">
                        Your information is waiting for review. You do not
                        need to submit the same application again.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer security line */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3 w-3" />
            Secure verification
          </span>

          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Privacy focused
          </span>

          <span className="flex items-center gap-1.5">
            <Fingerprint className="h-3 w-3" />
            Identity protected
          </span>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   STEP HEADING
============================================================= */

function StepHeading({
  step,
  eyebrow,
  title,
  description,
}: {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F5EA8]">
        Step {step}
      </p>

      <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#162A43] sm:text-3xl">
        {title}
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   STATUS PILL
============================================================= */

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof CheckCircle2;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/* =============================================================
   SECURITY POINT
============================================================= */

function SecurityPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
        <Check className="h-3.5 w-3.5 text-[#9DDCFF]" />
      </div>

      <p className="text-[10px] font-medium text-blue-100/70">
        {text}
      </p>
    </div>
  );
}

/* =============================================================
   PROGRESS RING
============================================================= */

function ProgressRing({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const percentage = Math.round(
    (Math.min(step, total) / total) * 100
  );

  const radius = 32;
  const circumference =
    2 * Math.PI * radius;

  const progress =
    circumference -
    (percentage / 100) *
      circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24 -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#E8EEF4"
          strokeWidth="7"
        />

        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#1F5EA8"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{
            strokeDashoffset: progress,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-lg font-bold text-[#162A43]">
          {percentage}%
        </p>

        <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
          Complete
        </p>
      </div>
    </div>
  );
}

/* =============================================================
   QUALITY POINT
============================================================= */

function QualityPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

      <span className="text-[10px] font-medium text-slate-600">
        {text}
      </span>
    </div>
  );
}

/* =============================================================
   UPLOAD BOX
============================================================= */

function UploadBox({
  label,
  description,
  preview,
  onClear,
  onChange,
}: {
  label: string;
  description: string;
  preview: string;
  onClear: () => void;
  onChange: (
    e: ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <motion.div
      whileHover={{
        y: preview ? 0 : -2,
      }}
      className="rounded-[1.5rem] border border-slate-200 bg-[#F8FAFC] p-4"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#334155]">
            {label}
          </p>

          {preview && (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </span>
          )}
        </div>

        <p className="mt-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      {preview ? (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <img
            src={preview}
            alt={label}
            className="h-56 w-full object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
            <span className="text-[10px] font-semibold text-white">
              Document preview
            </span>

            <button
              type="button"
              onClick={onClear}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-14 text-center transition-all hover:border-[#7DBDE8] hover:bg-[#F2F8FD]">
          <motion.div
            whileHover={{
              scale: 1.05,
              rotate: -3,
            }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#1F5EA8]"
          >
            <Upload className="h-6 w-6" />
          </motion.div>

          <p className="mt-4 text-xs font-bold text-slate-700">
            Click to upload
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Select a clear image of your document
          </p>

          <span className="mt-5 rounded-xl bg-[#1F5EA8] px-4 py-2 text-[10px] font-semibold text-white shadow-md shadow-[#1F5EA8]/15 transition group-hover:bg-[#184880]">
            Choose File
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </motion.div>
  );
}

/* =============================================================
   REVIEW ITEM
============================================================= */

function ReviewItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof IdCard;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-bold text-[#334155]">
          {value}
        </p>
      </div>
    </div>
  );
}