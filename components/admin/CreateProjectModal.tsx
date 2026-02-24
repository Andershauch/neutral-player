"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateProjectModalProps {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setLimitError(null);

    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const project = (await res.json()) as { id: string };
        onClose();
        setName("");
        router.push(`/admin/embed/${project.id}`);
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string; code?: string };
        if (data.code === "UPGRADE_REQUIRED") {
          setLimitError(data.error || "Plan-graense naaet.");
        } else {
          alert(data.error || "Noget gik galt under oprettelsen.");
        }
      }
    } catch (error) {
      console.error("Fejl:", error);
      alert("Kunne ikke oprette projektet.");
    } finally {
      setIsCreating(false);
    }
  };

  const startUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro_monthly",
          returnTo: "/admin/dashboard",
          cancelReturnTo: "/admin/dashboard",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Kunne ikke starte checkout.");
      }
      window.location.assign(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      alert(message);
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isCreating && onClose()} />

      <form
        onSubmit={handleCreate}
        className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in duration-300"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Opret projekt</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Giv dit nye videoprojekt et navn
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-2 block">Projektnavn</label>
            <input
              autoFocus
              type="text"
              placeholder="F.eks. Sommerkampagne"
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="order-1 sm:order-2 flex-[2] bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-[0.95]"
            >
              {isCreating ? "Opretter..." : "Opret og fortsaet"}
            </button>
          </div>

          {limitError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800">{limitError}</p>
              <button
                type="button"
                onClick={startUpgrade}
                disabled={upgrading}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {upgrading ? "Aabner checkout..." : "Opgrader nu"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
