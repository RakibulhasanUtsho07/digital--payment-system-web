// src/app/(auth)/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
  Eye,
  EyeOff,
  Activity
} from "lucide-react";

type AuthMode = "signin" | "signup";

// Fixing the TypeScript error by casting the ease array as a constant tuple
const springTransition = { 
  duration: 0.9, 
  ease: [0.16, 1, 0.3, 1] as const 
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch on initial render
  useEffect(() => setMounted(true), []);

  const isSignIn = mode === "signin";

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F4F7FB] p-4 lg:p-8">
      
      {/* =========================================================
          TOP EXTERNAL PREMIUM TOGGLE
      ========================================================== */}
      <div className="relative z-20 mb-8 flex h-14 w-full max-w-[340px] items-center rounded-full border border-slate-200/60 bg-white/50 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-[0_2px_15px_rgba(14,165,233,0.15)] border border-slate-100"
          style={{ left: isSignIn ? "6px" : "calc(50%)" }}
        />
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-sm font-bold transition-colors ${
            isSignIn ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-sm font-bold transition-colors ${
            !isSignIn ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* =========================================================
          MAIN AUTH CARD CONTAINER (3D Perspective)
      ========================================================== */}
      <div 
        className="relative mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_80px_rgba(2,6,23,0.08)] min-h-[760px] lg:flex-row"
        style={{ perspective: "2000px" }} // Enables deep 3D space
      >
        
        {/* --- MOBILE VIEW (Standard Stack) --- */}
        <div className="flex flex-col w-full lg:hidden bg-white px-6 py-10 relative z-10">
           <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans text-xl font-extrabold text-[#020617]">NovaWallet</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500">Next-Gen Finance</p>
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

        {/* --- DESKTOP VIEW (Cinematic 3D Swap Animation) --- */}
        <div className="hidden lg:block relative w-full h-full min-h-[760px] transform-style-3d">
          
          {/* FORM PANEL (45% Width) */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "122.222%",
              rotateY: isSignIn ? [0, 8, 0] : [0, -8, 0],
              scale: isSignIn ? [1, 0.95, 1] : [1, 0.95, 1],
              zIndex: isSignIn ? 20 : 10,
              boxShadow: isSignIn ? "25px 0 60px rgba(0,0,0,0.05)" : "-25px 0 60px rgba(0,0,0,0.05)",
            }}
            transition={springTransition}
            className="absolute left-0 top-0 h-full w-[45%] bg-white rounded-[2.5rem]"
          >
            {/* Subtle Grid Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
            
            <div className="relative z-10 flex h-full w-full items-center justify-center px-12 xl:px-16">
              <div className="w-full max-w-[400px]">
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

          {/* INFO PANEL (55% Width) - Premium Deep Blue */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "-81.818%",
              rotateY: isSignIn ? [0, -8, 0] : [0, 8, 0],
              scale: isSignIn ? [1, 0.95, 1] : [1, 0.95, 1],
              zIndex: isSignIn ? 10 : 20,
            }}
            transition={springTransition}
            className="absolute right-0 top-0 h-full w-[55%] overflow-hidden bg-[#020617] rounded-[2.5rem]"
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
      <AuthHeader badge="Welcome Back" title="Sign in to your wallet" description="Enter your details to access your secure dashboard." icon={ShieldCheck} />
      <form className="mt-8 space-y-5">
        <Field id="signin-email" label="Email Address" type="email" placeholder="hello@example.com" icon={Mail} />
        <Field 
          id="signin-password" 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          icon={KeyRound}
          helper={
            <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
              Forgot password?
            </Link>
          }
        />
        <div className="flex items-center justify-between pb-2">
          <label className="flex cursor-pointer items-center gap-2 group">
            <div className="relative flex items-center justify-center h-4 w-4 rounded border border-slate-300 bg-slate-50 group-hover:border-blue-500 transition-colors">
              <input type="checkbox" className="peer absolute opacity-0 h-full w-full cursor-pointer" />
              <ShieldCheck className="h-3 w-3 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs font-medium text-slate-500">Remember me</span>
          </label>
        </div>
        <AuthButton label="Sign In to Dashboard" />
      </form>
      <AuthSwitchText text="Don't have an account?" action="Create your wallet" onClick={() => setMode("signup")} />
    </>
  );
}

