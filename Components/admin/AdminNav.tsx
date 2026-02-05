"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
             <button onClick={() => alert("Logout logic here")} className="text-sm text-gray-500 hover:text-red-600">
               Log ud
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}