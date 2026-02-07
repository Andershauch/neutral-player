import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Kun kør logik hvis vi er på en admin-sti
    if (path.startsWith("/admin")) {
      // 1. BESKYT BRUGERSTYRING (Kun Admin)
      if (path.startsWith("/admin/users") && role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      // 2. TILLAD DASHBOARD OG RESTEN AF ADMIN (Admin + Contributor)
      if (role !== "admin" && role !== "contributor") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Embed-sider skal være offentlige
        if (req.nextUrl.pathname.startsWith("/embed")) return true;
        // Alt andet kræver token
        return !!token;
      },
    },
  }
);

export const config = {
  // Vi tilføjer /embed her for at være sikre på at callbacks kører, 
  // men authorized returnerer altid true for den sti.
  matcher: ["/admin/:path*", "/embed/:path*"],
};