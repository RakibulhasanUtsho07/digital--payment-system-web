"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
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

type TwoFAMethod = "app" | "sms" | "email";
type ToastType = "success" | "error" | "info";

const INITIAL_SESSIONS: Session[] = [
  {
    id: "s1",
    device: "MacBook Pro",
    browser: "Chrome",
    os: "macOS",
    location: "Dhaka, BD",
    ip: "103.112.xx.xx",
    lastActive: "Active Now",
    isCurrent: true,
  },
  {
    id: "s2",
    device: "iPhone 14",
    browser: "Safari",
    os: "iOS",
    location: "Dhaka, BD",
    ip: "103.112.xx.xy",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "s3",
    device: "Windows PC",
    browser: "Firefox",
    os: "Windows 11",
    location: "Chittagong, BD",
    ip: "118.179.xx.xx",
    lastActive: "3 days ago",
    isCurrent: false,
  },
];

const SECURITY_ACTIVITY: SecurityEvent[] = [
  {
    id: "e1",
    title: "Successful login",
    date: "Today, 10:45 AM",
    icon: CheckCircle2,
    status: "success",
    details: "MacBook Pro • Dhaka, BD",
  },
  {
    id: "e2",
    title: "2FA backup codes regenerated",
    date: "Yesterday, 04:20 PM",
    icon: Key,
    status: "info",
  },
  {
    id: "e3",
    title: "Failed login attempt",
    date: "Aug 15, 2026, 02:15 AM",
    icon: AlertTriangle,
    status: "warning",
    details: "Unknown Device • New location detected",
  },
  {
    id: "e4",
    title: "KYC verification approved",
    date: "Aug 10, 2026, 11:30 AM",
    icon: ShieldCheck,
    status: "success",
  },
  {
    id: "e5",
    title: "Login alerts updated",
    date: "Aug 08, 2026, 09:12 PM",
    icon: Bell,
    status: "info",
    details: "Suspicious activity alerts enabled",
  },
];

const DEFAULT_ALERTS: AlertSettings = {
  newDevice: true,
  suspiciousActivity: true,
  failedLogin: false,
};

