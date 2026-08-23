"use client";

import {
  Camera,
  Info,
  Mail,
  Phone,
  User,
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

export default function ProfileSettings({
  draft,
  setDraft,
}: Props) {
  const updateProfile = <
    K extends keyof UserSettingsState["profile"]
  >(
    key: K,
    value: UserSettingsState["profile"][K]
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,
        profile: {
          ...current.profile,
          [key]: value,
        },
      })
    );
  };

  const initial =
    draft.profile.name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "U";

  return (
    <section className="space-y-7">
      <Header
        title="Profile & Identity"
        description="Manage your personal information and how it appears across NovaWallet."
      />

      <div className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1F5EA8] to-cyan-400 text-2xl font-black text-white shadow-lg">
          {initial}
        </div>

        <div>
          <button
            type="button"
            onClick={() =>
              alert(
                "Connect your real avatar upload flow here."
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-[#1F5EA8]"
          >
            <Camera className="h-4 w-4" />
            Change Avatar
          </button>

          <p className="mt-2 text-[10px] text-slate-400">
            JPG, PNG or WEBP. Maximum recommended size 2MB.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Full Name"
          value={
            draft.profile.name
          }
          icon={User}
          onChange={(value) =>
            updateProfile(
              "name",
              value
            )
          }
        />

        <Field
          label="Email Address"
          type="email"
          value={
            draft.profile.email
          }
          icon={Mail}
          onChange={(value) =>
            updateProfile(
              "email",
              value
            )
          }
        />

        <Field
          label="Phone Number"
          type="tel"
          value={
            draft.profile.phone
          }
          icon={Phone}
          onChange={(value) =>
            updateProfile(
              "phone",
              value
            )
          }
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

        <p className="text-xs leading-5 text-blue-800">
          Changes to legal identity information may require KYC verification.
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
    </div>
  );
}