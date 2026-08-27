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
  CircleUserRound,
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
}

interface SearchItem {
  id: string;
  title: string;
  href: string;
  icon: ElementType;
  roles?: UserRole[];
}

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

  "/dashboard/all-transactions":
    "System Transactions",

  "/dashboard/users":
    "User Management",

  "/dashboard/kyc":
    "KYC Verification",

  "/dashboard/kyc-requests":
    "KYC Management",

  "/dashboard/analytics":
    "Analytics & Reports",

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
   COMPONENT
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
     PAGE TITLE
  ========================================================== */

  const currentPageTitle =
    pageTitles[pathname] ||
    "Dashboard";

  /* =========================================================
     ROLE LABEL
  ========================================================== */

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : "Wallet User";

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

  /* =========================================================
     SEARCH OPEN
  ========================================================== */

  const openSearch = () => {
    setSearchOpen(true);
    setProfileOpen(false);
  };

  /* =========================================================
     SEARCH CLOSE
  ========================================================== */

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  /* =========================================================
     NAVIGATE
  ========================================================== */

  const navigateTo =
    (href: string) => {
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

  /* =========================================================
     AUTO FOCUS
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

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    searchOpen,
  ]);

  /* =========================================================
     UI
  ========================================================== */

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
          border-[#E5ECF4]

          bg-white/95

          px-4

          backdrop-blur-xl

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
              aria-label="Open sidebar"
              onClick={
                onMenuClick
              }
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
                border-[#DDE6EF]

                bg-white

                text-[#52677D]

                shadow-[0_3px_10px_rgba(15,39,69,0.04)]

                transition-all

                hover:border-[#BAD3EA]
                hover:bg-[#F4F9FE]
                hover:text-[#1F5EA8]

                lg:hidden
              "
            >
              <Menu
                className="
                  h-[18px]
                  w-[18px]
                "
              />
            </motion.button>

            {/* PAGE INFO */}

            <div
              className="
                min-w-0
              "
            >
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

                    text-[#8798AC]
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

                    bg-[#CBD7E2]
                  "
                />

                <span
                  className="
                    whitespace-nowrap

                    text-[9px]
                    font-extrabold
                    uppercase

                    tracking-[0.17em]

                    text-[#226AB0]
                  "
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

                  text-[#122F49]

                  sm:text-[16px]
                "
              >
                {currentPageTitle}
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
                border-[#DFE8F1]

                bg-[#F8FAFC]

                px-3

                text-left

                shadow-[0_3px_14px_rgba(20,48,78,0.035)]

                transition-all
                duration-200

                hover:border-[#C6DBEF]
                hover:bg-white

                hover:shadow-[0_8px_25px_rgba(31,94,168,0.07)]
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
                  border-[#E5EBF1]

                  bg-white

                  text-[#8293A6]

                  shadow-[0_2px_6px_rgba(15,39,69,0.04)]

                  transition

                  group-hover:text-[#1F5EA8]
                "
              >
                <Search
                  className="
                    h-[16px]
                    w-[16px]
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

                  text-[#91A0B1]
                "
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
                  border-[#E0E7EE]

                  bg-white

                  px-2
                  py-1

                  text-[9px]
                  font-bold

                  text-[#8B9AAC]

                  shadow-sm
                "
              >
                <Command
                  className="
                    h-3
                    w-3
                  "
                />

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
                border-[#DDE6EF]

                bg-white

                text-[#61768B]

                transition-all

                hover:border-[#BDD5EA]
                hover:text-[#1F5EA8]

                md:hidden
              "
            >
              <Search
                className="
                  h-[17px]
                  w-[17px]
                "
              />
            </motion.button>

            {/* ===============================================
                AI INSIGHTS
                NO ICON
            =============================================== */}

            <motion.button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/insights"
                )
              }
              whileTap={{
                scale: 0.96,
              }}
              className="
                hidden
                h-10
                items-center
                justify-center

                rounded-[13px]

                border
                border-[#CCE2F7]

                bg-[#F0F7FE]

                px-4

                text-[10px]
                font-extrabold

                text-[#2168A8]

                shadow-[0_3px_12px_rgba(31,94,168,0.035)]

                transition-all
                duration-200

                hover:border-[#B6D5F2]
                hover:bg-[#E8F4FF]

                sm:flex
              "
            >
              AI Insights
            </motion.button>

            {/* ===============================================
                NOTIFICATION
            =============================================== */}

            <motion.button
              type="button"
              aria-label="Notifications"
              onClick={() =>
                router.push(
                  "/dashboard/notifications"
                )
              }
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
                border-[#DDE6EF]

                bg-white

                text-[#60758A]

                shadow-[0_3px_10px_rgba(15,39,69,0.035)]

                transition-all
                duration-200

                hover:border-[#BDD5EA]
                hover:bg-[#F8FBFE]
                hover:text-[#1F5EA8]
              "
            >
              <Bell
                className="
                  h-[16px]
                  w-[16px]
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

                  ring-2
                  ring-white
                "
              />
            </motion.button>

            {/* ===============================================
                PROFILE
            =============================================== */}

            <div
              className="
                relative
              "
            >
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
                  border-[#DDE6EF]

                  bg-white

                  p-[5px]
                  pr-2.5

                  shadow-[0_3px_12px_rgba(15,39,69,0.045)]

                  transition-all
                  duration-200

                  hover:border-[#BCD3E8]

                  hover:shadow-[0_7px_20px_rgba(31,94,168,0.07)]
                "
              >
                <div
                  className="
                    flex
                    h-[34px]
                    w-[34px]
                    shrink-0
                    items-center
                    justify-center

                    rounded-[11px]

                    bg-[#155485]

                    text-white

                    shadow-[0_4px_12px_rgba(21,84,133,0.18)]
                  "
                >
                  <CircleUserRound
                    className="
                      h-[17px]
                      w-[17px]
                    "
                  />
                </div>

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

                      text-[#263C52]
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

                      text-[#9AA8B7]
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

                    text-[#93A2B2]

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

              {/* =============================================
                  PROFILE DROPDOWN
              ============================================== */}

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
                        duration: 0.16,
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
                        border-[#E2EAF2]

                        bg-white

                        p-2

                        shadow-[0_22px_60px_rgba(15,39,69,0.16)]
                      "
                    >
                      <div
                        className="
                          rounded-[14px]

                          bg-[#F6F9FC]

                          p-3
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                          "
                        >
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center

                              rounded-[11px]

                              bg-[#155485]

                              text-white
                            "
                          >
                            <CircleUserRound
                              className="
                                h-[17px]
                                w-[17px]
                              "
                            />
                          </div>

                          <div
                            className="
                              min-w-0
                            "
                          >
                            <p
                              className="
                                truncate

                                text-[11px]
                                font-extrabold

                                text-[#18324A]
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

                                  text-[#8797A8]
                                "
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

                                text-[#2A72B5]
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

                          text-[#53687C]

                          transition

                          hover:bg-[#F4F8FC]
                          hover:text-[#1F5EA8]
                        "
                      >
                        <Settings
                          className="
                            h-[15px]
                            w-[15px]
                          "
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
          SIMPLE SEARCH MODAL
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

              bg-[#09192A]/40

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
                w-full
                max-w-[600px]

                overflow-hidden

                rounded-[22px]

                border
                border-[#DFE8F1]

                bg-white

                shadow-[0_30px_90px_rgba(8,27,45,0.24)]
              "
            >
              {/* =============================================
                  SEARCH FIELD
              ============================================== */}

              <div
                className="
                  flex
                  items-center
                  gap-3

                  border-b
                  border-[#E8EEF4]

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

                    text-[#6C8095]
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

                    text-[#18324A]

                    outline-none

                    placeholder:font-medium
                    placeholder:text-[#9BA9B8]
                  "
                />

                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
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

                      text-[#8696A7]

                      transition

                      hover:bg-[#F1F5F9]
                      hover:text-[#334155]
                    "
                  >
                    <X
                      className="
                        h-[15px]
                        w-[15px]
                      "
                    />
                  </button>
                )}
              </div>

              {/* =============================================
                  RESULT LIST
              ============================================== */}

              <div
                className="
                  max-h-[360px]
                  overflow-y-auto

                  p-2.5

                  [scrollbar-width:thin]

                  [&::-webkit-scrollbar]:w-1
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-[#DCE5ED]
                "
              >
                {filteredItems.length >
                0 ? (
                  <div
                    className="
                      space-y-1
                    "
                  >
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
                            onClick={() =>
                              navigateTo(
                                item.href
                              )
                            }
                            className={`
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

                              ${
                                active
                                  ? "bg-[#EEF6FD]"
                                  : "hover:bg-[#F5F8FB]"
                              }
                            `}
                          >
                            <span
                              className={`
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center

                                rounded-[10px]

                                transition

                                ${
                                  active
                                    ? "bg-[#1F5EA8] text-white"
                                    : "bg-[#F1F5F8] text-[#667A8F] group-hover:bg-white group-hover:text-[#1F5EA8]"
                                }
                              `}
                            >
                              <Icon
                                className="
                                  h-[16px]
                                  w-[16px]
                                "
                              />
                            </span>

                            <span
                              className={`
                                truncate

                                text-[12px]
                                font-bold

                                ${
                                  active
                                    ? "text-[#1F5EA8]"
                                    : "text-[#31485D]"
                                }
                              `}
                            >
                              {
                                item.title
                              }
                            </span>

                            {active && (
                              <span
                                className="
                                  ml-auto

                                  rounded-full

                                  bg-[#DCEEFF]

                                  px-2
                                  py-0.5

                                  text-[8px]
                                  font-extrabold
                                  uppercase

                                  tracking-wider

                                  text-[#1F5EA8]
                                "
                              >
                                Current
                              </span>
                            )}
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div
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

                        bg-[#F1F5F8]

                        text-[#8494A5]
                      "
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

                        text-[#243B51]
                      "
                    >
                      No results found
                    </p>

                    <p
                      className="
                        mt-1

                        text-[10px]

                        text-[#8B99A9]
                      "
                    >
                      Try another keyword.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}