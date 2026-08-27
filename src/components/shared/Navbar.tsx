"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";

import {
  ArrowRight,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   CONSTANTS
========================================================= */

const PRIMARY =
  "#1A202C";

const BLUE =
  "#1F5EA8";

/* =========================================================
   TYPES
========================================================= */

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;

  role:
    | "user"
    | "admin";

  kycStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
}

interface ProfileResponse {
  success: boolean;
  user: CurrentUser;
}

interface NavItem {
  name: string;
  href: string;
}

/* =========================================================
   NAVIGATION
========================================================= */

const navLinks: NavItem[] = [
  {
    name: "Product",
    href: "/product",
  },
  {
    name: "Security",
    href: "/security",
  },
  {
    name: "Pricing",
    href: "/pricing",
  },
];

/* =========================================================
   MOTION
========================================================= */

const navContainerVariants: Variants =
  {
    hidden: {},

    visible: {
      transition: {
        staggerChildren:
          0.07,

        delayChildren:
          0.12,
      },
    },
  };

const navItemVariants: Variants =
  {
    hidden: {
      opacity: 0,
      y: -8,
    },

    visible: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.4,

        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      },
    },
  };

/* =========================================================
   NAVBAR
========================================================= */

export default function Navbar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    user,
    setUser,
  ] =
    useState<CurrentUser | null>(
      null
    );

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /* =========================================================
     ROUTE CONDITIONS
  ========================================================== */

  const isLoginPage =
    pathname === "/login";

  const isRegisterPage =
    pathname ===
    "/register";

  const isAuthRoute =
    isLoginPage ||
    isRegisterPage;

  /* =========================================================
     CHECK CURRENT USER
  ========================================================== */

  useEffect(() => {
    let mounted =
      true;

    const loadUser =
      async () => {
        /*
         * Use stored UI information immediately
         * to reduce navbar flashing.
         */
        try {
          const stored =
            localStorage.getItem(
              "auth_user"
            );

          if (
            stored &&
            mounted
          ) {
            const parsed =
              JSON.parse(
                stored
              ) as CurrentUser;

            if (
              parsed?._id &&
              parsed?.role
            ) {
              setUser(
                parsed
              );
            }
          }
        } catch {
          // Ignore invalid localStorage data.
        }

        /*
         * Backend remains the actual source
         * of truth for authentication.
         */
        try {
          const data =
            await apiClient<ProfileResponse>(
              "/users/profile"
            );

          if (
            mounted &&
            data?.success &&
            data.user
          ) {
            setUser(
              data.user
            );

            localStorage.setItem(
              "auth_user",
              JSON.stringify(
                data.user
              )
            );

            localStorage.setItem(
              "is_authenticated",
              "true"
            );
          }
        } catch {
          if (mounted) {
            setUser(null);

            localStorage.removeItem(
              "auth_user"
            );

            localStorage.removeItem(
              "is_authenticated"
            );

            localStorage.removeItem(
              "token"
            );
          }
        } finally {
          if (mounted) {
            setLoadingUser(
              false
            );
          }
        }
      };

    void loadUser();

    return () => {
      mounted =
        false;
    };
  }, [
    pathname,
  ]);

  /* =========================================================
     LOGOUT
  ========================================================== */

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        await apiClient(
          "/auth/logout",
          {
            method:
              "POST",
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Logout failed:",
          error
        );
      } finally {
        setUser(null);

        setOpen(false);

        localStorage.removeItem(
          "auth_user"
        );

        localStorage.removeItem(
          "is_authenticated"
        );

        localStorage.removeItem(
          "token"
        );

        setLoggingOut(
          false
        );

        router.replace(
          "/"
        );

        router.refresh();
      }
    };

  /* =========================================================
     ACTIVE LINK
  ========================================================== */

  const isActiveLink =
    (
      href: string
    ) => {
      if (
        href === "/"
      ) {
        return (
          pathname === "/"
        );
      }

      return pathname.startsWith(
        href
      );
    };

  /* =========================================================
     AUTHENTICATED DASHBOARD LABEL
  ========================================================== */

  const dashboardLabel =
    user?.role ===
    "admin"
      ? "Dashboard"
      : "My Wallet";

  /* =========================================================
     RETURN
  ========================================================== */

  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          0.55,

        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="
        relative
        z-50
        overflow-visible

        border-b
        border-black/[0.04]

        bg-[#F1F3ED]/95

        shadow-[0_5px_25px_rgba(17,24,39,0.03)]

        backdrop-blur-xl
      "
    >
      {/* =====================================================
          NAV CONTAINER
      ====================================================== */}

      <nav
        className="
          mx-auto

          grid
          min-h-[76px]
          w-[95%]
          max-w-[1500px]

          grid-cols-[1fr_auto]

          items-center
          gap-3

          px-2

          sm:px-4

          lg:grid-cols-[1fr_auto_1fr]
          lg:px-8

          xl:px-10
        "
      >
        {/* ===================================================
            LEFT — MOBILE MENU + BRAND
        ==================================================== */}

        <div
          className="
            flex
            min-w-0
            items-center

            lg:justify-start
          "
        >
          {/* MOBILE MENU */}

          <Sheet
            open={open}
            onOpenChange={
              setOpen
            }
          >
            <SheetTrigger
              asChild
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="
                  mr-1
                  h-10
                  w-10
                  shrink-0

                  rounded-xl

                  text-[#1A202C]

                  transition-all

                  hover:bg-black/[0.04]
                  hover:text-[#1F5EA8]

                  lg:hidden
                "
              >
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            </SheetTrigger>

            {/* ===============================================
                MOBILE DRAWER
            ================================================ */}

            <SheetContent
              side="left"
              className="
                w-[290px]

                border-r
                border-black/[0.05]

                bg-[#F4F5F0]

                p-0
              "
            >
              {/* Drawer brand */}

              <div
                className="
                  border-b
                  border-black/[0.05]

                  px-5
                  py-5
                "
              >
                <SheetTitle
                  className="
                    flex
                    items-center
                    gap-3
                    text-left
                  "
                >
                  <BrandLogo />

                  <div>
                    <p
                      className="
                        text-[17px]
                        font-semibold
                        tracking-tight
                        text-[#1A202C]
                      "
                    >
                      Coffer
                    </p>

                    <p
                      className="
                        mt-0.5

                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.18em]

                        text-[#1F5EA8]
                      "
                    >
                      Digital Wallet
                    </p>
                  </div>
                </SheetTitle>
              </div>

              {/* Drawer navigation */}

              <div
                className="
                  flex
                  h-[calc(100dvh-84px)]
                  flex-col
                "
              >
                <div
                  className="
                    flex-1
                    overflow-y-auto

                    px-4
                    py-5

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  <p
                    className="
                      mb-3
                      px-3

                      text-[9px]
                      font-extrabold
                      uppercase
                      tracking-[0.16em]

                      text-slate-400
                    "
                  >
                    Navigation
                  </p>

                  <ul className="space-y-1">
                    {navLinks.map(
                      (
                        link
                      ) => (
                        <li
                          key={
                            link.href
                          }
                        >
                          <SheetClose
                            asChild
                          >
                            <Link
                              href={
                                link.href
                              }
                              className={`
                                flex
                                min-h-11
                                items-center

                                rounded-xl

                                px-3

                                text-[13px]
                                font-semibold

                                transition-all

                                ${
                                  isActiveLink(
                                    link.href
                                  )
                                    ? "bg-white text-[#1F5EA8] shadow-sm"
                                    : "text-[#526172] hover:bg-white/70 hover:text-[#1F5EA8]"
                                }
                              `}
                            >
                              {
                                link.name
                              }
                            </Link>
                          </SheetClose>
                        </li>
                      )
                    )}

                    {/* =======================================
                        MOBILE AUTH LOGIC
                    ======================================== */}

                    {!loadingUser &&
                      user && (
                        <li>
                          <SheetClose
                            asChild
                          >
                            <Link
                              href="/dashboard"
                              className={`
                                mt-1
                                flex
                                min-h-11
                                items-center
                                gap-2

                                rounded-xl

                                px-3

                                text-[13px]
                                font-bold

                                transition-all

                                ${
                                  pathname.startsWith(
                                    "/dashboard"
                                  )
                                    ? "bg-[#EAF4FE] text-[#1F5EA8]"
                                    : "text-[#1F5EA8] hover:bg-[#EAF4FE]"
                                }
                              `}
                            >
                              <LayoutDashboard className="h-4 w-4" />

                              {
                                dashboardLabel
                              }
                            </Link>
                          </SheetClose>
                        </li>
                      )}

                    {!loadingUser &&
                      !user &&
                      !isAuthRoute && (
                        <li>
                          <SheetClose
                            asChild
                          >
                            <Link
                              href="/login"
                              className="
                                mt-1

                                flex
                                min-h-11
                                items-center
                                gap-2

                                rounded-xl

                                px-3

                                text-[13px]
                                font-bold
                                text-[#334155]

                                transition-all

                                hover:bg-white
                                hover:text-[#1F5EA8]
                              "
                            >
                              <LogIn className="h-4 w-4" />

                              Login
                            </Link>
                          </SheetClose>
                        </li>
                      )}
                  </ul>
                </div>

                {/* ===========================================
                    MOBILE BOTTOM ACTION
                ============================================ */}

                <div
                  className="
                    border-t
                    border-black/[0.05]

                    bg-white/40

                    p-4
                  "
                >
                  {loadingUser ? (
                    <div
                      className="
                        flex
                        h-12
                        items-center
                        justify-center
                      "
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-[#1F5EA8]" />
                    </div>
                  ) : user ? (
                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      disabled={
                        loggingOut
                      }
                      className="
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2

                        rounded-xl

                        border
                        border-rose-200

                        bg-white

                        text-sm
                        font-bold
                        text-rose-600

                        transition-all

                        hover:border-rose-300
                        hover:bg-rose-50

                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {loggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}

                      {loggingOut
                        ? "Logging out..."
                        : "Logout"}
                    </button>
                  ) : (
                    <SheetClose
                      asChild
                    >
                      <Link
                        href="/register"
                        className="
                          group

                          flex
                          h-12
                          w-full
                          items-center
                          justify-center
                          gap-2

                          rounded-xl

                          bg-[#1A202C]

                          text-sm
                          font-bold
                          text-white

                          shadow-[0_10px_25px_rgba(26,32,44,0.15)]

                          transition-all

                          hover:bg-[#1F5EA8]
                        "
                      >
                        <WalletCards className="h-4 w-4" />

                        Open Wallet

                        <ArrowRight
                          className="
                            h-4
                            w-4

                            transition-transform

                            group-hover:translate-x-1
                          "
                        />
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* ===============================================
              BRAND LOGO
          ================================================ */}

          <motion.div
            whileHover={{
              scale: 1.025,
            }}
            whileTap={{
              scale: 0.975,
            }}
            transition={{
              type:
                "spring",

              stiffness:
                350,

              damping:
                20,
            }}
          >
            <Link
              href="/"
              aria-label="Coffer home"
              className="
                group
                flex
                items-center
                gap-2.5
              "
            >
              <BrandLogo />

              <div className="hidden xs:block">
                <span
                  className="
                    font-serif
                    text-xl
                    font-semibold
                    tracking-wide
                    text-[#1A202C]
                  "
                >
                  Coffer
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ===================================================
            CENTER — DESKTOP NAVIGATION
        ==================================================== */}

        <motion.ul
          variants={
            navContainerVariants
          }
          initial="hidden"
          animate="visible"
          className="
            hidden

            items-center
            justify-center
            gap-1

            rounded-2xl

            border
            border-black/[0.035]

            bg-white/35

            p-1

            text-[13px]
            font-semibold
            text-[#536173]

            lg:flex

            xl:gap-2
          "
        >
          {/* Standard nav links */}

          {navLinks.map(
            (link) => {
              const active =
                isActiveLink(
                  link.href
                );

              return (
                <motion.li
                  key={
                    link.href
                  }
                  variants={
                    navItemVariants
                  }
                >
                  <Link
                    href={
                      link.href
                    }
                    className={`
                      relative

                      flex
                      h-9
                      items-center

                      rounded-xl

                      px-3

                      transition-all
                      duration-300

                      xl:px-4

                      ${
                        active
                          ? "bg-white text-[#1F5EA8] shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
                          : "hover:bg-white/70 hover:text-[#1F5EA8]"
                      }
                    `}
                  >
                    {
                      link.name
                    }

                    {active && (
                      <motion.span
                        layoutId="public-navbar-active"
                        className="
                          absolute
                          -bottom-[5px]
                          left-1/2

                          h-[2px]
                          w-4

                          -translate-x-1/2

                          rounded-full

                          bg-[#1F5EA8]
                        "
                      />
                    )}
                  </Link>
                </motion.li>
              );
            }
          )}

          {/* ===============================================
              CENTER AUTH CONDITION
          ================================================ */}

          <AnimatePresence
            mode="wait"
          >
            {!loadingUser &&
              user && (
                <motion.li
                  key="dashboard-link"
                  initial={{
                    opacity: 0,
                    scale:
                      0.92,
                    x: -5,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale:
                      0.92,
                  }}
                  transition={{
                    duration:
                      0.25,
                  }}
                >
                  <Link
                    href="/dashboard"
                    className={`
                      group

                      flex
                      h-9
                      items-center
                      gap-1.5

                      rounded-xl

                      px-3

                      font-bold

                      transition-all

                      xl:px-4

                      ${
                        pathname.startsWith(
                          "/dashboard"
                        )
                          ? "bg-[#EAF4FE] text-[#1F5EA8]"
                          : "text-[#1F5EA8] hover:bg-[#EAF4FE]"
                      }
                    `}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />

                    {
                      dashboardLabel
                    }
                  </Link>
                </motion.li>
              )}

            {!loadingUser &&
              !user &&
              !isAuthRoute && (
                <motion.li
                  key="login-link"
                  initial={{
                    opacity: 0,
                    scale:
                      0.92,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale:
                      0.92,
                  }}
                  transition={{
                    duration:
                      0.25,
                  }}
                >
                  <Link
                    href="/login"
                    className="
                      group

                      flex
                      h-9
                      items-center
                      gap-1.5

                      rounded-xl

                      px-3

                      font-bold
                      text-[#27364A]

                      transition-all

                      hover:bg-white
                      hover:text-[#1F5EA8]

                      xl:px-4
                    "
                  >
                    <LogIn className="h-3.5 w-3.5" />

                    Login
                  </Link>
                </motion.li>
              )}
          </AnimatePresence>
        </motion.ul>

        {/* ===================================================
            RIGHT — PRIMARY AUTH ACTION
        ==================================================== */}

        <div
          className="
            relative
            z-10

            flex
            min-w-0
            items-center
            justify-end
          "
        >
          <AnimatePresence
            mode="wait"
          >
            {loadingUser ? (
              <motion.div
                key="loading"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="
                  flex
                  h-10
                  min-w-[110px]
                  items-center
                  justify-center
                "
              >
                <Loader2 className="h-4 w-4 animate-spin text-[#1F5EA8]" />
              </motion.div>
            ) : user ? (
              /* =============================================
                 AUTHENTICATED → LOGOUT
              ============================================== */

              <motion.button
                key="logout"
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                initial={{
                  opacity: 0,
                  x: 8,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: 8,
                  scale:
                    0.96,
                }}
                whileHover={
                  loggingOut
                    ? undefined
                    : {
                        y: -2,
                      }
                }
                whileTap={{
                  scale:
                    0.97,
                }}
                className="
                  group

                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2

                  rounded-[14px]

                  border
                  border-rose-200

                  bg-white

                  px-3.5

                  text-xs
                  font-bold
                  text-rose-600

                  shadow-[0_6px_20px_rgba(225,29,72,0.06)]

                  transition-all

                  hover:border-rose-300
                  hover:bg-rose-50
                  hover:shadow-[0_10px_24px_rgba(225,29,72,0.10)]

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  sm:px-4
                "
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    <span className="hidden sm:inline">
                      Logging out...
                    </span>
                  </>
                ) : (
                  <>
                    <LogOut
                      className="
                        h-4
                        w-4

                        transition-transform

                        group-hover:-translate-x-0.5
                      "
                    />

                    <span>
                      Logout
                    </span>
                  </>
                )}
              </motion.button>
            ) : (
              /* =============================================
                 UNAUTHENTICATED → OPEN WALLET
              ============================================== */

              <motion.div
                key="open-wallet"
                initial={{
                  opacity: 0,
                  x: 8,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: 8,
                  scale:
                    0.96,
                }}
              >
                <Link
                  href="/register"
                  className="
                    group
                    relative

                    flex
                    h-11
                    items-center
                    justify-center
                    gap-2

                    overflow-hidden

                    rounded-[14px]

                    bg-[#1A202C]

                    px-3.5

                    text-xs
                    font-bold
                    text-white

                    shadow-[0_8px_24px_rgba(26,32,44,0.15)]

                    transition-all

                    hover:-translate-y-0.5
                    hover:bg-[#1F5EA8]
                    hover:shadow-[0_12px_28px_rgba(31,94,168,0.20)]

                    sm:px-4
                  "
                >
                  {/* Button light sweep */}

                  <span
                    className="
                      absolute
                      -left-8
                      top-0

                      h-full
                      w-12

                      -skew-x-12

                      bg-white/10

                      transition-transform
                      duration-700

                      group-hover:translate-x-[180px]
                    "
                  />

                  <WalletCards className="relative h-4 w-4" />

                  <span className="relative hidden sm:inline">
                    Open Wallet
                  </span>

                  <span className="relative sm:hidden">
                    Join
                  </span>

                  <ArrowRight
                    className="
                      relative
                      h-4
                      w-4

                      transition-transform
                      duration-300

                      group-hover:translate-x-1
                    "
                  />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.header>
  );
}

/* =========================================================
   BRAND LOGO
========================================================= */

function BrandLogo() {
  return (
    <motion.div
      whileHover={{
        rotate: -4,
      }}
      transition={{
        type:
          "spring",

        stiffness:
          300,

        damping:
          18,
      }}
      className="
        relative

        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center

        overflow-hidden

        rounded-[13px]

        border
        border-black/[0.05]

        bg-white

        shadow-[0_6px_18px_rgba(15,23,42,0.06)]
      "
    >
      {/* decorative glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-3
          -top-3

          h-7
          w-7

          rounded-full

          bg-blue-500/10

          blur-lg
        "
      />

      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={
          PRIMARY
        }
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />

        <path d="M12 4v16" />

        <path d="M12 4c4.418 0 8 3.582 8 8s-3.582 8-8 8" />

        <path d="M10 4h4" />
      </svg>

      <motion.span
        animate={{
          opacity: [
            0.3,
            0.8,
            0.3,
          ],
        }}
        transition={{
          duration: 2.5,
          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          absolute
          bottom-[5px]
          right-[5px]

          h-1.5
          w-1.5

          rounded-full

          bg-[#1F5EA8]

          shadow-[0_0_7px_rgba(31,94,168,0.8)]
        "
      />
    </motion.div>
  );
}