"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const deleteGroup = async (groupId: string) => {
    if (!confirm("Er du sikker? Dette sletter titlen og alle dens sprogvarianter.")) return;
    setLoading(true);
    await fetch(`/api/delete?type=group&id=${groupId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Slet denne sprogversion?")) return;
    setLoading(true);
    await fetch(`/api/delete?type=variant&id=${variantId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="space-y-10 pb-20">
      
      {/* HEADER: Embed Info */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            <Link href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link> 
            <span>/</span>
            <span className="text-gray-900">Edit Embed</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{embed.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <p className="text-xs font-bold text-gray-500">
              Default: <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase">{embed.defaultLang}</span>
            </p>
            <p className="text-xs font-bold text-gray-500">
              Public ID: <code className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 uppercase tracking-tighter">{embed.id}</code>
            </p>
          </div>
        </div>
        <a 
          href={`/embed/${embed.id}`} 
          target="_blank" 
          className="w-full md:w-auto text-center bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-[0.98]"
        >
          Åbn Public Player ↗
        </a>
      </div>

      {/* LISTE AF VIDEO GRUPPER */}
      <div className="space-y-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] px-2">Video Titler (Groups)</h2>
        
        {embed.groups.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center">
             <p className="text-gray-400 font-bold uppercase text-xs">Ingen titler endnu.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
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
      </div>

      {/* FORM: OPRET NY GRUPPE */}
      <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-[0.2em]">Tilføj ny Video Titel</h3>
        <form onSubmit={handleAddGroup} className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Titel (Menu tekst)</label>
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
              className="block w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-3">
             <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Slug (?video=...)</label>
             <input 
              type="text" 
              required
              value={newGroupSlug}
              onChange={e => setNewGroupSlug(e.target.value)}
              placeholder="introduktion"
              className="block w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-all"
            />
          </div>
          <div className="sm:col-span-3">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
            >
              Opret Titel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: GROUP CARD ---
function VideoGroupCard({ group, onDeleteGroup, onDeleteVariant, loading }: any) {
  const router = useRouter();
  const [lang, setLang] = useState("da");
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = async (uploadId: string) => {
    setIsUploading(true);
    await createVariant(group.id, lang, uploadId);
    router.refresh();
    setIsUploading(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Card Header */}
      <div className="bg-gray-50/50 px-6 sm:px-8 py-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] text-gray-300">#{group.sortOrder}</span>
          <h3 className="font-black text-gray-900 uppercase tracking-tight">{group.title}</h3>
          <span className="bg-blue-50 text-blue-600 text-[9px] px-3 py-1 rounded-full font-black tracking-widest border border-blue-100">
            ?VIDEO={group.slug.toUpperCase()}
          </span>
        </div>
        <button 
          onClick={() => onDeleteGroup(group.id)}
          disabled={loading}
          className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Slet Titel
        </button>
      </div>

      {/* Variants List Container */}
      <div className="p-6 sm:p-8">
        <div className="overflow-x-auto">
          <table className="min-w-full mb-6">
            <thead className="bg-white">
              <tr>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Sprog</th>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.variants.map((v: any) => (
                <tr key={v.id} className="group/row hover:bg-gray-50/50">
                  <td className="py-4 text-xs font-black text-blue-600 uppercase tracking-widest">{v.lang}</td>
                  <td className="py-4 text-xs font-bold text-gray-500">
                      {v.muxUploadId ? 
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          MUX UPLOAD <span className="font-mono text-[10px] bg-gray-100 px-1 rounded text-gray-400">{v.muxUploadId.slice(0,6)}...</span>
                        </span> 
                        : 
                        <span className="text-gray-400 font-medium">🔗 {v.dreamBrokerUrl || "Eksternt link"}</span>
                      }
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => onDeleteVariant(v.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {group.variants.length === 0 && (
                 <tr><td colSpan={3} className="py-8 text-center text-xs text-gray-400 font-medium italic">Ingen sprogversioner tilføjet endnu.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- UPLOAD SEKTION --- */}
        <div className="bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100 mt-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Upload ny version</h4>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Sprog:</label>
                    <select 
                        value={lang} 
                        onChange={e => setLang(e.target.value)}
                        className="flex-1 sm:flex-none border-none bg-white shadow-sm ring-1 ring-gray-100 rounded-xl py-2 pl-3 pr-10 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                    >
                        {['da', 'en', 'de', 'pl', 'uk', 'fa', 'ar', 'sv', 'no'].map(l => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 w-full">
                  {isUploading ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Gemmer i databasen...
                      </div>
                  ) : (
                      <VideoUploader onUploadSuccess={handleUploadSuccess} />
                  )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}