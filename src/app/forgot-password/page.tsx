"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim()) return;

    // TODO:
    // Connect this to your Express backend
    // when the reset-password endpoint is ready.

    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_80px_rgba(23,54,93,0.10)] lg:grid-cols-2">

          {/* Left */}
          <section className="relative hidden overflow-hidden bg-[#123B66] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#4EA3E3]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-[-60px] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#9DDCFF]">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-serif text-xl font-bold">
                    Wallet
                  </p>

                  <p className="text-[8px] uppercase tracking-[0.18em] text-blue-100/50">
                    Digital Wallet System
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-lg">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9DDCFF]">
                  Account Recovery
                </p>

                <h1 className="mt-4 font-serif text-4xl font-bold leading-tight xl:text-5xl">
                  Get back into your
                  <span className="block text-[#9DDCFF]">
                    wallet securely.
                  </span>
                </h1>

                <p className="mt-6 text-sm leading-7 text-blue-100/70">
                  Recover your account using a secure password reset flow
                  designed to keep your wallet and financial information
                  protected.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 text-[9px] text-blue-100/45">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Secure account recovery
            </div>
          </section>

          {/* Right */}
          <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-[430px]">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F5EA8] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
                  <Mail className="h-3 w-3" />
                  Password Recovery
                </span>

                <h2 className="mt-5 font-serif text-3xl font-bold text-[#162A43] sm:text-4xl">
                  Forgot your password?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#718095]">
                  Enter the email address connected to your wallet account.
                </p>
              </motion.div>

              {!submitted ? (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-semibold text-[#405169]"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="you@example.com"
                        required
                        className="h-12 w-full rounded-xl border border-[#DCE4ED] bg-[#FBFCFE] px-4 pr-11 text-sm text-[#162A43] outline-none placeholder:text-[#A5B0BE] transition focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-[#1F5EA8]/10"
                      />

                      <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5B0BE]" />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,94,168,0.18)] transition hover:bg-[#184880]"
                  >
                    Send Reset Link
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        Reset request created
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                        If this email belongs to an account, the password
                        recovery instructions will be sent there.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#DCEAF7] bg-[#F5F9FD] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <p className="text-[10px] leading-5 text-[#8190A3]">
                  Your wallet credentials remain protected throughout the
                  account recovery process.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}