"use client";

import type {
  UserSettingsState,
  ThemeMode,
  Density,
} from "./SettingsTypes";

interface Props {
  draft: UserSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<UserSettingsState>
  >;
}

export default function AppearanceSettings({
  draft,
  setDraft,
}: Props) {
  const themes: ThemeMode[] = [
    "light",
    "dark",
    "system",
  ];

  const densities: Density[] = [
    "comfortable",
    "compact",
  ];

  return (
    <section className="space-y-7">
      <Header
        title="Appearance"
        description="Customize the look and feel of your NovaWallet dashboard."
      />

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Color Theme
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map(
            (theme) => (
              <Choice
                key={
                  theme
                }
                label={
                  theme
                }
                active={
                  draft.appearance
                    .theme ===
                  theme
                }
                onClick={() =>
                  setDraft(
                    (
                      current
                    ) => ({
                      ...current,
                      appearance:
                        {
                          ...current.appearance,
                          theme,
                        },
                    })
                  )
                }
              />
            )
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Dashboard Density
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {densities.map(
            (
              density
            ) => (
              <Choice
                key={
                  density
                }
                label={
                  density
                }
                active={
                  draft.appearance
                    .density ===
                  density
                }
                onClick={() =>
                  setDraft(
                    (
                      current
                    ) => ({
                      ...current,
                      appearance:
                        {
                          ...current.appearance,
                          density,
                        },
                    })
                  )
                }
              />
            )
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900">
          Live preview
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-3/4 rounded-full bg-slate-100" />
            </div>
          </div>
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

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-2xl border-2 p-5 text-left transition ${
        active
          ? "border-[#1F5EA8] bg-blue-50 text-[#1F5EA8]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      <p className="text-sm font-bold capitalize">
        {label}
      </p>

      <p className="mt-1 text-[11px] opacity-70">
        {label ===
        "light"
          ? "Bright and clean"
          : label ===
            "dark"
          ? "Low-light experience"
          : label ===
            "system"
          ? "Follow operating system"
          : label ===
            "comfortable"
          ? "More breathing room"
          : "Compact information density"}
      </p>
    </button>
  );
}