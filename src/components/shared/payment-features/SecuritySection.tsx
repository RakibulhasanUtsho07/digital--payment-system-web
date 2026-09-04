"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

type SecurityTone = "violet" | "emerald" | "sky";

type SecurityControl = {
  icon: LucideIcon;
  title: string;
  copy: string;
  tone: SecurityTone;
};

const controls: SecurityControl[] = [
  {
    icon: KeyRound,
    title: "Authenticated sessions",
    copy: "Protected routes verify account access instead of relying only on hidden UI controls.",
    tone: "violet",
  },
  {
    icon: UserCheck,
    title: "Role-aware permissions",
    copy: "User and admin actions remain separated through server-side authorization checks.",
    tone: "emerald",
  },
  {
    icon: Fingerprint,
    title: "Verification visibility",
    copy: "KYC state stays visible so restricted wallet actions have a clear explanation.",
    tone: "sky",
  },
];

const orbitIcons: Array<{
  icon: LucideIcon;
  angle: number;
  tone: SecurityTone;
  label: string;
}> = [
  {
    icon: KeyRound,
    angle: -90,
    tone: "violet",
    label: "Authenticated sessions",
  },
  {
    icon: UserCheck,
    angle: 30,
    tone: "emerald",
    label: "Role-aware permissions",
  },
  {
    icon: Fingerprint,
    angle: 150,
    tone: "sky",
    label: "Verification visibility",
  },
];

const toneClass: Record<SecurityTone, string> = {
  violet:
    "border-violet-300/30 bg-[#140c2c]/90 text-violet-300 shadow-[0_0_30px_rgba(139,92,246,.35)]",
  emerald:
    "border-emerald-300/30 bg-[#0d1d1c]/90 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,.3)]",
  sky:
    "border-sky-300/30 bg-[#0b1a2a]/90 text-sky-300 shadow-[0_0_30px_rgba(56,189,248,.3)]",
};

