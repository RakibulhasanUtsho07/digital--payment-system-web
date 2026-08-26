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

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...rest,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...headers,
      },

      // Required for the HttpOnly `access_token` cookie the backend sets
      // on login/register to actually be stored by the browser, and sent
      // back on every later request. Without this, cross-origin requests
      // (localhost:3000 -> localhost:5000) silently drop the cookie in
      // both directions — no error, the cookie just never exists.
      credentials: "include",

      cache: "no-store",
    }
  );

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
      message = String(
        (data as { message?: unknown }).message
      );
    }

    throw new Error(message);
  }

  return data as T;
}