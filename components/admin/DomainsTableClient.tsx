"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Row {
  id: string;
  name: string;
  allowedDomains: string | null;
}

export default function DomainsTableClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((row) => [row.id, row.allowedDomains || "*"]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveRow = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/embeds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedDomains: values[id] || "*" }),
      });
      const data = (await res.json()) as { error?: string; allowedDomains?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke gemme domæner.");
      }
      setValues((prev) => ({ ...prev, [id]: data.allowedDomains || "*" }));
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mt-5 overflow-x-auto space-y-3">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Projekt</th>
            <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Tilladte domæner</th>
            <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Handling</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {rows.map((embed) => (
            <tr key={embed.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-gray-700">{embed.name}</td>
              <td className="px-4 py-3">
                <input
                  value={values[embed.id] ?? "*"}
                  onChange={(e) => setValues((prev) => ({ ...prev, [embed.id]: e.target.value }))}
                  className="w-full min-w-[240px] rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="example.com, shop.example.com eller *"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveRow(embed.id)}
                    disabled={savingId === embed.id}
                    className="np-btn-primary px-3 py-2 disabled:opacity-50"
                  >
                    {savingId === embed.id ? "Gemmer..." : "Gem"}
                  </button>
                  <Link href={`/admin/embed/${embed.id}`} className="np-btn-ghost inline-flex px-3 py-2">
                    Redigér projekt
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

