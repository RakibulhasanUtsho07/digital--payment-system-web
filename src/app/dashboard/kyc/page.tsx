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
  FileCheck2,
  FileImage,
  Fingerprint,
  IdCard,
  Loader2,
  ShieldCheck,
  Upload,
  UserRound,
  X,
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
    description: "Basic document details",
    icon: IdCard,
  },
  {
    id: 2,
    title: "Documents",
    description: "Upload your ID",
    icon: FileImage,
  },
  {
    id: 3,
    title: "Selfie",
    description: "Verify your identity",
    icon: Fingerprint,
  },
  {
    id: 4,
    title: "Review",
    description: "Submit for verification",
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
     STATUS
     Auth is cookie-based (HttpOnly `access_token`, set by the
     backend on login). `apiClient` sends `credentials: "include"`
     on every request, so the cookie rides along automatically —
     there's no client-readable token to check first. If the
     cookie is missing or invalid, the backend's `protect`
     middleware responds 401 and we just show that as the error.
  ========================================================== */

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
     FILE HELPERS
  ========================================================== */

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
  ========================================================== */

  const validateStep = (): boolean => {
    setErrorMessage("");

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
     SAVE IDENTITY INFORMATION
  ========================================================== */

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
     NEXT STEP
  ========================================================== */

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
  ========================================================== */

  const handlePrevious = () => {
    setErrorMessage("");
    setCurrentStep(
      (step) => Math.max(1, step - 1)
    );
  };

  /* =========================================================
     SUBMIT KYC
  ========================================================== */

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

      // File upload uses a raw `fetch` (FormData sets its own
      // multipart Content-Type, which `apiClient` would clobber
      // with "application/json"). `credentials: "include"` is what
      // actually authenticates this request now — there's no
      // Authorization header to build since the token lives only
      // in the HttpOnly cookie.
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
     STATUS HELPERS
  ========================================================== */

  const statusStyles =
    useMemo(() => {
      switch (status) {
        case "verified":
          return {
            label: "Verified",
            className:
              "bg-emerald-50 text-emerald-700 border-emerald-200",
          };

        case "rejected":
          return {
            label: "Rejected",
            className:
              "bg-red-50 text-red-700 border-red-200",
          };

        case "under_review":
          return {
            label: "Under Review",
            className:
              "bg-amber-50 text-amber-700 border-amber-200",
          };

        case "pending":
          return {
            label: "Pending",
            className:
              "bg-blue-50 text-blue-700 border-blue-200",
          };

        default:
          return {
            label: "Not Started",
            className:
              "bg-slate-50 text-slate-600 border-slate-200",
          };
      }
    }, [status]);

  /* =========================================================
     LOADING
  ========================================================== */

  if (loadingStatus) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading KYC information...
        </div>
      </main>
    );
  }

  /* =========================================================
     VERIFIED
  ========================================================== */

  if (status === "verified") {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-10 text-center">
            <motion.div
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              KYC Verified
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              Your identity has been verified.
              You can now access verified wallet
              features and protected financial actions.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Identity verified successfully
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                KYC Verification
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Verify your identity to unlock secure wallet features.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles.className}`}
        >
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
          {statusStyles.label}
        </div>
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(23,54,93,0.08)]">

        {/* ===================================================
            STEPPER
        ==================================================== */}

        <div className="border-b border-slate-100 bg-slate-50/60 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;

              const active =
                currentStep === step.id;

              const completed =
                currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className="relative"
                >
                  <div
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                      active
                        ? "border-blue-200 bg-white shadow-sm"
                        : completed
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-transparent bg-transparent"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-blue-600 text-white"
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
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold ${
                          active
                            ? "text-slate-900"
                            : completed
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {step.title}
                      </p>

                      <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <div className="p-5 sm:p-8 lg:p-10">

          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600"
            >
              {errorMessage}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
            >
              {message}
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* =================================================
                STEP 1
            ================================================= */}

            {currentStep === 1 && (
              <motion.div
                key="step-one"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                className="mx-auto max-w-2xl"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Step 01
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Identity Information
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Select the identity document you want
                    to use for verification.
                  </p>
                </div>

                <div className="space-y-6">

                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Document Type
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          {
                            value: "nid",
                            title: "National ID",
                          },
                          {
                            value: "passport",
                            title: "Passport",
                          },
                          {
                            value: "driving_license",
                            title: "Driving License",
                          },
                        ] as {
                          value: DocumentType;
                          title: string;
                        }[]
                      ).map((item) => {
                        const selected =
                          documentType ===
                          item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              setDocumentType(
                                item.value
                              )
                            }
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              selected
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                                selected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <IdCard className="h-5 w-5" />
                            </div>

                            <p className="text-sm font-bold text-slate-800">
                              {item.title}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Use a valid government-issued ID
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="documentNumber"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Document Number
                    </label>

                    <input
                      id="documentNumber"
                      value={documentNumber}
                      onChange={(e) =>
                        setDocumentNumber(
                          e.target.value
                        )
                      }
                      placeholder="Enter your document number"
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Your information is protected
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Your identity information is used only
                        for verification and account protection.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {currentStep === 2 && (
              <motion.div
                key="step-two"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                className="mx-auto max-w-3xl"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Step 02
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Upload Your Document
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload clear, readable images of your identity document.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">

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

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Image quality requirements
                      </p>

                      <ul className="mt-2 space-y-1 text-[10px] leading-5 text-slate-500">
                        <li>
                          • Document must be fully visible.
                        </li>

                        <li>
                          • Avoid blur, reflections and heavy shadows.
                        </li>

                        <li>
                          • Make sure all details are readable.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =================================================
                STEP 3
            ================================================= */}

            {currentStep === 3 && (
              <motion.div
                key="step-three"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                className="mx-auto max-w-2xl"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Step 03
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Selfie Verification
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload a clear selfie for identity matching.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">

                  {selfiePreview ? (
                    <div className="relative mx-auto max-w-sm overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="aspect-[4/5] w-full rounded-[1.2rem] object-cover"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          clearFile("selfie")
                        }
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="mx-auto flex max-w-sm cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <UserRound className="h-8 w-8" />
                      </div>

                      <p className="mt-5 text-sm font-bold text-slate-800">
                        Upload your selfie
                      </p>

                      <p className="mt-2 max-w-xs text-[11px] leading-5 text-slate-400">
                        Use a recent clear photo with your face fully visible.
                      </p>

                      <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
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

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    "Face clearly visible",
                    "Good lighting",
                    "No sunglasses",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                      <span className="text-[10px] font-medium text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* =================================================
                STEP 4
            ================================================= */}

            {currentStep === 4 && (
              <motion.div
                key="step-four"
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mx-auto max-w-2xl"
              >
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileCheck2 className="h-8 w-8" />
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Step 04
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Review Your Information
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Check your information before submitting your KYC application.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <ReviewItem
                    label="Document Type"
                    value={
                      documentType === "nid"
                        ? "National ID"
                        : documentType ===
                          "passport"
                        ? "Passport"
                        : "Driving License"
                    }
                  />

                  <ReviewItem
                    label="Document Number"
                    value={documentNumber}
                  />

                  <ReviewItem
                    label="Front Document"
                    value={
                      frontImage
                        ? frontImage.name
                        : "Not uploaded"
                    }
                  />

                  <ReviewItem
                    label="Back Document"
                    value={
                      backImage
                        ? backImage.name
                        : "Not uploaded"
                    }
                  />

                  <ReviewItem
                    label="Selfie"
                    value={
                      selfieImage
                        ? selfieImage.name
                        : "Not uploaded"
                    }
                  />

                  <ReviewItem
                    label="Current Status"
                    value="Ready for review"
                  />
                </div>

                {message && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700">
                    {message}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* ===================================================
              ACTIONS
          ==================================================== */}

          {status !== "under_review" &&
            status !== "verified" && (
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">

                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={
                    currentStep === 1 ||
                    loading
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
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
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
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
                  </button>
                )}
              </div>
            )}

          {/* Under review */}
          {status === "under_review" ||
          status === "pending" ? (
            <div className="mt-10 border-t border-slate-100 pt-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-amber-600" />

                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      KYC verification is in progress
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700/80">
                      Your submitted information is waiting for review.
                      You do not need to submit it again.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   UPLOAD BOX
========================================================= */

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
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src={preview}
            alt={label}
            className="h-52 w-full object-cover"
          />

          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Upload className="h-5 w-5" />
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-700">
            Click to upload
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Clear document image
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

/* =========================================================
   REVIEW ITEM
========================================================= */

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-all text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}