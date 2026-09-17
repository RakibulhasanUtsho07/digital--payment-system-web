"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, ShieldCheck, UserRoundCheck, WalletCards } from "lucide-react";

const productSignals = [
  { icon: Clock3, value: "Live", label: "Transaction status" },
  { icon: UserRoundCheck, value: "Role", label: "Access checks" },
  { icon: FileCheck2, value: "KYC", label: "Verification state" },
  { icon: ShieldCheck, value: "Secure", label: "Session controls" },
];

const transactions = [
  { name: "Transfer to Nusrat", amount: "- BDT 1,250", status: "Completed", tone: "text-emerald-600" },
  { name: "Wallet top up", amount: "+ BDT 4,500", status: "Pending", tone: "text-amber-600" },
  { name: "Merchant payment", amount: "- BDT 780", status: "Completed", tone: "text-emerald-600" },
];

export function StatsAndBanner({ statsRef, bannerRef, statsVisible, bannerVisible }: { statsRef: React.RefObject<HTMLDivElement | null>; bannerRef: React.RefObject<HTMLDivElement | null>; statsVisible: boolean; bannerVisible: boolean }) {
  return (
    <section id="open-wallet" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1440px]">
        <div ref={statsRef} className={`coffer-reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${statsVisible ? "is-visible" : ""}`}>
          {productSignals.map(({ icon: Icon, value, label }) => (
            <article key={label} className="group rounded-[26px] border border-[#120d25]/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,13,37,.08)]">
              <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-violet-600" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
              <p className="mt-10 text-3xl font-black tracking-[-0.05em]">{value}</p><p className="mt-1 text-sm text-[#120d25]/50">{label}</p>
            </article>
          ))}
        </div>

        <div ref={bannerRef} className={`coffer-reveal relative mt-8 overflow-hidden rounded-[38px] bg-[#ded3ff] p-6 sm:p-10 lg:p-16 ${bannerVisible ? "is-visible" : ""}`}>
          <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full border-[70px] border-white/30" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_.9fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-violet-800"><WalletCards className="h-4 w-4" /> One wallet, clearer control</p>
              <h2 className="mt-6 max-w-3xl text-[clamp(2.7rem,5.2vw,5.3rem)] font-black leading-[.94] tracking-[-0.065em]">Move money without losing sight of it.</h2>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#120d25]/60">Create an account, complete required verification and follow each supported wallet action from one dashboard.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Readable confirmation flow", "Visible activity history", "Clear account status", "Responsive wallet dashboard"].map((item) => <p key={item} className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-violet-700" />{item}</p>)}
              </div>
              <Link href="/register" className="group mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#120d25] px-7 text-sm font-black text-white transition hover:-translate-y-1">Open a wallet <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/75 p-5 shadow-[0_30px_80px_rgba(18,13,37,.15)] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#120d25]/40">Wallet activity preview</p><p className="mt-2 text-2xl font-black">BDT 24,850.00</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">Demo</span></div>
              <div className="mt-7 space-y-2">
                {transactions.map((item, index) => <div key={item.name} className="transaction-row flex items-center justify-between gap-4 rounded-2xl bg-white/80 p-4" style={{ animationDelay: `${index * 650}ms` }}><div className="min-w-0"><p className="truncate text-sm font-black">{item.name}</p><p className={`mt-1 text-[10px] font-bold ${item.tone}`}>{item.status}</p></div><p className="shrink-0 text-sm font-black">{item.amount}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
