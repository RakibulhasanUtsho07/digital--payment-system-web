// src/app/(auth)/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";

type AuthMode = "signin" | "signup";

// `as const` on the ease tuple keeps its literal type instead of widening to
// `number[]`, which is what breaks `next build`'s type check even though
// `next dev` won't catch it (see the framer-motion Easing type).
const springTransition: Transition = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const isSignIn = mode === "signin";

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F4F7FB] p-4 lg:p-8">
      {/* =========================================================
          TOP EXTERNAL PREMIUM TOGGLE — sits above the card, not
          inside either panel. This is the pill circled in the
          screenshot: it floats above the boundary between the two
          panels and stays in the same spot for both layouts, so it
          never has to jump around when the panels swap under it.
      ========================================================== */}
      <div className="relative z-20 mb-8 flex h-14 w-full max-w-[340px] items-center rounded-full border border-slate-200/60 bg-white/50 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full border border-slate-100 bg-white shadow-[0_2px_15px_rgba(14,165,233,0.15)]"
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
          MAIN AUTH CARD CONTAINER
      ========================================================== */}
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_80px_rgba(2,6,23,0.08)] min-h-[760px] lg:flex-row">
        {/* --- MOBILE VIEW (Standard Stack) --- */}
        <div className="relative z-10 flex w-full flex-col bg-white px-6 py-10 lg:hidden">
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

        {/* --- DESKTOP VIEW (3D panel swap) ---
            `perspective` AND `transformStyle: preserve-3d` both live on
            this exact element. That matters: perspective only creates a
            3D viewing context for its *direct* children. The rotating
            panels below are one level further down (through this div),
            so without `preserve-3d` on this intermediate element, its
            default `transform-style: flat` would collapse the 3D space
            before it ever reaches the panels — the rotateY tilt would
            still run, but it'd read as a flat horizontal squish instead
            of genuine depth. */}
        <div
          className="relative hidden h-full min-h-[760px] w-full lg:block"
          style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
        >
          {/* FORM PANEL (45% width) */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "122.222%",
              rotateY: isSignIn ? [0, 8, 0] : [0, -8, 0],
              scale: [1, 0.95, 1],
              zIndex: isSignIn ? 20 : 10,
              boxShadow: isSignIn ? "25px 0 60px rgba(0,0,0,0.05)" : "-25px 0 60px rgba(0,0,0,0.05)",
            }}
            transition={springTransition}
            style={{ transformStyle: "preserve-3d" }}
            className="absolute left-0 top-0 h-full w-[45%] rounded-[2.5rem] bg-white"
          >
            {/* Subtle grid texture */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
              style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "24px 24px" }}
            />

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

          {/* INFO PANEL (55% width) */}
          <motion.div
            initial={false}
            animate={{
              x: isSignIn ? "0%" : "-81.818%",
              rotateY: isSignIn ? [0, -8, 0] : [0, 8, 0],
              scale: [1, 0.95, 1],
              zIndex: isSignIn ? 10 : 20,
            }}
            transition={springTransition}
            style={{ transformStyle: "preserve-3d" }}
            className="absolute right-0 top-0 h-full w-[55%] overflow-hidden rounded-[2.5rem] bg-[#020617]"
          >
            <InfoContent />
          </motion.div>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   FORM SUB-COMPONENTS
============================================================= */

