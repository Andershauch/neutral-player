"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VideoUploader from "@/components/admin/MuxUploader";
import MuxPlayer from "@mux/mux-player-react";

export default function EmbedEditor({ embed }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- STATE TIL MODALS (Preview & Embed Code) ---
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  // --- FUNKTIONER ---

  // 1. Generer Embed Kode
  const generateEmbedCode = () => {
    // Vi finder det nuværende domæne (fx localhost eller dit-site.com)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/embed/${embed.id}`;
    
    const code = `<iframe 
  src="${url}" 
  width="100%" 
  height="600" 
  frameBorder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowFullScreen
></iframe>`;
    
    setEmbedCode(code);
    setShowEmbedCode(true);
  };

  // 2. Håndter Video Preview (Henter Playback ID fra API)
  const handlePreview = async (uploadId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/get-playback-id?uploadId=${uploadId}`);
      const data = await res.json();
      
      if (data.playbackId) {
        setPreviewId(data.playbackId);
      } else {
        alert("Videoen behandles stadig hos Mux (eller er ikke klar). Prøv igen om lidt.");
      }
    } catch (e) {
      console.error(e);
      alert("Kunne ikke hente videoen.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // 3. Slet Hele Titlen (Group)
  const deleteGroup = async (groupId: string) => {
    if (!confirm("Er du sikker på, at du vil slette hele denne titel og alle dens sprog?")) return;
    setLoading(true);
    try {
      await fetch(`/api/delete?type=group&id=${groupId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      alert("Fejl ved sletning");
    } finally {
      setLoading(false);
    }
  };

  // 4. Slet Variant (Sprog)
  const deleteVariant = async (variantId: string) => {
    if (!confirm("Slet denne sprogversion?")) return;
    try {
      await fetch(`/api/delete?type=variant&id=${variantId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      alert("Fejl ved sletning");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <Link href="/admin" className="text-gray-500 hover:text-gray-800 mb-2 inline-block text-sm">← Tilbage til oversigt</Link>
           <h1 className="text-3xl font-bold text-gray-800">{embed.name}</h1>
           <p className="text-gray-500 text-sm mt-1">ID: {embed.id}</p>
        </div>
        
        {/* KNAPPER I TOPPEN */}
        <div className="flex gap-2">
            <button
                onClick={generateEmbedCode}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
                <span>📋</span> Hent Embed Kode
            </button>
            
            <Link 
                href={`/embed/${embed.id}`} 
                target="_blank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
                Åbn Public Player ↗
            </Link>
        </div>
      </div>

      {/* CONTENT LIST (Grupper) */}
      <div className="space-y-6">
        {embed.groups.map((group: any) => (
          <VideoGroupCard 
            key={group.id} 
            group={group} 
            onDeleteGroup={deleteGroup}
            onDeleteVariant={deleteVariant}
            onPreview={handlePreview} // Vi sender preview-funktionen ned til kortet
            loading={loading}
            isLoadingPreview={isLoadingPreview}
          />
        ))}

        {embed.groups.length === 0 && (
            <div className="p-10 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                Du har ikke oprettet nogen videotitler endnu. Start ovenfor.
            </div>
        )}
      </div>

      {/* --- MODAL: VIDEO PREVIEW --- */}
      {previewId && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="bg-black rounded-lg overflow-hidden max-w-5xl w-full shadow-2xl ring-1 ring-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-3 bg-gray-900 text-white border-b border-gray-800">
              <span className="text-sm font-medium pl-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Preview
              </span>
              <button onClick={() => setPreviewId(null)} className="text-gray-400 hover:text-white px-2">Luk ✕</button>
            </div>
            <MuxPlayer
              streamType="on-demand"
              playbackId={previewId}
              metadata={{ video_title: "Admin Preview" }}
              autoPlay
              accentColor="#2563eb"
              className="w-full aspect-video"
            />
          </div>
        </div>
      )}

      {/* --- MODAL: EMBED CODE --- */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEmbedCode(false)}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl transform transition-all" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-gray-800">Din Embed Kode</h3>
            <p className="text-sm text-gray-500 mb-4">Kopier koden herunder og indsæt den på din hjemmeside (Wordpress, Webflow, custom site etc.).</p>
            
            <div className="relative group">
                <textarea 
                readOnly 
                value={embedCode}
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded font-mono text-xs text-gray-600 focus:outline-none resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button 
                onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    alert("Koden er kopieret til udklipsholderen!");
                }}
                className="absolute top-2 right-2 bg-white border border-gray-200 shadow-sm px-3 py-1 text-xs rounded font-bold hover:bg-gray-50 text-gray-700 transition-all opacity-0 group-hover:opacity-100"
                >
                Kopier
                </button>
            </div>

            <div className="mt-4 flex justify-end">
                <button onClick={() => setShowEmbedCode(false)} className="text-gray-500 hover:text-black text-sm font-medium px-4 py-2">Luk</button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}

// --- SUB-COMPONENT: GROUP CARD ---
// Denne komponent håndterer visningen af hver enkelt videotitel og dens varianter
function VideoGroupCard({ group, onDeleteGroup, onDeleteVariant, onPreview, loading, isLoadingPreview }: any) {
  const router = useRouter();
  const [lang, setLang] = useState("da");
  const [mode, setMode] = useState<'upload' | 'url'>('upload'); 
  const [urlInput, setUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Upload (Mux)
  const handleUploadSuccess = async (uploadId: string) => {
    setIsSaving(true);
    await saveVariant({ groupId: group.id, lang, muxUploadId: uploadId });
  };

  // URL (Link)
  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return alert("Husk at skrive en URL");
    setIsSaving(true);
    await saveVariant({ groupId: group.id, lang, dreamBrokerUrl: urlInput });
    setUrlInput(""); 
  };

  const saveVariant = async (payload: any) => {
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Fejl ved oprettelse");
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert("Der skete en fejl.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 rounded">#{group.sortOrder}</span>
          <h3 className="font-semibold text-gray-800">{group.name}</h3>
          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
            ?video={group.slug}
          </span>
        </div>
        <button 
          onClick={() => onDeleteGroup(group.id)}
          disabled={loading}
          className="text-gray-400 hover:text-red-600 text-xs font-medium uppercase tracking-wide transition-colors"
        >
          Slet Titel
        </button>
      </div>

      {/* Variants List */}
      <div className="p-4">
        <table className="min-w-full mb-4">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16 py-2 pl-2">Sprog</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider py-2">Indhold / Preview</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {group.variants.map((v: any) => (
              <tr key={v.id} className="group/row">
                <td className="py-3 pl-2 text-sm font-bold text-gray-700 uppercase align-middle">{v.lang}</td>
                <td className="py-3 text-sm text-gray-600 align-middle">
                  {v.muxUploadId ? (
                    // KNAP: PREVIEW VIDEO
                    <button 
                      onClick={() => onPreview(v.muxUploadId)}
                      disabled={isLoadingPreview}
                      className="text-green-700 bg-green-50 px-3 py-1.5 rounded-md text-xs border border-green-100 flex items-center gap-2 hover:bg-green-100 hover:border-green-300 transition-all font-medium"
                    >
                      {isLoadingPreview ? '⏳' : '▶️'} Afspil Video
                    </button>
                  ) : (
                    // LINK: URL VISNING
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">URL Link</span>
                      <a 
                        href={v.dreamBrokerUrl} 
                        target="_blank" 
                        className="text-blue-600 hover:underline truncate max-w-sm block font-medium"
                      >
                        {v.dreamBrokerUrl || "Ingen URL"}
                      </a>
                    </div>
                  )}
                </td>
                <td className="py-3 text-right align-middle">
                  <button 
                    onClick={() => onDeleteVariant(v.id)}
                    className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                    title="Slet variant"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {group.variants.length === 0 && (
               <tr><td colSpan={3} className="py-6 text-center text-sm text-gray-400 italic">Ingen videoer tilføjet endnu.</td></tr>
            )}
          </tbody>
        </table>

        {/* --- TILFØJ NY VARIANT --- */}
        <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 mt-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Tilføj ny variant</h4>
            
            <div className="flex flex-col gap-4">
                {/* 1. Vælg Sprog og Type */}
                <div className="flex flex-wrap gap-4 items-center">
                   <select 
                        value={lang} 
                        onChange={e => setLang(e.target.value)}
                        className="block w-32 border-gray-300 rounded-md shadow-sm py-1.5 pl-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {['da', 'en', 'de', 'pl', 'uk', 'fa', 'ar', 'sv', 'no', 'fi', 'fr', 'es'].map(l => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                    </select>

                    <div className="flex bg-gray-200 rounded p-1 text-xs font-medium">
                      <button 
                        onClick={() => setMode('upload')}
                        className={`px-3 py-1 rounded transition-all ${mode === 'upload' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Upload Fil
                      </button>
                      <button 
                         onClick={() => setMode('url')}
                         className={`px-3 py-1 rounded transition-all ${mode === 'url' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Indsæt URL
                      </button>
                    </div>
                </div>

                {/* 2. Input feltet (Skifter baseret på mode) */}
                {isSaving ? (
                    <div className="text-blue-600 text-sm animate-pulse flex gap-2 items-center bg-blue-50 p-3 rounded border border-blue-100">
                       <span className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                       Gemmer og opdaterer...
                    </div>
                ) : (
                    mode === 'upload' ? (
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <VideoUploader onUploadSuccess={handleUploadSuccess} />
                        </div>
                    ) : (
                        <form onSubmit={handleSaveUrl} className="flex gap-2">
                          <input 
                            type="url" 
                            placeholder="https://..." 
                            required
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="flex-1 border-gray-300 rounded-md text-sm p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <button 
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Gem Link
                          </button>
                        </form>
                    )
                )}
            </div>
        </div>

      </div>
    </div>
  );
}