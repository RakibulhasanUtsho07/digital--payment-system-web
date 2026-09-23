"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Loader2,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  updateMerchantGeneralSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantGeneralSettings,
} from "@/types/merchant-settings";

import {
  useMerchantSettings,
} from "../MerchantSettingsContext";

import {
  SettingsField,
  SettingsMessage,
  SettingsSaveBar,
  SettingsSection,
  settingsInputClass,
} from "../components/SettingsUI";

export default function GeneralSettingsPage() {
  const router =
    useRouter();

  const {
    user,
  } =
    useDashboardSession();

  const isMerchantRole =
    user.role ===
    "merchant";

  const {
    data,
    error: loadError,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantGeneralSettings | null>(
      null,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (
      isMerchantRole
    ) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role,
      ),
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  useEffect(
    () => {
      if (
        !isMerchantRole
      ) {
        return;
      }

      if (
        data
      ) {
        setForm({
          ...data.settings
            .general,
        });
      }
    },
    [
      data,
      isMerchantRole,
    ],
  );

  const updateForm =
    (
      values:
        Partial<MerchantGeneralSettings>,
    ) => {
      if (
        !isMerchantRole ||
        !form
      ) {
        return;
      }

      setForm({
        ...form,
        ...values,
      });
    };

  const save =
    async () => {
      if (
        !isMerchantRole ||
        !form
      ) {
        return;
      }

      try {
        setSaving(
          true,
        );

        setError("");
        setMessage("");

        const response =
          await updateMerchantGeneralSettings(
            form,
          );

        updateLocalSection(
          "general",
          response.settings,
          response.revision,
          response.updatedAt,
        );

        setMessage(
          response.message,
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to save general settings.",
        );
      } finally {
        setSaving(
          false,
        );
      }
    };

  if (
    !isMerchantRole
  ) {
    return (
      <div
        className="
          grid
          min-h-[50vh]
          place-items-center
          px-4
        "
      >
        <div className="text-center">
          <Loader2
            className="
              mx-auto
              h-6
              w-6
              animate-spin
              text-violet-600
            "
          />

          <p
            className="
              mt-3
              text-sm
              font-bold
              merchant-muted
            "
          >
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (
    loadError
  ) {
    return (
      <SettingsMessage
        type="error"
        message={
          loadError
        }
      />
    );
  }

  if (
    !form
  ) {
    return (
      <div
        className="
          grid
          min-h-[260px]
          place-items-center
        "
      >
        <Loader2
          className="
            h-6
            w-6
            animate-spin
            text-violet-600
          "
        />
      </div>
    );
  }

  return (
    <SettingsSection
      eyebrow="General"
      title="General information"
      description="Configure the public and operational information used across your merchant account."
    >
      {message ? (
        <SettingsMessage
          type="success"
          message={
            message
          }
        />
      ) : null}

      {error ? (
        <SettingsMessage
          type="error"
          message={
            error
          }
        />
      ) : null}

      <div
        className="
          grid
          min-w-0
          gap-5

          md:grid-cols-2
        "
      >
        <SettingsField
          label="Display name"
          helper="The friendly merchant name shown inside the dashboard."
        >
          <input
            className={
              settingsInputClass
            }
            value={
              form.displayName ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateForm({
                displayName:
                  event.target
                    .value,
              })
            }
          />
        </SettingsField>

        <SettingsField
          label="Support email"
        >
          <input
            type="email"
            className={
              settingsInputClass
            }
            value={
              form.supportEmail ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateForm({
                supportEmail:
                  event.target
                    .value,
              })
            }
          />
        </SettingsField>

        <SettingsField
          label="Support phone"
        >
          <input
            className={
              settingsInputClass
            }
            value={
              form.supportPhone ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateForm({
                supportPhone:
                  event.target
                    .value,
              })
            }
          />
        </SettingsField>

        <SettingsField
          label="Website"
        >
          <input
            type="url"
            className={
              settingsInputClass
            }
            placeholder="https://example.com"
            value={
              form.website ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateForm({
                website:
                  event.target
                    .value,
              })
            }
          />
        </SettingsField>

        <SettingsField
          label="Timezone"
        >
          <input
            className={
              settingsInputClass
            }
            value={
              form.timezone ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateForm({
                timezone:
                  event.target
                    .value,
              })
            }
            placeholder="Asia/Dhaka"
          />
        </SettingsField>

        <SettingsField
          label="Locale"
        >
          <select
            className={
              settingsInputClass
            }
            value={
              form.locale ??
              "en"
            }
            onChange={(
              event,
            ) =>
              updateForm({
                locale:
                  event.target
                    .value,
              })
            }
          >
            <option value="en">
              English
            </option>

            <option value="bn">
              বাংলা
            </option>

            <option value="en-BD">
              English (Bangladesh)
            </option>
          </select>
        </SettingsField>
      </div>

      <SettingsSaveBar
        saving={
          saving
        }
        onSave={() => {
          if (
            !isMerchantRole
          ) {
            return;
          }

          void save();
        }}
      />
    </SettingsSection>
  );
}