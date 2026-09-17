"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ColumnKey,
  ColumnVisibility,
  CreateUserInput,
  SortField,
  SortState,
  ToastState,
  UpdateUserInput,
  UserFilterKey,
  UserFilters,
  UserRecord,
  UserStats,
} from "@/app/(dashboard)/dashboard/users/components/UserManagementTypes";

import { usersApi } from "@/lib/api/users-api";

/* =========================================================
   DEFAULT FILTERS
========================================================= */

const defaultFilters: UserFilters = {
  status: "all",
  kycStatus: "all",
  role: "all",
  riskLevel: "all",
  walletStatus: "all",
  activity: "all",
};

/* =========================================================
   DEFAULT COLUMNS
========================================================= */

const defaultColumns: ColumnVisibility = {
  phone: true,
  role: true,
  kyc: true,
  wallet: true,
  risk: true,
  lastActive: true,
  joined: false,
};

/* =========================================================
   VALID PAGE SIZES
========================================================= */

const PAGE_SIZES = [10, 25, 50] as const;

type ValidPageSize = (typeof PAGE_SIZES)[number];

/* =========================================================
   CONSTANTS
========================================================= */

const INACTIVE_30_DAYS = 30 * 24 * 60 * 60 * 1000;

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

/*
 * Small polling interval.
 *
 * This keeps the admin user list reasonably fresh while
 * avoiding aggressive API traffic.
 */
const POLLING_INTERVAL = 10_000;

/* =========================================================
   HOOK
========================================================= */

