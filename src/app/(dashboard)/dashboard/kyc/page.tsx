"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, Clock3, FileCheck2,
  Fingerprint, Loader2, LockKeyhole, Phone, RefreshCcw, ShieldCheck,
  Upload, UserRoundCheck, XCircle,
} from "lucide-react";

import {
  createLivenessChallenge, getCurrentEKYC, getKycPhone, requestKycPhoneOtp,
  submitEKYC, validateNidDocuments, verifyKycDeviceBiometric, verifyKycPhoneOtp,
} from "@/lib/api/ekycApi";
import type {
  ActiveLivenessAction, ActiveLivenessChallengeSession, CompletedLivenessCapture,
  DeviceBiometricProof, EKYCVerification, NIDDocumentValidation, PhoneOtpChallenge,
} from "@/types/ekyc";

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
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (["NotAllowedError", "SecurityError"].includes(name)) {
    return "Camera permission was denied. Allow camera access in the browser and try again.";
  }
  if (["NotFoundError", "DevicesNotFoundError"].includes(name)) return "No camera was found.";
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
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  ) age -= 1;
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
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob || blob.size > 1024 * 1024) {
    throw new Error("The image is too large. Upload a clear image smaller than 1 MB.");
  }
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg", lastModified: Date.now(),
  });
}

