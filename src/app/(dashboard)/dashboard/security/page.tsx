"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckSquare,
  Copy,
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

type ToastType = "success" | "error" | "info";

type TwoFAMethod =
  | "app"
  | "sms"
  | "email";

type RiskLevel =
  | "Low"
  | "Moderate"
  | "Elevated";

type ActivityStatus =
  | "success"
  | "warning"
  | "info";

type TwoFAModalMode =
  | "setup"
  | "disable"
  | "method"
  | "backup";

interface ToastState {
  message: string;
  type: ToastType;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SecurityEvent {
  id: string;
  type: string;
  title: string;
  status: ActivityStatus;
  detail: string;
  device: string;
  location: string;
  ip: string;
  createdAt: string;
}

interface ChecklistState {
  emailVerified: boolean;
  kycCompleted: boolean;
  strongPassword: boolean;
  twoFactorEnabled: boolean;
}

interface SecurityMetrics {
  activeSessions: number;
  failedLogins30d: number;
  enabledAlerts: number;
  walletFrozen: boolean;
}

interface SecurityState {
  score: number;
  riskLevel: RiskLevel;
  checklist: ChecklistState;
  metrics: SecurityMetrics;
  lastSecurityCheckAt: string | null;
}

interface AlertSettings {
  newDevice: boolean;
  suspiciousActivity: boolean;
  failedLogin: boolean;
}

interface DeliveryAvailability {
  app: boolean;
  email: boolean;
  sms: boolean;
}

/* =========================================================
   API TYPES
========================================================= */

interface SecurityOverviewResponse {
  success: boolean;

  security: {
    score: number;
    riskLevel: RiskLevel;

    checklist: {
      emailVerified: boolean;
      kycCompleted: boolean;
      strongPassword: boolean;
      twoFactorEnabled: boolean;
    };

    metrics: {
      activeSessions: number;
      failedLogins30d: number;
      enabledAlerts: number;
      walletFrozen: boolean;
    };

    lastSecurityCheckAt:
      | string
      | null;
  };

  twoFactor: {
    enabled: boolean;

    method: TwoFAMethod;

    deliveryAvailability: {
      app: boolean;
      email: boolean;
      sms: boolean;
    };
  };

  alerts: AlertSettings;

  message?: string;
}

interface SessionsResponse {
  success: boolean;
  count: number;

  sessions: Array<{
    id: string;
    device: string;
    browser: string;
    os: string;
    location: string;
    ip: string;
    lastActiveAt: string;
    expiresAt: string;
    createdAt: string;
    isCurrent: boolean;
  }>;

  message?: string;
}

interface ActivityResponse {
  success: boolean;

  events: SecurityEvent[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  message?: string;
}

interface AlertResponse {
  success: boolean;

  alerts: AlertSettings;

  message?: string;
}

interface TwoFASetupResponse {
  success: boolean;

  setup?: {
    method: "app";
    secret: string;
    otpauthUri: string;
  };

  message?: string;
}

interface TwoFAActionResponse {
  success: boolean;

  method?: TwoFAMethod;

  target?: string;

  backupCodes?: string[];

  warning?: string;

  message?: string;
}

interface WalletResponse {
  success: boolean;

  wallet?: {
    frozen: boolean;
    frozenAt?: string;
    unfrozenAt?: string;
  };

  message?: string;
}

interface SecurityCheckResponse {
  success: boolean;

  security?: SecurityState;

  message?: string;
}

interface PasswordResponse {
  success: boolean;

  message?: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_ALERTS: AlertSettings = {
  newDevice: true,
  suspiciousActivity: true,
  failedLogin: true,
};

/* =========================================================
   HELPERS
========================================================= */

const methodLabel = (
  method: TwoFAMethod
): string => {
  if (method === "app") {
    return "Authenticator";
  }

  return method.toUpperCase();
};

const formatDate = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatRelativeTime = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "Unknown";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diff = Date.now() - timestamp;

  if (diff < 30_000) {
    return "Active now";
  }

  if (diff < 60_000) {
    return "1 minute ago";
  }

  if (diff < 3_600_000) {
    return `${Math.floor(
      diff / 60_000
    )} minutes ago`;
  }

  if (diff < 86_400_000) {
    return `${Math.floor(
      diff / 3_600_000
    )} hours ago`;
  }

  if (diff < 604_800_000) {
    return `${Math.floor(
      diff / 86_400_000
    )} days ago`;
  }

