"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { useUsers } from "@/hooks/useUsers";

import UserManagementHeader from "./components/UserManagementHeader";
import UserManagementStats from "./components/UserManagementStats";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserDetailsDrawer from "./components/UserDetailsDrawer";

import {
  CreateUserModal,
  DeleteUserModal,
  ExportUsersModal,
  SuspendUserModal,
} from "./components/UserActionModals";

import BulkActionBar from "./components/BulkActionBar";

import type {
  UserRecord,
  UserStatus,
} from "./components/UserManagementTypes";

/* =========================================================
   PAGE
========================================================= */

export default function UsersPage() {
  const {
    users,
    filteredUsers,
    paginatedUsers,
    stats,
    filters,
    columns,
    sort,
    search,
    page,
    pageSize,
    totalPages,
    loading,
    refreshing,
    toast,
    setToast,
    setSearch,
    setPage,
    updatePageSize,
    setFilter,
    clearFilters,
    toggleColumn,
    toggleSort,
    createUser,
    updateUser,
    deleteUser,
    bulkUpdate,
    refresh,
    tryLoadRealProfile,
  } = useUsers();

  /* =======================================================
     LOCAL UI STATE
  ======================================================= */

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<UserRecord | null>(
      null
    );

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    exportOpen,
    setExportOpen,
  ] = useState(false);

  const [
    suspendUser,
    setSuspendUser,
  ] =
    useState<UserRecord | null>(
      null
    );

  const [
    deleteUserTarget,
    setDeleteUserTarget,
  ] =
    useState<UserRecord | null>(
      null
    );

  const [
    currentRole,
    setCurrentRole,
  ] = useState<
    "admin" | "user"
  >("admin");

  /* =======================================================
     ADMIN ROLE CHECK
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    void tryLoadRealProfile().then(
      (role) => {
        if (!mounted) {
          return;
        }

        setCurrentRole(
          String(role).toLowerCase() ===
            "admin"
            ? "admin"
            : "user"
        );
      }
    );

    return () => {
      mounted = false;
    };
  }, [
    tryLoadRealProfile,
  ]);

  /* =======================================================
     SELECTED USERS
  ======================================================= */

  const selectedUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            selectedIds.has(
              user.id
            )
        ),
      [
        users,
        selectedIds,
      ]
    );

  /* =======================================================
     KEEP SELECTION VALID
  ======================================================= */

  useEffect(() => {
    if (
      selectedIds.size ===
      0
    ) {
      return;
    }

    const validIds =
      new Set(
        users.map(
          (user) =>
            user.id
        )
      );

    setSelectedIds(
      (current) => {
        const next =
          new Set<string>();

        current.forEach(
          (id) => {
            if (
              validIds.has(
                id
              )
            ) {
              next.add(
                id
              );
            }
          }
        );

        if (
          next.size ===
          current.size
        ) {
          return current;
        }

        return next;
      }
    );
  }, [
    users,
    selectedIds.size,
  ]);

  /* =======================================================
     SELECTION
  ======================================================= */

  const toggleUser = (
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

  const toggleAll = (
    checked: boolean
  ) => {
    if (!checked) {
      setSelectedIds(
        new Set()
      );
      return;
    }

    setSelectedIds(
      new Set(
        paginatedUsers.map(
          (user) =>
            user.id
        )
      )
    );
  };

  const clearSelection =
    () => {
      setSelectedIds(
        new Set()
      );
    };

  /* =======================================================
     BULK STATUS UPDATE
  ======================================================= */

  const bulkUpdateStatus =
    async (
      status: Extract<
        UserStatus,
        "active" | "suspended"
      >
    ) => {
      if (
        !selectedUsers.length
      ) {
        return;
      }

      try {
        const ids =
          selectedUsers.map(
            (user) =>
              user.id
          );

        await bulkUpdate(
          ids,
          {
            status,
            walletStatus:
              status ===
              "suspended"
                ? "frozen"
                : "active",
          }
        );

        clearSelection();
      } catch {
        /*
         * useUsers handles the
         * error toast.
         */
      }
    };

  /* =======================================================
     BULK FREEZE
  ======================================================= */

  const handleFreeze =
    async () => {
      if (
        !selectedUsers.length
      ) {
        return;
      }

      try {
        const ids =
          selectedUsers.map(
            (user) =>
              user.id
          );

        await bulkUpdate(
          ids,
          {
            walletStatus:
              "frozen",
          }
        );

        clearSelection();
      } catch {
        /*
         * useUsers handles error.
         */
      }
    };

  /* =======================================================
     OPEN USER
  ======================================================= */

  const handleOpenUser =
    (
      user: UserRecord
    ) => {
      setSelectedUser(
        user
      );
    };

  /* =======================================================
     ADMIN GUARD
  ======================================================= */

  if (
    currentRole !==
    "admin"
  ) {
    return (
      <main
        className="
          min-h-screen
          overflow-x-hidden
          bg-background
          px-4
          py-8
          text-foreground
          transition-colors
          duration-300
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto w-full max-w-2xl">
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.35,
            }}
            className="
              overflow-hidden
              rounded-[30px]
              border
              border-border
              bg-card
              p-8
              text-center
              shadow-[var(--dashboard-shadow)]
            "
          >
            <motion.div
              animate={{
                y: [
                  0,
                  -4,
                  0,
                ],
              }}
              transition={{
                duration: 3,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
              "
              style={{
                background:
                  "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",
                color:
                  "var(--dashboard-danger)",
              }}
            >
              <ShieldCheck className="h-8 w-8" />
            </motion.div>

            <h1 className="mt-5 text-2xl font-black tracking-tight text-card-foreground">
              Administrator access required
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              This page is reserved for administrators.
              The backend must independently enforce the
              actual authorization rules.
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-background
        pb-28
        text-foreground
        transition-colors
        duration-300
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1680px]
          space-y-5
          px-4
          py-4
          sm:px-6
          lg:px-8
          lg:py-6
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <UserManagementHeader
          refreshing={
            refreshing
          }
          onRefresh={
            refresh
          }
          onAddUser={() =>
            setCreateOpen(
              true
            )
          }
          onExport={() =>
            setExportOpen(
              true
            )
          }
        />

        {/* =================================================
            STATS
        ================================================= */}

        <UserManagementStats
          stats={stats}
        />

        {/* =================================================
            OPERATIONAL OVERVIEW
        ================================================= */}

        <OperationalOverview
          users={users}
          onOpenUser={
            handleOpenUser
          }
        />

        {/* =================================================
            FILTERS
        ================================================= */}

        <UserFilters
          search={search}
          onSearchChange={
            setSearch
          }
          filters={
            filters
          }
          setFilter={
            setFilter
          }
          clearFilters={
            clearFilters
          }
          columns={
            columns
          }
          toggleColumn={
            toggleColumn
          }
          filteredCount={
            filteredUsers.length
          }
        />

        {/* =================================================
            TABLE
        ================================================= */}

        <AnimatePresence
          mode="wait"
        >
          {loading ? (
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
            >
              <LoadingState />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.22,
              }}
            >
              <UserTable
                users={
                  paginatedUsers
                }
                columns={
                  columns
                }
                selectedIds={
                  selectedIds
                }
                sort={
                  sort
                }
                page={
                  page
                }
                pageSize={
                  pageSize
                }
                totalFiltered={
                  filteredUsers.length
                }
                totalPages={
                  totalPages
                }
                onToggle={
                  toggleUser
                }
                onToggleAll={
                  toggleAll
                }
                onOpenUser={
                  handleOpenUser
                }
                onEditUser={
                  handleOpenUser
                }
                onSuspendUser={(
                  user
                ) =>
                  setSuspendUser(
                    user
                  )
                }
                onDeleteUser={(
                  user
                ) =>
                  setDeleteUserTarget(
                    user
                  )
                }
                onSort={
                  toggleSort
                }
                onPageChange={
                  setPage
                }
                onPageSizeChange={
                  updatePageSize
                }
                onClearFilters={
                  clearFilters
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================
          BULK ACTION BAR
      ==================================================== */}

      <AnimatePresence>
        {selectedIds.size >
          0 && (
          <BulkActionBar
            count={
              selectedIds.size
            }
            onClear={
              clearSelection
            }
            onActivate={() =>
              void bulkUpdateStatus(
                "active"
              )
            }
            onSuspend={() =>
              void bulkUpdateStatus(
                "suspended"
              )
            }
            onFreeze={() =>
              void handleFreeze()
            }
            onExport={() =>
              setExportOpen(
                true
              )
            }
          />
        )}
      </AnimatePresence>

      {/* ===================================================
          DETAILS DRAWER
      ==================================================== */}

      <UserDetailsDrawer
        user={
          selectedUser
        }
        onClose={() =>
          setSelectedUser(
            null
          )
        }
        onUpdateUser={
          updateUser
        }
      />

      {/* ===================================================
          CREATE USER
      ==================================================== */}

      <CreateUserModal
        open={
          createOpen
        }
        onClose={() =>
          setCreateOpen(
            false
          )
        }
        onCreate={
          createUser
        }
      />

      {/* ===================================================
          EXPORT USERS
      ==================================================== */}

      <ExportUsersModal
        open={
          exportOpen
        }
        onClose={() =>
          setExportOpen(
            false
          )
        }
        users={
          filteredUsers
        }
      />

      {/* ===================================================
          SUSPEND USER
      ==================================================== */}

      <SuspendUserModal
        user={
          suspendUser
        }
        onClose={() =>
          setSuspendUser(
            null
          )
        }
        onConfirm={async (
          id,
          reason
        ) => {
          await updateUser(
            id,
            {
              status:
                "suspended",
              walletStatus:
                "frozen",
            }
          );

          setToast({
            type:
              "success",
            message:
              reason
                ? `User suspended. Reason: ${reason}`
                : "User suspended.",
          });

          setSuspendUser(
            null
          );
        }}
      />

      {/* ===================================================
          DELETE USER
      ==================================================== */}

      <DeleteUserModal
        user={
          deleteUserTarget
        }
        onClose={() =>
          setDeleteUserTarget(
            null
          )
        }
        onConfirm={async (
          id
        ) => {
          await deleteUser(
            id
          );

          setDeleteUserTarget(
            null
          );

          setSelectedIds(
            (current) => {
              const next =
                new Set(
                  current
                );

              next.delete(
                id
              );

              return next;
            }
          );

          if (
            selectedUser?.id ===
            id
          ) {
            setSelectedUser(
              null
            );
          }
        }}
      />

      {/* ===================================================
          TOAST
      ==================================================== */}

      <AnimatePresence>
        {toast && (
          <AnimateToast
            toast={
              toast
            }
            onClose={() =>
              setToast(
                null
              )
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   OPERATIONAL OVERVIEW
========================================================= */

function OperationalOverview({
  users,
  onOpenUser,
}: {
  users: UserRecord[];
  onOpenUser: (
    user: UserRecord
  ) => void;
}) {
  const total =
    Math.max(
      1,
      users.length
    );

  const healthyCount =
    users.filter(
      (user) =>
        user.status ===
          "active" &&
        user.riskLevel ===
          "low" &&
        user.kycStatus ===
          "verified"
    ).length;

  const kycPending =
    users.filter(
      (user) =>
        user.kycStatus ===
          "pending" ||
        user.kycStatus ===
          "under_review"
    ).length;

  const highRisk =
    users.filter(
      (user) =>
        user.riskLevel ===
        "high"
    );

  const suspendedCount =
    users.filter(
      (user) =>
        user.status ===
        "suspended"
    ).length;

  const healthyPercent =
    Math.round(
      (healthyCount /
        total) *
        100
    );

  const pendingPercent =
    Math.round(
      (kycPending /
        total) *
        100
    );

  const highRiskPercent =
    Math.round(
      (highRisk.length /
        total) *
        100
    );

  const suspendedPercent =
    Math.round(
      (suspendedCount /
        total) *
        100
    );

  return (
    <section
      className="
        grid
        min-w-0
        gap-5
        lg:grid-cols-[minmax(0,1.65fr)_minmax(310px,.75fr)]
      "
    >
      {/* =================================================
          POPULATION HEALTH
      ================================================== */}

      <motion.article
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          transition-colors
          duration-300
          sm:p-6
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              User base health
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-card-foreground">
              Population overview
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
              A live operational snapshot of account status,
              verification and risk distribution.
            </p>
          </div>

          <motion.div
            whileHover={{
              scale: 1.03,
            }}
            className="
              w-fit
              rounded-2xl
              border
              px-4
              py-3
            "
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-success) 9%, var(--card))",
              borderColor:
                "color-mix(in srgb, var(--dashboard-success) 20%, var(--border))",
            }}
          >
            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.12em]
              "
              style={{
                color:
                  "var(--dashboard-success)",
              }}
            >
              Healthy base
            </p>

            <p
              className="mt-1 text-2xl font-black"
              style={{
                color:
                  "var(--dashboard-success)",
              }}
            >
              {healthyPercent}%
            </p>
          </motion.div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-8 md:flex-row">
          <HealthDonut
            users={users}
          />

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <HealthLegend
              label="Healthy"
              value={`${healthyPercent}%`}
              tone="success"
            />

            <HealthLegend
              label="KYC pending"
              value={`${pendingPercent}%`}
              tone="warning"
            />

            <HealthLegend
              label="High risk"
              value={`${highRiskPercent}%`}
              tone="danger"
            />

            <HealthLegend
              label="Suspended"
              value={`${suspendedPercent}%`}
              tone="neutral"
            />
          </div>
        </div>
      </motion.article>

      {/* =================================================
          RISK WATCHLIST
      ================================================== */}

      <motion.article
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
        }}
        className="
          min-w-0
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          transition-colors
          duration-300
          sm:p-6
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Risk watchlist
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-card-foreground">
              Needs attention
            </h2>

            <p className="mt-1 text-[10px] text-muted-foreground">
              High-risk accounts from current user data.
            </p>
          </div>

          <motion.span
            animate={{
              scale: [
                1,
                1.08,
                1,
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
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
            "
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
              color:
                "var(--dashboard-warning)",
            }}
          >
            <AlertTriangle className="h-5 w-5" />
          </motion.span>
        </div>

        <div className="mt-5 space-y-2.5">
          {highRisk.length ===
          0 ? (
            <div
              className="
                rounded-2xl
                border
                p-4
              "
              style={{
                background:
                  "color-mix(in srgb, var(--dashboard-success) 8%, var(--card))",
                borderColor:
                  "color-mix(in srgb, var(--dashboard-success) 18%, var(--border))",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                  "
                  style={{
                    background:
                      "color-mix(in srgb, var(--dashboard-success) 12%, transparent)",
                    color:
                      "var(--dashboard-success)",
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>

                <div>
                  <p
                    className="text-xs font-black"
                    style={{
                      color:
                        "var(--dashboard-success)",
                    }}
                  >
                    No high-risk users
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Current user population has no accounts
                    marked as high risk.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            highRisk
              .slice(
                0,
                4
              )
              .map(
                (
                  user,
                  index
                ) => (
                  <motion.button
                    key={
                      user.id
                    }
                    type="button"
                    initial={{
                      opacity: 0,
                      x: 8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        0.12 +
                        index *
                          0.04,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    whileTap={{
                      scale:
                        0.99,
                    }}
                    onClick={() =>
                      onOpenUser(
                        user
                      )
                    }
                    className="
                      group
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-2xl
                      border
                      border-border
                      bg-muted/30
                      p-3
                      text-left
                      transition-all
                      hover:bg-[var(--dashboard-primary-soft)]
                    "
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          text-[9px]
                          font-black
                        "
                        style={{
                          background:
                            "color-mix(in srgb, var(--dashboard-danger) 11%, var(--card))",
                          color:
                            "var(--dashboard-danger)",
                        }}
                      >
                        {getInitials(
                          user.name
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-card-foreground">
                          {
                            user.name
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Risk score{" "}
                          {
                            user.riskScore
                          }
                          /100
                        </p>
                      </div>
                    </div>

                    <MoreHorizontal
                      className="
                        h-4
                        w-4
                        shrink-0
                        text-muted-foreground/40
                        transition
                        group-hover:text-[var(--dashboard-primary)]
                      "
                    />
                  </motion.button>
                )
              )
          )}
        </div>
      </motion.article>
    </section>
  );
}

/* =========================================================
   HEALTH DONUT
========================================================= */

function HealthDonut({
  users,
}: {
  users: UserRecord[];
}) {
  const total =
    Math.max(
      1,
      users.length
    );

  const healthy =
    users.filter(
      (user) =>
        user.status ===
          "active" &&
        user.riskLevel ===
          "low" &&
        user.kycStatus ===
          "verified"
    ).length;

  const pending =
    users.filter(
      (user) =>
        user.kycStatus ===
          "pending" ||
        user.kycStatus ===
          "under_review"
    ).length;

  const highRisk =
    users.filter(
      (user) =>
        user.riskLevel ===
        "high"
    ).length;

  const suspended =
    users.filter(
      (user) =>
        user.status ===
        "suspended"
    ).length;

  const other =
    Math.max(
      0,
      users.length -
        healthy -
        pending -
        highRisk -
        suspended
    );

  const segments = [
    {
      value: healthy,
      color:
        "var(--dashboard-success)",
    },
    {
      value: pending,
      color:
        "var(--dashboard-warning)",
    },
    {
      value: highRisk,
      color:
        "var(--dashboard-danger)",
    },
    {
      value: suspended,
      color:
        "#94a3b8",
    },
    {
      value: other,
      color:
        "var(--dashboard-primary)",
    },
  ];

  const radius = 40;

  const circumference =
    2 *
    Math.PI *
    radius;

  let accumulated = 0;

  return (
    <div className="relative h-44 w-44 shrink-0">
      <motion.svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        initial={{
          rotate: -78,
        }}
        animate={{
          rotate: -90,
        }}
        transition={{
          duration: 0.7,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        role="img"
        aria-label="User population health distribution"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="11"
        />

        {segments.map(
          (
            segment,
            index
          ) => {
            const dash =
              (segment.value /
                total) *
              circumference;

            const offset =
              -(
                accumulated /
                total
              ) *
              circumference;

            accumulated +=
              segment.value;

            return (
              <motion.circle
                key={
                  index
                }
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={
                  segment.color
                }
                strokeWidth="11"
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${
                  circumference -
                  dash
                }`}
                strokeDashoffset={
                  offset
                }
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity:
                    1,
                }}
                transition={{
                  duration:
                    0.55,
                  delay:
                    index *
                    0.07,
                }}
              />
            );
          }
        )}
      </motion.svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          key={
            users.length
          }
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="text-3xl font-black tracking-tight text-card-foreground"
        >
          {users.length.toLocaleString()}
        </motion.p>

        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
          Users
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function HealthLegend({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "success"
    | "warning"
    | "danger"
    | "neutral";
}) {
  const style =
    tone ===
    "success"
      ? {
          background:
            "color-mix(in srgb, var(--dashboard-success) 9%, var(--card))",
          borderColor:
            "color-mix(in srgb, var(--dashboard-success) 18%, var(--border))",
          dot:
            "var(--dashboard-success)",
        }
      : tone ===
          "warning"
        ? {
            background:
              "color-mix(in srgb, var(--dashboard-warning) 9%, var(--card))",
            borderColor:
              "color-mix(in srgb, var(--dashboard-warning) 18%, var(--border))",
            dot:
              "var(--dashboard-warning)",
          }
        : tone ===
            "danger"
          ? {
              background:
                "color-mix(in srgb, var(--dashboard-danger) 9%, var(--card))",
              borderColor:
                "color-mix(in srgb, var(--dashboard-danger) 18%, var(--border))",
              dot:
                "var(--dashboard-danger)",
            }
          : {
              background:
                "var(--muted)",
              borderColor:
                "var(--border)",
              dot:
                "var(--muted-foreground)",
            };

  return (
    <motion.div
      whileHover={{
        y: -1,
      }}
      className="
        flex
        items-center
        justify-between
        rounded-xl
        border
        p-3
        transition-colors
      "
      style={{
        background:
          style.background,
        borderColor:
          style.borderColor,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background:
              style.dot,
          }}
        />

        <span className="text-[10px] font-bold text-muted-foreground">
          {label}
        </span>
      </div>

      <span className="text-[10px] font-black text-card-foreground">
        {value}
      </span>
    </motion.div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-border
        bg-card
        p-5
        shadow-[var(--dashboard-shadow)]
      "
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
        </div>

        {Array.from({
          length: 7,
        }).map(
          (
            _,
            index
          ) => (
            <motion.div
              key={
                index
              }
              initial={{
                opacity: 0.4,
              }}
              animate={{
                opacity: [
                  0.4,
                  0.75,
                  0.4,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat:
                  Infinity,
                delay:
                  index *
                  0.05,
              }}
              className="h-14 rounded-2xl bg-muted"
            />
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function AnimateToast({
  toast,
  onClose,
}: {
  toast:
    | {
        type?: string;
        message?: string;
      }
    | null;

  onClose: () => void;
}) {
  if (!toast) {
    return null;
  }

  const isSuccess =
    toast.type ===
    "success";

  const isError =
    toast.type ===
    "error";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 30,
        y: -10,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        x: 30,
        scale: 0.97,
      }}
      transition={{
        duration: 0.22,
      }}
      className="
        fixed
        right-4
        top-4
        z-[150]
        w-[calc(100%-2rem)]
        max-w-sm
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-card
        shadow-2xl
      "
    >
      <div
        className="h-1 w-full"
        style={{
          background:
            isSuccess
              ? "var(--dashboard-success)"
              : isError
                ? "var(--dashboard-danger)"
                : "var(--dashboard-primary)",
        }}
      />

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p
            className="text-xs font-black"
            style={{
              color:
                isSuccess
                  ? "var(--dashboard-success)"
                  : isError
                    ? "var(--dashboard-danger)"
                    : "var(--dashboard-primary)",
            }}
          >
            {isSuccess
              ? "Success"
              : isError
                ? "Error"
                : "Updated"}
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {
              toast.message
            }
          </p>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-muted-foreground
            transition
            hover:bg-muted
            hover:text-foreground
          "
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name: string
): string {
  if (!name) {
    return "U";
  }

  return (
    name
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (part) =>
          part.charAt(
            0
          )
      )
      .join("")
      .toUpperCase() ||
    "U"
  );
}