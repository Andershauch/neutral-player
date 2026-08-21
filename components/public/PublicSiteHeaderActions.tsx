"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/// Headerens højreside kender brugerens session, så eksisterende kunder ikke
/// bliver bedt om at oprette den konto de allerede har.
export default function PublicSiteHeaderActions() {
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/billing" className="np-header-link">
          Plan
        </Link>
        <Link href="/admin/dashboard" className="np-header-cta">
          Til dashboard
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="np-header-link opacity-50 select-none" aria-hidden>
          &nbsp;&nbsp;&nbsp;
        </span>
        <span className="np-header-cta opacity-50 select-none" aria-hidden>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/login" className="np-header-link">
        Log ind
      </Link>
      <Link href="/pricing" className="np-header-cta">
        Se planer
      </Link>
    </div>
  );
}