const controlToneClass: Record<SecurityTone, string> = {
  violet:
    "bg-violet-400/10 text-violet-300 group-hover:bg-violet-400/20",
  emerald:
    "bg-emerald-400/10 text-emerald-300 group-hover:bg-emerald-400/20",
  sky:
    "bg-sky-400/10 text-sky-300 group-hover:bg-sky-400/20",
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function SecuritySection({
  rootRef,
  visible,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="security"
      ref={rootRef}
      className="relative left-1/2 isolate flex min-h-screen w-[100dvw] -translate-x-1/2 scroll-mt-24 items-center overflow-hidden bg-[#0b0718] py-28 text-white sm:py-32 lg:py-40"
    >
      {/* Dotted background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-30 opacity-30 [background-image:radial-gradient(rgba(167,139,250,.55)_1px,transparent_1px)] [background-size:25px_25px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
      />

      {/* Animated violet background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[80vw] max-h-[900px] w-[80vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          className="h-full w-full rounded-full bg-violet-600/20 blur-[160px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.12, 1],
                  opacity: [0.55, 0.85, 0.55],
                }
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Sky glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/3 -z-20 h-80 w-80 rounded-full bg-sky-500/10 blur-[130px]"
      />

      {/* Emerald glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-1/4 -z-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[130px]"
      />

      {/* Background security animation */}
      <SecurityOrbit
        visible={visible}
        reduceMotion={Boolean(reduceMotion)}
      />

      {/* Text readability layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(11,7,24,.25)_0%,rgba(11,7,24,.48)_42%,rgba(11,7,24,.92)_82%)]"
      />

      {/* max-w-7xl content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={visible ? "show" : "hidden"}
        className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-center px-5 text-center sm:px-8 lg:px-12"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-[#0b0718]/65 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 shadow-[0_10px_40px_rgba(0,0,0,.25)] backdrop-blur-xl sm:text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>

          <ShieldCheck className="h-4 w-4" />

          Security architecture
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="mt-7 max-w-5xl text-[clamp(2.8rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.07em]"
        >
          Security should be

          <span className="block font-serif font-normal italic text-violet-300">
            visible, not mysterious.
          </span>
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="mt-8 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8 lg:text-lg"
        >
          Coffer connects protected backend decisions with clear account
          status, verification cues and understandable feedback.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <StatusPill
            label="Session"
            value="Authenticated"
            tone="emerald"
          />

          <StatusPill
            label="Permission"
            value="Role checked"
            tone="violet"
          />

          <StatusPill
            label="Verification"
            value="Status visible"
            tone="sky"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="mt-14 grid w-full gap-4 md:grid-cols-3 lg:gap-5"
        >
          {controls.map(
            ({
              icon: Icon,
              title,
              copy,
              tone,
            }) => (
              <motion.article
                key={title}
                variants={itemVariants}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -8,
                        scale: 1.015,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0718]/70 p-6 text-left shadow-[0_25px_80px_rgba(0,0,0,.3)] backdrop-blur-2xl transition-colors duration-500 hover:border-violet-400/35 hover:bg-[#140d29]/80 sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet-500/0 blur-3xl transition-colors duration-500 group-hover:bg-violet-500/15"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] transition duration-500 group-hover:rotate-[-6deg] group-hover:scale-110 ${controlToneClass[tone]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <ArrowIndicator />
                </div>

                <h3 className="relative mt-7 text-lg font-black tracking-[-0.02em]">
                  {title}
                </h3>

                <p className="relative mt-3 text-sm leading-7 text-white/50">
                  {copy}
                </p>

                <span className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-violet-500 via-violet-300 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </motion.article>
            )
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

function SecurityOrbit({
  visible,
  reduceMotion,
}: {
  visible: boolean;
  reduceMotion: boolean;
}) {
  return (
    /*
     * Static outer wrapper handles centering.
     * Animated inner wrapper handles scale/opacity.
     * This prevents Framer Motion from overwriting translate transforms.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.86,
        }}
        animate={
          visible
            ? {
                opacity: 1,
                scale: 1,
              }
            : {
                opacity: 0,
                scale: 0.86,
              }
        }
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative h-full w-full"
      >
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white/[0.08]"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 85,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_25px_rgba(196,181,253,.9)]" />

          <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_20px_rgba(125,211,252,.8)]" />
        </motion.div>

        {/* Dashed orbit ring */}
        <motion.div
          className="absolute inset-[10%] rounded-full border border-dashed border-violet-300/25"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 46,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute inset-[24%] rounded-full border border-white/[0.08]"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: -360,
                }
          }
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="absolute right-[8%] top-[22%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,.9)]" />
        </motion.div>

        {/* Primary radar sweep */}
        <motion.div
          className="absolute inset-[3%] rounded-full opacity-45"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(167,139,250,.38), transparent 17%, transparent 100%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Secondary radar sweep */}
        <motion.div
          className="absolute inset-[16%] rounded-full opacity-25"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(56,189,248,.3), transparent 15%, transparent 100%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: -360,
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Orbiting icons */}
        <motion.div
          className="absolute inset-[10%]"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {orbitIcons.map(
            ({
              icon: Icon,
              angle,
              tone,
              label,
            }) => {
              const left =
                50 +
                50 *
                  Math.cos(
                    (angle * Math.PI) / 180
                  );

              const top =
                50 +
                50 *
                  Math.sin(
                    (angle * Math.PI) / 180
                  );

              return (
                /*
                 * Outer span positions the icon.
                 * Inner motion span counter-rotates it.
                 */
                <span
                  key={label}
                  title={label}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <motion.span
                    className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur-xl sm:h-13 sm:w-13 ${toneClass[tone]}`}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            rotate: -360,
                          }
                    }
                    transition={{
                      duration: 28,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.span>
                </span>
              );
            }
          )}
        </motion.div>

        {/* First pulse ring */}
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-48 sm:w-48">
          <motion.div
            className="h-full w-full rounded-full border border-violet-300/25"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.35],
                    opacity: [0.55, 0],
                  }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>

        {/* Second pulse ring */}
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-48 sm:w-48">
          <motion.div
            className="h-full w-full rounded-full border border-violet-300/20"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.35],
                    opacity: [0.55, 0],
                  }
            }
            transition={{
              duration: 3,
              delay: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>

        {/* Center lock wrapper */}
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 sm:h-40 sm:w-40">
          <motion.div
            className="grid h-full w-full place-items-center rounded-[34px] border border-violet-300/25 bg-violet-500/10 opacity-70 shadow-[0_0_110px_rgba(139,92,246,.65)] backdrop-blur-xl sm:rounded-[44px]"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 70px rgba(139,92,246,.35)",
                      "0 0 130px rgba(139,92,246,.7)",
                      "0 0 70px rgba(139,92,246,.35)",
                    ],
                  }
            }
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <LockKeyhole className="h-11 w-11 text-violet-200 sm:h-16 sm:w-16" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SecurityTone;
}) {
  const dotClass: Record<SecurityTone, string> = {
    violet:
      "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,.8)]",
    emerald:
      "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]",
    sky:
      "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,.8)]",
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0b0718]/65 px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,.25)] backdrop-blur-xl">
      <span
        className={`h-2 w-2 rounded-full ${dotClass[tone]}`}
      />

      <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </span>

      <span className="text-[10px] font-black text-white/85">
        {value}
      </span>
    </div>
  );
}

function ArrowIndicator() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-xs text-white/35 transition duration-500 group-hover:rotate-45 group-hover:border-violet-300/30 group-hover:bg-violet-500/15 group-hover:text-violet-200">
      ↗
    </span>
  );
}