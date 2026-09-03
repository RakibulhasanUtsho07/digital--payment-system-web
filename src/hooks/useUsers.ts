"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

const defaultFilters: UserFilters = {
  status: "all",
  kycStatus: "all",
  role: "all",
  riskLevel: "all",
  walletStatus: "all",
  activity: "all",
};

const defaultColumns: ColumnVisibility = {
  phone: true,
  role: true,
  kyc: true,
  wallet: true,
  risk: true,
  lastActive: true,
  joined: false,
};

export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearchState] = useState("");
  const [filters, setFilters] =
    useState<UserFilters>(defaultFilters);

  const [columns, setColumns] =
    useState<ColumnVisibility>(defaultColumns);

  const [sort, setSort] = useState<SortState>({
    field: "lastActive",
    direction: "desc",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [toast, setToast] =
    useState<ToastState | null>(null);

  /* =============================
     LOAD REAL USERS FROM API
  ============================== */

  const loadUsers = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await usersApi.list();

        setUsers(
          Array.isArray(response.users)
            ? response.users
            : []
        );

        if (refresh) {
          setToast({
            type: "success",
            message: "User data refreshed.",
          });
        }
      } catch (error) {
        setUsers([]);

        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load users.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* =============================
     FILTER AND SORT
  ============================== */

  const filteredUsers = useMemo(() => {
    const now = Date.now();
    const normalizedSearch =
      search.trim().toLowerCase();

    return users
      .filter((user) => {
        const searchableValues = [
          user.name,
          user.email,
          user.phone,
          user.id,
        ];

        const matchesSearch =
          !normalizedSearch ||
          searchableValues.some((value) =>
            value
              .toLowerCase()
              .includes(normalizedSearch)
          );

        const matchesActivity =
          filters.activity === "all" ||
          (() => {
            const lastActiveTime =
              new Date(user.lastActive).getTime();

            const age = now - lastActiveTime;

            if (filters.activity === "today") {
              return age <= 86_400_000;
            }

            if (filters.activity === "week") {
              return age <= 604_800_000;
            }

            return age > 2_592_000_000;
          })();

        return (
          matchesSearch &&
          (filters.status === "all" ||
            user.status === filters.status) &&
          (filters.kycStatus === "all" ||
            user.kycStatus ===
              filters.kycStatus) &&
          (filters.role === "all" ||
            user.role === filters.role) &&
          (filters.riskLevel === "all" ||
            user.riskLevel ===
              filters.riskLevel) &&
          (filters.walletStatus === "all" ||
            user.walletStatus ===
              filters.walletStatus) &&
          matchesActivity
        );
      })
      .sort((firstUser, secondUser) => {
        const firstValue = valueForSort(
          firstUser,
          sort.field
        );

        const secondValue = valueForSort(
          secondUser,
          sort.field
        );

        const result =
          typeof firstValue === "number" &&
          typeof secondValue === "number"
            ? firstValue - secondValue
            : String(firstValue).localeCompare(
                String(secondValue)
              );

        return sort.direction === "asc"
          ? result
          : -result;
      });
  }, [filters, search, sort, users]);

  /* =============================
     PAGINATION
  ============================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / pageSize)
  );

  const paginatedUsers =
    filteredUsers.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* =============================
     STATISTICS
  ============================== */

  const stats = useMemo<UserStats>(() => {
    const weekAgo =
      Date.now() - 604_800_000;

    return {
      totalUsers: users.length,

      activeUsers: users.filter(
        (user) => user.status === "active"
      ).length,

      suspended: users.filter(
        (user) => user.status === "suspended"
      ).length,

      pendingKyc: users.filter((user) =>
        ["pending", "under_review"].includes(
          user.kycStatus
        )
      ).length,

      highRisk: users.filter(
        (user) => user.riskLevel === "high"
      ).length,

      newThisWeek: users.filter(
        (user) =>
          new Date(user.joinedAt).getTime() >=
          weekAgo
      ).length,
    };
  }, [users]);

  /* =============================
     UI CONTROLS
  ============================== */

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setFilter = <
    K extends UserFilterKey
  >(
    key: K,
    value: UserFilters[K]
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchState("");
    setPage(1);
  };

  const toggleColumn = (
    key: ColumnKey
  ) => {
    setColumns((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const toggleSort = (
    field: SortField
  ) => {
    setSort((current) => ({
      field,
      direction:
        current.field === field &&
        current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const updatePageSize = (
    size: number
  ) => {
    setPageSize(size);
    setPage(1);
  };

  /* =============================
     CREATE USER
  ============================== */

  const createUser = async (
    input: CreateUserInput
  ) => {
    try {
      const createdUser =
        await usersApi.create(input);

      setUsers((current) => [
        createdUser,
        ...current,
      ]);

      setToast({
        type: "success",
        message: `${createdUser.name} was created.`,
      });
    } catch (error) {
      setToast({
        type: "error",
        message: getError(error),
      });

      throw error;
    }
  };

  /* =============================
     UPDATE USER
  ============================== */

  const updateUser = async (
    id: string,
    patch: UpdateUserInput
  ) => {
    try {
      const updatedUser =
        await usersApi.update(id, patch);

      setUsers((current) =>
        current.map((user) =>
          user.id === id
            ? updatedUser
            : user
        )
      );

      setToast({
        type: "success",
        message: "User changes saved.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: getError(error),
      });

      throw error;
    }
  };

  /* =============================
     DELETE USER
  ============================== */

  const deleteUser = async (
    id: string
  ) => {
    try {
      await usersApi.remove(id);

      setUsers((current) =>
        current.filter(
          (user) => user.id !== id
        )
      );

      setToast({
        type: "success",
        message: "User deleted.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: getError(error),
      });

      throw error;
    }
  };

  /* =============================
     BULK UPDATE
  ============================== */

  const bulkUpdate = async (
    ids: string[],
    patch: UpdateUserInput
  ) => {
    try {
      await usersApi.bulkUpdate(
        ids,
        patch
      );

      const selectedIds = new Set(ids);

      setUsers((current) =>
        current.map((user) =>
          selectedIds.has(user.id)
            ? {
                ...user,
                ...patch,
              }
            : user
        )
      );

      setToast({
        type: "success",
        message: `${ids.length} user(s) updated.`,
      });
    } catch (error) {
      setToast({
        type: "error",
        message: getError(error),
      });

      throw error;
    }
  };

  /* =============================
     CURRENT ADMIN PROFILE
  ============================== */

  const tryLoadRealProfile =
    useCallback(async () => {
      try {
        const profile =
          await usersApi.currentProfile();

        return profile.role;
      } catch {
        return "User" as const;
      }
    }, []);

  return {
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

    refresh: () => loadUsers(true),
    tryLoadRealProfile,
  };
}

function valueForSort(
  user: UserRecord,
  field: SortField
): string | number {
  if (field === "riskScore") {
    return user.riskScore;
  }

  if (
    field === "lastActive" ||
    field === "joinedAt"
  ) {
    return new Date(
      user[field]
    ).getTime();
  }

  return user[field];
}

function getError(
  error: unknown
) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}