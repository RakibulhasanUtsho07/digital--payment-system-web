"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import type {
  CreateUserInput,
  UserRole,
} from "./UserManagementTypes";

import UserModalShell, {
  FormField,
  ModalButton,
} from "./UserModalShell";

/* =========================================================
   TYPES
========================================================= */

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    input: CreateUserInput
  ) => Promise<void> | void;
}

/* =========================================================
   INITIAL STATE
========================================================= */

const INITIAL_FORM_STATE: CreateUserInput =
  {
    name: "",
    email: "",
    phone: "",
    role: "user",
  };

/* =========================================================
   COMPONENT
========================================================= */

export default function CreateUserModal({
  open,
  onClose,
  onCreate,
}: CreateUserModalProps) {
  const [form, setForm] =
    useState<CreateUserInput>(
      INITIAL_FORM_STATE
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     RESET WHEN CLOSED
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setForm(
        INITIAL_FORM_STATE
      );

      setError("");
      setSaving(false);
    }
  }, [open]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = <
    K extends keyof CreateUserInput
  >(
    key: K,
    value: CreateUserInput[K]
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

  const validate = () => {
    const name =
      form.name.trim();

    const email =
      form.email.trim().toLowerCase();

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
      return "Please enter a valid email address.";
    }

    if (
      phone.length < 8 ||
      phone.length > 20
    ) {
      return "Please enter a valid phone number.";
    }

    return "";
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    event?: React.FormEvent
  ) => {
    event?.preventDefault();

    if (saving) {
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
      await onCreate({
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
      });

      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create the user."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     FOOTER
  ======================================================= */

  const footer = (
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
          void handleSubmit()
        }
        disabled={saving}
      >
        {saving
          ? "Creating..."
          : "Create user"}
      </ModalButton>
    </>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <UserModalShell
      open={open}
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
      icon={UserPlus}
      title="Create new user"
      description="Add a new account to the Coffer platform."
      footer={footer}
    >
      <form
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="space-y-5"
      >
        {/* =================================================
            INTRO
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
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
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-600
                text-white
                shadow-sm
              "
            >
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black text-indigo-950">
                Administrator account creation
              </p>

              <p className="mt-1 text-[10px] leading-5 text-indigo-900/60">
                The backend should validate role permissions,
                duplicate identity data and audit the creation.
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
              h-24
              w-24
              rounded-full
              bg-violet-400/20
              blur-2xl
            "
          />
        </div>

        {/* =================================================
            NAME
        ================================================= */}

        <FormField
          label="Full name"
          value={form.name}
          onChange={(name) =>
            updateField(
              "name",
              name
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
          onChange={(email) =>
            updateField(
              "email",
              email
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
          onChange={(phone) =>
            updateField(
              "phone",
              phone
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
            Role
          </span>

          <div className="relative">
            <UserRound
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
              value={form.role}
              onChange={(event) =>
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
              <option value="user">
                User
              </option>

              <option value="admin">
                Admin
              </option>

              <option value="support">
                Support
              </option>

              <option value="analyst">
                Analyst
              </option>
            </select>
          </div>
        </label>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniInfo
            icon={UserRound}
            label="Identity"
            value={
              form.name.trim()
                ? "Ready"
                : "Missing"
            }
          />

          <MiniInfo
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

          <MiniInfo
            icon={Phone}
            label="Phone"
            value={
              form.phone.trim()
                .length >= 8
                ? "Ready"
                : "Check"
            }
          />
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
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
              Could not create user
            </p>

            <p className="mt-1 text-[10px] leading-5 text-rose-700">
              {error}
            </p>
          </div>
        )}

        {/* =================================================
            API NOTE
        ================================================= */}

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-muted/30
            p-3.5
          "
        >
          <p className="text-[10px] leading-5 text-muted-foreground">
            Submission uses the connected users API. Duplicate
            email/phone validation and authorization must still be
            enforced by the backend.
          </p>
        </div>
      </form>
    </UserModalShell>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
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
              : "var(--dashboard-primary)",
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
            {label}
          </p>

          <p
            className="mt-0.5 text-[10px] font-black"
            style={{
              color: ready
                ? "var(--dashboard-success)"
                : "var(--dashboard-warning)",
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}