const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  // ১. ম্যানুয়াল টোকেন না থাকলে অটোমেটিক localStorage থেকে টোকেন নেওয়ার লজিক
  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("token") || undefined;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      // ২. টোকেন থাকলে Authorization হেডার যোগ হবে
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    // ৩. HttpOnly কুকি আদান-প্রদানের জন্য
    credentials: "include",
    cache: "no-store",
  });

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      message = String((data as { message?: unknown }).message);
    }

    throw new Error(message);
  }

  return data as T;
}