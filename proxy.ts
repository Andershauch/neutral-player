import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { REQUEST_ID_HEADER, createRequestId } from "@/lib/observability";

export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;
    const requestId = req.headers.get(REQUEST_ID_HEADER) || createRequestId();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(REQUEST_ID_HEADER, requestId);

    if (path.startsWith("/admin")) {
      if (path.startsWith("/admin/users") && role !== "admin") {
        const redirect = NextResponse.redirect(new URL("/unauthorized", req.url));
        redirect.headers.set(REQUEST_ID_HEADER, requestId);
        return redirect;
      }

      if (role !== "admin" && role !== "contributor") {
        const redirect = NextResponse.redirect(new URL("/unauthorized", req.url));
        redirect.headers.set(REQUEST_ID_HEADER, requestId);
        return redirect;
      }
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/embed")) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/embed/:path*"],
};

