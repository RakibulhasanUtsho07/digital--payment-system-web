"use client";

import type {
  UserSettingsState,
} from "./SettingsTypes";

import ProfileSettings from "./ProfileSettings";
import SecurityPreferences from "./SecurityPreferences";
import NotificationPreferences from "./NotificationPreferences";
import PrivacySettings from "./PrivacySettings";
import AppearanceSettings from "./AppearanceSettings";
import WalletPreferences from "./WalletPreferences";
import DangerZone from "./DangerZone";

interface Props {
  activeSection: string;
  draft: UserSettingsState;
  setDraft: React.Dispatch<
    React.SetStateAction<UserSettingsState>
  >;
}

export default function UserSettings({
  activeSection,
  draft,
  setDraft,
}: Props) {
  if (
    activeSection ===
    "profile"
  ) {
    return (
      <ProfileSettings
        draft={draft}
        setDraft={
          setDraft
        }
      />
    );
  }

  if (
    activeSection ===
    "security"
  ) {
    return (
      <SecurityPreferences />
    );
  }

  if (
    activeSection ===
    "notifications"
  ) {
    return (
      <NotificationPreferences
        draft={draft}
        setDraft={
          setDraft
        }
      />
    );
  }

  if (
    activeSection ===
    "privacy"
  ) {
    return (
      <PrivacySettings
        draft={draft}
        setDraft={
          setDraft
        }
      />
    );
  }

  if (
    activeSection ===
    "appearance"
  ) {
    return (
      <AppearanceSettings
        draft={draft}
        setDraft={
          setDraft
        }
      />
    );
  }

  if (
    activeSection ===
    "wallet"
  ) {
    return (
      <WalletPreferences
        draft={draft}
        setDraft={
          setDraft
        }
      />
    );
  }

  if (
    activeSection ===
    "data"
  ) {
    return (
      <DataManagement />
    );
  }

  return <DangerZone />;
}

function DataManagement() {
  const downloads = [
    {
      title: "Account Data",
      description:
        "Profile, settings, and account preferences.",
    },
    {
      title: "Transaction History",
      description:
        "Your wallet transaction records.",
    },
    {
      title: "Financial Reports",
      description:
        "Budget and cash-flow summaries.",
    },
    {
      title: "Receipt Archive",
      description:
        "Saved receipt metadata and purchase history.",
    },
  ];

  return (
    <section className="space-y-7">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-[#0F2745]">
          Data & Export
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Download or prepare your financial information for export.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {downloads.map(
          (item) => (
            <div
              key={
                item.title
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {item.description}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.alert(
                    `${item.title} export UI is ready for your real export endpoint.`
                  )
                }
                className="mt-4 text-xs font-bold text-[#1F5EA8] hover:underline"
              >
                Configure Export →
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
}