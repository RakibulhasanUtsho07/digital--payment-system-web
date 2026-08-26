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
        x: -22,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative
        flex
        h-dvh
        w-[280px]
        min-h-0
        flex-col
        overflow-hidden
        border-r
        border-white/[0.05]
        bg-[#08111D]
        text-slate-300
        shadow-[15px_0_50px_rgba(2,8,18,0.15)]
      "
    >
      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          top-20
          h-56
          w-56
          rounded-full
          bg-blue-500/[0.06]
          blur-[80px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          bottom-24
          h-52
          w-52
          rounded-full
          bg-cyan-400/[0.04]
          blur-[80px]
        "
      />

      {/* =====================================================
          BRAND
      ====================================================== */}

      <div
        className="
          relative
          z-10
          flex
          h-[76px]
          shrink-0
          items-center
          border-b
          border-white/[0.06]
          px-5
        "
      >
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
        >
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
              flex
              h-11
              w-11
              items-center
              justify-center
              overflow-hidden
              rounded-[14px]
              bg-gradient-to-br
              from-[#51B7FF]
              via-[#2C86D5]
              to-[#175590]
              text-white
              shadow-[0_10px_30px_rgba(46,139,220,0.22)]
            "
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

            <WalletCards className="relative z-10 h-[21px] w-[21px]" />
          </motion.div>

          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-black tracking-[-0.03em] text-white">
              NovaWallet
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4EA3E3] shadow-[0_0_8px_rgba(78,163,227,0.9)]" />

              <span className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-[#62B5EF]">
                User Portal
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* =====================================================
          SCROLLABLE NAVIGATION
      ====================================================== */}

      <div
        className="
          relative
          z-10
          min-h-0
          flex-1
          overflow-y-auto
          overscroll-contain
          scroll-smooth
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
              text-slate-600
            "
          >
            Main Menu
          </p>
        </div>

        <nav className="space-y-1 pb-4">
          {navItems.map(
            (item, index) => {
              const Icon = item.icon;

              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(
                      item.href
                    );

              return (
                <motion.div
                  key={item.href}
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
                      index * 0.025,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                >
                  <Link
                    href={item.href}
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

                      transition-colors
                      duration-300

                      ${
                        active
                          ? "text-white"
                          : "text-[#8393A7] hover:text-slate-100"
                      }
                    `}
                  >
                    {/* Active animated background */}

                    {active && (
                      <motion.span
                        layoutId="user-sidebar-active"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 28,
                        }}
                        className="
                          absolute
                          inset-0
                          rounded-[14px]
                          border
                          border-[#3C8FD4]/20
                          bg-gradient-to-r
                          from-[#142A44]
                          via-[#11243B]
                          to-[#0E1D30]
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]
                        "
                      />
                    )}

                    {/* Hover background */}

                    {!active && (
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-[14px]
                          bg-white/[0.035]
                          opacity-0
                          transition-opacity
                          duration-300
                          group-hover:opacity-100
                        "
                      />
                    )}

                    {/* Active side light */}

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
                          bg-[#56B4F2]
                          shadow-[0_0_14px_rgba(86,180,242,0.75)]
                        "
                      />
                    )}

                    {/* Icon */}

                    <motion.span
                      whileHover={{
                        scale: 1.08,
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
                            ? "bg-[#1A3B61] text-[#62B9F2] shadow-[0_5px_15px_rgba(18,67,110,0.28)]"
                            : "bg-transparent text-[#62758C] group-hover:bg-white/[0.045] group-hover:text-[#B6C4D3]"
                        }
                      `}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </motion.span>

                    <span
                      className="
                        relative
                        z-10
                        min-w-0
                        flex-1
                        truncate
                      "
                    >
                      {item.label}
                    </span>

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
                        className="relative z-10"
                      >
                        <ChevronRight className="h-4 w-4 text-[#58ADE6]" />
                      </motion.span>
                    )}
                  </Link>
                </motion.div>
              );
            }
          )}
        </nav>

        {/* bottom breathing room */}

        <div className="h-4" />
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
          border-white/[0.06]
          bg-[#060D16]/95
          p-3.5
          backdrop-blur-xl
        "
      >
        <motion.button
          type="button"
          onClick={onLogout}
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
            text-[#78899D]

            transition-all
            duration-300

            hover:text-rose-300
          "
        >
          <span
            className="
              absolute
              inset-0
              rounded-[14px]
              bg-rose-500/[0.08]
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

              text-[#67798F]

              transition-all
              duration-300

              group-hover:scale-105
              group-hover:bg-rose-500/10
              group-hover:text-rose-400
            "
          >
            <LogOut className="h-[18px] w-[18px]" />
          </span>

          <span className="relative z-10">
            Sign Out
          </span>
        </motion.button>
      </div>
    </motion.aside>
  );
}