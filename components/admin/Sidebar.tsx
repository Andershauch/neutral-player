"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false); // Til mobil-menu
  const isAdmin = (session?.user as any)?.role === "admin";

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Brugere", href: "/admin/users" },
  ];

  if (isAdmin) {
    navItems.push({ name: "Audit Log", href: "/admin/audit" });
  }

  return (
    <>
      {/* MOBIL TOP BAR (Vises kun på mobil) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <h2 className="text-lg font-black tracking-tighter uppercase">
          Neutral<span className="text-blue-600">.</span>
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>
      </div>

      {/* SIDEBAR (Responsive) */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-[60]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0
      `}>
        {/* Top: Brand */}
        <div className="p-8 hidden md:block">
          <h2 className="text-xl font-black tracking-tighter text-gray-900 uppercase">
            Neutral<span className="text-blue-600">.</span>
          </h2>
        </div>

        {/* Mid: Navigation */}
        <nav className="flex-1 px-4 pt-20 md:pt-0 space-y-1">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
            Hovedmenu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Luk menuen ved klik på mobil
                className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Bruger Profil & Logout */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col px-2">
              <span className="text-xs font-bold text-gray-900 truncate">
                {session?.user?.name || "Bruger"}
              </span>
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-tight">
                {(session?.user as any)?.role || "bruger"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-center w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              Log ud
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay (Mørk baggrund når menuen er åben på mobil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}