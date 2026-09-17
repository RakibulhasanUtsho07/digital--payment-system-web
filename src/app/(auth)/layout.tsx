"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
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

function getExperience(
  pathname: string,
): AuthExperience {
  if (
    pathname ===
    "/register"
  ) {
    return PERSONAL_REGISTER;
  }

  if (
    pathname ===
    "/merchant/sign-in"
  ) {
    return MERCHANT_SIGN_IN;
  }

  if (
    pathname ===
    "/merchant/sign-up"
  ) {
    return MERCHANT_SIGN_UP;
  }

  if (
    pathname ===
    "/merchant/onboarding"
  ) {
    return MERCHANT_ONBOARDING;
  }

  return PERSONAL_LOGIN;
}

function getFormWidth(
  pathname: string,
): string {
  if (
    pathname ===
    "/merchant/onboarding"
  ) {
    return "max-w-[900px]";
  }

  if (
    pathname ===
      "/register" ||
    pathname ===
      "/merchant/sign-up"
  ) {
    return "max-w-[760px]";
  }

  return "max-w-[560px]";
}

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const reduceMotion =
    useReducedMotion();

  const experience =
    getExperience(
      pathname,
    );

  const isMerchant =
    pathname.startsWith(
      "/merchant/",
    );

  const formWidth =
    getFormWidth(
      pathname,
    );

  const cardTheme =
    isMerchant
      ? "dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,10,35,0.98),rgba(24,16,55,0.96))]"
      : "dark:border-white/25 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.985),rgba(245,243,255,0.96))]";

  return (
    <main className="relative isolate min-h-[100svh] overflow-x-clip bg-[#070414]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-[#070414]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 12% 12%, rgba(79,70,229,0.28), transparent 30%), radial-gradient(circle at 86% 18%, rgba(168,85,247,0.30), transparent 31%), radial-gradient(circle at 70% 88%, rgba(79,70,229,0.24), transparent 36%), #070414",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1720px] lg:grid-cols-[minmax(360px,0.88fr)_minmax(560px,1.12fr)]">
        <section className="relative flex min-h-[510px] overflow-hidden border-white/10 px-6 py-7 text-white sm:px-9 sm:py-9 lg:sticky lg:top-0 lg:h-[100svh] lg:min-h-0 lg:self-start lg:border-r xl:px-14 xl:py-11">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, rgba(8,5,28,0.98) 0%, rgba(22,15,63,0.96) 48%, rgba(30,27,75,0.92) 100%)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.17]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
              backgroundSize:
                "46px 46px",
              maskImage:
                "linear-gradient(to bottom, black, transparent 88%)",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 -top-40 h-[31rem] w-[31rem] rounded-full bg-indigo-500/25 blur-[110px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [
                      0,
                      42,
                      0,
                    ],
                    y: [
                      0,
                      28,
                      0,
                    ],
                    scale: [
                      1,
                      1.08,
                      1,
                    ],
                  }
            }
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-48 -right-36 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/20 blur-[120px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [
                      0,
                      -34,
                      0,
                    ],
                    y: [
                      0,
                      -30,
                      0,
                    ],
                    scale: [
                      1,
                      1.1,
                      1,
                    ],
                  }
            }
            transition={{
              duration: 19,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10 flex w-full flex-col">
            <Link
              href="/"
              className="group inline-flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px] border border-white/15 bg-white/10 text-violet-100 shadow-[0_14px_34px_rgba(8,5,28,0.28)] backdrop-blur-xl transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/15">
                <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                <WalletCards className="relative h-5 w-5" />
              </span>

              <span>
                <span className="block text-base font-black tracking-[-0.035em] text-white">
                  Coffer
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.21em] text-violet-200/65">
                  Digital payments
                </span>
              </span>
            </Link>

            <div className="my-auto py-8 sm:py-10 lg:py-6 xl:py-10">
              <motion.div
                initial={
                  reduceMotion
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 0,
                        y: 22,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-violet-100 backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                  {experience.eyebrow}
                </div>

                <h1 className="mt-6 max-w-[650px] text-[2.25rem] font-black leading-[1.03] tracking-[-0.055em] text-white sm:text-[3rem] lg:text-[2.75rem] xl:text-[3.55rem]">
                  {experience.title}{" "}
                  <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                    {experience.highlight}
                  </span>
                </h1>

                <p className="mt-5 max-w-[590px] text-[13px] font-medium leading-7 text-slate-300/90 sm:text-sm">
                  {experience.description}
                </p>
              </motion.div>

              <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {experience.features.map(
                  (
                    feature,
                    index,
                  ) => {
                    const Icon =
                      feature.icon;

                    return (
                      <motion.div
                        key={
                          feature.title
                        }
                        initial={
                          reduceMotion
                            ? {
                                opacity: 0,
                              }
                            : {
                                opacity: 0,
                                y: 16,
                              }
                        }
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            0.12 +
                            index *
                              0.08,
                          duration: 0.5,
                        }}
                        className="rounded-[20px] border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-xl"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/10 text-violet-200">
                          <Icon className="h-4 w-4" />
                        </span>

                        <p className="mt-3 text-[11px] font-extrabold text-white">
                          {feature.title}
                        </p>

                        <p className="mt-1 text-[9px] font-medium leading-4 text-slate-400">
                          {
                            feature.description
                          }
                        </p>
                      </motion.div>
                    );
                  },
                )}
              </div>

              <PaymentScene
                isMerchant={
                  isMerchant
                }
                label={
                  experience.sceneLabel
                }
                status={
                  experience.sceneStatus
                }
                reduceMotion={
                  Boolean(
                    reduceMotion,
                  )
                }
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[9px] font-semibold text-white/45">
              <span>
                © {new Date().getFullYear()} Coffer
              </span>

              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Protected financial access
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-4 py-6 sm:px-7 sm:py-9 lg:px-9 lg:py-11 xl:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize:
                "30px 30px",
              maskImage:
                "linear-gradient(145deg, black, transparent 78%)",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 top-[7%] h-80 w-80 rounded-full bg-fuchsia-400/30 blur-[95px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [
                      0,
                      -46,
                      0,
                    ],
                    y: [
                      0,
                      38,
                      0,
                    ],
                    opacity: [
                      0.42,
                      0.72,
                      0.42,
                    ],
                  }
            }
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-[4%] h-96 w-96 rounded-full bg-cyan-300/20 blur-[110px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [
                      0,
                      54,
                      0,
                    ],
                    y: [
                      0,
                      -40,
                      0,
                    ],
                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div
            className={`relative z-10 w-full ${formWidth}`}
          >
            <div className="mb-4 flex items-center justify-between gap-4 px-1 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-xl">
                {isMerchant ? (
                  <Building2 className="h-3.5 w-3.5 text-fuchsia-200" />
                ) : (
                  <WalletCards className="h-3.5 w-3.5 text-cyan-200" />
                )}
                {
                  experience.accountLabel
                }
              </span>

              <Link
                href="/"
                className="group inline-flex items-center gap-1.5 rounded-lg text-[10px] font-bold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Back home
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <motion.div
              initial={
                reduceMotion
                  ? {
                      opacity: 0,
                    }
                  : {
                      opacity: 0,
                      y: 24,
                      scale: 0.985,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.62,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className={`relative rounded-[30px] border border-white/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.985),rgba(245,243,255,0.96))] p-5 shadow-[0_36px_100px_rgba(20,8,55,0.38),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl sm:p-7 md:p-9 ${cardTheme}`}
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              {children}
            </motion.div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 text-center text-[9px] font-semibold text-white/55 sm:justify-between">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Encrypted session
              </span>

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
  reduceMotion,
}: {
  isMerchant: boolean;
  label: string;
  status: string;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative mt-7 hidden h-[126px] overflow-hidden rounded-[24px] border border-white/10 bg-black/15 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl xl:block">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at center, rgba(167,139,250,0.34), transparent 46%)",
        }}
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

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
          Secure
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [
                    0,
                    -4,
                    0,
                  ],
                }
          }
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.065] px-3 py-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200">
            {isMerchant ? (
              <Code2 className="h-4 w-4" />
            ) : (
              <WalletCards className="h-4 w-4" />
            )}
          </span>

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
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: [
                    0,
                    7,
                    0,
                    -7,
                    0,
                  ],
                }
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/10 text-fuchsia-200"
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
