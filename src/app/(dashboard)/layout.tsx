"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Bell, CircleUserRound } from "lucide-react";
import UserSidebar from "@/components/dashboard/layout/UserSidebar";
import AdminSidebar from "@/components/dashboard/layout/AdminSidebar";
import { clearAuth } from "@/lib/auth/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // TODO: Replace with Real Auth Hook/Context later
  const [userRole, setUserRole] = useState<"admin" | "user">("user"); // Change to "admin" to test admin UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#162A43] flex">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0B1F33]/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Conditionally Rendered */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 lg:static lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {userRole === "admin" ? (
          <AdminSidebar onLogout={handleLogout} />
        ) : (
          <UserSidebar onLogout={handleLogout} />
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 border-b border-[#E3EAF1] bg-white/90 backdrop-blur-xl h-[76px] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl border border-[#DCE5EE] text-[#405169]">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-bold text-[#162A43] sm:text-base">
              {userRole === "admin" ? "Admin Control Center" : "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#DCE5EE] bg-white relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-[#DCE5EE] px-3 py-1.5 bg-white">
              <CircleUserRound className="h-5 w-5 text-[#1F5EA8]" />
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold text-[#334155]">{userRole === "admin" ? "System Admin" : "My Account"}</p>
                <p className="text-[8px] text-slate-400 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-[1440px]">
            {/* Pass role via context or cloneElement if needed, but App router handles children natively */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}