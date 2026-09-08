"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  WalletCards,
  Send,
  Download,
  ReceiptText,
  FileCheck2,
  Sparkles,
  PieChart,
  TrendingUp,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
} from "lucide-react";

import { motion } from "framer-motion";

/* =========================================================
   FIXED COFFER BRAND PALETTE
========================================================= */

const BRAND = {
  midnight: "#0f0c1b",
  indigo: "#130f26",
  violet: "#2e1f4f",
  purple: "#3b2368",
  highlight: "#5b3a8f",
} as const;

const TEXT_STRONG = BRAND.violet;
const ACCENT = BRAND.highlight;

/* =========================================================
   NAVIGATION
========================================================= */

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: WalletCards,
  },
  {
    label: "Send Money",
    href: "/dashboard/send",
    icon: Send,
  },
  {
    label: "Receive Money",
    href: "/dashboard/receive",
    icon: Download,
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  {
    label: "KYC",
    href: "/dashboard/kyc",
    icon: FileCheck2,
  },
  {
    label: "AI Insights",
    href: "/dashboard/insights",
    icon: Sparkles,
  },
  {
    label: "Budgeting",
    href: "/dashboard/budgeting",
    icon: PieChart,
  },
  {
    label: "Cash Flow",
    href: "/dashboard/cash-flow",
    icon: TrendingUp,
  },
  {
    label: "Receipts",
    href: "/dashboard/receipts",
    icon: Receipt,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

/* =========================================================
   PROPS
========================================================= */

interface UserSidebarProps {
  onLogout: () => void;
}

/* =========================================================
   USER SIDEBAR
========================================================= */

export default function UserSidebar({
  onLogout,
}: UserSidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: -20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative
        flex
        h-dvh
        min-h-dvh
        w-full
        flex-col
        overflow-hidden

        border-r
        border-sidebar-border
        dark:border-white/10

        bg-sidebar
        dark:bg-[#070B14]

        text-sidebar-foreground
        dark:text-slate-100

        transition-colors
        duration-300
      "
      style={{
        boxShadow:
          "10px 0 45px rgba(15, 12, 27, 0.18)",
      }}
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          top-12
          h-64
          w-64
          rounded-full
          blur-[100px]
        "
        style={{
          background:
            "var(--dashboard-primary)",
          opacity: 0.1,
        }}
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          bottom-24
          h-64
          w-64
          rounded-full
          blur-[100px]
        "
        style={{
          background:
            "var(--dashboard-primary-violet)",
          opacity: 0.1,
        }}
      />

      {/* =====================================================
          BRAND
      ====================================================== */}

      <div
        className="
          relative
          z-20
          flex
          h-[76px]
          shrink-0
          items-center

          border-b
          border-sidebar-border
          dark:border-white/10

          px-5

          transition-colors
          duration-300
        "
      >
        <Link
          href="/dashboard"
          className="
            group
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          {/* COFFER ICON */}

          <motion.div
            whileHover={{
              scale: 1.06,
              rotate: -4,
            }}
            whileTap={{
              scale: 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 18,
            }}
            className="
              relative
              z-20
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-[14px]
              text-white
            "
            style={{
              background:
                "linear-gradient(135deg, #0f0c1b 0%, #130f26 42%, #2e1f4f 72%, #3b2368 100%)",

              boxShadow:
                "0 12px 30px rgba(59,35,104,0.35)",
            }}
          >
            <span
              className="
                pointer-events-none
                absolute
                inset-0
                z-0
              "
              style={{
                background:
                  "radial-gradient(circle at 80% 85%, rgba(109,63,214,0.45), transparent 45%)",
              }}
            />

            <span
              className="
                pointer-events-none
                absolute
                inset-x-0
                top-0
                z-0
                h-1/2
              "
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.16), transparent)",
              }}
            />

            <WalletCards
              className="
                relative
                z-20
                h-[21px]
                w-[21px]
                shrink-0
              "
              strokeWidth={2.2}
            />
          </motion.div>

          {/* BRAND TEXT */}

          <div className="min-w-0">
            <h1
              className="
                truncate
                text-[18px]
                font-black
                tracking-[-0.03em]

                text-[#2e1f4f]
                dark:text-slate-100
              "
            >
              Coffer
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5">
              <motion.span
                animate={{
                  opacity: [0.55, 1, 0.55],
                  scale: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: ACCENT,
                  boxShadow:
                    "0 0 10px rgba(91,58,143,0.65)",
                }}
              />

              <span
                className="
                  text-[8px]
                  font-extrabold
                  uppercase
                  tracking-[0.22em]
                  text-[#5b3a8f]
                  dark:text-violet-300
                "
              >
                User Portal
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div
        className="
          relative
          z-10
          min-h-0
          flex-1
          overflow-y-auto
          overscroll-contain

          px-3.5
          py-5

          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        <div className="px-2.5">
          <p
            className="
              mb-3
              text-[9px]
              font-extrabold
              uppercase
              tracking-[0.18em]

              text-slate-500
              dark:text-slate-500
            "
          >
            Main Menu
          </p>
        </div>

        <nav className="space-y-1 pb-4">
          {navItems.map(
            (
              item,
              index
            ) => {
              const Icon = item.icon;

              const active =
                item.href ===
                "/dashboard"
                  ? pathname ===
                    "/dashboard"
                  : pathname.startsWith(
                      item.href
                    );

              return (
                <motion.div
                  key={
                    item.href
                  }
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.32,
                    delay:
                      0.04 +
                      index *
                        0.025,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                >
                  <Link
                    href={
                      item.href
                    }
                    className={`
                      group
                      relative
                      flex
                      min-h-[48px]
                      items-center
                      gap-2.5
                      overflow-hidden
                      rounded-[14px]
                      px-2.5
                      py-1.5
                      text-[13px]
                      font-bold
                      transition-all
                      duration-300

                      ${
                        active
                          ? "text-[#5b3a8f] dark:text-violet-300"
                          : "text-slate-600 dark:text-slate-300 hover:text-[#3b2368] dark:hover:text-white"
                      }
                    `}
                  >
                    {/* ACTIVE BACKGROUND */}

                    {active && (
                      <motion.span
                        layoutId="user-sidebar-active"
                        transition={{
                          type:
                            "spring",
                          stiffness:
                            300,
                          damping:
                            28,
                        }}
                        className="
                          absolute
                          inset-0
                          rounded-[14px]

                          bg-violet-50/80
                          dark:bg-violet-500/[0.10]

                          border
                          border-violet-100
                          dark:border-violet-400/20
                        "
                      />
                    )}

                    {/* HOVER BACKGROUND */}

                    {!active && (
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-[14px]

                          bg-slate-900/[0.035]
                          dark:bg-white/[0.06]

                          opacity-0

                          transition-all
                          duration-300

                          group-hover:opacity-100
                        "
                      />
                    )}

                    {/* ACTIVE LEFT LINE */}

                    {active && (
                      <motion.span
                        layoutId="user-sidebar-light"
                        className="
                          absolute
                          left-0
                          top-1/2
                          h-7
                          w-[3px]
                          -translate-y-1/2
                          rounded-r-full
                        "
                        style={{
                          background:
                            "linear-gradient(180deg, #5b3a8f, #8b5cf6)",
                          boxShadow:
                            "0 0 15px rgba(109,63,214,0.55)",
                        }}
                      />
                    )}

                    {/* ICON */}

                    <motion.span
                      whileHover={{
                        scale: 1.08,
                      }}
                      transition={{
                        type:
                          "spring",
                        stiffness:
                          350,
                        damping: 20,
                      }}
                      className={`
                        relative
                        z-10
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-[11px]
                        transition-all
                        duration-300

                        ${
                          active
                            ? "bg-violet-100/70 dark:bg-violet-500/[0.14]"
                            : "bg-transparent"
                        }
                      `}
                      style={{
                        color: active
                          ? undefined
                          : undefined,
                      }}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={
                          active
                            ? 2.2
                            : 1.9
                        }
                      />
                    </motion.span>

                    {/* LABEL */}

                    <span
                      className="
                        relative
                        z-10
                        min-w-0
                        flex-1
                        truncate
                      "
                    >
                      {
                        item.label
                      }
                    </span>

                    {/* ACTIVE ARROW */}

                    {active && (
                      <motion.span
                        initial={{
                          opacity: 0,
                          x: -5,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        className="
                          relative
                          z-10
                        "
                      >
                        <ChevronRight
                          className="
                            h-4
                            w-4
                            text-[#5b3a8f]
                            dark:text-violet-300
                          "
                        />
                      </motion.span>
                    )}
                  </Link>
                </motion.div>
              );
            }
          )}
        </nav>
      </div>

      {/* =====================================================
          LOGOUT
      ====================================================== */}

      <div
        className="
          relative
          z-20
          shrink-0

          border-t
          border-sidebar-border
          dark:border-white/10

          bg-sidebar
          dark:bg-[#070B14]

          p-3.5

          transition-colors
          duration-300
        "
      >
        <motion.button
          type="button"
          onClick={
            onLogout
          }
          whileTap={{
            scale: 0.98,
          }}
          className="
            group
            relative
            flex
            w-full
            items-center
            gap-2.5
            overflow-hidden
            rounded-[14px]
            px-2.5
            py-2
            text-[13px]
            font-bold

            text-slate-600
            dark:text-slate-300

            transition-all
            duration-300

            hover:text-rose-500
            dark:hover:text-rose-400
          "
        >
          <span
            className="
              absolute
              inset-0
              rounded-[14px]
              bg-rose-500/[0.08]
              dark:bg-rose-500/[0.12]
              opacity-0
              transition-opacity
              duration-300
              group-hover:opacity-100
            "
          />

          <span
            className="
              relative
              z-10
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-[11px]

              transition-all
              duration-300

              group-hover:scale-105
              group-hover:bg-rose-500/10
            "
          >
            <LogOut
              className="
                h-[18px]
                w-[18px]

                text-slate-500
                dark:text-slate-300

                group-hover:text-rose-500
                dark:group-hover:text-rose-400
              "
            />
          </span>

          <span className="relative z-10">
            Sign Out
          </span>
        </motion.button>
      </div>
    </motion.aside>
  );
}