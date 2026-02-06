"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VideoUploader from "@/components/admin/MuxUploader";
import MuxPlayer from "@mux/mux-player-react";

// --- DRAG AND DROP IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function EmbedEditor({ embed }: any) {
  const router = useRouter();

  // --- HYDRATION FIX: Vent til vi er i browseren ---
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sorter grupperne pænt (selvom vi kun dragger varianter nu)
  const groups = embed.groups.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  // --- MODAL STATES ---
  const [loading, setLoading] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  // --- HOVED FUNKTIONER ---

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    setIsCreatingGroup(true);
    try {
      const slug = newGroupTitle.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const maxSort = groups.length > 0 ? Math.max(...groups.map((g: any) => g.sortOrder)) : 0;
      
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newGroupTitle, slug: slug, embedId: embed.id, sortOrder: maxSort + 1 }),
      });
      if (!res.ok) alert("Fejl ved oprettelse");
      else { setNewGroupTitle(""); router.refresh(); }
    } catch (error) { alert("Fejl"); } finally { setIsCreatingGroup(false); }
  };

  const generateEmbedCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/embed/${embed.id}`;
    const code = `<iframe src="${url}" width="100%" height="600" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>`;
    setEmbedCode(code); setShowEmbedCode(true);
  };

  const handlePreview = async (uploadId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/get-playback-id?uploadId=${uploadId}`);
      const data = await res.json();
      if (data.playbackId) setPreviewId(data.playbackId);
      else alert("Videoen behandles stadig.");
    } catch (e) { alert("Fejl"); } finally { setIsLoadingPreview(false); }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Slet denne titel?")) return;
    setLoading(true);
    await fetch(`/api/delete?type=group&id=${groupId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Slet sprogversion?")) return;
    await fetch(`/api/delete?type=variant&id=${variantId}`, { method: 'DELETE' });
    router.refresh();
  };

  // VIGTIGT: Hvis ikke mounted, vis ingenting for at undgå hydration fejl
  if (!isMounted) return null;

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
            <button onClick={generateEmbedCode} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 shadow-sm"><span>📋</span> Hent Embed Kode</button>
            <Link href={`/embed/${embed.id}`} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2">Åbn Public Player ↗</Link>
        </div>
      </div>

      {/* OPRET NY TITEL */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Opret Ny Titel</h2>
        <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titel Navn</label>
                <input type="text" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} placeholder="F.eks. 'Intro'..." className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={isCreatingGroup || !newGroupTitle} className="bg-black text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">{isCreatingGroup ? "Opretter..." : "+ Opret Titel"}</button>
        </form>
      </div>

      {/* LISTE AF GRUPPER */}
      <div className="space-y-6">
        {groups.map((group: any) => (
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
      </div>

      {groups.length === 0 && (
          <div className="p-10 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 mt-6">Ingen titler endnu.</div>
      )}

      {/* MODALS */}
      {previewId && <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewId(null)}><div className="bg-black rounded-lg overflow-hidden max-w-5xl w-full" onClick={e => e.stopPropagation()}><MuxPlayer streamType="on-demand" playbackId={previewId} autoPlay className="w-full aspect-video" /></div></div>}
      {showEmbedCode && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowEmbedCode(false)}><div className="bg-white rounded-lg p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}><textarea readOnly value={embedCode} className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded font-mono text-xs" /><button onClick={() => setShowEmbedCode(false)} className="text-gray-500 mt-2 text-sm">Luk</button></div></div>}
    </div>
  );
}

// --- SUB-COMPONENT: VIDEO GROUP CARD (Med Drag & Drop) ---
function VideoGroupCard({ group, onDeleteGroup, onDeleteVariant, onPreview, loading, isLoadingPreview }: any) {
    const router = useRouter();
    
    // Vi sorterer varianterne baseret på sortOrder
    const sortedVariants = (group.variants || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    const [variants, setVariants] = useState(sortedVariants);

    useEffect(() => {
        setVariants((group.variants || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    }, [group.variants]);

    const [lang, setLang] = useState("da");
    const [titleInput, setTitleInput] = useState("");
    const [mode, setMode] = useState<'upload' | 'url'>('upload'); 
    const [urlInput, setUrlInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // DnD Konfiguration
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setVariants((items: any) => {
                const oldIndex = items.findIndex((i: any) => i.id === active.id);
                const newIndex = items.findIndex((i: any) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updatedItems = newItems.map((item: any, index: number) => ({ ...item, sortOrder: index }));
                
                // Opdater i baggrunden
                fetch('/api/reorder-variants', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ items: updatedItems.map((i: any) => ({ id: i.id, sortOrder: i.sortOrder })) })
                });
                return updatedItems;
            });
        }
    };
  
    const saveVariant = async (payload: any) => {
      const maxSort = variants.length > 0 ? Math.max(...variants.map((v: any) => v.sortOrder)) : 0;
      try {
        const res = await fetch('/api/variants', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...payload, title: titleInput, sortOrder: maxSort + 1 }) 
        });
        if (!res.ok) alert("Fejl"); else { setTitleInput(""); setUrlInput(""); router.refresh(); }
      } catch (e) { alert("Fejl"); } finally { setIsSaving(false); }
    };

    const handleUploadSuccess = async (uploadId: string) => { 
        setIsSaving(true); 
        await saveVariant({ groupId: group.id, lang, muxUploadId: uploadId }); 
    };

    const handleSaveUrl = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!urlInput) return; 
        setIsSaving(true); 
        await saveVariant({ groupId: group.id, lang, dreamBrokerUrl: urlInput }); 
    };
  
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* GROUP HEADER */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">{group.name}</h3>
          </div>
          <button onClick={() => onDeleteGroup(group.id)} disabled={loading} className="text-gray-400 hover:text-red-600 text-xs font-medium uppercase">Slet Titel</button>
        </div>
  
        <div className="p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="min-w-full mb-4">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="w-8"></th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase w-16 py-2">Sprog</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase py-2">Titel & Indhold</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <SortableContext items={variants} strategy={verticalListSortingStrategy}>
                    {variants.map((v: any) => (
                        <SortableVariantRow 
                            key={v.id} 
                            variant={v} 
                            onDelete={() => onDeleteVariant(v.id)} 
                            onPreview={onPreview} 
                            isLoadingPreview={isLoadingPreview}
                        />
                    ))}
                </SortableContext>
                
                {variants.length === 0 && (
                   <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-400 italic">Ingen videoer tilføjet.</td></tr>
                )}
              </tbody>
            </table>
          </DndContext>

          {/* ADD VARIANT FORM */}
          <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 mt-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Tilføj variant til "{group.name}"</h4>
              <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-4 items-center">
                     <select value={lang} onChange={e => setLang(e.target.value)} className="block w-32 border-gray-300 rounded-md shadow-sm py-1.5 pl-3 text-sm">{['da', 'en', 'de', 'pl', 'uk', 'fa', 'ar', 'sv', 'no', 'fi', 'fr', 'es'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
                     <div className="flex bg-gray-200 rounded p-1 text-xs font-medium">
                        <button onClick={() => setMode('upload')} className={`px-3 py-1 rounded transition-all ${mode === 'upload' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>Upload Fil</button>
                        <button onClick={() => setMode('url')} className={`px-3 py-1 rounded transition-all ${mode === 'url' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>Indsæt URL</button>
                      </div>
                  </div>
                  <input type="text" placeholder={`Titel på ${lang.toUpperCase()} (valgfri)`} value={titleInput} onChange={(e) => setTitleInput(e.target.value)} dir="auto" className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2" />
                  {isSaving ? <div className="text-blue-600 text-sm animate-pulse flex gap-2 items-center bg-blue-50 p-3 rounded border border-blue-100">Gemmer...</div> : (mode === 'upload' ? <div className="bg-white p-2 rounded border border-gray-200"><VideoUploader onUploadSuccess={handleUploadSuccess} /></div> : <form onSubmit={handleSaveUrl} className="flex gap-2"><input type="url" placeholder="https://..." required value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="flex-1 border-gray-300 rounded-md text-sm p-2 shadow-sm outline-none" /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Gem Link</button></form>)}
              </div>
          </div>
        </div>
      </div>
    );
}

// --- SUB-COMPONENT: SORTABLE ROW ---
function SortableVariantRow({ variant, onDelete, onPreview, isLoadingPreview }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: variant.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as 'relative',
    };

    return (
        <tr ref={setNodeRef} style={style} className="group/row">
            {/* DRAG HANDLE */}
            <td className="py-3 pl-2 align-middle w-8">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600 p-1 rounded hover:bg-gray-100 w-fit" title="Træk for at sortere">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
            </td>

            <td className="py-3 text-sm font-bold text-gray-700 uppercase align-middle">{variant.lang}</td>
            <td className="py-3 text-sm text-gray-600 align-middle">
                {variant.title && <div className="text-xs font-bold text-gray-800 mb-1" dir="auto">{variant.title}</div>}
                {variant.muxUploadId ? (
                    <button onClick={() => onPreview(variant.muxUploadId)} disabled={isLoadingPreview} className="text-green-700 bg-green-50 px-3 py-1.5 rounded-md text-xs border border-green-100 flex items-center gap-2 hover:bg-green-100">
                    {isLoadingPreview ? '⏳' : '▶️'} Afspil Video
                    </button>
                ) : (
                    <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">URL Link</span><a href={variant.dreamBrokerUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-sm block font-medium">{variant.dreamBrokerUrl || "Ingen URL"}</a></div>
                )}
            </td>
            <td className="py-3 text-right align-middle"><button onClick={onDelete} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded">✕</button></td>
        </tr>
    );
}