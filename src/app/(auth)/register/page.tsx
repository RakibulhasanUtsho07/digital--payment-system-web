"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ScanFace,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
  Activity,
} from "lucide-react";

type AuthMode = "signin" | "signup";

const services = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Protection-focused payment flows with validation and authentication.",
  },
  {
    icon: Send,
    title: "Fast Transfers",
    description:
      "Simple peer-to-peer transfers with clear confirmation steps.",
  },
  {
    icon: ScanFace,
    title: "KYC Verification",
    description:
      "Structured identity verification built into the wallet experience.",
  },
  {
    icon: TrendingUp,
    title: "Smart Insights",
    description:
      "AI-assisted spending, budgeting and cash-flow intelligence.",
  },
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");

  const isSignIn = mode === "signin";

  return (
    <main className="min-h-screen bg-[#F4F7FB] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_100px_rgba(23,54,93,0.12)] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3.5rem)]">
        <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">

          {/* =========================================================
              LEFT PRODUCT PANEL
          ========================================================== */}
          <section className="relative hidden overflow-hidden bg-[#123B66] lg:flex">
            {/* Ambient background */}
            <motion.div
              animate={{
                x: [0, 18, 0],
                y: [0, -12, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -left-28 top-16 h-[360px] w-[360px] rounded-full bg-[#4EA3E3]/15 blur-3xl"
            />

            <motion.div
              animate={{
                x: [0, -18, 0],
                y: [0, 14, 0],
                scale: [1.05, 1, 1.05],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -bottom-32 right-[-90px] h-[430px] w-[430px] rounded-full bg-[#2DBE8C]/10 blur-3xl"
            />

            {/* Decorative orbit */}
            <div className="pointer-events-none absolute right-[12%] top-[18%] h-32 w-32 rounded-full border border-white/[0.07]" />
            <div className="pointer-events-none absolute right-[7%] top-[13%] h-44 w-44 rounded-full border border-white/[0.04]" />

            <div className="relative z-10 flex w-full flex-col px-10 py-10 xl:px-14 xl:py-12">

              {/* Brand */}
              <Link
                href="/"
                className="inline-flex w-fit items-center gap-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#9DDCFF]">
                  <WalletCards className="h-5 w-5" />
                </span>

                <div>
                  <p className="font-serif text-xl font-bold tracking-tight text-white">
                    Wallet
                  </p>

                  <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-100/45">
                    Digital Wallet System
                  </p>
                </div>
              </Link>

              {/* Main product message */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-16 max-w-[650px]"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#9DDCFF]" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                    FinTech • Secure Payments
                  </span>
                </div>

                <h1 className="mt-6 max-w-[620px] font-serif text-[2.9rem] font-bold leading-[1.05] tracking-[-0.04em] text-white xl:text-[4.1rem]">
                  Finance should feel
                  <span className="block text-[#9DDCFF]">
                    simple and secure.
                  </span>
                </h1>

                <p className="mt-6 max-w-[570px] text-sm leading-7 text-blue-100/70 xl:text-base">
                  EG13-14 brings secure payments, transfers, KYC, transaction
                  visibility and intelligent financial assistance together in
                  one focused digital wallet experience.
                </p>
              </motion.div>

              {/* =====================================================
                  SERVICE CARDS
              ====================================================== */}
              <div className="mt-10 grid max-w-[690px] grid-cols-1 gap-3 sm:grid-cols-2">
                {services.map((service, index) => {
                  const Icon = service.icon;

                  return (
                    <motion.div
                      key={service.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.15 + index * 0.08,
                        duration: 0.5,
                      }}
                      whileHover={{
                        y: -3,
                        backgroundColor: "rgba(255,255,255,0.09)",
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9DDCFF]">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">
                            {service.title}
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-blue-100/45">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* =====================================================
                  SECURITY / PLATFORM INFO
              ====================================================== */}
              <div className="mt-auto pt-10">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                    <div className="max-w-[390px]">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#9DDCFF]" />

                        <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-blue-100/45">
                          Security Architecture
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-white">
                        Protection is part of the product.
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-blue-100/45">
                        Authentication, validation, KYC, transaction monitoring
                        and fraud-risk workflows work together across the
                        platform.
                      </p>
                    </div>

                    {/* product indicators */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <PlatformStat
                        icon={LockKeyhole}
                        value="Secure"
                        label="Payments"
                      />

                      <PlatformStat
                        icon={Fingerprint}
                        value="KYC"
                        label="Verified Flow"
                      />

                      <PlatformStat
                        icon={Activity}
                        value="Real-time"
                        label="Transactions"
                      />

                      <PlatformStat
                        icon={Sparkles}
                        value="AI"
                        label="Insights"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              RIGHT AUTH PANEL
          ========================================================== */}
          <section className="relative flex min-h-[760px] items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-12 xl:px-16">

            {/* subtle right background */}
            <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-[#1F5EA8]/[0.035] blur-3xl" />

            <div className="relative z-10 w-full max-w-[440px]">

              {/* Mobile brand */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5EA8] text-white">
                  <WalletCards className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-serif text-lg font-bold text-[#162A43]">
                    Wallet
                  </p>

                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#8291A5]">
                    Digital Wallet System
                  </p>
                </div>
              </div>

              {/* =====================================================
                  AUTH TABS
              ====================================================== */}
              <div className="rounded-2xl border border-[#E3EAF1] bg-[#F7F9FC] p-1.5">
                <div className="relative grid grid-cols-2">
                  {/* Animated tab background */}
                  <motion.div
                    layout
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 30,
                    }}
                    className="absolute bottom-0 top-0 w-1/2 rounded-xl bg-white shadow-sm"
                    style={{
                      left: isSignIn ? 0 : "50%",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`relative z-10 flex h-11 items-center justify-center text-sm font-semibold transition-colors ${
                      isSignIn
                        ? "text-[#1F5EA8]"
                        : "text-[#7A899A]"
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`relative z-10 flex h-11 items-center justify-center text-sm font-semibold transition-colors ${
                      !isSignIn
                        ? "text-[#1F5EA8]"
                        : "text-[#7A899A]"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* =====================================================
                  ANIMATED FORM AREA
              ====================================================== */}
              <div className="mt-9">
                <AnimatePresence mode="wait">

                  {isSignIn ? (
                    <motion.div
                      key="signin"
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
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <AuthHeader
                        badge="Secure Login"
                        title="Welcome back"
                        description="Sign in to access your wallet, transfers and financial insights."
                        icon={LockKeyhole}
                      />

                      <form className="mt-8 space-y-5">
                        {/* Email / phone */}
                        <Field
                          id="signin-email"
                          label="Email or Phone"
                          type="text"
                          placeholder="you@example.com"
                          icon={Mail}
                        />

                        {/* Password */}
                        <Field
                          id="signin-password"
                          label="Password"
                          type="password"
                          placeholder="Enter your password"
                          icon={KeyRound}
                          helper={
                            <Link
                              href="/auth/forgot-password"
                              className="font-semibold text-[#1F5EA8] hover:underline"
                            >
                              Forgot password?
                            </Link>
                          }
                        />

                        {/* Remember */}
                        <div className="flex items-center justify-between">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-[#CBD6E2] accent-[#1F5EA8]"
                            />

                            <span className="text-[11px] font-medium text-[#718095]">
                              Remember me
                            </span>
                          </label>

                          <span className="flex items-center gap-1.5 text-[10px] text-[#97A4B4]">
                            <LockKeyhole className="h-3 w-3" />
                            Secure session
                          </span>
                        </div>

                        <AuthButton label="Sign In" />
                      </form>

                      <SecurityNote
                        title="Your wallet stays private"
                        description="After login, only your authenticated account can access its wallet, KYC information and transaction history."
                      />

                      <AuthSwitchText
                        text="Don't have an account?"
                        action="Create your wallet"
                        onClick={() => setMode("signup")}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{
                        opacity: 0,
                        x: -25,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: 25,
                      }}
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <AuthHeader
                        badge="Get Started"
                        title="Create your wallet"
                        description="Join a secure digital wallet built for everyday payments and smarter financial management."
                        icon={Sparkles}
                      />

                      <form className="mt-8 space-y-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <Field
                            id="signup-first-name"
                            label="First Name"
                            type="text"
                            placeholder="Rakibul"
                            icon={UserRound}
                          />

                          <Field
                            id="signup-last-name"
                            label="Last Name"
                            type="text"
                            placeholder="Hasan"
                            icon={UserRound}
                          />
                        </div>

                        <Field
                          id="signup-email"
                          label="Email Address"
                          type="email"
                          placeholder="you@example.com"
                          icon={Mail}
                        />

                        <Field
                          id="signup-phone"
                          label="Phone Number"
                          type="tel"
                          placeholder="+880 1XXX-XXXXXX"
                          icon={Phone}
                        />

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <Field
                            id="signup-password"
                            label="Password"
                            type="password"
                            placeholder="Create password"
                            icon={KeyRound}
                          />

                          <Field
                            id="signup-confirm"
                            label="Confirm Password"
                            type="password"
                            placeholder="Repeat password"
                            icon={KeyRound}
                          />
                        </div>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-[#CBD6E2] accent-[#1F5EA8]"
                          />

                          <span className="text-[10px] leading-5 text-[#718095]">
                            I agree to the{" "}
                            <Link
                              href="/terms"
                              className="font-semibold text-[#1F5EA8] hover:underline"
                            >
                              Terms
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/privacy"
                              className="font-semibold text-[#1F5EA8] hover:underline"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </span>
                        </label>

                        <AuthButton label="Create Wallet" />
                      </form>

                      <SecurityNote
                        title="Secure account setup"
                        description="Your account will become the gateway to your wallet, KYC verification, transfers and transaction history."
                      />

                      <AuthSwitchText
                        text="Already have an account?"
                        action="Sign in"
                        onClick={() => setMode("signin")}
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* footer */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[9px] text-[#9AA7B7]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Secure digital wallet onboarding
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   AUTH HEADER
============================================================= */

function AuthHeader({
  badge,
  title,
  description,
  icon: Icon,
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
        <Icon className="h-3 w-3" />
        {badge}
      </span>

      <h2 className="mt-5 font-serif text-3xl font-bold tracking-[-0.03em] text-[#162A43] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-[#718095]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   FIELD
============================================================= */

function Field({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  helper,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ElementType;
  helper?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-[#405169]"
        >
          {label}
        </label>

        {helper}
      </div>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-[#DCE4ED] bg-[#FBFCFE] px-4 pr-11 text-sm text-[#162A43] outline-none transition-all placeholder:text-[#A5B0BE] focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-[#1F5EA8]/10"
        />

        <Icon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5B0BE]" />
      </div>
    </div>
  );
}

/* =============================================================
   AUTH BUTTON
============================================================= */

function AuthButton({
  label,
}: {
  label: string;
}) {
  return (
    <motion.button
      type="submit"
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.985,
      }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,94,168,0.18)] transition-all hover:bg-[#184880] hover:shadow-[0_15px_30px_rgba(31,94,168,0.22)]"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}

/* =============================================================
   SECURITY NOTE
============================================================= */

function SecurityNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-7 flex gap-3 rounded-2xl border border-[#DDEAF7] bg-[#F5F9FD] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
        <ShieldCheck className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-semibold text-[#405169]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#8190A3]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =============================================================
   AUTH SWITCH
============================================================= */

function AuthSwitchText({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p className="mt-7 text-center text-xs text-[#8190A3]">
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-semibold text-[#1F5EA8] hover:underline"
      >
        {action}
      </button>
    </p>
  );
}

/* =============================================================
   PLATFORM STAT
============================================================= */

function PlatformStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
      <Icon className="h-3.5 w-3.5 text-[#9DDCFF]" />

      <p className="mt-2 text-[10px] font-semibold text-white">
        {value}
      </p>

      <p className="mt-0.5 text-[7px] text-blue-100/40">
        {label}
      </p>
    </div>
  );
}