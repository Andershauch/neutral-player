"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900";

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex gap-8 items-center">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              EmbedManager
            </span>
            <div className="hidden sm:flex space-x-8">
              <Link href="/admin/dashboard" className={isActive("/admin/dashboard")}>
                Embeds
              </Link>
              <Link href="/admin/audit" className={isActive("/admin/audit")}>
                Audit Log
              </Link>
            </div>
          </div>
          <div className="flex items-center">
             <button
  onClick={() => signOut({ callbackUrl: "/admin/login" })}
  className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded transition-colors w-full text-left"
>
  {/* Ikonet (lad bare det være som det er) */}
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  
  <span>Log ud</span>
</button>
          </div>
        </div>
      </div>
    </nav>
  );
}