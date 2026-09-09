"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Fingerprint,
  Info,
  Laptop2,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import type {
  DrawerTab,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

import UserActivityTimeline from "./UserActivityTimeline";
import UserKYCPanel from "./UserKYCPanel";
import UserProfileCard from "./UserProfileCard";
import UserRiskPanel from "./UserRiskPanel";
import UserRoleManager from "./UserRoleManager";
import UserSecurityCard from "./UserSecurityCard";
import UserStatusManager from "./UserStatusManager";
import UserTransactionsPanel from "./UserTransactionsPanel";
import UserWalletCard from "./UserWalletCard";
import UserAvatar from "./UserAvatar";

/* =========================================================
   TYPES
========================================================= */

interface UserDetailsDrawerProps {
  user: UserRecord | null;

  onClose: () => void;

  onUpdateUser: (
    id: string,
    patch: UpdateUserInput
  ) => Promise<void> | void;
}

interface TabDefinition {
  id: DrawerTab;
  label: string;
  icon: LucideIcon;
}

/* =========================================================
   TABS
========================================================= */

const TABS: TabDefinition[] =
  [
    {
      id: "overview",
      label: "Overview",
      icon: UserRound,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: WalletCards,
    },
    {
      id: "kyc",
      label: "KYC",
      icon: FileCheck2,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: Activity,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Laptop2,
    },
    {
      id: "risk",
      label: "Risk",
      icon: ShieldAlert,
    },
  ];

/* =========================================================
   COMPONENT
========================================================= */

export default function UserDetailsDrawer({
  user,
  onClose,
  onUpdateUser,
}: UserDetailsDrawerProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<DrawerTab>(
    "overview"
  );

  /* =======================================================
     RESET TAB
  ======================================================= */

  useEffect(() => {
    if (user) {
      setActiveTab(
        "overview"
      );
    }
  }, [user?.id]);

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    user,
    onClose,
  ]);

  /* =======================================================
     BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [user]);

  return (
    <AnimatePresence>
      {user && (
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
          className="
            fixed
            inset-0
            z-[100]
            flex
            justify-end
            bg-slate-950/45
            backdrop-blur-[3px]
          "
        >
          {/* =================================================
              BACKDROP
          ================================================= */}

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              absolute
              inset-0
              cursor-default
              focus:outline-none
            "
            aria-label="Close user details overlay"
          />

          {/* =================================================
              DRAWER
          ================================================= */}

          <motion.aside
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 290,
              damping: 31,
            }}
            className="
              relative
              z-10
              flex
              h-full
              w-full
              max-w-[720px]
              flex-col
              overflow-hidden
              border-l
              border-border
              bg-card
              shadow-2xl
            "
          >
            {/* =================================================
                HERO HEADER
            ================================================= */}

            <header
              className="
                relative
                shrink-0
                overflow-hidden
                bg-gradient-to-br
                from-indigo-950
                via-violet-900
                to-indigo-800
                p-5
                text-white
                sm:p-6
              "
            >
              {/* glow */}

              <motion.div
                className="
                  pointer-events-none
                  absolute
                  -right-16
                  -top-16
                  h-48
                  w-48
                  rounded-full
                  bg-violet-400/20
                  blur-3xl
                "
                animate={{
                  scale: [
                    0.9,
                    1.12,
                    0.9,
                  ],
                  opacity: [
                    0.25,
                    0.55,
                    0.25,
                  ],
                }}
                transition={{
                  duration: 6,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* grid */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  opacity-[0.08]
                "
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
                  backgroundSize:
                    "32px 32px",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      name={
                        user.name
                      }
                      avatarUrl={
                        user.avatarUrl
                      }
                      status={
                        user.status
                      }
                      size="lg"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-black tracking-tight">
                          {
                            user.name
                          }
                        </h2>

                        {user.status ===
                          "active" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-100">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                            Active
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-violet-100/70">
                        {
                          user.email
                        }
                      </p>

                      <p className="mt-2 truncate text-[9px] uppercase tracking-[0.08em] text-violet-100/45">
                        ID {user.id}
                        {" · "}
                        Joined{" "}
                        {formatJoinedDate(
                          user.joinedAt
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/10
                      bg-white/10
                      text-white
                      transition
                      hover:bg-white/15
                    "
                    aria-label="Close drawer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* =================================================
                    QUICK SUMMARY
                ================================================= */}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <QuickSummary
                    icon={
                      WalletCards
                    }
                    label="Balance"
                    value={formatCurrency(
                      user.balance
                    )}
                  />

                  <QuickSummary
                    icon={
                      Activity
                    }
                    label="Transactions"
                    value={user.transactionCount.toLocaleString()}
                  />

                  <QuickSummary
                    icon={
                      Fingerprint
                    }
                    label="2FA"
                    value={
                      user.twoFactorEnabled
                        ? "Enabled"
                        : "Off"
                    }
                  />
                </div>
              </div>
            </header>

            {/* =================================================
                TAB NAVIGATION
            ================================================= */}

            <nav
              className="
                shrink-0
                overflow-x-auto
                border-b
                border-border
                bg-card
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
              aria-label="User profile sections"
            >
              <div className="flex min-w-max gap-1 p-2">
                {TABS.map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    const isActive =
                      activeTab ===
                      item.id;

                    return (
                      <motion.button
                        key={
                          item.id
                        }
                        type="button"
                        whileTap={{
                          scale:
                            0.985,
                        }}
                        onClick={() =>
                          setActiveTab(
                            item.id
                          )
                        }
                        className="
                          relative
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          px-3
                          py-2.5
                          text-[10px]
                          font-black
                          transition-all
                        "
                        style={{
                          background:
                            isActive
                              ? "var(--dashboard-primary-soft)"
                              : "transparent",
                          color:
                            isActive
                              ? "var(--dashboard-primary)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />

                        {
                          item.label
                        }

                        {isActive && (
                          <motion.span
                            layoutId="user-drawer-tab-indicator"
                            className="
                              absolute
                              bottom-0
                              left-3
                              right-3
                              h-[2px]
                              rounded-full
                            "
                            style={{
                              background:
                                "var(--dashboard-primary)",
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  }
                )}
              </div>
            </nav>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                p-5
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                sm:p-6
              "
            >
              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={
                    activeTab
                  }
                  initial={{
                    opacity: 0,
                    x: 8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -8,
                  }}
                  transition={{
                    duration:
                      0.16,
                  }}
                >
                  {/* =================================================
                      OVERVIEW
                  ================================================= */}

                  {activeTab ===
                    "overview" && (
                    <div className="space-y-4">
                      <UserProfileCard
                        user={
                          user
                        }
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <UserStatusManager
                          user={
                            user
                          }
                          onUpdate={
                            onUpdateUser
                          }
                        />

                        <UserRoleManager
                          user={
                            user
                          }
                          onUpdate={
                            onUpdateUser
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <InfoCard
                          icon={
                            WalletCards
                          }
                          label="Balance"
                          value={formatCurrency(
                            user.balance
                          )}
                        />

                        <InfoCard
                          icon={
                            Activity
                          }
                          label="Transactions"
                          value={user.transactionCount.toLocaleString()}
                        />

                        <InfoCard
                          icon={
                            Laptop2
                          }
                          label="Sessions"
                          value={user.activeSessions.toLocaleString()}
                        />

                        <InfoCard
                          icon={
                            ShieldCheck
                          }
                          label="Risk score"
                          value={`${user.riskScore}/100`}
                        />
                      </div>

                      <div
                        className="
                          rounded-2xl
                          border
                          border-indigo-200/50
                          bg-indigo-50/60
                          p-4
                          dark:border-indigo-400/15
                          dark:bg-indigo-950/25
                        "
                      >
                        <div className="flex items-start gap-3">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-violet-300" />

                          <div>
                            <p className="text-xs font-black text-indigo-950 dark:text-violet-100">
                              Account snapshot
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-indigo-900/65 dark:text-violet-100/55">
                              This panel reflects the current user record returned
                              by the connected user-management API.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      SECURITY
                  ================================================= */}

                  {activeTab ===
                    "security" && (
                    <UserSecurityCard
                      user={
                        user
                      }
                      onUpdate={
                        onUpdateUser
                      }
                    />
                  )}

                  {/* =================================================
                      WALLET
                  ================================================= */}

                  {activeTab ===
                    "wallet" && (
                    <UserWalletCard
                      user={
                        user
                      }
                      onUpdate={
                        onUpdateUser
                      }
                    />
                  )}

                  {/* =================================================
                      KYC
                  ================================================= */}

                  {activeTab ===
                    "kyc" && (
                    <UserKYCPanel
                      user={
                        user
                      }
                      onUpdate={
                        onUpdateUser
                      }
                    />
                  )}

                  {/* =================================================
                      TRANSACTIONS
                  ================================================= */}

                  {activeTab ===
                    "transactions" && (
                    <UserTransactionsPanel
                      user={
                        user
                      }
                    />
                  )}

                  {/* =================================================
                      ACTIVITY
                  ================================================= */}

                  {activeTab ===
                    "activity" && (
                    <UserActivityTimeline
                      user={
                        user
                      }
                    />
                  )}

                  {/* =================================================
                      RISK
                  ================================================= */}

                  {activeTab ===
                    "risk" && (
                    <UserRiskPanel
                      user={
                        user
                      }
                      onUpdate={
                        onUpdateUser
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   QUICK SUMMARY
========================================================= */

function QuickSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
          <Icon className="h-3.5 w-3.5 text-violet-100" />
        </span>

        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-violet-100/45">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        rounded-2xl
        border
        border-border
        bg-muted/25
        p-3
        transition-colors
      "
    >
      <div
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
        "
        style={{
          background:
            "var(--dashboard-primary-soft)",
          color:
            "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-3 text-[9px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-card-foreground">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatJoinedDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "N/A";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",
    }
  ).format(date);
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  value: number
): string {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",
        currency:
          "BDT",
        maximumFractionDigits: 0,
      }
    ).format(value);
  } catch {
    return `৳${Number(value || 0).toLocaleString()}`;
  }
}