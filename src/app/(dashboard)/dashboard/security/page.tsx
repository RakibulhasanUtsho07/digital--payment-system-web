"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  Fingerprint,
  History,
  Key,
  Laptop,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Square,
  Wifi,
  X,
  XCircle,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface ActiveSessionsResponse {
  success: boolean;
  count: number;
  sessions: Array<{
    sessionId: string;
    device: string;
    browser: string;
    os: string;
    location: string;
    maskedIp: string;
    lastActiveAt: string;
    expiresAt: string;
    createdAt: string;
    isCurrent: boolean;
  }>;
  message?: string;
}

interface SessionActionResponse {
  success: boolean;
  message?: string;
  revokedCount?: number;
}

interface SecurityEvent {
  id: string;
  title: string;
  date: string;
  icon: React.ElementType;
  status: "success" | "warning" | "info";
  details?: string;
}

interface AlertSettings {
  newDevice: boolean;
  suspiciousActivity: boolean;
  failedLogin: boolean;
}

type TwoFAMethod =
  | "app"
  | "sms"
  | "email";

type ToastType =
  | "success"
  | "error"
  | "info";

/* =========================================================
   SECURITY ACTIVITY
========================================================= */

const SECURITY_ACTIVITY: SecurityEvent[] = [
  {
    id: "e1",
    title: "Successful login",
    date: "Recent account activity",
    icon: CheckCircle2,
    status: "success",
    details:
      "Authenticated session detected",
  },

  {
    id: "e2",
    title: "2FA protection reviewed",
    date: "Security Center",
    icon: Key,
    status: "info",
    details:
      "Two-factor authentication settings",
  },

  {
    id: "e3",
    title: "Failed login attempt",
    date: "Security event",
    icon: AlertTriangle,
    status: "warning",
    details:
      "Review your sessions if this activity was not yours",
  },

  {
    id: "e4",
    title: "KYC verification approved",
    date: "Account activity",
    icon: ShieldCheck,
    status: "success",
  },

  {
    id: "e5",
    title: "Login alerts updated",
    date: "Security settings",
    icon: Bell,
    status: "info",
    details:
      "Security notification preferences updated",
  },
];

/* =========================================================
   DEFAULT ALERTS
========================================================= */

const DEFAULT_ALERTS: AlertSettings = {
  newDevice: true,
  suspiciousActivity: true,
  failedLogin: false,
};

/* =========================================================
   SESSION ICON
========================================================= */

function getSessionIcon(
  device: string,
  os: string
): React.ElementType {
  const value =
    `${device} ${os}`.toLowerCase();

  if (
    value.includes("iphone") ||
    value.includes("ipad") ||
    value.includes("android") ||
    value.includes("ios") ||
    value.includes("mobile")
  ) {
    return Smartphone;
  }

  if (
    value.includes("mac") ||
    value.includes("windows") ||
    value.includes("linux") ||
    value.includes("desktop") ||
    value.includes("laptop") ||
    value.includes("pc")
  ) {
    return Laptop;
  }

  return Smartphone;
}

/* =========================================================
   DATE HELPERS
========================================================= */

function formatSessionDate(
  value: string
): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelativeTime(
  value: string
): string {
  if (!value) {
    return "Unknown";
  }

  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diff =
    Date.now() - timestamp;

  if (diff < 30 * 1000) {
    return "Active now";
  }

  if (diff < 60 * 1000) {
    return "1 minute ago";
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (60 * 1000)
    )} minutes ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (60 * 60 * 1000)
    )} hours ago`;
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (24 * 60 * 60 * 1000)
    )} days ago`;
  }

  return formatSessionDate(value);
}

/* =========================================================
   PAGE
========================================================= */

