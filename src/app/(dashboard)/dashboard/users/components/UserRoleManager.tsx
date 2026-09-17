"use client";

import React from "react";

import {
  motion,
} from "framer-motion";

import {
  Check,
  Crown,
  Headphones,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
  UserRole,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserRoleManagerProps {
  user: UserRecord;

  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
}

/* =========================================================
   ROLE OPTIONS
========================================================= */

const ROLE_OPTIONS: readonly RoleOption[] =
  [
    {
      value: "user",
      label: "User",
      description:
        "Standard customer access",
      icon: UserRound,
    },
    {
      value: "support",
      label: "Support",
      description:
        "Customer assistance access",
      icon: Headphones,
    },
    {
      value: "analyst",
      label: "Analyst",
      description:
        "Reporting and review access",
      icon: ShieldCheck,
    },
    {
      value: "admin",
      label: "Admin",
      description:
        "Full operational access",
      icon: Crown,
    },
  ] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserRoleManager({
  user,
  onUpdate,
}: UserRoleManagerProps) {
  const [
    updatingRole,
    setUpdatingRole,
  ] =
    React.useState<UserRole | null>(
      null
    );

  const handleRoleChange =
    async (
      role: UserRole
    ) => {
      if (
        role ===
          user.role ||
        updatingRole
      ) {
        return;
      }

      setUpdatingRole(
        role
      );

      try {
        await onUpdate(
          user.id,
          {
            role,
          }
        );
      } finally {
        setUpdatingRole(
          null
        );
      }
    };

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
      {/* ===================================================
          BRAND GLOW
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -left-16
          -top-16
          h-36
          w-36
          rounded-full
          bg-violet-500/10
          blur-3xl
        "
        animate={{
          scale: [
            0.9,
            1.12,
            0.9,
          ],
          opacity: [
            0.25,
            0.55,
            0.25,
          ],
        }}
        transition={{
          duration: 5,
          repeat:
            Infinity,
          ease:
            "easeInOut",
        }}
      />

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.span
            whileHover={{
              rotate: 4,
              scale: 1.04,
            }}
            className="
              flex
              h-10
              w-10
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
            <ShieldCheck className="h-4 w-4" />
          </motion.span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Access control
            </p>

            <h3 className="mt-1 text-sm font-black text-card-foreground">
              Role & permissions
            </h3>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Choose the account access level.
            </p>
          </div>
        </div>

        <span
          className="
            rounded-full
            border
            px-2.5
            py-1.5
            text-[8px]
            font-black
            uppercase
            tracking-[0.12em]
          "
          style={{
            background:
              "var(--dashboard-primary-soft)",
            borderColor:
              "color-mix(in srgb, var(--dashboard-primary) 18%, var(--border))",
            color:
              "var(--dashboard-primary)",
          }}
        >
          {user.role}
        </span>
      </div>

      {/* ===================================================
          ROLE GRID
      ==================================================== */}

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map(
          (
            option
          ) => {
            const Icon =
              option.icon;

            const active =
              user.role ===
              option.value;

            const busy =
              updatingRole ===
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
                  void handleRoleChange(
                    option.value
                  )
                }
                disabled={
                  Boolean(
                    updatingRole
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
                      ? "var(--dashboard-primary-soft)"
                      : "var(--card)",
                  borderColor:
                    active
                      ? "color-mix(in srgb, var(--dashboard-primary) 34%, var(--border))"
                      : "var(--border)",
                  boxShadow:
                    active
                      ? "0 10px 25px color-mix(in srgb, var(--dashboard-primary) 9%, transparent)"
                      : "none",
                }}
              >
                {active && (
                  <motion.span
                    layoutId="activeRoleLine"
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
                        "linear-gradient(90deg, var(--dashboard-primary), #8b5cf6)",
                    }}
                  />
                )}

                <div className="flex items-start gap-2.5">
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                    "
                    style={{
                      background:
                        active
                          ? "var(--dashboard-primary)"
                          : "var(--muted)",
                      color:
                        active
                          ? "var(--primary-foreground)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {busy ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black capitalize text-card-foreground">
                      {
                        option.label
                      }
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-muted-foreground">
                      {
                        option.description
                      }
                    </p>
                  </div>
                </div>

                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-sm">
                    <Check
                      className="h-3 w-3"
                      style={{
                        color:
                          "var(--dashboard-primary)",
                      }}
                    />
                  </span>
                )}
              </motion.button>
            );
          }
        )}
      </div>

      {/* ===================================================
          RBAC NOTE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          mt-4
          rounded-xl
          border
          border-border
          bg-muted/30
          p-3
        "
      >
        <p className="text-[9px] leading-5 text-muted-foreground">
          Role changes update the user through the existing
          backend flow. Actual RBAC authorization must always
          be enforced server-side.
        </p>
      </div>
    </section>
  );
}