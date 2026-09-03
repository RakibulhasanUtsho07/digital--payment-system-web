"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
  UserRole,
} from "./UserManagementTypes";
import UserModalShell, { FormField, ModalButton } from "./UserModalShell";

interface EditUserModalProps {
  user: UserRecord | null;
  onClose: () => void;
  onSave: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

export default function EditUserModal({
  user,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "user",
  });

  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // Sync state with selected user or reset errors on modal open
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
      setError("");
    }
  }, [user]);

  const handleSave = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!user) return;

    // Validation Check
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    if (
      !trimmedName ||
      !/^\S+@\S+\.\S+$/.test(trimmedEmail) ||
      trimmedPhone.length < 8
    ) {
      setError("Please provide a valid name, email, and phone number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(user.id, {
        name: trimmedName,
        email: trimmedEmail.toLowerCase(),
        phone: trimmedPhone,
        role: form.role,
      });
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

  return (
    <UserModalShell
      open={Boolean(user)}
      onClose={onClose}
      icon={Pencil}
      title="Edit user"
      description="Update identity and access information."
      footer={
        <>
          <ModalButton onClick={onClose} tone="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </ModalButton>
        </>
      }
    >
      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
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