"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";

// Import types exactly as defined in your types file
import type {
  ColumnVisibility,
  KYCStatus,
  RiskLevel,
  SortState,
  ToastState,
  UserFilters,
  UserRecord,
  UserRole,
  UserStats,
  UserStatus,
  WalletStatus,
  SortField,
} from "@/app/(dashboard)/dashboard/users/components/UserManagementTypes";

const USERS_STORAGE_KEY = "novawallet_admin_users_demo";
const FILTER_STORAGE_KEY = "novawallet_admin_user_filters";
const COLUMN_STORAGE_KEY = "novawallet_admin_user_columns";
const PAGE_SIZE_STORAGE_KEY = "novawallet_admin_user_page_size";

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

// 🚀 FIXED: Generates perfectly flat UserRecord structure matching your interface
function createDemoUsers(): UserRecord[] {
  const names = [
    "Rakibul Hasan", "Sayem Ahmed", "Nusrat Jahan", "Tanvir Rahman",
    "Sadia Akter", "Mahmud Hasan", "Fahim Chowdhury", "Mim Rahman",
    "Arif Hossain", "Jannatul Ferdous", "Shakil Ahmed", "Nabila Islam",
    "Rafiul Karim", "Tanjim Hasan", "Mehedi Rahman", "Sumaiya Akter",
    "Sabbir Hossain", "Tasnim Jahan", "Imran Kabir", "Farhan Ahmed",
  ];

  return names.map((name, index) => {
    const slug = name.toLowerCase().replace(/\s+/g, ".");

    const kycStatus: KYCStatus =
      index % 9 === 0 ? "rejected"
      : index % 6 === 0 ? "pending"
      : index % 4 === 0 ? "under_review"
      : index % 3 === 0 ? "not_started"
      : "verified";

    const isVerified = kycStatus === "verified";
    
    // Fixed UserStatus mapping
    const status: UserStatus =
      index % 12 === 0 ? "suspended"
      : index % 8 === 0 ? "restricted"
      : index % 15 === 0 ? "pending"
      : "active";

    const hasWallet = index % 10 !== 0;

    return {
      id: `USR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name,
      email: `${slug}@example.com`,
      phone: `+880 1${[7, 8, 9, 3, 5, 4][index % 6]} ${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: (index === 0 ? "admin" : index % 7 === 0 ? "support" : "user") as UserRole,
      status,
      
      // Flat Data Structure Updates
      kycStatus,
      walletStatus: status === "suspended" ? "frozen" : status === "restricted" ? "restricted" : "active",
      riskLevel: status === "suspended" ? "high" : index % 5 === 0 ? "medium" : "low",
      riskScore: Math.floor(Math.random() * 100),
      balance: hasWallet && status === "active" ? Math.floor(100 + Math.random() * 50000) : 0,
      totalReceived: Math.floor(Math.random() * 150000),
      totalSent: Math.floor(Math.random() * 80000),
      transactionCount: Math.floor(Math.random() * 200),
      
      // Timestamps
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Additional Info
      city: ["Dhaka", "Sylhet", "Chittagong", "Rajshahi", "Khulna"][index % 5],
      country: "Bangladesh",
      walletId: `WLT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      twoFactorEnabled: index % 2 === 0,
      failedLoginCount: index % 14 === 0 ? 3 : 0,
      activeSessions: 1 + Math.floor(Math.random() * 2),
      
      // KYC Docs Info
      documentType: kycStatus !== "not_started" ? (index % 3 === 0 ? "passport" : "nid") : undefined,
      maskedDocumentNumber: kycStatus !== "not_started" ? `***-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      submittedAt: kycStatus !== "not_started" ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      reviewedAt: isVerified ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      rejectionReason: kycStatus === "rejected" ? "Blurred document image" : undefined,
    };
  });
}

export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ field: "joinedAt", direction: "desc" });
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMNS);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // 🚀 FIXED: Toast state initializer matches the updated interface
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // Initialize Data
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        setLoading(true);

        const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
        const savedColumns = localStorage.getItem(COLUMN_STORAGE_KEY);
        const savedPageSize = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);

        if (mounted) {
          if (savedFilters) setFilters(JSON.parse(savedFilters));
          if (savedColumns) setColumns(JSON.parse(savedColumns));
          if (savedPageSize) setPageSize(parseInt(savedPageSize, 10));
        }

        const response = await apiClient.get<{ data: UserRecord[] }>("/users");
        if (mounted && response.data) {
          setUsers(response.data);
          return;
        }
      } catch (err) {
        console.warn("API fetch failed, falling back to local/demo data.");
      } finally {
        if (mounted) {
          const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
          if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
          } else {
            const demoUsers = createDemoUsers();
            setUsers(demoUsers);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(demoUsers));
          }
          setLoading(false);
        }
      }
    }

    initialize();
    return () => { mounted = false; };
  }, []);

  // Save Preferences
  useEffect(() => { localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters)); }, [filters]);
  useEffect(() => { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem(PAGE_SIZE_STORAGE_KEY, pageSize.toString()); }, [pageSize]);

  // Derived Data
  const stats = useMemo<UserStats>(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      pendingKyc: users.filter((u) => u.kycStatus === "pending").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      highRisk: users.filter((u) => u.riskLevel === "high").length,
      newThisWeek: users.filter((u) => new Date(u.joinedAt) >= oneWeekAgo).length,
    };
  }, [users]);

  // Filter & Sort
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    if (filters.status !== "all") result = result.filter((u) => u.status === filters.status);
    if (filters.kycStatus !== "all") result = result.filter((u) => u.kycStatus === filters.kycStatus);
    if (filters.role !== "all") result = result.filter((u) => u.role === filters.role);
    if (filters.riskLevel !== "all") result = result.filter((u) => u.riskLevel === filters.riskLevel);

    // 🚀 FIXED: Sorting mapping completely updated for exact correct property names
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort.field) {
        case "name":
          aVal = a.name; bVal = b.name; break;
        case "joinedAt":
          aVal = new Date(a.joinedAt).getTime(); bVal = new Date(b.joinedAt).getTime(); break;
        case "lastActive":
          aVal = new Date(a.lastActive).getTime(); bVal = new Date(b.lastActive).getTime(); break;
        case "riskScore":
          aVal = a.riskScore; bVal = b.riskScore; break;
        case "balance":
          aVal = a.balance; bVal = b.balance; break;
        case "transactionCount":
          aVal = a.transactionCount; bVal = b.transactionCount; break;
        default:
          aVal = a[sort.field as keyof UserRecord];
          bVal = b[sort.field as keyof UserRecord];
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    setTotalUsers(result.length);
    const startIndex = (currentPage - 1) * pageSize;
    return result.slice(startIndex, startIndex + pageSize);
  }, [users, searchQuery, filters, sort, currentPage, pageSize]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelectUser = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (selected) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) setSelectedUsers(new Set(filteredAndSortedUsers.map((u) => u.id)));
      else setSelectedUsers(new Set());
    },
    [filteredAndSortedUsers]
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  }, []);

  // 🚀 FIXED: Enforces proper ToastType parameter
  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "success") => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    },
    []
  );

  const updateUserStatus = useCallback(
    async (userId: string, newStatus: UserStatus) => {
      try {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        showToast(`User status updated to ${newStatus}`);
      } catch (err) {
        showToast("Failed to update user status", "error");
      }
    },
    [showToast]
  );

  return {
    users: filteredAndSortedUsers,
    stats,
    loading,
    error,

    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sort,
    handleSort,
    columns,
    setColumns,

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),

    selectedUsers,
    handleSelectUser,
    handleSelectAll,

    toast,
    setToast,

    clearFilters,
    updateUserStatus,
  };
}