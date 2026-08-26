"use client";

import {
  Server,
  AlertTriangle,
} from "lucide-react";

import type {
  AdminSettingsState,
} from "./SettingsTypes";

interface Props {
  draft: AdminSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<AdminSettingsState>
  >;
}

export default function SystemPreferences({
  draft,
  setDraft,
}: Props) {
  return (
    <section className="space-y-7">
      <Header
        title="System Preferences"
        description="Control platform availability, registration behavior, and basic system defaults."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
              <Server className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Platform status
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Production services currently report as operational.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
            Operational
          </span>
        </div>

        <div className="mt-5">
          <Toggle
            label="Maintenance Mode"
            description="Demo-only UI state. Do not treat this as real infrastructure control until a backend operation exists."
            enabled={
              draft.platform
                .maintenanceMode
            }
            onChange={(value) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  platform: {
                    ...current.platform,
                    maintenanceMode:
                      value,
                  },
                })
              )
            }
          />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Toggle
            label="Allow New Signups"
            description="Controls the demo preference for public registration."
            enabled={
              draft.platform
                .allowSignups
            }
            onChange={(value) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  platform: {
                    ...current.platform,
                    allowSignups:
                      value,
                  },
                })
              )
            }
          />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-5">
          <label className="mb-2 block text-xs font-bold text-slate-700">
            Default Currency
          </label>

          <select
            value={
              draft.platform
                .defaultCurrency
            }
            onChange={(event) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  platform: {
                    ...current.platform,
                    defaultCurrency:
                      event
                        .target
                        .value,
                  },
                })
              )
            }
            className="h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-[#1F5EA8] focus:bg-white"
          >
            <option value="BDT">
              BDT
            </option>
            <option value="USD">
              USD
            </option>
            <option value="EUR">
              EUR
            </option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-xs leading-5 text-amber-800">
            Maintenance mode and signup policies need backend enforcement before
            they can affect real users.
          </p>
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
    <div className="flex items-center justify-between gap-5">
      <div>
        <p className="text-sm font-bold text-slate-900">
          {label}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
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