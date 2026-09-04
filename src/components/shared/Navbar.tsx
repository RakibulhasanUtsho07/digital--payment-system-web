"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  LayoutDashboard,
  Loader2,
  LogOut,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

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

const publicNavItems = [
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "Security",
    href: "/#security",
  },
  {
    label: "FAQ",
    href: "/#faq",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="max-w-full overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1 rounded-full border border-white/10 bg-[#0a0714]/90 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {publicNavItems.slice(0, 2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
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

          {publicNavItems.slice(2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
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