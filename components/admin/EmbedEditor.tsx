"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MuxUploader from "@/components/admin/MuxUploader";
import MuxPlayer from "@mux/mux-player-react";

interface EmbedEditorProps {
  embed: any;
}

export default function EmbedEditor({ embed }: EmbedEditorProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [newLang, setNewLang] = useState("da");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Domæne-staten
  const [allowedDomains, setAllowedDomains] = useState(embed.allowedDomains || "");
  const [isSavingDomains, setIsSavingDomains] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // FUNKTION: Gem domæne-indstillinger
  const saveDomains = async () => {
    setIsSavingDomains(true);
    try {
      const res = await fetch(`/api/embeds/${embed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedDomains }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch (error) {
      alert("Kunne ikke gemme domæner");
    } finally {
      setIsSavingDomains(false);
    }
  };

  const handleRefreshId = async (variantId: string) => {
    try {
      const res = await fetch(`/api/variants/${variantId}/refresh`, { method: "POST" });
      if ((await res.json()).success) router.refresh();
    } catch (err) {
      alert("Synkronisering fejlede");
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
      if (res.ok) { setNewTitle(""); router.refresh(); }
    } finally { setIsAdding(false); }
  };

  if (!isMounted) return null;

  const groups = embed.groups || [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900">{embed.name}</h1>
          <p className="text-gray-500 text-sm">Administrer sikkerhed og videoversioner</p>
        </div>
      </div>

      {/* 🛡️ DOMÆNE SIKKERHED (Genindført) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">🛡️ Domæne-sikkerhed</h3>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="f.eks. roskilde.dk, slagelse.dk (adskil med komma)"
            className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={saveDomains}
            disabled={isSavingDomains}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isSavingDomains ? "Gemmer..." : "Gem"}
          </button>
        </div>
      </div>

      {/* + TILFØJ VARIANT FORM */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-blue-800 uppercase mb-4 tracking-widest">Tilføj ny sprogversion</h3>
        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            placeholder="Navn på version (f.eks. Engelsk tale)" 
            className="flex-1 min-w-[200px] p-3 rounded-xl border border-blue-200"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button 
            onClick={addVariant}
            disabled={isAdding || !newTitle}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            {isAdding ? "Opretter..." : "Opret Variant"}
          </button>
        </div>
      </div>

      {/* VARIANTER LISTE */}
      <div className="grid grid-cols-1 gap-8">
        {groups.map((group: any) => (
          <div key={group.id} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">{group.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {group.variants.map((v: any) => (
                <div key={v.id} className="relative">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter bg-gray-100 px-2 py-0.5 rounded">
                      {v.lang}
                    </span>
                    <span className="text-[10px] font-bold text-blue-500">👁️ {v.views}</span>
                  </div>

                  <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative group/video">
                    {v.muxPlaybackId ? (
                      <>
                        <MuxPlayer
                          playbackId={v.muxPlaybackId}
                          style={{ width: '100%', height: '100%' }}
                        />
                        {/* 🎭 OVERLAY FOR LYDVERSION (Genindført) */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/video:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                           <p className="text-white text-[10px] font-bold uppercase mb-2 opacity-70">Skift sprogversion</p>
                           <div className="flex flex-wrap gap-2 justify-center">
                              {group.variants.map((otherV: any) => (
                                <button 
                                  key={otherV.id}
                                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${otherV.id === v.id ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/40'}`}
                                >
                                  {otherV.lang.toUpperCase()}
                                </button>
                              ))}
                           </div>
                        </div>
                      </>
                    ) : v.muxUploadId ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
                        <button onClick={() => handleRefreshId(v.id)} className="text-[10px] text-blue-400 font-bold hover:underline">SYNKRONISER</button>
                      </div>
                    ) : (
                      <MuxUploader variantId={v.id} onUploadSuccess={() => router.refresh()} />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-700">{v.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}