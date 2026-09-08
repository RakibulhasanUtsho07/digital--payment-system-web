"use client";

import {
  useCallback,
  useEffect,
  useState,
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
  ChevronRight,
  Clock3,
  CreditCard,
  FileCheck2,
  FileImage,
  FileText,
  Fingerprint,
  IdCard,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

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

interface KYCRecord {
  _id?: string;
  userId?: string;

  documentType?: DocumentType;

  documentNumber?: string;

  provider?:
    | "manual"
    | "stripe"
    | "other";

  status: KYCStatus;

  rejectionReason?: string;

  submittedAt?: string;

  verifiedAt?: string;

  createdAt?: string;

  updatedAt?: string;
}

interface KYCResponse {
  success: boolean;

  message?: string;

  status?: KYCStatus;

  kyc?: Partial<KYCRecord>;

  data?: Partial<KYCRecord>;
}

type WizardStep =
  | 1
  | 2
  | 3;

/* =========================================================
   FILE CONFIG
========================================================= */

const MAX_FILE_SIZE =
  1 * 1024 * 1024;

const TARGET_COMPRESSED_SIZE =
  700 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/* =========================================================
   IMAGE HELPERS
========================================================= */

const loadImage = (
  objectUrl: string
): Promise<HTMLImageElement> => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = () =>
        reject(
          new Error(
            "Unable to read the selected image."
          )
        );

      image.src =
        objectUrl;
    }
  );
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Image compression failed."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    }
  );
};

const compressKYCImage =
  async (
    file: File
  ): Promise<File> => {
    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type
      )
    ) {
      throw new Error(
        "Only JPG, PNG and WEBP images are supported."
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file
      );

    try {
      const image =
        await loadImage(
          objectUrl
        );

      const MAX_DIMENSION =
        1400;

      const scale =
        Math.min(
          MAX_DIMENSION /
            image.naturalWidth,
          MAX_DIMENSION /
            image.naturalHeight,
          1
        );

      const width =
        Math.max(
          1,
          Math.round(
            image.naturalWidth *
              scale
          )
        );

      const height =
        Math.max(
          1,
          Math.round(
            image.naturalHeight *
              scale
          )
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        width;

      canvas.height =
        height;

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        throw new Error(
          "Unable to process the selected image."
        );
      }

      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        width,
        height
      );

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      let quality =
        0.82;

      let blob =
        await canvasToBlob(
          canvas,
          quality
        );

      while (
        blob.size >
          TARGET_COMPRESSED_SIZE &&
        quality > 0.42
      ) {
        quality -=
          0.08;

        blob =
          await canvasToBlob(
            canvas,
            quality
          );
      }

      if (
        blob.size >
        MAX_FILE_SIZE
      ) {
        throw new Error(
          "This image is still too large after optimization. Please choose a smaller image."
        );
      }

      const safeBaseName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          ) ||
        "kyc-image";

      return new File(
        [blob],
        `${safeBaseName}.jpg`,
        {
          type:
            "image/jpeg",

          lastModified:
            Date.now(),
        }
      );
    } finally {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  };

/* =========================================================
   DOCUMENT OPTIONS
========================================================= */

const documentOptions = [
  {
    value:
      "nid" as DocumentType,

    title:
      "National ID",

    description:
      "Bangladesh National Identity Card",

    icon:
      IdCard,
  },

  {
    value:
      "passport" as DocumentType,

    title:
      "Passport",

    description:
      "Government issued passport",

    icon:
      FileText,
  },

  {
    value:
      "driving_license" as DocumentType,

    title:
      "Driving License",

    description:
      "Government issued driving license",

    icon:
      CreditCard,
  },
];

/* =========================================================
   RESPONSE NORMALIZER
========================================================= */

function normalizeKYCResponse(
  response: KYCResponse
): KYCRecord {
  const record =
    response.kyc ??
    response.data ??
    {};

  return {
    ...record,

    status:
      record.status ??
      response.status ??
      "not_started",
  } as KYCRecord;
}

/* =========================================================
   PAGE
========================================================= */

