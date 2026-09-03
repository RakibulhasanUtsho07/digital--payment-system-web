"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

import type { UserRecord } from "./UserManagementTypes";

interface UserTransactionsPanelProps {
  user: UserRecord;
}

const INCOMING_TYPES = ["receive", "cash_in"];

export default function UserTransactionsPanel({
  user,
}: UserTransactionsPanelProps) {
  const transactions = user.transactions ?? [];

  /* Empty State View */
  if (transactions.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center">
        <ReceiptText className="h-7 w-7 text-slate-300" />
        <p className="mt-3 text-xs font-bold text-slate-700">
          No transactions loaded
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          Connect GET /api/admin/users/:id/transactions.
        </p>
      </div>
    );
  }

  /* Transactions List View */
  return (
    <div className="space-y-2">
      {transactions.map((transaction) => {
        const isIncoming = INCOMING_TYPES.includes(transaction.type);
        const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight;

        return (
          <div
            key={transaction.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50/50"
          >
            {/* Direction Indicator */}
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isIncoming
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>

            {/* Counterparty & Status */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {transaction.counterparty}
              </p>
              <p className="text-[10px] capitalize text-slate-400">
                {transaction.type.replaceAll("_", " ")} · {transaction.status}
              </p>
            </div>

            {/* Amount display in BDT */}
            <strong className="text-xs font-bold text-slate-800">
              ৳{transaction.amount.toLocaleString()}
            </strong>
          </div>
        );
      })}
    </div>
  );
}