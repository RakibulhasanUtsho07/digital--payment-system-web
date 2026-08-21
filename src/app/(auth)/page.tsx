// src/app/(auth)/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ScanFace,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
  Activity,
} from "lucide-react";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const isSignIn = mode === "signin";

  return (
    <div className="flex w-full flex-col items-center justify-center">
      
      {/* =========================================================
          TOP EXTERNAL TOGGLE
      ========================================================== */}
      <div className="relative z-20 mb-8 flex h-14 w-[320px] items-center rounded-full border border-[#E3EAF1] bg-[#F7F9FC] p-1.5 shadow-sm">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-[0_2px_10px_rgba(31,94,168,0.12)]"
          style={{ left: isSignIn ? "6px" : "calc(50%)" }}
        />
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-sm font-semibold transition-colors ${
            isSignIn ? "text-[#1F5EA8]" : "text-[#7A899A] hover:text-[#405169]"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-sm font-semibold transition-colors ${
            !isSignIn ? "text-[#1F5EA8]" : "text-[#7A899A] hover:text-[#405169]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* =========================================================
          MAIN AUTH CARD CONTAINER
      ========================================================== */}
      <div className="relative mx-auto flex w-full max-w-[1300px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_25px_80px_rgba(23,54,93,0.08)] min-h-[780px] lg:flex-row bg-[#F4F7FB]/50">
        
        {/* --- MOBILE VIEW (Standard Stack) --- */}
        <div className="flex flex-col w-full lg:hidden bg-white px-6 py-10">
           {/* Mobile Header */}
           <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5EA8] text-white">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-[#162A43]">Wallet</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#8291A5]">Digital Wallet System</p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {isSignIn ? (
                <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <SignInContent setMode={setMode} />
                </motion.div>
              ) : (
                <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <SignUpContent setMode={setMode} />
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* --- DESKTOP VIEW (3D Swap Animation) --- */}
        <div className="hidden lg:block relative w-full h-full min-h-[780px] rounded-[2rem] overflow-hidden">
          
          {/* 
            FORM PANEL (45% Width) 
            Math: To move a 45% element across a 55% gap, it must translate 55/45 = 122.222% of its own width.
          */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "122.222%",
              scale: isSignIn ? 1 : 0.95,
              zIndex: isSignIn ? 20 : 10,
              boxShadow: isSignIn ? "20px 0 50px rgba(0,0,0,0.15)" : "-20px 0 50px rgba(0,0,0,0.15)",
            }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 h-full w-[45%] bg-white"
          >
            <div className="flex h-full w-full items-center justify-center px-10 xl:px-14">
              <div className="w-full max-w-[420px]">
                <AnimatePresence mode="wait">
                  {isSignIn ? (
                    <motion.div key="signin" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                      <SignInContent setMode={setMode} />
                    </motion.div>
                  ) : (
                    <motion.div key="signup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                      <SignUpContent setMode={setMode} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* 
            INFO PANEL (55% Width)
            Math: To move a 55% element across a 45% gap to the left, it translates -45/55 = -81.818% of its width. 
          */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "-81.818%",
              scale: isSignIn ? 0.95 : 1,
              zIndex: isSignIn ? 10 : 20,
            }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-0 h-full w-[55%] overflow-hidden bg-[#123B66]"
          >
            <InfoContent />
          </motion.div>

        </div>
      </div>
    </div>
  );
}

/* =============================================================
   FORM SUB-COMPONENTS
============================================================= */

