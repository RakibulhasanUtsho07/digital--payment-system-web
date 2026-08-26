"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import SettingsSidebar from "./SettingsSidebar";
import SettingsHealth from "./SettingsHealth";
import type {
  Role,
  SettingsSection,
} from "./SettingsTypes";

interface SettingsShellProps {
  role: Role;
  sections: SettingsSection[];
  activeSection: string;
  searchQuery: string;
  onSearchChange: (
    value: string
  ) => void;
  onSectionChange: (
    id: string
  ) => void;
  children: ReactNode;
  rightRail?: ReactNode;
}

export default function SettingsShell({
  role,
  sections,
  activeSection,
  searchQuery,
  onSearchChange,
  onSectionChange,
  children,
  rightRail,
}: SettingsShellProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
      <SettingsSidebar
        sections={
          sections
        }
        activeSection={
          activeSection
        }
        searchQuery={
          searchQuery
        }
        onSearchChange={
          onSearchChange
        }
        onSectionChange={
          onSectionChange
        }
      />

      <main className="min-w-0">
        <motion.div
          key={
            activeSection
          }
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.25,
          }}
          className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-7 lg:p-8"
        >
          {children}
        </motion.div>
      </main>

      <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start">
        <SettingsHealth
          role={role}
        />

        {rightRail}
      </aside>
    </div>
  );
}