  return formatDate(value);
};

const getSessionIcon = (
  device: string,
  os: string
) => {
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
};

const securityLabel = (
  score: number
): string => {
  if (score >= 90) {
    return "Strong";
  }

  if (score >= 75) {
    return "Healthy";
  }

  if (score >= 50) {
    return "Needs review";
  }

  return "At risk";
};

/* =========================================================
   PAGE
========================================================= */

export default function SecurityPage() {
  /* =======================================================
     MOUNT
  ======================================================= */

  const [mounted, setMounted] =
    useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const [toast, setToast] =
    useState<ToastState | null>(
      null
    );

  /* =======================================================
     OVERVIEW
  ======================================================= */

  const [
    loadingOverview,
    setLoadingOverview,
  ] = useState(true);

  const [
    overviewError,
    setOverviewError,
  ] = useState("");

  const [
    security,
    setSecurity,
  ] = useState<SecurityState>({
    score: 0,

    riskLevel: "Elevated",

    checklist: {
      emailVerified: false,
      kycCompleted: false,
      strongPassword: false,
      twoFactorEnabled: false,
    },

    metrics: {
      activeSessions: 0,
      failedLogins30d: 0,
      enabledAlerts: 0,
      walletFrozen: false,
    },

    lastSecurityCheckAt: null,
  });

  /* =======================================================
     2FA
  ======================================================= */

  const [
    twoFAEnabled,
    setTwoFAEnabled,
  ] = useState(false);

  const [
    twoFAMethod,
    setTwoFAMethod,
  ] = useState<TwoFAMethod>(
    "app"
  );

  const [
    deliveryAvailability,
    setDeliveryAvailability,
  ] =
    useState<DeliveryAvailability>({
      app: true,
      email: false,
      sms: false,
    });

  const [
    twoFAModal,
    setTwoFAModal,
  ] =
    useState<TwoFAModalMode | null>(
      null
    );

  const [
    twoFABusy,
    setTwoFABusy,
  ] = useState(false);

  const [
    twoFAPassword,
    setTwoFAPassword,
  ] = useState("");

  const [
    showTwoFAPassword,
    setShowTwoFAPassword,
  ] = useState(false);

  const [
    setupSecret,
    setSetupSecret,
  ] = useState("");

  const [
    setupUri,
    setSetupUri,
  ] = useState("");

  const [
    setupCode,
    setSetupCode,
  ] = useState("");

  const [
    selectedMethod,
    setSelectedMethod,
  ] = useState<TwoFAMethod>(
    "app"
  );

  const [
    backupCodes,
    setBackupCodes,
  ] = useState<string[]>([]);

  const [
    copied,
    setCopied,
  ] = useState(false);

  /* =======================================================
     ALERTS
  ======================================================= */

  const [
    alerts,
    setAlerts,
  ] = useState<AlertSettings>(
    DEFAULT_ALERTS
  );

  /* =======================================================
     SESSIONS
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
     ACTIVITY
  ======================================================= */

  const [
    events,
    setEvents,
  ] = useState<SecurityEvent[]>([]);

  const [
    activityLoading,
    setActivityLoading,
  ] = useState(false);

  const [
    showAllActivity,
    setShowAllActivity,
  ] = useState(false);

  /* =======================================================
     SECURITY CHECK
  ======================================================= */

  const [
    isScanning,
    setIsScanning,
  ] = useState(false);

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [
    passwordModalOpen,
    setPasswordModalOpen,
  ] = useState(false);

  const [
    passwordBusy,
    setPasswordBusy,
  ] = useState(false);

  /* =======================================================
     WALLET FREEZE
  ======================================================= */

  const [
    freezeModalOpen,
    setFreezeModalOpen,
  ] = useState(false);

  const [
    freezeBusy,
    setFreezeBusy,
  ] = useState(false);

  const [
    walletPassword,
    setWalletPassword,
  ] = useState("");

  const [
    showWalletPassword,
    setShowWalletPassword,
  ] = useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast =
    useCallback(
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
     LOAD OVERVIEW
  ======================================================= */

  const loadOverview =
    useCallback(
      async () => {
        setLoadingOverview(
          true
        );

        setOverviewError("");

        try {
          const response =
            await apiClient<SecurityOverviewResponse>(
              "/security/overview",
              {
                method: "GET",
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Failed to load Security Center."
            );
          }

          setSecurity(
            response.security
          );

          setTwoFAEnabled(
            response.twoFactor
              .enabled
          );

          setTwoFAMethod(
            response.twoFactor
              .method
          );

          setSelectedMethod(
            response.twoFactor
              .method
          );

          setDeliveryAvailability(
            response.twoFactor
              .deliveryAvailability
          );

          setAlerts(
            response.alerts
          );
        } catch (
          error
        ) {
          console.error(
            "SECURITY OVERVIEW ERROR:",
            error
          );

          setOverviewError(
            error instanceof Error
              ? error.message
              : "Failed to load Security Center."
          );
        } finally {
          setLoadingOverview(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD SESSIONS
  ======================================================= */

  const loadSessions =
    useCallback(
      async () => {
        setSessionsLoading(
          true
        );

        setSessionsError("");

        try {
          const response =
            await apiClient<SessionsResponse>(
              "/security/sessions",
              {
                method: "GET",
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Failed to load sessions."
            );
          }

          const mapped: Session[] =
            response.sessions.map(
              (session) => ({
                id:
                  session.id,

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
                  session.ip ||
                  "",

                lastActiveAt:
                  session.lastActiveAt,

                expiresAt:
                  session.expiresAt,

                createdAt:
                  session.createdAt,

                isCurrent:
                  session.isCurrent,
              })
            );

          setSessions(mapped);
        } catch (
          error
        ) {
          console.error(
            "SECURITY SESSIONS ERROR:",
            error
          );

          setSessionsError(
            error instanceof Error
              ? error.message
              : "Failed to load sessions."
          );
        } finally {
          setSessionsLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD ACTIVITY
  ======================================================= */

  const loadActivity =
    useCallback(
      async () => {
        setActivityLoading(
          true
        );

        try {
          const response =
            await apiClient<ActivityResponse>(
              "/security/activity?page=1&limit=50",
              {
                method: "GET",
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Failed to load security activity."
            );
          }

          setEvents(
            response.events
          );
        } catch (
          error
        ) {
          console.error(
            "SECURITY ACTIVITY ERROR:",
            error
          );

          showToast(
            error instanceof Error
              ? error.message
              : "Failed to load security activity.",
            "error"
          );
        } finally {
          setActivityLoading(
            false
          );
        }
      },
      [showToast]
    );

  /* =======================================================
     REFRESH ALL
  ======================================================= */

  const refreshAll =
    useCallback(
      async () => {
        await Promise.all([
          loadOverview(),
          loadSessions(),
          loadActivity(),
        ]);
      },
      [
        loadOverview,
        loadSessions,
        loadActivity,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setMounted(true);

    void refreshAll();

    const timer =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void refreshAll();
          }
        },
        30_000
      );

    const handleFocus =
      () => {
        void refreshAll();
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.clearInterval(
        timer
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [refreshAll]);

  /* =======================================================
     TOAST AUTO DISMISS
  ======================================================= */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast(null);
        },
        3000
      );

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
          alerts
        ).filter(Boolean)
          .length,
      [alerts]
    );

  const failedLoginCount =
    security.metrics
      .failedLogins30d;

  const visibleEvents =
    showAllActivity
      ? events
      : events.slice(0, 5);

  /* =======================================================
     ALERT UPDATE
  ======================================================= */

  const updateAlert =
    async (
      key: keyof AlertSettings
    ) => {
      const previousValue =
        alerts[key];

      const nextValue =
        !previousValue;

      setAlerts(
        (current) => ({
          ...current,
          [key]: nextValue,
        })
      );

      try {
        const response =
          await apiClient<AlertResponse>(
            "/security/alerts",
            {
              method: "PATCH",

              body:
                JSON.stringify({
                  [key]: nextValue,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to update alert preference."
          );
        }

        setAlerts(
          response.alerts
        );

        setSecurity(
          (current) => ({
            ...current,

            metrics: {
              ...current.metrics,

              enabledAlerts:
                Object.values(
                  response.alerts
                ).filter(
                  Boolean
                ).length,
            },
          })
        );

        const label =
          key === "newDevice"
            ? "New device"
            : key ===
                "suspiciousActivity"
              ? "Suspicious activity"
              : "Failed login";

        showToast(
          `${label} alerts ${
            nextValue
              ? "enabled"
              : "disabled"
          }.`
        );

        await loadActivity();
      } catch (
        error
      ) {
        setAlerts(
          (current) => ({
            ...current,
            [key]:
              previousValue,
          })
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Failed to update alert preference.",
          "error"
        );
      }
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
          await apiClient<PasswordResponse>(
            `/security/sessions/${encodeURIComponent(
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
              "Failed to sign out session."
          );
        }

        setSessions(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                sessionId
            )
        );

        showToast(
          response.message ||
            "Session signed out successfully."
        );

        await Promise.all([
          loadOverview(),
          loadActivity(),
        ]);
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to sign out session.",
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
      setSessionActionLoading(
        "others"
      );

      try {
        const response =
          await apiClient<PasswordResponse>(
            "/security/sessions/others",
            {
              method: "DELETE",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to sign out other sessions."
          );
        }

        setSessions(
          (current) =>
            current.filter(
              (item) =>
                item.isCurrent
            )
        );

        showToast(
          response.message ||
            "Other sessions signed out successfully."
        );

        await Promise.all([
          loadOverview(),
          loadActivity(),
        ]);
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to sign out other sessions.",
          "error"
        );
      } finally {
        setSessionActionLoading(
          null
        );
      }
    };

  /* =======================================================
     SECURITY CHECK
  ======================================================= */

  const runSecurityCheck =
    async () => {
      if (isScanning) {
        return;
      }

      setIsScanning(true);

      try {
        const response =
          await apiClient<SecurityCheckResponse>(
            "/security/check",
            {
              method: "POST",
            }
          );

        if (
          !response.success ||
          !response.security
        ) {
          throw new Error(
            response.message ||
              "Security check failed."
          );
        }

        setSecurity(
          response.security
        );

        showToast(
          `Security check complete. Score: ${response.security.score}/100.`
        );

        await loadActivity();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Security check failed.",
          "error"
        );
      } finally {
        setIsScanning(false);
      }
    };

  /* =======================================================
     2FA START SETUP
  ======================================================= */

  const startTwoFASetup =
    async () => {
      if (
        !twoFAPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setTwoFABusy(true);

      try {
        const response =
          await apiClient<TwoFASetupResponse>(
            "/security/2fa/setup/start",
            {
              method: "POST",

              body:
                JSON.stringify({
                  password:
                    twoFAPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success ||
          !response.setup
        ) {
          throw new Error(
            response.message ||
              "Failed to start 2FA setup."
          );
        }

        setSetupSecret(
          response.setup.secret
        );

        setSetupUri(
          response.setup.otpauthUri
        );

        setSetupCode("");

        setTwoFAPassword("");

        setTwoFAModal("setup");

        showToast(
          "2FA setup started. Add the secret to your authenticator app.",
          "info"
        );
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to start 2FA setup.",
          "error"
        );
      } finally {
        setTwoFABusy(false);
      }
    };

  /* =======================================================
     VERIFY 2FA
  ======================================================= */

  const verifyTwoFASetup =
    async () => {
      const code =
        setupCode.trim();

      if (
        !/^\d{6}$/.test(code)
      ) {
        showToast(
          "Enter the 6-digit authenticator code.",
          "error"
        );

        return;
      }

      setTwoFABusy(true);

      try {
        const response =
          await apiClient<TwoFAActionResponse>(
            "/security/2fa/setup/verify",
            {
              method: "POST",

              body:
                JSON.stringify({
                  code,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to enable 2FA."
          );
        }

        setTwoFAEnabled(true);

        setTwoFAMethod(
          "app"
        );

        setSelectedMethod(
          "app"
        );

        setTwoFAModal(null);

        setSetupCode("");

        setSetupSecret("");

        setSetupUri("");

        setTwoFAPassword("");

        if (
          response.backupCodes
            ?.length
        ) {
          setBackupCodes(
            response.backupCodes
          );
        }

        showToast(
          response.message ||
            "Two-factor authentication enabled."
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to enable 2FA.",
          "error"
        );
      } finally {
        setTwoFABusy(false);
      }
    };

  /* =======================================================
     DISABLE 2FA
  ======================================================= */

  const disableTwoFA =
    async () => {
      if (
        !twoFAPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setTwoFABusy(true);

      try {
        const response =
          await apiClient<TwoFAActionResponse>(
            "/security/2fa/disable",
            {
              method: "POST",

              body:
                JSON.stringify({
                  password:
                    twoFAPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to disable 2FA."
          );
        }

        setTwoFAEnabled(
          false
        );

        setTwoFAMethod(
          "app"
        );

        setSelectedMethod(
          "app"
        );

        setTwoFAModal(null);

        setTwoFAPassword("");

        setBackupCodes([]);

        showToast(
          response.message ||
            "Two-factor authentication disabled.",
          "info"
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to disable 2FA.",
          "error"
        );
      } finally {
        setTwoFABusy(false);
      }
    };

  /* =======================================================
     CHANGE 2FA METHOD
  ======================================================= */

  const updateTwoFAMethod =
    async () => {
      if (
        !twoFAPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setTwoFABusy(true);

      try {
        const response =
          await apiClient<TwoFAActionResponse>(
            "/security/2fa/method",
            {
              method: "PATCH",

              body:
                JSON.stringify({
                  method:
                    selectedMethod,

                  password:
                    twoFAPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to change 2FA method."
          );
        }

        const updatedMethod =
          response.method ||
          selectedMethod;

        setTwoFAMethod(
          updatedMethod
        );

        setSelectedMethod(
          updatedMethod
        );

        setTwoFAModal(null);

        setTwoFAPassword("");

        showToast(
          response.message ||
            `Primary 2FA method changed to ${methodLabel(
              updatedMethod
            )}.`
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to change 2FA method.",
          "error"
        );
      } finally {
        setTwoFABusy(false);
      }
    };

  /* =======================================================
     BACKUP CODES
  ======================================================= */

  const regenerateBackupCodes =
    async () => {
      if (
        !twoFAPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setTwoFABusy(true);

      try {
        const response =
          await apiClient<TwoFAActionResponse>(
            "/security/2fa/backup-codes",
            {
              method: "POST",

              body:
                JSON.stringify({
                  password:
                    twoFAPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to regenerate backup codes."
          );
        }

        setBackupCodes(
          response.backupCodes ||
            []
        );

        setTwoFAModal(null);

        setTwoFAPassword("");

        showToast(
          response.message ||
            "New backup codes generated."
        );

        await loadActivity();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to regenerate backup codes.",
          "error"
        );
      } finally {
        setTwoFABusy(false);
      }
    };

  /* =======================================================
     PASSWORD
  ======================================================= */

  const changePassword =
    async (
      currentPassword: string,
      newPassword: string
    ) => {
      setPasswordBusy(
        true
      );

      try {
        const response =
          await apiClient<PasswordResponse>(
            "/security/password",
            {
              method: "POST",

              body:
                JSON.stringify({
                  currentPassword,
                  newPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to change password."
          );
        }

        setPasswordModalOpen(
          false
        );

        showToast(
          response.message ||
            "Password changed successfully."
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to change password.",
          "error"
        );

        throw error;
      } finally {
        setPasswordBusy(
          false
        );
      }
    };

  /* =======================================================
     FREEZE
  ======================================================= */

  const freezeWallet =
    async () => {
      if (
        !walletPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setFreezeBusy(true);

      try {
        const response =
          await apiClient<WalletResponse>(
            "/security/wallet/freeze",
            {
              method: "POST",

              body:
                JSON.stringify({
                  password:
                    walletPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to freeze wallet."
          );
        }

        setFreezeModalOpen(
          false
        );

        setWalletPassword("");

        showToast(
          response.message ||
            "Wallet frozen successfully.",
          "info"
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to freeze wallet.",
          "error"
        );
      } finally {
        setFreezeBusy(false);
      }
    };

  /* =======================================================
     UNFREEZE
  ======================================================= */

  const unfreezeWallet =
    async () => {
      if (
        !walletPassword.trim()
      ) {
        showToast(
          "Enter your current password first.",
          "error"
        );

        return;
      }

      setFreezeBusy(true);

      try {
        const response =
          await apiClient<WalletResponse>(
            "/security/wallet/unfreeze",
            {
              method: "POST",

              body:
                JSON.stringify({
                  password:
                    walletPassword,
                }),

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Failed to unfreeze wallet."
          );
        }

        setFreezeModalOpen(
          false
        );

        setWalletPassword("");

        showToast(
          response.message ||
            "Wallet unfrozen successfully."
        );

        await refreshAll();
      } catch (
        error
      ) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to unfreeze wallet.",
          "error"
        );
      } finally {
        setFreezeBusy(false);
      }
    };

  /* =======================================================
     COPY SETUP SECRET
  ======================================================= */

  const copySetupData =
    async () => {
      if (!setupSecret) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          setupSecret
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          1800
        );

        showToast(
          "Authenticator secret copied."
        );
      } catch {
        showToast(
          "Could not copy the secret.",
          "error"
        );
      }
    };

  /* =======================================================
     COPY BACKUP
  ======================================================= */

  const copyBackupCodes =
    async () => {
      if (
        backupCodes.length ===
        0
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          backupCodes.join("\n")
        );

        showToast(
          "Backup codes copied."
        );
      } catch {
        showToast(
          "Could not copy backup codes.",
          "error"
        );
      }
    };

  /* =======================================================
     OPEN SESSIONS
  ======================================================= */

  const reviewSessions =
    async () => {
      await loadSessions();

      window.setTimeout(
        () => {
          document
            .getElementById(
              "active-sessions"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block: "start",
            });
        },
        50
      );
    };

  /* =======================================================
     PRE-MOUNT
  ======================================================= */

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <div className="mx-auto max-w-[1450px] space-y-8 px-3 py-4 sm:px-5 lg:px-7">

        {/* HERO */}

        <SecurityHero
          score={security.score}
          riskLevel={
            security.riskLevel
          }
          loading={
            loadingOverview
          }
          lastChecked={
            security.lastSecurityCheckAt
          }
          onRefresh={() =>
            void refreshAll()
          }
        />

        {/* OVERVIEW ERROR */}

        {overviewError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {overviewError}
          </div>
        )}

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">

          {/* LEFT */}

          <div className="min-w-0 space-y-8">

            {/* 2FA */}

            <TwoFactorCard
              enabled={
                twoFAEnabled
              }
              method={
                twoFAMethod
              }
              availability={
                deliveryAvailability
              }
              busy={
                twoFABusy
              }
              onEnable={() => {
                setTwoFAPassword(
                  ""
                );

                setShowTwoFAPassword(
                  false
                );

                setSetupSecret(
                  ""
                );

                setSetupUri(
                  ""
                );

                setSetupCode(
                  ""
                );

                setTwoFAModal(
                  "setup"
                );
              }}
              onDisable={() => {
                setTwoFAPassword(
                  ""
                );

                setShowTwoFAPassword(
                  false
                );

                setTwoFAModal(
                  "disable"
                );
              }}
              onMethodChange={(
                method
              ) => {
                setSelectedMethod(
                  method
                );

                setTwoFAPassword(
                  ""
                );

                setShowTwoFAPassword(
                  false
                );

                setTwoFAModal(
                  "method"
                );
              }}
              onBackupCodes={() => {
                setTwoFAPassword(
                  ""
                );

                setShowTwoFAPassword(
                  false
                );

                setTwoFAModal(
                  "backup"
                );
              }}
            />

            {/* PASSWORD */}

            <PasswordCard
              onChangePassword={() =>
                setPasswordModalOpen(
                  true
                )
              }
            />

            {/* SESSIONS */}

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

            {/* ACTIVITY */}

            <RecentActivityCard
              events={
                visibleEvents
              }
              expanded={
                showAllActivity
              }
              loading={
                activityLoading
              }
              onToggle={() =>
                setShowAllActivity(
                  (value) =>
                    !value
                )
              }
            />
          </div>

          {/* RIGHT */}

          <aside className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-6">

            {/* CHECKLIST */}

            <ProtectionChecklist
              checklist={
                security.checklist
              }
            />

            {/* ALERTS */}

            <LoginAlerts
              settings={
                alerts
              }
              onChange={
                updateAlert
              }
            />

            {/* MONITOR */}

            <SecurityIntelligence
              score={
                security.score
              }
              riskLevel={
                security.riskLevel
              }
              sessionCount={
                security.metrics
                  .activeSessions
              }
              warningCount={
                failedLoginCount
              }
              enabledAlerts={
                enabledAlertCount
              }
              is2FAEnabled={
                twoFAEnabled
              }
              isWalletFrozen={
                security.metrics
                  .walletFrozen
              }
              scanning={
                isScanning
              }
              lastChecked={
                security.lastSecurityCheckAt
              }
              onScan={() =>
                void runSecurityCheck()
              }
              onReviewSessions={
                reviewSessions
              }
            />

            {/* TIPS */}

            <SecurityTips />

            {/* EMERGENCY */}

            <EmergencyProtection
              frozen={
                security.metrics
                  .walletFrozen
              }
              busy={
                freezeBusy
              }
              onOpen={() => {
                setWalletPassword(
                  ""
                );

                setShowWalletPassword(
                  false
                );

                setFreezeModalOpen(
                  true
                );
              }}
              onUnfreeze={() => {
                setWalletPassword(
                  ""
                );

                setShowWalletPassword(
                  false
                );

                setFreezeModalOpen(
                  true
                );
              }}
            />
          </aside>
        </div>
      </div>

      {/* PASSWORD MODAL */}

      <AnimatePresence>
        {passwordModalOpen && (
          <PasswordModal
            busy={
              passwordBusy
            }
            onClose={() =>
              setPasswordModalOpen(
                false
              )
            }
            onSubmit={
              changePassword
            }
          />
        )}
      </AnimatePresence>

      {/* 2FA MODAL */}

      <AnimatePresence>
        {twoFAModal && (
          <TwoFAModal
            mode={
              twoFAModal
            }
            enabled={
              twoFAEnabled
            }
            busy={
              twoFABusy
            }
            password={
              twoFAPassword
            }
            setPassword={
              setTwoFAPassword
            }
            showPassword={
              showTwoFAPassword
            }
            setShowPassword={
              setShowTwoFAPassword
            }
            secret={
              setupSecret
            }
            uri={
              setupUri
            }
            code={
              setupCode
            }
            setCode={
              setSetupCode
            }
            selectedMethod={
              selectedMethod
            }
            setSelectedMethod={
              setSelectedMethod
            }
            availability={
              deliveryAvailability
            }
            backupCodes={
              backupCodes
            }
            onClose={() =>
              setTwoFAModal(
                null
              )
            }
            onStart={
              startTwoFASetup
            }
            onVerify={
              verifyTwoFASetup
            }
            onDisable={
              disableTwoFA
            }
            onUpdateMethod={
              updateTwoFAMethod
            }
            onRegenerate={
              regenerateBackupCodes
            }
            onCopySecret={
              copySetupData
            }
            copied={
              copied
            }
            onCopyBackupCodes={
              copyBackupCodes
            }
          />
        )}
      </AnimatePresence>

      {/* WALLET MODAL */}

      <AnimatePresence>
        {freezeModalOpen && (
          <FreezeWalletModal
            frozen={
              security.metrics
                .walletFrozen
            }
            busy={
              freezeBusy
            }
            password={
              walletPassword
            }
            setPassword={
              setWalletPassword
            }
            showPassword={
              showWalletPassword
            }
            setShowPassword={
              setShowWalletPassword
            }
            onClose={() =>
              setFreezeModalOpen(
                false
              )
            }
            onConfirm={() =>
              security.metrics
                .walletFrozen
                ? void unfreezeWallet()
                : void freezeWallet()
            }
          />
        )}
      </AnimatePresence>

      {/* BACKUP CODES */}

      {backupCodes.length >
        0 && (
        <BackupCodesModal
          codes={
            backupCodes
          }
          onCopy={
            copyBackupCodes
          }
          onClose={() =>
            setBackupCodes([])
          }
        />
      )}

      {/* TOAST */}

      <Toast
        toast={
          toast
        }
        onClose={() =>
          setToast(null)
        }
      />
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function SecurityHero({
  score,
  riskLevel,
  loading,
  lastChecked,
  onRefresh,
}: {
  score: number;
  riskLevel: RiskLevel;
  loading: boolean;
  lastChecked: string | null;
  onRefresh: () => void;
}) {
  const circumference =
    2 * Math.PI * 45;

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
        duration: 0.5,
      }}
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#17133B] via-[#24185A] to-[#3D237A] p-7 text-white shadow-[0_24px_70px_rgba(39,24,93,0.22)] sm:p-9"
    >
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-violet-200/10"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-4 top-4 h-44 w-44 rounded-full border border-cyan-200/10"
        animate={{
          scale: [
            0.94,
            1.08,
            0.94,
          ],
          opacity: [
            0.3,
            0.7,
            0.3,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="pointer-events-none absolute bottom-[-80px] left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
        animate={{
          scale: [
            0.9,
            1.15,
            0.9,
          ],
          opacity: [
            0.2,
            0.45,
            0.2,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4" />

            Live account protection
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            Security Center
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-violet-100/75 sm:text-base">
            Manage real authentication,
            active sessions, login
            alerts, security checks and
            wallet emergency protection
            from one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill
              text={`${riskLevel} risk`}
              tone={
                riskLevel ===
                "Low"
                  ? "green"
                  : "amber"
              }
            />

            <StatusPill
              text={`${securityLabel(
                score
              )} protection`}
              tone="blue"
            />
          </div>

          <p className="mt-4 text-[10px] text-violet-100/45">
            Last security check:{" "}
            {loading
              ? "Loading..."
              : formatDate(
                  lastChecked
                )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <div className="relative h-36 w-36">
            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="8"
              />

              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#C4B5FD"
                strokeWidth="8"
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
                  duration: 1.4,
                  ease: "easeOut",
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{
                  scale: 0.82,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                className="text-3xl font-black"
              >
                {score}
              </motion.span>

              <span className="text-xs text-violet-200">
                /100
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm font-bold text-violet-200">
            Security Score
          </p>

          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white transition hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />

            Refresh live data
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* =========================================================
   2FA CARD
========================================================= */

function TwoFactorCard({
  enabled,
  method,
  availability,
  busy,
  onEnable,
  onDisable,
  onMethodChange,
  onBackupCodes,
}: {
  enabled: boolean;
  method: TwoFAMethod;
  availability: DeliveryAvailability;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onMethodChange: (
    method: TwoFAMethod
  ) => void;
  onBackupCodes: () => void;
}) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`shrink-0 rounded-2xl p-3 ${
              enabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Fingerprint className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Authentication
            </p>

            <h2 className="mt-1 text-xl font-black text-card-foreground">
              Two-Factor Authentication
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Protect sign-in and
              sensitive actions with
              a second verification
              layer.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/50 px-3 py-2">
          <span
            className={`text-sm font-bold ${
              enabled
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-muted-foreground"
            }`}
          >
            {enabled
              ? "Enabled"
              : "Disabled"}
          </span>

          <Toggle
            checked={
              enabled
            }
            disabled={
              busy
            }
            onChange={
              enabled
                ? onDisable
                : onEnable
            }
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200/70 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-400/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700 dark:text-violet-300" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-violet-950 dark:text-violet-100">
              {enabled
                ? `Primary method: ${methodLabel(
                    method
                  )}`
                : "2FA is currently disabled"}
            </p>

            <p className="mt-1 text-xs leading-5 text-violet-900/70 dark:text-violet-100/60">
              {enabled
                ? "The current method is stored on the backend and will be used during the next authentication challenge."
                : "Enable Authenticator-based 2FA to generate a secure secret and backup codes."}
            </p>
          </div>
        </div>
      </div>

      {enabled && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MethodCard
              active={
                method ===
                "app"
              }
              available={
                availability.app
              }
              icon={
                Fingerprint
              }
              label="Authenticator"
              description="TOTP authenticator app"
              onClick={() =>
                onMethodChange(
                  "app"
                )
              }
            />

            <MethodCard
              active={
                method ===
                "sms"
              }
              available={
                availability.sms
              }
              icon={
                Smartphone
              }
              label="SMS"
              description={
                availability.sms
                  ? "Available on server"
                  : "Not configured"
              }
              onClick={() =>
                onMethodChange(
                  "sms"
                )
              }
            />

            <MethodCard
              active={
                method ===
                "email"
              }
              available={
                availability.email
              }
              icon={Mail}
              label="Email"
              description={
                availability.email
                  ? "Available on server"
                  : "Not configured"
              }
              onClick={() =>
                onMethodChange(
                  "email"
                )
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onMethodChange(
                  method
                )
              }
              className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change Method
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={
                onBackupCodes
              }
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Regenerate Backup Codes
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={
                onDisable
              }
              className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
            >
              Disable 2FA
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

/* =========================================================
   METHOD CARD
========================================================= */

function MethodCard({
  active,
  available,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  available: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-violet-600 bg-violet-50 shadow-md dark:border-violet-400 dark:bg-violet-400/10"
          : available
            ? "border-border bg-card hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-sm"
            : "cursor-not-allowed border-border bg-muted/30 opacity-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            active
              ? "bg-violet-700 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {active && (
          <CheckCircle2 className="h-4 w-4 text-violet-700 dark:text-violet-300" />
        )}
      </div>

      <p className="mt-4 text-sm font-black text-card-foreground">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      {!available && (
        <p className="mt-2 text-[10px] font-bold text-rose-500">
          Backend provider unavailable
        </p>
      )}
    </button>
  );
}

/* =========================================================
   PASSWORD CARD
========================================================= */

function PasswordCard({
  onChangePassword,
}: {
  onChangePassword: () => void;
}) {
  return (
    <Card className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
          <Key className="h-6 w-6" />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Credentials
          </p>

          <h2 className="text-xl font-black text-card-foreground">
            Password Security
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Change your password using
            the protected backend
            endpoint.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onChangePassword
        }
        className="shrink-0 rounded-xl border-2 border-violet-700 px-6 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-400/10"
      >
        Change Password
      </button>
    </Card>
  );
}

/* =========================================================
   SESSIONS
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
      (item) =>
        !item.isCurrent
    );

  return (
    <div
      id="active-sessions"
      className="scroll-mt-6"
    >
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-6 md:flex-row md:items-center md:p-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Devices
            </p>

            <h2 className="mt-1 text-xl font-black text-card-foreground">
              Active Sessions
            </h2>

            <p className="text-sm text-muted-foreground">
              Live server-side
              sessions for your
              account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={
                onReload
              }
              disabled={
                loading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/15"
              >
                <LogOut className="h-4 w-4" />

                {actionLoading ===
                "others"
                  ? "Signing out..."
                  : "Sign out others"}
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="divide-y divide-border">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={
                    item
                  }
                  className="flex animate-pulse gap-4 p-6"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted" />

                    <div className="h-3 w-32 rounded bg-muted" />

                    <div className="h-3 w-52 rounded bg-muted" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {!loading &&
          error && (
            <div className="p-6">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-400/20 dark:bg-rose-400/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />

                  <div className="min-w-0">
                    <p className="font-bold text-rose-800 dark:text-rose-200">
                      Could not load sessions
                    </p>

                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-200/80">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={
                        onReload
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
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
          sessions.length ===
            0 && (
            <div className="p-8 text-center">
              <Laptop className="mx-auto h-10 w-10 text-muted-foreground/35" />

              <p className="mt-3 text-sm font-bold text-card-foreground">
                No active sessions
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No active authentication
                sessions were returned
                by the server.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          sessions.length >
            0 && (
            <div className="divide-y divide-border">
              {sessions.map(
                (
                  session
                ) => {
                  const Icon =
                    getSessionIcon(
                      session.device,
                      session.os
                    );

                  return (
                    <div
                      key={
                        session.id
                      }
                      className="flex flex-col justify-between gap-4 p-6 transition hover:bg-muted/25 md:flex-row md:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`mt-1 rounded-xl p-2.5 ${
                            session.isCurrent
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-card-foreground">
                              {
                                session.device
                              }
                            </p>

                            {session.isCurrent && (
                              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {
                              session.browser
                            }{" "}
                            on{" "}
                            {
                              session.os
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground/75">
                            {
                              session.location
                            }

                            {session.ip && (
                              <>
                                {" "}
                                •{" "}
                                {
                                  session.ip
                                }
                              </>
                            )}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
                            <span>
                              Last active{" "}
                              {formatRelativeTime(
                                session.lastActiveAt
                              )}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              Created{" "}
                              {formatDate(
                                session.createdAt
                              )}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              Expires{" "}
                              {formatDate(
                                session.expiresAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
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
                          className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-400/10 md:self-auto"
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
                  );
                }
              )}
            </div>
          )}
      </Card>
    </div>
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

function RecentActivityCard({
  events,
  expanded,
  loading,
  onToggle,
}: {
  events: SecurityEvent[];
  expanded: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-6 md:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Audit log
          </p>

          <h2 className="mt-1 text-xl font-black text-card-foreground">
            Recent Security Activity
          </h2>

          <p className="text-sm text-muted-foreground">
            Events are loaded from
            the backend security audit
            collection.
          </p>
        </div>

        <button
          type="button"
          onClick={
            onToggle
          }
          className="shrink-0 text-sm font-bold text-violet-700 hover:underline dark:text-violet-300"
        >
          {expanded
            ? "Show Less"
            : "View All"}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={
                  item
                }
                className="animate-pulse rounded-2xl bg-muted p-4"
              >
                <div className="h-4 w-48 rounded bg-muted-foreground/10" />

                <div className="mt-2 h-3 w-72 rounded bg-muted-foreground/10" />
              </div>
            )
          )}
        </div>
      )}

      {!loading &&
        events.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <History className="mx-auto h-10 w-10 text-muted-foreground/35" />

            <p className="mt-3 text-sm font-bold text-card-foreground">
              No security activity yet
            </p>
          </div>
        )}

      {!loading &&
        events.length >
          0 && (
          <div className="relative ml-4 space-y-8 border-l-2 border-border pb-4">
            <AnimatePresence
              initial={false}
            >
              {events.map(
                (
                  event,
                  index
                ) => {
                  const Icon =
                    event.status ===
                    "success"
                      ? CheckCircle2
                      : event.status ===
                          "warning"
                        ? AlertTriangle
                        : Activity;

                  const tone =
                    event.status ===
                    "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : event.status ===
                          "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                        : "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300";

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
                          0.04,
                      }}
                      className="relative pl-8"
                    >
                      <div
                        className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card ${tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <p className="font-semibold text-card-foreground">
                        {
                          event.title
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(
                          event.createdAt
                        )}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        {event.device && (
                          <span className="rounded-lg bg-muted px-2 py-1">
                            {
                              event.device
                            }
                          </span>
                        )}

                        {event.location && (
                          <span className="rounded-lg bg-muted px-2 py-1">
                            {
                              event.location
                            }
                          </span>
                        )}

                        {event.ip && (
                          <span className="rounded-lg bg-muted px-2 py-1">
                            {
                              event.ip
                            }
                          </span>
                        )}
                      </div>

                      {event.detail && (
                        <p className="mt-2 inline-block rounded-lg bg-muted px-3 py-2 text-sm leading-5 text-muted-foreground">
                          {
                            event.detail
                          }
                        </p>
                      )}
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>
          </div>
        )}
    </Card>
  );
}

/* =========================================================
   CHECKLIST
========================================================= */

function ProtectionChecklist({
  checklist,
}: {
  checklist: ChecklistState;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />

        <h3 className="font-black text-card-foreground">
          Protection Checklist
        </h3>
      </div>

      <div className="mt-6 space-y-4">
        <ChecklistItem
          label="Email Verified"
          checked={
            checklist.emailVerified
          }
        />

        <ChecklistItem
          label="KYC Completed"
          checked={
            checklist.kycCompleted
          }
        />

        <ChecklistItem
          label="Strong Password"
          checked={
            checklist.strongPassword
          }
        />

        <ChecklistItem
          label="Two-Factor Authentication"
          checked={
            checklist.twoFactorEnabled
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
    <div
      className={`flex items-center gap-3 ${
        checked
          ? "text-emerald-600 dark:text-emerald-300"
          : "text-amber-500 dark:text-amber-300"
      }`}
    >
      {checked ? (
        <CheckSquare className="h-5 w-5" />
      ) : (
        <Square className="h-5 w-5" />
      )}

      <span className="text-sm font-semibold">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   ALERTS
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
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-violet-700 dark:text-violet-300" />

        <h3 className="font-black text-card-foreground">
          Login Alerts
        </h3>
      </div>

      <div className="mt-6 space-y-5">
        <AlertToggleRow
          title="New Devices"
          description="Notify when a new device signs in."
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
          description="Notify about unusual sign-in activity."
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
          description="Notify when authentication attempts fail."
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
        <p className="text-sm font-semibold text-card-foreground">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
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
   SECURITY INTELLIGENCE
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
  riskLevel: RiskLevel;
  sessionCount: number;
  warningCount: number;
  enabledAlerts: number;
  is2FAEnabled: boolean;
  isWalletFrozen: boolean;
  scanning: boolean;
  lastChecked: string | null;
  onScan: () => void;
  onReviewSessions: () => void;
}) {
  return (
    <motion.section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#17133B] via-[#24185A] to-[#3D237A] p-6 text-white shadow-[0_22px_60px_rgba(39,24,93,.22)]">
      <motion.div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-violet-200/10"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="pointer-events-none absolute bottom-[-70px] left-[-60px] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
        animate={{
          scale: [
            0.9,
            1.15,
            0.9,
          ],
          opacity: [
            0.2,
            0.5,
            0.2,
          ],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200/55">
              Security Intelligence
            </p>

            <h3 className="mt-1 text-xl font-black">
              Protection Monitor
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-violet-100/55">
              Live backend-driven
              security posture.
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-[9px] font-black ${
              riskLevel ===
              "Low"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : riskLevel ===
                    "Moderate"
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-200"
            }`}
          >
            {riskLevel} Risk
          </span>
        </div>

        <div className="relative mx-auto my-7 flex h-44 w-44 items-center justify-center">
          {[100, 76, 52].map(
            (
              size,
              index
            ) => (
              <motion.div
                key={
                  size
                }
                className="absolute left-1/2 top-1/2 rounded-full border border-violet-200/15"
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
                          0.88,
                          1.08,
                          0.88,
                        ],
                        opacity: [
                          0.2,
                          0.85,
                          0.2,
                        ],
                      }
                    : {
                        scale: 1,
                        opacity:
                          0.45,
                      }
                }
                transition={{
                  duration:
                    1.25 +
                    index *
                      0.25,
                  repeat:
                    scanning
                      ? Infinity
                      : 0,
                }}
              />
            )
          )}

          <motion.div
            animate={
              scanning
                ? {
                    scale: [
                      1,
                      1.08,
                      1,
                    ],
                  }
                : undefined
            }
            transition={{
              repeat:
                scanning
                  ? Infinity
                  : 0,
              duration: 1.1,
            }}
            className="absolute z-10 flex h-20 w-20 flex-col items-center justify-center rounded-[26px] border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_45px_rgba(34,211,238,0.12)]"
          >
            <Fingerprint className="h-8 w-8 text-cyan-200" />

            <span className="mt-1 text-lg font-black">
              {score}
            </span>
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 h-[2px] w-[48%] origin-left bg-gradient-to-r from-cyan-300 via-violet-300/70 to-transparent"
            animate={{
              rotate:
                scanning
                  ? 360
                  : 32,
            }}
            transition={{
              repeat:
                scanning
                  ? Infinity
                  : 0,
              duration: 1.7,
              ease: "linear",
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <IntelligenceMetric
            label="Score"
            value={String(
              score
            )}
          />

          <IntelligenceMetric
            label="Sessions"
            value={String(
              sessionCount
            )}
          />

          <IntelligenceMetric
            label="Warnings"
            value={String(
              warningCount
            )}
          />
        </div>

        <div className="mt-4 space-y-2">
          <SecuritySignal
            icon={
              ShieldCheck
            }
            label="Two-factor protection"
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
            value={String(
              sessionCount
            )}
            healthy={
              sessionCount <=
              3
            }
          />

          <SecuritySignal
            icon={
              Snowflake
            }
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

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            disabled={
              scanning
            }
            onClick={
              onScan
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-200 px-4 py-3 text-[10px] font-black text-violet-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                scanning
                  ? "animate-spin"
                  : ""
              }`}
            />

            {scanning
              ? "Checking..."
              : "Run Live Security Check"}
          </button>

          <button
            type="button"
            onClick={
              onReviewSessions
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black text-white transition hover:bg-white/10"
          >
            <History className="h-3.5 w-3.5 text-violet-200" />

            Review Sessions
          </button>
        </div>

        <p className="mt-4 text-center text-[9px] text-violet-100/40">
          Last checked:{" "}
          {formatDate(
            lastChecked
          )}
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
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-wide text-violet-100/40">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-violet-100">
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${
            healthy
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        />

        <span className="truncate text-[10px] font-semibold text-violet-100/60">
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
   TIPS
========================================================= */

function SecurityTips() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <Lock className="mb-2 h-6 w-6 text-violet-700 transition-transform group-hover:scale-110 dark:text-violet-300" />

        <p className="text-xs font-bold text-card-foreground">
          Never share OTP
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          Keep verification codes
          private.
        </p>
      </div>

      <div className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <RefreshCw className="mb-2 h-6 w-6 text-emerald-600 transition-transform duration-700 group-hover:rotate-180 dark:text-emerald-300" />

        <p className="text-xs font-bold text-card-foreground">
          Review sessions
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          Remove devices you no
          longer use.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMERGENCY
========================================================= */

function EmergencyProtection({
  frozen,
  busy,
  onOpen,
  onUnfreeze,
}: {
  frozen: boolean;
  busy: boolean;
  onOpen: () => void;
  onUnfreeze: () => void;
}) {
  return (
    <Card className="border-rose-200 bg-gradient-to-br from-rose-50 via-card to-card p-6 dark:border-rose-400/20 dark:from-rose-400/10">
      <h3 className="mb-2 flex items-center gap-2 font-black text-rose-600 dark:text-rose-300">
        <ShieldAlert className="h-5 w-5" />

        Emergency Protection
      </h3>

      <p className="mb-5 text-xs leading-5 text-muted-foreground">
        Freeze outbound wallet
        activity during a suspected
        compromise.
      </p>

      {frozen ? (
        <>
          <div className="rounded-xl border border-rose-200 bg-rose-100 p-4 text-center dark:border-rose-400/20 dark:bg-rose-400/10">
            <Snowflake className="mx-auto mb-2 h-6 w-6 text-rose-600 dark:text-rose-300" />

            <p className="text-sm font-bold text-rose-700 dark:text-rose-200">
              Wallet is Frozen
            </p>

            <p className="mt-1 text-xs text-rose-600 dark:text-rose-200/80">
              Server-side wallet
              security lock is active.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onUnfreeze}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-card px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-400/20 dark:text-rose-300 dark:hover:bg-rose-400/10"
          >
            {busy && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}

            Unfreeze Wallet
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          <Snowflake className="h-4 w-4" />

          Freeze Wallet
        </button>
      )}
    </Card>
  );
}

/* =========================================================
   PASSWORD MODAL
========================================================= */

function PasswordModal({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
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

  const submit =
    async () => {
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
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(
          newPassword
        )
      ) {
        setError(
          "Password must be 8-128 characters and include uppercase, lowercase and a number."
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

      try {
        await onSubmit(
          currentPassword,
          newPassword
        );
      } catch {
        // Parent displays server error.
      }
    };

  return (
    <Modal
      title="Change Password"
      onClose={
        onClose
      }
    >
      <div className="space-y-4">
        <PasswordField
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
          onToggle={() =>
            setShowCurrent(
              (value) =>
                !value
            )
          }
        />

        <PasswordField
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
          onToggle={() =>
            setShowNew(
              (value) =>
                !value
            )
          }
        />

        <PasswordField
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
          onToggle={() =>
            setShowConfirm(
              (value) =>
                !value
            )
          }
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          {error}
        </p>
      )}

      <ModalActions
        busy={busy}
        cancelLabel="Cancel"
        confirmLabel={
          busy
            ? "Updating..."
            : "Update Password"
        }
        onCancel={
          onClose
        }
        onConfirm={() =>
          void submit()
        }
      />
    </Modal>
  );
}

/* =========================================================
   2FA MODAL
========================================================= */

function TwoFAModal({
  mode,
  enabled,
  busy,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  secret,
  uri,
  code,
  setCode,
  selectedMethod,
  setSelectedMethod,
  availability,
  backupCodes,
  onClose,
  onStart,
  onVerify,
  onDisable,
  onUpdateMethod,
  onRegenerate,
  onCopySecret,
  copied,
  onCopyBackupCodes,
}: {
  mode: TwoFAModalMode;

  enabled: boolean;

  busy: boolean;

  password: string;

  setPassword: (
    value: string
  ) => void;

  showPassword: boolean;

  setShowPassword: (
    value: boolean
  ) => void;

  secret: string;

  uri: string;

  code: string;

  setCode: (
    value: string
  ) => void;

  selectedMethod: TwoFAMethod;

  setSelectedMethod: (
    value: TwoFAMethod
  ) => void;

  availability: DeliveryAvailability;

  backupCodes: string[];

  onClose: () => void;

  onStart: () => Promise<void>;

  onVerify: () => Promise<void>;

  onDisable: () => Promise<void>;

  onUpdateMethod: () => Promise<void>;

  onRegenerate: () => Promise<void>;

  onCopySecret: () => Promise<void>;

  copied: boolean;

  onCopyBackupCodes: () => Promise<void>;
}) {
  /* =======================================================
     SETUP - STEP 2
  ======================================================= */

  if (
    mode === "setup" &&
    secret
  ) {
    return (
      <Modal
        title="Finish 2FA Setup"
        onClose={
          onClose
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-400/10">
            <p className="text-sm font-bold text-violet-950 dark:text-violet-100">
              Add this secret to your
              authenticator app
            </p>

            <p className="mt-1 text-xs leading-5 text-violet-900/70 dark:text-violet-100/60">
              Open Google Authenticator,
              Microsoft Authenticator,
              Authy or another TOTP
              application.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                  Secret
                </p>

                <p className="mt-1 break-all font-mono text-sm font-black text-card-foreground">
                  {secret}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onCopySecret
                }
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-card-foreground transition hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />

                {copied
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-card-foreground">
              OTP Auth URI
            </p>

            <textarea
              readOnly
              value={uri}
              className="h-28 w-full resize-none rounded-xl border border-border bg-muted/40 p-3 font-mono text-[10px] leading-5 text-muted-foreground outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-card-foreground">
              Enter the 6-digit
              authenticator code
            </label>

            <input
              value={code}
              onChange={(
                event
              ) =>
                setCode(
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      6
                    )
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="h-14 w-full rounded-xl border border-border bg-muted/40 px-4 text-center text-xl font-black tracking-[0.35em] text-foreground outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
            />
          </div>

          <ModalActions
            busy={
              busy
            }
            cancelLabel="Cancel"
            confirmLabel={
              busy
                ? "Verifying..."
                : "Verify & Enable"
            }
            onCancel={
              onClose
            }
            onConfirm={() =>
              void onVerify()
            }
          />
        </div>
      </Modal>
    );
  }

  /* =======================================================
     SETUP - STEP 1
  ======================================================= */

  if (
    mode === "setup"
  ) {
    return (
      <Modal
        title="Enable Two-Factor Authentication"
        onClose={
          onClose
        }
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Enter your current password
          to securely start the 2FA
          setup process.
        </p>

        <div className="mt-5">
          <PasswordField
            label="Current Password"
            value={
              password
            }
            onChange={
              setPassword
            }
            visible={
              showPassword
            }
            onToggle={() =>
              setShowPassword(
                !showPassword
              )
            }
          />
        </div>

        <ModalActions
          busy={
            busy
          }
          cancelLabel="Cancel"
          confirmLabel={
            busy
              ? "Starting..."
              : "Start Setup"
          }
          onCancel={
            onClose
          }
          onConfirm={() =>
            void onStart()
          }
        />
      </Modal>
    );
  }

  /* =======================================================
     DISABLE
  ======================================================= */

  if (
    mode ===
    "disable"
  ) {
    return (
      <Modal
        title="Disable Two-Factor Authentication"
        onClose={
          onClose
        }
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          Disabling 2FA removes the
          stored authenticator secret
          and backup codes. You will
          need to set up 2FA again
          later.
        </div>

        <div className="mt-5">
          <PasswordField
            label="Current Password"
            value={
              password
            }
            onChange={
              setPassword
            }
            visible={
              showPassword
            }
            onToggle={() =>
              setShowPassword(
                !showPassword
              )
            }
          />
        </div>

        <ModalActions
          busy={
            busy
          }
          cancelLabel="Cancel"
          confirmLabel={
            busy
              ? "Disabling..."
              : "Disable 2FA"
          }
          danger
          onCancel={
            onClose
          }
          onConfirm={() =>
            void onDisable()
          }
        />
      </Modal>
    );
  }

  /* =======================================================
     CHANGE METHOD
  ======================================================= */

  if (
    mode ===
    "method"
  ) {
    const methods: Array<{
      id: TwoFAMethod;
      label: string;
      icon: React.ElementType;
      available: boolean;
      description: string;
    }> = [
      {
        id: "app",
        label: "Authenticator",
        icon: Fingerprint,
        available:
          availability.app,
        description:
          "Time-based 6-digit code",
      },

      {
        id: "sms",
        label: "SMS",
        icon: Smartphone,
        available:
          availability.sms,
        description:
          "Verification code by SMS",
      },

      {
        id: "email",
        label: "Email",
        icon: Mail,
        available:
          availability.email,
        description:
          "Verification code by email",
      },
    ];

    return (
      <Modal
        title="Change Primary 2FA Method"
        onClose={
          onClose
        }
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Choose the method that the
          backend will use for your
          next sign-in challenge.
        </p>

        <div className="mt-5 grid gap-3">
          {methods.map(
            (
              item
            ) => {
              const Icon =
                item.icon;

              const active =
                selectedMethod ===
                item.id;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  disabled={
                    !item.available
                  }
                  onClick={() =>
                    setSelectedMethod(
                      item.id
                    )
                  }
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-400/10"
                      : item.available
                        ? "border-border bg-card hover:bg-muted/50"
                        : "cursor-not-allowed border-border bg-muted/30 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-violet-700 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-card-foreground">
                        {
                          item.label
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {
                          item.description
                        }
                      </p>

                      {!item.available && (
                        <p className="mt-1 text-[10px] font-bold text-rose-500">
                          Not configured on
                          server
                        </p>
                      )}
                    </div>
                  </div>

                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                  )}
                </button>
              );
            }
          )}
        </div>

        <div className="mt-5">
          <PasswordField
            label="Current Password"
            value={
              password
            }
            onChange={
              setPassword
            }
            visible={
              showPassword
            }
            onToggle={() =>
              setShowPassword(
                !showPassword
              )
            }
          />
        </div>

        <ModalActions
          busy={
            busy
          }
          cancelLabel="Cancel"
          confirmLabel={
            busy
              ? "Updating..."
              : "Save Method"
          }
          onCancel={
            onClose
          }
          onConfirm={() =>
            void onUpdateMethod()
          }
        />
      </Modal>
    );
  }

  /* =======================================================
     BACKUP CODES
  ======================================================= */

  return (
    <Modal
      title="Regenerate Backup Codes"
      onClose={
        onClose
      }
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
          Save your new codes
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-100/70">
          The old backup codes will
          stop working immediately.
        </p>
      </div>

      <div className="mt-5">
        <PasswordField
          label="Current Password"
          value={
            password
          }
          onChange={
            setPassword
          }
          visible={
            showPassword
          }
          onToggle={() =>
            setShowPassword(
              !showPassword
            )
          }
        />
      </div>

      <ModalActions
        busy={
          busy
        }
        cancelLabel="Cancel"
        confirmLabel={
          busy
            ? "Generating..."
            : "Generate New Codes"
        }
        onCancel={
          onClose
        }
        onConfirm={() =>
          void onRegenerate()
        }
      />
    </Modal>
  );
}

/* =========================================================
   FREEZE MODAL
========================================================= */

function FreezeWalletModal({
  frozen,
  busy,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onClose,
  onConfirm,
}: {
  frozen: boolean;
  busy: boolean;
  password: string;
  setPassword: (
    value: string
  ) => void;
  showPassword: boolean;
  setShowPassword: (
    value: boolean
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={
        frozen
          ? "Unfreeze Wallet"
          : "Freeze Wallet"
      }
      onClose={
        onClose
      }
    >
      <div
        className={`rounded-2xl border p-4 ${
          frozen
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
            : "border-rose-200 bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <Snowflake
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              frozen
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-rose-600 dark:text-rose-300"
            }`}
          />

          <p
            className={`text-sm leading-6 ${
              frozen
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-rose-800 dark:text-rose-200"
            }`}
          >
            {frozen
              ? "This will remove the server-side wallet security lock."
              : "This will create a server-side wallet security lock that blocks outbound wallet actions."}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PasswordField
          label="Current Password"
          value={
            password
          }
          onChange={
            setPassword
          }
          visible={
            showPassword
          }
          onToggle={() =>
            setShowPassword(
              !showPassword
            )
          }
        />
      </div>

      <ModalActions
        busy={
          busy
        }
        cancelLabel="Cancel"
        confirmLabel={
          busy
            ? frozen
              ? "Unfreezing..."
              : "Freezing..."
            : frozen
              ? "Unfreeze Wallet"
              : "Freeze Wallet"
        }
        danger={
          !frozen
        }
        onCancel={
          onClose
        }
        onConfirm={
          onConfirm
        }
      />
    </Modal>
  );
}

/* =========================================================
   BACKUP CODES MODAL
========================================================= */

function BackupCodesModal({
  codes,
  onCopy,
  onClose,
}: {
  codes: string[];
  onCopy: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Backup Codes"
      onClose={
        onClose
      }
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
          Save these codes now
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-100/70">
          These codes are displayed
          only once. Store them in a
          secure place.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-4 font-mono text-xs font-bold text-card-foreground">
        {codes.map(
          (code) => (
            <span
              key={
                code
              }
              className="rounded-lg bg-card px-3 py-2 text-center shadow-sm"
            >
              {
                code
              }
            </span>
          )
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() =>
            void onCopy()
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-bold text-white transition hover:bg-violet-800"
        >
          <Copy className="h-4 w-4" />

          Copy Codes
        </button>

        <button
          type="button"
          onClick={
            onClose
          }
          className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold text-card-foreground transition hover:bg-muted/80"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

/* =========================================================
   SHARED CARD
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
      className={`rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_10px_35px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({
  text,
  tone,
}: {
  text: string;
  tone:
    | "green"
    | "blue"
    | "amber";
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black ${
        tone ===
        "green"
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : tone ===
              "amber"
            ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
            : "border-violet-200/15 bg-white/10 text-violet-100"
      }`}
    >
      {text}
    </span>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      disabled={
        disabled
      }
      onClick={
        onChange
      }
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked
          ? "bg-violet-700"
          : "bg-slate-300 dark:bg-slate-700"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : ""
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-card-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-600 focus:bg-card focus:ring-4 focus:ring-violet-600/10"
        />

        <button
          type="button"
          onClick={
            onToggle
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
   MODAL
========================================================= */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={
          onClose
        }
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 18,
          scale: 0.96,
        }}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-border bg-card p-6 text-foreground shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-black text-foreground">
            {title}
          </h3>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl bg-muted p-2 text-muted-foreground transition hover:bg-muted/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   MODAL ACTIONS
========================================================= */

function ModalActions({
  busy,
  cancelLabel,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  cancelLabel: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-7 flex gap-3">
      <button
        type="button"
        disabled={
          busy
        }
        onClick={
          onCancel
        }
        className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold text-card-foreground transition hover:bg-muted/80 disabled:opacity-50"
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        disabled={
          busy
        }
        onClick={
          onConfirm
        }
        className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${
          danger
            ? "bg-rose-600 hover:bg-rose-700"
            : "bg-violet-700 hover:bg-violet-800"
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  toast,
  onClose,
}: {
  toast: ToastState | null;
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
          className="fixed bottom-6 right-6 z-[170] flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-foreground shadow-2xl"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              toast.type ===
              "success"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
                : toast.type ===
                    "error"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
                  : "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
            }`}
          >
            {toast.type ===
            "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : toast.type ===
              "error" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
          </span>

          <p className="min-w-0 flex-1 text-sm font-semibold text-card-foreground">
            {
              toast.message
            }
          </p>

          <button
            type="button"
            onClick={
              onClose
            }
            className="text-muted-foreground transition hover:text-foreground"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}