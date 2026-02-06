"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VideoUploader from "@/components/admin/MuxUploader";
import MuxPlayer from "@mux/mux-player-react";

export default function EmbedEditor({ embed }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- STATE TIL OPRET NY TITEL ---
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // --- STATE TIL MODALS ---
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  // --- FUNKTIONER ---

  // 1. Opret Ny Titel (Gruppe)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;

    setIsCreatingGroup(true);
    try {
      // Vi laver automatisk en "slug" (URL-venlig tekst) ud fra titlen
      // F.eks. "Min Video" -> "min-video"
      const slug = newGroupTitle
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'oe')
        .replace(/å/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-') // Erstat specialtegn med bindestreg
        .replace(/(^-|-$)+/g, '');   // Fjern bindestreger i start/slut

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            title: newGroupTitle,
            slug: slug,
            embedId: embed.id 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Kunne ikke oprette titel");
      } else {
        setNewGroupTitle(""); // Tøm feltet
        router.refresh(); // Opdater siden så den nye boks vises
      }
    } catch (error) {
      console.error(error);
      alert("Der skete en fejl");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // 2. Generer Embed Kode
  const generateEmbedCode = () => {
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

  // 3. Preview & Slet (Som før)
  const handlePreview = async (uploadId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/get-playback-id?uploadId=${uploadId}`);
      const data = await res.json();
      if (data.playbackId) setPreviewId(data.playbackId);
      else alert("Videoen behandles stadig hos Mux. Prøv igen om lidt.");
    } catch (e) {
      alert("Kunne ikke hente videoen.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Er du sikker på, at du vil slette hele denne titel?")) return;
    setLoading(true);
    try {
      await fetch(`/api/delete?type=group&id=${groupId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) { alert("Fejl ved sletning"); } finally { setLoading(false); }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Slet denne sprogversion?")) return;
    try {
      await fetch(`/api/delete?type=variant&id=${variantId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) { alert("Fejl ved sletning"); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-800 mb-2 inline-block text-sm">← Tilbage til oversigt</Link>
           <h1 className="text-3xl font-bold text-gray-800">{embed.name}</h1>
           <p className="text-gray-500 text-sm mt-1">ID: {embed.id}</p>
        </div>
        
        <div className="flex gap-2">
            <button onClick={generateEmbedCode} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                <span>📋</span> Hent Embed Kode
            </button>
            <Link href={`/embed/${embed.id}`} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                Åbn Public Player ↗
            </Link>
        </div>
      </div>

      {/* --- OPRET NY TITEL SEKTION (NY) --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Opret Ny Titel</h2>
        <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titel Navn</label>
                <input 
                    type="text" 
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    placeholder="F.eks. 'Intro', 'Del 1', 'Velkomst'..."
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>
            <button 
                type="submit" 
                disabled={isCreatingGroup || !newGroupTitle}
                className="bg-black text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isCreatingGroup ? "Opretter..." : "+ Opret Titel"}
            </button>
        </form>
      </div>

      {/* CONTENT LIST (Grupper) */}
      <div className="space-y-6">
        {embed.groups.map((group: any) => (
          <VideoGroupCard 
            key={group.id} 
            group={group} 
            onDeleteGroup={deleteGroup}
            onDeleteVariant={deleteVariant}
            onPreview={handlePreview} 
            loading={loading}
            isLoadingPreview={isLoadingPreview}
          />
        ))}

        {embed.groups.length === 0 && (
            <div className="p-10 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                <p>Der er ingen titler endnu.</p>
                <p className="text-sm mt-2">Brug boksen ovenfor til at oprette din første videotitel.</p>
            </div>
        )}
      </div>

      {/* --- MODALS (Samme som før) --- */}
      {previewId && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="bg-black rounded-lg overflow-hidden max-w-5xl w-full shadow-2xl ring-1 ring-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-3 bg-gray-900 text-white border-b border-gray-800">
              <span className="text-sm font-medium pl-2">Preview</span>
              <button onClick={() => setPreviewId(null)} className="text-gray-400 hover:text-white px-2">✕</button>
            </div>
            <MuxPlayer streamType="on-demand" playbackId={previewId} autoPlay className="w-full aspect-video" />
          </div>
        </div>
      )}

      {showEmbedCode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEmbedCode(false)}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Din Embed Kode</h3>
            <div className="relative group">
                <textarea readOnly value={embedCode} className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded font-mono text-xs text-gray-600 resize-none" />
                <button onClick={() => navigator.clipboard.writeText(embedCode)} className="absolute top-2 right-2 bg-white border border-gray-200 px-3 py-1 text-xs rounded font-bold hover:bg-gray-50">Kopier</button>
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setShowEmbedCode(false)} className="text-gray-500 hover:text-black text-sm">Luk</button></div>
            </div>
        </div>
        )}
    </div>
  );
}

function VideoGroupCard({ group, onDeleteGroup, onDeleteVariant, onPreview, loading, isLoadingPreview }: any) {
    const router = useRouter();
    const [lang, setLang] = useState("da");
    const [titleInput, setTitleInput] = useState(""); // NY STATE TIL TITEL
    const [mode, setMode] = useState<'upload' | 'url'>('upload'); 
    const [urlInput, setUrlInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
  
    // Hjælpefunktion der sender data til API
    const saveVariant = async (payload: any) => {
      try {
        const res = await fetch('/api/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // HER SENDER VI TITLEN MED:
          body: JSON.stringify({ ...payload, title: titleInput }) 
        });
  
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Fejl ved oprettelse");
        } else {
          // Nulstil felter
          setTitleInput("");
          setUrlInput("");
          router.refresh();
        }
      } catch (e) {
        console.error(e);
        alert("Der skete en fejl.");
      } finally {
        setIsSaving(false);
      }
    };

    const handleUploadSuccess = async (uploadId: string) => {
      setIsSaving(true);
      await saveVariant({ groupId: group.id, lang, muxUploadId: uploadId });
    };
  
    const handleSaveUrl = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!urlInput) return alert("Husk at skrive en URL");
      setIsSaving(true);
      await saveVariant({ groupId: group.id, lang, dreamBrokerUrl: urlInput });
    };
  
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 rounded">#{group.sortOrder}</span>
            <h3 className="font-semibold text-gray-800">{group.name}</h3>
          </div>
          <button onClick={() => onDeleteGroup(group.id)} disabled={loading} className="text-gray-400 hover:text-red-600 text-xs font-medium uppercase tracking-wide transition-colors">Slet Titel</button>
        </div>
  
        <div className="p-4">
          <table className="min-w-full mb-4">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16 py-2 pl-2">Sprog</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider py-2">Titel & Indhold</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.variants.map((v: any) => (
                <tr key={v.id} className="group/row">
                  <td className="py-3 pl-2 text-sm font-bold text-gray-700 uppercase align-middle">{v.lang}</td>
                  <td className="py-3 text-sm text-gray-600 align-middle">
                    
                    {/* VIS TITLEN HVIS DEN FINDES */}
                    {v.title && (
                        <div className="text-xs font-bold text-gray-800 mb-1" dir="auto">{v.title}</div>
                    )}

                    {v.muxUploadId ? (
                      <button onClick={() => onPreview(v.muxUploadId)} disabled={isLoadingPreview} className="text-green-700 bg-green-50 px-3 py-1.5 rounded-md text-xs border border-green-100 flex items-center gap-2 hover:bg-green-100 hover:border-green-300 transition-all font-medium">
                        {isLoadingPreview ? '⏳' : '▶️'} Afspil Video
                      </button>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">URL Link</span>
                        <a href={v.dreamBrokerUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-sm block font-medium">{v.dreamBrokerUrl || "Ingen URL"}</a>
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right align-middle">
                    <button onClick={() => onDeleteVariant(v.id)} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors">✕</button>
                  </td>
                </tr>
              ))}
              {group.variants.length === 0 && (
                 <tr><td colSpan={3} className="py-6 text-center text-sm text-gray-400 italic">Ingen videoer tilføjet endnu.</td></tr>
              )}
            </tbody>
          </table>
  
          {/* OPRET NY VARIANT FORM */}
          <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 mt-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Tilføj variant til "{group.name}"</h4>
              <div className="flex flex-col gap-4">
                  
                  {/* SPROG OG TYPE VÆLGER */}
                  <div className="flex flex-wrap gap-4 items-center">
                     <select value={lang} onChange={e => setLang(e.target.value)} className="block w-32 border-gray-300 rounded-md shadow-sm py-1.5 pl-3 text-sm">
                          {['da', 'en', 'de', 'pl', 'uk', 'fa', 'ar', 'sv', 'no', 'fi', 'fr', 'es'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                      </select>
                      <div className="flex bg-gray-200 rounded p-1 text-xs font-medium">
                        <button onClick={() => setMode('upload')} className={`px-3 py-1 rounded transition-all ${mode === 'upload' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>Upload Fil</button>
                        <button onClick={() => setMode('url')} className={`px-3 py-1 rounded transition-all ${mode === 'url' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>Indsæt URL</button>
                      </div>
                  </div>

                  {/* NYT FELT: TITEL INPUT */}
                  <input 
                    type="text" 
                    placeholder={`Titel på ${lang.toUpperCase()} (valgfri)`}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    dir="auto" // Dette gør at arabisk automatisk skriver fra højre mod venstre
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2"
                  />

                  {/* ACTION AREA */}
                  {isSaving ? (
                      <div className="text-blue-600 text-sm animate-pulse flex gap-2 items-center bg-blue-50 p-3 rounded border border-blue-100">Gemmer...</div>
                  ) : (
                      mode === 'upload' ? (
                          <div className="bg-white p-2 rounded border border-gray-200"><VideoUploader onUploadSuccess={handleUploadSuccess} /></div>
                      ) : (
                          <form onSubmit={handleSaveUrl} className="flex gap-2">
                            <input type="url" placeholder="https://..." required value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="flex-1 border-gray-300 rounded-md text-sm p-2 shadow-sm outline-none" />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Gem Link</button>
                          </form>
                      )
                  )}
              </div>
          </div>
        </div>
      </div>
    );
}