"use client";

import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { UserRecord } from "./UserManagementTypes";
import UserModalShell, { ModalButton } from "./UserModalShell";

interface SuspendUserModalProps {
  user: UserRecord | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => Promise<void> | void;
}

export default function SuspendUserModal({
  user,
  onClose,
  onConfirm,
}: SuspendUserModalProps) {
  const [reason, setReason] = useState("Suspicious activity requires review");
  const [saving, setSaving] = useState(false);

  const handleSuspend = async () => {
    if (!user || !reason.trim()) return;

    setSaving(true);
    try {
      await onConfirm(user.id, reason.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const footerActions = (
    <>
      <ModalButton onClick={onClose} tone="secondary">
        Cancel
      </ModalButton>
      <ModalButton
        onClick={handleSuspend}
        tone="danger"
        disabled={!reason.trim() || saving}
      >
        {saving ? "Updating..." : "Suspend account"}
      </ModalButton>
    </>
  );

  return (
    <UserModalShell
      open={Boolean(user)}
      onClose={onClose}
      icon={ShieldAlert}
      title="Suspend account"
      description={`Restrict ${user?.name ?? "this user"} and freeze wallet access.`}
      footer={footerActions}
    >
      <label className="block">
        <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Admin reason
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition-colors focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-50"
        />
      </label>
    </UserModalShell>
  );
}