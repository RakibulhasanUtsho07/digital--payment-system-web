"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  LayoutDashboard,
  Loader2,
  LogOut,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

import FeaturesDrawer from "@/components/navigation/FeaturesDrawer";
import SecurityDrawer from "@/components/navigation/SecurityDrawer";
import FaqDrawer from "@/components/navigation/FaqDrawer";

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

interface ProfileResponse {
  success: boolean;
  user: CurrentUser;
}

/* =========================================================
   MENU CONFIG

   Each entry with a `drawer` id is hover-triggered. Entries
   without one behave exactly like before (plain anchor
   links / scroll targets).
========================================================= */

type DrawerId = "features" | "security" | "faq";

const HOVER_MENU_ITEMS: {
  label: string;
  href: string;
  drawer: DrawerId;
}[] = [
  { label: "Features", href: "/#features", drawer: "features" },
  { label: "Security", href: "/#security", drawer: "security" },
  { label: "FAQ", href: "/#faq", drawer: "faq" },
];

/* Delay before closing on mouse-leave, so moving the cursor
   from the trigger link down into the drawer doesn't close it
   mid-transition. */
const CLOSE_DELAY_MS = 150;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [openDrawer, setOpenDrawer] = useState<DrawerId | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoginPage =
    pathname === "/login" || pathname === "/sign-in";

  const isRegisterPage =
    pathname === "/register" || pathname === "/sign-up";

  const isAuthRoute = isLoginPage || isRegisterPage;

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      /*
       * আগে localStorage থেকে user দেখানো হবে।
       * এতে page refresh করলে Navbar flash করবে না।
       */
      try {
        const storedUser = localStorage.getItem("auth_user");

        if (storedUser && mounted) {
          const parsedUser = JSON.parse(
            storedUser
          ) as CurrentUser;

          if (parsedUser?._id && parsedUser?.role) {
            setUser(parsedUser);
          }
        }
      } catch {
        localStorage.removeItem("auth_user");
      }

      /*
       * Backend হচ্ছে authentication-এর মূল source।
       */
      try {
        const response =
          await apiClient<ProfileResponse>("/users/profile");

        if (
          mounted &&
          response?.success &&
          response.user
        ) {
          setUser(response.user);

          localStorage.setItem(
            "auth_user",
            JSON.stringify(response.user)
          );

          localStorage.setItem(
            "is_authenticated",
            "true"
          );
        }
      } catch {
        if (mounted) {
          setUser(null);
          clearStoredAuthentication();
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  /* =========================================================
     CLOSE DRAWER ON ROUTE CHANGE / ESCAPE
  ========================================================== */

  useEffect(() => {
    setOpenDrawer(null);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDrawer(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();

    closeTimerRef.current = setTimeout(() => {
      setOpenDrawer(null);
    }, CLOSE_DELAY_MS);
  };

  const openDrawerNow = (drawer: DrawerId) => {
    cancelScheduledClose();
    setOpenDrawer(drawer);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await apiClient("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      clearStoredAuthentication();
      setLoggingOut(false);

      router.replace("/");
      router.refresh();
    }
  };

  const dashboardLabel =
    user?.role === "admin" ? "Dashboard" : "My Wallet";

  const isAuthenticated = Boolean(user);

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      onMouseLeave={scheduleClose}
    >
      {/* =====================================================
          HOVER DRAWER

          Docked directly above the floating nav pill (the
          nav itself sits at bottom-6), sliding into place as
          it opens/closes.
      ====================================================== */}

      <AnimatePresence>
        {openDrawer && (
          <motion.div
            key={openDrawer}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelScheduledClose}
            onMouseLeave={scheduleClose}
            className="
              absolute
              bottom-[76px]
              w-[min(92vw,720px)]
              overflow-hidden
              rounded-[26px]
              border
              border-slate-100
              bg-white
              p-5
              shadow-[0_30px_80px_rgba(15,12,27,0.22)]
              sm:p-6
            "
          >
            {openDrawer === "features" && (
              <FeaturesDrawer
                isAuthenticated={isAuthenticated}
                onNavigate={() => setOpenDrawer(null)}
              />
            )}

            {openDrawer === "security" && (
              <SecurityDrawer
                isAuthenticated={isAuthenticated}
                onNavigate={() => setOpenDrawer(null)}
              />
            )}

            {openDrawer === "faq" && <FaqDrawer />}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-full overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1 rounded-full border border-white/10 bg-[#0a0714]/90 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {HOVER_MENU_ITEMS.slice(0, 2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => openDrawerNow(item.drawer)}
              className={`
                rounded-full px-5 py-2.5 text-sm font-medium transition-colors
                ${
                  openDrawer === item.drawer
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }
              `}
            >
              {item.label}
            </Link>
          ))}

          {loadingUser ? (
            <div className="flex min-w-[140px] items-center justify-center rounded-full border border-violet-400/50 bg-violet-500/10 px-5 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-violet-200" />
              <span className="sr-only">
                Checking authentication
              </span>
            </div>
          ) : user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-full border border-violet-400/50 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500/20"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {dashboardLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-full border border-violet-400/50 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500/20"
            >
              Open Wallet
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {HOVER_MENU_ITEMS.slice(2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => openDrawerNow(item.drawer)}
              className={`
                rounded-full px-5 py-2.5 text-sm font-medium transition-colors
                ${
                  openDrawer === item.drawer
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }
              `}
            >
              {item.label}
            </Link>
          ))}

          {!loadingUser && user ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}

              {loggingOut ? "Signing Out..." : "Logout"}
            </button>
          ) : !loadingUser && !isAuthRoute ? (
            <Link
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

function clearStoredAuthentication() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("auth_user");
  localStorage.removeItem("is_authenticated");
  localStorage.removeItem("token");
  localStorage.removeItem("digital_wallet_token");
}