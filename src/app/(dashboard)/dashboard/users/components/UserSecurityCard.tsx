"use client";

import React, {
  type ReactNode,
} from "react";

import { motion } from "framer-motion";

import {
  Fingerprint,
  KeyRound,
  Laptop2,
  Lock,
  ShieldCheck,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserSecurityCardProps {
  user: UserRecord;

  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface SecurityRowProps {
  icon: LucideIcon;
  title: string;
  note: string;
  action?: ReactNode;
  tone?:
    | "primary"
    | "success"
    | "warning"
    | "danger";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserSecurityCard({
  user,
  onUpdate,
}: UserSecurityCardProps) {
  const [
    updating2FA,
    setUpdating2FA,
  ] = React.useState(false);

  const [
    sendingReset,
    setSendingReset,
  ] = React.useState(false);

  const handleToggle2FA =
    async () => {
      if (updating2FA) {
        return;
      }

      setUpdating2FA(true);

      try {
        await onUpdate(
          user.id,
          {
            twoFactorEnabled:
              !user.twoFactorEnabled,
          }
        );
      } finally {
        setUpdating2FA(false);
      }
    };

  /*
   * Backend endpoint for password-reset
   * is not present in the currently shared
   * usersApi contract.
   *
   * Therefore this button intentionally does
   * not fake a successful backend action.
   */
  const handleResetRequest =
    async () => {
      if (sendingReset) {
        return;
      }

      setSendingReset(true);

      try {
        /*
         * Reserved for:
         *
         * usersApi.sendPasswordReset(user.id)
         *
         * once that backend endpoint is available.
         */
        await Promise.resolve();
      } finally {
        setSendingReset(false);
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
      {/* Decorative ambient light */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-36
          w-36
          rounded-full
          bg-indigo-500/10
          blur-3xl
        "
        animate={{
          scale: [
            0.9,
            1.08,
            0.9,
          ],
          opacity: [
            0.25,
            0.5,
            0.25,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{
              rotate:
                -5,
              scale:
                1.04,
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
          </motion.div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Account security
            </p>

            <h3 className="mt-1 text-sm font-black text-card-foreground">
              Security controls
            </h3>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Authentication and access posture.
            </p>
          </div>
        </div>

        <span
          className="
            hidden
            rounded-full
            border
            px-2.5
            py-1.5
            text-[8px]
            font-black
            uppercase
            tracking-[0.12em]
            sm:inline-flex
          "
          style={{
            background:
              user.twoFactorEnabled
                ? "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))"
                : "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
            borderColor:
              user.twoFactorEnabled
                ? "color-mix(in srgb, var(--dashboard-success) 20%, var(--border))"
                : "color-mix(in srgb, var(--dashboard-warning) 20%, var(--border))",
            color:
              user.twoFactorEnabled
                ? "var(--dashboard-success)"
                : "var(--dashboard-warning)",
          }}
        >
          {user.twoFactorEnabled
            ? "Protected"
            : "Action needed"}
        </span>
      </div>

      {/* ===================================================
          SECURITY ROWS
      ==================================================== */}

      <div className="relative z-10 mt-5 space-y-2.5">
        <SecurityRow
          icon={
            Fingerprint
          }
          title="Two-factor authentication"
          note={
            user.twoFactorEnabled
              ? "Additional authentication is enabled."
              : "Protect the account with an additional factor."
          }
          tone={
            user.twoFactorEnabled
              ? "success"
              : "warning"
          }
          action={
            <motion.button
              type="button"
              whileTap={{
                scale:
                  0.96,
              }}
              onClick={() =>
                void handleToggle2FA()
              }
              disabled={
                updating2FA
              }
              className="
                inline-flex
                min-w-[72px]
                items-center
                justify-center
                gap-1.5
                rounded-xl
                px-3
                py-2
                text-[9px]
                font-black
                transition-all
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              style={{
                background:
                  user.twoFactorEnabled
                    ? "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))"
                    : "var(--dashboard-primary)",
                color:
                  user.twoFactorEnabled
                    ? "var(--dashboard-danger)"
                    : "var(--primary-foreground)",
              }}
            >
              {updating2FA ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : user.twoFactorEnabled ? (
                <>
                  <ShieldOff className="h-3 w-3" />
                  Disable
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Enable
                </>
              )}
            </motion.button>
          }
        />

        <SecurityRow
          icon={
            Laptop2
          }
          title="Active sessions"
          note={`${Math.max(
            0,
            user.activeSessions
          )} signed-in device${
            user.activeSessions ===
            1
              ? ""
              : "s"
          }`}
          tone="primary"
        />

        <SecurityRow
          icon={
            KeyRound
          }
          title="Failed sign-ins"
          note={`${Math.max(
            0,
            user.failedLoginCount
          )} recent failed attempt${
            user.failedLoginCount ===
            1
              ? ""
              : "s"
          }`}
          tone={
            user.failedLoginCount >
            0
              ? "warning"
              : "success"
          }
        />

        <SecurityRow
          icon={
            Lock
          }
          title="Password access"
          note="Use a secure one-time reset flow for credentials."
          tone="primary"
          action={
            <motion.button
              type="button"
              whileTap={{
                scale:
                  0.96,
              }}
              onClick={() =>
                void handleResetRequest()
              }
              disabled={
                sendingReset
              }
              className="
                inline-flex
                min-w-[82px]
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-border
                bg-muted/30
                px-3
                py-2
                text-[9px]
                font-black
                text-muted-foreground
                transition
                hover:bg-muted
                hover:text-foreground
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {sendingReset ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <KeyRound className="h-3 w-3" />
                  Send reset
                </>
              )}
            </motion.button>
          }
        />
      </div>

      {/* ===================================================
          SECURITY FOOTER
      ==================================================== */}

      <div
        className="
          relative
          z-10
          mt-4
          rounded-2xl
          border
          border-border
          bg-muted/30
          p-3
        "
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{
              color:
                "var(--dashboard-primary)",
            }}
          />

          <p className="text-[9px] leading-5 text-muted-foreground">
            Authentication changes should be authorized
            and audited by the backend before becoming
            effective.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SECURITY ROW
========================================================= */

function SecurityRow({
  icon: Icon,
  title,
  note,
  action,
  tone = "primary",
}: SecurityRowProps) {
  const styles =
    getToneStyles(
      tone
    );

  return (
    <motion.div
      whileHover={{
        y: -1,
      }}
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-border
        bg-muted/25
        p-3
        transition-colors
      "
    >
      <span
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
            styles.background,
          color:
            styles.color,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-card-foreground">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
          {note}
        </p>
      </div>

      {action}
    </motion.div>
  );
}

/* =========================================================
   TONE
========================================================= */

function getToneStyles(
  tone:
    | "primary"
    | "success"
    | "warning"
    | "danger"
) {
  if (
    tone ===
    "success"
  ) {
    return {
      color:
        "var(--dashboard-success)",
      background:
        "color-mix(in srgb, var(--dashboard-success) 11%, var(--card))",
    };
  }

  if (
    tone ===
    "warning"
  ) {
    return {
      color:
        "var(--dashboard-warning)",
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
    };
  }

  if (
    tone ===
    "danger"
  ) {
    return {
      color:
        "var(--dashboard-danger)",
      background:
        "color-mix(in srgb, var(--dashboard-danger) 11%, var(--card))",
    };
  }

  return {
    color:
      "var(--dashboard-primary)",
    background:
      "var(--dashboard-primary-soft)",
  };
}