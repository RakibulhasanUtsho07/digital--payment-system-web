"use client";

import { useState } from "react";
import {
  AlertTriangle,
  LogOut,
  Trash2,
} from "lucide-react";

import ConfirmationModal from "./ConfirmationModal";

export default function DangerZone() {
  const [
    action,
    setAction,
  ] = useState<
    "logout" | "delete" | null
  >(null);

  return (
    <section className="space-y-7">
      <Header
        title="Danger Zone"
        description="Sensitive actions that can affect account access or data."
      />

      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-5">
        <Action
          icon={LogOut}
          title="Log out all devices"
          description="End active sessions across other devices."
          button="Log Out Everywhere"
          onClick={() =>
            setAction(
              "logout"
            )
          }
        />

        <div className="my-5 border-t border-red-200/70" />

        <Action
          icon={Trash2}
          title="Delete Account"
          description="Permanently remove your account. This demo only opens the confirmation flow."
          button="Delete Account"
          danger
          onClick={() =>
            setAction(
              "delete"
            )
          }
        />
      </div>

      <div className="rounded-2xl border border-red-100 bg-white p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

          <p className="text-xs leading-5 text-red-700">
            Destructive account operations must be protected by backend
            authorization, re-authentication, and explicit confirmation.
          </p>
        </div>
      </div>

      <ConfirmationModal
        open={
          action !== null
        }
        title={
          action ===
          "delete"
            ? "Delete account?"
            : "Log out everywhere?"
        }
        description={
          action ===
          "delete"
            ? "This is a demo confirmation only. A production account deletion must be handled by a secure backend workflow."
            : "This demo will only show the confirmation flow. Connect it to your real session API before production."
        }
        confirmLabel={
          action ===
          "delete"
            ? "Delete Account"
            : "Log Out"
        }
        danger={
          true
        }
        onCancel={() =>
          setAction(
            null
          )
        }
        onConfirm={() => {
          setAction(
            null
          );

          window.alert(
            action ===
              "delete"
              ? "Demo delete flow confirmed."
              : "Demo logout-all flow confirmed."
          );
        }}
      />
    </section>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <h2 className="text-2xl font-black text-[#0F2745]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Action({
  icon: Icon,
  title,
  description,
  button,
  danger = false,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  button: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-sm font-extrabold text-red-900">
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-red-700">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onClick
        }
        className={`rounded-xl px-4 py-2.5 text-xs font-bold ${
          danger
            ? "bg-red-600 text-white hover:bg-red-700"
            : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
        }`}
      >
        {button}
      </button>
    </div>
  );
}