"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  UserRecord,
} from "./UserManagementTypes";

import UserModalShell, {
  ModalButton,
} from "./UserModalShell";

/* =========================================================
   TYPES
========================================================= */

interface SuspendUserModalProps {
  user: UserRecord | null;

  onClose: () => void;

  onConfirm: (
    id: string,
    reason: string
  ) => Promise<void> | void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SuspendUserModal({
  user,
  onClose,
  onConfirm,
}: SuspendUserModalProps) {
  const [reason, setReason] =
    useState(
      "Suspicious activity requires review."
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     RESET STATE WHEN MODAL CLOSES / NEW USER OPENS
  ======================================================= */

  useEffect(() => {
    if (!user) {
      setReason(
        "Suspicious activity requires review."
      );

      setSaving(false);
      setError("");

      return;
    }

    setReason(
      "Suspicious activity requires review."
    );

    setSaving(false);
    setError("");
  }, [user]);

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSuspend =
    async () => {
      if (!user || saving) {
        return;
      }

      const trimmedReason =
        reason.trim();

      if (!trimmedReason) {
        setError(
          "Please provide an admin reason."
        );

        return;
      }

      if (
        trimmedReason.length <
        5
      ) {
        setError(
          "The reason should contain at least 5 characters."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        await onConfirm(
          user.id,
          trimmedReason
        );

        onClose();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not suspend this user."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     FOOTER
  ======================================================= */

  const footer =
    (
      <>
        <ModalButton
          onClick={onClose}
          tone="secondary"
          disabled={saving}
        >
          Cancel
        </ModalButton>

        <ModalButton
          onClick={() =>
            void handleSuspend()
          }
          tone="danger"
          disabled={
            saving ||
            !user
          }
        >
          {saving
            ? "Suspending..."
            : "Suspend account"}
        </ModalButton>
      </>
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <UserModalShell
      open={Boolean(user)}
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
      icon={ShieldAlert}
      title="Suspend account"
      description={
        user
          ? `Restrict ${user.name}'s account and freeze protected wallet access.`
          : "Restrict account access."
      }
      footer={footer}
    >
      <div className="space-y-5">
        {/* =================================================
            WARNING HERO
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            relative
            overflow-hidden
            rounded-[22px]
            border
            border-indigo-200/70
            bg-gradient-to-br
            from-indigo-50
            via-violet-50
            to-fuchsia-50
            p-4
          "
        >
          <div className="relative z-10 flex items-start gap-3">
            <motion.div
              animate={{
                scale: [
                  1,
                  1.06,
                  1,
                ],
                rotate: [
                  0,
                  -2,
                  2,
                  0,
                ],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-indigo-600
                text-white
                shadow-lg
                shadow-indigo-500/20
              "
            >
              <ShieldAlert className="h-5 w-5" />
            </motion.div>

            <div className="min-w-0">
              <p className="text-sm font-black text-indigo-950">
                Protected administrative action
              </p>

              <p className="mt-1 text-[10px] leading-5 text-indigo-900/65">
                Suspending an account should revoke access to
                protected operations and freeze wallet activity
                according to your backend rules.
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-28
              w-28
              rounded-full
              bg-violet-400/20
              blur-2xl
            "
          />
        </motion.div>

        {/* =================================================
            USER SUMMARY
        ================================================= */}

        {user && (
          <div
            className="
              rounded-2xl
              border
              border-border
              bg-muted/30
              p-4
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  text-sm
                  font-black
                  text-white
                "
                style={{
                  background:
                    "linear-gradient(135deg, var(--dashboard-primary), #8b5cf6)",
                }}
              >
                {getInitials(
                  user.name
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-card-foreground">
                  {user.name}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {user.email}
                </p>
              </div>

              <div className="hidden shrink-0 sm:block">
                <span
                  className="
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-[9px]
                    font-black
                  "
                  style={{
                    background:
                      "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",
                    color:
                      "var(--dashboard-danger)",
                  }}
                >
                  Account restriction
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            REASON
        ================================================= */}

        <label className="block">
          <span
            className="
              mb-2
              block
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-muted-foreground
            "
          >
            Admin reason
          </span>

          <textarea
            value={reason}
            onChange={(event) => {
              setReason(
                event.target.value
              );

              if (error) {
                setError("");
              }
            }}
            rows={5}
            maxLength={500}
            placeholder="Explain why the account is being suspended..."
            className="
              w-full
              resize-none
              rounded-2xl
              border
              border-border
              bg-muted/30
              p-4
              text-sm
              font-medium
              text-foreground
              outline-none
              transition-all
              placeholder:text-muted-foreground/55
              focus:border-[var(--dashboard-danger)]
              focus:bg-card
              focus:ring-4
              focus:ring-[var(--dashboard-danger)]/10
            "
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[9px] text-muted-foreground">
              This reason should be stored in the backend audit log.
            </span>

            <span className="shrink-0 text-[9px] font-bold text-muted-foreground">
              {reason.length}/500
            </span>
          </div>
        </label>

        {/* =================================================
            EFFECTS
        ================================================= */}

        <div className="grid gap-3 sm:grid-cols-2">
          <EffectCard
            icon={ShieldCheck}
            title="Account access"
            description="Protected features become restricted."
          />

          <EffectCard
            icon={Snowflake}
            title="Wallet access"
            description="Wallet operations can be frozen."
          />
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: 6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            role="alert"
            className="
              rounded-2xl
              border
              border-rose-200
              bg-rose-50
              p-3.5
            "
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

              <div>
                <p className="text-xs font-black text-rose-800">
                  Action failed
                </p>

                <p className="mt-1 text-[10px] leading-5 text-rose-700">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* =================================================
            BACKEND NOTE
        ================================================= */}

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-muted/25
            p-3.5
          "
        >
          <p className="text-[10px] leading-5 text-muted-foreground">
            The final authorization must be enforced by the backend.
            The client only triggers the protected user update request.
          </p>
        </div>
      </div>
    </UserModalShell>
  );
}

/* =========================================================
   EFFECT CARD
========================================================= */

function EffectCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        rounded-2xl
        border
        border-border
        bg-card
        p-3.5
      "
    >
      <div
        className="
          flex
          h-9
          w-9
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
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-3 text-xs font-black text-card-foreground">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string
): string {
  if (!name) {
    return "U";
  }

  const initials = name
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