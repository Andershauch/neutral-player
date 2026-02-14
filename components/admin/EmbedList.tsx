"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type EmbedSummary = {
  id: string;
  name: string;
  defaultLang: string;
  updatedAt: string;
  _count: { groups: number };
};

export default function EmbedList() {
  const [embeds, setEmbeds] = useState<EmbedSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("da");
  const [creating, setCreating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetch('/api/embeds')
      .then(res => res.json())
      .then(data => {
        setEmbeds(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const res = await fetch('/api/embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, defaultLang: newLang })
      });
      
      if (res.ok) {
        const newEmbed = await res.json();
        router.push(`/admin/embeds/${newEmbed.id}`);
      }
    } catch (error) {
      alert("Fejl ved oprettelse");
    } finally {
      setCreating(false);
    }
  };

  const copySnippet = (id: string) => {
    const code = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; background: #000;"><iframe src="${window.location.origin}/embed/${id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe></div>`;
    navigator.clipboard.writeText(code);
    alert("Embed-kode kopieret!");
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Indlæser projekter...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dine Projekter</h1>
          <p className="text-sm text-gray-500 font-medium">Administrer og hent koder til dine video-players.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-blue-100 active:scale-[0.98]"
        >
          + Opret Ny
        </button>
      </div>

      {/* LISTE */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <ul role="list" className="divide-y divide-gray-50">
          {embeds.length === 0 && (
            <li className="px-6 py-20 text-center">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Ingen projekter fundet</p>
            </li>
          )}
          
          {embeds.map((embed) => (
            <li key={embed.id} className="hover:bg-gray-50/50 transition-colors group">
              <div className="px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* INFO SEKTION */}
                <Link href={`/admin/embeds/${embed.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                      {embed.name}
                    </p>
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {embed._count.groups} videoer
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      Default: <span className="text-gray-600">{embed.defaultLang}</span>
                    </p>
                    <span className="hidden sm:block text-gray-200">•</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      ID: <span className="font-mono">{embed.id.slice(0, 8)}...</span>
                    </p>
                  </div>
                </Link>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                   <button 
                    onClick={() => copySnippet(embed.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Kopier HTML"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                    <span className="hidden md:block">Kopier kode</span>
                  </button>
                  
                  <Link 
                    href={`/admin/embeds/${embed.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 hover:bg-blue-600 transition-all shadow-md active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Rediger
                  </Link>
                </div>

              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-10 animate-in slide-in-from-bottom-10 duration-300">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Nyt Projekt</h3>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Navn (Internt)</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Fx. Intranet Forside"
                  className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Default Sprog</label>
                <select 
                  value={newLang}
                  onChange={e => setNewLang(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="da">Dansk (DA)</option>
                  <option value="en">English (EN)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="order-2 sm:order-1 flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="order-1 sm:order-2 flex-[2] bg-blue-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-[0.95] transition-all"
                >
                  {creating ? 'Opretter...' : 'Opret Projekt →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}