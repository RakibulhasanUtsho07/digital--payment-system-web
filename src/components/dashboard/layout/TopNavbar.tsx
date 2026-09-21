"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  ChevronDown,
  Command,
  CreditCard,
  FileBarChart,
  FileCheck2,
  FileText,
  HandCoins,
  LayoutDashboard,
  Menu,
  Receipt,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  Webhook,
  X,
} from "lucide-react";

import CofferAiCopilot from "@/components/dashboard/ai/CofferAiCopilot";


/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user"
  | "merchant"
  | "support"
  | "analyst"
  | "super_admin";

interface TopNavbarProps {
  onMenuClick: () => void;
  userName: string;
  userEmail?: string;
  userRole: UserRole;
  avatarUrl?: string;
}

interface SearchItem {
  id: string;
  title: string;
  href: string;
  icon: ElementType;
  roles?: UserRole[];
}

/* =========================================================
   BRAND
========================================================= */

const BRAND = {
  midnight: "#0f0c1b",
  indigo: "#130f26",
  violet: "#2e1f4f",
  purple: "#3b2368",
  highlight: "#5b3a8f",
} as const;

const BRAND_GRADIENT = `
  linear-gradient(
    135deg,
    ${BRAND.midnight} 0%,
    ${BRAND.indigo} 38%,
    ${BRAND.violet} 68%,
    ${BRAND.purple} 100%
  )
`;

const BRAND_SOFT = `
  linear-gradient(
    135deg,
    rgba(46, 31, 79, 0.10),
    rgba(59, 35, 104, 0.12)
  )
`;


/* =========================================================
   ROLE COLOR THEMES

   user + admin + super_admin:
   keep the existing Coffer brand direction.

   merchant:
   purple / violet.

   analyst:
   matches the Analyst hero:
   #10243A -> #0B4F52 -> #10273A

   support:
   matches the Support hero:
   emerald-500 -> emerald-600 -> teal-700
========================================================= */

interface RoleTheme {
  gradient: string;
  softGradient: string;
  accent: string;
  accentSecondary: string;
  border: string;
  shadow: string;
  lightText: string;
  lightMuted: string;
  glow: string;
}

const DEFAULT_ROLE_THEME: RoleTheme = {
  gradient: BRAND_GRADIENT,
  softGradient: BRAND_SOFT,
  accent: BRAND.highlight,
  accentSecondary: "#7c3aed",
  border: "rgba(91,58,143,0.20)",
  shadow: "rgba(59,35,104,0.24)",
  lightText: "#ede9fe",
  lightMuted: "rgba(237,233,254,0.68)",
  glow: "rgba(139,92,246,0.30)",
};

const MERCHANT_ROLE_THEME: RoleTheme = {
  gradient:
    "linear-gradient(135deg, #160827 0%, #3b146f 44%, #6d28d9 72%, #7c3aed 100%)",
  softGradient:
    "linear-gradient(135deg, rgba(109,40,217,0.10), rgba(124,58,237,0.14))",
  accent: "#7c3aed",
  accentSecondary: "#a855f7",
  border: "rgba(167,139,250,0.28)",
  shadow: "rgba(91,33,182,0.30)",
  lightText: "#f3e8ff",
  lightMuted: "rgba(243,232,255,0.70)",
  glow: "rgba(168,85,247,0.34)",
};

const ANALYST_ROLE_THEME: RoleTheme = {
  gradient:
    "linear-gradient(135deg, #10243A 0%, #0B4F52 52%, #10273A 100%)",
  softGradient:
    "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(20,184,166,0.12))",
  accent: "#0f9f9a",
  accentSecondary: "#22d3ee",
  border: "rgba(103,232,249,0.24)",
  shadow: "rgba(13,148,136,0.28)",
  lightText: "#cffafe",
  lightMuted: "rgba(207,250,254,0.68)",
  glow: "rgba(34,211,238,0.30)",
};