export default function SecurityPage() {
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [twoFAMethod, setTwoFAMethod] = useState<TwoFAMethod>("app");
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_ALERTS);
  const [isWalletFrozen, setIsWalletFrozen] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSecurityCheck, setLastSecurityCheck] = useState("Not checked yet");

  useEffect(() => {
    setMounted(true);

    const saved =
      localStorage.getItem("coffer_security_alerts") ??
      localStorage.getItem("nova_security_alerts");

    if (!saved) return;

    try {
      setAlertSettings(JSON.parse(saved) as AlertSettings);
    } catch {
      localStorage.removeItem("coffer_security_alerts");
    }
  }, []);

  const enabledAlertCount = useMemo(
    () => Object.values(alertSettings).filter(Boolean).length,
    [alertSettings]
  );

  const failedLoginCount = useMemo(
    () => SECURITY_ACTIVITY.filter((event) => event.status === "warning").length,
    []
  );

  const protectionScore = useMemo(() => {
    let score = 54;

    if (is2FAEnabled) score += 18;
    if (alertSettings.newDevice) score += 8;
    if (alertSettings.suspiciousActivity) score += 8;
    if (alertSettings.failedLogin) score += 7;
    if (sessions.length <= 3) score += 5;

    return Math.min(100, score);
  }, [alertSettings, is2FAEnabled, sessions.length]);

  const riskLevel =
    protectionScore >= 90
      ? "Low"
      : protectionScore >= 75
        ? "Moderate"
        : "Elevated";

  const visibleActivity = showAllActivity
    ? SECURITY_ACTIVITY
    : SECURITY_ACTIVITY.slice(0, 3);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const updateAlert = (key: keyof AlertSettings) => {
    const next = {
      ...alertSettings,
      [key]: !alertSettings[key],
    };

    setAlertSettings(next);
    localStorage.setItem("coffer_security_alerts", JSON.stringify(next));

    showToast(
      `${formatSettingName(key)} alerts ${next[key] ? "enabled" : "disabled"}.`
    );
  };

  const terminateSession = (id: string) => {
    setSessions((current) => current.filter((session) => session.id !== id));
    showToast("Session terminated successfully.");
  };

  const terminateOtherSessions = () => {
    setSessions((current) => current.filter((session) => session.isCurrent));
    showToast("All other sessions terminated.");
  };

  const runSecurityCheck = async () => {
    if (isScanning) return;

    setIsScanning(true);

    await new Promise((resolve) => window.setTimeout(resolve, 1400));

    setLastSecurityCheck(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setIsScanning(false);
    showToast(`Security check complete. Score: ${protectionScore}/100.`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-12 font-sans text-[#0F2745]">
      <div className="mx-auto max-w-[1450px] space-y-8 px-3 py-4 sm:px-5 lg:px-7">
        <SecurityHero score={protectionScore} />

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
          <div className="min-w-0 space-y-8">
            <TwoFactorCard
              enabled={is2FAEnabled}
              method={twoFAMethod}
              onToggle={() => {
                const next = !is2FAEnabled;
                setIs2FAEnabled(next);
                showToast(`2FA ${next ? "enabled" : "disabled"}.`);
              }}
              onMethodChange={(method) => {
                setTwoFAMethod(method);
                showToast("Primary 2FA method updated.");
              }}
              onBackupCodes={() =>
                showToast(
                  "Backup-code action is ready for the backend endpoint.",
                  "info"
                )
              }
            />

            <PasswordCard onChangePassword={() => setPasswordModalOpen(true)} />

            <SessionsCard
              sessions={sessions}
              onTerminate={terminateSession}
              onTerminateOthers={terminateOtherSessions}
            />

            <RecentActivityCard
              events={visibleActivity}
              expanded={showAllActivity}
              onToggle={() => setShowAllActivity((current) => !current)}
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-6">
            <ProtectionChecklist is2FAEnabled={is2FAEnabled} />

            <LoginAlerts
              settings={alertSettings}
              onChange={updateAlert}
            />

            <SecurityIntelligence
              score={protectionScore}
              riskLevel={riskLevel}
              sessionCount={sessions.length}
              warningCount={failedLoginCount}
              enabledAlerts={enabledAlertCount}
              is2FAEnabled={is2FAEnabled}
              isWalletFrozen={isWalletFrozen}
              scanning={isScanning}
              lastChecked={lastSecurityCheck}
              onScan={runSecurityCheck}
            />

            <SecurityTips />

            <EmergencyProtection
              frozen={isWalletFrozen}
              onFreeze={() => setFreezeModalOpen(true)}
            />
          </aside>
        </div>
      </div>

      <PasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          setPasswordModalOpen(false);
          showToast("Password form is ready to submit to your backend.", "info");
        }}
      />

      <FreezeWalletModal
        open={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        onConfirm={() => {
          setIsWalletFrozen(true);
          setFreezeModalOpen(false);
          showToast(
            "Wallet is frozen in the frontend state. Connect the secure backend endpoint next.",
            "error"
          );
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function SecurityHero({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0B1D34] via-[#12385E] to-[#1F5EA8] p-7 text-white shadow-[0_24px_70px_rgba(15,39,69,0.18)] sm:p-9"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cyan-200/10" />
      <div className="pointer-events-none absolute -right-4 -top-2 h-56 w-56 rounded-full border border-blue-200/10" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Account protection active
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            Security Center
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/75 sm:text-base">
            Review authentication, active sessions, security alerts and emergency wallet protection from one place.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <div className="relative h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
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
                stroke="#67e8f9"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{
                  strokeDashoffset: circumference * (1 - score / 100),
                }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{ scale: 0.82, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black"
              >
                {score}
              </motion.span>
              <span className="text-xs text-blue-200">/100</span>
            </div>
          </div>

          <p className="mt-3 text-sm font-bold text-cyan-200">Security Score</p>
        </div>
      </div>
    </motion.section>
  );
}

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
  onMethodChange: (method: TwoFAMethod) => void;
  onBackupCodes: () => void;
}) {
  return (
    <Card className="p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-3 ${
              enabled
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <Smartphone className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black">Two-Factor Authentication</h2>
            <p className="text-sm text-slate-500">
              Add a second verification layer to supported sign-in and sensitive actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2">
          <span
            className={`text-sm font-semibold ${
              enabled ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {enabled ? (
          <motion.div
            key="enabled"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1F5EA8]" />
              <p className="text-sm leading-6 text-[#173F6D]">
                2FA is currently enabled. This frontend is ready to connect to your real 2FA setup and verification endpoints.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Primary Method</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["app", "sms", "email"] as TwoFAMethod[]).map((item) => {
                  const active = method === item;
                  const Icon = item === "app" ? Fingerprint : item === "sms" ? Smartphone : Mail;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onMethodChange(item)}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                        active
                          ? "border-[#1F5EA8] bg-blue-50 text-[#1F5EA8]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item === "app" ? "Authenticator" : item.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#1F5EA8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#173F6D]"
              >
                Manage 2FA
              </button>

              <button
                type="button"
                onClick={onBackupCodes}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Regenerate Backup Codes
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="disabled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800"
          >
            Two-factor protection is currently disabled. Enable it to improve account protection.
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function PasswordCard({ onChangePassword }: { onChangePassword: () => void }) {
  return (
    <Card className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:p-8">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
          <Key className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black">Password Security</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use a strong, unique password and update it when necessary.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-7 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-7 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-7 rounded-full bg-emerald-500" />
              <span className="h-1.5 w-7 rounded-full bg-slate-200" />
            </div>
            <span className="text-xs font-bold text-emerald-600">Strong</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onChangePassword}
        className="shrink-0 rounded-xl border-2 border-[#1F5EA8] px-6 py-2.5 text-sm font-bold text-[#1F5EA8] transition hover:bg-blue-50"
      >
        Change Password
      </button>
    </Card>
  );
}

function SessionsCard({
  sessions,
  onTerminate,
  onTerminateOthers,
}: {
  sessions: Session[];
  onTerminate: (id: string) => void;
  onTerminateOthers: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:p-8">
        <div>
          <h2 className="text-xl font-black">Active Sessions</h2>
          <p className="text-sm text-slate-500">
            Review devices currently signed in to your account.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            type="button"
            onClick={onTerminateOthers}
            className="inline-flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out other devices
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex flex-col justify-between gap-4 p-6 transition hover:bg-slate-50/60 md:flex-row md:items-center"
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 rounded-xl p-2.5 ${
                  session.isCurrent
                    ? "bg-blue-100 text-[#1F5EA8]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {session.device.includes("MacBook") || session.device.includes("PC") ? (
                  <Laptop className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{session.device}</p>
                  {session.isCurrent && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {session.browser} on {session.os}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {session.location} • {session.ip}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 md:flex-col md:items-end md:border-0 md:pt-0">
              <span className="text-xs font-medium text-slate-500">
                {session.lastActive}
              </span>

              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => onTerminate(session.id)}
                  className="text-sm font-bold text-rose-500 hover:text-rose-600"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

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
    <Card className="p-6 md:p-8">
      <div id="security-activity" className="scroll-mt-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Recent Activity</h2>
            <p className="text-sm text-slate-500">Security-related account events.</p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-sm font-bold text-[#1F5EA8] hover:underline"
          >
            {expanded ? "Show Less" : "View All"}
          </button>
        </div>

        <div className="relative ml-4 space-y-8 border-l-2 border-slate-100 pb-4">
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const Icon = event.icon;
              const tone =
                event.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-500"
                  : event.status === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-500"
                    : "border-blue-200 bg-blue-50 text-blue-500";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-8"
                >
                  <div
                    className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <p className="font-semibold">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.date}</p>

                  {event.details && (
                    <p className="mt-2 inline-block rounded-lg bg-slate-50 px-3 py-1 text-sm text-slate-600">
                      {event.details}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

function ProtectionChecklist({ is2FAEnabled }: { is2FAEnabled: boolean }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 font-black">
        <ShieldCheck className="h-5 w-5 text-cyan-600" />
        Protection Checklist
      </h3>

      <div className="space-y-4">
        <ChecklistItem label="Email Verified" checked />
        <ChecklistItem label="KYC Completed" checked />
        <ChecklistItem label="Strong Password" checked />
        <ChecklistItem label="Enable 2FA" checked={is2FAEnabled} />
      </div>
    </Card>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 ${
        checked ? "text-emerald-600" : "text-amber-500"
      }`}
    >
      {checked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function LoginAlerts({
  settings,
  onChange,
}: {
  settings: AlertSettings;
  onChange: (key: keyof AlertSettings) => void;
}) {
  return (
    <Card className="p-6">
      <h3 className="mb-6 flex items-center gap-2 font-black">
        <Bell className="h-5 w-5 text-[#1F5EA8]" />
        Login Alerts
      </h3>

      <div className="space-y-5">
        <AlertToggleRow
          title="New Devices"
          description="Notify on new logins"
          checked={settings.newDevice}
          onChange={() => onChange("newDevice")}
        />
        <AlertToggleRow
          title="Suspicious Activity"
          description="Unusual location or session activity"
          checked={settings.suspiciousActivity}
          onChange={() => onChange("suspiciousActivity")}
        />
        <AlertToggleRow
          title="Failed Logins"
          description="Alert after failed authentication attempts"
          checked={settings.failedLogin}
          onChange={() => onChange("failedLogin")}
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
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

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
}: {
  score: number;
  riskLevel: "Low" | "Moderate" | "Elevated";
  sessionCount: number;
  warningCount: number;
  enabledAlerts: number;
  is2FAEnabled: boolean;
  isWalletFrozen: boolean;
  scanning: boolean;
  lastChecked: string;
  onScan: () => void;
}) {
  return (
    <motion.section
      layout
      className="relative min-h-[520px] overflow-hidden rounded-[30px] bg-gradient-to-br from-[#07172B] via-[#0B2947] to-[#0F4C78] p-6 text-white shadow-[0_22px_60px_rgba(15,39,69,0.16)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-cyan-300/10" />
      <div className="pointer-events-none absolute -right-4 -top-4 h-40 w-40 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/55">
              Security Intelligence
            </p>
            <h3 className="mt-1 text-xl font-black">Protection Monitor</h3>
            <p className="mt-1 text-[11px] leading-5 text-blue-100/55">
              Interactive assessment of the current frontend security state.
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-[9px] font-black ${
              riskLevel === "Low"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : riskLevel === "Moderate"
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-200"
            }`}
          >
            {riskLevel} Risk
          </span>
        </div>

        <div className="relative mx-auto my-7 h-44 w-44">
          {[100, 76, 52].map((size, index) => (
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
                      scale: [0.88, 1.08, 0.88],
                      opacity: [0.2, 0.85, 0.2],
                    }
                  : { scale: 1, opacity: 0.45 }
              }
              transition={{
                duration: 1.3 + index * 0.25,
                repeat: scanning ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.div
            animate={scanning ? { scale: [1, 1.08, 1] } : undefined}
            transition={{ repeat: scanning ? Infinity : 0, duration: 1.1 }}
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[26px] border border-emerald-300/20 bg-emerald-300/10 shadow-[0_0_45px_rgba(52,211,153,0.12)]"
          >
            <Fingerprint className="h-8 w-8 text-emerald-300" />
            <span className="mt-1 text-lg font-black">{score}</span>
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 h-[2px] w-[48%] origin-left bg-gradient-to-r from-cyan-300 via-cyan-300/70 to-transparent"
            animate={{ rotate: scanning ? 360 : 32 }}
            transition={{
              repeat: scanning ? Infinity : 0,
              duration: 1.7,
              ease: "linear",
            }}
          />

          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="absolute left-[19%] top-[38%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.9)]"
          />

          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="absolute right-[16%] top-[57%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,0.8)]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <IntelligenceMetric label="Score" value={`${score}`} />
          <IntelligenceMetric label="Sessions" value={`${sessionCount}`} />
          <IntelligenceMetric label="Warnings" value={`${warningCount}`} />
        </div>

        <div className="mt-4 space-y-2">
          <SecuritySignal
            icon={ShieldCheck}
            label="Two-factor protection"
            value={is2FAEnabled ? "Active" : "Review"}
            healthy={is2FAEnabled}
          />
          <SecuritySignal
            icon={Bell}
            label="Alert coverage"
            value={`${enabledAlerts}/3`}
            healthy={enabledAlerts >= 2}
          />
          <SecuritySignal
            icon={Wifi}
            label="Active sessions"
            value={`${sessionCount}`}
            healthy={sessionCount <= 3}
          />
          <SecuritySignal
            icon={Snowflake}
            label="Wallet state"
            value={isWalletFrozen ? "Frozen" : "Active"}
            healthy={!isWalletFrozen}
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <button
            type="button"
            disabled={scanning}
            onClick={onScan}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-[10px] font-black text-[#082238] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Run Check"}
          </button>

          <button
            type="button"
            onClick={() =>
              document.getElementById("security-activity")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black text-white transition hover:bg-white/10"
          >
            <History className="h-3.5 w-3.5 text-cyan-200" />
            Review Activity
          </button>
        </div>

        <p className="mt-4 text-center text-[9px] text-blue-100/40">
          Last checked: {lastChecked}
        </p>
      </div>
    </motion.section>
  );
}

function IntelligenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-wide text-blue-100/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-cyan-100">{value}</p>
    </div>
  );
}

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
            healthy ? "text-emerald-300" : "text-amber-300"
          }`}
        />
        <span className="truncate text-[10px] font-semibold text-blue-100/60">
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-black ${
          healthy ? "text-emerald-200" : "text-amber-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SecurityTips() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <Lock className="mb-2 h-6 w-6 text-[#1F5EA8] transition-transform group-hover:scale-110" />
        <p className="text-xs font-bold">Never share OTP</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Keep verification codes private.
        </p>
      </div>

      <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <RefreshCw className="mb-2 h-6 w-6 text-emerald-500 transition-transform duration-700 group-hover:rotate-180" />
        <p className="text-xs font-bold">Review sessions</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Remove devices you no longer use.
        </p>
      </div>
    </div>
  );
}

function EmergencyProtection({
  frozen,
  onFreeze,
}: {
  frozen: boolean;
  onFreeze: () => void;
}) {
  return (
    <Card className="border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-6">
      <h3 className="mb-2 flex items-center gap-2 font-black text-rose-600">
        <ShieldAlert className="h-5 w-5" />
        Emergency Protection
      </h3>

      <p className="mb-5 text-xs leading-5 text-slate-600">
        If you suspect account compromise, prepare to block outbound wallet activity.
      </p>

      {frozen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-rose-200 bg-rose-100 p-4 text-center"
        >
          <Snowflake className="mx-auto mb-2 h-6 w-6 text-rose-600" />
          <p className="text-sm font-bold text-rose-700">Wallet is Frozen</p>
          <p className="mt-1 text-xs text-rose-600">
            Backend unfreeze authorization will be required.
          </p>
        </motion.div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onFreeze}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
        >
          <Snowflake className="h-4 w-4" />
          Freeze Wallet
        </motion.button>
      )}
    </Card>
  );
}

function PasswordModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [open]);

  const submit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative z-10 w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Change Password</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This form is ready to connect to the real password-change API.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrent}
                onToggleVisible={() => setShowCurrent((current) => !current)}
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNew}
                onToggleVisible={() => setShowNew((current) => !current)}
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirm}
                onToggleVisible={() => setShowConfirm((current) => !current)}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-xl bg-[#1F5EA8] py-3 text-sm font-bold text-white hover:bg-[#173F6D]"
              >
                Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-[#1F5EA8]/10"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-rose-950/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] bg-white p-7 text-center shadow-2xl"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(244,63,94,0.08)",
                  "0 0 0 16px rgba(244,63,94,0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600"
            >
              <ShieldAlert className="h-8 w-8" />
            </motion.div>

            <h3 className="mt-5 text-2xl font-black">Freeze Wallet?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This frontend confirmation is prepared for a protected server-side wallet-freeze operation.
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700"
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

function Toast({
  toast,
  onClose,
}: {
  toast: { message: string; type: ToastType } | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          className="fixed bottom-6 right-6 z-[120] flex max-w-sm items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success"
                ? "bg-emerald-100 text-emerald-600"
                : toast.type === "error"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-blue-100 text-blue-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : toast.type === "error" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Activity className="h-5 w-5" />
            )}
          </span>

          <p className="text-sm font-semibold text-slate-800">{toast.message}</p>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-[#1F5EA8]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function formatSettingName(key: keyof AlertSettings) {
  if (key === "newDevice") return "New device";
  if (key === "suspiciousActivity") return "Suspicious activity";
  return "Failed login";
}
