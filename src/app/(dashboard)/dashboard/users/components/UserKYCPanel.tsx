"use client";

import React, { useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  KYCStatus,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

import { Badge } from "./UserTableRow";

/* =========================================================
   TYPES
========================================================= */

interface UserKYCPanelProps {
  user: UserRecord;
  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface KycActionProps {
  icon: LucideIcon;
  label: string;
  description: string;
  tone:
    | "success"
    | "warning"
    | "danger";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserKYCPanel({
  user,
  onUpdate,
}: UserKYCPanelProps) {
  const [
    updating,
    setUpdating,
  ] = useState<KYCStatus | null>(
    null
  );
  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const handleSetStatus = async (
    kycStatus: KYCStatus
  ) => {
    if (
      updating ||
      kycStatus === user.kycStatus
    ) {
      return;
    }

    setUpdating(
      kycStatus
    );
    setErrorMessage(
      null
    );

    try {
      await onUpdate(
        user.id,
        {
          kycStatus,
        }
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update KYC status."
      );
    } finally {
      setUpdating(
        null
      );
    }
  };

  const statusMeta =
    getStatusMeta(
      user.kycStatus
    );

  return (
    <section className="space-y-4">
      {/* =================================================
          HEADER / STATUS
      ================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border
          border-indigo-200/40
          bg-gradient-to-br
          from-indigo-950
          via-violet-900
          to-indigo-800
          p-5
          text-white
          shadow-[0_18px_50px_rgba(49,46,129,.18)]
        "
      >
        <motion.div
          className="
            pointer-events-none
            absolute
            -right-12
            -top-12
            h-32
            w-32
            rounded-full
            bg-violet-400/20
            blur-3xl
          "
          animate={{
            scale: [
              0.9,
              1.12,
              0.9,
            ],
            opacity: [
              0.3,
              0.55,
              0.3,
            ],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              animate={{
                rotate: [
                  0,
                  2,
                  -2,
                  0,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white/10
                backdrop-blur
              "
            >
              <FileCheck2 className="h-5 w-5 text-violet-200" />
            </motion.div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-200/60">
                Identity verification
              </p>

              <h3 className="mt-1 text-base font-black">
                KYC review center
              </h3>

              <p className="mt-1 text-[10px] leading-5 text-violet-100/60">
                Review identity verification status and apply a new decision.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Badge
              value={
                user.kycStatus
              }
            />
          </div>
        </div>

        {/* Status line */}
        <div className="relative z-10 mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${statusMeta.background}`}
          >
            <statusMeta.icon
              className={`h-4 w-4 ${statusMeta.color}`}
            />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-black text-white">
              {statusMeta.title}
            </p>

            <p className="mt-0.5 text-[10px] leading-5 text-violet-100/55">
              {statusMeta.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="grid gap-3 sm:grid-cols-3">
        <KycAction
          icon={CheckCircle2}
          label="Approve"
          description="Mark as verified"
          tone="success"
          disabled={
            Boolean(
              updating
            )
          }
          loading={
            updating ===
            "verified"
          }
          onClick={() =>
            void handleSetStatus(
              "verified"
            )
          }
        />

        <KycAction
          icon={RotateCcw}
          label="Review"
          description="Send for manual review"
          tone="warning"
          disabled={
            Boolean(
              updating
            )
          }
          loading={
            updating ===
            "under_review"
          }
          onClick={() =>
            void handleSetStatus(
              "under_review"
            )
          }
        />

        <KycAction
          icon={XCircle}
          label="Reject"
          description="Reject verification"
          tone="danger"
          disabled={
            Boolean(
              updating
            )
          }
          loading={
            updating ===
            "rejected"
          }
          onClick={() =>
            void handleSetStatus(
              "rejected"
            )
          }
        />
      </div>

      {errorMessage ? (
        <motion.div
          role="alert"
          initial={{
            opacity: 0,
            y: -6,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-950/25 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      ) : null}

      {/* =================================================
          SECURITY NOTE
      ================================================= */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.1,
        }}
        className="
          rounded-2xl
          border
          border-indigo-200/50
          bg-indigo-50/60
          p-4
          dark:border-indigo-400/15
          dark:bg-indigo-950/25
        "
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-violet-300" />

          <div>
            <p className="text-xs font-black text-indigo-950 dark:text-violet-100">
              Verification safety
            </p>

            <p className="mt-1 text-[10px] leading-5 text-indigo-900/65 dark:text-violet-100/55">
              KYC actions should be authorized by the backend, validated against
              submitted identity documents, and recorded in an immutable audit trail.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* =========================================================
   ACTION
========================================================= */

function KycAction({
  icon: Icon,
  label,
  description,
  tone,
  disabled = false,
  loading = false,
  onClick,
}: KycActionProps) {
  const styles = {
    success: {
      background:
        "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
      border:
        "color-mix(in srgb, var(--dashboard-success) 25%, var(--border))",
      color:
        "var(--dashboard-success)",
    },

    warning: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
      border:
        "color-mix(in srgb, var(--dashboard-warning) 25%, var(--border))",
      color:
        "var(--dashboard-warning)",
    },

    danger: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
      border:
        "color-mix(in srgb, var(--dashboard-danger) 25%, var(--border))",
      color:
        "var(--dashboard-danger)",
    },
  } as const;

  const current =
    styles[tone];

  return (
    <motion.button
      type="button"
      whileHover={
        disabled
          ? undefined
          : {
              y: -3,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.985,
            }
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="
        rounded-2xl
        border
        p-4
        text-left
        transition-all
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
      style={{
        background:
          current.background,
        borderColor:
          current.border,
      }}
    >
      <div
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
            current.background,
          color:
            current.color,
        }}
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      <p className="mt-3 text-xs font-black text-card-foreground">
        {loading ? "Saving..." : label}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
        {description}
      </p>
    </motion.button>
  );
}

/* =========================================================
   STATUS META
========================================================= */

function getStatusMeta(
  status: KYCStatus
) {
  switch (
    status
  ) {
    case "verified":
      return {
        icon:
          CheckCircle2,
        title:
          "Identity verified",
        description:
          "This account has passed the current KYC verification state.",
        background:
          "bg-emerald-400/10",
        color:
          "text-emerald-300",
      };

    case "under_review":
      return {
        icon:
          RotateCcw,
        title:
          "Manual review required",
        description:
          "This account is currently waiting for a reviewer decision.",
        background:
          "bg-amber-400/10",
        color:
          "text-amber-300",
      };

    case "rejected":
      return {
        icon:
          XCircle,
        title:
          "Verification rejected",
        description:
          "The submitted verification currently has a rejected state.",
        background:
          "bg-rose-400/10",
        color:
          "text-rose-300",
      };

    case "pending":
      return {
        icon:
          RotateCcw,
        title:
          "Verification pending",
        description:
          "The account has a KYC request waiting for processing.",
        background:
          "bg-amber-400/10",
        color:
          "text-amber-300",
      };

    case "not_started":
    default:
      return {
        icon:
          ShieldCheck,
        title:
          "KYC not started",
        description:
          "No verification workflow has been completed for this account.",
        background:
          "bg-white/10",
        color:
          "text-violet-200",
      };
  }
}
