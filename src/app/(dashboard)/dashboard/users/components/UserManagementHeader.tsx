"use client";

import type { LucideIcon } from "lucide-react";
import {
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserManagementHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
  onAddUser: () => void;
  onExport: () => void;
}

/* =========================================================
   FIXED ADMIN BRAND
   Theme change will NOT affect this section.
========================================================= */

const ADMIN_COLORS = {
  dark: "#0f0a1d",
  indigo: "#1b1238",
  violet: "#35206b",
  purple: "#5b2a86",
  accent: "#8b5cf6",
  accentLight: "#a78bfa",
  cyan: "#22d3ee",
} as const;

/* =========================================================
   HEADER
========================================================= */

export default function UserManagementHeader({
  refreshing,
  onRefresh,
  onAddUser,
  onExport,
}: UserManagementHeaderProps) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative
        isolate
        overflow-hidden
        rounded-[30px]
        border
        border-violet-300/10
        p-5
        text-white
        shadow-[0_28px_80px_rgba(45,24,89,.28)]
        sm:p-7
        lg:p-8
      "
      style={{
        background: `linear-gradient(
          135deg,
          ${ADMIN_COLORS.dark} 0%,
          ${ADMIN_COLORS.indigo} 34%,
          ${ADMIN_COLORS.violet} 67%,
          ${ADMIN_COLORS.purple} 100%
        )`,
      }}
    >
      {/* ===================================================
          BACKGROUND GRID
      ==================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.09]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* ===================================================
          TOP RIGHT GLOW
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-28
          h-[340px]
          w-[340px]
          rounded-full
          bg-violet-400
          blur-[110px]
        "
        animate={{
          scale: [0.92, 1.14, 0.92],
          opacity: [0.16, 0.38, 0.16],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          BOTTOM LEFT GLOW
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-32
          left-[26%]
          h-[250px]
          w-[250px]
          rounded-full
          bg-indigo-400
          blur-[100px]
        "
        animate={{
          x: [-15, 25, -15],
          y: [8, -12, 8],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          DECORATIVE ORBIT
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          right-12
          top-8
          h-44
          w-44
          rounded-full
          border
          border-violet-200/10
        "
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <span
          className="
            absolute
            left-1/2
            top-[-4px]
            h-2
            w-2
            -translate-x-1/2
            rounded-full
            bg-violet-300
            shadow-[0_0_18px_rgba(167,139,250,.8)]
          "
        />
      </motion.div>

      <motion.div
        className="
          pointer-events-none
          absolute
          right-20
          top-16
          h-24
          w-24
          rounded-full
          border
          border-cyan-200/10
        "
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* ===================================================
          CONTENT
      ==================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-w-0
          flex-col
          gap-7
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div className="min-w-0">
          {/* STATUS BADGES */}

          <div className="flex flex-wrap items-center gap-2">
            <motion.span
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.12,
              }}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-violet-200/15
                bg-white/[0.07]
                px-3
                py-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-violet-100
                backdrop-blur-md
              "
            >
              <ShieldCheck className="h-3.5 w-3.5" />

              Administrator
            </motion.span>

            <motion.span
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.18,
              }}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-emerald-300/20
                bg-emerald-300/10
                px-3
                py-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                text-emerald-100
              "
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                }}
              />

              System operational
            </motion.span>
          </div>

          {/* TITLE AREA */}

          <div className="mt-6 flex items-center gap-4">
            {/* ICON */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
                rotate: -8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 280,
                damping: 20,
              }}
              whileHover={{
                scale: 1.08,
                y: -3,
              }}
              className="
                relative
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-violet-200/15
                bg-violet-300/10
                shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_12px_28px_rgba(91,42,134,.22)]
              "
            >
              {/* ICON GLOW */}

              <motion.span
                className="
                  absolute
                  inset-0
                  rounded-2xl
                  bg-violet-400/10
                "
                animate={{
                  opacity: [0.2, 0.55, 0.2],
                  scale: [0.9, 1.05, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />

              <UsersRound
                className="
                  relative
                  z-10
                  h-6
                  w-6
                  text-violet-100
                "
                strokeWidth={2}
              />

              <motion.span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/10
                  text-violet-100
                "
                animate={{
                  rotate: [0, 12, -12, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
              </motion.span>
            </motion.div>

            {/* TEXT */}

            <motion.div
              initial={{
                opacity: 0,
                x: 10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.24,
              }}
              className="min-w-0"
            >
              <h1
                className="
                  text-3xl
                  font-black
                  leading-tight
                  tracking-[-0.035em]
                  text-white
                  sm:text-4xl
                  lg:text-[42px]
                "
              >
                User Operations
              </h1>

              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-6
                  text-violet-100/70
                  sm:text-[15px]
                "
              >
                Manage accounts, verification, wallet access,
                security posture and activity from one
                centralized administrative workspace.
              </p>
            </motion.div>
          </div>

          {/* BOTTOM META */}

          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.32,
            }}
            className="
              mt-5
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-2
              text-[10px]
              font-semibold
              text-violet-100/55
            "
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />

              Real-time administration
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-violet-300/30 sm:block" />

            <span>
              Secure user management
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-violet-300/30 sm:block" />

            <span>
              Audit-ready controls
            </span>
          </motion.div>
        </div>

        {/* =================================================
            ACTION AREA
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.28,
          }}
          className="
            grid
            w-full
            grid-cols-1
            gap-2
            sm:grid-cols-3
            lg:w-auto
            lg:min-w-[450px]
          "
        >
          <ActionButton
            onClick={onAddUser}
            icon={Plus}
            label="Add user"
            primary
          />

          <ActionButton
            onClick={onExport}
            icon={Download}
            label="Export users"
          />

          <ActionButton
            onClick={onRefresh}
            icon={RefreshCw}
            label="Refresh"
            disabled={refreshing}
            spin={refreshing}
          />
        </motion.div>
      </div>

      {/* ===================================================
          BOTTOM DECORATIVE LINE
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-[8%]
          right-[8%]
          h-px
          bg-gradient-to-r
          from-transparent
          via-violet-300/30
          to-transparent
        "
        animate={{
          opacity: [0.25, 0.7, 0.25],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.section>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  spin?: boolean;
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  primary = false,
  disabled = false,
  spin = false,
}: ActionButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -3,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      onClick={onClick}
      disabled={disabled}
      className={`
        group
        relative
        inline-flex
        h-12
        items-center
        justify-center
        gap-2
        overflow-hidden
        rounded-xl
        border
        px-4
        text-[10px]
        font-black
        transition-all
        duration-300
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${
          primary
            ? "border-white bg-white text-[#3b2368] shadow-[0_10px_28px_rgba(0,0,0,.16)] hover:bg-violet-50"
            : "border-white/10 bg-white/[0.07] text-white backdrop-blur-md hover:border-violet-200/20 hover:bg-white/[0.13]"
        }
      `}
    >
      {/* BUTTON SHINE */}

      <motion.span
        className="
          pointer-events-none
          absolute
          inset-y-0
          -left-[80%]
          w-[45%]
          rotate-12
          bg-white/20
          blur-md
        "
        animate={{
          x: [
            "-30%",
            "340%",
          ],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut",
        }}
      />

      {/* ICON */}

      <Icon
        className={`
          relative
          z-10
          h-4
          w-4
          transition-transform
          duration-300
          group-hover:scale-110
          ${
            spin
              ? "animate-spin"
              : ""
          }
        `}
      />

      {/* LABEL */}

      <span className="relative z-10">
        {label}
      </span>
    </motion.button>
  );
}