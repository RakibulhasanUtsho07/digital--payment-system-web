"use client";

import React from "react";

import {
  motion,
} from "framer-motion";

import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type {
  UserRecord,
} from "./UserManagementTypes";

import {
  Badge,
} from "./UserTableRow";

import UserAvatar from "./UserAvatar";

/* =========================================================
   TYPES
========================================================= */

interface UserProfileCardProps {
  user: UserRecord;
}

interface InfoLineProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserProfileCard({
  user,
}: UserProfileCardProps) {
  const location =
    [
      user.city,
      user.country,
    ]
      .filter(Boolean)
      .join(", ");

  const kycVerified =
    user.kycStatus ===
    "verified";

  const profileCompletion =
    calculateProfileCompletion(
      user
    );

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[26px]
        border
        border-border
        bg-card
        shadow-sm
        transition-colors
        duration-300
      "
    >
      {/* ===================================================
          PREMIUM INDIGO / VIOLET TOP
      ==================================================== */}

      <div
        className="
          relative
          overflow-hidden
          bg-gradient-to-br
          from-indigo-950
          via-violet-900
          to-indigo-800
          p-5
          text-white
          sm:p-6
        "
      >
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
              1.13,
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
            -bottom-20
            left-1/3
            h-44
            w-44
            rounded-full
            bg-indigo-400/10
            blur-3xl
          "
          animate={{
            x: [
              -10,
              18,
              -10,
            ],
            opacity: [
              0.2,
              0.45,
              0.2,
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
              "30px 30px",
          }}
        />

        <div className="relative z-10 flex items-start gap-4">
          {/* =================================================
              AVATAR
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              scale:
                0.88,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration:
                0.35,
            }}
          >
            <UserAvatar
              name={
                user.name
              }
              avatarUrl={
                user.avatarUrl
              }
              status={
                user.status
              }
              size="xl"
              className="
                ring-2
                ring-white/20
              "
            />
          </motion.div>

          {/* =================================================
              IDENTITY
          ================================================= */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black tracking-tight sm:text-xl">
                {user.name}
              </h3>

              {kycVerified && (
                <motion.span
                  initial={{
                    opacity: 0,
                    scale:
                      0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="
                    inline-flex
                    items-center
                    gap-1
                    rounded-full
                    border
                    border-emerald-200/15
                    bg-emerald-300/10
                    px-2
                    py-1
                    text-[8px]
                    font-black
                    uppercase
                    tracking-wide
                    text-emerald-100
                  "
                >
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </motion.span>
              )}
            </div>

            <p className="mt-1 truncate text-xs text-violet-100/65">
              {user.email}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[8px] font-black capitalize text-violet-100">
                {user.role}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[8px] font-black capitalize text-violet-100">
                {user.status}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[8px] font-black capitalize text-violet-100">
                {user.riskLevel} risk
              </span>
            </div>

            <p className="mt-3 truncate text-[8px] uppercase tracking-[0.1em] text-violet-100/40">
              User ID · {user.id}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          DETAILS
      ==================================================== */}

      <div className="p-5 sm:p-6">
        <div className="grid gap-2.5">
          <InfoLine
            icon={Mail}
          >
            {user.email}
          </InfoLine>

          {user.phone && (
            <InfoLine
              icon={Phone}
            >
              {user.phone}
            </InfoLine>
          )}

          {location && (
            <InfoLine
              icon={MapPin}
            >
              {location}
            </InfoLine>
          )}

          {user.walletId && (
            <InfoLine
              icon={
                ShieldCheck
              }
            >
              Wallet ·{" "}
              {user.walletId}
            </InfoLine>
          )}
        </div>

        {/* =================================================
            PROFILE HEALTH
        ================================================= */}

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Profile completeness
              </p>

              <p className="mt-1 text-sm font-black text-card-foreground">
                {profileCompletion}%
              </p>
            </div>

            <span className="text-[9px] text-muted-foreground">
              Account profile
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${profileCompletion}%`,
              }}
              transition={{
                duration:
                  0.65,
                ease:
                  "easeOut",
              }}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--dashboard-primary), #8b5cf6)",
              }}
            />
          </div>
        </div>

        {/* =================================================
            STATUS SUMMARY
        ================================================= */}

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniInfo
            label="KYC"
            value={
              user.kycStatus.replaceAll(
                "_",
                " "
              )
            }
            tone={
              kycVerified
                ? "success"
                : "warning"
            }
          />

          <MiniInfo
            label="Wallet"
            value={
              user.walletStatus
            }
            tone={
              user.walletStatus ===
              "active"
                ? "success"
                : "warning"
            }
          />

          <MiniInfo
            label="2FA"
            value={
              user.twoFactorEnabled
                ? "Enabled"
                : "Off"
            }
            tone={
              user.twoFactorEnabled
                ? "success"
                : "warning"
            }
          />

          <MiniInfo
            label="Sessions"
            value={String(
              Math.max(
                0,
                user.activeSessions
              )
            )}
            tone="primary"
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   INFO LINE
========================================================= */

function InfoLine({
  icon: Icon,
  children,
}: InfoLineProps) {
  return (
    <motion.div
      whileHover={{
        x: 2,
      }}
      className="
        flex
        min-w-0
        items-center
        gap-2.5
        rounded-xl
        border
        border-border
        bg-muted/25
        px-3
        py-2.5
      "
    >
      <span
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
        "
        style={{
          background:
            "var(--dashboard-primary-soft)",
          color:
            "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="min-w-0 truncate text-[10px] font-semibold text-muted-foreground">
        {children}
      </span>
    </motion.div>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "primary"
    | "success"
    | "warning";
}) {
  const styles =
    tone ===
    "success"
      ? {
          background:
            "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
          color:
            "var(--dashboard-success)",
        }
      : tone ===
          "warning"
        ? {
            background:
              "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
            color:
              "var(--dashboard-warning)",
          }
        : {
            background:
              "var(--dashboard-primary-soft)",
            color:
              "var(--dashboard-primary)",
          };

  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-border
        p-3
      "
    >
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-[10px]
          font-black
          capitalize
        "
        style={{
          color:
            styles.color,
        }}
      >
        {value}
      </p>

      <div
        className="
          mt-2
          h-1
          rounded-full
        "
        style={{
          background:
            styles.background,
        }}
      />
    </div>
  );
}

/* =========================================================
   PROFILE COMPLETION
========================================================= */

function calculateProfileCompletion(
  user: UserRecord
): number {
  const checks = [
    Boolean(
      user.name.trim()
    ),
    Boolean(
      user.email.trim()
    ),
    Boolean(
      user.phone.trim()
    ),
    Boolean(
      user.city.trim()
    ),
    Boolean(
      user.country.trim()
    ),
    Boolean(
      user.walletId.trim()
    ),
    Boolean(
      user.avatarUrl
    ),
  ];

  const completed =
    checks.filter(
      Boolean
    ).length;

  return Math.round(
    (completed /
      checks.length) *
      100
  );
}