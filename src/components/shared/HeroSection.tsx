"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";

const MotionLink = motion(Link);

const trustBadges = [
  { icon: Lock, label: "Encrypted access", color: "text-emerald-400" },
  { icon: Eye, label: "Visible status", color: "text-cyan-300" },
  {
    icon: ShieldCheck,
    label: "Verified controls",
    color: "text-emerald-400",
  },
];

const floatingBadges = [
  {
    icon: CheckCircle2,
    top: "30%",
    left: "17%",
    color: "text-emerald-400",
    ring: "border-emerald-400/30",
    float: 3.2,
  },
  {
    icon: Shield,
    top: "44%",
    left: "9%",
    color: "text-violet-300",
    ring: "border-violet-400/30",
    float: 3.8,
  },
  {
    icon: Shield,
    top: "30%",
    left: "92%",
    color: "text-violet-300",
    ring: "border-violet-400/30",
    float: 3.5,
  },
  {
    icon: CheckCircle2,
    top: "68%",
    left: "82%",
    color: "text-emerald-400",
    ring: "border-emerald-400/30",
    float: 4.1,
  },
];

const driftDots = [
  { top: "16%", left: "27%" },
  { top: "67%", left: "24%" },
  { top: "82%", left: "72%" },
  { top: "55%", left: "86%" },
  { top: "37%", left: "88%" },
];

const connectorPaths = [
  "M 17 30 Q 35 20 49 42",
  "M 9 44 Q 28 46 49 45",
  "M 92 30 Q 68 22 51 42",
  "M 82 68 Q 65 55 51 46",
];

const entranceEase = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: entranceEase,
    },
  },
};

function CofferLogo() {
  return (
    <Link
      href="/"
      aria-label="Coffer home"
      className="group inline-flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-violet-400/40"
    >
      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white/15 bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-900 shadow-[0_14px_35px_rgba(109,40,217,.35)] transition duration-300 group-hover:-translate-y-0.5 group-hover:rotate-2 group-hover:shadow-[0_18px_45px_rgba(109,40,217,.48)] sm:h-16 sm:w-16 sm:rounded-[21px]">
        <span
          aria-hidden="true"
          className="absolute inset-[1px] rounded-[17px] bg-gradient-to-br from-white/15 to-transparent sm:rounded-[20px]"
        />

        <svg
          viewBox="0 0 48 48"
          className="relative h-10 w-10 sm:h-11 sm:w-11"
          fill="none"
          aria-hidden="true"
        >
          {/* The open curve creates the Coffer 'C'. */}
          <path
            d="M33.25 14.7A14 14 0 1 0 33.25 33.3"
            stroke="white"
            strokeWidth="4.6"
            strokeLinecap="round"
          />

          {/* Keyhole communicates secure wallet access. */}
          <circle cx="28.8" cy="22.2" r="2.8" fill="#6ee7b7" />
          <path
            d="M28.8 24.7V29"
            stroke="#6ee7b7"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          <path
            d="M36 18.5V29.5"
            stroke="rgba(255,255,255,.34)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,.12)]" />
      </span>

      <span className="text-left">
        <span className="block text-3xl font-black leading-none tracking-[-0.055em] text-white sm:text-4xl">
          Coffer
        </span>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.24em] text-violet-200/55 sm:text-[10px]">
          Digital wallet
        </span>
      </span>
    </Link>
  );
}

export default function HeroSection() {
  return (
    <section
      aria-label="Coffer hero"
      className="relative isolate left-1/2 -mt-4 w-screen -translate-x-1/2 overflow-hidden bg-[#0b0720] px-6 py-20 sm:-mt-6 sm:py-24 md:py-28 lg:-mt-8"
    >
      {/* Dotted grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Violet glow behind the headline */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#140b34]/70 via-transparent to-[#0b0720]" />

      {/* Security scan sweep */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-emerald-400/[0.06] to-transparent"
        initial={{ top: "-15%" }}
        animate={{ top: ["-15%", "115%"] }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2.5,
        }}
      />

      {/* Encrypted connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {connectorPaths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="rgba(167,139,250,0.35)"
            strokeWidth={1}
            strokeDasharray="6 9"
            vectorEffect="non-scaling-stroke"
            animate={{ strokeDashoffset: [0, -30] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.1,
            }}
          />
        ))}
      </svg>

      {driftDots.map((dot, index) => (
        <motion.span
          key={`${dot.top}-${dot.left}`}
          className="pointer-events-none absolute hidden h-1.5 w-1.5 rounded-full bg-violet-300/50 sm:block"
          style={{ top: dot.top, left: dot.left }}
          animate={{ opacity: [0.25, 0.8, 0.25], scale: [1, 1.35, 1] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.35,
          }}
        />
      ))}

      {floatingBadges.map((badge, index) => {
        const Icon = badge.icon;

        return (
          <motion.div
            key={`${badge.top}-${badge.left}`}
            className={`pointer-events-none absolute hidden h-10 w-10 items-center justify-center rounded-full border ${badge.ring} bg-[#0d0a24] shadow-[0_0_20px_rgba(139,92,246,0.2)] sm:flex`}
            style={{ top: badge.top, left: badge.left }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: badge.float,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
          >
            <Icon
              className={`h-4 w-4 ${badge.color}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </motion.div>
        );
      })}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        {/* New Coffer logo replaces the plain text heading. */}
        <motion.div variants={itemVariants}>
          <CofferLogo />
        </motion.div>

        <motion.div variants={itemVariants} className="relative mt-8 h-16 w-16">
          <motion.span
            className="absolute inset-0 rounded-full border border-emerald-400/40"
            animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />

          <motion.span
            className="absolute inset-0 rounded-full border border-emerald-400/40"
            animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: 1.2,
            }}
          />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-[#0d0a24] shadow-[0_0_30px_rgba(52,211,153,0.25)]">
            <Shield
              className="h-7 w-7 text-emerald-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-4 text-sm font-medium text-violet-200/80 sm:text-base"
        >
          Security-First Digital Wallet
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="mt-6 text-5xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl"
        >
          <span>Move </span>
          <span className="font-serif font-normal italic">Money</span>
          <span> With</span>
          <br />
          <span className="font-serif font-normal italic">Confidence</span>
          <span> &amp; </span>
          <span className="font-serif font-normal italic">Control</span>
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 backdrop-blur-sm"
        >
          {trustBadges.map((item, index) => {
            const Icon = item.icon;

            return (
              <span key={item.label} className="flex items-center gap-2">
                {index !== 0 && <span className="text-white/20">•</span>}

                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: index * 0.4,
                  }}
                  className="flex"
                >
                  <Icon
                    className={`h-4 w-4 ${item.color}`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </motion.span>

                <span className="text-sm text-white/90">{item.label}</span>
              </span>
            );
          })}
        </motion.div>

        <MotionLink
          href="#open-wallet"
          variants={itemVariants}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-violet-500 to-violet-700 px-8 py-4 text-base font-semibold text-white shadow-[0_0_45px_rgba(139,92,246,0.55)] ring-1 ring-violet-400/40"
        >
          Open a Wallet
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </MotionLink>
      </motion.div>
    </section>
  );
}
