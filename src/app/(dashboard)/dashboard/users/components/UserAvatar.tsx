"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import type {
  UserStatus,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

type AvatarSize =
  | "sm"
  | "md"
  | "lg"
  | "xl";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  status?: UserStatus;
  size?: AvatarSize;
  className?: string;
  showStatus?: boolean;
}

/* =========================================================
   SIZE SYSTEM
========================================================= */

const sizes: Record<
  AvatarSize,
  string
> = {
  sm: "h-9 w-9 rounded-xl text-[10px]",
  md: "h-11 w-11 rounded-[14px] text-xs",
  lg: "h-12 w-12 rounded-2xl text-xs",
  xl: "h-16 w-16 rounded-[20px] text-base",
};

/* =========================================================
   STATUS COLORS
========================================================= */

const statusClasses: Record<
  UserStatus,
  string
> = {
  active:
    "bg-emerald-400",
  pending:
    "bg-amber-400",
  restricted:
    "bg-orange-400",
  suspended:
    "bg-rose-500",
};

/* =========================================================
   AVATAR PALETTES
========================================================= */

const gradients = [
  [
    "#1D4ED8",
    "#06B6D4",
  ],
  [
    "#4F46E5",
    "#8B5CF6",
  ],
  [
    "#0369A1",
    "#14B8A6",
  ],
  [
    "#0F766E",
    "#22C55E",
  ],
  [
    "#7C3AED",
    "#DB2777",
  ],
  [
    "#4338CA",
    "#A855F7",
  ],
] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserAvatar({
  name,
  avatarUrl,
  status,
  size = "md",
  className = "",
  showStatus = true,
}: UserAvatarProps) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  /* =======================================================
     RESET IMAGE ERROR
  ======================================================= */

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  /* =======================================================
     SELECT PALETTE
  ======================================================= */

  const palette =
    useMemo(() => {
      const safeName =
        name?.trim() ||
        "User";

      const index =
        Math.abs(
          hashString(
            safeName
          )
        ) %
        gradients.length;

      return gradients[
        index
      ];
    }, [name]);

  /* =======================================================
     IMAGE STATE
  ======================================================= */

  const showImage =
    Boolean(
      avatarUrl &&
        !imageFailed
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.span
      whileHover={{
        scale: 1.045,
      }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 22,
      }}
      className={`
        relative
        inline-flex
        shrink-0
        ${className}
      `}
    >
      {/* =================================================
          MAIN AVATAR
      ================================================= */}

      <motion.span
        className={`
          relative
          flex
          items-center
          justify-center
          overflow-hidden
          font-black
          text-white
          shadow-[0_8px_24px_rgba(15,23,42,.16)]
          ring-2
          ring-background
          ${sizes[size]}
        `}
        style={{
          background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`,
        }}
        animate={{
          boxShadow: [
            "0 8px 24px rgba(15,23,42,.12)",
            "0 10px 30px rgba(99,102,241,.18)",
            "0 8px 24px rgba(15,23,42,.12)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* ambient highlight */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,.38),transparent_34%)]
          "
        />

        {/* subtle bottom glow */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-1/2
            bg-gradient-to-t
            from-black/10
            to-transparent
          "
        />

        {showImage ? (
          <img
            src={avatarUrl}
            alt={`${name || "User"}'s avatar`}
            onError={() =>
              setImageFailed(
                true
              )
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <span className="relative z-10 select-none tracking-[0.04em]">
            {getInitials(
              name
            )}
          </span>
        )}
      </motion.span>

      {/* =================================================
          STATUS
      ================================================= */}

      {status &&
        showStatus && (
          <motion.span
            aria-label={`Status: ${status}`}
            title={`Status: ${status}`}
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
            }}
            className={`
              absolute
              -bottom-0.5
              -right-0.5
              h-3.5
              w-3.5
              rounded-full
              border-[3px]
              border-background
              shadow-sm
              ${statusClasses[status]}
            `}
          >
            {status ===
              "active" && (
              <motion.span
                animate={{
                  opacity: [
                    0.25,
                    0.7,
                    0.25,
                  ],
                  scale: [
                    0.8,
                    1.15,
                    0.8,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
                className="
                  absolute
                  inset-[-3px]
                  rounded-full
                  bg-emerald-400/40
                "
              />
            )}
          </motion.span>
        )}
    </motion.span>
  );
}

/* =========================================================
   HASH
========================================================= */

function hashString(
  value: string
): number {
  let hash = 0;

  for (
    let index = 0;
    index <
    value.length;
    index += 1
  ) {
    hash =
      (hash << 5) -
      hash +
      value.charCodeAt(
        index
      );

    hash |= 0;
  }

  return hash;
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name: string
): string {
  if (
    !name?.trim()
  ) {
    return "U";
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase();

  return initials || "U";
}