export default function SecurityPage() {
  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  /* =======================================================
     SECURITY STATE
  ======================================================= */

  const [
    is2FAEnabled,
    setIs2FAEnabled,
  ] = useState(true);

  const [
    twoFAMethod,
    setTwoFAMethod,
  ] =
    useState<TwoFAMethod>("app");

  const [
    alertSettings,
    setAlertSettings,
  ] =
    useState<AlertSettings>(
      DEFAULT_ALERTS
    );

  const [
    isWalletFrozen,
    setIsWalletFrozen,
  ] = useState(false);

  const [
    passwordModalOpen,
    setPasswordModalOpen,
  ] = useState(false);

  const [
    freezeModalOpen,
    setFreezeModalOpen,
  ] = useState(false);

  const [
    showAllActivity,
    setShowAllActivity,
  ] = useState(false);

  const [
    isScanning,
    setIsScanning,
  ] = useState(false);

  const [
    lastSecurityCheck,
    setLastSecurityCheck,
  ] = useState(
    "Not checked yet"
  );

  /* =======================================================
     REAL ACTIVE SESSIONS
  ======================================================= */

  const [
    sessions,
    setSessions,
  ] = useState<Session[]>([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] = useState(false);

  const [
    sessionsError,
    setSessionsError,
  ] = useState("");

  const [
    sessionActionLoading,
    setSessionActionLoading,
  ] =
    useState<string | null>(null);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "success"
    ) => {
      setToast({
        message,
        type,
      });
    },
    []
  );

  /* =======================================================
     LOAD REAL ACTIVE SESSIONS
  ======================================================= */

  const loadSessions =
    useCallback(
      async () => {
        setSessionsLoading(true);
        setSessionsError("");

        try {
          const response =
            await apiClient<ActiveSessionsResponse>(
              "/auth/sessions",
              {
                method: "GET",
              }
            );

          console.log(
            "SECURITY ACTIVE SESSIONS:",
            response
          );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load active sessions."
            );
          }

          const mappedSessions: Session[] =
            response.sessions.map(
              (session) => ({
                id:
                  session.sessionId,

                device:
                  session.device ||
                  "Unknown device",

                browser:
                  session.browser ||
                  "Unknown browser",

                os:
                  session.os ||
                  "Unknown OS",

                location:
                  session.location ||
                  "Unknown location",

                ip:
                  session.maskedIp ||
                  "",

                lastActive:
                  session.lastActiveAt,

                expiresAt:
                  session.expiresAt,

                createdAt:
                  session.createdAt,

                isCurrent:
                  session.isCurrent,
              })
            );

          setSessions(
            mappedSessions
          );
        } catch (error) {
          console.error(
            "LOAD SECURITY SESSIONS ERROR:",
            error
          );

          setSessionsError(
            error instanceof Error
              ? error.message
              : "Unable to load active sessions."
          );
        } finally {
          setSessionsLoading(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setMounted(true);

    try {
      const savedAlerts =
        window.localStorage.getItem(
          "coffer_security_alerts"
        ) ??
        window.localStorage.getItem(
          "nova_security_alerts"
        );

      if (savedAlerts) {
        const parsed =
          JSON.parse(
            savedAlerts
          ) as Partial<AlertSettings>;

        setAlertSettings({
          ...DEFAULT_ALERTS,
          ...parsed,
        });
      }
    } catch (error) {
      console.error(
        "SECURITY SETTINGS LOAD ERROR:",
        error
      );
    }

    void loadSessions();
  }, [loadSessions]);

  /* =======================================================
     TOAST AUTO DISMISS
  ======================================================= */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setToast(null);
      }, 3000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  /* =======================================================
     DERIVED
  ======================================================= */

  const enabledAlertCount =
    useMemo(
      () =>
        Object.values(
          alertSettings
        ).filter(Boolean).length,
      [alertSettings]
    );

  const failedLoginCount =
    useMemo(
      () =>
        SECURITY_ACTIVITY.filter(
          (event) =>
            event.status ===
            "warning"
        ).length,
      []
    );

  const protectionScore =
    useMemo(() => {
      let score = 50;

      if (is2FAEnabled) {
        score += 20;
      }

      if (
        alertSettings.newDevice
      ) {
        score += 8;
      }

      if (
        alertSettings.suspiciousActivity
      ) {
        score += 8;
      }

      if (
        alertSettings.failedLogin
      ) {
        score += 5;
      }

      if (
        sessions.length > 0 &&
        sessions.length <= 3
      ) {
        score += 5;
      }

      return Math.min(
        100,
        score
      );
    }, [
      alertSettings,
      is2FAEnabled,
      sessions.length,
    ]);

  const riskLevel =
    protectionScore >= 90
      ? "Low"
      : protectionScore >= 75
        ? "Moderate"
        : "Elevated";

  const visibleActivity =
    showAllActivity
      ? SECURITY_ACTIVITY
      : SECURITY_ACTIVITY.slice(
          0,
          3
        );

  /* =======================================================
     ALERT UPDATE
  ======================================================= */

  const updateAlert = (
    key: keyof AlertSettings
  ) => {
    const next = {
      ...alertSettings,

      [key]:
        !alertSettings[key],
    };

    setAlertSettings(next);

    try {
      window.localStorage.setItem(
        "coffer_security_alerts",
        JSON.stringify(next)
      );
    } catch {
      // Ignore storage errors.
    }

    showToast(
      `${formatSettingName(
        key
      )} alerts ${
        next[key]
          ? "enabled"
          : "disabled"
      }.`
    );
  };

  /* =======================================================
     TERMINATE ONE SESSION
  ======================================================= */

  const terminateSession =
    async (
      sessionId: string
    ) => {
      if (!sessionId) {
        return;
      }

      setSessionActionLoading(
        sessionId
      );

      try {
        const response =
          await apiClient<SessionActionResponse>(
            `/auth/sessions/${encodeURIComponent(
              sessionId
            )}`,
            {
              method: "DELETE",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to log out this device."
          );
        }

        setSessions(
          (current) =>
            current.filter(
              (session) =>
                session.id !==
                sessionId
            )
        );

        showToast(
          response.message ||
            "The selected session has been terminated."
        );
      } catch (error) {
        console.error(
          "TERMINATE SESSION ERROR:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to log out this device.",
          "error"
        );
      } finally {
        setSessionActionLoading(
          null
        );
      }
    };

  /* =======================================================
     TERMINATE OTHER SESSIONS
  ======================================================= */

  const terminateOtherSessions =
    async () => {
      if (
        sessionActionLoading
      ) {
        return;
      }

      setSessionActionLoading(
        "others"
      );

      try {
        const response =
          await apiClient<SessionActionResponse>(
            "/auth/sessions/others",
            {
              method: "DELETE",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to log out other devices."
          );
        }

        setSessions(
          (current) =>
            current.filter(
              (session) =>
                session.isCurrent
            )
        );

        showToast(
          response.message ||
            "All other sessions have been terminated."
        );
      } catch (error) {
        console.error(
          "TERMINATE OTHER SESSIONS ERROR:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to log out other devices.",
          "error"
        );
      } finally {
        setSessionActionLoading(
          null
        );
      }
    };

  /* =======================================================
     SECURITY SCAN
  ======================================================= */

  const runSecurityCheck =
    async () => {
      if (isScanning) {
        return;
      }

      setIsScanning(true);

      try {
        await new Promise<void>(
          (resolve) =>
            window.setTimeout(
              resolve,
              1600
            )
        );

        await loadSessions();

        setLastSecurityCheck(
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        );

        showToast(
          `Security scan completed. Protection score: ${protectionScore}/100.`
        );
      } catch {
        showToast(
          "Security scan failed. Please try again.",
          "error"
        );
      } finally {
        setIsScanning(false);
      }
    };

  /* =======================================================
     REVIEW SESSIONS
  ======================================================= */

  const reviewSessions =
    () => {
      document
        .getElementById(
          "active-sessions"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    };

  if (!mounted) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-background pb-14 font-sans text-foreground transition-colors duration-300">
      <div className="mx-auto max-w-[1480px] space-y-8 px-3 py-4 sm:px-5 lg:px-7 lg:py-7">

        {/* =================================================
            HERO
        ================================================= */}

        <SecurityHero
          score={protectionScore}
          riskLevel={riskLevel}
        />

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.78fr)]">

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="min-w-0 space-y-8">

            <TwoFactorCard
              enabled={
                is2FAEnabled
              }
              method={
                twoFAMethod
              }
              onToggle={() => {
                const next =
                  !is2FAEnabled;

                setIs2FAEnabled(
                  next
                );

                showToast(
                  `Two-factor authentication ${
                    next
                      ? "enabled"
                      : "disabled"
                  }.`,
                  next
                    ? "success"
                    : "info"
                );
              }}
              onMethodChange={(
                method
              ) => {
                setTwoFAMethod(
                  method
                );

                showToast(
                  "Primary authentication method updated."
                );
              }}
              onBackupCodes={() =>
                showToast(
                  "Backup-code endpoint is ready to connect.",
                  "info"
                )
              }
            />

            <PasswordCard
              onChangePassword={() =>
                setPasswordModalOpen(
                  true
                )
              }
            />

            <div id="active-sessions">
              <SessionsCard
                sessions={
                  sessions
                }
                loading={
                  sessionsLoading
                }
                error={
                  sessionsError
                }
                actionLoading={
                  sessionActionLoading
                }
                onReload={() =>
                  void loadSessions()
                }
                onTerminate={
                  terminateSession
                }
                onTerminateOthers={
                  terminateOtherSessions
                }
              />
            </div>

            <RecentActivityCard
              events={
                visibleActivity
              }
              expanded={
                showAllActivity
              }
              onToggle={() =>
                setShowAllActivity(
                  (
                    current
                  ) =>
                    !current
                )
              }
            />
          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6">

            <ProtectionChecklist
              is2FAEnabled={
                is2FAEnabled
              }
            />

            <LoginAlerts
              settings={
                alertSettings
              }
              onChange={
                updateAlert
              }
            />

            <SecurityIntelligence
              score={
                protectionScore
              }
              riskLevel={
                riskLevel
              }
              sessionCount={
                sessions.length
              }
              warningCount={
                failedLoginCount
              }
              enabledAlerts={
                enabledAlertCount
              }
              is2FAEnabled={
                is2FAEnabled
              }
              isWalletFrozen={
                isWalletFrozen
              }
              scanning={
                isScanning
              }
              lastChecked={
                lastSecurityCheck
              }
              onScan={
                runSecurityCheck
              }
              onReviewSessions={
                reviewSessions
              }
            />

            <SecurityTips />

            <EmergencyProtection
              frozen={
                isWalletFrozen
              }
              onFreeze={() =>
                setFreezeModalOpen(
                  true
                )
              }
            />
          </aside>
        </div>
      </div>

      <PasswordModal
        open={
          passwordModalOpen
        }
        onClose={() =>
          setPasswordModalOpen(
            false
          )
        }
        onSuccess={() => {
          setPasswordModalOpen(
            false
          );

          showToast(
            "Password change endpoint is ready to connect.",
            "info"
          );
        }}
      />

      <FreezeWalletModal
        open={
          freezeModalOpen
        }
        onClose={() =>
          setFreezeModalOpen(
            false
          )
        }
        onConfirm={() => {
          setIsWalletFrozen(
            true
          );

          setFreezeModalOpen(
            false
          );

          showToast(
            "Wallet freeze endpoint is ready to connect.",
            "info"
          );
        }}
      />

      <Toast
        toast={toast}
        onClose={() =>
          setToast(null)
        }
      />
    </div>
  );
}

