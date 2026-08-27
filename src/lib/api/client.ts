const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   API ERROR TYPE
========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/* =========================================================
   API CLIENT
========================================================= */

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    headers,
    body,
    ...rest
  } = options;

  /* =======================================================
     CREATE HEADERS
  ======================================================== */

  const requestHeaders =
    new Headers(headers);

  /* =======================================================
     CHECK FORMDATA
  ======================================================== */

  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  /* =======================================================
     CONTENT TYPE HANDLING
  ======================================================== */

  if (isFormData) {
    /*
     * IMPORTANT:
     *
     * FormData হলে Content-Type manually set করা যাবে না।
     *
     * Browser automatically set করবে:
     *
     * multipart/form-data;
     * boundary=----WebKitFormBoundary...
     */

    requestHeaders.delete(
      "Content-Type"
    );

    requestHeaders.delete(
      "content-type"
    );
  } else if (
    body !== undefined &&
    body !== null &&
    !requestHeaders.has(
      "Content-Type"
    )
  ) {
    /*
     * Normal JSON request
     */

    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
  }

  /* =======================================================
     REQUEST URL
  ======================================================== */

  const url =
    `${API_URL}${endpoint}`;

  /* =======================================================
     FETCH
  ======================================================== */

  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          ...rest,

          headers:
            requestHeaders,

          body,

          credentials:
            "include",

          cache:
            "no-store",
        }
      );
  } catch (error) {
    console.error(
      "API NETWORK ERROR:",
      error
    );

    throw new Error(
      "Unable to connect to the server."
    );
  }

  /* =======================================================
     READ RESPONSE AS TEXT FIRST
  ======================================================== */

  let rawText = "";

  try {
    rawText =
      await response.text();
  } catch {
    rawText = "";
  }

  /* =======================================================
     PARSE RESPONSE SAFELY
  ======================================================== */

  let data: unknown =
    null;

  if (rawText) {
    try {
      data =
        JSON.parse(
          rawText
        );
    } catch {
      /*
       * Server may return HTML/text error.
       * Don't crash with JSON.parse error.
       */

      data = {
        message:
          rawText,
      };
    }
  }

  /* =======================================================
     HANDLE ERROR
  ======================================================== */

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`;

    if (
      typeof data ===
        "object" &&
      data !== null
    ) {
      const errorData =
        data as ApiErrorResponse;

      if (
        typeof errorData.message ===
          "string" &&
        errorData.message.trim()
      ) {
        message =
          errorData.message;
      } else if (
        typeof errorData.error ===
          "string" &&
        errorData.error.trim()
      ) {
        message =
          errorData.error;
      }
    }

    /*
     * Don't dump huge HTML/body into UI.
     */

    if (
      message.length >
      500
    ) {
      message =
        `Server error (${response.status}). Please try again.`;
    }

    throw new Error(
      message
    );
  }

  /* =======================================================
     EMPTY SUCCESS RESPONSE
  ======================================================== */

  if (!rawText) {
    return {} as T;
  }

  return data as T;
}