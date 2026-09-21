"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  Clock3,
  FileCheck2,
  Fingerprint,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  createLivenessChallenge,
  getCurrentEKYC,
  getKycPhone,
  requestKycPhoneOtp,
  submitEKYC,
  validateNidDocuments,
  verifyKycDeviceBiometric,
  verifyKycPhoneOtp,
} from "@/lib/api/ekycApi";
import type {
  ActiveLivenessAction,
  ActiveLivenessChallengeSession,
  CompletedLivenessCapture,
  DeviceBiometricProof,
  EKYCVerification,
  NIDDocumentValidation,
  PhoneOtpChallenge,
  PhoneOtpChannel,
} from "@/types/ekyc";
import { useTheme } from "@/context/ThemeContext";
import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";
import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Phone", icon: Phone },
  { id: 2, label: "NID", icon: FileCheck2 },
  { id: 3, label: "Face", icon: Camera },
  { id: 4, label: "Biometric", icon: Fingerprint },
  { id: 5, label: "Review", icon: ShieldCheck },
] as const;

const ACTION_LABEL: Record<ActiveLivenessAction, string> = {
  BLINK: "Blink naturally twice",
  TURN_LEFT: "Slowly turn your head left",
  TURN_RIGHT: "Slowly turn your head right",
};

const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (["NotAllowedError", "SecurityError"].includes(name)) {
    return "Camera permission was denied. Allow camera access in the browser and try again.";
  }
  if (["NotFoundError", "DevicesNotFoundError"].includes(name)) {
    return "No camera was found.";
  }
  if (["NotReadableError", "TrackStartError"].includes(name)) {
    return "The camera is busy in another app. Close it there and try again.";
  }
  return "The camera could not start. Check browser permission, HTTPS, and the selected camera.";
}

function validateIdentity(name: string, nid: string, dob: string): string | null {
  if (name.trim().length < 2) return "Enter the full name printed on the NID.";

  if (!/^(?:\d{10}|\d{13}|\d{17})$/.test(nid.replace(/[\s-]/g, ""))) {
    return "NID number must contain 10, 13, or 17 digits.";
  }

  const birth = new Date(`${dob}T00:00:00Z`);
  if (!dob || Number.isNaN(birth.getTime())) return "Enter a valid date of birth.";

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();

  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() &&
      now.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }

  return age < 18 ? "The applicant must be at least 18 years old." : null;
}

async function prepareImage(file: File): Promise<File> {
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
    throw new Error("Use a JPG, PNG, or WEBP image.");
  }

  if (file.size <= 950 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("The image could not be prepared.");

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8)
  );

  if (!blob || blob.size > 1024 * 1024) {
    throw new Error("The image is too large. Upload a clear image smaller than 1 MB.");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function StepCircle(props: {
  id: number;
  label: string;
  active: boolean;
  done: boolean;
  icon: ComponentType<{ className?: string }>;
  primary: string;
  success: string;
  border: string;
  surface: string;
  textSoft: string;
}) {
  const Icon = props.icon;

  return (
    <div className="relative z-10 flex w-14 min-w-[56px] flex-col items-center gap-2 sm:w-16 sm:min-w-[64px] lg:w-20 lg:min-w-[80px]">
      <span
        className="grid h-10 w-10 place-items-center rounded-full border-4 border-white transition-all duration-300 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
        style={{
          background: props.done
            ? props.success
            : props.active
              ? props.primary
              : props.surface,
          color: props.done || props.active ? "#FFFFFF" : props.textSoft,
          boxShadow: props.active ? `0 0 0 6px ${props.primary}18` : "none",
          borderColor: "#ffffff",
        }}
      >
        {props.done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>

      <small
        className="text-center text-[10px] font-black uppercase tracking-[0.14em] sm:text-[11px]"
        style={{ color: props.active ? props.primary : props.textSoft }}
      >
        {props.label}
      </small>
    </div>
  );
}

function StatusCard({
  verification,
}: {
  verification: EKYCVerification;
}) {
  const { tokens } = useTheme();

  const pending = ["QUEUED", "PROCESSING", "PENDING_MANUAL_REVIEW"].includes(
    verification.status
  );
  const verified = verification.status === "VERIFIED";

  const Icon = verified ? BadgeCheck : pending ? Clock3 : XCircle;

  const tone = verified
    ? {
        bg: tokens.successSoft,
        text: tokens.success,
      }
    : pending
      ? {
          bg: tokens.warningSoft,
          text: tokens.warning,
        }
      : {
          bg: tokens.dangerSoft,
          text: tokens.danger,
        };

  return (
    <div
      className="mx-auto max-w-3xl rounded-[32px] border p-8 backdrop-blur-xl"
      style={{
        background: tokens.surfaceElevated,
        borderColor: tokens.border,
        boxShadow: tokens.shadowStrong,
      }}
    >
      <span
        className="grid h-16 w-16 place-items-center rounded-2xl"
        style={{ background: tone.bg, color: tone.text }}
      >
        <Icon className="h-8 w-8" />
      </span>

      <p
        className="mt-6 text-xs font-black uppercase tracking-[.2em]"
        style={{ color: tokens.primary }}
      >
        Identity verification
      </p>

      <h1
        className="mt-2 text-3xl font-black"
        style={{ color: tokens.text }}
      >
        {verified
          ? "Your identity is verified"
          : pending
            ? "Waiting for admin review"
            : "Verification needs attention"}
      </h1>

      <p
        className="mt-3 text-sm leading-6"
        style={{ color: tokens.textSoft }}
      >
        {verified
          ? "A Coffer administrator approved your e-KYC application."
          : pending
            ? "Automated checks prepare evidence only. An administrator must approve or reject every application."
            : "Your previous application was rejected. You may submit a corrected application."}
      </p>

      <span
        className="mt-6 inline-flex rounded-full px-4 py-2 text-xs font-bold"
        style={{
          background: tokens.surfaceMuted,
          color: tokens.textSoft,
          border: `1px solid ${tokens.border}`,
        }}
      >
        {verification.status.replaceAll("_", " ")}
      </span>
    </div>
  );
}

function UploadField(props: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (file: File) => Promise<void>;
  inputBg: string;
  surface: string;
  border: string;
  text: string;
  textSoft: string;
  primary: string;
}) {
  const [working, setWorking] = useState(false);

  return (
    <label
      className="block cursor-pointer rounded-3xl border border-dashed p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: props.border,
        background: props.inputBg,
      }}
    >
      <input
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={working}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;

          setWorking(true);
          void props.onFile(selected).finally(() => setWorking(false));
        }}
      />

      <span className="flex gap-4">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm"
          style={{
            background: props.surface,
            color: props.primary,
            border: `1px solid ${props.border}`,
          }}
        >
          {working ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : props.file ? (
            <Check className="h-5 w-5" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </span>

        <span>
          <b
            className="block text-sm"
            style={{ color: props.text }}
          >
            {props.label}
          </b>
          <small
            className="mt-1 block"
            style={{ color: props.textSoft }}
          >
            {props.file?.name || props.hint}
          </small>
        </span>
      </span>
    </label>
  );
}

