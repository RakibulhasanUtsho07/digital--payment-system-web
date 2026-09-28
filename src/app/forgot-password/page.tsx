"use client";

import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

type RecoveryStep =
  | "email"
  | "otp"
  | "password"
  | "success";

interface ApiResponse {
  success?: boolean;
  message?: string;
  resetToken?: string;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
}

const getApiRoot = (): string => {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5000";
  const clean = configured.replace(/\/+$/, "");

  // Prevents http://host/api/api/... when the env already ends in /api.
  return /\/api$/i.test(clean)
    ? clean
    : `${clean}/api`;
};

const API_ROOT = getApiRoot();

const postJson = async (
  path: string,
  body: Record<string, string>
): Promise<ApiResponse> => {
  const response = await fetch(
    `${API_ROOT}${path}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response
    .json()
    .catch(() => ({}))) as ApiResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "The request could not be completed."
    );
  }

  return data;
};

const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(
    value
  );

const getStepNumber = (step: RecoveryStep) => {
  if (step === "email") return 1;
  if (step === "otp") return 2;
  return 3;
};

export default function ForgotPasswordPage() {
  const [step, setStep] =
    useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendSeconds, setResendSeconds] =
    useState(0);

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, resendSeconds]);

  const activeStep = getStepNumber(step);
  const passwordChecks = useMemo(
    () => [
      {
        label: "8+ characters",
        passed: password.length >= 8,
      },
      {
        label: "Upper + lowercase",
        passed:
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password),
      },
      {
        label: "At least 1 number",
        passed: /\d/.test(password),
      },
    ],
    [password]
  );

  const requestCode = async (): Promise<void> => {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your account email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await postJson(
        "/auth/forgot-password",
        { email: normalizedEmail }
      );

      setEmail(normalizedEmail);
      setOtp("");
      setResetToken("");
      setResendSeconds(
        data.resendAfterSeconds ?? 60
      );
      setNotice(
        data.message ||
          "If the account exists, a verification code was sent."
      );
      setStep("otp");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send the verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await requestCode();
  };

  const handleOtpSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await postJson(
        "/auth/verify-password-reset-otp",
        { email, otp }
      );

      if (!data.resetToken) {
        throw new Error(
          "Reset authorization was not returned. Request a new code."
        );
      }

      setResetToken(data.resetToken);
      setNotice(
        data.message ||
          "Email verified successfully."
      );
      setStep("password");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to verify the code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!resetToken) {
      setError(
        "Reset authorization expired. Request a new code."
      );
      setStep("email");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Use 8+ characters with uppercase, lowercase and a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await postJson(
        "/auth/reset-password",
        { resetToken, password }
      );

      setNotice(
        data.message ||
          "Password changed successfully."
      );
      setResetToken("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setStep("success");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change the password."
      );
    } finally {
      setLoading(false);
    }
  };

  const editEmail = () => {
    setStep("email");
    setOtp("");
    setResetToken("");
    setError("");
    setNotice("");
    setResendSeconds(0);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080617] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 18%, rgba(124,58,237,.30), transparent 25%), radial-gradient(circle at 84% 75%, rgba(80,30,170,.24), transparent 28%), radial-gradient(rgba(255,255,255,.17) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 38px 38px",
        }}
      />

      <div className="pointer-events-none absolute left-[-8rem] top-1/3 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-5rem] h-96 w-96 rounded-full bg-fuchsia-700/15 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center lg:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0d091d]/90 shadow-[0_35px_100px_rgba(0,0,0,.48)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
          <RecoveryArtwork activeStep={activeStep} />

          <section className="flex min-h-[650px] items-center justify-center px-6 py-9 sm:px-10 lg:min-h-[680px] lg:px-12 xl:px-14">
            <div className="w-full max-w-[420px]">
              <div className="mb-8 flex items-center justify-between">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-violet-200/70 transition hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>

                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 font-black">
                    C
                  </div>
                  <span className="font-black">Coffer</span>
                </div>
              </div>

              {step !== "success" && (
                <Progress activeStep={activeStep} />
              )}

              <div aria-live="polite">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-xs leading-5 text-rose-200"
                  >
                    {error}
                  </motion.div>
                )}

                {notice && step !== "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs leading-5 text-emerald-200"
                  >
                    {notice}
                  </motion.div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {step === "email" && (
                  <motion.div {...panelMotion} key="email">
                    <div>
                      <Header
                        icon={Mail}
                        eyebrow="Password recovery"
                        title="Forgot your password?"
                        description="Enter the email connected to your Coffer account."
                      />

                      <form
                        onSubmit={handleEmailSubmit}
                        className="mt-8 space-y-5"
                      >
                        <FieldLabel htmlFor="email">
                          Email address
                        </FieldLabel>
                        <div className="relative">
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError("");
                            }}
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                            className={inputClass}
                          />
                          <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-200/35" />
                        </div>

                        <PrimaryButton
                          loading={loading}
                          loadingText="Sending code..."
                          text="Send verification code"
                        />
                      </form>
                    </div>
                  </motion.div>
                )}

                {step === "otp" && (
                  <motion.div {...panelMotion} key="otp">
                    <div>
                      <Header
                        icon={KeyRound}
                        eyebrow="Email verification"
                        title="Enter your 6-digit code"
                        description={`We sent a recovery code to ${email}.`}
                      />

                      <form
                        onSubmit={handleOtpSubmit}
                        className="mt-8 space-y-5"
                      >
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor="otp">
                            Verification code
                          </FieldLabel>
                          <button
                            type="button"
                            onClick={editEmail}
                            disabled={loading}
                            className="text-[11px] font-bold text-violet-300 transition hover:text-white disabled:opacity-50"
                          >
                            Change email
                          </button>
                        </div>

                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={otp}
                          onChange={(event) => {
                            setOtp(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                            );
                            setError("");
                          }}
                          placeholder="000000"
                          maxLength={6}
                          required
                          disabled={loading}
                          className="h-16 w-full rounded-2xl border border-white/10 bg-white/[.055] px-5 text-center text-2xl font-black tracking-[.5em] text-white outline-none placeholder:text-violet-100/15 transition focus:border-violet-400/65 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60"
                        />

                        <PrimaryButton
                          loading={loading}
                          loadingText="Verifying..."
                          text="Verify email"
                        />

                        <button
                          type="button"
                          onClick={requestCode}
                          disabled={loading || resendSeconds > 0}
                          className="flex w-full items-center justify-center gap-2 text-xs font-bold text-violet-200/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {resendSeconds > 0
                            ? `Resend in ${resendSeconds}s`
                            : "Resend code"}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {step === "password" && (
                  <motion.div {...panelMotion} key="password">
                    <div>
                      <Header
                        icon={LockKeyhole}
                        eyebrow="Create new password"
                        title="Secure your account"
                        description="Choose a strong password you have not used for this account."
                      />

                      <form
                        onSubmit={handlePasswordSubmit}
                        className="mt-7 space-y-4"
                      >
                      <PasswordField
                        id="password"
                        label="New password"
                        value={password}
                        show={showPassword}
                        disabled={loading}
                        onChange={(value) => {
                          setPassword(value);
                          setError("");
                        }}
                        onToggle={() =>
                          setShowPassword((value) => !value)
                        }
                      />

                      <PasswordField
                        id="confirm-password"
                        label="Confirm new password"
                        value={confirmPassword}
                        show={showConfirmPassword}
                        disabled={loading}
                        onChange={(value) => {
                          setConfirmPassword(value);
                          setError("");
                        }}
                        onToggle={() =>
                          setShowConfirmPassword(
                            (value) => !value
                          )
                        }
                      />

                      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:grid-cols-3">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-2 text-[10px] leading-4 ${check.passed ? "text-emerald-300" : "text-violet-100/35"}`}
                          >
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${check.passed ? "border-emerald-300/40 bg-emerald-400/15" : "border-white/15"}`}>
                              {check.passed && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </span>
                            {check.label}
                          </div>
                        ))}
                      </div>

                        <PrimaryButton
                          loading={loading}
                          loadingText="Securing account..."
                          text="Change password"
                        />
                      </form>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-emerald-300/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_55px_rgba(52,211,153,.16)]">
                        <ShieldCheck className="h-9 w-9" />
                      </div>
                      <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-violet-200">
                        <Sparkles className="h-3 w-3" />
                        Recovery complete
                      </span>
                      <h2 className="mt-5 font-serif text-4xl font-black tracking-tight">
                        Password changed
                      </h2>
                      <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-violet-100/55">
                        {notice ||
                          "Your password is updated and previous sessions have been revoked."}
                      </p>
                      <Link
                        href="/login"
                        className={`${buttonClass} mt-8`}
                      >
                        Continue to login
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== "success" && (
                <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] leading-5 text-violet-100/40">
                    Codes and reset authorization are single-use and expire automatically.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "h-[52px] w-full rounded-2xl border border-white/10 bg-white/[.055] px-4 pr-12 text-sm text-white outline-none placeholder:text-violet-100/25 transition focus:border-violet-400/65 focus:bg-white/[.08] focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60";

const buttonClass =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-black text-white shadow-[0_14px_35px_rgba(124,58,237,.28)] transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60";

const panelMotion = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

function RecoveryArtwork({
  activeStep,
}: {
  activeStep: number;
}) {
  return (
    <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-[linear-gradient(145deg,#100a29_0%,#1c0b45_48%,#4b2086_100%)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full border border-violet-300/15" />
      <div className="pointer-events-none absolute -left-8 top-36 h-72 w-72 rounded-full border border-dashed border-violet-300/20" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(145deg,#a855f7,#6d28d9)] shadow-[0_10px_35px_rgba(124,58,237,.35)]">
            <span className="text-2xl font-black">C</span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-violet-700" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">Coffer</p>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-200/55">
              Digital Wallet
            </p>
          </div>
        </div>

        <div className="mt-24 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Security-first recovery
          </span>
          <h1 className="mt-6 font-serif text-5xl font-black leading-[1.05] tracking-tight xl:text-[3.7rem]">
            Recover access
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-white bg-clip-text italic text-transparent">
              with confidence.
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-violet-100/65">
            We verify your email before accepting a new password. Previous sessions are revoked after the change.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        {[
          ["01", "Email"],
          ["02", "Verify"],
          ["03", "Secure"],
        ].map(([number, label], index) => {
          const completed = activeStep > index + 1;
          const active = activeStep === index + 1;

          return (
            <div
              key={number}
              className={`rounded-2xl border p-3 transition ${active ? "border-violet-300/35 bg-white/10" : "border-white/10 bg-black/10"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-violet-200/55">
                  {number}
                </span>
                {completed && (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                )}
              </div>
              <p className={`mt-2 text-xs font-bold ${active || completed ? "text-white" : "text-white/40"}`}>
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Progress({ activeStep }: { activeStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.15em] text-violet-200/45">
        <span>Recovery step {activeStep} of 3</span>
        <span>{Math.round((activeStep / 3) * 100)}%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
          animate={{ width: `${(activeStep / 3) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </div>
  );
}

function Header({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.17em] text-violet-200">
        <Icon className="h-3 w-3" />
        {eyebrow}
      </span>
      <h2 className="mt-5 font-serif text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-violet-100/50">
        {description}
      </p>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-bold text-violet-100/70"
    >
      {children}
    </label>
  );
}

function PrimaryButton({
  loading,
  loadingText,
  text,
}: {
  loading: boolean;
  loadingText: string;
  text: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ y: loading ? 0 : -2 }}
      whileTap={{ scale: loading ? 1 : 0.985 }}
      className={buttonClass}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {text}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </motion.button>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  disabled,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          maxLength={128}
          required
          disabled={disabled}
          className={inputClass}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-200/35 transition hover:text-white disabled:opacity-50"
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
