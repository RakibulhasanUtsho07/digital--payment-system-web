"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import AnimatedFeatureButton from "../button/AnimatedFeatureButton";

const PRIMARY = "#1A202C";

const navLinks = [
  { name: "Product", href: "/product" },
  { name: "Security", href: "/security" },
  { name: "Pricing", href: "/pricing" },
  { name: "Log in", href: "/login" },
];

const linkVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.08,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-50 overflow-visible rounded-t-[2rem] bg-[#F1F3ED] shadow-sm"
    >
      {/* Grid এর বদলে Flexbox (flex justify-between) ব্যবহার করা হয়েছে যাতে ওভারল্যাপ না হয় */}
      <nav className="mx-auto flex w-[95%] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12 overflow-visible">
        
        {/* Left: mobile menu trigger + logo */}
        {/* lg:flex-1 ব্যবহার করা হয়েছে যাতে ডেস্কটপে ৩ ভাগে জায়গা সমানভাবে নিয়ে সেন্টার মেনু ঠিক মাঝে থাকে */}
        <div className="flex items-center gap-1 lg:flex-1 lg:justify-start">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle navigation menu"
                className="mr-1 shrink-0 text-[#1A202C] hover:bg-black/5 hover:text-[#1F5EA8] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-64 border-none bg-[#F1F3ED]"
            >
              <SheetTitle className="text-left font-serif text-lg font-semibold text-[#1A202C]">
                Coffer
              </SheetTitle>
              <ul className="mt-8 flex flex-col gap-1 text-[15px] font-medium text-gray-700">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
                        className="block rounded-md px-3 py-2 transition-colors hover:bg-black/5 hover:text-[#1F5EA8]"
                      >
                        {link.name}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="shrink-0"
          >
            <Link href="/" className="flex items-center gap-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="1.5"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 4v16" />
                <path d="M12 4c4.418 0 8 3.582 8 8s-3.582 8-8 8" />
                <path d="M10 4h4" />
              </svg>
              <span className="text-xl font-serif font-semibold tracking-wide text-[#1A202C]">
                Coffer
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Center: desktop nav links */}
        <ul className="hidden items-center justify-center gap-6 text-[15px] font-medium text-gray-700 lg:flex lg:flex-1">
          {navLinks.map((link, index) => (
            <motion.li
              key={link.href}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={linkVariants}
            >
              <Link
                href={link.href}
                className="group relative px-2 py-1 transition-colors duration-200 hover:text-[#1F5EA8]"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#1F5EA8] transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Right: CTA Button Wrapper */}
        <div className="relative flex z-50 items-center justify-end overflow-visible lg:flex-1 shrink-0">
          <AnimatedFeatureButton />
        </div>
      </nav>
    </motion.header>
  );
}