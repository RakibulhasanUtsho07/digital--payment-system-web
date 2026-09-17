"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  UpdateUserInput,
  UserRecord,
  UserStatus,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserStatusManagerProps {
  user: UserRecord;
  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface StatusOption {
  value: UserStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  background: string;
}

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS: readonly StatusOption[] = [
  {
    value: "active",
    label: "Active",
    description: "Account can use protected features",
    icon: CheckCircle2,
    color: "var(--dashboard-success)",
    background:
      "color-mix(in srgb, var(--dashboard-success) 11%, var(--card))",
  },
  {
    value: "pending",
    label: "Pending",
    description: "Account requires verification",
    icon: Clock3,
    color: "var(--dashboard-warning)",
    background:
      "color-mix(in srgb, var(--dashboard-warning) 12%, var(--card))",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Some account actions are limited",
    icon: LockKeyhole,
    color: "var(--dashboard-warning)",
    background:
      "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
  },
  {
    value: "suspended",
    label: "Suspended",
    description: "Account access is temporarily blocked",
    icon: ShieldAlert,
    color: "var(--dashboard-danger)",
    background:
      "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
  },
] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserStatusManager({
  user,
  onUpdate,
}: UserStatusManagerProps) {
  const [updating, setUpdating] =
    React.useState<UserStatus | null>(null);

  const handleStatusChange = async (
    status: UserStatus
  ) => {
    if (
      status === user.status ||
      updating
    ) {
      return;
    }

    setUpdating(status);

    try {
      await onUpdate(
        user.id,
        {
          status,
          ...(status === "suspended"
            ? {
                walletStatus: "frozen",
              }
            : {}),
        }
      );
    } finally {
      setUpdating(null);
    }
  };

  const current =
    STATUS_OPTIONS.find(
      (item) =>
        item.value === user.status
    ) ?? STATUS_OPTIONS[0];

  const CurrentIcon =
    current.icon;

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-border
        bg-card
        p-4
        shadow-sm
        transition-colors
        duration-300
        sm:p-5
      "
    >
      {/* Decorative accent */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-28
          w-28
          rounded-full
          bg-violet-500/10
          blur-3xl
        "
        animate={{
          scale: [
            0.9,
            1.1,
            0.9,
          ],
          opacity: [
            0.35,
            0.65,
            0.35,
          ],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <motion.span
            whileHover={{
              rotate: -4,
              scale: 1.05,
            }}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
            "
            style={{
              background:
                "var(--dashboard-primary-soft)",
              color:
                "var(--dashboard-primary)",
            }}
          >
            <Activity className="h-4 w-4" />
          </motion.span>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Account controls
            </p>

            <h3 className="mt-1 text-sm font-black text-card-foreground">
              Account status
            </h3>

            <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
              Controls access to protected features.
            </p>
          </div>
        </div>

        <div
          className="
            inline-flex
            shrink-0
            items-center
            gap-1.5
            rounded-full
            border
            px-2.5
            py-1.5
            text-[9px]
            font-black
            capitalize
          "
          style={{
            background:
              current.background,
            borderColor:
              `color-mix(in srgb, ${current.color} 20%, var(--border))`,
            color:
              current.color,
          }}
        >
          <CurrentIcon className="h-3 w-3" />
          {current.label}
        </div>
      </div>

      {/* ===================================================
          STATUS OPTIONS
      ==================================================== */}

      <div className="relative z-10 mt-5 grid gap-2 sm:grid-cols-2">
        {STATUS_OPTIONS.map(
          (
            option,
            index
          ) => {
            const Icon =
              option.icon;

            const active =
              option.value ===
              user.status;

            const busy =
              updating ===
              option.value;

            return (
              <motion.button
                key={
                  option.value
                }
                type="button"
                whileHover={{
                  y: active
                    ? 0
                    : -2,
                }}
                whileTap={{
                  scale:
                    0.985,
                }}
                onClick={() =>
                  void handleStatusChange(
                    option.value
                  )
                }
                disabled={
                  Boolean(
                    updating
                  )
                }
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  p-3
                  text-left
                  transition-all
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                style={{
                  background:
                    active
                      ? option.background
                      : "var(--card)",
                  borderColor:
                    active
                      ? `color-mix(in srgb, ${option.color} 35%, var(--border))`
                      : "var(--border)",
                  boxShadow:
                    active
                      ? `0 10px 26px color-mix(in srgb, ${option.color} 10%, transparent)`
                      : "none",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeStatusIndicator"
                    className="
                      absolute
                      bottom-0
                      left-3
                      right-3
                      h-[3px]
                      rounded-full
                    "
                    style={{
                      background:
                        option.color,
                    }}
                  />
                )}

                <div className="flex items-start gap-3">
                  <span
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                    "
                    style={{
                      background:
                        option.background,
                      color:
                        option.color,
                    }}
                  >
                    {busy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black capitalize text-card-foreground">
                      {option.label}
                    </span>

                    <span className="mt-1 block text-[9px] leading-4 text-muted-foreground">
                      {
                        option.description
                      }
                    </span>
                  </span>
                </div>

                {active && (
                  <span
                    className="
                      mt-2
                      block
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.1em]
                    "
                    style={{
                      color:
                        option.color,
                    }}
                  >
                    Current status
                  </span>
                )}
              </motion.button>
            );
          }
        )}
      </div>

      {/* ===================================================
          SECURITY NOTE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          mt-4
          rounded-xl
          border
          border-border
          bg-muted/35
          p-3
        "
      >
        <div className="flex items-start gap-2.5">
          <ShieldAlert
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{
              color:
                "var(--dashboard-primary)",
            }}
          />

          <p className="text-[9px] leading-5 text-muted-foreground">
            Status changes are sent through the existing
            backend update flow. Server-side authorization
            should remain the final security boundary.
          </p>
        </div>
      </div>
    </section>
  );
}