/* =========================================================
   SECURITY HERO
========================================================= */

function SecurityHero({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel:
    | "Low"
    | "Moderate"
    | "Elevated";
}) {
  const circumference =
    2 * Math.PI * 44;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
      className="relative overflow-hidden rounded-[34px] border border-indigo-300/15 bg-[linear-gradient(135deg,#08051B_0%,#17104A_42%,#2B1468_70%,#4A1D89_100%)] p-6 text-white shadow-[0_30px_90px_rgba(76,29,149,0.18)] sm:p-8 lg:p-10"
    >
      <motion.div
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        animate={{
          scale: [
            0.85,
            1.1,
            0.85,
          ],
          opacity: [
            0.35,
            0.7,
            0.35,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{
          x: [
            -20,
            25,
            -20,
          ],
          opacity: [
            0.2,
            0.6,
            0.2,
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
        }}
      />

      <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-[390px] w-[390px]">
        {[1, 2, 3].map(
          (ring) => (
            <motion.div
              key={ring}
              className="absolute left-1/2 top-1/2 rounded-full border border-cyan-300/15"
              style={{
                width: `${
                  ring * 105
                }px`,
                height: `${
                  ring * 105
                }px`,
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                scale: [
                  0.9,
                  1.04,
                  0.9,
                ],
                opacity: [
                  0.18,
                  0.5,
                  0.18,
                ],
              }}
              transition={{
                duration:
                  3.5 +
                  ring,
                repeat:
                  Infinity,
              }}
            />
          )
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1.5 text-[11px] font-black text-cyan-100">
            <motion.span
              animate={{
                scale: [
                  1,
                  1.35,
                  1,
                ],
                opacity: [
                  0.7,
                  1,
                  0.7,
                ],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
              }}
              className="h-2 w-2 rounded-full bg-emerald-300"
            />

            Security monitoring active
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-[54px]">
            Security Center
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100/75 sm:text-base">
            Manage authentication, active
            sessions, login alerts and
            emergency wallet protection
            from one secure control center.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <HeroPill
              icon={
                ShieldCheck
              }
              text="Protected account"
            />

            <HeroPill
              icon={
                Fingerprint
              }
              text="Live security monitor"
            />

            <HeroPill
              icon={Wifi}
              text={`${score}% protection`}
            />
          </div>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="relative mx-auto w-fit lg:mx-0"
        >
          <div className="relative h-48 w-48">
            {[1, 2, 3].map(
              (ring) => (
                <motion.div
                  key={ring}
                  className="absolute left-1/2 top-1/2 rounded-full border border-cyan-300/10"
                  style={{
                    width: `${
                      100 +
                      ring *
                        18
                    }px`,
                    height: `${
                      100 +
                      ring *
                        18
                    }px`,
                    x: "-50%",
                    y: "-50%",
                  }}
                  animate={{
                    scale: [
                      0.95,
                      1.08,
                      0.95,
                    ],
                    opacity: [
                      0.15,
                      0.45,
                      0.15,
                    ],
                  }}
                  transition={{
                    duration:
                      3 +
                      ring,
                    repeat:
                      Infinity,
                  }}
                />
              )
            )}

            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="7"
              />

              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#67E8F9"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={
                  circumference
                }
                initial={{
                  strokeDashoffset:
                    circumference,
                }}
                animate={{
                  strokeDashoffset:
                    circumference *
                    (1 -
                      score /
                        100),
                }}
                transition={{
                  duration: 1.6,
                  ease: "easeOut",
                }}
              />
            </svg>

            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 rgba(103,232,249,0)",
                  "0 0 45px rgba(103,232,249,.18)",
                  "0 0 0 rgba(103,232,249,0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute inset-[30px] flex flex-col items-center justify-center rounded-[30px] border border-cyan-200/10 bg-white/[0.05] backdrop-blur"
            >
              <ShieldCheck className="h-8 w-8 text-cyan-200" />

              <motion.span
                key={score}
                initial={{
                  scale: 0.7,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                className="mt-1 text-3xl font-black"
              >
                {score}
              </motion.span>

              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-100/50">
                Protection
              </span>
            </motion.div>

            <motion.span
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute left-1/2 top-1/2 h-[2px] w-[74px] origin-left bg-gradient-to-r from-cyan-300 to-transparent"
            />

            <motion.span
              animate={{
                opacity: [
                  0.3,
                  1,
                  0.3,
                ],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
              }}
              className="absolute right-[26px] top-[42px] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,.9)]"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-black text-cyan-100">
              {riskLevel} Risk
            </p>

            <p className="mt-1 text-[10px] text-indigo-100/50">
              Continuous protection assessment
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* =========================================================
   HERO PILL
========================================================= */

function HeroPill({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black text-indigo-100/75">
      <Icon className="h-3.5 w-3.5 text-cyan-200" />
      {text}
    </span>
  );
}

/* =========================================================
   2FA CARD
========================================================= */

function TwoFactorCard({
  enabled,
  method,
  onToggle,
  onMethodChange,
  onBackupCodes,
}: {
  enabled: boolean;
  method: TwoFAMethod;
  onToggle: () => void;
  onMethodChange: (
    method: TwoFAMethod
  ) => void;
  onBackupCodes: () => void;
}) {
  const methods: Array<{
    id: TwoFAMethod;
    title: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      id: "app",
      title: "Authenticator",
      description:
        "Best protection",
      icon: Fingerprint,
    },
    {
      id: "sms",
      title: "SMS",
      description:
        "Text message code",
      icon: Smartphone,
    },
    {
      id: "email",
      title: "Email",
      description:
        "Email verification",
      icon: Mail,
    },
  ];

  return (
    <Card className="p-5 sm:p-6 lg:p-8 dark:border-border dark:bg-card">
      {/* HEADER */}

      <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              enabled
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-dashboard-primary">
              Authentication
            </p>

            <h2 className="mt-1 text-xl font-black text-card-foreground sm:text-2xl">
              Two-Factor Authentication
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add another verification layer
              to supported sign-in and
              sensitive account actions.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3 md:w-auto md:min-w-[150px]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              Status
            </p>

            <p
              className={`mt-0.5 text-sm font-black ${
                enabled
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-muted-foreground"
              }`}
            >
              {enabled
                ? "Enabled"
                : "Disabled"}
            </p>
          </div>

          <Toggle
            checked={enabled}
            onChange={onToggle}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {enabled ? (
          <motion.div
            key="enabled"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="mt-6 space-y-7"
          >
            {/* SECURITY STATUS */}

            <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 dark:border-cyan-500/15 dark:bg-cyan-500/[0.06]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-black text-foreground">
                    Additional verification is active
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your selected authentication
                    method is used for protected
                    actions.
                  </p>
                </div>
              </div>
            </div>

            {/* METHOD SELECTOR */}

            <div>
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Primary Method
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Choose how you receive the second
                  verification challenge.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {methods.map(
                  (item) => {
                    const active =
                      method ===
                      item.id;

                    const Icon =
                      item.icon;

                    return (
                      <motion.button
                        key={
                          item.id
                        }
                        type="button"
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.985,
                        }}
                        onClick={() =>
                          onMethodChange(
                            item.id
                          )
                        }
                        aria-pressed={
                          active
                        }
                        className={`group relative min-h-[92px] overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                          active
                            ? "border-[var(--dashboard-primary)] bg-[var(--dashboard-primary-soft)] shadow-[0_8px_25px_rgba(31,94,168,0.10)]"
                            : "border-border bg-card hover:bg-muted/50"
                        }`}
                      >
                        {/* SELECTED BAR */}

                        <span
                          className={`absolute inset-y-3 left-0 w-1 rounded-r-full transition ${
                            active
                              ? "bg-[var(--dashboard-primary)]"
                              : "bg-transparent"
                          }`}
                        />

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                active
                                  ? "bg-[var(--dashboard-primary)] text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-black ${
                                  active
                                    ? "text-card-foreground"
                                    : "text-card-foreground"
                                }`}
                              >
                                {
                                  item.title
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {
                                  item.description
                                }
                              </p>
                            </div>
                          </div>

                          {/* RADIO */}

                          <span
                            className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              active
                                ? "border-[var(--dashboard-primary)]"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {active && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[var(--dashboard-primary)]" />
                            )}
                          </span>
                        </div>

                        {active && (
                          <motion.div
                            layoutId="twofa-selected"
                            className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--dashboard-primary)]"
                          />
                        )}
                      </motion.button>
                    );
                  }
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-[var(--dashboard-primary)] px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
              >
                <Key className="mr-2 h-4 w-4" />
                Manage 2FA
              </button>

              <button
                type="button"
                onClick={
                  onBackupCodes
                }
                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-black text-card-foreground transition hover:bg-muted"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Backup Codes
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="disabled"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/15 dark:bg-amber-500/[0.06]"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />

              <div>
                <p className="text-sm font-black text-amber-800 dark:text-amber-200">
                  Two-factor protection is disabled.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700/80 dark:text-amber-300/70">
                  Enable 2FA to improve account
                  protection for sign-in and
                  sensitive actions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* =========================================================
   PASSWORD
========================================================= */

function PasswordCard({
  onChangePassword,
}: {
  onChangePassword: () => void;
}) {
  return (
    <Card className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Key className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
            Credentials
          </p>

          <h2 className="mt-1 text-xl font-black text-card-foreground">
            Password Security
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use a strong, unique password and
            update it whenever necessary.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-8 rounded-full bg-muted" />
            </div>

            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-300">
              Strong
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onChangePassword
        }
        className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-xl border-2 border-[var(--dashboard-primary)] px-6 py-3 text-sm font-black text-[var(--dashboard-primary)] transition hover:bg-[var(--dashboard-primary-soft)]"
      >
        Change Password
      </button>
    </Card>
  );
}

/* =========================================================
   ACTIVE SESSIONS
========================================================= */

function SessionsCard({
  sessions,
  loading,
  error,
  actionLoading,
  onReload,
  onTerminate,
  onTerminateOthers,
}: {
  sessions: Session[];
  loading: boolean;
  error: string;
  actionLoading: string | null;
  onReload: () => void;
  onTerminate: (
    id: string
  ) => void;
  onTerminateOthers: () => void;
}) {
  const hasOtherSessions =
    sessions.some(
      (session) =>
        !session.isCurrent
    );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-border p-5 sm:p-6 md:flex-row md:items-center md:justify-between lg:p-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-300">
            Device Security
          </p>

          <h2 className="mt-1 text-xl font-black text-card-foreground sm:text-2xl">
            Active Sessions
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            These sessions are loaded directly
            from your server-side authentication
            records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-black text-muted-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          {hasOtherSessions && (
            <button
              type="button"
              onClick={
                onTerminateOthers
              }
              disabled={
                actionLoading ===
                "others"
              }
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
            >
              {actionLoading ===
              "others" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              Sign out others
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="divide-y divide-border">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-4 p-5 sm:p-6"
              >
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-44 rounded bg-muted" />

                  <div className="h-3 w-32 rounded bg-muted" />

                  <div className="h-3 w-56 rounded bg-muted" />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {!loading && error && (
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/15 dark:bg-rose-500/[0.06]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-rose-800 dark:text-rose-200">
                  Could not load active sessions
                </p>

                <p className="mt-1 text-xs leading-5 text-rose-700 dark:text-rose-300/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={
                    onReload
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        sessions.length === 0 && (
          <div className="p-8 text-center">
            <Laptop className="mx-auto h-10 w-10 text-muted-foreground/30" />

            <p className="mt-4 text-sm font-black text-card-foreground">
              No active sessions
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              No active server-side login
              sessions were found.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        sessions.length > 0 && (
          <div className="divide-y divide-border">
            {sessions.map(
              (session) => {
                const Icon =
                  getSessionIcon(
                    session.device,
                    session.os
                  );

                return (
                  <motion.div
                    key={
                      session.id
                    }
                    layout
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex flex-col gap-5 p-5 transition hover:bg-muted/30 sm:p-6 md:flex-row md:items-center md:justify-between lg:p-7"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          session.isCurrent
                            ? "bg-[var(--dashboard-primary-soft)] text-[var(--dashboard-primary)]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-black text-card-foreground sm:text-base">
                            {
                              session.device
                            }
                          </p>

                          {session.isCurrent && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            session.browser
                          }{" "}
                          on{" "}
                          {
                            session.os
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                          <span>
                            {
                              session.location
                            }
                          </span>

                          {session.ip && (
                            <>
                              <span className="opacity-50">
                                •
                              </span>

                              <span>
                                {
                                  session.ip
                                }
                              </span>
                            </>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            Last active{" "}
                            {formatRelativeTime(
                              session.lastActive
                            )}
                          </p>

                          <p className="text-[10px] text-muted-foreground/70">
                            Created{" "}
                            {formatSessionDate(
                              session.createdAt
                            )}
                          </p>

                          <p className="text-[10px] text-muted-foreground/70">
                            Expires{" "}
                            {formatSessionDate(
                              session.expiresAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-4 md:min-w-[120px] md:flex-col md:items-end md:border-0 md:pt-0">
                      {session.isCurrent ? (
                        <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          This device
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onTerminate(
                              session.id
                            )
                          }
                          disabled={
                            actionLoading ===
                            session.id
                          }
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          {actionLoading ===
                          session.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}

                          {actionLoading ===
                          session.id
                            ? "Signing out..."
                            : "Sign out"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}
    </Card>
  );
}

/* =========================================================
   RECENT SECURITY ACTIVITY
========================================================= */

function RecentActivityCard({
  events,
  expanded,
  onToggle,
}: {
  events: SecurityEvent[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-5 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
            Audit Trail
          </p>

          <h2 className="mt-1 text-xl font-black text-card-foreground sm:text-2xl">
            Recent Security Activity
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review recent authentication and
            security-related activity.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-black text-[var(--dashboard-primary)] hover:bg-[var(--dashboard-primary-soft)]"
        >
          {expanded
            ? "Show Less"
            : "View All"}
        </button>
      </div>

      <div
        id="security-activity"
        className="relative ml-3 border-l-2 border-border"
      >
        <AnimatePresence initial={false}>
          {events.map(
            (
              event,
              index
            ) => {
              const Icon =
                event.icon;

              const tone =
                event.status ===
                "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-500 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : event.status ===
                      "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                    : "border-blue-200 bg-blue-50 text-blue-500 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300";

              return (
                <motion.div
                  key={
                    event.id
                  }
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -8,
                  }}
                  transition={{
                    delay:
                      index *
                      0.05,
                  }}
                  className="relative pb-8 pl-9 last:pb-2"
                >
                  <div
                    className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <p className="text-sm font-black text-card-foreground">
                    {
                      event.title
                    }
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      event.date
                    }
                  </p>

                  {event.details && (
                    <p className="mt-2 inline-flex rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                      {
                        event.details
                      }
                    </p>
                  )}
                </motion.div>
              );
            }
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* =========================================================
   PROTECTION CHECKLIST
========================================================= */

function ProtectionChecklist({
  is2FAEnabled,
}: {
  is2FAEnabled: boolean;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Protection
          </p>

          <h3 className="text-base font-black text-card-foreground">
            Security Checklist
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ChecklistItem
          label="Email Verified"
          checked
        />

        <ChecklistItem
          label="KYC Completed"
          checked
        />

        <ChecklistItem
          label="Strong Password"
          checked
        />

        <ChecklistItem
          label="Two-Factor Authentication"
          checked={
            is2FAEnabled
          }
        />
      </div>
    </Card>
  );
}

function ChecklistItem({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        x: 2,
      }}
      className="flex items-center gap-3 rounded-xl px-2 py-2"
    >
      {checked ? (
        <CheckSquare className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <Square className="h-5 w-5 shrink-0 text-amber-500" />
      )}

      <span
        className={`text-xs font-black ${
          checked
            ? "text-card-foreground"
            : "text-amber-600"
        }`}
      >
        {label}
      </span>

      {checked && (
        <span className="ml-auto text-[9px] font-black uppercase text-emerald-500">
          Ready
        </span>
      )}
    </motion.div>
  );
}

/* =========================================================
   LOGIN ALERTS
========================================================= */

function LoginAlerts({
  settings,
  onChange,
}: {
  settings: AlertSettings;
  onChange: (
    key: keyof AlertSettings
  ) => void;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Bell className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Notifications
          </p>

          <h3 className="text-base font-black text-card-foreground">
            Login Alerts
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <AlertToggleRow
          title="New Devices"
          description="Notify when a new device signs in"
          checked={
            settings.newDevice
          }
          onChange={() =>
            onChange(
              "newDevice"
            )
          }
        />

        <AlertToggleRow
          title="Suspicious Activity"
          description="Flag unusual session patterns"
          checked={
            settings.suspiciousActivity
          }
          onChange={() =>
            onChange(
              "suspiciousActivity"
            )
          }
        />

        <AlertToggleRow
          title="Failed Logins"
          description="Notify after failed authentication"
          checked={
            settings.failedLogin
          }
          onChange={() =>
            onChange(
              "failedLogin"
            )
          }
        />
      </div>
    </Card>
  );
}

function AlertToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-black text-card-foreground">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          {description}
        </p>
      </div>

      <Toggle
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

/* =========================================================
   PROTECTION MONITOR
========================================================= */

function SecurityIntelligence({
  score,
  riskLevel,
  sessionCount,
  warningCount,
  enabledAlerts,
  is2FAEnabled,
  isWalletFrozen,
  scanning,
  lastChecked,
  onScan,
  onReviewSessions,
}: {
  score: number;
  riskLevel:
    | "Low"
    | "Moderate"
    | "Elevated";
  sessionCount: number;
  warningCount: number;
  enabledAlerts: number;
  is2FAEnabled: boolean;
  isWalletFrozen: boolean;
  scanning: boolean;
  lastChecked: string;
  onScan: () => void;
  onReviewSessions: () => void;
}) {
  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,#09061D_0%,#19104A_42%,#321A6D_70%,#4C1D8C_100%)] p-5 text-white shadow-[0_25px_70px_rgba(49,25,101,0.20)] sm:p-6"
    >
      <motion.div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        animate={{
          scale: [
            0.9,
            1.15,
            0.9,
          ],
          opacity: [
            0.25,
            0.6,
            0.25,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/50">
              Security Intelligence
            </p>

            <h3 className="mt-1 text-xl font-black">
              Protection Monitor
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-indigo-100/55">
              Live assessment of your
              authentication and session state.
            </p>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wider ${
              riskLevel ===
              "Low"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : riskLevel ===
                    "Moderate"
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-200"
            }`}
          >
            {riskLevel}
          </span>
        </div>

        <div className="relative mx-auto my-7 h-48 w-48">
          {[100, 76, 54, 34].map(
            (size, index) => (
              <motion.div
                key={size}
                className="absolute left-1/2 top-1/2 rounded-full border border-cyan-300/15"
                style={{
                  width: `${size}%`,
                  height: `${size}%`,
                  x: "-50%",
                  y: "-50%",
                }}
                animate={
                  scanning
                    ? {
                        scale: [
                          0.84,
                          1.08,
                          0.84,
                        ],
                        opacity: [
                          0.15,
                          0.8,
                          0.15,
                        ],
                      }
                    : {
                        scale: [
                          0.98,
                          1.02,
                          0.98,
                        ],
                        opacity: [
                          0.25,
                          0.45,
                          0.25,
                        ],
                      }
                }
                transition={{
                  duration:
                    1.5 +
                    index *
                      0.25,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
              />
            )
          )}

          <motion.div
            animate={{
              scale: [
                0.96,
                1.04,
                0.96,
              ],
              boxShadow: [
                "0 0 0 rgba(52,211,153,0)",
                "0 0 45px rgba(52,211,153,.18)",
                "0 0 0 rgba(52,211,153,0)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[28px] border border-emerald-300/20 bg-emerald-300/10"
          >
            <Fingerprint className="h-9 w-9 text-emerald-300" />

            <motion.span
              key={score}
              initial={{
                opacity: 0,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="mt-1 text-xl font-black"
            >
              {score}
            </motion.span>

            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-100/50">
              score
            </span>
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 h-[2px] w-[42%] origin-left bg-gradient-to-r from-cyan-300 via-cyan-200/70 to-transparent"
            animate={{
              rotate:
                scanning
                  ? 360
                  : 20,
            }}
            transition={{
              duration: scanning
                ? 1.5
                : 0.4,
              repeat: scanning
                ? Infinity
                : 0,
              ease: "linear",
            }}
          />

          <motion.span
            animate={{
              opacity: [
                0.2,
                1,
                0.2,
              ],
            }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
            }}
            className="absolute left-[17%] top-[35%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]"
          />

          <motion.span
            animate={{
              opacity: [
                1,
                0.25,
                1,
              ],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
            }}
            className="absolute right-[18%] top-[58%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.8)]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <IntelligenceMetric
            label="Score"
            value={`${score}`}
          />

          <IntelligenceMetric
            label="Sessions"
            value={`${sessionCount}`}
          />

          <IntelligenceMetric
            label="Warnings"
            value={`${warningCount}`}
          />
        </div>

        <div className="mt-4 space-y-2">
          <SecuritySignal
            icon={ShieldCheck}
            label="2FA protection"
            value={
              is2FAEnabled
                ? "Active"
                : "Review"
            }
            healthy={
              is2FAEnabled
            }
          />

          <SecuritySignal
            icon={Bell}
            label="Alert coverage"
            value={`${enabledAlerts}/3`}
            healthy={
              enabledAlerts >=
              2
            }
          />

          <SecuritySignal
            icon={Wifi}
            label="Active sessions"
            value={`${sessionCount}`}
            healthy={
              sessionCount <=
              3
            }
          />

          <SecuritySignal
            icon={Snowflake}
            label="Wallet state"
            value={
              isWalletFrozen
                ? "Frozen"
                : "Active"
            }
            healthy={
              !isWalletFrozen
            }
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={scanning}
            onClick={onScan}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-[10px] font-black text-[#071A2A] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                scanning
                  ? "animate-spin"
                  : ""
              }`}
            />

            {scanning
              ? "Scanning..."
              : "Run Security Check"}
          </button>

          <button
            type="button"
            onClick={
              onReviewSessions
            }
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[10px] font-black text-white transition hover:bg-white/10"
          >
            <History className="h-3.5 w-3.5 text-cyan-200" />
            Review Sessions
          </button>
        </div>

        <p className="mt-4 text-center text-[9px] text-indigo-100/35">
          Last checked:{" "}
          {lastChecked}
        </p>
      </div>
    </motion.section>
  );
}

/* =========================================================
   INTELLIGENCE METRIC
========================================================= */

function IntelligenceMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2 py-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-wider text-indigo-100/40">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-cyan-100">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SECURITY SIGNAL
========================================================= */

function SecuritySignal({
  icon: Icon,
  label,
  value,
  healthy,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  healthy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${
            healthy
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        />

        <span className="truncate text-[10px] font-semibold text-indigo-100/55">
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-black ${
          healthy
            ? "text-emerald-200"
            : "text-amber-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SECURITY TIPS
========================================================= */

function SecurityTips() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="group p-4 transition hover:-translate-y-1 hover:shadow-md">
        <Lock className="mb-3 h-6 w-6 text-[var(--dashboard-primary)] transition-transform group-hover:scale-110" />

        <p className="text-xs font-black text-card-foreground">
          Never share OTP
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          Keep verification codes private.
        </p>
      </Card>

      <Card className="group p-4 transition hover:-translate-y-1 hover:shadow-md">
        <RefreshCw className="mb-3 h-6 w-6 text-emerald-500 transition-transform duration-700 group-hover:rotate-180" />

        <p className="text-xs font-black text-card-foreground">
          Review sessions
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          Remove devices you no longer use.
        </p>
      </Card>
    </div>
  );
}

/* =========================================================
   EMERGENCY / WALLET PROTECTION
========================================================= */

function EmergencyProtection({
  frozen,
  onFreeze,
}: {
  frozen: boolean;
  onFreeze: () => void;
}) {
  return (
    <Card
      className="
        overflow-hidden
        border-rose-200
        p-5
        dark:border-rose-500/20
        sm:p-6
      "
    >
      <div
        className="
          -m-5
          border-b
          border-rose-100
          bg-gradient-to-br
          from-rose-50
          via-white
          to-white
          p-5
          sm:-m-6
          sm:mb-6
          sm:p-6
          dark:border-rose-500/10
          dark:from-rose-500/[0.10]
          dark:via-rose-950/20
          dark:to-card
        "
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-500">
              Emergency Protection
            </p>

            <h3 className="mt-1 text-base font-black text-card-foreground">
              Wallet Protection
            </h3>

            <p className="mt-1 text-[10px] text-muted-foreground">
              Emergency control for suspected
              account compromise.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 sm:pt-0">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

            <p className="text-xs leading-5 text-muted-foreground">
              Freezing your wallet should block
              outbound wallet activity until a
              protected backend authorization
              restores access.
            </p>
          </div>
        </div>

        {frozen ? (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-500/20 dark:bg-rose-500/10"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <Snowflake className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-black text-rose-700 dark:text-rose-200">
              Wallet is Frozen
            </p>

            <p className="mt-1 text-[10px] leading-4 text-rose-600/80 dark:text-rose-300/70">
              Backend authorization is required
              before the wallet can be unfrozen.
            </p>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            whileHover={{
              y: -1,
            }}
            whileTap={{
              scale: 0.985,
            }}
            onClick={onFreeze}
            className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700"
          >
            <Snowflake className="h-4 w-4" />
            Freeze Wallet
          </motion.button>
        )}
      </div>
    </Card>
  );
}

/* =========================================================
   PASSWORD MODAL
========================================================= */

function PasswordModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrent,
    setShowCurrent,
  ] = useState(false);

  const [
    showNew,
    setShowNew,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setError("");
    }
  }, [open]);

  const submit = () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Complete all password fields."
      );
      return;
    }

    if (
      newPassword.length < 8
    ) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New passwords do not match."
      );
      return;
    }

    setError("");
    onSuccess();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close password modal"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            className="relative z-10 w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--dashboard-primary)]">
                  Credentials
                </p>

                <h3 className="mt-1 text-2xl font-black text-card-foreground">
                  Change Password
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Verify your current password
                  before choosing a new one.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-muted p-2 text-muted-foreground hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <PasswordInput
                label="Current Password"
                value={
                  currentPassword
                }
                onChange={
                  setCurrentPassword
                }
                visible={
                  showCurrent
                }
                onToggleVisible={() =>
                  setShowCurrent(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              />

              <PasswordInput
                label="New Password"
                value={
                  newPassword
                }
                onChange={
                  setNewPassword
                }
                visible={
                  showNew
                }
                onToggleVisible={() =>
                  setShowNew(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              />

              <PasswordInput
                label="Confirm New Password"
                value={
                  confirmPassword
                }
                onChange={
                  setConfirmPassword
                }
                visible={
                  showConfirm
                }
                onToggleVisible={() =>
                  setShowConfirm(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-muted py-3 text-sm font-black text-card-foreground hover:bg-muted/80"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-xl bg-[var(--dashboard-primary)] py-3 text-sm font-black text-white hover:opacity-90"
              >
                Update Password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   PASSWORD INPUT
========================================================= */

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black text-card-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-border bg-muted/40 px-4 pr-11 text-sm font-semibold text-foreground outline-none transition focus:border-[var(--dashboard-primary)] focus:ring-4 focus:ring-[var(--dashboard-primary)]/10"
        />

        <button
          type="button"
          onClick={
            onToggleVisible
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FREEZE WALLET MODAL
========================================================= */

function FreezeWalletModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close freeze wallet modal"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="absolute inset-0 bg-rose-950/70 backdrop-blur-md"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            className="relative z-10 w-full max-w-md rounded-[30px] border border-border bg-card p-7 text-center shadow-2xl"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(244,63,94,.10)",
                  "0 0 0 16px rgba(244,63,94,0)",
                ],
              }}
              transition={{
                repeat:
                  Infinity,
                duration: 1.8,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <ShieldAlert className="h-8 w-8" />
            </motion.div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-widest text-rose-500">
              Emergency Action
            </p>

            <h3 className="mt-1 text-2xl font-black text-card-foreground">
              Freeze Wallet?
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This should only be used when you
              suspect unauthorized account
              activity.
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-muted py-3 text-sm font-black text-card-foreground hover:bg-muted/80"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-black text-white hover:bg-rose-700"
              >
                Yes, Freeze
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  toast,
  onClose,
}: {
  toast: {
    message: string;
    type: ToastType;
  } | null;

  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.95,
          }}
          className="fixed bottom-5 right-5 z-[120] flex w-[calc(100%-2.5rem)] max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-2xl"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              toast.type ===
              "success"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                : toast.type ===
                    "error"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                  : "bg-blue-100 text-blue-600 dark:bg-cyan-500/10 dark:text-cyan-300"
            }`}
          >
            {toast.type ===
            "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : toast.type ===
              "error" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Activity className="h-5 w-5" />
            )}
          </div>

          <p className="min-w-0 flex-1 text-xs font-black text-card-foreground">
            {
              toast.message
            }
          </p>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked
          ? "bg-[var(--dashboard-primary)]"
          : "bg-muted"
      }`}
    >
      <motion.span
        className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{
          x: checked
            ? 20
            : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 28,
        }}
      />
    </button>
  );
}

/* =========================================================
   CARD
========================================================= */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   ALERT LABEL
========================================================= */

function formatSettingName(
  key: keyof AlertSettings
) {
  if (
    key === "newDevice"
  ) {
    return "New device";
  }

  if (
    key ===
    "suspiciousActivity"
  ) {
    return "Suspicious activity";
  }

  return "Failed login";
}