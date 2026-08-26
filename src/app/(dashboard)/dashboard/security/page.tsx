"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Smartphone, Mail, Key, Laptop, Activity,
  AlertTriangle, CheckCircle2, XCircle, LogOut, Snowflake,
  Bell, Eye, EyeOff, Copy, ArrowRight, Check, History,
  RefreshCw, Fingerprint, ShieldAlert, CheckSquare, Square
} from "lucide-react";

// --- Types ---
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

// --- Mock Data ---
const mockSessions: Session[] = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome", os: "macOS", location: "Dhaka, BD", ip: "103.112.xx.xx", lastActive: "Active Now", isCurrent: true },
  { id: "s2", device: "iPhone 14", browser: "Safari", os: "iOS", location: "Dhaka, BD", ip: "103.112.xx.xy", lastActive: "2 hours ago", isCurrent: false },
  { id: "s3", device: "Windows PC", browser: "Firefox", os: "Windows 11", location: "Chittagong, BD", ip: "118.179.xx.xx", lastActive: "3 days ago", isCurrent: false },
];

const mockActivity: SecurityEvent[] = [
  { id: "e1", title: "Successful login", date: "Today, 10:45 AM", icon: CheckCircle2, status: "success", details: "MacBook Pro • Dhaka, BD" },
  { id: "e2", title: "2FA Backup codes regenerated", date: "Yesterday, 04:20 PM", icon: Key, status: "info" },
  { id: "e3", title: "Failed login attempt", date: "Aug 15, 2026, 02:15 AM", icon: AlertTriangle, status: "warning", details: "Unknown Device • Moscow, RU" },
  { id: "e4", title: "KYC Verification Approved", date: "Aug 10, 2026, 11:30 AM", icon: ShieldCheck, status: "success" },
];

// --- Reusable UI Components ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5EA8] focus-visible:ring-offset-2 ${checked ? "bg-[#1F5EA8]" : "bg-slate-300"}`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

