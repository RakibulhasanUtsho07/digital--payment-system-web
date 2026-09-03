"use client";

import React from "react";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";

import type {
  ColumnVisibility,
  SortField,
  SortState,
  UserRecord,
} from "./UserManagementTypes";
import UserEmptyState from "./UserEmptyState";
import UserManagementPagination from "./UserManagementPagination";
import UserTableRow, { Badge } from "./UserTableRow";

interface UserTableProps {
  users: UserRecord[];
  columns: ColumnVisibility;
  selectedIds: Set<string>;
  sort: SortState;
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onOpenUser: (user: UserRecord) => void;
  onEditUser: (user: UserRecord) => void;
  onSuspendUser: (user: UserRecord) => void;
  onDeleteUser: (user: UserRecord) => void;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters?: () => void;
}

export default function UserTable({
  users,
  columns,
  selectedIds,
  sort,
  page,
  pageSize,
  totalFiltered,
  totalPages,
  onToggle,
  onToggleAll,
  onOpenUser,
  onEditUser,
  onSuspendUser,
  onDeleteUser,
  onSort,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: UserTableProps) {
  const allSelected =
    users.length > 0 && users.every((user) => selectedIds.has(user.id));

  return (
    <section className="overflow-visible rounded-[26px] border border-slate-200 bg-white shadow-sm">
      {/* Table Header */}
      <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-black text-[#0F2745]">All users</h2>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Open a row to inspect the complete account profile.
          </p>
        </div>
        <span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold text-slate-500 sm:self-auto">
          {totalFiltered} result{totalFiltered === 1 ? "" : "s"}
        </span>
      </header>

      {users.length === 0 ? (
        <UserEmptyState filtered onClear={onClearFilters} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => onToggleAll(event.target.checked)}
                      aria-label="Select visible users"
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </th>
                  <SortHeader
                    label="User"
                    field="name"
                    sort={sort}
                    onSort={onSort}
                    className="w-[30%]"
                  />
                  {columns.phone && (
                    <th className="hidden w-[17%] px-2 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400 lg:table-cell">
                      Phone
                    </th>
                  )}
                  {columns.role && (
                    <SortHeader
                      label="Role"
                      field="role"
                      sort={sort}
                      onSort={onSort}
                      className="w-[10%]"
                    />
                  )}
                  {columns.kyc && (
                    <SortHeader
                      label="KYC"
                      field="kycStatus"
                      sort={sort}
                      onSort={onSort}
                      className="hidden w-[11%] xl:table-cell"
                    />
                  )}
                  {columns.wallet && (
                    <SortHeader
                      label="Wallet"
                      field="walletStatus"
                      sort={sort}
                      onSort={onSort}
                      className="hidden w-[12%] xl:table-cell"
                    />
                  )}
                  {columns.risk && (
                    <SortHeader
                      label="Risk"
                      field="riskScore"
                      sort={sort}
                      onSort={onSort}
                      className="w-[9%]"
                    />
                  )}
                  {columns.lastActive && (
                    <SortHeader
                      label="Last active"
                      field="lastActive"
                      sort={sort}
                      onSort={onSort}
                      className="hidden w-[15%] 2xl:table-cell"
                    />
                  )}
                  {columns.joined && (
                    <SortHeader
                      label="Joined"
                      field="joinedAt"
                      sort={sort}
                      onSort={onSort}
                      className="hidden w-[15%] 2xl:table-cell"
                    />
                  )}
                  <th className="w-14 px-3 py-3 text-right">
                    <MoreHorizontal className="ml-auto h-4 w-4 text-slate-300" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    columns={columns}
                    selected={selectedIds.has(user.id)}
                    onToggle={onToggle}
                    onOpen={onOpenUser}
                    onEdit={onEditUser}
                    onSuspend={onSuspendUser}
                    onDelete={onDeleteUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-3 p-3 md:hidden">
            {users.map((user) => (
              <article
                key={user.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  selectedIds.has(user.id)
                    ? "border-blue-300 bg-blue-50/70"
                    : "border-slate-100 bg-slate-50/60 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => onToggle(user.id)}
                    aria-label={`Select ${user.name}`}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => onOpenUser(user)}
                    className="min-w-0 flex-1 text-left focus:outline-none"
                  >
                    <strong className="block truncate text-sm font-bold text-slate-900">
                      {user.name}
                    </strong>
                    <span className="block truncate text-[10px] text-slate-400">
                      {user.email}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenUser(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm hover:text-slate-600 focus:outline-none"
                    aria-label={`Open details for ${user.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge value={user.role} />
                  <Badge value={user.kycStatus} />
                  <Badge value={user.riskLevel} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Table Pagination */}
      <UserManagementPagination
        page={page}
        pageSize={pageSize}
        total={totalFiltered}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
}

interface SortHeaderProps {
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
  className = "",
}: SortHeaderProps) {
  const active = sort.field === field;
  const Icon = sort.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={`px-2 py-3 text-left ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider focus:outline-none ${
          active
            ? "text-blue-600"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        {label}
        {active && <Icon className="h-3 w-3" />}
      </button>
    </th>
  );
}