"use client";

import {
  Search,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import type { SettingsSection } from "./SettingsTypes";

interface SettingsSidebarProps {
  sections: SettingsSection[];
  activeSection: string;
  searchQuery: string;
  onSearchChange: (
    value: string
  ) => void;
  onSectionChange: (
    id: string
  ) => void;
}

export default function SettingsSidebar({
  sections,
  activeSection,
  searchQuery,
  onSearchChange,
  onSectionChange,
}: SettingsSidebarProps) {
  const filtered = sections.filter(
    (section) => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        section.label
          .toLowerCase()
          .includes(query) ||
        section.keywords.some(
          (keyword) =>
            keyword
              .toLowerCase()
              .includes(query)
        )
      );
    }
  );

  return (
    <aside className="min-w-0">
      <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_10px_35px_rgba(15,23,42,0.04)] lg:sticky lg:top-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={searchQuery}
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
            placeholder="Search settings..."
            className="h-11 w-full rounded-xl border border-transparent bg-[#F6F8FB] pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <nav className="mt-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-400">
              No settings found.
            </div>
          ) : (
            filtered.map(
              (section) => {
                const Icon =
                  section.icon;

                const active =
                  section.id ===
                  activeSection;

                return (
                  <button
                    key={
                      section.id
                    }
                    type="button"
                    onClick={() =>
                      onSectionChange(
                        section.id
                      )
                    }
                    className="relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                  >
                    {active && (
                      <motion.div
                        layoutId="settings-active"
                        className="absolute inset-0 rounded-xl border border-blue-100 bg-blue-50"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 28,
                        }}
                      />
                    )}

                    <span
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-lg ${
                        active
                          ? "bg-white text-[#1F5EA8] shadow-sm"
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="relative z-10 min-w-0 flex-1 truncate text-xs font-bold">
                      <span
                        className={
                          active
                            ? "text-[#1F5EA8]"
                            : "text-slate-600"
                        }
                      >
                        {section.label}
                      </span>
                    </span>

                    <ChevronRight
                      className={`relative z-10 h-4 w-4 ${
                        active
                          ? "text-[#1F5EA8]"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              }
            )
          )}
        </nav>
      </div>
    </aside>
  );
}