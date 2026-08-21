import React from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        {/* Navbar for Mobile & Desktop */}
        <div className="w-full navbar bg-base-100 shadow-sm">
          <div className="flex-none lg:hidden">
            <label htmlFor="dashboard-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 font-bold text-xl">Digital Wallet</div>
          <div className="flex-none hidden lg:block">
            <ul className="menu menu-horizontal">
              <li><button className="btn btn-sm btn-outline btn-error">Logout</button></li>
            </ul>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div> 
      
      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-64 min-h-full bg-base-100 text-base-content space-y-2">
          <li className="menu-title">Menu</li>
          <li><Link href="/dashboard">Overview</Link></li>
          <li><Link href="/dashboard/wallet">My Wallet</Link></li>
          <li><Link href="/dashboard/send">Send Money</Link></li>
          <li><Link href="/dashboard/transactions">Transactions</Link></li>
          <li><Link href="/dashboard/kyc">KYC</Link></li>
          {/* Logout button for mobile */}
          <li className="mt-auto lg:hidden">
            <button className="text-error font-bold">Logout</button>
          </li>
        </ul>
      </div>
    </div>
  );
}