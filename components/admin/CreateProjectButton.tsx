"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);

    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const project = await res.json();
        setIsOpen(false);
        setName("");
        // Her sker magien: Vi sender brugeren direkte til editoren
        router.push(`/admin/embed/${project.id}`);
        router.refresh();
      } else {
        alert("Noget gik galt under oprettelsen.");
      }
    } catch (error) {
      console.error("Fejl:", error);
      alert("Kunne ikke oprette projektet.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Selve knappen på dashboardet */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
      >
        <span className="text-xl leading-none">+</span> Nyt Projekt
      </button>

      {/* Modal til navngivning af projekt */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => !isCreating && setIsOpen(false)} 
          />
          
          <form 
            onSubmit={handleCreate}
            className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-2">Opret nyt projekt</h2>
            <p className="text-gray-500 text-sm mb-6">Giv dit projekt et navn (f.eks. "Kampagne Video 2024")</p>

            <input
              autoFocus
              type="text"
              placeholder="Projektets navn..."
              className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-lg font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                disabled={isCreating}
              >
                Annuller
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isCreating ? "Opretter..." : "Opret og fortsæt"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}