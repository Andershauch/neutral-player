"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadAvatar = async () => {
      try {
        const res = await fetch("/api/profile/avatar", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { image?: string | null };
        if (!active) return;
        setAvatarImage(typeof data.image === "string" ? data.image : null);
      } catch {
        // ignore
      }
    };
    void loadAvatar();

    const onAvatarUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ image?: string | null }>;
      setAvatarImage(typeof custom.detail?.image === "string" ? custom.detail.image : null);
    };
    window.addEventListener("np:avatar-updated", onAvatarUpdated as EventListener);
    return () => {
      active = false;
      window.removeEventListener("np:avatar-updated", onAvatarUpdated as EventListener);
    };
  }, []);

  const sections = [
    {
      label: "Oversigt",
      items: [
        {
          name: "Dashboard",
          href: "/admin/dashboard",
          isActive: pathname === "/admin/dashboard",
        },
      ],
    },
    {
      label: "Indhold",
      items: [
        { name: "Projekter", href: "/admin/projects", isActive: pathname === "/admin/projects" || pathname.startsWith("/admin/embed/") },
      ],
    },
    {
      label: "Organisation",
      items: [
        { name: "Team", href: "/admin/team", isActive: pathname === "/admin/team" || pathname === "/admin/users" },
        { name: "Profil", href: "/admin/profile", isActive: pathname === "/admin/profile" || pathname === "/admin/billing" },
      ],
    },
  ];
  const navItems = sections.flatMap((section) => section.items);

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
        fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-100 flex flex-col z-[60]
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

        <nav className="flex-1 px-4 pt-24 md:pt-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center px-5 py-4 text-sm font-black uppercase tracking-[0.08em] rounded-2xl border transition-all duration-200 ${
                item.isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                  : "text-gray-500 border-transparent hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100 hover:-translate-y-0.5"
              }`}
            >
              <span className={`${item.isActive ? "" : "group-hover:translate-x-0.5"} transition-transform duration-200`}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-5 pt-4 border-t border-gray-100 space-y-2">
          <Link
            href="/admin/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner overflow-hidden">
              {avatarImage ? (
                <span
                  className="block h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${avatarImage}")` }}
                  aria-label="Profilbillede"
                />
              ) : (
                <span>{session?.user?.name?.[0] || "U"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">
                {session?.user?.name || "Bruger"}
              </span>
              <span className="text-[9px] font-bold uppercase text-blue-600 tracking-widest">
                {session?.user?.role || "bruger"}
              </span>
            </div>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-5 py-4 text-left text-sm font-black uppercase tracking-[0.08em] text-red-500 rounded-2xl border border-gray-100 bg-white hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
          >
            Log ud
          </button>
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
