"use client";

import React, { useState } from 'react';

interface EmbedCodeGeneratorProps {
  projectId: string;
  projectTitle: string;
}

export default function EmbedCodeGenerator({ projectId, projectTitle }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  // Vi genererer koden her
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedCode = `
<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:8px;background:#000;">
  <iframe 
    src="${baseUrl}/embed/${projectId}" 
    loading="lazy"
    style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen
    title="${projectTitle}">
  </iframe>
</div>`.trim();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset efter 2 sekunder
    } catch (err) {
      console.error('Kunne ikke kopiere koden: ', err);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Embed-kode (16:9 Responsiv)</h3>
      
      <div className="relative">
        <textarea
          readOnly
          value={embedCode}
          className="w-full h-32 p-3 text-xs font-mono bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        
        <button
          onClick={copyToClipboard}
          className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copied ? 'Kopieret!' : 'Kopier kode'}
        </button>
      </div>
      
      <p className="mt-2 text-[11px] text-gray-500">
        Tip: Denne kode tilpasser sig automatisk bredden på hjemmesiden og bevarer videoformatet.
      </p>
    </div>
  );
}