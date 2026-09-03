"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

import type { CreateUserInput, UserRole } from "./UserManagementTypes";
import UserModalShell, { FormField, ModalButton } from "./UserModalShell";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateUserInput) => Promise<void> | void;
}

const INITIAL_FORM_STATE: CreateUserInput = {
  name: "",
  email: "",
  phone: "",
  role: "user",
};

export default function CreateUserModal({
  open,
  onClose,
  onCreate,
}: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserInput>(INITIAL_FORM_STATE);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // Reset form state when modal opens or closes
  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
      setError("");
    }
  }, [open]);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    // Form Validation
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    if (
      !trimmedName ||
      !/^\S+@\S+\.\S+$/.test(trimmedEmail) ||
      trimmedPhone.length < 8
    ) {
      setError("Enter a valid name, email, and phone number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onCreate({
        ...form,
        name: trimmedName,
        email: trimmedEmail.toLowerCase(),
        phone: trimmedPhone,
      });
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create the user."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserModalShell
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title="Add user"
      description="Create an account now; the API client is ready for your backend endpoint."
      footer={
        <>
          <ModalButton onClick={onClose} tone="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create user"}
          </ModalButton>
        </>
      }
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <FormField
          label="Full name"
          value={form.name}
          onChange={(name) =>
            setForm((current) => ({ ...current, name }))
          }
          placeholder="Enter full name"
        />

        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(email) =>
            setForm((current) => ({ ...current, email }))
          }
          placeholder="name@example.com"
        />

        <FormField
          label="Phone"
          value={form.phone}
          onChange={(phone) =>
            setForm((current) => ({ ...current, phone }))
          }
          placeholder="+8801XXXXXXXXX"
        />

        <label className="block">
          <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Role
          </span>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as UserRole,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-400 focus:bg-white"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
            <option value="analyst">Analyst</option>
          </select>
        </label>

        {error && (
          <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
      </form>
    </UserModalShell>
  );
}