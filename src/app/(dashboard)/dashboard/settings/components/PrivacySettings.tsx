"use client";

import {
  Eye,
  Lock,
  ShieldCheck,
} from "lucide-react";

import type {
  UserSettingsState,
} from "./SettingsTypes";

interface Props {
  draft: UserSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<UserSettingsState>
  >;
}

export default function PrivacySettings({
  draft,
  setDraft,
}: Props) {
  const update = (
    key: keyof UserSettingsState["privacy"],
    value: boolean
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,
        privacy: {
          ...current.privacy,
          [key]: value,
        },
      })
    );
  };

  return (
    <section className="space-y-7">
      <Header
        title="Privacy Center"
        description="Control how your account data and personalization preferences behave."
      />

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-bold text-blue-900">
              Privacy protection is active
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Sensitive financial details remain available only inside authenticated areas of the wallet.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <PrivacyToggle
          icon={Lock}
          title="Analytics Participation"
          description="Allow anonymous usage analytics to improve the product."
          enabled={
            draft.privacy.analytics
          }
          onChange={(value) =>
            update(
              "analytics",
              value
            )
          }
        />

        <PrivacyToggle
          icon={Eye}
          title="Profile Discoverability"
          description="Allow other users to find you through supported transfer flows."
          enabled={
            draft.privacy
              .discoverability
          }
          onChange={(value) =>
            update(
              "discoverability",
              value
            )
          }
        />

        <PrivacyToggle
          icon={ShieldCheck}
          title="Personalization"
          description="Allow the dashboard to tailor suggestions and layout preferences."
          enabled={
            draft.privacy
              .personalization
          }
          onChange={(value) =>
            update(
              "personalization",
              value
            )
          }
        />
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

function PrivacyToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-slate-100 py-5 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#1F5EA8]">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-900">
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
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