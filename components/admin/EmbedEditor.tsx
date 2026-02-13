"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Her bruger vi det korrekte filnavn fra dit projekt:
import VideoUploader from "@/components/admin/MuxUploader";
import MuxPlayer from "@mux/mux-player-react";

interface EmbedEditorProps {
  embed: any; // Du kan definere en strammere type her senere
}

export default function EmbedEditor({ embed }: EmbedEditorProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState(embed.allowedDomains || "");
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const groups = embed.groups?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [];

  // Funktion til at gemme domæne-indstillinger
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/embeds/${embed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedDomains }),
      });
      if (!res.ok) throw new Error("Kunne ikke gemme");
      router.refresh();
    } catch (error) {
      alert("Fejl ved gem: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateEmbedCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const code = `
<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:8px;background:#000;">
  <iframe 
    src="${origin}/embed/${embed.id}" 
    loading="lazy"
    style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen
    title="${embed.name}">
  </iframe>
</div>`.trim();
    setEmbedCode(code);
    setShowEmbedCode(true);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-5xl mx-auto pb-20 p-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-800 mb-2 inline-block text-sm">
            ← Tilbage til oversigt
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{embed.name}</h1>
          <p className="text-gray-500 text-sm">Projekt ID: {embed.id}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateEmbedCode} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
            <span>📋</span> Hent Embed Kode
          </button>
          <Link href={`/embed/${embed.id}`} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
            Åbn Public Player ↗
          </Link>
        </div>
      </div>

      {/* SIKKERHED: DOMÆNE WHITELISTING */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          🛡️ Domæne-sikkerhed
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Indtast de domæner, der må vise denne video (adskilt med komma). 
          Brug <code className="bg-gray-100 px-1 font-bold">*</code> for at tillade alle.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="f.eks. roskilde.dk, slagelse.dk"
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
          />
          <button 
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isSaving ? "Gemmer..." : "Gem Domæner"}
          </button>
        </div>
      </div>

      {/* GRUPPER & VIDEOER */}
      <div className="space-y-6">
        {groups.map((group: any) => (
          <div key={group.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">{group.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.variants?.map((v: any) => (
                <div key={v.id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-gray-500">{v.lang}</span>
                    <span className="text-xs text-blue-600 font-medium">👁️ {v.views} visninger</span>
                  </div>
                  <p className="text-sm font-semibold mb-3">{v.title || "Ingen titel"}</p>
                  
                  {v.muxPlaybackId ? (
                    <div className="aspect-video bg-black rounded overflow-hidden">
                      <MuxPlayer
                        playbackId={v.muxPlaybackId}
                        metadataVideoTitle={v.title}
                        streamType="on-demand"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-4">
                       <VideoUploader onUploadSuccess={() => router.refresh()} />
                       <p className="text-[10px] text-gray-400 mt-2 text-center text-pretty">
                         Video mangler - upload en fil for at generere Playback ID
                       </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: EMBED CODE */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEmbedCode(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Din Embed Kode</h2>
            <textarea 
              readOnly 
              value={embedCode} 
              className="w-full h-40 p-4 bg-gray-900 text-blue-300 rounded-lg font-mono text-xs border border-gray-700 mb-4" 
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => {
                navigator.clipboard.writeText(embedCode);
                alert("Kopieret!");
              }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Kopier</button>
              <button onClick={() => setShowEmbedCode(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm font-bold">Luk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}