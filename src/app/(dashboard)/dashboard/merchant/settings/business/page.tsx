"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BadgeCheck,
} from "lucide-react";

import {
  updateMerchantBusinessSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantBusinessSettings,
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

export default function BusinessSettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantBusinessSettings | null>(
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
        setForm(
          structuredClone(
            data.settings
              .business,
          ),
        );
      }
    },
    [
      data,
    ],
  );

  if (
    !data ||
    !form
  ) {
    return null;
  }

  const updateAddress =
    (
      key:
        keyof MerchantBusinessSettings["address"],

      value:
        string,
    ) => {
      setForm({
        ...form,

        address: {
          ...form.address,

          [key]:
            value,
        },
      });
    };

  const save =
    async () => {
      try {
        setSaving(
          true,
        );

        setMessage("");
        setError("");

        const response =
          await updateMerchantBusinessSettings(
            form,
          );

        updateLocalSection(
          "business",
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
            : "Unable to save business settings.",
        );
      } finally {
        setSaving(
          false,
        );
      }
    };

  return (
    <SettingsSection
      eyebrow="Business"
      title="Business profile"
      description="Manage public business information. Verified legal identity is intentionally kept separate from editable merchant settings."
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
          mb-6
          flex
          items-start
          gap-3
          rounded-2xl
          bg-emerald-500/10
          p-4
          text-emerald-800

          dark:text-emerald-300
        "
      >
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />

        <div>
          <p className="text-xs font-black">
            Verified identity is protected
          </p>

          <p
            className="
              mt-1
              text-xs
              leading-5
              opacity-80
            "
          >
            Legal business name and verification information cannot
            be changed from this page.
          </p>
        </div>
      </div>

      <div
        className="
          grid
          gap-5

          md:grid-cols-2
        "
      >
        <SettingsField
          label="Legal business name"
          helper="Read only — managed by Merchant Verification."
        >
          <input
            disabled
            value={
              data.merchant
                .businessName
            }
            className={`${settingsInputClass} cursor-not-allowed opacity-60`}
          />
        </SettingsField>

        <SettingsField
          label="Business category"
        >
          <input
            className={
              settingsInputClass
            }
            value={
              form.category ??
              ""
            }
            onChange={(
              event,
            ) =>
              setForm({
                ...form,

                category:
                  event.target
                    .value,
              })
            }
          />
        </SettingsField>

        <div className="md:col-span-2">
          <SettingsField
            label="Public description"
          >
            <textarea
              rows={
                4
              }
              className={`${settingsInputClass} h-auto py-3`}
              value={
                form.publicDescription ??
                ""
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  publicDescription:
                    event.target
                      .value,
                })
              }
            />
          </SettingsField>
        </div>

        <SettingsField label="Address line 1">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .line1 ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "line1",
                event.target
                  .value,
              )
            }
          />
        </SettingsField>

        <SettingsField label="Address line 2">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .line2 ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "line2",
                event.target
                  .value,
              )
            }
          />
        </SettingsField>

        <SettingsField label="City">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .city ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "city",
                event.target
                  .value,
              )
            }
          />
        </SettingsField>

        <SettingsField label="State / region">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .state ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "state",
                event.target
                  .value,
              )
            }
          />
        </SettingsField>

        <SettingsField label="Postal code">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .postalCode ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "postalCode",
                event.target
                  .value,
              )
            }
          />
        </SettingsField>

        <SettingsField label="Country">
          <input
            className={
              settingsInputClass
            }
            value={
              form.address
                .country ??
              ""
            }
            onChange={(
              event,
            ) =>
              updateAddress(
                "country",
                event.target
                  .value,
              )
            }
          />
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