"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";

import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  Landmark,
  LogIn,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  WalletCards,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";

type AuthExperience = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  accountLabel: string;
  sceneLabel: string;
  sceneStatus: string;
  features: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
};

const PERSONAL_LOGIN: AuthExperience = {
  eyebrow: "Personal wallet access",
  title: "Your money, movement and goals—",
  highlight: "finally in one calm place.",
  description:
    "Sign in to pay, transfer, track activity and manage your verified Coffer wallet from one protected workspace.",
  accountLabel: "Personal account",
  sceneLabel: "Wallet network",
  sceneStatus: "Ready",
  features: [
    {
      icon: ShieldCheck,
      title: "Protected access",
      description: "Secure sessions and account controls",
    },
    {
      icon: Zap,
      title: "Faster transfers",
      description: "Move funds without unnecessary steps",
    },
    {
      icon: CreditCard,
      title: "Clear activity",
      description: "Keep every payment easy to follow",
    },
  ],
};

const PERSONAL_REGISTER: AuthExperience = {
  eyebrow: "Create your Coffer wallet",
  title: "A secure financial home—",
  highlight: "built around your next move.",
  description:
    "Create your identity, verify your email and unlock a wallet designed for everyday payments, transfers and visibility.",
  accountLabel: "Personal registration",
  sceneLabel: "Account setup",
  sceneStatus: "Protected",
  features: [
    {
      icon: BadgeCheck,
      title: "Verified identity",
      description: "A safer foundation for every transaction",
    },
    {
      icon: LockKeyhole,
      title: "Private by design",
      description: "Sensitive access stays protected",
    },
    {
      icon: Sparkles,
      title: "Ready to grow",
      description: "Start simple and unlock more over time",
    },
  ],
};

const MERCHANT_SIGN_IN: AuthExperience = {
  eyebrow: "Coffer payment gateway",
  title: "One secure doorway to—",
  highlight: "every payment operation.",
  description:
    "Sign in to manage checkout, API credentials, webhooks, transactions, refunds and settlement activity for your business.",
  accountLabel: "Merchant gateway",
  sceneLabel: "Gateway status",
  sceneStatus: "Operational",
  features: [
    {
      icon: Code2,
      title: "API control",
      description: "Manage test and live integrations",
    },
    {
      icon: Webhook,
      title: "Reliable events",
      description: "Track webhook delivery and payment state",
    },
    {
      icon: Landmark,
      title: "Settlement visibility",
      description: "Follow balances, payouts and refunds",
    },
  ],
};

const MERCHANT_SIGN_UP: AuthExperience = {
  eyebrow: "Merchant gateway registration",
  title: "Create the identity behind—",
  highlight: "your payment integration.",
  description:
    "Register the authorized owner first. You will add business details, verification information and gateway settings next.",
  accountLabel: "Merchant registration",
  sceneLabel: "Gateway onboarding",
  sceneStatus: "Step 1 of 2",
  features: [
    {
      icon: ShieldCheck,
      title: "Secure owner access",
      description: "Keep the business account accountable",
    },
    {
      icon: Code2,
      title: "Sandbox first",
      description: "Prepare your integration safely",
    },
    {
      icon: CreditCard,
      title: "Checkout ready",
      description: "Move toward accepting customer payments",
    },
  ],
};

const MERCHANT_ONBOARDING: AuthExperience = {
  eyebrow: "Business onboarding",
  title: "From business details to—",
  highlight: "a gateway ready for testing.",
  description:
    "Tell Coffer who will accept payments. After onboarding, test-mode checkout becomes available while verification prepares live access.",
  accountLabel: "Merchant onboarding",
  sceneLabel: "Integration path",
  sceneStatus: "Test mode next",
  features: [
    {
      icon: Building2,
      title: "Business profile",
      description: "Connect the legal and customer-facing identity",
    },
    {
      icon: Code2,
      title: "Sandbox access",
      description: "Create keys and test checkout flows",
    },
    {
      icon: BadgeCheck,
      title: "Live verification",
      description: "Complete approval before real payments",
    },
  ],
};

