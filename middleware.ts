import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;

    // Hvis man forsøger at tilgå bruger-admin, SKAL man være admin
    if (req.nextUrl.pathname.startsWith("/admin/users") && role !== "admin") {
        return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // For alle andre /admin sider, skal man bare være admin ELLER contributor
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "admin" && role !== "contributor") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};