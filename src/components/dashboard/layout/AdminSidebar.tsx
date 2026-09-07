"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Activity,
  Settings,
  Banknote,
  LogOut,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  MessageSquareWarning,
  Lock,
  Percent,
} from "lucide-react";

import { motion } from "framer-motion";

/* =========================================================
   ADMIN NAVIGATION
========================================================= */

const adminNavItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "User Management",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "KYC Approvals",
    href: "/dashboard/kyc-requests",
    icon: ShieldAlert,
  },
  {
    label: "System Transactions",
    href: "/dashboard/all-transactions",
    icon: Banknote,
  },
  {
    label: "Analytics & Reports",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Support Tickets",
    href: "/dashboard/support",
    icon: MessageSquareWarning,
  },
  {
    label: "Fee & Revenue",
    href: "/dashboard/revenue",
    icon: Percent,
  },
  {
    label: "Security & Audits",
    href: "/dashboard/security",
    icon: Lock,
  },
  {
    label: "System Logs",
    href: "/dashboard/logs",
    icon: Activity,
  },
  {
    label: "Platform Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
];

/* =========================================================
   PROPS
========================================================= */

interface AdminSidebarProps {
  onLogout: () => void;
}

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

export default function AdminSidebar({
  onLogout,
}: AdminSidebarProps) {
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
        border-sidebar-border

        bg-sidebar
        text-sidebar-foreground

        shadow-[15px_0_50px_rgba(2,8,18,0.08)]

        transition-colors
        duration-300
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          top-20
          h-60
          w-60
          rounded-full
          blur-[90px]
        "
        style={{
          background:
            "var(--dashboard-primary)",
          opacity: 0.07,
        }}
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          bottom-20
          h-60
          w-60
          rounded-full
          blur-[90px]
        "
        style={{
          background:
            "var(--dashboard-primary)",
          opacity: 0.045,
        }}
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
          border-sidebar-border

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

              text-white

              shadow-[0_10px_30px_rgba(99,80,220,0.24)]
            "
            style={{
              background:
                "linear-gradient(135deg, var(--dashboard-primary), color-mix(in srgb, var(--dashboard-primary) 60%, #6d28d9))",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

            <ShieldCheck className="relative z-10 h-[21px] w-[21px]" />
          </motion.div>

          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-black tracking-[-0.03em] text-sidebar-foreground">
              Admin Panel
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  shadow-[0_0_9px_rgba(129,140,248,0.9)]
                "
                style={{
                  background:
                    "var(--dashboard-primary)",
                }}
              />

              <span
                className="
                  text-[8px]
                  font-extrabold
                  uppercase
                  tracking-[0.22em]
                "
                style={{
                  color:
                    "var(--dashboard-primary)",
                }}
              >
                System Control
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
              text-muted-foreground
            "
          >
            Management
          </p>
        </div>

        <nav className="space-y-1 pb-4">
          {adminNavItems.map(
            (item, index) => {
              const Icon = item.icon;

              const active =
                item.href === "/dashboard"
                  ? pathname ===
                    "/dashboard"
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
                    className="
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
                    "
                    style={{
                      color: active
                        ? "var(--dashboard-primary)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {/* =================================================
                        ACTIVE BACKGROUND
                    ================================================== */}

                    {active && (
                      <motion.span
                        layoutId="admin-sidebar-active"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 28,
                        }}
                        className="
                          absolute
                          inset-0

                          rounded-[14px]
                        "
                        style={{
                          background:
                            "var(--dashboard-primary-soft)",
                          border:
                            "1px solid var(--border)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.035)",
                        }}
                      />
                    )}

                    {/* =================================================
                        HOVER BACKGROUND
                    ================================================== */}

                    {!active && (
                      <span
                        className="
                          absolute
                          inset-0

                          rounded-[14px]

                          bg-foreground/[0.035]

                          opacity-0

                          transition-opacity
                          duration-300

                          group-hover:opacity-100
                        "
                      />
                    )}

                    {/* =================================================
                        ACTIVE LEFT GLOW
                    ================================================== */}

                    {active && (
                      <motion.span
                        layoutId="admin-sidebar-light"
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
                            "var(--dashboard-primary)",
                          boxShadow:
                            "0 0 15px color-mix(in srgb, var(--dashboard-primary) 70%, transparent)",
                        }}
                      />
                    )}

                    {/* =================================================
                        ICON
                    ================================================== */}

                    <motion.span
                      whileHover={{
                        scale: 1.08,
                      }}
                      className="
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
                      "
                      style={{
                        background: active
                          ? "var(--dashboard-primary-soft)"
                          : "transparent",

                        color: active
                          ? "var(--dashboard-primary)"
                          : "var(--muted-foreground)",

                        boxShadow: active
                          ? "0 5px 16px color-mix(in srgb, var(--dashboard-primary) 12%, transparent)"
                          : "none",
                      }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </motion.span>

                    {/* =================================================
                        LABEL
                    ================================================== */}

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

                    {/* =================================================
                        ACTIVE ARROW
                    ================================================== */}

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
                        <ChevronRight
                          className="h-4 w-4"
                          style={{
                            color:
                              "var(--dashboard-primary)",
                          }}
                        />
                      </motion.span>
                    )}
                  </Link>
                </motion.div>
              );
            }
          )}
        </nav>

        <div className="h-4" />
      </div>

      {/* =====================================================
          SECURE LOGOUT
      ====================================================== */}

      <div
        className="
          relative
          z-20
          shrink-0

          border-t
          border-sidebar-border

          bg-sidebar

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

            transition-all
            duration-300

            hover:text-rose-500
          "
          style={{
            color:
              "var(--muted-foreground)",
          }}
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

              transition-all
              duration-300

              group-hover:scale-105
              group-hover:bg-rose-500/10
              group-hover:text-rose-400
            "
            style={{
              color:
                "var(--muted-foreground)",
            }}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </span>

          <span className="relative z-10">
            Secure Logout
          </span>
        </motion.button>
      </div>
    </motion.aside>
  );
}