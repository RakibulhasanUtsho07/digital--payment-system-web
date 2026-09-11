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
  Store,
  Users,
  WalletCards,
  Webhook,
  X,
} from "lucide-react";

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

const ACCENT = BRAND.highlight;

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
}: {
  avatarUrl?: string;
  name: string;
  containerClassName: string;
  textClassName?: string;
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

        font-black
        tracking-tight
        text-white
      `}
      style={{
        background:
          BRAND_GRADIENT,
        boxShadow:
          "0 6px 18px rgba(59,35,104,0.30)",
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
        className="
          sticky
          top-0
          z-30

          flex
          h-[74px]
          shrink-0
          items-center

          border-b
          border-border
          dark:border-white/10

          bg-card/95
          dark:bg-[#070B14]/95

          text-card-foreground
          dark:text-slate-100

          px-4

          backdrop-blur-xl

          transition-colors
          duration-300

          sm:px-5
          lg:px-7
        "
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
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-xl

                border
                border-border
                dark:border-white/10

                bg-card
                dark:bg-[#0B0F19]

                shadow-sm

                transition-all

                hover:bg-muted
                dark:hover:bg-white/10

                lg:hidden
              "
            >
              <Menu
                className="
                  h-[18px]
                  w-[18px]

                  text-[#2e1f4f]
                  dark:text-slate-200
                "
              />
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
                  className="
                    whitespace-nowrap
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.17em]

                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Digital Wallet
                </span>

                <span
                  className="
                    h-1
                    w-1
                    shrink-0
                    rounded-full

                    bg-[#3b2368]
                    dark:bg-violet-400
                  "
                />

                <span
                  className="
                    whitespace-nowrap
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.17em]

                    text-[#5b3a8f]
                    dark:text-violet-300
                  "
                >
                  {workspaceLabel}
                </span>
              </div>

              <h1
                className="
                  mt-[3px]
                  truncate
                  text-[15px]
                  font-extrabold
                  tracking-[-0.025em]

                  text-[#2e1f4f]
                  dark:text-slate-100

                  sm:text-[16px]
                "
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
              className="
                group

                flex
                h-[44px]
                w-full
                max-w-[540px]
                items-center
                gap-3

                rounded-[16px]

                border
                border-border
                dark:border-white/10

                bg-muted/40
                dark:bg-white/[0.04]

                px-3

                text-left

                shadow-sm

                transition-all
                duration-200

                hover:bg-card
                dark:hover:bg-white/[0.07]
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center

                  rounded-[11px]

                  border
                  border-border
                  dark:border-white/10

                  bg-card
                  dark:bg-[#0B0F19]

                  shadow-sm
                "
              >
                <Search
                  className="
                    h-[16px]
                    w-[16px]

                    text-[#5b3a8f]
                    dark:text-violet-300
                  "
                />
              </span>

              <span
                className="
                  min-w-0
                  flex-1
                  truncate

                  text-[12px]
                  font-medium

                  text-slate-500
                  dark:text-slate-400
                "
              >
                {userRole === "merchant"
                  ? "Search payments, transactions, customers, analytics..."
                  : "Search transactions, users, wallet, settings..."}
              </span>

              <span
                className="
                  flex
                  shrink-0
                  items-center
                  gap-1

                  rounded-[8px]

                  border
                  border-border
                  dark:border-white/10

                  bg-card
                  dark:bg-[#0B0F19]

                  px-2
                  py-1

                  text-[9px]
                  font-bold

                  text-slate-500
                  dark:text-slate-400

                  shadow-sm
                "
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
              className="
                flex
                h-10
                w-10
                items-center
                justify-center

                rounded-xl

                border
                border-border
                dark:border-white/10

                bg-card
                dark:bg-[#0B0F19]

                shadow-sm

                transition-all

                hover:bg-muted
                dark:hover:bg-white/10

                md:hidden
              "
            >
              <Search
                className="
                  h-[17px]
                  w-[17px]

                  text-[#5b3a8f]
                  dark:text-violet-300
                "
              />
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
              className="
                relative
                hidden
                h-10
                items-center
                justify-center

                overflow-hidden

                rounded-[13px]

                border

                px-4

                text-[10px]
                font-extrabold

                shadow-sm

                transition-all
                duration-200

                sm:flex

                border-[#3b2368]/20
                bg-violet-50/50
                text-[#5b3a8f]

                dark:border-violet-400/20
                dark:bg-violet-500/[0.10]
                dark:text-violet-300
              "
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
              className="
                relative

                flex
                h-10
                w-10
                items-center
                justify-center

                rounded-[13px]

                border
                border-border
                dark:border-white/10

                bg-card
                dark:bg-[#0B0F19]

                shadow-sm

                transition-all
                duration-200

                hover:bg-muted
                dark:hover:bg-white/10
              "
            >
              <Bell
                className="
                  h-[16px]
                  w-[16px]

                  text-[#5b3a8f]
                  dark:text-violet-300
                "
              />

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
                className="
                  flex
                  h-[44px]
                  items-center
                  gap-2

                  rounded-[15px]

                  border
                  border-border
                  dark:border-white/10

                  bg-card
                  dark:bg-[#0B0F19]

                  p-[5px]
                  pr-2.5

                  shadow-sm

                  transition-all
                  duration-200

                  hover:bg-muted
                  dark:hover:bg-white/10
                "
              >
                <ProfileAvatar
                  avatarUrl={
                    avatarUrl
                  }
                  name={
                    userName
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
                    className="
                      truncate
                      text-[10px]
                      font-extrabold

                      text-[#2e1f4f]
                      dark:text-slate-100
                    "
                  >
                    {userName}
                  </p>

                  <p
                    className="
                      mt-[1px]
                      text-[7.5px]
                      font-extrabold
                      uppercase
                      tracking-[0.08em]

                      text-slate-400
                      dark:text-slate-500
                    "
                  >
                    {roleLabel}
                  </p>
                </div>

                <ChevronDown
                  className={`
                    hidden
                    h-[14px]
                    w-[14px]
                    transition-transform
                    duration-200

                    text-slate-400
                    dark:text-slate-500

                    lg:block

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
                        className="
                          rounded-[14px]
                          p-3

                          border
                          border-[#3b2368]/10
                          dark:border-violet-400/10
                        "
                        style={{
                          background:
                            BRAND_SOFT,
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
                              className="
                                truncate
                                text-[11px]
                                font-extrabold

                                text-[#2e1f4f]
                                dark:text-slate-100
                              "
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
                              className="
                                mt-1
                                text-[8px]
                                font-extrabold
                                uppercase
                                tracking-[0.1em]

                                text-[#5b3a8f]
                                dark:text-violet-300
                              "
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

                          hover:text-[#5b3a8f]
                          dark:hover:text-violet-300
                        "
                      >
                        <Settings
                          className="
                            h-[15px]
                            w-[15px]

                            text-[#5b3a8f]
                            dark:text-violet-300
                          "
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
                    userRole ===
                    "merchant"
                      ? `
                        linear-gradient(
                          90deg,
                          #2563eb,
                          #0ea5e9,
                          #22d3ee
                        )
                      `
                      : BRAND_GRADIENT,
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

                    text-[#5b3a8f]
                    dark:text-violet-300
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
                      className="
                        h-[15px]
                        w-[15px]

                        text-[#5b3a8f]
                        dark:text-violet-300
                      "
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
                                  ? userRole ===
                                    "merchant"
                                    ? "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.09))"
                                    : BRAND_SOFT
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
                                    ? userRole ===
                                      "merchant"
                                      ? `
                                        linear-gradient(
                                          135deg,
                                          #2563eb,
                                          #0ea5e9
                                        )
                                      `
                                      : BRAND_GRADIENT
                                    : "var(--muted)",

                                color:
                                  active
                                    ? "#ffffff"
                                    : undefined,

                                boxShadow:
                                  active
                                    ? userRole ===
                                      "merchant"
                                      ? "0 7px 18px rgba(37,99,235,0.25)"
                                      : "0 7px 18px rgba(59,35,104,0.25)"
                                    : undefined,
                              }}
                            >
                              <Icon
                                className={`
                                  h-[16px]
                                  w-[16px]

                                  ${
                                    active
                                      ? "text-white"
                                      : "text-slate-500 dark:text-slate-300"
                                  }
                                `}
                              />
                            </motion.span>

                            <span
                              className={`
                                truncate
                                text-[12px]
                                font-bold

                                ${
                                  active
                                    ? userRole ===
                                      "merchant"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-[#5b3a8f] dark:text-violet-300"
                                    : "text-slate-700 dark:text-slate-200"
                                }
                              `}
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
                                className={`
                                  ml-auto

                                  rounded-full

                                  px-2
                                  py-0.5

                                  text-[8px]
                                  font-extrabold
                                  uppercase
                                  tracking-wider

                                  ${
                                    userRole ===
                                    "merchant"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                      : "bg-violet-100 text-[#5b3a8f] dark:bg-violet-500/10 dark:text-violet-300"
                                  }
                                `}
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
                      className={`
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl

                        ${
                          userRole ===
                          "merchant"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                            : "bg-violet-100 text-[#5b3a8f] dark:bg-violet-500/10 dark:text-violet-300"
                        }
                      `}
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
    </>
  );
}