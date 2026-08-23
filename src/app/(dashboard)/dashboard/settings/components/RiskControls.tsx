"use client";

import type {
  AdminSettingsState,
} from "./SettingsTypes";

interface Props {
  draft: AdminSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<AdminSettingsState>
  >;
}

export default function RiskControls({
  draft,
  setDraft,
}: Props) {
  return (
    <section className="space-y-7">
      <Header
        title="Transaction Risk Controls"
        description="Configure thresholds that can trigger manual review or stricter controls."
      />

      <div className="space-y-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <RangeField
          label="Daily Transfer Limit"
          description="Maximum standard transfer amount per user."
          value={
            draft.risk
              .dailyTransferLimit
          }
          min={10000}
          max={500000}
          step={5000}
          onChange={(value) =>
            setDraft(
              (
                current
              ) => ({
                ...current,
                risk: {
                  ...current.risk,
                  dailyTransferLimit:
                    value,
                },
              })
            )
          }
        />

        <RangeField
          label="Manual Review Threshold"
          description="Transactions above this amount enter the review queue."
          value={
            draft.risk
              .reviewThreshold
          }
          min={5000}
          max={100000}
          step={5000}
          onChange={(value) =>
            setDraft(
              (
                current
              ) => ({
                ...current,
                risk: {
                  ...current.risk,
                  reviewThreshold:
                    value,
                },
              })
            )
          }
        />

        <div className="border-t border-slate-100 pt-5">
          <Toggle
            label="Require KYC for high-value transfers"
            description="Require identity verification before sensitive financial operations."
            enabled={
              draft.risk
                .requireKycForHighValue
            }
            onChange={(value) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  risk: {
                    ...current.risk,
                    requireKycForHighValue:
                      value,
                  },
                })
              )
            }
          />
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
          Current policy
        </p>

        <p className="mt-2 text-lg font-black text-blue-950">
          Review above ৳
          {draft.risk.reviewThreshold.toLocaleString()}
        </p>

        <p className="mt-1 text-xs leading-5 text-blue-800">
          This is a UI policy preview. Connect it to the backend risk engine
          before relying on it for real transactions.
        </p>
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

function RangeField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <span className="w-fit rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#1F5EA8]">
          ৳
          {value.toLocaleString()}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-5 w-full accent-[#1F5EA8]"
      />
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