function SignInContent({ setMode }: { setMode: (mode: AuthMode) => void }) {
  return (
    <>
      <AuthHeader badge="Secure Login" title="Welcome back" description="Sign in to access your wallet, transfers and financial insights." icon={LockKeyhole} />
      <form className="mt-8 space-y-5">
        <Field id="signin-email" label="Email or Phone" type="text" placeholder="you@example.com" icon={Mail} />
        <Field id="signin-password" label="Password" type="password" placeholder="Enter your password" icon={KeyRound}
          helper={
            <Link href="/auth/forgot-password" className="font-semibold text-[#1F5EA8] hover:underline">
              Forgot password?
            </Link>
          }
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-[#CBD6E2] accent-[#1F5EA8]" />
            <span className="text-[11px] font-medium text-[#718095]">Remember me</span>
          </label>
          <span className="flex items-center gap-1.5 text-[10px] text-[#97A4B4]">
            <LockKeyhole className="h-3 w-3" /> Secure session
          </span>
        </div>
        <AuthButton label="Sign In" />
      </form>
      <SecurityNote title="Your wallet stays private" description="After login, only your authenticated account can access its wallet." />
      <AuthSwitchText text="Don't have an account?" action="Create your wallet" onClick={() => setMode("signup")} />
    </>
  );
}

function SignUpContent({ setMode }: { setMode: (mode: AuthMode) => void }) {
  return (
    <>
      <AuthHeader badge="Get Started" title="Create your wallet" description="Join a secure digital wallet built for everyday payments." icon={Sparkles} />
      <form className="mt-8 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="signup-first-name" label="First Name" type="text" placeholder="Rakibul" icon={UserRound} />
          <Field id="signup-last-name" label="Last Name" type="text" placeholder="Hasan" icon={UserRound} />
        </div>
        <Field id="signup-email" label="Email Address" type="email" placeholder="you@example.com" icon={Mail} />
        <Field id="signup-password" label="Password" type="password" placeholder="Create password" icon={KeyRound} />
        
        <label className="flex items-start gap-3 pt-2">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-[#CBD6E2] accent-[#1F5EA8]" />
          <span className="text-[10px] leading-5 text-[#718095]">
            I agree to the <Link href="/terms" className="font-semibold text-[#1F5EA8] hover:underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#1F5EA8] hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <AuthButton label="Create Wallet" />
      </form>
      <AuthSwitchText text="Already have an account?" action="Sign in" onClick={() => setMode("signin")} />
    </>
  );
}

/* =============================================================
   BLUE INFO PANEL CONTENT
============================================================= */

function InfoContent() {
  const services = [
    { icon: ShieldCheck, title: "Secure Payments", description: "Protection-focused payment flows with validation and authentication." },
    { icon: Send, title: "Fast Transfers", description: "Simple peer-to-peer transfers with clear confirmation steps." },
    { icon: ScanFace, title: "KYC Verification", description: "Structured identity verification built into the wallet experience." },
    { icon: TrendingUp, title: "Smart Insights", description: "AI-assisted spending, budgeting and cash-flow intelligence." },
  ];

  return (
    <div className="relative flex h-full w-full flex-col px-10 py-10 xl:px-14 xl:py-12">
      {/* Ambient backgrounds */}
      <motion.div animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -left-28 top-16 h-[360px] w-[360px] rounded-full bg-[#4EA3E3]/15 blur-3xl" />
      <motion.div animate={{ x: [0, -18, 0], y: [0, 14, 0], scale: [1.05, 1, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -bottom-32 right-[-90px] h-[430px] w-[430px] rounded-full bg-[#2DBE8C]/10 blur-3xl" />

      {/* Brand */}
      <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#9DDCFF]">
          <WalletCards className="h-5 w-5" />
        </span>
        <div>
          <p className="font-serif text-xl font-bold tracking-tight text-white">Wallet</p>
          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-100/45">Digital Wallet System</p>
        </div>
      </Link>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.2 }} className="relative z-10 mt-16 max-w-[550px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2">
          <Sparkles className="h-3.5 w-3.5 text-[#9DDCFF]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">FinTech • Secure Payments</span>
        </div>
        <h1 className="mt-6 font-serif text-[2.7rem] font-bold leading-[1.05] tracking-[-0.04em] text-white xl:text-[3.5rem]">
          Finance should feel <span className="block text-[#9DDCFF]">simple and secure.</span>
        </h1>
        <p className="mt-6 text-sm leading-7 text-blue-100/70 xl:text-base">
          EG13-14 brings secure payments, transfers, KYC, transaction visibility and intelligent financial assistance together in one focused digital wallet experience.
        </p>
      </motion.div>

      <div className="relative z-10 mt-10 grid max-w-[690px] grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((service, index) => (
          <motion.div key={service.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9DDCFF]">
                <service.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{service.title}</p>
                <p className="mt-1 text-[9px] leading-4 text-blue-100/45">{service.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================
   REUSABLE UI COMPONENTS (Header, Field, Buttons)
============================================================= */

function AuthHeader({ badge, title, description, icon: Icon }: any) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
        <Icon className="h-3 w-3" /> {badge}
      </span>
      <h2 className="mt-5 font-serif text-3xl font-bold tracking-[-0.03em] text-[#162A43] sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[#718095]">{description}</p>
    </div>
  );
}

function Field({ id, label, type, placeholder, icon: Icon, helper }: any) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-[#405169]">{label}</label>
        {helper}
      </div>
      <div className="relative">
        <input id={id} name={id} type={type} placeholder={placeholder} className="h-12 w-full rounded-xl border border-[#DCE4ED] bg-[#FBFCFE] px-4 pr-11 text-sm text-[#162A43] outline-none transition-all placeholder:text-[#A5B0BE] focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-[#1F5EA8]/10" />
        <Icon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5B0BE]" />
      </div>
    </div>
  );
}

function AuthButton({ label }: { label: string }) {
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,94,168,0.18)] transition-all hover:bg-[#184880]">
      {label} <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}

function SecurityNote({ title, description }: any) {
  return (
    <div className="mt-7 flex gap-3 rounded-2xl border border-[#DDEAF7] bg-[#F5F9FD] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#405169]">{title}</p>
        <p className="mt-1 text-[10px] leading-5 text-[#8190A3]">{description}</p>
      </div>
    </div>
  );
}

function AuthSwitchText({ text, action, onClick }: any) {
  return (
    <p className="mt-7 text-center text-xs text-[#8190A3]">
      {text} <button type="button" onClick={onClick} className="font-semibold text-[#1F5EA8] hover:underline">{action}</button>
    </p>
  );
}