"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  updateMerchantNotificationSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantNotificationSettings,
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

export default function NotificationSettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantNotificationSettings | null>(
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
            .notifications,
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
          await updateMerchantNotificationSettings(
            form,
          );

        updateLocalSection(
          "notifications",
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
            : "Unable to save notifications.",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <SettingsSection
      eyebrow="Notifications"
      title="Notification preferences"
      description="Choose which important merchant events should create notifications."
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
          title="Payment completed"
          description="Receive notification when a customer payment completes."
          checked={
            form.paymentCompleted
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              paymentCompleted:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Payment failed"
          description="Notify when a payment attempt fails."
          checked={
            form.paymentFailed
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              paymentFailed:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Refund created"
          description="Receive updates about merchant refunds."
          checked={
            form.refundCreated
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              refundCreated:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Payout updates"
          description="Receive status updates for payout requests."
          checked={
            form.payoutUpdates
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              payoutUpdates:
                checked,
            })
          }
        />

        <SettingsToggle
          title="Security alerts"
          description="Keep important merchant security notifications enabled."
          checked={
            form.securityAlerts
          }
          onChange={(
            checked,
          ) =>
            setForm({
              ...form,

              securityAlerts:
                checked,
            })
          }
        />
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