export function useUsers() {
  /* =======================================================
     USER DATA
  ======================================================= */

  const [users, setUsers] =
    useState<UserRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =======================================================
     FILTER / SEARCH
  ======================================================= */

  const [search, setSearchState] =
    useState("");

  const [filters, setFilters] =
    useState<UserFilters>(
      defaultFilters
    );

  /* =======================================================
     COLUMNS
  ======================================================= */

  const [columns, setColumns] =
    useState<ColumnVisibility>(
      defaultColumns
    );

  /* =======================================================
     SORT
  ======================================================= */

  const [sort, setSort] =
    useState<SortState>({
      field: "lastActive",
      direction: "desc",
    });

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState<ValidPageSize>(10);

  /* =======================================================
     TOAST
  ======================================================= */

  const [toast, setToast] =
    useState<ToastState | null>(
      null
    );

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers = useCallback(
    async (
      refresh = false
    ) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response =
          await usersApi.list();

        const nextUsers =
          Array.isArray(
            response?.users
          )
            ? response.users
            : [];

        setUsers(
          nextUsers
        );

        /*
         * Keep current page valid
         * when fresh backend data changes.
         */
        const backendTotalPages =
          Math.max(
            1,
            Math.ceil(
              nextUsers.length /
                pageSize
            )
          );

        setPage(
          (
            currentPage
          ) =>
            Math.min(
              currentPage,
              backendTotalPages
            )
        );

        if (refresh) {
          setToast({
            type: "success",
            message:
              "User data refreshed successfully.",
          });
        }
      } catch (error) {
        /*
         * During refresh, keep old data visible
         * instead of wiping a working table.
         */
        if (!refresh) {
          setUsers([]);
        }

        setToast({
          type: "error",
          message:
            getError(error),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* =======================================================
     AUTO REFRESH / POLLING
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const refreshUsers =
      async () => {
        if (cancelled) {
          return;
        }

        try {
          /*
           * Silent refresh:
           * we intentionally don't trigger
           * the visible "refreshing" state.
           */
          const response =
            await usersApi.list();

          if (
            cancelled
          ) {
            return;
          }

          const nextUsers =
            Array.isArray(
              response?.users
            )
              ? response.users
              : [];

          setUsers(
            nextUsers
          );

          setPage(
            (
              currentPage
            ) => {
              const maxPages =
                Math.max(
                  1,
                  Math.ceil(
                    nextUsers.length /
                      pageSize
                  )
                );

              return Math.min(
                currentPage,
                maxPages
              );
            }
          );
        } catch (
          error
        ) {
          /*
           * Polling failures are intentionally
           * silent so the dashboard does not show
           * repeated error toasts every 10 seconds.
           */
          console.error(
            "USER POLLING ERROR:",
            error
          );
        }
      };

    const intervalId =
      window.setInterval(
        () => {
          void refreshUsers();
        },
        POLLING_INTERVAL
      );

    const handleFocus =
      () => {
        void refreshUsers();
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [pageSize]);

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const filteredUsers =
    useMemo(() => {
      const now =
        Date.now();

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const result =
        users.filter(
          (
            user
          ) => {
            /* ---------------------------------------------
               SEARCH
            ---------------------------------------------- */

            const searchableValues =
              [
                user.name,
                user.email,
                user.phone,
                user.id,
                user.walletId,
                user.city,
                user.country,
              ];

            const matchesSearch =
              !normalizedSearch ||
              searchableValues.some(
                (
                  value
                ) =>
                  String(
                    value ??
                      ""
                  )
                    .toLowerCase()
                    .includes(
                      normalizedSearch
                    )
              );

            if (
              !matchesSearch
            ) {
              return false;
            }

            /* ---------------------------------------------
               STATUS
            ---------------------------------------------- */

            const matchesStatus =
              filters.status ===
                "all" ||
              user.status ===
                filters.status;

            if (
              !matchesStatus
            ) {
              return false;
            }

            /* ---------------------------------------------
               KYC
            ---------------------------------------------- */

            const matchesKyc =
              filters.kycStatus ===
                "all" ||
              user.kycStatus ===
                filters.kycStatus;

            if (
              !matchesKyc
            ) {
              return false;
            }

            /* ---------------------------------------------
               ROLE
            ---------------------------------------------- */

            const matchesRole =
              filters.role ===
                "all" ||
              user.role ===
                filters.role;

            if (
              !matchesRole
            ) {
              return false;
            }

            /* ---------------------------------------------
               RISK
            ---------------------------------------------- */

            const matchesRisk =
              filters.riskLevel ===
                "all" ||
              user.riskLevel ===
                filters.riskLevel;

            if (
              !matchesRisk
            ) {
              return false;
            }

            /* ---------------------------------------------
               WALLET
            ---------------------------------------------- */

            const matchesWallet =
              filters.walletStatus ===
                "all" ||
              user.walletStatus ===
                filters.walletStatus;

            if (
              !matchesWallet
            ) {
              return false;
            }

            /* ---------------------------------------------
               ACTIVITY
            ---------------------------------------------- */

            const matchesActivity =
              filters.activity ===
                "all" ||
              (() => {
                const lastActive =
                  new Date(
                    user.lastActive
                  ).getTime();

                if (
                  !Number.isFinite(
                    lastActive
                  )
                ) {
                  return (
                    filters.activity ===
                    "inactive"
                  );
                }

                const age =
                  now -
                  lastActive;

                if (
                  filters.activity ===
                  "today"
                ) {
                  return (
                    age >= 0 &&
                    age <=
                      24 *
                        60 *
                        60 *
                        1000
                  );
                }

                if (
                  filters.activity ===
                  "week"
                ) {
                  return (
                    age >= 0 &&
                    age <=
                      ONE_WEEK
                  );
                }

                return (
                  age >
                  INACTIVE_30_DAYS
                );
              })();

            return matchesActivity;
          }
        );

      /* ===================================================
         SORT
      ==================================================== */

      return result.sort(
        (
          firstUser,
          secondUser
        ) => {
          const firstValue =
            valueForSort(
              firstUser,
              sort.field
            );

          const secondValue =
            valueForSort(
              secondUser,
              sort.field
            );

          let comparison = 0;

          if (
            typeof firstValue ===
              "number" &&
            typeof secondValue ===
              "number"
          ) {
            comparison =
              firstValue -
              secondValue;
          } else {
            comparison =
              String(
                firstValue ??
                  ""
              ).localeCompare(
                String(
                  secondValue ??
                    ""
                ),
                undefined,
                {
                  numeric: true,
                  sensitivity:
                    "base",
                }
              );
          }

          return sort.direction ===
            "asc"
            ? comparison
            : -comparison;
        }
      );
    }, [
      filters,
      search,
      sort,
      users,
    ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length /
          pageSize
      )
    );

  const safePage =
    Math.min(
      Math.max(
        page,
        1
      ),
      totalPages
    );

  const paginatedUsers =
    filteredUsers.slice(
      (safePage - 1) *
        pageSize,
      safePage *
        pageSize
    );

  /* =======================================================
     KEEP PAGE VALID
  ======================================================= */

  useEffect(() => {
    if (
      page !==
      safePage
    ) {
      setPage(
        safePage
      );
    }
  }, [
    page,
    safePage,
  ]);

  /* =======================================================
     USER STATISTICS
  ======================================================= */

  const stats =
    useMemo<UserStats>(
      () => {
        const weekAgo =
          Date.now() -
          ONE_WEEK;

        return {
          totalUsers:
            users.length,

          activeUsers:
            users.filter(
              (
                user
              ) =>
                user.status ===
                "active"
            ).length,

          suspended:
            users.filter(
              (
                user
              ) =>
                user.status ===
                "suspended"
            ).length,

          pendingKyc:
            users.filter(
              (
                user
              ) =>
                user.kycStatus ===
                  "pending" ||
                user.kycStatus ===
                  "under_review"
            ).length,

          highRisk:
            users.filter(
              (
                user
              ) =>
                user.riskLevel ===
                "high"
            ).length,

          newThisWeek:
            users.filter(
              (
                user
              ) => {
                const joined =
                  new Date(
                    user.joinedAt
                  ).getTime();

                return (
                  Number.isFinite(
                    joined
                  ) &&
                  joined >=
                    weekAgo
                );
              }
            ).length,
        };
      },
      [users]
    );

  /* =======================================================
     SEARCH
  ======================================================= */

  const setSearch =
    useCallback(
      (
        value: string
      ) => {
        setSearchState(
          value
        );

        setPage(
          1
        );
      },
      []
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const setFilter =
    useCallback(
      <
        K extends UserFilterKey
      >(
        key: K,
        value: UserFilters[K]
      ) => {
        setFilters(
          (
            current
          ) => ({
            ...current,
            [key]:
              value,
          })
        );

        setPage(
          1
        );
      },
      []
    );

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    useCallback(
      () => {
        setFilters(
          defaultFilters
        );

        setSearchState(
          ""
        );

        setPage(
          1
        );
      },
      []
    );

  /* =======================================================
     COLUMN VISIBILITY
  ======================================================= */

  const toggleColumn =
    useCallback(
      (
        key: ColumnKey
      ) => {
        setColumns(
          (
            current
          ) => ({
            ...current,
            [key]:
              !current[key],
          })
        );
      },
      []
    );

  /* =======================================================
     SORT
  ======================================================= */

  const toggleSort =
    useCallback(
      (
        field: SortField
      ) => {
        setSort(
          (
            current
          ) => {
            if (
              current.field ===
              field
            ) {
              return {
                field,
                direction:
                  current.direction ===
                  "asc"
                    ? "desc"
                    : "asc",
              };
            }

            return {
              field,
              direction:
                "asc",
            };
          }
        );

        setPage(
          1
        );
      },
      []
    );

  /* =======================================================
     PAGE SIZE
  ======================================================= */

  const updatePageSize =
    useCallback(
      (
        size: number
      ) => {
        const nextSize =
          PAGE_SIZES.includes(
            size as ValidPageSize
          )
            ? (size as ValidPageSize)
            : 10;

        setPageSize(
          nextSize
        );

        setPage(
          1
        );
      },
      []
    );

  /* =======================================================
     CREATE USER
  ======================================================= */

  const createUser =
    useCallback(
      async (
        input: CreateUserInput
      ) => {
        try {
          const createdUser =
            await usersApi.create(
              input
            );

          /*
           * Backend remains source of truth.
           *
           * We optimistically insert the response,
           * then silently refresh so server-normalized
           * values are reflected.
           */
          setUsers(
            (
              current
            ) => [
              createdUser,
              ...current.filter(
                (
                  user
                ) =>
                  user.id !==
                  createdUser.id
              ),
            ]
          );

          setPage(
            1
          );

          setToast({
            type: "success",
            message: `${createdUser.name} was created successfully.`,
          });

          /*
           * Sync again with backend.
           */
          try {
            const response =
              await usersApi.list();

            if (
              Array.isArray(
                response?.users
              )
            ) {
              setUsers(
                response.users
              );
            }
          } catch (
            syncError
          ) {
            console.error(
              "CREATE USER SYNC ERROR:",
              syncError
            );
          }
        } catch (
          error
        ) {
          setToast({
            type: "error",
            message:
              getError(
                error
              ),
          });

          throw error;
        }
      },
      []
    );

  /* =======================================================
     UPDATE USER
  ======================================================= */

  const updateUser =
    useCallback(
      async (
        id: string,
        patch: UpdateUserInput
      ) => {
        try {
          const updatedUser =
            await usersApi.update(
              id,
              patch
            );

          setUsers(
            (
              current
            ) =>
              current.map(
                (
                  user
                ) =>
                  user.id === id
                    ? updatedUser
                    : user
              )
          );

          setToast({
            type: "success",
            message:
              "User changes saved successfully.",
          });

          /*
           * Re-fetch the list because
           * backend may normalize/recalculate
           * wallet, risk, KYC, sessions etc.
           */
          try {
            const response =
              await usersApi.list();

            if (
              Array.isArray(
                response?.users
              )
            ) {
              setUsers(
                response.users
              );
            }
          } catch (
            syncError
          ) {
            console.error(
              "UPDATE USER SYNC ERROR:",
              syncError
            );
          }
        } catch (
          error
        ) {
          setToast({
            type: "error",
            message:
              getError(
                error
              ),
          });

          throw error;
        }
      },
      []
    );

  /* =======================================================
     DELETE USER
  ======================================================= */

  const deleteUser =
    useCallback(
      async (
        id: string
      ) => {
        try {
          await usersApi.remove(
            id
          );

          setUsers(
            (
              current
            ) =>
              current.filter(
                (
                  user
                ) =>
                  user.id !==
                  id
              )
          );

          setToast({
            type: "success",
            message:
              "User deleted successfully.",
          });
        } catch (
          error
        ) {
          setToast({
            type: "error",
            message:
              getError(
                error
              ),
          });

          throw error;
        }
      },
      []
    );

  /* =======================================================
     BULK UPDATE
  ======================================================= */

  const bulkUpdate =
    useCallback(
      async (
        ids: string[],
        patch: UpdateUserInput
      ) => {
        const uniqueIds =
          [
            ...new Set(
              ids.filter(
                Boolean
              )
            ),
          ];

        if (
          uniqueIds.length ===
          0
        ) {
          return;
        }

        try {
          await usersApi.bulkUpdate(
            uniqueIds,
            patch
          );

          const selectedIds =
            new Set(
              uniqueIds
            );

          setUsers(
            (
              current
            ) =>
              current.map(
                (
                  user
                ) =>
                  selectedIds.has(
                    user.id
                  )
                    ? {
                        ...user,
                        ...patch,
                      }
                    : user
              )
          );

          setToast({
            type: "success",
            message: `${uniqueIds.length} user(s) updated successfully.`,
          });

          /*
           * Important:
           * Some server-side fields may be recalculated.
           * Sync after bulk operation.
           */
          try {
            const response =
              await usersApi.list();

            if (
              Array.isArray(
                response?.users
              )
            ) {
              setUsers(
                response.users
              );
            }
          } catch (
            syncError
          ) {
            console.error(
              "BULK UPDATE SYNC ERROR:",
              syncError
            );
          }
        } catch (
          error
        ) {
          setToast({
            type: "error",
            message:
              getError(
                error
              ),
          });

          throw error;
        }
      },
      []
    );

  /* =======================================================
     CURRENT ADMIN PROFILE
  ======================================================= */

  const tryLoadRealProfile =
    useCallback(
      async () => {
        try {
          const profile =
            await usersApi.currentProfile();

          return profile.role;
        } catch (
          error
        ) {
          console.error(
            "CURRENT PROFILE LOAD ERROR:",
            error
          );

          return "User" as const;
        }
      },
      []
    );

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refresh =
    useCallback(
      async () => {
        await loadUsers(
          true
        );
      },
      [loadUsers]
    );

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    /* -----------------------------------------------
       DATA
    ----------------------------------------------- */

    users,
    filteredUsers,
    paginatedUsers,
    stats,

    /* -----------------------------------------------
       FILTER / UI STATE
    ----------------------------------------------- */

    filters,
    columns,
    sort,
    search,

    /* -----------------------------------------------
       PAGINATION
    ----------------------------------------------- */

    page:
      safePage,
    pageSize,
    totalPages,

    /* -----------------------------------------------
       LOADING
    ----------------------------------------------- */

    loading,
    refreshing,

    /* -----------------------------------------------
       TOAST
    ----------------------------------------------- */

    toast,
    setToast,

    /* -----------------------------------------------
       SEARCH / FILTERS
    ----------------------------------------------- */

    setSearch,
    setPage,
    updatePageSize,
    setFilter,
    clearFilters,

    /* -----------------------------------------------
       COLUMNS / SORT
    ----------------------------------------------- */

    toggleColumn,
    toggleSort,

    /* -----------------------------------------------
       USER CRUD
    ----------------------------------------------- */

    createUser,
    updateUser,
    deleteUser,
    bulkUpdate,

    /* -----------------------------------------------
       REFRESH
    ----------------------------------------------- */

    refresh,

    /* -----------------------------------------------
       AUTH / PROFILE
    ----------------------------------------------- */

    tryLoadRealProfile,
  };
}

/* =========================================================
   SORT VALUE
========================================================= */

function valueForSort(
  user: UserRecord,
  field: SortField
): string | number {
  switch (
    field
  ) {
    case "riskScore":
      return Number(
        user.riskScore ?? 0
      );

    case "lastActive":
    case "joinedAt": {
      const timestamp =
        new Date(
          user[field]
        ).getTime();

      return Number.isFinite(
        timestamp
      )
        ? timestamp
        : 0;
    }

    case "name":
      return user.name ?? "";

    case "role":
      return user.role ?? "";

    case "kycStatus":
      return (
        user.kycStatus ??
        ""
      );

    case "walletStatus":
      return (
        user.walletStatus ??
        ""
      );

    default:
      return "";
  }
}

/* =========================================================
   ERROR HELPER
========================================================= */

function getError(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Something went wrong.";
}