export default function KYCPage() {
  const [
    kyc,
    setKYC,
  ] = useState<KYCRecord | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    step,
    setStep,
  ] = useState<WizardStep>(
    1
  );

  const [
    documentType,
    setDocumentType,
  ] = useState<
    DocumentType | ""
  >("");

  const [
    documentNumber,
    setDocumentNumber,
  ] = useState("");

  const [
    frontImage,
    setFrontImage,
  ] = useState<File | null>(
    null
  );

  const [
    backImage,
    setBackImage,
  ] = useState<File | null>(
    null
  );

  const [
    selfieImage,
    setSelfieImage,
  ] = useState<File | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =======================================================
     LOAD KYC
  ======================================================== */

  const loadKYC =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setErrorMessage("");

          const response =
            await apiClient<KYCResponse>(
              "/kyc/status"
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load KYC status."
            );
          }

          const normalized =
            normalizeKYCResponse(
              response
            );

          setKYC(
            normalized
          );

          if (
            normalized.documentType
          ) {
            setDocumentType(
              normalized.documentType
            );
          }

          if (
            normalized.documentNumber
          ) {
            setDocumentNumber(
              normalized.documentNumber
            );
          }
        } catch (
          error
        ) {
          console.error(
            "KYC status error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load KYC information."
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

  useEffect(() => {
    void loadKYC();
  }, [
    loadKYC,
  ]);

  /* =======================================================
     SUCCESS AUTO CLEAR
  ======================================================== */

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setSuccessMessage("");
        },
        4000
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    successMessage,
  ]);

  /* =======================================================
     START KYC
  ======================================================== */

  const handleStartKYC =
    async () => {
      try {
        setStarting(true);
        setErrorMessage("");

        const response =
          await apiClient<KYCResponse>(
            "/kyc/start",
            {
              method:
                "POST",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to start KYC verification."
          );
        }

        const normalized =
          normalizeKYCResponse(
            response
          );

        setKYC(
          normalized
        );

        resetForm();

        setFormOpen(
          true
        );

        setStep(
          1
        );
      } catch (
        error
      ) {
        console.error(
          "Start KYC error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to start verification."
        );
      } finally {
        setStarting(
          false
        );
      }
    };

  /* =======================================================
     RESUBMIT
  ======================================================== */

  const handleResubmit =
    async () => {
      resetForm();

      setFormOpen(
        true
      );

      setStep(
        1
      );
    };

  /* =======================================================
     RESET FORM
  ======================================================== */

  const resetForm =
    () => {
      setDocumentType(
        ""
      );

      setDocumentNumber(
        ""
      );

      setFrontImage(
        null
      );

      setBackImage(
        null
      );

      setSelfieImage(
        null
      );

      setErrorMessage(
        ""
      );
    };

  /* =======================================================
     STEP 1 VALIDATION
  ======================================================== */

  const goToDocuments =
    () => {
      setErrorMessage("");

      if (
        !documentType
      ) {
        setErrorMessage(
          "Please select a document type."
        );

        return;
      }

      if (
        !documentNumber.trim()
      ) {
        setErrorMessage(
          "Please enter your document number."
        );

        return;
      }

      if (
        documentNumber.trim()
          .length < 4
      ) {
        setErrorMessage(
          "Please enter a valid document number."
        );

        return;
      }

      setStep(
        2
      );
    };

  /* =======================================================
     FILE CHANGE
  ======================================================== */

  const handleFileChange =
    async (
      file: File | null,
      type:
        | "front"
        | "back"
        | "selfie"
    ) => {
      if (!file) {
        return;
      }

      try {
        setErrorMessage("");

        if (
          !ALLOWED_FILE_TYPES.includes(
            file.type
          )
        ) {
          throw new Error(
            "Only JPG, PNG and WEBP images are supported."
          );
        }

        const optimizedFile =
          await compressKYCImage(
            file
          );

        if (
          optimizedFile.size >
          MAX_FILE_SIZE
        ) {
          throw new Error(
            "Optimized image must be less than 1 MB."
          );
        }

        if (
          type === "front"
        ) {
          setFrontImage(
            optimizedFile
          );
        }

        if (
          type === "back"
        ) {
          setBackImage(
            optimizedFile
          );
        }

        if (
          type === "selfie"
        ) {
          setSelfieImage(
            optimizedFile
          );
        }
      } catch (
        error
      ) {
        console.error(
          "KYC image processing error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to process the selected image."
        );
      }
    };

  /* =======================================================
     STEP 2 VALIDATION
  ======================================================== */

  const goToReview =
    () => {
      setErrorMessage("");

      if (!frontImage) {
        setErrorMessage(
          "Please upload the front side of your document."
        );

        return;
      }

      const backRequired =
        documentType ===
          "nid" ||
        documentType ===
          "driving_license";

      if (
        backRequired &&
        !backImage
      ) {
        setErrorMessage(
          "Please upload the back side of your document."
        );

        return;
      }

      if (!selfieImage) {
        setErrorMessage(
          "Please upload a clear selfie."
        );

        return;
      }

      setStep(
        3
      );
    };

  /* =======================================================
     SUBMIT
  ======================================================== */

  const handleSubmit =
    async () => {
      if (
        !documentType ||
        !documentNumber.trim() ||
        !frontImage ||
        !selfieImage
      ) {
        setErrorMessage(
          "Please complete all required information."
        );

        return;
      }

      const backRequired =
        documentType ===
          "nid" ||
        documentType ===
          "driving_license";

      if (
        backRequired &&
        !backImage
      ) {
        setErrorMessage(
          "Back image is required for this document type."
        );

        return;
      }

      const totalUploadSize =
        frontImage.size +
        (backImage?.size ?? 0) +
        selfieImage.size;

      if (
        totalUploadSize >
        3 * 1024 * 1024
      ) {
        setErrorMessage(
          "The total upload is too large. Please re-select the images so they can be optimized again."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setErrorMessage("");

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
          await apiClient<KYCResponse>(
            "/kyc/submit",
            {
              method:
                "PUT",

              body:
                formData,
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to submit KYC."
          );
        }

        const normalized =
          normalizeKYCResponse(
            response
          );

        setKYC(
          normalized
        );

        setFormOpen(
          false
        );

        setStep(
          1
        );

        setSuccessMessage(
          response.message ||
            "Your KYC application has been submitted successfully."
        );

        await loadKYC(
          true
        );
      } catch (
        error
      ) {
        console.error(
          "KYC submit error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to submit KYC."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <KYCLoadingState />
    );
  }

  /* =======================================================
     PAGE
  ======================================================== */

  return (
    <div
      className="
        relative
        min-h-full
        overflow-hidden
        bg-background
      "
    >
      {/* AMBIENT GLOW */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-40
          -top-44
          h-[420px]
          w-[420px]
          rounded-full
          bg-indigo-500/[0.08]
          blur-[100px]
          dark:bg-violet-500/[0.12]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-44
          -left-44
          h-[420px]
          w-[420px]
          rounded-full
          bg-emerald-400/[0.05]
          blur-[110px]
        "
      />

      <div
        className="
          relative
          z-10
          space-y-6
        "
      >
        {/* =================================================
            MESSAGE
        ================================================== */}

        <AnimatePresence>
          {errorMessage && (
            <MessageAlert
              type="error"
              message={
                errorMessage
              }
              onClose={() =>
                setErrorMessage("")
              }
            />
          )}

          {successMessage && (
            <MessageAlert
              type="success"
              message={
                successMessage
              }
              onClose={() =>
                setSuccessMessage("")
              }
            />
          )}
        </AnimatePresence>

        {/* =================================================
            HERO
            FIXED INDIGO / VIOLET
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
          transition={{
            duration: 0.5,
          }}
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border border-white/10
            bg-gradient-to-br
            from-[#1E1B4B]
            via-[#4338CA]
            to-[#7C3AED]
            text-white
            shadow-[0_20px_60px_rgba(49,46,129,0.28)]
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -left-24
              -top-24
              h-72
              w-72
              rounded-full
              bg-violet-400/10
              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-0
              top-0
              h-full
              w-[48%]
              bg-gradient-to-l
              from-white/[0.06]
              via-white/[0.02]
              to-transparent
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-20
              h-56
              w-56
              rounded-full
              border
              border-white/10
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-16
              top-10
              h-28
              w-28
              rounded-full
              border
              border-white/10
            "
          />

          <div
            className="
              relative
              z-10
              grid
              gap-8
              p-6
              md:p-8
              lg:grid-cols-[1fr_auto]
              lg:items-center
            "
          >
            <div className="max-w-2xl">
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
                  font-extrabold
                  uppercase
                  tracking-[0.15em]
                  text-indigo-100
                  backdrop-blur-md
                "
              >
                <Fingerprint className="h-3.5 w-3.5" />

                Identity Verification
              </div>

              <h1
                className="
                  mt-4
                  max-w-xl
                  text-[25px]
                  font-black
                  tracking-[-0.035em]
                  text-white
                  sm:text-[30px]
                  lg:text-[34px]
                "
              >
                Secure your wallet with
                verified identity.
              </h1>

              <p
                className="
                  mt-3
                  max-w-xl
                  text-sm
                  leading-6
                  text-indigo-100/70
                "
              >
                Verify your identity to
                strengthen account security
                and access protected wallet
                actions.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <HeroSecurityItem
                  icon={LockKeyhole}
                  text="Private uploads"
                />

                <HeroSecurityItem
                  icon={ShieldCheck}
                  text="Secure review"
                />

                <HeroSecurityItem
                  icon={BadgeCheck}
                  text="Verified access"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={() =>
                  void loadKYC(true)
                }
                disabled={
                  refreshing
                }
                whileTap={{
                  scale: 0.96,
                }}
                className="
                  flex
                  h-11
                  items-center
                  gap-2
                  rounded-[14px]
                  border
                  border-white/15
                  bg-white/10
                  px-4
                  text-[11px]
                  font-bold
                  text-indigo-100
                  shadow-sm
                  backdrop-blur-md
                  transition
                  hover:border-white/25
                  hover:bg-white/15
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                  }
                />

                Refresh
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* =================================================
            MAIN GRID
        ================================================== */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-[360px_minmax(0,1fr)]
          "
        >
          {/* LEFT */}

          <div
            className="
              space-y-5
            "
          >
            <KYCStatusCard
              kyc={kyc}
              starting={starting}
              onStart={
                handleStartKYC
              }
              onResubmit={
                handleResubmit
              }
            />

            <VerificationRoadmap
              status={
                kyc?.status ??
                "not_started"
              }
            />
          </div>

          {/* RIGHT */}

          <div>
            <AnimatePresence
              mode="wait"
            >
              {formOpen ? (
                <motion.div
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
                >
                  <VerificationWizard
                    step={step}
                    setStep={
                      setStep
                    }
                    documentType={
                      documentType
                    }
                    setDocumentType={
                      setDocumentType
                    }
                    documentNumber={
                      documentNumber
                    }
                    setDocumentNumber={
                      setDocumentNumber
                    }
                    frontImage={
                      frontImage
                    }
                    backImage={
                      backImage
                    }
                    selfieImage={
                      selfieImage
                    }
                    onFileChange={
                      handleFileChange
                    }
                    onRemoveFront={() =>
                      setFrontImage(
                        null
                      )
                    }
                    onRemoveBack={() =>
                      setBackImage(
                        null
                      )
                    }
                    onRemoveSelfie={() =>
                      setSelfieImage(
                        null
                      )
                    }
                    onNextIdentity={
                      goToDocuments
                    }
                    onNextDocuments={
                      goToReview
                    }
                    onSubmit={
                      handleSubmit
                    }
                    submitting={
                      submitting
                    }
                    onCancel={() => {
                      setFormOpen(
                        false
                      );

                      setStep(
                        1
                      );

                      setErrorMessage(
                        ""
                      );
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
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
                  }}
                >
                  <KYCOverview
                    status={
                      kyc?.status ??
                      "not_started"
                    }
                    onStart={
                      handleStartKYC
                    }
                    onResubmit={
                      handleResubmit
                    }
                    starting={
                      starting
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HERO SECURITY ITEM
========================================================= */

function HeroSecurityItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        text-[10px]
        font-semibold
        text-indigo-100/80
      "
    >
      <span
        className="
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-lg
          bg-white/10
          text-indigo-100
        "
      >
        <Icon className="h-3 w-3" />
      </span>

      {text}
    </span>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function KYCStatusCard({
  kyc,
  starting,
  onStart,
  onResubmit,
}: {
  kyc: KYCRecord | null;

  starting: boolean;

  onStart: () => void;

  onResubmit: () => void;
}) {
  const status =
    kyc?.status ??
    "not_started";

  const config =
    getStatusConfig(
      status
    );

  const Icon =
    config.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -12,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        overflow-hidden
        rounded-[24px]
        border border-border
        bg-card
        text-card-foreground
        shadow-[var(--dashboard-shadow)]
      "
    >
      <div
        className="
          p-5
          sm:p-6
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
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-[15px]
              ${getStatusIconTheme(
                status
              )}
            `}
          >
            <Icon className="h-5 w-5" />
          </div>

          <span
            className={`
              rounded-full
              px-3
              py-1.5
              text-[9px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              ${getStatusBadgeTheme(
                status
              )}
            `}
          >
            {config.label}
          </span>
        </div>

        <h2
          className="
            mt-5
            text-lg
            font-extrabold
            tracking-[-0.02em]
            text-card-foreground
          "
        >
          {config.title}
        </h2>

        <p
          className="
            mt-2
            text-xs
            leading-5
            text-muted-foreground
          "
        >
          {config.description}
        </p>

        {kyc?.documentType && (
          <div
            className="
              mt-5
              rounded-[15px]
              bg-muted/60
              p-3.5
            "
          >
            <InfoRow
              label="Document"
              value={formatDocumentType(
                kyc.documentType
              )}
            />

            {kyc.documentNumber && (
              <InfoRow
                label="Document No."
                value={maskDocumentNumber(
                  kyc.documentNumber
                )}
              />
            )}

            {kyc.provider && (
              <InfoRow
                label="Provider"
                value={capitalize(
                  kyc.provider
                )}
              />
            )}
          </div>
        )}

        {kyc?.submittedAt && (
          <div
            className="
              mt-4
              flex
              items-center
              gap-2
              text-[10px]
              text-muted-foreground
            "
          >
            <Clock3 className="h-3.5 w-3.5" />

            Submitted{" "}
            {formatDate(
              kyc.submittedAt
            )}
          </div>
        )}

        {status ===
          "verified" &&
          kyc?.verifiedAt && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-2
                text-[10px]
                font-semibold
                text-emerald-600
                dark:text-emerald-400
              "
            >
              <BadgeCheck className="h-3.5 w-3.5" />

              Verified{" "}
              {formatDate(
                kyc.verifiedAt
              )}
            </div>
          )}

        {status ===
          "rejected" &&
          kyc?.rejectionReason && (
            <div
              className="
                mt-4
                rounded-[14px]
                border border-rose-500/15
                bg-rose-500/5
                p-3.5
              "
            >
              <p
                className="
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-rose-500
                "
              >
                Review note
              </p>

              <p
                className="
                  mt-1.5
                  text-xs
                  leading-5
                  text-rose-700
                  dark:text-rose-300
                "
              >
                {kyc.rejectionReason}
              </p>
            </div>
          )}
      </div>

      {(status ===
        "not_started" ||
        status ===
          "rejected") && (
        <div
          className="
            border-t
            border-border
            bg-muted/40
            p-4
          "
        >
          <button
            type="button"
            onClick={
              status ===
              "rejected"
                ? onResubmit
                : onStart
            }
            disabled={
              starting
            }
            className="
              flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-[13px]
              bg-primary
              px-4
              text-xs
              font-extrabold
              text-primary-foreground
              shadow-[0_10px_24px_rgba(79,70,229,0.18)]
              transition
              hover:brightness-105
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Starting...
              </>
            ) : (
              <>
                {status ===
                "rejected"
                  ? "Resubmit Verification"
                  : "Start Verification"}

                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* =========================================================
   ROADMAP
========================================================= */

function VerificationRoadmap({
  status,
}: {
  status: KYCStatus;
}) {
  const submitted =
    status !==
    "not_started";

  const reviewing =
    status ===
      "pending" ||
    status ===
      "under_review" ||
    status ===
      "verified";

  const verified =
    status ===
    "verified";

  const steps = [
    {
      title:
        "Submit identity",

      description:
        "Provide your identity document.",

      complete:
        submitted,

      icon:
        FileCheck2,
    },

    {
      title:
        "Compliance review",

      description:
        "Your submission is securely reviewed.",

      complete:
        reviewing,

      icon:
        ShieldCheck,
    },

    {
      title:
        "Account verified",

      description:
        "Protected wallet access is enabled.",

      complete:
        verified,

      icon:
        BadgeCheck,
    },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -12,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay: 0.08,
        duration: 0.45,
      }}
      className="
        rounded-[24px]
        border border-border
        bg-card
        p-5
        text-card-foreground
        shadow-[var(--dashboard-shadow)]
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
        <div>
          <p
            className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.16em]
              text-primary
            "
          >
            Verification flow
          </p>

          <h3
            className="
              mt-1
              text-sm
              font-extrabold
              text-card-foreground
            "
          >
            Verification journey
          </h3>
        </div>

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          "
        >
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 space-y-1">
        {steps.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            return (
              <div
                key={
                  item.title
                }
                className="relative flex gap-3"
              >
                {index <
                  steps.length -
                    1 && (
                  <div
                    className={`
                      absolute
                      left-[17px]
                      top-9
                      h-[calc(100%-12px)]
                      w-px
                      ${
                        item.complete
                          ? "bg-emerald-500/35"
                          : "bg-border"
                      }
                    `}
                  />
                )}

                <div
                  className={`
                    relative
                    z-10
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-[11px]
                    ${
                      item.complete
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {item.complete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="pb-5 pt-0.5">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      text-card-foreground
                    "
                  >
                    {
                      item.title
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      leading-4
                      text-muted-foreground
                    "
                  >
                    {
                      item.description
                    }
                  </p>
                </div>
              </div>
            );
          }
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function KYCOverview({
  status,
  onStart,
  onResubmit,
  starting,
}: {
  status: KYCStatus;

  onStart: () => void;

  onResubmit: () => void;

  starting: boolean;
}) {
  const verified =
    status ===
    "verified";

  return (
    <div
      className="
        rounded-[26px]
        border border-border
        bg-card
        p-5
        text-card-foreground
        shadow-[var(--dashboard-shadow)]
        sm:p-6
        lg:p-7
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-extrabold
              uppercase
              tracking-[0.16em]
              text-primary
            "
          >
            Verification Center
          </p>

          <h2
            className="
              mt-2
              text-xl
              font-extrabold
              tracking-[-0.025em]
              text-card-foreground
            "
          >
            What you&apos;ll need
          </h2>
        </div>

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-[14px]
            bg-primary/10
            text-primary
          "
        >
          <Fingerprint className="h-5 w-5" />
        </div>
      </div>

      <div
        className="
          mt-6
          grid
          gap-4
          sm:grid-cols-3
        "
      >
        <RequirementCard
          number="01"
          icon={IdCard}
          title="Identity document"
          description="A valid NID, passport or driving license."
        />

        <RequirementCard
          number="02"
          icon={FileImage}
          title="Clear document photos"
          description="Upload readable front and back images where required."
        />

        <RequirementCard
          number="03"
          icon={ScanFace}
          title="Recent selfie"
          description="Use a clear, well-lit photo of your face."
        />
      </div>

      <div
        className="
          mt-6
          rounded-[20px]
          border border-primary/15
          bg-primary/5
          p-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
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
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[12px]
                bg-card
                text-primary
                shadow-sm
                ring-1
                ring-border
              "
            >
              <LockKeyhole className="h-[17px] w-[17px]" />
            </div>

            <div>
              <h3
                className="
                  text-xs
                  font-extrabold
                  text-card-foreground
                "
              >
                Your documents stay protected
              </h3>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[10px]
                  leading-5
                  text-muted-foreground
                "
              >
                Identity images are uploaded
                through your protected KYC flow
                and stored as private Cloudinary
                assets by the backend.
              </p>
            </div>
          </div>

          {(status ===
            "not_started" ||
            status ===
              "rejected") && (
            <button
              type="button"
              disabled={
                starting
              }
              onClick={
                status ===
                "rejected"
                  ? onResubmit
                  : onStart
              }
              className="
                flex
                h-11
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-[13px]
                bg-primary
                px-5
                text-[11px]
                font-extrabold
                text-primary-foreground
                transition
                hover:brightness-105
                disabled:opacity-60
              "
            >
              {starting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {status ===
              "rejected"
                ? "Try Again"
                : "Begin Verification"}

              {!starting && (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {verified && (
            <div
              className="
                inline-flex
                h-11
                items-center
                gap-2
                rounded-[13px]
                bg-emerald-500/10
                px-4
                text-[11px]
                font-extrabold
                text-emerald-700
                dark:text-emerald-300
              "
            >
              <BadgeCheck className="h-4 w-4" />

              Identity verified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   WIZARD
========================================================= */

function VerificationWizard({
  step,
  setStep,
  documentType,
  setDocumentType,
  documentNumber,
  setDocumentNumber,
  frontImage,
  backImage,
  selfieImage,
  onFileChange,
  onRemoveFront,
  onRemoveBack,
  onRemoveSelfie,
  onNextIdentity,
  onNextDocuments,
  onSubmit,
  submitting,
  onCancel,
}: {
  step: WizardStep;

  setStep: (
    step: WizardStep
  ) => void;

  documentType:
    | DocumentType
    | "";

  setDocumentType: (
    type: DocumentType
  ) => void;

  documentNumber:
    string;

  setDocumentNumber: (
    value: string
  ) => void;

  frontImage:
    File | null;

  backImage:
    File | null;

  selfieImage:
    File | null;

  onFileChange: (
    file: File | null,
    type:
      | "front"
      | "back"
      | "selfie"
  ) => void;

  onRemoveFront:
    () => void;

  onRemoveBack:
    () => void;

  onRemoveSelfie:
    () => void;

  onNextIdentity:
    () => void;

  onNextDocuments:
    () => void;

  onSubmit:
    () => void;

  submitting:
    boolean;

  onCancel:
    () => void;
}) {
  return (
    <div
      className="
        overflow-hidden
        rounded-[26px]
        border border-border
        bg-card
        text-card-foreground
        shadow-[var(--dashboard-shadow)]
      "
    >
      <div
        className="
          border-b
          border-border
          px-5
          py-5
          sm:px-6
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
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-primary
              "
            >
              Secure verification
            </p>

            <h2
              className="
                mt-1.5
                text-lg
                font-extrabold
                tracking-[-0.02em]
                text-card-foreground
              "
            >
              Complete your identity check
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              submitting
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-[11px]
              bg-muted
              text-muted-foreground
              transition
              hover:bg-muted/80
              hover:text-foreground
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <WizardProgress
          step={step}
        />
      </div>

      <div
        className="
          p-5
          sm:p-6
          lg:p-7
        "
      >
        <AnimatePresence
          mode="wait"
        >
          {step === 1 && (
            <motion.div
              key="identity"
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
            >
              <StepIdentity
                documentType={
                  documentType
                }
                setDocumentType={
                  setDocumentType
                }
                documentNumber={
                  documentNumber
                }
                setDocumentNumber={
                  setDocumentNumber
                }
                onNext={
                  onNextIdentity
                }
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="documents"
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
            >
              <StepDocuments
                documentType={
                  documentType
                }
                frontImage={
                  frontImage
                }
                backImage={
                  backImage
                }
                selfieImage={
                  selfieImage
                }
                onFileChange={
                  onFileChange
                }
                onRemoveFront={
                  onRemoveFront
                }
                onRemoveBack={
                  onRemoveBack
                }
                onRemoveSelfie={
                  onRemoveSelfie
                }
                onBack={() =>
                  setStep(1)
                }
                onNext={
                  onNextDocuments
                }
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="review"
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
            >
              <StepReview
                documentType={
                  documentType as DocumentType
                }
                documentNumber={
                  documentNumber
                }
                frontImage={
                  frontImage
                }
                backImage={
                  backImage
                }
                selfieImage={
                  selfieImage
                }
                onBack={() =>
                  setStep(2)
                }
                onSubmit={
                  onSubmit
                }
                submitting={
                  submitting
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================================================
   WIZARD PROGRESS
========================================================= */

function WizardProgress({
  step,
}: {
  step: WizardStep;
}) {
  const items = [
    {
      step: 1,
      label: "Identity",
    },

    {
      step: 2,
      label: "Documents",
    },

    {
      step: 3,
      label: "Review",
    },
  ];

  return (
    <div className="mt-5 flex items-center">
      {items.map(
        (
          item,
          index
        ) => {
          const completed =
            step >
            item.step;

          const active =
            step ===
            item.step;

          return (
            <div
              key={
                item.step
              }
              className={`flex items-center ${
                index <
                items.length -
                  1
                  ? "flex-1"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-[9px]
                    font-extrabold
                    transition-all
                    ${
                      completed
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-primary text-primary-foreground shadow-[0_5px_15px_rgba(79,70,229,0.2)]"
                          : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    item.step
                  )}
                </div>

                <span
                  className={`
                    hidden
                    text-[9px]
                    font-bold
                    sm:block
                    ${
                      active
                        ? "text-primary"
                        : completed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }
                  `}
                >
                  {item.label}
                </span>
              </div>

              {index <
                items.length -
                  1 && (
                <div
                  className="
                    mx-3
                    h-px
                    flex-1
                    bg-border
                  "
                >
                  <motion.div
                    initial={{
                      width:
                        "0%",
                    }}
                    animate={{
                      width:
                        step >
                        item.step
                          ? "100%"
                          : "0%",
                    }}
                    className="
                      h-full
                      bg-emerald-500
                    "
                  />
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   STEP 1
========================================================= */

function StepIdentity({
  documentType,
  setDocumentType,
  documentNumber,
  setDocumentNumber,
  onNext,
}: {
  documentType:
    | DocumentType
    | "";

  setDocumentType: (
    type: DocumentType
  ) => void;

  documentNumber:
    string;

  setDocumentNumber: (
    value: string
  ) => void;

  onNext: () => void;
}) {
  return (
    <div>
      <div>
        <h3
          className="
            text-base
            font-extrabold
            text-card-foreground
          "
        >
          Choose your identity document
        </h3>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-muted-foreground
          "
        >
          Select a valid government issued
          document.
        </p>
      </div>

      <div
        className="
          mt-5
          grid
          gap-3
          md:grid-cols-3
        "
      >
        {documentOptions.map(
          (
            option
          ) => {
            const Icon =
              option.icon;

            const selected =
              documentType ===
              option.value;

            return (
              <motion.button
                key={
                  option.value
                }
                type="button"
                whileTap={{
                  scale:
                    0.98,
                }}
                onClick={() =>
                  setDocumentType(
                    option.value
                  )
                }
                className={`
                  relative
                  min-h-[145px]
                  rounded-[18px]
                  border
                  p-4
                  text-left
                  transition-all
                  duration-200
                  ${
                    selected
                      ? "border-primary/40 bg-primary/10 shadow-[0_8px_24px_rgba(79,70,229,0.08)]"
                      : "border-border bg-card hover:border-primary/25 hover:bg-muted/50"
                  }
                `}
              >
                {selected && (
                  <span
                    className="
                      absolute
                      right-3
                      top-3
                      flex
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-primary
                      text-primary-foreground
                    "
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}

                <div
                  className={`
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-[12px]
                    ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>

                <p
                  className="
                    mt-4
                    text-xs
                    font-extrabold
                    text-card-foreground
                  "
                >
                  {
                    option.title
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-[9px]
                    leading-4
                    text-muted-foreground
                  "
                >
                  {
                    option.description
                  }
                </p>
              </motion.button>
            );
          }
        )}
      </div>

      <div className="mt-6">
        <label
          htmlFor="documentNumber"
          className="
            text-[10px]
            font-extrabold
            text-muted-foreground
          "
        >
          Document Number
        </label>

        <div className="relative mt-2">
          <FileText
            className="
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <input
            id="documentNumber"
            type="text"
            value={
              documentNumber
            }
            onChange={(
              event
            ) =>
              setDocumentNumber(
                event.target.value
              )
            }
            autoComplete="off"
            placeholder="Enter your document number"
            className="
              h-12
              w-full
              rounded-[14px]
              border
              border-input
              bg-background
              pl-11
              pr-4
              text-xs
              font-semibold
              text-foreground
              outline-none
              transition
              placeholder:text-muted-foreground
              focus:border-primary
              focus:ring-4
              focus:ring-primary/10
            "
          />
        </div>

        <p
          className="
            mt-2
            text-[9px]
            text-muted-foreground
          "
        >
          Enter the number exactly as shown
          on your document.
        </p>
      </div>

      <div className="mt-7 flex justify-end">
        <PrimaryButton onClick={onNext}>
          Continue

          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

function StepDocuments({
  documentType,
  frontImage,
  backImage,
  selfieImage,
  onFileChange,
  onRemoveFront,
  onRemoveBack,
  onRemoveSelfie,
  onBack,
  onNext,
}: {
  documentType:
    | DocumentType
    | "";

  frontImage:
    File | null;

  backImage:
    File | null;

  selfieImage:
    File | null;

  onFileChange: (
    file: File | null,
    type:
      | "front"
      | "back"
      | "selfie"
  ) => void;

  onRemoveFront:
    () => void;

  onRemoveBack:
    () => void;

  onRemoveSelfie:
    () => void;

  onBack:
    () => void;

  onNext:
    () => void;
}) {
  const backRequired =
    documentType ===
      "nid" ||
    documentType ===
      "driving_license";

  return (
    <div>
      <h3
        className="
          text-base
          font-extrabold
          text-card-foreground
        "
      >
        Upload verification images
      </h3>

      <p
        className="
          mt-1
          text-xs
          leading-5
          text-muted-foreground
        "
      >
        Use clear, readable images without
        glare or blur.
      </p>

      <div
        className="
          mt-5
          grid
          gap-4
          md:grid-cols-2
        "
      >
        <UploadCard
          id="front-image"
          icon={FileImage}
          title="Document front"
          description="Upload the front side"
          required
          file={
            frontImage
          }
          onChange={(file) =>
            onFileChange(
              file,
              "front"
            )
          }
          onRemove={
            onRemoveFront
          }
        />

        <UploadCard
          id="back-image"
          icon={FileImage}
          title="Document back"
          description={
            backRequired
              ? "Required for this document"
              : "Optional if not applicable"
          }
          required={
            backRequired
          }
          file={
            backImage
          }
          onChange={(file) =>
            onFileChange(
              file,
              "back"
            )
          }
          onRemove={
            onRemoveBack
          }
        />

        <div className="md:col-span-2">
          <UploadCard
            id="selfie-image"
            icon={Camera}
            title="Identity selfie"
            description="Upload a recent, clear photo of yourself"
            required
            file={
              selfieImage
            }
            onChange={(file) =>
              onFileChange(
                file,
                "selfie"
              )
            }
            onRemove={
              onRemoveSelfie
            }
            selfie
          />
        </div>
      </div>

      <div
        className="
          mt-5
          rounded-[15px]
          bg-muted/40
          p-4
        "
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

          <p
            className="
              text-[10px]
              leading-5
              text-muted-foreground
            "
          >
            Accepted formats: JPG, PNG and
            WEBP. Images are automatically
            optimized before upload. Maximum
            processed size: 1 MB per image.
            Make sure all information is
            clearly visible.
          </p>
        </div>
      </div>

      <div
        className="
          mt-7
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <SecondaryButton
          onClick={
            onBack
          }
        >
          <ArrowLeft className="h-4 w-4" />

          Back
        </SecondaryButton>

        <PrimaryButton
          onClick={
            onNext
          }
        >
          Review submission

          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3
========================================================= */

function StepReview({
  documentType,
  documentNumber,
  frontImage,
  backImage,
  selfieImage,
  onBack,
  onSubmit,
  submitting,
}: {
  documentType:
    DocumentType;

  documentNumber:
    string;

  frontImage:
    File | null;

  backImage:
    File | null;

  selfieImage:
    File | null;

  onBack:
    () => void;

  onSubmit:
    () => void;

  submitting:
    boolean;
}) {
  return (
    <div>
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
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-[14px]
            bg-emerald-500/10
            text-emerald-600
            dark:text-emerald-400
          "
        >
          <FileCheck2 className="h-5 w-5" />
        </div>

        <div>
          <h3
            className="
              text-base
              font-extrabold
              text-card-foreground
            "
          >
            Review your submission
          </h3>

          <p
            className="
              mt-1
              text-xs
              text-muted-foreground
            "
          >
            Check your information before
            submitting it for review.
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          rounded-[18px]
          border
          border-border
          bg-muted/30
          p-4
        "
      >
        <ReviewRow
          label="Document type"
          value={formatDocumentType(
            documentType
          )}
        />

        <ReviewRow
          label="Document number"
          value={
            documentNumber
          }
        />

        <ReviewRow
          label="Front image"
          value={
            frontImage?.name ??
            "Missing"
          }
        />

        <ReviewRow
          label="Back image"
          value={
            backImage?.name ??
            "Not provided"
          }
        />

        <ReviewRow
          label="Selfie"
          value={
            selfieImage?.name ??
            "Missing"
          }
          last
        />
      </div>

      <div
        className="
          mt-5
          rounded-[16px]
          border
          border-primary/15
          bg-primary/5
          p-4
        "
      >
        <div className="flex gap-3">
          <LockKeyhole
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-primary
            "
          />

          <p
            className="
              text-[10px]
              leading-5
              text-muted-foreground
            "
          >
            By submitting, you confirm that
            the information and uploaded
            documents belong to you and are
            accurate.
          </p>
        </div>
      </div>

      <div
        className="
          mt-7
          flex
          flex-col-reverse
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <SecondaryButton
          onClick={
            onBack
          }
          disabled={
            submitting
          }
        >
          <ArrowLeft className="h-4 w-4" />

          Back
        </SecondaryButton>

        <button
          type="button"
          onClick={
            onSubmit
          }
          disabled={
            submitting
          }
          className="
            flex
            h-12
            items-center
            justify-center
            gap-2
            rounded-[14px]
            bg-primary
            px-6
            text-[11px]
            font-extrabold
            text-primary-foreground
            shadow-[0_10px_25px_rgba(79,70,229,0.2)]
            transition
            hover:brightness-105
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Uploading securely...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />

              Submit for Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   UPLOAD CARD
========================================================= */

function UploadCard({
  id,
  icon: Icon,
  title,
  description,
  required,
  file,
  onChange,
  onRemove,
  selfie = false,
}: {
  id: string;

  icon:
    React.ElementType;

  title:
    string;

  description:
    string;

  required:
    boolean;

  file:
    File | null;

  onChange:
    (
      file: File | null
    ) => void;

  onRemove:
    () => void;

  selfie?: boolean;
}) {
  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (!file) {
      setPreviewUrl(
        null
      );

      return;
    }

    const url =
      URL.createObjectURL(
        file
      );

    setPreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [
    file,
  ]);

  if (
    file &&
    previewUrl
  ) {
    return (
      <div
        className="
          overflow-hidden
          rounded-[18px]
          border
          border-emerald-500/20
          bg-card
          shadow-sm
        "
      >
        <div
          className="
            relative
            h-[190px]
            overflow-hidden
            bg-muted
          "
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              previewUrl
            }
            alt={title}
            className={`
              h-full
              w-full
              ${
                selfie
                  ? "object-cover"
                  : "object-contain"
              }
            `}
          />

          <div
            className="
              absolute
              inset-x-0
              bottom-0
              h-20
              bg-gradient-to-t
              from-black/50
              to-transparent
            "
          />

          <button
            type="button"
            onClick={
              onRemove
            }
            className="
              absolute
              right-3
              top-3
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-[10px]
              bg-black/55
              text-white
              backdrop-blur-md
              transition
              hover:bg-rose-500
            "
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div
            className="
              absolute
              bottom-3
              left-3
              right-3
              flex
              items-center
              gap-2
              text-white
            "
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />

            <p
              className="
                min-w-0
                flex-1
                truncate
                text-[10px]
                font-bold
              "
            >
              {
                file.name
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      className="
        group
        flex
        min-h-[190px]
        cursor-pointer
        flex-col
        items-center
        justify-center
        rounded-[18px]
        border
        border-dashed
        border-border
        bg-muted/20
        p-5
        text-center
        transition-all
        duration-200
        hover:border-primary/40
        hover:bg-primary/5
      "
    >
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(
          event
        ) => {
          const selected =
            event.target.files?.[0] ??
            null;

          onChange(
            selected
          );

          event.target.value =
            "";
        }}
      />

      <div
        className="relative"
      >
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-[15px]
            bg-primary/10
            text-primary
            transition
            group-hover:scale-105
            group-hover:bg-primary
            group-hover:text-primary-foreground
          "
        >
          <Icon className="h-5 w-5" />
        </div>

        <div
          className="
            absolute
            -bottom-1
            -right-1
            flex
            h-5
            w-5
            items-center
            justify-center
            rounded-full
            border-2
            border-card
            bg-slate-900
            text-white
            dark:bg-white
            dark:text-slate-900
          "
        >
          <UploadCloud className="h-2.5 w-2.5" />
        </div>
      </div>

      <p
        className="
          mt-4
          text-xs
          font-extrabold
          text-card-foreground
        "
      >
        {title}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </p>

      <p
        className="
          mt-1
          text-[9px]
          text-muted-foreground
        "
      >
        {description}
      </p>

      <span
        className="
          mt-3
          rounded-full
          bg-card
          px-3
          py-1.5
          text-[8px]
          font-bold
          text-muted-foreground
          shadow-sm
          ring-1
          ring-border
        "
      >
        Click to upload
      </span>
    </label>
  );
}

/* =========================================================
   REQUIREMENT CARD
========================================================= */

function RequirementCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;

  icon:
    React.ElementType;

  title:
    string;

  description:
    string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="
        rounded-[18px]
        border
        border-border
        bg-muted/30
        p-4
        transition-shadow
        hover:shadow-[0_12px_30px_rgba(17,47,78,0.06)]
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-[12px]
            bg-primary/10
            text-primary
          "
        >
          <Icon className="h-[17px] w-[17px]" />
        </div>

        <span
          className="
            text-[9px]
            font-black
            text-muted-foreground/50
          "
        >
          {number}
        </span>
      </div>

      <h3
        className="
          mt-4
          text-[11px]
          font-extrabold
          text-card-foreground
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1.5
          text-[9px]
          leading-4
          text-muted-foreground
        "
      >
        {description}
      </p>
    </motion.div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        py-1
      "
    >
      <span
        className="
          text-[9px]
          text-muted-foreground
        "
      >
        {label}
      </span>

      <span
        className="
          max-w-[170px]
          truncate
          text-right
          text-[9px]
          font-bold
          text-card-foreground
        "
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   REVIEW ROW
========================================================= */

function ReviewRow({
  label,
  value,
  last = false,
}: {
  label:
    string;

  value:
    string;

  last?: boolean;
}) {
  return (
    <div
      className={`
        flex
        flex-col
        gap-1.5
        py-3
        sm:flex-row
        sm:items-center
        sm:justify-between
        ${
          !last
            ? "border-b border-border"
            : ""
        }
      `}
    >
      <span
        className="
          text-[10px]
          text-muted-foreground
        "
      >
        {label}
      </span>

      <span
        className="
          max-w-[300px]
          truncate
          text-[10px]
          font-bold
          text-card-foreground
        "
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   PRIMARY BUTTON
========================================================= */

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  disabled?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className="
        flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-[13px]
        bg-primary
        px-5
        text-[11px]
        font-extrabold
        text-primary-foreground
        shadow-[0_8px_20px_rgba(79,70,229,0.16)]
        transition
        hover:brightness-105
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {children}
    </button>
  );
}

/* =========================================================
   SECONDARY BUTTON
========================================================= */

function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  disabled?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className="
        flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-[13px]
        border
        border-border
        bg-background
        px-4
        text-[11px]
        font-bold
        text-muted-foreground
        transition
        hover:border-primary/30
        hover:bg-primary/5
        hover:text-primary
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {children}
    </button>
  );
}

/* =========================================================
   MESSAGE ALERT
========================================================= */

function MessageAlert({
  type,
  message,
  onClose,
}: {
  type:
    | "error"
    | "success";

  message:
    string;

  onClose:
    () => void;
}) {
  const success =
    type ===
    "success";

  const Icon =
    success
      ? CheckCircle2
      : AlertCircle;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      className={`
        flex
        items-start
        gap-3
        rounded-[16px]
        border
        p-4
        ${
          success
            ? "border-emerald-500/20 bg-emerald-500/10"
            : "border-rose-500/20 bg-rose-500/10"
        }
      `}
    >
      <Icon
        className={`
          mt-0.5
          h-4
          w-4
          shrink-0
          ${
            success
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }
        `}
      />

      <p
        className={`
          min-w-0
          flex-1
          text-xs
          font-semibold
          leading-5
          ${
            success
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-rose-700 dark:text-rose-300"
          }
        `}
      >
        {message}
      </p>

      <button
        type="button"
        onClick={
          onClose
        }
        className="shrink-0 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function KYCLoadingState() {
  return (
    <div
      className="
        flex
        min-h-[65vh]
        items-center
        justify-center
        bg-background
      "
    >
      <div
        className="
          flex
          flex-col
          items-center
          text-center
        "
      >
        <div
          className="
            relative
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-[20px]
            bg-primary
            text-primary-foreground
            shadow-[0_15px_35px_rgba(79,70,229,0.2)]
          "
        >
          <Fingerprint className="h-7 w-7" />

          <div
            className="
              absolute
              -inset-2
              animate-ping
              rounded-[24px]
              border
              border-primary/30
            "
          />
        </div>

        <h3
          className="
            mt-5
            text-sm
            font-extrabold
            text-foreground
          "
        >
          Loading verification
        </h3>

        <p
          className="
            mt-1
            text-[10px]
            text-muted-foreground
          "
        >
          Checking your KYC status...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS CONFIG
========================================================= */

function getStatusConfig(
  status: KYCStatus
) {
  switch (
    status
  ) {
    case "pending":
      return {
        label:
          "Pending",

        title:
          "Verification submitted",

        description:
          "Your identity documents have been submitted and are waiting for review.",

        icon:
          Clock3,
      };

    case "under_review":
      return {
        label:
          "Under Review",

        title:
          "Review in progress",

        description:
          "Your submission is currently being reviewed by the verification team.",

        icon:
          ScanFace,
      };

    case "verified":
      return {
        label:
          "Verified",

        title:
          "Identity verified",

        description:
          "Your identity has been successfully verified and your account is protected.",

        icon:
          BadgeCheck,
      };

    case "rejected":
      return {
        label:
          "Needs Update",

        title:
          "Verification requires attention",

        description:
          "Your previous submission could not be approved. Review the feedback and submit again.",

        icon:
          AlertCircle,
      };

    default:
      return {
        label:
          "Not Started",

        title:
          "Complete identity verification",

        description:
          "Start verification to protect your wallet and unlock verified account actions.",

        icon:
          Fingerprint,
      };
  }
}

/* =========================================================
   STATUS ICON THEME
========================================================= */

function getStatusIconTheme(
  status: KYCStatus
): string {
  switch (
    status
  ) {
    case "pending":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "under_review":
      return "bg-primary/10 text-primary";

    case "verified":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "rejected":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";

    default:
      return "bg-primary/10 text-primary";
  }
}

/* =========================================================
   STATUS BADGE THEME
========================================================= */

function getStatusBadgeTheme(
  status: KYCStatus
): string {
  switch (
    status
  ) {
    case "pending":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";

    case "under_review":
      return "bg-primary/10 text-primary";

    case "verified":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

    case "rejected":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

/* =========================================================
   DOCUMENT TYPE
========================================================= */

function formatDocumentType(
  type: DocumentType
): string {
  if (
    type ===
    "nid"
  ) {
    return "National ID";
  }

  if (
    type ===
    "driving_license"
  ) {
    return "Driving License";
  }

  return "Passport";
}

/* =========================================================
   MASK DOCUMENT
========================================================= */

function maskDocumentNumber(
  value: string
): string {
  if (
    value.length <=
    4
  ) {
    return value;
  }

  return `${"•".repeat(
    Math.min(
      8,
      value.length -
        4
    )
  )}${value.slice(
    -4
  )}`;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(
  value: string
): string {
  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}