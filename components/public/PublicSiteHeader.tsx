import Link from "next/link";

export default function PublicSiteHeader({
  activePath,
}: {
  activePath?: "/" | "/pricing" | "/faq" | "/contact";
}) {
  const navItems = [
    { href: "/", label: "Produkt" },
    { href: "/pricing", label: "Priser" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Kontakt" },
  ] as const;

  return (
    <header className="np-public-header">
      <Link href="/" className="np-brand shrink-0">
        Neutral<span className="np-brand-dot">.</span>
      </Link>

      <nav className="hidden lg:flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-colors ${
                isActive
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:bg-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
        >
          Log ind
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
        >
          Opret konto
        </Link>
        <Link
          href="/pricing"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
        >
          Se planer
        </Link>
      </div>
    </header>
  );
}
