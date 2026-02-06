"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard({ embeds }: any) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState("");

  const createNewProject = async () => {
    const name = prompt("Hvad skal projektet hedde?");
    if (!name) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        const newEmbed = await res.json();
        router.push(`/admin/embed/${newEmbed.id}`);
      }
    } catch (e) {
      alert("Noget gik galt");
      setIsCreating(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("ER DU SIKKER?\n\nDette vil slette HELE projektet og alle videoer.\nHandlingen kan ikke fortrydes.")) return;

    setIsDeleting(id);
    try {
        const res = await fetch(`/api/delete?type=embed&id=${id}`, {
            method: "DELETE"
        });
        
        if (res.ok) {
            router.refresh();
        } else {
            alert("Kunne ikke slette projektet.");
        }
    } catch (error) {
        alert("Der skete en fejl.");
    } finally {
        setIsDeleting("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Mine Projekter</h1>
            <p className="text-gray-500 mt-1">Administrer dine video-afspillere her.</p>
        </div>
        <button 
          onClick={createNewProject}
          disabled={isCreating}
          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2"
        >
          {isCreating ? "Opretter..." : "+ Opret Nyt Projekt"}
        </button>
      </div>

      {/* GRID AF PROJEKTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {embeds.map((embed: any) => (
          <div key={embed.id} className="relative group bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-blue-500 transition-all overflow-hidden">
            
            {/* LINKET TIL AT REDIGERE (Fylder hele kortet) */}
            <Link 
              href={`/admin/embed/${embed.id}`} 
              className="block p-6 h-full"
            >
                <h3 className="font-bold text-lg text-gray-800 truncate pr-10 mb-2">{embed.name}</h3>
                <div className="text-xs text-gray-400 font-mono mb-6 truncate">ID: {embed.id}</div>
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">
                            {embed.groups?.length || 0} titler
                        </span>
                    </div>
                    <span className="text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        Rediger →
                    </span>
                </div>
            </Link>

            {/* SLET KNAPPEN (Pæn og diskret i hjørnet) */}
            <button 
                onClick={() => deleteProject(embed.id)}
                disabled={isDeleting === embed.id}
                className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-gray-100 bg-white text-gray-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all z-20 shadow-sm"
                title="Slet hele projektet"
            >
                {isDeleting === embed.id ? "..." : "SLET"}
            </button>
            
          </div>
        ))}

        {/* TOM TILSTAND */}
        {embeds.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Du har ingen projekter endnu.</p>
                <button onClick={createNewProject} className="text-blue-600 font-bold hover:underline">Start dit første projekt her</button>
            </div>
        )}
      </div>
    </div>
  );
}