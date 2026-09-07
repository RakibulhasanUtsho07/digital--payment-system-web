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
  Bell,
  ChevronDown,
  Command,
  FileCheck2,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user";

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
   FIXED COFFER BRAND PALETTE

   Background stays theme-controlled (bg-card, var(--border),
   etc. below). Only TEXT, labels, and icons use these colors,
   so the reading experience matches the reference image's
   navy -> indigo -> violet tone without changing the page's
   light/dark background behavior.
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

/*
 * Text colors derived from the same brand hue, at strengths
 * that stay readable on the existing light theme background.
 */
const TEXT_STRONG = BRAND.violet;
const TEXT_MUTED = "rgba(46, 31, 79, 0.6)";
const TEXT_FAINT = "rgba(46, 31, 79, 0.4)";
const ACCENT = BRAND.highlight;

/* =========================================================
   SEARCH ITEMS
========================================================= */

const searchItems: SearchItem[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
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
    id: "all-transactions",
    title: "System Transactions",
    href: "/dashboard/all-transactions",
    icon: ArrowLeftRight,
    roles: ["admin"],
  },
  {
    id: "users",
    title: "User Management",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    id: "kyc",
    title: "KYC Verification",
    href: "/dashboard/kyc",
    icon: FileCheck2,
    roles: ["user"],
  },
  {
    id: "kyc-requests",
    title: "KYC Approvals",
    href: "/dashboard/kyc-requests",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    href: "/dashboard/analytics",
    icon: Activity,
    roles: ["admin"],
  },
  {
    id: "logs",
    title: "System Logs",
    href: "/dashboard/logs",
    icon: Activity,
    roles: ["admin"],
  },
  {
    id: "receipts",
    title: "Receipts",
    href: "/dashboard/receipts",
    icon: ReceiptText,
    roles: ["user"],
  },
  {
    id: "settings",
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/wallet": "Wallet",
  "/dashboard/transactions": "Transactions",
  "/dashboard/all-transactions": "System Transactions",
  "/dashboard/users": "User Management",
  "/dashboard/kyc": "KYC Verification",
  "/dashboard/kyc-requests": "KYC Management",
  "/dashboard/analytics": "Analytics & Reports",
  "/dashboard/insights": "AI Insights",
  "/dashboard/logs": "System Logs",
  "/dashboard/receipts": "Receipts",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",
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
          bg-muted
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
          `0 6px 18px rgba(59,35,104,0.30)`,
      }}
    >
      {getInitials(name)}
    </motion.div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TopNavbar({
  onMenuClick,
  userName,
  userEmail = "",
  userRole,
  avatarUrl,
}: TopNavbarProps) {
  const router =
    useRouter();

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
     PAGE TITLE
  ======================================================= */

  const currentPageTitle =
    pageTitles[pathname] ??
    "Dashboard";

  /* =======================================================
     ROLE
  ======================================================= */

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : "Wallet User";

  /* =======================================================
     SEARCH FILTER
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
          6
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

  /* =======================================================
     SEARCH OPEN
  ======================================================= */

  const openSearch = () => {
    setSearchOpen(
      true
    );

    setProfileOpen(
      false
    );
  };

  /* =======================================================
     SEARCH CLOSE
  ======================================================= */

  const closeSearch = () => {
    setSearchOpen(
      false
    );

    setSearchQuery(
      ""
    );
  };

  /* =======================================================
     NAVIGATE
  ======================================================= */

  const navigateTo = (
    href: string
  ) => {
    closeSearch();

    router.push(
      href
    );
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
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() ===
            "k"
        ) {
          event.preventDefault();

          setSearchOpen(
            (current) =>
              !current
          );

          setProfileOpen(
            false
          );
        }

        if (
          event.key ===
          "Escape"
        ) {
          setSearchOpen(
            false
          );

          setSearchQuery(
            ""
          );

          setProfileOpen(
            false
          );
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
  }, [
    searchOpen,
  ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* =====================================================
          TOP NAVBAR
      ====================================================== */}

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

          bg-card/95

          text-card-foreground

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
              LEFT / PAGE INFO
          ================================================== */}

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
            {/* MOBILE MENU */}

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
                bg-card
                shadow-sm
                transition-all
                hover:bg-muted
                lg:hidden
              "
            >
              <Menu
                className="h-[18px] w-[18px]"
                style={{
                  color: TEXT_STRONG,
                }}
              />
            </motion.button>

            {/* PAGE INFO */}

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
                  "
                  style={{
                    color: TEXT_MUTED,
                  }}
                >
                  Digital Wallet
                </span>

                <span
                  className="
                    h-1
                    w-1
                    shrink-0
                    rounded-full
                  "
                  style={{
                    background:
                      BRAND.purple,
                  }}
                />

                <span
                  className="
                    whitespace-nowrap
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.17em]
                  "
                  style={{
                    color:
                      ACCENT,
                  }}
                >
                  {userRole ===
                  "admin"
                    ? "Control Center"
                    : "My Wallet"}
                </span>
              </div>

              <h1
                className="
                  mt-[3px]
                  truncate
                  text-[15px]
                  font-extrabold
                  tracking-[-0.025em]
                  sm:text-[16px]
                "
                style={{
                  color: TEXT_STRONG,
                }}
              >
                {
                  currentPageTitle
                }
              </h1>
            </div>
          </div>

          {/* =================================================
              CENTER SEARCH
          ================================================== */}

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
              onClick={
                openSearch
              }
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

                bg-muted/40

                px-3

                text-left

                shadow-sm

                transition-all
                duration-200

                hover:bg-card
              "
            >
              {/* Search icon */}

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

                  bg-card

                  shadow-sm

                  transition
                "
              >
                <Search
                  className="
                    h-[16px]
                    w-[16px]
                    transition-colors
                  "
                  style={{
                    color: ACCENT,
                  }}
                />
              </span>

              <span
                className="
                  min-w-0
                  flex-1
                  truncate

                  text-[12px]
                  font-medium
                "
                style={{
                  color: TEXT_MUTED,
                }}
              >
                Search transactions,
                users, wallet,
                settings...
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

                  bg-card

                  px-2
                  py-1

                  text-[9px]
                  font-bold

                  shadow-sm
                "
                style={{
                  color: TEXT_MUTED,
                }}
              >
                <Command className="h-3 w-3" />
                K
              </span>
            </motion.button>
          </div>

          {/* =================================================
              RIGHT
          ================================================== */}

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
              onClick={
                openSearch
              }
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

                bg-card

                shadow-sm

                transition-all

                hover:bg-muted

                md:hidden
              "
            >
              <Search
                className="
                  h-[17px]
                  w-[17px]
                "
                style={{
                  color: ACCENT,
                }}
              />
            </motion.button>

            {/* =================================================
                AI INSIGHTS
            ================================================== */}

            <motion.button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/insights"
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
              "
              style={{
                background:
                  BRAND_SOFT,

                borderColor:
                  "rgba(59,35,104,0.18)",

                color:
                  ACCENT,
              }}
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-0
                "
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,.08), transparent)",
                }}
              />

              <span
                className="
                  relative
                  z-10
                "
              >
                AI Insights
              </span>
            </motion.button>

            {/* =================================================
                NOTIFICATION
            ================================================== */}

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

                bg-card

                shadow-sm

                transition-all
                duration-200

                hover:bg-muted
              "
            >
              <Bell
                className="
                  h-[16px]
                  w-[16px]
                "
                style={{
                  color: ACCENT,
                }}
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

            {/* =================================================
                PROFILE
            ================================================== */}

            <div className="relative">
              <motion.button
                type="button"
                onClick={() => {
                  setProfileOpen(
                    (current) =>
                      !current
                  );

                  setSearchOpen(
                    false
                  );
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

                  bg-card

                  p-[5px]
                  pr-2.5

                  shadow-sm

                  transition-all
                  duration-200

                  hover:bg-muted
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
                  textClassName="text-[13px]"
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
                    "
                    style={{
                      color: TEXT_STRONG,
                    }}
                  >
                    {
                      userName
                    }
                  </p>

                  <p
                    className="
                      mt-[1px]
                      text-[7.5px]
                      font-extrabold
                      uppercase
                      tracking-[0.08em]
                    "
                    style={{
                      color: TEXT_FAINT,
                    }}
                  >
                    {
                      roleLabel
                    }
                  </p>
                </div>

                <ChevronDown
                  className={`
                    hidden
                    h-[14px]
                    w-[14px]
                    transition-transform
                    duration-200
                    lg:block

                    ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }
                  `}
                  style={{
                    color: TEXT_FAINT,
                  }}
                />
              </motion.button>

              {/* =================================================
                  PROFILE DROPDOWN
              ================================================== */}

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
                        bg-card
                        p-2
                        shadow-2xl
                      "
                    >
                      {/* USER INFO */}

                      <div
                        className="
                          rounded-[14px]
                          p-3
                        "
                        style={{
                          background:
                            BRAND_SOFT,

                          border:
                            "1px solid rgba(59,35,104,0.14)",
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
                              "
                              style={{
                                color: TEXT_STRONG,
                              }}
                            >
                              {
                                userName
                              }
                            </p>

                            {userEmail && (
                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-[9px]
                                "
                                style={{
                                  color: TEXT_MUTED,
                                }}
                              >
                                {
                                  userEmail
                                }
                              </p>
                            )}

                            <p
                              className="
                                mt-1
                                text-[8px]
                                font-extrabold
                                uppercase
                                tracking-[0.1em]
                              "
                              style={{
                                color:
                                  ACCENT,
                              }}
                            >
                              {
                                roleLabel
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SETTINGS */}

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(
                            false
                          );

                          router.push(
                            "/dashboard/settings"
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

                          transition

                          hover:bg-muted
                        "
                        style={{
                          color: TEXT_MUTED,
                        }}
                      >
                        <Settings
                          className="
                            h-[15px]
                            w-[15px]
                          "
                          style={{
                            color:
                              ACCENT,
                          }}
                        />

                        Account Settings
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

                bg-card

                shadow-2xl
              "
              style={{
                boxShadow:
                  "0 30px 90px rgba(15,12,27,0.30)",
              }}
            >
              {/* TOP BRAND LINE */}

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
                    BRAND_GRADIENT,
                }}
              />

              {/* SEARCH FIELD */}

              <div
                className="
                  flex
                  items-center
                  gap-3

                  border-b
                  border-border

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
                  style={{
                    color: ACCENT,
                  }}
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
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search dashboard..."
                  className="
                    h-10
                    min-w-0
                    flex-1

                    bg-transparent

                    text-[14px]
                    font-semibold

                    outline-none

                    placeholder:font-medium
                  "
                  style={{
                    color: TEXT_STRONG,
                  }}
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
                      scale:
                        0.9,
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
                    "
                  >
                    <X
                      className="
                        h-[15px]
                        w-[15px]
                      "
                      style={{
                        color:
                          ACCENT,
                      }}
                    />
                  </motion.button>
                )}
              </div>

              {/* RESULT LIST */}

              <div
                className="
                  max-h-[360px]
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
                          item.href;

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
                            "
                            style={{
                              background:
                                active
                                  ? BRAND_SOFT
                                  : undefined,
                            }}
                          >
                            {/* ICON */}

                            <motion.span
                              whileHover={{
                                scale:
                                  1.05,
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
                                    ? BRAND_GRADIENT
                                    : "var(--muted)",

                                color:
                                  active
                                    ? "#ffffff"
                                    : TEXT_MUTED,

                                boxShadow:
                                  active
                                    ? "0 7px 18px rgba(59,35,104,0.25)"
                                    : undefined,
                              }}
                            >
                              <Icon
                                className="
                                  h-[16px]
                                  w-[16px]
                                "
                              />
                            </motion.span>

                            {/* TITLE */}

                            <span
                              className="
                                truncate
                                text-[12px]
                                font-bold
                              "
                              style={{
                                color:
                                  active
                                    ? ACCENT
                                    : TEXT_STRONG,
                              }}
                            >
                              {
                                item.title
                              }
                            </span>

                            {/* CURRENT */}

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
                                className="
                                  ml-auto
                                  rounded-full
                                  px-2
                                  py-0.5
                                  text-[8px]
                                  font-extrabold
                                  uppercase
                                  tracking-wider
                                "
                                style={{
                                  background:
                                    "rgba(46,31,79,0.10)",

                                  color:
                                    ACCENT,
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
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                      "
                      style={{
                        background:
                          BRAND_SOFT,

                        color:
                          ACCENT,
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
                      "
                      style={{
                        color: TEXT_STRONG,
                      }}
                    >
                      No results found
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                      "
                      style={{
                        color: TEXT_MUTED,
                      }}
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