// --- Main Page Component ---
export default function SecurityPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // States
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [twoFAMethod, setTwoFAMethod] = useState<"app" | "sms" | "email">("app");
  const [isWalletFrozen, setIsWalletFrozen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({ newDevice: true, suspiciousActivity: true, failedLogin: false });
  
  // Modal States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedSettings = localStorage.getItem("nova_security_alerts");
    if (savedSettings) setAlertSettings(JSON.parse(savedSettings));
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAlertSettingChange = (key: keyof AlertSettings) => {
    const newSettings = { ...alertSettings, [key]: !alertSettings[key] };
    setAlertSettings(newSettings);
    localStorage.setItem("nova_security_alerts", JSON.stringify(newSettings));
    showToast(`${key} notifications ${newSettings[key] ? "enabled" : "disabled"}.`);
  };

  const handleTerminateSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    showToast("Session terminated successfully.");
  };

  if (!isMounted) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 bg-[#F6F8FB] min-h-screen font-sans">
      
      {/* 1. Security Overview Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-8 text-white shadow-xl shadow-blue-900/20"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-10">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" /> Your account is well protected
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Security Center</h1>
            <p className="text-blue-100/80 text-lg">
              We monitor your wallet and account continuously. Review your security settings and activity below to ensure maximum protection.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center p-4">
            <div className="relative h-36 w-36">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="45" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - 92 / 100) }}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
                  className="text-3xl font-bold"
                >
                  92
                </motion.span>
                <span className="text-xs font-medium text-blue-200">/ 100</span>
              </div>
            </div>
            <p className="mt-3 font-medium text-cyan-300">Security Score</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. Two-Factor Authentication */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${is2FAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F2745]">Two-Factor Authentication (2FA)</h2>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className={`text-sm font-semibold ${is2FAEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle 
                    checked={is2FAEnabled} 
                    onChange={() => {
                      setIs2FAEnabled(!is2FAEnabled);
                      showToast(`2FA ${!is2FAEnabled ? 'Enabled' : 'Disabled'} successfully.`);
                    }} 
                  />
                </div>
              </div>

              {is2FAEnabled ? (
                <div className="animate-in fade-in slide-in-from-top-4 space-y-6">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#1F5EA8] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#173F6D]">2FA is currently protecting your account. You will be asked for a verification code when signing in from an unrecognized device.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Primary Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(['app', 'sms', 'email'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => { setTwoFAMethod(method); showToast("Primary 2FA method updated."); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${twoFAMethod === method ? 'border-[#1F5EA8] bg-blue-50 text-[#1F5EA8]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {method === 'app' && <Fingerprint className="h-4 w-4" />}
                          {method === 'sms' && <Smartphone className="h-4 w-4" />}
                          {method === 'email' && <Mail className="h-4 w-4" />}
                          <span className="font-medium capitalize">{method === 'app' ? 'Authenticator' : method}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button className="rounded-xl bg-[#1F5EA8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#173F6D] active:scale-95">
                      Manage 2FA
                    </button>
                    <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95">
                      Regenerate Backup Codes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 animate-in fade-in">
                  <button 
                    onClick={() => { setIs2FAEnabled(true); showToast("2FA Enabled successfully."); }}
                    className="w-full rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#173F6D]"
                  >
                    Set Up 2FA Now
                  </button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* 4. Password Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745]">Password</h2>
                  <p className="text-sm text-slate-500 mt-1">Last changed: 3 months ago</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-6 rounded-full bg-emerald-500"></div>
                      <div className="h-1.5 w-6 rounded-full bg-emerald-500"></div>
                      <div className="h-1.5 w-6 rounded-full bg-emerald-500"></div>
                      <div className="h-1.5 w-6 rounded-full bg-slate-200"></div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">Strong</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPasswordModalOpen(true)}
                className="shrink-0 rounded-xl border-2 border-[#1F5EA8] px-6 py-2.5 text-sm font-bold text-[#1F5EA8] transition-all hover:bg-blue-50 active:scale-95"
              >
                Change Password
              </button>
            </Card>
          </motion.div>

          {/* 5. Active Sessions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745]">Active Sessions</h2>
                  <p className="text-sm text-slate-500">Devices currently logged into your account.</p>
                </div>
                {sessions.length > 1 && (
                  <button 
                    onClick={() => { setSessions(sessions.filter(s => s.isCurrent)); showToast("All other sessions terminated."); }}
                    className="hidden md:flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign out all other devices
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <div key={session.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2.5 rounded-xl ${session.isCurrent ? 'bg-blue-100 text-[#1F5EA8]' : 'bg-slate-100 text-slate-500'}`}>
                        {session.device.includes('MacBook') || session.device.includes('PC') ? <Laptop className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#0F2745]">{session.device}</p>
                          {session.isCurrent && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{session.browser} on {session.os}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          {session.location} • {session.ip}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                      <span className="text-xs font-medium text-slate-500">{session.lastActive}</span>
                      {!session.isCurrent && (
                        <button 
                          onClick={() => handleTerminateSession(session.id)}
                          className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No active sessions found.</div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* 6. Security Activity Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745]">Recent Activity</h2>
                  <p className="text-sm text-slate-500">Security-related events on your account.</p>
                </div>
                <button className="text-sm font-semibold text-[#1F5EA8] hover:underline">View All</button>
              </div>
              
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                {mockActivity.map((event, index) => {
                  const Icon = event.icon;
                  const color = event.status === 'success' ? 'text-emerald-500 bg-emerald-50 border-emerald-200' : 
                                event.status === 'warning' ? 'text-amber-500 bg-amber-50 border-amber-200' : 
                                'text-blue-500 bg-blue-50 border-blue-200';
                  return (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (index * 0.1) }}
                      className="relative pl-8"
                    >
                      <div className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F2745]">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{event.date}</p>
                        {event.details && <p className="text-sm text-slate-600 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg">{event.details}</p>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* 8. Account Protection Checklist */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <h3 className="font-bold text-[#0F2745] flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-cyan-600" /> Protection Checklist
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckSquare className="h-5 w-5" />
                  <span className="text-sm font-semibold">Email Verified</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckSquare className="h-5 w-5" />
                  <span className="text-sm font-semibold">KYC Completed</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckSquare className="h-5 w-5" />
                  <span className="text-sm font-semibold">Strong Password</span>
                </div>
                <div className={`flex items-center gap-3 ${is2FAEnabled ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {is2FAEnabled ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  <span className="text-sm font-semibold">Enable 2FA</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 7. Login Alerts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6">
              <h3 className="font-bold text-[#0F2745] flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-[#1F5EA8]" /> Login Alerts
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">New Devices</p>
                    <p className="text-xs text-slate-500">Notify on new logins</p>
                  </div>
                  <Toggle checked={alertSettings.newDevice} onChange={() => handleAlertSettingChange('newDevice')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Suspicious Activity</p>
                    <p className="text-xs text-slate-500">Unusual location/IP</p>
                  </div>
                  <Toggle checked={alertSettings.suspiciousActivity} onChange={() => handleAlertSettingChange('suspiciousActivity')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Failed Logins</p>
                    <p className="text-xs text-slate-500">Alert on bad passwords</p>
                  </div>
                  <Toggle checked={alertSettings.failedLogin} onChange={() => handleAlertSettingChange('failedLogin')} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 10. Security Tips Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <Lock className="h-6 w-6 text-[#1F5EA8] mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-[#0F2745]">Never share OTP</p>
                <p className="text-[10px] text-slate-500 mt-1">We will never ask for it.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <RefreshCw className="h-6 w-6 text-emerald-500 mb-2 group-hover:rotate-180 transition-transform duration-700" />
                <p className="text-xs font-bold text-[#0F2745]">Update Reguarly</p>
                <p className="text-[10px] text-slate-500 mt-1">Change pass every 3 months.</p>
              </div>
            </div>
          </motion.div>

          {/* 9. Emergency Security Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="p-6 border-rose-100 bg-rose-50/30">
              <h3 className="font-bold text-rose-600 flex items-center gap-2 mb-2">
                <ShieldAlert className="h-5 w-5" /> Danger Zone
              </h3>
              <p className="text-xs text-slate-600 mb-5">If you suspect your account is compromised, you can freeze all transactions immediately.</p>
              
              {isWalletFrozen ? (
                <div className="rounded-xl bg-rose-100 p-4 text-center border border-rose-200">
                  <Snowflake className="h-6 w-6 text-rose-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-rose-700">Wallet is Frozen</p>
                  <p className="text-xs text-rose-600 mt-1">Contact support to unfreeze.</p>
                </div>
              ) : (
                <button 
                  onClick={() => setFreezeModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-95"
                >
                  <Snowflake className="h-4 w-4" /> Freeze Wallet
                </button>
              )}
            </Card>
          </motion.div>

        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        
        {/* Password Modal */}
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-[#0F2745] mb-2">Change Password</h3>
              <p className="text-sm text-slate-500 mb-6">Create a strong, unique password for your account.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setPasswordModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
                <button onClick={() => { setPasswordModalOpen(false); showToast("Password updated successfully."); }} className="flex-1 rounded-xl bg-[#1F5EA8] py-3 font-semibold text-white hover:bg-[#173F6D]">Update</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Freeze Wallet Modal */}
        {freezeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/60 p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-4">
                <ShieldAlert className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F2745] mb-2">Freeze Wallet?</h3>
              <p className="text-sm text-slate-600 mb-6">
                This action will instantly disable all outbound transfers, withdrawals, and API access. 
                <span className="block font-bold text-rose-600 mt-2">You must contact support to unfreeze.</span>
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setFreezeModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
                <button onClick={() => { setIsWalletFrozen(true); setFreezeModalOpen(false); showToast("Wallet frozen for security.", "error"); }} className="flex-1 rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700">Yes, Freeze It</button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* --- Global Custom Toast --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100"
          >
            {toast.type === 'success' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            ) : toast.type === 'error' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Activity className="h-5 w-5" /></div>
            )}
            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}