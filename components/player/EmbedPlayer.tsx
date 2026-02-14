"use client";

import { useState, useEffect } from "react";
import { Group, Variant, Embed } from "@prisma/client";
import MuxPlayer from "@mux/mux-player-react";

// 1. TYPEDEFINITIONER (Matcher dit schema 100%)
type GroupWithVariants = Group & { 
  variants: Variant[] 
};

type EmbedWithRelations = Embed & { 
  groups: GroupWithVariants[] 
};

interface EmbedPlayerProps {
  embed: EmbedWithRelations;
  initialGroupId?: string; // Vi bruger ID, da du ikke har et slug-felt
  initialLang?: string;
}

export default function EmbedPlayer({ embed, initialGroupId, initialLang }: EmbedPlayerProps) {
  const [mounted, setMounted] = useState(false);
  
  // State til valg af indhold
  const [selectedGroup, setSelectedGroup] = useState<GroupWithVariants>(embed.groups[0]);
  const [selectedLang, setSelectedLang] = useState<string>(initialLang || "");

  // RTL Detection (for Farsi/Arabic)
  const isRtl = ["ar", "fa"].includes(selectedLang);

  useEffect(() => {
    setMounted(true);

    // A. FIND START GRUPPE (URL ID > LocalStorage > Første i listen)
    let targetGroup = embed.groups[0];
    const urlGroup = embed.groups.find((g: GroupWithVariants) => g.id === initialGroupId);
    const storedGroupId = localStorage.getItem(`embed_${embed.id}_group_id`);
    const storedGroup = embed.groups.find((g: GroupWithVariants) => g.id === storedGroupId);

    if (urlGroup) targetGroup = urlGroup;
    else if (storedGroup) targetGroup = storedGroup;
    
    setSelectedGroup(targetGroup);

    // B. FIND START SPROG (URL > LocalStorage > Første variant > "da")
    let targetLang = "da"; 
    const storedLang = localStorage.getItem(`embed_${embed.id}_lang`);
    const firstAvailableLang = targetGroup.variants[0]?.lang || "da";

    if (initialLang && targetGroup.variants.some((v: Variant) => v.lang === initialLang)) {
      targetLang = initialLang;
    } else if (storedLang && targetGroup.variants.some((v: Variant) => v.lang === storedLang)) {
      targetLang = storedLang;
    } else {
      targetLang = firstAvailableLang;
    }
    
    setSelectedLang(targetLang);
  }, [embed, initialGroupId, initialLang]);

  // --- HANDLERS ---
  const handleGroupChange = (id: string) => {
    const group = embed.groups.find((g: GroupWithVariants) => g.id === id);
    if (!group) return;
    
    setSelectedGroup(group);
    localStorage.setItem(`embed_${embed.id}_group_id`, id);

    // Hvis den nye gruppe ikke har det nuværende sprog, så skift til gruppens første sprog
    const hasCurrentLang = group.variants.some((v: Variant) => v.lang === selectedLang);
    if (!hasCurrentLang && group.variants.length > 0) {
      setSelectedLang(group.variants[0].lang);
    }
  };

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    localStorage.setItem(`embed_${embed.id}_lang`, lang);
  };

  // FIND AKTIV VARIANT (Den video der faktisk skal vises)
  const activeVariant = selectedGroup.variants.find((v: Variant) => v.lang === selectedLang) 
    || selectedGroup.variants[0];

  // Forhindrer hydration mismatch
  if (!mounted) return <div className="aspect-video bg-gray-50 animate-pulse rounded-[2rem] border border-gray-100" />;

  return (
    <div className="w-full flex flex-col gap-4 font-sans antialiased" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* VIDEO CONTAINER: 16:9 Responsiv */}
      <div className="relative w-full aspect-video bg-black rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
        {activeVariant ? (
          <div className="w-full h-full">
            {activeVariant.muxPlaybackId ? (
              <MuxPlayer
                playbackId={activeVariant.muxPlaybackId}
                className="w-full h-full object-contain"
                streamType="on-demand"
                accentColor="#2563eb"
                primaryColor="#ffffff"
              />
            ) : (
              <iframe
                src={activeVariant.dreamBrokerUrl || ""}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                title={`${selectedGroup.name} - ${selectedLang}`}
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-black uppercase text-[10px] tracking-widest">
            Ingen video fundet
          </div>
        )}
      </div>

      {/* CONTROLS: Responsivt layout */}
      <div className="flex flex-col sm:flex-row gap-3 px-1">
        
        {/* TITEL VÆLGER (Kapitler/Grupper) */}
        <div className="flex-1 relative">
          <select
            value={selectedGroup.id}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full bg-white border border-gray-100 text-gray-900 text-sm font-black uppercase tracking-widest rounded-2xl p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-all shadow-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
          >
            {embed.groups.map((group: GroupWithVariants) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className={`absolute ${isRtl ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 pointer-events-none text-blue-600`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {/* SPROG VÆLGER */}
        <div className="w-full sm:w-auto relative">
          <select
            value={selectedLang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full sm:w-auto bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl p-4 md:p-5 pr-12 cursor-pointer hover:bg-blue-600 transition-all shadow-lg appearance-none outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30"
            disabled={selectedGroup.variants.length <= 1}
          >
            {selectedGroup.variants.map((variant: Variant) => (
              <option key={variant.id} value={variant.lang}>
                {variant.lang} VERSION
              </option>
            ))}
          </select>
          <div className={`absolute ${isRtl ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 pointer-events-none text-white opacity-50`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </div>
        </div>

      </div>
    </div>
  );
}