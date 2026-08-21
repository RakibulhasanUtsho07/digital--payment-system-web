"use client";

import { useState, type ElementType, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ScanFace,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  CreditCard,
  Zap
} from "lucide-react";

type AuthMode = "signin" | "signup";

const features = [
  { icon: ShieldCheck, title: "Bank-Grade Security", desc: "End-to-end encrypted transactions." },
  { icon: Zap, title: "Instant Transfers", desc: "Send money in milliseconds." },
  { icon: ScanFace, title: "Smart KYC", desc: "AI-powered quick identity verification." },
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const isSignIn = mode === "signin";

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] relative">
      
      {/* =====================================================
          LEFT PRODUCT PANEL (Redesigned & Unique)
      ====================================================== */}
      <section className="relative hidden min-h-[850px] overflow-hidden bg-[#0A192F] lg:flex flex-col">
        {/* Animated Background Mesh & Orbs */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <motion.div
          animate={{ x: [-20, 30, -20], y: [-20, 30, -20], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-600/30 blur-[120px]"
        />
        <motion.div
          animate={{ x: [20, -30, 20], y: [20, -30, 20], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-teal-500/20 blur-[130px]"
        />

        {/* Content Container */}
        <div className="relative z-10 flex h-full w-full flex-col px-12 py-12 xl:px-20 justify-between">
          
          {/* Brand Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans text-2xl font-bold tracking-tight text-white">NovaWallet</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-teal-300/80">
                  Next-Gen Finance
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Center 3D Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="my-auto"
          >
            <div className="relative rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 blur-2xl opacity-60"></div>
              
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-semibold text-teal-300">The Future of Banking</span>
              </div>

              <h1 className="font-sans text-4xl font-extrabold leading-[1.1] text-white xl:text-5xl">
                Control your money, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                  anytime, anywhere.
                </span>
              </h1>
              
              <p className="mt-6 text-base leading-relaxed text-blue-100/70 max-w-md">
                Experience seamless digital transactions with state-of-the-art security. NovaWallet makes managing your finances effortlessly beautiful.
              </p>

              <div className="mt-8 space-y-4">
                {features.map((feature, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 text-sm text-blue-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-teal-400">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-[11px] text-blue-200/50">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Footer Text */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center justify-between text-xs text-blue-200/40">
            <p>© 2026 NovaWallet Inc.</p>
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-teal-500/70" />
              <span>SSL Secured & Encrypted</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          RIGHT AUTH PANEL (Form & Top Toggle)
      ====================================================== */}
      <section className="relative flex min-h-[850px] flex-col overflow-y-auto bg-white">
        
        {/* Background Texture */}
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* TOP TOGGLE (Placed like a Sub-Navbar) */}
        <div className="sticky top-0 z-50 flex justify-center border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 py-5 shadow-sm">
           <div className="relative w-full max-w-[400px] rounded-2xl bg-slate-100/80 p-1.5 flex shadow-inner">
             {/* 3D Animated Indicator */}
             <motion.div
               animate={{
                 x: isSignIn ? "0%" : "100%",
                 rotateY: isSignIn ? [0, 20, 0] : [0, -20, 0], // 3D Flip effect
                 scale: [1, 0.9, 1] // Slight shrink during movement
               }}
               transition={{ 
                 duration: 0.6, 
                 ease: [0.22, 1, 0.36, 1] 
               }}
               style={{ transformStyle: "preserve-3d" }}
               className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-slate-200/50"
             />

             {/* Sign In Button */}
             <button
               type="button"
               onClick={() => switchMode("signin")}
               className={`relative z-10 w-1/2 flex h-10 items-center justify-center text-sm font-bold transition-colors duration-300 ${
                 isSignIn ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
               }`}
             >
               Sign In
             </button>

             {/* Sign Up Button */}
             <button
               type="button"
               onClick={() => switchMode("signup")}
               className={`relative z-10 w-1/2 flex h-10 items-center justify-center text-sm font-bold transition-colors duration-300 ${
                 !isSignIn ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
               }`}
             >
               Sign Up
             </button>
           </div>
        </div>

        {/* Form Content Area */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            
            {/* Mobile Brand (Visible only on small screens) */}
            <div className="mb-10 flex items-center gap-3 lg:hidden justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans text-2xl font-bold text-slate-800">NovaWallet</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Next-Gen Finance
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isSignIn ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <AuthHeader
                    badge="Welcome Back"
                    title="Sign in to your wallet"
                    description="Enter your details to access your secure dashboard."
                    icon={LockKeyhole}
                  />

                  <form className="mt-8 space-y-5">
                    <Field id="signin-email" label="Email Address" placeholder="hello@example.com" type="text" icon={Mail} />
                    <Field
                      id="signin-password"
                      label="Password"
                      placeholder="••••••••"
                      type="password"
                      icon={KeyRound}
                      helper={
                        <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                          Forgot password?
                        </Link>
                      }
                    />
                    <AuthButton label="Sign In to Wallet" icon={ArrowRight} />
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <AuthHeader
                    badge="Create Account"
                    title="Join NovaWallet"
                    description="Set up your secure digital wallet in minutes."
                    icon={Sparkles}
                  />

                  <form className="mt-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field id="firstName" label="First Name" placeholder="John" type="text" icon={UserRound} />
                      <Field id="lastName" label="Last Name" placeholder="Doe" type="text" icon={UserRound} />
                    </div>
                    <Field id="signup-email" label="Email Address" placeholder="hello@example.com" type="email" icon={Mail} />
                    <Field id="signup-phone" label="Phone Number" placeholder="+880 1XXX-XXXXXX" type="tel" icon={Phone} />
                    <Field id="signup-password" label="Password" placeholder="Create a strong password" type="password" icon={KeyRound} />
                    
                    <AuthButton label="Create Account" icon={CreditCard} />
                    
                    <p className="mt-4 text-center text-[11px] text-slate-500">
                      By signing up, you agree to our{" "}
                      <Link href="#" className="font-semibold text-blue-600 hover:underline">Terms of Service</Link> and{" "}
                      <Link href="#" className="font-semibold text-blue-600 hover:underline">Privacy Policy</Link>.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>
      </section>
    </div>
  );
}

/* =============================================================
   REUSABLE COMPONENTS
============================================================= */

function AuthHeader({ badge, title, description, icon: Icon }: any) {
  return (
    <div className="text-center lg:text-left">
      <div className="inline-flex items-center justify-center lg:justify-start gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
        <Icon className="h-3.5 w-3.5" />
        {badge}
      </div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ id, label, placeholder, type, icon: Icon, helper }: any) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-bold text-slate-700">{label}</label>
        {helper}
      </div>
      <div className="relative group">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="peer h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pl-11 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
        />
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-500 group-hover:text-blue-400" />
      </div>
    </div>
  );
}

function AuthButton({ label, icon: Icon }: any) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-600/40"
    >
      {label}
      {Icon && <Icon className="h-4 w-4" />}
    </motion.button>
  );
}