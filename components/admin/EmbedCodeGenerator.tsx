"use client";

import React, { useState } from 'react';

interface EmbedCodeGeneratorProps {
  projectId: string;
  projectTitle: string;
}

export default function EmbedCodeGenerator({ projectId, projectTitle }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  // Vi genererer koden her - baseUrl sikrer at den virker på tværs af miljøer (localhost/vercel)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedCode = `
<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:12px;background:#000;">
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kunne ikke kopiere koden: ', err);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 shadow-inner">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-1">
        Embed-kode (16:9 Responsiv)
      </h3>
      
      <div className="relative group">
        <textarea
          readOnly
          value={embedCode}
          className="w-full h-40 md:h-32 p-4 text-[11px] md:text-xs font-mono bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm text-gray-600 leading-relaxed resize-none"
        />
        
        {/* Knappen er gjort større og mere tydelig til touch */}
        <button
          onClick={copyToClipboard}
          className={`absolute bottom-4 right-4 md:top-4 md:bottom-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
            copied 
              ? 'bg-green-500 text-white shadow-green-100' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Kopieret!
            </span>
          ) : (
            'Kopier kode'
          )}
        </button>
      </div>
      
      <div className="mt-4 flex items-center gap-2 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          Tip: Denne kode tilpasser sig automatisk bredden på din hjemmeside.
        </p>
      </div>
    </div>
  );
}