"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
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
  ArrowUpRight,
  Bell,
  BrainCircuit,
  ChevronDown,
  CircleUserRound,
  Command,
  FileCheck2,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
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
}

interface SearchItem {
  id: string;

  title: string;

  description: string;

  href: string;

  icon: React.ElementType;

  category: string;

  roles?:
    UserRole[];
}

/* =========================================================
   SEARCH ITEMS
========================================================= */

const searchItems: SearchItem[] = [
  {
    id: "dashboard",

    title:
      "Dashboard Overview",

    description:
      "View wallet activity, account insights and financial overview.",

    href:
      "/dashboard",

    icon:
      LayoutDashboard,

    category:
      "Dashboard",
  },

  {
    id: "wallet",

    title:
      "Wallet",

    description:
      "View wallet balance and account information.",

    href:
      "/dashboard/wallet",

    icon:
      WalletCards,

    category:
      "Finance",

    roles: [
      "user",
    ],
  },

  {
    id: "transactions",

    title:
      "Transactions",

    description:
      "Explore wallet transaction history and activity.",

    href:
      "/dashboard/transactions",

    icon:
      ArrowLeftRight,

    category:
      "Finance",
  },

  {
    id: "users",

    title:
      "User Management",

    description:
      "Manage platform users and account statuses.",

    href:
      "/dashboard/users",

    icon:
      Users,

    category:
      "Administration",

    roles: [
      "admin",
    ],
  },

  {
    id: "kyc",

    title:
      "KYC Verification",

    description:
      "Manage identity verification and KYC information.",

    href:
      "/dashboard/kyc",

    icon:
      FileCheck2,

    category:
      "Security",
  },

  {
    id: "kyc-requests",

    title:
      "KYC Requests",

    description:
      "Review customer verification requests.",

    href:
      "/dashboard/kyc-requests",

    icon:
      ShieldCheck,

    category:
      "Administration",

    roles: [
      "admin",
    ],
  },

  {
    id: "ai",

    title:
      "AI Insights",

    description:
      "Explore intelligent financial and platform insights.",

    href:
      "/dashboard/insights",

    icon:
      BrainCircuit,

    category:
      "Intelligence",
  },

  {
    id: "logs",

    title:
      "System Logs",

    description:
      "Monitor system activity and operational events.",

    href:
      "/dashboard/logs",

    icon:
      Activity,

    category:
      "System",

    roles: [
      "admin",
    ],
  },

  {
    id: "receipts",

    title:
      "Receipts",

    description:
      "View payment and transaction receipts.",

    href:
      "/dashboard/receipts",

    icon:
      ReceiptText,

    category:
      "Finance",
  },

  {
    id: "settings",

    title:
      "Settings",

    description:
      "Manage account and application preferences.",

    href:
      "/dashboard/settings",

    icon:
      Settings,

    category:
      "Account",
  },
];

/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles: Record<
  string,
  string
> = {
  "/dashboard":
    "Dashboard Overview",

  "/dashboard/wallet":
    "Wallet",

  "/dashboard/transactions":
    "Transactions",

  "/dashboard/users":
    "User Management",

  "/dashboard/kyc":
    "KYC Verification",

  "/dashboard/kyc-requests":
    "KYC Management",

  "/dashboard/insights":
    "AI Insights",

  "/dashboard/logs":
    "System Logs",

  "/dashboard/receipts":
    "Receipts",

  "/dashboard/notifications":
    "Notifications",

  "/dashboard/settings":
    "Settings",
};

/* =========================================================
   TOP NAVBAR
========================================================= */

