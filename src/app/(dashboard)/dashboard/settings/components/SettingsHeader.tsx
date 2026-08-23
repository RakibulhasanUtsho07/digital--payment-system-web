"use client";

import {
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { Role } from "./SettingsTypes";

interface SettingsHeaderProps {
  role: Role;
  onSwitchRole: () => void;
}

export default function SettingsHeader({
  role,
  onSwitchRole,
}: SettingsHeaderProps) {
  const isAdmin = role === "admin";

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0B1D34] via-[#12385E] to-[#1F5EA8] p-6 text-white shadow-[0_20px_60px_rgba(15,39,69,0.18)] sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md">
              <Settings className="h-5 w-5 text-cyan-200" />
            </div>

            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 backdrop-blur-md">
              {isAdmin
                ? "Platform Administrator"
                : "Personal Account"}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            {isAdmin
              ? "Administration Settings"
              : "Settings & Preferences"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">
            {isAdmin
              ? "Configure platform behavior, access policies, security controls, risk rules, and operational preferences."
              : "Customize your NovaWallet experience, security, privacy, notifications, and wallet preferences."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isAdmin
                ? "Admin controls active"
                : "Account protected"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-100">
              {isAdmin ? (
                <UsersRound className="h-3.5 w-3.5" />
              ) : (
                <UserRound className="h-3.5 w-3.5" />
              )}

              {isAdmin
                ? "Platform scope"
                : "Personal scope"}
            </span>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/60">
                Demo role
              </p>

              <p className="mt-1 text-sm font-extrabold text-white">
                {isAdmin
                  ? "Administrator"
                  : "User"}
              </p>
            </div>

            <button
              type="button"
              onClick={onSwitchRole}
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#173F6D] transition hover:bg-blue-50"
            >
              Switch to{" "}
              {isAdmin
                ? "User"
                : "Admin"}
            </button>
          </div>

          <p className="mt-3 text-[10px] leading-5 text-blue-100/60">
            This role switch is for UI demonstration only. Production
            authorization must come from your authenticated backend role.
          </p>
        </div>
      </div>
    </section>
  );
}