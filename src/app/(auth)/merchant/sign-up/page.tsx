"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {
  registerMerchantOwner,
  rememberMerchantUser,
  resendMerchantEmailOtp,
  verifyMerchantEmailOtp,
} from "@/lib/api/merchantAuthApi";

type RegistrationStep =
  | "account"
  | "verify";

const OTP_LENGTH =
  6;

const RESEND_SECONDS =
  60;

export default function MerchantSignUpPage() {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [step, setStep] =
    useState<RegistrationStep>(
      "account",
    );

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [profileImage, setProfileImage] =
    useState<File | null>(
      null,
    );

  const [termsAccepted, setTermsAccepted] =
    useState(false);

  const [registeredEmail, setRegisteredEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [cooldown, setCooldown] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  useEffect(
    () => {
      if (
        cooldown <= 0
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            setCooldown(
              (current) =>
                Math.max(
                  0,
                  current - 1,
                ),
            );
          },
          1000,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [cooldown],
  );

  const handleImage = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowed.includes(
        file.type,
      )
    ) {
      setError(
        "Select a JPG, PNG or WEBP profile image.",
      );
      event.target.value =
        "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Profile image must be 5 MB or smaller.",
      );
      event.target.value =
        "";
      return;
    }

    setError("");
    setProfileImage(
      file,
    );
  };

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedName =
      name.trim();
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    setError("");
    setNotice("");

    if (
      normalizedName.length <
      2
    ) {
      setError(
        "Enter the merchant owner’s full name.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        "Enter a valid email address.",
      );
      return;
    }

    if (
      password.length <
      6
    ) {
      setError(
        "Password must contain at least 6 characters.",
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    if (!profileImage) {
      setError(
        "Upload the merchant owner’s profile image.",
      );
      fileInputRef.current?.click();
      return;
    }

    if (!termsAccepted) {
      setError(
        "Accept the Terms and Privacy Policy to continue.",
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await registerMerchantOwner({
          name:
            normalizedName,
          email:
            normalizedEmail,
          phone:
            phone.trim(),
          password,
          profileImage,
        });

      setRegisteredEmail(
        result.email ||
          normalizedEmail,
      );
      setOtp("");
      setCooldown(
        RESEND_SECONDS,
      );
      setNotice(
        result.message,
      );
      setStep(
        "verify",
      );
    } catch (
      registrationError: unknown
    ) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Unable to create the account.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedOtp =
      otp.replace(
        /\D/g,
        "",
      );

    if (
      normalizedOtp.length !==
      OTP_LENGTH
    ) {
      setError(
        "Enter the complete 6-digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await verifyMerchantEmailOtp(
          registeredEmail,
          normalizedOtp,
        );

      rememberMerchantUser(
        result.user,
      );

      router.replace(
        "/merchant/onboarding",
      );
      router.refresh();
    } catch (
      verificationError: unknown
    ) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Email verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (
      resending ||
      cooldown > 0 ||
      !registeredEmail
    ) {
      return;
    }

    try {
      setResending(true);
      setError("");

      const result =
        await resendMerchantEmailOtp(
          registeredEmail,
        );

      setNotice(
        result.message,
      );
      setCooldown(
        RESEND_SECONDS,
      );
    } catch (
      resendError: unknown
    ) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Unable to resend the code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <UserPlus className="h-3.5 w-3.5" />
          Merchant registration
        </div>

        <h1 className="text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl dark:text-white">
          {step ===
          "account"
            ? "Create your gateway owner account"
            : "Verify your email"}
        </h1>

        <p className="mt-2 break-words text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 dark:text-slate-400">
          {step ===
          "account"
            ? "Create the secure owner identity that will control your Coffer payment gateway. Business details come next."
            : `We sent a 6-digit code to ${registeredEmail}. Gateway onboarding starts after verification.`}
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {step ===
      "account" ? (
        <form
          onSubmit={(event) => {
            void handleRegister(
              event,
            );
          }}
          className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4"
        >
          <label className="block sm:col-span-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Owner’s full name
            </span>
            <input
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              value={name}
              onChange={(event) => {
                setName(
                  event.target.value,
                );
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              placeholder="Full legal name"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Email address
            </span>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value,
                );
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              placeholder="owner@business.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Phone number
            </span>
            <input
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(event) => {
                setPhone(
                  event.target.value.replace(
                    /[^\d+\-\s]/g,
                    "",
                  ),
                );
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              placeholder="+8801XXXXXXXXX"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Password
            </span>
            <span className="relative mt-2 block">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() => {
                  setShowPassword(
                    (current) =>
                      !current,
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value,
                );
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              placeholder="Repeat password"
            />
          </label>

          <div className="sm:col-span-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Owner profile image
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImage}
              className="sr-only"
            />

            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="mt-2 flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-left transition hover:border-violet-400 sm:px-4 dark:border-white/15 dark:bg-white/[0.04]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <Camera className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {profileImage
                    ? profileImage.name
                    : "Choose an image"}
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  JPG, PNG or WEBP · maximum 5 MB
                </span>
              </span>
            </button>
          </div>

          <label className="flex items-start gap-3 text-xs leading-5 text-slate-600 dark:text-slate-400 sm:col-span-2">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(
                  event.target.checked,
                );
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-violet-600"
            />
            <span>
              I agree to the Terms and Privacy Policy and confirm that I am authorized to create this payment gateway account.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-50 sm:col-span-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create gateway owner account
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            void handleVerify(
              event,
            );
          }}
          className="space-y-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <MailCheck className="h-7 w-7" />
          </div>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              6-digit email code
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              required
              value={otp}
              onChange={(event) => {
                setOtp(
                  event.target.value
                    .replace(
                      /\D/g,
                      "",
                    )
                    .slice(
                      0,
                      OTP_LENGTH,
                    ),
                );
              }}
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-center font-mono text-lg font-black tracking-[0.28em] text-slate-950 outline-none focus:border-violet-500 sm:px-4 sm:text-xl sm:tracking-[0.45em] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              placeholder="000000"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Verify and continue
          </button>

          <button
            type="button"
            disabled={
              resending ||
              cooldown > 0
            }
            onClick={() => {
              void handleResend();
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300"
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification code"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setStep(
                "account",
              );
              setOtp("");
              setError("");
              setNotice("");
            }}
            className="h-10 w-full text-xs font-bold text-slate-500"
          >
            Change registration details
          </button>
        </form>
      )}

      <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-200 pt-5 text-center text-[11px] leading-5 text-slate-500 sm:mt-6 sm:gap-3 sm:pt-6 sm:text-xs dark:border-white/10">
        <p>
          Already have a Coffer account?{" "}
          <Link
            href="/merchant/sign-in"
            className="font-black text-violet-600 dark:text-violet-300"
          >
            Merchant sign in
          </Link>
        </p>

        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-400"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Create wallet account only
        </Link>
      </div>
    </div>
  );
}
