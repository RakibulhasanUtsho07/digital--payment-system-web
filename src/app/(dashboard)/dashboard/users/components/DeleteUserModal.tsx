"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Lock,
  Trash2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import type {
  UserRecord,
} from "./UserManagementTypes";

import UserModalShell, {
  FormField,
  ModalButton,
} from "./UserModalShell";

/* =========================================================
   TYPES
========================================================= */

interface DeleteUserModalProps {
  user: UserRecord | null;

  onClose: () => void;

  onConfirm: (
    id: string,
    password?: string
  ) => Promise<void> | void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DeleteUserModal({
  user,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [
    confirmation,
    setConfirmation,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     RESET ON USER CHANGE
  ======================================================= */

  useEffect(() => {
    setConfirmation("");
    setPassword("");
    setDeleting(false);
    setError("");
  }, [user?.id]);

  /* =======================================================
     CONFIRMATION
  ======================================================= */

  const canDelete =
    confirmation
      .trim()
      .toUpperCase() ===
    "DELETE";

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleDelete =
    async () => {
      if (!user || deleting) {
        return;
      }

      if (!canDelete) {
        setError(
          'Type "DELETE" exactly to confirm account deletion.'
        );

        return;
      }

      setDeleting(true);
      setError("");

      try {
        await onConfirm(
          user.id,
          password
        );

        onClose();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not delete the user."
        );
      } finally {
        setDeleting(false);
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
          disabled={deleting}
        >
          Cancel
        </ModalButton>

        <ModalButton
          onClick={() =>
            void handleDelete()
          }
          tone="danger"
          disabled={
            deleting ||
            !user ||
            !canDelete
          }
        >
          {deleting
            ? "Deleting..."
            : "Delete user"}
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
        if (!deleting) {
          onClose();
        }
      }}
      icon={Trash2}
      title="Delete user"
      description="This is a sensitive account action and should be protected by the backend."
      footer={footer}
    >
      <div className="space-y-5">
        {/* =================================================
            DANGER HEADER
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
            rounded-[24px]
            border
            border-rose-200/80
            bg-gradient-to-br
            from-rose-50
            via-violet-50
            to-indigo-50
            p-5
          "
        >
          <div className="relative z-10 flex items-start gap-3">
            <motion.div
              animate={{
                scale: [
                  1,
                  1.05,
                  1,
                ],
                opacity: [
                  0.9,
                  1,
                  0.9,
                ],
              }}
              transition={{
                duration: 2.5,
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
                bg-rose-600
                text-white
                shadow-lg
                shadow-rose-500/20
              "
            >
              <Trash2 className="h-5 w-5" />
            </motion.div>

            <div className="min-w-0">
              <p className="text-sm font-black text-rose-950">
                Permanent account action
              </p>

              <p className="mt-1 text-[10px] leading-5 text-rose-900/65">
                This action should only be completed after
                authorization, confirmation and backend validation.
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
            USER CARD
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
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  text-sm
                  font-black
                  text-white
                  shadow-md
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

                <p className="mt-1 truncate text-[9px] text-muted-foreground/70">
                  User ID: {user.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            PROTECTION CHECKLIST
        ================================================= */}

        <div className="grid gap-3 sm:grid-cols-3">
          <ProtectionItem
            icon={ShieldCheck}
            label="Backend authorization"
          />

          <ProtectionItem
            icon={Lock}
            label="Confirmation required"
          />

          <ProtectionItem
            icon={ShieldAlert}
            label="Audit sensitive action"
          />
        </div>

        {/* =================================================
            PASSWORD
        ================================================= */}

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-muted/25
            p-4
          "
        >
          <div className="mb-4 flex items-start gap-3">
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
                  "var(--dashboard-primary-soft)",
                color:
                  "var(--dashboard-primary)",
              }}
            >
              <Lock className="h-4 w-4" />
            </span>

            <div>
              <p className="text-xs font-black text-card-foreground">
                Backend password protection
              </p>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                Enter the current administrator password when your
                backend endpoint requires it.
              </p>
            </div>
          </div>

          <FormField
            label="Administrator password (optional)"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password if required"
          />
        </div>

        {/* =================================================
            DELETE CONFIRMATION
        ================================================= */}

        <div>
          <label className="block">
            <span
              className="
                mb-2
                block
                text-xs
                font-black
                text-card-foreground
              "
            >
              Type{" "}
              <span className="text-rose-600">
                DELETE
              </span>{" "}
              to confirm
            </span>

            <input
              value={
                confirmation
              }
              onChange={(
                event
              ) => {
                setConfirmation(
                  event.target.value
                );

                if (error) {
                  setError("");
                }
              }}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              className="
                h-12
                w-full
                rounded-xl
                border
                border-rose-200
                bg-rose-50/50
                px-4
                text-sm
                font-black
                tracking-[0.12em]
                text-rose-900
                outline-none
                transition-all
                placeholder:text-rose-300
                focus:border-rose-500
                focus:bg-card
                focus:ring-4
                focus:ring-rose-500/10
              "
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[9px] text-muted-foreground">
              This confirmation is checked before submitting the request.
            </p>

            <span
              className={`text-[9px] font-black ${
                canDelete
                  ? "text-emerald-600"
                  : "text-muted-foreground"
              }`}
            >
              {canDelete
                ? "Confirmed"
                : "Not confirmed"}
            </span>
          </div>
        </div>

        {/* =================================================
            WARNING
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-3.5
          "
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-[10px] leading-5 text-amber-800">
            Deletion should follow your backend policy. The frontend
            must never be treated as the security boundary.
          </p>
        </motion.div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
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
            <p className="text-xs font-black text-rose-800">
              Delete request failed
            </p>

            <p className="mt-1 text-[10px] leading-5 text-rose-700">
              {error}
            </p>
          </motion.div>
        )}
      </div>
    </UserModalShell>
  );
}

/* =========================================================
   PROTECTION ITEM
========================================================= */

function ProtectionItem({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-border
        bg-muted/30
        p-3
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
        "
        style={{
          background:
            "var(--dashboard-primary-soft)",
          color:
            "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <p className="mt-2 text-[9px] font-black leading-4 text-card-foreground">
        {label}
      </p>
    </div>
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