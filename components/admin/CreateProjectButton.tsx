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
      {/* Dashboard Knap: Nu med fuld bredde på mobil via 'w-full sm:w-auto' */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <span className="text-lg leading-none">+</span> Nyt Projekt
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => !isCreating && setIsOpen(false)} 
          />
          
          <form 
            onSubmit={handleCreate}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in duration-300"
          >
            <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Opret projekt</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">
                    Giv din nye video-player et navn
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-2 block">
                        Projektets navn
                    </label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="F.eks. Sommerkampagne..."
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isCreating}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
                    {isCreating ? "Opretter..." : "Opret og fortsæt →"}
                  </button>
                </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}