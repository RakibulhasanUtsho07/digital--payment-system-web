"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Laptop,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";

import {
  resetMerchantTheme,
  updateMerchantTheme,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantThemeAccent,
  MerchantThemeSettings,
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

/* =========================================================
   ACCENTS
========================================================= */

const ACCENTS: Array<{
  value:
    MerchantThemeAccent;

  label:
    string;

  className:
    string;
}> = [
  {
    value:
      "purple",

    label:
      "Coffer Purple",

    className:
      "bg-violet-600",
  },

  {
    value:
      "blue",

    label:
      "Royal Blue",

    className:
      "bg-blue-600",
  },

  {
    value:
      "emerald",

    label:
      "Emerald",

    className:
      "bg-emerald-600",
  },

  {
    value:
      "rose",

    label:
      "Rose",

    className:
      "bg-rose-600",
  },

  {
    value:
      "amber",

    label:
      "Amber",

    className:
      "bg-amber-500",
  },
];

export default function ThemeSettingsPage() {
  const {
    data,
    updateLocalSection,
  } =
    useMerchantSettings();

  const [
    form,
    setForm,
  ] =
    useState<MerchantThemeSettings | null>(
      null,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    resetting,
    setResetting,
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
            .theme,
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
          await updateMerchantTheme(
            form,
          );

        setForm(
          response.theme,
        );

        updateLocalSection(
          "theme",
          response.theme,
          response.revision,
          response.updatedAt,
        );

        setMessage(
          response.message ??
            "Theme updated successfully.",
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to update theme.",
        );
      } finally {
        setSaving(false);
      }
    };

  const reset =
    async () => {
      try {
        setResetting(true);
        setMessage("");
        setError("");

        const response =
          await resetMerchantTheme();

        setForm(
          response.theme,
        );

        updateLocalSection(
          "theme",
          response.theme,
          response.revision,
          response.updatedAt,
        );

        setMessage(
          response.message ??
            "Theme reset successfully.",
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to reset theme.",
        );
      } finally {
        setResetting(false);
      }
    };

  return (
    <SettingsSection
      eyebrow="Appearance"
      title="Theme controller"
      description="Personalize how the Merchant Portal looks and feels. Branding remains separate because branding controls the customer checkout experience."
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

          xl:grid-cols-[minmax(0,1fr)_390px]
        "
      >
        <div className="space-y-7">
          {/* MODE */}

          <div>
            <h3
              className="
                text-sm
                font-black
                merchant-text
              "
            >
              Theme mode
            </h3>

            <div
              className="
                mt-3
                grid
                gap-3

                sm:grid-cols-3
              "
            >
              {[
                {
                  value:
                    "light" as const,

                  label:
                    "Light",

                  icon:
                    Sun,
                },

                {
                  value:
                    "dark" as const,

                  label:
                    "Dark",

                  icon:
                    Moon,
                },

                {
                  value:
                    "system" as const,

                  label:
                    "System",

                  icon:
                    Laptop,
                },
              ].map(
                (
                  item,
                ) => {
                  const Icon =
                    item.icon;

                  const selected =
                    form.mode ===
                    item.value;

                  return (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,

                          mode:
                            item.value,
                        })
                      }
                      className={`
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        p-4
                        text-left
                        transition

                        ${
                          selected
                            ? "bg-violet-500/10 ring-1 ring-violet-500/30"
                            : "bg-violet-500/5"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-xl

                          ${
                            selected
                              ? "bg-violet-600 text-white"
                              : "bg-violet-500/10 text-violet-600"
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span
                        className="
                          text-sm
                          font-black
                          merchant-text
                        "
                      >
                        {
                          item.label
                        }
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* ACCENT */}

          <div>
            <h3
              className="
                text-sm
                font-black
                merchant-text
              "
            >
              Accent color
            </h3>

            <div
              className="
                mt-3
                grid
                gap-2

                sm:grid-cols-2
              "
            >
              {ACCENTS.map(
                (
                  item,
                ) => (
                  <button
                    key={
                      item.value
                    }
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,

                        accent:
                          item.value,
                      })
                    }
                    className={`
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      p-3
                      transition

                      ${
                        form.accent ===
                        item.value
                          ? "bg-violet-500/10"
                          : "bg-violet-500/5"
                      }
                    `}
                  >
                    <span
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <span
                        className={`
                          h-6
                          w-6
                          rounded-full

                          ${item.className}
                        `}
                      />

                      <span
                        className="
                          text-xs
                          font-black
                          merchant-text
                        "
                      >
                        {
                          item.label
                        }
                      </span>
                    </span>

                    {form.accent ===
                    item.value ? (
                      <Check className="h-4 w-4 text-violet-600" />
                    ) : null}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* DENSITY */}

          <div>
            <h3
              className="
                text-sm
                font-black
                merchant-text
              "
            >
              Interface density
            </h3>

            <div
              className="
                mt-3
                grid
                gap-3

                sm:grid-cols-2
              "
            >
              {(
                [
                  "comfortable",
                  "compact",
                ] as const
              ).map(
                (
                  density,
                ) => (
                  <button
                    key={
                      density
                    }
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,

                        density,
                      })
                    }
                    className={`
                      rounded-2xl
                      p-4
                      text-left
                      text-xs
                      font-black
                      capitalize
                      transition

                      ${
                        form.density ===
                        density
                          ? "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300"
                          : "bg-violet-500/5 merchant-text"
                      }
                    `}
                  >
                    {density}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* RADIUS */}

          <div>
            <h3
              className="
                text-sm
                font-black
                merchant-text
              "
            >
              Corner style
            </h3>

            <div
              className="
                mt-3
                grid
                gap-3

                sm:grid-cols-3
              "
            >
              {(
                [
                  "soft",
                  "rounded",
                  "extra-rounded",
                ] as const
              ).map(
                (
                  radius,
                ) => (
                  <button
                    key={
                      radius
                    }
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,

                        radius,
                      })
                    }
                    className={`
                      p-4
                      text-xs
                      font-black
                      capitalize
                      transition

                      ${
                        radius ===
                        "soft"
                          ? "rounded-lg"
                          : radius ===
                              "rounded"
                            ? "rounded-2xl"
                            : "rounded-[28px]"
                      }

                      ${
                        form.radius ===
                        radius
                          ? "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300"
                          : "bg-violet-500/5 merchant-text"
                      }
                    `}
                  >
                    {radius.replace(
                      "-",
                      " ",
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          <SettingsToggle
            title="Reduce motion"
            description="Reduce animations throughout the Merchant Portal."
            checked={
              form.reducedMotion
            }
            onChange={(
              checked,
            ) =>
              setForm({
                ...form,

                reducedMotion:
                  checked,
              })
            }
          />

          <SettingsToggle
            title="Compact sidebar"
            description="Use a smaller Merchant Dashboard sidebar."
            checked={
              form.compactSidebar
            }
            onChange={(
              checked,
            ) =>
              setForm({
                ...form,

                compactSidebar:
                  checked,
              })
            }
          />
        </div>

        {/* LIVE PREVIEW */}

        <div
          className="
            h-fit
            rounded-[26px]
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
            Live preview
          </p>

          <div
            className="
              mt-5
              rounded-2xl
              bg-white
              p-4
              text-slate-900
            "
          >
            <p
              className="
                text-xs
                font-black
                text-slate-500
              "
            >
              Merchant Dashboard
            </p>

            <p
              className="
                mt-1
                text-lg
                font-black
              "
            >
              Overview
            </p>

            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-2
              "
            >
              <div
                className="
                  rounded-xl
                  bg-slate-100
                  p-3
                "
              >
                <p className="text-[9px] text-slate-500">
                  Revenue
                </p>

                <p className="mt-1 text-sm font-black">
                  BDT 12,450
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  bg-slate-100
                  p-3
                "
              >
                <p className="text-[9px] text-slate-500">
                  Payments
                </p>

                <p className="mt-1 text-sm font-black">
                  48
                </p>
              </div>
            </div>

            <div
              className="
                mt-3
                h-10
                rounded-xl
              "
              style={{
                backgroundColor:
                  form.accent ===
                  "purple"
                    ? "#6D28D9"
                    : form.accent ===
                        "blue"
                      ? "#2563EB"
                      : form.accent ===
                          "emerald"
                        ? "#059669"
                        : form.accent ===
                            "rose"
                          ? "#E11D48"
                          : "#D97706",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="
          mt-6
          flex
          flex-col-reverse
          gap-3
          border-t
          border-violet-500/10
          pt-5

          sm:flex-row
          sm:justify-end
        "
      >
        <button
          type="button"
          disabled={
            resetting ||
            saving
          }
          onClick={() =>
            void reset()
          }
          className="
            inline-flex
            h-11
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-violet-500/10
            px-5
            text-sm
            font-black
            text-violet-700

            dark:text-violet-300
          "
        >
          <RotateCcw className="h-4 w-4" />

          {resetting
            ? "Resetting..."
            : "Reset theme"}
        </button>

        <div>
          <SettingsSaveBar
            saving={
              saving
            }
            onSave={() =>
              void save()
            }
            label="Save appearance"
          />
        </div>
      </div>
    </SettingsSection>
  );
}