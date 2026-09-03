"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { UserStatus } from "./UserManagementTypes";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  status?: UserStatus;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  sm: "h-9 w-9 rounded-xl text-[10px]",
  md: "h-11 w-11 rounded-[14px] text-xs",
  lg: "h-12 w-12 rounded-2xl text-xs",
  xl: "h-16 w-16 rounded-[20px] text-base",
};

const statusColors: Record<UserStatus, string> = {
  active: "bg-emerald-400",
  pending: "bg-amber-400",
  restricted: "bg-orange-400",
  suspended: "bg-rose-500",
};

const gradients = [
  ["#1D4ED8", "#06B6D4"],
  ["#4F46E5", "#8B5CF6"],
  ["#0369A1", "#14B8A6"],
  ["#0F766E", "#22C55E"],
  ["#7C3AED", "#DB2777"],
] as const;

export default function UserAvatar({
  name,
  avatarUrl,
  status,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const palette = useMemo(() => {
    const index = Math.abs(hashString(name)) % gradients.length;
    return gradients[index];
  }, [name]);

  const showImage = Boolean(avatarUrl && !imageFailed);

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`relative inline-flex shrink-0 ${className}`}
    >
      <span
        className={`relative flex items-center justify-center overflow-hidden font-black text-white shadow-[0_7px_18px_rgba(15,39,69,.2)] ring-2 ring-white ${sizes[size]}`}
        style={{
          background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`,
        }}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,.35),transparent_32%)]" />

        {showImage ? (
          <img
            src={avatarUrl}
            alt={`${name}'s avatar`}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="relative tracking-wide">{getInitials(name)}</span>
        )}
      </span>

      {status && (
        <span
          aria-label={`Status: ${status}`}
          title={`Status: ${status}`}
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white ${statusColors[status]}`}
        />
      )}
    </motion.span>
  );
}

// Optimized string hashing for smooth avatar gradient distribution
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Safe initials extractor
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0] ?? "").join("").toUpperCase();
  return initials || "U";
}