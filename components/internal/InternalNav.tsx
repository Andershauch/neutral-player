"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getInternalTool, INTERNAL_TOOLS } from "@/lib/internal-tools";

export default function InternalNav() {
  const pathname = usePathname();
  const activeTool = getInternalTool(pathname);

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white/85 px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Internal shell</p>
          <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">Interne værktøjer</h2>
          <p className="max-w-2xl text-sm text-gray-600">
            Brug internal-området til platformstyring, marketing og senere governance- eller supportværktøjer. Customer admin er stadig et separat arbejdsområde.
          </p>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs font-semibold text-gray-600">
            Aktivt område: <span className="font-black text-gray-900">{activeTool?.label || "Internal"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex rounded-xl border border-gray-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Customer admin
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {INTERNAL_TOOLS.map((tool) => {
          const active = activeTool?.href === tool.href;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`rounded-2xl border px-4 py-4 transition ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/70"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${active ? "text-blue-100" : "text-gray-400"}`}>{tool.area}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    active ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {tool.status === "live" ? "Live" : "Guided"}
                </span>
              </div>
              <h3 className="mt-3 text-base font-black uppercase tracking-tight">{tool.label}</h3>
              <p className={`mt-2 text-sm ${active ? "text-blue-50" : "text-gray-600"}`}>{tool.summary}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
