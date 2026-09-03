import React from "react";
import { SearchX, Users } from "lucide-react";

interface UserEmptyStateProps {
  filtered: boolean;
  onClear?: () => void;
}

export default function UserEmptyState({
  filtered,
  onClear,
}: UserEmptyStateProps) {
  const Icon = filtered ? SearchX : Users;

  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      {/* Icon Node */}
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-6 w-6" />
      </span>

      {/* Title */}
      <h3 className="mt-4 text-base font-black text-slate-900">
        {filtered ? "No users match these filters" : "No users yet"}
      </h3>

      {/* Description */}
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {filtered
          ? "Try changing the search or clearing one of the active filters."
          : "Create the first account to start managing users."}
      </p>

      {/* Clear Filters Action */}
      {filtered && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}