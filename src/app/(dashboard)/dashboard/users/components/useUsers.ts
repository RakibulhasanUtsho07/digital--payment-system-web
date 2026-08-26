"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiClient } from "@/lib/api/client";

import type { User } from "@/types/users";

import type {
  ColumnVisibility,
  SortField,
  SortState,
  ToastState,
  UserFilters,
  UserRecord,
  UserStats,
} from "@/app/(dashboard)/dashboard/users/components/UserManagementTypes";

const USERS_STORAGE_KEY =
  "novawallet_admin_users_demo";

const FILTER_STORAGE_KEY =
  "novawallet_admin_user_filters";

const COLUMN_STORAGE_KEY =
  "novawallet_admin_user_columns";

const PAGE_SIZE_STORAGE_KEY =
  "novawallet_admin_user_page_size";

const DEFAULT_FILTERS: UserFilters = {
  status: "all",
  kycStatus: "all",
  role: "all",
  riskLevel: "all",
  walletStatus: "all",
  activity: "all",
};

const DEFAULT_COLUMNS: ColumnVisibility = {
  phone: true,
  role: true,
  kyc: true,
  wallet: true,
  risk: true,
  lastActive: true,
  joined: true,
};

function createDemoUsers(): UserRecord[] {
  const names = [
    "Rakibul Hasan",
    "Sayem Ahmed",
    "Nusrat Jahan",
    "Tanvir Rahman",
    "Sadia Akter",
    "Mahmud Hasan",
    "Fahim Chowdhury",
    "Mim Rahman",
    "Arif Hossain",
    "Jannatul Ferdous",
    "Shakil Ahmed",
    "Nabila Islam",
    "Rafiul Karim",
    "Tanjim Hasan",
    "Mehedi Rahman",
    "Sumaiya Akter",
    "Sabbir Hossain",
    "Tasnim Jahan",
    "Imran Kabir",
    "Farhan Ahmed",
  ];

  return names.map(
    (name, index) => {
      const slug =
        name
          .toLowerCase()
          .replace(/\s+/g, ".");

      const kycStatus =
        index % 9 === 0
          ? "rejected"
          : index % 6 === 0
            ? "pending"
            : index % 4 === 0
              ? "under_review"
              : index % 3 === 0
                ? "not_started"
                : "verified";

      const status =
        index % 12 === 0
          ? "suspended"
          : index % 8 === 0
            ? "restricted"
            : "active";

      const walletStatus =
        status === "suspended"
          ? "frozen"
          : status === "restricted"
            ? "restricted"
            : "active";

      const role =
        index === 0
          ? "admin"
          : index % 7 === 0
            ? "support"
            : "user";

      const riskLevel =
        status === "suspended"
          ? "high"
          : index % 5 === 0
            ? "medium"
            : "low";

      const hasWallet =
        index % 10 !== 0;

      const joinedAt =
        new Date(
          Date.now() -
            Math.random() *
              365 *
              24 *
              60 *
              60 *
              1000
        ).toISOString();

      const lastActive =
        new Date(
          Date.now() -
            Math.random() *
              7 *
              24 *
              60 *
              60 *
              1000
        ).toISOString();

      return {
        id: `USR-${Math.random()
          .toString(36)
          .slice(2, 9)
          .toUpperCase()}`,

        name,
        email: `${slug}@example.com`,

        phone: `+880 1${
          [7, 8, 9, 3, 5, 4][
            index % 6
          ]
        } ${Math.floor(
          10000000 +
            Math.random() *
              90000000
        )}`,

        role,
        status,
        kycStatus,
        walletStatus,

        riskLevel,

        riskScore:
          Math.floor(
            Math.random() *
              100
          ),

        balance:
          hasWallet &&
          status === "active"
            ? Math.floor(
                100 +
                  Math.random() *
                    50000
              )
            : 0,

        totalReceived:
          Math.floor(
            Math.random() *
              150000
          ),

        totalSent:
          Math.floor(
            Math.random() *
              80000
          ),

        transactionCount:
          Math.floor(
            Math.random() *
              200
          ),

        lastActive,
        joinedAt,

        city: [
          "Dhaka",
          "Sylhet",
          "Chattogram",
          "Rajshahi",
          "Khulna",
        ][index % 5],

        country: "Bangladesh",

        walletId:
          `WLT-${Math.random()
            .toString(36)
            .slice(2, 9)
            .toUpperCase()}`,

        twoFactorEnabled:
          index % 2 === 0,

        failedLoginCount:
          index % 14 === 0
            ? 3
            : 0,

        activeSessions:
          1 +
          Math.floor(
            Math.random() * 2
          ),

        documentType:
          kycStatus !==
          "not_started"
            ? index % 3 === 0
              ? "passport"
              : "nid"
            : undefined,

        maskedDocumentNumber:
          kycStatus !==
          "not_started"
            ? `***-${Math.floor(
                1000 +
                  Math.random() *
                    9000
              )}`
            : undefined,

        submittedAt:
          kycStatus !==
          "not_started"
            ? new Date(
                Date.now() -
                  Math.random() *
                    90 *
                    24 *
                    60 *
                    60 *
                    1000
              ).toISOString()
            : undefined,

        reviewedAt:
          kycStatus ===
          "verified"
            ? new Date().toISOString()
            : undefined,

        rejectionReason:
          kycStatus ===
          "rejected"
            ? "Blurred document image"
            : undefined,
      };
    }
  );
}

