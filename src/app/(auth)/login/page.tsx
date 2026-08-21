"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  UserRound,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  WalletCards,
  Eye,
  EyeOff
} from "lucide-react";

type AuthMode = "signin" | "signup";

export default function EnhancedAuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isDesktop, setIsDesktop] = useState(true);
  
  const isSignIn = mode === "signin";

  // Handle responsive layout detection to prevent SSR hydration mismatch
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3D Transition Settings - FIXED: Added 'as const' to the ease array
  const springTransition: Transition = { 
    duration: 0.9, 
    ease: [0.16, 1, 0.3, 1] as const 
  };

  return (
    <div 
      className="relative w-full min-h-screen flex flex-col lg:block overflow-hidden bg-white" 
      style={{ perspective: "1500px" }} // Enables the 3D space
    >
      {/* =====================================================
          BRANDING PANEL (Animated Blue Section)
      ====================================================== */}
      <motion.div
        className="relative lg:absolute lg:top-0 lg:left-0 w-full lg:w-1/2 min-h-[500px] lg:h-full z-20 flex flex-col justify-between overflow-hidden bg-[#020617] lg:shadow-2xl"
        style={{ transformStyle: "preserve-3d" }}
        animate={
          isDesktop
            ? {
                x: isSignIn ? "100%" : "0%",
                rotateY: isSignIn ? [0, -8, 0] : [0, 8, 0],
                scale: [1, 0.96, 1],
              }
            : { x: "0%", rotateY: 0, scale: 1 }
        }
        transition={springTransition}
      >
        {/* Animated Gradients & Textures */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay z-0" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/30 blur-[120px] z-0 pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/20 blur-[130px] z-0 pointer-events-none" />

        {/* Floating Abstract 3D Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Faux Glass Card 1 */}
          <motion.div
            animate={{ y: [-15, 15, -15], rotateZ: [0, -3, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[-5%] w-64 h-40 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl p-5"
          >
            <div className="w-12 h-8 rounded bg-white/20 mb-6" />
            <div className="w-3/4 h-3 rounded bg-white/20 mb-3" />
            <div className="w-1/2 h-3 rounded bg-white/10" />
          </motion.div>

          {/* Glowing Ring */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] left-[10%] w-32 h-32 rounded-full border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          />
        </div>

        {/* Brand Content */}
        <div className="relative z-10 flex flex-col h-full p-10 lg:p-16 justify-between">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans text-2xl font-bold tracking-tight text-white">NovaWallet</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Next-Gen Finance</p>
              </div>
            </Link>
          </motion.div>

          <div className="my-auto mt-16 lg:mt-auto relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 mb-8 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">The Future of Banking</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] text-white">
              Control your money, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cyan-400 backdrop-blur-sm">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-blue-100/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* =====================================================
          AUTHENTICATION PANEL (White Form Section)
      ====================================================== */}
      <motion.div
        className="relative w-full lg:absolute lg:top-0 lg:left-0 lg:w-1/2 min-h-screen lg:h-full z-10 flex flex-col bg-white"
        style={{ transformStyle: "preserve-3d" }}
        animate={
          isDesktop
            ? {
                x: isSignIn ? "0%" : "100%",
                rotateY: isSignIn ? [0, 10, 0] : [0, -10, 0],
                scale: [1, 0.96, 1],
              }
            : { x: "0%", rotateY: 0, scale: 1 }
        }
        transition={springTransition}
      >
        {/* Subtle Grid Texture */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
          
          {/* Animated Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="relative flex p-1 bg-slate-100/80 backdrop-blur-md rounded-full w-full max-w-[280px] border border-slate-200 shadow-inner">
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm border border-slate-200/50"
                initial={false}
                animate={{ left: isSignIn ? "4px" : "calc(50%)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setMode("signin")}
                className={`relative z-10 w-1/2 py-2.5 text-sm font-bold transition-colors ${isSignIn ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`relative z-10 w-1/2 py-2.5 text-sm font-bold transition-colors ${!isSignIn ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form Area with AnimatePresence for smooth swapping */}
          <div className="w-full max-w-[400px] mx-auto">
            <AnimatePresence mode="wait">
              {isSignIn ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                    <p className="mt-2 text-sm text-slate-500">Enter your credentials to access your account.</p>
                  </div>

                  <form className="space-y-5">
                    <InputField id="email" label="Email Address" type="email" placeholder="hello@example.com" icon={Mail} />
                    <InputField 
                      id="password" 
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
                    <SubmitButton label="Sign In to Dashboard" />
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create an account</h2>
                    <p className="mt-2 text-sm text-slate-500">Join NovaWallet and take control of your finances.</p>
                  </div>

                  <form className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField id="firstName" label="First Name" placeholder="John" icon={UserRound} />
                      <InputField id="lastName" label="Last Name" placeholder="Doe" icon={UserRound} />
                    </div>
                    <InputField id="email" label="Email Address" type="email" placeholder="hello@example.com" icon={Mail} />
                    <InputField id="password" label="Password" type="password" placeholder="Create a secure password" icon={KeyRound} />
                    <SubmitButton label="Create Account" />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Social Auth Separator */}
            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-200"></div>
              <span className="relative bg-white px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Or continue with</span>
            </div>

            {/* Social Auth Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <SocialButton label="Google" />
              <SocialButton label="Apple" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* =====================================================
    REUSABLE FORM COMPONENTS
====================================================== */

function InputField({ id, label, type = "text", placeholder, icon: Icon, helper }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}</label>
        {helper}
      </div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
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

function SubmitButton({ label }: { label: string }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}

function SocialButton({ label }: { label: string }) {
  return (
    <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-sm">
      {/* Placeholder for SVG icon */}
      <div className="h-4 w-4 bg-slate-200 rounded-full" />
      {label}
    </button>
  );
}