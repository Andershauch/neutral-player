"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// 1. Vi importerer vores Uploader og Server Action
import VideoUploader from "@/components/admin/MuxUploader"; 
import { createVariant } from "@/app/actions/gem-video";

type EmbedData = any;

export default function EmbedEditor({ embed }: { embed: EmbedData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Local state til "Ny Gruppe" formen
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupSlug, setNewGroupSlug] = useState("");

  // --- HANDLERS ---

  // 1. Slet en hel gruppe (Titel)
  const deleteGroup = async (groupId: string) => {
    if (!confirm("Er du sikker? Dette sletter titlen og alle dens sprogvarianter.")) return;
    setLoading(true);
    await fetch(`/api/delete?type=group&id=${groupId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  // 2. Slet en enkelt variant (Sprog)
  const deleteVariant = async (variantId: string) => {
    if (!confirm("Slet denne sprogversion?")) return;
    setLoading(true);
    await fetch(`/api/delete?type=variant&id=${variantId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  // 3. Opret ny Gruppe
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        embedId: embed.id,
        title: newGroupTitle,
        slug: newGroupSlug,
      })
    });
    
    if (res.ok) {
      setNewGroupTitle("");
      setNewGroupSlug("");
      router.refresh();
    } else {
      alert("Fejl: Slug findes måske allerede?");
    }
    setLoading(false);
  };

  // (Vi bruger ikke længere handleAddVariant manuelt, da vi bruger createVariant server action direkte i kortet)

  // --- RENDER ---

  return (
    <div className="space-y-8">
      
      {/* HEADER: Embed Info */}
      <div className="bg-white shadow rounded-lg p-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link> 
            <span>/</span>
            <span>Edit Embed</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{embed.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Default Sprog: <span className="font-mono bg-gray-100 px-1 rounded">{embed.defaultLang}</span>
            <span className="mx-2">•</span>
            Public ID: <code className="text-xs bg-gray-100 px-1 rounded">{embed.id}</code>
          </p>
        </div>
        <a 
          href={`/embed/${embed.id}`} 
          target="_blank" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          Åbn Public Player ↗
        </a>
      </div>

      {/* LISTE AF VIDEO GRUPPER */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Video Titler (Groups)</h2>
        
        {embed.groups.length === 0 && (
          <p className="text-gray-500 italic">Ingen titler endnu.</p>
        )}

        {embed.groups.map((group: any) => (
          <VideoGroupCard 
            key={group.id} 
            group={group} 
            onDeleteGroup={deleteGroup}
            onDeleteVariant={deleteVariant}
            loading={loading}
          />
        ))}
      </div>

      {/* FORM: OPRET NY GRUPPE */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Tilføj ny Video Titel</h3>
        <form onSubmit={handleAddGroup} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase">Titel (Menu tekst)</label>
            <input 
              type="text" 
              required
              value={newGroupTitle}
              onChange={e => {
                setNewGroupTitle(e.target.value);
                if (!newGroupSlug) {
                  setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              placeholder="Fx. Introduktion"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="w-48">
             <label className="block text-xs font-medium text-gray-500 uppercase">Slug (?video=...)</label>
             <input 
              type="text" 
              required
              value={newGroupSlug}
              onChange={e => setNewGroupSlug(e.target.value)}
              placeholder="introduktion"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-900 disabled:opacity-50"
          >
            Opret Titel
          </button>
        </form>
      </div>

    </div>
  );
}

// --- SUB-COMPONENT: GROUP CARD MED UPLOADER ---
function VideoGroupCard({ group, onDeleteGroup, onDeleteVariant, loading }: any) {
  const router = useRouter();
  const [lang, setLang] = useState("da");
  // Vi har ikke længere brug for URL state, da vi uploader filer
  const [isUploading, setIsUploading] = useState(false);

  // Denne funktion kaldes når Mux er færdig med upload
  const handleUploadSuccess = async (uploadId: string) => {
    setIsUploading(true);
    // Kald server action
    await createVariant(group.id, lang, uploadId);
    router.refresh();
    setIsUploading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400">#{group.sortOrder}</span>
          <h3 className="font-semibold text-gray-800">{group.title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-mono">
            ?video={group.slug}
          </span>
        </div>
        <button 
          onClick={() => onDeleteGroup(group.id)}
          disabled={loading}
          className="text-red-600 hover:text-red-800 text-xs font-medium"
        >
          Slet Titel
        </button>
      </div>

      {/* Variants List */}
      <div className="p-4">
        <table className="min-w-full mb-4">
          <thead className="bg-white">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sprog</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {group.variants.map((v: any) => (
              <tr key={v.id}>
                <td className="py-2 text-sm font-medium text-gray-900 uppercase">{v.lang}</td>
                <td className="py-2 text-sm text-gray-500 truncate max-w-xs">
                    {/* Vis om det er en Upload (Mux) eller Link */}
                    {v.muxUploadId ? 
                        <span className="text-green-600 flex items-center gap-1">🎥 Mux Upload <span className="text-xs bg-gray-100 px-1 rounded">{v.muxUploadId.slice(0,6)}...</span></span> 
                        : 
                        <span className="text-blue-600">🔗 {v.dreamBrokerUrl}</span>
                    }
                </td>
                <td className="py-2 text-right">
                  <button 
                    onClick={() => onDeleteVariant(v.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Slet variant"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {group.variants.length === 0 && (
               <tr><td colSpan={3} className="py-2 text-sm text-gray-400 italic">Ingen sprogversioner tilføjet endnu.</td></tr>
            )}
          </tbody>
        </table>

        {/* --- NY UPLOAD SEKTION (Erstatter den gamle input form) --- */}
        <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-300 mt-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Upload ny version</h4>
            
            <div className="flex flex-col gap-3">
                {/* 1. Vælg Sprog */}
                <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-16">Sprog:</label>
                    <select 
                        value={lang} 
                        onChange={e => setLang(e.target.value)}
                        className="block w-32 border-gray-300 rounded-md shadow-sm py-1.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {['da', 'en', 'de', 'pl', 'uk', 'fa', 'ar', 'sv', 'no'].map(l => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Upload boks */}
                {isUploading ? (
                    <div className="text-blue-600 text-sm animate-pulse">Gemmer i databasen...</div>
                ) : (
                    <VideoUploader onUploadSuccess={handleUploadSuccess} />
                )}
            </div>
        </div>

      </div>
    </div>
  );
}