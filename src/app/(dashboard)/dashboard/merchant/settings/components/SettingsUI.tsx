"use client";

import type {
  ReactNode,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";

/* =========================================================
   SECTION
========================================================= */

export function SettingsSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      className="
        rounded-[28px]
        merchant-surface
        p-5

        sm:p-7
      "
    >
      <div
        className="
          border-b
          border-violet-500/10
          pb-5
        "
      >
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.15em]
            text-violet-600
          "
        >
          {eyebrow}
        </p>

        <h2
          className="
            mt-2
            text-xl
            font-black
            tracking-tight
            merchant-text

            sm:text-2xl
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-2
            max-w-3xl
            text-xs
            leading-6
            merchant-muted
          "
        >
          {description}
        </p>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FIELD
========================================================= */

export function SettingsField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="
          text-xs
          font-black
          merchant-text
        "
      >
        {label}
      </span>

      {helper ? (
        <span
          className="
            mt-1
            block
            text-[10px]
            leading-5
            merchant-muted
          "
        >
          {helper}
        </span>
      ) : null}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}

export const settingsInputClass =
  [
    "h-11",
    "w-full",
    "rounded-xl",
    "border",
    "border-violet-200/70",
    "bg-transparent",
    "px-3",
    "text-sm",
    "merchant-text",
    "outline-none",
    "transition",
    "placeholder:text-slate-400",
    "focus:border-violet-500",
    "focus:ring-2",
    "focus:ring-violet-500/10",
    "dark:border-white/10",
  ].join(" ");

/* =========================================================
   TOGGLE
========================================================= */

export function SettingsToggle({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked:
      boolean,
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        rounded-2xl
        bg-violet-500/5
        p-4
      "
    >
      <div>
        <p
          className="
            text-sm
            font-black
            merchant-text
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            merchant-muted
          "
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        disabled={
          disabled
        }
        onClick={() =>
          onChange(
            !checked,
          )
        }
        className={`
          relative
          h-7
          w-12
          shrink-0
          rounded-full
          transition

          ${
            checked
              ? "bg-violet-600"
              : "bg-slate-300 dark:bg-white/10"
          }

          disabled:opacity-50
        `}
      >
        <span
          className={`
            absolute
            top-1
            h-5
            w-5
            rounded-full
            bg-white
            shadow-sm
            transition-all

            ${
              checked
                ? "left-6"
                : "left-1"
            }
          `}
        />
      </button>
    </div>
  );
}

/* =========================================================
   SAVE BAR
========================================================= */

export function SettingsSaveBar({
  saving,
  disabled,
  onSave,
  label = "Save changes",
}: {
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div
      className="
        mt-6
        flex
        justify-end
        border-t
        border-violet-500/10
        pt-5
      "
    >
      <button
        type="button"
        disabled={
          saving ||
          disabled
        }
        onClick={
          onSave
        }
        className="
          inline-flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-violet-600
          px-5
          text-sm
          font-black
          text-white
          transition

          hover:bg-violet-700

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}

        {saving
          ? "Saving..."
          : label}
      </button>
    </div>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

export function SettingsMessage({
  type,
  message,
}: {
  type:
    | "success"
    | "error";

  message: string;
}) {
  return (
    <div
      className={`
        mb-5
        flex
        items-start
        gap-3
        rounded-2xl
        p-4
        text-xs
        leading-5

        ${
          type ===
          "success"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
        }
      `}
    >
      {type ===
      "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      {message}
    </div>
  );
}