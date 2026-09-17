"use client";

import React from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type {
  UserStats,
} from "./UserManagementTypes";

/* =========================================================
   TYPES
========================================================= */

interface UserManagementStatsProps {
  stats: UserStats;
}

interface StatItemConfig {
  key: keyof UserStats;

  label: string;

  note: string;

  icon: LucideIcon;

  colorVariable:
    | "primary"
    | "success"
    | "warning"
    | "danger";
}

/* =========================================================
   CONFIG
========================================================= */

const STAT_ITEMS: readonly StatItemConfig[] =
  [
    {
      key: "totalUsers",
      label: "Total users",
      note: "All registered accounts",
      icon: Users,
      colorVariable:
        "primary",
    },

    {
      key: "activeUsers",
      label: "Active users",
      note: "Currently enabled",
      icon: Activity,
      colorVariable:
        "success",
    },

    {
      key: "pendingKyc",
      label: "Pending KYC",
      note: "Requires attention",
      icon: UserCheck,
      colorVariable:
        "warning",
    },

    {
      key: "suspended",
      label: "Suspended",
      note: "Account restrictions",
      icon: ShieldAlert,
      colorVariable:
        "danger",
    },

    {
      key: "highRisk",
      label: "High risk",
      note: "Review recommended",
      icon: AlertTriangle,
      colorVariable:
        "danger",
    },

    {
      key: "newThisWeek",
      label: "New this week",
      note: "Fresh registrations",
      icon: TrendingUp,
      colorVariable:
        "primary",
    },
  ] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function UserManagementStats({
  stats,
}: UserManagementStatsProps) {
  return (
    <section
      aria-label="User statistics"
      className="
        grid
        grid-cols-2
        gap-3
        md:grid-cols-3
        2xl:grid-cols-6
      "
    >
      {STAT_ITEMS.map(
        (
          item,
          index
        ) => {
          const Icon =
            item.icon;

          const value =
            Number(
              stats[
                item.key
              ] ?? 0
            );

          const color =
            getColor(
              item.colorVariable
            );

          const softBackground =
            `color-mix(in srgb, ${color} 11%, var(--card))`;

          return (
            <motion.article
              key={
                item.key
              }
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.055,
                duration:
                  0.35,
              }}
              whileHover={{
                y: -4,
              }}
              className="
                group
                min-w-0
                overflow-hidden
                rounded-[22px]
                border
                border-border
                bg-card
                p-4
                shadow-[var(--dashboard-shadow)]
                transition-colors
                duration-300
                sm:p-5
              "
            >
              {/* =================================================
                  TOP ROW
              ================================================= */}

              <div className="flex items-center justify-between gap-2">
                <motion.span
                  whileHover={{
                    rotate:
                      -4,
                    scale:
                      1.04,
                  }}
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
                      softBackground,
                    color,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </motion.span>

                {index ===
                  0 && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      px-2
                      py-1
                      text-[8px]
                      font-black
                      uppercase
                      tracking-wide
                    "
                    style={{
                      background:
                        `color-mix(in srgb, var(--dashboard-success) 10%, var(--card))`,
                      color:
                        "var(--dashboard-success)",
                    }}
                  >
                    <span
                      className="
                        h-1.5
                        w-1.5
                        animate-pulse
                        rounded-full
                      "
                      style={{
                        background:
                          "var(--dashboard-success)",
                      }}
                    />

                    Live
                  </span>
                )}
              </div>

              {/* =================================================
                  LABEL
              ================================================= */}

              <p className="
                mt-4
                truncate
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                text-muted-foreground
              ">
                {
                  item.label
                }
              </p>

              {/* =================================================
                  VALUE
              ================================================= */}

              <p className="
                mt-1
                text-2xl
                font-black
                tracking-[-0.03em]
                text-card-foreground
              ">
                {value.toLocaleString(
                  "en-BD"
                )}
              </p>

              {/* =================================================
                  NOTE
              ================================================= */}

              <p className="
                mt-1
                truncate
                text-[10px]
                text-muted-foreground
              ">
                {
                  item.note
                }
              </p>

              {/* =================================================
                  MICRO CHART
              ================================================= */}

              <div
                className="
                  mt-4
                  flex
                  h-8
                  items-end
                  gap-1
                "
                aria-hidden="true"
              >
                {[
                  12,
                  20,
                  15,
                  25,
                  18,
                  30,
                  24,
                ].map(
                  (
                    height,
                    barIndex
                  ) => (
                    <motion.span
                      key={
                        barIndex
                      }
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height,
                      }}
                      transition={{
                        delay:
                          index *
                            0.055 +
                          barIndex *
                            0.035,
                        duration:
                          0.35,
                        ease:
                          "easeOut",
                      }}
                      className="
                        min-w-0
                        flex-1
                        rounded-full
                      "
                      style={{
                        background:
                          color,
                        opacity:
                          0.28,
                      }}
                    />
                  )
                )}
              </div>

              {/* =================================================
                  BOTTOM ACCENT
              ================================================= */}

              <motion.div
                initial={{
                  scaleX: 0,
                }}
                animate={{
                  scaleX: 1,
                }}
                transition={{
                  delay:
                    index *
                    0.055 +
                    0.25,
                  duration:
                    0.35,
                }}
                className="
                  mt-4
                  h-[3px]
                  origin-left
                  rounded-full
                "
                style={{
                  background:
                    `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
            </motion.article>
          );
        }
      )}
    </section>
  );
}

/* =========================================================
   COLOR RESOLVER
========================================================= */

function getColor(
  type:
    | "primary"
    | "success"
    | "warning"
    | "danger"
) {
  switch (
    type
  ) {
    case "success":
      return "var(--dashboard-success)";

    case "warning":
      return "var(--dashboard-warning)";

    case "danger":
      return "var(--dashboard-danger)";

    case "primary":
    default:
      return "var(--dashboard-primary)";
  }
}