const SUPPORT_ROLE_THEME: RoleTheme = {
  gradient:
    "linear-gradient(135deg, #10b981 0%, #059669 48%, #0f766e 100%)",
  softGradient:
    "linear-gradient(135deg, rgba(16,185,129,0.09), rgba(13,148,136,0.13))",
  accent: "#059669",
  accentSecondary: "#14b8a6",
  border: "rgba(110,231,183,0.30)",
  shadow: "rgba(16,185,129,0.28)",
  lightText: "#d1fae5",
  lightMuted: "rgba(209,250,229,0.72)",
  glow: "rgba(45,212,191,0.30)",
};

function getRoleTheme(
  role: UserRole
): RoleTheme {
  if (role === "merchant") {
    return MERCHANT_ROLE_THEME;
  }

  if (role === "analyst") {
    return ANALYST_ROLE_THEME;
  }

  if (role === "support") {
    return SUPPORT_ROLE_THEME;
  }

  return DEFAULT_ROLE_THEME;
}



/* =========================================================
   SEARCH ITEMS
========================================================= */

const searchItems: SearchItem[] = [
  /* =======================================================
     COMMON
  ======================================================= */

  {
    id: "dashboard",
    title: "Dashboard Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    id: "settings",
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },

  {
    id: "notifications",
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },

  /* =======================================================
     USER
  ======================================================= */

  {
    id: "wallet",
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: WalletCards,
    roles: ["user"],
  },

  {
    id: "transactions",
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
    roles: ["user"],
  },

  {
    id: "kyc",
    title: "KYC Verification",
    href: "/dashboard/kyc",
    icon: FileCheck2,
    roles: ["user"],
  },

  {
    id: "receipts",
    title: "Receipts",
    href: "/dashboard/receipts",
    icon: ReceiptText,
    roles: ["user"],
  },

  /* =======================================================
     MERCHANT
  ======================================================= */

  {
    id: "merchant-overview",
    title: "Merchant Overview",
    href: "/dashboard/merchant",
    icon: LayoutDashboard,
    roles: ["merchant"],
  },

  {
    id: "merchant-payments",
    title: "Merchant Payments",
    href: "/dashboard/merchant/payments",
    icon: CreditCard,
    roles: ["merchant"],
  },

  {
    id: "merchant-transactions",
    title: "Merchant Transactions",
    href: "/dashboard/merchant/transactions",
    icon: ArrowLeftRight,
    roles: ["merchant"],
  },

  {
    id: "merchant-orders",
    title: "Orders",
    href: "/dashboard/merchant/orders",
    icon: ReceiptText,
    roles: ["merchant"],
  },

  {
    id: "merchant-customers",
    title: "Customers",
    href: "/dashboard/merchant/customers",
    icon: Users,
    roles: ["merchant"],
  },

  {
    id: "merchant-refunds",
    title: "Refunds",
    href: "/dashboard/merchant/refunds",
    icon: RefreshCcw,
    roles: ["merchant"],
  },

  {
    id: "merchant-invoices",
    title: "Invoices",
    href: "/dashboard/merchant/invoices",
    icon: FileText,
    roles: ["merchant"],
  },

  {
    id: "merchant-subscriptions",
    title: "Subscriptions",
    href: "/dashboard/merchant/subscriptions",
    icon: Receipt,
    roles: ["merchant"],
  },

  {
    id: "merchant-payouts",
    title: "Payouts",
    href: "/dashboard/merchant/payouts",
    icon: HandCoins,
    roles: ["merchant"],
  },

  {
    id: "merchant-disputes",
    title: "Disputes",
    href: "/dashboard/merchant/disputes",
    icon: ShieldCheck,
    roles: ["merchant"],
  },

  {
    id: "merchant-settlement",
    title: "Settlement",
    href: "/dashboard/merchant/settlement",
    icon: WalletCards,
    roles: ["merchant"],
  },

  {
    id: "merchant-analytics",
    title: "Merchant Analytics",
    href: "/dashboard/merchant/analytics",
    icon: BarChart3,
    roles: ["merchant"],
  },

  {
    id: "merchant-reports",
    title: "Merchant Reports",
    href: "/dashboard/merchant/reports",
    icon: FileBarChart,
    roles: ["merchant"],
  },

  {
    id: "merchant-api-keys",
    title: "API Keys",
    href: "/dashboard/merchant/api-keys",
    icon: CodeIcon,
    roles: ["merchant"],
  },

  {
    id: "merchant-webhooks",
    title: "Webhooks",
    href: "/dashboard/merchant/webhooks",
    icon: Webhook,
    roles: ["merchant"],
  },

  {
    id: "merchant-developers",
    title: "Developers",
    href: "/dashboard/merchant/developers",
    icon: BookOpen,
    roles: ["merchant"],
  },

  {
    id: "merchant-settings",
    title: "Merchant Settings",
    href: "/dashboard/merchant/settings",
    icon: Settings,
    roles: ["merchant"],
  },

  /* =======================================================
     ADMIN
  ======================================================= */

  {
    id: "all-transactions",
    title: "System Transactions",
    href: "/dashboard/all-transactions",
    icon: ArrowLeftRight,
    roles: ["admin", "super_admin"],
  },

  {
    id: "users",
    title: "User Management",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin", "super_admin"],
  },

  {
    id: "kyc-requests",
    title: "KYC Approvals",
    href: "/dashboard/kyc-requests",
    icon: ShieldCheck,
    roles: ["admin", "super_admin"],
  },

  {
    id: "analytics",
    title: "Analytics & Reports",
    href: "/dashboard/analytics",
    icon: Activity,
    roles: ["admin", "super_admin", "analyst"],
  },

  {
    id: "logs",
    title: "System Logs",
    href: "/dashboard/logs",
    icon: Activity,
    roles: ["admin", "super_admin"],
  },

  /* =======================================================
     SUPPORT OPERATIONS
  ======================================================= */

  {
    id: "support-overview",
    title: "Support Overview",
    href: "/dashboard/support-dashboard",
    icon: LayoutDashboard,
    roles: ["support", "admin", "super_admin"],
  },

  {
    id: "support-tickets",
    title: "Support Tickets",
    href: "/dashboard/support-dashboard/tickets",
    icon: ReceiptText,
    roles: ["support", "admin", "super_admin"],
  },

  {
    id: "support-ai-copilot",
    title: "Support AI Copilot",
    href: "/dashboard/support-dashboard/ai-copilot",
    icon: Bot,
    roles: ["support", "admin", "super_admin"],
  },
];

