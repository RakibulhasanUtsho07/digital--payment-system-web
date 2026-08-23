"use client";

import type {
  AdminSettingsState,
} from "./SettingsTypes";

import RolePermissionMatrix from "./RolePermissionMatrix";
import RiskControls from "./RiskControls";
import AuditActivity from "./AuditActivity";
import SystemPreferences from "./SystemPreferences";

interface Props {
  activeSection: string;
  draft: AdminSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<AdminSettingsState>
  >;
}

export default function AdminSettings({
  activeSection,
  draft,
  setDraft,
}: Props) {
  if (
    activeSection ===
    "users"
  ) {
    return (
      <RolePermissionMatrix />
    );
  }

  if (
    activeSection ===
    "risk"
  ) {
    return (
      <RiskControls
        draft={draft}
        setDraft={setDraft}
      />
    );
  }

  if (
    activeSection ===
    "audit"
  ) {
    return <AuditActivity />;
  }

  if (
    activeSection ===
    "system"
  ) {
    return (
      <SystemPreferences
        draft={draft}
        setDraft={setDraft}
      />
    );
  }

  if (
    activeSection ===
    "policies"
  ) {
    return (
      <SecurityPolicies
        draft={draft}
        setDraft={setDraft}
      />
    );
  }

  return (
    <PlatformOverview
      draft={draft}
    />
  );
}

function PlatformOverview({
  draft,
}: {
  draft: AdminSettingsState;
}) {
  return (
    <section className="space-y-7">
      <Header
        title="Platform Overview"
        description="High-level platform health and configuration summary."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="Active Users"
          value="124,592"
          note="+2.4% this week"
          positive
        />

        <Metric
          title="Pending KYC"
          value="843"
          note="Requires attention"
        />

        <Metric
          title="System Status"
          value="Operational"
          note="Last incident 14 days ago"
          positive
        />
      </div>

      <div className="rounded-3xl bg-[#0F2745] p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
          Configuration Health
        </p>

        <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-emerald-400/20 border-t-emerald-400 text-xl font-black">
            94
          </div>

          <div className="flex-1">
            <p className="text-lg font-black">
              Platform securely configured
            </p>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-100/60">
              Risk, authentication, and operational policies are configured
              for the current admin demo state.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Progress
                label="Risk Policies"
                value={100}
              />

              <Progress
                label="Auth Policies"
                value={
                  draft.security
                    .requireMfa
                    ? 95
                    : 72
                }
              />

              <Progress
                label="System Config"
                value={
                  draft.platform
                    .maintenanceMode
                    ? 70
                    : 98
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecurityPolicies({
  draft,
  setDraft,
}: {
  draft: AdminSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<AdminSettingsState>
  >;
}) {
  return (
    <section className="space-y-7">
      <Header
        title="Security Policies"
        description="Define global authentication and session-security expectations."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <Toggle
          label="Require MFA for staff"
          description="Require two-factor authentication for privileged accounts."
          enabled={
            draft.security
              .requireMfa
          }
          onChange={(value) =>
            setDraft(
              (
                current
              ) => ({
                ...current,
                security: {
                  ...current.security,
                  requireMfa:
                    value,
                },
              })
            )
          }
        />

        <div className="border-t border-slate-100 pt-5">
          <label className="mb-2 block text-xs font-bold text-slate-700">
            Session Timeout
          </label>

          <select
            value={
              draft.security
                .sessionTimeoutMins
            }
            onChange={(event) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  security: {
                    ...current.security,
                    sessionTimeoutMins:
                      Number(
                        event
                          .target
                          .value
                      ),
                  },
                })
              )
            }
            className="h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-[#1F5EA8] focus:bg-white"
          >
            <option value="15">
              15 minutes
            </option>
            <option value="30">
              30 minutes
            </option>
            <option value="60">
              1 hour
            </option>
            <option value="240">
              4 hours
            </option>
          </select>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <label className="mb-2 block text-xs font-bold text-slate-700">
            Maximum login attempts
          </label>

          <input
            type="number"
            min={3}
            max={10}
            value={
              draft.security
                .maxLoginAttempts
            }
            onChange={(event) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  security: {
                    ...current.security,
                    maxLoginAttempts:
                      Number(
                        event
                          .target
                          .value
                      ),
                  },
                })
              )
            }
            className="h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-[#1F5EA8] focus:bg-white"
          />
        </div>
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

function Metric({
  title,
  value,
  note,
  positive = false,
}: {
  title: string;
  value: string;
  note: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 break-words text-2xl font-black ${
          positive
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-[11px] text-slate-400">
        {note}
      </p>
    </div>
  );
}

function Progress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-blue-100/60">
          {label}
        </span>

        <span className="font-bold text-white">
          {value}%
        </span>
      </div>

      <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 pb-5">
      <div>
        <p className="text-sm font-bold text-slate-900">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative h-7 w-12 shrink-0 rounded-full ${
          enabled
            ? "bg-[#1F5EA8]"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}