"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Mail,
  Phone,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { motion } from "framer-motion";

import type {
  UpdateUserInput,
  UserRecord,
  UserRole,
} from "./UserManagementTypes";

import UserModalShell, {
  FormField,
  ModalButton,
} from "./UserModalShell";

/* =========================================================
   TYPES
========================================================= */

interface EditUserModalProps {
  user: UserRecord | null;

  onClose: () => void;

  onSave: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

/* =========================================================
   ROLE OPTIONS
========================================================= */

const ROLES: readonly UserRole[] = [
  "user",
  "support",
  "analyst",
  "admin",
];

/* =========================================================
   FORM TYPE
========================================================= */

interface EditFormState {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

/* =========================================================
   DEFAULT FORM
========================================================= */

const EMPTY_FORM: EditFormState = {
  name: "",
  email: "",
  phone: "",
  role: "user",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function EditUserModal({
  user,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [form, setForm] =
    useState<EditFormState>(
      EMPTY_FORM
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     SYNC USER
  ======================================================= */

  useEffect(() => {
    if (!user) {
      setForm(
        EMPTY_FORM
      );

      setError("");
      setSaving(false);

      return;
    }

    setForm({
      name:
        user.name ?? "",

      email:
        user.email ?? "",

      phone:
        user.phone ?? "",

      role:
        user.role ?? "user",
    });

    setError("");
    setSaving(false);
  }, [user]);

  /* =======================================================
     FIELD UPDATE
  ======================================================= */

  const updateField = <
    K extends keyof EditFormState
  >(
    key: K,
    value: EditFormState[K]
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate =
    (): string => {
      const name =
        form.name.trim();

      const email =
        form.email
          .trim()
          .toLowerCase();

      const phone =
        form.phone.trim();

      if (!name) {
        return "Full name is required.";
      }

      if (name.length < 2) {
        return "Name must contain at least 2 characters.";
      }

      if (name.length > 80) {
        return "Name must be 80 characters or less.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return "Please provide a valid email address.";
      }

      if (
        phone.length <
          8 ||
        phone.length >
          20
      ) {
        return "Please provide a valid phone number.";
      }

      return "";
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async (
      event?: React.FormEvent
    ) => {
      event?.preventDefault();

      if (!user || saving) {
        return;
      }

      const validationError =
        validate();

      if (validationError) {
        setError(
          validationError
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        await onSave(
          user.id,
          {
            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            phone:
              form.phone.trim(),

            role:
              form.role,
          }
        );

        onClose();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Failed to save user changes."
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
            void handleSave()
          }
          disabled={
            saving ||
            !user
          }
        >
          {saving
            ? "Saving..."
            : "Save changes"}
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
      icon={Pencil}
      title="Edit user"
      description="Update identity and access information."
      footer={footer}
    >
      <form
        onSubmit={(event) =>
          void handleSave(
            event
          )
        }
        className="space-y-5"
      >
        {/* =================================================
            TOP PROFILE PREVIEW
        ================================================= */}

        {user && (
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
              border-indigo-200/60
              bg-gradient-to-br
              from-indigo-50
              via-violet-50
              to-fuchsia-50
              p-4
            "
          >
            <div className="relative z-10 flex items-center gap-3">
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
                  shadow-lg
                  shadow-indigo-500/20
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

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-indigo-700/60">
                  Editing account
                </p>

                <p className="mt-1 truncate text-sm font-black text-indigo-950">
                  {user.name}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-indigo-900/55">
                  ID: {user.id}
                </p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-8
                -top-8
                h-28
                w-28
                rounded-full
                bg-violet-400/20
                blur-2xl
              "
            />
          </motion.div>
        )}

        {/* =================================================
            NAME
        ================================================= */}

        <FormField
          label="Full name"
          value={form.name}
          onChange={(value) =>
            updateField(
              "name",
              value
            )
          }
          placeholder="Enter full name"
        />

        {/* =================================================
            EMAIL
        ================================================= */}

        <FormField
          label="Email address"
          type="email"
          value={form.email}
          onChange={(value) =>
            updateField(
              "email",
              value
            )
          }
          placeholder="name@example.com"
        />

        {/* =================================================
            PHONE
        ================================================= */}

        <FormField
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(value) =>
            updateField(
              "phone",
              value
            )
          }
          placeholder="+8801XXXXXXXXX"
        />

        {/* =================================================
            ROLE
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
            Role & access
          </span>

          <div className="relative">
            <ShieldCheck
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-muted-foreground
              "
            />

            <select
              value={
                form.role
              }
              onChange={(
                event
              ) =>
                updateField(
                  "role",
                  event.target
                    .value as UserRole
                )
              }
              className="
                h-12
                w-full
                appearance-none
                rounded-xl
                border
                border-border
                bg-muted/35
                px-10
                text-sm
                font-semibold
                text-foreground
                outline-none
                transition-all
                focus:border-[var(--dashboard-primary)]
                focus:bg-card
                focus:ring-4
                focus:ring-[var(--dashboard-primary)]/10
              "
            >
              {ROLES.map(
                (role) => (
                  <option
                    key={
                      role
                    }
                    value={
                      role
                    }
                  >
                    {capitalize(
                      role
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        </label>

        {/* =================================================
            QUICK STATE
        ================================================= */}

        <div className="grid gap-3 sm:grid-cols-3">
          <PreviewItem
            icon={UserRound}
            label="Name"
            value={
              form.name.trim()
                ? "Ready"
                : "Missing"
            }
          />

          <PreviewItem
            icon={Mail}
            label="Email"
            value={
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim()
              )
                ? "Valid"
                : "Check"
            }
          />

          <PreviewItem
            icon={Phone}
            label="Phone"
            value={
              form.phone.trim()
                .length >=
              8
                ? "Ready"
                : "Check"
            }
          />
        </div>

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
              Could not save changes
            </p>

            <p className="mt-1 text-[10px] leading-5 text-rose-700">
              {error}
            </p>
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
            Changes are submitted to the connected admin users API.
            Authorization, duplicate identity checks and audit logging
            must remain enforced server-side.
          </p>
        </div>
      </form>
    </UserModalShell>
  );
}

/* =========================================================
   PREVIEW ITEM
========================================================= */

function PreviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  const ready =
    value === "Ready" ||
    value === "Valid";

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
      <div className="flex items-center gap-2">
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
            background: ready
              ? "color-mix(in srgb, var(--dashboard-success) 12%, transparent)"
              : "var(--dashboard-primary-soft)",
            color: ready
              ? "var(--dashboard-success)"
              : "var(--dashboard-warning)",
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
            {label}
          </p>

          <p className="mt-0.5 text-[10px] font-black">
            {value}
          </p>
        </div>
      </div>
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

function capitalize(
  value: string
): string {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}