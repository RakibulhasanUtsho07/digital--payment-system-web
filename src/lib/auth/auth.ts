const TOKEN_KEY = "digital_wallet_token";
const USER_KEY = "digital_wallet_user";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}