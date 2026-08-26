"use client";

import type {
  UserSettingsState,
} from "./SettingsTypes";

interface Props {
  draft: UserSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<UserSettingsState>
  >;
}

export default function WalletPreferences({
  draft,
  setDraft,
}: Props) {
  return (
    <section className="space-y-7">
      <Header
        title="Wallet Preferences"
        description="Control balance display and transfer confirmation behavior."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-xs font-bold text-slate-700">
          Default Currency
        </label>

        <select
          value={
            draft.wallet
              .defaultCurrency
          }
          onChange={(event) =>
            setDraft(
              (
                current
              ) => ({
                ...current,
                wallet: {
                  ...current.wallet,
                  defaultCurrency:
                    event
                      .target
                      .value,
                },
              })
            )
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-[#1F5EA8] focus:bg-white"
        >
          <option value="BDT">
            Bangladeshi Taka (৳)
          </option>
          <option value="USD">
            US Dollar ($)
          </option>
          <option value="EUR">
            Euro (€)
          </option>
        </select>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <Toggle
            label="Hide balances on launch"
            description="Mask balances until you explicitly reveal them."
            enabled={
              draft.wallet
                .hideAmounts
            }
            onChange={(value) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  wallet: {
                    ...current.wallet,
                    hideAmounts:
                      value,
                  },
                })
              )
            }
          />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Large transfer confirmation
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Ask for an extra confirmation above this amount.
              </p>
            </div>

            <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#1F5EA8]">
              ৳
              {draft.wallet.confirmThreshold.toLocaleString()}
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={
              draft.wallet
                .confirmThreshold
            }
            onChange={(event) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  wallet: {
                    ...current.wallet,
                    confirmThreshold:
                      Number(
                        event
                          .target
                          .value
                      ),
                  },
                })
              )
            }
            className="mt-5 w-full accent-[#1F5EA8]"
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
        className={`relative h-7 w-12 rounded-full ${
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