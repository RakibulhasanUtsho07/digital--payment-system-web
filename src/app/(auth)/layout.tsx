"use client";

import React, {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Fingerprint,
  LogIn,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";

import Navbar from "@/components/shared/Navbar";

/* =========================================================
   TYPES
========================================================= */

type AuthMode =
  | "signin"
  | "signup";

interface HeroFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface HeroContent {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  features: HeroFeature[];
}

/* =========================================================
   CONTENT
========================================================= */

const HERO_CONTENT: Record<
  AuthMode,
  HeroContent
> = {
  signin: {
    badge:
      "Secure Access",

    title:
      "Welcome back.",

    highlight:
      "Your money. Your control.",

    description:
      "Access your digital wallet, manage payments, review transactions and stay in control of your financial activity from one protected workspace.",

    features: [
      {
        icon:
          ShieldCheck,

        title:
          "Secure authentication",

        description:
          "Protected access designed for every session.",
      },

      {
        icon: Zap,

        title:
          "Fast payments",

        description:
          "Move funds through a simple and responsive workflow.",
      },

      {
        icon:
          TrendingUp,

        title:
          "Financial overview",

        description:
          "Track wallet activity and understand your transactions.",
      },
    ],
  },

  signup: {
    badge:
      "Secure Onboarding",

    title:
      "Start smarter.",

    highlight:
      "Build your wallet securely.",

    description:
      "Create your account and access secure payments, transfers, identity verification and modern financial tools from one connected wallet.",

    features: [
      {
        icon:
          ShieldCheck,

        title:
          "Protected wallet",

        description:
          "Security-first account and payment workflows.",
      },

      {
        icon:
          Fingerprint,

        title:
          "Identity verification",

        description:
          "Secure verification built into your onboarding.",
      },

      {
        icon: Zap,

        title:
          "Modern financial tools",

        description:
          "Manage transfers and wallet activity effortlessly.",
      },
    ],
  },
};

/* =========================================================
   GET MODE
========================================================= */

function getMode(
  pathname: string
): AuthMode {
  return pathname.includes(
    "/register"
  )
    ? "signup"
    : "signin";
}

/* =========================================================
   AUTH LAYOUT
========================================================= */

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const routeMode =
    getMode(
      pathname
    );

  const [
    mode,
    setMode,
  ] =
    useState<AuthMode>(
      routeMode
    );

  const isSignIn =
    mode === "signin";

  /* =========================================================
     PREFETCH
  ========================================================== */

  useEffect(() => {
    router.prefetch(
      "/login"
    );

    router.prefetch(
      "/register"
    );
  }, [router]);

  /* =========================================================
     BROWSER BACK/FORWARD SYNC
  ========================================================== */

  useEffect(() => {
    setMode(
      routeMode
    );
  }, [routeMode]);

  /* =========================================================
     SWITCH
  ========================================================== */

  const handleSwitch = (
    nextMode: AuthMode
  ) => {
    if (
      nextMode === mode
    ) {
      return;
    }

    /*
     * Change visual position immediately.
     */
    setMode(
      nextMode
    );

    /*
     * Then change route.
     */
    router.push(
      nextMode ===
        "signin"
        ? "/login"
        : "/register"
    );
  };

  return (
    <>
      <Navbar />

      <main
        className="
          relative

          flex
          min-h-[calc(100dvh-76px)]
          items-center
          justify-center

          overflow-hidden

          bg-[#F3F7FB]

          px-3
          py-6

          sm:px-5

          lg:px-7
          lg:py-8
        "
      >
        {/* =====================================================
            BACKGROUND DECORATION
        ====================================================== */}

        <motion.div
          aria-hidden="true"
          animate={{
            x: [
              0,
              30,
              0,
            ],

            y: [
              0,
              18,
              0,
            ],

            scale: [
              1,
              1.1,
              1,
            ],
          }}
          transition={{
            duration: 15,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="
            pointer-events-none

            absolute
            -left-44
            -top-36

            h-[500px]
            w-[500px]

            rounded-full

            bg-[#1F5EA8]/[0.065]

            blur-[140px]
          "
        />

        <motion.div
          aria-hidden="true"
          animate={{
            x: [
              0,
              -30,
              0,
            ],

            y: [
              0,
              -18,
              0,
            ],

            scale: [
              1,
              1.12,
              1,
            ],
          }}
          transition={{
            duration: 18,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="
            pointer-events-none

            absolute
            -bottom-44
            -right-44

            h-[500px]
            w-[500px]

            rounded-full

            bg-sky-400/[0.07]

            blur-[150px]
          "
        />

        {/* =====================================================
            CENTER WRAPPER
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 22,
            scale:
              0.985,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration:
              0.65,

            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
          className="
            relative
            z-10

            mx-auto

            w-full
            max-w-[1280px]
          "
        >
          {/* ===================================================
              MOBILE AUTH SWITCH
          ==================================================== */}

          <div
            className="
              mb-5

              flex
              justify-center

              lg:hidden
            "
          >
            <AuthSwitch
              isSignIn={
                isSignIn
              }
              onSwitch={
                handleSwitch
              }
            />
          </div>

          {/* ===================================================
              AUTH CARD
          ==================================================== */}

          <div
            className="
              relative

              overflow-hidden

              rounded-[30px]

              border
              border-[#DFE7EF]

              bg-white

              shadow-[0_35px_105px_rgba(17,39,66,0.12)]
            "
          >
            {/* =================================================
                MOBILE
            ================================================== */}

            <div className="lg:hidden">
              <AnimatePresence
                mode="wait"
                initial={
                  false
                }
              >
                <motion.div
                  key={
                    pathname
                  }
                  initial={{
                    opacity: 0,

                    x:
                      routeMode ===
                      "signin"
                        ? -20
                        : 20,

                    filter:
                      "blur(4px)",
                  }}
                  animate={{
                    opacity: 1,

                    x: 0,

                    filter:
                      "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,

                    x:
                      routeMode ===
                      "signin"
                        ? 20
                        : -20,

                    filter:
                      "blur(4px)",
                  }}
                  transition={{
                    duration:
                      0.32,

                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className="
                    relative
                    z-10

                    px-5
                    py-8

                    pointer-events-auto

                    sm:px-8
                    sm:py-10
                  "
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* =================================================
                DESKTOP 50 / 50
            ================================================== */}

            <div
              className="
                hidden

                h-[720px]
                w-full

                lg:flex

                xl:h-[740px]
              "
              style={{
                perspective:
                  "1800px",
              }}
            >
              {/* ===============================================
                  HERO PANEL
              ================================================ */}

              <motion.section
                layout
                initial={false}
                transition={{
                  layout: {
                    type:
                      "spring",

                    stiffness:
                      125,

                    damping:
                      23,

                    mass:
                      0.85,
                  },

                  boxShadow: {
                    duration:
                      0.35,
                  },
                }}
                animate={{
                  scale: 1,

                  boxShadow:
                    isSignIn
                      ? "20px 0 60px rgba(8,26,44,0.06)"
                      : "-20px 0 60px rgba(8,26,44,0.06)",
                }}
                style={{
                  order:
                    isSignIn
                      ? 1
                      : 2,

                  width:
                    "50%",

                  minWidth: 0,

                  position:
                    "relative",

                  zIndex: 10,

                  pointerEvents:
                    "auto",

                  transformStyle:
                    "preserve-3d",
                }}
              >
                <AuthHeroPanel
                  mode={mode}
                />
              </motion.section>

              {/* ===============================================
                  FORM PANEL
              ================================================ */}

              <motion.section
                layout
                initial={false}
                transition={{
                  layout: {
                    type:
                      "spring",

                    stiffness:
                      125,

                    damping:
                      23,

                    mass:
                      0.85,
                  },

                  boxShadow: {
                    duration:
                      0.35,
                  },
                }}
                animate={{
                  scale: 1,

                  boxShadow:
                    isSignIn
                      ? "-20px 0 60px rgba(8,26,44,0.055)"
                      : "20px 0 60px rgba(8,26,44,0.055)",
                }}
                style={{
                  order:
                    isSignIn
                      ? 2
                      : 1,

                  width:
                    "50%",

                  minWidth: 0,

                  position:
                    "relative",

                  zIndex: 20,

                  pointerEvents:
                    "auto",

                  background:
                    "#ffffff",

                  transformStyle:
                    "preserve-3d",
                }}
              >
                {/* =============================================
                    SWITCH
                ============================================== */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-7
                    z-30

                    w-[310px]
                    max-w-[calc(100%-40px)]

                    -translate-x-1/2

                    pointer-events-auto
                  "
                >
                  <AuthSwitch
                    isSignIn={
                      isSignIn
                    }
                    onSwitch={
                      handleSwitch
                    }
                  />
                </div>

                {/* =============================================
                    FORM AREA
                ============================================== */}

                <div
                  className="
                    relative
                    z-20

                    h-full

                    overflow-y-auto

                    px-8
                    pb-10
                    pt-[108px]

                    pointer-events-auto

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden

                    xl:px-12
                  "
                >
                  <div
                    className="
                      mx-auto

                      flex
                      min-h-full
                      w-full
                      max-w-[470px]
                      items-center

                      pointer-events-auto
                    "
                  >
                    <div
                      className="
                        relative
                        z-30
                        w-full
                        pointer-events-auto
                      "
                    >
                      <AnimatePresence
                        mode="wait"
                        initial={
                          false
                        }
                      >
                        <motion.div
                          key={
                            pathname
                          }
                          initial={{
                            opacity: 0,

                            y: 14,

                            scale:
                              0.985,

                            filter:
                              "blur(3px)",
                          }}
                          animate={{
                            opacity: 1,

                            y: 0,

                            scale: 1,

                            filter:
                              "blur(0px)",
                          }}
                          exit={{
                            opacity: 0,

                            y: -10,

                            scale:
                              0.99,

                            filter:
                              "blur(3px)",
                          }}
                          transition={{
                            duration:
                              0.28,

                            ease: [
                              0.22,
                              1,
                              0.36,
                              1,
                            ],
                          }}
                          className="
                            relative
                            z-30
                            pointer-events-auto
                          "
                        >
                          {
                            children
                          }
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          {/* ===================================================
              SECURITY FOOTER
          ==================================================== */}

          <div
            className="
              mt-4

              flex
              items-center
              justify-center
              gap-2

              text-[9px]
              font-semibold
              text-[#8997A6]
            "
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />

            Secure digital wallet authentication
          </div>
        </motion.div>
      </main>
    </>
  );
}

/* =========================================================
   HERO PANEL
========================================================= */

function AuthHeroPanel({
  mode,
}: {
  mode: AuthMode;
}) {
  const content =
    HERO_CONTENT[mode];

  return (
    <div
      className="
        relative

        h-full
        w-full

        overflow-hidden

        bg-[#071321]
      "
    >
      {/* GRID */}

      <div
        className="
          pointer-events-none

          absolute
          inset-0

          bg-[linear-gradient(to_right,rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.024)_1px,transparent_1px)]

          bg-[size:34px_34px]
        "
      />

      {/* GLOW */}

      <motion.div
        aria-hidden="true"
        animate={{
          x: [
            0,
            28,
            0,
          ],

          y: [
            0,
            16,
            0,
          ],

          scale: [
            1,
            1.15,
            1,
          ],

          opacity: [
            0.12,
            0.25,
            0.12,
          ],
        }}
        transition={{
          duration: 10,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none

          absolute
          -left-28
          -top-28

          h-[450px]
          w-[450px]

          rounded-full

          bg-[#1F5EA8]/30

          blur-[130px]
        "
      />

      <motion.div
        aria-hidden="true"
        animate={{
          scale: [
            1,
            1.15,
            1,
          ],

          opacity: [
            0.06,
            0.14,
            0.06,
          ],
        }}
        transition={{
          duration: 12,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none

          absolute
          -bottom-28
          -right-24

          h-[380px]
          w-[380px]

          rounded-full

          bg-sky-400/20

          blur-[115px]
        "
      />

      {/* ORBIT */}

      <motion.div
        aria-hidden="true"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 30,

          repeat:
            Infinity,

          ease:
            "linear",
        }}
        className="
          pointer-events-none

          absolute
          -right-24
          top-20

          h-[220px]
          w-[220px]

          rounded-full

          border
          border-white/[0.04]
        "
      >
        <span
          className="
            absolute
            left-1/2
            top-[-4px]

            h-2
            w-2

            rounded-full

            bg-[#63B4EC]

            shadow-[0_0_14px_rgba(99,180,236,0.8)]
          "
        />
      </motion.div>

      {/* CONTENT */}

      <div
        className="
          relative
          z-10

          flex
          h-full
          flex-col

          px-10
          py-10

          xl:px-14
          xl:py-12
        "
      >
        {/* BRAND */}

        <Link
          href="/"
          className="
            group

            flex
            w-fit
            items-center
            gap-3
          "
        >
          <motion.div
            whileHover={{
              rotate: -5,
              scale: 1.05,
            }}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center

              rounded-[14px]

              border
              border-white/10

              bg-white/[0.07]

              text-[#72BDF0]

              shadow-[0_10px_28px_rgba(0,0,0,0.15)]
            "
          >
            <WalletCards className="h-5 w-5" />
          </motion.div>

          <div>
            <p
              className="
                text-[18px]
                font-black
                tracking-[-0.035em]
                text-white
              "
            >
              Coffer
            </p>

            <p
              className="
                mt-0.5

                text-[8px]
                font-extrabold
                uppercase
                tracking-[0.2em]

                text-[#5CA8DD]
              "
            >
              Digital Wallet
            </p>
          </div>
        </Link>

        {/* MODE CONTENT */}

        <div className="my-auto">
          <AnimatePresence
            mode="wait"
            initial={
              false
            }
          >
            <motion.div
              key={mode}
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -14,
              }}
              transition={{
                duration:
                  0.35,

                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
            >
              {/* BADGE */}

              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  border
                  border-[#438BC4]/25

                  bg-[#1F5EA8]/10

                  px-3
                  py-1.5
                "
              >
                <Sparkles className="h-3.5 w-3.5 text-[#68B9EE]" />

                <span
                  className="
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.16em]

                    text-[#7BC5F3]
                  "
                >
                  {
                    content.badge
                  }
                </span>
              </div>

              {/* TITLE */}

              <h2
                className="
                  mt-6

                  max-w-[470px]

                  text-[36px]
                  font-black
                  leading-[1.08]
                  tracking-[-0.05em]

                  text-white

                  xl:text-[45px]
                "
              >
                {
                  content.title
                }

                <span
                  className="
                    mt-1.5
                    block

                    bg-gradient-to-r
                    from-[#75C8FA]
                    via-[#4898D6]
                    to-[#A6CCEF]

                    bg-clip-text
                    text-transparent
                  "
                >
                  {
                    content.highlight
                  }
                </span>
              </h2>

              {/* DESCRIPTION */}

              <p
                className="
                  mt-5

                  max-w-[455px]

                  text-[13px]
                  font-medium
                  leading-7

                  text-[#94A5B8]
                "
              >
                {
                  content.description
                }
              </p>

              {/* FEATURES */}

              <div className="mt-8 space-y-3">
                {content.features.map(
                  (
                    feature,
                    index
                  ) => {
                    const Icon =
                      feature.icon;

                    return (
                      <motion.div
                        key={
                          feature.title
                        }
                        initial={{
                          opacity: 0,
                          x: -12,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay:
                            0.1 +
                            index *
                              0.06,
                        }}
                        whileHover={{
                          x: 5,
                        }}
                        className="
                          flex

                          max-w-[450px]

                          items-center
                          gap-3

                          rounded-[15px]

                          border
                          border-white/[0.055]

                          bg-white/[0.03]

                          px-3.5
                          py-3

                          transition-colors

                          hover:bg-white/[0.055]
                        "
                      >
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center

                            rounded-[12px]

                            bg-[#1F5EA8]/15

                            text-[#6ABAF0]
                          "
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-[11px] font-extrabold text-white">
                            {
                              feature.title
                            }
                          </p>

                          <p className="mt-0.5 text-[9px] leading-4 text-[#8091A5]">
                            {
                              feature.description
                            }
                          </p>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}

        <div
          className="
            flex
            items-center
            gap-2

            text-[9px]
            font-semibold
            text-[#718196]
          "
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

          Protected account access
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AUTH SWITCH
========================================================= */

function AuthSwitch({
  isSignIn,
  onSwitch,
}: {
  isSignIn: boolean;

  onSwitch: (
    mode: AuthMode
  ) => void;
}) {
  return (
    <div
      className="
        relative

        mx-auto

        w-full
        max-w-[310px]

        pointer-events-auto
      "
    >
      {/* SHADOW */}

      <div
        className="
          pointer-events-none

          absolute
          inset-x-8
          -bottom-3

          h-6

          rounded-full

          bg-[#1F5EA8]/15

          blur-xl
        "
      />

      {/* BODY */}

      <div
        className="
          relative

          grid
          h-[56px]
          grid-cols-2

          overflow-hidden

          rounded-[17px]

          border
          border-[#DCE6EF]

          bg-white/95

          p-1

          shadow-[0_14px_34px_rgba(27,65,104,0.13)]

          backdrop-blur-2xl

          pointer-events-auto
        "
      >
        {/* ACTIVE BACKGROUND */}

        <motion.div
          initial={
            false
          }
          animate={{
            x:
              isSignIn
                ? "0%"
                : "100%",
          }}
          transition={{
            type:
              "spring",

            stiffness:
              420,

            damping:
              32,

            mass:
              0.62,
          }}
          className="
            pointer-events-none

            absolute
            bottom-1
            left-1
            top-1

            w-[calc(50%_-_4px)]

            rounded-[13px]

            bg-gradient-to-br
            from-[#2A73B7]
            via-[#1F5EA8]
            to-[#17466F]

            shadow-[0_9px_23px_rgba(31,94,168,0.28)]
          "
        />

        {/* SIGN IN */}

        <button
          type="button"
          onClick={() =>
            onSwitch(
              "signin"
            )
          }
          className="
            relative
            z-20

            flex
            items-center
            justify-center

            cursor-pointer
            pointer-events-auto
          "
        >
          <div className="flex items-center gap-2">
            <LogIn
              className={`h-4 w-4 ${
                isSignIn
                  ? "text-white"
                  : "text-[#60738A]"
              }`}
            />

            <span
              className={`text-xs font-extrabold ${
                isSignIn
                  ? "text-white"
                  : "text-[#60738A]"
              }`}
            >
              Sign In
            </span>

            {isSignIn && (
              <motion.span
                layoutId="auth-dot"
                className="
                  h-1.5
                  w-1.5

                  rounded-full

                  bg-sky-200

                  shadow-[0_0_9px_rgba(186,230,253,0.95)]
                "
              />
            )}
          </div>
        </button>

        {/* SIGN UP */}

        <button
          type="button"
          onClick={() =>
            onSwitch(
              "signup"
            )
          }
          className="
            relative
            z-20

            flex
            items-center
            justify-center

            cursor-pointer
            pointer-events-auto
          "
        >
          <div className="flex items-center gap-2">
            <UserPlus
              className={`h-4 w-4 ${
                !isSignIn
                  ? "text-white"
                  : "text-[#60738A]"
              }`}
            />

            <span
              className={`text-xs font-extrabold ${
                !isSignIn
                  ? "text-white"
                  : "text-[#60738A]"
              }`}
            >
              Sign Up
            </span>

            {!isSignIn && (
              <motion.span
                layoutId="auth-dot"
                className="
                  h-1.5
                  w-1.5

                  rounded-full

                  bg-sky-200

                  shadow-[0_0_9px_rgba(186,230,253,0.95)]
                "
              />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}