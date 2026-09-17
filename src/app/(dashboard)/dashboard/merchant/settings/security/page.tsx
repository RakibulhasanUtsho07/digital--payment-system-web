"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import {
  updateMerchantSecuritySettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantSecuritySettings,
} from "@/types/merchant-settings";

import {
  useMerchantSettings,
} from "../MerchantSettingsContext";

import {
  SettingsMessage,
  SettingsSaveBar,
  SettingsSection,
  SettingsToggle,
} from "../components/SettingsUI";

export default function SecuritySettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantSecuritySettings | null>(
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
            .security,
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
          await updateMerchantSecuritySettings(
            form,
          );

        updateLocalSection(
          "security",
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
            : "Unable to save security preferences.",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <SettingsSection
      eyebrow="Security"
      title="Merchant security alerts"
      description="Configure security-related merchant notifications. Authentication and account security remain in the main Security section."
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

      <div className="space-y-3">
        <SettingsToggle
          title="API key created"
          description="Alert when a new merchant API key is created."
          checked={
            form.notifyOnApiKeyCreated
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              notifyOnApiKeyCreated:
                checked,
            })
          }
        />

        <SettingsToggle
          title="API key rotated"
          description="Alert when merchant API credentials are rotated."
          checked={
            form.notifyOnApiKeyRotated
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              notifyOnApiKeyRotated:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Webhook secret rotated"
          description="Alert when a webhook signing secret changes."
          checked={
            form.notifyOnWebhookSecretRotated
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              notifyOnWebhookSecretRotated:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Payout request"
          description="Alert whenever a merchant payout is requested."
          checked={
            form.notifyOnPayoutRequest
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              notifyOnPayoutRequest:
                checked,
            })
          }
        />
      </div>

      <div
        className="
          mt-6
          flex
          flex-col
          gap-4
          rounded-[22px]
          bg-[#18092D]
          p-5
          text-white

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 text-violet-300" />

          <div>
            <p className="text-sm font-black">
              Account security
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-violet-100/65
              "
            >
              Passwords, sessions and account-level security are
              managed separately.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/merchant/security"
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-white
            px-4
            text-xs
            font-black
            text-violet-700
          "
        >
          Open Security

          <ArrowRight className="h-4 w-4" />
        </Link>
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