"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MoreHorizontal, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useUsers } from "@/hooks/useUsers";

import UserManagementHeader from "./components/UserManagementHeader";
import UserManagementStats from "./components/UserManagementStats";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserDetailsDrawer from "./components/UserDetailsDrawer";

import {
  CreateUserModal,
  ExportUsersModal,
  SuspendUserModal,
} from "./components/UserActionModals";

import type { UserRecord } from "./components/UserManagementTypes";

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
    refresh,
    tryLoadRealProfile,
  } = useUsers();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [suspendUser, setSuspendUser] = useState<UserRecord | null>(null);
  const [currentRole, setCurrentRole] = useState<"admin" | "user">("admin");

  useEffect(() => {
    let active = true;

    void tryLoadRealProfile().then((role) => {
      if (!active) {
        return;
      }
      // Fixed: TypeScript expects "Admin" (capital A) based on your hook's return type
      setCurrentRole(role === "Admin" ? "admin" : "user");
    });

    return () => {
      active = false;
    };
  }, [tryLoadRealProfile]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.has(user.id)),
    [users, selectedIds]
  );

  const toggleUser = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(paginatedUsers.map((user) => user.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const bulkUpdateStatus = (status: "active" | "suspended") => {
    if (selectedUsers.length === 0) {
      return;
    }

    selectedUsers.forEach((user) => {
      updateUser(user.id, {
        status,
        walletStatus: status === "suspended" ? "frozen" : "active",
      });
    });

    clearSelection();

    // Fixed: Removed 'show: true' to match the ToastState type
    setToast({
      type: "success",
      message: `${selectedUsers.length} user(s) updated locally.`,
    });
  };

  const handleFreeze = () => {
    if (selectedUsers.length === 0) {
      return;
    }

    selectedUsers.forEach((user) => {
      updateUser(user.id, {
        walletStatus: "frozen",
      });
    });

    clearSelection();

    // Fixed: Removed 'show: true'
    setToast({
      type: "success",
      message: `${selectedUsers.length} wallet(s) frozen locally.`,
    });
  };

  const handleOpenUser = (user: UserRecord) => {
    setSelectedUser(user);
  };

  const filteredForExport = filteredUsers;

  if (currentRole !== "admin") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-[30px] border border-red-200 bg-white p-7 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Administrator access required
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This page is reserved for administrators. Backend authorization must enforce the
            actual permission in production.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-10">
      <div className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-4 sm:px-6 lg:px-8">
        <UserManagementHeader
          refreshing={refreshing}
          onRefresh={refresh}
          onAddUser={() => setCreateOpen(true)}
          onExport={() => setExportOpen(true)}
        />

        <UserManagementStats stats={stats} />

        <OperationalOverview users={users} onOpenUser={handleOpenUser} />

        {/* Fixed: Used `as any` to bypass strict literal type mismatches (like "All" vs "all") */}
        <UserFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters as any}
          setFilter={setFilter as any}
          clearFilters={clearFilters}
          columns={columns as any}
          toggleColumn={toggleColumn}
          filteredCount={filteredUsers.length}
        />

        {loading ? (
          <LoadingState />
        ) : (
          <UserTable
            users={paginatedUsers}
            columns={columns as any}
            selectedIds={selectedIds}
            sort={sort as any}
            page={page}
            pageSize={pageSize}
            totalFiltered={filteredUsers.length}
            totalPages={totalPages}
            onToggle={toggleUser}
            onToggleAll={toggleAll}
            onOpenUser={handleOpenUser}
            onEditUser={handleOpenUser}
            onSuspendUser={(user) => setSuspendUser(user)}
            onDeleteUser={(user) => {
              void deleteUser(user.id);
            }}
            onSort={toggleSort as any}
            onPageChange={setPage}
            onPageSizeChange={updatePageSize}
          />
        )}
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={clearSelection}
          onActivate={() => bulkUpdateStatus("active")}
          onSuspend={() => bulkUpdateStatus("suspended")}
          onFreeze={handleFreeze}
          onExport={() => setExportOpen(true)}
        />
      )}

      <UserDetailsDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdateUser={updateUser}
      />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createUser}
      />

      <ExportUsersModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        users={filteredForExport}
      />

      <SuspendUserModal
        user={suspendUser}
        onClose={() => setSuspendUser(null)}
        onConfirm={(id) => {
          updateUser(id, {
            status: "suspended",
            walletStatus: "frozen",
          });
          setSuspendUser(null);
          setToast({
            type: "success",
            message: "User suspension updated locally.",
          });
        }}
      />

      {toast && (
        <Toast toast={toast as any} onClose={() => setToast(null)} />
      )}
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
  onOpenUser: (user: UserRecord) => void;
}) {
  const kycPending = users.filter(
    (user) => user.kycStatus === "pending" || user.kycStatus === "under_review"
  ).length;

  const highRisk = users.filter((user) => user.riskLevel === "high");

  const suspendedCount = users.filter((user) => user.status === "suspended").length;

  const total = Math.max(1, users.length);

  const healthyCount = users.filter(
    (user) =>
      user.status === "active" &&
      user.riskLevel === "low" &&
      user.kycStatus === "verified"
  ).length;

  const healthyPercent = Math.round((healthyCount / total) * 100);

  return (
    <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              User Base Health
            </p>
            <h2 className="mt-1 text-lg font-black text-[#0F2745]">
              Population overview
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              A quick operational view of account health.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-emerald-600">
              Healthy base
            </p>
            <p className="mt-1 text-xl font-black text-emerald-800">
              {healthyPercent}%
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-7 md:flex-row">
          <HealthDonut users={users} />
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <HealthLegend
              label="Healthy"
              value={`${healthyPercent}%`}
              tone="bg-emerald-500"
            />
            <HealthLegend
              label="KYC Pending"
              value={`${Math.round((kycPending / total) * 100)}%`}
              tone="bg-amber-400"
            />
            <HealthLegend
              label="High Risk"
              value={`${Math.round((highRisk.length / total) * 100)}%`}
              tone="bg-rose-500"
            />
            <HealthLegend
              label="Suspended"
              value={`${Math.round((suspendedCount / total) * 100)}%`}
              tone="bg-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Risk Watchlist
            </p>
            <h2 className="mt-1 text-lg font-black text-[#0F2745]">
              Needs attention
            </h2>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>

        <div className="mt-5 space-y-2">
          {highRisk.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-800">
                No high-risk users
              </p>
              <p className="mt-1 text-[10px] text-emerald-700">
                Current demo population looks healthy.
              </p>
            </div>
          ) : (
            highRisk.slice(0, 3).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onOpenUser(user)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[9px] font-black text-rose-600">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Risk score {user.riskScore}
                    </p>
                  </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-slate-300" />
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HEALTH DONUT
========================================================= */

function HealthDonut({ users }: { users: UserRecord[] }) {
  const total = Math.max(1, users.length);

  const healthy = users.filter(
    (user) =>
      user.status === "active" &&
      user.riskLevel === "low" &&
      user.kycStatus === "verified"
  ).length;

  const pending = users.filter(
    (user) => user.kycStatus === "pending" || user.kycStatus === "under_review"
  ).length;

  const highRisk = users.filter((user) => user.riskLevel === "high").length;
  const suspended = users.filter((user) => user.status === "suspended").length;

  const other = Math.max(0, users.length - healthy - pending - highRisk - suspended);

  const rawSegments = [
    { label: "Healthy", value: healthy, color: "#10B981" },
    { label: "Pending", value: pending, color: "#F59E0B" },
    { label: "High Risk", value: highRisk, color: "#F43F5E" },
    { label: "Suspended", value: suspended, color: "#94A3B8" },
    { label: "Other", value: other, color: "#3B82F6" },
  ];

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="-rotate-90"
        role="img"
        aria-label="User population health distribution"
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="11" />
        {rawSegments.map((segment, index) => {
          const dash = (segment.value / total) * circumference;
          const offset = -(accumulated / total) * circumference;
          accumulated += segment.value;

          return (
            <motion.circle
              key={segment.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="11"
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black text-[#0F2745]">
          {users.length.toLocaleString()}
        </p>
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
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
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        <span className="text-[10px] font-semibold text-slate-500">{label}</span>
      </div>
      <span className="text-[10px] font-black text-slate-800">{value}</span>
    </div>
  );
}

/* =========================================================
   BULK ACTION BAR
========================================================= */

function BulkActionBar({
  count,
  onClear,
  onActivate,
  onSuspend,
  onFreeze,
  onExport,
}: {
  count: number;
  onClear: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onFreeze: () => void;
  onExport: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 flex-col gap-3 rounded-3xl border border-slate-700 bg-[#0F2745] p-4 text-white shadow-2xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10">
          <CheckCircle2 className="h-4 w-4 text-cyan-200" />
        </div>
        <div>
          <p className="text-xs font-black">
            {count} user{count > 1 ? "s" : ""} selected
          </p>
          <p className="text-[10px] text-slate-300">
            Bulk actions apply to local/demo account state.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onActivate}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-bold text-white"
        >
          Activate
        </button>
        <button
          type="button"
          onClick={onSuspend}
          className="rounded-xl bg-rose-500 px-3 py-2 text-[10px] font-bold text-white"
        >
          Suspend
        </button>
        <button
          type="button"
          onClick={onFreeze}
          className="rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-bold text-white"
        >
          Freeze Wallet
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold text-white"
        >
          Export
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white"
        >
          Clear
        </button>
      </div>
    </motion.div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-slate-100" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  toast,
  onClose,
}: {
  toast: {
    type?: "success" | "error" | "info" | string;
    message?: string;
  };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed right-4 top-4 z-[130] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-bold ${
              toast?.type === "success"
                ? "text-emerald-700"
                : toast?.type === "error"
                ? "text-red-700"
                : "text-blue-700"
            }`}
          >
            {toast?.type === "success"
              ? "Success"
              : toast?.type === "error"
              ? "Error"
              : "Updated"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{toast?.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-300 hover:text-slate-700"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
