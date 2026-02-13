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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // FUNKTION: Hent Playback ID manuelt fra Mux (Vigtig lokalt!)
  const handleRefreshId = async (variantId: string) => {
    try {
      const res = await fetch(`/api/variants/${variantId}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || "Videoen er stadig under behandling hos Mux...");
      }
    } catch (err) {
      alert("Der skete en fejl ved synkronisering.");
    }
  };

  // FUNKTION: Opret ny variant
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
        setNewTitle("");
        router.refresh();
      }
    } catch (error) {
      console.error("Fejl ved oprettelse:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isMounted) return null;

  const groups = embed.groups || [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* PROJEKT NAVN */}
      <div className="border-b pb-6">
        <h1 className="text-4xl font-black text-gray-900">{embed.name}</h1>
        <p className="text-gray-500 text-sm mt-1">ID: {embed.id}</p>
      </div>

      {/* FORM: TILFØJ NY VARIANT */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-blue-800 uppercase mb-4 tracking-wider">Tilføj ny sprogversion</h3>
        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            placeholder="Titel (f.eks. Dansk Version)" 
            className="flex-1 min-w-[200px] p-3 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select 
            className="p-3 rounded-lg border border-blue-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
          >
            <option value="da">Dansk (DA)</option>
            <option value="en">English (EN)</option>
            <option value="de">Deutsch (DE)</option>
            <option value="no">Norsk (NO)</option>
            <option value="se">Svenska (SE)</option>
          </select>
          <button 
            onClick={addVariant}
            disabled={isAdding || !newTitle}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
          >
            {isAdding ? "Opretter..." : "+ Opret"}
          </button>
        </div>
      </div>

      {/* LISTE OVER EKSISTERENDE VARIANTER */}
      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400 font-medium">Ingen varianter endnu. Start ved at bruge formularen ovenfor.</p>
          </div>
        ) : (
          groups.map((group: any) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                📂 {group.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.variants.map((v: any) => (
                  <div key={v.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-white px-3 py-1 rounded-md text-xs font-black shadow-sm border border-gray-100">
                        {v.lang.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <span className="text-blue-600 text-[11px] font-bold block">👁️ {v.views} visninger</span>
                      </div>
                    </div>

                    <div className="flex-1 aspect-video bg-white rounded-lg border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative">
                      {v.muxPlaybackId ? (
                        /* VIDEO ER KLAR */
                        <MuxPlayer
  playbackId={v.muxPlaybackId}
  metadataVideoTitle={v.title}
  streamType="on-demand"
  style={{ width: '100%', height: '100%' }}
  onPlay={() => {
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: v.id }),
    }).catch(err => console.error("Kunne ikke sende analytics:", err));
  }}
/>
                      ) : v.muxUploadId ? (
                        /* UPLOADET MEN MANGLER ID (LOKAL TILSTAND) */
                        <div className="flex flex-col items-center text-center p-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-[11px] text-gray-500 mb-4 font-medium">Video fundet hos Mux, men mangler ID lokalt.</p>
                          <button 
                            onClick={() => handleRefreshId(v.id)}
                            className="bg-white text-blue-600 border border-blue-200 text-[10px] px-4 py-2 rounded-full font-black uppercase hover:bg-blue-50 transition shadow-sm"
                          >
                            🔄 Synkroniser nu
                          </button>
                        </div>
                      ) : (
                        /* INGEN VIDEO - VIS UPLOADER */
                        <div className="w-full p-4">
                          <MuxUploader variantId={v.id} onUploadSuccess={() => router.refresh()} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}