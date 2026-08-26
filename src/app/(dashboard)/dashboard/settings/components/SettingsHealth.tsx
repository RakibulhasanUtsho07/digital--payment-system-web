"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import type { Role } from "./SettingsTypes";

export default function SettingsHealth({
  role,
}: {
  role: Role;
}) {
  const admin = role === "admin";

  const score = admin
    ? 94
    : 82;

  const items = admin
    ? [
        {
          label: "Risk Policies",
          value: 100,
        },
        {
          label: "Auth Policies",
          value: 85,
        },
        {
          label: "Audit Coverage",
          value: 96,
        },
      ]
    : [
        {
          label: "Security",
          value: 90,
        },
        {
          label: "Notifications",
          value: 84,
        },
        {
          label: "Preferences",
          value: 72,
        },
      ];

  return (
    <div className="min-w-0 overflow-hidden rounded-[26px] border border-slate-200 bg-[#0F2745] p-5 text-white shadow-[0_15px_45px_rgba(15,39,69,0.12)]">
      <div className="pointer-events-none absolute" />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <ShieldCheck className="h-5 w-5 text-cyan-200" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/55">
            {admin
              ? "Platform"
              : "Account"}
          </p>

          <h3 className="mt-0.5 truncate text-sm font-extrabold">
            Settings Health
          </h3>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg
            viewBox="0 0 80 80"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="7"
            />

            <motion.circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke={
                score >= 85
                  ? "#10B981"
                  : "#F59E0B"
              }
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={
                2 *
                Math.PI *
                32
              }
              initial={{
                strokeDashoffset:
                  2 *
                  Math.PI *
                  32,
              }}
              animate={{
                strokeDashoffset:
                  2 *
                  Math.PI *
                  32 *
                  (1 -
                    score /
                      100),
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
            />
          </svg>

          <span className="absolute inset-0 flex items-center justify-center text-lg font-black">
            {score}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold">
            {score >= 85
              ? "Healthy configuration"
              : "Needs attention"}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-blue-100/55">
            {admin
              ? "Platform security and risk controls are configured."
              : "Your account settings are in good shape."}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map(
          (item) => (
            <div
              key={
                item.label
              }
            >
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-blue-100/60">
                  {item.label}
                </span>

                <span className="font-bold text-white">
                  {item.value}%
                </span>
              </div>

              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${item.value}%`,
                  }}
                  transition={{
                    duration: 0.8,
                  }}
                  className={`h-full rounded-full ${
                    item.value >=
                    90
                      ? "bg-emerald-400"
                      : item.value >=
                        75
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}
                />
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          {score >= 85 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-300" />
          )}

          <p className="text-[10px] font-semibold text-blue-100/75">
            {score >= 85
              ? "No critical configuration issues detected."
              : "Review the recommended settings below."}
          </p>
        </div>
      </div>
    </div>
  );
}