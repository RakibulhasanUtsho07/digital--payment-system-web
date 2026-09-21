"use client";

import {
  useEffect,
  useState,
  type ElementType,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  FileBarChart,
  FileSearch,
  Gauge,
  GitCompareArrows,
  Landmark,
  Loader2,
  LogOut,
  ReceiptText,
  RefreshCcw,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

/* =========================================================
   PROPS
========================================================= */

interface AnalystSidebarProps {
  onLogout:
    () => void | Promise<void>;

  onClose?:
    () => void;
}

/* =========================================================
   NAV TYPES
========================================================= */

interface NavItem {
  label:
    string;

  href:
    string;

  icon:
    ElementType;

  available:
    boolean;
}

interface NavSectionData {
  title:
    string;

  items:
    NavItem[];
}

/* =========================================================
   ANALYST NAVIGATION
========================================================= */

const sections:
  NavSectionData[] = [
    {
      title:
        "Command Center",

      items: [
        {
          label:
            "Executive Overview",

          href:
            "/dashboard/analyst",

          icon:
            Gauge,

          available:
            true,
        },

        {
          label:
            "Live Platform Pulse",

          href:
            "/dashboard/analyst/live",

          icon:
            Activity,

          available:
            true,
        },

        {
          label:
            "AI Intelligence",

          href:
            "/dashboard/analyst/intelligence",

          icon:
            BrainCircuit,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Performance",

      items: [
        {
          label:
            "Payments",

          href:
            "/dashboard/analyst/payments",

          icon:
            CircleDollarSign,

          available:
            true,
        },

        {
          label:
            "Transactions",

          href:
            "/dashboard/analyst/transactions",

          icon:
            GitCompareArrows,

          available:
            true,
        },

        {
          label:
            "Conversion",

          href:
            "/dashboard/analyst/conversion",

          icon:
            TrendingUp,

          available:
            true,
        },

        {
          label:
            "Revenue",

          href:
            "/dashboard/analyst/revenue",

          icon:
            BarChart3,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Business & Platform",

      items: [
        {
          label:
            "Merchants",

          href:
            "/dashboard/analyst/merchants",

          icon:
            Building2,

          available:
            true,
        },

        {
          label:
            "Users",

          href:
            "/dashboard/analyst/users",

          icon:
            Users,

          available:
            true,
        },

        {
          label:
            "Wallets",

          href:
            "/dashboard/analyst/wallets",

          icon:
            WalletCards,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Risk & Operations",

      items: [
        {
          label:
            "Risk & Fraud",

          href:
            "/dashboard/analyst/risk",

          icon:
            ShieldAlert,

          available:
            true,
        },

        {
          label:
            "Refunds",

          href:
            "/dashboard/analyst/refunds",

          icon:
            RefreshCcw,

          available:
            true,
        },

        {
          label:
            "Disputes",

          href:
            "/dashboard/analyst/disputes",

          icon:
            FileSearch,

          available:
            true,
        },

        {
          label:
            "Settlement",

          href:
            "/dashboard/analyst/settlement",

          icon:
            Landmark,

          available:
            true,
        },

        {
          label:
            "Payouts",

          href:
            "/dashboard/analyst/payouts",

          icon:
            WalletCards,

          available:
            true,
        },

        {
          label:
            "Compliance",

          href:
            "/dashboard/analyst/compliance",

          icon:
            ShieldCheck,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Reporting",

      items: [
        {
          label:
            "Report Builder",

          href:
            "/dashboard/analyst/reports",

          icon:
            FileBarChart,

          available:
            true,
        },

        {
          label:
            "Saved Views",

          href:
            "/dashboard/analyst/saved-views",

          icon:
            ReceiptText,

          available:
            true,
        },

        {
          label:
            "Export History",

          href:
            "/dashboard/analyst/exports",

          icon:
            WalletCards,

          available:
            true,
        },

        {
          label:
            "Settings",

          href:
            "/dashboard/analyst/settings",

          icon:
            Settings2,

          available:
            true,
        },
      ],
    },
  ];

/* =========================================================
   ACTIVE ROUTE
========================================================= */

function isActive(
  pathname:
    string,
  href:
    string
): boolean {
  if (
    href ===
    "/dashboard/analyst"
  ) {
    return (
      pathname ===
      href
    );
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AnalystSidebar({
  onLogout,
  onClose,
}: AnalystSidebarProps) {
  const pathname =
    usePathname();

  const [
    logoutModalOpen,
    setLogoutModalOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  useEffect(() => {
    if (!logoutModalOpen) {
      return;
    }

    const handleEscape = (
      event:
        KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape" &&
        !loggingOut
      ) {
        setLogoutModalOpen(
          false
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    logoutModalOpen,
    loggingOut,
  ]);

  const confirmLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        await onLogout();

        setLogoutModalOpen(
          false
        );
      } finally {
        setLoggingOut(
          false
        );
      }
    };

  return (
    <>
      <div
        className="
          analyst-sidebar-root
          relative
          flex
          h-full
          min-h-dvh
          w-full
          flex-col
          overflow-hidden
          border-r
          border-border
          bg-card
        "
      >
        {/* ===================================================
            VERY SUBTLE AMBIENT BACKGROUND
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
          "
        >
          <div className="analyst-sidebar-grid absolute inset-0" />

          <div
            className="
              absolute
              -right-24
              top-20
              h-52
              w-52
              rounded-full
              bg-[rgba(11,79,82,.055)]
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -left-24
              bottom-24
              h-52
              w-52
              rounded-full
              bg-[rgba(8,145,178,.04)]
              blur-3xl
            "
          />
        </div>

        {/* ===================================================
            BRAND
        ==================================================== */}

        <div
          className="
            relative
            z-10
            flex
            h-[76px]
            shrink-0
            items-center
            justify-between
            border-b
            border-border/80
            bg-card/88
            px-5
            backdrop-blur-xl
          "
        >
          <Link
            href="/dashboard/analyst"
            onClick={
              onClose
            }
            className="
              group
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <motion.div
              whileHover={{
                y: -1,
                rotate: 2,
              }}
              transition={{
                duration: 0.2,
              }}
              className="
                analyst-brand-icon
                relative
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                shadow-sm
              "
            >
              <BrainCircuit
                className="
                  h-5
                  w-5
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              />
            </motion.div>

            <div className="min-w-0">
              <p
                className="
                  analyst-accent-text
                  truncate
                  text-sm
                  font-extrabold
                  tracking-[-0.02em]
                "
              >
                Coffer Intelligence
              </p>

              <p
                className="
                  analyst-accent-muted
                  mt-0.5
                  truncate
                  text-[11px]
                  font-semibold
                "
              >
                Analyst Workspace
              </p>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={
                onClose
              }
              aria-label="Close analyst sidebar"
              className="
                rounded-xl
                border
                border-transparent
                p-2
                text-muted-foreground
                transition-all
                duration-200
                hover:border-border
                hover:bg-muted/70
                hover:text-foreground
                lg:hidden
              "
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ===================================================
            READ ONLY INFO — NO DARK/GREEN FILLED CARD
        ==================================================== */}

        <div
          className="
            relative
            z-10
            px-4
            pt-4
          "
        >
          <div
            className="
              analyst-info-strip
              flex
              items-center
              gap-3
              rounded-2xl
              border
              px-3
              py-3
            "
          >
            <motion.div
              animate={{
                y: [
                  0,
                  -2,
                  0,
                ],
              }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                analyst-info-icon
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
              "
            >
              <ShieldCheck className="h-4 w-4" />
            </motion.div>

            <div className="min-w-0">
              <p
                className="
                  analyst-accent-text
                  truncate
                  text-xs
                  font-extrabold
                "
              >
                Read-only intelligence
              </p>

              <p
                className="
                  analyst-accent-muted
                  mt-1
                  truncate
                  text-[10px]
                  font-semibold
                "
              >
                Gateway & wallet analytics
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <nav
          aria-label="Analyst navigation"
          className="
            analyst-sidebar-scroll
            relative
            z-10
            flex-1
            overflow-y-auto
            px-4
            py-5
          "
        >
          {sections.map(
            (
              section
            ) => (
              <div
                key={
                  section.title
                }
                className="
                  mb-6
                  last:mb-2
                "
              >
                <div
                  className="
                    mb-2
                    flex
                    items-center
                    gap-2
                    px-3
                  "
                >
                  <span
                    aria-hidden="true"
                    className="
                      analyst-section-dot
                      h-1
                      w-1
                      rounded-full
                    "
                  />

                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-muted-foreground/70
                    "
                  >
                    {
                      section.title
                    }
                  </p>

                  <span
                    aria-hidden="true"
                    className="
                      h-px
                      flex-1
                      bg-gradient-to-r
                      from-border
                      to-transparent
                    "
                  />
                </div>

                <div className="space-y-1">
                  {section.items.map(
                    (
                      item
                    ) => {
                      const Icon =
                        item.icon;

                      const active =
                        item.available &&
                        isActive(
                          pathname,
                          item.href
                        );

                      if (
                        !item.available
                      ) {
                        return (
                          <div
                            key={
                              item.href
                            }
                            aria-disabled="true"
                            title={`${item.label} is not completed yet`}
                            className="
                              flex
                              cursor-not-allowed
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-sm
                              font-semibold
                              text-muted-foreground/45
                            "
                          >
                            <Icon
                              className="
                                h-[18px]
                                w-[18px]
                                shrink-0
                              "
                            />

                            <span
                              className="
                                min-w-0
                                flex-1
                                truncate
                              "
                            >
                              {
                                item.label
                              }
                            </span>

                            <span
                              className="
                                rounded-md
                                bg-muted
                                px-1.5
                                py-0.5
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wide
                              "
                            >
                              Next
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          onClick={
                            onClose
                          }
                          aria-current={
                            active
                              ? "page"
                              : undefined
                          }
                          className={`
                            analyst-nav-link
                            group
                            relative
                            flex
                            items-center
                            gap-3
                            overflow-hidden
                            rounded-xl
                            border
                            px-3
                            py-2.5
                            text-sm
                            font-semibold
                            transition-all
                            duration-300
                            ease-out

                            ${
                              active
                                ? "analyst-nav-active border-[rgba(11,79,82,.22)] shadow-[0_10px_30px_rgba(11,79,82,.10)]"
                                : "analyst-nav-idle border-transparent"
                            }
                          `}
                        >
                          {active && (
                            <>
                              <motion.span
                                aria-hidden="true"
                                initial={{
                                  opacity: 0,
                                  scaleY:
                                    0.45,
                                }}
                                animate={{
                                  opacity: 1,
                                  scaleY: 1,
                                }}
                                transition={{
                                  duration:
                                    0.28,
                                }}
                                className="
                                  analyst-active-rail
                                  absolute
                                  inset-y-2
                                  left-0
                                  w-[3px]
                                  origin-center
                                  rounded-r-full
                                "
                              />

                              <motion.span
                                aria-hidden="true"
                                animate={{
                                  x: [
                                    "-130%",
                                    "240%",
                                  ],
                                }}
                                transition={{
                                  duration: 3.2,
                                  repeat:
                                    Infinity,
                                  repeatDelay:
                                    1.7,
                                  ease:
                                    "easeInOut",
                                }}
                                className="
                                  analyst-active-shine
                                  pointer-events-none
                                  absolute
                                  inset-y-0
                                  w-14
                                  -skew-x-12
                                  blur-md
                                "
                              />
                            </>
                          )}

                          <motion.span
                            whileHover={{
                              scale:
                                active
                                  ? 1.04
                                  : 1.02,
                            }}
                            className={`
                              analyst-nav-icon
                              relative
                              z-10
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              transition-all
                              duration-300

                              ${
                                active
                                  ? "analyst-nav-icon-active"
                                  : "analyst-nav-icon-idle"
                              }
                            `}
                          >
                            <Icon
                              className="
                                h-[17px]
                                w-[17px]
                              "
                            />
                          </motion.span>

                          <span
                            className="
                              analyst-route-text
                              relative
                              z-10
                              min-w-0
                              flex-1
                              truncate
                              transition-all
                              duration-300
                            "
                          >
                            {
                              item.label
                            }
                          </span>

                          {active && (
                            <motion.span
                              initial={{
                                opacity: 0,
                                scale: 0.7,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              transition={{
                                delay: 0.08,
                              }}
                              className="
                                analyst-active-dot
                                relative
                                z-10
                                ml-auto
                                h-2
                                w-2
                                shrink-0
                                rounded-full
                              "
                            />
                          )}
                        </Link>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </nav>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div
          className="
            relative
            z-10
            border-t
            border-border/80
            bg-card/90
            p-4
            backdrop-blur-xl
          "
        >
          {/* No filled teal/green card here */}
          <div
            className="
              analyst-footer-note
              mb-2
              flex
              items-center
              gap-2
              rounded-xl
              border
              px-3
              py-2.5
              text-[10px]
              font-bold
            "
          >
            <ShieldCheck
              className="
                h-4
                w-4
                shrink-0
              "
            />

            <span>
              No financial mutation access
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setLogoutModalOpen(
                true
              )
            }
            className="
              group
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-transparent
              px-3
              py-2.5
              text-sm
              font-semibold
              text-muted-foreground
              transition-all
              duration-200
              hover:border-border
              hover:bg-muted/70
              hover:text-foreground
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-muted/70
                transition-all
                duration-200
                group-hover:bg-muted
              "
            >
              <LogOut
                className="
                  h-[17px]
                  w-[17px]
                  transition-transform
                  duration-200
                  group-hover:-translate-x-0.5
                "
              />
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>

        {/* ===================================================
            LOCAL STYLES
        ==================================================== */}

        <style>{`
          .analyst-sidebar-root {
            --analyst-accent: #0B4F52;
            --analyst-accent-deep: #073346;
            --analyst-accent-navy: #10243A;
            --analyst-accent-cyan: #0891B2;
            --analyst-accent-soft: rgba(11,79,82,.075);
            --analyst-accent-soft-strong: rgba(11,79,82,.13);
            --analyst-accent-border: rgba(11,79,82,.18);
            --analyst-accent-text: #0B4F52;
            --analyst-accent-muted-text: rgba(11,79,82,.70);
          }

          :global(.dark) .analyst-sidebar-root {
            --analyst-accent-text: #67E8F9;
            --analyst-accent-muted-text: rgba(103,232,249,.66);
            --analyst-accent-soft: rgba(34,211,238,.07);
            --analyst-accent-soft-strong: rgba(34,211,238,.11);
            --analyst-accent-border: rgba(103,232,249,.17);
          }

          .analyst-sidebar-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
            overscroll-behavior: contain;
          }

          .analyst-sidebar-scroll::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          .analyst-sidebar-grid {
            opacity: .09;
            background-image:
              linear-gradient(rgba(11,79,82,.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(11,79,82,.07) 1px, transparent 1px);
            background-size: 30px 30px;
            mask-image: linear-gradient(
              to bottom,
              rgba(0,0,0,.55),
              rgba(0,0,0,.12) 46%,
              transparent 82%
            );
          }

          .analyst-accent-text,
          .analyst-route-text {
            color: var(--analyst-accent-text);
          }

          .analyst-accent-muted {
            color: var(--analyst-accent-muted-text);
          }

          .analyst-brand-icon {
            color: var(--analyst-accent-text);
            border-color: var(--analyst-accent-border);
            background: var(--analyst-accent-soft);
          }

          .analyst-brand-icon::after {
            content: "";
            position: absolute;
            inset: -1px;
            border-radius: 1rem;
            border: 1px solid var(--analyst-accent-border);
            opacity: .55;
            animation:
              analystBrandPulse
              2.8s
              ease-out
              infinite;
          }

          .analyst-info-strip,
          .analyst-footer-note {
            color: var(--analyst-accent-text);
            border-color: var(--analyst-accent-border);
            background: transparent;
          }

          .analyst-info-icon {
            color: var(--analyst-accent-text);
            border-color: var(--analyst-accent-border);
            background: var(--analyst-accent-soft);
          }

          .analyst-section-dot,
          .analyst-active-dot,
          .analyst-active-rail {
            background: var(--analyst-accent);
          }

          .analyst-nav-link {
            transform:
              translateZ(0);
            isolation:
              isolate;
          }

          .analyst-nav-idle {
            background: transparent;
          }

          /*
            IMPORTANT:
            Hover is intentionally neutral.
            No teal/green background is applied on hover.
          */
          .analyst-nav-idle:hover {
            background:
              color-mix(
                in srgb,
                var(--muted) 72%,
                transparent
              );
            border-color:
              color-mix(
                in srgb,
                var(--border) 74%,
                transparent
              );
            transform:
              translateX(2px);
          }

          .analyst-nav-idle:hover .analyst-route-text {
            color: var(--analyst-accent-text);
          }

          .analyst-nav-active {
            color: var(--analyst-accent-text);
            background:
              linear-gradient(
                90deg,
                var(--analyst-accent-soft-strong) 0%,
                var(--analyst-accent-soft) 52%,
                transparent 100%
              );
            transform:
              translateX(2px);
            animation:
              analystActiveBreath
              3.6s
              ease-in-out
              infinite;
          }

          .analyst-nav-active::after {
            content: "";
            pointer-events: none;
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 1px solid var(--analyst-accent-border);
            opacity: .72;
          }

          .analyst-nav-icon-idle {
            color: var(--analyst-accent-text);
            border-color:
              color-mix(
                in srgb,
                var(--border) 82%,
                transparent
              );
            background:
              color-mix(
                in srgb,
                var(--background) 70%,
                transparent
              );
          }

          .analyst-nav-idle:hover .analyst-nav-icon-idle {
            color: var(--analyst-accent-text);
            border-color: var(--analyst-accent-border);
            background: var(--muted);
          }

          .analyst-nav-icon-active {
            color: #ffffff;
            border-color:
              rgba(255,255,255,.12);
            background:
              linear-gradient(
                135deg,
                var(--analyst-accent-navy) 0%,
                var(--analyst-accent) 62%,
                var(--analyst-accent-deep) 100%
              );
            box-shadow:
              0 8px 20px rgba(11,79,82,.18);
          }

          .analyst-active-rail {
            box-shadow:
              0 0 10px rgba(11,79,82,.50);
            animation:
              analystRailPulse
              2.1s
              ease-in-out
              infinite;
          }

          .analyst-active-dot {
            box-shadow:
              0 0 0 0 rgba(11,79,82,.32);
            animation:
              analystDotPulse
              1.9s
              ease-out
              infinite;
          }

          .analyst-active-shine {
            z-index: 0;
            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(103,232,249,.12),
                transparent
              );
          }

          .analyst-footer-note {
            border-style: dashed;
          }

          @keyframes analystBrandPulse {
            0% {
              transform: scale(.95);
              opacity: .44;
            }

            75%,
            100% {
              transform: scale(1.14);
              opacity: 0;
            }
          }

          @keyframes analystActiveBreath {
            0%,
            100% {
              box-shadow:
                0 8px 24px rgba(11,79,82,.07);
            }

            50% {
              box-shadow:
                0 10px 30px rgba(11,79,82,.14);
            }
          }

          @keyframes analystRailPulse {
            0%,
            100% {
              opacity: .72;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes analystDotPulse {
            0% {
              box-shadow:
                0 0 0 0
                rgba(11,79,82,.30);
            }

            80%,
            100% {
              box-shadow:
                0 0 0 8px
                rgba(11,79,82,0);
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .analyst-brand-icon::after,
            .analyst-nav-active,
            .analyst-active-rail,
            .analyst-active-dot {
              animation:
                none !important;
            }

            .analyst-nav-link {
              transition:
                none !important;
            }
          }
        `}</style>
      </div>

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
          Full-screen analyst-teal blurred overlay.
          onLogout runs only after confirmation.
      ====================================================== */}

      <AnimatePresence>
        {logoutModalOpen && (
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
            transition={{
              duration: 0.18,
            }}
            className="
              fixed
              inset-0
              z-[9999]
              flex
              items-center
              justify-center
              overflow-hidden
              bg-[rgba(4,39,43,.46)]
              px-4
              backdrop-blur-[16px]
            "
            onMouseDown={() => {
              if (
                !loggingOut
              ) {
                setLogoutModalOpen(
                  false
                );
              }
            }}
          >
            {/* greenish/teal ambient blur — not standard green */}
            <motion.div
              aria-hidden="true"
              animate={{
                x: [
                  0,
                  22,
                  -8,
                  0,
                ],
                y: [
                  0,
                  -16,
                  8,
                  0,
                ],
                scale: [
                  1,
                  1.07,
                  0.98,
                  1,
                ],
              }}
              transition={{
                duration: 9,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
              className="
                pointer-events-none
                absolute
                -left-20
                top-[12%]
                h-72
                w-72
                rounded-full
                bg-[rgba(11,79,82,.46)]
                blur-[90px]
              "
            />

            <motion.div
              aria-hidden="true"
              animate={{
                x: [
                  0,
                  -18,
                  10,
                  0,
                ],
                y: [
                  0,
                  14,
                  -10,
                  0,
                ],
              }}
              transition={{
                duration: 11,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
              className="
                pointer-events-none
                absolute
                -right-24
                bottom-[10%]
                h-80
                w-80
                rounded-full
                bg-[rgba(8,145,178,.22)]
                blur-[105px]
              "
            />

            <motion.div
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
              transition={{
                duration: 0.23,
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
                max-w-[420px]
                overflow-hidden
                rounded-[28px]
                border
                border-white/20
                bg-card/96
                p-5
                text-card-foreground
                shadow-[0_35px_120px_rgba(2,26,30,.38)]
                backdrop-blur-2xl
                sm:p-6
              "
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-x-10
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-[rgba(103,232,249,.75)]
                  to-transparent
                "
              />

              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >
                <motion.div
                  initial={{
                    rotate: -8,
                    scale: 0.9,
                  }}
                  animate={{
                    rotate: 0,
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.05,
                    duration: 0.25,
                  }}
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-[rgba(11,79,82,.20)]
                    bg-[rgba(11,79,82,.08)]
                    text-[#0B4F52]
                    dark:text-cyan-200
                  "
                >
                  <LogOut className="h-5 w-5" />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-[#0B4F52]
                      dark:text-cyan-200
                    "
                  >
                    End analyst session
                  </p>

                  <h2
                    className="
                      mt-1
                      text-lg
                      font-black
                      tracking-[-0.025em]
                      text-foreground
                    "
                  >
                    Confirm logout?
                  </h2>

                  <p
                    className="
                      mt-2
                      text-[12px]
                      leading-5
                      text-muted-foreground
                    "
                  >
                    You will be signed out of the Analyst Workspace.
                    No logout happens until you confirm.
                  </p>
                </div>
              </div>

              <div
                className="
                  mt-6
                  grid
                  gap-2.5
                  sm:grid-cols-2
                "
              >
                <button
                  type="button"
                  disabled={
                    loggingOut
                  }
                  onClick={() =>
                    setLogoutModalOpen(
                      false
                    )
                  }
                  className="
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    px-4
                    py-3
                    text-[12px]
                    font-extrabold
                    text-foreground
                    shadow-sm
                    transition
                    hover:bg-muted
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Stay signed in
                </button>

                <motion.button
                  type="button"
                  disabled={
                    loggingOut
                  }
                  onClick={() =>
                    void confirmLogout()
                  }
                  whileHover={
                    loggingOut
                      ? undefined
                      : {
                          y: -1,
                        }
                  }
                  whileTap={
                    loggingOut
                      ? undefined
                      : {
                          scale: 0.985,
                        }
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-[rgba(103,232,249,.18)]
                    bg-[linear-gradient(135deg,#10243A_0%,#0B4F52_55%,#073346_100%)]
                    px-4
                    py-3
                    text-[12px]
                    font-extrabold
                    text-white
                    shadow-[0_12px_30px_rgba(11,79,82,.24)]
                    transition
                    hover:brightness-110
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Confirm logout
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
