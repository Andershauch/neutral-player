"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Tjek om brugeren har admin-rollen
  const isAdmin = session?.user?.role === "admin";

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Brugere", href: "/admin/users" },
  ];

  // Tilføj kun Audit Log til listen, hvis brugeren er admin
  if (isAdmin) {
    navItems.push({ name: "Audit Log", href: "/admin/audit" });
  }

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${
                  pathname === item.href
                    ? "border-blue-600 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center">
            <span className="text-[10px] font-black uppercase bg-gray-100 px-3 py-1 rounded-full text-gray-500">
              {session?.user?.role || "Bruger"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}