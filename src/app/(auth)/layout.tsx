"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const mode: AuthMode = pathname.includes("/register")
    ? "signup"
    : "signin";

  const isSignIn = mode === "signin";

  const handleSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode) return;

    router.push(
      nextMode === "signin"
        ? "/login"
        : "/register"
    );
  };

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px]">

        {/* =====================================================
            TOP AUTH SWITCH
        ====================================================== */}
        <div className="mb-7 flex justify-center lg:mb-9">
          <div className="relative w-full max-w-[360px]">
            {/* soft shadow / depth */}
            <div className="pointer-events-none absolute inset-x-8 bottom-[-8px] h-5 rounded-full bg-[#1F5EA8]/10 blur-xl" />

            <div className="relative rounded-full border border-white/80 bg-white/65 p-1.5 shadow-[0_10px_35px_rgba(23,54,93,0.08)] backdrop-blur-xl">

              {/* =================================================
                  MOVING 3D ACTIVE PILL
              ================================================== */}
              <motion.div
                initial={false}
                animate={{
                  left: isSignIn
                    ? "6px"
                    : "calc(50% + 0px)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 28,
                  mass: 0.65,
                }}
                className="absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-br from-[#2A72B9] via-[#1F5EA8] to-[#17466F] shadow-[0_8px_20px_rgba(31,94,168,0.28)]"
              >
                {/* top highlight */}
                <div className="pointer-events-none absolute left-4 right-4 top-1 h-px rounded-full bg-white/30" />

                {/* inner glow */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-white/[0.04]" />
              </motion.div>

              {/* SIGN IN */}
              <button
                type="button"
                onClick={() => handleSwitch("signin")}
                className="relative z-10 flex h-12 w-1/2 items-center justify-center gap-2 rounded-full"
              >
                <motion.div
                  animate={{
                    scale: isSignIn ? 1 : 0.92,
                    opacity: isSignIn ? 1 : 0.7,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-center gap-2"
                >
                  <LogIn
                    className={`h-4 w-4 ${
                      isSignIn
                        ? "text-white"
                        : "text-[#718095]"
                    }`}
                  />

                  <span
                    className={`text-sm font-bold ${
                      isSignIn
                        ? "text-white"
                        : "text-[#718095]"
                    }`}
                  >
                    Sign In
                  </span>

                  {isSignIn && (
                    <motion.span
                      layoutId="auth-active-dot"
                      className="h-1.5 w-1.5 rounded-full bg-[#B9E5FF] shadow-[0_0_10px_rgba(185,229,255,0.9)]"
                    />
                  )}
                </motion.div>
              </button>

              {/* SIGN UP */}
              <button
                type="button"
                onClick={() => handleSwitch("signup")}
                className="relative z-10 -mt-12 ml-[50%] flex h-12 w-1/2 items-center justify-center gap-2 rounded-full"
              >
                <motion.div
                  animate={{
                    scale: !isSignIn ? 1 : 0.92,
                    opacity: !isSignIn ? 1 : 0.7,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-center gap-2"
                >
                  <UserPlus
                    className={`h-4 w-4 ${
                      !isSignIn
                        ? "text-white"
                        : "text-[#718095]"
                    }`}
                  />

                  <span
                    className={`text-sm font-bold ${
                      !isSignIn
                        ? "text-white"
                        : "text-[#718095]"
                    }`}
                  >
                    Sign Up
                  </span>

                  {!isSignIn && (
                    <motion.span
                      layoutId="auth-active-dot"
                      className="h-1.5 w-1.5 rounded-full bg-[#B9E5FF] shadow-[0_0_10px_rgba(185,229,255,0.9)]"
                    />
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            AUTH CONTENT
        ====================================================== */}
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_100px_rgba(23,54,93,0.11)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{
                opacity: 0,
                x: isSignIn ? 18 : -18,
                filter: "blur(3px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                x: isSignIn ? -18 : 18,
                filter: "blur(3px)",
              }}
              transition={{
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* =====================================================
            SMALL SECURITY FOOTER
        ====================================================== */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-medium text-[#96A3B2]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Secure digital wallet authentication
        </div>
      </div>
    </main>
  );
}