import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      {/* এখানে আপনি চাইলে কমন কোনো লোগো বা ব্যাকগ্রাউন্ড কন্টেইনার রাখতে পারেন */}
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}