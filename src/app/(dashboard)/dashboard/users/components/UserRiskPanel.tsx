"use client";

import React from "react";

import {
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type {
  RiskLevel,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserRiskPanelProps {
  user: UserRecord;

  onUpdate: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface RiskPreset {
  level: RiskLevel;
  score: number;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  background: string;
}

/* =========================================================
   PRESETS
========================================================= */

const RISK_PRESETS: readonly RiskPreset[] =
  [
    {
      level: "low",
      score: 15,
      label: "Low",
      description:
        "Normal account posture",
      icon: ShieldCheck,
      color:
        "var(--dashboard-success)",
      background:
        "color-mix(in srgb, var(--dashboard-success) 11%, var(--card))",
    },

    {
      level: "medium",
      score: 50,
      label: "Medium",
      description:
        "Review recommended",
      icon: TrendingUp,
      color:
        "var(--dashboard-warning)",
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
    },

    {
      level: "high",
      score: 85,
      label: "High",
      description:
        "Immediate attention",
      icon: AlertTriangle,
      color:
        "var(--dashboard-danger)",
      background:
        "color-mix(in srgb, var(--dashboard-danger) 11%, var(--card))",
    },
  ] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserRiskPanel({
  user,
  onUpdate,
}: UserRiskPanelProps) {
  const [
    updatingLevel,
    setUpdatingLevel,
  ] =
    React.useState<RiskLevel | null>(
      null
    );

  const safeScore =
    Math.min(
      100,
      Math.max(
        0,
        Number.isFinite(
          Number(
            user.riskScore
          )
        )
          ? Number(
              user.riskScore
            )
          : 0
      )
    );

  const currentPreset =
    RISK_PRESETS.find(
      (
        preset
      ) =>
        preset.level ===
        user.riskLevel
    ) ??
    RISK_PRESETS[0];

  const handleUpdateRisk =
    async (
      riskLevel: RiskLevel,
      riskScore: number
    ) => {
      if (
        riskLevel ===
          user.riskLevel &&
        riskScore ===
          user.riskScore
      ) {
        return;
      }

      if (
        updatingLevel
      ) {
        return;
      }

      setUpdatingLevel(
        riskLevel
      );

      try {
        await onUpdate(
          user.id,
          {
            riskLevel,
            riskScore,
          }
        );
      } finally {
        setUpdatingLevel(
          null
        );
      }
    };

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
      {/* ===================================================
          HEADER GLOW
      ==================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          bg-rose-500/10
          blur-3xl
        "
        animate={{
          scale: [
            0.9,
            1.12,
            0.9,
          ],
          opacity: [
            0.25,
            0.5,
            0.25,
          ],
        }}
        transition={{
          duration: 4.5,
          repeat:
            Infinity,
          ease:
            "easeInOut",
        }}
      />

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Risk intelligence
          </p>

          <h3 className="mt-1 text-sm font-black text-card-foreground">
            Account risk profile
          </h3>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Adjust the current operational classification.
          </p>
        </div>

        <motion.span
          whileHover={{
            scale: 1.04,
          }}
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            border
            px-2.5
            py-1.5
            text-[8px]
            font-black
            uppercase
            tracking-[0.1em]
          "
          style={{
            background:
              currentPreset.background,
            borderColor:
              `color-mix(in srgb, ${currentPreset.color} 20%, var(--border))`,
            color:
              currentPreset.color,
          }}
        >
          <currentPreset.icon className="h-3 w-3" />

          {currentPreset.label}
        </motion.span>
      </div>

      {/* ===================================================
          SCORE
      ==================================================== */}

      <div className="relative z-10 mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Composite score
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={
                  safeScore
                }
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  text-4xl
                  font-black
                  tracking-[-0.04em]
                  text-card-foreground
                "
              >
                {Math.round(
                  safeScore
                )}
              </motion.span>

              <span className="text-sm font-medium text-muted-foreground">
                /100
              </span>
            </div>
          </div>

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
            "
            style={{
              background:
                currentPreset.background,
              color:
                currentPreset.color,
            }}
          >
            <currentPreset.icon className="h-5 w-5" />
          </div>
        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="mt-5">
          <div className="relative h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${safeScore}%`,
              }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
              }}
              className="h-full rounded-full"
              style={{
                background:
                  `linear-gradient(90deg, var(--dashboard-success), var(--dashboard-warning), var(--dashboard-danger))`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-muted-foreground">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* ===================================================
          QUICK PRESETS
      ==================================================== */}

      <div className="relative z-10 mt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          Risk preset
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {RISK_PRESETS.map(
            (
              preset
            ) => {
              const active =
                user.riskLevel ===
                  preset.level &&
                Math.round(
                  safeScore
                ) ===
                  preset.score;

              const busy =
                updatingLevel ===
                preset.level;

              return (
                <motion.button
                  key={
                    preset.level
                  }
                  type="button"
                  whileHover={{
                    y: active
                      ? 0
                      : -2,
                  }}
                  whileTap={{
                    scale:
                      0.985,
                  }}
                  onClick={() =>
                    void handleUpdateRisk(
                      preset.level,
                      preset.score
                    )
                  }
                  disabled={
                    Boolean(
                      updatingLevel
                    )
                  }
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    p-3
                    text-left
                    transition-all
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  style={{
                    background:
                      active
                        ? preset.background
                        : "var(--card)",
                    borderColor:
                      active
                        ? `color-mix(in srgb, ${preset.color} 32%, var(--border))`
                        : "var(--border)",
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeRiskPreset"
                      className="
                        absolute
                        bottom-0
                        left-2
                        right-2
                        h-[3px]
                        rounded-full
                      "
                      style={{
                        background:
                          preset.color,
                      }}
                    />
                  )}

                  <div
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
                        preset.background,
                      color:
                        preset.color,
                    }}
                  >
                    {busy ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <preset.icon className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <p className="mt-3 text-[10px] font-black text-card-foreground">
                    {
                      preset.label
                    }
                  </p>

                  <p className="mt-1 text-[8px] leading-4 text-muted-foreground">
                    {
                      preset.description
                    }
                  </p>
                </motion.button>
              );
            }
          )}
        </div>
      </div>

      {/* ===================================================
          FOOTER NOTE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          mt-4
          rounded-xl
          border
          border-border
          bg-muted/30
          p-3
        "
      >
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{
              color:
                safeScore >= 70
                  ? "var(--dashboard-danger)"
                  : safeScore >=
                      40
                    ? "var(--dashboard-warning)"
                    : "var(--dashboard-success)",
            }}
          />

          <p className="text-[9px] leading-5 text-muted-foreground">
            The displayed score is the current backend-provided
            user risk state. Production risk calculation should
            remain server-side.
          </p>
        </div>
      </div>
    </section>
  );
}