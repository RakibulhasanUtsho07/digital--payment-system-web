"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import type { UserRecord } from "./UserManagementTypes";
import UserModalShell, { ModalButton } from "./UserModalShell";

interface ExportUsersModalProps {
  open: boolean;
  users: UserRecord[];
  onClose: () => void;
}

export default function ExportUsersModal({
  open,
  users,
  onClose,
}: ExportUsersModalProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const handleDownload = () => {
    const data =
      format === "json" ? JSON.stringify(users, null, 2) : toCsv(users);

    const mimeType =
      format === "json" ? "application/json" : "text/csv;charset=utf-8";

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `users-${new Date().toISOString().slice(0, 10)}.${format}`;
    anchor.click();

    URL.revokeObjectURL(url);
    onClose();
  };

  const footerActions = (
    <>
      <ModalButton onClick={onClose} tone="secondary">
        Cancel
      </ModalButton>
      <ModalButton onClick={handleDownload}>
        Download {format.toUpperCase()}
      </ModalButton>
    </>
  );

  return (
    <UserModalShell
      open={open}
      onClose={onClose}
      icon={Download}
      title="Export users"
      description={`Export the ${users.length} currently filtered user records.`}
      footer={footerActions}
    >
      <div className="grid grid-cols-2 gap-3">
        {(["csv", "json"] as const).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFormat(item)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              format === item
                ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <strong className="block text-sm uppercase text-slate-900">
              {item}
            </strong>
            <span className="mt-1 block text-xs text-slate-500">
              {item === "csv"
                ? "Best for Excel and Sheets"
                : "Best for APIs and developers"}
            </span>
          </button>
        ))}
      </div>
    </UserModalShell>
  );
}

// Helper function to format UserRecord array to CSV
function toCsv(users: UserRecord[]): string {
  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "role",
    "status",
    "kycStatus",
    "walletStatus",
    "riskLevel",
    "riskScore",
    "lastActive",
    "joinedAt",
  ] as const;

  const escapeValue = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  const headerRow = headers.join(",");
  const dataRows = users.map((user) =>
    headers.map((header) => escapeValue(user[header])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}