"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Menu, LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

import AnimatedFeatureButton from "../button/AnimatedFeatureButton";
import { apiClient } from "@/lib/api/client";

const PRIMARY = "#1A202C";

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  kycStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
}

const navLinks = [
  { name: "Product", href: "/product" },
  { name: "Security", href: "/security" },
  { name: "Pricing", href: "/pricing" },
];

const linkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
  },

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

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  /* =========================================================
     CHECK CURRENT USER
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const data = await apiClient<{
          success: boolean;
          user: CurrentUser;
        }>("/users/profile");

        if (mounted && data?.user) {
          setUser(data.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await apiClient("/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setOpen(false);

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);

      setUser(null);
      setOpen(false);

      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className="relative z-50 overflow-visible rounded-t-[2rem] bg-[#F1F3ED] shadow-sm"
    >
      <nav className="mx-auto flex w-[95%] items-center justify-between gap-4 overflow-visible px-4 py-4 sm:px-6 lg:px-12">
        
        {/* =====================================================
            LEFT: MOBILE MENU + LOGO
        ====================================================== */}

        <div className="flex items-center gap-1 lg:flex-1 lg:justify-start">
          <Sheet
            open={open}
            onOpenChange={setOpen}
          >
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

                {/* Mobile auth */}

                {user ? (
                  <>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="block rounded-md px-3 py-2 transition-colors hover:bg-black/5 hover:text-[#1F5EA8]"
                        >
                          Dashboard
                        </Link>
                      </SheetClose>
                    </li>

                    <li className="mt-3 border-t border-black/5 pt-3">
                      <button
                        type="button"
                        disabled={loggingOut}
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {loggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}

                        {loggingOut
                          ? "Logging out..."
                          : "Logout"}
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="block rounded-md px-3 py-2 transition-colors hover:bg-black/5 hover:text-[#1F5EA8]"
                      >
                        Log in
                      </Link>
                    </SheetClose>
                  </li>
                )}
              </ul>
            </SheetContent>
          </Sheet>

          {/* Logo */}

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            className="shrink-0"
          >
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="1.5"
                className="shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                />

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

        {/* =====================================================
            CENTER: DESKTOP NAV
        ====================================================== */}

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

        {/* =====================================================
            RIGHT: AUTH
        ====================================================== */}

        <div className="relative z-50 flex shrink-0 items-center justify-end overflow-visible lg:flex-1">
          {loadingUser ? (
            <div className="flex h-10 min-w-[110px] items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#1F5EA8]" />
            </div>
          ) : user ? (
            /* =================================================
               LOGGED IN
            ================================================== */

            <motion.button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              whileHover={{
                y: -1,
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </motion.button>
          ) : (
            /* =================================================
               LOGGED OUT
            ================================================== */

            <AnimatedFeatureButton />
          )}
        </div>
      </nav>
    </motion.header>
  );
}