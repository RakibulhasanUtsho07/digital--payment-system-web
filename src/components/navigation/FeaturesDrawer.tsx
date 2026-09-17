"use client";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BarChart3,
  Landmark,
  Send,
  Wallet2,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface FeatureCardConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Route to send an authenticated user to. */
  dashboardHref: string;
  /** Tailwind classes for this card's color theme. */
  theme: {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
  };
}

interface FeaturesDrawerProps {
  isAuthenticated: boolean;
  onNavigate: () => void;
}

/* =========================================================
   CARD DATA

   Four distinct color themes, cycled across the cards, so
   the drawer reads as vibrant/varied rather than one flat
   color block.
========================================================= */

const FEATURE_CARDS: FeatureCardConfig[] = [
  {
    label: "Send Money",
    description: "Transfer funds instantly to any Coffer wallet.",
    icon: Send,
    dashboardHref: "/dashboard/send",
    theme: {
      bg: "bg-violet-50",
      border: "border-violet-100 hover:border-violet-300",
      iconBg: "bg-violet-600",
      iconText: "text-white",
    },
  },
  {
    label: "Online Payment",
    description: "Request or receive payments with a shareable link.",
    icon: Wallet2,
    dashboardHref: "/dashboard/receive",
    theme: {
      bg: "bg-cyan-50",
      border: "border-cyan-100 hover:border-cyan-300",
      iconBg: "bg-cyan-600",
      iconText: "text-white",
    },
  },
  {
    label: "Add with Bank or MFS",
    description: "Top up your balance from bank or mobile financial services.",
    icon: Landmark,
    dashboardHref: "/dashboard/wallet",
    theme: {
      bg: "bg-amber-50",
      border: "border-amber-100 hover:border-amber-300",
      iconBg: "bg-amber-500",
      iconText: "text-white",
    },
  },
  {
    label: "Insights",
    description: "See where your money goes with smart wallet analytics.",
    icon: BarChart3,
    dashboardHref: "/dashboard/insights",
    theme: {
      bg: "bg-rose-50",
      border: "border-rose-100 hover:border-rose-300",
      iconBg: "bg-rose-500",
      iconText: "text-white",
    },
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function FeaturesDrawer({
  isAuthenticated,
  onNavigate,
}: FeaturesDrawerProps) {
  const router = useRouter();

  const handleCardClick = (dashboardHref: string) => {
    onNavigate();

    router.push(isAuthenticated ? dashboardHref : "/login");
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FEATURE_CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => handleCardClick(card.dashboardHref)}
            className={`
              group
              flex
              flex-col
              items-start
              gap-3
              rounded-2xl
              border
              p-4
              text-left
              transition-all
              duration-200
              hover:-translate-y-0.5
              ${card.theme.bg}
              ${card.theme.border}
            `}
          >
            <span
              className={`
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                ${card.theme.iconBg}
                ${card.theme.iconText}
              `}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>

            <div>
              <p className="text-sm font-extrabold text-slate-900">
                {card.label}
              </p>

              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {card.description}
              </p>
            </div>

            <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 transition group-hover:text-slate-700">
              {isAuthenticated ? "Open" : "Sign in to use"}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}