"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  ArrowRightLeft,
  PieChart,
  CheckCircle2,
  FileText,
  Clock,
  Settings,
  Mail,
  Smartphone,
  BellOff,
  X,
  Archive,
  Check,
  ChevronRight,
  Zap,
  Search,
  Receipt,
  Lock,
  ArrowUpRight,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type NotificationType =
  | "security"
  | "transaction"
  | "budget"
  | "kyc"
  | "receipt"
  | "system";

type Priority =
  | "critical"
  | "high"
  | "normal"
  | "low";

type FilterType =
  | "all"
  | "unread"
  | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isArchived: boolean;
  actionLink?: string;
  actionText?: string;
  amount?: number;
  currency?: string;
  merchant?: string;
}

interface Preferences {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };

  categories: Record<
    NotificationType,
    boolean
  >;

  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };

  digest:
    | "off"
    | "daily"
    | "weekly";
}

/* =========================================================
   MOCK DATA
========================================================= */

const generateMockNotifications =
  (): Notification[] => {
    const now = new Date();

    const yesterday =
      new Date(now);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const lastWeek =
      new Date(now);

    lastWeek.setDate(
      lastWeek.getDate() - 5
    );

    return [
      {
        id: "n-1",
        type: "security",
        priority: "critical",
        title:
          "New device sign-in detected",
        message:
          "A new Chrome session was detected in Dhaka. Wasn't you? Secure your account now.",
        date:
          now.toISOString(),
        isRead: false,
        isArchived: false,
        actionLink:
          "/dashboard/security",
        actionText:
          "Secure Account",
      },

      {
        id: "n-2",
        type: "budget",
        priority: "high",
        title:
          "Food budget is 84% used",
        message:
          "You have approximately ৳960 remaining this month for Food & Dining.",
        date: new Date(
          now.getTime() -
            1000 * 60 * 30
        ).toISOString(),
        isRead: false,
        isArchived: false,
        actionLink:
          "/dashboard/budgeting",
        actionText:
          "Review Budget",
      },

      {
        id: "n-3",
        type: "transaction",
        priority: "normal",
        title:
          "Payment completed",
        message:
          "Your payment to TechLand was successfully processed.",
        date: new Date(
          now.getTime() -
            1000 * 60 * 120
        ).toISOString(),
        isRead: true,
        isArchived: false,
        amount: 1450,
        currency: "৳",
        merchant:
          "TechLand",
        actionLink:
          "/dashboard/transactions",
        actionText:
          "View Transaction",
      },

      {
        id: "n-4",
        type: "kyc",
        priority: "normal",
        title:
          "KYC verification approved",
        message:
          "Your identity verification is complete. Your account limits have been upgraded.",
        date:
          yesterday.toISOString(),
        isRead: false,
        isArchived: false,
        actionLink:
          "/dashboard/kyc",
        actionText:
          "View Profile",
      },

      {
        id: "n-5",
        type: "receipt",
        priority: "high",
        title:
          "Warranty expiring soon",
        message:
          "Your Sony Headphones warranty expires in 14 days.",
        date:
          yesterday.toISOString(),
        isRead: true,
        isArchived: false,
        merchant:
          "Gadget Zone",
        actionLink:
          "/dashboard/receipts",
        actionText:
          "View Receipt",
      },

      {
        id: "n-6",
        type: "transaction",
        priority: "normal",
        title:
          "Money Received",
        message:
          "You received a transfer from Rahim Uddin.",
        date:
          lastWeek.toISOString(),
        isRead: true,
        isArchived: false,
        amount: 5000,
        currency: "৳",
      },
    ];
  };

/* =========================================================
   DEFAULT PREFERENCES
========================================================= */

const DEFAULT_PREFERENCES: Preferences =
  {
    channels: {
      inApp: true,
      email: true,
      push: false,
    },

    categories: {
      security: true,
      transaction: true,
      budget: true,
      kyc: true,
      receipt: true,
      system: true,
    },

    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
    },

    digest: "daily",
  };

/* =========================================================
   PAGE
========================================================= */

