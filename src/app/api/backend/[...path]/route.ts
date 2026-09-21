import {
  NextRequest,
  NextResponse,
} from "next/server";

/* =========================================================
   BACKEND API URL
========================================================= */

function getBackendApiUrl(): string {
  const configuredUrl =
    process.env.BACKEND_API_URL?.trim();

  /*
   * Local development fallback.
   *
   * Production-এ অবশ্যই BACKEND_API_URL
   * Vercel environment variable দিতে হবে।
   */
  const rawUrl =
    configuredUrl ||
    (
      process.env.NODE_ENV !== "production"
        ? "http://localhost:5000/api"
        : ""
    );

  if (!rawUrl) {
    throw new Error(
      "BACKEND_API_URL is missing in production."
    );
  }

  const cleaned =
    rawUrl.replace(
      /\/+$/,
      ""
    );

  /*
   * Accept:
   *
   * http://localhost:5000
   * http://localhost:5000/api
   */
  return /\/api$/i.test(
    cleaned
  )
    ? cleaned
    : `${cleaned}/api`;
}

/* =========================================================
   CONTEXT
========================================================= */

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

/* =========================================================
   PROXY HANDLER
========================================================= */

async function proxyRequest(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  let targetUrl =
    "";

  try {
    const {
      path,
    } =
      await context.params;

    if (
      !Array.isArray(
        path
      ) ||
      path.length ===
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Backend API path is missing.",
        },
        {
          status:
            400,
        }
      );
    }

    const backendApiUrl =
      getBackendApiUrl();

    const incomingUrl =
      new URL(
        request.url
      );

    const backendPath =
      path
        .map(
          (
            segment
          ) =>
            encodeURIComponent(
              segment
            )
        )
        .join("/");

    targetUrl =
      `${backendApiUrl}/${backendPath}${incomingUrl.search}`;

    /* =====================================================
       DEBUG
    ===================================================== */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.log(
        "[BFF PROXY]",
        request.method,
        targetUrl
      );
    }

    /* =====================================================
       REQUEST HEADERS
    ===================================================== */

    const requestHeaders =
      new Headers(
        request.headers
      );

    /*
     * Browser/Next generated headers
     * should not be forwarded directly.
     */
    requestHeaders.delete(
      "host"
    );

    requestHeaders.delete(
      "content-length"
    );

    requestHeaders.delete(
      "connection"
    );

    requestHeaders.delete(
      "transfer-encoding"
    );

    /*
     * Tell backend to return uncompressed data.
     * Makes proxy response handling safer.
     */
    requestHeaders.set(
      "accept-encoding",
      "identity"
    );

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    let requestBody:
      ArrayBuffer |
      undefined;

    if (
      request.method !==
        "GET" &&
      request.method !==
        "HEAD"
    ) {
      const arrayBuffer =
        await request.arrayBuffer();

      if (
        arrayBuffer.byteLength >
        0
      ) {
        requestBody =
          arrayBuffer;
      }
    }

    /* =====================================================
       BACKEND FETCH
    ===================================================== */

    const backendResponse =
      await fetch(
        targetUrl,
        {
          method:
            request.method,

          headers:
            requestHeaders,

          body:
            requestBody,

          cache:
            "no-store",

          redirect:
            "manual",
        }
      );

    /* =====================================================
       RESPONSE HEADERS
    ===================================================== */

    const responseHeaders =
      new Headers();

    backendResponse.headers.forEach(
      (
        value,
        key
      ) => {
        const normalizedKey =
          key.toLowerCase();

        if (
          normalizedKey ===
            "content-length" ||
          normalizedKey ===
            "content-encoding" ||
          normalizedKey ===
            "transfer-encoding" ||
          normalizedKey ===
            "connection" ||
          normalizedKey ===
            "set-cookie"
        ) {
          return;
        }

        responseHeaders.set(
          key,
          value
        );
      }
    );

    /* =====================================================
       SET-COOKIE FORWARDING
    ===================================================== */

    const cookieHeaders =
      backendResponse.headers as
        Headers & {
          getSetCookie?:
            () => string[];
        };

    let cookies:
      string[] =
      [];

    if (
      typeof cookieHeaders
        .getSetCookie ===
      "function"
    ) {
      cookies =
        cookieHeaders
          .getSetCookie();
    } else {
      const cookie =
        backendResponse.headers.get(
          "set-cookie"
        );

      if (
        cookie
      ) {
        cookies = [
          cookie,
        ];
      }
    }

    for (
      const cookie of
      cookies
    ) {
      responseHeaders.append(
        "set-cookie",
        cookie
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    const responseBody =
      await backendResponse.arrayBuffer();

    return new NextResponse(
      responseBody,
      {
        status:
          backendResponse.status,

        statusText:
          backendResponse.statusText,

        headers:
          responseHeaders,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[BFF PROXY ERROR]",
      {
        method:
          request.method,

        targetUrl,

        backendApiUrl:
          process.env
            .BACKEND_API_URL ||
          "(not set)",

        error:
          error instanceof Error
            ? {
                name:
                  error.name,

                message:
                  error.message,

                cause:
                  error.cause,
              }
            : error,
      }
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          process.env.NODE_ENV !==
          "production"
            ? error instanceof Error
              ? `Backend proxy failed: ${error.message}`
              : "Backend proxy failed."
            : "Unable to connect to the backend service.",
      },
      {
        status:
          502,
      }
    );
  }
}

/* =========================================================
   METHODS
========================================================= */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function OPTIONS(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}