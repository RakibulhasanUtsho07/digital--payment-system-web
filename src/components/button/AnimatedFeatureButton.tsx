"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AnimatedFeatureButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative inline-block z-50 overflow-visible"
    >
      <Link href="/open-wallet">
        {/* Main Premium Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center justify-between gap-3 h-11 px-6 rounded-xl bg-gradient-to-r from-[#1F5EA8] via-[#1A5296] to-[#123B6D] text-white font-medium text-sm tracking-wide shadow-[0_8px_20px_rgba(31,94,168,0.25)] hover:shadow-[0_12px_28px_rgba(31,94,168,0.4)] border border-white/20 transition-all duration-300 cursor-pointer"
        >
          <span>Open a wallet</span>

          {/* Rotating Arrow Icon */}
          <motion.div
            animate={{
              x: isHovered ? 2 : 0,
              y: isHovered ? -2 : 0,
              rotate: isHovered ? 45 : 0,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center border border-white/20 shrink-0"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </motion.div>
        </motion.button>
      </Link>

      {/* Floating Dropdown Card */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2.5 w-64 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.12)] space-y-2.5 z-50 pointer-events-none"
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
              What You Get
            </p>

            {/* Feature Item 1 */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-3 p-2 rounded-xl bg-amber-50/70 border border-amber-100/80"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Instant Setup</p>
                <p className="text-[10px] text-gray-500">
                  Ready in less than 2 minutes
                </p>
              </div>
            </motion.div>

            {/* Feature Item 2 */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100/80"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Bank-Grade Protection
                </p>
                <p className="text-[10px] text-gray-500">
                  256-bit encrypted safety
                </p>
              </div>
            </motion.div>

            {/* Feature Item 3 */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 p-2 rounded-xl bg-blue-50/70 border border-blue-100/80"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1F5EA8]/15 flex items-center justify-center text-[#1F5EA8] shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Zero Monthly Fees
                </p>
                <p className="text-[10px] text-gray-500">
                  No hidden charges ever
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}