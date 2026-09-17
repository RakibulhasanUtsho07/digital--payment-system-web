"use client";

import {
  motion,
} from "framer-motion";

import {
  CheckCircle2,
  Download,
  LogOut,
  ShieldAlert,
  Snowflake,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onFreeze: () => void;
  onExport: () => void;
}

interface ActionProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  tone?: "primary" | "danger" | "warning" | "neutral";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function BulkActionBar({
  count,
  onClear,
  onActivate,
  onSuspend,
  onFreeze,
  onExport,
}: BulkActionBarProps) {
  return (
    <motion.aside
      initial={{
        opacity: 0,
        y: 32,
        x: "-50%",
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: "-50%",
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 32,
        x: "-50%",
        scale: 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 26,
      }}
      className="
        fixed
        bottom-4
        left-1/2
        z-[120]
        w-[calc(100%-2rem)]
        max-w-5xl
        overflow-hidden
        rounded-[26px]
        border
        border-white/10
        bg-[#120c24]
        p-3
        text-white
        shadow-[0_24px_80px_rgba(15,10,35,.35)]
        backdrop-blur-2xl
        sm:p-4
      "
      aria-label="Bulk actions"
    >
      {/* ===================================================
          DECORATIVE GLOW
      ==================================================== */}

      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-44
          w-44
          rounded-full
          bg-violet-500/15
          blur-3xl
        "
        animate={{
          scale: [
            0.85,
            1.12,
            0.85,
          ],
          opacity: [
            0.35,
            0.75,
            0.35,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-24
          left-1/3
          h-40
          w-40
          rounded-full
          bg-indigo-500/10
          blur-3xl
        "
        animate={{
          x: [
            -20,
            20,
            -20,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
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
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* =================================================
            SELECTED INFO
        ================================================= */}

        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            animate={{
              scale: [
                1,
                1.06,
                1,
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-emerald-300/15
              bg-emerald-300/10
              text-emerald-200
            "
          >
            <CheckCircle2 className="h-5 w-5" />

            <span
              aria-hidden="true"
              className="
                absolute
                -right-1
                -top-1
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-emerald-400
                px-1
                text-[8px]
                font-black
                text-[#082016]
                shadow-sm
              "
            >
              {count > 99 ? "99+" : count}
            </span>
          </motion.div>

          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">
              {count} user
              {count === 1 ? "" : "s"} selected
            </p>

            <p className="mt-0.5 truncate text-[10px] text-violet-100/55">
              Choose a secure bulk action for the selected accounts.
            </p>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-start
            gap-2
            sm:justify-end
          "
        >
          <Action
            label="Activate"
            icon={UserCheck}
            tone="primary"
            onClick={onActivate}
          />

          <Action
            label="Suspend"
            icon={ShieldAlert}
            tone="danger"
            onClick={onSuspend}
          />

          <Action
            label="Freeze"
            icon={Snowflake}
            tone="warning"
            onClick={onFreeze}
          />

          <Action
            label="Export"
            icon={Download}
            tone="neutral"
            onClick={onExport}
          />

          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selected users"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/[0.04]
              text-violet-100/55
              transition-all
              hover:border-white/15
              hover:bg-white/[0.10]
              hover:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-violet-300/20
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===================================================
          BOTTOM STATUS LINE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          mt-3
          flex
          items-center
          gap-2
          border-t
          border-white/10
          pt-2.5
        "
      >
        <LogOut className="h-3 w-3 text-violet-300/55" />

        <p className="text-[9px] font-medium text-violet-100/45">
          Changes are sent through the administrator API and should be audited by the backend.
        </p>
      </div>
    </motion.aside>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function Action({
  label,
  onClick,
  icon: Icon,
  tone = "neutral",
}: ActionProps) {
  const toneClasses: Record<
    NonNullable<ActionProps["tone"]>,
    string
  > = {
    primary:
      "border-emerald-300/15 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/22",
    danger:
      "border-rose-300/15 bg-rose-400/15 text-rose-100 hover:bg-rose-400/22",
    warning:
      "border-amber-300/15 bg-amber-400/15 text-amber-100 hover:bg-amber-400/22",
    neutral:
      "border-white/10 bg-white/[0.06] text-violet-50 hover:bg-white/[0.12]",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.97,
      }}
      className={`
        inline-flex
        h-10
        items-center
        gap-1.5
        rounded-xl
        border
        px-3
        text-[10px]
        font-black
        transition-all
        focus:outline-none
        focus:ring-2
        focus:ring-violet-300/20
        ${toneClasses[tone]}
      `}
    >
      {Icon && (
        <Icon className="h-3.5 w-3.5" />
      )}

      <span>{label}</span>
    </motion.button>
  );
}