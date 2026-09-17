"use client";

import {
  useEffect,
  useState,
} from "react";

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

  useEffect(
    () => {
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
    ],
  );

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
    return null;
  }

  const save =
    async () => {
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
              setForm({
                ...form,

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
              setForm({
                ...form,

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
              setForm({
                ...form,

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
              setForm({
                ...form,

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
              form.timezone
            }
            onChange={(
              event,
            ) =>
              setForm({
                ...form,

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
              form.locale
            }
            onChange={(
              event,
            ) =>
              setForm({
                ...form,

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
        onSave={() =>
          void save()
        }
      />
    </SettingsSection>
  );
}