export default function NotificationCenterPage() {
  const [isMounted, setIsMounted] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>(
      []
    );

  const [preferences, setPreferences] =
    useState<Preferences>(
      DEFAULT_PREFERENCES
    );

  const [activeTab, setActiveTab] =
    useState<
      "inbox" | "insights" | "settings"
    >("inbox");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [filterType, setFilterType] =
    useState<FilterType>("all");

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(
      new Set()
    );

  const [
    drawerNotification,
    setDrawerNotification,
  ] =
    useState<Notification | null>(
      null
    );

  /* =========================================================
     HYDRATION + LOCAL STORAGE
  ========================================================== */

  useEffect(() => {
    setIsMounted(true);

    try {
      const storedNotifs =
        localStorage.getItem(
          "novawallet_notifications"
        );

      const storedPrefs =
        localStorage.getItem(
          "novawallet_notif_prefs"
        );

      if (storedNotifs) {
        const parsed =
          JSON.parse(
            storedNotifs
          ) as Notification[];

        setNotifications(parsed);
      } else {
        const initial =
          generateMockNotifications();

        setNotifications(
          initial
        );

        localStorage.setItem(
          "novawallet_notifications",
          JSON.stringify(
            initial
          )
        );
      }

      if (storedPrefs) {
        const parsedPrefs =
          JSON.parse(
            storedPrefs
          ) as Preferences;

        setPreferences(
          parsedPrefs
        );
      }
    } catch (error) {
      console.error(
        "Failed to initialize notification data:",
        error
      );

      const fallback =
        generateMockNotifications();

      setNotifications(
        fallback
      );

      setPreferences(
        DEFAULT_PREFERENCES
      );
    }
  }, []);

  /* =========================================================
     SYNC LOCAL STORAGE
  ========================================================== */

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    try {
      localStorage.setItem(
        "novawallet_notifications",
        JSON.stringify(
          notifications
        )
      );

      localStorage.setItem(
        "novawallet_notif_prefs",
        JSON.stringify(
          preferences
        )
      );
    } catch (error) {
      console.error(
        "Failed to save notification preferences:",
        error
      );
    }
  }, [
    notifications,
    preferences,
    isMounted,
  ]);

  /* =========================================================
     DERIVED STATE
  ========================================================== */

  const activeNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.isArchived
        ),
      [notifications]
    );

  const unreadCount =
    activeNotifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  const criticalCount =
    activeNotifications.filter(
      (notification) =>
        notification.priority ===
          "critical" &&
        !notification.isRead
    ).length;

  const actionRequiredCount =
    activeNotifications.filter(
      (notification) =>
        (notification.priority ===
          "high" ||
          notification.priority ===
            "critical") &&
        !notification.isRead
    ).length;

  /* =========================================================
     FILTERED NOTIFICATIONS
  ========================================================== */

  const filteredNotifications =
    useMemo(() => {
      let result =
        activeNotifications;

      if (
        filterType ===
        "unread"
      ) {
        result =
          result.filter(
            (notification) =>
              !notification.isRead
          );
      } else if (
        filterType !==
        "all"
      ) {
        result =
          result.filter(
            (notification) =>
              notification.type ===
              filterType
          );
      }

      if (searchQuery.trim()) {
        const query =
          searchQuery
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (notification) => {
              const titleMatch =
                notification.title
                  .toLowerCase()
                  .includes(query);

              const messageMatch =
                notification.message
                  .toLowerCase()
                  .includes(query);

              const merchantMatch =
                Boolean(
                  notification.merchant
                ) &&
                notification.merchant!
                  .toLowerCase()
                  .includes(query);

              return (
                titleMatch ||
                messageMatch ||
                merchantMatch
              );
            }
          );
      }

      return [...result].sort(
        (a, b) =>
          new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
      );
    }, [
      activeNotifications,
      filterType,
      searchQuery,
    ]);

  /* =========================================================
     MARK AS READ
  ========================================================== */

  const handleMarkAsRead =
    (id: string) => {
      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification
          )
      );
    };

  /* =========================================================
     ARCHIVE
  ========================================================== */

  const handleArchive =
    (id: string) => {
      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    isArchived: true,
                  }
                : notification
          )
      );

      setDrawerNotification(
        null
      );
    };

  /* =========================================================
     MARK ALL READ
  ========================================================== */

  const handleMarkAllRead =
    () => {
      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              isRead: true,
            })
          )
      );
    };

  /* =========================================================
     SELECTION
  ========================================================== */

  const toggleSelection =
    (id: string) => {
      setSelectedIds(
        (current) => {
          const next =
            new Set(current);

          if (
            next.has(id)
          ) {
            next.delete(id);
          } else {
            next.add(id);
          }

          return next;
        }
      );
    };

  /* =========================================================
     BULK ACTION
  ========================================================== */

  const handleBulkAction =
    (
      action:
        | "read"
        | "archive"
        | "delete"
    ) => {
      if (
        selectedIds.size ===
        0
      ) {
        return;
      }

      setNotifications(
        (previous) =>
          previous
            .map(
              (notification) => {
                if (
                  !selectedIds.has(
                    notification.id
                  )
                ) {
                  return notification;
                }

                if (
                  action ===
                  "read"
                ) {
                  return {
                    ...notification,
                    isRead: true,
                  };
                }

                if (
                  action ===
                  "archive"
                ) {
                  return {
                    ...notification,
                    isArchived:
                      true,
                  };
                }

                return notification;
              }
            )
            .filter(
              (notification) =>
                !(
                  action ===
                    "delete" &&
                  selectedIds.has(
                    notification.id
                  )
                )
            )
      );

      setSelectedIds(
        new Set()
      );

      setDrawerNotification(
        null
      );
    };

  /* =========================================================
     ACTION NAVIGATION
  ========================================================== */

  const navigateTo =
    (path: string) => {
      window.location.href =
        path;
    };

  /* =========================================================
     HYDRATION GUARD
  ========================================================== */

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]" />
    );
  }

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-[#0F2745] selection:bg-[#1F5EA8] selection:text-white pb-32">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-b-[40px] bg-[#0F2745] px-4 pb-24 pt-12 text-white md:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-[#1F5EA8] opacity-40 blur-[120px] mix-blend-screen" />

          <div className="absolute bottom-[-40%] left-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-400/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100">
              <Bell className="h-3.5 w-3.5" />
              Wallet Notifications
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
              Notification Center
            </h1>

            <p className="max-w-xl text-lg text-slate-300">
              Stay informed about your wallet, payments, security, and financial activity.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={
                handleMarkAllRead
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all read
            </button>

            <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <Bell className="h-8 w-8 text-white" />

              {unreadCount >
                0 && (
                <motion.span
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-[#0F2745] bg-red-500"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-20 mx-auto -mt-12 max-w-7xl space-y-8 px-4 md:px-8">

        {/* ===================================================
            SUMMARY CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Unread"
            count={unreadCount}
            icon={<Bell className="h-5 w-5" />}
            color="blue"
          />

          <StatCard
            title="Action Required"
            count={
              actionRequiredCount
            }
            icon={
              <AlertTriangle className="h-5 w-5" />
            }
            color="amber"
            highlight={
              actionRequiredCount >
              0
            }
          />

          <StatCard
            title="Critical Alerts"
            count={
              criticalCount
            }
            icon={
              <ShieldAlert className="h-5 w-5" />
            }
            color="red"
            highlight={
              criticalCount >
              0
            }
          />

          <StatCard
            title="Recent Activity"
            count={
              activeNotifications.length
            }
            icon={
              <Zap className="h-5 w-5" />
            }
            color="emerald"
          />
        </div>

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="flex w-full space-x-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:w-fit">
          {(
            [
              "inbox",
              "insights",
              "settings",
            ] as const
          ).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab
                  )
                }
                className={`whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "bg-[#F6F8FB] text-[#1F5EA8] shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0F2745]"
                }`}
              >
                {tab ===
                "inbox"
                  ? "Inbox & Alerts"
                  : tab}
              </button>
            )
          )}
        </div>

        {/* ===================================================
            TAB CONTENT
        ==================================================== */}

        <AnimatePresence mode="wait">

          {/* =================================================
              INBOX
          ================================================== */}

          {activeTab ===
            "inbox" && (
            <motion.div
              key="inbox"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-3"
            >
              <div className="space-y-6 lg:col-span-2">

                {/* Critical */}
                {criticalCount >
                  0 && (
                  <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500" />

                    <h3 className="mb-4 flex items-center gap-2 font-bold text-red-800">
                      <ShieldAlert className="h-5 w-5" />
                      Critical Security Alerts
                    </h3>

                    <div className="space-y-3">
                      {activeNotifications
                        .filter(
                          (
                            notification
                          ) =>
                            notification.priority ===
                              "critical" &&
                            !notification.isRead
                        )
                        .map(
                          (
                            alert
                          ) => (
                            <div
                              key={
                                alert.id
                              }
                              className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm md:flex-row md:items-center"
                            >
                              <div>
                                <h4 className="font-bold text-[#0F2745]">
                                  {
                                    alert.title
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-slate-600">
                                  {
                                    alert.message
                                  }
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setDrawerNotification(
                                    alert
                                  )
                                }
                                className="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                              >
                                {alert.actionText ||
                                  "Review Issue"}
                              </button>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}

                {/* Search and filters */}
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
                  <div className="relative w-full flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      placeholder="Search notifications..."
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
                      className="w-full rounded-2xl border-none bg-[#F6F8FB] py-3 pl-12 pr-4 text-[#0F2745] outline-none transition-all focus:ring-2 focus:ring-[#1F5EA8]/20"
                    />
                  </div>

                  <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
                    {(
                      [
                        "all",
                        "unread",
                        "transaction",
                        "security",
                        "budget",
                      ] as const
                    ).map(
                      (filter) => (
                        <button
                          key={
                            filter
                          }
                          type="button"
                          onClick={() =>
                            setFilterType(
                              filter
                            )
                          }
                          className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                            filterType ===
                            filter
                              ? "border-[#1F5EA8] bg-[#1F5EA8] text-white"
                              : "border-transparent bg-[#F6F8FB] text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="space-y-3">
                  {filteredNotifications.length ===
                  0 ? (
                    <EmptyState />
                  ) : (
                    <AnimatePresence>
                      {filteredNotifications.map(
                        (
                          notification
                        ) => (
                          <NotificationCard
                            key={
                              notification.id
                            }
                            notification={
                              notification
                            }
                            isSelected={selectedIds.has(
                              notification.id
                            )}
                            onSelect={() =>
                              toggleSelection(
                                notification.id
                              )
                            }
                            onClick={() => {
                              if (
                                !notification.isRead
                              ) {
                                handleMarkAsRead(
                                  notification.id
                                );
                              }

                              setDrawerNotification(
                                notification
                              );
                            }}
                          />
                        )
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Right action center */}
              <div className="space-y-6">
                <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0F2745]">
                    <CheckCircle2 className="h-5 w-5 text-[#1F5EA8]" />
                    Things You Should Do
                  </h3>

                  <div className="space-y-4">
                    <ActionCard
                      title="Complete KYC Profile"
                      desc="Upgrade your limits by finishing verification."
                      icon={
                        <FileText className="h-5 w-5" />
                      }
                      color="blue"
                      link="/dashboard/kyc"
                      onNavigate={
                        navigateTo
                      }
                    />

                    <ActionCard
                      title="Review Food Budget"
                      desc="You are near your ৳10,000 monthly limit."
                      icon={
                        <PieChart className="h-5 w-5" />
                      }
                      color="amber"
                      link="/dashboard/budgeting"
                      onNavigate={
                        navigateTo
                      }
                    />

                    <ActionCard
                      title="Secure Account"
                      desc="A new sign-in requires your attention."
                      icon={
                        <ShieldAlert className="h-5 w-5" />
                      }
                      color="red"
                      link="/dashboard/security"
                      onNavigate={
                        navigateTo
                      }
                    />
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                      Quick Links
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                      <QuickLink
                        icon={
                          <ArrowRightLeft className="h-4 w-4" />
                        }
                        label="Transactions"
                        onClick={() =>
                          navigateTo(
                            "/dashboard/transactions"
                          )
                        }
                      />

                      <QuickLink
                        icon={
                          <Receipt className="h-4 w-4" />
                        }
                        label="Receipts"
                        onClick={() =>
                          navigateTo(
                            "/dashboard/receipts"
                          )
                        }
                      />

                      <QuickLink
                        icon={
                          <Settings className="h-4 w-4" />
                        }
                        label="Preferences"
                        onClick={() =>
                          setActiveTab(
                            "settings"
                          )
                        }
                      />

                      <QuickLink
                        icon={
                          <Archive className="h-4 w-4" />
                        }
                        label="Archived"
                        onClick={() =>
                          setFilterType(
                            "all"
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =================================================
              INSIGHTS
          ================================================== */}

          {activeTab ===
            "insights" && (
            <motion.div
              key="insights"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="space-y-8"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#1F5EA8]">
                    Activity Insights
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Notification Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    A lightweight overview of recent notification activity.
                  </p>
                </div>

                <div className="flex h-64 items-end justify-between gap-2 border-b border-slate-100 pb-2">
                  {[
                    40,
                    65,
                    30,
                    80,
                    45,
                    90,
                    50,
                  ].map(
                    (
                      height,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="group flex flex-1 flex-col items-center gap-2"
                      >
                        <div className="relative flex h-full w-full items-end justify-center">
                          <motion.div
                            initial={{
                              height: 0,
                            }}
                            animate={{
                              height: `${height}%`,
                            }}
                            transition={{
                              duration:
                                0.7,
                              delay:
                                index *
                                0.06,
                              ease: "easeOut",
                            }}
                            className="relative w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#1F5EA8] to-cyan-400 opacity-80 transition-opacity group-hover:opacity-100"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-[#0F2745] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                              {height} Alerts
                            </div>
                          </motion.div>
                        </div>

                        <span className="text-xs font-medium text-slate-400">
                          Day{" "}
                          {index +
                            1}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Top Category
                    </p>

                    <h3 className="mt-2 text-lg font-bold">
                      Transactions
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Most of your alerts are transaction updates.
                    </p>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-100 border-r-[#1F5EA8] border-t-[#1F5EA8]">
                    <span className="text-sm font-bold">
                      48%
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Smart Batching Demo
                  </h3>

                  <p className="mb-4 text-sm text-slate-600">
                    NovaWallet groups similar notifications to reduce clutter.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setFilterType(
                        "transaction"
                      )
                    }
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-[#F6F8FB] p-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-blue-600">
                          <ArrowRightLeft className="h-4 w-4" />
                        </div>

                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-emerald-600">
                          <ArrowRightLeft className="h-4 w-4" />
                        </div>
                      </div>

                      <span className="text-sm font-medium">
                        3 Transaction Updates
                      </span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =================================================
              SETTINGS
          ================================================== */}

          {activeTab ===
            "settings" && (
            <motion.div
              key="settings"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mx-auto max-w-4xl space-y-6"
            >
              <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                {/* Delivery channels */}
                <div>
                  <h2 className="mb-2 text-xl font-bold text-[#0F2745]">
                    Delivery Channels
                  </h2>

                  <p className="mb-6 text-sm text-slate-500">
                    How do you want to receive notifications from NovaWallet?
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ToggleCard
                      title="In-App Vault"
                      icon={
                        <Bell className="h-5 w-5" />
                      }
                      active={
                        preferences
                          .channels
                          .inApp
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            channels:
                              {
                                ...previous.channels,
                                inApp:
                                  value,
                              },
                          })
                        )
                      }
                    />

                    <ToggleCard
                      title="Email Delivery"
                      icon={
                        <Mail className="h-5 w-5" />
                      }
                      active={
                        preferences
                          .channels
                          .email
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            channels:
                              {
                                ...previous.channels,
                                email:
                                  value,
                              },
                          })
                        )
                      }
                    />

                    <ToggleCard
                      title="Push Notifications"
                      icon={
                        <Smartphone className="h-5 w-5" />
                      }
                      active={
                        preferences
                          .channels
                          .push
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            channels:
                              {
                                ...previous.channels,
                                push:
                                  value,
                              },
                          })
                        )
                      }
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Privacy */}
                <div>
                  <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-[#0F2745]">
                    <Lock className="h-5 w-5 text-slate-400" />
                    Notification Privacy
                  </h2>

                  <p className="mb-6 max-w-2xl text-sm text-slate-500">
                    Financial notification best practices hide sensitive account details in preview messages. Detailed transaction information remains securely inside the authenticated application.
                  </p>

                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-[#F6F8FB] p-4">
                    <CategoryToggle
                      title="Security Alerts (Required)"
                      desc="New logins, password changes, suspicious activity."
                      active
                      disabled
                    />

                    <CategoryToggle
                      title="Transactions"
                      desc="Money sent, received, or failed."
                      active={
                        preferences
                          .categories
                          .transaction
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            categories:
                              {
                                ...previous.categories,
                                transaction:
                                  value,
                              },
                          })
                        )
                      }
                    />

                    <CategoryToggle
                      title="Budget & Cash Flow"
                      desc="Warnings when nearing limits."
                      active={
                        preferences
                          .categories
                          .budget
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            categories:
                              {
                                ...previous.categories,
                                budget:
                                  value,
                              },
                          })
                        )
                      }
                    />

                    <CategoryToggle
                      title="KYC"
                      desc="Verification status and identity updates."
                      active={
                        preferences
                          .categories
                          .kyc
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            categories:
                              {
                                ...previous.categories,
                                kyc:
                                  value,
                              },
                          })
                        )
                      }
                    />

                    <CategoryToggle
                      title="Receipts"
                      desc="Receipt and warranty notifications."
                      active={
                        preferences
                          .categories
                          .receipt
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            categories:
                              {
                                ...previous.categories,
                                receipt:
                                  value,
                              },
                          })
                        )
                      }
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Quiet hours */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-[#0F2745]">
                        <BellOff className="h-5 w-5 text-slate-500" />
                        Quiet Hours
                      </h3>

                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        Pause routine notifications at night. Critical alerts can still be delivered.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={
                          preferences
                            .quietHours
                            .start
                        }
                        onChange={(
                          event
                        ) =>
                          setPreferences(
                            (
                              previous
                            ) => ({
                              ...previous,
                              quietHours:
                                {
                                  ...previous.quietHours,
                                  start:
                                    event
                                      .target
                                      .value,
                                },
                            })
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1F5EA8]"
                      />

                      <span className="text-slate-400">
                        to
                      </span>

                      <input
                        type="time"
                        value={
                          preferences
                            .quietHours
                            .end
                        }
                        onChange={(
                          event
                        ) =>
                          setPreferences(
                            (
                              previous
                            ) => ({
                              ...previous,
                              quietHours:
                                {
                                  ...previous.quietHours,
                                  end:
                                    event
                                      .target
                                      .value,
                                },
                            })
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1F5EA8]"
                      />
                    </div>
                  </div>
                </div>

                {/* Digest */}
                <div className="rounded-2xl border border-slate-100 bg-white">
                  <div className="p-1">
                    {(
                      [
                        "off",
                        "daily",
                        "weekly",
                      ] as const
                    ).map(
                      (
                        digest
                      ) => (
                        <button
                          key={
                            digest
                          }
                          type="button"
                          onClick={() =>
                            setPreferences(
                              (
                                previous
                              ) => ({
                                ...previous,
                                digest:
                                  digest,
                              })
                            )
                          }
                          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium capitalize transition ${
                            preferences.digest ===
                            digest
                              ? "bg-[#EEF5FC] text-[#1F5EA8]"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {digest ===
                          "off"
                            ? "No digest"
                            : `${digest} digest`}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================
          BULK ACTION BAR
      ====================================================== */}

      <AnimatePresence>
        {selectedIds.size >
          0 && (
          <motion.div
            initial={{
              y: 100,
              opacity: 0,
              x: "-50%",
            }}
            animate={{
              y: 0,
              opacity: 1,
              x: "-50%",
            }}
            exit={{
              y: 100,
              opacity: 0,
              x: "-50%",
            }}
            className="fixed bottom-8 left-1/2 z-40 flex w-[90%] min-w-0 items-center gap-4 rounded-2xl bg-[#0F2745] px-5 py-4 text-white shadow-2xl md:w-auto md:min-w-[400px] md:gap-6"
          >
            <div className="whitespace-nowrap font-medium">
              {selectedIds.size}{" "}
              Selected
            </div>

            <div className="h-6 w-px bg-white/20" />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleBulkAction(
                    "read"
                  )
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors hover:bg-white/10"
              >
                <Check className="h-4 w-4" />
                Read
              </button>

              <button
                type="button"
                onClick={() =>
                  handleBulkAction(
                    "archive"
                  )
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors hover:bg-white/10"
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>

              <button
                type="button"
                onClick={() =>
                  handleBulkAction(
                    "delete"
                  )
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/10 hover:text-red-100"
              >
                Delete
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedIds(
                  new Set()
                )
              }
              className="ml-auto rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="Clear selection"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          DETAILS DRAWER
      ====================================================== */}

      <AnimatePresence>
        {drawerNotification && (
          <>
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
              className="fixed inset-0 z-50 bg-[#0F2745]/20 backdrop-blur-sm"
              onClick={() =>
                setDrawerNotification(
                  null
                )
              }
            />

            <motion.div
              initial={{
                x: "100%",
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: "100%",
                opacity: 0,
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl md:w-[450px]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                    {
                      drawerNotification.type
                    }
                  </span>

                  {!drawerNotification.isRead && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#1F5EA8]" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleArchive(
                        drawerNotification.id
                      )
                    }
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#0F2745]"
                    title="Archive"
                    aria-label="Archive notification"
                  >
                    <Archive className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDrawerNotification(
                        null
                      )
                    }
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto p-8">
                <div>
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm ${getIconColors(
                      drawerNotification.type,
                      drawerNotification.priority
                    )}`}
                  >
                    {getTypeIcon(
                      drawerNotification.type
                    )}
                  </div>

                  <h2 className="mb-2 text-2xl font-bold leading-tight text-[#0F2745]">
                    {
                      drawerNotification.title
                    }
                  </h2>

                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />

                    {new Date(
                      drawerNotification.date
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#F6F8FB] p-5 text-sm leading-relaxed text-slate-700">
                  {
                    drawerNotification.message
                  }
                </div>

                {(drawerNotification.amount !==
                  undefined ||
                  drawerNotification.merchant) && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    {drawerNotification.amount !==
                      undefined && (
                      <div className="flex justify-between border-b border-slate-100 p-4">
                        <span className="text-sm text-slate-500">
                          Amount
                        </span>

                        <span className="font-bold text-[#0F2745]">
                          {
                            drawerNotification.currency
                          }
                          {drawerNotification.amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {drawerNotification.merchant && (
                      <div className="flex justify-between p-4">
                        <span className="text-sm text-slate-500">
                          Merchant
                        </span>

                        <span className="font-medium text-[#0F2745]">
                          {
                            drawerNotification.merchant
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {drawerNotification.actionLink && (
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo(
                        drawerNotification.actionLink!
                      );

                      setDrawerNotification(
                        null
                      );
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F5EA8] py-4 font-bold text-white shadow-md transition-colors hover:bg-[#173F6D]"
                  >
                    {
                      drawerNotification.actionText
                    }

                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  count,
  icon,
  color,
  highlight = false,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color:
    | "blue"
    | "emerald"
    | "amber"
    | "red";
  highlight?: boolean;
}) {
  const colors: Record<
    "blue" | "emerald" | "amber" | "red",
    string
  > = {
    blue:
      "bg-blue-50 text-blue-600 border-blue-100",

    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100",

    red:
      "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className={`flex items-center justify-between rounded-3xl border bg-white p-5 transition-all ${
        highlight
          ? "border-amber-300 shadow-md ring-1 ring-amber-100"
          : "border-slate-200 shadow-sm"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p
          className={`mt-1 text-2xl font-bold ${
            highlight
              ? "text-amber-600"
              : "text-[#0F2745]"
          }`}
        >
          {count}
        </p>
      </div>

      <div
        className={`rounded-2xl border p-3 ${colors[color]}`}
      >
        {icon}
      </div>
    </motion.div>
  );
}

/* =========================================================
   NOTIFICATION CARD
========================================================= */

function NotificationCard({
  notification,
  isSelected,
  onSelect,
  onClick,
}: {
  notification: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className={`group flex cursor-pointer items-start gap-4 rounded-3xl border p-4 transition-all ${
        notification.isRead
          ? "border-slate-200 bg-white shadow-sm hover:border-slate-300"
          : "border-[#1F5EA8]/20 bg-blue-50/30 shadow-sm hover:border-[#1F5EA8]/40"
      }`}
    >
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={(
            event
          ) => {
            event.stopPropagation();
            onSelect();
          }}
          aria-label={
            isSelected
              ? "Deselect notification"
              : "Select notification"
          }
          className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-colors ${
            isSelected
              ? "border-[#1F5EA8] bg-[#1F5EA8]"
              : "border-slate-300 bg-white group-hover:border-[#1F5EA8]"
          }`}
        >
          {isSelected && (
            <Check className="h-3 w-3 text-white" />
          )}
        </button>

        <button
          type="button"
          onClick={onClick}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${getIconColors(
            notification.type,
            notification.priority
          )}`}
          aria-label="Open notification"
        >
          {getTypeIcon(
            notification.type
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 flex-col justify-between gap-2 text-left md:flex-row md:items-center"
      >
        <div className="pr-4">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate font-bold text-[#0F2745]">
              {
                notification.title
              }
            </h4>

            {!notification.isRead && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#1F5EA8]" />
            )}

            {notification.priority ===
              "critical" && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                Critical
              </span>
            )}
          </div>

          <p className="line-clamp-1 text-sm text-slate-500">
            {
              notification.message
            }
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 md:flex-col md:items-end">
          <span className="whitespace-nowrap text-xs font-medium text-slate-400">
            {formatTime(
              notification.date
            )}
          </span>

          {notification.actionText && (
            <span className="flex items-center gap-1 text-xs font-bold text-[#1F5EA8] group-hover:underline">
              {
                notification.actionText
              }

              <ChevronRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  title,
  desc,
  icon,
  color,
  link,
  onNavigate,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color:
    | "blue"
    | "amber"
    | "red";
  link?: string;
  onNavigate: (
    path: string
  ) => void;
}) {
  const colors: Record<
    "blue" | "amber" | "red",
    string
  > = {
    blue:
      "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-200",

    red:
      "bg-red-50 text-red-600 border-red-100 hover:border-red-200",
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (link) {
          onNavigate(
            link
          );
        }
      }}
      className={`group w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${colors[color]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {icon}
        </div>

        <div>
          <h4 className="mb-1 font-bold group-hover:underline">
            {title}
          </h4>

          <p className="text-xs opacity-80">
            {desc}
          </p>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl border border-transparent p-3 text-sm font-medium text-slate-600 transition-all hover:border-slate-200 hover:bg-slate-50"
    >
      <span className="flex h-5 w-5 items-center justify-center text-[#1F5EA8]">
        {icon}
      </span>

      {label}
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <Bell className="h-8 w-8 text-slate-300" />
      </div>

      <h3 className="mb-2 text-xl font-bold text-[#0F2745]">
        You're all caught up!
      </h3>

      <p className="max-w-sm text-slate-500">
        We'll let you know when something important happens with your account.
      </p>
    </motion.div>
  );
}

/* =========================================================
   TOGGLE CARD
========================================================= */

function ToggleCard({
  title,
  icon,
  active,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !active
        )
      }
      aria-pressed={active}
      className={`w-full rounded-2xl border-2 p-4 transition-all ${
        active
          ? "border-[#1F5EA8] bg-blue-50/30"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={`rounded-full p-3 ${
            active
              ? "bg-[#1F5EA8] text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {icon}
        </div>

        <h4 className="text-sm font-bold text-[#0F2745]">
          {title}
        </h4>

        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
            active
              ? "bg-[#EAF3FC] text-[#1F5EA8]"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {active
            ? "Enabled"
            : "Disabled"}
        </span>
      </div>
    </button>
  );
}

/* =========================================================
   CATEGORY TOGGLE
========================================================= */

function CategoryToggle({
  title,
  desc,
  active,
  disabled = false,
  onChange,
}: {
  title: string;
  desc: string;
  active: boolean;
  disabled?: boolean;
  onChange?: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3">
      <div>
        <h4 className="text-sm font-bold text-[#0F2745]">
          {title}
        </h4>

        <p className="text-xs text-slate-500">
          {desc}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (
            !disabled &&
            onChange
          ) {
            onChange(
              !active
            );
          }
        }}
        aria-label={title}
        aria-pressed={active}
        className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        } ${
          active
            ? "bg-[#1F5EA8]"
            : "bg-slate-300"
        }`}
      >
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className={`h-4 w-4 rounded-full bg-white shadow-sm ${
            active
              ? "ml-auto"
              : "mr-auto"
          }`}
        />
      </button>
    </div>
  );
}

/* =========================================================
   ICON HELPER
========================================================= */

function getTypeIcon(
  type: NotificationType
) {
  switch (type) {
    case "security":
      return (
        <ShieldAlert className="h-5 w-5" />
      );

    case "transaction":
      return (
        <ArrowRightLeft className="h-5 w-5" />
      );

    case "budget":
      return (
        <PieChart className="h-5 w-5" />
      );

    case "kyc":
      return (
        <FileText className="h-5 w-5" />
      );

    case "receipt":
      return (
        <Receipt className="h-5 w-5" />
      );

    case "system":
    default:
      return (
        <Bell className="h-5 w-5" />
      );
  }
}

/* =========================================================
   ICON COLORS
========================================================= */

function getIconColors(
  type: NotificationType,
  priority: Priority
) {
  if (
    priority ===
    "critical"
  ) {
    return "border-red-100 bg-red-50 text-red-600";
  }

  if (
    type ===
    "security"
  ) {
    return "border-amber-100 bg-amber-50 text-amber-600";
  }

  if (
    type ===
    "transaction"
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-600";
  }

  if (
    type === "budget"
  ) {
    return "border-violet-100 bg-violet-50 text-violet-600";
  }

  if (
    type === "kyc"
  ) {
    return "border-blue-100 bg-blue-50 text-blue-600";
  }

  if (
    type === "receipt"
  ) {
    return "border-orange-100 bg-orange-50 text-orange-600";
  }

  return "border-blue-100 bg-blue-50 text-blue-600";
}

/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(
  isoString: string
) {
  const date =
    new Date(
      isoString
    );

  const now =
    new Date();

  const diffDays =
    Math.floor(
      (now.getTime() -
        date.getTime()) /
        (1000 *
          3600 *
          24)
    );

  if (
    diffDays === 0
  ) {
    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  if (
    diffDays === 1
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
    }
  );
}