"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ImageIcon,
} from "lucide-react";

import {
  updateMerchantBrandingSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantBrandingSettings,
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

export default function BrandingSettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantBrandingSettings | null>(
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
            .branding,
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
        setMessage("");
        setError("");

        const response =
          await updateMerchantBrandingSettings({
            checkoutDisplayName:
              form.checkoutDisplayName,

            checkoutAccentColor:
              form.checkoutAccentColor,
          });

        updateLocalSection(
          "branding",
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
            : "Unable to save branding settings.",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <SettingsSection
      eyebrow="Branding"
      title="Checkout branding"
      description="Control the customer-facing visual identity used by Coffer hosted checkout."
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
          gap-6

          lg:grid-cols-[minmax(0,1fr)_360px]
        "
      >
        <div className="space-y-5">
          <SettingsField
            label="Checkout display name"
          >
            <input
              className={
                settingsInputClass
              }
              value={
                form.checkoutDisplayName ??
                ""
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  checkoutDisplayName:
                    event.target
                      .value,
                })
              }
            />
          </SettingsField>

          <SettingsField
            label="Checkout accent color"
          >
            <div
              className="
                flex
                gap-3
              "
            >
              <input
                type="color"
                value={
                  form.checkoutAccentColor
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    checkoutAccentColor:
                      event.target
                        .value,
                  })
                }
                className="
                  h-11
                  w-14
                  rounded-xl
                  border-0
                  bg-transparent
                "
              />

              <input
                className={
                  settingsInputClass
                }
                value={
                  form.checkoutAccentColor
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    checkoutAccentColor:
                      event.target
                        .value,
                  })
                }
              />
            </div>
          </SettingsField>

          <div
            className="
              rounded-2xl
              bg-violet-500/5
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                  text-violet-600
                "
              >
                <ImageIcon className="h-5 w-5" />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-black
                    merchant-text
                  "
                >
                  Merchant logo
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    merchant-muted
                  "
                >
                  Logo upload will use the dedicated secure upload
                  endpoint instead of this form.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW */}

        <div
          className="
            rounded-[24px]
            bg-[#18092D]
            p-5
            text-white
          "
        >
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-wider
              text-violet-300
            "
          >
            Checkout preview
          </p>

          <div
            className="
              mt-5
              rounded-2xl
              bg-white
              p-5
              text-slate-900
            "
          >
            <p
              className="
                text-sm
                font-black
              "
            >
              {form.checkoutDisplayName ||
                "Your business"}
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              Secure payment with Coffer
            </p>

            <div
              className="
                mt-5
                h-11
                rounded-xl
              "
              style={{
                backgroundColor:
                  form.checkoutAccentColor,
              }}
            />
          </div>
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