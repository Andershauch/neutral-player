"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error("Kunne ikke oprette projekt");
      }

      // Nulstil og opdater siden
      setName("");
      setIsExpanded(false);
      router.refresh();
      
    } catch (error) {
      alert("Der skete en fejl. Prøv igen.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hvis knappen er "åben", vis input-feltet
  if (isExpanded) {
    return (
      <form onSubmit={handleCreate} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
        <input
          autoFocus
          type="text"
          placeholder="Projekt navn..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-48"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "..." : "Gem"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setName("");
          }}
          className="text-gray-500 hover:text-gray-700 px-2 text-sm"
        >
          ✕
        </button>
      </form>
    );
  }

  // Ellers vis bare "+ Nyt Projekt" knappen
  return (
    <button
      onClick={() => setIsExpanded(true)}
      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
    >
      <span>+</span> Nyt Projekt
    </button>
  );
}