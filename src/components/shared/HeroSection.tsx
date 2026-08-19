"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

// ৩টি ছবির ডেটা এবং টেক্সট
const bannerSlides = [
  {
    id: 1,
    src: "/banner/banner-1.png",
    badge: "Smart Wallet",
    title: "Seamless Payments",
    description:
      "Manage your digital wallet and experience lightning-fast transactions easily.",
  },
  {
    id: 2,
    src: "/banner/banner-2.png",
    badge: "Fast & Free",
    title: "Instant Transfer",
    description:
      "Send and receive money instantly to anyone, anywhere with zero fees.",
  },
  {
    id: 3,
    src: "/banner/banner-3.jpeg",
    badge: "Highly Secured",
    title: "Secure Analytics",
    description:
      "Track your expenses and daily activity with 100% bank-grade security.",
  },
];

const SLIDE_DURATION = 4000;

// Staggered entrance for the left column's children
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const slideCount = bannerSlides.length;

  const goTo = useCallback(
    (index: number) => setCurrentIndex((index + slideCount) % slideCount),
    [slideCount],
  );
  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // অটো-স্লাইডশো — hover/focus এ পজ হয়, এবং reduced-motion থাকলে অটো-চেঞ্জ বন্ধ থাকে
  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slideCount);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
    // Restarting on currentIndex means a manual click gives the user a full
    // interval before the next auto-advance, instead of cutting it short.
  }, [currentIndex, isPaused, shouldReduceMotion, slideCount]);

  const slide = bannerSlides[currentIndex];

  return (
    <section className="relative overflow-hidden rounded-b-[2rem] bg-[#F1F3ED] py-16 lg:py-24">
      <div className="mx-auto grid w-[90%] grid-cols-1 items-center gap-12 px-4 sm:px-10 lg:grid-cols-2">
        {/* =========================================
            Left Column: Value Proposition & CTAs
        ========================================= */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="z-10 space-y-6 text-center lg:text-left"
        >
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1F5EA8]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#1F5EA8]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Modern Digital Wallet Solution
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl font-bold leading-tight text-[#1A202C] sm:text-5xl lg:text-6xl"
          >
            Seamless Payments & Wallet Management.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-xl text-base text-gray-600 sm:text-lg lg:mx-0"
          >
            Transfer money instantly, manage balances across accounts, and
            track your activity in real-time with enterprise-grade security.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:justify-start"
          >
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/open-wallet"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1F5EA8] px-8 text-sm font-medium tracking-wide text-white shadow-[0_10px_25px_rgba(31,94,168,0.22)] transition-colors hover:bg-[#184880] sm:w-auto"
              >
                Open Free Wallet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/security"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#1A202C] bg-transparent px-8 text-sm font-medium tracking-wide text-[#1A202C] transition-colors hover:bg-[#1A202C] hover:text-white sm:w-auto"
              >
                Learn More
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-8 border-t border-gray-300/60 pt-6 text-xs font-medium text-gray-500 lg:justify-start"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#1F5EA8]" />
              Bank-grade Encryption
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#1F5EA8]" />
              Instant Settlements
            </span>
          </motion.div>
        </motion.div>

        {/* =========================================
            Right Column: Animated Slideshow
        ========================================= */}
        <div className="relative mt-10 flex justify-center lg:mt-0 lg:justify-end">
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Product highlights"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            className="relative h-[400px] w-full max-w-md sm:h-[450px] lg:h-[500px] lg:max-w-lg"
          >
            {/* Background Glow */}
            <div className="absolute inset-4 rounded-[3rem] bg-[#1F5EA8]/20 blur-3xl" />

            {/* Floating wrapper */}
            <motion.div
              animate={shouldReduceMotion ? { y: 0 } : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-full w-full overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-[0_20px_50px_rgba(31,94,168,0.15)]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 h-full w-full"
                >
                  <Image
                    src={slide.src}
                    alt={`${slide.title} — ${slide.description}`}
                    fill
                    sizes="(max-width: 1024px) 90vw, 480px"
                    className="object-cover"
                    priority={currentIndex === 0}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:p-5"
                  >
                    <span className="mb-2 inline-block rounded-md bg-[#1F5EA8]/10 px-2.5 py-1 text-[10px] font-bold text-[#1F5EA8]">
                      {slide.badge}
                    </span>
                    <h3 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                      {slide.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-gray-600 sm:text-sm">
                      {slide.description}
                    </p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Screen-reader announcement for slide changes */}
              <span className="sr-only" aria-live="polite">
                Slide {currentIndex + 1} of {slideCount}: {slide.title}
              </span>

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1A202C] shadow-md backdrop-blur transition-colors hover:bg-white hover:text-[#1F5EA8]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1A202C] shadow-md backdrop-blur transition-colors hover:bg-white hover:text-[#1F5EA8]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Indicator Dots */}
            <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {bannerSlides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}: ${s.title}`}
                  aria-current={currentIndex === index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? "w-6 bg-[#1F5EA8]"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}