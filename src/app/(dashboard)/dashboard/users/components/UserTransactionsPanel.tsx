"use client";

import React from "react";
import { motion } from "framer-motion";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  XCircle,
} from "lucide-react";

import type {
  UserRecord,
  UserTransaction,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserTransactionsPanelProps {
  user: UserRecord;
}

/* =========================================================
   CONSTANTS
========================================================= */

const INCOMING_TYPES = [
  "receive",
  "cash_in",
] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserTransactionsPanel({
  user,
}: UserTransactionsPanelProps) {
  const transactions =
    Array.isArray(
      user.transactions
    )
      ? user.transactions
      : [];

  /* =======================================================
     EMPTY
  ======================================================== */

  if (
    transactions.length ===
    0
  ) {
    return (
      <section
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border
          border-border
          bg-card
          p-6
          text-center
        "
      >
        <motion.div
          animate={{
            y: [
              0,
              -4,
              0,
            ],
          }}
          transition={{
            duration: 3,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
          "
          style={{
            background:
              "var(--dashboard-primary-soft)",
            color:
              "var(--dashboard-primary)",
          }}
        >
          <ReceiptText className="h-6 w-6" />
        </motion.div>

        <p className="mt-4 text-sm font-black text-card-foreground">
          No transactions loaded
        </p>

        <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-muted-foreground">
          No transaction records are currently
          available in this user's profile response.
        </p>
      </section>
    );
  }

  /* =======================================================
     TRANSACTIONS
  ======================================================== */

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-border
        bg-card
        p-4
        shadow-sm
        transition-colors
        duration-300
        sm:p-5
      "
    >
      {/* Header */}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Wallet activity
          </p>

          <h3 className="mt-1 text-sm font-black text-card-foreground">
            Recent transactions
          </h3>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {transactions.length} transaction
            {transactions.length ===
            1
              ? ""
              : "s"} loaded
          </p>
        </div>

        <span
          className="
            flex
            h-9
            w-9
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
          <ArrowLeftRight className="h-4 w-4" />
        </span>
      </div>

      {/* List */}

      <div className="mt-5 space-y-2.5">
        {transactions.map(
          (
            transaction,
            index
          ) => {
            const isIncoming =
              INCOMING_TYPES.includes(
                transaction.type as
                  (typeof INCOMING_TYPES)[number]
              );

            return (
              <TransactionRow
                key={
                  transaction.id
                }
                transaction={
                  transaction
                }
                incoming={
                  isIncoming
                }
                index={
                  index
                }
              />
            );
          }
        )}
      </div>
    </section>
  );
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

function TransactionRow({
  transaction,
  incoming,
  index,
}: {
  transaction: UserTransaction;
  incoming: boolean;
  index: number;
}) {
  const status =
    transaction.status;

  const StatusIcon =
    status ===
    "completed"
      ? CheckCircle2
      : status ===
          "failed"
        ? XCircle
        : Clock3;

  const statusTone =
    status ===
    "completed"
      ? {
          background:
            "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
          color:
            "var(--dashboard-success)",
        }
      : status ===
          "failed"
        ? {
            background:
              "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
            color:
              "var(--dashboard-danger)",
          }
        : {
            background:
              "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
            color:
              "var(--dashboard-warning)",
          };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          index *
          0.035,
      }}
      whileHover={{
        y: -2,
      }}
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-border
        bg-muted/20
        p-3
        transition-colors
        hover:bg-muted/40
      "
    >
      {/* Direction */}

      <span
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
        "
        style={{
          background:
            incoming
              ? "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))"
              : "var(--dashboard-primary-soft)",
          color:
            incoming
              ? "var(--dashboard-success)"
              : "var(--dashboard-primary)",
        }}
      >
        {incoming ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </span>

      {/* Main */}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-xs font-black text-card-foreground">
            {transaction.counterparty ||
              "Unknown counterparty"}
          </p>
        </div>

        <p className="mt-1 truncate text-[9px] capitalize text-muted-foreground">
          {transaction.type.replaceAll(
            "_",
            " "
          )}
          {" · "}
          {formatTransactionDate(
            transaction.createdAt
          )}
        </p>
      </div>

      {/* Amount */}

      <div className="shrink-0 text-right">
        <p
          className="
            text-xs
            font-black
          "
          style={{
            color:
              incoming
                ? "var(--dashboard-success)"
                : "var(--dashboard-primary)",
          }}
        >
          {incoming
            ? "+"
            : "-"}
          {formatAmount(
            transaction.amount
          )}
        </p>

        <div
          className="
            mt-1
            inline-flex
            items-center
            gap-1
            rounded-full
            px-2
            py-1
            text-[8px]
            font-black
            capitalize
          "
          style={statusTone}
        >
          <StatusIcon className="h-2.5 w-2.5" />

          {transaction.status}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatTransactionDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(date);
}

/* =========================================================
   AMOUNT
========================================================= */

function formatAmount(
  value: number
): string {
  const safe =
    Number.isFinite(
      Number(value)
    )
      ? Number(
          value
        )
      : 0;

  return new Intl.NumberFormat(
    "en-BD",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(safe);
}