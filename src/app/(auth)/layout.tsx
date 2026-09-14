"use client";

import {
  type ReactNode,
  useEffect,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  Building2,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  UserPlus,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type AccountMode =
  | "user"
  | "merchant";

type AuthView =
  | "signin"
  | "signup";

const themes = {
  user: {
    accent: "#4F46E5",
    background:
      "linear-gradient(135deg, #0F172A 0%, #1E1B4B 52%, #312E81 100%)",
    glowOne:
      "rgba(99,102,241,0.28)",
    glowTwo:
      "rgba(56,189,248,0.12)",
  },

  merchant: {
    accent: "#7C3AED",
    background:
      "linear-gradient(135deg, #170B29 0%, #31145B 52%, #581C87 100%)",
    glowOne:
      "rgba(168,85,247,0.25)",
    glowTwo:
      "rgba(236,72,153,0.10)",
  },
} satisfies Record<
  AccountMode,
  {
    accent: string;
    background: string;
    glowOne: string;
    glowTwo: string;
  }
>;

function getAccountMode(
  pathname: string
): AccountMode {
  return pathname.startsWith(
    "/merchant/"
  )
    ? "merchant"
    : "user";
}

function getAuthView(
  pathname: string
): AuthView {
  return pathname ===
      "/register" ||
    pathname.endsWith(
      "/sign-up"
    )
    ? "signup"
    : "signin";
}

function getRoute(
  account: AccountMode,
  view: AuthView
): string {
  if (
    account ===
    "merchant"
  ) {
    return view ===
      "signin"
      ? "/merchant/sign-in"
      : "/merchant/sign-up";
  }

  return view ===
    "signin"
    ? "/login"
    : "/register";
}

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const reduceMotion =
    useReducedMotion();

  const account =
    getAccountMode(
      pathname
    );

  const view =
    getAuthView(
      pathname
    );

  const onboarding =
    pathname ===
    "/merchant/onboarding";

  const theme =
    themes[account];

  useEffect(() => {
    [
      "/login",
      "/register",
      "/merchant/sign-in",
      "/merchant/sign-up",
      "/merchant/onboarding",
    ].forEach(
      (route) => {
        router.prefetch(
          route
        );
      }
    );
  }, [router]);

  const width =
    onboarding
      ? "max-w-5xl"
      : view ===
          "signup"
        ? "max-w-2xl"
        : "max-w-xl";

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-slate-950 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <AnimatePresence
        initial={false}
      >
        <motion.div
          key={account}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              theme.background,
          }}
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration:
              reduceMotion
                ? 0.15
                : 0.62,
            ease:
              "easeInOut",
          }}
        />
      </AnimatePresence>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize:
            "42px 42px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 -top-36 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            theme.glowOne,
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [
                  0,
                  34,
                  0,
                ],
                y: [
                  0,
                  22,
                  0,
                ],
              }
        }
        transition={{
          duration: 14,
          repeat: Infinity,
          ease:
            "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-44 -right-28 h-[32rem] w-[32rem] rounded-full blur-3xl"
        style={{
          background:
            theme.glowTwo,
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [
                  0,
                  -30,
                  0,
                ],
                y: [
                  0,
                  -20,
                  0,
                ],
              }
        }
        transition={{
          duration: 17,
          repeat: Infinity,
          ease:
            "easeInOut",
        }}
      />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-xl transition group-hover:bg-white/15">
            <WalletCards className="h-5 w-5" />
          </span>

          <span>
            <span className="block text-base font-black tracking-[-0.03em] text-white">
              Coffer
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
              Digital wallet
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[10px] font-bold text-white/70 backdrop-blur-xl sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          Secure authentication
        </div>
      </header>

      <section
        className={`relative z-10 mx-auto mt-5 w-full ${width} sm:mt-7`}
      >
        <div
          className="relative"
          style={{
            perspective:
              "1500px",
          }}
        >
          <div className="pointer-events-none absolute inset-x-10 -bottom-5 h-12 rounded-full bg-black/40 blur-2xl" />

          <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.97] shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl dark:bg-slate-950/[0.96]">
            {onboarding ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/85 px-5 py-4 dark:border-white/10 dark:bg-white/[0.035] sm:px-7">
                <span className="inline-flex items-center gap-2 text-xs font-black text-violet-700 dark:text-violet-300">
                  <Building2 className="h-4 w-4" />
                  Merchant onboarding
                </span>

                <Link
                  href="/merchant/sign-in"
                  className="text-[11px] font-extrabold text-slate-500 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300"
                >
                  Use another account
                </Link>
              </div>
            ) : (
              <div className="border-b border-slate-200/80 bg-slate-50/85 px-4 py-4 dark:border-white/10 dark:bg-white/[0.035] sm:px-6">
                <SegmentedControl
                  ariaLabel="Account type"
                  accent={
                    theme.accent
                  }
                  options={[
                    {
                      active:
                        account ===
                        "user",
                      icon:
                        UserRound,
                      label:
                        "Personal Wallet",
                      onClick: () => {
                        router.push(
                          getRoute(
                            "user",
                            view
                          )
                        );
                      },
                    },
                    {
                      active:
                        account ===
                        "merchant",
                      icon:
                        Building2,
                      label:
                        "Merchant Business",
                      onClick: () => {
                        router.push(
                          getRoute(
                            "merchant",
                            view
                          )
                        );
                      },
                    },
                  ]}
                />

                <div className="mt-3">
                  <SegmentedControl
                    ariaLabel="Authentication action"
                    accent={
                      theme.accent
                    }
                    subtle
                    options={[
                      {
                        active:
                          view ===
                          "signin",
                        icon: LogIn,
                        label:
                          "Sign In",
                        onClick: () => {
                          router.push(
                            getRoute(
                              account,
                              "signin"
                            )
                          );
                        },
                      },
                      {
                        active:
                          view ===
                          "signup",
                        icon:
                          UserPlus,
                        label:
                          "Sign Up",
                        onClick: () => {
                          router.push(
                            getRoute(
                              account,
                              "signup"
                            )
                          );
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            )}

            <div className="relative p-5 sm:p-7 md:p-9">
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={pathname}
                  initial={
                    reduceMotion
                      ? {
                          opacity: 0,
                        }
                      : {
                          opacity: 0,
                          rotateY:
                            view ===
                            "signin"
                              ? -76
                              : 76,
                          scale: 0.985,
                        }
                  }
                  animate={{
                    opacity: 1,
                    rotateY: 0,
                    scale: 1,
                  }}
                  exit={
                    reduceMotion
                      ? {
                          opacity: 0,
                        }
                      : {
                          opacity: 0,
                          rotateY:
                            view ===
                            "signin"
                              ? 76
                              : -76,
                          scale: 0.985,
                        }
                  }
                  transition={{
                    duration:
                      reduceMotion
                        ? 0.16
                        : 0.5,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  style={{
                    backfaceVisibility:
                      "hidden",
                    transformStyle:
                      "preserve-3d",
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-6 flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-[10px] font-semibold text-white/55 sm:flex-row sm:text-left">
        <span>
          © {new Date().getFullYear()} Coffer. Protected financial access.
        </span>

        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          Encrypted session · HttpOnly authentication
        </span>
      </footer>
    </main>
  );
}

interface SegmentOption {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function SegmentedControl({
  ariaLabel,
  accent,
  options,
  subtle = false,
}: {
  ariaLabel: string;
  accent: string;
  options: [
    SegmentOption,
    SegmentOption,
  ];
  subtle?: boolean;
}) {
  const activeIndex =
    options[1].active
      ? 1
      : 0;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative grid grid-cols-2 p-1 ${
        subtle
          ? "h-11 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
          : "h-12 rounded-2xl bg-slate-200/70 dark:bg-white/[0.07]"
      }`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl shadow-sm"
        animate={{
          x:
            activeIndex === 0
              ? 4
              : "calc(100% + 4px)",
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 34,
        }}
        style={{
          background:
            subtle
              ? `${accent}18`
              : accent,
        }}
      />

      {options.map(
        ({
          active,
          icon: Icon,
          label,
          onClick,
        }) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`relative z-10 inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-[11px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 sm:text-xs ${
              active
                ? subtle
                  ? "text-slate-950 dark:text-white"
                  : "text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            style={
              active &&
              subtle
                ? {
                    color:
                      accent,
                  }
                : undefined
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {label}
            </span>
          </button>
        )
      )}
    </div>
  );
}
