"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HomeHeaderActions() {
  const { status } = useSession();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/faq"
        className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
      >
        FAQ
      </Link>
      <Link
        href="/contact"
        className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
      >
        Kontakt
      </Link>

      {status === "authenticated" ? (
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
        >
          Dashboard
        </Link>
      ) : status === "loading" ? (
        <span className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 select-none">
          ...
        </span>
      ) : (
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
        >
          Log ind
        </Link>
      )}

      <Link
        href="/pricing"
        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
      >
        Se planer
      </Link>
    </div>
  );
}