function SignInContent({ setMode }: { setMode: (mode: AuthMode) => void }) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Without this, the browser does a native form submission: full page
    // reload, all component state lost, and — since there's no `action`
    // set — it resubmits as a GET to the current URL, which puts the
    // password in the address bar/history/server logs in plain text.
    e.preventDefault();
    // TODO: call your real sign-in API / server action here.
  };

  return (
    <>
      <AuthHeader
        badge="Welcome Back"
        title="Sign in to your wallet"
        description="Enter your details to access your secure dashboard."
        icon={ShieldCheck}
      />
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Field
          id="signin-email"
          label="Email Address"
          type="email"
          placeholder="hello@example.com"
          icon={Mail}
          autoComplete="email"
          required
        />
        <Field
          id="signin-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={KeyRound}
          autoComplete="current-password"
          required
          helper={
            <Link href="#" className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800">
              Forgot password?
            </Link>
          }
        />
        <div className="flex items-center justify-between pb-2">
          <label className="group flex cursor-pointer items-center gap-2">
            <div className="relative flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-slate-50 transition-colors group-hover:border-blue-500">
              <input type="checkbox" name="remember" className="peer absolute h-full w-full cursor-pointer opacity-0" />
              <ShieldCheck className="h-3 w-3 text-blue-600 opacity-0 transition-opacity peer-checked:opacity-100" />
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: call your real sign-up API / server action here.
  };

  return (
    <>
      <AuthHeader
        badge="Get Started"
        title="Create your wallet"
        description="Join NovaWallet and take control of your finances."
        icon={Sparkles}
      />
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="signup-first-name" label="First Name" type="text" placeholder="John" icon={UserRound} autoComplete="given-name" required />
          <Field id="signup-last-name" label="Last Name" type="text" placeholder="Doe" icon={UserRound} autoComplete="family-name" required />
        </div>
        <Field id="signup-email" label="Email Address" type="email" placeholder="hello@example.com" icon={Mail} autoComplete="email" required />
        <Field id="signup-password" label="Password" type="password" placeholder="Create a secure password" icon={KeyRound} autoComplete="new-password" required />

        <AuthButton label="Create Account" />
        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          By signing up, you agree to our{" "}
          <Link href="#" className="font-semibold text-blue-600 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-semibold text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <AuthSwitchText text="Already have an account?" action="Sign in" onClick={() => setMode("signin")} />
    </>
  );
}

/* =============================================================
   BLUE INFO PANEL CONTENT
============================================================= */

function InfoContent() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between px-10 py-12 xl:px-16 xl:py-14">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-[10%] -top-[10%] z-0 h-[600px] w-[600px] rounded-full bg-blue-600/30 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-[10%] -right-[10%] z-0 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px]"
      />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ y: [-15, 15, -15], rotateZ: [0, -3, 0], rotateX: [0, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-10%] top-[25%] h-44 w-72 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-8 h-9 w-14 rounded bg-white/20" />
          <div className="mb-4 h-3 w-full rounded bg-white/20" />
          <div className="h-3 w-2/3 rounded bg-white/10" />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[10%] h-40 w-40 rounded-full border border-dashed border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.1)]"
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10">
        <Link href="/" className="group inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="font-sans text-2xl font-extrabold tracking-tight text-white">NovaWallet</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Next-Gen Finance</p>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 mb-10 max-w-[500px]"
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Sparkles className="h-4 w-4 animate-pulse text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">The Future of Banking</span>
        </div>

        <h1 className="text-[2.8rem] font-extrabold leading-[1.1] tracking-tight text-white xl:text-[3.4rem]">
          Control your money, <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            anytime, anywhere.
          </span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-blue-100/70">
          Experience seamless digital transactions with state-of-the-art security. NovaWallet makes managing
          your finances effortlessly beautiful.
        </p>

        <div className="mt-10 flex flex-col gap-5">
          {[
            { icon: ShieldCheck, text: "Bank-Grade 256-bit Encryption" },
            { icon: Zap, text: "Lightning-fast global transfers" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-4 text-sm text-blue-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/10 text-cyan-400 backdrop-blur-sm">
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
   REUSABLE UI COMPONENTS
============================================================= */

function AuthHeader({
  badge,
  title,
  description,
  icon: Icon,
}: {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
        <Icon className="h-3.5 w-3.5" /> {badge}
      </span>
      <h2 className="mt-5 font-sans text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  helper,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  icon: LucideIcon;
  helper?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="group flex flex-col space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold text-slate-700">
          {label}
        </label>
        {helper}
      </div>
      <div className="relative transition-all">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
        </div>
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-11 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-600"
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
      type="submit"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-bold text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all hover:from-blue-700 hover:to-blue-800"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </motion.button>
  );
}

function AuthSwitchText({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p className="mt-8 text-center text-sm font-medium text-slate-500">
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-bold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
      >
        {action}
      </button>
    </p>
  );
}