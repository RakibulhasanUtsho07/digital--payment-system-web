"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { apiClient } from "@/lib/api/client";

type OtpMethod = "email" | "sms";
type DialogMode =
  | "enable"
  | "change"
  | "disable"
  | null;

interface Challenge {
  challengeId: string;
  method: OtpMethod;
  target: string;
  expiresAt: string;
  expiresInSeconds: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  method?: OtpMethod;
  verificationRequired?: boolean;
  challenge?: Challenge;
}

export function TwoFactorOtpSettings({
  initialEnabled,
  initialMethod,
  availability,
  onChanged,
}: {
  initialEnabled: boolean;
  initialMethod: OtpMethod;
  availability: {
    email: boolean;
    sms: boolean;
  };
  onChanged: () => Promise<void> | void;
}) {
  const [enabled, setEnabled] =
    useState(initialEnabled);
  const [method, setMethod] =
    useState<OtpMethod>(initialMethod);
  const [selectedMethod, setSelectedMethod] =
    useState<OtpMethod>(initialMethod);
  const [dialog, setDialog] =
    useState<DialogMode>(null);
  const [challenge, setChallenge] =
    useState<Challenge | null>(null);
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEnabled(initialEnabled);
    setMethod(initialMethod);
    setSelectedMethod(initialMethod);
  }, [initialEnabled, initialMethod]);

  const close = () => {
    setDialog(null);
    setChallenge(null);
    setPassword("");
    setCode("");
    setError("");
    setShowPassword(false);
  };

  const open = (
    mode: Exclude<DialogMode, null>,
    nextMethod: OtpMethod = method
  ) => {
    setDialog(mode);
    setSelectedMethod(nextMethod);
    setChallenge(null);
    setPassword("");
    setCode("");
    setError("");
  };

  const requestCode = async () => {
    if (!password.trim()) {
      setError("Enter your current password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const endpoint =
        dialog === "enable"
          ? "/security/2fa/setup/start"
          : "/security/2fa/method";
      const response =
        await apiClient<ApiResponse>(endpoint, {
          method:
            dialog === "enable"
              ? "POST"
              : "PATCH",
          body: JSON.stringify({
            password,
            method: selectedMethod,
          }),
        });

      if (!response.success || !response.challenge) {
        throw new Error(
          response.message ||
            "Unable to send the verification code."
        );
      }

      setChallenge(response.challenge);
      setCode("");
      setPassword("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send the verification code."
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!challenge) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const endpoint =
        dialog === "enable"
          ? "/security/2fa/setup/verify"
          : "/security/2fa/method";
      const response =
        await apiClient<ApiResponse>(endpoint, {
          method:
            dialog === "enable"
              ? "POST"
              : "PATCH",
          body: JSON.stringify({
            challengeId: challenge.challengeId,
            code,
          }),
        });

      if (!response.success) {
        throw new Error(
          response.message ||
            "The verification code could not be confirmed."
        );
      }

      const updatedMethod =
        response.method || selectedMethod;
      setEnabled(true);
      setMethod(updatedMethod);
      close();
      await onChanged();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "The verification code could not be confirmed."
      );
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!password.trim()) {
      setError("Enter your current password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response =
        await apiClient<ApiResponse>(
          "/security/2fa/disable",
          {
            method: "POST",
            body: JSON.stringify({ password }),
          }
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Unable to disable two-factor authentication."
        );
      }

      setEnabled(false);
      setMethod("email");
      setSelectedMethod("email");
      close();
      await onChanged();
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "Unable to disable two-factor authentication."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${
              enabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Login protection
              </p>
              <h2 className="mt-1 text-xl font-black text-card-foreground">
                Two-Step Verification
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Require a one-time code by email or SMS at every login.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              enabled
                ? open("disable")
                : open(
                    "enable",
                    availability.email
                      ? "email"
                      : "sms"
                  )
            }
            className={`rounded-xl px-5 py-2.5 text-sm font-black transition disabled:opacity-50 ${
              enabled
                ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-violet-700 text-white hover:bg-violet-800"
            }`}
          >
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MethodOption
            icon={Mail}
            title="Email OTP"
            description={
              availability.email
                ? "Code sent to your verified email"
                : "Email provider is not configured"
            }
            active={enabled && method === "email"}
            available={availability.email}
            onClick={() =>
              enabled
                ? open("change", "email")
                : open("enable", "email")
            }
          />
          <MethodOption
            icon={Smartphone}
            title="SMS OTP"
            description={
              availability.sms
                ? "Code sent to your verified phone"
                : "SMS provider is not configured"
            }
            active={enabled && method === "sms"}
            available={availability.sms}
            onClick={() =>
              enabled
                ? open("change", "sms")
                : open("enable", "sms")
            }
          />
        </div>
      </section>

      <AnimatePresence>
        {dialog && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-[26px] border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
                    Security check
                  </p>
                  <h3 className="mt-1 text-xl font-black text-card-foreground">
                    {dialog === "disable"
                      ? "Disable two-step verification"
                      : challenge
                        ? "Enter verification code"
                        : dialog === "change"
                          ? "Change verification method"
                          : "Enable two-step verification"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              {dialog !== "disable" && !challenge && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <SmallMethod
                    icon={Mail}
                    label="Email"
                    selected={selectedMethod === "email"}
                    disabled={!availability.email}
                    onClick={() => setSelectedMethod("email")}
                  />
                  <SmallMethod
                    icon={Smartphone}
                    label="SMS"
                    selected={selectedMethod === "sms"}
                    disabled={!availability.sms}
                    onClick={() => setSelectedMethod("sms")}
                  />
                </div>
              )}

              {challenge ? (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">
                    Code sent to {challenge.target}
                  </p>
                  <input
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    className="h-14 w-full rounded-xl border border-border bg-muted/40 px-4 text-center text-xl font-black tracking-[0.4em] text-foreground outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                  />
                </div>
              ) : (
                <div className="relative mt-5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Current password"
                    className="h-12 w-full rounded-xl border border-border bg-muted/40 px-4 pr-11 text-sm font-semibold text-foreground outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-bold text-card-foreground hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void (
                      dialog === "disable"
                        ? disable()
                        : challenge
                          ? verifyCode()
                          : requestCode()
                    )
                  }
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-white disabled:opacity-50 ${
                    dialog === "disable"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-violet-700 hover:bg-violet-800"
                  }`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {dialog === "disable"
                    ? "Disable"
                    : challenge
                      ? "Verify"
                      : "Send Code"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MethodOption({
  icon: Icon,
  title,
  description,
  active,
  available,
  onClick,
}: {
  icon: typeof Mail;
  title: string;
  description: string;
  active: boolean;
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
        active
          ? "border-violet-500 bg-violet-50 dark:bg-violet-400/10"
          : available
            ? "border-border bg-muted/30 hover:border-violet-300 hover:bg-violet-50/50"
            : "cursor-not-allowed border-border bg-muted/20 opacity-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-card p-2.5 text-violet-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-card-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {active && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
    </button>
  );
}

function SmallMethod({
  icon: Icon,
  label,
  selected,
  disabled,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
        selected
          ? "border-violet-600 bg-violet-50 text-violet-700"
          : "border-border bg-muted/30 text-muted-foreground"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
