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
    <div className="space-y-8 md:space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Mine Projekter
            </h1>
            <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
              Administrer dine video-afspillere her.
            </p>
        </div>
        <button 
          onClick={createNewProject}
          disabled={isCreating}
          className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isCreating ? "Opretter..." : "+ Opret Nyt Projekt"}
        </button>
      </div>

      {/* GRID AF PROJEKTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {embeds.map((embed: any) => (
          <div key={embed.id} className="relative group bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 overflow-hidden">
            
            {/* LINKET TIL AT REDIGERE */}
            <Link 
              href={`/admin/embed/${embed.id}`} 
              className="block p-8 h-full"
            >
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Projekt</div>
                <h3 className="font-black text-xl text-gray-900 truncate pr-12 mb-1 uppercase tracking-tight">
                  {embed.name}
                </h3>
                <div className="text-[10px] text-gray-400 font-mono mb-8 truncate tracking-tighter uppercase opacity-60">
                  ID: {embed.id}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-6 border-t border-gray-50">
                    <div className="flex gap-2">
                        <span className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100">
                            {embed.groups?.length || 0} titler
                        </span>
                    </div>
                    <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 md:group-hover:opacity-100 transition-all transform translate-x-2 md:group-hover:translate-x-0">
                        Rediger →
                    </span>
                </div>
            </Link>

            {/* SLET KNAPPEN */}
            <button 
                onClick={() => deleteProject(embed.id)}
                disabled={isDeleting === embed.id}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl border border-gray-50 bg-white text-gray-300 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all z-20 shadow-sm"
                title="Slet hele projektet"
            >
                {isDeleting === embed.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.344 12.142m-4.762 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                )}
            </button>
            
          </div>
        ))}

        {/* TOM TILSTAND */}
        {embeds.length === 0 && (
            <div className="col-span-full text-center py-32 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📁</span>
                </div>
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest mb-2">Ingen projekter endnu</p>
                <button onClick={createNewProject} className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] hover:text-blue-700 transition-colors">Start dit første projekt her →</button>
            </div>
        )}
      </div>
    </div>
  );
}