"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectCard({ project }: { project: any }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State til status (Henter start-værdien fra databasen)
  const [isActive, setIsActive] = useState(project.isActive);
  const [isToggling, setIsToggling] = useState(false);

  // --- FUNKTION: Skift Status ---
  const toggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop linket i at åbne
    e.stopPropagation();
    
    setIsToggling(true);
    const newState = !isActive; // Det modsatte af hvad den er nu

    try {
        const res = await fetch("/api/toggle-status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: project.id, isActive: newState }),
        });

        if (res.ok) {
            setIsActive(newState); // Opdater farven med det samme
            router.refresh();      // Fortæl Next.js at data er ændret
        }
    } catch (error) {
        alert("Kunne ikke skifte status");
    } finally {
        setIsToggling(false);
    }
  };

  const copyEmbedCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = window.location.origin;
    const url = `${origin}/embed/${project.id}`;
    const code = `<iframe src="${url}" width="100%" height="600" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Er du sikker på, at du vil slette hele dette projekt?")) return;
    setIsDeleting(true);
    await fetch(`/api/delete?type=embed&id=${project.id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <Link 
      href={`/admin/${project.id}`}
      className={`block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {project.id}</p>
        </div>
        
        {/* KLIKBART STATUS BADGE */}
        <button
            onClick={toggleStatus}
            disabled={isToggling}
            className={`
                text-xs px-2.5 py-1 rounded-full font-medium border transition-all flex items-center gap-1.5
                ${isActive 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }
            `}
            title={isActive ? "Klik for at deaktivere" : "Klik for at aktivere"}
        >
            {/* Lille prik der skifter farve */}
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            
            {isToggling ? "..." : (isActive ? "Aktiv" : "Inaktiv")}
        </button>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
           <span>Klik for at redigere</span>
        </div>

        <div className="flex gap-2">
            <button
                onClick={copyEmbedCode}
                className={`
                    px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm border
                    ${copied 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }
                `}
            >
                {copied ? "✓ Kopieret!" : "Hent Kode"}
            </button>

            <button 
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
      </div>
    </Link>
  );
}