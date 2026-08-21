// src/app/(auth)/layout.tsx
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {children}
    </main>
  );
}