function SignUpContent({ setMode }: { setMode: (mode: AuthMode) => void }) {
  return (
    <>
      <AuthHeader badge="Get Started" title="Create your wallet" description="Join NovaWallet and take control of your finances." icon={Sparkles} />
      <form className="mt-8 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="signup-first-name" label="First Name" type="text" placeholder="John" icon={UserRound} />
          <Field id="signup-last-name" label="Last Name" type="text" placeholder="Doe" icon={UserRound} />
        </div>
        <Field id="signup-email" label="Email Address" type="email" placeholder="hello@example.com" icon={Mail} />
        <Field id="signup-password" label="Password" type="password" placeholder="Create a secure password" icon={KeyRound} />
        
        <AuthButton label="Create Account" />
        <p className="text-[11px] leading-relaxed text-slate-500 text-center mt-4">
          By signing up, you agree to our <Link href="#" className="font-semibold text-blue-600 hover:underline">Terms</Link> and <Link href="#" className="font-semibold text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
      </form>
      <AuthSwitchText text="Already have an account?" action="Sign in" onClick={() => setMode("signin")} />
    </>
  );
}

/* =============================================================
   BLUE INFO PANEL CONTENT (Premium Fintech Aesthetic)
============================================================= */

function InfoContent() {
  return (
    <div className="relative flex h-full w-full flex-col px-10 py-12 xl:px-16 xl:py-14 justify-between">
      
      {/* --- Ambient Glowing Backgrounds --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay z-0 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/30 blur-[120px] z-0" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px] z-0" />

      {/* --- Floating 3D Elements --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [-15, 15, -15], rotateZ: [0, -3, 0], rotateX: [0, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[25%] right-[-10%] w-72 h-44 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-6"
        >
          <div className="w-14 h-9 rounded bg-white/20 mb-8" />
          <div className="w-full h-3 rounded bg-white/20 mb-4" />
          <div className="w-2/3 h-3 rounded bg-white/10" />
        </motion.div>
        
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[10%] w-40 h-40 rounded-full border-[1px] border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.1)] border-dashed"
        />
      </div>

      {/* --- Brand Header --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-2xl font-extrabold tracking-tight text-white">NovaWallet</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Next-Gen Finance</p>
          </div>
        </Link>
      </motion.div>

      {/* --- Main Hero Typography --- */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative z-10 mb-10 max-w-[500px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 mb-8 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">The Future of Banking</span>
        </div>
        
        <h1 className="text-[2.8rem] xl:text-[3.4rem] font-extrabold leading-[1.1] text-white tracking-tight">
          Control your money, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            anytime, anywhere.
          </span>
        </h1>
        
        <p className="mt-6 text-base leading-relaxed text-blue-100/70 max-w-md">
          Experience seamless digital transactions with state-of-the-art security. NovaWallet makes managing your finances effortlessly beautiful.
        </p>

        <div className="mt-10 flex flex-col gap-5">
          {[
            { icon: ShieldCheck, text: "Bank-Grade 256-bit Encryption" },
            { icon: Zap, text: "Lightning-fast global transfers" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 text-sm text-blue-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cyan-400 backdrop-blur-sm border border-white/5">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-blue-100/90">{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* =============================================================
   REUSABLE UI COMPONENTS (Header, Field, Buttons)
============================================================= */

function AuthHeader({ badge, title, description, icon: Icon }: any) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 border border-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
        <Icon className="h-3.5 w-3.5" /> {badge}
      </span>
      <h2 className="mt-5 font-sans text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function Field({ id, label, type, placeholder, icon: Icon, helper }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col space-y-1.5 group">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold text-slate-700">{label}</label>
        {helper}
      </div>
      <div className="relative transition-all">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input 
          id={id} 
          name={id} 
          type={inputType} 
          placeholder={placeholder} 
          className="w-full pl-11 pr-11 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function AuthButton({ label }: { label: string }) {
  return (
    <motion.button 
      whileHover={{ y: -2 }} 
      whileTap={{ scale: 0.98 }} 
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-bold text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all hover:from-blue-700 hover:to-blue-800"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}

function AuthSwitchText({ text, action, onClick }: any) {
  return (
    <p className="mt-8 text-center text-sm font-medium text-slate-500">
      {text} <button type="button" onClick={onClick} className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors">{action}</button>
    </p>
  );
}