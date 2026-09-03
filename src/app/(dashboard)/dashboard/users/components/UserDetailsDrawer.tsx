"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import type {
  DrawerTab,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";
import UserActivityTimeline from "./UserActivityTimeline";
import UserKYCPanel from "./UserKYCPanel";
import UserProfileCard from "./UserProfileCard";
import UserRiskPanel from "./UserRiskPanel";
import UserRoleManager from "./UserRoleManager";
import UserSecurityCard from "./UserSecurityCard";
import UserStatusManager from "./UserStatusManager";
import UserTransactionsPanel from "./UserTransactionsPanel";
import UserWalletCard from "./UserWalletCard";

interface UserDetailsDrawerProps {
  user: UserRecord | null;
  onClose: () => void;
  onUpdateUser: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

const TABS: Array<{ id: DrawerTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "security", label: "Security" },
  { id: "wallet", label: "Wallet" },
  { id: "kyc", label: "KYC" },
  { id: "transactions", label: "Transactions" },
  { id: "activity", label: "Activity" },
  { id: "risk", label: "Risk" },
];

export default function UserDetailsDrawer({
  user,
  onClose,
  onUpdateUser,
}: UserDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");

  // Reset tab to overview when opening a new user profile
  useEffect(() => {
    if (user) {
      setActiveTab("overview");
    }
  }, [user?.id]);

  // Handle Escape key press to close drawer
  useEffect(() => {
    if (!user) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, onClose]);

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
        >
          {/* Backdrop Click Area */}
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 focus:outline-none"
            aria-label="Close user details overlay"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 290, damping: 31 }}
            className="relative z-10 flex h-full w-full max-w-[680px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl"
          >
            {/* Drawer Header */}
            <header className="bg-gradient-to-br from-[#0B213A] to-[#1F5EA8] p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black ring-1 ring-white/10">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black">{user.name}</h2>
                    <p className="truncate text-xs text-blue-100/70">
                      {user.email}
                    </p>
                    <p className="mt-2 text-[9px] uppercase tracking-wider text-blue-100/50">
                      {user.id} · Joined {formatJoinedDate(user.joinedAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Navigation Tabs */}
            <nav
              className="overflow-x-auto border-b border-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="User profile sections"
            >
              <div className="flex min-w-max gap-1 p-2">
                {TABS.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold transition-colors focus:outline-none ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Scrollable Tab Content Area */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <UserProfileCard user={user} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <UserStatusManager
                          user={user}
                          onUpdate={onUpdateUser}
                        />
                        <UserRoleManager
                          user={user}
                          onUpdate={onUpdateUser}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <InfoCard
                          label="Balance"
                          value={formatCurrency(user.balance)}
                        />
                        <InfoCard
                          label="Transactions"
                          value={String(user.transactionCount)}
                        />
                        <InfoCard
                          label="Sessions"
                          value={String(user.activeSessions)}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "security" && (
                    <UserSecurityCard user={user} onUpdate={onUpdateUser} />
                  )}

                  {activeTab === "wallet" && (
                    <UserWalletCard user={user} onUpdate={onUpdateUser} />
                  )}

                  {activeTab === "kyc" && (
                    <UserKYCPanel user={user} onUpdate={onUpdateUser} />
                  )}

                  {activeTab === "transactions" && (
                    <UserTransactionsPanel user={user} />
                  )}

                  {activeTab === "activity" && (
                    <UserActivityTimeline user={user} />
                  )}

                  {activeTab === "risk" && (
                    <UserRiskPanel user={user} onUpdate={onUpdateUser} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "U";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "U"
  );
}

function formatJoinedDate(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-BD");
  } catch {
    return "N/A";
  }
}

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `৳${value}`;
  }
}