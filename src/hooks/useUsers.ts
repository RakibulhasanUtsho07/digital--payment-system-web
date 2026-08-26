"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type {
  User,
  UserRole,
  UserStatus,
  KYCStatus,
  WalletStatus,
  RiskLevel,
} from "@/types/users";

/* =========================================================
   TYPES
========================================================= */

export type ActivityFilter = "All" | "Today" | "This Week" | "Inactive";

export type FilterState = {
  status: "All" | UserStatus;
  kycStatus: "All" | KYCStatus;
  role: "All" | UserRole;
  riskLevel: "All" | RiskLevel;
  walletStatus: "All" | WalletStatus;
  activity: ActivityFilter;
};

export type ColumnVisibility = {
  phone: boolean;
  role: boolean;
  kyc: boolean;
  wallet: boolean;
  risk: boolean;
  lastActive: boolean;
  joined: boolean;
};

export type SortField =
  | "name"
  | "joinedAt"
  | "lastActive"
  | "riskScore"
  | "balance"
  | "transactionCount";

export type SortState = {
  field: SortField;
  direction: "asc" | "desc";
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export type UserStats = {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  suspended: number;
  highRisk: number;
  newThisWeek: number;
};

/* =========================================================
   STORAGE KEYS
========================================================= */

const USERS_STORAGE_KEY = "novawallet_admin_users";
const FILTERS_STORAGE_KEY = "novawallet_admin_filters";
const COLUMNS_STORAGE_KEY = "novawallet_admin_columns";
const PAGE_SIZE_STORAGE_KEY = "novawallet_admin_page_size";

/* =========================================================
   DEFAULT STATE
========================================================= */

const DEFAULT_FILTERS: FilterState = {
  status: "All",
  kycStatus: "All",
  role: "All",
  riskLevel: "All",
  walletStatus: "All",
  activity: "All",
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

/* =========================================================
   MOCK USERS
========================================================= */

const MOCK_USERS: User[] = [
  {
    id: "usr_7f82a1b9",
    name: "Rakibul Hasan",
    email: "rakibul.h@example.com",
    phone: "+8801711223344",
    role: "user",
    status: "active",
    kycStatus: "verified",
    walletStatus: "active",
    riskScore: 12,
    riskLevel: "low",
    balance: 25450,
    totalReceived: 120000,
    totalSent: 94550,
    transactionCount: 145,
    lastActive: "2026-08-23T14:30:00Z",
    joinedAt: "2024-01-15T08:00:00Z",
    city: "Dhaka",
    country: "Bangladesh",
    twoFactorEnabled: true,
    failedLoginCount: 0,
    activeSessions: 2,
  },
  {
    id: "usr_9c34x2z1",
    name: "Nusrat Jahan",
    email: "nusrat.j@example.com",
    phone: "+8801822334455",
    role: "admin",
    status: "active",
    kycStatus: "verified",
    walletStatus: "active",
    riskScore: 5,
    riskLevel: "low",
    balance: 150000,
    totalReceived: 500000,
    totalSent: 350000,
    transactionCount: 320,
    lastActive: "2026-08-23T14:45:00Z",
    joinedAt: "2023-11-10T10:30:00Z",
    city: "Chattogram",
    country: "Bangladesh",
    twoFactorEnabled: true,
    failedLoginCount: 0,
    activeSessions: 1,
  },
  {
    id: "usr_2b55y8m4",
    name: "Tanvir Ahmed",
    email: "tanvir.a@example.com",
    phone: "+8801933445566",
    role: "user",
    status: "suspended",
    kycStatus: "rejected",
    walletStatus: "frozen",
    riskScore: 85,
    riskLevel: "high",
    balance: 450,
    totalReceived: 5000,
    totalSent: 4550,
    transactionCount: 12,
    lastActive: "2026-08-20T09:15:00Z",
    joinedAt: "2026-08-01T14:00:00Z",
    city: "Sylhet",
    country: "Bangladesh",
    twoFactorEnabled: false,
    failedLoginCount: 4,
    activeSessions: 0,
  },
  {
    id: "usr_4k99p3n2",
    name: "Farhana Akter",
    email: "farhana.a@example.com",
    phone: "+8801644556677",
    role: "user",
    status: "restricted",
    kycStatus: "pending",
    walletStatus: "restricted",
    riskScore: 45,
    riskLevel: "medium",
    balance: 12500,
    totalReceived: 20000,
    totalSent: 7500,
    transactionCount: 34,
    lastActive: "2026-08-22T18:20:00Z",
    joinedAt: "2025-05-20T11:45:00Z",
    city: "Rajshahi",
    country: "Bangladesh",
    twoFactorEnabled: false,
    failedLoginCount: 1,
    activeSessions: 1,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDays(dateString: string, days: number): boolean {
  const date = Date.parse(dateString);
  if (Number.isNaN(date)) return false;
  const diff = Date.now() - date;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

/* =========================================================
   HOOK
========================================================= */

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMNS);
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toast, setToast] = useState<ToastState | null>(null);

  /* =======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        if (cancelled) return;

        try {
          const savedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
          const savedFilters = window.localStorage.getItem(FILTERS_STORAGE_KEY);
          const savedColumns = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
          const savedPageSize = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);

          setUsers(savedUsers ? (JSON.parse(savedUsers) as User[]) : MOCK_USERS);

          if (savedFilters) setFilters(JSON.parse(savedFilters) as FilterState);
          if (savedColumns) setColumns(JSON.parse(savedColumns) as ColumnVisibility);

          if (savedPageSize) {
            const parsed = Number(savedPageSize);
            if ([25, 50, 100].includes(parsed)) setPageSize(parsed);
          }
        } catch {
          setUsers(MOCK_USERS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     PERSIST HELPERS
  ====================================================== */

  const persistUsers = useCallback((nextUsers: User[]) => {
    setUsers(nextUsers);
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  }, []);

  const persistFilters = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters);
    setPage(1);
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(nextFilters));
  }, []);

  const toggleColumn = useCallback((key: keyof ColumnVisibility) => {
    setColumns((current) => {
      const next = { ...current, [key]: !current[key] };
      window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /* =======================================================
     FILTER & SORT
  ====================================================== */

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let result = users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.phone.toLowerCase().includes(normalizedSearch) ||
        user.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus = filters.status === "All" || user.status === filters.status;
      const matchesKyc = filters.kycStatus === "All" || user.kycStatus === filters.kycStatus;
      const matchesRole = filters.role === "All" || user.role === filters.role;
      const matchesRisk = filters.riskLevel === "All" || user.riskLevel === filters.riskLevel;
      const matchesWallet = filters.walletStatus === "All" || user.walletStatus === filters.walletStatus;

      const matchesActivity = (() => {
        switch (filters.activity) {
          case "All": return true;
          case "Today": return isToday(user.lastActive);
          case "This Week": return isWithinDays(user.lastActive, 7);
          case "Inactive": return !isWithinDays(user.lastActive, 7);
          default: return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesKyc &&
        matchesRole &&
        matchesRisk &&
        matchesWallet &&
        matchesActivity
      );
    });

    result = [...result];

    result.sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      switch (sort.field) {
        case "name": return a.name.localeCompare(b.name) * direction;
        case "riskScore": return (a.riskScore - b.riskScore) * direction;
        case "balance": return (a.balance - b.balance) * direction;
        case "transactionCount": return (a.transactionCount - b.transactionCount) * direction;
        case "joinedAt": return (Date.parse(a.joinedAt) - Date.parse(b.joinedAt)) * direction;
        case "lastActive": return (Date.parse(a.lastActive) - Date.parse(b.lastActive)) * direction;
        default: return 0;
      }
    });

    return result;
  }, [users, search, filters, sort]);

  /* =======================================================
     PAGINATION
  ====================================================== */

  const totalPages = Math.max(1, Math.ceil((filteredUsers?.length || 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* =======================================================
     STATS
  ====================================================== */

  const stats: UserStats = useMemo(() => {
    const now = Date.now();
    const newThisWeek = users.filter((user) => {
      const joined = Date.parse(user.joinedAt);
      return !Number.isNaN(joined) && now - joined <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      pendingKyc: users.filter((u) => u.kycStatus === "pending" || u.kycStatus === "under_review").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      highRisk: users.filter((u) => u.riskLevel === "high").length,
      newThisWeek,
    };
  }, [users]);

  /* =======================================================
     ACTIONS
  ====================================================== */

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    persistFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    persistFilters(DEFAULT_FILTERS);
    setSearch("");
  };

  const toggleSort = (field: SortField) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const updatePageSize = (size: number) => {
    const validSize = [25, 50, 100].includes(size) ? size : 25;
    setPageSize(validSize);
    setPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(validSize));
  };

  const createUser = (user: User) => {
    persistUsers([user, ...users]);
    setPage(1);
    setToast({ type: "success", message: "Demo user created successfully." });
  };

  const updateUser = (id: string, patch: Partial<User>) => {
    const nextUsers = users.map((user) => (user.id === id ? { ...user, ...patch } : user));
    persistUsers(nextUsers);
    setToast({ type: "success", message: "User updated locally." });
  };

  const deleteUsers = (ids: string[]) => {
    const idSet = new Set(ids);
    const nextUsers = users.filter((user) => !idSet.has(user.id));
    persistUsers(nextUsers);
    setToast({ type: "success", message: `${ids.length} demo user(s) deleted.` });
  };

  const refresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const saved = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        setUsers(JSON.parse(saved) as User[]);
      } catch {
        setUsers(MOCK_USERS);
      }
    }
    setRefreshing(false);
    setToast({ type: "info", message: "User data refreshed." });
  };

 const tryLoadRealProfile = useCallback(async (): Promise<"Admin" | "User" | undefined> => {
  try {
    const response =
      await apiClient<{
        success: boolean;
        user?: {
          role?: string;
        };
      }>("/users/profile");

    const role =
      response.user?.role;

    if (
      role?.toLowerCase() ===
      "admin"
    ) {
      return "Admin";
    }

    if (
      role?.toLowerCase() ===
      "user"
    ) {
      return "User";
    }

    return undefined;
  } catch {
    return undefined;
  }
}, []);

  /* =======================================================
     RETURN
  ====================================================== */

  return {
    users,
    filteredUsers, // <-- এটি এখন সঠিকভাবে রিটার্ন হচ্ছে
    paginatedUsers,
    stats,
    filters,
    columns,
    sort,
    search,
    page: safePage,
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
    deleteUsers,
    refresh,
    tryLoadRealProfile,
  };
}