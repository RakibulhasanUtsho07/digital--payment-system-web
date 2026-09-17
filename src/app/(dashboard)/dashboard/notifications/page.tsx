"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

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
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  archiveNotificationApi,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  runBulkNotificationAction,
  saveNotificationPreferences,
  type NotificationData as Notification,
  type NotificationPreferences as Preferences,
  type NotificationPriority as Priority,
  type NotificationType,
} from "@/lib/api/notificationApi";

/* =========================================================
   TYPES
========================================================= */

type FilterType =
  | "all"
  | "unread"
  | "archived"
  | NotificationType;

/* =========================================================
   DEFAULT PREFERENCES
========================================================= */

const DEFAULT_PREFERENCES: Preferences = {
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
    useState<Notification[]>([]);

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
    useState<Set<string>>(new Set());

  const [
    drawerNotification,
    setDrawerNotification,
  ] =
    useState<Notification | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingPreferences, setSavingPreferences] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [toast, setToast] =
    useState<string | null>(null);

  /* =========================================================
     BACKEND DATA
  ========================================================== */

  const showToast = (
    message: string
  ) => {
    setToast(message);

    window.setTimeout(
      () => setToast(null),
      2800
    );
  };

  const loadNotificationCenter =
    async (
      silent = false
    ) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const [
          notificationResponse,
          preferenceResponse,
        ] =
          await Promise.all([
            fetchNotifications(),
            fetchNotificationPreferences(),
          ]);

        if (
          !notificationResponse?.success ||
          !Array.isArray(
            notificationResponse.notifications
          )
        ) {
          throw new Error(
            notificationResponse?.message ||
              "Unable to load notifications."
          );
        }

        if (
          !preferenceResponse?.success ||
          !preferenceResponse.preferences
        ) {
          throw new Error(
            preferenceResponse?.message ||
              "Unable to load notification preferences."
          );
        }

        setNotifications(
          notificationResponse.notifications
        );

        setPreferences(
          preferenceResponse.preferences
        );

        setDrawerNotification(
          (current) => {
            if (!current) {
              return null;
            }

            return (
              notificationResponse.notifications.find(
                (item) =>
                  item.id === current.id
              ) || null
            );
          }
        );

        setIsMounted(true);
      } catch (error) {
        console.error(
          "Notification center load error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load notification center."
        );

        setIsMounted(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    void loadNotificationCenter();
  }, []);

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

  const archivedCount =
    notifications.filter(
      (notification) =>
        notification.isArchived
    ).length;

  const notificationActivity =
    useMemo(() => {
      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      return Array.from(
        {
          length: 7,
        },
        (_, index) => {
          const date = new Date(
            today
          );

          date.setDate(
            today.getDate() -
              (6 - index)
          );

          const count =
            notifications.filter(
              (notification) => {
                const created =
                  new Date(
                    notification.date
                  );

                return (
                  created.getFullYear() ===
                    date.getFullYear() &&
                  created.getMonth() ===
                    date.getMonth() &&
                  created.getDate() ===
                    date.getDate()
                );
              }
            ).length;

          return {
            label:
              date.toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                }
              ),
            count,
          };
        }
      );
    }, [notifications]);

  const maxActivityCount =
    Math.max(
      ...notificationActivity.map(
        (item) =>
          item.count
      ),
      1
    );

  const categoryStats =
    useMemo(() => {
      const counts: Record<
        NotificationType,
        number
      > = {
        security: 0,
        transaction: 0,
        budget: 0,
        kyc: 0,
        receipt: 0,
        system: 0,
      };

      notifications.forEach(
        (notification) => {
          counts[
            notification.type
          ] += 1;
        }
      );

      const entries =
        Object.entries(
          counts
        ) as Array<
          [
            NotificationType,
            number
          ]
        >;

      entries.sort(
        (a, b) =>
          b[1] - a[1]
      );

      const [
        topType,
        topCount,
      ] =
        entries[0] || [
          "system",
          0,
        ];

      return {
        topType,
        topCount,
        topPercent:
          notifications.length >
          0
            ? Math.round(
                (topCount /
                  notifications.length) *
                  100
              )
            : 0,

        transactionCount:
          counts.transaction,
      };
    }, [notifications]);

  /* =========================================================
     FILTERED NOTIFICATIONS
  ========================================================== */

  const filteredNotifications =
    useMemo(() => {
      let result =
        activeNotifications;

      if (
        filterType ===
        "archived"
      ) {
        result =
          notifications.filter(
            (notification) =>
              notification.isArchived
          );
      } else if (
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

      if (
        searchQuery.trim()
      ) {
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
                  .includes(
                    query
                  );

              const messageMatch =
                notification.message
                  .toLowerCase()
                  .includes(
                    query
                  );

              const merchantMatch =
                Boolean(
                  notification.merchant
                ) &&
                notification
                  .merchant!
                  .toLowerCase()
                  .includes(
                    query
                  );

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
      notifications,
      filterType,
      searchQuery,
    ]);

  /* =========================================================
     BACKEND ACTIONS
  ========================================================== */

  const handleMarkAsRead =
    async (
      id: string
    ) => {
      const current =
        notifications.find(
          (notification) =>
            notification.id ===
            id
        );

      if (
        !current ||
        current.isRead
      ) {
        return;
      }

      try {
        const response =
          await markNotificationRead(
            id
          );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.id === id
                  ? response.notification
                  : notification
            )
        );

        setDrawerNotification(
          (drawer) =>
            drawer?.id === id
              ? response.notification
              : drawer
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to mark notification as read."
        );
      }
    };

  const handleArchive =
    async (
      id: string
    ) => {
      try {
        const response =
          await archiveNotificationApi(
            id
          );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.id === id
                  ? response.notification
                  : notification
            )
        );

        setDrawerNotification(
          null
        );

        showToast(
          response.message ||
            "Notification archived."
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to archive notification."
        );
      }
    };

  const handleMarkAllRead =
    async () => {
      try {
        const response =
          await markAllNotificationsRead();

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.isArchived
                  ? notification
                  : {
                      ...notification,
                      isRead: true,
                    }
            )
        );

        setDrawerNotification(
          (current) =>
            current
              ? {
                  ...current,
                  isRead: true,
                }
              : null
        );

        showToast(
          response.message ||
            "All notifications marked as read."
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to mark all notifications as read."
        );
      }
    };

  const toggleSelection =
    (
      id: string
    ) => {
      setSelectedIds(
        (current) => {
          const next =
            new Set(
              current
            );

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

  const handleBulkAction =
    async (
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

      try {
        const ids =
          Array.from(
            selectedIds
          );

        const response =
          await runBulkNotificationAction(
            ids,
            action
          );

        if (
          action ===
          "delete"
        ) {
          setNotifications(
            (previous) =>
              previous.filter(
                (notification) =>
                  !selectedIds.has(
                    notification.id
                  )
              )
          );
        } else {
          setNotifications(
            (previous) =>
              previous.map(
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
                    "archive"
                  ) {
                    return {
                      ...notification,
                      isArchived: true,
                      isRead: true,
                    };
                  }

                  return {
                    ...notification,
                    isRead: true,
                  };
                }
              )
          );
        }

        setSelectedIds(
          new Set()
        );

        setDrawerNotification(
          null
        );

        showToast(
          response.message ||
            "Notification action completed."
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to update selected notifications."
        );
      }
    };

  const handleSavePreferences =
    async () => {
      try {
        setSavingPreferences(
          true
        );

        const response =
          await saveNotificationPreferences(
            preferences
          );

        setPreferences(
          response.preferences
        );

        showToast(
          response.message ||
            "Notification preferences saved."
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to save notification preferences."
        );
      } finally {
        setSavingPreferences(
          false
        );
      }
    };

  /* =========================================================
     ACTION NAVIGATION
  ========================================================== */

  const navigateTo =
    (
      path: string
    ) => {
      window.location.href =
        path;
    };

  /* =========================================================
     HYDRATION GUARD
  ========================================================== */

  if (
    !isMounted ||
    loading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>

          <p className="mt-4 text-sm font-bold text-foreground">
            Loading notifications
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your alerts and preferences.
          </p>
        </div>
      </div>
    );
  }

  if (
    errorMessage &&
    notifications.length ===
      0
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-3xl border border-rose-200/70 bg-card p-7 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-7 w-7 text-rose-500" />

          <h1 className="mt-4 text-lg font-bold text-foreground">
            Notification Center unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadNotificationCenter()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-background pb-32 font-sans text-foreground selection:bg-indigo-500 selection:text-white">
      {/* =====================================================
          ERROR BAR
      ====================================================== */}

      {errorMessage && (
        <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadNotificationCenter(
                  true
                )
              }
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 transition hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[#1E1B4B] via-[#4338CA] to-[#7C3AED] px-4 pb-24 pt-12 text-white shadow-[0_28px_90px_rgba(79,70,229,0.28)] md:px-8">
        {/* ambient glow */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-[10%] -top-[25%] h-[540px] w-[540px] rounded-full bg-violet-300/15 blur-[120px]" />

          <div className="absolute -bottom-[40%] left-[-10%] h-[380px] w-[380px] rounded-full bg-indigo-300/10 blur-[110px]" />

          <div className="absolute right-[25%] top-[15%] h-48 w-48 rounded-full bg-fuchsia-300/10 blur-[90px]" />
        </div>

        {/* decorative rings */}

        <div className="pointer-events-none absolute right-8 top-10 hidden opacity-30 lg:block">
          <div className="h-44 w-44 rounded-full border border-white/10" />

          <div className="absolute inset-6 rounded-full border border-white/10" />

          <div className="absolute inset-12 rounded-full border border-white/10" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-100 backdrop-blur-md">
              <Bell className="h-3.5 w-3.5" />
              Wallet Notifications
            </div>

            <h1 className="mb-2 text-3xl font-black tracking-[-0.03em] md:text-4xl lg:text-[44px]">
              Notification Center
            </h1>

            <p className="max-w-2xl text-base leading-7 text-indigo-100/80 md:text-lg">
              Stay informed about your wallet,
              payments, security, and financial
              activity.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-semibold text-indigo-100 backdrop-blur-md">
                <ShieldAlert className="h-3.5 w-3.5 text-violet-200" />
                Security alerts
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-semibold text-indigo-100 backdrop-blur-md">
                <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-200" />
                Transaction updates
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-semibold text-indigo-100 backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-amber-200" />
                Smart alerts
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void handleMarkAllRead()
              }
              className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/10 px-5 text-sm font-medium text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all read
            </button>

            <button
              type="button"
              onClick={() =>
                void loadNotificationCenter(
                  true
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-white px-5 text-sm font-extrabold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <div className="relative flex h-11 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 px-3 backdrop-blur-md">
              <Bell className="h-5 w-5 text-white" />

              {unreadCount > 0 && (
                <motion.span
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#4338CA] bg-red-400"
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
            icon={
              <Bell className="h-5 w-5" />
            }
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
            count={criticalCount}
            icon={
              <ShieldAlert className="h-5 w-5" />
            }
            color="red"
            highlight={
              criticalCount > 0
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

        <div className="flex w-full flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm md:w-fit">
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
                  setActiveTab(tab)
                }
                className={`whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  <div className="relative overflow-hidden rounded-3xl border border-red-200/70 bg-red-50 p-6 shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-red-500 to-rose-500" />

                    <h3 className="mb-4 flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
                      <ShieldAlert className="h-5 w-5" />
                      Critical Security Alerts
                    </h3>

                    <div className="space-y-3">
                      {activeNotifications
                        .filter(
                          (notification) =>
                            notification.priority ===
                              "critical" &&
                            !notification.isRead
                        )
                        .map(
                          (alert) => (
                            <div
                              key={
                                alert.id
                              }
                              className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200/70 bg-card p-4 shadow-sm dark:border-red-500/20 md:flex-row md:items-center"
                            >
                              <div>
                                <h4 className="font-bold text-foreground">
                                  {alert.title}
                                </h4>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {alert.message}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setDrawerNotification(
                                    alert
                                  )
                                }
                                className="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
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

                {/* Search */}

                <div className="rounded-[28px] border border-border bg-card p-4 shadow-[0_12px_40px_rgba(15,23,42,0.045)] dark:shadow-none sm:p-5">
                  <div className="space-y-4">
                    <div className="relative w-full">
                      <div className="pointer-events-none absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <Search className="h-[18px] w-[18px]" />
                      </div>

                      <input
                        type="text"
                        placeholder="Search notifications by title, message, or merchant..."
                        value={
                          searchQuery
                        }
                        onChange={(
                          event
                        ) =>
                          setSearchQuery(
                            event.target.value
                          )
                        }
                        className="h-14 w-full rounded-2xl border border-border bg-muted pl-[64px] pr-12 text-sm font-semibold text-foreground outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground hover:border-indigo-300 focus:border-indigo-500 focus:bg-card focus:ring-4 focus:ring-indigo-500/10"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchQuery(
                              ""
                            )
                          }
                          aria-label="Clear search"
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          "all",
                          "unread",
                          "archived",
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
                            className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-extrabold capitalize transition-all ${
                              filterType ===
                              filter
                                ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)]"
                                : "border-border bg-muted text-muted-foreground hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                            }`}
                          >
                            {filter}
                          </button>
                        )
                      )}
                    </div>
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
                                void handleMarkAsRead(
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
                <div className="sticky top-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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

                  <div className="mt-8 border-t border-border pt-6">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
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
                        label={`Archived (${archivedCount})`}
                        onClick={() =>
                          setFilterType(
                            "archived"
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
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="mb-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                    Activity Insights
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Notification Activity
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    A lightweight overview
                    of recent
                    notification activity.
                  </p>
                </div>

                <div className="flex h-64 items-end justify-between gap-2 border-b border-border pb-2">
                  {notificationActivity.map(
                    (
                      item,
                      index
                    ) => {
                      const height =
                        item.count >
                        0
                          ? Math.max(
                              (item.count /
                                maxActivityCount) *
                                100,
                              8
                            )
                          : 3;

                      return (
                        <div
                          key={
                            item.label
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
                                duration: 0.7,
                                delay:
                                  index *
                                  0.06,
                                ease: "easeOut",
                              }}
                              className="relative w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400 opacity-80 transition-opacity group-hover:opacity-100"
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-indigo-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {item.count}{" "}
                                {item.count ===
                                1
                                  ? "Alert"
                                  : "Alerts"}
                              </div>
                            </motion.div>
                          </div>

                          <span className="text-xs font-medium text-muted-foreground">
                            {
                              item.label
                            }
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Top Category
                    </p>

                    <h3 className="mt-2 text-lg font-bold capitalize text-foreground">
                      {
                        categoryStats.topType
                      }
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Most of your current notification history is from this category.
                    </p>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-muted border-r-indigo-500 border-t-violet-500">
                    <span className="text-sm font-bold text-foreground">
                      {
                        categoryStats.topPercent
                      }
                      %
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Notification Grouping
                  </h3>

                  <p className="mb-4 text-sm text-muted-foreground">
                    Similar notification categories can be filtered together to reduce clutter.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setFilterType(
                        "transaction"
                      )
                    }
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-muted p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-blue-100 text-blue-600 dark:border-background dark:bg-blue-500/15 dark:text-blue-300">
                          <ArrowRightLeft className="h-4 w-4" />
                        </div>

                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-emerald-100 text-emerald-600 dark:border-background dark:bg-emerald-500/15 dark:text-emerald-300">
                          <ArrowRightLeft className="h-4 w-4" />
                        </div>
                      </div>

                      <span className="text-sm font-medium text-foreground">
                        {
                          categoryStats.transactionCount
                        }{" "}
                        Transaction Updates
                      </span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                {/* Delivery channels */}

                <div>
                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    Delivery Channels
                  </h2>

                  <p className="mb-6 text-sm text-muted-foreground">
                    How do you want to receive notifications from Coffer Wallet?
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
                            channels: {
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
                            channels: {
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
                            channels: {
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

                <hr className="border-border" />

                {/* Privacy */}

                <div>
                  <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-foreground">
                    <Lock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    Notification Privacy
                  </h2>

                  <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
                    Financial notification best practices hide sensitive account details in preview messages. Detailed transaction information remains securely inside the authenticated application.
                  </p>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted p-4">
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
                            categories: {
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
                            categories: {
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
                            categories: {
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
                            categories: {
                              ...previous.categories,
                              receipt:
                                value,
                            },
                          })
                        )
                      }
                    />

                    <CategoryToggle
                      title="System Updates"
                      desc="Service notices and important product updates."
                      active={
                        preferences
                          .categories
                          .system
                      }
                      onChange={(
                        value
                      ) =>
                        setPreferences(
                          (
                            previous
                          ) => ({
                            ...previous,
                            categories: {
                              ...previous.categories,
                              system:
                                value,
                            },
                          })
                        )
                      }
                    />
                  </div>
                </div>

                <hr className="border-border" />

                {/* Quiet hours */}

                <div className="rounded-2xl border border-border bg-muted p-6">
                  <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-foreground">
                        <BellOff className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                        Quiet Hours
                      </h3>

                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Pause routine notifications at night. Critical alerts can still be delivered.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreferences(
                            (
                              previous
                            ) => ({
                              ...previous,
                              quietHours: {
                                ...previous.quietHours,
                                enabled:
                                  !previous.quietHours
                                    .enabled,
                              },
                            })
                          )
                        }
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          preferences
                            .quietHours
                            .enabled
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                            : "border border-border bg-card text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {preferences
                          .quietHours
                          .enabled
                          ? "Enabled"
                          : "Disabled"}
                      </button>

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
                              quietHours: {
                                ...previous.quietHours,
                                start:
                                  event
                                    .target
                                    .value,
                              },
                            })
                          )
                        }
                        className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      />

                      <span className="text-muted-foreground">
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
                              quietHours: {
                                ...previous.quietHours,
                                end:
                                  event
                                    .target
                                    .value,
                              },
                            })
                          )
                        }
                        className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Digest */}

                <div className="rounded-2xl border border-border bg-card">
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
                                digest,
                              })
                            )
                          }
                          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium capitalize transition ${
                            preferences
                              .digest ===
                            digest
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

                <div className="flex justify-end border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      void handleSavePreferences()
                    }
                    disabled={
                      savingPreferences
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPreferences ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {savingPreferences
                      ? "Saving..."
                      : "Save Preferences"}
                  </button>
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
            className="fixed bottom-8 left-1/2 z-40 flex w-[90%] min-w-0 items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 px-5 py-4 text-white shadow-2xl md:w-auto md:min-w-[400px] md:gap-6"
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
                  void handleBulkAction(
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
                  void handleBulkAction(
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
                  void handleBulkAction(
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
              className="fixed inset-0 z-50 bg-indigo-950/25 backdrop-blur-sm"
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
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl md:w-[450px]"
            >
              <div className="flex items-center justify-between border-b border-border bg-card px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {
                      drawerNotification.type
                    }
                  </span>

                  {!drawerNotification.isRead && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleArchive(
                        drawerNotification.id
                      )
                    }
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-indigo-600"
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
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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

                  <h2 className="mb-2 text-2xl font-bold leading-tight text-foreground">
                    {
                      drawerNotification.title
                    }
                  </h2>

                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />

                    {new Date(
                      drawerNotification.date
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted p-5 text-sm leading-relaxed text-foreground">
                  {
                    drawerNotification.message
                  }
                </div>

                {(drawerNotification.amount !==
                  undefined ||
                  drawerNotification.merchant) && (
                  <div className="overflow-hidden rounded-2xl border border-border">
                    {drawerNotification.amount !==
                      undefined && (
                      <div className="flex justify-between border-b border-border p-4">
                        <span className="text-sm text-muted-foreground">
                          Amount
                        </span>

                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {
                            drawerNotification.currency
                          }
                          {drawerNotification.amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {drawerNotification.merchant && (
                      <div className="flex justify-between p-4">
                        <span className="text-sm text-muted-foreground">
                          Merchant
                        </span>

                        <span className="font-medium text-foreground">
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 font-bold text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500"
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

      {/* =====================================================
          TOAST
      ====================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 28,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            className="fixed bottom-6 right-6 z-[80] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground shadow-2xl"
          >
            {toast}
          </motion.div>
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
      "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",

    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",

    red:
      "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  };

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className={`flex items-center justify-between rounded-3xl border bg-card p-5 transition-all ${
        highlight
          ? "border-amber-300 ring-1 ring-amber-200 shadow-md dark:border-amber-500/30 dark:ring-amber-500/10"
          : "border-border shadow-sm"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>

        <p
          className={`mt-1 text-2xl font-bold ${
            highlight
              ? "text-amber-600 dark:text-amber-400"
              : "text-indigo-700 dark:text-indigo-300"
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
          ? "border-border bg-card shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30"
          : "border-indigo-200 bg-indigo-50/70 shadow-sm hover:border-indigo-300 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:hover:border-indigo-500/30"
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
              ? "border-indigo-600 bg-indigo-600"
              : "border-border bg-card group-hover:border-indigo-500"
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
            <h4 className="truncate font-bold text-foreground">
              {
                notification.title
              }
            </h4>

            {!notification.isRead && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-violet-400" />
            )}

            {notification.priority ===
              "critical" && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-500/15 dark:text-red-300">
                Critical
              </span>
            )}
          </div>

          <p className="line-clamp-1 text-sm text-muted-foreground">
            {
              notification.message
            }
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 md:flex-col md:items-end">
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            {formatTime(
              notification.date
            )}
          </span>

          {notification.actionText && (
            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:underline dark:text-indigo-300">
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
      "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 dark:hover:border-blue-500/40",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 dark:hover:border-amber-500/40",

    red:
      "bg-red-50 text-red-600 border-red-100 hover:border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 dark:hover:border-red-500/40",
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (link) {
          onNavigate(link);
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
      className="flex w-full items-center gap-2 rounded-xl border border-transparent p-3 text-sm font-medium text-muted-foreground transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
    >
      <span className="flex h-5 w-5 items-center justify-center text-indigo-600 dark:text-indigo-400">
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
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card py-20 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
        <Bell className="h-8 w-8 text-indigo-300 dark:text-indigo-400" />
      </div>

      <h3 className="mb-2 text-xl font-bold text-foreground">
        You're all caught up!
      </h3>

      <p className="max-w-sm text-muted-foreground">
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
        onChange(!active)
      }
      aria-pressed={active}
      className={`w-full rounded-2xl border-2 p-4 transition-all ${
        active
          ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-500/10"
          : "border-border bg-card hover:border-indigo-200 dark:hover:border-indigo-500/30"
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={`rounded-full p-3 ${
            active
              ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>

        <h4 className="text-sm font-bold text-foreground">
          {title}
        </h4>

        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
            active
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              : "bg-muted text-muted-foreground"
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
    <div className="flex items-center justify-between gap-4 rounded-xl p-3 transition hover:bg-card">
      <div>
        <h4 className="text-sm font-bold text-foreground">
          {title}
        </h4>

        <p className="text-xs text-muted-foreground">
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
            onChange(!active);
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
            ? "bg-gradient-to-r from-indigo-600 to-violet-600"
            : "bg-slate-300 dark:bg-slate-700"
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
    return "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  }

  if (
    type === "security"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }

  if (
    type ===
    "transaction"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (
    type === "budget"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300";
  }

  if (type === "kyc") {
    return "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300";
  }

  if (
    type === "receipt"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300";
  }

  return "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300";
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
    diffDays ===
    0
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
    diffDays ===
    1
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