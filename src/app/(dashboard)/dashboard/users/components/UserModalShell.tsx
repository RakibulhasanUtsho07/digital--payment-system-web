"use client";

import React, { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";

interface UserModalShellProps {
  open: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

interface ModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

export default function UserModalShell({
  open,
  onClose,
  icon: Icon,
  title,
  description,
  children,
  footer,
}: UserModalShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
        >
          {/* Backdrop Click Overlay */}
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0"
            aria-label="Close dialog"
          />

          {/* Dialog Container */}
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="user-modal-title"
                    className="text-lg font-black text-slate-900"
                  >
                    {title}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Modal Content Body */}
            <div className="p-5 sm:p-6">{children}</div>

            {/* Modal Action Footer */}
            {footer && (
              <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
                {footer}
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reusable Modal Action Button
export function ModalButton({
  children,
  onClick,
  type = "button",
  tone = "primary",
  disabled = false,
}: ModalButtonProps) {
  const colorClass =
    tone === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-xl px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${colorClass}`}
    >
      {children}
    </button>
  );
}

// Reusable Input Form Field
export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}