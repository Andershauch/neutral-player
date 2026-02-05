"use client";

import { useState, useEffect } from "react";
import { VideoGroup, VideoVariant, Embed } from "@prisma/client";

// Types der inkluderer relationer
type GroupWithVariants = VideoGroup & { variants: VideoVariant[] };
type EmbedData = Embed & { groups: GroupWithVariants[] };

interface EmbedPlayerProps {
  embed: EmbedData;
  initialGroupSlug?: string;
  initialLang?: string;
}

export default function EmbedPlayer({ embed, initialGroupSlug, initialLang }: EmbedPlayerProps) {
  // 1. State Setup
  const [mounted, setMounted] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithVariants>(embed.groups[0]);
  const [selectedLang, setSelectedLang] = useState<string>(initialLang || embed.defaultLang);

  // 2. RTL Detection (for Farsi/Arabic)
  const isRtl = ["ar", "fa"].includes(selectedLang);

  // 3. Initialization Logic (Kører kun i browseren)
  useEffect(() => {
    setMounted(true);

    // A. Find Video Group (URL > LocalStorage > Default)
    let targetGroup = embed.groups[0];
    
    // Tjek URL param (allerede passed som prop, men vi validerer den findes)
    const urlGroup = embed.groups.find(g => g.slug === initialGroupSlug);
    
    // Tjek LocalStorage
    const storedGroupSlug = localStorage.getItem(`embed_${embed.id}_video`);
    const storedGroup = embed.groups.find(g => g.slug === storedGroupSlug);

    if (urlGroup) targetGroup = urlGroup;
    else if (storedGroup) targetGroup = storedGroup;
    
    setSelectedGroup(targetGroup);

    // B. Find Sprog (URL > LocalStorage > Default)
    let targetLang = embed.defaultLang;
    
    // Tjek URL param
    if (initialLang && targetGroup.variants.some(v => v.lang === initialLang)) {
      targetLang = initialLang;
    } else {
      // Tjek LocalStorage
      const storedLang = localStorage.getItem(`embed_${embed.id}_lang`);
      if (storedLang && targetGroup.variants.some(v => v.lang === storedLang)) {
        targetLang = storedLang;
      }
    }
    
    setSelectedLang(targetLang);
  }, [embed.id, embed.groups, embed.defaultLang, initialGroupSlug, initialLang]);

  // 4. Handlers
  const handleGroupChange = (slug: string) => {
    const group = embed.groups.find((g) => g.slug === slug);
    if (!group) return;

    setSelectedGroup(group);
    localStorage.setItem(`embed_${embed.id}_video`, slug);

    // Soft Fallback: Hvis det valgte sprog ikke findes i den nye video, reset til default
    const hasCurrentLang = group.variants.some((v) => v.lang === selectedLang);
    if (!hasCurrentLang) {
      // Prøv at finde embed default, ellers tag første tilgængelige
      const fallback = group.variants.some(v => v.lang === embed.defaultLang) 
        ? embed.defaultLang 
        : group.variants[0]?.lang;
      
      setSelectedLang(fallback);
      // Vi opdaterer IKKE localstorage sprog her, da det er en tvungen ændring
    }
  };

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    localStorage.setItem(`embed_${embed.id}_lang`, lang);
  };

  // 5. Find den aktive variant URL
  const activeVariant = selectedGroup.variants.find((v) => v.lang === selectedLang) 
    || selectedGroup.variants.find((v) => v.lang === embed.defaultLang) // Fallback 1
    || selectedGroup.variants[0]; // Fallback 2 (Panic)

  // Prevent hydration mismatch ved at vente på mount, eller render en loading state/skeleton
  if (!mounted) return <div className="aspect-video bg-gray-100 animate-pulse" />;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 font-sans" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* VIDEO CONTAINER (16:9 Aspect Ratio) */}
      <div className="relative w-full pt-[56.25%] bg-black rounded overflow-hidden shadow-sm">
        {activeVariant ? (
          <iframe
            src={activeVariant.dreamBrokerUrl}
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen
            title={`${selectedGroup.title} - ${selectedLang}`}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
            Video unavailable
          </div>
        )}
      </div>

      {/* CONTROLS (Neutral UI) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center px-1">
        
        {/* Titel Vælger */}
        <div className="flex-1 min-w-0">
          <label htmlFor="video-select" className="sr-only">Vælg video</label>
          <select
            id="video-select"
            value={selectedGroup.slug}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2.5 truncate cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {embed.groups.map((group) => (
              <option key={group.id} value={group.slug}>
                {group.title}
              </option>
            ))}
          </select>
        </div>

        {/* Sprog Vælger */}
        <div className="w-full sm:w-auto">
          <label htmlFor="lang-select" className="sr-only">Vælg sprog</label>
          <select
            id="lang-select"
            value={selectedLang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
            disabled={selectedGroup.variants.length <= 1}
          >
            {/* Vi lister unikke sprog der er tilgængelige for denne titel */}
            {selectedGroup.variants.map((variant) => (
              <option key={variant.id} value={variant.lang}>
                {variant.lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}