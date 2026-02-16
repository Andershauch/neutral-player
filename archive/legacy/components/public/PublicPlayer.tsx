"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";

export default function PublicPlayer({ embed }: any) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [currentPlaybackId, setCurrentPlaybackId] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // 1. Find aktiv gruppe
  const videoSlug = searchParams.get("video");
  const activeGroup = videoSlug 
    ? embed.groups.find((g: any) => g.slug === videoSlug) 
    : embed.groups[0];

  // 2. Find aktiv variant (sprog)
  const urlLang = searchParams.get("lang");
  const activeVariant = activeGroup?.variants.find((v: any) => v.lang === urlLang)
    || activeGroup?.variants[0];

  // --- NYT: Beregn den rigtige titel ---
  // Hvis varianten har en specifik titel, brug den. Ellers brug gruppenavnet.
  const displayTitle = activeVariant?.title || activeGroup?.name || "Video";

  // 3. Hent Playback ID
  useEffect(() => {
    async function fetchPlaybackId() {
      if (!activeVariant?.muxUploadId) {
        setCurrentPlaybackId(null);
        return;
      }
      setLoadingVideo(true);
      try {
        const res = await fetch(`/api/get-playback-id?uploadId=${activeVariant.muxUploadId}`);
        const data = await res.json();
        setCurrentPlaybackId(data.playbackId || null);
      } catch (e) {
        console.error("Fejl:", e);
      } finally {
        setLoadingVideo(false);
      }
    }
    fetchPlaybackId();
  }, [activeVariant?.muxUploadId]);

  const changeVideo = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("video", slug);
    params.delete("lang"); 
    router.replace(`${pathname}?${params.toString()}`);
  };

  const changeLanguage = (lang: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("lang", lang);
    if (activeGroup?.slug) params.set("video", activeGroup.slug);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (!activeGroup) return <div className="p-10 text-center text-white">Ingen videoer fundet.</div>;

// --- DEBUG START ---
  // Dette viser os præcis, hvad databasen sender til os.
  // Slet dette, når det virker!
  console.log("AKTIV VARIANT:", activeVariant); 
  // -------------------

  return (
    <div className="flex h-screen flex-col md:flex-row bg-black overflow-hidden">
      
      {/* MENU (Venstre side) */}
      <div className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-20 shadow-xl">
        <div className="p-4 bg-zinc-900 sticky top-0 border-b border-zinc-800 z-10">
             <h1 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Indhold</h1>
        </div>
        <div className="p-2 flex flex-col gap-1 overflow-y-auto">
            {embed.groups.map((group: any) => (
            <button
                key={group.id}
                onClick={() => changeVideo(group.slug)}
                className={`text-left px-3 py-3 rounded-md text-sm transition-all flex justify-between items-center group ${
                activeGroup.id === group.id 
                    ? "bg-zinc-800 text-white font-medium shadow-md border-l-2 border-blue-500" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-l-2 border-transparent"
                }`}
            >
                <span className="truncate pr-2">{group.name}</span>
                {group.variants.length > 1 && (
                    <span className="text-[10px] bg-black text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">
                        {group.variants.length}
                    </span>
                )}
            </button>
            ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative bg-black">
        <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-10">
            
            {/* VIDEO CONTAINER */}
            <div className="w-full max-w-6xl aspect-video bg-zinc-900 shadow-2xl rounded-xl overflow-hidden relative ring-1 ring-zinc-800 group">
                
                {/* SPROG OVERLAY */}
                {activeGroup.variants.length > 1 && (
                  <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-bold text-white uppercase bg-black/60 px-2 py-1 rounded backdrop-blur-sm">Sprog / Language</span>
                    <div className="flex flex-col gap-1 bg-black/80 p-1 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
                      {activeGroup.variants.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => changeLanguage(v.lang)}
                          className={`
                            px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all text-left flex items-center gap-2
                            ${activeVariant?.lang === v.lang 
                                ? "bg-blue-600 text-white shadow-sm" 
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }
                          `}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${activeVariant?.lang === v.lang ? "bg-white" : "bg-transparent"}`}></span>
                          {v.lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PLAYEREN */}
                {activeVariant ? (
                    <>
                        {loadingVideo && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 text-white backdrop-blur-sm">
                                <span className="animate-pulse font-mono text-sm text-blue-400">Loading...</span>
                            </div>
                        )}

                        {activeVariant.muxUploadId ? (
                             currentPlaybackId ? (
                                <MuxPlayer
                                    streamType="on-demand"
                                    playbackId={currentPlaybackId}
                                    // HER BRUGER VI DEN NYE TITEL TIL METADATA:
                                    metadata={{ video_title: displayTitle }}
                                    accentColor="#2563eb"
                                    className="w-full h-full"
                                    autoPlay={false}
                                />
                             ) : (
                                !loadingVideo && <div className="w-full h-full flex items-center justify-center text-zinc-500">Behandler video...</div>
                             )
                        ) : (
                            // URL LINK VIEW
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black">
                                <div className="p-4 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                                    <svg className="w-12 h-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-xs mb-4 font-mono uppercase tracking-widest">Eksternt Link ({activeVariant.lang})</p>
                                    <a href={activeVariant.dreamBrokerUrl} target="_blank" className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105">
                                        Åbn Video ↗
                                    </a>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-500">Ingen video valgt</div>
                )}
            </div>

            {/* TITEL UNDER VIDEOEN */}
            <div className="mt-6 text-center max-w-2xl mx-auto">
                {/* HER ER DEN VIGTIGE ÆNDRING: */}
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" dir="auto">
                    {displayTitle}
                </h2>
                
                {/* Vis original titel (gruppenavn) nedenunder, hvis vi viser en oversættelse */}
                {activeVariant?.title && activeVariant.title !== activeGroup.name && (
                    <p className="text-zinc-500 text-sm mt-2">{activeGroup.name}</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}