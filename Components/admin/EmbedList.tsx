"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Typer (baseret på vores API response)
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
  
  // Create Form State
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("da");
  const [creating, setCreating] = useState(false);
  
  const router = useRouter();

  // 1. Fetch Data
  useEffect(() => {
    fetch('/api/embeds')
      .then(res => res.json())
      .then(data => {
        setEmbeds(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // 2. Create Handler
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
        // Redirect direkte til detalje siden for at tilføje videoer
        router.push(`/admin/embeds/${newEmbed.id}`);
      }
    } catch (error) {
      alert("Fejl ved oprettelse");
    } finally {
      setCreating(false);
    }
  };

  // 3. Copy Snippet Helper
  const copySnippet = (id: string) => {
    const code = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="${window.location.origin}/embed/${id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe></div>`;
    navigator.clipboard.writeText(code);
    alert("Embed-kode kopieret til udklipsholder!");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loader embeds...</div>;

  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
      
      {/* Header med Action */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-100">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Dine Embeds</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + Opret Ny
        </button>
      </div>

      {/* Tabel */}
      <ul role="list" className="divide-y divide-gray-200">
        {embeds.length === 0 && (
          <li className="px-4 py-8 text-center text-gray-500 text-sm">Ingen embeds endnu. Opret den første!</li>
        )}
        
        {embeds.map((embed) => (
          <li key={embed.id} className="hover:bg-gray-50 transition-colors">
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              
              {/* Venstre side: Info */}
              <Link href={`/admin/embeds/${embed.id}`} className="flex-1 min-w-0 group">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate group-hover:underline">
                    {embed.name}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {embed._count.groups} Videoer
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Default: <span className="uppercase ml-1 font-mono">{embed.defaultLang}</span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Opdateret {new Date(embed.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Højre side: Actions */}
              <div className="ml-6 flex items-center gap-3">
                 <button 
                   onClick={() => copySnippet(embed.id)}
                   className="text-gray-400 hover:text-gray-600 p-2"
                   title="Kopier HTML Snippet"
                 >
                   {/* Simpelt 'Code' Ikon */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                 </button>
                 <Link 
                   href={`/admin/embeds/${embed.id}`}
                   className="text-gray-400 hover:text-blue-600 p-2"
                 >
                   {/* 'Edit' Ikon */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                 </Link>
              </div>

            </div>
          </li>
        ))}
      </ul>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opret nyt Embed</h3>
            
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Navn (Internt)</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Fx. Intranet Forside"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Sprog</label>
                  <select 
                    value={newLang}
                    onChange={e => setNewLang(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="da">Dansk (da)</option>
                    <option value="en">English (en)</option>
                    <option value="de">Deutsch (de)</option>
                    {/* Add more as needed */}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Opretter...' : 'Opret'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}