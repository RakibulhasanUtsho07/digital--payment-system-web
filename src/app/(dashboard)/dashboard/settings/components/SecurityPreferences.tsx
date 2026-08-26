"use client";

import Link from "next/link";
import {
  ChevronRight,
  KeyRound,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export default function SecurityPreferences() {
  return (
    <section className="space-y-7">
      <Header
        title="Security Preferences"
        description="Review account protection from one place. Advanced security controls live in the dedicated Security Center."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SecurityCard
          title="Security Score"
          value="92 / 100"
          description="Your account has a strong protection baseline."
          icon={ShieldCheck}
          color="emerald"
        />

        <SecurityCard
          title="Two-Factor Authentication"
          value="Enabled"
          description="Authenticator-based second factor is available."
          icon={Smartphone}
          color="blue"
        />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
            <KeyRound className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Security Center
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Manage password, sessions, 2FA, security alerts and wallet protection.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/security"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17466F]"
        >
          Open Security Center
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <h2 className="text-2xl font-black text-[#0F2745]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SecurityCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: "emerald" | "blue";
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          color === "emerald"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}