"use client";

import React from "react";
import { motion } from "framer-motion";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Snowflake,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

import { Badge } from "./UserTableRow";

/* =========================================================
   TYPES
========================================================= */

interface UserWalletCardProps {
  user: UserRecord;

  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone:
    | "success"
    | "primary";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserWalletCard({
  user,
  onUpdate,
}: UserWalletCardProps) {
  const [
    updating,
    setUpdating,
  ] = React.useState(false);

  const isFrozen =
    user.walletStatus ===
    "frozen";

  const isRestricted =
    user.walletStatus ===
      "restricted" ||
    user.walletStatus ===
      "closed";

  const safeBalance =
    Number.isFinite(
      Number(user.balance)
    )
      ? Number(
          user.balance
        )
      : 0;

  const safeReceived =
    Number.isFinite(
      Number(user.totalReceived)
    )
      ? Number(
          user.totalReceived
        )
      : 0;

  const safeSent =
    Number.isFinite(
      Number(user.totalSent)
    )
      ? Number(
          user.totalSent
        )
      : 0;

  const handleToggleFreeze =
    async () => {
      if (updating) {
        return;
      }

      setUpdating(true);

      try {
        await onUpdate(
          user.id,
          {
            walletStatus:
              isFrozen
                ? "active"
                : "frozen",
          }
        );
      } finally {
        setUpdating(false);
      }
    };

  return (
    <section
      className="
        relative
        space-y-3
      "
    >
      {/* ===================================================
          WALLET HERO
      ==================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          relative
          overflow-hidden
          rounded-[26px]
          border
          border-indigo-400/20
          bg-gradient-to-br
          from-indigo-950
          via-violet-900
          to-indigo-800
          p-5
          text-white
          shadow-[0_22px_55px_rgba(49,30,96,.20)]
          sm:p-6
        "
      >
        {/* Ambient glow */}

        <motion.div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-violet-400/20
            blur-[90px]
          "
          animate={{
            scale: [
              0.9,
              1.12,
              0.9,
            ],
            opacity: [
              0.25,
              0.55,
              0.25,
            ],
          }}
          transition={{
            duration: 6,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
        />

        <motion.div
          className="
            pointer-events-none
            absolute
            -bottom-16
            left-1/3
            h-40
            w-40
            rounded-full
            bg-indigo-300/10
            blur-3xl
          "
          animate={{
            x: [
              -10,
              15,
              -10,
            ],
          }}
          transition={{
            duration: 7,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
        />

        {/* Grid pattern */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.06]
          "
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize:
              "28px 28px",
          }}
        />

        <div className="relative z-10">
          {/* Header */}

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  rotate: -4,
                  scale: 1.05,
                }}
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  shadow-inner
                "
              >
                <WalletCards className="h-5 w-5 text-violet-100" />
              </motion.div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-100/50">
                  Wallet overview
                </p>

                <h3 className="mt-1 text-sm font-black">
                  Customer wallet
                </h3>
              </div>
            </div>

            <Badge
              value={
                user.walletStatus
              }
            />
          </div>

          {/* Balance */}

          <div className="mt-7">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-100/50">
              Available balance
            </p>

            <motion.p
              key={
                safeBalance
              }
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mt-1
                text-3xl
                font-black
                tracking-[-0.04em]
                sm:text-4xl
              "
            >
              {formatMoney(
                safeBalance
              )}
            </motion.p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[8px] font-black text-violet-100/70">
                <CreditCard className="h-3 w-3" />
                {user.walletId ||
                  "Wallet ID unavailable"}
              </span>

              {user.walletStatus ===
                "active" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black text-emerald-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Active wallet
                </span>
              )}
            </div>
          </div>

          {/* Wallet status line */}

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-bold text-violet-100/45">
                Wallet state
              </span>

              <span className="text-[10px] font-black capitalize text-violet-100">
                {user.walletStatus}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===================================================
          FINANCIAL METRICS
      ==================================================== */}

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={
            ArrowDownLeft
          }
          label="Received"
          value={formatMoney(
            safeReceived
          )}
          tone="success"
        />

        <Metric
          icon={
            ArrowUpRight
          }
          label="Sent"
          value={formatMoney(
            safeSent
          )}
          tone="primary"
        />
      </div>

      {/* ===================================================
          FREEZE ACTION
      ==================================================== */}

      <motion.button
        type="button"
        whileHover={{
          y: -2,
        }}
        whileTap={{
          scale:
            0.985,
        }}
        onClick={() =>
          void handleToggleFreeze()
        }
        disabled={
          updating ||
          user.walletStatus ===
            "closed"
        }
        className="
          inline-flex
          h-11
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          border
          text-xs
          font-black
          transition-all
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
        style={{
          background:
            isFrozen
              ? "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))"
              : "color-mix(in srgb, var(--dashboard-danger) 9%, var(--card))",
          borderColor:
            isFrozen
              ? "color-mix(in srgb, var(--dashboard-success) 25%, var(--border))"
              : "color-mix(in srgb, var(--dashboard-danger) 20%, var(--border))",
          color:
            isFrozen
              ? "var(--dashboard-success)"
              : "var(--dashboard-danger)",
        }}
      >
        {updating ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isFrozen ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Unfreeze wallet
          </>
        ) : (
          <>
            <Snowflake className="h-4 w-4" />
            Freeze wallet
          </>
        )}
      </motion.button>

      {/* ===================================================
          WALLET NOTE
      ==================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-border
          bg-muted/30
          p-3
        "
      >
        <div className="flex items-start gap-2.5">
          {isRestricted ? (
            <LockKeyhole
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{
                color:
                  "var(--dashboard-warning)",
              }}
            />
          ) : (
            <WalletCards
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{
                color:
                  "var(--dashboard-primary)",
              }}
            />
          )}

          <p className="text-[9px] leading-5 text-muted-foreground">
            Wallet values shown here come from the
            current user record supplied by the backend.
            Administrative wallet restrictions should
            always be enforced server-side.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: MetricProps) {
  const styles =
    tone ===
    "success"
      ? {
          background:
            "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
          color:
            "var(--dashboard-success)",
        }
      : {
          background:
            "var(--dashboard-primary-soft)",
          color:
            "var(--dashboard-primary)",
        };

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        min-w-0
        rounded-2xl
        border
        border-border
        bg-card
        p-3
        shadow-sm
        transition-colors
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
            styles.background,
          color:
            styles.color,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-card-foreground">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   MONEY FORMATTER
========================================================= */

function formatMoney(
  value: number
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",
        currency:
          "BDT",
        maximumFractionDigits: 0,
      }
    ).format(value);
  } catch {
    return `৳${value.toLocaleString(
      "en-BD"
    )}`;
  }
}