const LEFT_PARTICLES = [
  { left: "8%", top: "14%", size: 4, delay: 0.2, duration: 7.5 },
  { left: "17%", top: "76%", size: 3, delay: 1.4, duration: 9.2 },
  { left: "29%", top: "24%", size: 5, delay: 0.8, duration: 8.1 },
  { left: "41%", top: "64%", size: 3, delay: 2.0, duration: 10.2 },
  { left: "57%", top: "17%", size: 4, delay: 1.1, duration: 8.7 },
  { left: "69%", top: "71%", size: 5, delay: 0.5, duration: 9.8 },
  { left: "82%", top: "31%", size: 3, delay: 2.5, duration: 7.9 },
  { left: "92%", top: "82%", size: 4, delay: 1.6, duration: 9.5 },
] as const;

const RIGHT_PARTICLES = [
  { left: "9%", top: "20%", size: 4, delay: 0.4, duration: 8.4 },
  { left: "21%", top: "75%", size: 3, delay: 1.1, duration: 9.4 },
  { left: "39%", top: "14%", size: 4, delay: 2.0, duration: 7.8 },
  { left: "54%", top: "82%", size: 3, delay: 0.8, duration: 8.9 },
  { left: "73%", top: "26%", size: 5, delay: 1.8, duration: 10.1 },
  { left: "89%", top: "68%", size: 3, delay: 0.2, duration: 8.0 },
] as const;

function getExperience(pathname: string): AuthExperience {
  if (pathname === "/register") {
    return PERSONAL_REGISTER;
  }

  if (pathname === "/merchant/sign-in") {
    return MERCHANT_SIGN_IN;
  }

  if (pathname === "/merchant/sign-up") {
    return MERCHANT_SIGN_UP;
  }

  if (pathname === "/merchant/onboarding") {
    return MERCHANT_ONBOARDING;
  }

  return PERSONAL_LOGIN;
}

function getFormWidth(pathname: string): string {
  if (pathname === "/merchant/onboarding") {
    return "max-w-[900px] 2xl:max-w-[960px]";
  }

  if (
    pathname === "/register" ||
    pathname === "/merchant/sign-up"
  ) {
    return "max-w-[760px] xl:max-w-[800px]";
  }

  return "max-w-[560px]";
}