function StatusCard({ verification }: { verification: EKYCVerification }) {
  const pending = ["QUEUED", "PROCESSING", "PENDING_MANUAL_REVIEW"].includes(verification.status);
  const verified = verification.status === "VERIFIED";
  const Icon = verified ? BadgeCheck : pending ? Clock3 : XCircle;
  return (
    <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
      <span className={`grid h-16 w-16 place-items-center rounded-2xl ${verified ? "bg-emerald-100 text-emerald-700" : pending ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
        <Icon className="h-8 w-8" />
      </span>
      <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-indigo-600">Identity verification</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">
        {verified ? "Your identity is verified" : pending ? "Waiting for admin review" : "Verification needs attention"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {verified
          ? "A Coffer administrator approved your e-KYC application."
          : pending
            ? "Automated checks prepare evidence only. An administrator must approve or reject every application."
            : "Your previous application was rejected. You may submit a corrected application."}
      </p>
      <span className="mt-6 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
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
}) {
  const [working, setWorking] = useState(false);
  return (
    <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 hover:border-indigo-400 hover:bg-indigo-50/40">
      <input
        className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={working}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          setWorking(true);
          void props.onFile(selected).finally(() => setWorking(false));
        }}
      />
      <span className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
          {working ? <Loader2 className="h-5 w-5 animate-spin" /> : props.file ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </span>
        <span><b className="block text-sm text-slate-900">{props.label}</b><small className="mt-1 block text-slate-500">{props.file?.name || props.hint}</small></span>
      </span>
    </label>
  );
}

export default function KycPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<EKYCVerification | null>(null);

  const [phone, setPhone] = useState("");
  const [phoneChallenge, setPhoneChallenge] = useState<PhoneOtpChallenge | null>(null);
  const [phoneChallengeId, setPhoneChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [documentValidation, setDocumentValidation] = useState<NIDDocumentValidation | null>(null);

  const [liveness, setLiveness] = useState<CompletedLivenessCapture | null>(null);
  const [livenessSession, setLivenessSession] = useState<ActiveLivenessChallengeSession | null>(null);
  const [actionIndex, setActionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [biometric, setBiometric] = useState<DeviceBiometricProof | null>(null);
  const [biometricSkipped, setBiometricSkipped] = useState(false);
  const [biometricSupported] = useState(() =>
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    Boolean(navigator.credentials)
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRecording(false);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([getCurrentEKYC(), getKycPhone()])
      .then(([current, currentPhone]) => {
        if (active) { setVerification(current); setPhone(currentPhone); }
      })
      .catch((requestError) => active && setError(messageOf(requestError)))
      .finally(() => active && setLoading(false));
    return () => { active = false; stopCamera(); };
  }, [stopCamera]);

  useEffect(() => {
    if (!verification || !["QUEUED", "PROCESSING"].includes(verification.status)) return;
    const timer = window.setInterval(() => void getCurrentEKYC().then(setVerification).catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [verification]);

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);

  async function sendOtp() {
    setBusy(true); setError("");
    try {
      const challenge = await requestKycPhoneOtp(phone);
      setPhoneChallenge(challenge); setPhoneChallengeId(challenge.challengeId); setOtp("");
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function confirmOtp() {
    setBusy(true); setError("");
    try {
      const result = await verifyKycPhoneOtp({ challengeId: phoneChallengeId, otp });
      setPhone(result.phone); setPhoneVerified(true); setStep(2);
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function chooseImage(kind: "front" | "back", file: File) {
    setError("");
    try {
      const prepared = await prepareImage(file);
      if (kind === "front") setFrontImage(prepared); else setBackImage(prepared);
      setDocumentValidation(null);
    } catch (imageError) { setError(messageOf(imageError)); }
  }

  async function validateDocumentsAndContinue() {
    const identityError = validateIdentity(name, nid, dateOfBirth);
    if (identityError) return setError(identityError);
    if (!frontImage || !backImage) return setError("Upload both sides of the NID.");
    setBusy(true); setError("");
    try {
      const validation = await validateNidDocuments({ phoneChallengeId, frontImage, backImage });
      setDocumentValidation(validation); setStep(3);
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function requestCamera(): Promise<MediaStream> {
    const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!window.isSecureContext && !local) throw new Error("Live face verification requires HTTPS.");
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support camera capture.");
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
      });
    } catch (firstError) {
      if (firstError instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(firstError.name)) throw firstError;
      return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
  }

  async function startLiveness() {
    setBusy(true); setError(""); stopCamera();
    try {
      if (!("MediaRecorder" in window)) throw new Error("This browser cannot record liveness video.");
      const [session, stream] = await Promise.all([createLivenessChallenge(), requestCamera()]);
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Camera preview is unavailable.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.start(500);
      recorderRef.current = recorder;
      startedAtRef.current = new Date().toISOString();
      setLivenessSession(session); setActionIndex(0); setRecording(true); setLiveness(null);
    } catch (cameraError) {
      stopCamera();
      setError(cameraError instanceof DOMException ? cameraErrorMessage(cameraError) : messageOf(cameraError));
    } finally { setBusy(false); }
  }

  function captureSelfie(): Promise<File> {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return Promise.reject(new Error("The camera frame is not ready."));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return Promise.reject(new Error("The camera frame could not be captured."));
    context.drawImage(video, 0, 0);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("The selfie could not be captured."));
      resolve(new File([blob], "ekyc-selfie.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", 0.9));
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
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }));
      recorder.onerror = () => reject(new Error("The liveness recording failed."));
      recorder.stop();
    });
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const video = new File([blob], `ekyc-liveness.${extension}`, { type: blob.type || "video/webm", lastModified: Date.now() });
    if (video.size > 8 * 1024 * 1024) throw new Error("The liveness recording is larger than 8 MB.");
    const session = livenessSession;
    stopCamera(); setLiveness({ session, startedAt, completedAt, selfie, video }); setStep(4);
  }

  async function completeAction() {
    if (!livenessSession || !recording) return;
    setError("");
    if (actionIndex < livenessSession.challenges.length - 1) return setActionIndex((value) => value + 1);
    setBusy(true);
    try { await finishLiveness(); } catch (captureError) { setError(messageOf(captureError)); }
    finally { setBusy(false); }
  }

  async function verifyBiometric() {
    setBusy(true); setError("");
    try { setBiometric(await verifyKycDeviceBiometric()); setBiometricSkipped(false); setStep(5); }
    catch (biometricError) { setError(messageOf(biometricError)); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!frontImage || !backImage || !documentValidation || !liveness || !phoneVerified) {
      return setError("One or more required verification steps are incomplete.");
    }
    setBusy(true); setError("");
    try {
      const result = await submitEKYC({
        claimedName: name, dateOfBirth, nid, frontImage, backImage,
        selfieImage: liveness.selfie, liveness, phoneChallengeId,
        documentValidationId: documentValidation.validationId,
        biometricSessionId: biometric?.sessionId,
      });
      setVerification(result.verification);
    } catch (submitError) { setError(messageOf(submitError)); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (verification && verification.status !== "REJECTED") {
    return <main className="min-h-screen bg-[#f5f7fb] px-4 py-10"><StatusCard verification={verification} /></main>;
  }

  const title = ["", "Verify your phone", "Validate your NID", "Prove you are present", "Device biometric", "Review and submit"][step];
  const description = [
    "",
    "The registration number is loaded automatically and may be changed before OTP.",
    "OCR rejects unrelated images before submission.",
    "The server validates random blink and head-turn evidence.",
    "WebAuthn keeps the raw fingerprint or face template inside the device.",
    "Submission creates a pending case; it never auto-verifies the account.",
  ][step];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff,transparent_35%),#f7f8fc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Secure identity review</p><h1 className="mt-2 text-4xl font-black text-slate-950">Complete your e-KYC</h1><p className="mt-2 text-sm text-slate-600">Five protected steps. Final approval always belongs to an administrator.</p></div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700"><LockKeyhole className="h-4 w-4" /> Encrypted evidence</span>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative flex justify-between">
            <div className="absolute left-5 right-5 top-5 h-1 rounded-full bg-slate-100" />
            <div className="absolute left-5 top-5 h-1 rounded-full bg-indigo-600 transition-all" style={{ width: `calc((100% - 2.5rem) * ${progress / 100})` }} />
            {STEPS.map(({ id, label, icon: Icon }) => <div key={id} className="relative z-10 flex w-16 flex-col items-center gap-2"><span className={`grid h-11 w-11 place-items-center rounded-full border-4 border-white ${id < step ? "bg-emerald-500 text-white" : id === step ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>{id < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span><small className={`font-black uppercase ${id === step ? "text-indigo-700" : "text-slate-400"}`}>{label}</small></div>)}
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
          <div className="grid lg:grid-cols-[320px_1fr]">
            <aside className="bg-slate-950 p-8 text-white">
              <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-300">Step {step} of 5</p>
              <h2 className="mt-3 text-2xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              <div className="mt-8 space-y-3 text-xs text-slate-300"><p className="flex gap-3"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Manual admin approval required</p><p className="flex gap-3"><LockKeyhole className="h-4 w-4 text-indigo-300" /> Sensitive evidence encrypted</p><p className="flex gap-3"><Fingerprint className="h-4 w-4 text-violet-300" /> No raw biometric stored</p></div>
            </aside>
            <div className="min-h-[560px] p-6 sm:p-10">
              {error && <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

              {step === 1 && <div className="mx-auto max-w-xl"><h3 className="text-2xl font-black">Phone number & OTP</h3><p className="mt-2 text-sm text-slate-600">Confirm a number you control before uploading identity documents.</p><label className="mt-8 block text-xs font-black uppercase text-slate-600">Mobile number</label><div className="mt-2 flex gap-3"><input className="min-w-0 flex-1 rounded-2xl border bg-slate-50 px-4 py-3.5 font-bold outline-none focus:border-indigo-500" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneChallenge(null); }} placeholder="+8801XXXXXXXXX" /><button disabled={busy || !phone.trim()} onClick={() => void sendOtp()} className="rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">{phoneChallenge ? "Resend" : "Send OTP"}</button></div>{phoneChallenge && <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><p className="text-sm font-bold">Code sent to {phoneChallenge.maskedPhone}</p><input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-4 w-full rounded-2xl border bg-white px-4 py-3 text-center text-xl font-black tracking-[.4em]" placeholder="000000" /><button disabled={busy || otp.length !== 6} onClick={() => void confirmOtp()} className="mt-4 flex w-full justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify and continue</button></div>}</div>}

              {step === 2 && <div><h3 className="text-2xl font-black">NID details & document check</h3><p className="mt-2 text-sm text-slate-600">Enter exactly what appears on the card and upload both sides.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><small className="font-black uppercase text-slate-600">Full name on NID</small><input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 outline-none focus:border-indigo-500" /></label><label><small className="font-black uppercase text-slate-600">NID number</small><input inputMode="numeric" value={nid} onChange={(e) => setNid(e.target.value.replace(/[^\d\s-]/g, ""))} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 outline-none focus:border-indigo-500" /></label><label><small className="font-black uppercase text-slate-600">Date of birth</small><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 outline-none focus:border-indigo-500" /></label><UploadField label="NID front" hint="Clear, readable, all corners visible" file={frontImage} onFile={(file) => chooseImage("front", file)} /><UploadField label="NID back" hint="Clear, readable, all corners visible" file={backImage} onFile={(file) => chooseImage("back", file)} /></div><div className="mt-8 flex justify-between"><button onClick={() => setStep(1)} className="rounded-2xl border px-5 py-3 font-black"><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button><button disabled={busy} onClick={() => void validateDocumentsAndContinue()} className="rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white disabled:opacity-50">{busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 inline h-4 w-4" />}Validate documents</button></div></div>}

              {step === 3 && <div><h3 className="text-2xl font-black">Live face verification</h3><p className="mt-2 text-sm text-slate-600">Use a real camera over HTTPS, keep one face visible, and follow each action slowly.</p><div className="mt-6 overflow-hidden rounded-3xl bg-slate-950"><div className="relative aspect-video"><video ref={videoRef} playsInline muted className="h-full w-full object-cover [transform:scaleX(-1)]" />{!recording && <div className="absolute inset-0 grid place-items-center text-center text-slate-400"><div><Camera className="mx-auto h-10 w-10" /><p className="mt-3 font-bold">Camera preview</p></div></div>}{recording && livenessSession && <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/80 p-4 text-center text-white backdrop-blur"><small className="font-black uppercase tracking-widest text-indigo-300">Challenge {actionIndex + 1} of 3</small><p className="mt-1 text-lg font-black">{ACTION_LABEL[livenessSession.challenges[actionIndex]!]}</p></div>}</div></div><p className="mt-3 text-center text-xs font-semibold text-slate-500">Keep your full face centered in good light. Server-side liveness validates the recorded actions.</p><div className="mt-6 flex justify-between"><button onClick={() => { stopCamera(); setStep(2); }} className="rounded-2xl border px-5 py-3 font-black"><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button>{!recording ? <button disabled={busy} onClick={() => void startLiveness()} className="rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white"><Camera className="mr-2 inline h-4 w-4" />Start secure camera</button> : <button disabled={busy} onClick={() => void completeAction()} className="rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white"><Check className="mr-2 inline h-4 w-4" />{actionIndex === 2 ? "Capture & continue" : "Action completed"}</button>}</div></div>}

              {step === 4 && <div className="mx-auto max-w-xl text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-violet-100 text-violet-700"><Fingerprint className="h-10 w-10" /></span><h3 className="mt-6 text-2xl font-black">Verify this device</h3><p className="mt-3 text-sm leading-6 text-slate-600">Windows Hello, Touch ID, Android screen lock, or another platform authenticator confirms user presence. The operating system keeps biometric templates in secure hardware.</p><div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-800"><b>No fingerprint image is uploaded.</b> Only a one-time verified WebAuthn credential reference is attached.</div>{!biometricSupported && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">This browser does not support device biometrics. Continue without it.</div>}<div className="mt-8 grid gap-3 sm:grid-cols-2"><button disabled={busy || !biometricSupported} onClick={() => void verifyBiometric()} className="rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white disabled:opacity-40">{busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 inline h-4 w-4" />}Verify on device</button><button onClick={() => { setBiometricSkipped(true); setStep(5); }} className="rounded-2xl border px-5 py-3.5 font-black">Continue without biometric</button></div><button onClick={() => setStep(3)} className="mt-6 text-sm font-black text-slate-500"><ArrowLeft className="mr-2 inline h-4 w-4" />Back to face check</button></div>}

              {step === 5 && <div><h3 className="text-2xl font-black">Review your submission</h3><p className="mt-2 text-sm text-slate-600">Submission creates a pending admin-review case.</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{[["Verified phone", phone], ["NID name", name], ["NID number", `••••••${nid.replace(/\D/g, "").slice(-4)}`], ["Date of birth", dateOfBirth], ["Documents", documentValidation ? "OCR preflight passed" : "Incomplete"], ["Live face", liveness ? "Challenge captured" : "Incomplete"], ["Device biometric", biometric ? "WebAuthn verified" : biometricSkipped ? "Skipped / unavailable" : "Incomplete"], ["Final decision", "Admin approval required"]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-slate-50 p-4"><small className="font-black uppercase tracking-widest text-slate-400">{label}</small><p className="mt-1 break-words font-extrabold">{value}</p></div>)}</div><div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-900"><b>Strict approval rule:</b> OCR, face matching, liveness, and duplicate checks provide risk signals only. They cannot verify the account.</div><div className="mt-8 flex justify-between"><button onClick={() => setStep(4)} className="rounded-2xl border px-5 py-3 font-black"><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button><button disabled={busy} onClick={() => void submit()} className="rounded-2xl bg-indigo-600 px-7 py-3.5 font-black text-white disabled:opacity-50">{busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <UserRoundCheck className="mr-2 inline h-4 w-4" />}Submit for admin review <ArrowRight className="ml-2 inline h-4 w-4" /></button></div></div>}
            </div>
          </div>
        </section>
        {verification?.status === "REJECTED" && <div className="mt-5 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"><span>Your earlier application was rejected. This form creates a new attempt.</span><RefreshCcw className="h-5 w-5" /></div>}
      </div>
    </main>
  );
}
