"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Tjek admin-status
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
      {/* MOBIL TOP-BAR (Vises kun på mobil) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <h2 className="text-lg font-black tracking-tighter uppercase">
          Neutral<span className="text-blue-600">.</span>
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>
      </div>

      {/* SIDEBAR (Desktop fast, Mobil slide-in) */}
      <aside className={`
        fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-[60]
        transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0
      `}>
        {/* Logo Sektion */}
        <div className="p-8 hidden md:block">
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">
            Neutral<span className="text-blue-600">.</span>
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-24 md:pt-4 space-y-2">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bruger Info & Log ud */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
                {session?.user?.name?.[0] || "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[150px]">
                  {session?.user?.name}
                </span>
                <span className="text-[9px] font-bold uppercase text-blue-600 tracking-widest">
                  {session?.user?.role}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
            >
              Log ud
            </button>
          </div>
        </div>
      </aside>

      {/* Baggrundssløring (Overlay) når menuen er åben på mobil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}