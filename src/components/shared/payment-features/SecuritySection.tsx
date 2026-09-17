"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  Sparkles,
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
    copy: "User and admin actions stay separated through server-side authorization checks.",
    tone: "emerald",
  },
  {
    icon: Fingerprint,
    title: "Verification visibility",
    copy: "KYC state stays visible so restricted wallet actions always have a clear explanation.",
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

/* =========================================================
   TONE CLASSES
========================================================= */

const toneClass: Record<SecurityTone, string> = {
  violet:
    "border-violet-300/30 bg-violet-950/70 text-violet-200 shadow-[0_0_34px_rgba(139,92,246,.35)]",

  emerald:
    "border-emerald-300/30 bg-emerald-950/60 text-emerald-200 shadow-[0_0_34px_rgba(16,185,129,.24)]",

  sky:
    "border-sky-300/30 bg-sky-950/60 text-sky-200 shadow-[0_0_34px_rgba(56,189,248,.24)]",
};

const controlToneClass: Record<SecurityTone, string> = {
  violet:
    "bg-violet-500/10 text-violet-300 group-hover:bg-violet-500/20",

  emerald:
    "bg-emerald-500/10 text-emerald-300 group-hover:bg-emerald-500/20",

  sky:
    "bg-sky-500/10 text-sky-300 group-hover:bg-sky-500/20",
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },

  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* =========================================================
   SECURITY SECTION
========================================================= */

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
      className="
        relative
        left-1/2
        isolate
        flex
        min-h-screen
        w-[100dvw]
        -translate-x-1/2
        scroll-mt-24
        items-center
        overflow-hidden
        bg-[#070510]
        py-24
        text-white
        sm:py-28
        lg:py-32
      "
    >
      {/* =====================================================
          BACKGROUND FOUNDATION
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-40
          bg-[radial-gradient(circle_at_50%_20%,rgba(109,40,217,.28),transparent_34%),radial-gradient(circle_at_15%_45%,rgba(37,99,235,.14),transparent_28%),radial-gradient(circle_at_88%_68%,rgba(124,58,237,.16),transparent_30%),linear-gradient(180deg,#090616_0%,#070510_55%,#05040d_100%)]
        "
      />

      {/* =====================================================
          INDIGO / VIOLET ATMOSPHERE
      ===================================================== */}

      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          top-[-120px]
          -z-30
          h-[520px]
          w-[520px]
          rounded-full
          bg-indigo-600/18
          blur-[130px]
        "
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 30, 0],
                y: [0, 20, 0],
                opacity: [0.45, 0.7, 0.45],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-36
          top-1/4
          -z-30
          h-[500px]
          w-[500px]
          rounded-full
          bg-violet-600/20
          blur-[140px]
        "
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -24, 0],
                y: [0, 30, 0],
                opacity: [0.35, 0.6, 0.35],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-[-220px]
          left-1/2
          -z-30
          h-[620px]
          w-[620px]
          -translate-x-1/2
          rounded-full
          bg-indigo-500/12
          blur-[150px]
        "
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =====================================================
          SUBTLE TECH GRID
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-20
          opacity-25
          [background-image:linear-gradient(rgba(139,92,246,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,.09)_1px,transparent_1px)]
          [background-size:45px_45px]
          [mask-image:radial-gradient(ellipse_at_center,black_5%,transparent_80%)]
        "
      />

      {/* =====================================================
          SOFT VIGNETTE
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(7,5,16,.22)_45%,rgba(7,5,16,.88)_100%)]
        "
      />

      {/* =====================================================
          SECURITY ORBIT
      ===================================================== */}

      <SecurityOrbit
        visible={visible}
        reduceMotion={Boolean(reduceMotion)}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={visible ? "show" : "hidden"}
        className="
          relative
          z-20
          mx-auto
          flex
          w-full
          max-w-7xl
          flex-col
          items-center
          px-5
          text-center
          sm:px-8
          lg:px-12
        "
      >
        {/* Badge */}

        <motion.div
          variants={itemVariants}
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-violet-300/20
            bg-violet-950/30
            px-4
            py-2
            text-[10px]
            font-black
            uppercase
            tracking-[0.2em]
            text-violet-200
            shadow-[0_12px_40px_rgba(76,29,149,.22)]
            backdrop-blur-xl
            sm:text-xs
          "
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>

          <ShieldCheck className="h-4 w-4 text-violet-300" />

          Security architecture
        </motion.div>

        {/* Heading */}

        <motion.h2
          variants={itemVariants}
          className="
            mt-7
            max-w-5xl
            text-[clamp(2.8rem,7vw,7rem)]
            font-black
            leading-[0.9]
            tracking-[-0.07em]
            text-white
          "
        >
          Security should be

          <span
            className="
              mt-2
              block
              bg-gradient-to-r
              from-violet-200
              via-violet-400
              to-indigo-300
              bg-clip-text
              font-serif
              font-normal
              italic
              text-transparent
            "
          >
            visible, not mysterious.
          </span>
        </motion.h2>

        {/* Description */}

        <motion.p
          variants={itemVariants}
          className="
            mt-7
            max-w-2xl
            text-sm
            leading-7
            text-white/55
            sm:text-base
            sm:leading-8
            lg:text-lg
          "
        >
          Coffer connects protected backend decisions with clear account
          status, verification cues and understandable feedback.
        </motion.p>

        {/* Status pills */}

        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
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

        {/* ===================================================
            SECURITY CARDS
        ==================================================== */}

        <motion.div
          variants={containerVariants}
          className="
            mt-12
            grid
            w-full
            gap-4
            md:grid-cols-3
            lg:mt-14
            lg:gap-5
          "
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
                        y: -7,
                        scale: 1.012,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-white/[0.09]
                  bg-gradient-to-br
                  from-white/[0.075]
                  via-violet-950/[0.20]
                  to-indigo-950/[0.12]
                  p-6
                  text-left
                  shadow-[0_28px_90px_rgba(0,0,0,.34)]
                  backdrop-blur-2xl
                  transition-all
                  duration-500
                  hover:border-violet-300/30
                  hover:shadow-[0_30px_100px_rgba(76,29,149,.22)]
                  sm:p-7
                "
              >
                {/* card glow */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-20
                    -top-20
                    h-44
                    w-44
                    rounded-full
                    bg-violet-500/0
                    blur-3xl
                    transition-all
                    duration-700
                    group-hover:bg-violet-500/16
                  "
                />

                {/* top line */}

                <div
                  aria-hidden="true"
                  className="
                    absolute
                    inset-x-8
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-violet-300/30
                    to-transparent
                  "
                />

                <div className="relative flex items-start justify-between gap-4">
                  <motion.span
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            rotate: -7,
                            scale: 1.08,
                          }
                    }
                    className={`
                      grid
                      h-12
                      w-12
                      shrink-0
                      place-items-center
                      rounded-[17px]
                      border
                      border-white/[0.08]
                      transition
                      duration-500
                      ${controlToneClass[tone]}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>

                  <ArrowIndicator />
                </div>

                <h3 className="relative mt-7 text-lg font-black tracking-[-0.025em] text-white">
                  {title}
                </h3>

                <p className="relative mt-3 text-sm leading-7 text-white/50">
                  {copy}
                </p>

                <div
                  aria-hidden="true"
                  className="
                    relative
                    mt-6
                    h-px
                    w-full
                    origin-left
                    scale-x-0
                    bg-gradient-to-r
                    from-violet-400
                    via-indigo-300
                    to-transparent
                    transition-transform
                    duration-500
                    group-hover:scale-x-100
                  "
                />

                <div className="relative mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/25 transition group-hover:text-violet-200/60">
                  <Sparkles className="h-3 w-3" />
                  Security control
                </div>
              </motion.article>
            )
          )}
        </motion.div>

        {/* ===================================================
            BOTTOM SECURITY MESSAGE
        ==================================================== */}

        <motion.div
          variants={itemVariants}
          className="
            mt-7
            flex
            max-w-3xl
            flex-col
            items-center
            justify-center
            gap-3
            rounded-[24px]
            border
            border-violet-300/10
            bg-violet-950/20
            px-5
            py-4
            shadow-[0_15px_55px_rgba(76,29,149,.12)]
            backdrop-blur-xl
            sm:flex-row
          "
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <LockKeyhole className="h-4 w-4" />
          </div>

          <p className="text-center text-[10px] leading-5 text-white/40 sm:text-left">
            Security is not hidden behind the interface — it is reflected in
            authentication, authorization and verification throughout the
            Coffer experience.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* =========================================================
   SECURITY ORBIT
========================================================= */

function SecurityOrbit({
  visible,
  reduceMotion,
}: {
  visible: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        -z-5
        aspect-square
        w-[min(96vw,960px)]
        -translate-x-1/2
        -translate-y-1/2
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.82,
        }}
        animate={
          visible
            ? {
                opacity: 1,
                scale: 1,
              }
            : {
                opacity: 0,
                scale: 0.82,
              }
        }
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative h-full w-full"
      >
        {/* ===================================================
            CENTRAL GLOW
        ==================================================== */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-72
            w-72
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-violet-600/10
            blur-[95px]
          "
        />

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-52
            w-52
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-indigo-500/10
            blur-[60px]
          "
        />

        {/* ===================================================
            OUTER RING
        ==================================================== */}

        <motion.div
          className="
            absolute
            inset-0
            rounded-full
            border
            border-violet-300/[0.09]
          "
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 90,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span
            className="
              absolute
              left-1/2
              top-0
              h-2.5
              w-2.5
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-violet-300
              shadow-[0_0_28px_rgba(196,181,253,.95)]
            "
          />

          <span
            className="
              absolute
              bottom-0
              left-1/2
              h-2
              w-2
              -translate-x-1/2
              translate-y-1/2
              rounded-full
              bg-indigo-300
              shadow-[0_0_25px_rgba(165,180,252,.9)]
            "
          />
        </motion.div>

        {/* ===================================================
            INNER DASHED RING
        ==================================================== */}

        <motion.div
          className="
            absolute
            inset-[9%]
            rounded-full
            border
            border-dashed
            border-violet-300/20
          "
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 52,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* ===================================================
            MIDDLE RING
        ==================================================== */}

        <motion.div
          className="
            absolute
            inset-[22%]
            rounded-full
            border
            border-indigo-300/[0.10]
          "
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: -360,
                }
          }
          transition={{
            duration: 37,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="absolute right-[7%] top-[22%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,.95)]" />

          <span className="absolute bottom-[18%] left-[12%] h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_20px_rgba(196,181,253,.8)]" />
        </motion.div>

        {/* ===================================================
            RADAR
        ==================================================== */}

        <motion.div
          className="
            absolute
            inset-[2%]
            rounded-full
            opacity-45
          "
          style={{
            background:
              "conic-gradient(from 0deg, rgba(139,92,246,.34), transparent 18%, transparent 100%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="
            absolute
            inset-[15%]
            rounded-full
            opacity-25
          "
          style={{
            background:
              "conic-gradient(from 180deg, rgba(99,102,241,.34), transparent 16%, transparent 100%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: -360,
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* ===================================================
            ORBITING ICONS
        ==================================================== */}

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
            duration: 30,
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
                <span
                  key={label}
                  title={label}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  className="
                    absolute
                    -translate-x-1/2
                    -translate-y-1/2
                  "
                >
                  <motion.span
                    className={`
                      grid
                      h-11
                      w-11
                      place-items-center
                      rounded-full
                      border
                      backdrop-blur-xl
                      sm:h-13
                      sm:w-13
                      ${toneClass[tone]}
                    `}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            rotate: -360,
                          }
                    }
                    transition={{
                      duration: 30,
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

        {/* ===================================================
            PULSE RINGS
        ==================================================== */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-36
            w-36
            -translate-x-1/2
            -translate-y-1/2
            sm:h-48
            sm:w-48
          "
        >
          <motion.div
            className="h-full w-full rounded-full border border-violet-300/25"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.4],
                    opacity: [0.5, 0],
                  }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-36
            w-36
            -translate-x-1/2
            -translate-y-1/2
            sm:h-48
            sm:w-48
          "
        >
          <motion.div
            className="h-full w-full rounded-full border border-indigo-300/20"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.4],
                    opacity: [0.5, 0],
                  }
            }
            transition={{
              duration: 3.2,
              delay: 1.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>

        {/* ===================================================
            CENTER SECURITY CORE
        ==================================================== */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-28
            w-28
            -translate-x-1/2
            -translate-y-1/2
            sm:h-40
            sm:w-40
          "
        >
          <motion.div
            className="
              grid
              h-full
              w-full
              place-items-center
              rounded-[34px]
              border
              border-violet-300/25
              bg-gradient-to-br
              from-violet-500/20
              via-indigo-500/10
              to-transparent
              shadow-[0_0_100px_rgba(139,92,246,.45)]
              backdrop-blur-2xl
              sm:rounded-[44px]
            "
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 75px rgba(139,92,246,.35)",
                      "0 0 145px rgba(139,92,246,.68)",
                      "0 0 75px rgba(139,92,246,.35)",
                    ],
                  }
            }
            transition={{
              duration: 3.6,
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

/* =========================================================
   STATUS PILL
========================================================= */

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
      "bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,.9)]",

    emerald:
      "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,.9)]",

    sky:
      "bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,.9)]",
  };

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        flex
        items-center
        gap-3
        rounded-full
        border
        border-white/10
        bg-[#0d0920]/65
        px-4
        py-2.5
        shadow-[0_12px_38px_rgba(0,0,0,.28)]
        backdrop-blur-xl
      "
    >
      <span
        className={`
          h-2
          w-2
          rounded-full
          ${dotClass[tone]}
        `}
      />

      <span
        className="
          text-[9px]
          font-bold
          uppercase
          tracking-wider
          text-white/35
        "
      >
        {label}
      </span>

      <span
        className="
          text-[10px]
          font-black
          text-white/85
        "
      >
        {value}
      </span>
    </motion.div>
  );
}

/* =========================================================
   ARROW INDICATOR
========================================================= */

function ArrowIndicator() {
  return (
    <span
      className="
        grid
        h-8
        w-8
        place-items-center
        rounded-full
        border
        border-white/10
        text-xs
        text-white/30
        transition
        duration-500
        group-hover:rotate-45
        group-hover:border-violet-300/30
        group-hover:bg-violet-500/15
        group-hover:text-violet-200
      "
    >
      ↗
    </span>
  );
}