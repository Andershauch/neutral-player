import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function AppPageHeader({
  kicker,
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}) {
  return (
    <section className="np-card np-card-pad rounded-2xl border-gray-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] bg-gradient-to-br from-white via-white to-blue-50/30">
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Brødkrumme" className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-gray-300">/</span> : null}
              {item.href ? (
                <Link href={item.href} className="hover:text-blue-600">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-500">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {kicker ? <p className="np-kicker text-blue-600">{kicker}</p> : null}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-gray-500">{description}</p> : null}
        </div>

        {actions ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{actions}</div> : null}
      </div>
    </section>
  );
}