/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles: Record<string, string> = {
  /* =======================================================
     COMMON
  ======================================================= */

  "/dashboard": "Dashboard Overview",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",

  /* =======================================================
     USER
  ======================================================= */

  "/dashboard/wallet": "Wallet",
  "/dashboard/transactions": "Transactions",
  "/dashboard/kyc": "KYC Verification",
  "/dashboard/receipts": "Receipts",

  /* =======================================================
     ADMIN
  ======================================================= */

  "/dashboard/all-transactions":
    "System Transactions",

  "/dashboard/users":
    "User Management",

  "/dashboard/kyc-requests":
    "KYC Management",

  "/dashboard/analytics":
    "Analytics & Reports",

  "/dashboard/insights":
    "AI Insights",

  "/dashboard/logs":
    "System Logs",

  /* =======================================================
     SUPPORT
  ======================================================= */

  "/dashboard/support-dashboard":
    "Support Overview",

  "/dashboard/support-dashboard/tickets":
    "Support Tickets",

  "/dashboard/support-dashboard/ai-copilot":
    "Support AI Copilot",

  "/dashboard/support-dashboard/conversations":
    "Support Conversations",

  "/dashboard/support-dashboard/escalations":
    "Support Escalations",

  "/dashboard/support-dashboard/providers":
    "Provider Health",

  "/dashboard/support-dashboard/sla":
    "SLA Monitoring",

  /* =======================================================
     MERCHANT
  ======================================================= */

  "/dashboard/merchant":
    "Merchant Overview",

  "/dashboard/merchant/payments":
    "Payments",

  "/dashboard/merchant/transactions":
    "Transactions",

  "/dashboard/merchant/orders":
    "Orders",

  "/dashboard/merchant/customers":
    "Customers",

  "/dashboard/merchant/refunds":
    "Refunds",

  "/dashboard/merchant/invoices":
    "Invoices",

  "/dashboard/merchant/subscriptions":
    "Subscriptions",

  "/dashboard/merchant/payouts":
    "Payouts",

  "/dashboard/merchant/disputes":
    "Disputes",

  "/dashboard/merchant/settlement":
    "Settlement",

  "/dashboard/merchant/analytics":
    "Analytics",

  "/dashboard/merchant/reports":
    "Reports",

  "/dashboard/merchant/api-keys":
    "API Keys",

  "/dashboard/merchant/webhooks":
    "Webhooks",

  "/dashboard/merchant/developers":
    "Developers",

  "/dashboard/merchant/settings":
    "Merchant Settings",
};