export default function TopNavbar({
  onMenuClick,
  userName,
  userEmail = "",
  userRole,
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

  /* =========================================================
     CURRENT PAGE
  ========================================================== */

  const currentPageTitle =
    pageTitles[pathname] ||
    "Dashboard";

  /* =========================================================
     SEARCH RESULTS
  ========================================================== */

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
        return allowedItems;
      }

      return allowedItems.filter(
        (item) => {
          return (
            item.title
              .toLowerCase()
              .includes(
                query
              ) ||
            item.description
              .toLowerCase()
              .includes(
                query
              ) ||
            item.category
              .toLowerCase()
              .includes(
                query
              )
          );
        }
      );
    }, [
      searchQuery,
      userRole,
    ]);

  /* =========================================================
     SEARCH CONTROLS
  ========================================================== */

  const openSearch =
    () => {
      setSearchOpen(
        true
      );

      setProfileOpen(
        false
      );
    };

  const closeSearch =
    () => {
      setSearchOpen(
        false
      );

      setSearchQuery(
        ""
      );
    };

  const handleNavigate =
    (
      href: string
    ) => {
      closeSearch();

      router.push(
        href
      );
    };

  /* =========================================================
     KEYBOARD
  ========================================================== */

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

  /* =========================================================
     AUTOFOCUS
  ========================================================== */

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

  /* =========================================================
     USER LABEL
  ========================================================== */

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : "Wallet User";

  /* =========================================================
     RETURN
  ========================================================== */

  return (
    <>
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <motion.header
        initial={{
          opacity: 0,
          y: -16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
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
          h-[76px]
          shrink-0
          items-center
          justify-between
          gap-3

          border-b
          border-[#E5ECF4]

          bg-white/85

          px-3
          backdrop-blur-2xl

          sm:px-5
          lg:px-7
        "
      >
        {/* ===================================================
            LEFT
        ==================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          {/* MOBILE MENU */}

          <motion.button
            type="button"
            aria-label="Open sidebar"
            onClick={
              onMenuClick
            }
            whileTap={{
              scale: 0.9,
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
              border-[#DCE5EE]

              bg-white

              text-[#405169]

              shadow-sm

              transition-all

              hover:border-[#BFD3E8]
              hover:bg-[#F3F8FD]
              hover:text-[#1F5EA8]

              lg:hidden
            "
          >
            <Menu className="h-[18px] w-[18px]" />
          </motion.button>

          {/* TITLE */}

          <div className="min-w-0">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8A9AAF]">
                Digital Wallet
              </span>

              <span className="h-1 w-1 rounded-full bg-[#C7D3DF]" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#1F5EA8]">
                {userRole ===
                "admin"
                  ? "Control Center"
                  : "My Wallet"}
              </span>
            </div>

            <h1 className="mt-0.5 truncate text-sm font-extrabold tracking-tight text-[#102A43] sm:text-base">
              {
                currentPageTitle
              }
            </h1>
          </div>
        </div>

        {/* ===================================================
            DESKTOP SEARCH
        ==================================================== */}

        <motion.button
          type="button"
          onClick={
            openSearch
          }
          whileHover={{
            scale: 1.008,
          }}
          whileTap={{
            scale: 0.99,
          }}
          className="
            group

            hidden
            h-[44px]
            w-full
            max-w-[460px]
            items-center
            gap-3

            rounded-2xl

            border
            border-[#DEE7F0]

            bg-[#F7F9FC]

            px-3

            text-left

            shadow-[0_5px_20px_rgba(15,39,69,0.035)]

            transition-all

            hover:border-[#BDD7F2]
            hover:bg-white
            hover:shadow-[0_10px_30px_rgba(31,94,168,0.08)]

            md:flex
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center

              rounded-xl

              bg-white

              text-[#8797AA]

              shadow-sm

              transition-all

              group-hover:bg-[#EEF5FC]
              group-hover:text-[#1F5EA8]
            "
          >
            <Search className="h-4 w-4" />
          </div>

          <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#8C9BAE]">
            Search transactions,
            users, wallet,
            settings...
          </span>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-1

              rounded-lg

              border
              border-[#E2E8F0]

              bg-white

              px-2
              py-1

              text-[9px]
              font-extrabold
              text-[#8695A8]

              shadow-sm
            "
          >
            <Command className="h-3 w-3" />

            <span>K</span>
          </div>
        </motion.button>

        {/* ===================================================
            RIGHT
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">

          {/* MOBILE SEARCH */}

          <motion.button
            type="button"
            onClick={
              openSearch
            }
            whileTap={{
              scale: 0.9,
            }}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center

              rounded-xl
              border
              border-[#DCE5EE]

              bg-white

              text-[#60738A]

              shadow-sm

              transition-all

              hover:border-[#BDD7F2]
              hover:text-[#1F5EA8]

              md:hidden
            "
          >
            <Search className="h-4 w-4" />
          </motion.button>

          {/* AI INSIGHTS */}

          <motion.button
            type="button"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.95,
            }}
            onClick={() =>
              router.push(
                "/dashboard/insights"
              )
            }
            className="
              hidden
              h-10
              items-center
              gap-1.5

              rounded-xl

              border
              border-[#D9EAFE]

              bg-[#EFF7FF]

              px-3

              text-[10px]
              font-extrabold
              text-[#1F5EA8]

              transition-all

              hover:border-[#BFDDFB]
              hover:bg-[#E6F2FF]

              sm:flex
            "
          >
            <Sparkles className="h-3.5 w-3.5" />

            AI Insights
          </motion.button>

          {/* NOTIFICATION */}

          <motion.button
            type="button"
            aria-label="Notifications"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.92,
            }}
            onClick={() =>
              router.push(
                "/dashboard/notifications"
              )
            }
            className="
              relative

              flex
              h-10
              w-10
              items-center
              justify-center

              rounded-xl

              border
              border-[#DCE5EE]

              bg-white

              text-[#60738A]

              shadow-sm

              transition-all

              hover:border-[#BDD7F2]
              hover:text-[#1F5EA8]
            "
          >
            <Bell className="h-4 w-4" />

            <span
              className="
                absolute
                right-[8px]
                top-[7px]

                h-[7px]
                w-[7px]

                rounded-full

                border
                border-white

                bg-rose-500
              "
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-50" />
            </span>
          </motion.button>

          {/* PROFILE */}

          <div className="relative">
            <motion.button
              type="button"
              whileTap={{
                scale: 0.97,
              }}
              onClick={() => {
                setProfileOpen(
                  (current) =>
                    !current
                );

                setSearchOpen(
                  false
                );
              }}
              className="
                flex
                h-11
                items-center
                gap-2

                rounded-2xl

                border
                border-[#DCE5EE]

                bg-white

                p-1.5
                pr-2.5

                shadow-sm

                transition-all

                hover:border-[#BFD3E8]
                hover:shadow-[0_8px_24px_rgba(31,94,168,0.08)]
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center

                  rounded-xl

                  bg-gradient-to-br
                  from-[#102A43]
                  via-[#174F82]
                  to-[#2683D8]

                  text-white

                  shadow-[0_5px_14px_rgba(31,94,168,0.22)]
                "
              >
                <CircleUserRound className="h-4 w-4" />
              </div>

              <div className="hidden max-w-[125px] text-left lg:block">
                <p className="truncate text-[10px] font-extrabold text-[#253A50]">
                  {userName}
                </p>

                <p className="mt-[1px] text-[8px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  {roleLabel}
                </p>
              </div>

              <ChevronDown
                className={`
                  hidden
                  h-3.5
                  w-3.5
                  text-[#94A3B8]

                  transition-transform
                  duration-200

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
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    transition={{
                      duration: 0.18,
                    }}
                    className="
                      absolute
                      right-0
                      top-[54px]
                      z-50

                      w-[250px]

                      overflow-hidden

                      rounded-[20px]

                      border
                      border-[#E2EAF2]

                      bg-white

                      p-2

                      shadow-[0_25px_70px_rgba(15,39,69,0.18)]
                    "
                  >
                    <div className="rounded-2xl bg-[#F5F8FC] p-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center

                            rounded-xl

                            bg-gradient-to-br
                            from-[#102A43]
                            to-[#247AC4]

                            text-white
                          "
                        >
                          <CircleUserRound className="h-[18px] w-[18px]" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-[#102A43]">
                            {userName}
                          </p>

                          {userEmail && (
                            <p className="mt-0.5 truncate text-[9px] font-medium text-[#8392A5]">
                              {userEmail}
                            </p>
                          )}

                          <p className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#1F5EA8]">
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
                          "/dashboard/settings"
                        );
                      }}
                      className="
                        mt-1

                        flex
                        w-full
                        items-center
                        justify-between

                        rounded-xl

                        px-3
                        py-2.5

                        text-left
                        text-xs
                        font-bold
                        text-[#526579]

                        transition-all

                        hover:bg-[#F5F8FC]
                        hover:text-[#1F5EA8]
                      "
                    >
                      Account Settings

                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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

              bg-[#061525]/55

              px-3
              pt-[8vh]

              backdrop-blur-md

              sm:px-5
              sm:pt-[11vh]
            "
          >
            {/* BACKGROUND GLOW */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="
                pointer-events-none

                absolute
                left-1/2
                top-[4%]

                h-[350px]
                w-[90%]
                max-w-[650px]

                -translate-x-1/2

                rounded-full

                bg-[#2587E8]/15

                blur-[110px]
              "
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                y: 55,
                scale: 0.92,
                rotateX: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                y: 30,
                scale: 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 270,
                damping: 25,
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="
                relative

                w-full
                max-w-[720px]

                overflow-hidden

                rounded-[26px]

                border
                border-white/70

                bg-white/95

                shadow-[0_40px_130px_rgba(3,16,31,0.40)]

                backdrop-blur-2xl
              "
            >
              {/* TOP LIGHT */}

              <div
                className="
                  absolute
                  left-1/2
                  top-0

                  h-[2px]
                  w-[45%]

                  -translate-x-1/2

                  bg-gradient-to-r
                  from-transparent
                  via-[#2E8BE5]
                  to-transparent
                "
              />

              {/* SEARCH INPUT */}

              <div
                className="
                  flex
                  items-center
                  gap-3

                  border-b
                  border-[#E9EFF5]

                  px-4
                  py-4

                  sm:px-5
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-xl

                    bg-[#EEF6FF]

                    text-[#1F5EA8]
                  "
                >
                  <Search className="h-[18px] w-[18px]" />
                </div>

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
                  placeholder="Search your dashboard..."
                  className="
                    h-11
                    min-w-0
                    flex-1

                    bg-transparent

                    text-sm
                    font-semibold
                    text-[#102A43]

                    outline-none

                    placeholder:font-medium
                    placeholder:text-[#9AA8B8]

                    sm:text-base
                  "
                />

                {searchQuery ? (
                  <motion.button
                    type="button"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    onClick={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center

                      rounded-lg

                      bg-[#F1F5F9]

                      text-[#8190A3]

                      transition

                      hover:bg-[#E8EEF5]
                      hover:text-[#334155]
                    "
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                ) : (
                  <span
                    className="
                      hidden

                      rounded-lg

                      border
                      border-[#DEE6EE]

                      bg-[#F8FAFC]

                      px-2
                      py-1

                      text-[9px]
                      font-extrabold
                      text-[#8B99A9]

                      sm:block
                    "
                  >
                    ESC
                  </span>
                )}
              </div>

              {/* SEARCH DESCRIPTION */}

              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#2C82D5]" />

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#1F5EA8]">
                      Smart Search
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] text-[#8B99A9] sm:text-xs">
                    Quickly navigate
                    through your digital
                    wallet.
                  </p>
                </div>

                <span
                  className="
                    shrink-0

                    rounded-full

                    bg-[#EFF4F8]

                    px-2.5
                    py-1

                    text-[9px]
                    font-extrabold
                    text-[#64768A]
                  "
                >
                  {
                    filteredItems.length
                  }{" "}
                  results
                </span>
              </div>

              {/* RESULTS */}

              <div
                className="
                  max-h-[430px]
                  overflow-y-auto

                  px-3
                  pb-3

                  [&::-webkit-scrollbar]:w-1.5

                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-[#D9E3ED]

                  [&::-webkit-scrollbar-track]:bg-transparent
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

                        return (
                          <motion.button
                            type="button"
                            key={
                              item.id
                            }
                            initial={{
                              opacity: 0,
                              y: 9,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.025,
                            }}
                            onClick={() =>
                              handleNavigate(
                                item.href
                              )
                            }
                            className="
                              group

                              flex
                              w-full
                              items-center
                              gap-3

                              rounded-2xl

                              border
                              border-transparent

                              px-3
                              py-3

                              text-left

                              transition-all

                              hover:border-[#DCEBFA]
                              hover:bg-[#F4F9FE]
                            "
                          >
                            <div
                              className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center

                                rounded-xl

                                border
                                border-[#E5ECF3]

                                bg-white

                                text-[#60758B]

                                shadow-sm

                                transition-all

                                group-hover:border-[#1F5EA8]
                                group-hover:bg-[#1F5EA8]
                                group-hover:text-white
                                group-hover:shadow-[0_8px_18px_rgba(31,94,168,0.18)]
                              "
                            >
                              <Icon className="h-[18px] w-[18px]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-xs font-extrabold text-[#16324B] sm:text-sm">
                                  {
                                    item.title
                                  }
                                </h4>

                                <span
                                  className="
                                    hidden

                                    rounded-md

                                    bg-[#EDF2F7]

                                    px-1.5
                                    py-0.5

                                    text-[8px]
                                    font-extrabold
                                    uppercase
                                    tracking-wider

                                    text-[#8190A2]

                                    sm:inline-flex
                                  "
                                >
                                  {
                                    item.category
                                  }
                                </span>
                              </div>

                              <p className="mt-0.5 truncate text-[10px] leading-5 text-[#8A99AB] sm:text-xs">
                                {
                                  item.description
                                }
                              </p>
                            </div>

                            <div
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                translate-x-2
                                items-center
                                justify-center

                                rounded-lg

                                text-[#A6B2BF]

                                opacity-0

                                transition-all

                                group-hover:translate-x-0
                                group-hover:bg-white
                                group-hover:text-[#1F5EA8]
                                group-hover:opacity-100
                              "
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </div>
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="flex flex-col items-center justify-center px-5 py-16 text-center"
                  >
                    <div
                      className="
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center

                        rounded-2xl

                        bg-[#F0F4F8]

                        text-[#8292A5]
                      "
                    >
                      <Search className="h-5 w-5" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-[#102A43]">
                      Nothing found
                    </h3>

                    <p className="mt-1 max-w-[280px] text-xs leading-5 text-[#8A99AA]">
                      Try searching for
                      wallet, transaction,
                      user, KYC, settings
                      or insights.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* FOOTER */}

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3

                  border-t
                  border-[#E9EFF5]

                  bg-[#F8FAFC]/90

                  px-5
                  py-3
                "
              >
                <div className="flex items-center gap-4 text-[9px] font-bold text-[#8A99A9]">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-[#DDE5ED] bg-white px-1.5 py-0.5 shadow-sm">
                      ESC
                    </kbd>

                    Close
                  </span>

                  <span className="hidden items-center gap-1.5 sm:flex">
                    <kbd className="rounded border border-[#DDE5ED] bg-white px-1.5 py-0.5 shadow-sm">
                      Ctrl K
                    </kbd>

                    Search
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#1F5EA8]">
                  <Sparkles className="h-3 w-3" />

                  Smart Navigation
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}