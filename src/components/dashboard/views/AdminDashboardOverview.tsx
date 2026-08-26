"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  ShieldAlert,
  UserX,
  AlertTriangle,
  UserPlus,
  Download,
  RefreshCw,
  ChevronDown,
  Search,
  X,
  Eye,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Wallet,
  Clock,
} from "lucide-react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "User" | "Admin" | "Moderator";
  kyc: "Verified" | "Pending" | "Under Review" | "Rejected" | "Not Started";
  wallet: "Active" | "Frozen" | "Restricted" | "Suspended";
  risk: "HIGH" | "MEDIUM" | "LOW";
  lastActivity: string; // ISO date
  avatar?: string;
};

// ------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------
const mockUsers: User[] = [
  {
    id: "usr_2b55y8m4",
    name: "Tanvir Ahmed",
    email: "tanvir.a@example.com",
    phone: "+8801933445566",
    role: "User",
    kyc: "Rejected",
    wallet: "Frozen",
    risk: "HIGH",
    lastActivity: "2026-08-20T09:15:00Z",
  },
  {
    id: "usr_4k9e3n2",
    name: "Farhana Akter",
    email: "farhana.a@example.com",
    phone: "+8801644556677",
    role: "User",
    kyc: "Pending",
    wallet: "Restricted",
    risk: "MEDIUM",
    lastActivity: "2026-08-22T18:20:00Z",
  },
  {
    id: "usr_7f82a1b9",
    name: "Rakibul Hasan",
    email: "rakibul.h@example.com",
    phone: "+8801711223344",
    role: "User",
    kyc: "Verified",
    wallet: "Active",
    risk: "LOW",
    lastActivity: "2026-08-23T14:30:00Z",
  },
  {
    id: "usr_9c34*2z1",
    name: "Nusrat Jahan",
    email: "nusrat.j@example.com",
    phone: "+8801822334455",
    role: "Admin",
    kyc: "Verified",
    wallet: "Active",
    risk: "LOW",
    lastActivity: "2026-08-23T14:45:00Z",
  },
];

// ------------------------------------------------------------
// Stats Configuration
// ------------------------------------------------------------
const stats = [
  {
    title: "Total Users",
    value: 4,
    change: "+8.4% this month",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Active Users",
    value: 2,
    change: "87% of user base",
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Pending KYC",
    value: 1,
    change: "Requires attention",
    icon: ShieldAlert,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Suspended",
    value: 1,
    change: "Account restrictions",
    icon: UserX,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "High Risk",
    value: 1,
    change: "Review recommended",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-600",
  },
  {
    title: "New This Week",
    value: 0,
    change: "Fresh registrations",
    icon: UserPlus,
    color: "bg-purple-50 text-purple-600",
  },
];

// ------------------------------------------------------------
// Filter Options
// ------------------------------------------------------------
const filterOptions = {
  status: ["All", "Active", "Inactive", "Suspended"],
  kyc: ["All", "Verified", "Pending", "Under Review", "Rejected", "Not Started"],
  role: ["All", "User", "Admin", "Moderator"],
  risk: ["All", "HIGH", "MEDIUM", "LOW"],
  wallet: ["All", "Active", "Frozen", "Restricted", "Suspended"],
  activity: ["All", "Today", "This Week", "This Month"],
};

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
export default function UsersPage() {
  // State
  const [users] = useState<User[]>(mockUsers);
  const [filters, setFilters] = useState({
    status: "All",
    kyc: "All",
    role: "All",
    risk: "All",
    wallet: "All",
    activity: "All",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derived filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchQuery) ||
        user.id.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Filters
      if (filters.status !== "All" && user.wallet !== filters.status) return false;
      if (filters.kyc !== "All" && user.kyc !== filters.kyc) return false;
      if (filters.role !== "All" && user.role !== filters.role) return false;
      if (filters.risk !== "All" && user.risk !== filters.risk) return false;
      if (filters.wallet !== "All" && user.wallet !== filters.wallet) return false;

      // Activity filter (simplified)
      if (filters.activity === "Today") {
        const today = new Date().toISOString().split("T")[0];
        if (!user.lastActivity.startsWith(today)) return false;
      } else if (filters.activity === "This Week") {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (new Date(user.lastActivity) < weekAgo) return false;
      } else if (filters.activity === "This Month") {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (new Date(user.lastActivity) < monthAgo) return false;
      }

      return true;
    });
  }, [users, filters, searchQuery]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "All",
      kyc: "All",
      role: "All",
      risk: "All",
      wallet: "All",
      activity: "All",
    });
    setSearchQuery("");
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((v) => v !== "All").length;

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="space-y-6 pb-10">
      {/* ========== HEADER ========== */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#101827] via-[#17263A] to-[#203C63] p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200 backdrop-blur-md">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
              User Operations
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              System Users
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage customer accounts, verification status, wallet access,
              security posture, and account activity from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17263A] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
            <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
              <Download className="h-4 w-4" />
              Export Users
            </button>
            <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ========== STATS CARDS ========== */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-100 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ========== SEARCH & FILTERS ========== */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div
            className="relative flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition hover:border-blue-300 hover:bg-white"
            onClick={() => setIsModalOpen(true)}
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              Search name, email, phone, user ID or wallet ID...
            </span>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(filterOptions).map(([key, options]) => (
              <div key={key} className="relative">
                <select
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-medium text-slate-700 transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={filters[key as keyof typeof filters]}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            ))}

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter summary */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-medium">Active filters:</span>
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== "All" && (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700"
                  >
                    {key}: {value}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, [key]: "All" }))
                      }
                      className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
            )}
          </div>
        )}
      </section>

      {/* ========== TABLE ========== */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                <th className="pb-3 pr-4 font-semibold">User</th>
                <th className="pb-3 pr-4 font-semibold">Phone</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">KYC</th>
                <th className="pb-3 pr-4 font-semibold">Wallet</th>
                <th className="pb-3 pr-4 font-semibold">Risk</th>
                <th className="pb-3 pr-4 font-semibold">Last Activity</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 group animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-black text-slate-600">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                          <p className="text-[10px] font-mono text-slate-300">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{user.phone}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.role === "Admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.kyc === "Verified"
                            ? "bg-emerald-100 text-emerald-700"
                            : user.kyc === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : user.kyc === "Under Review"
                            ? "bg-blue-100 text-blue-700"
                            : user.kyc === "Rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.kyc}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.wallet === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : user.wallet === "Frozen"
                            ? "bg-rose-100 text-rose-700"
                            : user.wallet === "Restricted"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.wallet}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.risk === "HIGH"
                            ? "bg-red-100 text-red-700"
                            : user.risk === "MEDIUM"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {user.risk}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(user.lastActivity).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>
            Showing 1-{filteredUsers.length} of {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40">
              First
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40">
              Previous
            </button>
            <span className="px-2 font-bold text-slate-900">1</span>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40">
              Next
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-40">
              Last
            </button>
          </div>
        </div>
      </section>

      {/* ========== SEARCH MODAL ========== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="mt-20 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Search Users</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Type name, email, phone, ID or wallet..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-4 text-sm text-slate-500">
              {filteredUsers.length} user{filteredUsers.length !== 1 && "s"} found
            </div>
          </div>
        </div>
      )}
    </div>
  );
}