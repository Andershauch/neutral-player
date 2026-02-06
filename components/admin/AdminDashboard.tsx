"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard({ embeds }: any) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createNewProject = async () => {
    const name = prompt("Hvad skal projektet hedde?");
    if (!name) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        const newEmbed = await res.json();
        router.push(`/admin/embed/${newEmbed.id}`); // Send brugeren direkte til editoren
      }
    } catch (e) {
      alert("Noget gik galt");
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Mine Projekter</h1>
            <p className="text-gray-500">Administrer dine video-afspillere her.</p>
        </div>
        <button 
          onClick={createNewProject}
          disabled={isCreating}
          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2"
        >
          {isCreating ? "Opretter..." : "+ Opret Nyt Projekt"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {embeds.map((embed: any) => (
          <Link 
            href={`/admin/embed/${embed.id}`} 
            key={embed.id}
            className="group block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-blue-600">Rediger →</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">{embed.name}</h3>
            <div className="text-xs text-gray-400 font-mono mb-4">{embed.id}</div>
            <div className="flex gap-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">
                    {embed.groups?.length || 0} titler
                </span>
                <span className="bg-gray-100 px-2 py-1 rounded">
                   Oprettet: {new Date(embed.createdAt).toLocaleDateString()}
                </span>
            </div>
          </Link>
        ))}

        {/* Tom tilstand hvis ingen projekter findes */}
        {embeds.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Du har ingen projekter endnu.</p>
                <button onClick={createNewProject} className="text-blue-600 font-bold hover:underline">Start dit første projekt her</button>
            </div>
        )}
      </div>
    </div>
  );
}