/* =========================================================
   AVATAR HELPERS
========================================================= */

const getInitials = (
  name: string
): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

/* =========================================================
   PROFILE AVATAR
========================================================= */

function ProfileAvatar({
  avatarUrl,
  name,
  containerClassName,
  textClassName = "text-[13px]",
  accent = BRAND.highlight,
  borderColor = "rgba(91,58,143,0.20)",
  shadow = "0 6px 18px rgba(59,35,104,0.18)",
}: {
  avatarUrl?: string;
  name: string;
  containerClassName: string;
  textClassName?: string;
  accent?: string;
  borderColor?: string;
  shadow?: string;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const showImage =
    Boolean(avatarUrl) &&
    !imageFailed;

  if (showImage) {
    return (
      <div
        className={`
          relative
          ${containerClassName}

          overflow-hidden

          border
          border-border
          dark:border-white/10

          bg-muted
          dark:bg-slate-800
        `}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() =>
            setImageFailed(true)
          }
          className="
            h-full
            w-full
            object-cover
          "
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`
        ${containerClassName}
        ${textClassName}

        border
        bg-card
        font-black
        tracking-tight
        dark:bg-[#0B0F19]
      `}
      style={{
        color:
          accent,
        borderColor,
        boxShadow:
          shadow,
      }}
    >
      {getInitials(name)}
    </motion.div>
  );
}

/* =========================================================
   ICON HELPER
========================================================= */

function CodeIcon(
  props: React.ComponentProps<
    typeof Activity
  >
) {
  return (
    <Activity
      {...props}
      strokeWidth={1.8}
    />
  );
}

/* =========================================================
   TOP NAVBAR
========================================================= */

