"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroBanner() {
  return (
    <section className="bg-[#F1F3ED] w-[90%] mx-auto rounded-b-[2rem] px-6 lg:px-12 py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Value Proposition & CTAs */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6 text-center lg:text-left"
        >
          <span className="inline-block bg-[#1F5EA8]/10 text-[#1F5EA8] text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide">
            ✨ Modern Digital Wallet Solution
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1A202C] leading-tight">
            Seamless Payments & Wallet Management.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
            Transfer money instantly, manage balances across accounts, and track your activity in real-time with enterprise-grade security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/open-wallet"
                className="btn bg-[#1F5EA8] hover:bg-[#184880] text-white border-none rounded-lg px-8 min-h-0 h-12 text-sm font-medium tracking-wide transition-colors w-full sm:w-auto"
              >
                Open Free Wallet
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/security"
                className="btn bg-transparent border-[#1A202C] text-[#1A202C] hover:bg-[#1A202C] hover:text-white rounded-lg px-8 min-h-0 h-12 text-sm font-medium tracking-wide transition-colors w-full sm:w-auto"
              >
                Learn More
              </Link>
            </motion.div>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 border-t border-gray-300/60 flex items-center justify-center lg:justify-start gap-8 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">🔒 Bank-grade Encryption</span>
            <span className="flex items-center gap-1.5">⚡ Instant Settlements</span>
          </div>
        </motion.div>

        {/* Right Column: Live Interactive Preview Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative flex justify-center"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">
            
            {/* Main Digital Card */}
            <div className="bg-gradient-to-r from-[#1F5EA8] to-[#143D6E] text-white p-6 rounded-2xl shadow-md space-y-6">
              <div className="flex justify-between items-center text-xs opacity-80 font-medium">
                <span>Coffer Primary Card</span>
                <span>Virtual Visa</span>
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium">Total Balance</p>
                <p className="text-3xl font-bold font-mono tracking-tight">$14,250.00</p>
              </div>
              <div className="flex justify-between items-end text-xs font-mono tracking-widest pt-2 border-t border-white/20 opacity-90">
                <span>•••• •••• •••• 8842</span>
                <span>08/28</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-medium text-gray-700">
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex flex-col items-center gap-1">
                <span className="text-base">↗️</span>
                Send
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex flex-col items-center gap-1">
                <span className="text-base">↙️</span>
                Request
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex flex-col items-center gap-1">
                <span className="text-base">➕</span>
                Top Up
              </button>
            </div>

            {/* Recent Mini Transaction Feed */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</p>
              <div className="flex justify-between items-center text-sm py-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    ↓
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-xs">Received from Sarah</p>
                    <p className="text-[10px] text-gray-400">Today, 2:15 PM</p>
                  </div>
                </div>
                <span className="font-semibold text-xs text-emerald-600">+$250.00</span>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}