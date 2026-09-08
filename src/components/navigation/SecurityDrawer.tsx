"use client";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface SecurityCardConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  dashboardHref: string;
}

interface SecurityDrawerProps {
  isAuthenticated: boolean;
  onNavigate: () => void;
}

/* =========================================================
   CARD DATA

   All three cards share one solid indigo/violet theme, per
   spec — Security reads as a single trusted, consistent
   block rather than a mixed palette like Features.
========================================================= */

const SECURITY_CARDS: SecurityCardConfig[] = [
  {
    label: "KYC Verification",
    description: "Verify your identity to unlock protected wallet actions.",
    icon: ShieldCheck,
    dashboardHref: "/dashboard/kyc",
  },
  {
    label: "Two-Factor Setup",
    description: "Add an extra layer of protection to your sign-in.",
    icon: Smartphone,
    dashboardHref: "/dashboard/settings",
  },
  {
    label: "Security Center",
    description: "Review sessions, alerts and account security activity.",
    icon: Fingerprint,
    dashboardHref: "/dashboard/settings",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function SecurityDrawer({
  isAuthenticated,
  onNavigate,
}: SecurityDrawerProps) {
  const router = useRouter();

  const handleCardClick = (dashboardHref: string) => {
    onNavigate();

    router.push(isAuthenticated ? dashboardHref : "/login");
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SECURITY_CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => handleCardClick(card.dashboardHref)}
            className="
              group
              flex
              flex-col
              items-start
              gap-3
              rounded-2xl
              border
              border-indigo-400/25
              bg-gradient-to-br
              from-indigo-600
              via-indigo-600
              to-violet-700
              p-4
              text-left
              text-white
              shadow-[0_10px_25px_rgba(79,70,229,0.25)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-[0_16px_35px_rgba(79,70,229,0.35)]
            "
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Icon className="h-4.5 w-4.5" />
            </span>

            <div>
              <p className="text-sm font-extrabold">
                {card.label}
              </p>

              <p className="mt-1 text-[11px] leading-4 text-indigo-100/80">
                {card.description}
              </p>
            </div>

            <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-indigo-100/70 transition group-hover:text-white">
              {isAuthenticated ? "Open" : "Sign in to use"}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}