export default function TopNavbar({
  onMenuClick,
  userName,
  userEmail = "",
  userRole,
  avatarUrl,
}: TopNavbarProps) {
  const router = useRouter();

  const pathname =
    usePathname();

  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const currentPageTitle =
    pageTitles[pathname] ??
    (
      pathname?.startsWith(
        "/dashboard/merchant/"
      )
        ? "Merchant Dashboard"
        : "Dashboard"
    );

  /* =======================================================
     ROLE LABEL
  ======================================================= */

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : userRole === "super_admin"
        ? "Super Administrator"
        : userRole === "merchant"
          ? "Merchant Account"
          : userRole === "analyst"
            ? "Analyst"
            : userRole === "support"
              ? "Support"
              : "Wallet User";

  /* =======================================================
     TOP CATEGORY LABEL
  ======================================================= */

  const workspaceLabel =
    userRole === "admin" ||
    userRole === "super_admin"
      ? "Control Center"
      : userRole === "merchant"
        ? "Merchant Portal"
        : userRole === "analyst"
          ? "Analytics"
          : userRole === "support"
            ? "Support Center"
            : "My Wallet";

  const roleTheme =
    getRoleTheme(
      userRole
    );

  // Main surfaces always follow the app light/dark theme.
  // Role colors are accents only: text, icons, borders, badges,
  // compact controls, and subtle glow details.

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredItems =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const allowedItems =
        searchItems.filter(
          (item) =>
            !item.roles ||
            item.roles.includes(
              userRole
            )
        );

      if (!query) {
        return allowedItems.slice(
          0,
          8
        );
      }

      return allowedItems.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(query)
      );
    }, [
      searchQuery,
      userRole,
    ]);

  const openSearch = () => {
    setSearchOpen(true);
    setProfileOpen(false);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const navigateTo = (
    href: string
  ) => {
    closeSearch();
    router.push(href);
  };

  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "k"
        ) {
          event.preventDefault();

          setSearchOpen(
            (current) =>
              !current
          );

          setProfileOpen(false);
        }

        if (
          event.key ===
          "Escape"
        ) {
          setSearchOpen(false);
          setSearchQuery("");
          setProfileOpen(false);
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     AUTO FOCUS
  ======================================================= */

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        100
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [searchOpen]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <motion.header
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className={`
          sticky
          top-0
          z-30

          flex
          h-[74px]
          shrink-0
          items-center

          border-b

          px-4

          backdrop-blur-xl

          transition-all
          duration-300

          sm:px-5
          lg:px-7

          border-border
          bg-card/95
          text-card-foreground

          dark:border-white/10
          dark:bg-[#070B14]/95
          dark:text-slate-100
        `}
      >
        <div
          className="
            flex
            w-full
            min-w-0
            items-center
            gap-4
            xl:gap-6
          "
        >
          {/* =================================================
              LEFT
          ================================================= */}

          <div
            className="
              flex
              min-w-0
              shrink-0
              items-center
              gap-3
              lg:w-[190px]
              xl:w-[210px]
            "
          >
            <motion.button
              type="button"
              aria-label="Open menu"
              onClick={onMenuClick}
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.92,
              }}
              className="
                flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                border border-border bg-card shadow-sm transition-all hover:bg-muted
                dark:border-white/10 dark:bg-[#0B0F19] dark:hover:bg-white/10
                lg:hidden
              "
              style={{
                color: roleTheme.accent,
              }}
            >
              <Menu className="h-[18px] w-[18px]" />
            </motion.button>

            <div className="min-w-0">
              <div
                className="
                  hidden
                  items-center
                  gap-2
                  sm:flex
                "
              >
                <span
                  className="whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400"
                >
                  Digital Wallet
                </span>

                <span
                  className="h-1 w-1 shrink-0 rounded-full"
                  style={{
                    background:
                      roleTheme.accent,
                    boxShadow:
                      `0 0 10px ${roleTheme.glow}`,
                  }}
                />

                <span
                  className="whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[0.17em]"
                  style={{
                    color: roleTheme.accent,
                  }}
                >
                  {workspaceLabel}
                </span>
              </div>

              <h1
                className="mt-[3px] truncate text-[15px] font-extrabold tracking-[-0.025em] sm:text-[16px]"
                style={{
                  color: roleTheme.accent,
                }}
              >
                {currentPageTitle}
              </h1>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="
              hidden
              min-w-0
              flex-1
              justify-center
              md:flex
            "
          >
            <motion.button
              type="button"
              onClick={openSearch}
              whileHover={{
                y: -1,
              }}
              whileTap={{
                scale: 0.995,
              }}
              className="group flex h-[44px] w-full max-w-[540px] items-center gap-3 rounded-[16px] border border-border bg-muted/40 px-3 text-left shadow-sm transition-all duration-200 hover:bg-card dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border border-border bg-card shadow-sm dark:border-white/10 dark:bg-[#0B0F19]"
                style={{
                  color: roleTheme.accent,
                }}
              >
                <Search className="h-[16px] w-[16px]" />
              </span>

              <span
                className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-500 dark:text-slate-400"
              >
                {userRole === "merchant"
                  ? "Search payments, transactions, customers, analytics..."
                  : "Search transactions, users, wallet, settings..."}
              </span>

              <span
                className="flex shrink-0 items-center gap-1 rounded-[8px] border border-border bg-card px-2 py-1 text-[9px] font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#0B0F19] dark:text-slate-400"
              >
                <Command className="h-3 w-3" />
                K
              </span>
            </motion.button>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div
            className="
              ml-auto
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            {/* MOBILE SEARCH */}

            <motion.button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.92,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all hover:bg-muted dark:border-white/10 dark:bg-[#0B0F19] dark:hover:bg-white/10 md:hidden"
              style={{
                color: roleTheme.accent,
              }}
            >
              <Search className="h-[17px] w-[17px]" />
            </motion.button>

            {/* AI INSIGHTS */}

            <motion.button
              type="button"
              onClick={() =>
                router.push(
                  userRole ===
                    "merchant"
                    ? "/dashboard/merchant/analytics"
                    : "/dashboard/insights"
                )
              }
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="relative hidden h-10 items-center justify-center overflow-hidden rounded-[13px] border bg-card px-4 text-[10px] font-extrabold shadow-sm transition-all duration-200 hover:bg-muted dark:bg-[#0B0F19] sm:flex"
              style={{
                borderColor: roleTheme.border,
                color: roleTheme.accent,
              }}
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  bg-gradient-to-br
                  from-white/10
                  to-transparent
                  dark:from-white/[0.04]
                "
              />

              <span className="relative z-10">
                {userRole ===
                "merchant"
                  ? "Analytics"
                  : "AI Insights"}
              </span>
            </motion.button>

            {/* NOTIFICATION */}

            <motion.button
              type="button"
              aria-label="Notifications"
              onClick={() =>
                router.push(
                  "/dashboard/notifications"
                )
              }
              whileHover={{
                y: -1,
              }}
              whileTap={{
                scale: 0.92,
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-border bg-card shadow-sm transition-all duration-200 hover:bg-muted dark:border-white/10 dark:bg-[#0B0F19] dark:hover:bg-white/10"
              style={{
                color: roleTheme.accent,
              }}
            >
              <Bell className="h-[16px] w-[16px]" />

              <span
                className="
                  absolute
                  right-[8px]
                  top-[7px]

                  h-[6px]
                  w-[6px]

                  rounded-full
                  bg-rose-500
                "
                style={{
                  boxShadow:
                    "0 0 0 2px var(--card)",
                }}
              />
            </motion.button>

            {/* PROFILE */}

            <div className="relative">
              <motion.button
                type="button"
                onClick={() => {
                  setProfileOpen(
                    (current) =>
                      !current
                  );

                  setSearchOpen(false);
                }}
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="flex h-[44px] items-center gap-2 rounded-[15px] border border-border bg-card p-[5px] pr-2.5 shadow-sm transition-all duration-200 hover:bg-muted dark:border-white/10 dark:bg-[#0B0F19] dark:hover:bg-white/10"
              >
                <ProfileAvatar
                  avatarUrl={
                    avatarUrl
                  }
                  name={
                    userName
                  }
                  accent={
                    roleTheme.accent
                  }
                  borderColor={
                    roleTheme.border
                  }
                  shadow={
                    `0 7px 20px ${roleTheme.shadow}`
                  }
                  containerClassName="
                    flex
                    h-[34px]
                    w-[34px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[11px]
                  "
                />

                <div
                  className="
                    hidden
                    max-w-[120px]
                    text-left
                    lg:block
                  "
                >
                  <p
                    className="truncate text-[10px] font-extrabold"
                    style={{
                      color: roleTheme.accent,
                    }}
                  >
                    {userName}
                  </p>

                  <p
                    className="mt-[1px] text-[7.5px] font-extrabold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500"
                  >
                    {roleLabel}
                  </p>
                </div>

                <ChevronDown
                  className={`
                    hidden h-[14px] w-[14px] text-slate-400 transition-transform duration-200
                    dark:text-slate-500 lg:block
                    ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />
              </motion.button>

              {/* PROFILE DROPDOWN */}

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close profile menu"
                      onClick={() =>
                        setProfileOpen(
                          false
                        )
                      }
                      className="
                        fixed
                        inset-0
                        z-40
                        cursor-default
                      "
                    />

                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale: 0.97,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 6,
                        scale: 0.98,
                      }}
                      transition={{
                        duration:
                          0.16,
                      }}
                      className="
                        absolute
                        right-0
                        top-[52px]
                        z-50
                        w-[240px]
                        overflow-hidden

                        rounded-[18px]

                        border
                        border-border
                        dark:border-white/10

                        bg-card
                        dark:bg-[#0B0F19]

                        p-2

                        shadow-2xl
                      "
                    >
                      <div
                        className="rounded-[14px] border p-3"
                        style={{
                          background:
                            "var(--muted)",
                          borderColor:
                            roleTheme.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            avatarUrl={
                              avatarUrl
                            }
                            name={
                              userName
                            }
                            accent={
                              roleTheme.accent
                            }
                            borderColor={
                              roleTheme.border
                            }
                            shadow={
                              `0 7px 20px ${roleTheme.shadow}`
                            }
                            containerClassName="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-[11px]
                            "
                            textClassName="text-[12px]"
                          />

                          <div className="min-w-0">
                            <p
                              className="truncate text-[11px] font-extrabold"
                              style={{
                                color: roleTheme.accent,
                              }}
                            >
                              {userName}
                            </p>

                            {userEmail && (
                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-[9px]

                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {userEmail}
                              </p>
                            )}

                            <p
                              className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.1em]"
                              style={{
                                color:
                                  roleTheme.accent,
                              }}
                            >
                              {roleLabel}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(
                            false
                          );

                          router.push(
                            userRole ===
                              "merchant"
                              ? "/dashboard/merchant/settings"
                              : "/dashboard/settings"
                          );
                        }}
                        className="
                          mt-1

                          flex
                          w-full
                          items-center
                          gap-2

                          rounded-[12px]

                          px-3
                          py-2.5

                          text-left

                          text-[11px]
                          font-bold

                          text-slate-600
                          dark:text-slate-300

                          transition

                          hover:bg-muted
                          dark:hover:bg-white/[0.06]

                          hover:opacity-90
                        "
                      >
                        <Settings
                          className="h-[15px] w-[15px]"
                          style={{
                            color:
                              roleTheme.accent,
                          }}
                        />

                        {userRole ===
                        "merchant"
                          ? "Merchant Settings"
                          : "Account Settings"}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* =====================================================
          SEARCH MODAL
      ====================================================== */}

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onMouseDown={
              closeSearch
            }
            className="
              fixed
              inset-0
              z-[200]

              flex
              items-start
              justify-center

              bg-black/40
              dark:bg-black/65

              px-3
              pt-[12vh]

              backdrop-blur-[5px]

              sm:px-5
              sm:pt-[14vh]
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 22,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 14,
                scale: 0.98,
              }}
              transition={{
                duration: 0.2,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="
                relative
                w-full
                max-w-[600px]

                overflow-hidden

                rounded-[22px]

                border
                border-border
                dark:border-white/10

                bg-card
                dark:bg-[#0B0F19]

                shadow-2xl
              "
              style={{
                boxShadow:
                  "0 30px 90px rgba(15,12,27,0.30)",
              }}
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-x-10
                  top-0
                  h-px
                "
                style={{
                  background:
                    roleTheme.gradient,
                }}
              />

              <div
                className="
                  flex
                  items-center
                  gap-3

                  border-b
                  border-border
                  dark:border-white/10

                  px-4
                  py-3.5

                  sm:px-5
                "
              >
                <Search
                  className="
                    h-[18px]
                    w-[18px]
                    shrink-0

                    
                  "
                />

                <input
                  ref={
                    inputRef
                  }
                  value={
                    searchQuery
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    userRole ===
                    "merchant"
                      ? "Search payments, transactions, customers..."
                      : "Search dashboard..."
                  }
                  className="
                    h-10
                    min-w-0
                    flex-1

                    bg-transparent

                    text-[14px]
                    font-semibold

                    text-slate-900
                    dark:text-slate-100

                    outline-none

                    placeholder:font-medium
                    placeholder:text-slate-400
                    dark:placeholder:text-slate-500
                  "
                />

                {searchQuery && (
                  <motion.button
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                    whileTap={{
                      scale: 0.9,
                    }}
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg

                      transition

                      hover:bg-muted
                      dark:hover:bg-white/[0.06]
                    "
                  >
                    <X
                      className="h-[15px] w-[15px]"
                      style={{
                        color:
                          roleTheme.accent,
                      }}
                    />
                  </motion.button>
                )}
              </div>

              <div
                className="
                  max-h-[420px]
                  overflow-y-auto
                  p-2.5

                  [scrollbar-width:thin]
                "
              >
                {filteredItems.length >
                0 ? (
                  <div className="space-y-1">
                    {filteredItems.map(
                      (
                        item,
                        index
                      ) => {
                        const Icon =
                          item.icon;

                        const active =
                          pathname ===
                          item.href ||
                          pathname.startsWith(
                            `${item.href}/`
                          );

                        return (
                          <motion.button
                            key={
                              item.id
                            }
                            type="button"
                            initial={{
                              opacity: 0,
                              y: 5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              duration:
                                0.18,
                              delay:
                                index *
                                0.015,
                            }}
                            whileHover={{
                              x: 2,
                            }}
                            onClick={() =>
                              navigateTo(
                                item.href
                              )
                            }
                            className="
                              group
                              flex
                              w-full
                              items-center
                              gap-3

                              rounded-[13px]

                              px-3
                              py-2.5

                              text-left

                              transition-all
                              duration-150

                              hover:bg-muted
                              dark:hover:bg-white/[0.06]
                            "
                            style={{
                              background:
                                active
                                  ? "var(--muted)"
                                  : undefined,
                              boxShadow:
                                active
                                  ? `inset 3px 0 0 ${roleTheme.accent}`
                                  : undefined,
                            }}
                          >
                            <motion.span
                              whileHover={{
                                scale: 1.05,
                              }}
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center

                                rounded-[10px]
                              "
                              style={{
                                background:
                                  active
                                    ? "var(--card)"
                                    : "var(--muted)",

                                color:
                                  active
                                    ? roleTheme.accent
                                    : undefined,

                                border:
                                  active
                                    ? `1px solid ${roleTheme.border}`
                                    : "1px solid transparent",

                                boxShadow:
                                  active
                                    ? `0 7px 18px ${roleTheme.shadow}`
                                    : undefined,
                              }}
                            >
                              <Icon
                                className={`
                                  h-[16px]
                                  w-[16px]

                                  ${
                                    active
                                      ? ""
                                      : "text-slate-500 dark:text-slate-300"
                                  }
                                `}
                              />
                            </motion.span>

                            <span
                              className={`truncate text-[12px] font-bold ${
                                active
                                  ? ""
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                              style={
                                active
                                  ? {
                                      color:
                                        roleTheme.accent,
                                    }
                                  : undefined
                              }
                            >
                              {
                                item.title
                              }
                            </span>

                            {active && (
                              <motion.span
                                initial={{
                                  opacity: 0,
                                  scale:
                                    0.8,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                }}
                                className="ml-auto rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider"
                                style={{
                                  background:
                                    "var(--muted)",
                                  color:
                                    roleTheme.accent,
                                  border:
                                    `1px solid ${roleTheme.border}`,
                                }}
                              >
                                Current
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="
                      flex
                      min-h-[170px]
                      flex-col
                      items-center
                      justify-center
                      px-5
                      text-center
                    "
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background:
                          "var(--muted)",
                        color:
                          roleTheme.accent,
                        border:
                          `1px solid ${roleTheme.border}`,
                      }}
                    >
                      <Search
                        className="
                          h-[18px]
                          w-[18px]
                        "
                      />
                    </div>

                    <p
                      className="
                        mt-3

                        text-[13px]
                        font-extrabold

                        text-slate-900
                        dark:text-slate-100
                      "
                    >
                      No results found
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]

                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Try another keyword.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(userRole === "user" ||
        userRole === "merchant") && (
        <CofferAiCopilot
          userName={userName}
          portal={
            userRole === "merchant"
              ? "merchant"
              : "personal"
          }
          role={userRole}
        />
      )}

      {(userRole === "support" ||
        userRole === "admin" ||
        userRole === "super_admin") && (
        <motion.button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/support-dashboard/ai-copilot"
            )
          }
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="fixed bottom-4 right-4 z-[120] flex h-[58px] items-center gap-3 rounded-[20px] border bg-card px-3.5 outline-none transition hover:bg-muted focus-visible:ring-4 dark:bg-[#0B0F19] sm:bottom-6 sm:right-6"
          style={{
            borderColor:
              roleTheme.border,
            color:
              roleTheme.accent,
            boxShadow:
              `0 18px 48px ${roleTheme.shadow}`,
          }}
          aria-label="Open Support AI Copilot"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[13px] border bg-muted/70"
            style={{
              borderColor: roleTheme.border,
              color: roleTheme.accent,
            }}
          >
            <Bot className="h-[19px] w-[19px]" />
          </span>

          <span className="hidden pr-1 text-left sm:block">
            <span
              className="block text-[11px] font-black"
              style={{
                color: roleTheme.accent,
              }}
            >
              Support AI
            </span>

            <span
              className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{
                color:
                  roleTheme.accentSecondary,
              }}
            >
              Human-approved copilot
            </span>
          </span>
        </motion.button>
      )}
    </>
  );
}
