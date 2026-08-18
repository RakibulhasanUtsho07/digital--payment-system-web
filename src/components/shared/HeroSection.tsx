"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Fingerprint,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

interface HeroBannerProps {
  isAuthenticated?: boolean;
}

export default function HeroBanner({
  isAuthenticated = false,
}: HeroBannerProps) {
  return (
    <section className="relative mx-auto w-[90%] overflow-hidden rounded-3xl bg-[#F1F3ED] py-10 lg:py-16">
      {/* Background decorations */}
      <div className="pointer-events-none absolute left-[-180px] top-[120px] h-[420px] w-[420px] rounded-full bg-[#1F5EA8]/[0.055] blur-3xl" />
      <div className="pointer-events-none absolute right-[-180px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[#4EA3E3]/[0.06] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* =====================================================
              LEFT CONTENT
          ===================================================== */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col justify-center text-center lg:text-left"
          >
            {/* Badge */}
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#1F5EA8]/10 bg-white px-4 py-2 shadow-sm mx-auto lg:mx-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1F5EA8]/10 text-[#1F5EA8]">
                <Sparkles className="h-3 w-3" />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F5EA8]">
                Digital Wallet System
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#162A43] sm:text-5xl lg:text-6xl">
              Your money,
              <span className="block text-[#1F5EA8]">
                smarter & safer.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-base text-[#63748A] sm:text-lg max-w-xl mx-auto lg:mx-0">
              A modern digital wallet for secure payments, instant transfers,
              KYC verification, transaction tracking, and intelligent
              financial insights.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/open-wallet"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] px-7 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,94,168,0.22)] transition-all hover:bg-[#184A83] sm:w-auto"
                >
                  Open Free Wallet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/security"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD7E5] bg-white px-7 text-sm font-semibold text-[#162A43] transition-all hover:border-[#1F5EA8] hover:bg-[#F8FBFF] sm:w-auto"
                >
                  Explore Security
                  <ShieldCheck className="h-4 w-4 text-[#1F5EA8]" />
                </Link>
              </motion.div>
            </div>

            {/* Trust Highlights */}
            <div className="mt-9 grid grid-cols-1 gap-4 border-t border-[#DDE5EE] pt-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#DDE5EE]">
              <TrustItem
                icon={ShieldCheck}
                text="Secure Payments"
              />
              <TrustItem
                icon={Fingerprint}
                text="KYC Protected"
              />
              <TrustItem
                icon={TrendingUp}
                text="Smart Insights"
              />
            </div>
          </motion.div>

          {/* =====================================================
              RIGHT PREVIEW
          ===================================================== */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Soft glow */}
              <div className="absolute inset-8 rounded-[3rem] bg-[#1F5EA8]/10 blur-3xl" />

              {/* Product Preview */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative overflow-hidden rounded-[30px] border border-white bg-white p-5 shadow-[0_30px_90px_rgba(30,66,102,0.12)]"
              >
                {/* Preview Header */}
                <div className="mb-4 flex items-center justify-between px-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8291A5]">
                        Product Preview
                      </p>

                      {!isAuthenticated && (
                        <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#1F5EA8]">
                          Demo
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-[#162A43]">
                      Digital Wallet
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F6FB] text-[#1F5EA8]">
                    <WalletCards className="h-5 w-5" />
                  </div>
                </div>

                {/* Balance Card */}
                <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#2468B1] via-[#1F5EA8] to-[#143D6E] p-6 text-white">
                  <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/10" />
                  <div className="absolute right-5 bottom-[-70px] h-48 w-48 rounded-full border border-white/10" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-100/70">
                        Available Balance
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[8px] font-semibold text-blue-50">
                        Preview
                      </span>
                    </div>

                    <p className="mt-5 text-[2rem] font-bold tracking-tight">
                      ৳25,450.00
                    </p>

                    <p className="mt-1 text-[10px] text-blue-100/70">
                      Example wallet balance
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[9px] text-blue-100/60">
                        Wallet ID • DEMO-8392
                      </span>

                      <CreditCard className="h-6 w-6 text-white/70" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8291A5]">
                      Quick Actions
                    </p>

                    <span className="text-[9px] text-[#9AA7B7]">
                      Preview
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <PreviewAction
                      icon={ArrowUpRight}
                      title="Send"
                      subtitle="Transfer"
                      iconClass="bg-[#EAF3FE] text-[#1F5EA8]"
                    />

                    <PreviewAction
                      icon={ArrowDownLeft}
                      title="Receive"
                      subtitle="Get money"
                      iconClass="bg-[#ECFBF4] text-emerald-600"
                    />

                    <PreviewAction
                      icon={TrendingUp}
                      title="Insights"
                      subtitle="Analytics"
                      iconClass="bg-[#F3EEFF] text-violet-600"
                    />
                  </div>
                </div>

                {/* Activity */}
                <div className="mt-5 rounded-[18px] border border-[#E3EAF2] bg-[#F9FBFD] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8291A5]">
                        Recent Activity
                      </p>

                      <p className="mt-1 text-[9px] text-[#9AA7B7]">
                        Sample transactions
                      </p>
                    </div>

                    <span className="text-[9px] font-semibold text-[#1F5EA8]">
                      Preview
                    </span>
                  </div>

                  <PreviewTransaction
                    icon={ArrowDownLeft}
                    title="Received from Abib"
                    time="Sample • 2:15 PM"
                    amount="+৳1,200"
                    positive
                  />

                  <div className="my-3 h-px bg-[#E4EAF1]" />

                  <PreviewTransaction
                    icon={ArrowUpRight}
                    title="Sent to Salauddin"
                    time="Sample • 6:40 PM"
                    amount="-৳500"
                  />
                </div>

                {/* Security */}
                <div className="mt-4 flex items-center justify-between rounded-[18px] border border-[#DCEAF7] bg-[#F3F8FD] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
                      <ScanFace className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8291A5]">
                        Security Preview
                      </p>

                      <p className="text-xs font-semibold text-[#405169]">
                        KYC & secure payments ready
                      </p>
                    </div>
                  </div>

                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </motion.div>

              {/* Floating AI badge */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -right-3 top-24 hidden items-center gap-2 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-xl sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#96A3B2]">
                    AI
                  </p>

                  <p className="text-[10px] font-bold text-[#405169]">
                    Smart Insights
                  </p>
                </div>
              </motion.div>

              {/* Floating security badge */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <LockKeyhole className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#96A3B2]">
                    Protected
                  </p>

                  <p className="text-[10px] font-bold text-[#405169]">
                    Secure Payments
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 text-[11px] font-medium text-[#718095]">
      <Icon className="h-4 w-4 text-[#1F5EA8]" />
      <span>{text}</span>
    </div>
  );
}

function PreviewAction({
  icon: Icon,
  title,
  subtitle,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconClass: string;
}) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-[#E2E9F1] bg-[#FAFCFE] p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
    >
      <span
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="block text-xs font-semibold text-[#405169]">
        {title}
      </span>

      <span className="mt-0.5 block text-[9px] text-[#91A0B2]">
        {subtitle}
      </span>
    </button>
  );
}

function PreviewTransaction({
  icon: Icon,
  title,
  time,
  amount,
  positive = false,
}: {
  icon: React.ElementType;
  title: string;
  time: string;
  amount: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-[#1F5EA8]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#405169]">
            {title}
          </p>

          <p className="mt-0.5 text-[9px] text-[#9AA7B7]">
            {time}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`text-[11px] font-bold ${
            positive ? "text-emerald-600" : "text-[#405169]"
          }`}
        >
          {amount}
        </p>

        <p className="mt-0.5 text-[8px] font-medium text-[#9AA7B7]">
          Sample
        </p>
      </div>
    </div>
  );
}