function HeroStatCard(props: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  const Icon = props.icon;

  return (
    <div className="kyc-stat-card relative overflow-hidden rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-md sm:p-5">
      <div className="kyc-stat-shine absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div
        className="grid h-10 w-10 place-items-center rounded-2xl border border-white/12"
        style={{
          background: `${props.accent}20`,
          color: "#FFFFFF",
        }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
        {props.label}
      </div>

      <div className="mt-2 break-words text-sm font-extrabold leading-6 text-white sm:text-base">
        {props.value}
      </div>
    </div>
  );
}

export default function KycPage() {
  const { tokens } = useTheme();
  const router = useRouter();

  /*
   * DashboardSessionContext is populated from the
   * authenticated backend profile by the dashboard layout.
   * The backend-confirmed role is the source of truth.
   */
  const {
    user,
  } = useDashboardSession();

  const isUserRole =
    user.role === "user";

  /* =======================================================
     USER-ONLY PAGE GUARD

     Only personal role=user accounts can access e-KYC.
     Merchant / Analyst / Support / Admin / Super Admin
     are redirected to their own dashboard home.
  ======================================================= */

  useEffect(() => {
    if (isUserRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isUserRole,
    router,
    user.role,
  ]);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<EKYCVerification | null>(null);

  const [phone, setPhone] = useState("");
  const [phoneChannel, setPhoneChannel] = useState<PhoneOtpChannel>("sms");
  const [phoneChallenge, setPhoneChallenge] = useState<PhoneOtpChallenge | null>(null);
  const [phoneChallengeId, setPhoneChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [documentValidation, setDocumentValidation] =
    useState<NIDDocumentValidation | null>(null);

  const [liveness, setLiveness] = useState<CompletedLivenessCapture | null>(null);
  const [livenessSession, setLivenessSession] =
    useState<ActiveLivenessChallengeSession | null>(null);
  const [actionIndex, setActionIndex] = useState(0);
  const [recording, setRecording] = useState(false);

  const [biometric, setBiometric] = useState<DeviceBiometricProof | null>(null);
  const [biometricSkipped, setBiometricSkipped] = useState(false);

  const [biometricSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      "PublicKeyCredential" in window &&
      Boolean(navigator.credentials)
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<string | null>(null);

  // Prevent duplicate OTP API calls before React has time to
  // commit the busy state and disable the buttons.
  const otpRequestInFlightRef = useRef(false);
  const otpVerifyInFlightRef = useRef(false);

  // Keep the newest challenge ID synchronously as well as in React state.
  // This removes any chance of verifying a stale challenge after resend.
  const phoneChallengeIdRef = useRef("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRecording(false);
  }, []);

  useEffect(() => {
    let active = true;

    if (!isUserRole) {
      setLoading(false);
      stopCamera();

      return () => {
        active = false;
        stopCamera();
      };
    }

    void Promise.all([
      getCurrentEKYC(),
      getKycPhone(),
    ])
      .then(
        ([
          current,
          currentPhone,
        ]) => {
          if (!active) {
            return;
          }

          setVerification(
            current
          );

          setPhone(
            typeof currentPhone ===
              "string"
              ? currentPhone
              : ""
          );
        }
      )
      .catch(
        (
          requestError
        ) => {
          if (active) {
            setError(
              messageOf(
                requestError
              )
            );
          }
        }
      )
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      stopCamera();
    };
  }, [
    isUserRole,
    stopCamera,
  ]);

  useEffect(() => {
    if (
      !isUserRole ||
      !verification ||
      ![
        "QUEUED",
        "PROCESSING",
      ].includes(
        verification.status
      )
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          void getCurrentEKYC()
            .then(
              setVerification
            )
            .catch(
              () =>
                undefined
            );
        },
        5000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    isUserRole,
    verification,
  ]);

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);

  const inputStyle = useMemo(
    () => ({
      background: tokens.inputBg,
      color: tokens.inputText,
      borderColor: tokens.border,
      boxShadow: "none",
    }),
    [tokens]
  );

  async function sendOtp() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    if (
      otpRequestInFlightRef.current ||
      otpVerifyInFlightRef.current
    ) {
      return;
    }

    if (!phone?.trim()) {
      setError(
        "Enter a valid phone number."
      );
      return;
    }

    otpRequestInFlightRef.current =
      true;

    setBusy(true);
    setError("");

    try {
      const challenge =
        await requestKycPhoneOtp(
          phone,
          phoneChannel
        );

      /*
       * Every send/resend creates a new challenge.
       * Always replace both the visible challenge and the ID used
       * by the verify request so a stale challenge can never be sent.
       */
      setPhoneChallenge(
        challenge
      );

      phoneChallengeIdRef.current =
        challenge.challengeId;

      setPhoneChallengeId(
        challenge.challengeId
      );

      setPhoneVerified(
        false
      );

      setOtp("");
    } catch (
      requestError
    ) {
      setError(
        messageOf(
          requestError
        )
      );
    } finally {
      otpRequestInFlightRef.current =
        false;

      setBusy(false);
    }
  }

  async function confirmOtp() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    /*
     * setBusy(true) alone is not enough to stop two very fast clicks,
     * because React state updates are asynchronous.
     *
     * This ref changes synchronously, so only one verification request
     * can leave this page at a time.
     */
    if (
      otpVerifyInFlightRef.current ||
      otpRequestInFlightRef.current
    ) {
      return;
    }

    const currentChallengeId =
      (
        phoneChallengeIdRef.current ||
        phoneChallenge?.challengeId ||
        phoneChallengeId
      ).trim();

    const currentOtp =
      otp.trim();

    if (
      !currentChallengeId
    ) {
      setError(
        "Request a new verification code first."
      );
      return;
    }

    if (
      !/^\d{6}$/.test(
        currentOtp
      )
    ) {
      setError(
        "Enter the 6-digit verification code."
      );
      return;
    }

    otpVerifyInFlightRef.current =
      true;

    setBusy(true);
    setError("");

    try {
      const result =
        await verifyKycPhoneOtp(
          {
            challengeId:
              currentChallengeId,

            otp:
              currentOtp,
          }
        );

      setPhone(
        result.phone
      );

      setPhoneVerified(
        true
      );

      setStep(2);
    } catch (
      requestError
    ) {
      const message =
        messageOf(
          requestError
        );

      setError(
        message
      );

      if (
        message.includes(
          "Request a new code"
        ) ||
        message.includes(
          "challenge was not found"
        ) ||
        message.includes(
          "already been used"
        )
      ) {
        phoneChallengeIdRef.current =
          "";

        setPhoneChallengeId(
          ""
        );
      }
    } finally {
      otpVerifyInFlightRef.current =
        false;

      setBusy(false);
    }
  }

  async function chooseImage(kind: "front" | "back", file: File) {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    setError("");

    try {
      const prepared = await prepareImage(file);
      if (kind === "front") {
        setFrontImage(prepared);
      } else {
        setBackImage(prepared);
      }
      setDocumentValidation(null);
    } catch (imageError) {
      setError(messageOf(imageError));
    }
  }

  async function validateDocumentsAndContinue() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    const identityError = validateIdentity(name, nid, dateOfBirth);
    if (identityError) {
      setError(identityError);
      return;
    }

    if (!frontImage || !backImage) {
      setError("Upload both sides of the NID.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const validation = await validateNidDocuments({
        phoneChallengeId,
        frontImage,
        backImage,
      });

      setDocumentValidation(validation);
      setStep(3);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function requestCamera(): Promise<MediaStream> {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      throw new Error(
        "This verification flow is available only to personal user accounts."
      );
    }

    const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (!window.isSecureContext && !local) {
      throw new Error("Live face verification requires HTTPS.");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support camera capture.");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
    } catch (firstError) {
      if (
        firstError instanceof DOMException &&
        ["NotAllowedError", "SecurityError"].includes(firstError.name)
      ) {
        throw firstError;
      }

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
    }
  }

  async function startLiveness() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    setBusy(true);
    setError("");
    stopCamera();

    try {
      if (!("MediaRecorder" in window)) {
        throw new Error("This browser cannot record liveness video.");
      }

      const [session, stream] = await Promise.all([
        createLivenessChallenge(),
        requestCamera(),
      ]);

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Camera preview is unavailable.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const mimeType = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(500);
      recorderRef.current = recorder;
      startedAtRef.current = new Date().toISOString();

      setLivenessSession(session);
      setActionIndex(0);
      setRecording(true);
      setLiveness(null);
    } catch (cameraError) {
      stopCamera();
      setError(
        cameraError instanceof DOMException
          ? cameraErrorMessage(cameraError)
          : messageOf(cameraError)
      );
    } finally {
      setBusy(false);
    }
  }

  function captureSelfie(): Promise<File> {
    const video = videoRef.current;

    if (!video?.videoWidth || !video.videoHeight) {
      return Promise.reject(new Error("The camera frame is not ready."));
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return Promise.reject(new Error("The camera frame could not be captured."));
    }

    context.drawImage(video, 0, 0);

    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("The selfie could not be captured."));
          return;
        }

        resolve(
          new File([blob], "ekyc-selfie.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        );
      }, "image/jpeg", 0.9)
    );
  }

  async function finishLiveness() {
    const recorder = recorderRef.current;

    if (!recorder || !livenessSession || !startedAtRef.current || recorder.state === "inactive") {
      throw new Error("The liveness recording is unavailable.");
    }

    if (Date.now() - new Date(startedAtRef.current).getTime() < 6500) {
      throw new Error("Complete the actions slowly for at least 7 seconds before capture.");
    }

    const selfie = await captureSelfie();
    const startedAt = startedAtRef.current;
    const completedAt = new Date().toISOString();

    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () =>
        resolve(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || "video/webm",
          })
        );
      recorder.onerror = () => reject(new Error("The liveness recording failed."));
      recorder.stop();
    });

    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const video = new File([blob], `ekyc-liveness.${extension}`, {
      type: blob.type || "video/webm",
      lastModified: Date.now(),
    });

    if (video.size > 8 * 1024 * 1024) {
      throw new Error("The liveness recording is larger than 8 MB.");
    }

    const session = livenessSession;

    stopCamera();
    setLiveness({
      session,
      startedAt,
      completedAt,
      selfie,
      video,
    });
    setStep(4);
  }

  async function completeAction() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    if (!livenessSession || !recording) return;

    setError("");

    if (actionIndex < livenessSession.challenges.length - 1) {
      setActionIndex((value) => value + 1);
      return;
    }

    setBusy(true);
    try {
      await finishLiveness();
    } catch (captureError) {
      setError(messageOf(captureError));
    } finally {
      setBusy(false);
    }
  }

  async function verifyBiometric() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await verifyKycDeviceBiometric();
      setBiometric(result);
      setBiometricSkipped(false);
      setStep(5);
    } catch (biometricError) {
      setError(messageOf(biometricError));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!isUserRole) {
      router.replace(
        getDashboardHome(
          user.role
        )
      );

      return;
    }

    if (!frontImage || !backImage || !documentValidation || !liveness || !phoneVerified) {
      setError("One or more required verification steps are incomplete.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await submitEKYC({
        claimedName: name,
        dateOfBirth,
        nid,
        frontImage,
        backImage,
        selfieImage: liveness.selfie,
        liveness,
        phoneChallengeId,
        documentValidationId: documentValidation.validationId,
        biometricSessionId: biometric?.sessionId,
      });

      setVerification(result.verification);
    } catch (submitError) {
      setError(messageOf(submitError));
    } finally {
      setBusy(false);
    }
  }

  if (!isUserRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-transparent px-4">
        <div className="flex flex-col items-center text-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl border shadow-sm"
            style={{
              background:
                tokens.primarySoft,
              borderColor:
                tokens.border,
              color:
                tokens.primary,
            }}
          >
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p
            className="mt-4 text-sm font-black"
            style={{
              color:
                tokens.text,
            }}
          >
            Opening your workspace
          </p>

          <p
            className="mt-1 max-w-sm text-xs leading-5"
            style={{
              color:
                tokens.textSoft,
            }}
          >
            e-KYC is available only to personal user accounts.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-transparent">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: tokens.primary }}
        />
      </div>
    );
  }

  if (verification && verification.status !== "REJECTED") {
    return (
      <main className="min-h-screen bg-transparent px-4 py-10">
        <StatusCard verification={verification} />
      </main>
    );
  }

  const title =
    [
      "",
      "Verify your phone",
      "Validate your NID",
      "Prove you are present",
      "Device biometric",
      "Review and submit",
    ][step] ?? "";

  const description =
    [
      "",
      "The registration number is loaded automatically and may be changed before OTP.",
      "OCR rejects unrelated images before submission.",
      "The server validates random blink and head-turn evidence.",
      "WebAuthn keeps the raw fingerprint or face template inside the device.",
      "Submission creates a pending case; it never auto-verifies the account.",
    ][step] ?? "";

  const currentAction = livenessSession?.challenges?.[actionIndex] ?? null;

  const heroStats = [
    {
      label: "Step progress",
      value: `${step}/5`,
      icon: BadgeCheck,
      accent: tokens.primary,
    },
    {
      label: "Verification mode",
      value: "Protected",
      icon: ShieldCheck,
      accent: tokens.success,
    },
    {
      label: "Biometric",
      value: biometricSupported ? "Supported" : "Optional",
      icon: Fingerprint,
      accent: tokens.primaryStrong,
    },
  ] as const;

  return (
    <main
      className="min-h-screen bg-transparent px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{
        color: tokens.text,
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section
          className="kyc-hero relative overflow-hidden rounded-[28px] border p-5 sm:rounded-[34px] sm:p-7 lg:p-8 xl:p-10"
          style={{
            background: `linear-gradient(135deg, ${tokens.heroFrom} 0%, ${tokens.heroTo} 100%)`,
            borderColor: `${tokens.primary}33`,
            boxShadow: tokens.shadowStrong,
          }}
        >
          <div className="kyc-hero-grid absolute inset-0 opacity-35" />
          <div
            className="kyc-orb absolute -right-10 top-8 h-44 w-44 rounded-full blur-3xl"
            style={{ background: tokens.heroGlow }}
          />
          <div
            className="kyc-orb absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: tokens.heroGlowSecondary }}
          />
          <div
            className="kyc-hero-beam absolute -left-24 top-1/2 h-32 w-72 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${tokens.primary}30` }}
          />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-center">
            <div className="max-w-3xl">
              <div
                className="inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Secure e-KYC Workspace
                <span className="h-1 w-1 rounded-full bg-white/60" />
                Live onboarding
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl xl:text-[56px]">
                Complete your identity verification
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Confirm phone ownership, validate your NID, complete live face
                capture and optionally verify device biometric in one protected
                flow.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur">
                  <LockKeyhole className="h-4 w-4" />
                  Encrypted evidence
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  Manual admin approval
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  Professional secure flow
                </span>
              </div>
            </div>

            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-0 hidden xl:block">
                <div className="kyc-radar absolute right-6 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border border-white/10" />
                <div className="kyc-radar-delay absolute right-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-white/10" />
                <div className="kyc-radar-delay-2 absolute right-[4.5rem] top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-white/12" />
                <div className="absolute right-[8.2rem] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
              </div>

              <div className="grid gap-3 min-[560px]:grid-cols-3 xl:grid-cols-1">
                {heroStats.map((item) => (
                  <HeroStatCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    icon={item.icon}
                    accent={item.accent}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STEPPER */}
        <section
          className="mt-6 rounded-[28px] border p-4 sm:p-5 backdrop-blur-xl"
          style={{
            background: tokens.surfaceElevated,
            borderColor: tokens.border,
            boxShadow: tokens.shadow,
          }}
        >
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="relative flex min-w-[560px] justify-between gap-3 px-1 sm:min-w-0">
              <div
                className="absolute left-5 right-5 top-5 h-1 rounded-full"
                style={{ background: tokens.primarySoft }}
              />
              <div
                className="absolute left-5 top-5 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `calc((100% - 2.5rem) * ${progress / 100})`,
                  background: `linear-gradient(90deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                }}
              />

              {STEPS.map(({ id, label, icon }) => (
                <StepCircle
                  key={id}
                  id={id}
                  label={label}
                  icon={icon}
                  active={id === step}
                  done={id < step}
                  primary={tokens.primary}
                  success={tokens.success}
                  border={tokens.border}
                  surface={tokens.surface}
                  textSoft={tokens.textSoft}
                />
              ))}
            </div>
          </div>
        </section>

        {/* MAIN PANEL */}
        <section
          className="mt-6 overflow-hidden rounded-[28px] sm:rounded-[32px] border"
          style={{
            background: tokens.surface,
            borderColor: tokens.border,
            boxShadow: tokens.shadowStrong,
          }}
        >
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
            {/* LEFT SIDEBAR */}
            <aside
              className="relative overflow-hidden p-6 sm:p-8"
              style={{
                background: `linear-gradient(180deg, ${tokens.heroFrom} 0%, ${tokens.heroTo} 100%)`,
              }}
            >
              <div
                className="kyc-orb absolute right-2 top-4 h-32 w-32 rounded-full blur-3xl"
                style={{ background: tokens.heroGlow }}
              />
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-[.2em] text-white/70">
                  Step {step} of 5
                </p>

                <h2 className="mt-3 text-2xl font-black text-white">
                  {title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/72">
                  {description}
                </p>

                <div className="mt-8 space-y-3 text-xs text-white/80">
                  <p className="flex gap-3">
                    <ShieldCheck className="h-4 w-4 text-white" />
                    Manual admin approval required
                  </p>
                  <p className="flex gap-3">
                    <LockKeyhole className="h-4 w-4 text-white" />
                    Sensitive evidence encrypted
                  </p>
                  <p className="flex gap-3">
                    <Fingerprint className="h-4 w-4 text-white" />
                    No raw biometric stored
                  </p>
                </div>
              </div>
            </aside>

            {/* RIGHT CONTENT */}
            <div className="min-h-[560px] p-5 sm:p-8 lg:min-h-[620px] lg:p-10">
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: `${tokens.danger}40`,
                    background: tokens.dangerSoft,
                    color: tokens.danger,
                  }}
                >
                  {error}
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div className="mx-auto max-w-2xl">
                  <h3
                    className="text-2xl font-black"
                    style={{ color: tokens.text }}
                  >
                    Phone number & OTP
                  </h3>

                  <p
                    className="mt-2 text-sm"
                    style={{ color: tokens.textSoft }}
                  >
                    Confirm a number you control before uploading identity documents.
                  </p>

                  <label className="mt-8 block text-xs font-black uppercase tracking-[0.14em]">
                    <span style={{ color: tokens.primarySoftText }}>
                      Mobile number
                    </span>
                  </label>

                  <div className="mt-2">
                    <input
                      className="w-full rounded-2xl border px-4 py-3.5 font-bold outline-none transition-all focus:ring-4"
                      style={{
                        ...inputStyle,
                        boxShadow: `0 0 0 0 ${tokens.ring}`,
                      }}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneChallenge(null);
                        setPhoneChallengeId("");
                        setOtp("");
                        setPhoneVerified(false);
                      }}
                      placeholder="+8801XXXXXXXXX"
                    />
                  </div>

                  <div className="mt-6">
                    <p
                      className="text-xs font-black uppercase tracking-[0.14em]"
                      style={{ color: tokens.primarySoftText }}
                    >
                      Receive verification code via
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={phoneChannel === "whatsapp"}
                        onClick={() => {
                          setPhoneChannel("whatsapp");
                          setPhoneChallenge(null);
                          setPhoneChallengeId("");
                          setOtp("");
                        }}
                        className="group rounded-2xl border p-4 text-left transition-all duration-300 disabled:opacity-50"
                        style={{
                          borderColor:
                            phoneChannel === "whatsapp"
                              ? tokens.success
                              : tokens.border,
                          background:
                            phoneChannel === "whatsapp"
                              ? tokens.successSoft
                              : tokens.surfaceMuted,
                          boxShadow:
                            phoneChannel === "whatsapp"
                              ? `0 12px 28px ${tokens.success}18`
                              : "none",
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                            style={{
                              background:
                                phoneChannel === "whatsapp"
                                  ? `${tokens.success}18`
                                  : tokens.surface,
                              color: tokens.success,
                              border: `1px solid ${tokens.border}`,
                            }}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </span>

                          <span className="min-w-0">
                            <b
                              className="block text-sm"
                              style={{ color: tokens.text }}
                            >
                              WhatsApp
                            </b>

                            <small
                              className="mt-1 block"
                              style={{ color: tokens.textSoft }}
                            >
                              Best for Meta test-number verification
                            </small>
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={phoneChannel === "sms"}
                        onClick={() => {
                          setPhoneChannel("sms");
                          setPhoneChallenge(null);
                          setPhoneChallengeId("");
                          setOtp("");
                        }}
                        className="group rounded-2xl border p-4 text-left transition-all duration-300 disabled:opacity-50"
                        style={{
                          borderColor:
                            phoneChannel === "sms"
                              ? tokens.primary
                              : tokens.border,
                          background:
                            phoneChannel === "sms"
                              ? tokens.primarySoft
                              : tokens.surfaceMuted,
                          boxShadow:
                            phoneChannel === "sms"
                              ? `0 12px 28px ${tokens.primary}18`
                              : "none",
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                            style={{
                              background:
                                phoneChannel === "sms"
                                  ? `${tokens.primary}18`
                                  : tokens.surface,
                              color: tokens.primary,
                              border: `1px solid ${tokens.border}`,
                            }}
                          >
                            <Phone className="h-5 w-5" />
                          </span>

                          <span className="min-w-0">
                            <b
                              className="block text-sm"
                              style={{ color: tokens.text }}
                            >
                              SMS
                            </b>

                            <small
                              className="mt-1 block"
                              style={{ color: tokens.textSoft }}
                            >
                              Use your configured Bangladesh SMS provider
                            </small>
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy || !phone?.trim()}
                    onClick={() => void sendOtp()}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white transition-all duration-300 disabled:opacity-50"
                    style={{
                      background:
                        phoneChannel === "whatsapp"
                          ? `linear-gradient(135deg, ${tokens.success} 0%, #10B981 100%)`
                          : `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                      boxShadow:
                        phoneChannel === "whatsapp"
                          ? `0 14px 28px ${tokens.success}24`
                          : `0 14px 28px ${tokens.primary}2a`,
                    }}
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}

                    {phoneChallenge
                      ? `Resend on ${
                          phoneChannel === "whatsapp" ? "WhatsApp" : "SMS"
                        }`
                      : `Send code on ${
                          phoneChannel === "whatsapp" ? "WhatsApp" : "SMS"
                        }`}
                  </button>

                  {phoneChallenge && (
                    <div
                      className="mt-6 rounded-[28px] border p-5"
                      style={{
                        background: tokens.primarySoft,
                        borderColor: tokens.borderStrong,
                      }}
                    >
                      <p
                        className="text-sm font-bold"
                        style={{ color: tokens.text }}
                      >
                        Code sent by{" "}
                        {(phoneChallenge.channel ?? phoneChannel) === "whatsapp"
                          ? "WhatsApp"
                          : "SMS"}{" "}
                        to {phoneChallenge.maskedPhone}
                      </p>

                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          );

                          if (error) {
                            setError("");
                          }
                        }}
                        className="mt-4 w-full rounded-2xl border px-4 py-3 text-center text-xl font-black tracking-[.4em] outline-none"
                        style={inputStyle}
                        placeholder="000000"
                      />

                      <button
                        type="button"
                        disabled={
                          busy ||
                          otp.length !== 6 ||
                          !phoneChallengeId
                        }
                        onClick={() =>
                          void confirmOtp()
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                        }}
                      >
                        {busy && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}

                        {busy
                          ? "Verifying..."
                          : "Verify and continue"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div>
                  <h3
                    className="text-2xl font-black"
                    style={{ color: tokens.text }}
                  >
                    NID details & document check
                  </h3>

                  <p
                    className="mt-2 text-sm"
                    style={{ color: tokens.textSoft }}
                  >
                    Enter exactly what appears on the card and upload both sides.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <small
                        className="font-black uppercase tracking-[0.12em]"
                        style={{ color: tokens.primarySoftText }}
                      >
                        Full name on NID
                      </small>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none"
                        style={inputStyle}
                        placeholder="Enter full name"
                      />
                    </label>

                    <label>
                      <small
                        className="font-black uppercase tracking-[0.12em]"
                        style={{ color: tokens.primarySoftText }}
                      >
                        NID number
                      </small>
                      <input
                        inputMode="numeric"
                        value={nid}
                        onChange={(e) =>
                          setNid(e.target.value.replace(/[^\d\s-]/g, ""))
                        }
                        className="mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none"
                        style={inputStyle}
                        placeholder="10 / 13 / 17 digits"
                      />
                    </label>

                    <label>
                      <small
                        className="font-black uppercase tracking-[0.12em]"
                        style={{ color: tokens.primarySoftText }}
                      >
                        Date of birth
                      </small>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none"
                        style={inputStyle}
                      />
                    </label>

                    <UploadField
                      label="NID front"
                      hint="Clear, readable, all corners visible"
                      file={frontImage}
                      onFile={(file) => chooseImage("front", file)}
                      inputBg={tokens.inputBg}
                      surface={tokens.surface}
                      border={tokens.border}
                      text={tokens.text}
                      textSoft={tokens.textSoft}
                      primary={tokens.primary}
                    />

                    <UploadField
                      label="NID back"
                      hint="Clear, readable, all corners visible"
                      file={backImage}
                      onFile={(file) => chooseImage("back", file)}
                      inputBg={tokens.inputBg}
                      surface={tokens.surface}
                      border={tokens.border}
                      text={tokens.text}
                      textSoft={tokens.textSoft}
                      primary={tokens.primary}
                    />
                  </div>

                  <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-2xl border px-5 py-3 font-black transition-all"
                      style={{
                        borderColor: tokens.border,
                        color: tokens.text,
                        background: tokens.surface,
                      }}
                    >
                      <ArrowLeft className="mr-2 inline h-4 w-4" />
                      Back
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => void validateDocumentsAndContinue()}
                      className="rounded-2xl px-6 py-3 font-black text-white transition-all disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                        boxShadow: `0 14px 28px ${tokens.primary}24`,
                      }}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck2 className="mr-2 inline h-4 w-4" />
                      )}
                      Validate documents
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div>
                  <h3
                    className="text-2xl font-black"
                    style={{ color: tokens.text }}
                  >
                    Live face verification
                  </h3>

                  <p
                    className="mt-2 text-sm"
                    style={{ color: tokens.textSoft }}
                  >
                    Use a real camera, keep one face visible, and follow each
                    action slowly.
                  </p>

                  <div
                    className="mt-6 overflow-hidden rounded-[30px] border"
                    style={{
                      borderColor: tokens.border,
                      background: tokens.surfaceMuted,
                    }}
                  >
                    <div
                      className="relative aspect-video overflow-hidden"
                      style={{
                        background: "linear-gradient(180deg, #090B16 0%, #111827 100%)",
                      }}
                    >
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="h-full w-full object-cover [transform:scaleX(-1)]"
                      />

                      {!recording && (
                        <div className="absolute inset-0 grid place-items-center text-center">
                          <div>
                            <div
                              className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border shadow-lg"
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                borderColor: "rgba(255,255,255,0.10)",
                                color: "#FFFFFF",
                              }}
                            >
                              <Camera className="h-10 w-10" />
                            </div>
                            <p className="mt-4 font-bold text-white">
                              Camera preview
                            </p>
                            <p className="mt-1 text-sm text-white/60">
                              Professional secure capture will start here
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-6 rounded-[28px] border-2 border-white/20">
                        <div className="absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-white/80" />
                        <div className="absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-white/80" />
                        <div className="absolute bottom-4 left-4 h-8 w-8 border-b-4 border-l-4 border-white/80" />
                        <div className="absolute bottom-4 right-4 h-8 w-8 border-b-4 border-r-4 border-white/80" />
                      </div>

                      {recording && (
                        <>
                          <div className="kyc-scan-line absolute inset-x-8 top-10 h-[2px] rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(103,232,249,0.75)]" />
                          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
                            Recording
                          </div>
                        </>
                      )}

                      {recording && livenessSession && currentAction && (
                        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/70 p-4 text-center text-white backdrop-blur">
                          <small className="font-black uppercase tracking-widest text-violet-200">
                            Challenge {actionIndex + 1} of{" "}
                            {livenessSession.challenges.length}
                          </small>
                          <p className="mt-1 text-lg font-black">
                            {ACTION_LABEL[currentAction]}
                          </p>

                          <div className="mt-3 flex justify-center gap-2">
                            {livenessSession.challenges.map((_, index) => (
                              <span
                                key={index}
                                className="h-2.5 w-10 rounded-full"
                                style={{
                                  background:
                                    index <= actionIndex
                                      ? tokens.primary
                                      : "rgba(255,255,255,0.18)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p
                    className="mt-3 text-center text-xs font-semibold"
                    style={{ color: tokens.textMuted }}
                  >
                    Keep your full face centered in good light. Server-side
                    liveness validates the recorded actions.
                  </p>

                  <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
                    <button
                      onClick={() => {
                        stopCamera();
                        setStep(2);
                      }}
                      className="rounded-2xl border px-5 py-3 font-black"
                      style={{
                        borderColor: tokens.border,
                        color: tokens.text,
                        background: tokens.surface,
                      }}
                    >
                      <ArrowLeft className="mr-2 inline h-4 w-4" />
                      Back
                    </button>

                    {!recording ? (
                      <button
                        disabled={busy}
                        onClick={() => void startLiveness()}
                        className="rounded-2xl px-6 py-3 font-black text-white transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                          boxShadow: `0 14px 28px ${tokens.primary}24`,
                        }}
                      >
                        <Camera className="mr-2 inline h-4 w-4" />
                        Start secure camera
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => void completeAction()}
                        className="rounded-2xl px-6 py-3 font-black text-white transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${tokens.success} 0%, #10B981 100%)`,
                        }}
                      >
                        <Check className="mr-2 inline h-4 w-4" />
                        {actionIndex === 2
                          ? "Capture & continue"
                          : "Action completed"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="mx-auto max-w-2xl text-center">
                  <span
                    className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border"
                    style={{
                      background: tokens.primarySoft,
                      color: tokens.primary,
                      borderColor: tokens.borderStrong,
                      boxShadow: tokens.shadow,
                    }}
                  >
                    <Fingerprint className="h-11 w-11" />
                  </span>

                  <h3
                    className="mt-6 text-2xl font-black"
                    style={{ color: tokens.text }}
                  >
                    Verify this device
                  </h3>

                  <p
                    className="mt-3 text-sm leading-7"
                    style={{ color: tokens.textSoft }}
                  >
                    Windows Hello, Touch ID, Android screen lock, or another
                    platform authenticator confirms user presence. The operating
                    system keeps biometric templates in secure hardware.
                  </p>

                  <div
                    className="mt-7 rounded-2xl border p-4 text-left text-sm"
                    style={{
                      borderColor: `${tokens.success}40`,
                      background: tokens.successSoft,
                      color: tokens.text,
                    }}
                  >
                    <b>No fingerprint image is uploaded.</b> Only a one-time
                    verified WebAuthn credential reference is attached.
                  </div>

                  {!biometricSupported && (
                    <div
                      className="mt-4 rounded-2xl border p-4 text-sm font-semibold"
                      style={{
                        borderColor: `${tokens.warning}40`,
                        background: tokens.warningSoft,
                        color: tokens.warning,
                      }}
                    >
                      This browser does not support device biometrics. Continue
                      without it.
                    </div>
                  )}

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <button
                      disabled={busy || !biometricSupported}
                      onClick={() => void verifyBiometric()}
                      className="rounded-2xl px-5 py-3.5 font-black text-white disabled:opacity-40"
                      style={{
                        background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                      }}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      ) : (
                        <Fingerprint className="mr-2 inline h-4 w-4" />
                      )}
                      Verify on device
                    </button>

                    <button
                      onClick={() => {
                        setBiometricSkipped(true);
                        setStep(5);
                      }}
                      className="rounded-2xl border px-5 py-3.5 font-black"
                      style={{
                        borderColor: tokens.border,
                        color: tokens.text,
                        background: tokens.surface,
                      }}
                    >
                      Continue without biometric
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="mt-6 text-sm font-black"
                    style={{ color: tokens.textSoft }}
                  >
                    <ArrowLeft className="mr-2 inline h-4 w-4" />
                    Back to face check
                  </button>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div>
                  <h3
                    className="text-2xl font-black"
                    style={{ color: tokens.text }}
                  >
                    Review your submission
                  </h3>

                  <p
                    className="mt-2 text-sm"
                    style={{ color: tokens.textSoft }}
                  >
                    Submission creates a pending admin-review case.
                  </p>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    {[
                      ["Verified phone", phone],
                      ["NID name", name],
                      ["NID number", `••••••${nid.replace(/\D/g, "").slice(-4)}`],
                      ["Date of birth", dateOfBirth],
                      ["Documents", documentValidation ? "OCR preflight passed" : "Incomplete"],
                      ["Live face", liveness ? "Challenge captured" : "Incomplete"],
                      [
                        "Device biometric",
                        biometric
                          ? "WebAuthn verified"
                          : biometricSkipped
                            ? "Skipped / unavailable"
                            : "Incomplete",
                      ],
                      ["Final decision", "Admin approval required"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border p-4"
                        style={{
                          background: tokens.surfaceMuted,
                          borderColor: tokens.border,
                        }}
                      >
                        <small
                          className="font-black uppercase tracking-widest"
                          style={{ color: tokens.textMuted }}
                        >
                          {label}
                        </small>
                        <p
                          className="mt-1 break-words font-extrabold"
                          style={{ color: tokens.text }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-6 rounded-2xl border p-4 text-sm leading-6"
                    style={{
                      borderColor: tokens.borderStrong,
                      background: tokens.primarySoft,
                      color: tokens.text,
                    }}
                  >
                    <b>Strict approval rule:</b> OCR, face matching, liveness,
                    and duplicate checks provide risk signals only. They cannot
                    verify the account.
                  </div>

                  <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
                    <button
                      onClick={() => setStep(4)}
                      className="rounded-2xl border px-5 py-3 font-black"
                      style={{
                        borderColor: tokens.border,
                        color: tokens.text,
                        background: tokens.surface,
                      }}
                    >
                      <ArrowLeft className="mr-2 inline h-4 w-4" />
                      Back
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => void submit()}
                      className="rounded-2xl px-7 py-3.5 font-black text-white disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryStrong} 100%)`,
                        boxShadow: `0 14px 28px ${tokens.primary}24`,
                      }}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      ) : (
                        <UserRoundCheck className="mr-2 inline h-4 w-4" />
                      )}
                      Submit for admin review
                      <ArrowRight className="ml-2 inline h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {verification?.status === "REJECTED" && (
          <div
            className="mt-5 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold"
            style={{
              borderColor: `${tokens.danger}3a`,
              background: tokens.dangerSoft,
              color: tokens.danger,
            }}
          >
            <span>
              Your earlier application was rejected. This form creates a new
              attempt.
            </span>
            <RefreshCcw className="h-5 w-5" />
          </div>
        )}
      </div>

      <style jsx>{`
        .kyc-orb {
          animation: floatGlow 7s ease-in-out infinite;
        }

        .kyc-hero {
          animation: fadeUp 0.7s ease;
        }

        .kyc-hero-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(circle at center, black 28%, transparent 88%);
          animation: gridDrift 18s linear infinite;
        }

        .kyc-hero-beam {
          animation: beamFloat 8s ease-in-out infinite;
        }

        .kyc-radar,
        .kyc-radar-delay,
        .kyc-radar-delay-2 {
          opacity: 0.45;
        }

        .kyc-radar {
          animation: pulseRing 3.8s ease-out infinite;
        }

        .kyc-radar-delay {
          animation: pulseRing 3.8s ease-out 1.2s infinite;
        }

        .kyc-radar-delay-2 {
          animation: pulseRing 3.8s ease-out 2.2s infinite;
        }

        .kyc-stat-card:hover {
          transform: translateY(-2px);
          transition: transform 0.3s ease;
        }

        .kyc-stat-shine {
          animation: statShine 5.8s linear infinite;
        }

        .kyc-scan-line {
          animation: scanLine 2.2s linear infinite;
        }

        @keyframes floatGlow {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.04);
          }
        }

        @keyframes gridDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(26px, 26px, 0);
          }
        }

        @keyframes beamFloat {
          0%,
          100% {
            transform: translateY(-50%) translateX(0);
            opacity: 0.28;
          }
          50% {
            transform: translateY(-50%) translateX(42px);
            opacity: 0.5;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: translateY(-50%) scale(0.92);
            opacity: 0.12;
          }
          50% {
            transform: translateY(-50%) scale(1);
            opacity: 0.42;
          }
          100% {
            transform: translateY(-50%) scale(1.08);
            opacity: 0.08;
          }
        }

        @keyframes statShine {
          0% {
            transform: translateX(-140%);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          50% {
            transform: translateX(320%);
            opacity: 0.45;
          }
          100% {
            transform: translateX(320%);
            opacity: 0;
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateY(0px);
            opacity: 0.15;
          }
          15% {
            opacity: 0.95;
          }
          50% {
            transform: translateY(210px);
            opacity: 0.85;
          }
          100% {
            transform: translateY(420px);
            opacity: 0.1;
          }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}