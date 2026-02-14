"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmbedCodeGenerator from "./EmbedCodeGenerator"; 

interface ProjectListClientProps {
  initialProjects: any[];
}

export default function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showEmbedId, setShowEmbedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på, at du vil slette "${name}"?`)) return;
    setIsDeleting(id);
    
    try {
      // 1. Slet projektet via dit eksisterende API
      const res = await fetch(`/api/embeds/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        // 2. NYT: Send besked til Audit Loggen
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SLET_PROJEKT",
            target: `${name} (ID: ${id})`
          })
        });

        // 3. Opdater listen
        router.refresh();
      } else {
        alert("Der skete en fejl ved sletning af projektet.");
      }
    } catch (error) {
      console.error("Sletning fejlede:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {initialProjects.map((project) => (
          <div key={project.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <h2 className="text-xl font-black text-gray-900">{project.name}</h2>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">ID: {project.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Åbner generator-modal */}
              <button 
                onClick={() => setShowEmbedId(project.id)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                Hent kode
              </button>

              {/* Link til Editoren i app/admin/embed/[embedId] */}
              <Link 
                href={`/admin/embed/${project.id}`}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
              >
                Rediger
              </Link>
              
              <button 
                onClick={() => setPreviewId(project.id)}
                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition"
              >
                Vis
              </button>

              <button 
                onClick={() => handleDelete(project.id, project.name)}
                disabled={isDeleting === project.id}
                className="p-2 text-gray-300 hover:text-red-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-1.851c0-1.03-.784-1.913-1.812-1.947a45.108 45.108 0 0 0-3.322 0c-1.028.034-1.812 0.917-1.812 1.947v1.851m10.5 0a48.009 48.009 0 0 0-9.003 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EMBED KODE MODAL */}
      {showEmbedId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmbedId(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowEmbedId(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">Embed-kode</h2>
              <p className="text-gray-500 text-sm font-medium">Kopier koden til din hjemmeside.</p>
            </div>
            <EmbedCodeGenerator 
              projectId={showEmbedId} 
              projectTitle={initialProjects.find(p => p.id === showEmbedId)?.name || "Video"} 
            />
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewId(null)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl mx-4 z-10 overflow-hidden rounded-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setPreviewId(null)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {/* Viser siden fra app/embed/[id]/page.tsx */}
            <iframe src={`/embed/${previewId}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}