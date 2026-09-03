"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Edit3,
  Eye,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
  WalletCards,
} from "lucide-react";

import type { ColumnVisibility, UserRecord } from "./UserManagementTypes";

interface UserTableRowProps {
  user: UserRecord;
  columns: ColumnVisibility;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpen: (user: UserRecord) => void;
  onEdit: (user: UserRecord) => void;
  onSuspend: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}

export default function UserTableRow({
  user,
  columns,
  selected,
  onToggle,
  onOpen,
  onEdit,
  onSuspend,
  onDelete,
}: UserTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLTableCellElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group border-t border-slate-100 transition ${
        selected ? "bg-blue-50/60" : "hover:bg-slate-50/70"
      }`}
    >
      {/* Selection Checkbox */}
      <td className="w-12 px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(user.id)}
          aria-label={`Select ${user.name}`}
          className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-2 focus:ring-blue-500/20"
        />
      </td>

      {/* Primary User Info */}
      <td className="px-2 py-4">
        <button
          type="button"
          onClick={() => onOpen(user)}
          className="flex min-w-0 items-center gap-3 text-left focus:outline-none"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1F5EA8] to-cyan-500 text-xs font-black text-white shadow-[0_6px_15px_rgba(31,94,168,.22)]">
            {getInitials(user.name)}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-extrabold text-slate-900 group-hover:text-blue-700">
              {user.name}
            </strong>
            <span className="block truncate text-[10px] text-slate-400">
              {user.email}
            </span>
            <span className="mt-0.5 block truncate text-[9px] text-slate-300">
              ID: {user.id}
            </span>
          </span>
        </button>
      </td>

      {/* Dynamic Columns */}
      {columns.phone && (
        <td className="hidden px-2 py-4 text-xs font-medium text-slate-500 lg:table-cell">
          {user.phone}
        </td>
      )}

      {columns.role && (
        <td className="hidden px-2 py-4 md:table-cell">
          <Badge value={user.role} />
        </td>
      )}

      {columns.kyc && (
        <td className="hidden px-2 py-4 xl:table-cell">
          <Badge value={user.kycStatus} />
        </td>
      )}

      {columns.wallet && (
        <td className="hidden px-2 py-4 xl:table-cell">
          <Badge
            value={user.walletStatus}
            icon={<WalletCards className="h-3 w-3" />}
          />
        </td>
      )}

      {columns.risk && (
        <td className="hidden px-2 py-4 md:table-cell">
          <Badge value={user.riskLevel} />
        </td>
      )}

      {columns.lastActive && (
        <td className="hidden px-2 py-4 text-[10px] font-semibold text-slate-500 2xl:table-cell">
          {formatDate(user.lastActive)}
        </td>
      )}

      {columns.joined && (
        <td className="hidden px-2 py-4 text-[10px] text-slate-500 2xl:table-cell">
          {formatDate(user.joinedAt)}
        </td>
      )}

      {/* Context Actions Dropdown */}
      <td className="relative w-14 px-3 py-4 text-right" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label={`Actions for ${user.name}`}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-4 top-12 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
            >
              <MenuButton
                icon={Eye}
                label="View details"
                onClick={() => {
                  onOpen(user);
                  setMenuOpen(false);
                }}
              />
              <MenuButton
                icon={Edit3}
                label="Edit user"
                onClick={() => {
                  onEdit(user);
                  setMenuOpen(false);
                }}
              />
              <MenuButton
                icon={ShieldAlert}
                label="Suspend"
                onClick={() => {
                  onSuspend(user);
                  setMenuOpen(false);
                }}
              />
              <MenuButton
                icon={Trash2}
                label="Delete"
                danger
                onClick={() => {
                  onDelete(user);
                  setMenuOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

interface BadgeProps {
  value: string;
  icon?: React.ReactNode;
}

export function Badge({ value, icon }: BadgeProps) {
  const normalized = value.replaceAll("_", " ");

  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    verified: "bg-emerald-50 text-emerald-700",
    user: "bg-blue-50 text-blue-700",
    admin: "bg-indigo-50 text-indigo-700",
    support: "bg-violet-50 text-violet-700",
    analyst: "bg-cyan-50 text-cyan-700",
    pending: "bg-amber-50 text-amber-700",
    under_review: "bg-amber-50 text-amber-700",
    not_started: "bg-slate-100 text-slate-600",
    rejected: "bg-rose-50 text-rose-700",
    suspended: "bg-rose-50 text-rose-700",
    frozen: "bg-rose-50 text-rose-700",
    restricted: "bg-orange-50 text-orange-700",
    high: "bg-rose-50 text-rose-700",
    medium: "bg-orange-50 text-orange-700",
    low: "bg-slate-100 text-slate-600",
    closed: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize ${
        colors[value] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {normalized}
    </span>
  );
}

function getInitials(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "N/A";
  }
}