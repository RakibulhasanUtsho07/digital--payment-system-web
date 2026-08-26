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

export default function NotificationPreferences({
  draft,
  setDraft,
}: Props) {
  const update = (
    key: keyof UserSettingsState["notifications"],
    value: boolean
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,
        notifications: {
          ...current.notifications,
          [key]: value,
        },
      })
    );
  };

  return (
    <section className="space-y-7">
      <Header
        title="Notification Preferences"
        description="Choose how NovaWallet communicates important account and product updates."
      />

      <Panel title="Delivery Channels">
        <Toggle
          label="Email Notifications"
          description="Daily summaries and important account alerts."
          enabled={
            draft.notifications
              .email
          }
          onChange={(value) =>
            update(
              "email",
              value
            )
          }
        />

        <Toggle
          label="Push Notifications"
          description="Immediate alerts delivered to your device."
          enabled={
            draft.notifications
              .push
          }
          onChange={(value) =>
            update(
              "push",
              value
            )
          }
        />

        <Toggle
          label="SMS Alerts"
          description="Use text messages for critical security alerts."
          enabled={
            draft.notifications
              .sms
          }
          onChange={(value) =>
            update(
              "sms",
              value
            )
          }
        />
      </Panel>

      <Panel title="Product & Marketing">
        <Toggle
          label="Tips & Offers"
          description="Optional product updates and financial tips."
          enabled={
            draft.notifications
              .marketing
          }
          onChange={(value) =>
            update(
              "marketing",
              value
            )
          }
        />
      </Panel>
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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-extrabold text-slate-900">
        {title}
      </h3>

      <div>
        {children}
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
    <div className="flex items-center justify-between gap-5 border-b border-slate-100 py-4 last:border-0">
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
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
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