"use client";

import React, {
  useMemo,
} from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  Users,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  UserRecord,
} from "./UserManagementTypes";

import UserAvatar from "./UserAvatar";

/* =========================================================
   TYPES
========================================================= */

interface UserAnalyticsProps {
  users: UserRecord[];

  onOpenUser: (
    user: UserRecord
  ) => void;
}

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  total: number;
  segments: Segment[];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserAnalytics({
  users,
  onOpenUser,
}: UserAnalyticsProps) {
  const analytics =
    useMemo(() => {
      const safeUsers =
        Array.isArray(
          users
        )
          ? users
          : [];

      const total =
        safeUsers.length;

      const healthy =
        safeUsers.filter(
          (user) =>
            user.status ===
              "active" &&
            user.riskLevel ===
              "low" &&
            user.kycStatus ===
              "verified"
        ).length;

      const pending =
        safeUsers.filter(
          (user) =>
            user.kycStatus ===
              "pending" ||
            user.kycStatus ===
              "under_review"
        ).length;

      const highRisk =
        safeUsers.filter(
          (user) =>
            user.riskLevel ===
            "high"
        );

      const suspended =
        safeUsers.filter(
          (user) =>
            user.status ===
            "suspended"
        ).length;

      return {
        total,
        healthy,
        pending,
        highRisk,
        suspended,
      };
    }, [users]);

  const safeTotal =
    Math.max(
      1,
      analytics.total
    );

  const healthyPercent =
    Math.round(
      (analytics.healthy /
        safeTotal) *
        100
    );

  const segments =
    useMemo<Segment[]>(() => {
      const base: Segment[] =
        [
          {
            label:
              "Healthy",
            value:
              analytics.healthy,
            color:
              "var(--dashboard-success)",
          },
          {
            label:
              "KYC pending",
            value:
              analytics.pending,
            color:
              "var(--dashboard-warning)",
          },
          {
            label:
              "High risk",
            value:
              analytics.highRisk
                .length,
            color:
              "var(--dashboard-danger)",
          },
          {
            label:
              "Suspended",
            value:
              analytics.suspended,
            color:
              "var(--muted-foreground)",
          },
        ];

      const allocated =
        base.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.value,
          0
        );

      const remaining =
        Math.max(
          0,
          analytics.total -
            allocated
        );

      if (
        remaining >
        0
      ) {
        base.push({
          label:
            "Other",
          value:
            remaining,
          color:
            "var(--dashboard-primary)",
        });
      }

      return base;
    }, [
      analytics,
    ]);

  return (
    <section
      className="
        grid
        min-w-0
        gap-5
        xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]
      "
    >
      {/* ===================================================
          POPULATION OVERVIEW
      ==================================================== */}

      <motion.article
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={{
          y: -3,
        }}
        className="
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          sm:p-6
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="
                  flex
                  h-10
                  w-10
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
                <Users className="h-4 w-4" />
              </span>

              <div>
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                  "
                  style={{
                    color:
                      "var(--dashboard-primary)",
                  }}
                >
                  User Base Health
                </p>

                <h2 className="mt-0.5 text-xl font-black tracking-tight text-card-foreground">
                  Population overview
                </h2>
              </div>
            </div>

            <p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground">
              Live distribution of operational account states,
              verification readiness and risk posture.
            </p>
          </div>

          {/* healthy score */}

          <motion.div
            animate={{
              y: [
                0,
                -2,
                0,
              ],
            }}
            transition={{
              duration: 2.8,
              repeat:
                Infinity,
              ease: "easeInOut",
            }}
            className="
              shrink-0
              rounded-2xl
              border
              px-4
              py-3
            "
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
              borderColor:
                "color-mix(in srgb, var(--dashboard-success) 22%, var(--border))",
            }}
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
              "
              style={{
                color:
                  "var(--dashboard-success)",
              }}
            >
              Healthy base
            </p>

            <p
              className="
                mt-0.5
                text-2xl
                font-black
              "
              style={{
                color:
                  "var(--dashboard-success)",
              }}
            >
              {healthyPercent}%
            </p>
          </motion.div>
        </div>

        <div className="mt-7 grid items-center gap-7 lg:grid-cols-[190px_minmax(0,1fr)]">
          <Donut
            total={
              analytics.total
            }
            segments={
              segments
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {segments
              .slice(
                0,
                4
              )
              .map(
                (
                  segment,
                  index
                ) => (
                  <motion.div
                    key={
                      segment.label
                    }
                    initial={{
                      opacity: 0,
                      x: 8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.06,
                    }}
                    className="
                      flex
                      min-w-0
                      items-center
                      justify-between
                      gap-3
                      rounded-2xl
                      border
                      border-border
                      bg-muted/30
                      p-3.5
                    "
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            segment.color,
                        }}
                      />

                      <span className="truncate text-xs font-semibold text-card-foreground">
                        {segment.label}
                      </span>
                    </span>

                    <strong className="shrink-0 text-xs font-black text-card-foreground">
                      {Math.round(
                        (segment.value /
                          safeTotal) *
                          100
                      )}
                      %
                    </strong>
                  </motion.div>
                )
              )}
          </div>
        </div>

        {/* bottom insight */}

        <div
          className="
            mt-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-border
            p-3.5
          "
          style={{
            background:
              "var(--dashboard-primary-soft)",
          }}
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{
              color:
                "var(--dashboard-primary)",
            }}
          />

          <div>
            <p className="text-xs font-black text-card-foreground">
              Operational snapshot
            </p>

            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              {analytics.total.toLocaleString()} accounts are currently
              loaded from the connected users data source.
            </p>
          </div>
        </div>
      </motion.article>

      {/* ===================================================
          RISK WATCHLIST
      ==================================================== */}

      <motion.article
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
            0.08,
        }}
        whileHover={{
          y: -3,
        }}
        className="
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          sm:p-6
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
              "
              style={{
                color:
                  "var(--dashboard-warning)",
              }}
            >
              Risk Watchlist
            </p>

            <h2 className="mt-1 text-xl font-black text-card-foreground">
              Needs attention
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Highest risk users requiring review.
            </p>
          </div>

          <motion.span
            animate={{
              rotate: [
                0,
                -5,
                5,
                0,
              ],
            }}
            transition={{
              duration: 3,
              repeat:
                Infinity,
              ease: "easeInOut",
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
                "color-mix(in srgb, var(--dashboard-warning) 12%, transparent)",
              color:
                "var(--dashboard-warning)",
            }}
          >
            <AlertTriangle className="h-5 w-5" />
          </motion.span>
        </div>

        <div className="mt-5 space-y-2.5">
          {analytics.highRisk
            .length >
          0 ? (
            analytics.highRisk
              .slice(
                0,
                5
              )
              .map(
                (
                  user,
                  index
                ) => (
                  <motion.button
                    key={
                      user.id
                    }
                    type="button"
                    initial={{
                      opacity: 0,
                      x: 8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.05,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    whileTap={{
                      scale:
                        0.99,
                    }}
                    onClick={() =>
                      onOpenUser(
                        user
                      )
                    }
                    className="
                      group
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-2xl
                      border
                      border-border
                      bg-muted/30
                      p-3
                      text-left
                      transition
                    "
                  >
                    <span className="flex min-w-0 items-center gap-3">
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
                        size="md"
                      />

                      <span className="min-w-0">
                        <strong className="block truncate text-xs font-black text-card-foreground">
                          {user.name}
                        </strong>

                        <small className="mt-0.5 block text-[10px] text-muted-foreground">
                          Risk score{" "}
                          {user.riskScore}
                          /100
                        </small>
                      </span>
                    </span>

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                      "
                      style={{
                        background:
                          "color-mix(in srgb, var(--dashboard-danger) 10%, transparent)",
                        color:
                          "var(--dashboard-danger)",
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                )
              )
          ) : (
            <div
              className="
                rounded-2xl
                border
                border-border
                p-5
              "
              style={{
                background:
                  "color-mix(in srgb, var(--dashboard-success) 8%, var(--card))",
              }}
            >
              <ShieldAlert
                className="h-5 w-5"
                style={{
                  color:
                    "var(--dashboard-success)",
                }}
              />

              <p className="mt-3 text-xs font-black text-card-foreground">
                No high-risk users
              </p>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                Current user population has no accounts flagged as high risk.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <MiniMetric
            label="KYC pending"
            value={
              analytics.pending
            }
            tone="warning"
          />

          <MiniMetric
            label="Suspended"
            value={
              analytics.suspended
            }
            tone="danger"
          />
        </div>
      </motion.article>
    </section>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "warning"
    | "danger";
}) {
  const isWarning =
    tone ===
    "warning";

  return (
    <div
      className="
        rounded-xl
        border
        border-border
        p-3
      "
      style={{
        background:
          isWarning
            ? "color-mix(in srgb, var(--dashboard-warning) 7%, var(--card))"
            : "color-mix(in srgb, var(--dashboard-danger) 7%, var(--card))",
      }}
    >
      <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p
        className="mt-1 text-lg font-black"
        style={{
          color:
            isWarning
              ? "var(--dashboard-warning)"
              : "var(--dashboard-danger)",
        }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* =========================================================
   DONUT
========================================================= */

function Donut({
  total,
  segments,
}: DonutProps) {
  const safeTotal =
    Math.max(
      1,
      total
    );

  const radius = 39;

  const circumference =
    2 *
    Math.PI *
    radius;

  let accumulatedValue =
    0;

  const computedSegments =
    segments.map(
      (
        segment
      ) => {
        const offset =
          -(
            accumulatedValue /
            safeTotal
          ) *
          circumference;

        accumulatedValue +=
          segment.value;

        const dash =
          (segment.value /
            safeTotal) *
          circumference;

        return {
          ...segment,
          dash,
          offset,
        };
      }
    );

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale:
          0.92,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 22,
      }}
      className="
        relative
        mx-auto
        h-44
        w-44
      "
    >
      <svg
        viewBox="0 0 100 100"
        className="
          h-full
          w-full
          -rotate-90
        "
        role="img"
        aria-label="User population distribution"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="12"
        />

        {computedSegments.map(
          (
            segment,
            index
          ) => (
            <motion.circle
              key={
                segment.label
              }
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={
                segment.color
              }
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={
                segment.offset
              }
              initial={{
                opacity: 0,
                pathLength: 0,
              }}
              animate={{
                opacity: 1,
                pathLength: 1,
              }}
              transition={{
                opacity: {
                  delay:
                    index *
                    0.06,
                },
                pathLength: {
                  duration:
                    0.8,
                  delay:
                    index *
                    0.06,
                  ease: "easeOut",
                },
              }}
            />
          )
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl font-black tracking-tight text-card-foreground">
          {total.toLocaleString()}
        </strong>

        <span className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          Users
        </span>
      </div>
    </motion.div>
  );
}