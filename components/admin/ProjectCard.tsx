"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectCard({ project }: { project: any }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State til status
  const [isActive, setIsActive] = useState(project.isActive);
  const [isToggling, setIsToggling] = useState(false);

  // --- FUNKTION: Skift Status ---
  const toggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    setIsToggling(true);
    const newState = !isActive;

    try {
        const res = await fetch("/api/toggle-status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: project.id, isActive: newState }),
        });

        if (res.ok) {
            setIsActive(newState);
            router.refresh();      
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
    // Vi bruger den nye responsive embed-kode her
    const code = `<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:12px;"><iframe src="${origin}/embed/${project.id}" loading="lazy" style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" allowfullscreen title="${project.name}"></iframe></div>`;
    
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
      href={`/admin/embed/${project.id}`}
      className={`block bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 hover:shadow-2xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="max-w-[70%]">
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Projekt</div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-tighter opacity-60">ID: {project.id.slice(0, 8)}...</p>
        </div>
        
        {/* KLIKBART STATUS BADGE */}
        <button
            onClick={toggleStatus}
            disabled={isToggling}
            className={`
                text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border transition-all flex items-center gap-2 active:scale-90
                ${isActive 
                    ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-200'
                }
            `}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
            {isToggling ? "..." : (isActive ? "Aktiv" : "Inaktiv")}
        </button>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-50">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">
           Rediger →
        </div>

        <div className="flex gap-3">
            <button
                onClick={copyEmbedCode}
                className={`
                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border active:scale-95
                    ${copied 
                        ? 'bg-green-600 text-white border-green-600 shadow-green-100' 
                        : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
                    }
                `}
            >
                {copied ? "✓ Færdig" : "Hent Kode"}
            </button>

            <button 
                onClick={handleDelete}
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
      </div>
    </Link>
  );
}