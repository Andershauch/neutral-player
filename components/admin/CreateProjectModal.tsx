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
          setLimitError(data.error || "Plangrænsen er nået.");
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
    <div className="fixed inset-0 z-[10000] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isCreating && onClose()} />

      <form
        onSubmit={handleCreate}
        className="relative w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 sm:zoom-in md:p-10"
      >
        <div className="mb-8 space-y-3">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Opret projekt</h2>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Giv dit nye videoprojekt et navn
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">
              Når projektet er oprettet, kommer du direkte til editoren, hvor du kan oprette versioner, uploade video og hente embed-koden.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase text-gray-400">Projektnavn</label>
            <input
              autoFocus
              type="text"
              placeholder="F.eks. Sommerkampagne"
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Næste trin efter oprettelse</p>
            <ol className="mt-3 space-y-2 text-sm text-gray-600">
              <li>1. Opret din første sprogversion</li>
              <li>2. Upload en video eller posterframe</li>
              <li>3. Kopiér embed-koden og del projektet</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="order-2 flex-1 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50 sm:order-1"
              disabled={isCreating}
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="order-1 flex-[2] rounded-2xl bg-blue-600 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-50 active:scale-[0.95] sm:order-2"
            >
              {isCreating ? "Opretter..." : "Opret projekt og gå til editor"}
            </button>
          </div>

          {limitError ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">{limitError}</p>
              <button
                type="button"
                onClick={startUpgrade}
                disabled={upgrading}
                className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {upgrading ? "Åbner checkout..." : "Opgrader nu"}
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
