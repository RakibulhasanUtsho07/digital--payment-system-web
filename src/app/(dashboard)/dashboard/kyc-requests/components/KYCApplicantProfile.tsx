"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import type { KYCRequest } from "./KYCManagementTypes";

export default function KYCApplicantProfile({
  request,
}: {
  request: KYCRequest;
}) {
  const items = [
    {
      label: "Applicant",
      value: request.applicantName || "Not available",
      icon: UserRound,
    },
    {
      label: "Email",
      value: request.email || "Not available",
      icon: Mail,
    },
    {
      label: "Phone",
      value: request.phone || "Not available",
      icon: Phone,
    },
    {
      label: "Wallet ID",
      value: request.walletId || "Not available",
      icon: WalletCards,
    },
    {
      label: "Location",
      value:
        [request.city, request.country].filter(Boolean).join(", ") ||
        "Not available",
      icon: MapPin,
    },
    {
      label: "Account Age",
      value:
        request.accountAgeDays > 0
          ? `${request.accountAgeDays.toLocaleString()} days`
          : "Not available",
      icon: CalendarDays,
    },
  ];

  return (
    <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,39,69,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
            Applicant Profile
          </p>

          <h3 className="mt-1 text-base font-black text-[#0F2745]">
            Identity & account context
          </h3>
        </div>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="flex items-start gap-3 rounded-[16px] border border-slate-100 bg-[#FAFCFE] p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
                <Icon className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 break-words text-[9px] font-bold text-slate-700">
                  {item.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Mini
          label="Transactions"
          value={request.transactionCount.toLocaleString()}
        />

        <Mini
          label="2FA"
          value={request.twoFactorEnabled ? "Enabled" : "Not enabled"}
        />

        <Mini
          label="Failed Logins"
          value={request.failedLoginCount.toLocaleString()}
        />
      </div>
    </section>
  );
}

function Mini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-blue-100 bg-blue-50/55 p-3">
      <p className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-400">
        {label}
      </p>

      <p className="mt-1 text-[9px] font-black text-[#174A7A]">
        {value}
      </p>
    </div>
  );
}
