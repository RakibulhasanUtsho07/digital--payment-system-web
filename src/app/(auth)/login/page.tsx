"use client";

import { useState, type FormEvent, type ElementType } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

/* =========================================================
   API URL
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     LOGIN SUBMIT
  ========================================================== */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");

      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");

      return;
    }

    setIsLoading(true);

    try {
      console.log("LOGIN API:", `${API_URL}/auth/login`);
      console.log("LOGIN FORM DEBUG:", {
        email: normalizedEmail,
        passwordLength: password.length,
      });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        /*
         * IMPORTANT
         * Backend HttpOnly cookie receive করার জন্য
         * credentials অবশ্যই include করতে হবে।
         */
        credentials: "include",

        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      /*
       * Response JSON parsing
       */
      let data: LoginResponse | null = null;

      try {
        data = (await response.json()) as LoginResponse;
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      console.log("LOGIN STATUS:", response.status);

      console.log("LOGIN RESPONSE:", data);

      /*
       * Backend error
       */
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.user) {
        throw new Error("User information was not returned by the server.");
      }

      /*
       * =====================================================
       * IMPORTANT:
       * JWT token localStorage-এ রাখা হচ্ছে না।
       *
       * Backend ইতিমধ্যে access_token HttpOnly cookie
       * সেট করছে।
       *
       * শুধু non-sensitive user information রাখা হচ্ছে
       * UI state-এর জন্য।
       * =====================================================
       */

      localStorage.setItem("auth_user", JSON.stringify(data.user));

      /*
       * Optional auth flag.
       * এটা security proof নয়।
       * Real authentication হচ্ছে HttpOnly cookie দিয়ে।
       */
      localStorage.setItem("is_authenticated", "true");

      /*
       * =====================================================
       * REDIRECT
       * =====================================================
       */

      if (data.user.role === "admin") {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="grid min-h-[760px] w-full grid-cols-1 lg:grid-cols-2">
      {/* =====================================================
          LEFT PANEL
      ====================================================== */}

      <section className="relative hidden overflow-hidden rounded-l-[2rem] bg-[#020617] lg:flex">
        {/* Background */}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,.12),transparent_35%)]" />

        {/* Blue glow */}

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.18, 0.3, 0.18],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]"
        />

        {/* Cyan glow */}

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-24 -right-20 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[120px]"
        />

        {/* Content */}

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}

          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-300 shadow-lg">
              <WalletCards className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight text-white">
                Nova
                <span className="text-cyan-400">Wallet</span>
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                Digital Wallet System
              </p>
            </div>
          </Link>

          {/* Main text */}

          <div className="my-auto py-12">
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
                duration: 0.7,
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Secure Access
                </span>
              </div>

              <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] text-white xl:text-5xl">
                Welcome back.
                <span className="mt-1 block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Your wallet is ready.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">
                Access secure payments, fast transfers, KYC verification,
                transaction visibility, and intelligent financial insights from
                one secure wallet.
              </p>
            </motion.div>

            {/* Features */}

            <div className="mt-10 space-y-4">
              <FeatureRow
                icon={ShieldCheck}
                title="Secure Payments"
                description="Protected payment flows"
              />

              <FeatureRow
                icon={Zap}
                title="Fast Transfers"
                description="Simple peer-to-peer payments"
              />

              <FeatureRow
                icon={TrendingUp}
                title="Smart Insights"
                description="Understand your spending"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />

            <span>Private and secure account access</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOGIN FORM
      ====================================================== */}

      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-[420px]">
          {/* Heading */}

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
              duration: 0.5,
            }}
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <Fingerprint className="h-6 w-6" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sign in to Nova
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your credentials to access your wallet, transfers, and
              financial tools.
            </p>
          </motion.div>

          {/* Error */}

          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Form */}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* EMAIL */}

            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-xs font-bold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT */}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={
                isLoading
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                isLoading
                  ? undefined
                  : {
                      scale: 0.98,
                    }
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Register */}

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-blue-600 hover:underline"
            >
              Create an account
            </Link>
          </p>

          {/* Security */}

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

            <span>Your wallet data stays private</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   FEATURE ROW
========================================================= */

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) {
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
        duration: 0.5,
      }}
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-400">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>

        <p className="text-[10px] text-slate-400">{description}</p>
      </div>
    </motion.div>
  );
}