function AuthPortalSwitcher({
  pathname,
  currentLabel,
}: {
  pathname: string;
  currentLabel: string;
}) {
  const isMerchant = pathname.startsWith("/merchant/");
  const isOnboarding = pathname === "/merchant/onboarding";

  const isSignUp =
    pathname === "/register" ||
    pathname === "/merchant/sign-up" ||
    isOnboarding;

  const personalHref = isSignUp ? "/register" : "/login";

  const merchantHref = isOnboarding
    ? "/merchant/onboarding"
    : isSignUp
      ? "/merchant/sign-up"
      : "/merchant/sign-in";

  const signInHref = isMerchant
    ? "/merchant/sign-in"
    : "/login";

  const signUpHref = isMerchant
    ? isOnboarding
      ? "/merchant/onboarding"
      : "/merchant/sign-up"
    : "/register";

  const springTransition = {
    type: "spring" as const,
    stiffness: 410,
    damping: 34,
    mass: 0.72,
  };

  return (
    <nav
      aria-label={`Authentication portal — ${currentLabel}`}
      className="relative flex w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-[18px] border border-white/15 bg-[#160b35]/35 p-1.5 shadow-[0_18px_42px_rgba(24,8,64,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:w-auto sm:flex-row sm:items-center sm:rounded-[20px]"
    >
      <motion.span
        aria-hidden
        animate={{
          x: [-18, 22, -18],
          opacity: [0.04, 0.12, 0.04],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -left-8 top-0 h-16 w-32 rotate-12 bg-white blur-2xl"
      />

      <div className="relative grid min-w-0 flex-1 grid-cols-2 gap-1 sm:flex-none">
        <Link
          href={personalHref}
          aria-current={!isMerchant ? "page" : undefined}
          className={`relative isolate flex h-9 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[13px] px-3 text-[9px] font-black uppercase tracking-[0.11em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/75 sm:min-w-[104px] ${
            !isMerchant
              ? "text-[#261444]"
              : "text-white/62 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          {!isMerchant && (
            <motion.span
              layoutId="auth-portal-pill"
              aria-hidden
              transition={springTransition}
              className="absolute inset-0 -z-10 rounded-[13px] border border-white/85 bg-[linear-gradient(135deg,#ffffff,#eee9ff)] shadow-[0_9px_24px_rgba(30,12,70,0.22),inset_0_1px_0_#fff]"
            />
          )}

          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Personal</span>
        </Link>

        <Link
          href={merchantHref}
          aria-current={isMerchant ? "page" : undefined}
          className={`relative isolate flex h-9 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[13px] px-3 text-[9px] font-black uppercase tracking-[0.11em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/75 sm:min-w-[104px] ${
            isMerchant
              ? "text-[#261444]"
              : "text-white/62 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          {isMerchant && (
            <motion.span
              layoutId="auth-portal-pill"
              aria-hidden
              transition={springTransition}
              className="absolute inset-0 -z-10 rounded-[13px] border border-white/85 bg-[linear-gradient(135deg,#ffffff,#eee9ff)] shadow-[0_9px_24px_rgba(30,12,70,0.22),inset_0_1px_0_#fff]"
            />
          )}

          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Merchant</span>
        </Link>
      </div>

      <span
        aria-hidden
        className="mx-1 hidden h-5 w-px bg-white/12 sm:block"
      />

      <div className="relative grid min-w-0 flex-1 grid-cols-2 gap-1 sm:flex-none">
        <Link
          href={signInHref}
          aria-current={!isSignUp ? "page" : undefined}
          className={`relative isolate flex h-9 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[13px] px-3 text-[9px] font-black uppercase tracking-[0.11em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/75 sm:min-w-[92px] ${
            !isSignUp
              ? "text-white"
              : "text-white/58 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          {!isSignUp && (
            <motion.span
              layoutId="auth-action-pill"
              aria-hidden
              transition={springTransition}
              className="absolute inset-0 -z-10 rounded-[13px] border border-violet-200/25 bg-[linear-gradient(135deg,rgba(91,51,220,0.96),rgba(168,40,245,0.96))] shadow-[0_9px_24px_rgba(76,29,149,0.34),inset_0_1px_0_rgba(255,255,255,0.22)]"
            />
          )}

          <LogIn className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Sign in</span>
        </Link>

        <Link
          href={signUpHref}
          aria-current={isSignUp ? "page" : undefined}
          className={`relative isolate flex h-9 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[13px] px-3 text-[9px] font-black uppercase tracking-[0.11em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/75 sm:min-w-[92px] ${
            isSignUp
              ? "text-white"
              : "text-white/58 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          {isSignUp && (
            <motion.span
              layoutId="auth-action-pill"
              aria-hidden
              transition={springTransition}
              className="absolute inset-0 -z-10 rounded-[13px] border border-violet-200/25 bg-[linear-gradient(135deg,rgba(91,51,220,0.96),rgba(168,40,245,0.96))] shadow-[0_9px_24px_rgba(76,29,149,0.34),inset_0_1px_0_rgba(255,255,255,0.22)]"
            />
          )}

          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {isOnboarding ? "Setup" : "Sign up"}
          </span>
        </Link>
      </div>
    </nav>
  );
}

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const experience = getExperience(pathname);
  const isMerchant = pathname.startsWith("/merchant/");
  const formWidth = getFormWidth(pathname);

  const cardTheme = isMerchant
    ? "dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,10,35,0.98),rgba(24,16,55,0.96))]"
    : "dark:border-white/25 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.985),rgba(245,243,255,0.96))]";

  return (
    <main className="relative isolate min-h-dvh overflow-x-clip bg-[#10082d]">
      <style>{`
        /* =====================================================
           AUTH LEFT PANEL — STICKY + ONE-SCREEN FIT
        ====================================================== */

        @media (min-width: 1024px) {
          .auth-left-panel {
            position: sticky;
            top: 0;
            height: 100dvh;
            min-height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
          }

          .auth-left-content {
            height: 100%;
            min-height: 0;
          }

          .auth-left-main {
            min-height: 0;
          }

          .auth-feature-grid {
            flex-shrink: 0;
          }

          .auth-payment-scene {
            flex-shrink: 0;
          }

          .auth-left-footer {
            flex-shrink: 0;
          }
        }

        /* Standard laptop heights */
        @media (min-width: 1024px) and (max-height: 900px) {
          .auth-left-panel {
            padding-top: 22px !important;
            padding-bottom: 20px !important;
          }

          .auth-left-main {
            padding-top: 14px !important;
            padding-bottom: 12px !important;
          }

          .auth-left-eyebrow {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          .auth-left-title {
            margin-top: 14px !important;
            font-size: clamp(2rem, 4.3vh, 2.85rem) !important;
            line-height: 1.01 !important;
          }

          .auth-left-description {
            margin-top: 10px !important;
            font-size: 12px !important;
            line-height: 1.55 !important;
          }

          .auth-feature-grid {
            margin-top: 14px !important;
            gap: 9px !important;
          }

          .auth-feature-card {
            padding: 11px !important;
            border-radius: 17px !important;
          }

          .auth-feature-icon {
            width: 32px !important;
            height: 32px !important;
          }

          .auth-feature-title {
            margin-top: 8px !important;
          }

          .auth-feature-description {
            margin-top: 3px !important;
            line-height: 1.35 !important;
          }

          .auth-payment-scene {
            margin-top: 12px !important;
            min-height: 108px !important;
            padding: 12px !important;
            border-radius: 20px !important;
          }

          .auth-payment-scene-body {
            margin-top: 10px !important;
          }

          .auth-left-footer {
            padding-top: 10px !important;
          }
        }

        /* 768p / short laptop screens */
        @media (min-width: 1024px) and (max-height: 780px) {
          .auth-left-panel {
            padding: 16px 24px !important;
          }

          .auth-brand-icon {
            width: 38px !important;
            height: 38px !important;
            border-radius: 13px !important;
          }

          .auth-brand-name {
            font-size: 14px !important;
          }

          .auth-brand-subtitle {
            font-size: 8px !important;
          }

          .auth-left-main {
            padding-top: 10px !important;
            padding-bottom: 8px !important;
          }

          .auth-left-eyebrow {
            padding: 5px 10px !important;
            font-size: 8px !important;
          }

          .auth-left-title {
            margin-top: 10px !important;
            font-size: clamp(1.78rem, 4.8vh, 2.45rem) !important;
            line-height: 0.99 !important;
          }

          .auth-left-description {
            margin-top: 8px !important;
            font-size: 10.5px !important;
            line-height: 1.45 !important;
          }

          .auth-feature-grid {
            margin-top: 10px !important;
            gap: 8px !important;
          }

          .auth-feature-card {
            padding: 9px !important;
            border-radius: 16px !important;
          }

          .auth-feature-icon {
            width: 29px !important;
            height: 29px !important;
          }

          .auth-feature-title {
            margin-top: 6px !important;
            font-size: 9px !important;
          }

          .auth-feature-description {
            margin-top: 2px !important;
            font-size: 7.5px !important;
            line-height: 1.35 !important;
          }

          .auth-payment-scene {
            margin-top: 9px !important;
            min-height: 92px !important;
            padding: 10px !important;
            border-radius: 18px !important;
          }

          .auth-payment-scene-body {
            margin-top: 8px !important;
          }

          .auth-scene-card {
            padding-top: 7px !important;
            padding-bottom: 7px !important;
          }

          .auth-left-footer {
            padding-top: 8px !important;
            font-size: 8px !important;
          }
        }

        /* Very short desktop/laptop viewport */
        @media (min-width: 1024px) and (max-height: 680px) {
          .auth-left-panel {
            padding: 12px 20px !important;
          }

          .auth-brand-icon {
            width: 34px !important;
            height: 34px !important;
          }

          .auth-left-main {
            padding-top: 7px !important;
            padding-bottom: 6px !important;
          }

          .auth-left-eyebrow {
            padding: 4px 9px !important;
            font-size: 7px !important;
          }

          .auth-left-title {
            margin-top: 8px !important;
            font-size: clamp(1.58rem, 4.7vh, 2.05rem) !important;
          }

          .auth-left-description {
            margin-top: 6px !important;
            font-size: 9.5px !important;
            line-height: 1.35 !important;
          }

          .auth-feature-grid {
            margin-top: 8px !important;
            gap: 6px !important;
          }

          .auth-feature-card {
            padding: 7px !important;
          }

          .auth-feature-icon {
            width: 26px !important;
            height: 26px !important;
          }

          .auth-feature-title {
            margin-top: 5px !important;
            font-size: 8px !important;
          }

          .auth-feature-description {
            font-size: 7px !important;
          }

          .auth-payment-scene {
            margin-top: 7px !important;
            min-height: 80px !important;
            padding: 8px !important;
          }

          .auth-payment-scene-body {
            margin-top: 6px !important;
          }

          .auth-scene-icon {
            width: 28px !important;
            height: 28px !important;
          }

          .auth-scene-end-icon {
            width: 38px !important;
            height: 38px !important;
          }

          .auth-left-footer {
            padding-top: 6px !important;
            font-size: 7.5px !important;
          }
        }
      `}</style>
      <motion.div
        aria-hidden
        animate={{
          opacity: [0.55, 0.8, 0.55],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_12%_12%,rgba(79,70,229,.30),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,.32),transparent_31%),radial-gradient(circle_at_70%_88%,rgba(79,70,229,.24),transparent_36%),#10082d]"
      />

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1720px] grid-cols-1 lg:grid-cols-[minmax(350px,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(430px,0.95fr)_minmax(0,1.05fr)]">
        {/* =====================================================
            LEFT EXPERIENCE PANEL
        ====================================================== */}

        <section
          className="auth-left-panel relative hidden min-w-0 overflow-hidden border-white/10 text-white lg:flex lg:flex-col lg:border-r lg:px-7 lg:py-7 xl:px-10 xl:py-8 2xl:px-12 2xl:py-9"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#0b0620_0%,#1a1043_45%,#30205d_100%)]"
          />

          <motion.div
            aria-hidden
            animate={{
              backgroundPosition: [
                "0px 0px",
                "46px 46px",
                "0px 0px",
              ],
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
              maskImage:
                "linear-gradient(to bottom, black, rgba(0,0,0,.85) 70%, transparent)",
            }}
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, 44, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
              opacity: [0.34, 0.55, 0.34],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -left-40 -top-40 h-[31rem] w-[31rem] rounded-full bg-indigo-500/30 blur-[110px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, -38, 0],
              y: [0, -34, 0],
              scale: [1, 1.12, 1],
              opacity: [0.24, 0.46, 0.24],
            }}
            transition={{
              duration: 19,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-44 -right-36 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/25 blur-[120px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: ["-35%", "145%"],
              opacity: [0, 0.32, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
          />

          {LEFT_PARTICLES.map((particle, index) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -14, 6, 0],
                x: [0, 7, -4, 0],
                scale: [0.85, 1.3, 0.95, 0.85],
                opacity: [0.18, 0.82, 0.36, 0.18],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute rounded-full bg-violet-100 shadow-[0_0_14px_rgba(221,214,254,.9)]"
            />
          ))}

          <div className="auth-left-content relative z-10 flex min-h-0 w-full flex-1 flex-col">
            <Link
              href="/"
              className="group inline-flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <motion.span
                whileHover={{
                  y: -2,
                  rotate: -2,
                }}
                className="auth-brand-icon relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px] border border-white/15 bg-white/10 text-violet-100 shadow-[0_14px_34px_rgba(8,5,28,0.28)] backdrop-blur-xl"
              >
                <motion.span
                  aria-hidden
                  animate={{
                    x: ["-120%", "120%"],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    repeatDelay: 1.6,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-y-0 w-7 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />

                <WalletCards className="relative h-5 w-5" />
              </motion.span>

              <span>
                <span className="auth-brand-name block text-base font-black tracking-[-0.035em] text-white">
                  Coffer
                </span>

                <span className="auth-brand-subtitle block text-[9px] font-bold uppercase tracking-[0.21em] text-violet-200/65">
                  Digital payments
                </span>
              </span>
            </Link>

            <div className="auth-left-main flex min-h-0 flex-1 flex-col justify-center py-6 xl:py-8">
              <motion.div
                initial={{
                  opacity: 0,
                  y: 22,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="auth-left-eyebrow inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-violet-100 backdrop-blur-xl"
                >
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                  {experience.eyebrow}
                </motion.div>

                <h1 className="auth-left-title mt-5 max-w-[650px] text-[2.15rem] font-black leading-[1.03] tracking-[-0.055em] text-white lg:text-[2.35rem] xl:text-[3rem] 2xl:text-[3.35rem]">
                  {experience.title}{" "}
                  <motion.span
                    animate={{
                      backgroundPosition: [
                        "0% 50%",
                        "100% 50%",
                        "0% 50%",
                      ],
                    }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="bg-[linear-gradient(90deg,#ddd6fe,#f5d0fe,#a5f3fc,#ddd6fe)] bg-[length:240%_240%] bg-clip-text text-transparent"
                  >
                    {experience.highlight}
                  </motion.span>
                </h1>

                <p className="auth-left-description mt-4 max-w-[590px] text-[12px] font-medium leading-6 text-slate-300/90 xl:text-[13px] xl:leading-7">
                  {experience.description}
                </p>
              </motion.div>

              <div className="auth-feature-grid mt-5 grid grid-cols-3 gap-3">
                {experience.features.map((feature, index) => {
                  const Icon = feature.icon;

                  return (
                    <motion.div
                      key={feature.title}
                      initial={{
                        opacity: 0,
                        y: 14,
                      }}
                      animate={{
                        opacity: 1,
                        y: [0, index % 2 === 0 ? -4 : 4, 0],
                      }}
                      transition={{
                        opacity: {
                          delay: 0.12 + index * 0.08,
                          duration: 0.5,
                        },
                        y: {
                          delay: 0.5 + index * 0.25,
                          duration: 5.5 + index * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }}
                      whileHover={{
                        y: -6,
                        scale: 1.015,
                      }}
                      className="auth-feature-card relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-xl"
                    >
                      <motion.div
                        aria-hidden
                        animate={{
                          x: [-80, 130],
                          opacity: [0, 0.14, 0],
                        }}
                        transition={{
                          duration: 5.5,
                          repeat: Infinity,
                          delay: index * 0.7,
                          ease: "easeInOut",
                        }}
                        className="pointer-events-none absolute inset-y-0 w-14 rotate-12 bg-white blur-lg"
                      />

                      <span className="auth-feature-icon relative flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/10 text-violet-200">
                        <Icon className="h-4 w-4" />
                      </span>

                      <p className="auth-feature-title relative mt-3 text-[11px] font-extrabold text-white">
                        {feature.title}
                      </p>

                      <p className="auth-feature-description relative mt-1 text-[9px] font-medium leading-4 text-slate-400">
                        {feature.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <PaymentScene
                isMerchant={isMerchant}
                label={experience.sceneLabel}
                status={experience.sceneStatus}
              />
            </div>

            <div className="auth-left-footer flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[9px] font-semibold text-white/45">
              <span>© {new Date().getFullYear()} Coffer</span>

              <motion.span
                animate={{
                  opacity: [0.55, 1, 0.55],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center gap-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Protected financial access
              </motion.span>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT FORM PANEL
        ====================================================== */}

        <section className="relative flex min-h-dvh min-w-0 items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#4f46e5_0%,#6d28d9_48%,#7e22ce_100%)] px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8 lg:px-8 lg:py-9 xl:px-12 xl:py-10 2xl:px-14 2xl:py-11">
          <motion.div
            aria-hidden
            animate={{
              backgroundPosition: [
                "0px 0px",
                "30px 30px",
                "0px 0px",
              ],
              opacity: [0.09, 0.16, 0.09],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              maskImage:
                "linear-gradient(145deg, black, rgba(0,0,0,.8) 72%, transparent)",
            }}
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, -48, 0],
              y: [0, 38, 0],
              opacity: [0.4, 0.72, 0.4],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-28 top-[7%] h-80 w-80 rounded-full bg-fuchsia-400/35 blur-[95px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, 56, 0],
              y: [0, -42, 0],
              scale: [1, 1.13, 1],
              opacity: [0.24, 0.5, 0.24],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-28 left-[4%] h-96 w-96 rounded-full bg-cyan-300/25 blur-[110px]"
          />

          <motion.div
            aria-hidden
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute right-[8%] top-[12%] hidden h-44 w-44 rounded-full border border-dashed border-white/15 xl:block"
          >
            <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.9)]" />
          </motion.div>

          <motion.div
            aria-hidden
            animate={{
              x: ["-35%", "140%"],
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatDelay: 1.1,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent blur-xl"
          />

          {RIGHT_PARTICLES.map((particle, index) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -12, 5, 0],
                x: [0, 6, -3, 0],
                opacity: [0.16, 0.7, 0.3, 0.16],
                scale: [0.85, 1.2, 0.95, 0.85],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.75)]"
            />
          ))}

          <div className={`relative z-10 w-full min-w-0 ${formWidth}`}>
            <div className="mb-3 flex min-w-0 flex-col gap-2 px-0.5 text-white sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-1">
              <AuthPortalSwitcher
                pathname={pathname}
                currentLabel={experience.accountLabel}
              />

              <Link
                href="/"
                className="group inline-flex shrink-0 self-end items-center gap-1.5 rounded-lg px-1 py-1 text-[10px] font-bold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:self-auto"
              >
                Back home
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <motion.div
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: [0, -2, 0],
                scale: 1,
              }}
              transition={{
                opacity: {
                  duration: 0.62,
                  ease: [0.22, 1, 0.36, 1],
                },
                scale: {
                  duration: 0.62,
                  ease: [0.22, 1, 0.36, 1],
                },
                y: {
                  delay: 0.7,
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className={`relative min-w-0 overflow-hidden rounded-[22px] border border-white/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.985),rgba(245,243,255,0.96))] p-4 shadow-[0_28px_80px_rgba(20,8,55,0.34),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[28px] xl:p-8 2xl:rounded-[30px] 2xl:p-9 ${cardTheme}`}
            >
              <motion.div
                aria-hidden
                animate={{
                  x: ["-120%", "160%"],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  ease: "easeInOut",
                }}
                className="pointer-events-none absolute inset-y-0 w-24 rotate-12 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-xl"
              />

              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              <div className="relative">
                {children}
              </div>
            </motion.div>

            <div className="mt-3 flex flex-col items-center justify-center gap-1.5 px-1 text-center text-[8px] font-semibold text-white/55 sm:mt-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-5 sm:gap-y-2 sm:px-2 sm:text-[9px]">
              <motion.span
                animate={{
                  opacity: [0.55, 1, 0.55],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Encrypted session
              </motion.span>

              <span>
                No account data is exposed in the interface
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PaymentScene({
  isMerchant,
  label,
  status,
}: {
  isMerchant: boolean;
  label: string;
  status: string;
}) {
  return (
    <div className="auth-payment-scene relative mt-5 hidden min-h-[122px] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl lg:block">
      <motion.div
        aria-hidden
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.16, 0.32, 0.16],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-0 rounded-full bg-violet-400/25 blur-3xl"
      />

      <motion.div
        aria-hidden
        animate={{
          x: ["-25%", "135%"],
          opacity: [0, 0.24, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatDelay: 1.2,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-y-0 w-20 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-lg"
      />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-violet-200/65">
            {label}
          </p>

          <p className="mt-1.5 text-xs font-extrabold text-white">
            {status}
          </p>
        </div>

        <motion.span
          animate={{
            y: [0, -2, 0],
            boxShadow: [
              "0 0 0 rgba(110,231,183,0)",
              "0 0 20px rgba(110,231,183,.24)",
              "0 0 0 rgba(110,231,183,0)",
            ],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200"
        >
          <motion.span
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]"
          />

          Secure
        </motion.span>
      </div>

      <div className="auth-payment-scene-body relative mt-4 flex items-center gap-3">
        <motion.div
          animate={{
            y: [0, -4, 0],
            x: [0, 2, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="auth-scene-card flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.065] px-3 py-2.5"
        >
          <motion.span
            animate={{
              rotate: [0, 4, -4, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="auth-scene-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200"
          >
            {isMerchant ? (
              <Code2 className="h-4 w-4" />
            ) : (
              <WalletCards className="h-4 w-4" />
            )}
          </motion.span>

          <span className="min-w-0">
            <span className="block truncate text-[9px] font-extrabold text-white">
              {isMerchant
                ? "Checkout authorized"
                : "Transfer completed"}
            </span>

            <span className="mt-0.5 block truncate text-[8px] font-medium text-slate-400">
              {isMerchant
                ? "Event delivered to your integration"
                : "Activity protected by Coffer"}
            </span>
          </span>
        </motion.div>

        <motion.span
          animate={{
            rotate: [0, 7, 0, -7, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="auth-scene-end-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/10 text-fuchsia-200"
        >
          {isMerchant ? (
            <Webhook className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </motion.span>
      </div>
    </div>
  );
}
