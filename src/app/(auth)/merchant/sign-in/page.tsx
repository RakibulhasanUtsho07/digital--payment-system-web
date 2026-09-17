"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  rememberMerchantUser,
  signInMerchant,
  verifyMerchantLoginTwoFactor,
  type MerchantAuthUser,
} from "@/lib/api/merchantAuthApi";

type LoginStep =
  | "credentials"
  | "two_factor";

export default function MerchantSignInPage() {
  const router =
    useRouter();

  const [step, setStep] =
    useState<LoginStep>(
      "credentials",
    );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [challengeId, setChallengeId] =
    useState("");

  const [twoFactorCode, setTwoFactorCode] =
    useState("");

  const [twoFactorTarget, setTwoFactorTarget] =
    useState("");

  const [twoFactorMethod, setTwoFactorMethod] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const continueAfterLogin = (
    user: MerchantAuthUser,
  ) => {
    if (
      user.role !== "user" &&
      user.role !== "merchant"
    ) {
      throw new Error(
        "This is not a merchant-owner account. Use the standard sign-in page for your platform role.",
      );
    }

    rememberMerchantUser(
      user,
    );

    router.replace(
      user.role ===
        "merchant"
        ? "/dashboard/merchant"
        : "/merchant/onboarding",
    );

    router.refresh();
  };

  const handleCredentials = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Enter your email address and password.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await signInMerchant(
          normalizedEmail,
          password,
        );

      if (
        "requiresTwoFactor" in
          result &&
        result.requiresTwoFactor
      ) {
        setChallengeId(
          result.challengeId,
        );

        setTwoFactorMethod(
          result.method,
        );

        setTwoFactorTarget(
          result.target ?? "",
        );

        setStep(
          "two_factor",
        );

        return;
      }

      continueAfterLogin(
        result.user,
      );
    } catch (
      signInError: unknown
    ) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      loading ||
      !challengeId
    ) {
      return;
    }

    const code =
      twoFactorCode.trim();

    if (!code) {
      setError(
        "Enter your verification or backup code.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await verifyMerchantLoginTwoFactor(
          challengeId,
          code,
        );

      continueAfterLogin(
        result.user,
      );
    } catch (
      verificationError: unknown
    ) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Two-factor verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Merchant portal
        </div>

        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
          {step ===
          "credentials"
            ? "Sign in to your payment gateway"
            : "Verify it’s you"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {step ===
          "credentials"
            ? "Use your merchant-owner credentials to manage checkout, integrations, transactions and settlements."
            : "Complete the security challenge to continue to your protected gateway workspace."}
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

      {step ===
      "credentials" ? (
        <form
          onSubmit={(event) => {
            void handleCredentials(
              event,
            );
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Email address
            </span>

            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value,
                  );
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="owner@business.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="flex items-center justify-between gap-3 text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Password

              <Link
                href="/forgot-password"
                className="text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                Forgot password?
              </Link>
            </span>

            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-950 outline-none transition focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Continue securely
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            void handleTwoFactor(
              event,
            );
          }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-xs leading-5 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              Method: <strong>{twoFactorMethod}</strong>
              {twoFactorTarget
                ? ` · Code sent to ${twoFactorTarget}`
                : " · Use your authenticator or a backup code"}
            </span>
          </div>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Verification code
            </span>

            <span className="relative mt-2 block">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                autoComplete="one-time-code"
                maxLength={32}
                required
                value={twoFactorCode}
                onChange={(event) => {
                  setTwoFactorCode(
                    event.target.value,
                  );
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 font-mono text-sm tracking-[0.2em] text-slate-950 outline-none transition focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="Enter code"
              />
            </span>
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
            disabled={loading}
            onClick={() => {
              setStep(
                "credentials",
              );
              setChallengeId("");
              setTwoFactorCode("");
              setError("");
            }}
            className="h-11 w-full rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-600 dark:border-white/10 dark:text-slate-300"
          >
            Back to sign in
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-white/10">
        <p>
          New to the Coffer payment gateway?{" "}
          <Link
            href="/merchant/sign-up"
            className="font-black text-violet-600 dark:text-violet-300"
          >
            Create merchant account
          </Link>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-400"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Personal wallet sign in
        </Link>
      </div>
    </div>
  );
}
