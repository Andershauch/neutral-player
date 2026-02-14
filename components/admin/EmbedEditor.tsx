"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MuxVideoUploader from "./MuxUploader";
import MuxPlayer from "@mux/mux-player-react";
import EmbedCodeGenerator from "./EmbedCodeGenerator";

const LANGUAGES = [
  { code: "da", label: "Dansk (DA)" },
  { code: "en", label: "Engelsk (EN)" },
  { code: "de", label: "Tysk (DE)" },
  { code: "no", label: "Norsk (NO)" },
  { code: "ar", label: "Arabisk (AR)" },
  { code: "uk", label: "Ukrainsk (UK)" },
  { code: "fa", label: "Farsi (FA)" },
  { code: "sv", label: "Svensk (SV)" },
  { code: "fi", label: "Finsk (FI)" },
  { code: "fr", label: "Fransk (FR)" },
  { code: "es", label: "Spansk (ES)" },
  { code: "it", label: "Italiensk (IT)" },
  { code: "nl", label: "Hollandsk (NL)" },
  { code: "pl", label: "Polsk (PL)" },
  { code: "pt", label: "Portugisisk (PT)" },
  { code: "is", label: "Islandsk (IS)" },
  { code: "fo", label: "Færøsk (FO)" },
  { code: "gl", label: "Grønlandsk (GL)" },
];

interface EmbedEditorProps {
  embed: any;
}

export default function EmbedEditor({ embed }: EmbedEditorProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("da");
  const [showPreview, setShowPreview] = useState(false);

  // API rute: app/api/variants/[id]/route.ts
  const updateVariantLang = async (id: string, lang: string) => {
    try {
      const res = await fetch(`/api/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Fejl ved opdatering af sprog:", error);
    }
  };

  const addVariant = async () => {
    if (!newTitle) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedId: embed.id, lang: newLang, title: newTitle }),
      });
      
      if (res.ok) {
        // --- LOG TIL AUDIT SYSTEMET ---
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "OPRET_VARIANT",
            target: `Variant: ${newTitle} (${newLang.toUpperCase()}) til projekt: ${embed.name}`
          })
        });
        // ------------------------------

        setNewTitle("");
        router.refresh();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const deleteVariant = async (id: string, title: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${title}"?`)) return;
    try {
      const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        // --- LOG TIL AUDIT SYSTEMET ---
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SLET_VARIANT",
            target: `Slettede variant: ${title} fra projekt: ${embed.name}`
          })
        });
        // ------------------------------

        router.refresh();
      }
    } catch (error) {
      console.error("Fejl:", error);
    }
  };

  const trackView = async (variantId: string) => {
    try {
      // Kalder API ruten i app/api/analytics/view/route.ts
      await fetch(`/api/analytics/view`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ variantId }) 
      });
    } catch (error) {
      console.error("Fejl ved tracking:", error);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{embed.name}</h1>
          <p className="text-gray-400 font-medium mt-1 italic text-sm">Project ID: {embed.id}</p>
        </div>
        <button 
          onClick={() => setShowPreview(true)} 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 4.5 12 4.5c4.348 0 8.331 4 9.964 7.178.07.133.07.291 0 .424C20.33 15.5 16.348 19.5 12 19.5c-4.348 0-8.331-4-9.964-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          Preview Player
        </button>
      </div>

      {/* DEL PROJEKT BOKS */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Del dette projekt</h3>
        <EmbedCodeGenerator projectId={embed.id} projectTitle={embed.name} />
      </div>

      {/* OPRET NY VERSION */}
      <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-[0.2em]">Opret ny sprogversion</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-600 ml-1">Vælg sprog</label>
            <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="p-3.5 rounded-2xl border border-blue-200 bg-white text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 min-w-[180px]">
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[250px] flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-600 ml-1">Titel</label>
            <input type="text" placeholder="F.eks. Dansk tale..." className="p-3.5 rounded-2xl border border-blue-200 text-black font-medium outline-none focus:ring-2 focus:ring-blue-400" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={addVariant} disabled={isAdding || !newTitle} className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-black hover:bg-blue-700 transition shadow-lg disabled:opacity-40">
              {isAdding ? "Opretter..." : "Opret Variant"}
            </button>
          </div>
        </div>
      </div>

      {/* VARIANTER */}
      <div className="space-y-12">
        {embed.groups?.map((group: any) => (
          <div key={group.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <h2 className="font-black text-gray-300 uppercase text-[10px] tracking-[0.3em]">Gruppe: {group.name}</h2>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {[...group.variants].sort((a, b) => a.title.localeCompare(b.title)).map((v: any) => (
                <div key={v.id} className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all">
                  <button onClick={() => deleteVariant(v.id, v.title)} className="absolute top-6 right-6 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="flex flex-col gap-1">
                    <select value={v.lang} onChange={(e) => updateVariantLang(v.id, e.target.value)} className="w-fit text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer appearance-none">
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.code.toUpperCase()} VERSION</option>
                      ))}
                    </select>
                    <h4 className="font-black text-xl text-gray-900 mt-2">{v.title}</h4>
                  </div>

                  <div className="aspect-video bg-gray-100 rounded-[1.5rem] overflow-hidden shadow-inner border border-gray-50 flex items-center justify-center relative">
                    {v.muxPlaybackId ? (
                      <MuxPlayer playbackId={v.muxPlaybackId} className="w-full h-full object-contain" onPlay={() => trackView(v.id)} />
                    ) : (
                      <MuxVideoUploader variantId={v.id} onUploadSuccess={() => router.refresh()} />
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl text-[9px] font-bold text-gray-400 uppercase">
                    <div>ID: <span className="font-mono">{v.id}</span></div>
                    <div className="text-gray-900">{v.views?.toLocaleString() || 0} visninger</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl mx-4 z-10 overflow-hidden rounded-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full transition-all border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <iframe src={`/embed/${embed.id}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}