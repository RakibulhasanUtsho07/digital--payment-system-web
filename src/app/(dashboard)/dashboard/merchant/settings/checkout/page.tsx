"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  updateMerchantCheckoutSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantCheckoutSettings,
} from "@/types/merchant-settings";

import {
  useMerchantSettings,
} from "../MerchantSettingsContext";

import {
  SettingsField,
  SettingsMessage,
  SettingsSaveBar,
  SettingsSection,
  SettingsToggle,
  settingsInputClass,
} from "../components/SettingsUI";

export default function CheckoutSettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantCheckoutSettings | null>(
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
            .checkout,
        });
      }
    },
    [
      data,
    ],
  );

  if (!form) {
    return null;
  }

  const save =
    async () => {
      try {
        setSaving(true);
        setError("");
        setMessage("");

        const response =
          await updateMerchantCheckoutSettings(
            form,
          );

        updateLocalSection(
          "checkout",
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
            : "Unable to save checkout settings.",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <SettingsSection
      eyebrow="Checkout"
      title="Checkout preferences"
      description="Configure defaults used when your integration does not explicitly override them."
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
          label="Default expiry"
          helper="Between 5 and 1440 minutes."
        >
          <input
            type="number"
            min={
              5
            }
            max={
              1440
            }
            className={
              settingsInputClass
            }
            value={
              form.defaultExpiryMinutes
            }
            onChange={(
              event,
            ) =>
              setForm({
                ...form,

                defaultExpiryMinutes:
                  Number(
                    event.target
                      .value,
                  ),
              })
            }
          />
        </SettingsField>

        <div />

        <SettingsToggle
          title="Collect customer name"
          description="Request a customer name during hosted checkout."
          checked={
            form.collectCustomerName
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              collectCustomerName:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Collect customer email"
          description="Request customer email during checkout."
          checked={
            form.collectCustomerEmail
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              collectCustomerEmail:
                checked,
            })
          }
        />

        <div className="md:col-span-2">
          <SettingsField
            label="Default return URL"
          >
            <input
              type="url"
              className={
                settingsInputClass
              }
              value={
                form.defaultReturnUrl ??
                ""
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  defaultReturnUrl:
                    event.target
                      .value,
                })
              }
            />
          </SettingsField>
        </div>

        <div className="md:col-span-2">
          <SettingsField
            label="Default cancel URL"
          >
            <input
              type="url"
              className={
                settingsInputClass
              }
              value={
                form.defaultCancelUrl ??
                ""
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  defaultCancelUrl:
                    event.target
                      .value,
                })
              }
            />
          </SettingsField>
        </div>

        <div className="md:col-span-2">
          <SettingsField
            label="Checkout note"
          >
            <textarea
              rows={
                3
              }
              className={`${settingsInputClass} h-auto py-3`}
              value={
                form.checkoutNote ??
                ""
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  checkoutNote:
                    event.target
                      .value,
                })
              }
            />
          </SettingsField>
        </div>
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