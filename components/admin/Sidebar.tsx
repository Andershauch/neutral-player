"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const role = session?.user?.role;
  const canSeeAudit = role === "admin" || role === "owner";

  const sections = [
    {
      label: "Oversigt",
      items: [
        {
          name: "Dashboard",
          href: "/admin/dashboard",
          isActive: pathname === "/admin/dashboard" && searchParams.get("onboarding") !== "1",
        },
        {
          name: "Vis onboarding",
          href: "/admin/dashboard?onboarding=1",
          isActive: pathname === "/admin/dashboard" && searchParams.get("onboarding") === "1",
        },
      ],
    },
    {
      label: "Indhold",
      items: [
        { name: "Projekter", href: "/admin/projects", isActive: pathname === "/admin/projects" || pathname.startsWith("/admin/embed/") },
        { name: "Domains", href: "/admin/domains", isActive: pathname === "/admin/domains" },
      ],
    },
    {
      label: "Organisation",
      items: [
        { name: "Team", href: "/admin/team", isActive: pathname === "/admin/team" || pathname === "/admin/users" },
        { name: "Billing", href: "/admin/billing", isActive: pathname === "/admin/billing" },
        ...(canSeeAudit ? [{ name: "Audit", href: "/admin/audit", isActive: pathname === "/admin/audit" }] : []),
      ],
    },
  ];

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <h2 className="text-xl font-black tracking-tighter uppercase italic">
          Neutral<span className="text-blue-600">.</span>
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>
      </div>

      <aside
        className={`
        fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-[60]
        transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        <div className="p-8 hidden md:block">
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">
            Neutral<span className="text-blue-600">.</span>
          </h2>
        </div>

        <nav className="flex-1 px-4 pt-24 md:pt-4 space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
                {section.label}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
                      item.isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
                {session?.user?.name?.[0] || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">
                  {session?.user?.name || "Bruger"}
                </span>
                <span className="text-[9px] font-bold uppercase text-blue-600 tracking-widest">
                  {session?.user?.role || "bruger"}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"
            >
              Log ud
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
