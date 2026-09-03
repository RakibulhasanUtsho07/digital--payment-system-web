"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import type { UserRecord } from "./UserManagementTypes";
import UserModalShell, { ModalButton } from "./UserModalShell";

interface DeleteUserModalProps {
  user: UserRecord | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void> | void;
}

export default function DeleteUserModal({
  user,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      await onConfirm(user.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const footerActions = (
    <>
      <ModalButton onClick={onClose} tone="secondary">
        Cancel
      </ModalButton>
      <ModalButton
        onClick={handleDelete}
        tone="danger"
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete user"}
      </ModalButton>
    </>
  );

  return (
    <UserModalShell
      open={Boolean(user)}
      onClose={onClose}
      icon={Trash2}
      title="Delete user"
      description="This action should be protected and audited by your backend."
      footer={footerActions}
    >
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <p className="text-sm font-bold text-rose-900">
          Delete {user?.name}?
        </p>
        <p className="mt-1 text-xs leading-5 text-rose-700">
          Their account will be removed from this view. In production, prefer
          soft deletion and retain audit records.
        </p>
      </div>
    </UserModalShell>
  );
}