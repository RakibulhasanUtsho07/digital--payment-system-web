"use client";

import React, { useState } from "react";
import UserDashboardOverview from "@/components/dashboard/views/UserDashboardOverview";
import AdminDashboardOverview from "@/components/dashboard/views/AdminDashboardOverview";

export default function DashboardPage() {
  // TODO: Replace with your real user context/store
  const [userRole, setUserRole] = useState<"admin" | "user">("user"); // Change to "admin" to test admin UI

  // Simulated Dynamic Data
  const userData = {
    name: "Rakibul",
    greeting: "Good morning",
    role: userRole
  };

  if (userRole === "admin") {
    return <AdminDashboardOverview user={userData} />;
  }

  return <UserDashboardOverview user={userData} />;
}