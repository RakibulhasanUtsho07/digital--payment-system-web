"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  LifeBuoy,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0718] text-white flex flex-col items-center justify-center px-4 py-12">
      {/* =====================================================
          BACKGROUND & GLOWS (COFFER SECURITY THEME)
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="
            absolute inset-0 opacity-15
            [background-image:linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)]
            [background-size:40px_40px]
          "
        />

        {/* Central Ambient Glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute left-1/3 top-1/3 h-[350px] w-[350px] rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      {/* =====================================================
          MAIN CONTENT CONTAINER
      ===================================================== */}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        
        {/* Top Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-purple-300 shadow-lg backdrop-blur-xl">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Coffer Security System · 404 Error</span>
        </div>

        {/* =================================================
            CENTRAL SECURITY ANIMATION & 404 GRAPHIC
        ================================================== */}
        <div className="relative mx-auto mb-10 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
          {/* Outer Rotating Security Ring */}
          <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[spin_15s_linear_infinite]" />
          
          {/* Inner Counter-Rotating Ring */}
          <div className="absolute inset-3 rounded-full border border-cyan-500/20 border-dashed animate-[spin_10s_linear_infinite_reverse]" />

          {/* Glowing Center Core with Shield & 404 */}
          <div
            className="
              relative flex flex-col items-center justify-center
              h-36 w-36 sm:h-44 sm:w-44
              rounded-full
              bg-gradient-to-br from-purple-600/30 via-[#120F26] to-cyan-600/30
              border border-white/15
              shadow-[0_0_50px_rgba(168,85,247,0.25)]
              backdrop-blur-xl
              animate-[float_4s_ease-in-out_infinite]
            "
          >
            <ShieldCheck className="h-8 w-8 text-cyan-400 mb-1 animate-pulse" />
            <span className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              404
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
              Encrypted Void
            </span>
          </div>
        </div>

        {/* =================================================
            TEXT & DESCRIPTION
        ================================================== */}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-4">
          Oops! This page{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            disappeared.
          </span>
        </h1>

        <p className="mx-auto max-w-lg text-sm sm:text-base leading-relaxed text-slate-400 mb-8">
          The route you are trying to access doesn&apos;t exist or has been secured and moved to another directory.
        </p>

        {/* =================================================
            STATUS BOX (FULL WIDTH)
        ================================================== */}
        <div className="mb-8 flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-left shadow-inner backdrop-blur-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            <Lock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Security Protocol
            </p>
            <p className="truncate text-sm font-medium text-white">
              Unauthorized Route · Status Code 404
            </p>
          </div>
        </div>

        {/* =================================================
            REFINED ACTION BUTTONS
        ================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {/* Home Button */}
          <Link
            href="/"
            className="
              group flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2
              rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
              px-6 font-semibold text-white shadow-lg shadow-purple-900/40
              transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-purple-700/60
              border border-purple-400/20
            "
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {/* Go Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="
              flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2
              rounded-xl border border-white/15 bg-white/5
              px-6 font-medium text-slate-200 transition-all duration-300
              hover:-translate-y-0.5 hover:bg-white/10 hover:text-white
            "
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>Go Back</span>
          </button>

          {/* Support Button */}
          <Link
            href="/contact"
            className="
              flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2
              rounded-xl border border-transparent bg-transparent
              px-6 font-medium text-slate-300 transition-all duration-300
              hover:-translate-y-0.5 hover:bg-white/5 hover:text-white
            "
          >
            <LifeBuoy className="h-4 w-4 text-cyan-400" />
            <span>Support</span>
          </Link>
        </div>

        {/* Footer Support Text */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500">
            Need assistance? <Link href="/contact" className="text-purple-400 hover:underline">Contact our support team</Link>
          </p>
        </div>

      </div>

      {/* =====================================================
          CUSTOM ANIMATIONS STYLE
      ===================================================== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `,
        }}
      />
    </main>
  );
}