function readStored<T>(
  key: string
): T | null {
  try {
    const value =
      localStorage.getItem(
        key
      );

    return value
      ? (JSON.parse(
          value
        ) as T)
      : null;
  } catch {
    return null;
  }
}

function saveStored<T>(
  key: string,
  value: T
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {
    // Demo/local persistence only.
  }
}

export function useUsers() {
  const [
    users,
    setUsers,
  ] = useState<
    UserRecord[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filters,
    setFilters,
  ] =
    useState<UserFilters>(
      DEFAULT_FILTERS
    );

  const [
    columns,
    setColumns,
  ] =
    useState<ColumnVisibility>(
      DEFAULT_COLUMNS
    );

  const [
    sort,
    setSort,
  ] = useState<SortState>({
    field: "joinedAt",
    direction: "desc",
  });

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(25);

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null
    );

  useEffect(() => {
    let active = true;

    const initialize =
      async () => {
        setLoading(true);
        setError(null);

        const storedFilters =
          readStored<UserFilters>(
            FILTER_STORAGE_KEY
          );

        const storedColumns =
          readStored<ColumnVisibility>(
            COLUMN_STORAGE_KEY
          );

        const storedPageSize =
          readStored<number>(
            PAGE_SIZE_STORAGE_KEY
          );

        if (storedFilters) {
          setFilters(
            storedFilters
          );
        }

        if (storedColumns) {
          setColumns(
            storedColumns
          );
        }

        if (
          storedPageSize &&
          storedPageSize > 0
        ) {
          setPageSize(
            storedPageSize
          );
        }

        try {
          const response =
            await apiClient<{
              data?: UserRecord[];
              users?: UserRecord[];
            }>("/users", {
              method: "GET",
            });

          const remoteUsers =
            response.data ??
            response.users ??
            [];

          if (
            active &&
            remoteUsers.length >
              0
          ) {
            setUsers(
              remoteUsers
            );
            return;
          }
        } catch {
          setError(
            "Using local demo users because the admin users API is not available."
          );
        }

        const storedUsers =
          readStored<
            UserRecord[]
          >(
            USERS_STORAGE_KEY
          );

        const demoUsers =
          storedUsers ??
          createDemoUsers();

        if (active) {
          setUsers(
            demoUsers
          );
        }

        if (!storedUsers) {
          saveStored(
            USERS_STORAGE_KEY,
            demoUsers
          );
        }
      };

    void initialize().finally(
      () => {
        if (active) {
          setLoading(
            false
          );
        }
      }
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveStored(
      FILTER_STORAGE_KEY,
      filters
    );
  }, [filters]);

  useEffect(() => {
    saveStored(
      COLUMN_STORAGE_KEY,
      columns
    );
  }, [columns]);

  useEffect(() => {
    saveStored(
      PAGE_SIZE_STORAGE_KEY,
      pageSize
    );
  }, [pageSize]);

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let result = users.filter(
        (user) => {
          const searchMatch =
            !query ||
            user.name
              .toLowerCase()
              .includes(query) ||
            user.email
              .toLowerCase()
              .includes(query) ||
            user.phone
              .toLowerCase()
              .includes(query) ||
            user.id
              .toLowerCase()
              .includes(query) ||
            user.walletId
              ?.toLowerCase()
              .includes(
                query
              )
              ;

          const statusMatch =
            filters.status ===
              "all" ||
            user.status ===
              filters.status;

          const kycMatch =
            filters.kycStatus ===
              "all" ||
            user.kycStatus ===
              filters.kycStatus;

          const roleMatch =
            filters.role ===
              "all" ||
            user.role ===
              filters.role;

          const riskMatch =
            filters.riskLevel ===
              "all" ||
            user.riskLevel ===
              filters.riskLevel;

          const walletMatch =
            filters.walletStatus ===
              "all" ||
            user.walletStatus ===
              filters.walletStatus;

          const activityMatch =
            filters.activity ===
              "all" ||
            true;

          return (
            searchMatch &&
            statusMatch &&
            kycMatch &&
            roleMatch &&
            riskMatch &&
            walletMatch &&
            activityMatch
          );
        }
      );

      result.sort(
        (a, b) => {
          let aValue:
            | string
            | number = "";

          let bValue:
            | string
            | number = "";

          switch (
            sort.field
          ) {
            case "name":
              aValue =
                a.name;
              bValue =
                b.name;
              break;

            case "email":
              aValue =
                a.email;
              bValue =
                b.email;
              break;

            case "riskScore":
              aValue =
                a.riskScore;
              bValue =
                b.riskScore;
              break;

            case "balance":
              aValue =
                a.balance;
              bValue =
                b.balance;
              break;

            case "transactionCount":
              aValue =
                a.transactionCount;
              bValue =
                b.transactionCount;
              break;

            case "createdAt":
              aValue =
                new Date(
                  a.createdAt ??
                    a.joinedAt
                ).getTime();

              bValue =
                new Date(
                  b.createdAt ??
                    b.joinedAt
                ).getTime();

              break;

            case "lastActive":
              aValue =
                new Date(
                  a.lastActive
                ).getTime();

              bValue =
                new Date(
                  b.lastActive
                ).getTime();

              break;

            case "joinedAt":
            default:
              aValue =
                new Date(
                  a.joinedAt
                ).getTime();

              bValue =
                new Date(
                  b.joinedAt
                ).getTime();
          }

          if (
            aValue <
            bValue
          ) {
            return sort.direction ===
              "asc"
              ? -1
              : 1;
          }

          if (
            aValue >
            bValue
          ) {
            return sort.direction ===
              "asc"
              ? 1
              : -1;
          }

          return 0;
        }
      );

      return result;
    }, [
      users,
      search,
      filters,
      sort,
    ]);

  const totalFiltered =
    filteredUsers.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalFiltered /
          pageSize
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const paginatedUsers =
    filteredUsers.slice(
      (safePage - 1) *
        pageSize,
      safePage *
        pageSize
    );

  useEffect(() => {
    if (
      page >
      totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  const stats =
    useMemo<UserStats>(
      () => {
        const weekAgo =
          Date.now() -
          7 *
            24 *
            60 *
            60 *
            1000;

        return {
          totalUsers:
            users.length,

          activeUsers:
            users.filter(
              (user) =>
                user.status ===
                "active"
            ).length,

          suspended:
            users.filter(
              (user) =>
                user.status ===
                "suspended"
            ).length,

          pendingKyc:
            users.filter(
              (user) =>
                user.kycStatus ===
                  "pending" ||
                user.kycStatus ===
                  "under_review"
            ).length,

          highRisk:
            users.filter(
              (user) =>
                user.riskLevel ===
                "high"
            ).length,

          newThisWeek:
            users.filter(
              (user) =>
                new Date(
                  user.joinedAt
                ).getTime() >=
                weekAgo
            ).length,
        };
      },
      [users]
    );

  const setFilter =
    useCallback(
      <
        K extends keyof UserFilters
      >(
        key: K,
        value: UserFilters[K]
      ) => {
        setFilters(
          (current) => ({
            ...current,
            [key]: value,
          })
        );

        setPage(1);
      },
      []
    );

  const toggleColumn =
    useCallback(
      (
        key: keyof ColumnVisibility
      ) => {
        setColumns(
          (current) => ({
            ...current,
            [key]:
              !current[key],
          })
        );
      },
      []
    );

  const toggleSort =
    useCallback(
      (field: SortField) => {
        setSort(
          (current) => ({
            field,
            direction:
              current.field ===
                field &&
              current.direction ===
                "asc"
                ? "desc"
                : "asc",
          })
        );

        setPage(1);
      },
      []
    );

  const updatePageSize =
    useCallback(
      (size: number) => {
        setPageSize(
          size
        );
        setPage(1);
      },
      []
    );

  const showToast =
    useCallback(
      (
        message: string,
        type:
          | "success"
          | "error"
          | "info" =
          "success"
      ) => {
        setToast({
          show: true,
          message,
          type,
        });
      },
      []
    );

  const updateUser =
    useCallback(
      (
        userId: string,
        patch: Partial<User>
      ) => {
        setUsers(
          (current) =>
            current.map(
              (user) =>
                user.id ===
                userId
                  ? {
                      ...user,
                      ...patch,
                    }
                  : user
            )
        );

        saveStored(
          USERS_STORAGE_KEY,
          users
        );

        showToast(
          "User updated locally."
        );
      },
      [showToast, users]
    );

  const createUser =
    useCallback(
      (user: UserRecord) => {
        setUsers(
          (current) => {
            const next = [
              user,
              ...current,
            ];

            saveStored(
              USERS_STORAGE_KEY,
              next
            );

            return next;
          }
        );

        showToast(
          "Demo user created."
        );
      },
      [showToast]
    );

  const clearFilters =
    useCallback(() => {
      setFilters(
        DEFAULT_FILTERS
      );
      setSearch("");
      setPage(1);
    }, []);

  const refresh =
    useCallback(
      async () => {
        setRefreshing(
          true
        );

        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              650
            )
        );

        setRefreshing(
          false
        );

        showToast(
          "User directory refreshed."
        );
      },
      [showToast]
    );

  const tryLoadRealProfile =
    useCallback(
      async (): Promise<
        "admin" | "user"
      > => {
        try {
          const response =
            await apiClient<{
              user?: {
                role?: string;
              };
            }>("/auth/me", {
              method: "GET",
            });

          return response.user
            ?.role
            ?.toLowerCase() ===
            "admin"
            ? "admin"
            : "user";
        } catch {
          return "admin";
        }
      },
      []
    );

  return {
    users,
    filteredUsers,
    paginatedUsers,

    stats,

    filters,
    setFilter,

    columns,
    toggleColumn,

    sort,
    toggleSort,

    search,
    setSearch,

    page: safePage,
    setPage,

    pageSize,
    updatePageSize,

    totalPages,
    totalFiltered,

    loading,
    refreshing,
    error,

    toast,
    setToast,

    createUser,
    updateUser,

    clearFilters,
    refresh,

    tryLoadRealProfile,
  };
}