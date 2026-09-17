"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Security", href: "/#security" },
      { label: "Open wallet", href: "/register" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease,
    },
  },
};

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#0b0718] px-5 pb-28 pt-16 text-white sm:px-8 sm:pt-20 lg:px-12 lg:pb-32 lg:pt-24">
      {/* Minimal background detail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(167,139,250,.55)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-0 h-[460px] w-[460px] rounded-full bg-violet-600/10 blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[360px] w-[360px] rounded-full bg-fuchsia-500/[0.06] blur-[120px]"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative mx-auto max-w-7xl"
      >
        {/* Brand and navigation */}
        <div className="grid gap-14 border-b border-white/10 pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:pb-16">
          <motion.div variants={itemVariants} className="max-w-md">
            <Link
              href="/"
              aria-label="Coffer home"
              className="group inline-flex items-center gap-3 outline-none focus-visible:ring-4 focus-visible:ring-violet-400/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200 transition duration-300 group-hover:border-violet-300/40 group-hover:bg-violet-400/20">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="text-2xl font-black tracking-[-0.05em]">
                Coffer
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/50 sm:text-base">
              A focused digital wallet for managing transfers, transaction
              status, verification, and account activity in one place.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-white/60">
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-300"
                  aria-hidden="true"
                />
                Verification-aware
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-white/60">
                <LockKeyhole
                  className="h-3.5 w-3.5 text-violet-300"
                  aria-hidden="true"
                />
                Protected access
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:justify-self-end lg:gap-x-16 xl:gap-x-24">
            {groups.map((group) => (
              <motion.div key={group.title} variants={itemVariants}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 sm:text-xs">
                  {group.title}
                </h3>

                <ul className="mt-5 space-y-3.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group/link inline-flex items-center gap-1.5 text-sm text-white/48 outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-violet-400/50"
                      >
                        {link.label}

                        <ArrowUpRight
                          className="h-3.5 w-3.5 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compact CTA */}
        <motion.div
          variants={itemVariants}
          className="my-8 flex flex-col items-start justify-between gap-5 rounded-[24px] border border-violet-300/15 bg-gradient-to-r from-violet-500/[0.12] via-white/[0.04] to-transparent px-5 py-5 sm:flex-row sm:items-center sm:px-6"
        >
          <div>
            <p className="text-base font-black tracking-[-0.02em] sm:text-lg">
              Ready to manage your wallet?
            </p>
            <p className="mt-1 text-xs leading-5 text-white/45 sm:text-sm">
              Create an account or sign in to continue.
            </p>
          </div>

          <Link
            href="/register"
            className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-black text-white shadow-[0_10px_30px_rgba(124,58,237,.28)] outline-none transition duration-300 hover:bg-violet-500 focus-visible:ring-4 focus-visible:ring-violet-400/40"
          >
            Open a wallet
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {new Date().getFullYear()} Coffer. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              Privacy
            </Link>

            <Link
              href="/contact"
              className="transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              Contact
            </Link>

            <span>Coffer digital wallet</span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
