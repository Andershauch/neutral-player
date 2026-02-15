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
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "OPRET_VARIANT",
            target: `Variant: ${newTitle} (${newLang.toUpperCase()}) til projekt: ${embed.name}`
          })
        });

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
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SLET_VARIANT",
            target: `Slettede variant: ${title} fra projekt: ${embed.name}`
          })
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Fejl:", error);
    }
  };

  const trackView = async (variantId: string) => {
    try {
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
    <div className="space-y-6 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">{embed.name}</h1>
          <p className="text-gray-400 font-medium mt-1 italic text-xs md:text-sm">Project ID: {embed.id}</p>
        </div>
        <button 
          onClick={() => setShowPreview(true)} 
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 4.5 12 4.5c4.348 0 8.331 4 9.964 7.178.07.133.07.291 0 .424C20.33 15.5 16.348 19.5 12 19.5c-4.348 0-8.331-4-9.964-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          Preview Player
        </button>
      </div>

      {/* DEL PROJEKT BOKS */}
      <div className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <h3 className="text-sm md:text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Del dette projekt</h3>
        <EmbedCodeGenerator projectId={embed.id} projectTitle={embed.name} />
      </div>

      {/* OPRET NY VERSION */}
      <div className="bg-blue-50 border border-blue-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-[0.2em]">Opret ny sprogversion</h3>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Vælg sprog</label>
            <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="w-full p-3.5 rounded-2xl border border-blue-100 bg-white text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 md:min-w-[180px] appearance-none">
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-2 w-full">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Titel</label>
            <input type="text" placeholder="F.eks. Dansk tale..." className="w-full p-3.5 rounded-2xl border border-blue-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div className="flex items-end w-full md:w-auto">
            <button onClick={addVariant} disabled={isAdding || !newTitle} className="w-full bg-blue-600 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg disabled:opacity-40 active:scale-[0.98]">
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
              <h2 className="font-black text-gray-300 uppercase text-[10px] tracking-[0.3em] whitespace-nowrap">Gruppe: {group.name}</h2>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {[...group.variants].sort((a, b) => a.title.localeCompare(b.title)).map((v: any) => (
                <div key={v.id} className="group relative bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all">
                  <button 
                    onClick={() => deleteVariant(v.id, v.title)} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="flex flex-col gap-1">
                    <select value={v.lang} onChange={(e) => updateVariantLang(v.id, e.target.value)} className="w-fit text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer appearance-none tracking-widest">
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.code.toUpperCase()} VERSION</option>
                      ))}
                    </select>
                    <h4 className="font-black text-lg md:text-xl text-gray-900 mt-2 tracking-tight uppercase">{v.title}</h4>
                  </div>

                  <div className="aspect-video bg-gray-100 rounded-[1.5rem] overflow-hidden shadow-inner border border-gray-50 flex items-center justify-center relative">
                    {v.muxPlaybackId ? (
                      <MuxPlayer playbackId={v.muxPlaybackId} className="w-full h-full object-contain" onPlay={() => trackView(v.id)} />
                    ) : (
                      <MuxVideoUploader 
  onUploadSuccess={async (uploadId: string) => {
    // Vi kalder nu den almindelige variant-rute med uploadId
    const res = await fetch(`/api/variants/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }), // Vi sender uploadId i stedet for lang
    });

    if (res.ok) {
      router.refresh(); // Dette tvinger Next.js til at hente de nye Mux-id'er
    }
  }} 
/>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 p-4 rounded-2xl gap-2 sm:gap-0">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">ID: <span className="font-mono">{v.id.slice(0, 8)}...</span></div>
                    <div className="text-[9px] font-black text-gray-900 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-gray-100">{v.views?.toLocaleString() || 0} visninger</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl z-10 overflow-hidden rounded-[2rem] border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2.5 rounded-full transition-all border border-white/10 active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <iframe src={`/embed/${embed.id}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}